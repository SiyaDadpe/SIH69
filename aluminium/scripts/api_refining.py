import os
import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Refining LCA API",
    description="API for predicting refining stage parameters in LCA calculations",
    version="1.0.0"
)

# Paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
preprocessor_path = os.path.join(project_root, 'preprocessing', 'refining_preprocessor.joblib')
feature_names_path = os.path.join(project_root, 'preprocessing', 'refining_feature_names.joblib')
target_names_path = os.path.join(project_root, 'preprocessing', 'refining_target_names.joblib')
model_path = os.path.join(project_root, 'models', 'refining_model.joblib')
metrics_path = os.path.join(project_root, 'models', 'refining_model_metrics.json')
metadata_path = os.path.join(project_root, 'models', 'refining_model_metadata.json')

# Globals
preprocessor = None
feature_names = None
target_names = None
model = None
metrics = None
metadata = None

@app.on_event("startup")
def load_artifacts():
    global preprocessor, feature_names, target_names, model, metrics, metadata
    try:
        # Load artifacts but do not crash the process if some are missing
        if os.path.exists(preprocessor_path):
            preprocessor = joblib.load(preprocessor_path)
        if os.path.exists(feature_names_path):
            feature_names = joblib.load(feature_names_path)
        if os.path.exists(target_names_path):
            target_names = joblib.load(target_names_path)
        if os.path.exists(model_path):
            model = joblib.load(model_path)
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                metrics = json.load(f)
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        logger.info("Refining artifacts loaded (where available).")
    except Exception as e:
        logger.error(f"Error loading artifacts: {e}")
        # Keep going; endpoints will check availability
        preprocessor = None
        feature_names = None
        target_names = None
        model = None
        metrics = None
        metadata = None


@app.get("/features")
def features():
    if feature_names is None:
        raise HTTPException(status_code=503, detail="Feature names not loaded")
    features = []
    # Best-effort: mark ordinal for toxicity and binary for variants
    for feat in feature_names:
        ftype = 'numeric'
        if feat.startswith('refining_variant_') or feat.startswith('refining_process_'):
            ftype = 'binary'
        if feat == 'toxicity_Red_Mud':
            ftype = 'ordinal'
        features.append({'name': feat, 'type': ftype})
    return {'features': features}

# Pydantic input model
class RefiningInput(BaseModel):
    # Define optional fields for common inputs
    refining_process_Crushing: Optional[int] = Field(default=0)
    refining_process_Digestion: Optional[int] = Field(default=0)
    refining_process_Clarification: Optional[int] = Field(default=0)
    refining_process_Precipitation: Optional[int] = Field(default=0)
    refining_process_Calcination: Optional[int] = Field(default=0)
    refining_variant_High_pressure_digestion: Optional[int] = Field(default=0)
    refining_variant_Multi_stage_clarification: Optional[int] = Field(default=0)
    refining_variant_Heat_recovery_loops: Optional[int] = Field(default=0)
    refining_variant_Green_additives: Optional[int] = Field(default=0)
    refining_variant_Automation_sensors: Optional[int] = Field(default=0)
    refining_digestion_temperature_C: Optional[float] = Field(default=None)
    refining_digestion_pressure_bar: Optional[float] = Field(default=None)
    refining_caustic_concentration_gL: Optional[float] = Field(default=None)
    refining_process_intensity_factor: Optional[float] = Field(default=None)
    refining_tech_improvement_factor: Optional[float] = Field(default=None)
    refining_operational_variability: Optional[float] = Field(default=None)
    location: Optional[str] = Field(default=None)
    toxicity_Red_Mud: Optional[str] = Field(default=None)

@app.get("/")
def root():
    return {"message": "Refining LCA API is running"}

@app.get("/health")
def health():
    ready = all(v is not None for v in [preprocessor, feature_names, target_names, model, metrics, metadata])
    return {"status": "ready" if ready else "not ready"}

@app.get("/model-info")
def model_info():
    if metadata is None:
        raise HTTPException(status_code=503, detail="Metadata not available")
    return {
        "model_type": metadata.get("model_type", "unknown"),
        "targets": metadata.get("target_names", []),
        "training_date": metadata.get("training_date", "unknown"),
        "dataset_size": metadata.get("dataset_size", "unknown")
    }

@app.post("/predict")
def predict(inp: RefiningInput):
    if any(v is None for v in [preprocessor, feature_names, target_names, model, metrics, metadata]):
        raise HTTPException(status_code=503, detail="Model artifacts not fully loaded")
    try:
        input_dict = inp.dict()
        logger.info(f"Received input: {input_dict}")

        # Prepare DataFrame for prediction
        row = {}
        for feature in feature_names:
            if feature.startswith('location_'):
                val = feature.replace('location_', '')
                row[feature] = 1 if input_dict.get("location", "").lower() == val.lower() else 0
            elif feature == 'toxicity_Red_Mud':
                # encode toxicity using ordinal mapping
                mapping = {'Low': 0, 'Moderate': 1, 'High': 2}
                row[feature] = mapping.get(input_dict.get(feature, ''), 1)
            else:
                row[feature] = input_dict.get(feature, 0)

        X_df = pd.DataFrame([row], columns=feature_names)
        X_proc = preprocessor.transform(X_df)
        y_pred = model.predict(X_proc)

        result = {}
        for i, target in enumerate(target_names):
            val = float(y_pred[0, i])
            conf = None
            if metrics and target in metrics and 'RMSE' in metrics[target]:
                rmse = metrics[target]['RMSE']
                conf = 1 / (1 + rmse)
            result[target] = {"value": val, "confidence": conf}

        return {
            "prediction": result,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002, reload=True)
