# Stage Inputs and Outputs

## Mining

### Required Inputs (enter)
- **mining_method**: open pit
- **mining_ore_grade_percent**: 45.0
- **location**: Odisha

### Options
- **mining_method**: [open pit, underground]
- **location**: [Odisha, Jharkhand, Chhattisgarh, Gujarat, Maharashtra]

### Predicted (watermark)
- **mining_energy_MJ_per_t_ore**: 620
- **mining_co2_kg_per_t_ore**: 68
- **mining_sox_kg_per_t_ore**: 0.5
- **mining_nox_kg_per_t_ore**: 1.2
- **mining_pm_kg_per_t_ore**: 0.8
- **confidence**: 0.85

---

## Beneficiation

### Required Inputs (enter)
- **beneficiation_process_Crushing**: 1 (Yes)
- **ore_feed_rate**: 5000
- **location**: Odisha

### Options
- **beneficiation_process**: [Crushing, Grinding, Washing_Screening, Magnetic_Separation, Gravity_Separation, Dry_Separation] (binary per-process; show Yes/No)
- **location**: same as above

### Predicted (watermark)
- **beneficiation_water_m3_per_t_ore**: 1.5
- **beneficiation_electricity_kWh_per_t_ore**: 24
- **beneficiation_tailings_management**: Thickened
- **beneficiation_noise_pollution**: Moderate
- **beneficiation_dust_pollution**: Moderate
- **confidence**: 0.82

---

## Refining

### Required Inputs (enter)
- **energy_use**: 14000
- **water_use**: 2.5
- **red_mud_generation**: 1200

### Options
- **mining/refining-specific ordinals** (if any): 
  - **toxicity_Red_Mud**: [Low, Moderate, High]

### Predicted (watermark)
- **refining_energy_MJ_per_t_alumina**: 12500
- **refining_water_m3_per_t_alumina**: 3.2
- **refining_red_mud_kg_per_t_alumina**: 1300
- **refining_caustic_soda_kg_per_t_alumina**: 12
- **refining_lime_kg_per_t_alumina**: 9
- **refining_so2_kg_per_t_alumina**: 1.5
- **refining_nox_kg_per_t_alumina**: 2.1
- **refining_dust_kg_per_t_alumina**: 0.7
- **confidence**: 0.88

---

## Smelting

### Required Inputs (enter)
- **electricity_demand**: 15500
- **co2_emissions**: 1800
- **cell_technology**: pre-baked

### Options
- **cell_technology**: [Soderberg, pre-baked, inert (experimental)]

### Predicted (watermark)
- **smelting_energy_kWh_per_t_al**: 15400
- **smelting_energy_MJ_per_t_al**: 55440
- **smelting_co2_kg_per_t_al**: 1750
- **smelting_pfc_kg_per_t_al**: 85
- **smelting_so2_kg_per_t_al**: 3.2
- **smelting_nox_kg_per_t_al**: 2.5
- **smelting_fluoride_recovery_%**: 78
- **smelting_thermal_recovery_%**: 22
- **confidence**: 0.90

---

## Manufacturing

### Required Inputs (enter)
- **manufacturing_process_Casting**: 1 (Yes)
- **transport_distance**: 350
- **scrap_rate**: 8.5

### Options
- **manufacturing_process**: [Casting, Rolling, Extrusion, Machining] (binary per-process; show Yes/No)

### Predicted (watermark)
- **manufacturing_energy_MJ_per_t_product**: 820
- **manufacturing_recycled_content_%**: 32
- **manufacturing_transport_emissions_kgCO2e_per_t**: 28
- **confidence**: 0.86

---

## Recycling

### Required Inputs (enter)
- **scrap_input_percentage**: 35.0
- **collection_rate**: 70.0
- **recycling_methods**: closed-loop

### Options
- **recycling_methods**: [closed-loop, open-loop]

### Predicted (watermark)
- **recycling_recovery_yield_%**: 88
- **recycling_energy_kWh_per_t_Al**: 1050
- **recycling_emission_savings_kgCO2e_per_t_Al**: 5200
- **recycling_closed_loop_%**: 65
- **recycling_open_loop_%**: 35
- **valorization_recovery_efficiency_%**: 30
- **confidence**: 0.84

---

## Valorization

### Required Inputs (enter)
- **waste_types**: Red Mud
- **valorization_methods**: cement additive
- **waste_utilization_percentages**: 25.0

### Options
- **waste_types**: [Red Mud, SPL, Dross, Spent_Anode, Other]
- **valorization_methods**: [cement additive, encapsulation, geopolymers, metal recovery]

### Predicted (watermark)
- **valorization_recovery_efficiency_%**: 27
- **valorization_emission_reduction_kgCO2e_per_t_waste**: 180
- **confidence**: 0.78

---

## UI Implementation Guidelines

### General Form Design

1. **Set "enter" values as defaults/placeholders** in the form for required fields (watermark/lighter hint)
2. **For categorical fields with options**:
   - Use **radio buttons** for ≤4 items
   - Use **selectbox/dropdown** for >4 items
3. **For percentages**: Use sliders (0–100 range)
4. **For binaries**: Use Yes/No radio buttons
5. **Keep optional fields blank by default**; backend fills them

### Field Types

- **Text/Number inputs**: For numeric values like energy_use, water_use, etc.
- **Radio buttons**: For binary choices (Yes/No) and small categorical options
- **Dropdowns**: For location, methods, and larger categorical lists
- **Sliders**: For percentage inputs (scrap_rate, collection_rate, etc.)
- **Checkboxes**: For multi-select process options (beneficiation_process, manufacturing_process)

### Form Validation

- Validate numeric ranges (percentages: 0-100)
- Ensure required fields are filled before prediction
- Display confidence scores with predicted outputs
- Use watermark/placeholder text to guide users
