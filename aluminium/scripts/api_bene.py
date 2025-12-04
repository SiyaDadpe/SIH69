import os
import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio
import logging

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

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import continuous monitor
try:
    from continuous_monitor import ContinuousWorkflowMonitor, start_monitor_in_background
    MONITOR_AVAILABLE = True
except Exception as e:
    logger.warning(f"Continuous monitor not available: {e}")
    MONITOR_AVAILABLE = False

app = FastAPI(
    title="Beneficiation Stage Prediction API",
    description="API for predicting beneficiation stage parameters in LCA calculations and saving to Mongo",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
repo_root = os.path.abspath(os.path.join(project_root, '..'))
preprocessor_path = os.path.join(project_root, 'preprocessing', 'beneficiation_preprocessor.joblib')
feature_names_path = os.path.join(project_root, 'preprocessing', 'beneficiation_feature_names.joblib')
regressor_path = os.path.join(project_root, 'models', 'beneficiation_regressor.joblib')
classifier_path = os.path.join(project_root, 'models', 'beneficiation_classifier.joblib')
metadata_path = os.path.join(project_root, 'models', 'beneficiation_model_metadata.json')
metrics_path = os.path.join(project_root, 'models', 'beneficiation_model_metrics.json')  # optional

# Best-effort .env loading similar to mining API
if load_dotenv is not None:
    server_env_path = os.path.join(repo_root, 'server', '.env')
    root_env_path = os.path.join(repo_root, '.env')
    try:
        if os.path.exists(server_env_path):
            load_dotenv(server_env_path)
        if os.path.exists(root_env_path):
            load_dotenv(root_env_path)
    except Exception:
        pass

# Globals
preprocessor = None
feature_names = None
regressor = None
classifier = None
metadata = None
metrics = None
preprocessing_metadata = None

# Global monitor instance
_workflow_monitor = None

def _load_artifacts():
    global preprocessor, feature_names, regressor, classifier, metadata, metrics, preprocessing_metadata
    try:
        if os.path.exists(preprocessor_path):
            preprocessor = joblib.load(preprocessor_path)
        if os.path.exists(feature_names_path):
            feature_names = joblib.load(feature_names_path)
        if os.path.exists(regressor_path):
            regressor = joblib.load(regressor_path)
        if os.path.exists(classifier_path):
            classifier = joblib.load(classifier_path)
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        if os.path.exists(metrics_path):
            try:
                with open(metrics_path, 'r') as f:
                    metrics = json.load(f)
            except Exception:
                metrics = None
        pm_path = os.path.join(project_root, 'preprocessing', 'beneficiation_metadata.joblib')
        if os.path.exists(pm_path):
            try:
                preprocessing_metadata = joblib.load(pm_path)
                logger.info("Loaded preprocessing metadata for beneficiation")
            except Exception:
                preprocessing_metadata = None
        logger.info("Beneficiation artifacts loaded")
    except Exception as e:
        logger.error(f"Error loading beneficiation artifacts: {e}")
        preprocessor = feature_names = regressor = classifier = metadata = None

# Mongo configuration (mirrors mining)
def _get_mongo_uri() -> Optional[str]:
    uri = os.getenv("MONGO_URI")
    if uri:
        uri = uri.strip()
    return uri

MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
_mongo_client = None
_mongo_db = None

async def get_mongo_db():
    global _mongo_client, _mongo_db
    MONGO_URI = _get_mongo_uri()
    if not MONGO_URI:
        return None
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

# Input schema
class BeneficiationInput(BaseModel):
    beneficiation_process_Crushing: Optional[int] = Field(0, ge=0, le=1)
    beneficiation_process_Grinding: Optional[int] = Field(0, ge=0, le=1)
    beneficiation_process_Washing_Screening: Optional[int] = Field(0, ge=0, le=1)
    beneficiation_process_Magnetic_Separation: Optional[int] = Field(0, ge=0, le=1)
    beneficiation_process_Gravity_Separation: Optional[int] = Field(0, ge=0, le=1)
    beneficiation_process_Dry_Separation: Optional[int] = Field(0, ge=0, le=1)
    beneficiation_chem_Flocculants: Optional[int] = Field(0, ge=0, le=1)
    beneficiation_chem_Dispersants: Optional[int] = Field(0, ge=0, le=1)
    beneficiation_chem_Coagulants: Optional[int] = Field(0, ge=0, le=1)
    beneficiation_water_m3_per_t_ore: Optional[float] = Field(None, ge=0)
    beneficiation_electricity_kWh_per_t_ore: Optional[float] = Field(None, ge=0)
    beneficiation_efficiency: Optional[float] = Field(None, ge=0, le=1)
    beneficiation_tailings_management: Optional[str] = None
    beneficiation_noise_pollution: Optional[str] = None
    beneficiation_dust_pollution: Optional[str] = None
    location: Optional[str] = None
    year: Optional[int] = None

class IntervalEstimate(BaseModel):
    lower: float
    upper: float

class TargetPrediction(BaseModel):
    prediction: float | str
    confidence: float | None
    rmse: float | None
    mae: float | None
    interval: Optional[IntervalEstimate]

class PredictionResponse(BaseModel):
    predictions: Dict[str, TargetPrediction]
    input_used: Dict[str, Any]
    timestamp: str

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
    
    # Check if models are loaded (handle different variable names across APIs)
    models_loaded = False
    if 'model' in globals() and globals().get('model') is not None:
        models_loaded = True
    elif 'regressor' in globals() and globals().get('regressor') is not None:
        models_loaded = True
    
    if not models_loaded:
        logger.warning("Models not loaded, skipping continuous monitoring")
        return
    
    try:
        # Get configuration from environment
        poll_interval = int(os.getenv("MONITOR_POLL_INTERVAL", "30"))  # seconds
        freshness_window = int(os.getenv("MONITOR_FRESHNESS_WINDOW", "600"))  # 10 minutes
        
        # Create monitor instance
        _workflow_monitor = ContinuousWorkflowMonitor(
            get_db_func=get_mongo_db,
            predict_func=predict_beneficiation_and_save,
            stage_name="beneficiation",
            poll_interval=poll_interval,
            freshness_window=freshness_window,
            object_id_class=ObjectId if 'ObjectId' in globals() else None,
            is_async_db=('_MONGO_DRIVER' in globals() and globals().get('_MONGO_DRIVER') == 'motor')
        )
        
        # Start monitoring in background
        await start_monitor_in_background(_workflow_monitor)
        logger.info("✅ Continuous workflow monitoring started for beneficiation stage")
        
    except Exception as e:
        logger.error(f"Failed to start continuous monitoring: {e}")


@app.on_event("shutdown")
async def shutdown_continuous_monitor():
    """Stop continuous monitoring on API shutdown."""
    global _workflow_monitor
    if _workflow_monitor:
        _workflow_monitor.stop()
        logger.info("Continuous monitoring stopped for beneficiation stage")


def _map_wizard_beneficiation_to_model_input(beneficiation: Dict[str, Any]) -> BeneficiationInput:
    if not beneficiation:
        return BeneficiationInput()
    processes = beneficiation.get('processes', [])
    if not isinstance(processes, list):
        processes = []
    pset = set(str(x) for x in processes)
    crushing = 1 if any(x.lower().startswith('crushing') for x in pset) else 0
    grinding = 1 if any('grinding' in x.lower() for x in pset) else 0
    washing = 1 if any('washing' in x.lower() or 'screen' in x.lower() for x in pset) else 0
    magnetic = 1 if 'magnetic' in ' '.join(pset).lower() else 0
    gravity = 1 if 'gravity' in ' '.join(pset).lower() else 0
    drysep = 1 if 'dry' in ' '.join(pset).lower() else 0
    chemicals = beneficiation.get('chemicalAgents', [])
    if not isinstance(chemicals, list):
        chemicals = []
    cset = set(str(x) for x in chemicals)
    floc = 1 if any('floc' in x.lower() for x in cset) else 0
    disp = 1 if any('disp' in x.lower() for x in cset) else 0
    coag = 1 if any('coag' in x.lower() for x in cset) else 0
    water = _unwrap_mongo_value(beneficiation.get('waterUsage')) or _unwrap_mongo_value(beneficiation.get('waterConsumption'))
    electricity = _unwrap_mongo_value(beneficiation.get('electricityConsumption')) or _unwrap_mongo_value(beneficiation.get('electricity'))
    efficiency = _unwrap_mongo_value(beneficiation.get('efficiency'))
    tailings = _unwrap_mongo_value(beneficiation.get('tailingsManagement'))
    noise = _unwrap_mongo_value(beneficiation.get('noisePollution'))
    dust = _unwrap_mongo_value(beneficiation.get('dustPollution'))
    location = _unwrap_mongo_value(beneficiation.get('location'))
    year = _unwrap_mongo_value(beneficiation.get('year'))
    return BeneficiationInput(
        beneficiation_process_Crushing=crushing,
        beneficiation_process_Grinding=grinding,
        beneficiation_process_Washing_Screening=washing,
        beneficiation_process_Magnetic_Separation=magnetic,
        beneficiation_process_Gravity_Separation=gravity,
        beneficiation_process_Dry_Separation=drysep,
        beneficiation_chem_Flocculants=floc,
        beneficiation_chem_Dispersants=disp,
        beneficiation_chem_Coagulants=coag,
        beneficiation_water_m3_per_t_ore=water,
        beneficiation_electricity_kWh_per_t_ore=electricity,
        beneficiation_efficiency=efficiency,
        beneficiation_tailings_management=tailings,
        beneficiation_noise_pollution=noise,
        beneficiation_dust_pollution=dust,
        location=location,
        year=year,
    )

@app.get("/")
async def root():
    return {"message": "Beneficiation Stage Prediction API", "status": "healthy"}

@app.get("/health")
async def health_check():
    status = "ready" if (regressor or classifier) and preprocessor else "degraded"
    db = await get_mongo_db()
    return {
        "status": status,
        "model_loaded": (regressor is not None or classifier is not None),
        "preprocessor_loaded": preprocessor is not None,
        "database_configured": db is not None,
    }

@app.get("/model-info")
async def model_info():
    if metadata is None:
        raise HTTPException(status_code=503, detail="Model metadata not available")
    return {
        "model_type": metadata.get('model_type', 'ensemble'),
        "regression_targets": metadata.get('regression_targets', []),
        "classification_targets": metadata.get('classification_targets', []),
    }

@app.get("/features")
async def get_features():
    if feature_names is None:
        raise HTTPException(status_code=503, detail="Feature names not loaded")
    features_info = []
    for feat in feature_names:
        ftype = 'numeric'
        expected = None
        if preprocessing_metadata:
            if 'binary_columns' in preprocessing_metadata and feat in preprocessing_metadata['binary_columns']:
                ftype = 'binary'
            elif 'ordinal_columns' in preprocessing_metadata and feat in preprocessing_metadata['ordinal_columns']:
                ftype = 'ordinal'
            elif 'numeric_columns' in preprocessing_metadata and feat in preprocessing_metadata['numeric_columns']:
                ftype = 'numeric'
            if isinstance(preprocessing_metadata.get('ranges'), dict) and feat in preprocessing_metadata['ranges']:
                expected = preprocessing_metadata['ranges'][feat]
        features_info.append({'name': feat, 'type': ftype, 'expected_range': expected})
    return {"features": features_info}

def _build_input_row(input_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Build input row - let preprocessor handle encoding, just pass raw values."""
    row: Dict[str, Any] = {}
    for feat in feature_names:
        # Pass raw values directly - preprocessor will handle encoding
        row[feat] = input_dict.get(feat, None)
    return row

@app.post("/predict", response_model=PredictionResponse)
async def predict(input_data: BeneficiationInput):
    if any(v is None for v in [preprocessor, metadata]) or (regressor is None and classifier is None):
        raise HTTPException(status_code=503, detail="Model artifacts not loaded")
    try:
        input_dict = input_data.dict()
        
        # Remove prediction targets from input - they should not be features
        reg_targets = metadata.get('regression_targets', [])
        clf_targets = metadata.get('classification_targets', [])
        all_targets = reg_targets + clf_targets
        
        # Build DataFrame with only input features (exclude prediction targets)
        input_features = {k: v for k, v in input_dict.items() if k not in all_targets}
        df_input = pd.DataFrame([input_features])
        
        # Preprocess
        X_processed = preprocessor.transform(df_input)
        
        predictions: Dict[str, TargetPrediction] = {}
        if reg_targets and regressor is not None and hasattr(regressor, 'predict'):
            y_reg = regressor.predict(X_processed)
            for i, target in enumerate(reg_targets):
                pred_value = float(y_reg[0, i])
                # Handle NaN/inf values
                if not np.isfinite(pred_value):
                    pred_value = 0.0
                lower = pred_value * 0.9
                upper = pred_value * 1.1
                predictions[target] = TargetPrediction(
                    prediction=round(pred_value, 4), 
                    confidence=None, 
                    rmse=None, 
                    mae=None, 
                    interval=IntervalEstimate(lower=round(lower, 4), upper=round(upper, 4))
                )
        if clf_targets and classifier is not None and hasattr(classifier, 'predict'):
            y_clf = classifier.predict(X_processed)
            for i, target in enumerate(clf_targets):
                val = y_clf[0, i] if hasattr(y_clf[0], '__len__') else y_clf[0]
                predictions[target] = TargetPrediction(prediction=str(val), confidence=None, rmse=None, mae=None, interval=None)
        return PredictionResponse(predictions=predictions, input_used=input_dict, timestamp=datetime.utcnow().isoformat())
    except Exception as e:
        error_msg = str(e) if str(e) else repr(e)
        logger.error(f"Beneficiation prediction error: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {error_msg}")

@app.get("/wizard/{workflow_id}/beneficiation")
async def get_wizard_beneficiation(workflow_id: str):
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
        bene = wf.get("beneficiation", {}) or {}
        return {"collection": coll_name, "workflowId": str(wf.get("_id")), "userId": str(wf.get("userId")), "metalType": wf.get("metalType"), "name": wf.get("name"), "beneficiation": bene}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching benefication workflow: {e}")
        raise HTTPException(status_code=500, detail="Error fetching workflow")

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

@app.post("/wizard/{workflow_id}/beneficiation/predict-and-save")
async def predict_beneficiation_and_save(workflow_id: str):
    """
    Read beneficiation data from wizardworkflows (input), run prediction,
    and CREATE/UPDATE document in wizardworkflowoutputs (output) mapped by _id.
    """
    try:
        db = await get_mongo_db()
        if db is None or ObjectId is None:
            raise HTTPException(status_code=503, detail="Database not configured")
        
        # Step 1: Fetch workflow from wizardworkflows
        try:
            oid = ObjectId(workflow_id)
            wf = await db["wizardworkflows"].find_one({"_id": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflows"].find_one({"_id": oid})
            if not wf:
                raise HTTPException(status_code=404, detail="Workflow not found")
            bene_raw = wf.get("beneficiation", {}) or {}
            
            # Log what we received
            logger.info(f"Processing beneficiation for workflow {workflow_id}")
            logger.info(f"Input beneficiation data: {bene_raw}")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error reading workflow: {e}")
            raise HTTPException(status_code=500, detail="Error reading workflow")
        
        # Step 2: Backfill missing model input fields
        enrichment_defaults = {
            "tailingsManagement": None,
            "noisePollution": None,
            "dustPollution": None,
            "year": datetime.utcnow().year,
            "waterUsage": None,
            "electricityConsumption": None,
        }
        for k, v in enrichment_defaults.items():
            if k not in bene_raw:
                bene_raw[k] = v
        
        # Step 3: Map to model input schema
        input_model = _map_wizard_beneficiation_to_model_input(bene_raw)
        
        # Step 4: Run prediction
        try:
            pred_resp = await predict(input_model)
        except Exception as e:
            logger.error(f"Prediction failed for workflow {workflow_id}: {e}")
            logger.error(f"Input model: {input_model.dict() if hasattr(input_model, 'dict') else input_model}")
            raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
        
        # Step 5: Compute aggregate confidence
        predicted_fields = list(pred_resp.predictions.keys())
        confidences = [p.confidence for p in pred_resp.predictions.values() if p.confidence is not None]
        avg_conf = float(np.mean(confidences)) if confidences else 0.0
        # Handle NaN/inf values
        if not np.isfinite(avg_conf):
            avg_conf = 0.0
        
        # Step 6: Prepare beneficiation output with predictions
        bene_output = {}
        for target_name, meta in pred_resp.predictions.items():
            # Keep the prediction as-is (can be float or string)
            pred_val = meta.prediction
            if isinstance(pred_val, float):
                # Handle NaN/inf values
                if np.isfinite(pred_val):
                    bene_output[target_name] = float(pred_val)
                else:
                    bene_output[target_name] = None
            else:
                bene_output[target_name] = str(pred_val)
        
        # Add aiPredictions structure (use dict() for Pydantic v1 compatibility)
        bene_output["aiPredictions"] = {
            k: v.dict() if hasattr(v, 'dict') else v.model_dump() 
            for k, v in pred_resp.predictions.items()
        }
        
        # Step 7: Create/Update document in wizardworkflowoutputs collection
        # Check if output document already exists to preserve other stage data
        try:
            existing_output = await db["wizardworkflowoutputs"].find_one({"_id": wf["_id"]}) if _MONGO_DRIVER == 'motor' else db["wizardworkflowoutputs"].find_one({"_id": wf["_id"]})
        except Exception as e:
            logger.warning(f"Could not fetch existing output: {e}")
            existing_output = None
        
        # Prepare beneficiation data: Keep only essential input fields + predictions
        # Essential input fields that user provided
        essential_input_fields = ['processes', 'location', 'waterConsumption', 'electricityUse']
        bene_input_only = {k: bene_raw.get(k) for k in essential_input_fields}
        
        # Merge essential inputs + predictions
        merged_bene = {**bene_input_only, **bene_output}
        
        # If merged_bene is still empty after predictions, something went wrong
        if not merged_bene or len(merged_bene) == 0:
            logger.error(f"merged_bene is empty! bene_raw: {bene_raw}, bene_output: {bene_output}")
            # At minimum, add the predictions even if input is empty
            merged_bene = bene_output if bene_output else {}
        
        logger.info(f"Final merged beneficiation data has {len(merged_bene)} fields: {list(merged_bene.keys())[:10]}...")
        
        # Build output document - preserve existing stage data if available
        output_doc = {
            "_id": wf["_id"],
            "workflowId": str(wf["_id"]),
            "userId": wf.get("userId"),
            "metalType": wf.get("metalType"),
            "name": wf.get("name"),
            "status": wf.get("status", "submitted"),
            "createdAt": wf.get("createdAt"),
            "mining": existing_output.get("mining", {}) if existing_output else wf.get("mining", {}),
            "beneficiation": merged_bene,
            "refining": existing_output.get("refining", {}) if existing_output else wf.get("refining", {}),
            "smelting": existing_output.get("smelting", {}) if existing_output else wf.get("smelting", {}),
            "manufacturing": existing_output.get("manufacturing", {}) if existing_output else wf.get("manufacturing", {}),
            "recycling": existing_output.get("recycling", {}) if existing_output else wf.get("recycling", {}),
            "valorization": existing_output.get("valorization", {}) if existing_output else wf.get("valorization", {}),
            "predictionMetadata": {
                "generatedAt": datetime.utcnow(),
                "lastStageProcessed": "beneficiation",
                "allStages": (existing_output.get("predictionMetadata", {}).get("allStages", []) if existing_output else []) + ["beneficiation"] if "beneficiation" not in (existing_output.get("predictionMetadata", {}).get("allStages", []) if existing_output else []) else (existing_output.get("predictionMetadata", {}).get("allStages", []) if existing_output else []),
                "beneficiation": {
                    "predictedFields": predicted_fields,
                    "confidence": avg_conf,
                    "processedAt": datetime.utcnow()
                }
            },
            "updatedAt": datetime.utcnow()
        }
        
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
            "inputUsed": input_model.dict(),
            "timestamp": pred_resp.timestamp,
            "outputCollection": "wizardworkflowoutputs",
        }
    
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e) if str(e) else repr(e)
        logger.error(f"Unexpected error in predict_beneficiation_and_save for workflow {workflow_id}: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {error_msg}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
