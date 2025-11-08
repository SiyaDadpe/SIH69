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

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Mining Stage Prediction API", 
              description="API for predicting mining stage parameters in LCA calculations")

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
preprocessor_path = os.path.join(project_root, 'preprocessing', 'mining_preprocessor.joblib')
feature_names_path = os.path.join(project_root, 'preprocessing', 'mining_feature_names.joblib')
model_path = os.path.join(project_root, 'models', 'mining_model.joblib')
metrics_path = os.path.join(project_root, 'models', 'mining_model_metrics.json')

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

class PredictionResponse(BaseModel):
    predictions: Dict[str, Dict[str, float]]
    input_used: Dict[str, Any]
    timestamp: str

@app.get("/")
async def root():
    return {"message": "Mining Stage Prediction API", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Check if the API and model are ready"""
    # Return degraded status instead of 503 so frontend can still connect
    status = "ready" if model is not None and preprocessor is not None else "degraded"
    return {"status": status, "model_loaded": model is not None, "preprocessor_loaded": preprocessor is not None}

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
        
        # Prepare input DataFrame with correct structure
        input_dict = {}
        
        # Fill all feature names with None initially
        for name in feature_names:
            input_dict[name] = None
        
        # Map input fields to preprocessed feature names
        # This is crucial because one-hot encoding creates multiple columns
        
        # Handle mining_method (multi-label)
        if input_data.mining_method:
            # For each possible method, set to 1 if in input, else 0
            for method in ['Open Pit', 'Strip', 'Drilling & Blasting', 'Hydraulic', 'Manual']:
                feature_name = f"mining_method_{method}"
                if feature_name in feature_names:  # Check if this feature exists in our preprocessed data
                    input_dict[feature_name] = 1 if method in input_data.mining_method else 0
        
        # Handle mining_equipment_type (one-hot encoded)
        if input_data.mining_equipment_type:
            for equip_type in ['Diesel', 'Electric', 'Hybrid']:
                feature_name = f"mining_equipment_type_{equip_type}"
                if feature_name in feature_names:
                    input_dict[feature_name] = 1 if equip_type == input_data.mining_equipment_type else 0
        
        # Handle location (one-hot encoded)
        if input_data.location:
            for loc in ['Odisha', 'Gujarat', 'Maharashtra', 'Chhattisgarh', 'Jharkhand']:
                feature_name = f"location_{loc}"
                if feature_name in feature_names:
                    input_dict[feature_name] = 1 if loc == input_data.location else 0
        
        # Handle numeric and ordinal fields directly
        if input_data.mining_ore_grade_percent is not None:
            input_dict['mining_ore_grade_percent'] = input_data.mining_ore_grade_percent
        
        if input_data.mining_overburden_ratio is not None:
            input_dict['mining_overburden_ratio'] = input_data.mining_overburden_ratio
        
        if input_data.mining_water_m3_per_t_ore is not None:
            input_dict['mining_water_m3_per_t_ore'] = input_data.mining_water_m3_per_t_ore
        
        # Handle ordinal field
        if input_data.mining_land_use_impact:
            # Map to ordinal values: Low=0, Moderate=1, High=2
            land_use_map = {'Low': 0, 'Moderate': 1, 'High': 2}
            input_dict['mining_land_use_impact'] = land_use_map.get(input_data.mining_land_use_impact, 1)  # Default to Moderate
        
        # Handle year
        input_dict['year'] = input_data.year if input_data.year else 2022  # Default to current year
        
        # Fill missing features with safe defaults using preprocessing metadata when available
        for name in feature_names:
            val = input_dict.get(name, None)
            if val is None:
                if preprocessing_metadata and 'binary_columns' in preprocessing_metadata and name in preprocessing_metadata['binary_columns']:
                    input_dict[name] = 0
                elif preprocessing_metadata and 'ordinal_columns' in preprocessing_metadata and name in preprocessing_metadata['ordinal_columns']:
                    input_dict[name] = preprocessing_metadata.get('ordinal_default', 'Not Applicable')
                elif preprocessing_metadata and 'numeric_medians' in preprocessing_metadata and name in preprocessing_metadata['numeric_medians']:
                    input_dict[name] = preprocessing_metadata['numeric_medians'][name]
                else:
                    input_dict[name] = 0.0

        # Create DataFrame for transformation
        df_input = pd.DataFrame([input_dict])
        # Ensure columns are in the same order as during training
        df_input = df_input[feature_names]
        
        # Apply preprocessing
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


if __name__ == "__main__":
    import uvicorn
    print("Starting Mining Prediction API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)