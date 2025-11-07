from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
import os
import pandas as pd
import numpy as np
import logging
import traceback
import joblib
from datetime import datetime
import json

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Valorization Model API",
    description="API for predicting waste valorization outcomes in aluminum production",
    version="1.0.0"
)

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define where the model is stored
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "valorization_model.joblib")
PREPROCESSOR_PATH = os.path.join(PROJECT_ROOT, "preprocessing", "valorization_preprocessor.joblib")

# Global variables for loaded model and preprocessor
model_bundle = None
preprocessor = None

# Define input structure using Pydantic with validation
class WasteTypeInput(BaseModel):
    Red_Mud: bool = Field(False, description="Whether Red Mud waste is present")
    SPL: bool = Field(False, description="Whether Spent Pot Lining is present")
    Dross: bool = Field(False, description="Whether Dross is present")
    Fluoride_Gases: bool = Field(False, description="Whether Fluoride Gases are present")
    Slag: bool = Field(False, description="Whether Slag is present")
    Other: bool = Field(False, description="Whether Other waste is present")

class WasteUtilizationInput(BaseModel):
    Red_Mud: float = Field(0.0, ge=0, le=100, description="Percentage utilization of Red Mud")
    SPL: float = Field(0.0, ge=0, le=100, description="Percentage utilization of Spent Pot Lining")
    Dross: float = Field(0.0, ge=0, le=100, description="Percentage utilization of Dross")
    Fluoride_Gases: float = Field(0.0, ge=0, le=100, description="Percentage utilization of Fluoride Gases")
    Slag: float = Field(0.0, ge=0, le=100, description="Percentage utilization of Slag")
    Other: float = Field(0.0, ge=0, le=100, description="Percentage utilization of Other waste")

class ValorizationMethodInput(BaseModel):
    Cement_Additive: bool = Field(False, description="Whether Cement Additive method is used")
    Soil_Stabilization: bool = Field(False, description="Whether Soil Stabilization method is used")
    Iron_Extraction: bool = Field(False, description="Whether Iron Extraction method is used")
    Rare_Earth_Extraction: bool = Field(False, description="Whether Rare Earth Extraction method is used")
    SPL_Encapsulation: bool = Field(False, description="Whether SPL Encapsulation method is used")
    Dross_Recovery: bool = Field(False, description="Whether Dross Recovery method is used")
    Fluoride_Capture: bool = Field(False, description="Whether Fluoride Capture method is used")
    Other: bool = Field(False, description="Whether Other method is used")

class ToxicityInput(BaseModel):
    Red_Mud: str = Field("Not Applicable", description="Toxicity level of Red Mud")
    SPL: str = Field("Not Applicable", description="Toxicity level of Spent Pot Lining")
    Dross: str = Field("Not Applicable", description="Toxicity level of Dross")
    Fluoride_Gases: str = Field("Not Applicable", description="Toxicity level of Fluoride Gases")
    Slag: str = Field("Not Applicable", description="Toxicity level of Slag")
    Other: str = Field("Not Applicable", description="Toxicity level of Other waste")
    
    @validator('*', pre=True, each_item=False)
    def validate_toxicity(cls, v):
        valid_values = ["Low", "Moderate", "High", "Not Applicable"]
        if v not in valid_values:
            raise ValueError(f"Toxicity must be one of {valid_values}")
        return v

class RiskInput(BaseModel):
    Red_Mud: str = Field("Not Applicable", description="Groundwater risk of Red Mud")
    SPL: str = Field("Not Applicable", description="Groundwater risk of Spent Pot Lining")
    Dross: str = Field("Not Applicable", description="Groundwater risk of Dross")
    Fluoride_Gases: str = Field("Not Applicable", description="Groundwater risk of Fluoride Gases")
    Slag: str = Field("Not Applicable", description="Groundwater risk of Slag")
    Other: str = Field("Not Applicable", description="Groundwater risk of Other waste")
    
    @validator('*', pre=True, each_item=False)
    def validate_risk(cls, v):
        valid_values = ["Low", "Moderate", "High", "Not Applicable"]
        if v not in valid_values:
            raise ValueError(f"Risk must be one of {valid_values}")
        return v

class EconomicViabilityInput(BaseModel):
    Cement_Additive: str = Field("Not Applicable", description="Economic viability of Cement Additive")
    Soil_Stabilization: str = Field("Not Applicable", description="Economic viability of Soil Stabilization")
    Iron_Extraction: str = Field("Not Applicable", description="Economic viability of Iron Extraction")
    Rare_Earth_Extraction: str = Field("Not Applicable", description="Economic viability of Rare Earth Extraction")
    SPL_Encapsulation: str = Field("Not Applicable", description="Economic viability of SPL Encapsulation")
    Dross_Recovery: str = Field("Not Applicable", description="Economic viability of Dross Recovery")
    Fluoride_Capture: str = Field("Not Applicable", description="Economic viability of Fluoride Capture")
    
    @validator('*', pre=True, each_item=False)
    def validate_economic(cls, v):
        valid_values = ["Low", "Moderate", "High", "Not Applicable"]
        if v not in valid_values:
            raise ValueError(f"Economic viability must be one of {valid_values}")
        return v

class AdditionalNumericInput(BaseModel):
    emission_reduction_kgCO2e_per_t_waste: float = Field(
        0.0, ge=0, description="Emission reduction in kg CO2e per ton of waste"
    )
    recovery_efficiency: float = Field(
        0.0, ge=0, le=100, description="Recovery efficiency percentage"
    )

class PredictionInput(BaseModel):
    waste_types: WasteTypeInput
    waste_utilization: WasteUtilizationInput
    valorization_methods: ValorizationMethodInput
    toxicity: ToxicityInput
    risk: RiskInput
    economic_viability: EconomicViabilityInput
    additional_numeric: AdditionalNumericInput

class PredictionOutput(BaseModel):
    valorization_emission_reduction_kgCO2e_per_t_waste: float
    valorization_recovery_efficiency: float
    confidence: Optional[Dict[str, float]] = None

def load_model_and_preprocessor():
    """Load model and preprocessor once at startup"""
    global model_bundle, preprocessor
    # Attempt to load artifacts but allow degraded startup
    try:
        if os.path.exists(MODEL_PATH):
            model_bundle = joblib.load(MODEL_PATH)
        else:
            model_bundle = None
        if os.path.exists(PREPROCESSOR_PATH):
            preprocessor = joblib.load(PREPROCESSOR_PATH)
        else:
            preprocessor = None
        logger.info("Attempted to load model and preprocessor")
    except Exception as e:
        logger.error(f"Error loading model or preprocessor: {e}")
        model_bundle = None
        preprocessor = None

@app.on_event("startup")
async def startup_event():
    """Load model and preprocessor when the application starts"""
    load_model_and_preprocessor()

def input_to_dataframe(input_data: PredictionInput) -> pd.DataFrame:
    """Convert input data to DataFrame format for prediction"""
    data = {}
    
    # Waste types
    for waste, present in input_data.waste_types.dict().items():
        data[f"waste_type_{waste}"] = [1 if present else 0]
    
    # Waste utilization percentages
    for waste, percentage in input_data.waste_utilization.dict().items():
        data[f"waste_utilization_{waste}_%"] = [percentage]
    
    # Valorization methods
    for method, used in input_data.valorization_methods.dict().items():
        data[f"valorization_method_{method}"] = [1 if used else 0]
    
    # Toxicity levels
    for waste, level in input_data.toxicity.dict().items():
        data[f"toxicity_{waste}"] = [level]
    
    # Risk levels
    for waste, level in input_data.risk.dict().items():
        data[f"groundwater_risk_{waste}"] = [level]
    
    # Economic viability
    for method, viability in input_data.economic_viability.dict().items():
        data[f"economic_viability_{method}"] = [viability]
    
    # Additional numeric fields
    data["emission_reduction_kgCO2e_per_t_waste"] = [input_data.additional_numeric.emission_reduction_kgCO2e_per_t_waste]
    data["recovery_efficiency_%"] = [input_data.additional_numeric.recovery_efficiency]
    
    return pd.DataFrame(data)

def predict_with_model(new_data: pd.DataFrame) -> pd.DataFrame:
    """Make predictions using the loaded model and preprocessor"""
    try:
        if model_bundle is None or preprocessor is None:
            load_model_and_preprocessor()
        
        model = model_bundle['model']
        feature_names = model_bundle['feature_names']
        target_names = model_bundle['target_names']
        preproc_metadata = model_bundle.get('preprocessor_metadata', {}) or {}
        
        # Transform the data using the preprocessor
        input_order = (preproc_metadata.get('numeric_columns', []) +
                       preproc_metadata.get('binary_columns', []) +
                       preproc_metadata.get('ordinal_columns', []))
        
        # Ensure all required columns are present
        raw = new_data.copy()
        for col in input_order:
            if col not in raw.columns:
                if col in preproc_metadata.get('binary_columns', []):
                    raw[col] = 0
                elif col in preproc_metadata.get('ordinal_columns', []):
                    raw[col] = 'Not Applicable'
                else:
                    raw[col] = 0.0
        
        # Transform with the preprocessor
        X_proc = preprocessor.transform(raw[input_order])
        
        # Make predictions
        predictions = model.predict(X_proc)
        
        # Create result dataframe
        result_df = pd.DataFrame(predictions, columns=target_names)
        return result_df
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise

@app.post("/predict/", response_model=PredictionOutput)
def predict(input_data: PredictionInput):
    """Endpoint to receive JSON data and return model predictions."""
    try:
        logger.info("Received prediction request")

        # Convert input to DataFrame
        df = input_to_dataframe(input_data)
        logger.info(f"Processed input data with {len(df.columns)} features")

        # Perform prediction
        predictions = predict_with_model(df)
        
        # Extract the predictions
        result = predictions.iloc[0].to_dict()

        # Convert percentage field name
        if "valorization_recovery_efficiency_%" in result:
            result["valorization_recovery_efficiency"] = result.pop("valorization_recovery_efficiency_%")

        # Add a simple confidence heuristic if model metrics present in bundle
        confidence = {}
        try:
            if model_bundle and 'model_metrics' in model_bundle:
                metrics = model_bundle['model_metrics']
                for k in result.keys():
                    m = metrics.get(k, {})
                    rmse = m.get('RMSE')
                    if rmse is not None:
                        confidence[k] = 1.0 / (1.0 + rmse)
                    else:
                        confidence[k] = None
        except Exception:
            confidence = {}

        out = {}
        out.update(result)
        if confidence:
            out['confidence'] = confidence

        logger.info("Prediction successful")
        return out

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"message": "Valorization Model API is running."}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    model_loaded = model_bundle is not None
    preprocessor_loaded = preprocessor is not None
    
    return {
        "status": "healthy" if model_loaded and preprocessor_loaded else "degraded",
        "model_loaded": model_loaded,
        "preprocessor_loaded": preprocessor_loaded,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model-info")
def model_info():
    """Get information about the loaded model"""
    if model_bundle is None:
        # return minimal info for degraded startup
        return {"feature_names": [], "target_names": [], "model_type": "unknown", "loaded_at": None}

    return {
        "feature_names": model_bundle.get('feature_names', []),
        "target_names": model_bundle.get('target_names', []),
        "model_type": "GradientBoostingRegressor",
        "loaded_at": datetime.now().isoformat()
    }


@app.get("/features")
def features():
    """Return input feature metadata from model bundle or preprocessing file."""
    meta = None
    if model_bundle:
        meta = model_bundle.get('preprocessor_metadata') or {}
    if not meta:
        # try fallback file
        pm = os.path.join(PROJECT_ROOT, 'preprocessing', 'valorization_metadata.joblib')
        if os.path.exists(pm):
            try:
                meta = joblib.load(pm)
            except Exception:
                meta = {}
    numeric = meta.get('numeric_columns', []) if meta else []
    binary = meta.get('binary_columns', []) if meta else []
    ordinal = meta.get('ordinal_columns', []) if meta else []
    return {"numeric": numeric, "binary": binary, "ordinal": ordinal}

@app.get("/input-template")
def get_input_template():
    """Get a template for the input structure"""
    return {
        "waste_types": {
            "Red_Mud": False,
            "SPL": False,
            "Dross": False,
            "Fluoride_Gases": False,
            "Slag": False,
            "Other": False
        },
        "waste_utilization": {
            "Red_Mud": 0.0,
            "SPL": 0.0,
            "Dross": 0.0,
            "Fluoride_Gases": 0.0,
            "Slag": 0.0,
            "Other": 0.0
        },
        "valorization_methods": {
            "Cement_Additive": False,
            "Soil_Stabilization": False,
            "Iron_Extraction": False,
            "Rare_Earth_Extraction": False,
            "SPL_Encapsulation": False,
            "Dross_Recovery": False,
            "Fluoride_Capture": False,
            "Other": False
        },
        "toxicity": {
            "Red_Mud": "Not Applicable",
            "SPL": "Not Applicable",
            "Dross": "Not Applicable",
            "Fluoride_Gases": "Not Applicable",
            "Slag": "Not Applicable",
            "Other": "Not Applicable"
        },
        "risk": {
            "Red_Mud": "Not Applicable",
            "SPL": "Not Applicable",
            "Dross": "Not Applicable",
            "Fluoride_Gases": "Not Applicable",
            "Slag": "Not Applicable",
            "Other": "Not Applicable"
        },
        "economic_viability": {
            "Cement_Additive": "Not Applicable",
            "Soil_Stabilization": "Not Applicable",
            "Iron_Extraction": "Not Applicable",
            "Rare_Earth_Extraction": "Not Applicable",
            "SPL_Encapsulation": "Not Applicable",
            "Dross_Recovery": "Not Applicable",
            "Fluoride_Capture": "Not Applicable"
        },
        "additional_numeric": {
            "emission_reduction_kgCO2e_per_t_waste": 0.0,
            "recovery_efficiency": 0.0
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)