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
      // Index defined separately below
    },

    metalType: {
      type: String,
      required: [true, 'Metal type is required'],
      enum: {
        values: ['Aluminium', 'Copper', 'Steel', 'Titanium', 'Lithium', 'Nickel', 'Gold', 'Zinc'],
        message: '{VALUE} is not a valid metal type'
      }
      // Index defined separately below
    },

    // ============================================================================
    // STEP 1: MINING (Bauxite Extraction)
    // ============================================================================
    mining: {
      applicableProcesses: [{
        type: String,
        enum: ['openPit', 'strip', 'drilling', 'hydraulic', 'manual', 'electricShovel', 'dieselHaul', 'inSitu', 'others']
      }],
      others: String, // Custom process if 'others' selected
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
      waterUsage: Number, // m³ per tonne (matching frontend field name)
      waterConsumption: Number, // m³ per tonne (kept for backward compatibility)
      blastingFrequency: {
        type: String,
        enum: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly']
      },
      explosivesUsed: Number, // kg per blast
      redMudGeneration: Number, // kg per tonne (frontend field)
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
        distance: Number, // km to processing facility
        mode: {
          type: String,
          enum: ['Road', 'Rail', 'Conveyor', 'Pipeline']
        },
        vehicleType: {
          type: String,
          enum: ['Diesel trucks', 'Electric vehicles', 'Rail cars']
        }
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
      oreFeedRate: Number, // tonnes per hour (frontend field name)
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
      tailings: String, // frontend field for waste management selection
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
      variants: [String], // Added for enhancements
      variantOthers: String,
      location: String,
      energyUse: Number, // kWh or MJ per tonne
      waterUse: Number, // m³ per tonne
      redMudGeneration: Number, // kg per tonne (original)
      redMudGen: Number, // kg per tonne (frontend field name)
      causticSoda: Number, // kg/t
      limeOtherAdditives: Number, // kg/t
      limeAdditives: Number, // kg/t (frontend field name)
      so2Emissions: Number, // kg per tonne (original)
      so2: Number, // kg per tonne (frontend field name)
      noxEmissions: Number, // kg per tonne (original)
      nox: Number, // kg per tonne (frontend field name)
      dustEmissions: Number, // kg per tonne (original)
      dust: Number, // kg per tonne (frontend field name)
      redMudToxicityLevel: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Others']
      },
      toxicity: String, // frontend field name
      redMudToxicityOthers: String,
      toxicityOthers: String,
      wasteTailingsManagement: {
        type: String,
        enum: ['Stored in tailing ponds', 'Pipeline transport to disposal site']
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
      energyDemand: Number, // kWh per tonne (original)
      electricityDemand: Number, // kWh per tonne (frontend field name)
      co2Emissions: Number, // kg per tonne (frontend field)
      cellTechnology: {
        type: String,
        enum: ['Pre-baked', 'Soderberg', 'Inert Anode']
      },
      pfcEmissions: Number, // kg per tonne (frontend field)
      so2: Number, // kg per tonne (frontend field)
      nox: Number, // kg per tonne (frontend field)
      fluorideRecoveryEfficiency: Number, // % (original)
      fluorideRecovery: Number, // % (frontend field name)
      thermalEnergyRecoveryPotential: Number, // % of total energy (original)
      thermalRecovery: Number // % of total energy (frontend field name)
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
      scrapRate: Number, // % of material lost
      recycledContent: Number, // % proportion of secondary vs primary
      transportMode: {
        type: String,
        enum: ['Road', 'Rail', 'Sea', 'Air', 'Mixed', 'Others']
      },
      transportModeOthers: String,
      transportEmissions: Number, // kg CO₂e per tonne-km (original)
      transportEmissionsPerTkm: Number, // kg CO₂e per tonne-km (frontend field name)
      energyUsePerProcessStep: Number, // MJ/t or kWh/t (original)
      energyUsePerStep: Number, // MJ/t or kWh/t (frontend field name)
      emissionsFromFabrication: Number, // kg CO₂e per tonne (original)
      fabricationEmissions: Number, // kg CO₂e per tonne (frontend field name)
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
      corrosionOthers: String
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
      scrapInputPercentage: Number, // % of total feedstock (original)
      scrapInputPercent: Number, // % of total feedstock (frontend field name)
      collectionRate: Number, // % of available scrap collected (original)
      collectionRatePercent: Number, // % of available scrap collected (frontend field name)
      recyclingMethods: {
        type: String,
        enum: ['Closed-loop', 'Open-loop', 'Mixed', 'closed-loop', 'open-loop', 'mixed']
      },
      recyclingMethod: {
        type: String,
        enum: ['Closed-loop', 'Open-loop', 'Mixed', 'closed-loop', 'open-loop', 'mixed']
      },
      recoveryYield: Number, // % of aluminium recovered (original)
      recoveryYieldPercent: Number, // % of aluminium recovered (frontend field name)
      recyclingEfficiencyPercent: Number, // % efficiency (frontend field)
      closedLoopPercent: Number, // % closed-loop recycling (frontend field)
      openLoopPercent: Number, // % open-loop recycling (frontend field)
      furnaceEnergyDemand: Number, // kWh or MJ per tonne recycled
      emissionSavings: Number, // kg CO₂e saved per tonne vs primary
      sortingMethods: [{
        type: String,
        enum: ['manual_sorting', 'optical_sorting', 'xrf_spectroscopy', 'sensor_based', 'eddy_current', 'others', 'manual', 'optical']
      }],
      sortingOthers: String,
      closedLoopRecyclingPercentage: Number, // %
      openLoopRecyclingPercentage: Number // %
    },

    // ============================================================================
    // STEP 7: BYPRODUCT & WASTE VALORIZATION
    // ============================================================================
    valorization: {
      wasteTypes: [{
        type: String,
        enum: ['Red Mud', 'SPL', 'Dross', 'Fluoride Gases', 'Slag', 'Others', 'red_mud', 'spl', 'dross', 'fluoride_gases', 'slag', 'others']
      }],
      wasteTypeOthers: String,
      wasteTypesOthers: String,
      valorizationMethods: [{
        type: String,
        enum: ['Cement additive', 'Soil stabilization', 'Iron extraction', 'Rare earth extraction', 'SPL encapsulation', 'Dross recovery', 'Fluoride capture', 'Others', 'cement_additive', 'soil_stabilization', 'iron_extraction', 'rare_earth_extraction', 'spl_encapsulation', 'dross_recovery', 'fluoride_capture', 'others']
      }],
      valorizationMethodsOthers: String,
      methodsOthers: String,
      wasteUtilizationPercentages: Number, // overall % of waste successfully utilized
      wasteUtilizationOverallPercent: Number, // frontend field name
      emissionReductions: Number, // kg CO₂e per tonne of waste used (original)
      emissionReductionsPerTonne: Number, // kg CO₂e per tonne of waste used (frontend field name)
      redMudWasteUtilized: Number, // % (original)
      redMudUtilized: Number, // % (frontend field name)
      splWasteUtilized: Number, // % (original)
      splUtilized: Number, // % (frontend field name)
      drossWasteUtilized: Number, // % (original)
      drossUtilized: Number, // % (frontend field name)
      fluorideGasesWasteUtilized: Number, // %
      slagWasteUtilized: Number, // %
      // Economic viability for each method
      ironExtractionEconomicViability: {
        type: String,
        enum: ['Low', 'Moderate', 'High']
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
      drossRecoveryEfficiency: Number, // %
      fluorideGasesRecoveryEfficiency: Number // %
    },

    // ============================================================================
    // Workflow Status
    // ============================================================================
    status: {
      type: String,
      enum: {
        values: ['draft', 'completed', 'submitted', 'archived'],
        message: '{VALUE} is not a valid status'
      },
      default: 'draft'
      // Index defined separately below
    },

    isPublic: {
      type: Boolean,
      default: false
      // Index defined separately below
    },

    // Current step (0-6 for 7 steps)
    currentStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 6
    },

    // Track which steps are completed
    completedSteps: [{
      type: Number,
      min: 0,
      max: 6
    }],

    // ============================================================================
    // Calculated Results (Optional - can be calculated later)
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

    // Tags for search and filtering
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],

    // Additional metadata
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
  return Math.round((this.completedSteps.length / 7) * 100);
});

/**
 * Check if wizard is fully completed
 */
wizardWorkflowSchema.virtual('isCompleted').get(function() {
  return this.completedSteps && this.completedSteps.length === 7;
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
  this.status = 'completed';
  return this.save();
};

/**
 * Update a specific step's data
 */
wizardWorkflowSchema.methods.updateStep = function(stepName, data) {
  if (!this[stepName]) {
    throw new Error(`Invalid step name: ${stepName}`);
  }
  
  this[stepName] = { ...this[stepName].toObject(), ...data };
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
// MODEL EXPORT
// ============================================================================

const WizardWorkflow = mongoose.model('WizardWorkflow', wizardWorkflowSchema);

module.exports = WizardWorkflow;
