import os
import sys
import joblib
import json
import logging
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_valorization")

# Import continuous monitor
try:
    from continuous_monitor import ContinuousWorkflowMonitor, start_monitor_in_background
    MONITOR_AVAILABLE = True
except Exception as e:
    logger.warning(f"Continuous monitor not available: {e}")
    MONITOR_AVAILABLE = False


app = FastAPI(
    title="Valorization LCA API",
    description="API for predicting valorization phase parameters in LCA calculations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODEL_PATH = os.path.join(ROOT, 'models', 'valorization_model.joblib')
PREPROCESSOR_PATH = os.path.join(ROOT, 'preprocessing', 'valorization_preprocessor.joblib')
FEATURE_NAMES_PATH = os.path.join(ROOT, 'preprocessing', 'valorization_feature_names.joblib')
TARGET_NAMES_PATH = os.path.join(ROOT, 'preprocessing', 'valorization_target_names.joblib')
METADATA_PATH = os.path.join(ROOT, 'models', 'valorization_model_metadata.json')

# Globals
_model = None
_preprocessor = None
_feature_names = None
_target_names = None
_model_metadata = None
_load_errors = []
_preprocessing_metadata = None

# Global monitor instance
_workflow_monitor = None

# Optional .env loader (non-fatal if missing)
try:
    from dotenv import load_dotenv  # type: ignore
except Exception:  # pragma: no cover
    load_dotenv = None  # type: ignore

# Optional MongoDB client(s)
try:
    from motor.motor_asyncio import AsyncIOMotorClient  # type: ignore
    _MONGO_DRIVER = 'motor'
except Exception:  # pragma: no cover
    AsyncIOMotorClient = None  # type: ignore
    _MONGO_DRIVER = None
try:
    from pymongo import MongoClient  # type: ignore
    from bson import ObjectId  # type: ignore
except Exception:  # pragma: no cover
    MongoClient = None  # type: ignore
    ObjectId = None  # type: ignore

# Best-effort: load environment from aluminium/scripts/.env and repo .env if available
if load_dotenv is not None:
    scripts_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '.env'))
    root_env_path = os.path.abspath(os.path.join(ROOT, '..', '.env'))
    try:
        if os.path.exists(scripts_env_path):
            load_dotenv(scripts_env_path)
        if os.path.exists(root_env_path):
            load_dotenv(root_env_path)
    except Exception:
        pass

class PredictRequest(BaseModel):
    data: Dict[str, Any]
    return_confidence: bool = Field(default=False, description="Whether to return confidence intervals")

class FeatureInfo(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    expected_range: Optional[List[Any]] = None

class ModelInfo(BaseModel):
    model_type: str
    training_date: str
    feature_count: int
    target_names: List[str]
    dataset_size: int
    test_size: float
    random_state: int

def _load_artifacts():
    global _model, _preprocessor, _feature_names, _target_names, _model_metadata, _preprocessing_metadata
    _load_errors.clear()

    # Feature and target names are required
    try:
        _feature_names = joblib.load(FEATURE_NAMES_PATH)
        _target_names = joblib.load(TARGET_NAMES_PATH)
        logger.info(f"Loaded {len(_feature_names)} feature names and {len(_target_names)} target names")
    except Exception as e:
        msg = f"Failed to load feature/target names: {e}"
        logger.error(msg)
        _load_errors.append(msg)
        raise

    # Model loading (non-fatal)
    try:
        loaded = joblib.load(MODEL_PATH)
        # Handle both bundle dict and direct model formats
        if isinstance(loaded, dict):
            _model = loaded.get('model')
            logger.info("Model loaded successfully (from bundle)")
        else:
            _model = loaded
            logger.info("Model loaded successfully")
    except Exception as e:
        msg = f"Failed to load model at {MODEL_PATH}: {e}"
        logger.warning(msg)
        _load_errors.append(msg)
        _model = None

    # Preprocessor is optional
    try:
        _preprocessor = joblib.load(PREPROCESSOR_PATH)
        logger.info("Preprocessor loaded successfully")
    except Exception as e:
        msg = f"Failed to load preprocessor at {PREPROCESSOR_PATH}: {e}"
        logger.warning(msg)
        _load_errors.append(msg)
        _preprocessor = None

    # Preprocessing metadata (optional)
    try:
        pm_path = os.path.join(ROOT, 'preprocessing', 'valorization_metadata.joblib')
        if os.path.exists(pm_path):
            _preprocessing_metadata = joblib.load(pm_path)
            logger.info("Loaded preprocessing metadata for valorization")
        else:
            _preprocessing_metadata = {}
    except Exception as e:
        logger.warning(f"Failed to load preprocessing metadata: {e}")
        _preprocessing_metadata = {}

    # Metadata is optional; load if present
    try:
        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, 'r') as f:
                _model_metadata = json.load(f)
            logger.info("Model metadata loaded successfully")
        else:
            _model_metadata = {}
    except Exception as e:
        msg = f"Failed to load model metadata: {e}"
        logger.warning(msg)
        _load_errors.append(msg)
        _model_metadata = {}

# ------------------------------
# Optional MongoDB configuration
# ------------------------------
def _get_mongo_uri() -> Optional[str]:
    """Fetch Mongo URI dynamically so late-loaded env works too."""
    uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    if uri:
        uri = uri.strip()
    return uri

MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
_mongo_client = None
_mongo_db = None

async def get_mongo_db():
    """Lazily initialize and return a MongoDB database handle if possible."""
    global _mongo_client, _mongo_db
    MONGO_URI = _get_mongo_uri()
    if not MONGO_URI:
        return None

    # Prefer motor (async)
    if AsyncIOMotorClient is not None:
        if _mongo_client is None:
            try:
                _mongo_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
                await _mongo_client.server_info()
                default_db = None
                try:
                    default_db = _mongo_client.get_default_database()
                except Exception:
                    default_db = None
                if default_db is not None:
                    _mongo_db = default_db
                else:
                    db_name = MONGO_DB_NAME or "LCA"
                    _mongo_db = _mongo_client[db_name]
            except Exception as e:
                logger.warning(f"Mongo (motor) connection failed: {e}")
                _mongo_db = None
        return _mongo_db

    # Fallback to pymongo (sync)
    if MongoClient is not None:
        if _mongo_client is None:
            try:
                _mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
                _mongo_client.server_info()
                default_db = None
                try:
                    default_db = _mongo_client.get_default_database()
                except Exception:
                    default_db = None
                if default_db is not None:
                    _mongo_db = default_db
                else:
                    db_name = MONGO_DB_NAME or "LCA"
                    _mongo_db = _mongo_client[db_name]
            except Exception as e:
                logger.warning(f"Mongo (pymongo) connection failed: {e}")
                _mongo_db = None
        return _mongo_db

    return None

@app.get("/")
async def root():
    return {
        "message": "Valorization LCA Prediction API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": _model is not None,
        "preprocessor_loaded": _preprocessor is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model-info")
async def model_info():
    if _model_metadata:
        return ModelInfo(**_model_metadata)
    return {
        "model_path": MODEL_PATH,
        "feature_count": len(_feature_names) if _feature_names else None,
        "target_names": _target_names,
        "preprocessor_loaded": _preprocessor is not None
    }

@app.get("/features")
async def get_features():
    """Return information about all expected input features"""
    if not _feature_names:
        raise HTTPException(status_code=500, detail="Feature names not loaded")
    
    features = []
    for feature in _feature_names:
        features.append(FeatureInfo(
            name=feature,
            type="numeric",
            description=f"Feature: {feature}"
        ))
    
    return {"features": features}

@app.post("/predict")
async def predict(request: PredictRequest):
    if _feature_names is None or _target_names is None:
        raise HTTPException(status_code=500, detail="Feature/target names not loaded")

    data = request.data

    # If incoming already has model-ready keys, align directly; otherwise map wizard -> model
    try:
        has_direct_features = any(
            (isinstance(k, str) and (
                k in (_feature_names or []) or
                k.startswith('valorization_method_') or
                k.startswith('waste_utilization_') or
                k.startswith('toxicity_') or
                k.startswith('groundwater_risk_')
            ))
            for k in data.keys()
        )
    except Exception:
        has_direct_features = False

    if has_direct_features:
        filled = {feat: data.get(feat, 0) for feat in (_feature_names or [])}
    else:
        filled = _build_feature_row_from_dict(data)

    try:
        df = pd.DataFrame([filled], columns=_feature_names)
        logger.info(f"DF columns order (valo): {list(df.columns)}")
        logger.info(f"DF row values (valo): {df.values[0].tolist()}")
        
        # Convert data types to ensure compatibility
        for col in df.columns:
            try:
                if df[col].dtype == object:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
            except Exception:
                pass
    except Exception as e:
        raise HTTPException(status_code=400, detail={
            "error": "dataframe_creation_failed",
            "message": str(e)
        })

    try:
        if _model is not None:
            logger.info(f"Predicting (valo) with df.values shape={df.values.shape}, dtype={df.values.dtype}")
            preds = _model.predict(df.values)
            try:
                # Log a couple of targets if available
                tnames = _target_names or []
                if len(tnames) > 0:
                    logger.info(f"Model output (valo) first target {tnames[0]}: {preds[0][0]:.3f}")
                if len(tnames) > 1:
                    logger.info(f"Model output (valo) second target {tnames[1]}: {preds[0][1]:.3f}")
            except Exception:
                pass
        else:
            preds = np.zeros((1, len(_target_names)))
    except Exception as e:
        logger.warning(f"Model prediction failed: {e}. Returning placeholder zeros.")
        preds = np.zeros((1, len(_target_names)))

    if preds.ndim == 1:
        preds = preds.reshape(1, -1)

    result = {name: float(preds[0, i]) for i, name in enumerate(_target_names)}
    
    confidence = {}
    if request.return_confidence:
        for i, name in enumerate(_target_names):
            if _model_metadata and 'metrics' in _model_metadata and name in _model_metadata['metrics']:
                rmse = _model_metadata['metrics'][name].get('RMSE', None)
                if rmse:
                    conf = 1.0 / (1.0 + rmse)
                else:
                    conf = None
            else:
                conf = None
            lower = float(preds[0, i] * 0.9)
            upper = float(preds[0, i] * 1.1)
            confidence[name] = {"lower": lower, "upper": upper, "confidence": conf}
    
    response = {
        "predictions": result,
        "status": "success"
    }
    
    if confidence:
        response["confidence_intervals"] = confidence
        
    return response

def _unwrap_mongo_value(val):
    """Unwrap MongoDB BSON types to Python primitives.
    Handles $numberInt, $numberDouble, $numberLong, $oid, $date formats.
    Returns None for null values.
    """
    if val is None:
        return None
    if isinstance(val, dict):
        if "$numberInt" in val:
            try:
                return int(val["$numberInt"])
            except (ValueError, TypeError):
                return None
        if "$numberDouble" in val:
            try:
                return float(val["$numberDouble"])
            except (ValueError, TypeError):
                return None
        if "$numberLong" in val:
            try:
                return int(val["$numberLong"])
            except (ValueError, TypeError):
                return None
        if "$oid" in val:
            return str(val["$oid"])
        if "$date" in val:
            if isinstance(val["$date"], dict) and "$numberLong" in val["$date"]:
                return int(val["$date"]["$numberLong"])
            return val["$date"]
    return val

# Startup event to initialize continuous monitoring
@app.on_event("startup")
async def startup_continuous_monitor():
    """Start continuous workflow monitoring on API startup."""
    global _workflow_monitor
    
    # Load model artifacts first
    _load_artifacts()
    
    # Check if continuous monitoring is enabled
    enable_monitor = os.getenv("ENABLE_CONTINUOUS_MONITOR", "true").lower() == "true"
    if not enable_monitor:
        logger.info("Continuous monitoring disabled via environment variable")
        return
    
    if not MONITOR_AVAILABLE:
        logger.warning("Continuous monitoring not available (module import failed)")
        return
    
    # Check if models are loaded (use API's own _model)
    models_loaded = _model is not None
    
    if not models_loaded:
        logger.warning("Models not loaded, skipping continuous monitoring")
        return
    
    try:
        # Get configuration from environment
        poll_interval = int(os.getenv("MONITOR_POLL_INTERVAL", "10"))  # seconds
        freshness_window = int(os.getenv("MONITOR_FRESHNESS_WINDOW", "600"))  # 10 minutes
        
        # Create monitor instance
        _workflow_monitor = ContinuousWorkflowMonitor(
            get_db_func=get_mongo_db,
            predict_func=predict_valorization_and_save,
            stage_name="valorization",
            poll_interval=poll_interval,
            freshness_window=freshness_window,
            object_id_class=ObjectId if 'ObjectId' in globals() else None,
            is_async_db=('_MONGO_DRIVER' in globals() and globals().get('_MONGO_DRIVER') == 'motor')
        )
        
        # Start monitoring in background
        await start_monitor_in_background(_workflow_monitor)
        logger.info("✅ Continuous workflow monitoring started for valorization stage")
        
    except Exception as e:
        logger.error(f"Failed to start continuous monitoring: {e}")


@app.on_event("shutdown")
async def shutdown_continuous_monitor():
    """Stop continuous monitoring on API shutdown."""
    global _workflow_monitor
    if _workflow_monitor:
        _workflow_monitor.stop()
        logger.info("Continuous monitoring stopped for valorization stage")


def _build_feature_row_from_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Build a feature row matching _feature_names from input dict.
    Maps wizard valorization fields to model feature names.
    """
    row: Dict[str, Any] = {}

    # Known feature names from metadata for guidance
    method_keys = {
        'cement_additive': 'valorization_method_Cement_Additive',
        'soil_stabilization': 'valorization_method_Soil_Stabilization',
        'iron_extraction': 'valorization_method_Iron_Extraction',
        'rare_earth_extraction': 'valorization_method_Rare_Earth_Extraction',
        'spl_encapsulation': 'valorization_method_SPL_Encapsulation',
        'dross_recovery': 'valorization_method_Dross_Recovery',
        'fluoride_capture': 'valorization_method_Fluoride_Capture',
    }

    waste_pct_keys = {
        'red_mud': 'waste_utilization_Red_Mud_%',
        'spl': 'waste_utilization_SPL_%',
        'dross': 'waste_utilization_Dross_%',
        'fluoride_gases': 'waste_utilization_Fluoride_Gases_%',
        'slag': 'waste_utilization_Slag_%',
    }

    toxicity_keys = {
        'red_mud': 'toxicity_Red_Mud',
        'spl': 'toxicity_SPL',
        'dross': 'toxicity_Dross',
        'fluoride_gases': 'toxicity_Fluoride_Gases',
        'slag': 'toxicity_Slag',
    }

    groundwater_risk_keys = {
        'red_mud': 'groundwater_risk_Red_Mud',
        'spl': 'groundwater_risk_SPL',
        'dross': 'groundwater_risk_Dross',
        'fluoride_gases': 'groundwater_risk_Fluoride_Gases',
        'slag': 'groundwater_risk_Slag',
    }

    # Map wizard arrays/fields to model features
    # Methods: wizard may send e.g. valorizationMethods: ['cement_additive', 'iron_extraction']
    methods_raw = data.get('valorizationMethods') or data.get('methods') or []
    if isinstance(methods_raw, str):
        methods_raw = [methods_raw]
    methods_set = set(str(m).lower().replace(' ', '_').replace('-', '_') for m in methods_raw if m)

    # Waste utilization percentages: handle both nested object and individual fields
    waste_utilization = data.get('wasteUtilization') or {}
    # Also check for individual fields (redMudUtilized, splUtilized, etc.)
    if not waste_utilization:
        waste_utilization = {
            'red_mud': data.get('redMudUtilized') or data.get('redMudRecovery'),
            'spl': data.get('splUtilized') or data.get('splRecovery'),
            'dross': data.get('drossUtilized') or data.get('drossRecovery'),
            'fluoride_gases': data.get('fluorideUtilized') or data.get('fluorideRecovery'),
            'slag': data.get('slagUtilized') or data.get('slagRecovery')
        }
    
    # If we have an overall percentage but no breakdown, apply to all waste types proportionally
    overall_util = data.get('wasteUtilizationOverallPercent')
    if overall_util and not any(waste_utilization.values()):
        # Distribute overall percentage to active waste types
        waste_types = data.get('wasteTypes') or []
        if isinstance(waste_types, str):
            waste_types = [waste_types]
        waste_types = [str(w).lower().replace(' ', '_').replace('-', '_') for w in waste_types if w]
        
        if waste_types:
            per_type = overall_util / len(waste_types) if len(waste_types) > 0 else overall_util
            for wt in waste_types:
                waste_utilization[wt] = per_type

    # Toxicity and groundwater risk: handle both nested object and individual camelCase fields
    toxicity = data.get('toxicity') or {}
    if not toxicity:
        toxicity = {
            'red_mud': data.get('toxicityRedMud'),
            'spl': data.get('toxicitySPL'),
            'dross': data.get('toxicityDross'),
            'fluoride_gases': data.get('toxicityFluoride'),
            'slag': data.get('toxicitySlag')
        }
    
    groundwater_risk = data.get('groundwaterRisk') or {}
    if not groundwater_risk:
        groundwater_risk = {
            'red_mud': data.get('groundwaterRedMud'),
            'spl': data.get('groundwaterSPL'),
            'dross': data.get('groundwaterDross'),
            'fluoride_gases': data.get('groundwaterFluoride'),
            'slag': data.get('groundwaterSlag')
        }
    
    # Log extracted values for debugging
    logger.info(f"Valorization inputs: methods={list(methods_set)}, waste_util={waste_utilization}, overall={overall_util}")

    # Normalize ordinal values to numeric: Low=1, Moderate=2, High=3
    def ord_map(val):
        if val is None:
            return 2
        sval = str(val).strip().lower()
        if sval in ['low', 'l']:
            return 1
        if sval in ['moderate', 'medium', 'm']:
            return 2
        if sval in ['high', 'severe', 'h']:
            return 3
        # fallback
        try:
            return int(val)
        except Exception:
            return 2

    # Prepare numeric medians if available
    numeric_medians: Dict[str, Any] = {}
    try:
        if isinstance(_preprocessing_metadata, dict):
            stats = _preprocessing_metadata.get('numeric_stats', {})
            if isinstance(stats, dict):
                for k, v in stats.items():
                    if isinstance(v, dict) and 'median' in v:
                        numeric_medians[k] = v['median']
            nm = _preprocessing_metadata.get('numeric_medians', {})
            if isinstance(nm, dict):
                numeric_medians.update(nm)
    except Exception:
        pass

    # Fill the row according to expected feature names
    for feat in (_feature_names or []):
        # Methods one-hot
        if feat in method_keys.values():
            # reverse lookup
            canon = [k for k, v in method_keys.items() if v == feat][0]
            row[feat] = 1 if canon in methods_set else 0
            continue
        # Waste utilization percentages
        if feat in waste_pct_keys.values():
            key = [k for k, v in waste_pct_keys.items() if v == feat][0]
            val = waste_utilization.get(key)
            unwrapped = _unwrap_mongo_value(val)
            row[feat] = unwrapped if unwrapped is not None else numeric_medians.get(feat, 0)
            continue
        # Toxicity ratings
        if feat in toxicity_keys.values():
            key = [k for k, v in toxicity_keys.items() if v == feat][0]
            val = toxicity.get(key)
            row[feat] = ord_map(val)
            continue
        # Groundwater risk ratings
        if feat in groundwater_risk_keys.values():
            key = [k for k, v in groundwater_risk_keys.items() if v == feat][0]
            val = groundwater_risk.get(key)
            row[feat] = ord_map(val)
            continue

        # Fallback: direct copy if present
        if feat in data and data[feat] is not None:
            unwrapped = _unwrap_mongo_value(data[feat])
            row[feat] = unwrapped if unwrapped is not None else numeric_medians.get(feat, 0)
        else:
            row[feat] = numeric_medians.get(feat, 0)
    return row

def _build_feature_row_from_valorization(valorization: Dict[str, Any]) -> Dict[str, Any]:
    """Map valorization wizard object to a feature row matching _feature_names."""
    return _build_feature_row_from_dict(valorization or {})


def _has_valorization_input(valorization: Dict[str, Any] | None) -> bool:
    """Return True only if there is meaningful valorization input data."""
    if not isinstance(valorization, dict) or not valorization:
        return False

    # Methods or waste utilization / toxicity fields present
    if isinstance(valorization.get('valorizationMethods'), list) and valorization.get('valorizationMethods'):
        return True
    if isinstance(valorization.get('methods'), list) and valorization.get('methods'):
        return True

    for key in [
        'wasteUtilization',
        'wasteUtilizationOverallPercent',
        'toxicityRedMud',
        'toxicity_Red_Mud',
    ]:
        if valorization.get(key) is not None:
            return True

    return False

@app.get("/wizard")
async def list_wizard_ids(limit: int = 10):
    """Helper endpoint to list recent wizard workflow ids for testing."""
    db = await get_mongo_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        items = []
        if _MONGO_DRIVER == 'motor':
            cursor = db["wizardworkflows"].find({}, {"_id": 1, "name": 1}).sort([("_id", -1)]).limit(limit)
            async for doc in cursor:
                items.append({"_id": str(doc.get("_id")), "name": doc.get("name")})
        else:
            cursor = db["wizardworkflows"].find({}, {"_id": 1, "name": 1}).sort([("_id", -1)]).limit(limit)
            for doc in cursor:
                items.append({"_id": str(doc.get("_id")), "name": doc.get("name")})
        return {"count": len(items), "items": items}
    except Exception as e:
        logger.error(f"Error listing workflows: {e}")
        raise HTTPException(status_code=500, detail="Error listing workflows")

@app.get("/wizard/{workflow_id}/valorization")
async def get_wizard_valorization(workflow_id: str):
    """Retrieve the valorization object from a wizard workflow."""
    db = await get_mongo_db()
    if db is None or ObjectId is None:
        raise HTTPException(status_code=503, detail="Database not configured for this service")
    try:
        try:
            oid = ObjectId(workflow_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid workflow_id format; expected 24 hex chars")
        wf = None
        coll_name = None
        # Try primary collection by _id
        wf = await db["wizardworkflows"].find_one({"_id": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflows"].find_one({"_id": oid})
        coll_name = "wizardworkflows" if wf else None
        # Fallback to lookup by workflowId field
        if not wf:
            wf = await db["wizardworkflows"].find_one({"workflowId": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflows"].find_one({"workflowId": oid})
            coll_name = "wizardworkflows" if wf else None
        # Try outputs collection by _id
        if not wf:
            wf = await db["wizardworkflowoutputs"].find_one({"_id": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflowoutputs"].find_one({"_id": oid})
            coll_name = "wizardworkflowoutputs" if wf else None
        # Fallback outputs by workflowId
        if not wf:
            wf = await db["wizardworkflowoutputs"].find_one({"workflowId": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflowoutputs"].find_one({"workflowId": oid})
            coll_name = "wizardworkflowoutputs" if wf else None
        if not wf:
            logger.info(f"Workflow not found for id={workflow_id} in wizardworkflows or wizardworkflowoutputs")
            raise HTTPException(status_code=404, detail="Workflow not found")
        valorization = wf.get("valorization", {}) or {}
        return {
            "collection": coll_name,
            "workflowId": str(wf.get("_id")),
            "userId": str(wf.get("userId")),
            "metalType": wf.get("metalType"),
            "name": wf.get("name"),
            "valorization": valorization
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching valorization workflow: {e}")
        raise HTTPException(status_code=500, detail="Error fetching workflow")

@app.post("/wizard/{workflow_id}/valorization/predict-and-save")
async def predict_valorization_and_save(workflow_id: str):
    db = await get_mongo_db()
    if db is None or ObjectId is None:
        raise HTTPException(status_code=503, detail="Database not configured; cannot read or update workflow")
    # Fetch workflow
    try:
        try:
            oid = ObjectId(workflow_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid workflow_id format; expected 24 hex chars")
        wf = await db["wizardworkflows"].find_one({"_id": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflows"].find_one({"_id": oid})
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")
        valorization_raw = wf.get("valorization", {}) or {}

        # Guard: if there is no meaningful valorization input, skip prediction
        if not _has_valorization_input(valorization_raw):
            logger.info(f"Skipping valorization prediction for workflow {workflow_id}: no valorization input present")
            raise HTTPException(status_code=400, detail="No valorization stage data present; prediction not generated")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading workflow: {e}")
        raise HTTPException(status_code=500, detail="Error reading workflow")

    # Build feature row and predict
    feature_row = _build_feature_row_from_valorization(valorization_raw)
    logger.info(f"Built valorization feature row for workflow {workflow_id}: nonzero_count={sum(1 for v in feature_row.values() if isinstance(v,(int,float)) and v!=0)}")
    pred_resp = await predict(PredictRequest(data=feature_row, return_confidence=True))

    # Collect predictions
    predicted_fields = list(pred_resp["predictions"].keys())
    avg_conf = 0.0
    if "confidence_intervals" in pred_resp and pred_resp["confidence_intervals"]:
        vals = [v.get("confidence") for v in pred_resp["confidence_intervals"].values() if v.get("confidence") is not None]
        if vals:
            avg_conf = float(np.mean(vals))

    valorization_updates: Dict[str, Any] = {}
    ai_predictions: Dict[str, Any] = {}
    for target_name, pred_value in pred_resp["predictions"].items():
        valorization_updates[target_name] = pred_value
        ci = pred_resp.get("confidence_intervals", {}).get(target_name)
        ai_predictions[target_name] = {
            "prediction": pred_value,
            "confidence": (ci.get("confidence") if ci else None),
            "interval": ({"lower": ci.get("lower"), "upper": ci.get("upper")} if ci else None)
        }

    # Prepare valorization output: merge complete input + predictions
    try:
        existing_output = await db["wizardworkflowoutputs"].find_one({"_id": wf["_id"]}) if _MONGO_DRIVER == 'motor' else db["wizardworkflowoutputs"].find_one({"_id": wf["_id"]})
    except:
        existing_output = None
    
    valorization_output = {**valorization_raw, **valorization_updates}
    valorization_output["aiPredictions"] = ai_predictions
    
    # Create/Update document in wizardworkflowoutputs collection
    output_doc = {
        "_id": wf["_id"],
        "workflowId": str(wf["_id"]),
        "userId": wf.get("userId"),
        "metalType": wf.get("metalType"),
        "name": wf.get("name"),
        "status": wf.get("status", "submitted"),
        "createdAt": wf.get("createdAt"),
        "mining": existing_output.get("mining", {}) if existing_output else wf.get("mining", {}),
        "beneficiation": existing_output.get("beneficiation", {}) if existing_output else wf.get("beneficiation", {}),
        "refining": existing_output.get("refining", {}) if existing_output else wf.get("refining", {}),
        "smelting": existing_output.get("smelting", {}) if existing_output else wf.get("smelting", {}),
        "manufacturing": existing_output.get("manufacturing", {}) if existing_output else wf.get("manufacturing", {}),
        "recycling": existing_output.get("recycling", {}) if existing_output else wf.get("recycling", {}),
        "valorization": valorization_output,
        "predictionMetadata": {
            "generatedAt": datetime.utcnow(),
            "lastStageProcessed": "valorization",
            "allStages": (existing_output.get("predictionMetadata", {}).get("allStages", []) if existing_output else []) + ["valorization"] if "valorization" not in (existing_output.get("predictionMetadata", {}).get("allStages", []) if existing_output else []) else (existing_output.get("predictionMetadata", {}).get("allStages", []) if existing_output else []),
            "valorization": {
                "predictedFields": predicted_fields,
                "confidence": avg_conf,
                "processedAt": datetime.utcnow()
            }
        },
        "updatedAt": datetime.utcnow()
    }

    # Execute upsert to wizardworkflowoutputs
    try:
        if _MONGO_DRIVER == 'motor':
            outputs = db["wizardworkflowoutputs"]
            await outputs.update_one(
                {"_id": wf["_id"]},
                {"$set": output_doc},
                upsert=True
            )
        elif MongoClient is not None:
            outputs = db["wizardworkflowoutputs"]
            outputs.update_one(
                {"_id": wf["_id"]},
                {"$set": output_doc},
                upsert=True
            )
        else:
            raise HTTPException(status_code=503, detail="No MongoDB driver available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save predictions to wizardworkflowoutputs: {e}")
        raise HTTPException(status_code=500, detail="Failed to save predictions")

    return {
        "success": True,
        "workflowId": workflow_id,
        "updatedFields": predicted_fields,
        "avgConfidence": round(avg_conf, 3),
        "inputUsed": feature_row,
        "timestamp": datetime.utcnow().isoformat(),
        "outputCollection": "wizardworkflowoutputs",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
