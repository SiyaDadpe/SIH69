/**
 * Wizard Workflow Model
 * 
 * Represents a completed wizard form submission for LCA data collection.
 * Stores comprehensive data across 7 stages: mining, beneficiation, refining,
 * smelting, manufacturing, recycling, and valorization.
 * 
 * @module models/WizardWorkflow
 */

const mongoose = require('mongoose');

/**
 * Wizard Workflow Schema
 * 
 * Stores detailed form data from the multi-step wizard interface
 */
const wizardWorkflowSchema = new mongoose.Schema(
  {
    // ============================================================================
    // COMMON FIELDS
    // ============================================================================
    
    // Basic Information
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },

    metalType: {
      type: String,
      required: [true, 'Metal type is required'],
      enum: {
        values: ['Aluminium', 'Copper', 'Steel', 'Titanium', 'Lithium', 'Nickel', 'Gold', 'Zinc'],
        message: '{VALUE} is not a valid metal type'
      }
    },

    // ============================================================================
    // STEP 1: MINING (Bauxite Extraction)
    // ============================================================================
    mining: {
      applicableProcesses: [{
        type: String,
        enum: ['openPit', 'strip', 'drilling', 'hydraulic', 'manual', 'electricShovel', 'dieselHaul', 'inSitu', 'others']
      }],
      others: String,
      location: String,
      year: Number,
      oreGrade: Number, // Percentage
      overburdenRatio: Number,
      productionVolume: Number, // tonnes/year
      typeOfEquipment: {
        type: String,
        enum: ['diesel', 'electric', 'hybrid']
      },
      fuelConsumption: Number, // liters or kWh per tonne
      waterSource: {
        type: String,
        enum: ['Surface water', 'Groundwater', 'Recycled water', 'Mixed sources']
      },
      waterUsage: Number, // m³ per tonne
      waterConsumption: Number, // m³ per tonne (backward compatibility)
      blastingFrequency: {
        type: String,
        enum: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly']
      },
      explosivesUsed: Number, // kg per blast
      redMudGeneration: Number, // kg per tonne
      biodiversityImpact: {
        type: String,
        enum: ['low', 'moderate', 'high', 'severe']
      },
      landReclamation: {
        type: String,
        enum: ['Yes', 'No', 'Planned']
      },
      dustControl: {
        type: String,
        enum: ['Water spraying', 'Dust suppressants', 'Enclosures', 'None']
      },
      noiseLevel: Number, // dB
      transport: {
        distance: Number, // km
        mode: {
          type: String,
          enum: ['Road', 'Rail', 'Conveyor', 'Pipeline']
        },
        vehicleType: {
          type: String,
          enum: ['Diesel trucks', 'Electric vehicles', 'Rail cars']
        }
      },
      
      // AI Predicted Fields
      mining_energy_MJ_per_t_ore: { type: Number, default: null },
      mining_co2_kg_per_t_ore: { type: Number, default: null },
      mining_sox_kg_per_t_ore: { type: Number, default: null },
      mining_nox_kg_per_t_ore: { type: Number, default: null },
      mining_pm_kg_per_t_ore: { type: Number, default: null },
      
      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        renewable_energy_percent: { type: Number, default: null },
        water_recycling_rate: { type: Number, default: null },
        biodiversity_offset_area_ha: { type: Number, default: null },
        rehabilitation_progress_percent: { type: Number, default: null },
        community_development_investment: { type: Number, default: null },
        carbon_offset_tonnes: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 2: BENEFICIATION (Ore Washing, Crushing, Sorting)
    // ============================================================================
    beneficiation: {
      applicableProcesses: [{
        type: String,
        enum: ['crushing', 'washing_screening', 'grinding', 'magnetic_separation', 'flotation', 'dry_separation', 'gravity_separation', 'others']
      }],
      processes: [{
        type: String,
        enum: ['crushing', 'washing_screening', 'grinding', 'magnetic_separation', 'flotation', 'dry_separation', 'gravity_separation', 'others']
      }],
      others: String,
      processOthers: String,
      location: String,
      feedRate: Number, // tonnes per hour
      oreFeedRate: Number, // tonnes per hour
      waterConsumption: Number, // m³ per tonne
      electricityUse: Number, // kWh per tonne
      beneficiationEfficiency: Number, // % recovery
      crushing: [{
        type: String,
        enum: ['primary', 'secondary', 'tertiary']
      }],
      crushingSelections: [{
        type: String,
        enum: ['primary', 'secondary', 'tertiary']
      }],
      chemicalAgents: [{
        type: String,
        enum: ['flocculants', 'dispersants', 'coagulants', 'none', 'others']
      }],
      chemicalOthers: String,
      tailings: String,
      tailingsOthers: String,
      noiseLevel: String, // Low, Moderate, High
      dustLevel: String, // Low, Moderate, High
      wasteTailingsSlurry: {
        stored: {
          type: String,
          enum: ['tailing_ponds', 'pipeline_transport', 'thickened_sludge', 'others']
        },
        volume: Number, // m³ per tonne
        toxicity: {
          type: String,
          enum: ['Low', 'Moderate', 'High', 'Others']
        },
        toxicityOthers: String
      },
      
      // AI Predicted Fields
      beneficiation_water_m3_per_t_ore: { type: Number, default: null },
      beneficiation_electricity_kWh_per_t_ore: { type: Number, default: null },
      beneficiation_tailings_management: { type: String, default: null },
      beneficiation_noise_pollution: { type: String, default: null },
      beneficiation_dust_pollution: { type: String, default: null },
      
      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        water_recycling_rate: { type: Number, default: null },
        energy_from_renewables_percent: { type: Number, default: null },
        tailings_dry_stacking: { type: Boolean, default: null },
        chemical_recovery_rate: { type: Number, default: null },
        dust_emission_control_efficiency: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 3: ALUMINA REFINING (Bayer Process)
    // ============================================================================
    refining: {
      applicableProcesses: [{
        type: String,
        enum: ['crushing', 'digestion', 'clarification', 'precipitation', 'calcination', 'others']
      }],
      processes: [{
        type: String,
        enum: ['crushing', 'digestion', 'clarification', 'precipitation', 'calcination', 'others']
      }],
      others: String,
      processOthers: String,
      variants: [String],
      variantOthers: String,
      location: String,
      energyUse: Number, // kWh or MJ per tonne
      waterUse: Number, // m³ per tonne
      redMudGeneration: Number, // kg per tonne
      redMudGen: Number, // kg per tonne
      causticSoda: Number, // kg/t
      limeOtherAdditives: Number, // kg/t
      limeAdditives: Number, // kg/t
      so2Emissions: Number, // kg per tonne
      so2: Number, // kg per tonne
      noxEmissions: Number, // kg per tonne
      nox: Number, // kg per tonne
      dustEmissions: Number, // kg per tonne
      dust: Number, // kg per tonne
      redMudToxicityLevel: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Others']
      },
      toxicity: String,
      redMudToxicityOthers: String,
      toxicityOthers: String,
      wasteTailingsManagement: {
        type: String,
        enum: ['Stored in tailing ponds', 'Pipeline transport to disposal site']
      },
      
      // AI Predicted Fields
      refining_energy_MJ_per_t_alumina: { type: Number, default: null },
      refining_water_m3_per_t_alumina: { type: Number, default: null },
      refining_red_mud_kg_per_t_alumina: { type: Number, default: null },
      refining_caustic_soda_kg_per_t_alumina: { type: Number, default: null },
      refining_lime_kg_per_t_alumina: { type: Number, default: null },
      refining_so2_kg_per_t_alumina: { type: Number, default: null },
      refining_nox_kg_per_t_alumina: { type: Number, default: null },
      refining_dust_kg_per_t_alumina: { type: Number, default: null },
      
      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        renewable_energy_percent: { type: Number, default: null },
        water_recycling_rate: { type: Number, default: null },
        caustic_recovery_rate: { type: Number, default: null },
        red_mud_utilization_percent: { type: Number, default: null },
        emission_control_efficiency: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 4: ALUMINIUM SMELTING (Hall-Héroult Process)
    // ============================================================================
    smelting: {
      applicableProcesses: [{
        type: String,
        enum: ['pre_baking_anodes', 'anode_effect_control', 'electrolysis', 'bath_chemistry', 'off_gas_treatment', 'others']
      }],
      processes: [{
        type: String,
        enum: ['pre_baking_anodes', 'anode_effect_control', 'electrolysis', 'bath_chemistry', 'off_gas_treatment', 'others']
      }],
      others: String,
      processOthers: String,
      variants: [{
        type: String,
        enum: ['pre_baked_cells', 'soderberg_cells', 'inert_anodes_low_carbon', 'dynamic_load', 'renewable_powered', 'others']
      }],
      variantsOthers: String,
      variantOthers: String,
      energySource: {
        type: String,
        enum: ['Coal-based', 'Natural gas', 'Hydropower', 'Renewable (solar/wind)', 'Mixed sources']
      },
      energyDemand: Number, // kWh per tonne
      electricityDemand: Number, // kWh per tonne
      co2Emissions: Number, // kg per tonne
      cellTechnology: {
        type: String,
        enum: ['Pre-baked', 'Soderberg', 'Inert Anode']
      },
      pfcEmissions: Number, // kg per tonne
      so2: Number, // kg per tonne
      nox: Number, // kg per tonne
      fluorideRecoveryEfficiency: Number, // %
      fluorideRecovery: Number, // %
      thermalEnergyRecoveryPotential: Number, // %
      thermalRecovery: Number, // %
      
      // AI Predicted Fields
      smelting_energy_kWh_per_t_al: { type: Number, default: null },
      smelting_energy_MJ_per_t_al: { type: Number, default: null },
      smelting_co2_kg_per_t_al: { type: Number, default: null },
      smelting_pfc_kg_per_t_al: { type: Number, default: null },
      smelting_so2_kg_per_t_al: { type: Number, default: null },
      smelting_nox_kg_per_t_al: { type: Number, default: null },
      smelting_fluoride_recovery_percent: { type: Number, default: null },
      smelting_thermal_recovery_percent: { type: Number, default: null },
      
      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        renewable_energy_percent: { type: Number, default: null },
        inert_anode_technology: { type: Boolean, default: null },
        pfc_capture_rate: { type: Number, default: null },
        thermal_energy_recovery_percent: { type: Number, default: null },
        fluoride_recycling_rate: { type: Number, default: null },
        carbon_capture_rate: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 5: PRODUCT MANUFACTURING (Fabrication & Use Phase)
    // ============================================================================
    manufacturing: {
      applicableProcesses: [{
        type: String,
        enum: ['casting', 'rolling', 'extrusion', 'forging', 'surface_treatment', 'joining', 'design_recycling', 'others']
      }],
      processes: [{
        type: String,
        enum: ['casting', 'rolling', 'extrusion', 'forging', 'surface_treatment', 'joining', 'design_recycling', 'others']
      }],
      others: String,
      processOthers: String,
      casting: [{
        type: String,
        enum: ['ingot', 'billet', 'continuous']
      }],
      castingProcesses: [{
        type: String,
        enum: ['ingot', 'billet', 'continuous']
      }],
      transportDistance: Number, // km
      scrapRate: Number, // %
      recycledContent: Number, // %
      transportMode: {
        type: String,
        enum: ['Road', 'Rail', 'Sea', 'Air', 'Mixed', 'Others']
      },
      transportModeOthers: String,
      transportEmissions: Number, // kg CO₂e per tonne-km
      transportEmissionsPerTkm: Number, // kg CO₂e per tonne-km
      energyUsePerProcessStep: Number, // MJ/t or kWh/t
      energyUsePerStep: Number, // MJ/t or kWh/t
      emissionsFromFabrication: Number, // kg CO₂e per tonne
      fabricationEmissions: Number, // kg CO₂e per tonne
      lightweighting: [{
        type: String,
        enum: ['automotive', 'aerospace', 'construction', 'packaging', 'others']
      }],
      lightweightingSectors: [{
        type: String,
        enum: ['automotive', 'aerospace', 'construction', 'packaging', 'others']
      }],
      lightweightingOthers: String,
      corrosionBehaviorImpact: {
        type: String,
        enum: ['minimal', 'moderate', 'severe', 'others']
      },
      corrosionImpact: {
        type: String,
        enum: ['minimal', 'moderate', 'severe', 'others']
      },
      corrosionBehaviorOthers: String,
      corrosionOthers: String,
      
      // AI Predicted Fields
      manufacturing_energy_MJ_per_t_product: { type: Number, default: null },
      manufacturing_scrap_rate_percent: { type: Number, default: null },
      manufacturing_recycled_content_percent: { type: Number, default: null },
      manufacturing_transport_emissions_kgCO2e_per_t: { type: Number, default: null },
      
      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        renewable_energy_percent: { type: Number, default: null },
        recycled_content_percent: { type: Number, default: null },
        scrap_recovery_rate: { type: Number, default: null },
        low_carbon_transport_percent: { type: Number, default: null },
        design_for_recyclability: { type: Boolean, default: null },
        product_lifetime_years: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 6: RECYCLING (End-of-Life Aluminium)
    // ============================================================================
    recycling: {
      applicableProcesses: [{
        type: String,
        enum: ['collection', 'cleaning', 'sorting', 're_alloying', 'remelting', 'casting_new', 'others']
      }],
      processes: [{
        type: String,
        enum: ['collection', 'cleaning', 'sorting', 're_alloying', 'remelting', 'casting_new', 'others']
      }],
      others: String,
      processOthers: String,
      variants: [{
        type: String,
        enum: ['closed_loop', 'open_loop', 'secondary', 'others']
      }],
      variantsOthers: String,
      variantOthers: String,
      scrapInputPercent: Number, // %
      collectionRatePercent: Number, // %
      recyclingMethods: {
        type: String,
        enum: ['Closed-loop', 'Open-loop', 'Mixed', 'closed-loop', 'open-loop', 'mixed']
      },
      recyclingMethod: {
        type: String,
        enum: ['Closed-loop', 'Open-loop', 'Mixed', 'closed-loop', 'open-loop', 'mixed']
      },
      recoveryYield: Number, // %
      recoveryYieldPercent: Number, // %
      recyclingEfficiencyPercent: Number, // %
      closedLoopPercent: Number, // %
      openLoopPercent: Number, // %
      furnaceEnergyDemand: Number, // kWh or MJ per tonne
      emissionSavings: Number, // kg CO₂e saved per tonne
      sortingMethods: [{
        type: String,
        enum: ['manual_sorting', 'optical_sorting', 'xrf_spectroscopy', 'sensor_based', 'eddy_current', 'others', 'manual', 'optical']
      }],
      sortingOthers: String,
      closedLoopRecyclingPercentage: Number, // %
      openLoopRecyclingPercentage: Number, // %
      
      // AI Predicted Fields
      recycling_scrap_input_percent: { type: Number, default: null },
      recycling_recovery_yield_percent: { type: Number, default: null },
      recycling_energy_kWh_per_t_Al: { type: Number, default: null },
      recycling_emission_savings_kgCO2e_per_t_Al: { type: Number, default: null },
      recycling_collection_rate_percent: { type: Number, default: null },
      recycling_closed_loop_percent: { type: Number, default: null },
      recycling_open_loop_percent: { type: Number, default: null },
      
      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        collection_efficiency_percent: { type: Number, default: null },
        sorting_accuracy_percent: { type: Number, default: null },
        energy_from_renewables_percent: { type: Number, default: null },
        closed_loop_target_percent: { type: Number, default: null },
        contamination_rate_percent: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 7: BYPRODUCT & WASTE VALORIZATION
    // ============================================================================
    valorization: {
      wasteTypes: [{
        type: String,
        enum: ['red_mud', 'spl', 'dross', 'fluoride_gases', 'slag', 'others']
      }],
      wasteTypeOthers: String,
      wasteTypesOthers: String,
      valorizationMethods: [{
        type: String,
        enum: ['cement_additive', 'soil_stabilization', 'iron_extraction', 'rare_earth_extraction', 'spl_encapsulation', 'dross_recovery', 'fluoride_capture', 'others']
      }],
      valorizationMethodsOthers: String,
      methodsOthers: String,
      wasteUtilizationPercentages: Number, // %
      wasteUtilizationOverallPercent: Number, // %
      emissionReductions: Number, // kg CO₂e per tonne
      emissionReductionsPerTonne: Number, // kg CO₂e per tonne
      redMudUtilized: Number, // %
      splUtilized: Number, // %
      drossUtilized: Number, // %
      fluorideUtilized: Number, // %
      slagUtilized: Number, // %
      
      // Economic viability
      ironExtractionEconomicViability: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      rareEarthExtractionEconomicViability: {
        type: String,
        enum: ['Low', 'Moderate', 'High']
      },
      splEncapsulationEconomicViability: {
        type: String,
        enum: ['Low', 'Moderate', 'High']
      },
      drossRecoveryEconomicViability: {
        type: String,
        enum: ['Low', 'Moderate', 'High']
      },
      fluorideCaptureEconomicViability: {
        type: String,
        enum: ['Low', 'Moderate', 'High']
      },
      
      // Recovery efficiencies
      redMudRecovery: Number, // %
      splRecovery: Number, // %
      drossRecovery: Number, // %
      fluorideRecovery: Number, // %
      slagRecovery: Number, // %
      
      // Toxicity levels
      toxicityRedMud: {
        type: String,
        enum: ['low', 'moderate', 'high', 'others']
      },
      toxicitySPL: {
        type: String,
        enum: ['low', 'moderate', 'high', 'others']
      },
      toxicityDross: {
        type: String,
        enum: ['low', 'moderate', 'high', 'others']
      },
      toxicityFluoride: {
        type: String,
        enum: ['low', 'moderate', 'high', 'others']
      },
      toxicitySlag: {
        type: String,
        enum: ['low', 'moderate', 'high', 'others']
      },
      
      // Groundwater risk
      groundwaterRedMud: {
        type: String,
        enum: ['low', 'moderate', 'high', 'others']
      },
      groundwaterSPL: {
        type: String,
        enum: ['low', 'moderate', 'high', 'others']
      },
      groundwaterDross: {
        type: String,
        enum: ['low', 'moderate', 'high', 'others']
      },
      groundwaterFluoride: {
        type: String,
        enum: ['low', 'moderate', 'high', 'others']
      },
      groundwaterSlag: {
        type: String,
        enum: ['low', 'moderate', 'high', 'others']
      },
      
      // Additional economic viability
      econCementAdditive: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      econSoilStabilization: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      econRareEarthExtraction: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      econSPLEncapsulation: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      econDrossRecovery: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      econFluorideCapture: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      
      // Legacy fields
      drossRecoveryEfficiency: Number, // %
      fluorideGasesRecoveryEfficiency: Number, // %
      
      // AI Predicted Fields
      valorization_recovery_efficiency_percent: { type: Number, default: null },
      valorization_emission_reduction_kgCO2e_per_t_waste: { type: Number, default: null },
      
      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        waste_valorization_rate_percent: { type: Number, default: null },
        emission_reduction_per_tonne: { type: Number, default: null },
        circular_economy_integration: { type: Boolean, default: null },
        zero_waste_target_progress_percent: { type: Number, default: null },
        environmental_impact_reduction_percent: { type: Number, default: null }
      }
    },

    // ============================================================================
    // WORKFLOW STATUS
    // ============================================================================
    status: {
      type: String,
      enum: {
        values: ['draft', 'completed', 'submitted', 'archived'],
        message: '{VALUE} is not a valid status'
      },
      default: 'draft'
    },

    isPublic: {
      type: Boolean,
      default: false
    },

    currentStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 6
    },

    completedSteps: [{
      type: Number,
      min: 0,
      max: 6
    }],

    // ============================================================================
    // CALCULATED RESULTS
    // ============================================================================
    calculatedResults: {
      totalGWP: Number, // kg CO₂e
      totalWaterUsage: Number, // m³
      totalWasteGenerated: Number, // kg
      totalEnergyRequired: Number, // kWh
      circularityScore: Number, // 0-100
      environmentalRating: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent']
      },
      calculatedAt: Date
    },

    // Tags
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound index for efficient querying
wizardWorkflowSchema.index({ userId: 1, status: 1, metalType: 1 });
wizardWorkflowSchema.index({ isPublic: 1, status: 1 });
wizardWorkflowSchema.index({ tags: 1 });
wizardWorkflowSchema.index({ createdAt: -1 });

// ============================================================================
// VIRTUALS
// ============================================================================

/**
 * Get completion percentage
 */
wizardWorkflowSchema.virtual('completionPercentage').get(function() {
  if (!this.completedSteps || this.completedSteps.length === 0) return 0;
  const totalSteps = 7;
  return Math.round((this.completedSteps.length / totalSteps) * 100);
});

/**
 * Check if wizard is fully completed
 */
wizardWorkflowSchema.virtual('isCompleted').get(function() {
  if (!this.completedSteps) return false;
  const totalSteps = 7;
  return this.completedSteps.length === totalSteps;
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Pre-save: Auto-generate tags
 */
wizardWorkflowSchema.pre('save', function(next) {
  if (!this.tags) {
    this.tags = [];
  }
  
  // Ensure basic tags exist
  const baseTags = ['wizard', this.metalType.toLowerCase()];
  baseTags.forEach(tag => {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  });
  
  // Add status-based tags
  if (this.isCompleted && !this.tags.includes('completed')) {
    this.tags.push('completed');
  }
  
  next();
});

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Create a new empty wizard workflow
 */
wizardWorkflowSchema.statics.createEmpty = async function(userId, metalType = 'Aluminium', name = null) {
  const workflowName = name || `${metalType} LCA Wizard - ${new Date().toLocaleDateString()}`;
  
  return await this.create({
    name: workflowName,
    userId,
    metalType,
    status: 'draft',
    currentStep: 0,
    completedSteps: [],
    tags: ['wizard', metalType.toLowerCase()]
  });
};

/**
 * Get all workflows by user
 */
wizardWorkflowSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.metalType) {
    query.where('metalType').equals(options.metalType);
  }
  
  return query.sort('-updatedAt').exec();
};

/**
 * Get public workflows
 */
wizardWorkflowSchema.statics.getPublicWorkflows = function(filters = {}) {
  const query = this.find({ isPublic: true, status: 'completed' });
  
  if (filters.metalType) {
    query.where('metalType').equals(filters.metalType);
  }
  
  if (filters.tags) {
    query.where('tags').in(filters.tags);
  }
  
  return query.sort('-createdAt').exec();
};

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Mark a step as completed
 */
wizardWorkflowSchema.methods.markStepCompleted = function(stepNumber) {
  if (!this.completedSteps.includes(stepNumber)) {
    this.completedSteps.push(stepNumber);
    this.completedSteps.sort((a, b) => a - b);
  }
  
  // Update current step to next incomplete step
  for (let i = 0; i <= 6; i++) {
    if (!this.completedSteps.includes(i)) {
      this.currentStep = i;
      return this.save();
    }
  }
  
  // All steps completed
  this.currentStep = 6;
  // this.status = 'completed'; // Removed: Keep as draft even when all steps filled
  return this.save();
};

/**
 * Update a specific step's data
 */
wizardWorkflowSchema.methods.updateStep = function(stepName, data) {
  const validSteps = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];
  
  if (!validSteps.includes(stepName)) {
    throw new Error(`Invalid step name: ${stepName}`);
  }
  
  // Deep merge with existing data to prevent overwrites
  if (this[stepName]) {
    const currentData = this[stepName].toObject ? this[stepName].toObject() : this[stepName];
    this[stepName] = { ...currentData, ...data };
  } else {
    this[stepName] = data;
  }
  
  // Mark the path as modified to ensure Mongoose saves the changes
  this.markModified(stepName);
  
  return this.save();
};

/**
 * Submit workflow for review/calculation
 */
wizardWorkflowSchema.methods.submit = function() {
  if (!this.isCompleted) {
    throw new Error('Cannot submit incomplete workflow. Complete all steps first.');
  }
  
  this.status = 'submitted';
  return this.save();
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

const WizardWorkflow = mongoose.model('WizardWorkflow', wizardWorkflowSchema);

module.exports = WizardWorkflow;
