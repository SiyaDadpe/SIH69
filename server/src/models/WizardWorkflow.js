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
const { 
  copperMiningSchema,
  copperBeneficiationSchema,
  copperRefiningSchema,
  copperManufacturingSchema,
  copperUsePhaseSchema,
  copperRecyclingSchema,
  copperValorizationSchema
} = require('./schemas/copperStages');

/**
 * Wizard Workflow Schema
 * 
 * Stores detailed form data from the multi-step wizard interface
 * Supports multiple metal types with metal-specific stage schemas
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
      maxlength: [1000, '9 cannot exceed 1000 characters'],
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
        values: ['Aluminium', 'Copper', 'Steel', 'Titanium', 'Lithium', 'Nickel', 'Gold', 'Zinc', 'Lead'],
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
      },
      
      // AI Predicted Fields (can be manually edited by users)
      mining_energy_MJ_per_t_ore: { type: Number, default: null },
      mining_co2_kg_per_t_ore: { type: Number, default: null },
      mining_sox_kg_per_t_ore: { type: Number, default: null },
      mining_nox_kg_per_t_ore: { type: Number, default: null },
      mining_pm_kg_per_t_ore: { type: Number, default: null },
      
      // Sustainability Parameters (Optional - shown when followingSustainableRules = true)
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
      },
      
      // AI Predicted Fields (can be manually edited by users)
      beneficiation_water_m3_per_t_ore: { type: Number, default: null },
      beneficiation_electricity_kWh_per_t_ore: { type: Number, default: null },
      beneficiation_tailings_management: { type: String, default: null },
      beneficiation_noise_pollution: { type: String, default: null },
      beneficiation_dust_pollution: { type: String, default: null },
      
      // Sustainability Parameters (Optional - shown when followingSustainableRules = true)
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
      
      // Sustainability Parameters (Optional - shown when followingSustainableRules = true)
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
      thermalRecovery: Number, // % of total energy (frontend field name)
      
      // AI Predicted Fields
      smelting_energy_kWh_per_t_al: { type: Number, default: null },
      smelting_energy_MJ_per_t_al: { type: Number, default: null },
      smelting_co2_kg_per_t_al: { type: Number, default: null },
      smelting_pfc_kg_per_t_al: { type: Number, default: null },
      smelting_so2_kg_per_t_al: { type: Number, default: null },
      smelting_nox_kg_per_t_al: { type: Number, default: null },
      smelting_fluoride_recovery_percent: { type: Number, default: null },
      smelting_thermal_recovery_percent: { type: Number, default: null },
      
      // Sustainability Parameters (Optional - shown when followingSustainableRules = true)
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
      corrosionOthers: String,
      
      // AI Predicted Fields
      manufacturing_energy_MJ_per_t_product: { type: Number, default: null },
      manufacturing_scrap_rate_percent: { type: Number, default: null },
      manufacturing_recycled_content_percent: { type: Number, default: null },
      manufacturing_transport_emissions_kgCO2e_per_t: { type: Number, default: null },
      
      // ============================================================================
      // CIRCULAR FLOW FIELDS - Input from Recycling
      // ============================================================================
      
      // Current recycled scrap composition being used
      recycledScrapComposition: {
        type: Map,
        of: Number,
        default: () => new Map() // Empty map if no recycled content
      },
      
      // Alternative object-based composition for easier frontend use
      recycledScrapCompositionObj: {
        type: mongoose.Schema.Types.Mixed,
        default: {} // Empty object if no recycled content
      },
      
      // Proportion of total input coming from recycled scrap (percentage)
      // Must sum to 100 with primarySourceProportion (validated in pre-save hook)
      recycledScrapProportion: {
        type: Number,
        default: 0,
        min: [0, 'Recycled scrap proportion cannot be negative'],
        max: [100, 'Recycled scrap proportion cannot exceed 100%'],
        validate: {
          validator: function(value) {
            // Allow null/undefined during partial updates
            if (value == null) return true;
            return value >= 0 && value <= 100;
          },
          message: 'Recycled scrap proportion must be between 0 and 100'
        }
      },
      
      // Proportion of total input coming from primary sources (percentage)
      // Must sum to 100 with recycledScrapProportion (validated in pre-save hook)
      primarySourceProportion: {
        type: Number,
        default: 100,
        min: [0, 'Primary source proportion cannot be negative'],
        max: [100, 'Primary source proportion cannot exceed 100%'],
        validate: {
          validator: function(value) {
            // Allow null/undefined during partial updates
            if (value == null) return true;
            return value >= 0 && value <= 100;
          },
          message: 'Primary source proportion must be between 0 and 100'
        }
      },
      
      // History of recycled batches used in manufacturing iterations
      // Each entry tracks one circular iteration with composition and impact data
      recyclingHistory: {
        type: [{
          iterationNumber: {
            type: Number,
            required: [true, 'Iteration number is required for recycling history']
          },
          timestamp: {
            type: Date,
            default: Date.now
          },
          scrapComposition: {
            type: Map,
            of: Number,
            default: () => new Map()
          },
          scrapCompositionObj: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
          },
          // Percentage of scrap in this iteration (must be ≤ 100)
          scrapProportion: {
            type: Number,
            default: 0,
            min: [0, 'Scrap proportion cannot be negative'],
            max: [100, 'Scrap proportion cannot exceed 100%'],
            validate: {
              validator: function(value) {
                if (value == null) return true;
                return value >= 0 && value <= 100;
              },
              message: 'Scrap proportion in history must be between 0 and 100'
            }
          },
          scrapQualityGrade: {
            type: String,
            enum: {
              values: ['A', 'B', 'C', 'mixed', 'unknown'],
              message: '{VALUE} is not a valid scrap quality grade'
            },
            default: 'unknown'
          },
          // Energy consumed in this iteration (default: 0)
          energyUsed: {
            type: Number,
            default: 0,
            min: [0, 'Energy used cannot be negative']
          },
          // Emissions generated in this iteration (default: 0)
          emissionsGenerated: {
            type: Number,
            default: 0,
            min: [0, 'Emissions generated cannot be negative']
          },
          notes: String
        }],
        default: []
      },
      
      // Blended composition (primary + recycled)
      blendedComposition: {
        type: Map,
        of: Number,
        default: () => new Map([['Al', 100]]) // Default: 100% primary Aluminium
      },
      
      // Alternative object-based blended composition
      blendedCompositionObj: {
        type: mongoose.Schema.Types.Mixed,
        default: { Al: 100 }
      },
      
      // Track if manufacturing is using circular input
      isCircularInput: {
        type: Boolean,
        default: false
      },
      
      // Current iteration number in circular workflow
      circularIterationNumber: {
        type: Number,
        default: 0
      },
      
      // Sustainability Parameters (Optional - shown when followingSustainableRules = true)
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
      scrapInputPercent: Number, // % of total feedstock (frontend field name)
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
      openLoopRecyclingPercentage: Number, // %
      
      // AI Predicted Fields
      recycling_scrap_input_percent: { type: Number, default: null },
      recycling_recovery_yield_percent: { type: Number, default: null },
      recycling_energy_kWh_per_t_Al: { type: Number, default: null },
      recycling_emission_savings_kgCO2e_per_t_Al: { type: Number, default: null },
      recycling_collection_rate_percent: { type: Number, default: null },
      recycling_closed_loop_percent: { type: Number, default: null },
      recycling_open_loop_percent: { type: Number, default: null },
      
      // ============================================================================
      // CIRCULAR FLOW FIELDS
      // ============================================================================
      
      // Scrap composition by metal content (percentages)
      scrapComposition: {
        type: Map,
        of: Number,
        default: () => new Map([['Al', 100]]) // Default: 100% Aluminium
      },
      
      // Alternative object-based scrap composition for easier frontend use
      scrapCompositionObj: {
        type: mongoose.Schema.Types.Mixed,
        default: { Al: 100 } // Default: 100% Aluminium
      },
      
      // Percentage of recycled scrap returned to manufacturing (closed-loop)
      returnedToManufacturingPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      
      // Scrap quality grade affecting reuse (A, B, C grades)
      scrapQualityGrade: {
        type: String,
        enum: ['A', 'B', 'C', 'mixed', 'unknown'],
        default: 'unknown'
      },
      
      // Contamination level affecting composition
      contaminationLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 100 // Percentage
      },
      
      // Sustainability Parameters (Optional - shown when followingSustainableRules = true)
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
      wasteUtilizationPercentages: Number, // overall % of waste successfully utilized
      wasteUtilizationOverallPercent: Number, // frontend field name
      emissionReductions: Number, // kg CO₂e per tonne of waste used (original)
      emissionReductionsPerTonne: Number, // kg CO₂e per tonne of waste used (frontend field name)
      redMudUtilized: Number, // % (frontend field name)
      splUtilized: Number, // % (frontend field name)
      drossUtilized: Number, // % (frontend field name)
      fluorideUtilized: Number, // %
      slagUtilized: Number, // %
      // Economic viability for each method
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
      // Recovery efficiencies (individual fields for each waste type)
      redMudRecovery: Number, // %
      splRecovery: Number, // %
      drossRecovery: Number, // %
      fluorideRecovery: Number, // %
      slagRecovery: Number, // %
      
      // Toxicity levels for each waste type
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
      
      // Groundwater risk for each waste type
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
      
      // Additional economic viability fields to match frontend
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
      
      // Legacy fields for backward compatibility
      drossRecoveryEfficiency: Number, // %
      fluorideGasesRecoveryEfficiency: Number, // %
      rareEarthExtractionEconomicViability: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      splEncapsulationEconomicViability: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      drossRecoveryEconomicViability: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      fluorideCaptureEconomicViability: {
        type: String,
        enum: ['low', 'moderate', 'high']
      },
      
      // AI Predicted Fields
      valorization_recovery_efficiency_percent: { type: Number, default: null },
      valorization_emission_reduction_kgCO2e_per_t_waste: { type: Number, default: null },
      
      // Sustainability Parameters (Optional - shown when followingSustainableRules = true)
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
    // CIRCULAR WORKFLOW TRACKING
    // ============================================================================
    
    // Enable circular workflow mode
    isCircularWorkflow: {
      type: Boolean,
      default: false
    },
    
    // Current circular iteration (0 = linear/initial pass, 1+ = circular iterations)
    currentCircularIteration: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Maximum iterations to prevent infinite loops
    maxCircularIterations: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    },
    
    // Convergence criteria: stop when composition change is below this threshold
    convergenceThreshold: {
      type: Number,
      default: 1.0, // 1% change in composition
      min: 0.1,
      max: 10
    },
    
    // Track whether circular workflow has converged
    hasConverged: {
      type: Boolean,
      default: false
    },
    
    // History of all circular iterations
    circularIterationHistory: {
      type: [{
        iterationNumber: Number,
        timestamp: Date,
        manufacturingComposition: {
          type: Map,
          of: Number
        },
        recyclingComposition: {
          type: Map,
          of: Number
        },
        recycledScrapReturned: Number, // Percentage
        compositionChange: Number, // % change from previous iteration
        totalGWP: Number,
        totalEnergy: Number
      }],
      default: []
    },

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

    // ============================================================================
    // COPPER-SPECIFIC STAGES (metalType = 'Copper')
    // ============================================================================
    
    /**
     * Copper stages use different field names and structures
     * These are only populated when metalType = 'Copper'
     * 7 stages: mining, beneficiation, refining, manufacturing, usePhase, recycling, valorization
     */
    copperMining: copperMiningSchema,
    copperBeneficiation: copperBeneficiationSchema,
    copperRefining: copperRefiningSchema,
    copperManufacturing: copperManufacturingSchema,
    copperUsePhase: copperUsePhaseSchema,
    copperRecycling: copperRecyclingSchema,
    copperValorization: copperValorizationSchema,

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
  
  // Both metal types have 7 stages
  // Aluminum: mining, beneficiation, refining, smelting, manufacturing, recycling, valorization
  // Copper: copperMining, copperBeneficiation, copperRefining, copperManufacturing, copperUsePhase, copperRecycling, copperValorization
  const totalSteps = 7;
  
  return Math.round((this.completedSteps.length / totalSteps) * 100);
});

/**
 * Check if wizard is fully completed
 */
wizardWorkflowSchema.virtual('isCompleted').get(function() {
  if (!this.completedSteps) return false;
  
  // Both metal types have 7 stages
  const totalSteps = 7;
  
  return this.completedSteps.length === totalSteps;
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Pre-save hook to ensure data integrity
 * Prevents cross-contamination between metal types
 */
wizardWorkflowSchema.pre('save', function(next) {
  // If metalType is Copper, remove any aluminum fields
  if (this.metalType === 'Copper') {
    this.mining = undefined;
    this.beneficiation = undefined;
    this.refining = undefined;
    this.smelting = undefined;
    this.manufacturing = undefined;
    this.recycling = undefined;
    this.valorization = undefined;
  }
  // If metalType is Aluminium, remove any copper fields
  else if (this.metalType === 'Aluminium' || this.metalType === 'Aluminum') {
    this.copperMining = undefined;
    this.copperBeneficiation = undefined;
    this.copperRefining = undefined;
    this.copperManufacturing = undefined;
    this.copperUsePhase = undefined;
    this.copperRecycling = undefined;
    this.copperValorization = undefined;
  }
  
  next();
});

/**
 * Pre-save hook to validate circular flow data integrity
 * Ensures manufacturing proportions sum to 100% and recycling history is valid
 */
wizardWorkflowSchema.pre('save', function(next) {
  // Skip validation if manufacturing is not defined or empty
  if (!this.manufacturing || Object.keys(this.manufacturing).length === 0) {
    return next();
  }

  try {
    // ============================================================================
    // VALIDATION 1: Ensure recycledScrapProportion + primarySourceProportion = 100
    // ============================================================================
    const recycledProp = this.manufacturing.recycledScrapProportion;
    const primaryProp = this.manufacturing.primarySourceProportion;

    // Only validate if both values are defined (allow partial updates)
    if (recycledProp != null && primaryProp != null) {
      const total = recycledProp + primaryProp;
      
      // Allow small floating-point tolerance (0.01%)
      if (Math.abs(total - 100) > 0.01) {
        return next(new Error(
          `Manufacturing proportions must sum to 100%. ` +
          `Current: recycledScrapProportion (${recycledProp}%) + ` +
          `primarySourceProportion (${primaryProp}%) = ${total}%`
        ));
      }
    }
    // Auto-calculate missing proportion if only one is provided
    else if (recycledProp != null && primaryProp == null) {
      this.manufacturing.primarySourceProportion = 100 - recycledProp;
    }
    else if (primaryProp != null && recycledProp == null) {
      this.manufacturing.recycledScrapProportion = 100 - primaryProp;
    }

    // ============================================================================
    // VALIDATION 2: Validate recyclingHistory entries
    // ============================================================================
    if (this.manufacturing.recyclingHistory && Array.isArray(this.manufacturing.recyclingHistory)) {
      this.manufacturing.recyclingHistory.forEach((entry, index) => {
        // Ensure scrapProportion is within bounds
        if (entry.scrapProportion != null) {
          if (entry.scrapProportion < 0 || entry.scrapProportion > 100) {
            throw new Error(
              `Recycling history entry ${index}: scrapProportion (${entry.scrapProportion}%) ` +
              `must be between 0 and 100`
            );
          }
        } else {
          // Set default if missing
          entry.scrapProportion = 0;
        }

        // Set default values for energyUsed and emissionsGenerated if not provided
        if (entry.energyUsed == null) {
          entry.energyUsed = 0;
        }
        if (entry.emissionsGenerated == null) {
          entry.emissionsGenerated = 0;
        }

        // Ensure negative values are prevented
        if (entry.energyUsed < 0) {
          throw new Error(
            `Recycling history entry ${index}: energyUsed cannot be negative (${entry.energyUsed})`
          );
        }
        if (entry.emissionsGenerated < 0) {
          throw new Error(
            `Recycling history entry ${index}: emissionsGenerated cannot be negative (${entry.emissionsGenerated})`
          );
        }

        // Set default timestamp if missing
        if (!entry.timestamp) {
          entry.timestamp = new Date();
        }

        // Set default scrapQualityGrade if missing
        if (!entry.scrapQualityGrade) {
          entry.scrapQualityGrade = 'unknown';
        }
      });
    }

    // ============================================================================
    // VALIDATION 3: Sync Map and Object representations for consistency
    // ============================================================================
    
    // Sync recycledScrapComposition Map <-> Obj
    if (this.manufacturing.recycledScrapComposition && this.manufacturing.recycledScrapComposition.size > 0) {
      // Convert Map to Object for easier frontend use
      this.manufacturing.recycledScrapCompositionObj = Object.fromEntries(
        this.manufacturing.recycledScrapComposition
      );
    } else if (this.manufacturing.recycledScrapCompositionObj && 
               Object.keys(this.manufacturing.recycledScrapCompositionObj).length > 0) {
      // Convert Object to Map for consistency
      this.manufacturing.recycledScrapComposition = new Map(
        Object.entries(this.manufacturing.recycledScrapCompositionObj)
      );
    }

    // Sync blendedComposition Map <-> Obj
    if (this.manufacturing.blendedComposition && this.manufacturing.blendedComposition.size > 0) {
      this.manufacturing.blendedCompositionObj = Object.fromEntries(
        this.manufacturing.blendedComposition
      );
    } else if (this.manufacturing.blendedCompositionObj && 
               Object.keys(this.manufacturing.blendedCompositionObj).length > 0) {
      this.manufacturing.blendedComposition = new Map(
        Object.entries(this.manufacturing.blendedCompositionObj)
      );
    }

    // ============================================================================
    // VALIDATION 4: Validate recycling scrap composition if present
    // ============================================================================
    if (this.recycling && this.recycling.scrapComposition) {
      // Sync recycling scrapComposition Map <-> Obj
      if (this.recycling.scrapComposition.size > 0) {
        this.recycling.scrapCompositionObj = Object.fromEntries(
          this.recycling.scrapComposition
        );
      } else if (this.recycling.scrapCompositionObj && 
                 Object.keys(this.recycling.scrapCompositionObj).length > 0) {
        this.recycling.scrapComposition = new Map(
          Object.entries(this.recycling.scrapCompositionObj)
        );
      }

      // Validate returnedToManufacturingPercent bounds
      if (this.recycling.returnedToManufacturingPercent != null) {
        if (this.recycling.returnedToManufacturingPercent < 0 || 
            this.recycling.returnedToManufacturingPercent > 100) {
          throw new Error(
            `Recycling returnedToManufacturingPercent (${this.recycling.returnedToManufacturingPercent}%) ` +
            `must be between 0 and 100`
          );
        }
      }

      // Validate contaminationLevel bounds
      if (this.recycling.contaminationLevel != null) {
        if (this.recycling.contaminationLevel < 0 || this.recycling.contaminationLevel > 100) {
          throw new Error(
            `Recycling contaminationLevel (${this.recycling.contaminationLevel}%) must be between 0 and 100`
          );
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Create a new empty wizard workflow
 */
wizardWorkflowSchema.statics.createEmpty = async function(userId, metalType = 'Aluminium', name = null) {
  // Use default if metalType is not provided or invalid
  if (!metalType || metalType === 'null' || metalType === 'undefined') {
    metalType = 'Aluminium';
  }
  
  const workflowName = name || `${metalType} LCA Wizard - ${new Date().toLocaleDateString()}`;
  
  const baseWorkflow = {
    name: workflowName,
    userId,
    metalType,
    status: 'draft',
    currentStep: 0,
    completedSteps: [],
    tags: ['wizard', metalType.toLowerCase()]
  };

  // Initialize only relevant fields based on metalType
  if (metalType === 'Copper') {
    // Initialize empty copper fields to prevent aluminum fields from being created
    baseWorkflow.copperMining = {};
    baseWorkflow.copperBeneficiation = {};
    baseWorkflow.copperRefining = {};
    baseWorkflow.copperManufacturing = {};
    baseWorkflow.copperUsePhase = {};
    baseWorkflow.copperRecycling = {};
    baseWorkflow.copperValorization = {};
  } else {
    // Initialize empty aluminum fields (default)
    baseWorkflow.mining = {};
    baseWorkflow.beneficiation = {};
    baseWorkflow.refining = {};
    baseWorkflow.smelting = {};
    baseWorkflow.manufacturing = {};
    baseWorkflow.recycling = {};
    baseWorkflow.valorization = {};
  }
  
  return await this.create(baseWorkflow);
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
  
  this.currentStep = 6;
  // this.status = 'completed'; // Removed: Keep as draft even when all steps filled
  return this.save();
};

/**
 * Update a specific step's data
 */
wizardWorkflowSchema.methods.updateStep = function(stepName, data) {
  // Valid steps for aluminum
  const aluminumSteps = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];
  
  // Valid steps for copper (different naming convention) - 7 stages
  const copperSteps = ['copperMining', 'copperBeneficiation', 'copperRefining', 'copperManufacturing', 'copperUsePhase', 'copperRecycling', 'copperValorization'];
  
  const validSteps = this.metalType === 'Copper' ? copperSteps : aluminumSteps;
  
  if (!validSteps.includes(stepName)) {
    throw new Error(`Invalid step name: ${stepName} for metal type: ${this.metalType}`);
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

/**
 * Update circular flow logic during a manufacturing iteration
 * 
 * @param {Object} iterationData - Data for the current circular iteration
 * @param {Map|Object} iterationData.recycledScrapComposition - Composition of recycled scrap (Map or Object)
 * @param {Number} iterationData.recycledScrapProportion - Percentage of recycled scrap (0-100)
 * @param {String} iterationData.scrapQualityGrade - Quality grade (A, B, C, mixed, unknown)
 * @param {Number} [iterationData.energyUsed=0] - Energy consumed in this iteration
 * @param {Number} [iterationData.emissionsGenerated=0] - Emissions generated in this iteration
 * @param {String} [iterationData.notes] - Optional notes for this iteration
 * @returns {Promise<Document>} Updated workflow document
 */
wizardWorkflowSchema.methods.updateCircularFlow = async function(iterationData) {
  // Validate required parameters
  if (!iterationData || typeof iterationData !== 'object') {
    throw new Error('iterationData is required and must be an object');
  }

  if (iterationData.recycledScrapProportion == null) {
    throw new Error('recycledScrapProportion is required');
  }

  if (iterationData.recycledScrapProportion < 0 || iterationData.recycledScrapProportion > 100) {
    throw new Error('recycledScrapProportion must be between 0 and 100');
  }

  // Initialize manufacturing if not exists
  if (!this.manufacturing) {
    this.manufacturing = {};
  }

  // ============================================================================
  // STEP 1: Increment circular iteration number
  // ============================================================================
  this.manufacturing.circularIterationNumber = (this.manufacturing.circularIterationNumber || 0) + 1;

  // ============================================================================
  // STEP 2: Update recycled scrap composition (Map and Object formats)
  // ============================================================================
  const scrapComposition = iterationData.recycledScrapComposition;
  
  if (scrapComposition) {
    // Handle Map input
    if (scrapComposition instanceof Map) {
      this.manufacturing.recycledScrapComposition = new Map(scrapComposition);
      this.manufacturing.recycledScrapCompositionObj = Object.fromEntries(scrapComposition);
    }
    // Handle Object input
    else if (typeof scrapComposition === 'object') {
      this.manufacturing.recycledScrapCompositionObj = { ...scrapComposition };
      this.manufacturing.recycledScrapComposition = new Map(Object.entries(scrapComposition));
    }
  } else {
    // Set empty composition if not provided
    this.manufacturing.recycledScrapComposition = new Map();
    this.manufacturing.recycledScrapCompositionObj = {};
  }

  // ============================================================================
  // STEP 3: Update recycled and primary proportions
  // ============================================================================
  this.manufacturing.recycledScrapProportion = iterationData.recycledScrapProportion;
  this.manufacturing.primarySourceProportion = 100 - iterationData.recycledScrapProportion;

  // ============================================================================
  // STEP 4: Calculate blended composition (primary + recycled)
  // ============================================================================
  const primaryFraction = this.manufacturing.primarySourceProportion / 100;
  const recycledFraction = this.manufacturing.recycledScrapProportion / 100;

  // Get primary composition (assume 100% primary metal if not specified)
  const metalType = this.metalType || 'Al';
  const primaryComposition = new Map([[metalType, 100]]);

  // Get recycled composition
  const recycledComposition = this.manufacturing.recycledScrapComposition || new Map();

  // Calculate blended composition
  const blendedComposition = new Map();

  // Add all metals from primary composition
  for (const [metal, value] of primaryComposition.entries()) {
    const recycledValue = recycledComposition.get(metal) || 0;
    const blendedValue = primaryFraction * value + recycledFraction * recycledValue;
    if (blendedValue > 0) {
      blendedComposition.set(metal, blendedValue);
    }
  }

  // Add metals that exist only in recycled composition
  for (const [metal, value] of recycledComposition.entries()) {
    if (!blendedComposition.has(metal)) {
      const blendedValue = recycledFraction * value;
      if (blendedValue > 0) {
        blendedComposition.set(metal, blendedValue);
      }
    }
  }

  // Normalize to 100% (handle rounding errors)
  const total = Array.from(blendedComposition.values()).reduce((sum, val) => sum + val, 0);
  if (total > 0 && Math.abs(total - 100) > 0.01) {
    for (const [metal, value] of blendedComposition.entries()) {
      blendedComposition.set(metal, (value / total) * 100);
    }
  }

  // Update blended composition in both formats
  this.manufacturing.blendedComposition = blendedComposition;
  this.manufacturing.blendedCompositionObj = Object.fromEntries(blendedComposition);

  // ============================================================================
  // STEP 5: Add entry to recycling history
  // ============================================================================
  if (!this.manufacturing.recyclingHistory) {
    this.manufacturing.recyclingHistory = [];
  }

  const historyEntry = {
    iterationNumber: this.manufacturing.circularIterationNumber,
    timestamp: new Date(),
    scrapComposition: new Map(this.manufacturing.recycledScrapComposition),
    scrapCompositionObj: { ...this.manufacturing.recycledScrapCompositionObj },
    scrapProportion: iterationData.recycledScrapProportion,
    scrapQualityGrade: iterationData.scrapQualityGrade || 'unknown',
    energyUsed: iterationData.energyUsed ?? 0,
    emissionsGenerated: iterationData.emissionsGenerated ?? 0,
    notes: iterationData.notes || ''
  };

  this.manufacturing.recyclingHistory.push(historyEntry);

  // ============================================================================
  // STEP 6: Set circular input flag
  // ============================================================================
  this.manufacturing.isCircularInput = iterationData.recycledScrapProportion > 0;

  // Mark manufacturing as modified to ensure Mongoose saves nested changes
  this.markModified('manufacturing');

  // ============================================================================
  // STEP 7: Save the document
  // ============================================================================
  return await this.save();
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



// ===================== pre-save hook here =====================
wizardWorkflowSchema.pre('save', function(next) {
  if (!this.manufacturing || Object.keys(this.manufacturing).length === 0) {
    return next();
  }

  const recycledProp = this.manufacturing.recycledScrapProportion;
  const primaryProp = this.manufacturing.primarySourceProportion;

  if (recycledProp != null && primaryProp != null) {
    if (recycledProp + primaryProp !== 100) {
      return next(new Error('Recycled + Primary proportions must sum to 100'));
    }
  }

  next();
});
// ===================================================================

// ============================================================================
// MODEL EXPORT
// ============================================================================

const WizardWorkflow = mongoose.model('WizardWorkflow', wizardWorkflowSchema);

module.exports = WizardWorkflow;
