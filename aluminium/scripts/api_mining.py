import os
import joblib
import json
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime

# Optional .env loader (non-fatal if missing)
try:
    from dotenv import load_dotenv  # type: ignore
except Exception:  # pragma: no cover
    load_dotenv = None  # type: ignore

# Optional MongoDB client(s)
try:
    from motor.motor_asyncio import AsyncIOMotorClient  # type: ignore
    _MONGO_DRIVER = 'motor'
except Exception:  # pragma: no cover - fall back to pymongo
    AsyncIOMotorClient = None  # type: ignore
    _MONGO_DRIVER = None
try:
    from pymongo import MongoClient  # type: ignore
    from bson import ObjectId  # type: ignore
except Exception:  # pragma: no cover - if not installed, DB features disabled
    MongoClient = None  # type: ignore
    ObjectId = None  # type: ignore

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Mining Stage Prediction API",
    description="API for predicting mining stage parameters in LCA calculations and saving to Mongo",
)



# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
repo_root = os.path.abspath(os.path.join(project_root, '..'))
preprocessor_path = os.path.join(project_root, 'preprocessing', 'mining_preprocessor.joblib')
feature_names_path = os.path.join(project_root, 'preprocessing', 'mining_feature_names.joblib')
model_path = os.path.join(project_root, 'models', 'mining_model.joblib')
metrics_path = os.path.join(project_root, 'models', 'mining_model_metrics.json')

# Best-effort: load environment from server/.env and repo .env if available
if load_dotenv is not None:
    # Load server/.env first (backend canonical location)
    server_env_path = os.path.join(repo_root, 'server', '.env')
    root_env_path = os.path.join(repo_root, '.env')
    try:
        if os.path.exists(server_env_path):
            load_dotenv(server_env_path)
        if os.path.exists(root_env_path):
            load_dotenv(root_env_path)
    except Exception:
        pass

# Load objects at startup (with error handling)
try:
    preprocessor = joblib.load(preprocessor_path)
    feature_names = joblib.load(feature_names_path)
    model = joblib.load(model_path)
    with open(metrics_path) as f:
        metrics = json.load(f)
    logger.info("Successfully loaded all model artifacts")
except Exception as e:
    logger.error(f"Error loading model artifacts: {e}")
    # Set to None to avoid startup crashes, but API endpoints will check this
    preprocessor = None
    feature_names = None
    model = None
    metrics = None
    preprocessing_metadata = None

# Try to load optional preprocessing metadata (non-fatal)
try:
    pm_path = os.path.join(project_root, 'preprocessing', 'mining_metadata.joblib')
    if os.path.exists(pm_path):
        preprocessing_metadata = joblib.load(pm_path)
        logger.info("Loaded preprocessing metadata for mining")
    else:
        preprocessing_metadata = None
except Exception:
    preprocessing_metadata = None

# ------------------------------
# Optional MongoDB configuration
# ------------------------------
def _get_mongo_uri() -> Optional[str]:
    """Fetch Mongo URI dynamically so late-loaded env works too."""
    uri = os.getenv("MONGO_URI")
    # Trim whitespace if accidental spaces in .env like "MONGO_URI= mongodb..."
    if uri:
        uri = uri.strip()
    return uri

MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")  # optional; if none, will use DB in URI
_mongo_client = None
_mongo_db = None

async def get_mongo_db():
    """Lazily initialize and return an async MongoDB database handle if possible.
    Falls back to sync client if motor isn't available. If neither is available or MONGO_URI is not set, returns None.
    """
    global _mongo_client, _mongo_db
    MONGO_URI = _get_mongo_uri()
    if not MONGO_URI:
        return None

    # Prefer motor (async)
    if AsyncIOMotorClient is not None:
        if _mongo_client is None:
            try:
                _mongo_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
                # Trigger server selection to validate connection once lazily
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

    # Fallback to pymongo (sync) wrapped by simple proxy methods
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

# Define request schema
class MiningInput(BaseModel):
    mining_method: Optional[List[str]] = None
    mining_equipment_type: Optional[str] = None
    mining_ore_grade_percent: Optional[float] = None
    mining_overburden_ratio: Optional[float] = None
    mining_water_m3_per_t_ore: Optional[float] = None
    mining_land_use_impact: Optional[str] = None
    location: Optional[str] = None
    year: Optional[int] = None

class IntervalEstimate(BaseModel):
    lower: float
    upper: float

class TargetPrediction(BaseModel):
    prediction: float
    confidence: float
    rmse: float
    mae: float
    interval: IntervalEstimate

class PredictionResponse(BaseModel):
    predictions: Dict[str, TargetPrediction]
    input_used: Dict[str, Any]
    timestamp: str


def _map_wizard_mining_to_model_input(mining: Dict[str, Any]) -> MiningInput:
    """Map WizardWorkflow.mining fields to MiningInput schema."""
    if not mining:
        return MiningInput()

    # Map applicableProcesses to canonical labels used in training
    method_map = {
        'openPit': 'Open Pit',
        'strip': 'Strip',
        'drilling': 'Drilling & Blasting',
        'drilling_blasting': 'Drilling & Blasting',
        'hydraulic': 'Hydraulic',
        'manual': 'Manual',
    }
    mining_method = None
    if isinstance(mining.get('applicableProcesses'), list):
        mining_method = []
        for m in mining['applicableProcesses']:
            canon = method_map.get(str(m))
            if canon and canon not in mining_method:
                mining_method.append(canon)
        if not mining_method:
            mining_method = None

    # Equipment type mapping to model categories
    equip_map = {
        'diesel': 'Diesel',
        'electric': 'Electric',
        'hybrid': 'Hybrid',
    }
    mining_equipment_type = equip_map.get(str(mining.get('typeOfEquipment'))) if mining.get('typeOfEquipment') else None

    # Numeric mappings
    mining_ore_grade_percent = mining.get('oreGrade')
    mining_overburden_ratio = mining.get('overburdenRatio')

    # Prefer waterUsage, fallback to waterConsumption
    mining_water_m3_per_t_ore = mining.get('waterUsage', None)
    if mining_water_m3_per_t_ore is None:
        mining_water_m3_per_t_ore = mining.get('waterConsumption')

    # Biodiversity impact -> approximate land-use impact
    impact = mining.get('biodiversityImpact')
    impact_map = {
        'low': 'Low',
        'moderate': 'Moderate',
        'high': 'High',
        'severe': 'High',  # map severe to High conservatively
    }
    mining_land_use_impact = impact_map.get(str(impact)) if impact else None

    location = mining.get('location')
    year = mining.get('year')

    return MiningInput(
        mining_method=mining_method,
        mining_equipment_type=mining_equipment_type,
        mining_ore_grade_percent=mining_ore_grade_percent,
        mining_overburden_ratio=mining_overburden_ratio,
        mining_water_m3_per_t_ore=mining_water_m3_per_t_ore,
        mining_land_use_impact=mining_land_use_impact,
        location=location,
        year=year,
    )

@app.get("/")
async def root():
    return {"message": "Mining Stage Prediction API", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Check if the API and model are ready"""
    # Return degraded status instead of 503 so frontend can still connect
    status = "ready" if model is not None and preprocessor is not None else "degraded"
    db = await get_mongo_db()
    return {
        "status": status,
        "model_loaded": model is not None,
        "preprocessor_loaded": preprocessor is not None,
        "database_configured": db is not None,
    }
    

@app.get("/model-info")
async def model_info():
    """Get information about the loaded model"""
    if metrics is None:
        raise HTTPException(status_code=503, detail="Model metrics not available")
    
    return {
        "model_type": "GradientBoostingRegressor",
        "targets": list(metrics.keys()) if 'cross_validation' not in metrics else [k for k in metrics.keys() if k != 'cross_validation'],
        "performance_metrics": metrics,
        "feature_names": feature_names if feature_names else []
    }


@app.get("/features")
async def get_features():
    """Return information about expected input features and types."""
    if feature_names is None:
        raise HTTPException(status_code=503, detail="Feature names not available")
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
    return {'features': features_info}

@app.post("/predict", response_model=PredictionResponse)
async def predict_mining(input_data: MiningInput):
    """
    Predict missing mining parameters based on provided inputs
    """
    # Check if model is loaded
    if model is None or preprocessor is None or feature_names is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please try again later.")
    
    try:
        logger.info(f"Received prediction request: {input_data.dict()}")

        # Build RAW input row matching the preprocessor's expected columns
        # Note: The preprocessor selects columns like 'location', 'mining_method', 'mining_equipment_type', etc.
        # Provide those raw columns here and let the preprocessor handle encoding.
        # If multiple methods provided, pick the first for categorical encoding
        method_value = None
        if input_data.mining_method:
            method_value = input_data.mining_method[0]

        # Ensure categorical defaults are KNOWN strings that were seen during training
        # Known sets from training/code: 
        #   mining_equipment_type: ['Diesel','Electric','Hybrid']
        #   mining_land_use_impact: ['Low','Moderate','High'] (string, not numeric)
        equip_value = input_data.mining_equipment_type if input_data.mining_equipment_type in ['Diesel','Electric','Hybrid'] else 'Diesel'
        land_use_value = input_data.mining_land_use_impact if input_data.mining_land_use_impact in ['Low','Moderate','High'] else 'Moderate'

        raw_row: Dict[str, Any] = {
            'mining_method': method_value,
            'mining_equipment_type': equip_value,
            'location': input_data.location,
            'mining_ore_grade_percent': input_data.mining_ore_grade_percent,
            'mining_overburden_ratio': input_data.mining_overburden_ratio,
            'mining_water_m3_per_t_ore': input_data.mining_water_m3_per_t_ore,
            'mining_land_use_impact': land_use_value,
            'year': input_data.year if input_data.year else 2022,
        }

        # Fill missing raw fields with safe defaults
        for k, v in list(raw_row.items()):
            if v is None:
                if k in ['mining_ore_grade_percent', 'mining_overburden_ratio', 'mining_water_m3_per_t_ore']:
                    # Use medians if available
                    if preprocessing_metadata and 'numeric_medians' in preprocessing_metadata and k in preprocessing_metadata['numeric_medians']:
                        raw_row[k] = preprocessing_metadata['numeric_medians'][k]
                    else:
                        raw_row[k] = 0.0
                elif k in ['mining_method', 'mining_equipment_type', 'location']:
                    # Keep known safe defaults for categoricals
                    if k == 'mining_method':
                        raw_row[k] = 'Open Pit'
                    elif k == 'mining_equipment_type':
                        raw_row[k] = 'Diesel'
                    elif k == 'location':
                        raw_row[k] = 'Odisha'

        df_input = pd.DataFrame([raw_row])

        # Apply preprocessing (which handles encoding/ordinal/numerics)
        X_input = preprocessor.transform(df_input)
        
        # Predict missing fields
        y_pred = model.predict(X_input)[0]
        
        # Prepare response with predictions
        target_cols = [
            'mining_energy_MJ_per_t_ore', 
            'mining_co2_kg_per_t_ore',
            'mining_sox_kg_per_t_ore', 
            'mining_nox_kg_per_t_ore', 
            'mining_pm_kg_per_t_ore'
        ]
        
        predictions = {}
        for i, target in enumerate(target_cols):
            pred_value = float(y_pred[i])
            rmse = metrics[target]['RMSE'] if target in metrics else 0
            mae = metrics[target]['MAE'] if target in metrics else 0
            
            # Confidence estimation based on error metrics
            confidence = max(0.0, min(1.0, 1 - (mae / (mae + abs(pred_value) + 1e-10))))
            lower = pred_value * 0.9
            upper = pred_value * 1.1
            predictions[target] = {
                'prediction': round(pred_value, 3),
                'confidence': round(confidence, 3),
                'rmse': round(rmse, 3),
                'mae': round(mae, 3),
                'interval': {'lower': round(lower, 3), 'upper': round(upper, 3)}
            }
        
        # Prepare response
        response = PredictionResponse(
            predictions=predictions,
            input_used=input_data.dict(),
            timestamp=datetime.now().isoformat()
        )
        
        logger.info(f"Prediction completed successfully")
        return response

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/wizard/{workflow_id}/mining")
async def get_wizard_mining(workflow_id: str):
    """Fetch mining step data from WizardWorkflow by ID (Mongo)."""
    db = await get_mongo_db()
    if db is None or ObjectId is None:
        raise HTTPException(status_code=503, detail="Database not configured for this service")

    try:
        wf = await db["wizardworkflows"].find_one({"_id": ObjectId(workflow_id)}) if _MONGO_DRIVER == 'motor' else db["wizardworkflows"].find_one({"_id": ObjectId(workflow_id)})
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")
        mining = wf.get("mining", {})
        return {"workflowId": str(wf.get("_id")), "userId": str(wf.get("userId")), "metalType": wf.get("metalType"), "name": wf.get("name"), "mining": mining}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workflow: {e}")
        raise HTTPException(status_code=500, detail="Error fetching workflow")


@app.post("/wizard/{workflow_id}/mining/predict-and-save")
async def predict_from_wizard_and_save(workflow_id: str):
    """
    Read mining data from WizardWorkflow (Mongo), run prediction, and UPDATE THE SAME DOCUMENT
    in place by adding predicted mining fields + metadata. Returns predictions and update status.
    """
    # Step 1: Fetch workflow and mining data from wizardworkflows
    db = await get_mongo_db()
    if db is None or ObjectId is None:
        raise HTTPException(status_code=503, detail="Database not configured; cannot read or update workflow")

    try:
        wf = await db["wizardworkflows"].find_one({"_id": ObjectId(workflow_id)}) if _MONGO_DRIVER == 'motor' else db["wizardworkflows"].find_one({"_id": ObjectId(workflow_id)})
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")
        mining_raw = wf.get("mining", {}) or {}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading workflow: {e}")
        raise HTTPException(status_code=500, detail="Error reading workflow")

    # Step 2: Backfill missing model input fields into mining_raw (non-destructive defaults)
    # We do not overwrite existing keys; just ensure presence for traceability
    enrichment_defaults = {
        "overburdenRatio": None,
        "waterUsage": None,
        "biodiversityImpact": None,
        "year": datetime.utcnow().year,
        "typeOfEquipment": None,
    }
    for k, v in enrichment_defaults.items():
        if k not in mining_raw:
            mining_raw[k] = v

    # Step 3: Map mining_raw to model input schema
    input_model = _map_wizard_mining_to_model_input(mining_raw)

    # Step 4: Predict using existing logic
    pred_resp = await predict_mining(input_model)

    # Step 5: Compute aggregate confidence
    predicted_fields = list(pred_resp.predictions.keys())
    avg_conf = float(np.mean([pred_resp.predictions[k].confidence for k in predicted_fields])) if predicted_fields else 0.0

    # Step 6: Prepare update document (flatten numeric predictions + optional aiPredictions)
    mining_updates = {}
    for target_name, meta in pred_resp.predictions.items():
        # Store the raw prediction under its target field name for consistency
        mining_updates[target_name] = float(meta.prediction)

    # Attach aiPredictions detailed structure (convert Pydantic models to dicts)
    mining_updates["aiPredictions"] = {k: v.model_dump() for k, v in pred_resp.predictions.items()}

    # Build $set operations
    set_ops = {}
    # Preserve existing mining content + add/update predicted fields
    for field_name, value in mining_updates.items():
        set_ops[f"mining.{field_name}"] = value

    # Metadata placement: top-level predictionMetadata similar to wizardworkflowoutputs pattern
    set_ops["predictionMetadata.generatedAt"] = datetime.utcnow()
    set_ops["updatedAt"] = datetime.utcnow()
    set_ops["status"] = wf.get("status", "submitted")  # retain existing status unless present

    # Step 7: Execute update (remove previous mining step, add fresh one)
    try:
        if _MONGO_DRIVER == 'motor':
            workflows = db["wizardworkflows"]
            # Pull old mining step if any
            await workflows.update_one({"_id": wf["_id"]}, {"$pull": {"predictionMetadata.stepsWithPredictions": {"stepName": "mining"}}})
            # Apply set operations
            await workflows.update_one({"_id": wf["_id"]}, {"$set": set_ops})
            # Push new mining step
            await workflows.update_one({"_id": wf["_id"]}, {"$push": {"predictionMetadata.stepsWithPredictions": {"stepName": "mining", "predictedFields": predicted_fields, "confidence": avg_conf}}})
        elif MongoClient is not None:
            workflows = db["wizardworkflows"]
            workflows.update_one({"_id": wf["_id"]}, {"$pull": {"predictionMetadata.stepsWithPredictions": {"stepName": "mining"}}})
            workflows.update_one({"_id": wf["_id"]}, {"$set": set_ops})
            workflows.update_one({"_id": wf["_id"]}, {"$push": {"predictionMetadata.stepsWithPredictions": {"stepName": "mining", "predictedFields": predicted_fields, "confidence": avg_conf}}})
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
        "updatedFields": predicted_fields,
        "avgConfidence": round(avg_conf, 3),
        "inputUsed": input_model.dict(),
        "timestamp": pred_resp.timestamp,
        "metadataUpdated": True,
    }


if __name__ == "__main__":
    import uvicorn
    print("Starting Mining Prediction API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)