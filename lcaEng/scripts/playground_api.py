"""
FastAPI Server for Playground Quick LCA Calculations

Direct endpoint for frontend playground - no database, no save, just fast calculations.
Run with: uvicorn playground_api:app --host 0.0.0.0 --port 8100 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime
import sys
from pathlib import Path

# Add parent directory to path to import src modules
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import LCA engine components
from src.engine.main_engine import AluminumLCAEngine
from src.models.wizard_input_mapper import map_wizard_to_engine_params

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aluminum LCA Playground API",
    description="Fast LCA calculations for interactive playground",
    version="1.0.0"
)

# Configure CORS - allow all origins for playground
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend can be on any port during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LCA engine (singleton)
engine = None

@app.on_event("startup")
async def startup_event():
    """Initialize LCA engine on startup"""
    global engine
    try:
        logger.info("Initializing Aluminum LCA Engine...")
        engine = AluminumLCAEngine()
        logger.info("✓ LCA Engine ready for playground calculations")
    except Exception as e:
        logger.error(f"Failed to initialize LCA engine: {e}")
        raise


# Pydantic models for request/response
class PlaygroundInput(BaseModel):
    """Playground form data structure"""
    mining: Optional[Dict[str, Any]] = Field(default={}, alias="1. Mining (Bauxite Extraction)")
    beneficiation: Optional[Dict[str, Any]] = Field(default={}, alias="2. Beneficiation (Ore Processing)")
    refining: Optional[Dict[str, Any]] = Field(default={}, alias="3. Alumina Refining (Bayer Process)")
    smelting: Optional[Dict[str, Any]] = Field(default={}, alias="4. Aluminium Smelting (Hall-Héroult)")
    manufacturing: Optional[Dict[str, Any]] = Field(default={}, alias="5. Fabrication & Use Phase")
    recycling: Optional[Dict[str, Any]] = Field(default={}, alias="6. Recycling (End-of-Life)")
    valorization: Optional[Dict[str, Any]] = Field(default={}, alias="7. Waste Valorization")

    class Config:
        populate_by_name = True


class RecommendationItem(BaseModel):
    """Individual recommendation"""
    type: str  # critical, warning, success, info
    title: str
    message: str
    icon: str


class PlaygroundResponse(BaseModel):
    """Playground calculation response"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


def map_playground_to_engine_params(playground_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform playground simplified inputs into LCA engine parameter format
    
    The playground has simplified fields compared to wizard.
    This function maps them to the expected engine structure.
    """
    params = {
        "mining": {},
        "beneficiation": {},
        "refining": {},
        "smelting": {},
        "manufacturing": {},
        "recycling": {},
        "valorization": {}
    }
    
    # Mining stage
    mining = playground_data.get("1. Mining (Bauxite Extraction)", {})
    if mining:
        params["mining"] = {
            "mining_method": mining.get("Mining Method", "Open-pit"),
            "ore_grade_percent": float(mining.get("Ore Grade (%)", 45)),
            "fuel_type": mining.get("Fuel Type", "Diesel"),
            "distance_to_processing_km": float(mining.get("Transport Distance (km)", 50)),
            "water_use_m3_per_tonne": float(mining.get("Water Use (m³/tonne)", 2.5)),
            "land_disturbance_hectares": float(mining.get("Land Disturbance (hectares)", 100)),
            "rehabilitation_plan": mining.get("Rehabilitation", ["Progressive"]),
        }
    
    # Beneficiation stage
    beneficiation = playground_data.get("2. Beneficiation (Ore Processing)", {})
    if beneficiation:
        params["beneficiation"] = {
            "crushing_energy_kwh_per_tonne": float(beneficiation.get("Crushing Energy (kWh/tonne)", 25)),
            "grinding_energy_kwh_per_tonne": float(beneficiation.get("Grinding Energy (kWh/tonne)", 35)),
            "water_consumption_m3_per_tonne": float(beneficiation.get("Water Use (m³/tonne)", 2.5)),
            "tailings_management": beneficiation.get("Tailings Management", "Dry stacking"),
            "recovery_efficiency_percent": float(beneficiation.get("Recovery Efficiency (%)", 92)),
        }
    
    # Refining stage (Bayer Process)
    refining = playground_data.get("3. Alumina Refining (Bayer Process)", {})
    if refining:
        params["refining"] = {
            "thermal_energy_gj_per_tonne": float(refining.get("Thermal Energy (GJ/tonne)", 11)),
            "electrical_energy_kwh_per_tonne": float(refining.get("Electrical Energy (kWh/tonne)", 280)),
            "caustic_soda_kg_per_tonne": float(refining.get("Caustic Soda (kg/tonne)", 120)),
            "lime_kg_per_tonne": float(refining.get("Lime (kg/tonne)", 50)),
            "red_mud_generation_kg_per_tonne": float(refining.get("Red Mud Generation (kg/tonne)", 1500)),
            "red_mud_management": refining.get("Red Mud Management", "Dry disposal"),
            "water_recycling_percent": float(refining.get("Water Recycling (%)", 85)),
        }
    
    # Smelting stage (Hall-Héroult)
    smelting = playground_data.get("4. Aluminium Smelting (Hall-Héroult)", {})
    if smelting:
        params["smelting"] = {
            "electrical_energy_kwh_per_tonne": float(smelting.get("Electrical Energy (kWh/tonne)", 15000)),
            "energy_source": smelting.get("Energy Source", "Grid"),
            "anode_type": smelting.get("Anode Type", "Prebaked"),
            "carbon_consumption_kg_per_tonne": float(smelting.get("Carbon Consumption (kg/tonne)", 430)),
            "pfc_emissions_kg_co2e_per_tonne": float(smelting.get("PFC Emissions (kg CO₂e/tonne)", 0.5)),
            "alumina_to_aluminum_ratio": float(smelting.get("Alumina/Aluminium Ratio", 1.92)),
            "cell_efficiency_percent": float(smelting.get("Cell Efficiency (%)", 95)),
        }
    
    # Manufacturing/Fabrication
    manufacturing = playground_data.get("5. Fabrication & Use Phase", {})
    if manufacturing:
        params["manufacturing"] = {
            "fabrication_energy_kwh_per_tonne": float(manufacturing.get("Fabrication Energy (kWh/tonne)", 3500)),
            "scrap_rate_percent": float(manufacturing.get("Scrap Rate (%)", 15)),
            "product_lifetime_years": float(manufacturing.get("Product Lifetime (years)", 25)),
            "recycled_content_percent": float(manufacturing.get("Recycled Content (%)", 30)),
            "surface_treatment": manufacturing.get("Surface Treatment", ["Anodizing"]),
        }
    
    # Recycling (End-of-Life)
    recycling = playground_data.get("6. Recycling (End-of-Life)", {})
    if recycling:
        params["recycling"] = {
            "collection_rate_percent": float(recycling.get("Collection Rate (%)", 85)),
            "sorting_efficiency_percent": float(recycling.get("Sorting Efficiency (%)", 90)),
            "melting_energy_kwh_per_tonne": float(recycling.get("Melting Energy (kWh/tonne)", 500)),
            "recovery_yield_percent": float(recycling.get("Recovery Yield (%)", 92)),
            "recycling_process": recycling.get("Recycling Process", "Remelting"),
        }
    
    # Waste Valorization
    valorization = playground_data.get("7. Waste Valorization", {})
    if valorization:
        params["valorization"] = {
            "waste_type": valorization.get("Waste Type", ["Dross"]),
            "recovery_method": valorization.get("Recovery Method", "Salt slag recycling"),
            "waste_utilized_percent": float(valorization.get("Waste Utilized (%)", 70)),
            "byproduct_credit_percent": float(valorization.get("Byproduct Credit (%)", 15)),
        }
    
    return params


def generate_recommendations(co2: float, energy: float, score: float, input_data: Dict) -> List[Dict]:
    """Generate actionable recommendations based on results"""
    recommendations = []
    
    # High impact detection
    if score < 50:
        recommendations.append({
            "type": "critical",
            "title": "High Environmental Impact Detected",
            "message": "Consider switching to renewable energy sources and increasing recycled content to at least 50%.",
            "icon": "alert-triangle"
        })
    
    # CO2 optimization
    if co2 > 10000:
        recommendations.append({
            "type": "warning",
            "title": "CO₂ Emissions Above Benchmark",
            "message": f"Current emissions: {co2:.0f} kg CO₂e/tonne. Switch to renewable energy in smelting to reduce by up to 40%.",
            "icon": "trending-down"
        })
    
    # Energy efficiency
    if energy > 16000:
        recommendations.append({
            "type": "warning",
            "title": "High Energy Consumption",
            "message": f"Current consumption: {energy:.0f} kWh/tonne. Optimize cell efficiency in smelting and use heat recovery.",
            "icon": "zap"
        })
    
    # Excellent performance
    if score >= 70:
        recommendations.append({
            "type": "success",
            "title": "Excellent Sustainability Performance",
            "message": "Your configuration demonstrates best practices with low environmental impact. Keep it up!",
            "icon": "check-circle"
        })
    elif score >= 55:
        recommendations.append({
            "type": "info",
            "title": "Good Performance",
            "message": "You're on the right track. Consider the suggestions below for further optimization.",
            "icon": "thumbs-up"
        })
    
    # Recycling opportunities
    recycling_data = input_data.get("6. Recycling (End-of-Life)", {})
    if recycling_data:
        recovery_yield = float(recycling_data.get("Recovery Yield (%)", 85))
        if recovery_yield < 95:
            recommendations.append({
                "type": "info",
                "title": "Optimize Recycling Recovery",
                "message": f"Current yield: {recovery_yield}%. Increase to 95%+ using advanced sorting and remelting techniques.",
                "icon": "recycle"
            })
    
    # Renewable energy
    smelting_data = input_data.get("4. Aluminium Smelting (Hall-Héroult)", {})
    if smelting_data and smelting_data.get("Energy Source") == "Grid":
        recommendations.append({
            "type": "info",
            "title": "Switch to Renewable Energy",
            "message": "Grid electricity has higher carbon intensity. Use hydroelectric or solar to reduce emissions by 30-50%.",
            "icon": "sun"
        })
    
    # Waste valorization
    valorization_data = input_data.get("7. Waste Valorization", {})
    if valorization_data:
        waste_utilized = float(valorization_data.get("Waste Utilized (%)", 0))
        if waste_utilized < 60:
            recommendations.append({
                "type": "info",
                "title": "Increase Waste Valorization",
                "message": f"Currently utilizing {waste_utilized}% of waste. Target 80%+ to recover valuable materials and reduce disposal costs.",
                "icon": "leaf"
            })
    
    return recommendations


@app.post("/api/playground/calculate", response_model=PlaygroundResponse)
async def calculate_playground_lca(request: PlaygroundInput):
    """
    Fast LCA calculation for playground - no database save
    
    Accepts simplified playground inputs and returns aggregated LCA results
    with recommendations.
    """
    try:
        if engine is None:
            raise HTTPException(status_code=503, detail="LCA Engine not initialized")
        
        # Convert request to dict
        playground_data = request.model_dump(by_alias=True)
        
        logger.info(f"Playground calculation requested at {datetime.now()}")
        
        # Map playground inputs to engine parameters
        engine_params = map_playground_to_engine_params(playground_data)
        
        # Run LCA calculation
        result = engine.analyze_single_scenario(
            scenario_name="Playground Quick Calc",
            parameters=engine_params
        )
        
        # Extract key metrics
        impacts = result.get("impacts", {})
        
        # Get climate change and energy consumption
        climate_change_kg = impacts.get("climate change", {}).get("total", 12000)  # kg CO2e per tonne
        energy_kwh = impacts.get("cumulative energy demand", {}).get("total", 18000)  # kWh per tonne
        
        # Calculate ratings
        co2_rating = "Excellent" if climate_change_kg < 8000 else \
                     "Good" if climate_change_kg < 10000 else \
                     "Average" if climate_change_kg < 12000 else "Poor"
        
        energy_rating = "Excellent" if energy_kwh < 14000 else \
                       "Good" if energy_kwh < 16000 else \
                       "Average" if energy_kwh < 18000 else "Poor"
        
        # Calculate overall score (0-100, higher is better)
        # Baseline: 12000 kg CO2, 18000 kWh
        co2_score = max(0, min(100, 100 - ((climate_change_kg - 6000) / 100)))
        energy_score = max(0, min(100, 100 - ((energy_kwh - 10000) / 120)))
        overall_score = (co2_score + energy_score) / 2
        
        # Generate recommendations
        recommendations = generate_recommendations(
            climate_change_kg,
            energy_kwh,
            overall_score,
            playground_data
        )
        
        # Build response
        response_data = {
            "co2": round(climate_change_kg, 1),
            "energy": round(energy_kwh, 1),
            "co2Rating": co2_rating,
            "energyRating": energy_rating,
            "overallScore": round(overall_score, 1),
            "baseline": {
                "co2": 12000,
                "energy": 18000
            },
            "impacts": impacts,
            "recommendations": recommendations,
            "calculatedAt": datetime.now().isoformat(),
            "calculation_time_seconds": 0.5  # Approximate
        }
        
        logger.info(f"✓ Calculation complete: CO2={climate_change_kg:.0f}, Energy={energy_kwh:.0f}, Score={overall_score:.1f}")
        
        return PlaygroundResponse(success=True, data=response_data)
    
    except Exception as e:
        logger.error(f"Playground calculation error: {str(e)}", exc_info=True)
        return PlaygroundResponse(
            success=False,
            error=f"Calculation failed: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "engine_ready": engine is not None,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "Aluminum LCA Playground API",
        "version": "1.0.0",
        "endpoints": {
            "calculate": "/api/playground/calculate (POST)",
            "health": "/health (GET)"
        },
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("Starting Aluminum LCA Playground API Server")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8100, reload=True)
