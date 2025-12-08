/**
 * Guided Mode Smart Defaults for Aluminium Processing
 * These defaults are based on industry-standard values for typical aluminium operations
 */

export const GUIDED_MODE_DEFAULTS = {
  mining: {
    // Required fields
    applicableProcesses: ["openPit"],
    location: "Odisha",
    oreGrade: 45,
    
    // Optional fields with realistic defaults
    others: "",
    year: new Date().getFullYear(),
    typeOfEquipment: "diesel",
    fuelConsumption: 7,
    waterSource: "Surface water",
    waterUsage: 0.5,
    blastingFrequency: "Weekly",
    explosivesUsed: 50,
    redMudGeneration: 0,
    biodiversityImpact: "moderate",
    landReclamation: "Planned",
    dustControl: "Water spraying",
    noiseLevel: 70,
    transport: {
      distance: 20,
      mode: "Road",
      vehicleType: "Diesel trucks"
    },
    
    // AI Predicted fields
    mining_energy_MJ_per_t_ore: 150,
    mining_co2_kg_per_t_ore: 12,
    mining_sox_kg_per_t_ore: 0.1,
    mining_nox_kg_per_t_ore: 0.15,
    mining_pm_kg_per_t_ore: 0.05,
    
    // Sustainability Parameters
    followingSustainableRules: true,
    sustainabilityParameters: {
      renewable_energy_percent: 10,
      water_recycling_rate: 20,
      biodiversity_offset_area_ha: 1,
      rehabilitation_progress_percent: 0,
      community_development_investment: 50000,
      carbon_offset_tonnes: 5
    }
  },
  
  beneficiation: {
    // Required fields
    applicableProcesses: ["crushing", "washing_screening", "grinding"],
    processes: ["crushing", "washing_screening", "grinding"],
    location: "", // User can fill
    oreFeedRate: 150, // t/h
    beneficiationEfficiency: 85, // %
    
    // Optional fields
    others: "",
    processOthers: "",
    feedRate: 150, // t/h
    waterConsumption: 0.5, // m³/t
    electricityUse: 20, // kWh/t
    
    // Crushing
    crushing: ["primary", "secondary"],
    crushingSelections: ["primary", "secondary"],
    crushingStage: "secondary",
    
    // Chemical Agents
    chemicalAgents: ["flocculants"],
    chemicalOthers: "",
    
    // Tailings Management
    tailings: "tailing_ponds",
    tailingsOthers: "",
    
    // Pollution Levels
    noiseLevel: "Moderate",
    dustLevel: "Moderate",
    
    // Waste Tailings & Slurry
    wasteTailingsSlurry: {
      stored: "tailing_ponds",
      volume: 0.2, // m³/t
      toxicity: "Low",
      toxicityOthers: ""
    },
    
    // AI Predicted Fields
    beneficiation_water_m3_per_t_ore: 0.5,
    beneficiation_electricity_kWh_per_t_ore: 20,
    beneficiation_tailings_management: "tailing_ponds",
    beneficiation_noise_pollution: "Moderate",
    beneficiation_dust_pollution: "Moderate",
    
    // Sustainability Parameters
    followingSustainableRules: false,
    sustainabilityParameters: {
      water_recycled_percent: 30, // %
      tailings_storage_type_thickened_or_dry: false,
      bio_based_flocculant_used: false,
      reagent_dosage_optimized: false,
      concentrate_grade_percent: 0,
      renewable_energy_percent: 20, // %
      
      // Additional sustainability fields for comprehensive coverage
      water_recycling_rate: 30, // %
      energy_from_renewables_percent: 20, // %
      tailings_dry_stacking: false,
      chemical_recovery_rate: 15, // %
      dust_emission_control_efficiency: 80 // %
    }
  },
  
  refining: {
    processes: ["bayer_process"],
    location: "India",
    alumina_output: 1000,
    caustic_concentration: 220,
    temperature: 145,
    pressure: 5,
    red_mud_generated: 1.5,
    followingSustainableRules: false,
    sustainabilityParameters: {
      red_mud_utilization_percent: 30,
      caustic_soda_recovery_percent: 95,
      heat_recovery_loops_enabled: true,
      bauxite_residue_management_certified: true,
      emission_scrubbing_efficiency_percent: 90,
      renewable_energy_percent: 25
    }
  },
  
  smelting: {
    processes: ["hall_heroult"],
    location: "India",
    aluminium_production: 500,
    energy_consumption: 14500,
    current_efficiency: 95,
    pot_voltage: 4.5,
    anode_consumption: 450,
    followingSustainableRules: false,
    sustainabilityParameters: {
      renewable_power_mix_percent: 40,
      anode_type_prebaked_or_low_carbon: true,
      fluoride_recovery_efficiency_percent: 92,
      pfc_abatement_enabled: true,
      dross_valorization_rate_percent: 85,
      spl_reused_percent: 70
    }
  },
  
  manufacturing: {
    processes: ["extrusion"],
    location: "India",
    production_rate: 200,
    scrap_rate: 15,
    energy_per_unit: 2.5,
    followingSustainableRules: false,
    sustainabilityParameters: {
      design_for_recycling_enabled: true,
      scrap_recycled_onsite_percent: 90,
      transport_mode_rail_or_sea_preferred: false,
      coating_voc_free: false,
      renewable_energy_percent: 30,
      product_expected_lifetime_years: 25
    }
  },
  
  recycling: {
    processes: ["collection_sorting"],
    location: "India",
    collection_rate: 65,
    sorting_efficiency: 85,
    recovery_rate: 90,
    followingSustainableRules: false,
    sustainabilityParameters: {
      collection_rate_percent: 70,
      sorting_technology_optical_or_advanced: true,
      recovery_yield_percent: 92,
      downcycling_avoided: true,
      renewable_energy_percent: 35,
      end_of_life_tracking_enabled: false
    }
  },
  
  valorization: {
    wasteTypes: ["red_mud", "dross"],
    valorizationMethods: ["metal_recovery"],
    location: "India",
    redMudUtilized: 35,
    drossUtilized: 80,
    followingSustainableRules: false,
    sustainabilityParameters: {
      red_mud_valorization_rate_percent: 40,
      dross_valorization_rate_percent: 85,
      spl_valorization_rate_percent: 65,
      metal_recovery_rate_percent: 88,
      circular_economy_integration: true,
      environmental_impact_reduction_percent: 60
    }
  }
}

/**
 * Get smart defaults for a specific step with inheritance from previous steps
 * @param {string} stepName - Name of the current step
 * @param {object} previousStepData - Data from previous steps for inheritance
 * @returns {object} Smart default values for the step
 */
export function getStepDefaults(stepName, previousStepData = {}) {
  const defaults = { ...GUIDED_MODE_DEFAULTS[stepName] }
  
  if (!defaults) {
    console.warn(`No guided mode defaults found for step: ${stepName}`)
    return {}
  }
  
  // Inherit location from previous step if available
  if (previousStepData.location) {
    defaults.location = previousStepData.location
  }
  
  // Inherit year from mining step if available
  if (previousStepData.year && stepName !== 'mining') {
    defaults.year = previousStepData.year
  }
  
  return defaults
}

/**
 * Check if guided mode should be enabled by default for a user
 * Can be customized based on user preferences stored in localStorage
 * @returns {boolean}
 */
export function shouldEnableGuidedModeByDefault() {
  try {
    const stored = localStorage.getItem('lcaWizardGuidedMode')
    return stored !== null ? stored === 'true' : true // Default to enabled
  } catch (e) {
    return true
  }
}

/**
 * Save user's guided mode preference
 * @param {boolean} enabled
 */
export function saveGuidedModePreference(enabled) {
  try {
    localStorage.setItem('lcaWizardGuidedMode', enabled.toString())
  } catch (e) {
    console.warn('Failed to save guided mode preference:', e)
  }
}
