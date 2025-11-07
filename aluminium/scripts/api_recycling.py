import os
import joblib
import json
import numpy as np
import pandas as pd
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Optional, Union
import uvicorn

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Recycling LCA API",
    description="API for predicting recycling-related parameters in LCA modeling",
    version="1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
preprocessor_path = os.path.join(project_root, 'preprocessing', 'recycling_preprocessor.joblib')
feature_names_path = os.path.join(project_root, 'preprocessing', 'recycling_feature_names.joblib')
target_names_path = os.path.join(project_root, 'preprocessing', 'recycling_target_names.joblib')
model_path = os.path.join(project_root, 'models', 'recycling_model.joblib')
metadata_path = os.path.join(project_root, 'models', 'recycling_model_metadata.json')
metrics_path = os.path.join(project_root, 'models', 'recycling_model_metrics.json')

# Globals
preprocessor = None
feature_names = None
target_names = None
model = None
model_metadata = None
model_metrics = None
preprocessing_metadata = None

class RecyclingInput(BaseModel):
    data: Dict[str, Any] = Field(..., description="Input feature data as key-value pairs")
    return_confidence: bool = Field(False, description="Whether to return confidence intervals")

class BatchRecyclingInput(BaseModel):
    data: List[Dict[str, Any]] = Field(..., description="List of input feature data")
    return_confidence: bool = Field(False, description="Whether to return confidence intervals")

class FeatureInfo(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    expected_range: Optional[List[Any]] = None

class PredictionResult(BaseModel):
    predictions: Dict[str, float]
    confidence_intervals: Optional[Dict[str, Dict[str, float]]] = None
    status: str
    timestamp: str

class BatchPredictionResult(BaseModel):
    predictions: List[Dict[str, float]]
    confidence_intervals: Optional[List[Dict[str, Dict[str, float]]]] = None
    count: int
    status: str
    timestamp: str

@app.on_event("startup")
async def load_artifacts():
    """Load all required artifacts on startup."""
    global preprocessor, feature_names, target_names, model, model_metadata, model_metrics
    
    artifacts = {
        'preprocessor': preprocessor_path,
        'feature_names': feature_names_path,
        'target_names': target_names_path,
        'model': model_path
    }

    # Try to load artifacts but allow degraded startup if some are missing
    for name, path in artifacts.items():
        try:
            if name == 'model':
                model = joblib.load(path)
            elif name == 'preprocessor':
                preprocessor = joblib.load(path)
            elif name == 'feature_names':
                feature_names = joblib.load(path)
            elif name == 'target_names':
                target_names = joblib.load(path)
            logger.info(f"Successfully loaded {name}")
        except Exception as e:
            logger.warning(f"Could not load {name} from {path}: {e}")
            # keep variable as None to allow health endpoint to report degraded state
    
    # Load metadata and metrics if available
    try:
        with open(metadata_path, 'r') as f:
            model_metadata = json.load(f)
        logger.info("Successfully loaded model metadata")
    except Exception as e:
        logger.warning(f"Could not load model metadata: {e}")
        model_metadata = {}

    try:
        with open(metrics_path, 'r') as f:
            model_metrics = json.load(f)
        logger.info("Successfully loaded model metrics")
    except Exception as e:
        logger.warning(f"Could not load model metrics: {e}")
        model_metrics = {}

    # Load preprocessing metadata if available (gives feature types, ranges, etc.)
    try:
        with open(os.path.join(project_root, 'preprocessing', 'recycling_metadata.joblib'), 'rb') as f:
            preprocessing_metadata = joblib.load(f)
        logger.info("Loaded preprocessing metadata")
    except Exception as e:
        preprocessing_metadata = None
        logger.info(f"No preprocessing metadata found: {e}")

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Recycling LCA Prediction API",
        "version": "1.0",
        "status": "operational",
        "docs": "/docs",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    artifacts_loaded = all([preprocessor, feature_names, target_names, model])
    status = "healthy" if artifacts_loaded else "degraded"
    
    return {
        "status": status,
        "artifacts_loaded": {
            "preprocessor": preprocessor is not None,
            "feature_names": feature_names is not None,
            "target_names": target_names is not None,
            "model": model is not None
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model-info")
async def model_info():
    """Get detailed information about the trained model."""
    if not model_metadata:
        raise HTTPException(status_code=503, detail="Model metadata not available")
    
    return {
        "model_type": model_metadata.get("model_type", "Unknown"),
        "training_date": model_metadata.get("training_date", "Unknown"),
        "feature_count": len(feature_names) if feature_names else 0,
        "target_count": len(target_names) if target_names else 0,
        "target_names": target_names,
        "dataset_size": model_metadata.get("dataset_size", "Unknown"),
        "test_size": model_metadata.get("test_size", "Unknown"),
        "random_state": model_metadata.get("random_state", "Unknown")
    }

@app.get("/model-metrics")
async def model_metrics_endpoint():
    """Get performance metrics of the trained model."""
    if not model_metrics:
        raise HTTPException(status_code=503, detail="Model metrics not available")
    
    return model_metrics

@app.get("/features")
async def get_features():
    """Get information about all expected input features."""
    if not feature_names:
        raise HTTPException(status_code=503, detail="Feature names not available")

    features_info = []
    # If preprocessing metadata exists, use it to supply types and ranges
    for feature in feature_names:
        ftype = "numeric"
        expected_range = None
        description = f"Feature: {feature}"

        if preprocessing_metadata:
            if 'numeric_columns' in preprocessing_metadata and feature in preprocessing_metadata['numeric_columns']:
                ftype = 'numeric'
            elif 'categorical_columns' in preprocessing_metadata and feature in preprocessing_metadata['categorical_columns']:
                ftype = 'categorical'
            elif 'binary_columns' in preprocessing_metadata and feature in preprocessing_metadata['binary_columns']:
                ftype = 'binary'

            # If metadata includes ranges or enums, include them
            if isinstance(preprocessing_metadata.get('ranges'), dict) and feature in preprocessing_metadata['ranges']:
                expected_range = preprocessing_metadata['ranges'][feature]

        features_info.append(FeatureInfo(
            name=feature,
            type=ftype,
            description=description,
            expected_range=expected_range
        ))

    return {"features": features_info}

@app.get("/example-input")
async def example_input():
    """Get an example of valid input data."""
    if not feature_names:
        raise HTTPException(status_code=503, detail="Feature names not available")
    
    example = {}
    for feature in feature_names[:10]:  # Show first 10 features as example
        if "recycling_process_" in feature:
            example[feature] = 1  # Binary feature
        elif "%" in feature:
            example[feature] = 50.0  # Percentage feature
        else:
            example[feature] = 100.0  # Numeric feature
    
    return {"example_input": example}

def _prepare_input_data(input_dict: Dict[str, Any]) -> pd.DataFrame:
    """Prepare input data for prediction."""
    if not feature_names:
        raise HTTPException(status_code=503, detail="Feature names not loaded")
    
    # Check for missing required features
    missing_features = [f for f in feature_names if f not in input_dict]
    if missing_features:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "missing_features",
                "missing_features": missing_features,
                "message": f"Missing {len(missing_features)} required features"
            }
        )
    
    # Create DataFrame with features in the correct order
    # Coerce types where possible using preprocessing metadata hints
    row = {}
    for feature in feature_names:
        val = input_dict.get(feature, 0)
        if preprocessing_metadata and 'numeric_columns' in preprocessing_metadata and feature in preprocessing_metadata['numeric_columns']:
            try:
                val = float(val)
            except Exception:
                # leave as-is and let preprocessor raise a clear error later
                pass
        row[feature] = val

    return pd.DataFrame([row], columns=feature_names)

def _calculate_confidence(predictions: Dict[str, float]) -> Dict[str, Dict[str, float]]:
    """Calculate confidence intervals for predictions."""
    # This is a simplified implementation - you might want to implement
    # proper confidence interval calculation based on your model
    confidence_intervals = {}
    for target, value in predictions.items():
        # Simple heuristic: ±10% for most targets, ±5% for percentages
        if "%" in target:
            margin = value * 0.05
        else:
            margin = value * 0.10
            
        confidence_intervals[target] = {
            "lower": max(0, value - margin),  # Ensure non-negative
            "upper": value + margin,
            "confidence_level": 0.95
        }
    
    return confidence_intervals

@app.post("/predict", response_model=PredictionResult)
async def predict(input_data: RecyclingInput):
    """Make a prediction for a single input instance."""
    if any(v is None for v in [preprocessor, feature_names, target_names, model]):
        raise HTTPException(status_code=503, detail="Model artifacts not loaded")
    
    try:
        # Prepare input data
        X_df = _prepare_input_data(input_data.data)
        
        # Apply preprocessing
        X_processed = preprocessor.transform(X_df)
        
        # Make prediction
        y_pred = model.predict(X_processed)
        
        # Format predictions
        predictions = {}
        for i, target in enumerate(target_names):
            predictions[target] = float(y_pred[0, i])
        
        # Calculate confidence intervals if requested
        confidence_intervals = None
        if input_data.return_confidence:
            confidence_intervals = _calculate_confidence(predictions)
        
        return PredictionResult(
            predictions=predictions,
            confidence_intervals=confidence_intervals,
            status="success",
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/batch-predict", response_model=BatchPredictionResult)
async def batch_predict(input_data: BatchRecyclingInput):
    """Make predictions for multiple input instances."""
    if any(v is None for v in [preprocessor, feature_names, target_names, model]):
        raise HTTPException(status_code=503, detail="Model artifacts not loaded")
    
    try:
        if not input_data.data:
            raise HTTPException(status_code=400, detail="Empty batch request")
        
        # Prepare all input data
        X_list = []
        for i, input_dict in enumerate(input_data.data):
            try:
                X_df = _prepare_input_data(input_dict)
                X_list.append(X_df)
            except HTTPException as e:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Error in instance {i}: {e.detail}"
                )
        
        # Combine all instances
        X_batch = pd.concat(X_list, ignore_index=True)
        
        # Apply preprocessing
        X_processed = preprocessor.transform(X_batch)
        
        # Make predictions
        y_pred = model.predict(X_processed)
        
        # Format predictions
        predictions = []
        confidence_intervals = [] if input_data.return_confidence else None
        
        for i in range(len(y_pred)):
            pred_dict = {}
            for j, target in enumerate(target_names):
                pred_dict[target] = float(y_pred[i, j])
            
            predictions.append(pred_dict)
            
            # Calculate confidence intervals if requested
            if input_data.return_confidence:
                confidence_intervals.append(_calculate_confidence(pred_dict))
        
        return BatchPredictionResult(
            predictions=predictions,
            confidence_intervals=confidence_intervals,
            count=len(predictions),
            status="success",
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

@app.get("/targets")
async def get_targets():
    """Get information about all prediction targets."""
    if not target_names:
        raise HTTPException(status_code=503, detail="Target names not available")
    
    targets_info = []
    for target in target_names:
        # Add descriptions based on target names
        description = ""
        if "scrap_input" in target:
            description = "Percentage of scrap used as input material"
        elif "recovery_yield" in target:
            description = "Percentage of aluminium recovered during recycling"
        elif "energy" in target:
            description = "Energy consumption in kWh per tonne of recycled aluminium"
        elif "emission_savings" in target:
            description = "CO2 emission savings in kg per tonne of recycled aluminium"
        elif "efficiency" in target:
            description = "Overall recycling efficiency percentage"
        elif "collection_rate" in target:
            description = "Percentage of available scrap that is collected"
        elif "closed_loop" in target:
            description = "Percentage of material recycled in closed-loop system"
        elif "open_loop" in target:
            description = "Percentage of material recycled in open-loop system"
        
        targets_info.append({
            "name": target,
            "description": description,
            "units": "%" if "%" in target else "kWh/t" if "energy" in target else "kg CO2e/t"
        })
    
    return {"targets": targets_info}

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8003,
        log_level="info",
        reload=True  # Enable auto-reload during development
    )