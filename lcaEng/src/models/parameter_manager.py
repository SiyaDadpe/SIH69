"""
Parameter Manager for Aluminum LCA Engine

Handles loading, validation, and modification of process parameters
for all 7 aluminum production stages.
"""

import json
from pathlib import Path
from typing import Any, Dict, Optional
import copy


class ParameterManager:
    """Manages parameters for all aluminum production stages with validation and scenario creation."""
    
    def __init__(self, default_params_path: Optional[Path] = None):
        """Initialize parameter manager with defaults.
        
        Args:
            default_params_path: Path to JSON file with default parameters.
                                If None, uses data/default_parameters.json
        """
        if default_params_path is None:
            default_params_path = Path("data/default_parameters.json")
        
        self.default_params_path = default_params_path
        self.default_parameters = self.load_default_parameters()
    
    def load_default_parameters(self) -> Dict[str, Any]:
        """Load comprehensive parameter structure from JSON file."""
        if self.default_params_path.exists():
            with open(self.default_params_path, 'r') as f:
                return json.load(f)
        
        # Fallback to hardcoded structure if file not found
        return {
            "mining": {
                "Mining Method": ["Open Pit Mining"],
                "Ore Grade (%)": 45,
                "Type of Equipment": ["Loaders", "Haul Trucks", "Drills"],
                "Water Usage (m³ per tonne of ore)": 2.5,
                "Land Use / Biodiversity Impact": ["Moderate"]
            },
            "beneficiation": {
                "Process": "Crushing and Screening",
                "electricity_kwh_per_kg": 0.1,
                "water_usage": 0.5
            },
            "refining": {
                "Process": "Bayer Process",
                "energy_mix": "grid_average",
                "bauxite_to_alumina_ratio": 2.5,
                "caustic_soda_consumption": 0.1,
                "ore_grade": 45
            },
            "smelting": {
                "Technology": "Hall-Héroult Process",
                "electricity_kwh_per_kg": 13.5,
                "anode_consumption_kg_per_kg": 0.4,
                "electricity_source": "grid",
                "co2_emissions": 1.5
            },
            "casting": {
                "yield_rate": 0.95,
                "natural_gas_mj_per_kg": 2.0
            },
            "manufacturing": {
                "Process": "Rolling/Forming",
                "electricity_kwh_per_kg": 0.75,
                "lubricant_g_per_kg": 1.2,
                "yield_rate": 0.98
            },
            "recycling": {
                "scrap_input_fraction": 0.5,
                "electricity_kwh_per_kg": 0.6,
                "recovery_yield": 0.95
            },
            "transport": {
                "mode": "truck",
                "distance_km": 250,
                "load_tonnes": 20
            },
            "waste": {
                "red_mud_per_tonne_alumina": 1.5,
                "valorization_rate": 0.1
            }
        }
    
    def create_scenario_from_user_input(self, user_modifications: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Create scenario based on user modifications to defaults.
        
        Args:
            user_modifications: Dict mapping stage names to parameter modifications.
                               Example: {"smelting": {"electricity_kwh_per_kg": 12.0}}
        
        Returns:
            Complete parameter dict with modifications applied.
        """
        scenario = copy.deepcopy(self.default_parameters)
        
        for stage, modifications in user_modifications.items():
            # Normalize stage name (handle various formats)
            stage_key = self._normalize_stage_name(stage)
            
            if stage_key in scenario:
                if isinstance(scenario[stage_key], dict) and isinstance(modifications, dict):
                    scenario[stage_key].update(modifications)
                else:
                    scenario[stage_key] = modifications
            else:
                # Create new stage if doesn't exist
                scenario[stage_key] = modifications
        
        return scenario
    
    def _normalize_stage_name(self, stage: str) -> str:
        """Normalize stage name to match internal keys."""
        # Map common variations to internal keys
        stage_lower = stage.lower().strip()
        
        mappings = {
            "mining": "mining",
            "bauxite": "mining",
            "1. mining": "mining",
            
            "beneficiation": "beneficiation",
            "crushing": "beneficiation",
            "2. beneficiation": "beneficiation",
            
            "refining": "refining",
            "alumina": "refining",
            "bayer": "refining",
            "3. alumina refining": "refining",
            
            "smelting": "smelting",
            "hall-héroult": "smelting",
            "4. aluminium smelting": "smelting",
            
            "casting": "casting",
            "5. casting": "casting",
            
            "manufacturing": "manufacturing",
            "rolling": "manufacturing",
            "forming": "manufacturing",
            "5. manufacturing": "manufacturing",
            
            "recycling": "recycling",
            "6. recycling": "recycling",
            
            "transport": "transport",
            "transportation": "transport",
            
            "waste": "waste",
            "valorization": "waste",
            "7. waste": "waste"
        }
        
        for key, normalized in mappings.items():
            if key in stage_lower:
                return normalized
        
        return stage_lower
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> tuple[bool, list[str]]:
        """Validate parameter structure and values.
        
        Args:
            parameters: Parameter dict to validate
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Check required stages
        required_stages = ["mining", "refining", "smelting"]
        for stage in required_stages:
            if stage not in parameters:
                errors.append(f"Missing required stage: {stage}")
        
        # Validate numeric ranges
        if "smelting" in parameters:
            elec = parameters["smelting"].get("electricity_kwh_per_kg")
            if elec is not None:
                try:
                    elec_val = float(elec)
                    if elec_val < 0 or elec_val > 30:
                        errors.append(f"Smelting electricity out of reasonable range: {elec_val} kWh/kg")
                except (ValueError, TypeError):
                    errors.append(f"Smelting electricity must be numeric: {elec}")
        
        if "mining" in parameters:
            ore_grade = parameters["mining"].get("Ore Grade (%)")
            if ore_grade is not None:
                try:
                    grade_val = float(ore_grade)
                    if grade_val < 10 or grade_val > 70:
                        errors.append(f"Ore grade out of reasonable range: {grade_val}%")
                except (ValueError, TypeError):
                    errors.append(f"Ore grade must be numeric: {ore_grade}")
        
        return len(errors) == 0, errors
    
    def get_parameter_info(self, stage: str, parameter: str) -> Optional[Dict[str, Any]]:
        """Get metadata about a specific parameter.
        
        Args:
            stage: Stage name
            parameter: Parameter name
        
        Returns:
            Dict with parameter info (description, unit, typical_range, etc.) or None
        """
        # Parameter metadata database
        metadata = {
            "smelting": {
                "electricity_kwh_per_kg": {
                    "description": "Electricity consumption for aluminum smelting",
                    "unit": "kWh per kg Al",
                    "typical_range": (12.0, 16.0),
                    "default": 13.5
                },
                "co2_emissions": {
                    "description": "Direct CO2 emissions from anode consumption",
                    "unit": "kg CO2 per kg Al",
                    "typical_range": (1.2, 2.0),
                    "default": 1.5
                }
            },
            "mining": {
                "Ore Grade (%)": {
                    "description": "Aluminum oxide content in bauxite ore",
                    "unit": "%",
                    "typical_range": (30, 60),
                    "default": 45
                },
                "Water Usage (m³ per tonne of ore)": {
                    "description": "Water consumption in mining operations",
                    "unit": "m³/tonne ore",
                    "typical_range": (0.5, 5.0),
                    "default": 2.5
                }
            }
        }
        
        stage_key = self._normalize_stage_name(stage)
        if stage_key in metadata and parameter in metadata[stage_key]:
            return metadata[stage_key][parameter]
        
        return None
    
    def save_parameters(self, parameters: Dict[str, Any], filename: str):
        """Save parameter set to JSON file.
        
        Args:
            parameters: Parameter dict to save
            filename: Output filename (without .json extension)
        """
        output_path = Path(f"{filename}.json")
        with open(output_path, 'w') as f:
            json.dump(parameters, f, indent=2)
        print(f"✓ Parameters saved to: {output_path.absolute()}")
    
    def load_parameters(self, filename: str) -> Dict[str, Any]:
        """Load parameters from JSON file.
        
        Args:
            filename: Input filename (with or without .json extension)
        
        Returns:
            Parameter dict
        """
        input_path = Path(filename)
        if not input_path.suffix:
            input_path = input_path.with_suffix('.json')
        
        with open(input_path, 'r') as f:
            return json.load(f)
