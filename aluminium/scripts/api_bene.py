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

@app.on_event("startup")
async def startup_event():
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
    water = beneficiation.get('waterUsage', beneficiation.get('waterConsumption'))
    electricity = beneficiation.get('electricityConsumption', beneficiation.get('electricity'))
    efficiency = beneficiation.get('efficiency')
    tailings = beneficiation.get('tailingsManagement')
    noise = beneficiation.get('noisePollution')
    dust = beneficiation.get('dustPollution')
    location = beneficiation.get('location')
    year = beneficiation.get('year')
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
    row: Dict[str, Any] = {}
    for feat in feature_names:
        if feat.startswith('location_'):
            val = feat.replace('location_', '')
            row[feat] = 1 if input_dict.get('location') == val else 0
        elif feat.startswith('beneficiation_tailings_management_'):
            val = feat.replace('beneficiation_tailings_management_', '')
            row[feat] = 1 if input_dict.get('beneficiation_tailings_management') == val else 0
        else:
            row[feat] = input_dict.get(feat, None)
    return row

@app.post("/predict", response_model=PredictionResponse)
async def predict(input_data: BeneficiationInput):
    if any(v is None for v in [preprocessor, feature_names, metadata]) or (regressor is None and classifier is None):
        raise HTTPException(status_code=503, detail="Model artifacts not loaded")
    try:
        input_dict = input_data.dict()
        raw_row = _build_input_row(input_dict)
        df_input = pd.DataFrame([raw_row], columns=feature_names)
        X_processed = preprocessor.transform(df_input)
        predictions: Dict[str, TargetPrediction] = {}
        reg_targets = metadata.get('regression_targets', [])
        if reg_targets and regressor is not None and hasattr(regressor, 'predict'):
            y_reg = regressor.predict(X_processed)
            for i, target in enumerate(reg_targets):
                pred_value = float(y_reg[0, i])
                lower = pred_value * 0.9
                upper = pred_value * 1.1
                predictions[target] = TargetPrediction(prediction=round(pred_value,4), confidence=None, rmse=None, mae=None, interval=IntervalEstimate(lower=round(lower,4), upper=round(upper,4)))
        clf_targets = metadata.get('classification_targets', [])
        if clf_targets and classifier is not None and hasattr(classifier, 'predict'):
            y_clf = classifier.predict(X_processed)
            for i, target in enumerate(clf_targets):
                val = y_clf[0, i] if hasattr(y_clf[0], '__len__') else y_clf[0]
                predictions[target] = TargetPrediction(prediction=str(val), confidence=None, rmse=None, mae=None, interval=None)
        return PredictionResponse(predictions=predictions, input_used=input_dict, timestamp=datetime.utcnow().isoformat())
    except Exception as e:
        logger.error(f"Beneficiation prediction error: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")

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
        bene_raw = wf.get("beneficiation", {}) or {}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading workflow: {e}")
        raise HTTPException(status_code=500, detail="Error reading workflow")
    # Default enrichment
    enrichment_defaults = {
        "tailingsManagement": bene_raw.get("tailingsManagement"),
        "noisePollution": bene_raw.get("noisePollution"),
        "dustPollution": bene_raw.get("dustPollution"),
        "year": bene_raw.get("year", datetime.utcnow().year),
        "waterUsage": bene_raw.get("waterUsage", bene_raw.get("waterConsumption")),
        "electricityConsumption": bene_raw.get("electricityConsumption", bene_raw.get("electricity")),
    }
    for k,v in enrichment_defaults.items():
        if k not in bene_raw:
            bene_raw[k] = v
    input_model = _map_wizard_beneficiation_to_model_input(bene_raw)
    # Predict using /predict logic
    pred_resp = await predict(input_model)
    predicted_fields = list(pred_resp.predictions.keys())
    avg_conf = float(np.mean([p.confidence for p in pred_resp.predictions.values() if p.confidence is not None])) if predicted_fields else 0.0
    bene_updates: Dict[str, Any] = {}
    ai_predictions: Dict[str, Any] = {}
    for target_name, meta in pred_resp.predictions.items():
        bene_updates[target_name] = meta.prediction
        ai_predictions[target_name] = {
            "prediction": meta.prediction,
            "confidence": meta.confidence,
            "interval": meta.interval.model_dump() if meta.interval else None
        }
    set_ops: Dict[str, Any] = {}
    for field_name, value in bene_updates.items():
        set_ops[f"beneficiation.{field_name}"] = value
    set_ops["beneficiation.aiPredictions"] = ai_predictions
    set_ops["predictionMetadata.generatedAt"] = datetime.utcnow()
    set_ops["updatedAt"] = datetime.utcnow()
    set_ops["status"] = wf.get("status", "submitted")
    try:
        workflows = db[coll_name]
        if _MONGO_DRIVER == 'motor':
            await workflows.update_one({"_id": wf["_id"]}, {"$pull": {"predictionMetadata.stepsWithPredictions": {"stepName": "beneficiation"}}})
            await workflows.update_one({"_id": wf["_id"]}, {"$set": set_ops})
            await workflows.update_one({"_id": wf["_id"]}, {"$push": {"predictionMetadata.stepsWithPredictions": {"stepName": "beneficiation", "predictedFields": [f"beneficiation.{f}" for f in predicted_fields], "confidence": avg_conf}}})
        elif MongoClient is not None:
            workflows.update_one({"_id": wf["_id"]}, {"$pull": {"predictionMetadata.stepsWithPredictions": {"stepName": "beneficiation"}}})
            workflows.update_one({"_id": wf["_id"]}, {"$set": set_ops})
            workflows.update_one({"_id": wf["_id"]}, {"$push": {"predictionMetadata.stepsWithPredictions": {"stepName": "beneficiation", "predictedFields": [f"beneficiation.{f}" for f in predicted_fields], "confidence": avg_conf}}})
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
        "updatedFields": [f"beneficiation.{f}" for f in predicted_fields],
        "avgConfidence": round(avg_conf,3),
        "inputUsed": input_model.dict(),
        "timestamp": pred_resp.timestamp,
        "metadataUpdated": True,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
