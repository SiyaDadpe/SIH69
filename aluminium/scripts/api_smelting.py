import os
import joblib
import json
import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("api_smelting")

# Initialize FastAPI app
app = FastAPI(
    title="Aluminium Smelting LCA Prediction API",
    description="API for predicting smelting stage parameters in aluminium LCA calculations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define paths relative to project root
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODEL_PATH = os.path.join(ROOT, 'models', 'smelting_model.joblib')
PREPROCESSOR_PATH = os.path.join(ROOT, 'preprocessing', 'smelting_preprocessor.joblib')
FEATURE_NAMES_PATH = os.path.join(ROOT, 'preprocessing', 'smelting_feature_names.joblib')
TARGET_NAMES_PATH = os.path.join(ROOT, 'preprocessing', 'smelting_target_names.joblib')
METADATA_PATH = os.path.join(ROOT, 'models', 'smelting_model_metadata.json')

# Global variables to be populated at startup
_model = None
_preprocessor = None
_feature_names = None
_target_names = None
_metadata = None
_load_errors = []
_metadata_preprocessing = None

# Define input schema using Pydantic
class SmeltingInput(BaseModel):
    # Variant features
    smelting_variant_Pre_baked_anodes: Optional[int] = Field(0, ge=0, le=1, description="1 if using pre-baked anodes, else 0")
    smelting_variant_Soderberg_anodes: Optional[int] = Field(0, ge=0, le=1, description="1 if using Soderberg anodes, else 0")
    smelting_variant_Inert_anodes_exp: Optional[int] = Field(0, ge=0, le=1, description="1 if using experimental inert anodes, else 0")
    smelting_variant_Renewable_powered: Optional[int] = Field(0, ge=0, le=1, description="1 if using renewable-powered smelter, else 0")
    smelting_variant_Dynamic_load_mgmt: Optional[int] = Field(0, ge=0, le=1, description="1 if using dynamic load management, else 0")
    
    # Other features
    location: str = Field(..., description="Plant location")
    year: int = Field(..., ge=2000, le=2030, description="Year of operation")
    # Variant fields already have defaults set to 0; no pydantic v1-style validators used

class PredictionResponse(BaseModel):
    predictions: Dict[str, float]
    metadata: Dict[str, Any]
    timestamp: str

def load_artifacts():
    """Load model, preprocessor, and metadata at startup."""
    global _model, _preprocessor, _feature_names, _target_names, _metadata, _load_errors, _metadata_preprocessing
    _load_errors = []
    
    artifacts = [
        (FEATURE_NAMES_PATH, "feature names", lambda: joblib.load(FEATURE_NAMES_PATH)),
        (TARGET_NAMES_PATH, "target names", lambda: joblib.load(TARGET_NAMES_PATH)),
        (MODEL_PATH, "model", lambda: joblib.load(MODEL_PATH)),
        (PREPROCESSOR_PATH, "preprocessor", lambda: joblib.load(PREPROCESSOR_PATH)),
    ]
    
    for path, name, loader in artifacts:
        try:
            if name == "feature names":
                _feature_names = loader()
            elif name == "target names":
                _target_names = loader()
            elif name == "model":
                _model = loader()
            elif name == "preprocessor":
                _preprocessor = loader()
            logger.info(f"Successfully loaded {name}")
        except Exception as e:
            error_msg = f"Failed to load {name} from {path}: {str(e)}"
            logger.error(error_msg)
            _load_errors.append(error_msg)
    # Try optional preprocessing metadata
    try:
        pm = os.path.join(ROOT, 'preprocessing', 'smelting_metadata.joblib')
        if os.path.exists(pm):
            _metadata_preprocessing = joblib.load(pm)
            logger.info("Loaded preprocessing metadata for smelting")
        else:
            _metadata_preprocessing = None
    except Exception as e:
        logger.warning(f"Failed to load preprocessing metadata: {e}")
        _metadata_preprocessing = None
    
    # Load metadata if available
    try:
        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, 'r') as f:
                _metadata = json.load(f)
            logger.info("Successfully loaded model metadata")
    except Exception as e:
        error_msg = f"Failed to load metadata: {str(e)}"
        logger.error(error_msg)
        _load_errors.append(error_msg)

@app.on_event("startup")
async def startup_event():
    """Load artifacts when the API starts."""
    logger.info("Starting API server...")
    load_artifacts()
    
    if _load_errors:
        logger.warning(f"API started with {len(_load_errors)} load errors")
    else:
        logger.info("API started successfully with all artifacts loaded")

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Aluminium Smelting LCA Prediction API",
        "version": "1.0.0",
        "status": "operational" if _model is not None else "degraded",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health():
    """Health check endpoint with detailed status."""
    status = {
        "status": "healthy" if _model is not None and not _load_errors else "degraded",
        "model_loaded": _model is not None,
        "preprocessor_loaded": _preprocessor is not None,
        "feature_names_loaded": _feature_names is not None,
        "target_names_loaded": _target_names is not None,
        "load_errors": _load_errors if _load_errors else None,
        "timestamp": datetime.now().isoformat()
    }
    return status

@app.get("/model-info")
async def model_info():
    """Return detailed information about the loaded model."""
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    info = {
        "model_type": "GradientBoostingRegressor with MultiOutputRegressor",
        "feature_count": len(_feature_names) if _feature_names else 0,
        "target_names": _target_names,
        "feature_names": _feature_names,
        "metadata": _metadata,
        "preprocessor_available": _preprocessor is not None
    }
    return info


@app.get("/features")
async def features():
    if _feature_names is None:
        raise HTTPException(status_code=503, detail="Feature names not loaded")
    features = []
    for f in _feature_names:
        ftype = 'numeric'
        rng = None
        if _metadata_preprocessing:
            if 'binary_columns' in _metadata_preprocessing and f in _metadata_preprocessing['binary_columns']:
                ftype = 'binary'
            elif 'ordinal_columns' in _metadata_preprocessing and f in _metadata_preprocessing['ordinal_columns']:
                ftype = 'ordinal'
            if isinstance(_metadata_preprocessing.get('ranges'), dict) and f in _metadata_preprocessing['ranges']:
                rng = _metadata_preprocessing['ranges'][f]
        features.append({'name': f, 'type': ftype, 'expected_range': rng})
    return {'features': features}

@app.post("/predict", response_model=PredictionResponse)
async def predict(input_data: SmeltingInput):
    """Run prediction given input data."""
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please check /health endpoint.")
    
    if _feature_names is None:
        raise HTTPException(status_code=503, detail="Feature names not loaded.")
    
    # Convert input to dictionary
    input_dict = input_data.dict()
    
    # Create a DataFrame with all expected features
    input_row = {}
    for feature in _feature_names:
        # Handle one-hot encoded features (e.g., location_Odisha)
        if feature.startswith('location_'):
            loc_value = feature.replace('location_', '')
            input_row[feature] = 1 if input_dict.get('location') == loc_value else 0
        else:
            # For other features, use the value from input or 0 for variants
            input_row[feature] = input_dict.get(feature, 0)
    
    # Create DataFrame for prediction
    try:
        df = pd.DataFrame([input_row], columns=_feature_names)
        
        # Apply preprocessing if available
        if _preprocessor is not None:
            X = _preprocessor.transform(df)
        else:
            X = df.values
            
        # Make prediction
        predictions = _model.predict(X)
        
        # Format predictions
        if predictions.ndim == 1:
            predictions = predictions.reshape(1, -1)
            
        result = {}
        for i, target in enumerate(_target_names):
            result[target] = float(predictions[0, i])
            
        # Prepare response
        return PredictionResponse(
            predictions=result,
            metadata={
                "model_type": "GradientBoostingRegressor",
                "feature_count": len(_feature_names),
                "preprocessing_applied": _preprocessor is not None
            },
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/required-features")
async def required_features():
    """Return the list of required input features with descriptions."""
    if _feature_names is None:
        raise HTTPException(status_code=503, detail="Feature names not loaded.")
    
    # Categorize features
    variant_features = [f for f in _feature_names if f.startswith('smelting_variant_')]
    location_features = [f for f in _feature_names if f.startswith('location_')]
    other_features = [f for f in _feature_names if f not in variant_features + location_features]
    
    return {
        "variant_features": variant_features,
        "location_features": location_features,
        "other_features": other_features,
        "total_features": len(_feature_names)
    }

if __name__ == "__main__":
    uvicorn.run(
        "api_smelting:app",
        host="0.0.0.0",
        port=8003,
        reload=True,
        log_level="info"
    )