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
      equipmentType: {
        type: String,
        enum: ['Diesel', 'Electric', 'Hybrid']
      },
      fuelConsumption: Number, // liters or kWh per tonne
      waterSource: {
        type: String,
        enum: ['Surface water', 'Groundwater', 'Recycled water', 'Mixed sources']
      },
      waterConsumption: Number, // m³ per tonne
      blastingFrequency: {
        type: String,
        enum: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly']
      },
      explosivesUsed: Number, // kg per blast
      biodiversityImpact: {
        type: String,
        enum: ['Minimal', 'Moderate', 'High', 'Severe']
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
        enum: ['Crushing', 'Washing & Screening', 'Grinding', 'Magnetic Separation', 'Flotation Methods', 'Dry Separation', 'Others']
      }],
      others: String,
      location: String,
      feedRate: Number, // tonnes per hour
      waterConsumption: Number, // m³ per tonne
      electricityUse: Number, // kWh per tonne
      beneficiationEfficiency: Number, // % recovery
      crushing: [{
        type: String,
        enum: ['Primary Crushing', 'Secondary Crushing', 'Tertiary Crushing']
      }],
      chemicalAgents: [{
        type: String,
        enum: ['Flocculants', 'Dispersants', 'Others']
      }],
      chemicalOthers: String,
      wasteTailingsSlurry: {
        stored: {
          type: String,
          enum: ['Stored in tailing ponds', 'Pipeline transport to disposal site']
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
        enum: ['Crushing', 'Digestion (caustic soda process)', 'Clarification (separating alumina liquor from red mud)', 'Precipitation (alumina hydrate recovery)', 'Calcination (removal of water to produce alumina powder)', 'Others']
      }],
      others: String,
      location: String,
      energyUse: Number, // kWh or MJ per tonne
      waterUse: Number, // m³ per tonne
      redMudGeneration: Number, // kg per tonne
      causticSoda: Number, // kg/t
      limeOtherAdditives: Number, // kg/t
      so2Emissions: Number, // kg per tonne
      noxEmissions: Number, // kg per tonne
      dustEmissions: Number, // kg per tonne
      redMudToxicityLevel: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Others']
      },
      redMudToxicityOthers: String,
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
        enum: ['Pre-baking anodes (heat treatment)', 'Anode effect control (stability maintenance)', 'Electrolysis (cell operation)', 'Bath chemistry management (fluoride & alumina concentration)', 'Off-gas treatment (scrubber systems)', 'Others']
      }],
      others: String,
      variants: [{
        type: String,
        enum: ['Pre-baked anode cells (standard technology)', 'Soderberg cells (more polluting)', 'Low-carbon inert anodes (experimental, reduce CO₂ footprint)', 'Dynamic load management (shift operations to clean energy periods)', 'Renewable-powered smelters (intermittent optimization possible)', 'Others']
      }],
      variantsOthers: String,
      energySource: {
        type: String,
        enum: ['Coal-based', 'Natural gas', 'Hydropower', 'Renewable (solar/wind)', 'Mixed sources']
      },
      energyDemand: Number, // kWh per tonne
      fluorideRecoveryEfficiency: Number, // %
      thermalEnergyRecoveryPotential: Number // % of total energy
    },

    // ============================================================================
    // STEP 5: PRODUCT MANUFACTURING (Fabrication & Use Phase)
    // ============================================================================
    manufacturing: {
      applicableProcesses: [{
        type: String,
        enum: ['Casting (ingots, billets – high-temperature energy)', 'Rolling (sheet metal – mechanical deformation)', 'Extrusion (tubes, profiles – efficient shaping)', 'Forging (metal strengthening, scrap generation)', 'Surface Treatment (anodizing, coating – chemical & energy use)', 'Joining Processes (welding, mechanical fastening – emissions, waste)', 'Design for Recycling (optimized alloys, less contamination)', 'Others']
      }],
      others: String,
      casting: [{
        type: String,
        enum: ['Ingot Casting', 'Billet Casting', 'Continuous Casting']
      }],
      transportDistance: Number, // km
      scrapRate: Number, // % of material lost
      recycledContent: Number, // % proportion of secondary vs primary
      transportMode: {
        type: String,
        enum: ['Road', 'Rail', 'Sea', 'Air', 'Mixed', 'Others']
      },
      transportModeOthers: String,
      transportEmissions: Number, // kg CO₂e per tonne-km
      energyUsePerProcessStep: Number, // MJ/t or kWh/t
      emissionsFromFabrication: Number, // kg CO₂e per tonne
      lightweighting: [{
        type: String,
        enum: ['Automotive', 'Aerospace', 'Construction', 'Packaging', 'Others']
      }],
      lightweightingOthers: String,
      corrosionBehaviorImpact: {
        type: String,
        enum: ['Minimal (long lifespan, low maintenance)', 'Moderate (occasional maintenance)', 'Severe (frequent maintenance, repairs)', 'Others']
      },
      corrosionBehaviorOthers: String
    },

    // ============================================================================
    // STEP 6: RECYCLING (End-of-Life Aluminium)
    // ============================================================================
    recycling: {
      applicableProcesses: [{
        type: String,
        enum: ['Collection (scrap gathering – manual or automated)', 'Cleaning (removal of coatings, oils)', 'Sorting', 'Re-alloying (composition adjustment)', 'Remelting (furnace heating – energy intensive)', 'Casting into new products (e.g., cans, construction materials)', 'Others']
      }],
      others: String,
      variants: [{
        type: String,
        enum: ['Closed-loop recycling (same product, high purity, lower emissions)', 'Open-loop recycling (different products, potential contamination)', 'Secondary aluminium production (5–10% of primary energy use)', 'Others']
      }],
      variantsOthers: String,
      scrapInputPercentage: Number, // % of total feedstock
      collectionRate: Number, // % of available scrap collected
      recyclingMethods: {
        type: String,
        enum: ['Closed-loop', 'Open-loop', 'Mixed']
      },
      recoveryYield: Number, // % of aluminium recovered
      furnaceEnergyDemand: Number, // kWh or MJ per tonne recycled
      emissionSavings: Number, // kg CO₂e avoided per tonne recycled
      sortingMethods: [{
        type: String,
        enum: ['Manual sorting (labor-intensive, prone to misclassification)', 'Optical sorting (computer vision + ML, accurate alloy separation)', 'Others']
      }],
      sortingMethodsOthers: String,
      closedLoopRecyclingPercentage: Number, // % of recycled material reused in same product
      openLoopRecyclingPercentage: Number // % of recycled material reused in other products
    },

    // ============================================================================
    // STEP 7: BYPRODUCT & WASTE VALORIZATION
    // ============================================================================
    valorization: {
      wasteTypes: [{
        type: String,
        enum: ['Red Mud', 'SPL', 'Dross', 'Fluoride Gases', 'Slag', 'Others']
      }],
      wasteTypesOthers: String,
      valorizationMethods: [{
        type: String,
        enum: ['Cement additive', 'Soil stabilization', 'Iron extraction', 'Rare earth extraction', 'SPL encapsulation', 'Dross recovery', 'Fluoride capture', 'Others']
      }],
      valorizationMethodsOthers: String,
      wasteUtilizationPercentages: Number, // overall % of waste successfully utilized
      redMudWasteUtilized: Number, // %
      splWasteUtilized: Number, // %
      drossWasteUtilized: Number, // %
      fluorideGasesWasteUtilized: Number, // %
      slagWasteUtilized: Number, // %
      emissionReductions: Number, // kg CO₂e per tonne of waste used
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
      cementAdditiveEconomicViability: {
        type: String,
        enum: ['Low', 'Moderate', 'High']
      },
      soilStabilizationEconomicViability: {
        type: String,
        enum: ['Low', 'Moderate', 'High']
      },
      // Recovery efficiency for each waste type
      splRecoveryEfficiency: Number, // %
      drossRecoveryEfficiency: Number, // %
      fluorideGasesRecoveryEfficiency: Number, // %
      slagRecoveryEfficiency: Number, // %
      // Groundwater risk assessment
      redMudGroundwaterRisk: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Others']
      },
      redMudGroundwaterRiskOthers: String,
      splGroundwaterRisk: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Others']
      },
      splGroundwaterRiskOthers: String,
      drossGroundwaterRisk: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Others']
      },
      drossGroundwaterRiskOthers: String,
      fluorideGasesGroundwaterRisk: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Others']
      },
      fluorideGasesGroundwaterRiskOthers: String,
      // Toxicity levels
      redMudToxicityLevel: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Others']
      },
      redMudToxicityLevelOthers: String,
      splToxicityLevel: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Others']
      },
      splToxicityLevelOthers: String,
      drossToxicityLevel: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Others']
      },
      drossToxicityLevelOthers: String
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
