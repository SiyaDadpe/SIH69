import os
import joblib
import json
import logging
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Optional
import pandas as pd
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_manufacturing")

app = FastAPI(
    title="Manufacturing LCA API",
    description="API for predicting manufacturing phase parameters in LCA calculations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
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

    # Model is required
    try:
        _model = joblib.load(MODEL_PATH)
        logger.info("Model loaded successfully")
    except Exception as e:
        msg = f"Failed to load model at {MODEL_PATH}: {e}"
        logger.error(msg)
        _load_errors.append(msg)
        raise

    # Preprocessor is optional — if it fails, continue but record the error
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

@app.on_event("startup")
async def startup_event():
    _load_artifacts()

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
    if _model is None or _feature_names is None:
        raise HTTPException(status_code=500, detail="Model or feature names not loaded")

    data = request.data
    # Instead of rejecting missing features, fill them from preprocessing metadata or sensible defaults
    filled = {}
    for f in _feature_names:
        if f in data and data[f] is not None:
            filled[f] = data[f]
        else:
            # attempt to fill from preprocessing metadata
            if _preprocessing_metadata:
                if 'binary_columns' in _preprocessing_metadata and f in _preprocessing_metadata['binary_columns']:
                    filled[f] = 0
                    continue
                if 'ordinal_columns' in _preprocessing_metadata and f in _preprocessing_metadata['ordinal_columns']:
                    # use 'Not Applicable' or the mode if available
                    filled[f] = _preprocessing_metadata.get('ordinal_default', 'Not Applicable')
                    continue
                if 'numeric_medians' in _preprocessing_metadata and f in _preprocessing_metadata['numeric_medians']:
                    filled[f] = _preprocessing_metadata['numeric_medians'][f]
                    continue
            # fallback defaults
            filled[f] = 0

    # Build DataFrame aligned with feature names
    try:
        df = pd.DataFrame([filled])
        
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

    if preds.ndim == 1:
        preds = preds.reshape(1, -1)

    result = {name: float(preds[0, i]) for i, name in enumerate(_target_names)}
    
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
    uvicorn.run(app, host="0.0.0.0", port=8004)