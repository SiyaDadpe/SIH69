import brightway2 as bw
from typing import Any, Dict, Optional
from ..utils.config import Config
from .base_engine import BaseLCAManager

class DatabaseManager:
    """Manage creation and updates of the aluminum foreground database."""

    def __init__(self, db_name=None):
        self.db_name = db_name or Config.ALUMINUM_DB_NAME

    def ensure_database(self):
        if self.db_name in bw.databases:
            return bw.Database(self.db_name)
        return bw.Database(self.db_name)

    def upsert_activity(self, code, data):
        db = self.ensure_database()
        if code in db:
            act = db.get(code)
            act.update(data)
            act.save()
        else:
            db.write({code: data})
        return db.get(code)


class AluminumDatabaseManager(BaseLCAManager):
    """High-level manager that builds the full aluminum production chain."""

    def __init__(self):
        super().__init__()
        self.aluminum_db = bw.Database(Config.ALUMINUM_DB_NAME)
        self._placeholder_cache: Dict[str, bw.backends.peewee.ActivityDataset] = {}
        self.setup_aluminum_database()

    def setup_aluminum_database(self):
        """Create the foreground database for aluminum processes if missing."""
        if Config.ALUMINUM_DB_NAME not in bw.databases:
            print(f"\u2713 Creating {Config.ALUMINUM_DB_NAME} database")
            # Initialize an empty database by writing nothing; will be populated by new activities
            bw.Database(Config.ALUMINUM_DB_NAME).write({})

    # --------- Helpers ---------
    def get_biosphere_flow(self, name, category):
        """Override with a more tolerant lookup that falls back to fuzzy matching."""
        try:
            return super().get_biosphere_flow(name, category)
        except Exception:
            biosphere = bw.Database(Config.BIODB_NAME)
            lname = str(name).lower()
            # Normalize category input to text for contains match
            if isinstance(category, (list, tuple)):
                lcat = "/".join([str(c) for c in category]).lower()
            else:
                lcat = str(category).lower()
            # First pass: contains match on name and category tokens
            for act in biosphere:
                n = str(act.get("name", "")).lower()
                cats = act.get("categories") or ()
                cats_text = "/".join([str(c) for c in cats]).lower()
                if lname in n and all(tok in cats_text for tok in lcat.split("/")):
                    return act
            # Common fallbacks
            if "carbon dioxide" in lname or "co2" in lname:
                for act in biosphere:
                    if act.get("name") == "Carbon dioxide, fossil":
                        return act
            if "water" in lname:
                for act in biosphere:
                    if "water" in str(act.get("name", "")).lower():
                        return act
            raise
    def _get_or_create_activity(self, code: str, name: str, unit: str, location: str = "GLO"):
        if code in self.aluminum_db:
            return self.aluminum_db.get(code)
        act = self.aluminum_db.new_activity(code=code)
        act["name"] = name
        act["unit"] = unit
        act["location"] = location
        try:
            act.save()
        except Exception:
            # If it already exists due to concurrent runs, fetch and update
            existing = self.aluminum_db.get(code)
            existing.update({"name": name, "unit": unit, "location": location})
            existing.save()
            return existing
        return act

    def get_ecoinvent_activity(self, key: str):
        """Best-effort resolver. If ecoinvent isn't installed, create a local placeholder in foreground.

        Known keys: 'diesel_production', 'sodium_hydroxide_production', 'electricity_mix'
        """
        # Try to find any database that looks like ecoinvent
        eco_dbs = [d for d in bw.databases if str(d).lower().startswith("ecoinvent")]
        if eco_dbs:
            # Note: Real implementations would search metadata for exact markets. Here we fallback to foreground even if ecoinvent exists.
            pass

        # Fallback: return or create placeholder foreground markets
        mapping = {
            "diesel_production": ("market_diesel", "Diesel, market (placeholder)", "kilogram"),
            "sodium_hydroxide_production": ("market_naoh", "Sodium hydroxide, market (placeholder)", "kilogram"),
        }
        if key in mapping:
            code, name, unit = mapping[key]
            return self._get_or_create_activity(code, name, unit)
        raise KeyError(f"Unknown external activity key: {key}")

    def get_electricity_mix(self, source: Optional[str] = None):
        label = f"Electricity, mix - {source or 'grid'} (placeholder)"
        code = f"electricity_mix_{(source or 'grid').lower()}"
        return self._get_or_create_activity(code, label, "kilowatt hour")

    # --------- Stage creators ---------
    def calculate_diesel_consumption(self, params: Any) -> float:
        # Very rough placeholder: 0.05 kg diesel per equipment item per kg product
        eq = []
        if isinstance(params, dict):
            eq = list(params.get("equipment_type", []) or params.get("Type of Equipment", []) or [])
        else:
            eq = list(getattr(params, "equipment_type", []) or [])
        return max(0.0, 0.05 * len(eq)) or 0.05

    def create_mining_activity(self, params: Any):
        """Create bauxite mining activity with technosphere/biosphere exchanges."""
        if isinstance(params, dict):
            mining_method = params.get("mining_method")
            if not mining_method:
                mm = params.get("Mining Method")
                if isinstance(mm, list) and mm:
                    mining_method = mm[0]
                else:
                    mining_method = "Open Pit Mining"
        else:
            mining_method = getattr(params, "mining_method", "Open Pit Mining")
        # Water usage: support JSON key "Water Usage (m³ per tonne of ore)"; convert to per kg
        if isinstance(params, dict):
            if "Water Usage (m³ per tonne of ore)" in params:
                water_usage = float(params.get("Water Usage (m³ per tonne of ore)", 0.0)) / 1000.0
            else:
                water_usage = float(params.get("water_usage", 0.0))
        else:
            water_usage = float(getattr(params, "water_usage", 0.0))

        mining = self._get_or_create_activity(
            code="bauxite_mining",
            name=f"Bauxite mining - {mining_method}",
            unit="kilogram",
            location="GLO",
        )

        # Diesel consumption (technosphere)
        diesel_amount = self.calculate_diesel_consumption(params)
        diesel_market = self.get_ecoinvent_activity("diesel_production")
        exc = mining.new_exchange(input=diesel_market, amount=float(diesel_amount), type="technosphere")
        exc.save()

        # Water consumption (biosphere); try a robust flow lookup
        try:
            water_flow = self.get_biosphere_flow("Water", "resource")
        except Exception:
            water_flow = self.get_biosphere_flow("Water", ("natural resource",))
        exc = mining.new_exchange(input=water_flow, amount=float(water_usage or 0.0), type="biosphere")
        exc.save()

        mining.save()
        return mining

    def create_beneficiation_activity(self, params: Dict[str, Any], mining_input):
        """Simple beneficiation step linking to mining."""
        beneficiation = self._get_or_create_activity(
            code="beneficiation",
            name="Beneficiation",
            unit="kilogram",
        )
        # Assume 1.0 kg mined bauxite per kg beneficiated output (placeholder)
        exc = beneficiation.new_exchange(input=mining_input, amount=1.0, type="technosphere")
        exc.save()
        beneficiation.save()
        return beneficiation

    def create_alumina_refining_activity(self, params: Any, bauxite_input):
        """Create alumina refining using Bayer process."""
        refining = self._get_or_create_activity(
            code="alumina_refining",
            name="Alumina refining - Bayer process",
            unit="kilogram",
        )

        # Bauxite input (2.3-2.5 kg per kg alumina), adjust for ore grade if available
        ore_grade = None
        if isinstance(params, dict):
            ore_grade = params.get("ore_grade")
        else:
            ore_grade = getattr(params, "ore_grade", None)
        bauxite_amount = 2.3 + (0 if ore_grade is None else max(0.0, (45 - float(ore_grade)) * 0.01))
        exc = refining.new_exchange(input=bauxite_input, amount=float(bauxite_amount), type="technosphere")
        exc.save()

        # Caustic soda input
        if isinstance(params, dict):
            caustic_amount = float(params.get("caustic_soda_consumption", 0.1))
        else:
            caustic_amount = float(getattr(params, "caustic_soda_consumption", 0.1))
        naoh = self.get_ecoinvent_activity("sodium_hydroxide_production")
        exc = refining.new_exchange(input=naoh, amount=float(caustic_amount), type="technosphere")
        exc.save()

        refining.save()
        return refining

    def create_smelting_activity(self, params: Any, alumina_input):
        """Create aluminum smelting activity with configurable electricity."""
        smelting_technology = None
        electricity_kwh_per_kg = None
        electricity_source = None
        co2_emissions = None
        if isinstance(params, dict):
            smelting_technology = params.get("smelting_technology", "Prebake")
            electricity_kwh_per_kg = params.get("electricity_kwh_per_kg") or (
                (params.get("electricity_demand") or 13500) / 1000.0
            )
            electricity_source = params.get("electricity_source", "grid")
            # Rough default direct CO2 (kg/kg Al) if not provided
            co2_emissions = params.get("co2_emissions", 1.5)
        else:
            smelting_technology = getattr(params, "smelting_technology", "Prebake")
            electricity_kwh_per_kg = getattr(params, "electricity_kwh_per_kg", None)
            if electricity_kwh_per_kg is None:
                electricity_kwh_per_kg = (getattr(params, "electricity_demand", 13500) / 1000.0)
            electricity_source = getattr(params, "electricity_source", "grid")
            co2_emissions = getattr(params, "co2_emissions", 1.5)

        smelting = self._get_or_create_activity(
            code="aluminum_smelting",
            name=f"Aluminum smelting - {smelting_technology}",
            unit="kilogram",
        )

        # Electricity
        elec = self.get_electricity_mix(electricity_source)
        exc = smelting.new_exchange(input=elec, amount=float(electricity_kwh_per_kg), type="technosphere")
        exc.save()

        # Alumina input ~ 1.92 kg/kg Al
        exc = smelting.new_exchange(input=alumina_input, amount=1.92, type="technosphere")
        exc.save()

        # Direct CO2 to air
        try:
            co2_flow = self.get_biosphere_flow("Carbon dioxide", "air")
        except Exception:
            co2_flow = self.get_biosphere_flow("Carbon dioxide", ("air",))
        exc = smelting.new_exchange(input=co2_flow, amount=float(co2_emissions), type="biosphere")
        exc.save()

        smelting.save()
        return smelting

    def create_manufacturing_activity(self, params: Dict[str, Any], primary_al_input):
        """Generic manufacturing placeholder linking to primary aluminum."""
        manuf = self._get_or_create_activity(
            code="manufacturing",
            name="Manufacturing (placeholder)",
            unit="kilogram",
        )
        exc = manuf.new_exchange(input=primary_al_input, amount=1.0, type="technosphere")
        exc.save()
        manuf.save()
        return manuf

    def create_recycling_activity(self, params: Dict[str, Any]):
        """Create a recycling process producing secondary aluminum."""
        rec = self._get_or_create_activity(
            code="recycling",
            name="Recycling of aluminum (placeholder)",
            unit="kilogram",
        )
        # Electricity use placeholder
        elec = self.get_electricity_mix("recycling")
        amount = float(params.get("electricity_kwh_per_kg", 0.6)) if isinstance(params, dict) else float(getattr(params, "electricity_kwh_per_kg", 0.6))
        exc = rec.new_exchange(input=elec, amount=amount, type="technosphere")
        exc.save()
        rec.save()
        return rec

    def create_waste_valorization(self, params: Dict[str, Any]):
        """Simple waste valorization placeholder."""
        waste = self._get_or_create_activity(
            code="waste_valorization",
            name="Waste valorization (placeholder)",
            unit="kilogram",
        )
        waste.save()
        return waste

    # --------- Build complete chain ---------
    def build_complete_chain(self, all_parameters: Dict[str, Any]):
        """Build all 7 stages and connect them; returns the final product activity."""
        # Normalize missing groups with placeholders to avoid KeyErrors
        params = {**{
            "mining": {},
            "beneficiation": {},
            "refining": {},
            "smelting": {},
            "manufacturing": {},
            "recycling": {},
            "waste": {},
        }, **(all_parameters or {})}

        # Stage 1: Mining
        mining = self.create_mining_activity(params["mining"])

        # Stage 2: Beneficiation
        beneficiation = self.create_beneficiation_activity(params["beneficiation"], mining)

        # Stage 3: Alumina Refining
        alumina = self.create_alumina_refining_activity(params["refining"], beneficiation)

        # Stage 4: Smelting (primary aluminum)
        primary_al = self.create_smelting_activity(params["smelting"], alumina)

        # Stage 5: Manufacturing
        product = self.create_manufacturing_activity(params["manufacturing"], primary_al)

        # Stage 6: Recycling
        self.create_recycling_activity(params["recycling"])

        # Stage 7: Waste valorization
        self.create_waste_valorization(params["waste"])

        return product
