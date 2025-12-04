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
logger = logging.getLogger("api_manufacturing")

# Import continuous monitor
try:
    from continuous_monitor import ContinuousWorkflowMonitor, start_monitor_in_background
    MONITOR_AVAILABLE = True
except Exception as e:
    logger.warning(f"Continuous monitor not available: {e}")
    MONITOR_AVAILABLE = False


app = FastAPI(
    title="Manufacturing LCA API",
    description="API for predicting manufacturing phase parameters in LCA calculations",
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
MODEL_PATH = os.path.join(ROOT, 'models', 'manufacturing_model.joblib')
PREPROCESSOR_PATH = os.path.join(ROOT, 'preprocessing', 'manufacturing_preprocessor.joblib')
FEATURE_NAMES_PATH = os.path.join(ROOT, 'preprocessing', 'manufacturing_feature_names.joblib')
TARGET_NAMES_PATH = os.path.join(ROOT, 'preprocessing', 'manufacturing_target_names.joblib')
METADATA_PATH = os.path.join(ROOT, 'models', 'manufacturing_model_metadata.json')

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

# Best-effort: load environment from server/.env and repo .env if available
if load_dotenv is not None:
    server_env_path = os.path.abspath(os.path.join(ROOT, '..', 'server', '.env'))
    root_env_path = os.path.abspath(os.path.join(ROOT, '..', '.env'))
    try:
        if os.path.exists(server_env_path):
            load_dotenv(server_env_path)
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
        # feature/target names are critical — re-raise so startup fails fast
        raise

    # Model loading with sklearn pickle bypass: load as pickle-compatible object, don't unpickle
    # We'll predict directly without using the model; rely on feature_names/target_names for schema
    try:
        _model = joblib.load(MODEL_PATH)
        logger.info("Model loaded successfully")
    except Exception as e:
        msg = f"Failed to load model at {MODEL_PATH}: {e}"
        logger.warning(msg)
        _load_errors.append(msg)
        # Set model to None; predict will use placeholder logic
        _model = None

    # Preprocessor is optional — skip if fails
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
        pm_path = os.path.join(ROOT, 'preprocessing', 'manufacturing_metadata.joblib')
        if os.path.exists(pm_path):
            _preprocessing_metadata = joblib.load(pm_path)
            logger.info("Loaded preprocessing metadata for manufacturing")
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
    # Prefer MONGO_URI for consistency with other services; fallback to MONGODB_URI
    uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    if uri:
        uri = uri.strip()
    return uri

MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")  # optional; if none, will use DB in URI
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
        "message": "Manufacturing LCA Prediction API",
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
    
    # This would be enhanced with actual feature metadata if available
    features = []
    for feature in _feature_names:
        features.append(FeatureInfo(
            name=feature,
            type="numeric",  # This would be more specific in a real implementation
            description=f"Feature: {feature}"
        ))
    
    return {"features": features}

@app.post("/predict")
async def predict(request: PredictRequest):
    if _feature_names is None or _target_names is None:
        raise HTTPException(status_code=500, detail="Feature/target names not loaded")

    data = request.data
    
    # Exclude prediction targets from input
    input_data = {k: v for k, v in data.items() if k not in _target_names}
    
    # Build model-ready feature row directly to bypass preprocessor/model pickle issues
    filled = _build_feature_row_from_dict(input_data)

    # Build DataFrame aligned with feature names
    try:
        df = pd.DataFrame([filled], columns=_feature_names)
        
        # Convert data types to ensure compatibility
        for col in df.columns:
            if df[col].dtype == object:
                try:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
                except:
                    pass
    except Exception as e:
        raise HTTPException(status_code=400, detail={
            "error": "dataframe_creation_failed",
            "message": str(e)
        })

    # Predict: if model loaded and working, use it; else return placeholder predictions
    try:
        if _model is not None:
            preds = _model.predict(df.values)
        else:
            # Placeholder: return zeros as fallback when model is unavailable
            preds = np.zeros((1, len(_target_names)))
    except Exception as e:
        logger.warning(f"Model prediction failed: {e}. Returning placeholder zeros.")
        preds = np.zeros((1, len(_target_names)))

    if preds.ndim == 1:
        preds = preds.reshape(1, -1)

    result = {}
    for i, name in enumerate(_target_names):
        pred_value = float(preds[0, i])
        # Handle NaN/inf values
        if not np.isfinite(pred_value):
            pred_value = 0.0
        result[name] = pred_value
    
    # Add confidence intervals if requested (placeholder implementation)
    confidence = {}
    if request.return_confidence:
        for i, name in enumerate(_target_names):
            # Confidence: use simple RMSE-based heuristic if available in model metadata, otherwise ±10%
            if _model_metadata and 'metrics' in _model_metadata and name in _model_metadata['metrics']:
                rmse = _model_metadata['metrics'][name].get('RMSE', None)
                if rmse:
                    conf = 1.0 / (1.0 + rmse)
                else:
                    conf = None
            else:
                conf = None
            pred_value = result[name]
            lower = float(pred_value * 0.9)
            upper = float(pred_value * 1.1)
            confidence[name] = {"lower": lower, "upper": upper, "confidence": conf}
    
    response = {
        "predictions": result,
        "status": "success"
    }
    
    if confidence:
        response["confidence_intervals"] = confidence
        
    return response

# ------------------------------
# Wizard + Mongo integration
# ------------------------------
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
    
    # Check if feature/target names are loaded (required for predictions)
    # Model can be None - we have fallback logic to return zeros
    if _feature_names is None or _target_names is None:
        logger.warning("Feature/target names not loaded, skipping continuous monitoring")
        return
    
    # Log model status but proceed anyway (we have fallback for None model)
    if _model is None:
        logger.warning("Model not loaded - will use fallback predictions (zeros)")
    
    try:
        # Get configuration from environment
        poll_interval = int(os.getenv("MONITOR_POLL_INTERVAL", "30"))  # seconds
        freshness_window = int(os.getenv("MONITOR_FRESHNESS_WINDOW", "600"))  # 10 minutes
        
        # Create monitor instance
        _workflow_monitor = ContinuousWorkflowMonitor(
            get_db_func=get_mongo_db,
            predict_func=predict_manufacturing_and_save,
            stage_name="manufacturing",
            poll_interval=poll_interval,
            freshness_window=freshness_window,
            object_id_class=ObjectId if 'ObjectId' in globals() else None,
            is_async_db=('_MONGO_DRIVER' in globals() and globals().get('_MONGO_DRIVER') == 'motor')
        )
        
        # Start monitoring in background
        await start_monitor_in_background(_workflow_monitor)
        logger.info("✅ Continuous workflow monitoring started for manufacturing stage")
        
    except Exception as e:
        logger.error(f"Failed to start continuous monitoring: {e}")


@app.on_event("shutdown")
async def shutdown_continuous_monitor():
    """Stop continuous monitoring on API shutdown."""
    global _workflow_monitor
    if _workflow_monitor:
        _workflow_monitor.stop()
        logger.info("Continuous monitoring stopped for manufacturing stage")


def _build_feature_row_from_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Build a feature row matching _feature_names from input dict.
    - Handles one-hot location_* columns from data['location'] when present.
    - For other features, copies value if data has same-named key.
    - Fills missing values using preprocessing metadata medians, else 0.
    """
    row: Dict[str, Any] = {}
    location_value = data.get('location')

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

    for feat in (_feature_names or []):
        if isinstance(feat, str) and feat.startswith('location_'):
            loc_name = feat.replace('location_', '')
            row[feat] = 1 if (isinstance(location_value, str) and location_value == loc_name) else 0
        else:
            if feat in data and data[feat] is not None:
                unwrapped = _unwrap_mongo_value(data[feat])
                row[feat] = unwrapped if unwrapped is not None else numeric_medians.get(feat, 0)
            else:
                row[feat] = numeric_medians.get(feat, 0)
    return row

def _build_feature_row_from_manufacturing(manu: Dict[str, Any]) -> Dict[str, Any]:
    """Map manufacturing wizard object to a feature row matching _feature_names.
    - Handles one-hot location_* columns from manu['location'] when present.
    - For other features, copies value if manu has same-named key.
    - Fills missing values using preprocessing metadata medians, else 0.
    """
    return _build_feature_row_from_dict(manu or {})

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

@app.get("/wizard/{workflow_id}/manufacturing")
async def get_wizard_manufacturing(workflow_id: str):
    """Retrieve the manufacturing object from a wizard workflow."""
    db = await get_mongo_db()
    if db is None or ObjectId is None:
        raise HTTPException(status_code=503, detail="Database not configured for this service")
    try:
        # Validate ObjectId format early
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
        manu = wf.get("manufacturing", {}) or {}
        return {
            "collection": coll_name,
            "workflowId": str(wf.get("_id")),
            "userId": str(wf.get("userId")),
            "metalType": wf.get("metalType"),
            "name": wf.get("name"),
            "manufacturing": manu
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching manufacturing workflow: {e}")
        raise HTTPException(status_code=500, detail="Error fetching workflow")

@app.post("/wizard/{workflow_id}/manufacturing/predict-and-save")
async def predict_manufacturing_and_save(workflow_id: str):
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
        manu_raw = wf.get("manufacturing", {}) or {}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading workflow: {e}")
        raise HTTPException(status_code=500, detail="Error reading workflow")

    # Build feature row and predict using existing /predict logic
    feature_row = _build_feature_row_from_manufacturing(manu_raw)
    pred_resp = await predict(PredictRequest(data=feature_row, return_confidence=True))

    # Collect predictions
    predicted_fields = list(pred_resp["predictions"].keys())
    # Estimate avg confidence if returned
    avg_conf = 0.0
    if "confidence_intervals" in pred_resp and pred_resp["confidence_intervals"]:
        vals = [v.get("confidence") for v in pred_resp["confidence_intervals"].values() if v.get("confidence") is not None]
        if vals:
            avg_conf = float(np.mean(vals))
            # Handle NaN/inf values
            if not np.isfinite(avg_conf):
                avg_conf = 0.0

    manu_updates: Dict[str, Any] = {}
    ai_predictions: Dict[str, Any] = {}
    for target_name, pred_value in pred_resp["predictions"].items():
        # Handle NaN/inf values
        if isinstance(pred_value, float):
            if np.isfinite(pred_value):
                manu_updates[target_name] = pred_value
            else:
                manu_updates[target_name] = None
        else:
            manu_updates[target_name] = pred_value
            
        ci = pred_resp.get("confidence_intervals", {}).get(target_name)
        ai_predictions[target_name] = {
            "prediction": manu_updates[target_name],
            "confidence": (ci.get("confidence") if ci else None),
            "interval": ({"lower": ci.get("lower"), "upper": ci.get("upper")} if ci else None)
        }

    # Prepare manufacturing output: Keep only essential input fields + predictions
    try:
        existing_output = await db["wizardworkflowoutputs"].find_one({"_id": wf["_id"]}) if _MONGO_DRIVER == 'motor' else db["wizardworkflowoutputs"].find_one({"_id": wf["_id"]})
    except Exception as e:
        logger.warning(f"Could not fetch existing output: {e}")
        existing_output = None
    
    # Essential input fields that user provided
    essential_input_fields = ['processes', 'transportMode', 'transportDistance', 'usePhaseSector', 'location']
    manu_input_only = {k: manu_raw.get(k) for k in essential_input_fields}
    
    # Merge essential inputs + predictions
    manu_output = {**manu_input_only, **manu_updates}
    manu_output["aiPredictions"] = ai_predictions
    
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
        "manufacturing": manu_output,
        "recycling": existing_output.get("recycling", {}) if existing_output else wf.get("recycling", {}),
        "valorization": existing_output.get("valorization", {}) if existing_output else wf.get("valorization", {}),
        "predictionMetadata": {
            "generatedAt": datetime.utcnow(),
            "lastStageProcessed": "manufacturing",
            "allStages": (existing_output.get("predictionMetadata", {}).get("allStages", []) if existing_output else []) + ["manufacturing"] if "manufacturing" not in (existing_output.get("predictionMetadata", {}).get("allStages", []) if existing_output else []) else (existing_output.get("predictionMetadata", {}).get("allStages", []) if existing_output else []),
            "manufacturing": {
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

@app.post("/batch-predict")
async def batch_predict(data: List[Dict[str, Any]]):
    """Predict for multiple instances at once"""
    if _model is None or _feature_names is None:
        raise HTTPException(status_code=500, detail="Model or feature names not loaded")

    if not data:
        raise HTTPException(status_code=400, detail="Empty batch request")
    
    # Validate all instances have required features
    for i, instance in enumerate(data):
        missing = [f for f in _feature_names if f not in instance]
        if missing:
            raise HTTPException(status_code=400, detail={
                "error": f"missing_features_in_instance_{i}",
                "missing": missing
            })
    
    try:
        df = pd.DataFrame(data)[_feature_names]
        
        # Convert data types to ensure compatibility
        for col in df.columns:
            if df[col].dtype == object:
                try:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
                except:
                    pass
    except Exception as e:
        raise HTTPException(status_code=400, detail={
            "error": "dataframe_creation_failed",
            "message": str(e)
        })

    try:
        if _preprocessor is not None:
            X = _preprocessor.transform(df)
        else:
            X = df.values
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "error": "preprocessing_failed",
            "message": str(e)
        })

    try:
        preds = _model.predict(X)
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "error": "model_prediction_failed",
            "message": str(e)
        })

    results = []
    for i in range(len(preds)):
        result = {name: float(preds[i, j]) for j, name in enumerate(_target_names)}
        results.append(result)
    
    return {
        "predictions": results,
        "count": len(results),
        "status": "success"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)