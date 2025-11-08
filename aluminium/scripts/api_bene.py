import os
import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Beneficiation LCA API",
    description="API for predicting beneficiation stage parameters in LCA calculations",
    version="1.0.0"
)

# Paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
preprocessor_path = os.path.join(project_root, 'preprocessing', 'beneficiation_preprocessor.joblib')
feature_names_path = os.path.join(project_root, 'preprocessing', 'beneficiation_feature_names.joblib')
regressor_path = os.path.join(project_root, 'models', 'beneficiation_regressor.joblib')
classifier_path = os.path.join(project_root, 'models', 'beneficiation_classifier.joblib')
metadata_path = os.path.join(project_root, 'models', 'beneficiation_model_metadata.json')

# Globals
preprocessor = None
feature_names = None
regressor = None
classifier = None
metadata = None
preprocessing_metadata = None

@app.on_event("startup")
async def startup_event():
    global preprocessor, feature_names, regressor, classifier, metadata
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
        # try load preprocessing metadata if present (non-fatal)
        try:
            pm_path = os.path.join(project_root, 'preprocessing', 'beneficiation_metadata.joblib')
            if os.path.exists(pm_path):
                preprocessing_metadata = joblib.load(pm_path)
                logger.info("Loaded preprocessing metadata for beneficiation")
        except Exception:
            preprocessing_metadata = None
        logger.info("Models and metadata loaded on startup.")
    except Exception as e:
        logger.error(f"Error loading models/metadata on startup: {e}")
        # keep app running; endpoints will report models not loaded

# Input schema (keep fields permissive; one-hot features will be built from feature_names)
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
    beneficiation_tailings_management: Optional[str] = Field(None)
    beneficiation_noise_pollution: Optional[str] = Field(None)
    beneficiation_dust_pollution: Optional[str] = Field(None)
    location: Optional[str] = Field(None)
    year: Optional[int] = Field(None)

@app.get("/")
async def root():
    return {"message": "Beneficiation LCA Prediction API", "status": "healthy"}

@app.get("/health")
async def health_check():
    models_ready = all(v is not None for v in [preprocessor, feature_names, regressor, classifier, metadata])
    return {"status": "ready" if models_ready else "not ready", "models_loaded": models_ready}

@app.get("/model-info")
async def model_info():
    if metadata is None:
        raise HTTPException(status_code=503, detail="Model metadata not available")
    return {
        "model_type": metadata.get('model_type', 'unknown'),
        "regression_targets": metadata.get('regression_targets', []),
        "classification_targets": metadata.get('classification_targets', []),
        "training_date": metadata.get('training_date', 'unknown'),
        "dataset_size": metadata.get('dataset_size', 'unknown')
    }

@app.post("/predict")
async def predict(input_data: BeneficiationInput):
    if any(v is None for v in [preprocessor, feature_names, metadata]):
        raise HTTPException(status_code=503, detail="Models or preprocessing not loaded")
    try:
        input_dict = input_data.dict()
        logger.info(f"Received input: {input_dict}")

        # Build row matching feature_names (handle one-hot encoded feature names)
        input_row = {}
        for feat in feature_names:
            if feat.startswith('location_'):
                val = feat.replace('location_', '')
                input_row[feat] = 1 if input_dict.get('location') == val else 0
            elif feat.startswith('beneficiation_tailings_management_'):
                val = feat.replace('beneficiation_tailings_management_', '')
                input_row[feat] = 1 if input_dict.get('beneficiation_tailings_management') == val else 0
            else:
                input_row[feat] = input_dict.get(feat, None)

        X_input = pd.DataFrame([input_row], columns=feature_names)
        X_processed = preprocessor.transform(X_input)

        result = {"regression": {}, "classification": {}}

        # Regression
        reg_targets = metadata.get('regression_targets', [])
        if reg_targets and regressor is not None and hasattr(regressor, 'predict'):
            y_reg = regressor.predict(X_processed)
            for i, target in enumerate(reg_targets):
                result["regression"][target] = {"prediction": float(y_reg[0, i]), "units": get_units(target), "confidence": None}

        # Classification
        clf_targets = metadata.get('classification_targets', [])
        if clf_targets and classifier is not None and hasattr(classifier, 'predict'):
            y_clf = classifier.predict(X_processed)
            # If classifier returns array of arrays, handle accordingly
            for i, target in enumerate(clf_targets):
                val = y_clf[0, i] if hasattr(y_clf[0], '__len__') else y_clf[0]
                result["classification"][target] = {"prediction": val, "type": "category", "confidence": None}

        return {"prediction": result, "status": "success", "timestamp": datetime.now().isoformat()}

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

def get_units(target_name):
    units_map = {
        'beneficiation_water_m3_per_t_ore': 'm³ per tonne of ore',
        'beneficiation_electricity_kWh_per_t_ore': 'kWh per tonne of ore'
    }
    return units_map.get(target_name, 'unknown')


@app.get("/features")
async def get_features():
    """Return expected input features and basic typing information for frontend form generation."""
    if not feature_names:
        raise HTTPException(status_code=503, detail="Feature names not loaded")

    features = []
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

        features.append({
            'name': feat,
            'type': ftype,
            'expected_range': expected
        })

    return {"features": features}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0",port=5001)