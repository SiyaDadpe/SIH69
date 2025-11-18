from __future__ import annotations

"""Compact output generator for Aluminum LCA Engine.

Produces a single aggregated JSON document (not per scenario) matching
the target structure provided by the user, including totals, intensities,
stage breakdown, and recommendations.

This module uses serialized scenario results (already containing impacts,
contributions, parameters) and heuristics to estimate stage metrics where
explicit values are not present. Energy, water, waste, and air impacts are
approximated from available parameters; CO2 uses contribution breakdown.

NOTE: Placeholder calculations (when LCIA methods missing) reduce accuracy.
"""

from typing import Dict, Any, List
from datetime import datetime
import math
import uuid


def _round(v: float | int | None, nd: int = 2) -> float:
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return 0.0
    try:
        return round(float(v), nd)
    except Exception:
        return 0.0


def _estimate_stage_energy(stage: str, params: Dict[str, Any], amount_kg: float = 1000.0) -> float:
    """Estimate stage energy consumption (kWh) for given mass basis.

    Mining: diesel placeholder → 0.05 kg diesel/item converted to ~0.2 kWh per equipment item (rough).
    Beneficiation: electricity_kwh_per_kg * amount.
    Refining: bauxite_to_alumina_ratio * 1.5 kWh/kg alumina (placeholder) * amount.
    Smelting: electricity_kwh_per_kg * amount.
    Manufacturing: electricity_kwh_per_kg * amount.
    Recycling: electricity_kwh_per_kg * amount.
    Valorization/Waste: red mud processing ~0.1 kWh/kg red mud * red mud mass.
    """
    p = params.get(stage, {}) or {}
    if stage == "mining":
        equip = p.get("Type of Equipment", []) or p.get("equipment_type", [])
        return len(equip) * 0.2 * (amount_kg / 1000.0)  # scale modestly
    if stage == "beneficiation":
        return float(p.get("electricity_kwh_per_kg", 0.0)) * amount_kg
    if stage == "refining":
        ratio = float(p.get("bauxite_to_alumina_ratio", 2.5))
        return ratio * 1.5 * (amount_kg / 1.0)  # placeholder
    if stage == "smelting":
        elec = p.get("electricity_kwh_per_kg")
        if elec is None and p.get("electricity_demand") is not None:
            elec = float(p.get("electricity_demand")) / 1000.0
        return float(elec or 0.0) * amount_kg
    if stage == "manufacturing":
        return float(p.get("electricity_kwh_per_kg", 0.0)) * amount_kg
    if stage == "recycling":
        return float(p.get("electricity_kwh_per_kg", 0.0)) * amount_kg
    if stage == "waste":  # valorization
        red_mud_t_per_t = float(p.get("red_mud_per_tonne_alumina", 0.0))
        red_mud_kg = red_mud_t_per_t * 1000.0 * (amount_kg / 1000.0)
        return red_mud_kg * 0.1
    return 0.0


def _estimate_stage_water(stage: str, params: Dict[str, Any], amount_kg: float = 1000.0) -> float:
    p = params.get(stage, {}) or {}
    if stage == "mining":
        w = p.get("Water Usage (m³ per tonne of ore)")
        return float(w or 0.0) * (amount_kg / 1000.0)
    if stage == "beneficiation":
        return float(p.get("water_usage", 0.0)) * amount_kg
    if stage == "refining":
        # Assume 0.0032 m³/kg matching example 3.2 m³ per 1000 kg
        return 3.2 * (amount_kg / 1000.0)
    if stage == "smelting":
        return 0.5 * (amount_kg / 1000.0)  # cooling water placeholder
    if stage == "manufacturing":
        return 1.2 * (amount_kg / 1000.0)
    if stage == "recycling":
        return 0.4 * (amount_kg / 1000.0)
    if stage == "waste":
        return 0.6 * (amount_kg / 1000.0)
    return 0.0


def _estimate_stage_waste(stage: str, params: Dict[str, Any]) -> float:
    p = params.get(stage, {}) or {}
    if stage == "refining":
        # Red mud proxy (t per t alumina * 1000 kg basis → kg) scaled to example magnitude
        red_mud_t = float(p.get("red_mud_per_tonne_alumina", 1.5))
        return red_mud_t * 300  # heuristic scaling
    if stage == "mining":
        return 150.0
    if stage == "beneficiation":
        return 250.0
    if stage == "smelting":
        return 80.0
    if stage == "manufacturing":
        return 120.0
    if stage == "recycling":
        return 100.0
    if stage == "waste":
        return 50.0
    return 0.0


def _estimate_air(stage: str) -> float:
    mapping = {
        "mining": 20.0,
        "beneficiation": 50.0,
        "refining": 180.0,
        "smelting": 350.0,
        "manufacturing": 80.0,
        "recycling": 30.0,
        "waste": 20.0,
    }
    return mapping.get(stage, 0.0)


def _compute_circularity(params: Dict[str, Any]) -> Dict[str, Any]:
    rec = params.get("recycling", {}) or {}
    scrap_frac = rec.get("scrap_input_fraction") or 0.0
    recovery = rec.get("recovery_yield") or 0.0
    score = (scrap_frac * 50.0) + (recovery * 50.0)  # simple 0-100 blend
    if score >= 70:
        rating = "Excellent"
    elif score >= 55:
        rating = "Good"
    elif score >= 40:
        rating = "Fair"
    elif score >= 25:
        rating = "Poor"
    else:
        rating = "Very Poor"
    return {
        "circularityScore": _round(score, 1),
        "circularityRating": rating,
        "materialRecoveryRate": _round(recovery * 100.0, 1)
    }


def _default_recommendations(compact: Dict[str, Any]) -> List[Dict[str, Any]]:
    recs: List[Dict[str, Any]] = []
    stages = compact.get("stageData", [])
    # Find smelting
    smelt = next((s for s in stages if s.get("stageName") == "smelting"), None)
    if smelt and smelt.get("energyConsumption", 0) > compact.get("totalEnergyConsumption", 0) * 0.5:
        recs.append({
            "priority": "HIGH",
            "title": "Optimize Smelting Energy Usage",
            "description": "Smelting dominates energy – consider renewable PPAs, heat recovery, and anode tech upgrades."
        })
    if compact.get("totalCO2Emissions", 0) > 10000:
        recs.append({
            "priority": "HIGH",
            "title": "Implement Carbon Reduction Strategies",
            "description": "High CO2 footprint – evaluate inert anodes, energy source shift, and carbon capture feasibility."
        })
    # Water hotspots (beneficiation + refining)
    ben = next((s for s in stages if s.get("stageName") == "beneficiation"), None)
    refi = next((s for s in stages if s.get("stageName") == "refining"), None)
    if ben and refi and (ben.get("waterUsage", 0) + refi.get("waterUsage", 0)) > compact.get("totalWaterUsage", 0) * 0.5:
        recs.append({
            "priority": "MEDIUM",
            "title": "Enhance Water Recycling",
            "description": "Beneficiation & refining dominate water – implement closed-loop systems and process water recovery."
        })
    # Refining waste (red mud)
    if refi and refi.get("wasteGeneration", 0) > 400:
        recs.append({
            "priority": "HIGH",
            "title": "Improve Red Mud Management",
            "description": "Refining waste high – explore valorization (cement/geopolymer) and improved storage strategies."
        })
    # Air emissions from smelting
    if smelt and smelt.get("airQualityImpact", 0) > 300:
        recs.append({
            "priority": "MEDIUM",
            "title": "Upgrade Emission Controls",
            "description": "Smelting air impact elevated – adopt advanced scrubbing & HF capture systems."
        })
    return recs


def build_compact_output(serialized: Dict[str, Any]) -> Dict[str, Any]:
    """Build compact JSON from a single serialized scenario dict.

    Expects `serialized` to be the value for one scenario produced by
    AluminumLCAEngine._serialize_results(...)
    """
    scenario_name = serialized.get("scenario_name") or "Scenario"
    params = serialized.get("parameters", {}) or {}
    contributions = serialized.get("contributions", {}) or {}
    # amount basis 1000 kg used in engine impact calculations
    amount_kg = 1000.0

    # Stage order mapping; unify naming (waste/valorization)
    stage_order = ["mining", "beneficiation", "refining", "smelting", "manufacturing", "recycling", "waste"]
    stage_data: List[Dict[str, Any]] = []
    total_energy = 0.0
    total_co2 = 0.0
    total_water = 0.0
    total_waste = 0.0
    total_air = 0.0

    for stage in stage_order:
        energy = _estimate_stage_energy(stage, params, amount_kg)
        water = _estimate_stage_water(stage, params, amount_kg)
        waste = _estimate_stage_waste(stage, params)
        air = _estimate_air(stage)
        co2 = contributions.get(stage, 0.0)
        total_energy += energy
        total_co2 += co2
        total_water += water
        total_waste += waste
        total_air += air
        stage_data.append({
            "stageName": stage if stage != "waste" else "valorization",
            "energyConsumption": _round(energy, 2),
            "co2Emissions": _round(co2, 2),
            "waterUsage": _round(water, 2),
            "wasteGeneration": _round(waste, 2),
            "airQualityImpact": _round(air, 2),
            "completed": True
        })

    circularity = _compute_circularity(params)

    # Determine if results were real calculations (no placeholders)
    real_calc = not serialized.get("placeholders_used", True)

    compact = {
        "_id": {"$oid": str(uuid.uuid4())},
        "projectName": scenario_name,
        "location": params.get("mining", {}).get("location", "GLO"),
        "analysisDate": {"$date": {"$numberLong": str(int(datetime.utcnow().timestamp() * 1000))}},
        "totalEnergyConsumption": _round(total_energy, 2),
        "totalCO2Emissions": _round(total_co2, 2),
        "totalWaterUsage": _round(total_water, 2),
        "totalWasteGeneration": _round(total_waste, 2),
        "totalAirQualityImpact": _round(total_air, 2),
        "energyIntensity": _round(total_energy / (amount_kg / 1000.0), 2),  # per tonne
        "carbonIntensity": _round(total_co2 / (amount_kg / 1000.0), 2),
        "circularityScore": circularity["circularityScore"],
        "circularityRating": circularity["circularityRating"],
        "materialRecoveryRate": circularity["materialRecoveryRate"],
        "status": "completed",
        "calculationParams": {"wizardData": stage_order},
        "stageData": stage_data,
        "impactBreakdown": [],  # reserved
        "realCalculation": real_calc,
    }

    compact["recommendations"] = _default_recommendations(compact)

    return compact
