import numpy as np
import pandas as pd
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
np.random.seed(42)
num_samples = 1000

print("Generating comprehensive synthetic copper LCA dataset for INDIA with realistic data...")

# --- Common Variables & Helper Functions ---

# Major copper mining states in India
locations = np.random.choice(
    ['Rajasthan', 'Madhya Pradesh', 'Jharkhand', 'Maharashtra', 'Andhra Pradesh', 'Karnataka'],
    num_samples,
    p=[0.35, 0.25, 0.15, 0.10, 0.10, 0.05]  # Rajasthan has highest production
)

# Grid carbon intensity for Indian states (kg CO2/kWh) - Source: CEA 2023
grid_carbon_intensity = {
    'Rajasthan': 0.78,        # More renewable capacity
    'Madhya Pradesh': 0.82,    # Mixed
    'Jharkhand': 0.92,        # Coal-heavy
    'Maharashtra': 0.85,       # Mixed
    'Andhra Pradesh': 0.80,    # Mixed with some renewable
    'Karnataka': 0.75         # Good renewable mix
}

def get_grid_carbon(loc_array):
    return np.array([grid_carbon_intensity[loc] for loc in loc_array])

# Helper for truncated normal distributions
def truncated_normal(mean, sd, low, high, size):
    a, b = (low - mean) / sd, (high - mean) / sd
    return stats.truncnorm.rvs(a, b, loc=mean, scale=sd, size=size)

# Function to add realistic uncertainty based on data quality
def add_realistic_uncertainty(values, uncertainty_level='medium', data_source_quality=0.8):
    """
    Add realistic uncertainty based on parameter type and data quality
    uncertainty_level: 'low' (5-10%), 'medium' (10-20%), 'high' (20-30%)
    data_source_quality: 0-1, with 1 being highest quality data
    """
    values = np.array(values, dtype=float)
    
    if uncertainty_level == 'low':
        uncertainty_pct = np.random.uniform(0.05, 0.10, len(values))
    elif uncertainty_level == 'medium':
        uncertainty_pct = np.random.uniform(0.10, 0.20, len(values))
    elif uncertainty_level == 'high':
        uncertainty_pct = np.random.uniform(0.20, 0.30, len(values))
    else:
        uncertainty_pct = np.random.uniform(0.15, 0.25, len(values))
    
    # Adjust uncertainty based on data source quality
    uncertainty_pct = uncertainty_pct * (1.5 - data_source_quality)
    
    uncertainty_range = np.abs(values) * uncertainty_pct
    
    # Generate min and max estimates
    min_estimate = values - uncertainty_range * np.random.uniform(0.7, 1.3, len(values))
    max_estimate = values + uncertainty_range * np.random.uniform(0.7, 1.3, len(values))
    
    # Confidence score based on data quality and uncertainty
    base_confidence = 1 - uncertainty_pct
    quality_adjusted_confidence = base_confidence * data_source_quality
    confidence_score = np.clip(0.4 + 0.6 * quality_adjusted_confidence, 0.4, 0.95)
    
    return min_estimate, max_estimate, confidence_score

# Generate years with more recent data (2018-2023)
years = np.random.choice([2018, 2019, 2020, 2021, 2022, 2023], num_samples, 
                         p=[0.10, 0.15, 0.15, 0.20, 0.20, 0.20])

# --- 1. Mining / Extraction ---
print("Generating Mining / Extraction Data (based on Indian Bureau of Mines data)...")

# Indian copper mining methods distribution
mining_methods = ['Open-Pit Mining', 'Underground Mining', 'Mixed Open-Pit/Underground', 'In-situ Leaching']
mining_method = np.random.choice(mining_methods, num_samples, p=[0.60, 0.25, 0.10, 0.05])

# Ore type distribution in India
ore_type_mining = np.random.choice(['Sulfide', 'Oxide', 'Mixed'], num_samples, p=[0.85, 0.10, 0.05])

# Indian copper ore grades - based on IBM data (0.7-1.8% Cu, average ~1.2%)
ore_grade_cu = truncated_normal(mean=1.2, sd=0.25, low=0.7, high=1.8, size=num_samples)

# Overburden ratio - varies by mining method
overburden_ratio = np.where(
    mining_method == 'Open-Pit Mining',
    truncated_normal(mean=4.5, sd=1.5, low=2.0, high=8.0, size=num_samples),
    np.where(mining_method == 'Underground Mining',
             truncated_normal(mean=0.8, sd=0.3, low=0.3, high=1.5, size=num_samples),
             truncated_normal(mean=2.5, sd=1.0, low=1.0, high=5.0, size=num_samples))
)

# Average haul distance based on mining method
avg_haul_distance_km = np.where(
    mining_method == 'Open-Pit Mining',
    truncated_normal(mean=2.5, sd=1.0, low=1.0, high=6.0, size=num_samples),
    truncated_normal(mean=5.0, sd=2.0, low=2.0, high=12.0, size=num_samples)
)

# Equipment type distribution in Indian mines
equipment_type_mining = np.random.choice(['Diesel', 'Electric', 'Hybrid', 'Mixed'], 
                                        num_samples, 
                                        p=[0.65, 0.15, 0.10, 0.10])

# Mine production capacity (tonnes per day) - Indian copper mines
mine_production_tpd = np.where(
    np.random.random(num_samples) < 0.7,  # 70% are medium-large mines
    truncated_normal(mean=15000, sd=5000, low=8000, high=30000, size=num_samples),
    truncated_normal(mean=5000, sd=2000, low=2000, high=12000, size=num_samples)
)

# Water consumption based on mining method and location
water_consumption_mining = np.where(
    mining_method == 'Open-Pit Mining',
    truncated_normal(mean=0.8, sd=0.3, low=0.3, high=1.8, size=num_samples),
    truncated_normal(mean=0.5, sd=0.2, low=0.2, high=1.2, size=num_samples)
)

# Water source distribution
water_source_mining = np.random.choice(['Groundwater', 'Surface', 'Recycled', 'Mixed'], 
                                      num_samples, 
                                      p=[0.40, 0.30, 0.15, 0.15])

# Fuel consumption (L/t ore) - lower for electric/hybrid equipment
base_fuel = truncated_normal(mean=2.0, sd=0.6, low=0.8, high=3.5, size=num_samples)
fuel_factor = np.where(equipment_type_mining == 'Electric', 0.2,
              np.where(equipment_type_mining == 'Hybrid', 0.5,
              np.where(equipment_type_mining == 'Mixed', 0.7, 1.0)))
fuel_consumption = base_fuel * fuel_factor

# Electricity consumption (kWh/t ore) - higher for lower grades
grade_factor = (1.5 - ore_grade_cu)  # Higher consumption for lower grades
electricity_mining = truncated_normal(mean=15 + 5*grade_factor, sd=3, 
                                     low=10, high=25, size=num_samples)

# Direct GHG emissions from mining (kg CO2e/t ore)
grid_ci = get_grid_carbon(locations)
# Diesel emissions: 2.68 kg CO2/L diesel
# Electricity emissions: grid intensity
ghg_mining = fuel_consumption * 2.68 + electricity_mining * grid_ci

# Dust emissions (kg PM10/t ore) - based on CPCB standards
dust_emissions_pm10 = np.where(
    np.random.random(num_samples) < 0.3,  # 30% have advanced dust suppression
    truncated_normal(mean=0.05, sd=0.02, low=0.02, high=0.12, size=num_samples),
    truncated_normal(mean=0.15, sd=0.05, low=0.08, high=0.30, size=num_samples)
)

# Land disturbed (m2/t ore)
land_disturbed = np.where(
    mining_method == 'Open-Pit Mining',
    truncated_normal(mean=1.0, sd=0.4, low=0.4, high=2.0, size=num_samples),
    truncated_normal(mean=0.3, sd=0.15, low=0.1, high=0.8, size=num_samples)
)

# Explosives used (kg ANFO/t ore)
explosives_used = np.where(
    mining_method == 'Open-Pit Mining',
    truncated_normal(mean=0.8, sd=0.3, low=0.3, high=1.5, size=num_samples),
    truncated_normal(mean=0.3, sd=0.1, low=0.1, high=0.6, size=num_samples)
)

# AMD risk assessment based on ore type, water source, and overburden
amd_risk_scores = []
for ot, ws, ob in zip(ore_type_mining, water_source_mining, overburden_ratio):
    score = 0
    if ot == 'Sulfide':
        score += 3
    elif ot == 'Mixed':
        score += 1
    
    if ws == 'Groundwater':
        score += 1
    elif ws == 'Surface':
        score += 0.5
    
    if ob > 3.0:
        score += 1
    
    if score >= 3.5:
        amd_risk_scores.append('High')
    elif score >= 2.0:
        amd_risk_scores.append('Medium')
    else:
        amd_risk_scores.append('Low')

# Tailings + waste generation (t/t Cu)
ore_per_t_cu = 100 / ore_grade_cu  # tonnes ore per tonne of Cu
waste_ratio = 0.8 + (overburden_ratio * 0.05)  # More waste with higher overburden
tailings_waste_t_per_t_cu = ore_per_t_cu * waste_ratio

# Add uncertainty for mining parameters
mining_ghg_min, mining_ghg_max, mining_ghg_conf = add_realistic_uncertainty(
    ghg_mining, uncertainty_level='medium', data_source_quality=0.7
)

# --- 2. Beneficiation ---
print("Generating Beneficiation Data...")

# Indian concentrator data
ore_type_benef = np.random.choice(['Sulfide', 'Oxide', 'Mixed'], num_samples, p=[0.85, 0.10, 0.05])
ore_grade_benef = truncated_normal(mean=1.2, sd=0.25, low=0.7, high=1.8, size=num_samples)

# Concentrate grade - Indian standards
concentrate_grade = np.where(
    ore_type_benef == 'Sulfide',
    truncated_normal(mean=26, sd=2.5, low=20, high=32, size=num_samples),
    truncated_normal(mean=22, sd=3, low=15, high=30, size=num_samples)
)

# Grinding energy - depends on ore hardness and grade
base_grinding_energy = truncated_normal(mean=12, sd=3, low=8, high=20, size=num_samples)
grade_factor_benef = (1.5 - ore_grade_benef) * 2  # More energy for lower grades
grinding_energy = base_grinding_energy + grade_factor_benef

# Reagent consumption (kg/t ore) - Indian concentrators
reagent_consumption = truncated_normal(mean=1.5, sd=0.5, low=0.8, high=3.0, size=num_samples)

# Water consumption - Indian water management practices
water_consumption_benef = truncated_normal(mean=1.0, sd=0.3, low=0.5, high=2.0, size=num_samples)

# Water recycling percentage - varies by plant age and technology
water_recycled_pct = np.where(
    years > 2020,  # Newer plants have better recycling
    truncated_normal(mean=65, sd=10, low=40, high=85, size=num_samples),
    truncated_normal(mean=55, sd=15, low=30, high=80, size=num_samples)
)

# Recovery efficiency - Indian concentrator performance
base_recovery = truncated_normal(mean=87, sd=4, low=78, high=95, size=num_samples)
# Better recovery for sulfide ores
recovery_efficiency = np.where(
    ore_type_benef == 'Sulfide',
    base_recovery + np.random.normal(2, 1, num_samples),
    base_recovery
)
recovery_efficiency = np.clip(recovery_efficiency, 75, 98)

# Total electricity use
electricity_benef = grinding_energy + truncated_normal(mean=5, sd=1.5, low=3, high=10, size=num_samples)

# Tailings generation calculation
mass_pull = (ore_grade_benef / concentrate_grade) * (recovery_efficiency / 100.0)
tailings_per_t_ore = 1 - mass_pull
tailings_per_t_ore = np.clip(tailings_per_t_ore, 0.85, 0.99)  # Typically 85-99% tailings

# Tailings characteristics
tailings_solids_content = np.where(
    np.random.random(num_samples) < 0.4,  # 40% use thickened/paste
    truncated_normal(mean=55, sd=5, low=45, high=65, size=num_samples),
    truncated_normal(mean=40, sd=5, low=30, high=50, size=num_samples)
)

# Tailings storage type
tailings_storage_type = np.random.choice(['Wet', 'Paste', 'Dry Stack'], 
                                        num_samples, 
                                        p=[0.60, 0.25, 0.15])

# Chemical residue in tailings (mg/L)
chemical_residue_tailings = truncated_normal(mean=80, sd=30, low=20, high=200, size=num_samples)

# Air emissions
air_emissions_benef_pm = truncated_normal(mean=0.08, sd=0.03, low=0.03, high=0.20, size=num_samples)

# GHG emissions from beneficiation
ghg_benef = electricity_benef * grid_ci

# Add uncertainty
benef_ghg_min, benef_ghg_max, benef_ghg_conf = add_realistic_uncertainty(
    ghg_benef, uncertainty_level='medium', data_source_quality=0.75
)

# --- 3. Metallurgical Extraction ---
print("Generating Metallurgical Extraction Data...")

# Process route selection based on ore type
# In India, most copper is from sulfide ores (pyrometallurgical)
process_route = np.random.choice(['Pyrometallurgical', 'Hydrometallurgical'], 
                                num_samples, 
                                p=[0.80, 0.20])

# Ore type for metallurgy
ore_type_met = np.where(process_route == 'Pyrometallurgical', 'Sulfide', 'Oxide')

# Concentrate grade for metallurgy
concentrate_grade_met = truncated_normal(mean=26, sd=3, low=20, high=32, size=num_samples)

# --- Pyrometallurgical Route ---
# Smelting techniques in India
smelting_techniques = ['Flash', 'Bath', 'Reverberatory']
smelting_technique = np.random.choice(smelting_techniques, num_samples, p=[0.60, 0.25, 0.15])

# Smelting energy (MJ/t concentrate) - Indian smelters
smelting_energy_mj = truncated_normal(mean=1650, sd=200, low=1300, high=2100, size=num_samples)

# Sulfur capture efficiency - Indian environmental standards
sulfur_capture_efficiency = np.where(
    years > 2019,  # Newer installations have better capture
    truncated_normal(mean=92, sd=4, low=85, high=98, size=num_samples),
    truncated_normal(mean=88, sd=6, low=75, high=96, size=num_samples)
)

# Slag production (kg/t concentrate)
slag_produced_kg = truncated_normal(mean=320, sd=50, low=250, high=450, size=num_samples)

# Electrorefining energy (kWh/t cathode)
electrorefining_energy_kwh = truncated_normal(mean=205, sd=20, low=170, high=250, size=num_samples)

# Water consumption for pyro route
water_consumption_pyro = truncated_normal(mean=2.0, sd=0.5, low=1.0, high=3.5, size=num_samples)

# Recycled water percentage
recycled_water_pyro_pct = truncated_normal(mean=60, sd=15, low=30, high=85, size=num_samples)

# SO2 emissions (kg/t concentrate)
raw_so2_potential = 75.0  # Typical for Indian concentrates
so2_emissions_pyro = raw_so2_potential * (1 - sulfur_capture_efficiency / 100.0)

# Acid production from SO2 capture
acid_produced_pyro = sulfur_capture_efficiency / 100.0 * raw_so2_potential * 1.53  # Conversion factor

# GHG emissions for pyro route
# Assumptions: smelting uses 70% electricity, 30% fuel
ghg_pyro = (smelting_energy_mj * 0.7 * grid_ci / 3.6 +  # Electricity portion
           smelting_energy_mj * 0.3 * 0.08 +  # Fuel portion (kg CO2/MJ)
           electrorefining_energy_kwh * grid_ci)

# --- Hydrometallurgical Route ---
# Leaching methods
leaching_method = np.random.choice(['Heap', 'Agitated', 'In-situ'], 
                                  num_samples, 
                                  p=[0.70, 0.25, 0.05])

# Acid consumption (kg H2SO4/t ore) - varies with ore type
acid_consumption_hydro = np.where(
    ore_type_met == 'Oxide',
    truncated_normal(mean=25, sd=8, low=12, high=50, size=num_samples),
    truncated_normal(mean=40, sd=12, low=20, high=80, size=num_samples)
)

# Leaching efficiency
leaching_efficiency = truncated_normal(mean=72, sd=7, low=55, high=88, size=num_samples)

# Electrowinning energy (kWh/kg Cu) - Indian SX-EW plants
electrowinning_energy_kwh_per_kg = truncated_normal(mean=2.1, sd=0.3, low=1.6, high=2.8, size=num_samples)

# Water consumption for hydro route
water_consumption_hydro = truncated_normal(mean=1.2, sd=0.4, low=0.6, high=2.2, size=num_samples)

# Recycled water percentage
recycled_water_hydro_pct = truncated_normal(mean=65, sd=12, low=40, high=90, size=num_samples)

# Recovery yield
recovery_yield_hydro = np.clip(leaching_efficiency - truncated_normal(mean=5, sd=2, low=2, high=10, size=num_samples),
                               50, 85)

# GHG emissions for hydro route
ghg_hydro = (acid_consumption_hydro * 0.4 +  # Acid production emissions
            electrowinning_energy_kwh_per_kg * 1000 * grid_ci)  # Electrowinning emissions

# Combine GHG based on process route
metallurgy_ghg = np.where(process_route == 'Pyrometallurgical', ghg_pyro, ghg_hydro)

# Add uncertainty
met_ghg_min, met_ghg_max, met_ghg_conf = add_realistic_uncertainty(
    metallurgy_ghg, uncertainty_level='high', data_source_quality=0.65
)

# --- 4. Semi-Fabrication & Manufacturing ---
print("Generating Semi-Fabrication & Manufacturing Data...")

# Product types manufactured in India
product_types_semi = ['Wire Rod', 'Sheet', 'Tube', 'Bar', 'Alloy', 'Cable']
product_type_semi = np.random.choice(product_types_semi, 
                                    num_samples, 
                                    p=[0.40, 0.20, 0.15, 0.10, 0.10, 0.05])

# Input cathode purity - Indian refineries produce 99.99%+ Cu
input_cathode_purity = truncated_normal(mean=99.97, sd=0.02, low=99.93, high=99.995, size=num_samples)

# Casting method
casting_method = np.random.choice(['Continuous', 'Batch'], num_samples, p=[0.85, 0.15])

# Furnace types in Indian fabrication
furnace_type_semi = np.random.choice(['Induction', 'Electric', 'Gas', 'Mixed'], 
                                    num_samples, 
                                    p=[0.50, 0.25, 0.15, 0.10])

# Energy consumption by product type (kWh/t product)
# Base energy values for Indian manufacturing
melting_energy_kwh = np.zeros(num_samples)
rolling_energy_kwh = np.zeros(num_samples)
extrusion_energy_kwh = np.zeros(num_samples)

for i, pt in enumerate(product_type_semi):
    if pt == 'Wire Rod':
        melting_energy_kwh[i] = truncated_normal(mean=420, sd=50, low=350, high=550, size=1)
        rolling_energy_kwh[i] = truncated_normal(mean=140, sd=30, low=100, high=200, size=1)
    elif pt == 'Sheet':
        melting_energy_kwh[i] = truncated_normal(mean=450, sd=60, low=350, high=600, size=1)
        rolling_energy_kwh[i] = truncated_normal(mean=160, sd=40, low=110, high=250, size=1)
    elif pt == 'Tube':
        melting_energy_kwh[i] = truncated_normal(mean=430, sd=50, low=350, high=550, size=1)
        extrusion_energy_kwh[i] = truncated_normal(mean=110, sd=25, low=70, high=180, size=1)
    elif pt == 'Bar':
        melting_energy_kwh[i] = truncated_normal(mean=410, sd=50, low=340, high=530, size=1)
        extrusion_energy_kwh[i] = truncated_normal(mean=90, sd=20, low=60, high=150, size=1)
    else:  # Alloy, Cable
        melting_energy_kwh[i] = truncated_normal(mean=460, sd=60, low=370, high=620, size=1)
        rolling_energy_kwh[i] = truncated_normal(mean=150, sd=35, low=100, high=230, size=1)

# Surface treatment chemicals (kg/t product)
surface_treatment_chemicals = truncated_normal(mean=8.0, sd=3.0, low=2.0, high=18.0, size=num_samples)

# Process water use (m3/t product)
process_water_use_m3 = truncated_normal(mean=2.5, sd=1.0, low=1.0, high=5.0, size=num_samples)

# Cooling water reuse percentage
cooling_water_reuse_pct = truncated_normal(mean=65, sd=15, low=40, high=90, size=num_samples)

# Scrap generation by product type
scrap_generated_pct = np.zeros(num_samples)
for i, pt in enumerate(product_type_semi):
    if pt == 'Wire Rod':
        scrap_generated_pct[i] = truncated_normal(mean=7, sd=2, low=4, high=12, size=1)
    elif pt == 'Sheet':
        scrap_generated_pct[i] = truncated_normal(mean=11, sd=3, low=6, high=18, size=1)
    elif pt == 'Tube':
        scrap_generated_pct[i] = truncated_normal(mean=14, sd=3, low=8, high=22, size=1)
    elif pt == 'Bar':
        scrap_generated_pct[i] = truncated_normal(mean=9, sd=2.5, low=5, high=16, size=1)
    else:
        scrap_generated_pct[i] = truncated_normal(mean=16, sd=4, low=9, high=25, size=1)

# Scrap recycled onsite
scrap_recycled_onsite_pct = np.clip(scrap_generated_pct * truncated_normal(mean=0.7, sd=0.15, low=0.4, high=0.95, size=num_samples),
                                    0, 90)

# Solid waste generation
solid_waste_generated_kg = truncated_normal(mean=60, sd=20, low=20, high=120, size=num_samples)

# Renewable energy share in Indian manufacturing
renewable_energy_share_mfg = np.where(
    years > 2020,
    truncated_normal(mean=28, sd=10, low=10, high=50, size=num_samples),
    truncated_normal(mean=22, sd=8, low=8, high=40, size=num_samples)
)
fossil_energy_share_mfg = 100 - renewable_energy_share_mfg

# Waste heat recovery
waste_heat_recovery_pct = truncated_normal(mean=18, sd=8, low=5, high=40, size=num_samples)

# Product lifetime extension
product_lifetime_extension_years = truncated_normal(mean=6, sd=2, low=2, high=12, size=num_samples)

# Total manufacturing energy
total_mfg_energy_kwh = melting_energy_kwh + rolling_energy_kwh + extrusion_energy_kwh

# GHG emissions
effective_co2_factor_mfg = grid_ci * (fossil_energy_share_mfg / 100.0)
ghg_mfg = total_mfg_energy_kwh * effective_co2_factor_mfg

# Add uncertainty
mfg_ghg_min, mfg_ghg_max, mfg_ghg_conf = add_realistic_uncertainty(
    ghg_mfg, uncertainty_level='medium', data_source_quality=0.75
)

# --- 5. Use Phase ---
print("Generating Use Phase Data...")

# Copper product applications in India
product_type_use = np.random.choice(
    ['Wire & Cable', 'Transformer', 'Motor', 'Busbar', 'Heat Exchanger', 'Electrical Component', 'Construction Material'],
    num_samples,
    p=[0.35, 0.15, 0.15, 0.10, 0.10, 0.10, 0.05]
)

application_sector = np.random.choice(
    ['Electrical', 'Construction', 'Industrial', 'Transport', 'Electronics', 'Consumer Goods'],
    num_samples,
    p=[0.45, 0.20, 0.15, 0.10, 0.05, 0.05]
)

# Efficiency rating based on application
efficiency_rating_pct = np.where(
    (application_sector == 'Electrical') | (application_sector == 'Electronics'),
    truncated_normal(mean=95, sd=2, low=90, high=99, size=num_samples),
    truncated_normal(mean=85, sd=5, low=75, high=95, size=num_samples)
)

# Energy savings vs alternative materials
energy_savings_vs_alternative_pct = truncated_normal(mean=20, sd=6, low=8, high=35, size=num_samples)

# Annual energy use based on product type
annual_use_energy_kwh = np.zeros(num_samples)
for i, pt in enumerate(product_type_use):
    if pt == 'Wire & Cable':
        annual_use_energy_kwh[i] = truncated_normal(mean=2000, sd=500, low=1000, high=3500, size=1)
    elif pt == 'Transformer':
        annual_use_energy_kwh[i] = truncated_normal(mean=15000, sd=4000, low=8000, high=25000, size=1)
    elif pt == 'Motor':
        annual_use_energy_kwh[i] = truncated_normal(mean=5000, sd=1500, low=2500, high=10000, size=1)
    elif pt == 'Busbar':
        annual_use_energy_kwh[i] = truncated_normal(mean=8000, sd=2000, low=4000, high=15000, size=1)
    elif pt == 'Heat Exchanger':
        annual_use_energy_kwh[i] = truncated_normal(mean=3000, sd=800, low=1500, high=5000, size=1)
    else:
        annual_use_energy_kwh[i] = truncated_normal(mean=1000, sd=300, low=500, high=2000, size=1)

# Maintenance frequency
maintenance_frequency_per_year = truncated_normal(mean=1.0, sd=0.4, low=0.3, high=2.5, size=num_samples)

# Replacement cycle based on product type
replacement_cycle_years = np.zeros(num_samples)
for i, pt in enumerate(product_type_use):
    if pt == 'Wire & Cable':
        replacement_cycle_years[i] = truncated_normal(mean=25, sd=5, low=15, high=35, size=1)
    elif pt == 'Transformer':
        replacement_cycle_years[i] = truncated_normal(mean=30, sd=6, low=20, high=40, size=1)
    elif pt in ['Motor', 'Busbar']:
        replacement_cycle_years[i] = truncated_normal(mean=20, sd=4, low=12, high=28, size=1)
    else:
        replacement_cycle_years[i] = truncated_normal(mean=15, sd=3, low=10, high=22, size=1)

# Operating temperature
operating_temperature_c = truncated_normal(mean=60, sd=20, low=25, high=120, size=num_samples)

# Copper loss during use
copper_loss_during_use_pct = truncated_normal(mean=0.5, sd=0.3, low=0.1, high=1.5, size=num_samples)

# Packaging material
packaging_material_kg_per_unit = truncated_normal(mean=10, sd=5, low=2, high=25, size=num_samples)

# Lifetime calculations
lifetime_energy_kwh = annual_use_energy_kwh * replacement_cycle_years
base_use_ghg = lifetime_energy_kwh * grid_ci
avoided_ghg_use = base_use_ghg * (energy_savings_vs_alternative_pct / 100.0)
use_phase_ghg = base_use_ghg - avoided_ghg_use

# Add uncertainty
use_ghg_min, use_ghg_max, use_ghg_conf = add_realistic_uncertainty(
    use_phase_ghg, uncertainty_level='high', data_source_quality=0.6
)

# --- 6. End-of-Life Recycling ---
print("Generating End-of-Life Recycling Data...")

# Scrap types in India
scrap_type = np.random.choice(
    ['Pre-consumer', 'Post-consumer', 'E-waste', 'Mixed'],
    num_samples,
    p=[0.40, 0.35, 0.10, 0.15]
)

# Collection rates - Indian scenario
collection_rate_pct = np.where(
    scrap_type == 'Pre-consumer',
    truncated_normal(mean=85, sd=8, low=70, high=98, size=num_samples),
    np.where(scrap_type == 'Post-consumer',
             truncated_normal(mean=65, sd=12, low=40, high=90, size=num_samples),
             truncated_normal(mean=50, sd=15, low=25, high=80, size=num_samples))
)

# Sorting technology
sorting_technology = np.random.choice(
    ['Manual', 'Eddy Current', 'Optical', 'X-ray', 'Mixed'],
    num_samples,
    p=[0.35, 0.30, 0.15, 0.05, 0.15]
)

# Sorting efficiency based on technology
sorting_efficiency_pct = np.zeros(num_samples)
for i, st in enumerate(sorting_technology):
    if st == 'Manual':
        sorting_efficiency_pct[i] = truncated_normal(mean=82, sd=6, low=70, high=92, size=1)
    elif st == 'Eddy Current':
        sorting_efficiency_pct[i] = truncated_normal(mean=88, sd=4, low=80, high=95, size=1)
    elif st == 'Optical':
        sorting_efficiency_pct[i] = truncated_normal(mean=92, sd=3, low=85, high=97, size=1)
    elif st == 'X-ray':
        sorting_efficiency_pct[i] = truncated_normal(mean=94, sd=2, low=90, high=98, size=1)
    else:  # Mixed
        sorting_efficiency_pct[i] = truncated_normal(mean=85, sd=5, low=75, high=93, size=1)

# Contamination level
contamination_level_pct = truncated_normal(mean=3.5, sd=2.0, low=0.5, high=10.0, size=num_samples)

# Remelting energy - Indian secondary smelters
remelting_energy_kwh = truncated_normal(mean=1700, sd=200, low=1400, high=2100, size=num_samples)

# Refining energy
refining_energy_kwh = truncated_normal(mean=320, sd=80, low=180, high=500, size=num_samples)

# Recovery yield based on scrap type
base_recovery_yield = np.where(
    scrap_type == 'Pre-consumer', 95,
    np.where(scrap_type == 'Post-consumer', 90,
             np.where(scrap_type == 'E-waste', 85, 88))
)
recovery_yield_recycling_pct = truncated_normal(mean=base_recovery_yield, sd=3, 
                                               low=base_recovery_yield-10, 
                                               high=base_recovery_yield+5, 
                                               size=num_samples)

# Recycled content
recycled_content_pct = truncated_normal(mean=55, sd=15, low=25, high=85, size=num_samples)

# Slag generation
slag_generation_kg_per_t_scrap = truncated_normal(mean=50, sd=15, low=25, high=100, size=num_samples)

# Metal loss in slag
metal_loss_in_slag_pct = truncated_normal(mean=2.0, sd=0.8, low=0.5, high=4.0, size=num_samples)

# Water consumption
water_consumption_recycling_m3 = truncated_normal(mean=1.5, sd=0.5, low=0.8, high=3.0, size=num_samples)

# Recycled water percentage
recycled_water_recycling_pct = truncated_normal(mean=60, sd=15, low=35, high=85, size=num_samples)

# Dust emissions
dust_emissions_recycling_pm = truncated_normal(mean=0.8, sd=0.3, low=0.3, high=1.5, size=num_samples)

# Residue disposal
residue_disposal_kg_per_t_scrap = truncated_normal(mean=25, sd=10, low=10, high=60, size=num_samples)

# Transport
transport_distance_km_recycling = truncated_normal(mean=200, sd=100, low=50, high=500, size=num_samples)
transport_mode_recycling = np.random.choice(['Truck', 'Rail', 'Mixed'], 
                                          num_samples, 
                                          p=[0.75, 0.15, 0.10])

# Economic parameters
scrap_price_usd_per_t = truncated_normal(mean=6000, sd=1000, low=4500, high=8000, size=num_samples)
recycled_product_value_usd_per_t = scrap_price_usd_per_t * truncated_normal(mean=1.15, sd=0.05, 
                                                                           low=1.05, high=1.30, 
                                                                           size=num_samples)

# GHG emissions from recycling
ghg_recycling = (remelting_energy_kwh + refining_energy_kwh) * grid_ci

# Add uncertainty
recycling_ghg_min, recycling_ghg_max, recycling_ghg_conf = add_realistic_uncertainty(
    ghg_recycling, uncertainty_level='medium', data_source_quality=0.7
)

# --- 7. By-Product Valorization ---
print("Generating By-Product & Waste Valorization Data...")

# Waste types from copper production
waste_type = np.random.choice(
    ['Slag', 'Tailings', 'Dust', 'Acidic Effluent', 'Spent Electrolyte'],
    num_samples,
    p=[0.35, 0.30, 0.15, 0.15, 0.05]
)

# Valorization methods
valorization_method = np.random.choice(
    ['Reuse', 'Recycle', 'Neutralize', 'Dispose', 'Recover Metals'],
    num_samples,
    p=[0.25, 0.30, 0.20, 0.15, 0.10]
)

# Valorization rate
valorization_rate_pct = np.where(
    valorization_method == 'Dispose',
    truncated_normal(mean=10, sd=5, low=5, high=25, size=num_samples),
    truncated_normal(mean=65, sd=20, low=30, high=90, size=num_samples)
)

# Metal recovery rate
base_metal_recovery = np.where(
    waste_type == 'Slag', 45,
    np.where(waste_type == 'Tailings', 30,
             np.where(waste_type == 'Dust', 60,
                      np.where(waste_type == 'Acidic Effluent', 20, 70)))
)
metal_recovery_rate_pct = truncated_normal(mean=base_metal_recovery, sd=12, 
                                          low=base_metal_recovery-20, 
                                          high=base_metal_recovery+20, 
                                          size=num_samples)

# Waste generation
waste_generation_kg_per_t_cu = np.where(
    waste_type == 'Slag',
    truncated_normal(mean=350, sd=80, low=200, high=500, size=num_samples),
    np.where(waste_type == 'Tailings',
             truncated_normal(mean=95000, sd=20000, low=60000, high=130000, size=num_samples),
             truncated_normal(mean=150, sd=50, low=50, high=300, size=num_samples))
)

# Sulfur capture efficiency
sulfur_capture_efficiency_waste = truncated_normal(mean=85, sd=8, low=70, high=98, size=num_samples)
# Acid production
acid_produced_kg_per_t_cu = np.where(
    waste_type == 'Acidic Effluent',
    truncated_normal(mean=200, sd=80, low=80, high=400, size=num_samples),
    truncated_normal(mean=50, sd=30, low=10, high=150, size=num_samples)
)

# Energy for valorization
energy_for_valorization_kwh = truncated_normal(mean=80, sd=40, low=20, high=200, size=num_samples)

# Water used in treatment
water_used_in_treatment_m3 = truncated_normal(mean=1.2, sd=0.5, low=0.5, high=2.5, size=num_samples)

# Residue after treatment
residue_after_treatment_kg_per_t_cu = truncated_normal(mean=40, sd=20, low=10, high=100, size=num_samples)

# Heavy metal residue
heavy_metal_residue_mg_per_l = truncated_normal(mean=2.5, sd=1.5, low=0.5, high=6.0, size=num_samples)

# Slag reuse
slag_reuse_as_construction_pct = np.where(
    waste_type == 'Slag',
    truncated_normal(mean=40, sd=15, low=15, high=70, size=num_samples),
    0.0
)

# Revenue from byproducts
revenue_from_byproducts_usd_per_t_cu = (metal_recovery_rate_pct * waste_generation_kg_per_t_cu * 0.01 * 0.8 +
                                       acid_produced_kg_per_t_cu * 0.05)

# GHG from valorization
ghg_valorization = energy_for_valorization_kwh * grid_ci

# Add uncertainty
valor_ghg_min, valor_ghg_max, valor_ghg_conf = add_realistic_uncertainty(
    ghg_valorization, uncertainty_level='high', data_source_quality=0.6
)

# --- Build Final Dataset ---
print("Assembling final dataset...")

df = pd.DataFrame({
    # Common identifiers
    'plant_id': [f'CU_PLANT_{i+1:04d}' for i in range(num_samples)],
    'location_state': locations,
    'year': years,
    'grid_carbon_intensity_kgCO2_per_kWh': get_grid_carbon(locations),

    # Mining parameters
    'mining_method': mining_method,
    'mining_ore_type': ore_type_mining,
    'mining_ore_grade_%Cu': ore_grade_cu,
    'mining_overburden_waste_rock_ratio_m3_per_t_ore': overburden_ratio,
    'mining_average_haul_distance_km': avg_haul_distance_km,
    'mining_equipment_type': equipment_type_mining,
    'mining_mine_production_t_per_day': mine_production_tpd,
    'mining_water_consumption_m3_per_t_ore': water_consumption_mining,
    'mining_water_source': water_source_mining,
    'mining_fuel_consumption_L_diesel_per_t_ore': fuel_consumption,
    'mining_electricity_consumption_kWh_per_t_ore': electricity_mining,
    'mining_amd_risk': amd_risk_scores,
    'mining_dust_emissions_PM10_kg_per_t_ore': dust_emissions_pm10,
    'mining_land_disturbed_m2_per_t_ore': land_disturbed,
    'mining_explosives_used_kg_ANFO_per_t_ore': explosives_used,
    'mining_tailings_and_waste_t_per_t_Cu': tailings_waste_t_per_t_cu,
    'mining_ghg_kgCO2e_per_t_ore': ghg_mining,
    'mining_ghg_kgCO2e_per_t_ore_min': mining_ghg_min,
    'mining_ghg_kgCO2e_per_t_ore_max': mining_ghg_max,
    'mining_ghg_confidence': mining_ghg_conf,

    # Beneficiation parameters
    'beneficiation_ore_type': ore_type_benef,
    'beneficiation_ore_grade_%Cu': ore_grade_benef,
    'beneficiation_concentrate_grade_%Cu': concentrate_grade,
    'beneficiation_grinding_energy_kWh_per_t_ore': grinding_energy,
    'beneficiation_reagent_consumption_kg_per_t_ore': reagent_consumption,
    'beneficiation_water_consumption_m3_per_t_ore': water_consumption_benef,
    'beneficiation_water_recycled_%': water_recycled_pct,
    'beneficiation_recovery_efficiency_%': recovery_efficiency,
    'beneficiation_electricity_use_kWh_per_t_ore': electricity_benef,
    'beneficiation_tailings_produced_t_per_t_ore': tailings_per_t_ore,
    'beneficiation_tailings_solids_content_%': tailings_solids_content,
    'beneficiation_tailings_storage_type': tailings_storage_type,
    'beneficiation_chemical_residue_in_tailings_mg_per_L': chemical_residue_tailings,
    'beneficiation_air_emissions_PM_kg_per_t_ore': air_emissions_benef_pm,
    'beneficiation_ghg_kgCO2e_per_t_ore': ghg_benef,
    'beneficiation_ghg_kgCO2e_per_t_ore_min': benef_ghg_min,
    'beneficiation_ghg_kgCO2e_per_t_ore_max': benef_ghg_max,
    'beneficiation_ghg_confidence': benef_ghg_conf,

    # Metallurgy parameters
    'metallurgy_process_route': process_route,
    'metallurgy_ore_type': ore_type_met,
    'metallurgy_concentrate_grade_%Cu': concentrate_grade_met,

    # Pyrometallurgy
    'metallurgy_pyro_smelting_technique': smelting_technique,
    'metallurgy_pyro_smelting_energy_MJ_per_t_concentrate': smelting_energy_mj,
    'metallurgy_pyro_sulfur_capture_efficiency_%': sulfur_capture_efficiency,
    'metallurgy_pyro_slag_produced_kg_per_t_concentrate': slag_produced_kg,
    'metallurgy_pyro_electrorefining_energy_kWh_per_t_cathode': electrorefining_energy_kwh,
    'metallurgy_pyro_water_consumption_m3_per_t_concentrate': water_consumption_pyro,
    'metallurgy_pyro_recycled_water_%': recycled_water_pyro_pct,
    'metallurgy_pyro_SO2_emissions_kg_per_t_concentrate': so2_emissions_pyro,
    'metallurgy_pyro_acid_produced_kg_H2SO4_per_t_concentrate': acid_produced_pyro,
    'metallurgy_pyro_ghg_kgCO2e_per_t_Cu_equiv': ghg_pyro,

    # Hydrometallurgy
    'metallurgy_hydro_leaching_method': leaching_method,
    'metallurgy_hydro_acid_consumption_kg_H2SO4_per_t_ore': acid_consumption_hydro,
    'metallurgy_hydro_leaching_efficiency_%': leaching_efficiency,
    'metallurgy_hydro_electrowinning_energy_kWh_per_kg_Cu': electrowinning_energy_kwh_per_kg,
    'metallurgy_hydro_water_consumption_m3_per_t_ore': water_consumption_hydro,
    'metallurgy_hydro_recycled_water_%': recycled_water_hydro_pct,
    'metallurgy_hydro_recovery_yield_%': recovery_yield_hydro,
    'metallurgy_hydro_ghg_kgCO2e_per_t_Cu_equiv': ghg_hydro,

    'metallurgy_ghg_kgCO2e_per_t_Cu_equiv': metallurgy_ghg,
    'metallurgy_ghg_kgCO2e_per_t_Cu_equiv_min': met_ghg_min,
    'metallurgy_ghg_kgCO2e_per_t_Cu_equiv_max': met_ghg_max,
    'metallurgy_ghg_confidence': met_ghg_conf,

    # Manufacturing parameters
    'manufacturing_product_type': product_type_semi,
    'manufacturing_input_cathode_purity_%Cu': input_cathode_purity,
    'manufacturing_casting_method': casting_method,
    'manufacturing_furnace_type': furnace_type_semi,
    'manufacturing_melting_energy_kWh_per_t_product': melting_energy_kwh,
    'manufacturing_rolling_energy_kWh_per_t_product': rolling_energy_kwh,
    'manufacturing_extrusion_energy_kWh_per_t_product': extrusion_energy_kwh,
    'manufacturing_surface_treatment_chemicals_kg_per_t_product': surface_treatment_chemicals,
    'manufacturing_process_water_use_m3_per_t_product': process_water_use_m3,
    'manufacturing_cooling_water_reuse_%': cooling_water_reuse_pct,
    'manufacturing_scrap_generated_%': scrap_generated_pct,
    'manufacturing_scrap_recycled_onsite_%': scrap_recycled_onsite_pct,
    'manufacturing_solid_waste_generated_kg_per_t_product': solid_waste_generated_kg,
    'manufacturing_renewable_energy_share_%': renewable_energy_share_mfg,
    'manufacturing_fossil_energy_share_%': fossil_energy_share_mfg,
    'manufacturing_waste_heat_recovery_%': waste_heat_recovery_pct,
    'manufacturing_product_lifetime_extension_years': product_lifetime_extension_years,
    'manufacturing_total_energy_kWh_per_t_product': total_mfg_energy_kwh,
    'manufacturing_ghg_kgCO2e_per_t_product': ghg_mfg,
    'manufacturing_ghg_kgCO2e_per_t_product_min': mfg_ghg_min,
    'manufacturing_ghg_kgCO2e_per_t_product_max': mfg_ghg_max,
    'manufacturing_ghg_confidence': mfg_ghg_conf,

    # Use phase parameters
    'use_phase_product_type': product_type_use,
    'use_phase_application_sector': application_sector,
    'use_phase_efficiency_rating_%': efficiency_rating_pct,
    'use_phase_energy_savings_vs_alternative_%': energy_savings_vs_alternative_pct,
    'use_phase_average_annual_use_energy_kWh': annual_use_energy_kwh,
    'use_phase_maintenance_frequency_per_year': maintenance_frequency_per_year,
    'use_phase_replacement_cycle_years': replacement_cycle_years,
    'use_phase_operating_temperature_°C': operating_temperature_c,
    'use_phase_copper_loss_during_use_%': copper_loss_during_use_pct,
    'use_phase_packaging_material_kg_per_unit': packaging_material_kg_per_unit,
    'use_phase_lifetime_energy_kWh': lifetime_energy_kwh,
    'use_phase_base_ghg_kgCO2e_lifetime': base_use_ghg,
    'use_phase_avoided_ghg_kgCO2e_lifetime': avoided_ghg_use,
    'use_phase_ghg_kgCO2e_lifetime': use_phase_ghg,
    'use_phase_ghg_kgCO2e_lifetime_min': use_ghg_min,
    'use_phase_ghg_kgCO2e_lifetime_max': use_ghg_max,
    'use_phase_ghg_confidence': use_ghg_conf,

    # Recycling parameters
    'recycling_scrap_type': scrap_type,
    'recycling_collection_rate_%': collection_rate_pct,
    'recycling_sorting_technology': sorting_technology,
    'recycling_sorting_efficiency_%': sorting_efficiency_pct,
    'recycling_contamination_level_%': contamination_level_pct,
    'recycling_remelting_energy_kWh_per_t_scrap': remelting_energy_kwh,
    'recycling_refining_energy_kWh_per_t_scrap': refining_energy_kwh,
    'recycling_slag_generation_kg_per_t_scrap': slag_generation_kg_per_t_scrap,
    'recycling_metal_loss_in_slag_%': metal_loss_in_slag_pct,
    'recycling_recovery_yield_%': recovery_yield_recycling_pct,
    'recycling_recycled_content_%': recycled_content_pct,
    'recycling_water_consumption_m3_per_t_scrap': water_consumption_recycling_m3,
    'recycling_recycled_water_%': recycled_water_recycling_pct,
    'recycling_dust_emissions_PM_kg_per_t_scrap': dust_emissions_recycling_pm,
    'recycling_residue_disposal_kg_per_t_scrap': residue_disposal_kg_per_t_scrap,
    'recycling_transport_distance_km': transport_distance_km_recycling,
    'recycling_transport_mode': transport_mode_recycling,
    'recycling_scrap_price_USD_per_t': scrap_price_usd_per_t,
    'recycling_recycled_product_value_USD_per_t': recycled_product_value_usd_per_t,
    'recycling_ghg_kgCO2e_per_t_scrap': ghg_recycling,
    'recycling_ghg_kgCO2e_per_t_scrap_min': recycling_ghg_min,
    'recycling_ghg_kgCO2e_per_t_scrap_max': recycling_ghg_max,
    'recycling_ghg_confidence': recycling_ghg_conf,

    # Valorization parameters
    'valorization_waste_type': waste_type,
    'valorization_method': valorization_method,
    'valorization_rate_%': valorization_rate_pct,
    'valorization_metal_recovery_rate_%': metal_recovery_rate_pct,
    'valorization_waste_generation_kg_per_t_Cu': waste_generation_kg_per_t_cu,
    'valorization_sulfur_capture_efficiency_%': sulfur_capture_efficiency_waste,
    'valorization_acid_produced_kg_H2SO4_per_t_Cu': acid_produced_kg_per_t_cu,
    'valorization_energy_for_valorization_kWh_per_t_waste': energy_for_valorization_kwh,
    'valorization_water_used_in_treatment_m3_per_t_waste': water_used_in_treatment_m3,
    'valorization_residue_after_treatment_kg_per_t_Cu': residue_after_treatment_kg_per_t_cu,
    'valorization_heavy_metal_residue_mg_per_L': heavy_metal_residue_mg_per_l,
    'valorization_slag_reuse_as_construction_material_%': slag_reuse_as_construction_pct,
    'valorization_revenue_from_byproducts_USD_per_t_Cu': revenue_from_byproducts_usd_per_t_cu,
    'valorization_ghg_kgCO2e_per_t_Cu': ghg_valorization,
    'valorization_ghg_kgCO2e_per_t_Cu_min': valor_ghg_min,
    'valorization_ghg_kgCO2e_per_t_Cu_max': valor_ghg_max,
    'valorization_ghg_confidence': valor_ghg_conf,
})

# --- Save the Dataset ---
output_file = 'comprehensive_copper_lca_dataset_INDIA.csv'
df.to_csv(output_file, index=False)

print("Synthetic Comprehensive Copper LCA Dataset Generated Successfully!")
print(f"Dataset Path: {output_file}")
print(f"Dataset Shape: {df.shape}")
print(f"Number of Features: {df.shape[1]}")

# --- Display basic statistics ---
print("\n=== Basic Statistics ===")
print("Mining ore grade (%Cu):")
print(f"  Min: {df['mining_ore_grade_%Cu'].min():.2f}, Max: {df['mining_ore_grade_%Cu'].max():.2f}, Mean: {df['mining_ore_grade_%Cu'].mean():.2f}")

print("\nBeneficiation recovery (%):")
print(f"  Min: {df['beneficiation_recovery_efficiency_%'].min():.2f}, Max: {df['beneficiation_recovery_efficiency_%'].max():.2f}, Mean: {df['beneficiation_recovery_efficiency_%'].mean():.2f}")

print("\nManufacturing renewable energy share (%):")
print(f"  Min: {df['manufacturing_renewable_energy_share_%'].min():.2f}, Max: {df['manufacturing_renewable_energy_share_%'].max():.2f}, Mean: {df['manufacturing_renewable_energy_share_%'].mean():.2f}")

print("\nRecycling collection rate (%):")
print(f"  Min: {df['recycling_collection_rate_%'].min():.2f}, Max: {df['recycling_collection_rate_%'].max():.2f}, Mean: {df['recycling_collection_rate_%'].mean():.2f}")

# --- Confidence score summary ---
confidence_cols = [col for col in df.columns if 'confidence' in col]
if confidence_cols:
    confidence_summary = df[confidence_cols].describe()
    print("\n=== Confidence Score Summary ===")
    print(confidence_summary)

print("\nDataset generation complete!")