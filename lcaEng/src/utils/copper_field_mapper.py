"""Copper Field Mapper - Maps wizard copper fields to engine format

Handles the new copper workflow structure with nested stage objects:
- copperMining
- copperBeneficiation
- copperRefining
- copperManufacturing
- copperUsePhase
- copperRecycling
- copperValorization
"""

from typing import Any, Dict


def _safe_get(obj: Dict, key: str, default=None):
    """Safely get value from dict, handling None values."""
    val = obj.get(key, default)
    return val if val is not None else default


def map_copper_fields_to_engine(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Map copper wizard workflow to generic engine format.
    
    Args:
        doc: Copper workflow document from wizardworkflowoutputs
        
    Returns:
        Engine-compatible parameter dictionary
    """
    
    # ========== MINING ==========
    mining_data = doc.get("copperMining", {}) or {}
    mining_params = {
        "ore_tonnage": 1000.0,  # Default 1 tonne ore
        "ore_grade_percent": 0.5,  # Typical copper ore grade 0.5%
        "mining_method": "open_pit",  # Default
        "energy_per_tonne_ore": _safe_get(mining_data, "mining_energy_MJ_per_t_ore", 0.0) / 3.6,  # MJ to kWh
        "water_usage": _safe_get(mining_data, "mining_water_m3_per_t_ore", 0.0),
        "co2_emissions": _safe_get(mining_data, "mining_co2_kg_per_t_ore", 0.0),
        "waste_generation": _safe_get(mining_data, "mining_waste_kg_per_t_ore", 0.0),
        "completed": True,
        "sustainabilityParameters": mining_data.get("sustainabilityParameters", {})
    }
    
    # ========== BENEFICIATION ==========
    bene_data = doc.get("copperBeneficiation", {}) or {}
    bene_params = {
        "concentrate_tonnage": 1.0,  # Default 1 tonne concentrate
        "beneficiation_method": "flotation",  # Default copper method
        "energy_consumption": _safe_get(bene_data, "beneficiation_energy_kWh_per_t", 0.0),
        "water_usage": _safe_get(bene_data, "beneficiation_water_m3_per_t", 0.0),
        "recovery_rate": _safe_get(bene_data, "beneficiation_recovery_percent", 85.0),
        "tailings_generation": _safe_get(bene_data, "beneficiation_tailings_t_per_t", 0.0),
        "completed": True,
        "sustainabilityParameters": bene_data.get("sustainabilityParameters", {})
    }
    
    # ========== REFINING (SMELTING + ELECTROREFINING) ==========
    refining_data = doc.get("copperRefining", {}) or {}
    
    # Split refining energy between smelting (60%) and electrorefining (40%)
    total_refining_energy = _safe_get(refining_data, "refining_energy_kWh_per_t_Cu", 0.0)
    smelting_energy = total_refining_energy * 0.6
    electrorefining_energy = total_refining_energy * 0.4
    
    smelting_params = {
        "metal_tonnage": 1.0,
        "smelting_method": "flash_smelting",
        "energy_consumption": smelting_energy,
        "fuel_type": "natural_gas",
        "purity_percent": 98.0,  # Blister copper purity
        "completed": True,
        "sustainabilityParameters": {
            "renewablePowerPercent": _safe_get(refining_data.get("sustainabilityParameters", {}), "pyro_renewablePowerPercent", 0.0),
            "slagRecyclingRate": _safe_get(refining_data.get("sustainabilityParameters", {}), "pyro_slagRecyclingRate", 0.0),
            "so2CaptureIntoSulfuricAcid": _safe_get(refining_data.get("sustainabilityParameters", {}), "pyro_so2CaptureIntoSulfuricAcid", False),
            "flueGasCleaning": _safe_get(refining_data.get("sustainabilityParameters", {}), "pyro_flueGasCleaning", False),
            "wasteHeatCapturePercent": _safe_get(refining_data.get("sustainabilityParameters", {}), "pyro_wasteHeatCapturePercent", 0.0)
        }
    }
    
    refining_params = {
        "metal_tonnage": 1.0,
        "refining_method": "electrorefining",
        "energy_consumption": electrorefining_energy,
        "purity_target": _safe_get(refining_data, "refining_cathode_purity_percent", 99.99),
        "precious_metals_recovery": _safe_get(refining_data, "refining_precious_metals_recovery_percent", 0.0),
        "wastewater_volume": _safe_get(refining_data, "refining_wastewater_m3_per_t_Cu", 0.0),
        "completed": True,
        "sustainabilityParameters": {
            "acidRecoveryPercent": _safe_get(refining_data.get("sustainabilityParameters", {}), "hydro_acidRecoveryPercent", 0.0),
            "organicSolventRecovery": _safe_get(refining_data.get("sustainabilityParameters", {}), "hydro_organicSolventRecovery", False),
            "renewableElectricityUseInElectrowinning": _safe_get(refining_data.get("sustainabilityParameters", {}), "hydro_renewableElectricityUseInElectrowinning", False),
            "recycledWaterRate": _safe_get(refining_data.get("sustainabilityParameters", {}), "hydro_recycledWaterRate", 0.0)
        }
    }
    
    # ========== MANUFACTURING ==========
    mfg_data = doc.get("copperManufacturing", {}) or {}
    manufacturing_params = {
        "product_tonnage": 1.0,
        "manufacturing_processes": _safe_get(mfg_data, "manufacturingProcesses", []),
        "alloying": _safe_get(mfg_data, "alloying", False),
        "surface_treatment": _safe_get(mfg_data, "surfaceTreatment", []),
        "energy_consumption": _safe_get(mfg_data, "manufacturing_energy_kWh_per_t", 0.0),
        "yield_percent": _safe_get(mfg_data, "manufacturing_yield_percent", 95.0),
        "co2_emissions": _safe_get(mfg_data, "manufacturing_co2_kg_per_t", 0.0),
        "scrap_recovery": _safe_get(mfg_data, "manufacturing_scrap_recovery_percent", 0.0),
        "completed": True,
        "sustainabilityParameters": mfg_data.get("sustainabilityParameters", {})
    }
    
    # ========== USE PHASE ==========
    use_data = doc.get("copperUsePhase", {}) or {}
    use_phase_params = {
        "efficiency_percent": _safe_get(use_data, "usePhase_efficiency_percent", 100.0),
        "lifetime_years": _safe_get(use_data, "usePhase_lifetime_years", 30.0),
        "ghg_avoided": _safe_get(use_data, "usePhase_ghg_avoided_kg", 0.0),
        "energy_savings_percent": _safe_get(use_data, "usePhase_energy_savings_percent", 0.0),
        "completed": True,
        "sustainabilityParameters": use_data.get("sustainabilityParameters", {})
    }
    
    # ========== RECYCLING ==========
    recycling_data = doc.get("copperRecycling", {}) or {}
    recycling_params = {
        "scrap_tonnage": 1.0,
        "scrap_source": _safe_get(recycling_data, "scrapSource", []),
        "sorting_method": _safe_get(recycling_data, "sortingMethod", []),
        "pre_treatment_required": _safe_get(recycling_data, "preTreatmentRequired", False),
        "pre_treatment_type": _safe_get(recycling_data, "preTreatmentType", []),
        "alloying_required": _safe_get(recycling_data, "alloyingRequired", False),
        "energy_consumption": _safe_get(recycling_data, "recycling_energy_kWh_per_t", 0.0),
        "recovery_yield": _safe_get(recycling_data, "recycling_recovery_yield_percent", 95.0),
        "co2_savings": _safe_get(recycling_data, "recycling_co2_savings_kg_per_t", 0.0),
        "collection_rate": _safe_get(recycling_data, "recycling_collection_rate_percent", 0.0),
        "completed": True,
        "sustainabilityParameters": recycling_data.get("sustainabilityParameters", {})
    }
    
    # ========== VALORIZATION ==========
    valor_data = doc.get("copperValorization", {}) or {}
    valorization_params = {
        "waste_tonnage": 1.0,
        "recovery_rate": _safe_get(valor_data, "valorization_recovery_rate_percent", 0.0),
        "revenue_per_tonne": _safe_get(valor_data, "valorization_revenue_usd_per_t", 0.0),
        "ghg_emissions": _safe_get(valor_data, "valorization_ghg_emissions_kg", 0.0),
        "circularity_score": _safe_get(valor_data, "valorization_circularity_score", 0.0),
        "completed": True,
        "sustainabilityParameters": valor_data.get("sustainabilityParameters", {})
    }
    
    # ========== BUILD ENGINE FORMAT ==========
    engine_params = {
        "name": doc.get("name", "Copper Workflow"),
        "description": doc.get("description", ""),
        "userId": doc.get("userId"),
        "workflowId": doc.get("_id"),
        "metalType": "Copper",  # Always copper
        "location": doc.get("location", "Not specified"),
        
        # Stages
        "mining": mining_params,
        "beneficiation": bene_params,
        "smelting": smelting_params,
        "refining": refining_params,
        "manufacturing": manufacturing_params,
        "usePhase": use_phase_params,
        "recycling": recycling_params,
        "valorization": valorization_params,
        
        # Metadata
        "createdAt": doc.get("createdAt"),
        "updatedAt": doc.get("updatedAt"),
        "status": doc.get("status", "draft"),
        "tags": doc.get("tags", [])
    }
    
    return engine_params
