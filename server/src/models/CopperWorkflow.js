/**
 * Copper Workflow Model
 * 
 * Represents a completed wizard form submission for Copper LCA data collection.
 * Stores comprehensive data across 7 stages: mining, beneficiation, refining,
 * manufacturing, usePhase, recycling, and valorization.
 * 
 * @module models/CopperWorkflow
 */

const mongoose = require('mongoose');

/**
 * Copper Workflow Schema
 * 
 * Stores detailed form data from the multi-step wizard interface for Copper
 */
const copperWorkflowSchema = new mongoose.Schema(
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
      default: 'Copper',
      enum: {
        values: ['Copper'],
        message: 'This schema only supports Copper'
      }
    },

    // ============================================================================
    // STEP 1: COPPER MINING
    // ============================================================================
    copperMining: {
      // Geology & Site Fundamentals
      miningMethod: {
        type: String,
        enum: ['open-pit', 'underground', 'ISL', 'solution extraction']
      },
      oreType: {
        type: String,
        enum: ['oxide', 'sulfide']
      },
      oreGradePercentCu: Number, // % Cu
      region: String,
      depositDepth: Number, // meters
      benchHeight: Number, // meters
      rockHardnessIndex: Number,

      // Material Ratios
      overburdenWasteRatio: Number, // m³/t
      strippingRatio: Number, // t waste / t ore
      tailingsGenerationRate: Number, // t/t Cu

      // Production & Operations
      mineProductionPerDay: Number, // t/day
      averageHaulDistance: Number, // km
      mineLifetimeYears: Number,
      oreThroughputPerYear: Number, // t/year
      shiftHoursPerDay: Number,
      equipmentAvailabilityPercent: Number, // %

      // Equipment & Energy
      equipmentType: {
        type: String,
        enum: ['diesel', 'electric', 'hybrid']
      },
      equipmentCount: Number,
      equipmentCapacity: Number, // tonnes
      explosivesUsed: Number, // kg/t ore
      fuelConsumption: Number, // L/t ore
      electricityConsumption: Number, // kWh/t ore
      powerSourceMixRenewable: Number, // %
      powerSourceMixFossil: Number, // %
      powerSourceMixGrid: Number, // %
      energyEfficiency: Number, // % of machines

      // Water & Environmental Management
      waterConsumption: Number, // m³/t ore
      waterSource: {
        type: String,
        enum: ['ground', 'recycled', 'surface']
      },
      waterReuseRate: Number, // %
      waterDischargePh: Number,
      acidMineDrainageRisk: {
        type: String,
        enum: ['low', 'medium', 'high']
      },

      // Emissions & Land Impact
      directGhgEmissions: Number, // kg CO₂e/t ore
      dustEmissions: Number, // kg PM10/t ore
      noiseLevel: Number, // dB
      landDisturbed: Number, // m²/t ore
      rehabilitationArea: Number, // ha/year
      biodiversityImpact: Number, // score

      // Economic & Advanced
      oreRecovery: Number, // %
      oreLoss: Number, // %
      miningCost: Number, // USD/t ore
      dieselPrice: Number, // USD/L
      electricityCost: Number, // USD/kWh

      // AI Predicted Fields
      mining_energy_MJ_per_t_ore: { type: Number, default: null },
      mining_co2_kg_per_t_ore: { type: Number, default: null },
      mining_water_m3_per_t_ore: { type: Number, default: null },
      mining_waste_kg_per_t_ore: { type: Number, default: null },

      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        rehabilitationPlanActive: { type: Boolean, default: null },
        overburdenRestoredPercent: { type: Number, default: null },
        waterReuseRate: { type: Number, default: null },
        biodiversityProtectionScore: {
          type: String,
          enum: ['Low', 'Moderate', 'High'],
          default: null
        },
        dustSuppression: {
          type: String,
          enum: ['Basic', 'Advanced', 'Smart AI-Atomization'],
          default: null
        }
      }
    },

    // ============================================================================
    // STEP 2: COPPER BENEFICIATION
    // ============================================================================
    copperBeneficiation: {
      // Ore Characteristics
      oreType: {
        type: String,
        enum: ['oxide', 'sulfide']
      },
      oreGradePercentCu: Number, // % Cu in feed
      concentrateGradePercentCu: Number, // % Cu in concentrate
      mineralogyDetails: {
        type: String,
        enum: ['chalcopyrite', 'bornite', 'malachite', 'azurite', 'chalcocite', 'other']
      },
      mineralogyDetailsOther: String,
      particleSizeAfterGrinding: Number, // micrometers
      moistureContentPercent: Number, // %

      // Processing Parameters
      grindingEnergyKwhPerTonne: Number, // kWh/t
      reagentConsumptionKgPerTonne: Number, // kg/t
      reagentType: {
        type: String,
        enum: ['collector', 'frother', 'modifier']
      },
      reagentMixRatioPercent: Number, // %
      flotationCellType: {
        type: String,
        enum: ['mechanical', 'column', 'pneumatic']
      },
      thickenerEfficiencyPercent: Number, // %
      filtrationType: {
        type: String,
        enum: ['vacuum', 'pressure']
      },

      // Equipment & Operations
      equipmentAgeYears: Number,
      millLoadingPercent: Number, // %
      waterConsumptionM3PerTonne: Number, // m³/t
      waterRecycledPercent: Number, // %
      waterSource: {
        type: String,
        enum: ['ground', 'recycled', 'surface']
      },
      processWaterTemperature: Number, // °C
      slurryPumpingDistanceKm: Number, // km

      // Recovery & Efficiency
      recoveryEfficiencyPercent: Number, // %
      tailingsProducedTonnePerTonne: Number, // t/t
      tailingsSolidsContentPercent: Number, // %
      tailingsStorageType: {
        type: String,
        enum: ['wet', 'dry', 'paste']
      },

      // Environmental Impact
      chemicalResidueInTailingsMgPerL: Number, // mg/L
      airEmissionsPmKgPerTonne: Number, // kg PM/t
      wastewaterPh: Number,
      wastewaterCodMgPerL: Number, // mg/L COD
      ghgEmissionsKgCo2ePerTonne: Number, // kg CO₂e/t

      // Economics & Operations
      plantCapacityTPerDay: Number, // t/day
      operatingHoursPerDay: Number,
      powerCostUsdPerKwh: Number, // USD/kWh
      reagentCostUsdPerKg: Number, // USD/kg
      maintenanceCostUsdPerTonne: Number, // USD/t

      // AI Predicted Fields
      beneficiation_energy_kWh_per_t: { type: Number, default: null },
      beneficiation_water_m3_per_t: { type: Number, default: null },
      beneficiation_recovery_percent: { type: Number, default: null },
      beneficiation_tailings_t_per_t: { type: Number, default: null },

      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        bioBasedReagents: { type: Boolean, default: null },
        zeroLiquidDischargeEnabled: { type: Boolean, default: null },
        tailingsDewateringMethod: {
          type: String,
          enum: ['Conventional', 'Thickened', 'Dry Stack'],
          default: null
        },
        waterTreatment: {
          type: String,
          enum: ['Basic', 'Advanced', 'Hybrid AI-Controlled'],
          default: null
        },
        tailingsReusePotentialPercent: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 3: COPPER REFINING
    // ============================================================================
    copperRefining: {
      // Process Configuration
      refiningMethod: {
        type: String,
        enum: ['electrorefining', 'electrowinning', 'fire_refining', 'combined']
      },
      anodeGradePercentCu: Number, // % Cu in anode
      cathodeGradePercentCu: Number, // % Cu in cathode
      refineryCapacityTonnesPerYear: Number, // t/year
      cellVoltage: Number, // volts
      currentDensityAmpPerM2: Number, // A/m²

      // Electrolyte & Chemistry
      electrolyteComposition: String,
      sulfuricAcidConcentrationGPerL: Number, // g/L H₂SO₄
      copperConcentrationGPerL: Number, // g/L Cu²⁺
      electrolyteTemperatureCelsius: Number, // °C
      additiveConsumptionKgPerTonne: Number, // kg/t Cu

      // Energy & Efficiency
      electricityConsumptionKwhPerTonne: Number, // kWh/t Cu
      currentEfficiencyPercent: Number, // %
      cathodeRecoveryYieldPercent: Number, // %
      cycleTimeHours: Number, // hours

      // Environmental & Waste
      anodeSlimesKgPerTonne: Number, // kg/t Cu
      preciousMetalsInSlimesPercent: Number, // %
      electrolytePurgeWaterM3PerTonne: Number, // m³/t Cu
      wastewaterTreatmentType: {
        type: String,
        enum: ['precipitation', 'ion_exchange', 'membrane', 'none']
      },
      particulateEmissionsKgPerTonne: Number, // kg PM/t Cu
      acidMistEmissionsKgPerTonne: Number, // kg H₂SO₄ mist/t Cu

      // Operations & Economics
      cellHouseUtilizationPercent: Number, // %
      anodeLifetimeCycles: Number,
      cathodeQualityGrade: {
        type: String,
        enum: ['Grade_A', 'Grade_B', 'off_spec']
      },
      refiningCostUsdPerTonne: Number, // USD/t Cu
      electricityCostUsdPerKwh: Number, // USD/kWh
      laborCostUsdPerTonne: Number, // USD/t Cu

      // By-products
      goldRecoveryKgPerTonne: Number, // kg Au/t Cu
      silverRecoveryKgPerTonne: Number, // kg Ag/t Cu
      seleniumRecoveryKgPerTonne: Number, // kg Se/t Cu
      telluriumRecoveryKgPerTonne: Number, // kg Te/t Cu
      byproductRevenueUsdPerTonne: Number, // USD/t Cu

      // AI Predicted Fields
      refining_energy_kWh_per_t_Cu: { type: Number, default: null },
      refining_cathode_purity_percent: { type: Number, default: null },
      refining_precious_metals_recovery_percent: { type: Number, default: null },
      refining_wastewater_m3_per_t_Cu: { type: Number, default: null },

      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        // Pyrometallurgical Route
        pyro_renewablePowerPercent: { type: Number, default: null },
        pyro_slagRecyclingRate: { type: Number, default: null },
        pyro_so2CaptureIntoSulfuricAcid: { type: Boolean, default: null },
        pyro_flueGasCleaning: {
          type: String,
          enum: ['Basic', 'Baghouse', 'Wet Scrubber', 'Advanced Hybrid'],
          default: null
        },
        pyro_wasteHeatCapturePercent: { type: Number, default: null },
        
        // Hydrometallurgical Route
        hydro_acidRecoveryPercent: { type: Number, default: null },
        hydro_organicSolventRecovery: { type: Number, default: null },
        hydro_renewableElectricityUseInElectrowinning: { type: Number, default: null },
        hydro_recycledWaterRate: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 4: COPPER MANUFACTURING
    // ============================================================================
    copperManufacturing: {
      // Product Type & Process
      productCategory: {
        type: String,
        enum: ['wire_rod', 'tube_pipe', 'sheet_plate', 'alloy', 'powder', 'semi_finished', 'other']
      },
      productCategoryOther: String,
      manufacturingProcesses: [{
        type: String,
        enum: ['casting', 'rolling', 'extrusion', 'drawing', 'forging', 'powder_metallurgy', 'machining']
      }],
      alloying: {
        type: Boolean,
        default: false
      },
      alloyType: {
        type: String,
        enum: ['brass', 'bronze', 'cupronickel', 'beryllium_copper', 'pure_copper', 'other']
      },
      alloyTypeOther: String,

      // Energy & Processing
      meltingEnergyKwhPerTonne: Number, // kWh/t
      rollingEnergyKwhPerTonne: Number, // kWh/t
      drawingEnergyKwhPerTonne: Number, // kWh/t
      annealingEnergyKwhPerTonne: Number, // kWh/t
      totalEnergyKwhPerTonne: Number, // kWh/t
      fuelType: {
        type: String,
        enum: ['electric', 'natural_gas', 'oil', 'mixed']
      },

      // Material Efficiency
      yieldPercent: Number, // %
      scrapGenerationPercent: Number, // %
      scrapRecyclingRatePercent: Number, // %
      secondaryCopperContentPercent: Number, // %

      // Surface Treatment & Finishing
      surfaceTreatment: [{
        type: String,
        enum: ['polishing', 'coating', 'plating', 'oxidation', 'none']
      }],
      chemicalConsumptionKgPerTonne: Number, // kg/t
      waterConsumptionM3PerTonne: Number, // m³/t

      // Emissions & Environmental
      co2EmissionsKgPerTonne: Number, // kg CO₂/t
      vocEmissionsKgPerTonne: Number, // kg VOC/t
      wastewaterM3PerTonne: Number, // m³/t
      solidWasteKgPerTonne: Number, // kg/t

      // Transport & Distribution
      transportDistanceKm: Number, // km
      transportMode: {
        type: String,
        enum: ['truck', 'rail', 'ship', 'mixed']
      },
      packagingMaterialKgPerTonne: Number, // kg/t

      // Operations & Economics
      plantCapacityTonnesPerYear: Number, // t/year
      utilizationPercent: Number, // %
      manufacturingCostUsdPerTonne: Number, // USD/t
      laborCostUsdPerTonne: Number, // USD/t
      maintenanceCostPercent: Number, // %

      // AI Predicted Fields
      manufacturing_energy_kWh_per_t: { type: Number, default: null },
      manufacturing_yield_percent: { type: Number, default: null },
      manufacturing_co2_kg_per_t: { type: Number, default: null },
      manufacturing_scrap_recovery_percent: { type: Number, default: null },

      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        designForRecycling: { type: Boolean, default: null },
        surfaceTreatmentType: {
          type: String,
          enum: ['Low-chemical', 'Water-based'],
          default: null
        },
        wasteHeatRecoveryPercent: { type: Number, default: null },
        renewableEnergySharePercent: { type: Number, default: null },
        productLifetimeExtensionYears: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 5: COPPER USE PHASE
    // ============================================================================
    copperUsePhase: {
      // Product & Application Data
      productType: {
        type: String,
        enum: ['wire', 'motor', 'component', 'tube', 'other']
      },
      applicationSector: {
        type: String,
        enum: ['electrical', 'construction', 'transport', 'others']
      },
      productLifetimeYears: Number,
      installationMethod: {
        type: String,
        enum: ['permanent', 'temporary']
      },
      serviceWeight: Number, // kg
      operatingTemperature: Number, // °C
      environmentType: {
        type: String,
        enum: ['indoor', 'outdoor', 'marine', 'industrial']
      },

      // Performance & Efficiency
      efficiencyRating: Number, // %
      energySavingsPercent: Number, // %
      averageAnnualEnergy: Number, // kWh/year
      copperLossDuringUse: Number, // %
      operatingHoursPerYear: Number,
      failureRatePercent: Number, // %
      replacementCycleYears: Number,

      // Maintenance & Resource Use
      maintenanceFrequency: Number, // times/year
      maintenanceMaterialUse: Number, // kg/year
      lubricantUseLiters: Number, // L/year
      downtimeHoursPerYear: Number,

      // Transport & Installation
      transportationDistance: Number, // km
      transportationMode: {
        type: String,
        enum: ['truck', 'rail', 'ship', 'air']
      },
      packagingMaterialPerUnit: Number, // kg

      // Environmental Impacts / Benefits
      ghgAvoidedPerUnit: Number, // kg CO₂e
      reusePotentialPercent: Number, // %
      energyReturnOnInvestment: Number,
      usePhaseWaterConsumption: Number, // m³/year

      // AI Predicted Fields
      usePhase_efficiency_percent: { type: Number, default: null },
      usePhase_lifetime_years: { type: Number, default: null },
      usePhase_ghg_avoided_kg: { type: Number, default: null },
      usePhase_energy_savings_percent: { type: Number, default: null },

      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        lifetimeExtensionYears: { type: Number, default: null },
        reusePotentialPercent: { type: Number, default: null },
        reducedMaintenanceMaterialsPercent: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 6: COPPER RECYCLING
    // ============================================================================
    copperRecycling: {
      // Collection & Source
      scrapSource: [{
        type: String,
        enum: ['industrial', 'construction', 'electronics', 'automotive', 'wire_cable', 'household', 'other']
      }],
      scrapSourceOther: String,
      collectionRatePercent: Number, // %
      scrapGrade: {
        type: String,
        enum: ['No1_copper', 'No2_copper', 'mixed', 'low_grade']
      },
      copperContentPercent: Number, // %

      // Sorting & Preparation
      sortingMethod: [{
        type: String,
        enum: ['manual', 'magnetic', 'eddy_current', 'density', 'optical', 'xrf']
      }],
      sortingEfficiencyPercent: Number, // %
      contaminationLevelPercent: Number, // %
      preTreatmentRequired: {
        type: Boolean,
        default: false
      },
      preTreatmentType: [{
        type: String,
        enum: ['shredding', 'burning_insulation', 'chemical_stripping', 'dismantling']
      }],

      // Reprocessing
      recyclingMethod: {
        type: String,
        enum: ['direct_melting', 'pyrometallurgy', 'hydrometallurgy', 'electrorefining']
      },
      meltingEnergyKwhPerTonne: Number, // kWh/t
      fuelConsumptionGjPerTonne: Number, // GJ/t
      fluxConsumptionKgPerTonne: Number, // kg/t
      recoveryYieldPercent: Number, // %

      // Product & Quality
      outputQuality: {
        type: String,
        enum: ['cathode_grade', 'alloy_grade', 'ingot', 'granules']
      },
      copperPurityPercent: Number, // %
      alloyingRequired: {
        type: Boolean,
        default: false
      },

      // Environmental Impact
      energySavingsVsPrimaryPercent: Number, // %
      co2SavedKgPerTonne: Number, // kg CO₂/t
      waterConsumptionM3PerTonne: Number, // m³/t
      drossGenerationKgPerTonne: Number, // kg/t
      emissionsKgCo2ePerTonne: Number, // kg CO₂e/t

      // Economics
      scrapPurchaseCostUsdPerTonne: Number, // USD/t
      processingCostUsdPerTonne: Number, // USD/t
      outputValueUsdPerTonne: Number, // USD/t
      profitMarginPercent: Number, // %

      // Circularity Metrics
      closedLoopPercent: Number, // %
      openLoopPercent: Number, // %
      downcyclingPercent: Number, // %
      landfillDiversionPercent: Number, // %

      // AI Predicted Fields
      recycling_energy_kWh_per_t: { type: Number, default: null },
      recycling_recovery_yield_percent: { type: Number, default: null },
      recycling_co2_savings_kg_per_t: { type: Number, default: null },
      recycling_collection_rate_percent: { type: Number, default: null },

      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        advancedCleaningSystems: { type: Boolean, default: null },
        alloySortingCapability: {
          type: String,
          enum: ['Basic', 'Advanced', 'Precision'],
          default: null
        },
        renewableEnergySharePercent: { type: Number, default: null },
        slagRecycledPercent: { type: Number, default: null }
      }
    },

    // ============================================================================
    // STEP 7: COPPER VALORIZATION
    // ============================================================================
    copperValorization: {
      // Waste and By-Product Characteristics
      wasteType: {
        type: String,
        enum: ['slag', 'tailings', 'dust', 'acidic_effluent', 'other']
      },
      wasteGeneration: Number, // kg/t Cu
      metalContentInWaste: Number, // %
      chemicalCompositionFeO: Number, // %
      chemicalCompositionSiO2: Number, // %
      chemicalCompositionCuO: Number, // %
      moistureContent: Number, // %

      // Valorization / Treatment Process
      valorizationMethod: {
        type: String,
        enum: ['reuse', 'recycle', 'neutralize', 'dispose', 'other']
      },
      valorizationRate: Number, // %
      metalRecoveryRate: Number, // %
      sulfurCaptureEfficiency: Number, // %
      furnaceGasSO2Concentration: Number, // ppm
      acidPlantCapacity: Number, // t H₂SO₄/day
      energyForValorization: Number, // kWh/t waste
      waterUsedInTreatment: Number, // m³/t waste

      // Outputs and Residuals
      residueAfterTreatment: Number, // kg/t waste
      leachateToxicityIndex: Number,
      heavyMetalResidue: Number, // mg/kg
      slagReuseAsConstruction: Number, // %
      acidProduced: Number, // kg H₂SO₄/t waste
      ghgEmissions: Number, // kg CO₂e/t waste

      // Economic / Circular Value
      revenueFromByProducts: Number, // USD/t waste
      marketPriceAcid: Number, // USD/t H₂SO₄

      // AI Predicted Fields
      valorization_recovery_rate_percent: { type: Number, default: null },
      valorization_revenue_usd_per_t: { type: Number, default: null },
      valorization_ghg_emissions_kg: { type: Number, default: null },
      valorization_circularity_score: { type: Number, default: null },

      // Sustainability Parameters
      followingSustainableRules: { type: Boolean, default: null },
      sustainabilityParameters: {
        circularEconomyPartnerships: { type: Boolean, default: null },
        wasteToProductInnovationLevel: {
          type: String,
          enum: ['None', 'Pilot', 'Commercial'],
          default: null
        },
        sulfurCaptureEfficiencyPercent: { type: Number, default: null }
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
copperWorkflowSchema.index({ userId: 1, status: 1, metalType: 1 });
copperWorkflowSchema.index({ isPublic: 1, status: 1 });
copperWorkflowSchema.index({ tags: 1 });
copperWorkflowSchema.index({ createdAt: -1 });

// ============================================================================
// VIRTUALS
// ============================================================================

copperWorkflowSchema.virtual('completionPercentage').get(function() {
  if (!this.completedSteps || this.completedSteps.length === 0) return 0;
  const totalSteps = 7;
  return Math.round((this.completedSteps.length / totalSteps) * 100);
});

copperWorkflowSchema.virtual('isCompleted').get(function() {
  if (!this.completedSteps) return false;
  const totalSteps = 7;
  return this.completedSteps.length === totalSteps;
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Pre-save: Auto-generate tags
copperWorkflowSchema.pre('save', function(next) {
  if (!this.tags) {
    this.tags = [];
  }
  
  const baseTags = ['wizard', 'copper'];
  baseTags.forEach(tag => {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  });
  
  if (this.isCompleted && !this.tags.includes('completed')) {
    this.tags.push('completed');
  }
  
  next();
});

// ============================================================================
// STATIC METHODS
// ============================================================================

copperWorkflowSchema.statics.createEmpty = async function(userId, name = null) {
  const workflowName = name || `Copper LCA Wizard - ${new Date().toLocaleDateString()}`;
  
  return await this.create({
    name: workflowName,
    userId,
    metalType: 'Copper',
    status: 'draft',
    currentStep: 0,
    completedSteps: [],
    tags: ['wizard', 'copper'],
    copperMining: {},
    copperBeneficiation: {},
    copperRefining: {},
    copperManufacturing: {},
    copperUsePhase: {},
    copperRecycling: {},
    copperValorization: {}
  });
};

copperWorkflowSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.metalType) {
    query.where('metalType').equals(options.metalType);
  }
  
  return query.sort('-updatedAt').exec();
};

copperWorkflowSchema.statics.getPublicWorkflows = function(filters = {}) {
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

copperWorkflowSchema.methods.updateStep = function(stepName, data) {
  const validSteps = ['copperMining', 'copperBeneficiation', 'copperRefining', 'copperManufacturing', 'copperUsePhase', 'copperRecycling', 'copperValorization'];
  
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

copperWorkflowSchema.methods.markStepCompleted = function(stepNumber) {
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

copperWorkflowSchema.methods.submit = function() {
  if (!this.isCompleted) {
    throw new Error('Cannot submit incomplete workflow. Complete all steps first.');
  }
  
  this.status = 'submitted';
  return this.save();
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

const CopperWorkflow = mongoose.model('CopperWorkflow', copperWorkflowSchema);

module.exports = CopperWorkflow;
