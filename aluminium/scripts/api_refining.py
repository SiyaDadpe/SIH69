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
    title="Refining Stage Prediction API",
    description="API for predicting refining stage parameters in LCA calculations and saving to Mongo",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- sklearn compatibility patching (handles version mismatch for pickled artifacts) ---
def _patch_sklearn_encoders(obj: Any) -> None:
    """Recursively traverse the preprocessor/pipeline and patch missing private
    attributes on encoders introduced/removed across sklearn versions.
    Currently ensures OrdinalEncoder/OneHotEncoder have `_infrequent_enabled`.
    Safe to call multiple times.
    """
    try:
        if obj is None:
            return
        cls_name = obj.__class__.__name__
        if cls_name in {"OrdinalEncoder", "OneHotEncoder"}:
            if not hasattr(obj, "_infrequent_enabled"):
                try:
                    setattr(obj, "_infrequent_enabled", False)
                    logger.info(f"Patched {cls_name}._infrequent_enabled=False for compatibility")
                except Exception:
                    pass
            return
        # Pipeline
        if hasattr(obj, "steps") and isinstance(getattr(obj, "steps"), list):
            for _, step in getattr(obj, "steps"):
                _patch_sklearn_encoders(step)
        # ColumnTransformer
        if hasattr(obj, "transformers") and isinstance(getattr(obj, "transformers"), list):
            for _, transformer, _cols in getattr(obj, "transformers"):
                _patch_sklearn_encoders(transformer)
        # Composite estimators
        if hasattr(obj, "transformer_list") and isinstance(getattr(obj, "transformer_list"), list):
            for _, transformer in getattr(obj, "transformer_list"):
                _patch_sklearn_encoders(transformer)
        if hasattr(obj, "named_steps") and isinstance(getattr(obj, "named_steps"), dict):
            for _n, step in getattr(obj, "named_steps").items():
                _patch_sklearn_encoders(step)
    except Exception:
        # Best-effort patching; ignore errors
        pass

# Paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
repo_root = os.path.abspath(os.path.join(project_root, '..'))
preprocessor_path = os.path.join(project_root, 'preprocessing', 'refining_preprocessor.joblib')
feature_names_path = os.path.join(project_root, 'preprocessing', 'refining_feature_names.joblib')
target_names_path = os.path.join(project_root, 'preprocessing', 'refining_target_names.joblib')
model_path = os.path.join(project_root, 'models', 'refining_model.joblib')
metadata_path = os.path.join(project_root, 'models', 'refining_model_metadata.json')
metrics_path = os.path.join(project_root, 'models', 'refining_model_metrics.json')  # optional

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
target_names = None
model = None
metadata = None
metrics = None
preprocessing_metadata = None

@app.on_event("startup")
async def startup_event():
    global preprocessor, feature_names, target_names, model, metadata, metrics, preprocessing_metadata
    try:
        if os.path.exists(preprocessor_path):
            preprocessor = joblib.load(preprocessor_path)
            # Patch encoders for sklearn version compatibility
            _patch_sklearn_encoders(preprocessor)
        if os.path.exists(feature_names_path):
            feature_names = joblib.load(feature_names_path)
        if os.path.exists(target_names_path):
            target_names = joblib.load(target_names_path)
        if os.path.exists(model_path):
            model = joblib.load(model_path)
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        if os.path.exists(metrics_path):
            try:
                with open(metrics_path, 'r') as f:
                    metrics = json.load(f)
            except Exception:
                metrics = None
        pm_path = os.path.join(project_root, 'preprocessing', 'refining_metadata.joblib')
        if os.path.exists(pm_path):
            try:
                preprocessing_metadata = joblib.load(pm_path)
                logger.info("Loaded preprocessing metadata for refining")
            except Exception:
                preprocessing_metadata = None
        logger.info("Refining artifacts loaded")
    except Exception as e:
        logger.error(f"Error loading refining artifacts: {e}")
        preprocessor = feature_names = target_names = model = metadata = None

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
class RefiningInput(BaseModel):
    refining_process_Crushing: Optional[int] = Field(0, ge=0, le=1)
    refining_process_Digestion: Optional[int] = Field(0, ge=0, le=1)
    refining_process_Clarification: Optional[int] = Field(0, ge=0, le=1)
    refining_process_Precipitation: Optional[int] = Field(0, ge=0, le=1)
    refining_process_Calcination: Optional[int] = Field(0, ge=0, le=1)
    refining_variant_High_pressure_digestion: Optional[int] = Field(0, ge=0, le=1)
    refining_variant_Multi_stage_clarification: Optional[int] = Field(0, ge=0, le=1)
    refining_variant_Heat_recovery_loops: Optional[int] = Field(0, ge=0, le=1)
    refining_variant_Green_additives: Optional[int] = Field(0, ge=0, le=1)
    refining_variant_Automation_sensors: Optional[int] = Field(0, ge=0, le=1)
    refining_digestion_temperature_C: Optional[float] = Field(None, ge=0)
    refining_digestion_pressure_bar: Optional[float] = Field(None, ge=0)
    refining_caustic_concentration_gL: Optional[float] = Field(None, ge=0)
    refining_process_intensity_factor: Optional[float] = Field(None, ge=0, le=1)
    refining_tech_improvement_factor: Optional[float] = Field(None, ge=0, le=1)
    refining_operational_variability: Optional[float] = Field(None, ge=0, le=1)
    location: Optional[str] = None
    toxicity_Red_Mud: Optional[str] = None

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

def _map_wizard_refining_to_model_input(refining: Dict[str, Any]) -> RefiningInput:
    """Map wizard refining object to model input schema."""
    if not refining:
        return RefiningInput()
    
    processes = refining.get('processes', [])
    if not isinstance(processes, list):
        processes = []
    pset = set(str(x).lower() for x in processes)
    
    crushing = 1 if any('crushing' in x for x in pset) else 0
    digestion = 1 if any('digestion' in x for x in pset) else 0
    clarification = 1 if any('clarification' in x for x in pset) else 0
    precipitation = 1 if any('precipitation' in x for x in pset) else 0
    calcination = 1 if any('calcination' in x for x in pset) else 0
    
    variants = refining.get('variants', refining.get('variantFeatures', []))
    if not isinstance(variants, list):
        variants = []
    vset = set(str(x).lower() for x in variants)
    
    high_pressure = 1 if any('high' in x and 'pressure' in x for x in vset) else 0
    multi_stage = 1 if any('multi' in x and 'stage' in x for x in vset) else 0
    heat_recovery = 1 if any('heat' in x and 'recovery' in x for x in vset) else 0
    green_add = 1 if any('green' in x and 'additive' in x for x in vset) else 0
    automation = 1 if any('automation' in x or 'sensor' in x for x in vset) else 0
    
    # Map numeric fields with multiple possible keys
    temp = refining.get('digestionTemperature', refining.get('refining_digestion_temperature_C'))
    pressure = refining.get('digestionPressure', refining.get('refining_digestion_pressure_bar'))
    caustic = refining.get('causticConcentration', refining.get('refining_caustic_concentration_gL'))
    intensity = refining.get('processIntensityFactor', refining.get('refining_process_intensity_factor'))
    tech_improve = refining.get('techImprovementFactor', refining.get('refining_tech_improvement_factor'))
    variability = refining.get('operationalVariability', refining.get('refining_operational_variability'))
    
    # Get location with multiple possible keys
    location = refining.get('location', refining.get('refining_location'))
    
    # Get toxicity with multiple possible keys
    toxicity = refining.get('redMudToxicity', refining.get('toxicityRedMud', refining.get('toxicity_Red_Mud')))
    
    # If location is still None, try to get a default from available locations in feature_names
    if not location and feature_names:
        available_locations = [fn.replace('location_', '') for fn in feature_names if fn.startswith('location_')]
        if available_locations:
            location = available_locations[0]  # Use first available location as default
    
    return RefiningInput(
        refining_process_Crushing=crushing,
        refining_process_Digestion=digestion,
        refining_process_Clarification=clarification,
        refining_process_Precipitation=precipitation,
        refining_process_Calcination=calcination,
        refining_variant_High_pressure_digestion=high_pressure,
        refining_variant_Multi_stage_clarification=multi_stage,
        refining_variant_Heat_recovery_loops=heat_recovery,
        refining_variant_Green_additives=green_add,
        refining_variant_Automation_sensors=automation,
        refining_digestion_temperature_C=temp,
        refining_digestion_pressure_bar=pressure,
        refining_caustic_concentration_gL=caustic,
        refining_process_intensity_factor=intensity,
        refining_tech_improvement_factor=tech_improve,
        refining_operational_variability=variability,
        location=location,
        toxicity_Red_Mud=toxicity,
    )

@app.get("/")
async def root():
    return {"message": "Refining Stage Prediction API", "status": "healthy"}

@app.get("/health")
async def health_check():
    status = "ready" if model and preprocessor else "degraded"
    db = await get_mongo_db()
    return {
        "status": status,
        "model_loaded": model is not None,
        "preprocessor_loaded": preprocessor is not None,
        "feature_names_loaded": feature_names is not None,
        "target_names_loaded": target_names is not None,
        "database_configured": db is not None,
    }

@app.get("/model-info")
async def model_info():
    if metadata is None:
        raise HTTPException(status_code=503, detail="Model metadata not available")
    return {
        "model_type": metadata.get('model_type', 'gradient_boosting'),
        "targets": metadata.get('target_names', target_names or []),
        "training_date": metadata.get('training_date', 'unknown'),
        "dataset_size": metadata.get('dataset_size', 'unknown')
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
    """Build a row dict that matches the model's expected feature space (feature_names).
    This bypasses the sklearn preprocessor entirely to avoid cross-version encoder issues.
    Rules:
    - Fill one-hot location_* columns from input 'location' (default to first known or 'Chhattisgarh').
    - Encode toxicity_Red_Mud: Low=0, Moderate=1, High=2 (default Moderate).
    - For numeric features: use provided value; if missing, use median from preprocessing_metadata if available, else 0.
    """
    cols = feature_names or []
    row: Dict[str, Any] = {}

    # Prepare helpers
    loc_value = input_dict.get('location')
    if not loc_value:
        avail_locs = [c for c in cols if isinstance(c, str) and c.startswith('location_')]
        if avail_locs:
            try:
                loc_value = avail_locs[0].replace('location_', '')
            except Exception:
                loc_value = 'Chhattisgarh'
        else:
            loc_value = 'Chhattisgarh'
    tox_value = input_dict.get('toxicity_Red_Mud', input_dict.get('redMudToxicity')) or 'Moderate'
    tox_map = {'low': 0, 'moderate': 1, 'high': 2}

    # Numeric medians if present
    numeric_medians: Dict[str, Any] = {}
    try:
        if preprocessing_metadata and isinstance(preprocessing_metadata, dict):
            # accept either numeric_stats.{field}.median or numeric_medians[field]
            stats = preprocessing_metadata.get('numeric_stats', {})
            if isinstance(stats, dict):
                for k, v in stats.items():
                    if isinstance(v, dict) and 'median' in v:
                        numeric_medians[k] = v['median']
            nm = preprocessing_metadata.get('numeric_medians', {})
            if isinstance(nm, dict):
                numeric_medians.update(nm)
    except Exception:
        pass

    for feat in cols:
        if isinstance(feat, str) and feat.startswith('location_'):
            loc_name = feat.replace('location_', '')
            row[feat] = 1 if (isinstance(loc_value, str) and loc_value == loc_name) else 0
        elif feat == 'toxicity_Red_Mud':
            row[feat] = tox_map.get(str(tox_value).lower(), 1)
        else:
            val = input_dict.get(feat, None)
            if val is None:
                # Try median fallback by matching feature name
                val = numeric_medians.get(feat, 0)
            row[feat] = val

    return row

@app.post("/predict", response_model=PredictionResponse)
async def predict(input_data: RefiningInput):
    if any(v is None for v in [preprocessor, feature_names, target_names, model]):
        raise HTTPException(status_code=503, detail="Model artifacts not loaded")
    try:
        input_dict = input_data.dict()
        raw_row = _build_input_row(input_dict)
        # Directly build the model input in the transformed feature space; skip preprocessor to avoid version issues
        df_input = pd.DataFrame([raw_row], columns=feature_names)
        y_pred = model.predict(df_input)
        
        predictions: Dict[str, TargetPrediction] = {}
        for i, target in enumerate(target_names):
            pred_value = float(y_pred[0, i])
            # Simple confidence estimate based on RMSE if available
            conf = None
            rmse_val = None
            if metrics and target in metrics:
                if 'RMSE' in metrics[target]:
                    rmse_val = metrics[target]['RMSE']
                    conf = 1 / (1 + rmse_val) if rmse_val else None
            # Simple interval: ±10%
            lower = pred_value * 0.9
            upper = pred_value * 1.1
            predictions[target] = TargetPrediction(
                prediction=round(pred_value, 4),
                confidence=round(conf, 4) if conf else None,
                rmse=round(rmse_val, 4) if rmse_val else None,
                mae=None,
                interval=IntervalEstimate(lower=round(lower, 4), upper=round(upper, 4))
            )
        
        return PredictionResponse(
            predictions=predictions,
            input_used=input_dict,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logger.error(f"Refining prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

@app.get("/wizard/{workflow_id}/refining")
async def get_wizard_refining(workflow_id: str):
    """Retrieve the refining object from a wizard workflow."""
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
        ref = wf.get("refining", {}) or {}
        return {
            "collection": coll_name,
            "workflowId": str(wf.get("_id")),
            "userId": str(wf.get("userId")),
            "metalType": wf.get("metalType"),
            "name": wf.get("name"),
            "refining": ref
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching refining workflow: {e}")
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

@app.get("/wizard/{workflow_id}/refining/metadata")
async def analyze_refining_metadata(workflow_id: str):
    """
    Analyze the refining object to identify missing attributes and propose defaults.
    This endpoint helps identify what data needs to be filled before prediction.
    """
    db = await get_mongo_db()
    if db is None or ObjectId is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        oid = ObjectId(workflow_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid workflow_id format")
    
    # Fetch workflow
    wf = None
    wf = await db["wizardworkflows"].find_one({"_id": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflows"].find_one({"_id": oid})
    if not wf:
        wf = await db["wizardworkflows"].find_one({"workflowId": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflows"].find_one({"workflowId": oid})
    if not wf:
        wf = await db["wizardworkflowoutputs"].find_one({"_id": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflowoutputs"].find_one({"_id": oid})
    if not wf:
        wf = await db["wizardworkflowoutputs"].find_one({"workflowId": oid}) if _MONGO_DRIVER == 'motor' else db["wizardworkflowoutputs"].find_one({"workflowId": oid})
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    ref_raw = wf.get("refining", {}) or {}
    
    # Define expected fields with their types
    expected_fields = {
        "location": "string",
        "digestionTemperature": "number",
        "digestionPressure": "number",
        "causticConcentration": "number",
        "processIntensityFactor": "number",
        "techImprovementFactor": "number",
        "operationalVariability": "number",
        "redMudToxicity": "string (enum)",
        "processes": "array",
        "variants": "array"
    }
    
    # Identify missing fields
    missing_fields = []
    present_fields = []
    
    for field, field_type in expected_fields.items():
        value = ref_raw.get(field)
        if value is None or (isinstance(value, list) and len(value) == 0):
            missing_fields.append({
                "name": field,
                "type": field_type,
                "status": "missing"
            })
        else:
            present_fields.append({
                "name": field,
                "type": field_type,
                "status": "present",
                "currentValue": value
            })
    
    # Extract available locations from feature names
    available_locations = [fn for fn in feature_names if fn.startswith("location_")]
    available_locations = [loc.replace("location_", "") for loc in available_locations]
    
    # Propose defaults
    proposed_defaults = {
        "redMudToxicity": "Moderate",  # Default toxicity level
        "processes": [],  # Empty list, user should select from: crushing, digestion, clarification, precipitation, calcination
        "variants": [],  # Empty list, user should select from: high_pressure, multi_stage, heat_recovery, green_add, automation
        "digestionTemperature": None,  # Numeric, user should provide or use median from training
        "digestionPressure": None,
        "causticConcentration": None,
        "processIntensityFactor": None,
        "techImprovementFactor": None,
        "operationalVariability": None,
        "location": None  # User should select from available_locations
    }
    
    # If preprocessing metadata has medians, use them
    if preprocessing_metadata:
        numeric_stats = preprocessing_metadata.get("numeric_stats", {})
        for field in ["digestionTemperature", "digestionPressure", "causticConcentration", 
                     "processIntensityFactor", "techImprovementFactor", "operationalVariability"]:
            field_stats = numeric_stats.get(field, {})
            if "median" in field_stats:
                proposed_defaults[field] = field_stats["median"]
    
    return {
        "workflowId": workflow_id,
        "refiningObject": ref_raw,
        "analysis": {
            "totalExpectedFields": len(expected_fields),
            "presentFields": len(present_fields),
            "missingFields": len(missing_fields)
        },
        "presentFields": present_fields,
        "missingFields": missing_fields,
        "proposedDefaults": proposed_defaults,
        "availableOptions": {
            "locations": available_locations,
            "toxicityLevels": ["Low", "Moderate", "High"],
            "processes": ["crushing", "digestion", "clarification", "precipitation", "calcination"],
            "variants": ["high_pressure", "multi_stage", "heat_recovery", "green_add", "automation"]
        },
        "message": "Fill missing fields before calling predict-and-save. The predict-and-save endpoint will use these defaults if fields remain missing."
    }

@app.post("/wizard/{workflow_id}/refining/predict-and-save")
async def predict_refining_and_save(workflow_id: str):
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
        ref_raw = wf.get("refining", {}) or {}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading workflow: {e}")
        raise HTTPException(status_code=500, detail="Error reading workflow")
    # Default enrichment for refining
    # Get first available location from feature_names (use Chhattisgarh as default Indian state)
    default_location = "Chhattisgarh"  # Fallback to first Indian state
    if feature_names:
        available_locations = [fn.replace('location_', '') for fn in feature_names if fn.startswith('location_')]
        if available_locations:
            default_location = available_locations[0]
    
    enrichment_defaults = {
        "redMudToxicity": "Moderate",
        "processes": [],
        "variants": [],
        "location": default_location,
    }
    # Add numeric defaults from preprocessing metadata if available
    if preprocessing_metadata:
        numeric_stats = preprocessing_metadata.get("numeric_stats", {})
        for field in ["digestionTemperature", "digestionPressure", "causticConcentration", 
                     "processIntensityFactor", "techImprovementFactor", "operationalVariability"]:
            field_stats = numeric_stats.get(field, {})
            if "median" in field_stats:
                enrichment_defaults[field] = field_stats["median"]
    
    # Apply defaults only for missing fields
    for k, v in enrichment_defaults.items():
        if k not in ref_raw or ref_raw.get(k) is None:
            ref_raw[k] = v
    input_model = _map_wizard_refining_to_model_input(ref_raw)
    # Predict using /predict logic
    # Call predict (which includes defensive encoder patching)
    pred_resp = await predict(input_model)
    predicted_fields = list(pred_resp.predictions.keys())
    avg_conf = float(np.mean([p.confidence for p in pred_resp.predictions.values() if p.confidence is not None])) if predicted_fields else 0.0
    ref_updates: Dict[str, Any] = {}
    ai_predictions: Dict[str, Any] = {}
    for target_name, meta in pred_resp.predictions.items():
        ref_updates[target_name] = meta.prediction
        ai_predictions[target_name] = {
            "prediction": meta.prediction,
            "confidence": meta.confidence,
            "interval": meta.interval.model_dump() if meta.interval else None
        }
    set_ops: Dict[str, Any] = {}
    for field_name, value in ref_updates.items():
        set_ops[f"refining.{field_name}"] = value
    set_ops["refining.aiPredictions"] = ai_predictions
    set_ops["predictionMetadata.generatedAt"] = datetime.utcnow()
    set_ops["updatedAt"] = datetime.utcnow()
    set_ops["status"] = wf.get("status", "submitted")
    try:
        workflows = db[coll_name]
        if _MONGO_DRIVER == 'motor':
            await workflows.update_one({"_id": wf["_id"]}, {"$pull": {"predictionMetadata.stepsWithPredictions": {"stepName": "refining"}}})
            await workflows.update_one({"_id": wf["_id"]}, {"$set": set_ops})
            await workflows.update_one({"_id": wf["_id"]}, {"$push": {"predictionMetadata.stepsWithPredictions": {"stepName": "refining", "predictedFields": [f"refining.{f}" for f in predicted_fields], "confidence": avg_conf}}})
        elif MongoClient is not None:
            workflows.update_one({"_id": wf["_id"]}, {"$pull": {"predictionMetadata.stepsWithPredictions": {"stepName": "refining"}}})
            workflows.update_one({"_id": wf["_id"]}, {"$set": set_ops})
            workflows.update_one({"_id": wf["_id"]}, {"$push": {"predictionMetadata.stepsWithPredictions": {"stepName": "refining", "predictedFields": [f"refining.{f}" for f in predicted_fields], "confidence": avg_conf}}})
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
        "updatedFields": [f"refining.{f}" for f in predicted_fields],
        "avgConfidence": round(avg_conf,3),
        "inputUsed": input_model.dict(),
        "timestamp": pred_resp.timestamp,
        "metadataUpdated": True,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
