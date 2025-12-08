/**
 * Copper-Specific Stage Schemas
 * 
 * Defines the data structure for copper LCA stages based on the provided parameters.
 * These schemas are merged into WizardWorkflow when metalType = 'Copper'
 * 
 * @module models/schemas/copperStages
 */

/**
 * Copper Mining Stage Schema
 * Covers extraction, material balance, energy, water, and emissions for copper sites
 */
const copperMiningSchema = {
  // Geology & Site Fundamentals
  miningMethod: {
    type: String,
    enum: ['open-pit', 'underground', 'ISL', 'solution extraction']
  },
  oreType: {
    type: String,
    enum: ['oxide', 'sulfide']
  },
  oreGradePercentCu: { type: Number }, // % Cu
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
};

/**
 * Copper Beneficiation Stage Schema
 * Covers ore concentration, flotation, and tailings management
 */
const copperBeneficiationSchema = {
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
};

/**
 * Copper Use Phase Stage Schema
 * Covers product application, performance, maintenance, and operational impacts
 */
const copperUsePhaseSchema = {
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
  ghgAvoidedPerUnit: Number, // kg CO₂e avoided
  reusePotentialPercent: Number, // %
  energyReturnOnInvestment: Number, // ratio
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
};

/**
 * Copper Valorization Stage Schema
 * Covers waste recovery, by-product utilization, and circular economy metrics
 */
const copperValorizationSchema = {
  // Waste and By-Product Characteristics
  wasteType: {
    type: String,
    enum: ['slag', 'tailings', 'dust', 'acidic_effluent', 'other']
  },
  wasteGeneration: Number, // kg/t Cu
  metalContentInWaste: Number, // % metal
  chemicalCompositionFeO: Number, // % FeO
  chemicalCompositionSiO2: Number, // % SiO₂
  chemicalCompositionCuO: Number, // % CuO
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
  leachateToxicityIndex: Number, // score
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
};

/**
 * Copper Refining Stage Schema
 * Covers electrorefining to produce high-purity copper cathodes
 */
const copperRefiningSchema = {
  // Process Configuration
  refiningMethod: {
    type: String,
    enum: ['electrorefining', 'electrowinning', 'fire_refining', 'combined']
  },
  anodeGradePercentCu: Number, // % Cu in anode
  cathodeGradePercentCu: Number, // % Cu in cathode (typically 99.99%)
  refineryCapacityTonnesPerYear: Number, // t/year
  cellVoltage: Number, // volts
  currentDensityAmpPerM2: Number, // A/m²

  // Electrolyte & Chemistry
  electrolyteComposition: String, // e.g., "CuSO₄-H₂SO₄"
  sulfuricAcidConcentrationGPerL: Number, // g/L H₂SO₄
  copperConcentrationGPerL: Number, // g/L Cu²⁺
  electrolyteTemperatureCelsius: Number, // °C
  additiveConsumptionKgPerTonne: Number, // kg/t Cu (glue, thiourea, etc.)

  // Energy & Efficiency
  electricityConsumptionKwhPerTonne: Number, // kWh/t Cu
  currentEfficiencyPercent: Number, // %
  cathodeRecoveryYieldPercent: Number, // %
  cycleTimeHours: Number, // hours per batch

  // Environmental & Waste
  anodeSlimesKgPerTonne: Number, // kg/t Cu (precious metals-rich)
  preciousMetalsInSlimesPercent: Number, // % Au+Ag in slimes
  electrolytePurgeWaterM3PerTonne: Number, // m³/t Cu
  wastewaterTreatmentType: {
    type: String,
    enum: ['precipitation', 'ion_exchange', 'membrane', 'none']
  },
  particulateEmissionsKgPerTonne: Number, // kg PM/t Cu
  acidMistEmissionsKgPerTonne: Number, // kg H₂SO₄ mist/t Cu

  // Operations & Economics
  cellHouseUtilizationPercent: Number, // % uptime
  anodeLifetimeCycles: Number,
  cathodeQualityGrade: {
    type: String,
    enum: ['Grade_A', 'Grade_B', 'off_spec']
  },
  refiningCostUsdPerTonne: Number, // USD/t Cu
  electricityCostUsdPerKwh: Number, // USD/kWh
  laborCostUsdPerTonne: Number, // USD/t Cu

  // By-products
  goldRecoveryKgPerTonne: Number, // kg Au/t Cu anode
  silverRecoveryKgPerTonne: Number, // kg Ag/t Cu anode
  seleniumRecoveryKgPerTonne: Number, // kg Se/t Cu anode
  telluriumRecoveryKgPerTonne: Number, // kg Te/t Cu anode
  byproductRevenueUsdPerTonne: Number, // USD/t Cu

  // AI Predicted Fields
  refining_energy_kWh_per_t_Cu: { type: Number, default: null },
  refining_cathode_purity_percent: { type: Number, default: null },
  refining_precious_metals_recovery_percent: { type: Number, default: null },
  refining_wastewater_m3_per_t_Cu: { type: Number, default: null },

  // Sustainability Parameters
  followingSustainableRules: { type: Boolean, default: null },
  sustainabilityParameters: {
    // Pyrometallurgical Route Parameters
    pyro_renewablePowerPercent: { type: Number, default: null },
    pyro_slagRecyclingRate: { type: Number, default: null },
    pyro_so2CaptureIntoSulfuricAcid: { type: Boolean, default: null },
    pyro_flueGasCleaning: {
      type: String,
      enum: ['Basic', 'Baghouse', 'Wet Scrubber', 'Advanced Hybrid'],
      default: null
    },
    pyro_wasteHeatCapturePercent: { type: Number, default: null },
    
    // Hydrometallurgical Route Parameters
    hydro_acidRecoveryPercent: { type: Number, default: null },
    hydro_organicSolventRecovery: { type: Number, default: null },
    hydro_renewableElectricityUseInElectrowinning: { type: Number, default: null },
    hydro_recycledWaterRate: { type: Number, default: null }
  }
};

/**
 * Copper Manufacturing Stage Schema
 * Covers fabrication, forming, and product creation from copper cathodes
 */
const copperManufacturingSchema = {
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
  totalEnergyKwhPerTonne: Number, // kWh/t total
  fuelType: {
    type: String,
    enum: ['electric', 'natural_gas', 'oil', 'mixed']
  },

  // Material Efficiency
  yieldPercent: Number, // % of input becoming product
  scrapGenerationPercent: Number, // % material lost as scrap
  scrapRecyclingRatePercent: Number, // % of scrap recycled internally
  secondaryCopperContentPercent: Number, // % recycled Cu in input

  // Surface Treatment & Finishing
  surfaceTreatment: [{
    type: String,
    enum: ['polishing', 'coating', 'plating', 'oxidation', 'none']
  }],
  chemicalConsumptionKgPerTonne: Number, // kg/t for treatments
  waterConsumptionM3PerTonne: Number, // m³/t

  // Emissions & Environmental
  co2EmissionsKgPerTonne: Number, // kg CO₂/t product
  vocEmissionsKgPerTonne: Number, // kg VOC/t
  wastewaterM3PerTonne: Number, // m³/t
  solidWasteKgPerTonne: Number, // kg/t

  // Transport & Distribution
  transportDistanceKm: Number, // km to customer
  transportMode: {
    type: String,
    enum: ['truck', 'rail', 'ship', 'mixed']
  },
  packagingMaterialKgPerTonne: Number, // kg/t product

  // Operations & Economics
  plantCapacityTonnesPerYear: Number, // t/year
  utilizationPercent: Number, // %
  manufacturingCostUsdPerTonne: Number, // USD/t
  laborCostUsdPerTonne: Number, // USD/t
  maintenanceCostPercent: Number, // % of capital

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
};

/**
 * Copper Recycling Stage Schema
 * Covers end-of-life collection, sorting, and reprocessing
 */
const copperRecyclingSchema = {
  // Collection & Source
  scrapSource: [{
    type: String,
    enum: ['industrial', 'construction', 'electronics', 'automotive', 'wire_cable', 'household', 'other']
  }],
  scrapSourceOther: String,
  collectionRatePercent: Number, // % of available scrap collected
  scrapGrade: {
    type: String,
    enum: ['No1_copper', 'No2_copper', 'mixed', 'low_grade']
  },
  copperContentPercent: Number, // % Cu in scrap

  // Sorting & Preparation
  sortingMethod: [{
    type: String,
    enum: ['manual', 'magnetic', 'eddy_current', 'density', 'optical', 'xrf']
  }],
  sortingEfficiencyPercent: Number, // %
  contaminationLevelPercent: Number, // % impurities
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
  recoveryYieldPercent: Number, // % Cu recovered from scrap

  // Product & Quality
  outputQuality: {
    type: String,
    enum: ['cathode_grade', 'alloy_grade', 'ingot', 'granules']
  },
  copperPurityPercent: Number, // % Cu in output
  alloyingRequired: {
    type: Boolean,
    default: false
  },

  // Environmental Impact
  energySavingsVsPrimaryPercent: Number, // % energy saved vs primary production
  co2SavedKgPerTonne: Number, // kg CO₂/t saved vs primary
  waterConsumptionM3PerTonne: Number, // m³/t
  drossGenerationKgPerTonne: Number, // kg/t waste
  emissionsKgCo2ePerTonne: Number, // kg CO₂e/t recycling

  // Economics
  scrapPurchaseCostUsdPerTonne: Number, // USD/t scrap
  processingCostUsdPerTonne: Number, // USD/t
  outputValueUsdPerTonne: Number, // USD/t recycled Cu
  profitMarginPercent: Number, // %

  // Circularity Metrics
  closedLoopPercent: Number, // % going back to same application
  openLoopPercent: Number, // % going to different application
  downcyclingPercent: Number, // % going to lower-value use
  landfillDiversionPercent: Number, // % diverted from landfill

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
};

module.exports = {
  copperMiningSchema,
  copperBeneficiationSchema,
  copperRefiningSchema,
  copperManufacturingSchema,
  copperUsePhaseSchema,
  copperRecyclingSchema,
  copperValorizationSchema
};
