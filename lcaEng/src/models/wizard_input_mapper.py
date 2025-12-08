from __future__ import annotations

"""
Wizard Input Mapper

Converts the LCA Wizard-style MongoDB JSON document into the Aluminum LCA Engine
internal parameter structure expected by DatabaseManager/ParameterManager.

Handles Mongo Extended JSON numbers like {"$numberInt": "123"} and performs
unit conversions where needed (e.g., per tonne → per kg).
"""

from typing import Any, Dict


def _as_number(value: Any) -> Any:
    """Convert Mongo-style extended numbers to native Python numbers.

    Supports {"$numberInt": "123"}, {"$numberDouble": "1.23"}, {"$numberLong": "..."}.
    Returns the original value if no conversion applies.
    """
    if isinstance(value, dict):
        if "$numberInt" in value:
            try:
                return int(value["$numberInt"])  # type: ignore[arg-type]
            except Exception:
                try:
                    return float(value["$numberInt"])  # fallback
                except Exception:
                    return value
        if "$numberLong" in value:
            try:
                return int(value["$numberLong"])  # type: ignore[arg-type]
            except Exception:
                try:
                    return float(value["$numberLong"])  # fallback
                except Exception:
                    return value
        if "$numberDouble" in value:
            try:
                return float(value["$numberDouble"])  # type: ignore[arg-type]
            except Exception:
                return value
    return value


def _num(val: Any, default: float | int = 0) -> float:
    """Parse value to float using _as_number, fallback to default."""
    v = _as_number(val)
    try:
        return float(v)
    except Exception:
        return float(default)


def map_wizard_to_engine_params(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Map a wizard JSON document to the engine's parameter dict.

    Args:
        doc: The wizard-style JSON/dict for a single LCA run.

    Returns:
        Dict structured as expected by the engine with keys for
        stages: mining, beneficiation, refining, smelting, manufacturing, recycling, waste
    """
    mining = doc.get("mining", {}) or {}
    beneficiation = doc.get("beneficiation", {}) or {}
    refining = doc.get("refining", {}) or {}
    smelting = doc.get("smelting", {}) or {}
    manufacturing = doc.get("manufacturing", {}) or {}
    recycling = doc.get("recycling", {}) or {}
    valorization = doc.get("valorization", {}) or {}

    # ---------- Mining ----------
    ore_grade_pct = _num(mining.get("mining_ore_grade_percent"), default=0)
    mining_method = mining.get("mining_method") or "Open Pit Mining"
    # Use provided emissions/energy if needed later; engine minimally uses ore grade + method + optional water

    mining_params = {
        # Accept both canonical and UI-friendly keys to play nice with DatabaseManager
        "Mining Method": [str(mining_method).replace("openPit", "Open Pit Mining")],
        "Ore Grade (%)": ore_grade_pct,
        # Water use at mining not present; keep default if engine has one
    }

    # ---------- Beneficiation ----------
    # Convert per tonne of ore to per kg
    bene_water_m3_per_t = _num(beneficiation.get("beneficiation_water_m3_per_t_ore"), default=0)
    bene_elec_kwh_per_t = _num(beneficiation.get("beneficiation_electricity_kWh_per_t_ore"), default=0)
    beneficiation_params = {
        "water_usage": bene_water_m3_per_t / 1000.0,  # m3 per t → m3 per kg
        "electricity_kwh_per_kg": bene_elec_kwh_per_t / 1000.0,  # kWh per t → kWh per kg
    }

    # ---------- Refining (alumina) ----------
    caustic_kg_per_t = _num(refining.get("refining_caustic_soda_kg_per_t_alumina"), default=0.0)
    refining_params = {
        "energy_mix": "grid_average",
        "bauxite_to_alumina_ratio": _num(refining.get("bauxite_to_alumina_ratio"), default=2.5),
        "caustic_soda_consumption": caustic_kg_per_t / 1000.0,  # kg/t → kg/kg
        # optional: pass through ore grade if present upstream
        "ore_grade": ore_grade_pct if ore_grade_pct else None,
    }

    # ---------- Smelting ----------
    # Prefer explicitly provided kWh/t; DatabaseManager can also accept electricity_demand which it divides by 1000
    smelt_kwh_per_t = _num(smelting.get("smelting_energy_kWh_per_t_al"), default=0.0)
    smelt_co2_kg_per_t = _num(smelting.get("smelting_co2_kg_per_t_al"), default=0.0)
    smelting_params = {
        "smelting_technology": smelting.get("cell_technology", "Prebake"),
        "electricity_demand": smelt_kwh_per_t,  # DatabaseManager converts to kWh/kg
        "co2_emissions": smelt_co2_kg_per_t / 1000.0,  # kg/t → kg/kg
        "electricity_source": "grid",  # default; adjust if your wizard provides it
    }

    # ---------- Manufacturing ----------
    # Convert MJ/t → kWh/kg (1 MJ = 0.277778 kWh, then /1000)
    manu_mj_per_t = _num(manufacturing.get("manufacturing_energy_MJ_per_t_product"), default=0.0)
    manu_kwh_per_t = manu_mj_per_t * 0.2777777778
    manufacturing_params = {
        "electricity_kwh_per_kg": manu_kwh_per_t / 1000.0,
        # Optional: include yield or transport if later used by engine
        "yield_rate": None,
    }

    # ---------- Recycling ----------
    rec_kwh_per_t = _num(recycling.get("recycling_energy_kWh_per_t_Al"), default=0.0)
    recycling_params = {
        "electricity_kwh_per_kg": rec_kwh_per_t / 1000.0,
        "scrap_input_fraction": _num(recycling.get("scrap_input_percentage"), default=0.0) / 100.0,
        "recovery_yield": _num(recycling.get("recycling_recovery_yield_percent"), default=95) / 100.0,
    }

    # ---------- Waste / Valorization ----------
    red_mud_kg_per_t_alumina = _num(refining.get("refining_red_mud_kg_per_t_alumina"), default=0.0)
    waste_params = {
        "red_mud_per_tonne_alumina": red_mud_kg_per_t_alumina / 1000.0,  # kg/t → t/t
        "valorization_rate": _num(valorization.get("valorization_recovery_efficiency_percent"), default=0.0) / 100.0,
    }

    # Build final parameter structure; keep None values out
    def _clean(d: Dict[str, Any]) -> Dict[str, Any]:
        return {k: v for k, v in d.items() if v is not None}

    return {
        "mining": _clean(mining_params),
        "beneficiation": _clean(beneficiation_params),
        "refining": _clean(refining_params),
        "smelting": _clean(smelting_params),
        "manufacturing": _clean(manufacturing_params),
        "recycling": _clean(recycling_params),
        "waste": _clean(waste_params),
    }
