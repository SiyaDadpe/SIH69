import numpy as np
import pandas as pd
from scipy import stats

# Set random seed for reproducibility
np.random.seed(42)
num_samples = 1000

print("Generating comprehensive synthetic aluminium LCA dataset...")

# --- Common Variables & Helper Functions ---
locations = np.random.choice(['Odisha', 'Gujarat', 'Maharashtra', 'Chhattisgarh', 'Jharkhand'], num_samples)

# Define grid carbon intensity map (kg CO2/kWh) for India
grid_carbon_intensity = {
    'Odisha': 0.95,  # Coal-heavy
    'Jharkhand': 0.93,  # Coal-heavy
    'Chhattisgarh': 0.90,  # Coal-heavy
    'Maharashtra': 0.85,  # Mixed
    'Gujarat': 0.78  # More renewable capacity
}

def get_grid_carbon(plant_locations):
    """Returns an array of grid carbon intensity based on plant location"""
    return np.array([grid_carbon_intensity[loc] for loc in plant_locations])

def add_uncertainty(values, relative_uncertainty=0.1, confidence_correlation=None):
    """
    Add uncertainty estimates to values
    confidence_correlation: if provided, will correlate confidence with this variable
    """
    # Calculate uncertainty bounds (±relative_uncertainty)
    uncertainty_range = values * relative_uncertainty
    
    # Generate min and max estimates
    min_estimate = values - uncertainty_range * np.random.uniform(0.8, 1.2, len(values))
    max_estimate = values + uncertainty_range * np.random.uniform(0.8, 1.2, len(values))
    
    # Calculate confidence score (inverse of relative uncertainty, adjusted by correlation if provided)
    base_confidence = 1 - (uncertainty_range / np.where(values != 0, values, 1))
    
    if confidence_correlation is not None:
        # Normalize correlation variable to 0-1 range
        corr_norm = (confidence_correlation - np.min(confidence_correlation)) / (
            np.max(confidence_correlation) - np.min(confidence_correlation) + 1e-10)
        confidence_score = 0.3 + 0.7 * (0.5 * base_confidence + 0.5 * corr_norm)
    else:
        confidence_score = 0.3 + 0.7 * base_confidence
        
    return min_estimate, max_estimate, confidence_score

# --- 1. Mining Stage Data ---
print("Generating Mining Data...")
mining_methods = ['Open Pit', 'Strip', 'Drilling & Blasting', 'Hydraulic', 'Manual']
equipment_types = ['Diesel', 'Electric', 'Hybrid']
land_use_levels = ['Low', 'Moderate', 'High']

ore_grade = np.random.uniform(40, 58, num_samples)  # % Al2O3
overburden_ratio = np.random.uniform(1.2, 3.8, num_samples)
mining_method = np.random.choice(mining_methods, num_samples)
equipment_type = np.random.choice(equipment_types, num_samples)
land_use_impact = np.random.choice(land_use_levels, num_samples)

# Water usage logic
water_use_mining = np.where(
    mining_method == 'Hydraulic',
    np.random.uniform(2.8, 4.5, num_samples),
    np.where(mining_method == 'Open Pit',
             np.random.uniform(1.2, 2.8, num_samples),
             np.random.uniform(0.8, 2.0, num_samples))
)
water_use_mining *= (50 / ore_grade)  # Better grade -> less washing needed
water_use_mining = np.round(water_use_mining, 2)

# Energy logic: base energy modified by equipment type and overburden
base_energy_mining = np.random.uniform(400, 800, num_samples)
# Assign an energy factor based on equipment type
equipment_energy_factor = np.where(equipment_type == 'Electric', 0.9,
                                  np.where(equipment_type == 'Hybrid', 1.0, 1.1))
energy_use_mining = base_energy_mining * overburden_ratio * equipment_energy_factor
energy_use_mining = np.round(energy_use_mining, 2)

# Emission factors based roughly on CPCB diesel emission factors
co2_mining = np.round(energy_use_mining * 0.075, 2)  # kg CO2/MJ for diesel
sox_mining = np.round(energy_use_mining * 0.0003, 2)
nox_mining = np.round(energy_use_mining * 0.0008, 2)
pm_mining = np.round(energy_use_mining * 0.00015, 2)

# Initial Red Mud estimate - will be refined in the refining stage
red_mud_mining = np.round((100 - ore_grade) * 10 * np.random.uniform(0.95, 1.05, num_samples), 2)  # ~1-1.5t/t ore

# --- 2. Beneficiation Stage Data ---
print("Generating Beneficiation Data...")
beneficiation_process_list = ['Crushing', 'Grinding', 'Washing_Screening', 'Magnetic_Separation', 'Gravity_Separation', 'Dry_Separation']
# Create binary columns for each process
beneficiation_processes = {}
for process in beneficiation_process_list:
    beneficiation_processes[process] = np.random.choice([0, 1], size=num_samples, p=[0.3, 0.7])  # 70% chance a plant uses a common process

# Enhanced beneficiation efficiency for red mud calculation
beneficiation_efficiency = np.random.beta(6, 1.5, num_samples)  # Skewed toward higher efficiency

# Water use: high if Washing_Screening is used
base_water_beneficiation = np.random.uniform(0.2, 0.6, num_samples)
water_use_beneficiation = np.where(beneficiation_processes['Washing_Screening'] == 1,
                                  base_water_beneficiation + np.random.uniform(0.8, 1.5, num_samples),
                                  base_water_beneficiation)
water_use_beneficiation = np.round(water_use_beneficiation, 2)

# Energy use: high if Crushing or Grinding is used
base_energy_beneficiation = np.random.uniform(5, 15, num_samples)
energy_boost = (beneficiation_processes['Crushing'] * np.random.uniform(5, 10, num_samples) +
                beneficiation_processes['Grinding'] * np.random.uniform(8, 15, num_samples))
electricity_use_beneficiation = np.round(base_energy_beneficiation + energy_boost, 2)

# Chemicals
chemicals = ['Flocculants', 'Dispersants', 'Coagulants']
chemical_use = {}
for chem in chemicals:
    chemical_use[chem] = np.random.choice([0, 1], size=num_samples, p=[0.5, 0.5])

tailings_management = np.random.choice(['Tailing_Ponds', 'Pipeline_Transport', 'Sludge_Management'], num_samples)
noise_pollution = np.random.choice(['Low', 'Moderate', 'High'], num_samples, p=[0.3, 0.5, 0.2])
dust_pollution = np.random.choice(['Low', 'Moderate', 'High'], num_samples, p=[0.2, 0.5, 0.3])

# --- 3. Refining Stage Data ---
print("Generating Refining Data...")
refining_variants_list = ['High_pressure_digestion', 'Multi_stage_clarification', 'Heat_recovery_loops', 'Green_additives', 'Automation_sensors']
refining_variants = {}
for variant in refining_variants_list:
    refining_variants[variant] = np.random.choice([0, 1], size=num_samples, p=[0.6, 0.4])

# Synthetic process parameters for refining
digestion_temperature = np.random.normal(240, 10, num_samples)  # °C
digestion_pressure = np.random.normal(35, 3, num_samples)  # bar
caustic_concentration = np.random.normal(220, 15, num_samples)  # g/L

# Model energy usage as a function of these parameters
base_energy_refining = np.random.uniform(9500, 12500, num_samples)  # MJ/tonne alumina
# Create a synthetic derived feature for energy intensity
process_intensity_factor = (
    (digestion_temperature / 240) ** 1.2 *  # Temperature impact
    (digestion_pressure / 35) ** 0.8 *  # Pressure impact
    (caustic_concentration / 220) ** 0.5  # Chemical concentration impact
)

# Apply efficiency gains from variants
heat_recovery_factor = np.where(refining_variants['Heat_recovery_loops'] == 1, 0.92, 1.0)
hp_digestion_factor = np.where(refining_variants['High_pressure_digestion'] == 1, 0.95, 1.0)

# Add seasonal/operational variability (simulating different years)
years = np.random.choice([2018, 2019, 2020, 2021, 2022], num_samples)
# Technology improvements over time
tech_improvement_factor = 1 - ((years - 2018) * 0.02)  # 2% improvement per year
# Operational variability (good vs bad years)
operational_variability = np.where(
    years == 2020, 1.05,  # COVID impact
    np.random.normal(1.0, 0.03, num_samples)  # Normal variation
)

# Final energy calculation
energy_use_refining = np.round(
    base_energy_refining * 
    process_intensity_factor * 
    heat_recovery_factor * 
    hp_digestion_factor * 
    (55 / ore_grade) *
    tech_improvement_factor *
    operational_variability, 
    2
)

# Base water use
base_water_refining = np.random.uniform(2.2, 3.5, num_samples)  # m3/tonne alumina
water_use_refining = np.round(base_water_refining * (55 / ore_grade), 2)  # Better grade -> less bauxite input -> less water

# Enhanced Red Mud generation with beneficiation efficiency factor
sio2_content = np.random.uniform(5, 15, num_samples) * (60 / ore_grade)  # Higher grade, lower silica
red_mud_generation = np.round(
    (100 - ore_grade - sio2_content) * 14 *  # Base calculation
    (1.1 - (beneficiation_efficiency * 0.2)) *  # Efficiency impact (20% reduction potential)
    np.random.uniform(0.95, 1.05, num_samples),  # Random variation
    2
)

# Emissions
so2_refining = np.round(energy_use_refining * 0.000012 + np.random.normal(0.2, 0.05, num_samples), 2)  # kg/MJ * MJ/t
nox_refining = np.round(energy_use_refining * 0.00001 + np.random.normal(0.15, 0.04, num_samples), 2)
dust_refining = np.round(np.random.uniform(0.5, 1.5, num_samples), 2)

# Chemical Consumption (kg/t alumina)
caustic_soda_consumption = np.round(80 + (100 - ore_grade) * 0.5 + np.random.normal(0, 5, num_samples), 1)
lime_consumption = np.round(sio2_content * 0.5 + np.random.normal(0, 2, num_samples), 1)

# --- 4. Smelting Stage Data ---
print("Generating Smelting Data...")
smelting_variants_list = ['Pre_baked_anodes', 'Soderberg_anodes', 'Inert_anodes_exp', 'Renewable_powered', 'Dynamic_load_mgmt']
smelting_variants = {}
for variant in smelting_variants_list:
    smelting_variants[variant] = np.random.choice([0, 1], size=num_samples, p=[0.7, 0.3])  # 30% chance for variants

# Base energy consumption (kWh/tonne Al) - Industry standard range
base_energy_smelting = np.random.uniform(13200, 14500, num_samples)
# Inert anodes (experimental) could increase voltage/energy use slightly
inert_anode_penalty = np.where(smelting_variants['Inert_anodes_exp'] == 1, 1.08, 1.0)
energy_use_smelting_kwh = np.round(base_energy_smelting * inert_anode_penalty, 2)
energy_use_smelting_mj = np.round(energy_use_smelting_kwh * 3.6, 2)  # Convert to MJ

# CO2 Emissions Breakdown
process_emissions = np.random.uniform(1550, 1650, num_samples)  # kg CO2/t Al from anode consumption
location_based_grid_carbon = get_grid_carbon(locations)
energy_emissions = energy_use_smelting_kwh * location_based_grid_carbon  # kg CO2/t Al from electricity
# Renewable powered smelters drastically reduce energy emissions
renewable_factor = np.where(smelting_variants['Renewable_powered'] == 1, 0.1, 1.0)
co2_smelting = np.round(process_emissions + (energy_emissions * renewable_factor), 2)

# Other Emissions
pfc_emissions = np.where(smelting_variants['Pre_baked_anodes'] == 1,
                        np.random.uniform(0.01, 0.08, num_samples),  # Pre-baked has lower PFC
                        np.random.uniform(0.10, 0.30, num_samples))  # Soderberg has higher PFC
pfc_emissions = np.round(pfc_emissions, 4)
so2_smelting = np.round(np.random.uniform(1.5, 4.0, num_samples), 2)  # kg/t Al
nox_smelting = np.round(np.random.uniform(0.5, 1.5, num_samples), 2)  # kg/t Al

# Efficiency Metrics
fluoride_recovery = np.round(np.random.uniform(85, 98, num_samples), 1)
thermal_recovery = np.round(np.random.uniform(5, 20, num_samples), 1)

# --- 5. Product Manufacturing & Use Phase ---
print("Generating Manufacturing & Use Phase Data...")
manufacturing_processes_list = ['Casting', 'Rolling', 'Extrusion', 'Forging', 'Surface_Treatment', 'Joining', 'Design_for_Recycling']
manufacturing_processes = {}
for process in manufacturing_processes_list:
    manufacturing_processes[process] = np.random.choice([0, 1], size=num_samples, p=[0.4, 0.6])

use_phase_sectors = ['Automotive', 'Aerospace', 'Construction', 'Packaging', 'Consumer_Goods']

manufacturing_energy = np.round(np.random.uniform(1000, 4000, num_samples), 2)  # MJ/tonne product
scrap_rate = np.round(np.random.uniform(2, 12, num_samples), 2)  # % scrap generated during manufacturing
recycled_content_input = np.round(np.random.uniform(5, 45, num_samples), 2)  # % recycled Al in product

transport_distance_km = np.random.lognormal(5, 1, num_samples).astype(int)  # Log-normal distribution for distance
transport_mode = np.random.choice(['Road', 'Rail', 'Sea', 'Mixed'], num_samples, p=[0.6, 0.2, 0.1, 0.1])
# Simplified transport emissions (kg CO2e/tonne-km). Road highest, Sea lowest.
transport_emission_factor = np.where(transport_mode == 'Road', 0.15,
                                    np.where(transport_mode == 'Rail', 0.03,
                                    np.where(transport_mode == 'Sea', 0.01, 0.08)))
transport_emissions = np.round(transport_distance_km * transport_emission_factor, 2)

use_phase_sector = np.random.choice(use_phase_sectors, num_samples)
corrosion_impact = np.random.choice(['Minimal', 'Moderate', 'Severe'], num_samples, p=[0.5, 0.4, 0.1])

# --- 6. Recycling Stage ---
print("Generating Recycling Data...")
recycling_processes_list = ['Collection', 'Sorting', 'Cleaning', 'Remelting', 'Re_alloying', 'Casting_New']
recycling_processes = {}
for process in recycling_processes_list:
    recycling_processes[process] = np.random.choice([0, 1], size=num_samples, p=[0.1, 0.9])  # Most plants do most steps

sorting_method = np.random.choice(['Manual', 'Optical_ML', 'Mixed'], num_samples, p=[0.5, 0.3, 0.2])
recycling_approach = np.random.choice(['Closed_loop', 'Open_loop', 'Secondary_production'], num_samples)

scrap_input_pct = np.round(np.random.uniform(20, 95, num_samples), 2)  # % of feedstock that is scrap
recovery_yield = np.round(np.random.uniform(88, 99, num_samples), 2)  # % of Al recovered from scrap
# Energy for remelting is much lower than primary production
furnace_energy_demand = np.round(np.random.uniform(600, 900, num_samples), 2)  # kWh/tonne recycled Al
# The big win: avoided emissions from primary production (~8-12 tons CO2e/tonne Al avoided)
emission_savings = np.round(np.random.uniform(8500, 11500, num_samples), 2)  # kg CO2e avoided/tonne recycled
collection_rate = np.round(np.random.uniform(45, 85, num_samples), 2)  # % of available scrap collected
closed_loop_pct = np.round(np.where(recycling_approach == 'Closed_loop',
                                   np.random.uniform(70, 95, num_samples),
                                   np.random.uniform(5, 30, num_samples)), 2)

# --- 7. Waste Valorization ---
print("Generating Waste Valorization Data...")
waste_types_list = ['Red_Mud', 'Spent_Pot_Lining', 'Dross', 'Fluoride_Gases', 'Slag']
waste_valorization_methods_list = ['Cement_Additive', 'Soil_Stabilization', 'Iron_Extraction', 'REE_Extraction', 'SPL_Encapsulation', 'Dross_Recovery', 'Fluoride_Capture']

waste_utilization = {}
for waste in waste_types_list:
    waste_utilization[waste] = np.round(np.random.uniform(0, 65, num_samples), 2)  # % utilized

valorization_methods = {}
for method in waste_valorization_methods_list:
    valorization_methods[method] = np.random.choice([0, 1], size=num_samples, p=[0.7, 0.3])

# Emission reduction from substitution (e.g., using 1t red mud in cement avoids ~0.5t CO2 from clinker production)
emission_reduction_valorization = np.round(waste_utilization['Red_Mud']/100 * np.random.uniform(400, 600, num_samples), 2)

toxicity_levels = ['Low', 'Moderate', 'High']
groundwater_risk = ['Low', 'Moderate', 'High']

toxicity = {}
risk = {}
for waste in waste_types_list:
    toxicity[waste] = np.random.choice(toxicity_levels, num_samples, p=[0.6, 0.3, 0.1])
    risk[waste] = np.random.choice(groundwater_risk, num_samples, p=[0.5, 0.4, 0.1])

recovery_efficiency = np.round(np.random.uniform(50, 90, num_samples), 2)  # General recovery efficiency placeholder
economic_viability = np.random.choice(['Low', 'Moderate', 'High'], num_samples, p=[0.5, 0.4, 0.1])

# --- Uncertainty Modeling ---
print("Adding uncertainty estimates...")
# For energy use - correlate confidence with year (newer data = more confidence)
(min_energy_refining, max_energy_refining, confidence_energy_refining) = add_uncertainty(
    energy_use_refining, 0.12, 2022 - years  # More recent = higher confidence
)

# For emissions - correlate confidence with measurement technology (simulated)
measurement_tech_level = np.where(years < 2020, 0.7, 0.9)  # Better tech in recent years
(min_co2_smelting, max_co2_smelting, confidence_co2_smelting) = add_uncertainty(
    co2_smelting, 0.15, measurement_tech_level
)

# For red mud - correlate confidence with beneficiation efficiency
(min_red_mud, max_red_mud, confidence_red_mud) = add_uncertainty(
    red_mud_generation, 0.18, beneficiation_efficiency
)

# For water use - fixed uncertainty
(min_water_refining, max_water_refining, confidence_water_refining) = add_uncertainty(
    water_use_refining, 0.10
)

# --- Create the Master DataFrame ---
print("Compiling Master DataFrame...")
df = pd.DataFrame({
    'plant_id': [f'PLANT_{i+1:04d}' for i in range(num_samples)],
    'location': locations,
    'year': years,

    # Mining
    'mining_ore_grade_percent': np.round(ore_grade, 2),
    'mining_overburden_ratio': np.round(overburden_ratio, 2),
    'mining_method': mining_method,
    'mining_equipment_type': equipment_type,
    'mining_land_use_impact': land_use_impact,
    'mining_water_m3_per_t_ore': water_use_mining,
    'mining_energy_MJ_per_t_ore': energy_use_mining,
    'mining_co2_kg_per_t_ore': co2_mining,
    'mining_sox_kg_per_t_ore': sox_mining,
    'mining_nox_kg_per_t_ore': nox_mining,
    'mining_pm_kg_per_t_ore': pm_mining,

    # Beneficiation
    'beneficiation_efficiency': np.round(beneficiation_efficiency, 3),
    'beneficiation_water_m3_per_t_ore': water_use_beneficiation,
    'beneficiation_electricity_kWh_per_t_ore': electricity_use_beneficiation,
    'beneficiation_tailings_management': tailings_management,
    'beneficiation_noise_pollution': noise_pollution,
    'beneficiation_dust_pollution': dust_pollution,
    **{f'beneficiation_process_{k}': v for k, v in beneficiation_processes.items()},
    **{f'beneficiation_chem_{k}': v for k, v in chemical_use.items()},

    # Refining
    'refining_digestion_temperature_C': np.round(digestion_temperature, 1),
    'refining_digestion_pressure_bar': np.round(digestion_pressure, 1),
    'refining_caustic_concentration_gL': np.round(caustic_concentration, 1),
    'refining_process_intensity_factor': np.round(process_intensity_factor, 3),
    'refining_tech_improvement_factor': np.round(tech_improvement_factor, 3),
    'refining_operational_variability': np.round(operational_variability, 3),
    'refining_energy_MJ_per_t_alumina': energy_use_refining,
    'refining_energy_min': np.round(min_energy_refining, 2),
    'refining_energy_max': np.round(max_energy_refining, 2),
    'refining_energy_confidence': np.round(confidence_energy_refining, 3),
    'refining_water_m3_per_t_alumina': water_use_refining,
    'refining_water_min': np.round(min_water_refining, 2),
    'refining_water_max': np.round(max_water_refining, 2),
    'refining_water_confidence': np.round(confidence_water_refining, 3),
    'refining_red_mud_kg_per_t_alumina': red_mud_generation,
    'refining_red_mud_min': np.round(min_red_mud, 2),
    'refining_red_mud_max': np.round(max_red_mud, 2),
    'refining_red_mud_confidence': np.round(confidence_red_mud, 3),
    'refining_so2_kg_per_t_alumina': so2_refining,
    'refining_nox_kg_per_t_alumina': nox_refining,
    'refining_dust_kg_per_t_alumina': dust_refining,
    'refining_caustic_soda_kg_per_t_alumina': caustic_soda_consumption,
    'refining_lime_kg_per_t_alumina': lime_consumption,
    **{f'refining_variant_{k}': v for k, v in refining_variants.items()},

    # Smelting
    'smelting_energy_kWh_per_t_al': energy_use_smelting_kwh,
    'smelting_energy_MJ_per_t_al': energy_use_smelting_mj,
    'smelting_co2_kg_per_t_al': co2_smelting,
    'smelting_co2_min': np.round(min_co2_smelting, 2),
    'smelting_co2_max': np.round(max_co2_smelting, 2),
    'smelting_co2_confidence': np.round(confidence_co2_smelting, 3),
    'smelting_pfc_kg_per_t_al': pfc_emissions,
    'smelting_so2_kg_per_t_al': so2_smelting,
    'smelting_nox_kg_per_t_al': nox_smelting,
    'smelting_fluoride_recovery_%': fluoride_recovery,
    'smelting_thermal_recovery_%': thermal_recovery,
    **{f'smelting_variant_{k}': v for k, v in smelting_variants.items()},

    # Manufacturing & Use
    'manufacturing_energy_MJ_per_t_product': manufacturing_energy,
    'manufacturing_scrap_rate_%': scrap_rate,
    'manufacturing_recycled_content_%': recycled_content_input,
    'manufacturing_transport_distance_km': transport_distance_km,
    'manufacturing_transport_mode': transport_mode,
    'manufacturing_transport_emissions_kgCO2e_per_t': transport_emissions,
    'use_phase_sector': use_phase_sector,
    'use_phase_corrosion_impact': corrosion_impact,
    **{f'manufacturing_process_{k}': v for k, v in manufacturing_processes.items()},

    # Recycling
    'recycling_scrap_input_%': scrap_input_pct,
    'recycling_recovery_yield_%': recovery_yield,
    'recycling_energy_kWh_per_t_Al': furnace_energy_demand,
    'recycling_emission_savings_kgCO2e_per_t_Al': emission_savings,
    'recycling_collection_rate_%': collection_rate,
    'recycling_closed_loop_%': closed_loop_pct,
    'recycling_sorting_method': sorting_method,
    'recycling_approach': recycling_approach,
    **{f'recycling_process_{k}': v for k, v in recycling_processes.items()},

    # Valorization
    'valorization_emission_reduction_kgCO2e_per_t_waste': emission_reduction_valorization,
    'valorization_recovery_efficiency_%': recovery_efficiency,
    'valorization_economic_viability': economic_viability,
    **{f'waste_utilization_{k}_%': v for k, v in waste_utilization.items()},
    **{f'valorization_method_{k}': v for k, v in valorization_methods.items()},
    **{f'toxicity_{k}': v for k, v in toxicity.items()},
    **{f'groundwater_risk_{k}': v for k, v in risk.items()},
})

# --- Save the Dataset ---
df.to_csv('comprehensive_aluminium_lca_dataset_INDIA.csv', index=False)
print("Synthetic Comprehensive Aluminium LCA Dataset Generated Successfully!")
print(f"Dataset Shape: {df.shape}")

# --- Generate a summary of confidence scores ---
confidence_cols = [col for col in df.columns if 'confidence' in col]
if confidence_cols:
    confidence_summary = df[confidence_cols].describe()
    print("\nConfidence Score Summary:")
    print(confidence_summary)