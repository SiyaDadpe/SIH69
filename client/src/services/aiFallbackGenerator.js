/**
 * AI Fallback Generator for Aluminium LCA Application
 * 
 * This service generates intelligent fallback values for missing form fields
 * based on 20 predefined scenarios, dependency rules, and user constraints.
 * 
 * Key Features:
 * - Never modifies user-filled or AI-predicted values
 * - Matches scenarios based on user inputs
 * - Applies dependency logic (ore grade, energy, recycling, etc.)
 * - Provides reasoning for each inferred value
 * - Detects conflicts and warns users
 */

// ============================================================================
// 20 FALLBACK SCENARIOS (Per Tonne of Finished Aluminium)
// ============================================================================

export const SCENARIOS = {
  S1: {
    name: "Conventional, mid-grade, coal power",
    ore_grade: 45,
    bauxite_per_alumina: 3.0,
    alumina_per_al: 2.0,
    red_mud: 1.2,
    energy_refining: 14.5,
    energy_smelting: 16500,
    co2_total: 14.0,
    scrap_percent: 10,
    recycling_energy: 10,
    recycling_yield: 90,
    waste_util_percent: 10,
    renewable_power_percent: 5,
    type: "conventional"
  },
  S2: {
    name: "Slightly better ore, same tech",
    ore_grade: 52,
    bauxite_per_alumina: 2.8,
    alumina_per_al: 2.0,
    red_mud: 1.0,
    energy_refining: 13.5,
    energy_smelting: 16000,
    co2_total: 12.5,
    scrap_percent: 12,
    recycling_energy: 9,
    recycling_yield: 92,
    waste_util_percent: 12,
    renewable_power_percent: 10,
    type: "improved"
  },
  S3: {
    name: "Low-grade bauxite, inefficient",
    ore_grade: 38,
    bauxite_per_alumina: 3.4,
    alumina_per_al: 2.1,
    red_mud: 1.5,
    energy_refining: 15.5,
    energy_smelting: 17000,
    co2_total: 16.0,
    scrap_percent: 15,
    recycling_energy: 11,
    recycling_yield: 88,
    waste_util_percent: 5,
    renewable_power_percent: 5,
    type: "inefficient"
  },
  S4: {
    name: "High-grade, older smelter",
    ore_grade: 58,
    bauxite_per_alumina: 2.6,
    alumina_per_al: 2.0,
    red_mud: 0.9,
    energy_refining: 12.0,
    energy_smelting: 16500,
    co2_total: 11.5,
    scrap_percent: 8,
    recycling_energy: 9,
    recycling_yield: 93,
    waste_util_percent: 15,
    renewable_power_percent: 15,
    type: "high_grade"
  },
  S5: {
    name: "Indian-like average",
    ore_grade: 45,
    bauxite_per_alumina: 3.0,
    alumina_per_al: 2.0,
    red_mud: 1.3,
    energy_refining: 14.0,
    energy_smelting: 14750,
    co2_total: 13.0,
    scrap_percent: 10,
    recycling_energy: 9,
    recycling_yield: 90,
    waste_util_percent: 8,
    renewable_power_percent: 20,
    type: "average"
  },
  S6: {
    name: "Hydro-powered smelter (Norway-like)",
    ore_grade: 50,
    bauxite_per_alumina: 2.9,
    alumina_per_al: 2.0,
    red_mud: 1.1,
    energy_refining: 11.0,
    energy_smelting: 14000,
    co2_total: 6.0,
    scrap_percent: 12,
    recycling_energy: 8.5,
    recycling_yield: 94,
    waste_util_percent: 20,
    renewable_power_percent: 90,
    type: "sustainable"
  },
  S7: {
    name: "Best practice refinery + average smelter",
    ore_grade: 52,
    bauxite_per_alumina: 2.7,
    alumina_per_al: 1.9,
    red_mud: 0.8,
    energy_refining: 8.5,
    energy_smelting: 15000,
    co2_total: 9.5,
    scrap_percent: 9,
    recycling_energy: 8.3,
    recycling_yield: 95,
    waste_util_percent: 25,
    renewable_power_percent: 40,
    type: "best_practice"
  },
  S8: {
    name: "High recycling content product",
    ore_grade: 45,
    bauxite_per_alumina: 3.0,
    alumina_per_al: 2.0,
    red_mud: 1.2,
    energy_refining: 14.0,
    energy_smelting: 16000,
    recycled_content: 60,
    co2_total: 7.0,
    scrap_percent: 18,
    recycling_energy: 8.5,
    recycling_yield: 94,
    waste_util_percent: 30,
    renewable_power_percent: 30,
    type: "high_recycling"
  },
  S9: {
    name: "Almost fully recycled route",
    ore_grade: 45,
    bauxite_per_alumina: 3.0,
    alumina_per_al: 2.0,
    red_mud: 1.2,
    energy_refining: 14.0,
    energy_smelting: 15000,
    recycled_content: 90,
    co2_total: 3.5,
    scrap_percent: 20,
    recycling_energy: 8,
    recycling_yield: 95,
    waste_util_percent: 35,
    renewable_power_percent: 50,
    type: "circular"
  },
  S10: {
    name: "High-scrap fabrication (complex parts)",
    ore_grade: 48,
    bauxite_per_alumina: 2.9,
    alumina_per_al: 2.0,
    red_mud: 1.1,
    energy_refining: 13.0,
    energy_smelting: 16000,
    co2_total: 12.0,
    scrap_percent: 30,
    recycling_energy: 10,
    recycling_yield: 90,
    waste_util_percent: 15,
    renewable_power_percent: 25,
    type: "high_scrap"
  },
  S11: {
    name: "Mine with excellent water management",
    ore_grade: 50,
    bauxite_per_alumina: 2.8,
    alumina_per_al: 2.0,
    red_mud: 1.0,
    energy_refining: 13.0,
    energy_smelting: 15500,
    co2_total: 11.5,
    scrap_percent: 10,
    mining_water: 0.1,
    recycling_energy: 9,
    recycling_yield: 92,
    waste_util_percent: 18,
    renewable_power_percent: 25,
    type: "water_efficient"
  },
  S12: {
    name: "Low-grade mine trying to be green",
    ore_grade: 38,
    bauxite_per_alumina: 3.4,
    alumina_per_al: 2.1,
    red_mud: 1.5,
    energy_refining: 15.0,
    energy_smelting: 15000,
    co2_total: 9.0,
    scrap_percent: 12,
    recycling_energy: 8.8,
    recycling_yield: 93,
    waste_util_percent: 30,
    renewable_power_percent: 70,
    type: "sustainable"
  },
  S13: {
    name: "High valorization of red mud & dross",
    ore_grade: 46,
    bauxite_per_alumina: 3.0,
    alumina_per_al: 2.0,
    red_mud: 1.2,
    energy_refining: 13.5,
    energy_smelting: 15500,
    co2_total: 11.0,
    scrap_percent: 15,
    recycling_energy: 9,
    recycling_yield: 94,
    waste_util_percent: 60,
    renewable_power_percent: 35,
    type: "valorization"
  },
  S14: {
    name: "Soderberg cells (very polluting)",
    ore_grade: 45,
    bauxite_per_alumina: 3.1,
    alumina_per_al: 2.0,
    red_mud: 1.3,
    energy_refining: 14.5,
    energy_smelting: 17000,
    co2_total: 17.0,
    scrap_percent: 10,
    recycling_energy: 10,
    recycling_yield: 88,
    waste_util_percent: 10,
    renewable_power_percent: 5,
    type: "polluting"
  },
  S15: {
    name: "Inert anode pilot line",
    ore_grade: 50,
    bauxite_per_alumina: 2.8,
    alumina_per_al: 2.0,
    red_mud: 1.0,
    energy_refining: 12.5,
    energy_smelting: 14000,
    co2_total: 4.0,
    scrap_percent: 10,
    recycling_energy: 8.5,
    recycling_yield: 95,
    waste_util_percent: 25,
    renewable_power_percent: 70,
    type: "innovative"
  },
  S16: {
    name: "Long transport distances",
    ore_grade: 46,
    bauxite_per_alumina: 3.0,
    alumina_per_al: 2.0,
    red_mud: 1.2,
    energy_refining: 14.0,
    energy_smelting: 15500,
    co2_total: 13.5,
    scrap_percent: 10,
    recycling_energy: 9,
    recycling_yield: 92,
    waste_util_percent: 15,
    renewable_power_percent: 20,
    type: "transport_heavy"
  },
  S17: {
    name: "Lightweighting (use-phase benefits)",
    ore_grade: 48,
    bauxite_per_alumina: 2.9,
    alumina_per_al: 2.0,
    red_mud: 1.1,
    energy_refining: 13.0,
    energy_smelting: 15000,
    co2_total: 11.0,
    scrap_percent: 12,
    recycling_energy: 8.5,
    recycling_yield: 93,
    waste_util_percent: 20,
    renewable_power_percent: 30,
    type: "lightweighting"
  },
  S18: {
    name: "Dry-stacked tailings + renewables",
    ore_grade: 45,
    bauxite_per_alumina: 3.0,
    alumina_per_al: 2.0,
    red_mud: 1.2,
    energy_refining: 13.5,
    energy_smelting: 14500,
    co2_total: 9.5,
    scrap_percent: 11,
    recycling_energy: 8.8,
    recycling_yield: 94,
    waste_util_percent: 45,
    renewable_power_percent: 60,
    type: "sustainable"
  },
  S19: {
    name: "High corrosion environment, short lifetime",
    ore_grade: 46,
    bauxite_per_alumina: 3.0,
    alumina_per_al: 2.0,
    red_mud: 1.2,
    energy_refining: 14.0,
    energy_smelting: 16000,
    co2_total: 13.0,
    scrap_percent: 10,
    recycling_energy: 9,
    recycling_yield: 90,
    waste_util_percent: 15,
    renewable_power_percent: 20,
    type: "corrosive"
  },
  S20: {
    name: "Best-case circular system",
    ore_grade: 52,
    bauxite_per_alumina: 2.7,
    alumina_per_al: 1.9,
    red_mud: 0.8,
    energy_refining: 8.5,
    energy_smelting: 13500,
    recycled_content: 70,
    co2_total: 2.5,
    scrap_percent: 15,
    recycling_energy: 8,
    recycling_yield: 96,
    waste_util_percent: 80,
    renewable_power_percent: 90,
    type: "best_circular"
  }
};

// ============================================================================
// REALISTIC RANGES PER STAGE
// ============================================================================

export const RANGES = {
  mining: {
    mining_ore_grade_percent: { min: 30, max: 60, typical: 45 },
    mining_overburden_ratio: { min: 1, max: 8, typical: 3 },
    mining_water_m3_per_t_ore: { min: 0.1, max: 1.5, typical: 0.8 },
    mining_diesel_L_per_t_ore: { min: 5, max: 25, typical: 15 },
    mining_electricity_kWh_per_t_ore: { min: 5, max: 25, typical: 12 },
    mining_explosives_kg_per_t_ore: { min: 0.1, max: 0.8, typical: 0.3 },
    mining_land_disturbed_m2_per_t_ore: { min: 0.5, max: 5, typical: 2.5 },
    mining_ghg_kg_CO2e_per_t_ore: { min: 3, max: 15, typical: 8 },
    mining_dust_emissions_kg_per_t_ore: { min: 0.2, max: 2, typical: 0.5 }
  },
  beneficiation: {
    beneficiation_water_m3_per_t_ore: { min: 0.3, max: 2.0, typical: 1.0 },
    beneficiation_electricity_kWh_per_t_ore: { min: 5, max: 25, typical: 15 },
    beneficiation_tailings_t_per_t_ore: { min: 0.1, max: 0.5, typical: 0.3 },
    beneficiation_chemical_kg_per_t_ore: { min: 0, max: 0.5, typical: 0.2 },
    beneficiation_tailings_solids_content_percent: { min: 30, max: 60, typical: 45 },
    beneficiation_recovery_percent: { min: 85, max: 98, typical: 92 }
  },
  refining: {
    refining_bauxite_input_t_per_t_alumina: { min: 2.7, max: 3.5, typical: 3.0 },
    refining_red_mud_t_per_t_alumina: { min: 0.8, max: 1.5, typical: 1.2 },
    refining_energy_MJ_per_t_alumina: { min: 8, max: 15.5, typical: 13.5 },
    refining_electricity_kWh_per_t_alumina: { min: 100, max: 200, typical: 150 },
    refining_water_m3_per_t_alumina: { min: 1, max: 4, typical: 2.5 },
    refining_caustic_soda_kg_per_t_alumina: { min: 50, max: 150, typical: 80 },
    refining_lime_kg_per_t_alumina: { min: 10, max: 40, typical: 20 },
    refining_process_efficiency_percent: { min: 85, max: 98, typical: 90 },
    refining_alumina_grade_percent: { min: 98.5, max: 99.9, typical: 99.5 }
  },
  smelting: {
    smelting_alumina_input_t_per_t_aluminium: { min: 1.9, max: 2.2, typical: 2.0 },
    smelting_electricity_kWh_per_t_aluminium: { min: 13500, max: 17000, typical: 15000 },
    smelting_carbon_anode_kg_per_t_aluminium: { min: 400, max: 500, typical: 450 },
    smelting_direct_co2_emissions_t_CO2_per_t_aluminium: { min: 1.5, max: 2.0, typical: 1.7 },
    smelting_pfc_emissions_t_CO2e_per_t_aluminium: { min: 0.1, max: 0.5, typical: 0.3 },
    smelting_dross_kg_per_t_aluminium: { min: 15, max: 50, typical: 30 },
    smelting_spent_pot_lining_kg_per_t_aluminium: { min: 20, max: 30, typical: 25 },
    smelting_energy_efficiency_percent: { min: 88, max: 96, typical: 92 },
    smelting_cell_voltage_V: { min: 4.0, max: 4.5, typical: 4.2 },
    smelting_current_efficiency_percent: { min: 90, max: 96, typical: 94 },
    smelting_grid_emission_factor_kg_CO2_per_kWh: { min: 0.05, max: 1.2, typical: 0.82 }
  },
  manufacturing: {
    manufacturing_energy_kWh_per_t: { min: 300, max: 1200, typical: 600 },
    manufacturing_scrap_percent: { min: 5, max: 30, typical: 12 },
    manufacturing_on_site_scrap_recycling_percent: { min: 0, max: 90, typical: 70 },
    manufacturing_surface_treatment_chemicals_kg_per_t: { min: 0, max: 15, typical: 5 },
    manufacturing_water_m3_per_t: { min: 0.5, max: 3, typical: 1.5 },
    manufacturing_yield_percent: { min: 70, max: 95, typical: 88 },
    manufacturing_coating_kg_per_m2: { min: 0.02, max: 0.1, typical: 0.05 },
    manufacturing_welding_energy_kWh_per_t: { min: 20, max: 100, typical: 50 }
  },
  recycling: {
    recycling_recycled_content_percent: { min: 20, max: 100, typical: 50 },
    recycling_energy_kWh_per_t: { min: 2000, max: 4000, typical: 3000 },
    recycling_yield_percent: { min: 85, max: 98, typical: 92 },
    recycling_collection_rate_percent: { min: 50, max: 95, typical: 75 },
    recycling_sorting_efficiency_percent: { min: 70, max: 95, typical: 85 },
    recycling_contaminant_removal_percent: { min: 80, max: 98, typical: 90 },
    recycling_water_m3_per_t: { min: 0.2, max: 1.5, typical: 0.5 },
    recycling_salt_flux_kg_per_t: { min: 10, max: 25, typical: 15 }
  },
  valorization: {
    valorization_red_mud_valorization_percent: { min: 2, max: 70, typical: 40 },
    valorization_dross_recovery_percent: { min: 50, max: 95, typical: 75 },
    valorization_spl_valorization_percent: { min: 0, max: 50, typical: 25 },
    valorization_slag_utilization_percent: { min: 30, max: 90, typical: 60 },
    valorization_co_product_recovery_percent: { min: 20, max: 80, typical: 50 },
    valorization_waste_to_landfill_percent: { min: 10, max: 70, typical: 30 },
    valorization_energy_kWh_per_t: { min: 20, max: 100, typical: 50 }
  }
};

// ============================================================================
// SCENARIO MATCHING LOGIC
// ============================================================================

/**
 * Match user inputs to the most appropriate scenarios
 * Returns top 3 matching scenarios with confidence scores
 */
export function matchScenarios(userInputs, stepName, isSustainable = false) {
  const scores = [];
  
  // If sustainable mode is enabled, prefer sustainable scenarios
  const sustainableTypes = ['sustainable', 'best_practice', 'circular', 'best_circular', 'innovative', 'valorization'];
  
  Object.entries(SCENARIOS).forEach(([key, scenario]) => {
    let score = 0;
    let matchCount = 0;
    
    // Bonus for sustainable scenarios when in sustainable mode
    if (isSustainable && sustainableTypes.includes(scenario.type)) {
      score += 20;
    }
    
    // Match ore grade (if provided)
    if (userInputs.mining_ore_grade_percent !== undefined && userInputs.mining_ore_grade_percent !== null) {
      const diff = Math.abs(scenario.ore_grade - userInputs.mining_ore_grade_percent);
      score += Math.max(0, 20 - diff); // Max 20 points
      matchCount++;
    }
    
    // Match renewable power (if provided)
    if (userInputs.renewable_energy_percent !== undefined && userInputs.renewable_energy_percent !== null) {
      const diff = Math.abs(scenario.renewable_power_percent - userInputs.renewable_energy_percent);
      score += Math.max(0, 20 - diff / 2); // Max 20 points
      matchCount++;
    }
    
    // Match recycled content (if provided)
    if (userInputs.recycling_recycled_content_percent !== undefined && userInputs.recycling_recycled_content_percent !== null) {
      const scenarioRecycled = scenario.recycled_content || 0;
      const diff = Math.abs(scenarioRecycled - userInputs.recycling_recycled_content_percent);
      score += Math.max(0, 20 - diff / 2);
      matchCount++;
    }
    
    // Match waste utilization (if provided)
    if (userInputs.valorization_red_mud_valorization_percent !== undefined || userInputs.waste_util_percent !== undefined) {
      const userWaste = userInputs.valorization_red_mud_valorization_percent || userInputs.waste_util_percent || 0;
      const diff = Math.abs(scenario.waste_util_percent - userWaste);
      score += Math.max(0, 15 - diff / 2);
      matchCount++;
    }
    
    // Match energy efficiency hints
    if (userInputs.smelting_electricity_kWh_per_t_aluminium !== undefined) {
      const diff = Math.abs(scenario.energy_smelting - userInputs.smelting_electricity_kWh_per_t_aluminium);
      score += Math.max(0, 15 - diff / 500);
      matchCount++;
    }
    
    // If no matches, give base score based on type
    if (matchCount === 0) {
      if (isSustainable && sustainableTypes.includes(scenario.type)) {
        score = 50;
      } else {
        score = scenario.type === 'average' || scenario.type === 'improved' ? 30 : 20;
      }
    }
    
    scores.push({
      key,
      scenario,
      score,
      matchCount
    });
  });
  
  // Sort by score descending and return top 3
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, 3);
}

// ============================================================================
// DEPENDENCY RULES ENGINE
// ============================================================================

/**
 * Apply dependency logic to adjust values based on constraints
 */
export function applyDependencyRules(baseValue, fieldName, allValues, scenario) {
  let adjustedValue = baseValue;
  let adjustmentFactor = 1.0;
  const reasons = [];
  
  // Rule 1: Ore Grade affects downstream values
  const oreGrade = allValues.mining_ore_grade_percent;
  if (oreGrade !== undefined && oreGrade !== null) {
    if (fieldName === 'refining_bauxite_input_t_per_t_alumina') {
      // High ore grade → less bauxite needed
      if (oreGrade > 55) {
        adjustmentFactor *= 0.9;
        reasons.push("High ore grade reduces bauxite requirement");
      } else if (oreGrade < 40) {
        adjustmentFactor *= 1.15;
        reasons.push("Low ore grade increases bauxite requirement");
      }
    }
    
    if (fieldName === 'refining_red_mud_t_per_t_alumina') {
      // High ore grade → less red mud
      if (oreGrade > 55) {
        adjustmentFactor *= 0.85;
        reasons.push("High ore grade reduces red mud generation");
      } else if (oreGrade < 40) {
        adjustmentFactor *= 1.2;
        reasons.push("Low ore grade increases red mud generation");
      }
    }
    
    if (fieldName === 'refining_energy_MJ_per_t_alumina') {
      // Lower ore grade → more energy
      if (oreGrade < 40) {
        adjustmentFactor *= 1.1;
        reasons.push("Low ore grade increases refining energy");
      } else if (oreGrade > 55) {
        adjustmentFactor *= 0.92;
        reasons.push("High ore grade reduces refining energy");
      }
    }
  }
  
  // Rule 2: Renewable Energy affects emissions
  const renewablePercent = allValues.renewable_energy_percent || 
                          allValues.sustainabilityParameters?.renewable_energy_percent;
  if (renewablePercent !== undefined && renewablePercent !== null) {
    if (fieldName === 'grid_emission_factor_kg_CO2_per_kWh') {
      // More renewables → lower grid emission factor
      const renewableFraction = renewablePercent / 100;
      adjustedValue = 0.82 * (1 - renewableFraction * 0.9) + 0.05 * renewableFraction;
      reasons.push(`${renewablePercent}% renewable energy reduces grid emissions`);
      return { value: adjustedValue, reasons };
    }
    
    if (fieldName.includes('ghg') || fieldName.includes('co2')) {
      if (renewablePercent > 60) {
        adjustmentFactor *= 0.7;
        reasons.push("High renewable energy significantly reduces emissions");
      } else if (renewablePercent > 30) {
        adjustmentFactor *= 0.85;
        reasons.push("Moderate renewable energy reduces emissions");
      }
    }
  }
  
  // Rule 3: Water Recycling affects fresh water intake
  const waterRecyclePercent = allValues.water_recycle_percent || 
                              allValues.sustainabilityParameters?.water_recycle_percent;
  if (waterRecyclePercent !== undefined && waterRecyclePercent !== null) {
    if (fieldName.includes('water') && !fieldName.includes('recycle')) {
      const recycleFraction = waterRecyclePercent / 100;
      adjustmentFactor *= (1 - recycleFraction * 0.6);
      reasons.push(`${waterRecyclePercent}% water recycling reduces fresh water intake`);
    }
  }
  
  // Rule 4: Recycled Content affects primary energy
  const recycledContent = allValues.recycling_recycled_content_percent;
  if (recycledContent !== undefined && recycledContent !== null) {
    if (fieldName.includes('energy') && !fieldName.includes('recycling')) {
      const recycledFraction = recycledContent / 100;
      adjustmentFactor *= (1 - recycledFraction * 0.7);
      reasons.push(`${recycledContent}% recycled content reduces primary energy`);
    }
  }
  
  // Rule 5: Process Efficiency affects yield and scrap
  const processEfficiency = allValues.refining_process_efficiency_percent || 
                           allValues.smelting_energy_efficiency_percent;
  if (processEfficiency !== undefined && processEfficiency !== null) {
    if (fieldName.includes('scrap')) {
      if (processEfficiency > 92) {
        adjustmentFactor *= 0.85;
        reasons.push("High process efficiency reduces scrap generation");
      } else if (processEfficiency < 88) {
        adjustmentFactor *= 1.15;
        reasons.push("Lower process efficiency increases scrap");
      }
    }
  }
  
  adjustedValue = baseValue * adjustmentFactor;
  
  return { value: adjustedValue, reasons };
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Detect logical conflicts in user inputs
 * Returns array of conflict warnings
 */
export function detectConflicts(userInputs, stepName) {
  const conflicts = [];
  
  // Conflict 1: High ore grade but high energy
  if (userInputs.mining_ore_grade_percent > 55 && userInputs.refining_energy_MJ_per_t_alumina > 14) {
    conflicts.push({
      severity: 'warning',
      field: 'refining_energy_MJ_per_t_alumina',
      message: 'High ore grade (>55%) typically requires less refining energy (<12 GJ/t). Current value seems high.',
      suggestion: 'Consider lowering energy to 10-12 GJ/t for high-grade ore.'
    });
  }
  
  // Conflict 2: Low ore grade but low bauxite input
  if (userInputs.mining_ore_grade_percent < 40 && userInputs.refining_bauxite_input_t_per_t_alumina < 2.9) {
    conflicts.push({
      severity: 'warning',
      field: 'refining_bauxite_input_t_per_t_alumina',
      message: 'Low ore grade (<40%) typically requires more bauxite (>3.2 t/t). Current value seems low.',
      suggestion: 'Consider increasing bauxite input to 3.2-3.5 t/t for low-grade ore.'
    });
  }
  
  // Conflict 3: High renewable but high emissions
  const renewablePercent = userInputs.renewable_energy_percent || 
                          userInputs.sustainabilityParameters?.renewable_energy_percent;
  if (renewablePercent > 70 && userInputs.smelting_grid_emission_factor_kg_CO2_per_kWh > 0.5) {
    conflicts.push({
      severity: 'warning',
      field: 'smelting_grid_emission_factor_kg_CO2_per_kWh',
      message: `High renewable energy (${renewablePercent}%) should result in low grid emissions (<0.3 kg CO₂/kWh).`,
      suggestion: 'Grid emission factor should be 0.1-0.3 for high renewable grids.'
    });
  }
  
  // Conflict 4: High recycled content but high primary energy
  if (userInputs.recycling_recycled_content_percent > 60 && userInputs.smelting_electricity_kWh_per_t_aluminium > 15000) {
    conflicts.push({
      severity: 'info',
      field: 'smelting_electricity_kWh_per_t_aluminium',
      message: `High recycled content (${userInputs.recycling_recycled_content_percent}%) typically reduces overall primary energy needs.`,
      suggestion: 'This might be correct if you\'re tracking primary smelting separately.'
    });
  }
  
  // Conflict 5: Values outside realistic ranges
  Object.entries(userInputs).forEach(([field, value]) => {
    if (value === null || value === undefined || value === '') return;
    
    const range = RANGES[stepName]?.[field];
    if (range && typeof value === 'number') {
      if (value < range.min || value > range.max) {
        conflicts.push({
          severity: 'error',
          field,
          message: `Value ${value} is outside realistic range [${range.min} - ${range.max}].`,
          suggestion: `Typical value is ${range.typical}. Please verify your input.`
        });
      }
    }
  });
  
  return conflicts;
}

// ============================================================================
// MAIN FALLBACK GENERATOR
// ============================================================================

/**
 * Generate intelligent fallback values for a step
 * 
 * @param {string} stepName - Step name (mining, beneficiation, etc.)
 * @param {object} userInputs - Current form values from user
 * @param {boolean} isSustainable - Whether sustainability mode is enabled
 * @returns {object} - { fallbacks: {}, reasoning: {}, conflicts: [], matchedScenarios: [] }
 */
export function generateFallbacks(stepName, userInputs = {}, isSustainable = false) {
  console.log(`🎯 [Fallback Generator] Starting for step: ${stepName}`);
  console.log(`📝 [Fallback Generator] User inputs:`, userInputs);
  console.log(`🌱 [Fallback Generator] Sustainable mode:`, isSustainable);
  
  // Step 1: Match scenarios
  const matchedScenarios = matchScenarios(userInputs, stepName, isSustainable);
  const topScenario = matchedScenarios[0].scenario;
  console.log(`✨ [Fallback Generator] Top matched scenario: ${matchedScenarios[0].key} - ${topScenario.name}`);
  
  // Step 2: Detect conflicts
  const conflicts = detectConflicts(userInputs, stepName);
  if (conflicts.length > 0) {
    console.log(`⚠️ [Fallback Generator] Detected ${conflicts.length} conflicts`);
  }
  
  // Step 3: Generate fallback values based on step
  const fallbacks = {};
  const reasoning = {};
  
  // Get step-specific fallback generation
  const stepFallbacks = generateStepFallbacks(stepName, userInputs, topScenario, isSustainable);
  
  // Step 4: Apply dependency rules to each fallback
  Object.entries(stepFallbacks).forEach(([fieldName, baseValue]) => {
    const { value, reasons } = applyDependencyRules(baseValue, fieldName, userInputs, topScenario);
    
    // Ensure value is within realistic range
    const range = RANGES[stepName]?.[fieldName];
    let finalValue = value;
    if (range) {
      finalValue = Math.max(range.min, Math.min(range.max, value));
      if (finalValue !== value) {
        reasons.push(`Clamped to realistic range [${range.min}-${range.max}]`);
      }
    }
    
    fallbacks[fieldName] = finalValue;
    reasoning[fieldName] = {
      value: finalValue,
      baseScenario: `${matchedScenarios[0].key}: ${topScenario.name}`,
      reasons: reasons.length > 0 ? reasons : [`Based on ${topScenario.name} scenario`]
    };
  });
  
  console.log(`✅ [Fallback Generator] Generated ${Object.keys(fallbacks).length} fallback values`);
  
  return {
    fallbacks,
    reasoning,
    conflicts,
    matchedScenarios: matchedScenarios.map(m => ({
      key: m.key,
      name: m.scenario.name,
      score: m.score.toFixed(1)
    }))
  };
}

// ============================================================================
// STEP-SPECIFIC FALLBACK GENERATORS
// ============================================================================

function generateStepFallbacks(stepName, userInputs, scenario, isSustainable) {
  switch (stepName) {
    case 'mining':
      return generateMiningFallbacks(userInputs, scenario, isSustainable);
    case 'beneficiation':
      return generateBeneficiationFallbacks(userInputs, scenario, isSustainable);
    case 'refining':
      return generateRefiningFallbacks(userInputs, scenario, isSustainable);
    case 'smelting':
      return generateSmeltingFallbacks(userInputs, scenario, isSustainable);
    case 'manufacturing':
      return generateManufacturingFallbacks(userInputs, scenario, isSustainable);
    case 'recycling':
      return generateRecyclingFallbacks(userInputs, scenario, isSustainable);
    case 'valorization':
      return generateValorizationFallbacks(userInputs, scenario, isSustainable);
    default:
      return {};
  }
}

function generateMiningFallbacks(userInputs, scenario, isSustainable) {
  const fallbacks = {};
  
  if (!userInputs.mining_ore_grade_percent) {
    fallbacks.mining_ore_grade_percent = scenario.ore_grade;
  }
  
  if (!userInputs.mining_overburden_ratio) {
    fallbacks.mining_overburden_ratio = isSustainable ? 2.5 : 3.5;
  }
  
  if (!userInputs.mining_water_m3_per_t_ore) {
    fallbacks.mining_water_m3_per_t_ore = scenario.mining_water || (isSustainable ? 0.3 : 0.8);
  }
  
  if (!userInputs.mining_diesel_L_per_t_ore) {
    fallbacks.mining_diesel_L_per_t_ore = isSustainable ? 8 : 15;
  }
  
  if (!userInputs.mining_electricity_kWh_per_t_ore) {
    fallbacks.mining_electricity_kWh_per_t_ore = isSustainable ? 15 : 12;
  }
  
  if (!userInputs.mining_explosives_kg_per_t_ore) {
    fallbacks.mining_explosives_kg_per_t_ore = 0.3;
  }
  
  if (!userInputs.mining_land_disturbed_m2_per_t_ore) {
    fallbacks.mining_land_disturbed_m2_per_t_ore = isSustainable ? 1.5 : 2.5;
  }
  
  if (!userInputs.mining_ghg_kg_CO2e_per_t_ore) {
    fallbacks.mining_ghg_kg_CO2e_per_t_ore = isSustainable ? 5 : 8;
  }
  
  if (!userInputs.mining_dust_emissions_kg_per_t_ore) {
    fallbacks.mining_dust_emissions_kg_per_t_ore = isSustainable ? 0.3 : 0.5;
  }
  
  if (!userInputs.mining_equipment_type) {
    fallbacks.mining_equipment_type = isSustainable ? 'electric' : 'diesel_electric_hybrid';
  }
  
  return fallbacks;
}

function generateBeneficiationFallbacks(userInputs, scenario, isSustainable) {
  const fallbacks = {};
  
  if (!userInputs.beneficiation_water_m3_per_t_ore) {
    fallbacks.beneficiation_water_m3_per_t_ore = isSustainable ? 0.6 : 1.0;
  }
  
  if (!userInputs.beneficiation_electricity_kWh_per_t_ore) {
    fallbacks.beneficiation_electricity_kWh_per_t_ore = 15;
  }
  
  if (!userInputs.beneficiation_chemical_kg_per_t_ore) {
    fallbacks.beneficiation_chemical_kg_per_t_ore = isSustainable ? 0.1 : 0.2;
  }
  
  if (!userInputs.beneficiation_tailings_t_per_t_ore) {
    fallbacks.beneficiation_tailings_t_per_t_ore = 0.3;
  }
  
  if (!userInputs.beneficiation_tailings_solids_content_percent) {
    fallbacks.beneficiation_tailings_solids_content_percent = isSustainable ? 55 : 45;
  }
  
  if (!userInputs.beneficiation_recovery_percent) {
    fallbacks.beneficiation_recovery_percent = isSustainable ? 95 : 92;
  }
  
  return fallbacks;
}

function generateRefiningFallbacks(userInputs, scenario, isSustainable) {
  const fallbacks = {};
  
  if (!userInputs.refining_bauxite_input_t_per_t_alumina) {
    fallbacks.refining_bauxite_input_t_per_t_alumina = scenario.bauxite_per_alumina;
  }
  
  if (!userInputs.refining_red_mud_t_per_t_alumina) {
    fallbacks.refining_red_mud_t_per_t_alumina = scenario.red_mud;
  }
  
  if (!userInputs.refining_energy_MJ_per_t_alumina) {
    fallbacks.refining_energy_MJ_per_t_alumina = scenario.energy_refining;
  }
  
  if (!userInputs.refining_electricity_kWh_per_t_alumina) {
    fallbacks.refining_electricity_kWh_per_t_alumina = isSustainable ? 120 : 150;
  }
  
  if (!userInputs.refining_water_m3_per_t_alumina) {
    fallbacks.refining_water_m3_per_t_alumina = isSustainable ? 1.5 : 2.5;
  }
  
  if (!userInputs.refining_caustic_soda_kg_per_t_alumina) {
    fallbacks.refining_caustic_soda_kg_per_t_alumina = 80;
  }
  
  if (!userInputs.refining_lime_kg_per_t_alumina) {
    fallbacks.refining_lime_kg_per_t_alumina = 20;
  }
  
  if (!userInputs.refining_process_efficiency_percent) {
    fallbacks.refining_process_efficiency_percent = isSustainable ? 92 : 88;
  }
  
  if (!userInputs.refining_alumina_grade_percent) {
    fallbacks.refining_alumina_grade_percent = 99.5;
  }
  
  return fallbacks;
}

function generateSmeltingFallbacks(userInputs, scenario, isSustainable) {
  const fallbacks = {};
  
  if (!userInputs.smelting_alumina_input_t_per_t_aluminium) {
    fallbacks.smelting_alumina_input_t_per_t_aluminium = scenario.alumina_per_al || 2.0;
  }
  
  if (!userInputs.smelting_electricity_kWh_per_t_aluminium) {
    fallbacks.smelting_electricity_kWh_per_t_aluminium = scenario.energy_smelting;
  }
  
  if (!userInputs.smelting_carbon_anode_kg_per_t_aluminium) {
    fallbacks.smelting_carbon_anode_kg_per_t_aluminium = isSustainable ? 420 : 450;
  }
  
  if (!userInputs.smelting_direct_co2_emissions_t_CO2_per_t_aluminium) {
    fallbacks.smelting_direct_co2_emissions_t_CO2_per_t_aluminium = 1.7;
  }
  
  if (!userInputs.smelting_pfc_emissions_t_CO2e_per_t_aluminium) {
    fallbacks.smelting_pfc_emissions_t_CO2e_per_t_aluminium = isSustainable ? 0.15 : 0.3;
  }
  
  if (!userInputs.smelting_dross_kg_per_t_aluminium) {
    fallbacks.smelting_dross_kg_per_t_aluminium = 30;
  }
  
  if (!userInputs.smelting_spent_pot_lining_kg_per_t_aluminium) {
    fallbacks.smelting_spent_pot_lining_kg_per_t_aluminium = 25;
  }
  
  if (!userInputs.smelting_energy_efficiency_percent) {
    fallbacks.smelting_energy_efficiency_percent = isSustainable ? 94 : 92;
  }
  
  if (!userInputs.smelting_cell_voltage_V) {
    fallbacks.smelting_cell_voltage_V = 4.2;
  }
  
  if (!userInputs.smelting_current_efficiency_percent) {
    fallbacks.smelting_current_efficiency_percent = isSustainable ? 95 : 94;
  }
  
  if (!userInputs.smelting_grid_emission_factor_kg_CO2_per_kWh) {
    fallbacks.smelting_grid_emission_factor_kg_CO2_per_kWh = isSustainable ? 0.15 : 0.82;
  }
  
  return fallbacks;
}

function generateManufacturingFallbacks(userInputs, scenario, isSustainable) {
  const fallbacks = {};
  
  if (!userInputs.manufacturing_energy_kWh_per_t) {
    fallbacks.manufacturing_energy_kWh_per_t = 600;
  }
  
  if (!userInputs.manufacturing_scrap_percent) {
    fallbacks.manufacturing_scrap_percent = scenario.scrap_percent;
  }
  
  if (!userInputs.manufacturing_on_site_scrap_recycling_percent) {
    fallbacks.manufacturing_on_site_scrap_recycling_percent = isSustainable ? 85 : 70;
  }
  
  if (!userInputs.manufacturing_surface_treatment_chemicals_kg_per_t) {
    fallbacks.manufacturing_surface_treatment_chemicals_kg_per_t = 5;
  }
  
  if (!userInputs.manufacturing_water_m3_per_t) {
    fallbacks.manufacturing_water_m3_per_t = 1.5;
  }
  
  if (!userInputs.manufacturing_yield_percent) {
    fallbacks.manufacturing_yield_percent = isSustainable ? 92 : 88;
  }
  
  if (!userInputs.manufacturing_product_type) {
    fallbacks.manufacturing_product_type = 'rolled_sheet';
  }
  
  if (!userInputs.manufacturing_coating_kg_per_m2) {
    fallbacks.manufacturing_coating_kg_per_m2 = 0.05;
  }
  
  if (!userInputs.manufacturing_welding_energy_kWh_per_t) {
    fallbacks.manufacturing_welding_energy_kWh_per_t = 50;
  }
  
  return fallbacks;
}

function generateRecyclingFallbacks(userInputs, scenario, isSustainable) {
  const fallbacks = {};
  
  if (!userInputs.recycling_recycled_content_percent) {
    fallbacks.recycling_recycled_content_percent = scenario.recycled_content || (isSustainable ? 60 : 50);
  }
  
  if (!userInputs.recycling_energy_kWh_per_t) {
    fallbacks.recycling_energy_kWh_per_t = scenario.recycling_energy * 1000 || 3000;
  }
  
  if (!userInputs.recycling_yield_percent) {
    fallbacks.recycling_yield_percent = scenario.recycling_yield;
  }
  
  if (!userInputs.recycling_collection_rate_percent) {
    fallbacks.recycling_collection_rate_percent = isSustainable ? 85 : 75;
  }
  
  if (!userInputs.recycling_sorting_efficiency_percent) {
    fallbacks.recycling_sorting_efficiency_percent = isSustainable ? 90 : 85;
  }
  
  if (!userInputs.recycling_contaminant_removal_percent) {
    fallbacks.recycling_contaminant_removal_percent = 90;
  }
  
  if (!userInputs.recycling_water_m3_per_t) {
    fallbacks.recycling_water_m3_per_t = 0.5;
  }
  
  if (!userInputs.recycling_salt_flux_kg_per_t) {
    fallbacks.recycling_salt_flux_kg_per_t = 15;
  }
  
  return fallbacks;
}

function generateValorizationFallbacks(userInputs, scenario, isSustainable) {
  const fallbacks = {};
  
  if (!userInputs.valorization_red_mud_valorization_percent) {
    fallbacks.valorization_red_mud_valorization_percent = isSustainable ? 50 : 40;
  }
  
  if (!userInputs.valorization_dross_recovery_percent) {
    fallbacks.valorization_dross_recovery_percent = isSustainable ? 85 : 75;
  }
  
  if (!userInputs.valorization_spl_valorization_percent) {
    fallbacks.valorization_spl_valorization_percent = isSustainable ? 40 : 25;
  }
  
  if (!userInputs.valorization_slag_utilization_percent) {
    fallbacks.valorization_slag_utilization_percent = 60;
  }
  
  if (!userInputs.valorization_co_product_recovery_percent) {
    fallbacks.valorization_co_product_recovery_percent = 50;
  }
  
  if (!userInputs.valorization_waste_to_landfill_percent) {
    fallbacks.valorization_waste_to_landfill_percent = isSustainable ? 20 : 30;
  }
  
  if (!userInputs.valorization_energy_kWh_per_t) {
    fallbacks.valorization_energy_kWh_per_t = 50;
  }
  
  return fallbacks;
}

export default {
  generateFallbacks,
  matchScenarios,
  detectConflicts,
  applyDependencyRules,
  SCENARIOS,
  RANGES
};
