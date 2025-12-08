from typing import Dict, Any, List
from dataclasses import dataclass

@dataclass
class MiningParameters:
    mining_method: str
    equipment_type: List[str]
    water_usage: float
    ore_grade: float
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        return cls(
            mining_method=(data.get('Mining Method') or ['Open Pit Mining'])[0],
            equipment_type=list(data.get('Type of Equipment', [])),
            water_usage=float(data.get('Water Usage (m³ per tonne of ore)', 0)),
            ore_grade=float(data.get('Ore Grade (%)', 0))
        )

# Skeletons for other aluminum lifecycle stages
@dataclass
class RefiningParameters:
    energy_mix: str
    bauxite_to_alumina_ratio: float
    caustic_soda_consumption: float

@dataclass
class SmeltingParameters:
    electricity_kwh_per_kg: float
    anode_consumption_kg_per_kg: float

@dataclass
class CastingParameters:
    yield_rate: float
    natural_gas_mj_per_kg: float

@dataclass
class RollingParameters:
    electricity_kwh_per_kg: float
    lubricant_g_per_kg: float

@dataclass
class RecyclingParameters:
    scrap_input_fraction: float
    electricity_kwh_per_kg: float

@dataclass
class TransportParameters:
    mode: str
    distance_km: float
    load_tonnes: float
