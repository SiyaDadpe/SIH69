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

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_recycling")

app = FastAPI(
    title="Recycling LCA API",
    description="API for predicting recycling phase parameters in LCA calculations",
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
MODEL_PATH = os.path.join(ROOT, 'models', 'recycling_model.joblib')
PREPROCESSOR_PATH = os.path.join(ROOT, 'preprocessing', 'recycling_preprocessor.joblib')
FEATURE_NAMES_PATH = os.path.join(ROOT, 'preprocessing', 'recycling_feature_names.joblib')
TARGET_NAMES_PATH = os.path.join(ROOT, 'preprocessing', 'recycling_target_names.joblib')
METADATA_PATH = os.path.join(ROOT, 'models', 'recycling_model_metadata.json')

# Globals
_model = None
_preprocessor = None
_feature_names = None
_target_names = None
_model_metadata = None
_load_errors = []
_preprocessing_metadata = None

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
        _model = joblib.load(MODEL_PATH)
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
        pm_path = os.path.join(ROOT, 'preprocessing', 'recycling_metadata.joblib')
        if os.path.exists(pm_path):
            _preprocessing_metadata = joblib.load(pm_path)
            logger.info("Loaded preprocessing metadata for recycling")
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

@app.on_event("startup")
async def startup_event():
    _load_artifacts()

@app.get("/")
async def root():
    return {
        "message": "Recycling LCA Prediction API",
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
    filled = _build_feature_row_from_dict(data)

    try:
        df = pd.DataFrame([filled], columns=_feature_names)
        
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
            preds = _model.predict(df.values)
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

def _build_feature_row_from_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Build a feature row matching _feature_names from input dict."""
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
                row[feat] = data[feat]
            else:
                row[feat] = numeric_medians.get(feat, 0)
    return row

def _build_feature_row_from_recycling(recycling: Dict[str, Any]) -> Dict[str, Any]:
    """Map recycling wizard object to a feature row matching _feature_names."""
    return _build_feature_row_from_dict(recycling or {})

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

@app.get("/wizard/{workflow_id}/recycling")
async def get_wizard_recycling(workflow_id: str):
    """Retrieve the recycling object from a wizard workflow."""
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
        recycling = wf.get("recycling", {}) or {}
        return {
            "collection": coll_name,
            "workflowId": str(wf.get("_id")),
            "userId": str(wf.get("userId")),
            "metalType": wf.get("metalType"),
            "name": wf.get("name"),
            "recycling": recycling
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recycling workflow: {e}")
        raise HTTPException(status_code=500, detail="Error fetching workflow")

@app.post("/wizard/{workflow_id}/recycling/predict-and-save")
async def predict_recycling_and_save(workflow_id: str):
    db = await get_mongo_db()
    if db is None or ObjectId is None:
        raise HTTPException(status_code=503, detail="Database not configured; cannot read or update workflow")
    # Fetch workflow
    try:
        try:
            oid = ObjectId(workflow_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid workflow_id format; expected 24 hex chars")
        wf = None
        coll_name = None
        wf = await db["wizardworkflows"].find_one({"_id": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflows"].find_one({"_id": oid})
        coll_name = "wizardworkflows" if wf else None
        if not wf:
            wf = await db["wizardworkflows"].find_one({"workflowId": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflows"].find_one({"workflowId": oid})
            coll_name = "wizardworkflows" if wf else None
        if not wf:
            wf = await db["wizardworkflowoutputs"].find_one({"_id": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflowoutputs"].find_one({"_id": oid})
            coll_name = "wizardworkflowoutputs" if wf else None
        if not wf:
            wf = await db["wizardworkflowoutputs"].find_one({"workflowId": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflowoutputs"].find_one({"workflowId": oid})
            coll_name = "wizardworkflowoutputs" if wf else None
        if not wf:
            logger.info(f"Workflow not found for id={workflow_id} in wizardworkflows or wizardworkflowoutputs")
            raise HTTPException(status_code=404, detail="Workflow not found")
        recycling_raw = wf.get("recycling", {}) or {}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading workflow: {e}")
        raise HTTPException(status_code=500, detail="Error reading workflow")

    # Build feature row and predict
    feature_row = _build_feature_row_from_recycling(recycling_raw)
    pred_resp = await predict(PredictRequest(data=feature_row, return_confidence=True))

    # Collect predictions
    predicted_fields = list(pred_resp["predictions"].keys())
    avg_conf = 0.0
    if "confidence_intervals" in pred_resp and pred_resp["confidence_intervals"]:
        vals = [v.get("confidence") for v in pred_resp["confidence_intervals"].values() if v.get("confidence") is not None]
        if vals:
            avg_conf = float(np.mean(vals))

    recycling_updates: Dict[str, Any] = {}
    ai_predictions: Dict[str, Any] = {}
    for target_name, pred_value in pred_resp["predictions"].items():
        recycling_updates[target_name] = pred_value
        ci = pred_resp.get("confidence_intervals", {}).get(target_name)
        ai_predictions[target_name] = {
            "prediction": pred_value,
            "confidence": (ci.get("confidence") if ci else None),
            "interval": ({"lower": ci.get("lower"), "upper": ci.get("upper")} if ci else None)
        }

    # Build $set operations
    set_ops: Dict[str, Any] = {}
    for field_name, value in recycling_updates.items():
        set_ops[f"recycling.{field_name}"] = value
    set_ops["recycling.aiPredictions"] = ai_predictions
    set_ops["predictionMetadata.generatedAt"] = datetime.utcnow()
    set_ops["updatedAt"] = datetime.utcnow()
    set_ops["status"] = wf.get("status", "submitted")

    # Execute updates
    try:
        workflows = db[coll_name]
        if _MONGO_DRIVER == 'motor':
            await workflows.update_one({"_id": wf["_id"]}, {"$pull": {"predictionMetadata.stepsWithPredictions": {"stepName": "recycling"}}})
            await workflows.update_one({"_id": wf["_id"]}, {"$set": set_ops})
            await workflows.update_one({"_id": wf["_id"]}, {"$push": {"predictionMetadata.stepsWithPredictions": {"stepName": "recycling", "predictedFields": [f"recycling.{f}" for f in predicted_fields], "confidence": avg_conf}}})
        elif MongoClient is not None:
            workflows.update_one({"_id": wf["_id"]}, {"$pull": {"predictionMetadata.stepsWithPredictions": {"stepName": "recycling"}}})
            workflows.update_one({"_id": wf["_id"]}, {"$set": set_ops})
            workflows.update_one({"_id": wf["_id"]}, {"$push": {"predictionMetadata.stepsWithPredictions": {"stepName": "recycling", "predictedFields": [f"recycling.{f}" for f in predicted_fields], "confidence": avg_conf}}})
        else:
            raise HTTPException(status_code=503, detail="No MongoDB driver available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update workflow predictions: {e}")
        raise HTTPException(status_code=500, detail="Failed to update workflow predictions")

    return {
        "success": True,
        "workflowId": workflow_id,
        "updatedFields": [f"recycling.{f}" for f in predicted_fields],
        "avgConfidence": round(avg_conf, 3),
        "inputUsed": feature_row,
        "timestamp": datetime.utcnow().isoformat(),
        "metadataUpdated": True,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
