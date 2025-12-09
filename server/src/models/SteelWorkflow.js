/**
 * Steel Workflow Model
 * 
 * Represents a completed wizard form submission for Steel LCA data collection.
 * Stores comprehensive data across 9 sections (with 7 countable stages):
 * steelSource, steelMining, steelBeneficiation, steelIronmaking, steelSteelmaking,
 * steelManufacturing, steelUsePhase, steelRecycling, and steelValorization.
 * 
 * @module models/SteelWorkflow
 */

const mongoose = require('mongoose');

/**
 * Steel Workflow Schema
 * 
 * Stores detailed form data from the multi-step wizard interface for Steel
 */
const steelWorkflowSchema = new mongoose.Schema(
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
      default: 'Steel',
      enum: {
        values: ['Steel'],
        message: 'This schema only supports Steel'
      }
    },

    // ============================================================================
    // STEP 0: STEEL SOURCE (Not counted in completion %)
    // ============================================================================
    steelSource: {
      materialSource: {
        type: String,
        required: [true, 'Material source is required'],
        enum: {
          values: ['primary', 'secondary', 'mixed'],
          message: '{VALUE} is not a valid material source'
        }
      },
      primaryPercent: {
        type: Number,
        min: [0, 'Primary percent cannot be negative'],
        max: [100, 'Primary percent cannot exceed 100'],
        default: 0
      },
      scrapPercent: {
        type: Number,
        min: [0, 'Scrap percent cannot be negative'],
        max: [100, 'Scrap percent cannot exceed 100'],
        default: 0
      }
    },

    // ============================================================================
    // STEP 1: STEEL MINING (Iron Ore Extraction)
    // ============================================================================
    steelMining: {
      // Mining Fundamentals
      miningMethod: {
        type: String,
        required: [true, 'Mining method is required'],
        enum: {
          values: ['open-pit', 'underground', 'in-situ', 'others'],
          message: '{VALUE} is not a valid mining method'
        }
      },
      oreType: {
        type: String,
        required: [true, 'Ore type is required'],
        enum: {
          values: ['hematite', 'magnetite', 'goethite', 'mixed'],
          message: '{VALUE} is not a valid ore type'
        }
      },
      oreGradePercentFe: {
        type: Number,
        required: [true, 'Ore grade (% Fe) is required'],
        min: [0, 'Ore grade cannot be negative'],
        max: [100, 'Ore grade cannot exceed 100']
      },
      overburdenRatio: {
        type: Number,
        required: [true, 'Overburden ratio is required'],
        min: [0, 'Overburden ratio cannot be negative']
      },
      averageHaulDistanceKm: {
        type: Number,
        required: [true, 'Average haul distance is required'],
        min: [0, 'Haul distance cannot be negative']
      },

      // Equipment & Energy
      equipmentType: {
        type: String,
        required: [true, 'Equipment type is required'],
        enum: {
          values: ['diesel', 'electric', 'hybrid'],
          message: '{VALUE} is not a valid equipment type'
        }
      },
      fuelConsumptionLPerTon: {
        type: Number,
        required: [true, 'Fuel consumption is required'],
        min: [0, 'Fuel consumption cannot be negative']
      },
      electricityConsumptionKWhPerTon: {
        type: Number,
        required: [true, 'Electricity consumption is required'],
        min: [0, 'Electricity consumption cannot be negative']
      },

      // Water Management
      waterConsumptionM3PerTon: {
        type: Number,
        required: [true, 'Water consumption is required'],
        min: [0, 'Water consumption cannot be negative']
      },
      waterSource: {
        type: String,
        required: [true, 'Water source is required'],
        enum: {
          values: ['groundwater', 'surface', 'recycled', 'mixed'],
          message: '{VALUE} is not a valid water source'
        }
      },

      // Environmental Metrics
      landDisturbedM2PerTon: {
        type: Number,
        min: [0, 'Land disturbed cannot be negative']
      },
      dustEmissionsKgPerTon: {
        type: Number,
        min: [0, 'Dust emissions cannot be negative']
      },
      explosivesKgPerTon: {
        type: Number,
        min: [0, 'Explosives usage cannot be negative']
      },
      ironOreMoisturePercent: {
        type: Number,
        min: [0, 'Moisture percent cannot be negative'],
        max: [100, 'Moisture percent cannot exceed 100']
      },

      // Sustainability
      followingSustainableRules: {
        type: Boolean,
        default: null
      },
      sustainabilityParameters: {
        rehabilitationPlanActive: {
          type: Boolean,
          default: null
        },
        overburdenRestoredPercent: {
          type: Number,
          min: [0, 'Restored percent cannot be negative'],
          max: [100, 'Restored percent cannot exceed 100'],
          default: null
        },
        waterReuseRatePercent: {
          type: Number,
          min: [0, 'Water reuse rate cannot be negative'],
          max: [100, 'Water reuse rate cannot exceed 100'],
          default: null
        },
        biodiversityProtectionLevel: {
          type: String,
          enum: {
            values: ['Low', 'Moderate', 'High'],
            message: '{VALUE} is not a valid biodiversity protection level'
          },
          default: null
        },
        dustSuppression: {
          type: String,
          enum: {
            values: ['Basic', 'Advanced', 'Smart-AI'],
            message: '{VALUE} is not a valid dust suppression method'
          },
          default: null
        }
      },

      // AI Predicted Fields
      steelMining_energy_MJ_per_t_ore: { type: Number, default: null },
      steelMining_co2_kg_per_t_ore: { type: Number, default: null },
      steelMining_water_m3_per_t_ore: { type: Number, default: null },
      steelMining_dust_kg_per_t_ore: { type: Number, default: null }
    },

    // ============================================================================
    // STEP 2: STEEL BENEFICIATION (Iron Ore Processing)
    // ============================================================================
    steelBeneficiation: {
      // Process Selection
      processesSelected: {
        type: [{
          type: String,
          enum: {
            values: ['crushing', 'grinding', 'screening', 'washing', 'magnetic', 'gravity', 'thickening', 'others'],
            message: '{VALUE} is not a valid beneficiation process'
          }
        }],
        required: [true, 'At least one process must be selected']
      },

      // Processing Metrics
      concentrateGradePercentFe: {
        type: Number,
        required: [true, 'Concentrate grade (% Fe) is required'],
        min: [0, 'Concentrate grade cannot be negative'],
        max: [100, 'Concentrate grade cannot exceed 100']
      },
      grindingEnergyKWhPerTon: {
        type: Number,
        required: [true, 'Grinding energy is required'],
        min: [0, 'Grinding energy cannot be negative']
      },
      electricityUseKWhPerTon: {
        type: Number,
        required: [true, 'Electricity use is required'],
        min: [0, 'Electricity use cannot be negative']
      },
      recoveryEfficiencyPercent: {
        type: Number,
        required: [true, 'Recovery efficiency is required'],
        min: [0, 'Recovery efficiency cannot be negative'],
        max: [100, 'Recovery efficiency cannot exceed 100']
      },

      // Water Management
      waterConsumptionM3PerTon: {
        type: Number,
        required: [true, 'Water consumption is required'],
        min: [0, 'Water consumption cannot be negative']
      },
      waterRecycledPercent: {
        type: Number,
        required: [true, 'Water recycled percent is required'],
        min: [0, 'Water recycled percent cannot be negative'],
        max: [100, 'Water recycled percent cannot exceed 100']
      },

      // Tailings Management
      tailingsProducedTPerT: {
        type: Number,
        min: [0, 'Tailings produced cannot be negative']
      },
      tailingsSolidsPercent: {
        type: Number,
        min: [0, 'Tailings solids percent cannot be negative'],
        max: [100, 'Tailings solids percent cannot exceed 100']
      },
      tailingsStorageType: {
        type: String,
        enum: {
          values: ['wet', 'paste', 'dry'],
          message: '{VALUE} is not a valid tailings storage type'
        }
      },

      // Sustainability
      followingSustainableRules: {
        type: Boolean,
        default: null
      },
      sustainabilityParameters: {
        bioBasedReagents: {
          type: Boolean,
          default: null
        },
        zeroLiquidDischarge: {
          type: Boolean,
          default: null
        },
        tailingsDewatering: {
          type: String,
          enum: {
            values: ['Conventional', 'Thickened', 'Dry Stack'],
            message: '{VALUE} is not a valid tailings dewatering method'
          },
          default: null
        },
        waterTreatment: {
          type: String,
          enum: {
            values: ['Basic', 'Advanced', 'AI-Hybrid'],
            message: '{VALUE} is not a valid water treatment method'
          },
          default: null
        },
        tailingsReusePotentialPercent: {
          type: Number,
          min: [0, 'Tailings reuse potential cannot be negative'],
          max: [100, 'Tailings reuse potential cannot exceed 100'],
          default: null
        }
      },

      // AI Predicted Fields
      steelBeneficiation_energy_kWh_per_t: { type: Number, default: null },
      steelBeneficiation_water_m3_per_t: { type: Number, default: null },
      steelBeneficiation_recovery_percent: { type: Number, default: null },
      steelBeneficiation_tailings_t_per_t: { type: Number, default: null }
    },

    // ============================================================================
    // STEP 3: STEEL IRONMAKING (Blast Furnace or Direct Reduced Iron)
    // ============================================================================
    steelIronmaking: {
      // Route Selection
      ironmakingRoute: {
        type: String,
        required: [true, 'Ironmaking route is required'],
        enum: {
          values: ['BF', 'DRI_Gas', 'DRI_Coal'],
          message: '{VALUE} is not a valid ironmaking route'
        }
      },

      // Blast Furnace Route
      bf: {
        sinteringUsed: {
          type: Boolean,
          required: function() { return this.ironmakingRoute === 'BF'; }
        },
        pelletRatioPercent: {
          type: Number,
          required: function() { return this.ironmakingRoute === 'BF'; },
          min: [0, 'Pellet ratio cannot be negative'],
          max: [100, 'Pellet ratio cannot exceed 100']
        },
        cokeRateKgPerTon: {
          type: Number,
          required: function() { return this.ironmakingRoute === 'BF'; },
          min: [0, 'Coke rate cannot be negative']
        },
        pciRateKgPerTon: {
          type: Number,
          required: function() { return this.ironmakingRoute === 'BF'; },
          min: [0, 'PCI rate cannot be negative']
        },
        electricityKWhPerTon: {
          type: Number,
          required: function() { return this.ironmakingRoute === 'BF'; },
          min: [0, 'Electricity consumption cannot be negative']
        },
        thermalEnergyMJPerTon: {
          type: Number,
          required: function() { return this.ironmakingRoute === 'BF'; },
          min: [0, 'Thermal energy cannot be negative']
        },
        slagGenerationKgPerTon: {
          type: Number,
          min: [0, 'Slag generation cannot be negative']
        },
        co2KgPerTon: {
          type: Number,
          required: function() { return this.ironmakingRoute === 'BF'; },
          min: [0, 'CO2 emissions cannot be negative']
        },
        soxKgPerTon: {
          type: Number,
          min: [0, 'SOx emissions cannot be negative']
        },
        noxKgPerTon: {
          type: Number,
          min: [0, 'NOx emissions cannot be negative']
        },
        dustKgPerTon: {
          type: Number,
          min: [0, 'Dust emissions cannot be negative']
        },
        followingSustainableRules: {
          type: Boolean,
          default: null
        },
        sustainabilityParameters: {
          renewablePowerPercent: {
            type: Number,
            min: [0, 'Renewable power percent cannot be negative'],
            max: [100, 'Renewable power percent cannot exceed 100'],
            default: null
          },
          slagUsedInCementPercent: {
            type: Number,
            min: [0, 'Slag used in cement cannot be negative'],
            max: [100, 'Slag used in cement cannot exceed 100'],
            default: null
          },
          heatRecoveryPercent: {
            type: Number,
            min: [0, 'Heat recovery percent cannot be negative'],
            max: [100, 'Heat recovery percent cannot exceed 100'],
            default: null
          }
        }
      },

      // Direct Reduced Iron Route
      dri: {
        feedstock: {
          type: String,
          required: function() { return this.ironmakingRoute === 'DRI_Gas' || this.ironmakingRoute === 'DRI_Coal'; },
          enum: {
            values: ['pellets', 'lump'],
            message: '{VALUE} is not a valid DRI feedstock'
          }
        },
        reductantUsed: {
          type: Number,
          required: function() { return this.ironmakingRoute === 'DRI_Gas' || this.ironmakingRoute === 'DRI_Coal'; },
          min: [0, 'Reductant used cannot be negative']
        },
        electricityKWhPerTon: {
          type: Number,
          required: function() { return this.ironmakingRoute === 'DRI_Gas' || this.ironmakingRoute === 'DRI_Coal'; },
          min: [0, 'Electricity consumption cannot be negative']
        },
        metallizationPercent: {
          type: Number,
          required: function() { return this.ironmakingRoute === 'DRI_Gas' || this.ironmakingRoute === 'DRI_Coal'; },
          min: [0, 'Metallization percent cannot be negative'],
          max: [100, 'Metallization percent cannot exceed 100']
        },
        co2KgPerTon: {
          type: Number,
          required: function() { return this.ironmakingRoute === 'DRI_Gas' || this.ironmakingRoute === 'DRI_Coal'; },
          min: [0, 'CO2 emissions cannot be negative']
        },
        followingSustainableRules: {
          type: Boolean,
          default: null
        },
        sustainabilityParameters: {
          hydrogenSubstitutionPercent: {
            type: Number,
            min: [0, 'Hydrogen substitution cannot be negative'],
            max: [100, 'Hydrogen substitution cannot exceed 100'],
            default: null
          },
          syngasRecyclePercent: {
            type: Number,
            min: [0, 'Syngas recycle cannot be negative'],
            max: [100, 'Syngas recycle cannot exceed 100'],
            default: null
          }
        }
      },

      // AI Predicted Fields
      steelIronmaking_energy_MJ_per_t_iron: { type: Number, default: null },
      steelIronmaking_co2_kg_per_t_iron: { type: Number, default: null },
      steelIronmaking_slag_kg_per_t_iron: { type: Number, default: null }
    },

    // ============================================================================
    // STEP 4: STEEL STEELMAKING (BOF or EAF)
    // ============================================================================
    steelSteelmaking: {
      // Route Selection
      steelmakingRoute: {
        type: String,
        required: [true, 'Steelmaking route is required'],
        enum: {
          values: ['BOF', 'EAF'],
          message: '{VALUE} is not a valid steelmaking route'
        }
      },

      // Basic Oxygen Furnace Route
      bof: {
        scrapChargePercent: {
          type: Number,
          required: function() { return this.steelmakingRoute === 'BOF'; },
          min: [0, 'Scrap charge percent cannot be negative'],
          max: [100, 'Scrap charge percent cannot exceed 100']
        },
        oxygenNm3PerTon: {
          type: Number,
          required: function() { return this.steelmakingRoute === 'BOF'; },
          min: [0, 'Oxygen consumption cannot be negative']
        },
        fluxKgPerTon: {
          type: Number,
          required: function() { return this.steelmakingRoute === 'BOF'; },
          min: [0, 'Flux consumption cannot be negative']
        },
        electricityKWhPerTon: {
          type: Number,
          required: function() { return this.steelmakingRoute === 'BOF'; },
          min: [0, 'Electricity consumption cannot be negative']
        },
        co2KgPerTon: {
          type: Number,
          required: function() { return this.steelmakingRoute === 'BOF'; },
          min: [0, 'CO2 emissions cannot be negative']
        },
        so2KgPerTon: {
          type: Number,
          min: [0, 'SO2 emissions cannot be negative']
        },
        noxKgPerTon: {
          type: Number,
          min: [0, 'NOx emissions cannot be negative']
        },
        followingSustainableRules: {
          type: Boolean,
          default: null
        },
        sustainabilityParameters: {
          highScrapUtilizationMode: {
            type: Boolean,
            default: null
          },
          renewableEnergyPercent: {
            type: Number,
            min: [0, 'Renewable energy percent cannot be negative'],
            max: [100, 'Renewable energy percent cannot exceed 100'],
            default: null
          },
          slagReusePercent: {
            type: Number,
            min: [0, 'Slag reuse percent cannot be negative'],
            max: [100, 'Slag reuse percent cannot exceed 100'],
            default: null
          }
        }
      },

      // Electric Arc Furnace Route
      eaf: {
        electricityConsumptionKWhPerTon: {
          type: Number,
          required: function() { return this.steelmakingRoute === 'EAF'; },
          min: [0, 'Electricity consumption cannot be negative']
        },
        scrapInputPercent: {
          type: Number,
          required: function() { return this.steelmakingRoute === 'EAF'; },
          min: [0, 'Scrap input percent cannot be negative'],
          max: [100, 'Scrap input percent cannot exceed 100']
        },
        driInputPercent: {
          type: Number,
          required: function() { return this.steelmakingRoute === 'EAF'; },
          min: [0, 'DRI input percent cannot be negative'],
          max: [100, 'DRI input percent cannot exceed 100']
        },
        electrodesConsumptionKgPerTon: {
          type: Number,
          min: [0, 'Electrodes consumption cannot be negative']
        },
        followingSustainableRules: {
          type: Boolean,
          default: null
        },
        sustainabilityParameters: {
          renewablePowerPercent: {
            type: Number,
            min: [0, 'Renewable power percent cannot be negative'],
            max: [100, 'Renewable power percent cannot exceed 100'],
            default: null
          },
          onsiteScrapSorting: {
            type: Boolean,
            default: null
          }
        }
      },

      // AI Predicted Fields
      steelSteelmaking_energy_kWh_per_t_steel: { type: Number, default: null },
      steelSteelmaking_co2_kg_per_t_steel: { type: Number, default: null },
      steelSteelmaking_scrap_utilization_percent: { type: Number, default: null }
    },

    // ============================================================================
    // STEP 5: STEEL MANUFACTURING (Product Fabrication)
    // ============================================================================
    steelManufacturing: {
      // Product Type
      productType: {
        type: String,
        required: [true, 'Product type is required'],
        enum: {
          values: ['rod', 'rebar', 'coil', 'plate', 'structural', 'others'],
          message: '{VALUE} is not a valid product type'
        }
      },
      castingMethod: {
        type: String,
        required: [true, 'Casting method is required'],
        enum: {
          values: ['continuous', 'batch'],
          message: '{VALUE} is not a valid casting method'
        }
      },
      furnaceType: {
        type: String,
        required: [true, 'Furnace type is required'],
        enum: {
          values: ['induction', 'eaf', 'gas'],
          message: '{VALUE} is not a valid furnace type'
        }
      },

      // Energy Consumption
      meltingEnergyKWhPerTon: {
        type: Number,
        required: [true, 'Melting energy is required'],
        min: [0, 'Melting energy cannot be negative']
      },
      rollingEnergyKWhPerTon: {
        type: Number,
        required: [true, 'Rolling energy is required'],
        min: [0, 'Rolling energy cannot be negative']
      },
      electricityMixRenewablePercent: {
        type: Number,
        required: [true, 'Electricity mix renewable percent is required'],
        min: [0, 'Renewable percent cannot be negative'],
        max: [100, 'Renewable percent cannot exceed 100']
      },

      // Water & Material Management
      processWaterM3PerTon: {
        type: Number,
        required: [true, 'Process water consumption is required'],
        min: [0, 'Process water cannot be negative']
      },
      scrapGeneratedPercent: {
        type: Number,
        required: [true, 'Scrap generated percent is required'],
        min: [0, 'Scrap generated percent cannot be negative'],
        max: [100, 'Scrap generated percent cannot exceed 100']
      },
      scrapRecycledOnsitePercent: {
        type: Number,
        min: [0, 'Scrap recycled percent cannot be negative'],
        max: [100, 'Scrap recycled percent cannot exceed 100']
      },
      surfaceTreatmentChemicalKgPerTon: {
        type: Number,
        min: [0, 'Surface treatment chemical cannot be negative']
      },

      // Sustainability
      followingSustainableRules: {
        type: Boolean,
        default: null
      },
      sustainabilityParameters: {
        designForRecycling: {
          type: Boolean,
          default: null
        },
        wasteHeatRecoveryPercent: {
          type: Number,
          min: [0, 'Waste heat recovery cannot be negative'],
          max: [100, 'Waste heat recovery cannot exceed 100'],
          default: null
        },
        renewableEnergyPercent: {
          type: Number,
          min: [0, 'Renewable energy percent cannot be negative'],
          max: [100, 'Renewable energy percent cannot exceed 100'],
          default: null
        }
      },

      // AI Predicted Fields
      steelManufacturing_energy_kWh_per_t: { type: Number, default: null },
      steelManufacturing_scrap_rate_percent: { type: Number, default: null },
      steelManufacturing_co2_kg_per_t: { type: Number, default: null }
    },

    // ============================================================================
    // STEP 6: STEEL USE PHASE (Product Lifetime & Maintenance)
    // ============================================================================
    steelUsePhase: {
      // Product Lifetime
      productLifetimeYears: {
        type: Number,
        required: [true, 'Product lifetime is required'],
        min: [0, 'Product lifetime cannot be negative']
      },
      maintenanceFrequencyPerYear: {
        type: Number,
        required: [true, 'Maintenance frequency is required'],
        min: [0, 'Maintenance frequency cannot be negative']
      },

      // Environmental Conditions
      corrosionEnvironment: {
        type: String,
        enum: {
          values: ['Low', 'Moderate', 'High'],
          message: '{VALUE} is not a valid corrosion environment'
        }
      },

      // Performance Metrics
      energySavingsPercent: {
        type: Number,
        min: [0, 'Energy savings percent cannot be negative'],
        max: [100, 'Energy savings percent cannot exceed 100']
      },
      reusePotentialPercent: {
        type: Number,
        min: [0, 'Reuse potential cannot be negative'],
        max: [100, 'Reuse potential cannot exceed 100']
      },

      // Sustainability
      followingSustainableRules: {
        type: Boolean,
        default: null
      },
      sustainabilityParameters: {
        lifetimeExtensionYears: {
          type: Number,
          min: [0, 'Lifetime extension cannot be negative'],
          default: null
        }
      },

      // AI Predicted Fields
      steelUsePhase_lifetime_years: { type: Number, default: null },
      steelUsePhase_maintenance_impact_kg_co2: { type: Number, default: null },
      steelUsePhase_reuse_potential_percent: { type: Number, default: null }
    },

    // ============================================================================
    // STEP 7: STEEL RECYCLING (End-of-Life Steel Recovery)
    // ============================================================================
    steelRecycling: {
      // Scrap Characteristics
      scrapType: {
        type: String,
        required: [true, 'Scrap type is required'],
        enum: {
          values: ['pre-consumer', 'post-consumer', 'mixed'],
          message: '{VALUE} is not a valid scrap type'
        }
      },
      collectionRatePercent: {
        type: Number,
        required: [true, 'Collection rate is required'],
        min: [0, 'Collection rate cannot be negative'],
        max: [100, 'Collection rate cannot exceed 100']
      },

      // Sorting & Processing
      sortingTech: {
        type: String,
        required: [true, 'Sorting technology is required'],
        enum: {
          values: ['manual', 'magnetic', 'optical', 'libs', 'xrf'],
          message: '{VALUE} is not a valid sorting technology'
        }
      },
      contaminationPercent: {
        type: Number,
        required: [true, 'Contamination percent is required'],
        min: [0, 'Contamination percent cannot be negative'],
        max: [100, 'Contamination percent cannot exceed 100']
      },

      // Remelting & Recovery
      remeltingEnergyKWhPerTon: {
        type: Number,
        required: [true, 'Remelting energy is required'],
        min: [0, 'Remelting energy cannot be negative']
      },
      recoveryYieldPercent: {
        type: Number,
        required: [true, 'Recovery yield is required'],
        min: [0, 'Recovery yield cannot be negative'],
        max: [100, 'Recovery yield cannot exceed 100']
      },
      recycledContentPercent: {
        type: Number,
        required: [true, 'Recycled content percent is required'],
        min: [0, 'Recycled content percent cannot be negative'],
        max: [100, 'Recycled content percent cannot exceed 100']
      },

      // Additional Processing Details
      furnaceType: {
        type: String,
        enum: {
          values: ['eaf', 'induction', 'rotary'],
          message: '{VALUE} is not a valid furnace type'
        }
      },
      slagGenerationKgPerTon: {
        type: Number,
        min: [0, 'Slag generation cannot be negative']
      },

      // Sustainability
      followingSustainableRules: {
        type: Boolean,
        default: null
      },
      sustainabilityParameters: {
        highPuritySorting: {
          type: Boolean,
          default: null
        },
        slagReusedPercent: {
          type: Number,
          min: [0, 'Slag reused percent cannot be negative'],
          max: [100, 'Slag reused percent cannot exceed 100'],
          default: null
        },
        renewablePowerPercent: {
          type: Number,
          min: [0, 'Renewable power percent cannot be negative'],
          max: [100, 'Renewable power percent cannot exceed 100'],
          default: null
        }
      },

      // AI Predicted Fields
      steelRecycling_energy_kWh_per_t: { type: Number, default: null },
      steelRecycling_recovery_yield_percent: { type: Number, default: null },
      steelRecycling_co2_savings_kg_per_t: { type: Number, default: null },
      steelRecycling_collection_rate_percent: { type: Number, default: null }
    },

    // ============================================================================
    // STEP 8: STEEL VALORIZATION (Waste & By-product Management)
    // ============================================================================
    steelValorization: {
      // Waste Type
      wasteType: {
        type: String,
        required: [true, 'Waste type is required'],
        enum: {
          values: ['bf_slag', 'bof_slag', 'mill_scale', 'dust', 'effluent'],
          message: '{VALUE} is not a valid waste type'
        }
      },

      // Valorization Method
      valorizationMethod: {
        type: String,
        required: [true, 'Valorization method is required'],
        enum: {
          values: ['reuse', 'recycle', 'neutralize', 'dispose'],
          message: '{VALUE} is not a valid valorization method'
        }
      },
      valorizationRatePercent: {
        type: Number,
        required: [true, 'Valorization rate is required'],
        min: [0, 'Valorization rate cannot be negative'],
        max: [100, 'Valorization rate cannot exceed 100']
      },
      metalRecoveryRatePercent: {
        type: Number,
        required: [true, 'Metal recovery rate is required'],
        min: [0, 'Metal recovery rate cannot be negative'],
        max: [100, 'Metal recovery rate cannot exceed 100']
      },

      // Resource Use
      waterForTreatmentM3PerTon: {
        type: Number,
        min: [0, 'Water for treatment cannot be negative']
      },
      residueKgPerTon: {
        type: Number,
        min: [0, 'Residue cannot be negative']
      },

      // Sustainability
      followingSustainableRules: {
        type: Boolean,
        default: null
      },
      sustainabilityParameters: {
        circularEconomyPartnerships: {
          type: Boolean,
          default: null
        },
        slagInCementPercent: {
          type: Number,
          min: [0, 'Slag in cement percent cannot be negative'],
          max: [100, 'Slag in cement percent cannot exceed 100'],
          default: null
        }
      },

      // AI Predicted Fields
      steelValorization_recovery_rate_percent: { type: Number, default: null },
      steelValorization_emission_reduction_kg: { type: Number, default: null },
      steelValorization_circularity_score: { type: Number, default: null }
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
steelWorkflowSchema.index({ userId: 1, status: 1, metalType: 1 });
steelWorkflowSchema.index({ isPublic: 1, status: 1 });
steelWorkflowSchema.index({ tags: 1 });
steelWorkflowSchema.index({ createdAt: -1 });

// ============================================================================
// VIRTUALS
// ============================================================================

/**
 * Get completion percentage (based on 7 stages, steelSource doesn't count)
 */
steelWorkflowSchema.virtual('completionPercentage').get(function() {
  if (!this.completedSteps || this.completedSteps.length === 0) return 0;
  const totalSteps = 7; // steelSource is not counted
  return Math.round((this.completedSteps.length / totalSteps) * 100);
});

/**
 * Check if workflow is fully completed
 */
steelWorkflowSchema.virtual('isCompleted').get(function() {
  if (!this.completedSteps) return false;
  const totalSteps = 7; // steelSource is not counted
  return this.completedSteps.length === totalSteps;
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Pre-save: Auto-generate tags
 */
steelWorkflowSchema.pre('save', function(next) {
  if (!this.tags) {
    this.tags = [];
  }
  
  // Ensure basic tags exist
  const baseTags = ['wizard', 'steel'];
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
 * Create a new empty steel workflow
 */
steelWorkflowSchema.statics.createEmpty = async function(userId, name = null) {
  const workflowName = name || `Steel LCA Wizard - ${new Date().toLocaleDateString()}`;
  
  return await this.create({
    name: workflowName,
    userId,
    metalType: 'Steel',
    status: 'draft',
    currentStep: 0,
    completedSteps: [],
    tags: ['wizard', 'steel'],
    steelSource: {},
    steelMining: {},
    steelBeneficiation: {},
    steelIronmaking: {},
    steelSteelmaking: {},
    steelManufacturing: {},
    steelUsePhase: {},
    steelRecycling: {},
    steelValorization: {}
  });
};

/**
 * Get all workflows by user
 */
steelWorkflowSchema.statics.findByUser = function(userId, options = {}) {
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
steelWorkflowSchema.statics.getPublicWorkflows = function(filters = {}) {
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
 * Update a specific step's data
 */
steelWorkflowSchema.methods.updateStep = function(stepName, data) {
  const validSteps = ['steelSource', 'steelMining', 'steelBeneficiation', 'steelIronmaking', 'steelSteelmaking', 'steelManufacturing', 'steelUsePhase', 'steelRecycling', 'steelValorization'];
  
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
 * Mark a step as completed
 */
steelWorkflowSchema.methods.markStepCompleted = function(stepNumber) {
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
 * Submit workflow for review/calculation
 */
steelWorkflowSchema.methods.submit = function() {
  if (!this.isCompleted) {
    throw new Error('Cannot submit incomplete workflow. Complete all steps first.');
  }
  
  this.status = 'submitted';
  return this.save();
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

const SteelWorkflow = mongoose.model('SteelWorkflow', steelWorkflowSchema);

module.exports = SteelWorkflow;
