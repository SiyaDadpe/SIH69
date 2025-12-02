/**
 * Process Default Parameters
 * Contains default parameter configurations for all process types
 */

// Steel Process Defaults
export const steelProcessDefaults = {
  // Stage 1: Extraction (Mining) - Matches wizard mining form
  openPitMining: {
    location: '',
    year: 2024,
    oreGrade: 40,
    overburdenRatio: 2.5,
    typeOfEquipment: 'diesel',
    waterUsage: 0.5,
    biodiversityImpact: 'moderate',
    redMudGeneration: 100
  },
  stripMining: {
    location: '',
    year: 2024,
    oreGrade: 35,
    overburdenRatio: 3.0,
    typeOfEquipment: 'diesel',
    waterUsage: 0.4,
    biodiversityImpact: 'high',
    redMudGeneration: 90
  },
  drillingBlasting: {
    location: '',
    year: 2024,
    oreGrade: 45,
    overburdenRatio: 2.0,
    typeOfEquipment: 'diesel',
    waterUsage: 0.3,
    biodiversityImpact: 'moderate',
    redMudGeneration: 80
  },
  hydraulicMining: {
    location: '',
    year: 2024,
    oreGrade: 30,
    overburdenRatio: 1.5,
    typeOfEquipment: 'electric',
    waterUsage: 2.0,
    biodiversityImpact: 'low',
    redMudGeneration: 60
  },
  manualExtraction: {
    location: '',
    year: 2024,
    oreGrade: 25,
    overburdenRatio: 1.0,
    typeOfEquipment: 'diesel',
    waterUsage: 0.2,
    biodiversityImpact: 'low',
    redMudGeneration: 50
  },
  electricShovel: {
    location: '',
    year: 2024,
    oreGrade: 42,
    overburdenRatio: 2.8,
    typeOfEquipment: 'electric',
    waterUsage: 0.4,
    biodiversityImpact: 'moderate',
    redMudGeneration: 95
  },
  dieselHaulTrucks: {
    location: '',
    year: 2024,
    oreGrade: 38,
    overburdenRatio: 2.3,
    typeOfEquipment: 'diesel',
    waterUsage: 0.35,
    biodiversityImpact: 'moderate',
    redMudGeneration: 85
  },
  inSituLeaching: {
    location: '',
    year: 2024,
    oreGrade: 20,
    overburdenRatio: 0.5,
    typeOfEquipment: 'electric',
    waterUsage: 1.5,
    biodiversityImpact: 'low',
    redMudGeneration: 40
  },
  inSitu: {
    location: '',
    year: 2024,
    oreGrade: 20,
    overburdenRatio: 0.5,
    typeOfEquipment: 'electric',
    waterUsage: 1.5,
    biodiversityImpact: 'low',
    redMudGeneration: 40
  },
  others: {
    location: '',
    year: 2024,
    oreGrade: 30,
    overburdenRatio: 2.0,
    typeOfEquipment: 'diesel',
    waterUsage: 0.5,
    biodiversityImpact: 'moderate',
    redMudGeneration: 70
  },

  // Stage 2: Processing (Beneficiation) - Matches wizard beneficiation form
  crushing: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.3,
    electricityUse: 15,
    beneficiationEfficiency: 85,
    crushingStage: '',
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  grinding: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.5,
    electricityUse: 25,
    beneficiationEfficiency: 80,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  washingScreening: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 1.0,
    electricityUse: 10,
    beneficiationEfficiency: 75,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  magneticSeparation: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.2,
    electricityUse: 20,
    beneficiationEfficiency: 90,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  gravitySeparation: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.8,
    electricityUse: 12,
    beneficiationEfficiency: 85,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  flotationMethods: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 1.5,
    electricityUse: 18,
    beneficiationEfficiency: 88,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  drySeparation: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.1,
    electricityUse: 15,
    beneficiationEfficiency: 75,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  others: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.5,
    electricityUse: 15,
    beneficiationEfficiency: 80,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },

  // Stage 3: Refining - Matches wizard refining form
  crushing_refining: {
    energyUse: 12000,
    waterUse: 2.5,
    redMudGen: 1000,
    causticSoda: 120,
    limeAdditives: 50,
    so2: 0.8,
    nox: 0.5,
    dust: 10,
    toxicity: ''
  },
  clarification: {
    energyUse: 8000,
    waterUse: 3.0,
    redMudGen: 1200,
    causticSoda: 100,
    limeAdditives: 40,
    so2: 0.6,
    nox: 0.4,
    dust: 8,
    toxicity: ''
  },
  calcination: {
    energyUse: 15000,
    waterUse: 1.5,
    redMudGen: 900,
    causticSoda: 80,
    limeAdditives: 30,
    so2: 1.2,
    nox: 0.8,
    dust: 15,
    toxicity: ''
  },
  digestion_refining: {
    energyUse: 10000,
    waterUse: 4.0,
    redMudGen: 1100,
    causticSoda: 150,
    limeAdditives: 60,
    so2: 0.7,
    nox: 0.6,
    dust: 12,
    toxicity: ''
  },
  precipitation: {
    energyUse: 9000,
    waterUse: 2.8,
    redMudGen: 1000,
    causticSoda: 90,
    limeAdditives: 45,
    so2: 0.5,
    nox: 0.3,
    dust: 9,
    toxicity: ''
  },
  others_refining: {
    energyUse: 11000,
    waterUse: 3.0,
    redMudGen: 1050,
    causticSoda: 110,
    limeAdditives: 50,
    so2: 0.7,
    nox: 0.5,
    dust: 11,
    toxicity: ''
  },

  // Stage 4: Smelting - Matches wizard smelting form
  preBakingAnodes: {
    electricityDemand: 14000,
    co2Emissions: 2000,
    cellTechnology: 'Pre-baked',
    pfcEmissions: 0.8,
    so2: 1.5,
    nox: 0.9,
    fluorideRecovery: 70,
    thermalRecovery: 60
  },
  anodeEffectControl: {
    electricityDemand: 13500,
    co2Emissions: 1900,
    cellTechnology: 'Pre-baked',
    pfcEmissions: 0.7,
    so2: 1.4,
    nox: 0.8,
    fluorideRecovery: 75,
    thermalRecovery: 65
  },
  offGasTreatment: {
    electricityDemand: 13000,
    co2Emissions: 1800,
    cellTechnology: 'Pre-baked',
    pfcEmissions: 0.6,
    so2: 1.2,
    nox: 0.7,
    fluorideRecovery: 80,
    thermalRecovery: 70
  },
  electrolysis: {
    electricityDemand: 15000,
    co2Emissions: 2200,
    cellTechnology: 'Pre-baked',
    pfcEmissions: 1.0,
    so2: 1.8,
    nox: 1.0,
    fluorideRecovery: 65,
    thermalRecovery: 55
  },
  bathChemistry: {
    electricityDemand: 14500,
    co2Emissions: 2100,
    cellTechnology: 'Pre-baked',
    pfcEmissions: 0.9,
    so2: 1.6,
    nox: 0.95,
    fluorideRecovery: 68,
    thermalRecovery: 58
  },
  others_smelting: {
    electricityDemand: 14000,
    co2Emissions: 2000,
    cellTechnology: 'Pre-baked',
    pfcEmissions: 0.85,
    so2: 1.5,
    nox: 0.9,
    fluorideRecovery: 70,
    thermalRecovery: 60
  },

  // Stage 5: Manufacturing - Matches wizard manufacturing form
  casting: {
    scrapRate: 5,
    recycledContent: 30,
    energyUsePerStep: 980,
    fabricationEmissions: 120,
    transportDistance: 120,
    transportMode: 'Road',
    transportEmissionsPerTkm: 0.08
  },
  extrusion: {
    scrapRate: 8,
    recycledContent: 25,
    energyUsePerStep: 1200,
    fabricationEmissions: 150,
    transportDistance: 100,
    transportMode: 'Road',
    transportEmissionsPerTkm: 0.08
  },
  surfaceTreatment: {
    scrapRate: 3,
    recycledContent: 20,
    energyUsePerStep: 800,
    fabricationEmissions: 100,
    transportDistance: 80,
    transportMode: 'Road',
    transportEmissionsPerTkm: 0.08
  },
  designRecycling: {
    scrapRate: 4,
    recycledContent: 40,
    energyUsePerStep: 700,
    fabricationEmissions: 90,
    transportDistance: 150,
    transportMode: 'Road',
    transportEmissionsPerTkm: 0.08
  },
  rolling: {
    scrapRate: 6,
    recycledContent: 35,
    energyUsePerStep: 1100,
    fabricationEmissions: 130,
    transportDistance: 110,
    transportMode: 'Rail',
    transportEmissionsPerTkm: 0.05
  },
  forging: {
    scrapRate: 10,
    recycledContent: 28,
    energyUsePerStep: 1300,
    fabricationEmissions: 160,
    transportDistance: 90,
    transportMode: 'Road',
    transportEmissionsPerTkm: 0.08
  },
  joining: {
    scrapRate: 7,
    recycledContent: 22,
    energyUsePerStep: 900,
    fabricationEmissions: 110,
    transportDistance: 70,
    transportMode: 'Road',
    transportEmissionsPerTkm: 0.08
  },
  others_manufacturing: {
    scrapRate: 6,
    recycledContent: 30,
    energyUsePerStep: 1000,
    fabricationEmissions: 120,
    transportDistance: 100,
    transportMode: 'Road',
    transportEmissionsPerTkm: 0.08
  },

  // Stage 6: Recycling - Matches wizard recycling form
  collection: {
    scrapInputPercent: 60,
    collectionRatePercent: 75,
    recyclingMethod: 'closed-loop',
    recoveryYieldPercent: 90,
    recyclingEfficiencyPercent: 85,
    closedLoopPercent: 70,
    openLoopPercent: 30,
    furnaceEnergyDemand: 2500,
    emissionSavings: 1800
  },
  cleaning: {
    scrapInputPercent: 55,
    collectionRatePercent: 70,
    recyclingMethod: 'closed-loop',
    recoveryYieldPercent: 88,
    recyclingEfficiencyPercent: 82,
    closedLoopPercent: 65,
    openLoopPercent: 35,
    furnaceEnergyDemand: 2300,
    emissionSavings: 1700
  },
  reAlloying: {
    scrapInputPercent: 58,
    collectionRatePercent: 72,
    recyclingMethod: 'mixed',
    recoveryYieldPercent: 89,
    recyclingEfficiencyPercent: 84,
    closedLoopPercent: 60,
    openLoopPercent: 40,
    furnaceEnergyDemand: 2400,
    emissionSavings: 1750
  },
  sorting: {
    scrapInputPercent: 62,
    collectionRatePercent: 78,
    recyclingMethod: 'closed-loop',
    recoveryYieldPercent: 91,
    recyclingEfficiencyPercent: 87,
    closedLoopPercent: 75,
    openLoopPercent: 25,
    furnaceEnergyDemand: 2600,
    emissionSavings: 1850
  },
  remelting: {
    scrapInputPercent: 65,
    collectionRatePercent: 80,
    recyclingMethod: 'closed-loop',
    recoveryYieldPercent: 92,
    recyclingEfficiencyPercent: 88,
    closedLoopPercent: 80,
    openLoopPercent: 20,
    furnaceEnergyDemand: 2700,
    emissionSavings: 1900
  },
  castingNew: {
    scrapInputPercent: 63,
    collectionRatePercent: 76,
    recyclingMethod: 'mixed',
    recoveryYieldPercent: 90,
    recyclingEfficiencyPercent: 86,
    closedLoopPercent: 68,
    openLoopPercent: 32,
    furnaceEnergyDemand: 2550,
    emissionSavings: 1800
  },
  others_recycling: {
    scrapInputPercent: 60,
    collectionRatePercent: 75,
    recyclingMethod: 'mixed',
    recoveryYieldPercent: 89,
    recyclingEfficiencyPercent: 85,
    closedLoopPercent: 70,
    openLoopPercent: 30,
    furnaceEnergyDemand: 2500,
    emissionSavings: 1800
  },

  // Stage 7: Valorization - Matches wizard valorization form
  redMud: {
    wasteUtilizationOverallPercent: 45,
    emissionReductionsPerTonne: 210,
    redMudUtilized: 50,
    redMudRecovery: 60,
    toxicityRedMud: 'moderate',
    groundwaterRedMud: 'moderate',
    econCementAdditive: 'moderate',
    ironExtractionEconomicViability: 'moderate'
  },
  spl: {
    wasteUtilizationOverallPercent: 30,
    emissionReductionsPerTonne: 150,
    splUtilized: 35,
    splRecovery: 40,
    toxicitySPL: 'high',
    groundwaterSPL: 'high',
    econSPLEncapsulation: 'low'
  },
  dross: {
    wasteUtilizationOverallPercent: 55,
    emissionReductionsPerTonne: 250,
    drossUtilized: 60,
    drossRecovery: 70,
    toxicityDross: 'low',
    groundwaterDross: 'low',
    econDrossRecovery: 'high'
  },
  fluorideGases: {
    wasteUtilizationOverallPercent: 40,
    emissionReductionsPerTonne: 180,
    fluorideUtilized: 45,
    fluorideRecovery: 55,
    toxicityFluoride: 'moderate',
    groundwaterFluoride: 'moderate',
    econFluorideCapture: 'moderate'
  },
  slag: {
    wasteUtilizationOverallPercent: 50,
    emissionReductionsPerTonne: 220,
    slagUtilized: 55,
    slagRecovery: 65,
    toxicitySlag: 'low',
    groundwaterSlag: 'low',
    econSoilStabilization: 'high'
  },
  others_valorization: {
    wasteUtilizationOverallPercent: 40,
    emissionReductionsPerTonne: 200
  }
};

// Aluminum Process Defaults
export const aluminumProcessDefaults = {
  // Stage 1: Extraction (Mining) - Matches wizard mining form
  openPitMining: {
    location: '',
    year: 2024,
    oreGrade: 25,
    overburdenRatio: 3.5,
    typeOfEquipment: 'diesel',
    waterUsage: 0.04,
    biodiversityImpact: 'high',
    redMudGeneration: 150
  },
  stripMining: {
    location: '',
    year: 2024,
    oreGrade: 22,
    overburdenRatio: 4.0,
    typeOfEquipment: 'diesel',
    waterUsage: 0.035,
    biodiversityImpact: 'high',
    redMudGeneration: 140
  },
  drillingBlasting_alu: {
    location: '',
    year: 2024,
    oreGrade: 28,
    overburdenRatio: 2.8,
    typeOfEquipment: 'diesel',
    waterUsage: 0.03,
    biodiversityImpact: 'moderate',
    redMudGeneration: 120
  },
  hydraulicMining_alu: {
    location: '',
    year: 2024,
    oreGrade: 23,
    overburdenRatio: 2.0,
    typeOfEquipment: 'electric',
    waterUsage: 0.15,
    biodiversityImpact: 'low',
    redMudGeneration: 110
  },
  manualExtraction_alu: {
    location: '',
    year: 2024,
    oreGrade: 20,
    overburdenRatio: 1.5,
    typeOfEquipment: 'diesel',
    waterUsage: 0.02,
    biodiversityImpact: 'low',
    redMudGeneration: 100
  },
  electricShovel_alu: {
    location: '',
    year: 2024,
    oreGrade: 26,
    overburdenRatio: 3.2,
    typeOfEquipment: 'electric',
    waterUsage: 0.045,
    biodiversityImpact: 'moderate',
    redMudGeneration: 145
  },
  dieselHaulTrucks_alu: {
    location: '',
    year: 2024,
    oreGrade: 24,
    overburdenRatio: 3.0,
    typeOfEquipment: 'diesel',
    waterUsage: 0.04,
    biodiversityImpact: 'moderate',
    redMudGeneration: 135
  },
  inSituLeaching_alu: {
    location: '',
    year: 2024,
    oreGrade: 18,
    overburdenRatio: 0.5,
    typeOfEquipment: 'electric',
    waterUsage: 0.2,
    biodiversityImpact: 'low',
    redMudGeneration: 80
  },
  others_alu: {
    location: '',
    year: 2024,
    oreGrade: 22,
    overburdenRatio: 3.0,
    typeOfEquipment: 'diesel',
    waterUsage: 0.05,
    biodiversityImpact: 'moderate',
    redMudGeneration: 130
  },

  // Stage 2: Processing
  crushing: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.3,
    electricityUse: 15,
    beneficiationEfficiency: 85,
    crushingStage: '',
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  grinding: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.5,
    electricityUse: 25,
    beneficiationEfficiency: 80,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  magneticSeparation: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.2,
    electricityUse: 20,
    beneficiationEfficiency: 90,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  washingScreening: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 1.0,
    electricityUse: 10,
    beneficiationEfficiency: 75,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  gravitySeparation: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.8,
    electricityUse: 12,
    beneficiationEfficiency: 85,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  drySeparation: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.1,
    electricityUse: 15,
    beneficiationEfficiency: 75,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  flotationMethods: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 1.5,
    electricityUse: 18,
    beneficiationEfficiency: 88,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },
  others: {
    location: '',
    oreFeedRate: 200,
    waterConsumption: 0.5,
    electricityUse: 15,
    beneficiationEfficiency: 80,
    tailings: '',
    noiseLevel: '',
    dustLevel: ''
  },

  // Stage 3: Alumina Refining - Matches wizard refining form
  crushing: {
    energyUse: 0,
    waterUse: 0,
    redMudGen: 0,
    causticSoda: 0,
    limeAdditives: 0,
    so2: 0,
    nox: 0,
    dust: 0,
    toxicity: ''
  },
  clarification: {
    energyUse: 0,
    waterUse: 0,
    redMudGen: 0,
    causticSoda: 0,
    limeAdditives: 0,
    so2: 0,
    nox: 0,
    dust: 0,
    toxicity: ''
  },
  calcination: {
    energyUse: 0,
    waterUse: 0,
    redMudGen: 0,
    causticSoda: 0,
    limeAdditives: 0,
    so2: 0,
    nox: 0,
    dust: 0,
    toxicity: ''
  },
  digestion: {
    energyUse: 0,
    waterUse: 0,
    redMudGen: 0,
    causticSoda: 0,
    limeAdditives: 0,
    so2: 0,
    nox: 0,
    dust: 0,
    toxicity: ''
  },
  precipitation: {
    energyUse: 0,
    waterUse: 0,
    redMudGen: 0,
    causticSoda: 0,
    limeAdditives: 0,
    so2: 0,
    nox: 0,
    dust: 0,
    toxicity: ''
  },
  others: {
    energyUse: 0,
    waterUse: 0,
    redMudGen: 0,
    causticSoda: 0,
    limeAdditives: 0,
    so2: 0,
    nox: 0,
    dust: 0,
    toxicity: ''
  },

  // Stage 4: Smelting - Matches wizard smelting form
  preBakingAnodes: {
    electricityDemand: 0,
    co2Emissions: 0,
    cellTechnology: '',
    pfcEmissions: 0,
    so2: 0,
    nox: 0,
    fluorideRecovery: 0,
    thermalRecovery: 0
  },
  anodeEffectControl: {
    electricityDemand: 0,
    co2Emissions: 0,
    cellTechnology: '',
    pfcEmissions: 0,
    so2: 0,
    nox: 0,
    fluorideRecovery: 0,
    thermalRecovery: 0
  },
  offGasTreatment: {
    electricityDemand: 0,
    co2Emissions: 0,
    cellTechnology: '',
    pfcEmissions: 0,
    so2: 0,
    nox: 0,
    fluorideRecovery: 0,
    thermalRecovery: 0
  },
  electrolysis: {
    electricityDemand: 0,
    co2Emissions: 0,
    cellTechnology: '',
    pfcEmissions: 0,
    so2: 0,
    nox: 0,
    fluorideRecovery: 0,
    thermalRecovery: 0
  },
  bathChemistry: {
    electricityDemand: 0,
    co2Emissions: 0,
    cellTechnology: '',
    pfcEmissions: 0,
    so2: 0,
    nox: 0,
    fluorideRecovery: 0,
    thermalRecovery: 0
  },
  others: {
    electricityDemand: 0,
    co2Emissions: 0,
    cellTechnology: '',
    pfcEmissions: 0,
    so2: 0,
    nox: 0,
    fluorideRecovery: 0,
    thermalRecovery: 0
  },

  // Stage 5: Manufacturing - Matches wizard manufacturing form
  casting: {
    scrapRate: 0,
    recycledContent: 0,
    energyUsePerStep: 0,
    fabricationEmissions: 0,
    transportDistance: 0,
    transportMode: '',
    transportEmissionsPerTkm: 0
  },
  extrusion: {
    scrapRate: 0,
    recycledContent: 0,
    energyUsePerStep: 0,
    fabricationEmissions: 0,
    transportDistance: 0,
    transportMode: '',
    transportEmissionsPerTkm: 0
  },
  surfaceTreatment: {
    scrapRate: 0,
    recycledContent: 0,
    energyUsePerStep: 0,
    fabricationEmissions: 0,
    transportDistance: 0,
    transportMode: '',
    transportEmissionsPerTkm: 0
  },
  designRecycling: {
    scrapRate: 0,
    recycledContent: 0,
    energyUsePerStep: 0,
    fabricationEmissions: 0,
    transportDistance: 0,
    transportMode: '',
    transportEmissionsPerTkm: 0
  },
  rolling: {
    scrapRate: 0,
    recycledContent: 0,
    energyUsePerStep: 0,
    fabricationEmissions: 0,
    transportDistance: 0,
    transportMode: '',
    transportEmissionsPerTkm: 0
  },
  forging: {
    scrapRate: 0,
    recycledContent: 0,
    energyUsePerStep: 0,
    fabricationEmissions: 0,
    transportDistance: 0,
    transportMode: '',
    transportEmissionsPerTkm: 0
  },
  joining: {
    scrapRate: 0,
    recycledContent: 0,
    energyUsePerStep: 0,
    fabricationEmissions: 0,
    transportDistance: 0,
    transportMode: '',
    transportEmissionsPerTkm: 0
  },
  others: {
    scrapRate: 0,
    recycledContent: 0,
    energyUsePerStep: 0,
    fabricationEmissions: 0,
    transportDistance: 0,
    transportMode: '',
    transportEmissionsPerTkm: 0
  },

  // Stage 6: Recycling - Matches wizard recycling form
  collection: {
    scrapInputPercent: 0,
    collectionRatePercent: 0,
    recyclingMethod: '',
    recoveryYieldPercent: 0,
    recyclingEfficiencyPercent: 0,
    closedLoopPercent: 0,
    openLoopPercent: 0,
    furnaceEnergyDemand: 0,
    emissionSavings: 0
  },
  cleaning: {
    scrapInputPercent: 0,
    collectionRatePercent: 0,
    recyclingMethod: '',
    recoveryYieldPercent: 0,
    recyclingEfficiencyPercent: 0,
    closedLoopPercent: 0,
    openLoopPercent: 0,
    furnaceEnergyDemand: 0,
    emissionSavings: 0
  },
  reAlloying: {
    scrapInputPercent: 0,
    collectionRatePercent: 0,
    recyclingMethod: '',
    recoveryYieldPercent: 0,
    recyclingEfficiencyPercent: 0,
    closedLoopPercent: 0,
    openLoopPercent: 0,
    furnaceEnergyDemand: 0,
    emissionSavings: 0
  },
  sorting: {
    scrapInputPercent: 0,
    collectionRatePercent: 0,
    recyclingMethod: '',
    recoveryYieldPercent: 0,
    recyclingEfficiencyPercent: 0,
    closedLoopPercent: 0,
    openLoopPercent: 0,
    furnaceEnergyDemand: 0,
    emissionSavings: 0
  },
  remelting: {
    scrapInputPercent: 0,
    collectionRatePercent: 0,
    recyclingMethod: '',
    recoveryYieldPercent: 0,
    recyclingEfficiencyPercent: 0,
    closedLoopPercent: 0,
    openLoopPercent: 0,
    furnaceEnergyDemand: 0,
    emissionSavings: 0
  },
  castingNew: {
    scrapInputPercent: 0,
    collectionRatePercent: 0,
    recyclingMethod: '',
    recoveryYieldPercent: 0,
    recyclingEfficiencyPercent: 0,
    closedLoopPercent: 0,
    openLoopPercent: 0,
    furnaceEnergyDemand: 0,
    emissionSavings: 0
  },
  others: {
    scrapInputPercent: 0,
    collectionRatePercent: 0,
    recyclingMethod: '',
    recoveryYieldPercent: 0,
    recyclingEfficiencyPercent: 0,
    closedLoopPercent: 0,
    openLoopPercent: 0,
    furnaceEnergyDemand: 0,
    emissionSavings: 0
  },

  // Stage 7: Valorization - Matches wizard valorization form
  redMud: {
    wasteUtilizationOverallPercent: 0,
    emissionReductionsPerTonne: 0,
    redMudUtilized: 0,
    redMudRecovery: 0,
    toxicityRedMud: '',
    groundwaterRedMud: '',
    econCementAdditive: '',
    ironExtractionEconomicViability: ''
  },
  spl: {
    wasteUtilizationOverallPercent: 0,
    emissionReductionsPerTonne: 0,
    splUtilized: 0,
    splRecovery: 0,
    toxicitySPL: '',
    groundwaterSPL: '',
    econSPLEncapsulation: ''
  },
  dross: {
    wasteUtilizationOverallPercent: 0,
    emissionReductionsPerTonne: 0,
    drossUtilized: 0,
    drossRecovery: 0,
    toxicityDross: '',
    groundwaterDross: '',
    econDrossRecovery: ''
  },
  fluorideGases: {
    wasteUtilizationOverallPercent: 0,
    emissionReductionsPerTonne: 0,
    fluorideUtilized: 0,
    fluorideRecovery: 0,
    toxicityFluoride: '',
    groundwaterFluoride: '',
    econFluorideCapture: ''
  },
  slag: {
    wasteUtilizationOverallPercent: 0,
    emissionReductionsPerTonne: 0,
    slagUtilized: 0,
    slagRecovery: 0,
    toxicitySlag: '',
    groundwaterSlag: '',
    econSoilStabilization: ''
  },
  others: {
    wasteUtilizationOverallPercent: 0,
    emissionReductionsPerTonne: 0
  }
};

export const getProcessDefaults = (metal, processTypeId) => {
  const defaultsMap = {
    steel: steelProcessDefaults,
    aluminum: aluminumProcessDefaults
  };

  const metalDefaults = defaultsMap[metal];
  if (!metalDefaults) return {};

  return metalDefaults[processTypeId] || {};
};

const getPlaceholder = (key) => {
  // Map parameter names to their placeholder examples
  const placeholders = {
    // Mining/Extraction
    oreGrade: 'e.g., 25',
    oreGradePercentCu: 'e.g., 0.85',
    overburdenRatio: 'e.g., 3.5',
    location: 'e.g., Chile, Atacama',
    depth: 'e.g., 350',
    waterUsage: 'e.g., 0.04',
    waterUse: 'e.g., 2.5',
    energyConsumption: 'e.g., 120000',
    energyUse: 'e.g., 12000',
    redMudGeneration: 'e.g., 150',
    redMudGen: 'e.g., 1000',
    // Beneficiation
    oreFeedRate: 'e.g., 200',
    crushingEnergy: 'e.g., 18.5',
    grindingEnergy: 'e.g., 45',
    recoveryRate: 'e.g., 87',
    tailingsManagement: 'e.g., Dry stacking',
    // Refining
    causticSoda: 'e.g., 90',
    lime: 'e.g., 40',
    temperature: 'e.g., 950',
    pressure: 'e.g., 2.5',
    // Smelting
    electricityDemand: 'e.g., 15000',
    co2Emissions: 'e.g., 1.5',
    cellTechnology: 'e.g., Hall-Héroult',
    anodeType: 'e.g., Prebaked',
    // Manufacturing
    rollingEnergy: 'e.g., 800',
    extrusionEnergy: 'e.g., 600',
    castingEnergy: 'e.g., 450',
    scrapRate: 'e.g., 15',
    recycledContent: 'e.g., 30',
    // Recycling
    collectionRate: 'e.g., 75',
    sortingEfficiency: 'e.g., 92',
    meltingEnergy: 'e.g., 3500',
    recoveryYield: 'e.g., 95',
    // Emissions
    so2Emissions: 'e.g., 0.7',
    noxEmissions: 'e.g., 0.9',
    dustEmissions: 'e.g., 0.2',
    particulateMatter: 'e.g., 0.5',
    // General
    transportDistance: 'e.g., 500',
    fuelConsumption: 'e.g., 250',
    biodiversityImpact: 'Select an option',
    landUse: 'e.g., 100'
  };
  
  return placeholders[key] || `Enter ${formatLabel(key).toLowerCase()}`;
};

export const getParameterConfig = (metal, processTypeId) => {
  // Return parameter configuration schema for dynamic form generation
  const defaults = getProcessDefaults(metal, processTypeId);
  
  return Object.keys(defaults).map(key => {
    const value = defaults[key];
    const type = typeof value;
    const required = isRequiredField(key);
    const placeholder = getPlaceholder(key);

    if (type === 'number') {
      return { name: key, type: 'number', default: value, label: formatLabel(key), required, placeholder };
    } else if (type === 'string') {
      // Check if it's a select option
      if (isSelectOption(key)) {
        return { name: key, type: 'select', default: value, options: getSelectOptions(key), label: formatLabel(key), required, placeholder: 'Select an option' };
      }
      return { name: key, type: 'text', default: value, label: formatLabel(key), required, placeholder };
    } else if (type === 'object') {
      return { name: key, type: 'object', default: value, label: formatLabel(key), required, placeholder };
    }
    
    return { name: key, type: 'text', default: value, label: formatLabel(key), required, placeholder };
  });
};

const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
};

const isRequiredField = (key) => {
  // Define fields that are required (based on wizard implementation)
  const requiredFields = [
    // Steel/Aluminum Mining (Step 1)
    'location', 'oreGrade',
    // Steel/Aluminum Beneficiation (Step 2)
    'oreFeedRate',
    // Refining (Step 3)
    'energyUse', 'waterUse', 'redMudGen',
    // Smelting (Step 4)
    'electricityDemand', 'co2Emissions', 'cellTechnology',
    // Manufacturing (Step 5)
    'scrapRate', 'transportDistance',
    // Recycling (Step 6)
    'scrapInputPercent', 'collectionRatePercent', 'recyclingMethod',
    // Valorization (Step 7)
    'wasteUtilizationOverallPercent'
  ];
  return requiredFields.includes(key);
};

const isSelectOption = (key) => {
  const selectFields = [
    'equipmentType', 'miningMethod', 'method', 'filterType', 'crusherType',
    'millType', 'landUse', 'fuelType', 'powerSource', 'leachingSolution',
    'explosiveType', 'blastPattern', 'rockFragmentation', 'sedimentControl',
    'safetyMeasures', 'rehabilitationPlan', 'flotationCellType', 'typeOfEquipment',
    'biodiversityImpact', 'crushingStage', 'tailings', 'noiseLevel', 'dustLevel',
    'oreType', 'waterSource', 'acidMineDrainageRisk', 'cellTechnology', 
    'recyclingMethod', 'transportMode', 'toxicity', 'toxicityRedMud', 'toxicitySPL',
    'toxicityDross', 'toxicityFluoride', 'toxicitySlag', 'groundwaterRedMud',
    'groundwaterSPL', 'groundwaterDross', 'groundwaterFluoride', 'groundwaterSlag',
    'econCementAdditive', 'econSoilStabilization', 'ironExtractionEconomicViability',
    'econRareEarthExtraction', 'econSPLEncapsulation', 'econDrossRecovery', 'econFluorideCapture'
  ];
  return selectFields.includes(key);
};

const getSelectOptions = (key) => {
  const optionsMap = {
    equipmentType: ['diesel', 'electric', 'hybrid'],
    typeOfEquipment: ['diesel', 'electric', 'hybrid'],
    miningMethod: ['open-pit', 'underground', 'ISL', 'solution extraction', 'conventional', 'block_caving', 'sub_level_caving', 'cut_and_fill'],
    method: ['jig', 'spiral', 'shaking_table', 'sx_ew', 'air_classifier'],
    filterType: ['disc', 'drum', 'pressure'],
    crusherType: ['jaw', 'gyratory', 'cone', 'impact'],
    millType: ['ball', 'sag', 'rod', 'sag_ball', 'vertical'],
    landUse: ['low', 'medium', 'high', 'very_high'],
    biodiversityImpact: ['low', 'moderate', 'high'],
    fuelType: ['natural_gas', 'coal', 'oil', 'biomass'],
    powerSource: ['grid', 'diesel', 'renewable'],
    leachingSolution: ['sulfuric_acid', 'cyanide', 'ammonia'],
    explosiveType: ['anfo', 'emulsion', 'dynamite'],
    blastPattern: ['grid', 'staggered', 'line'],
    rockFragmentation: ['fine', 'medium', 'coarse'],
    sedimentControl: ['settling_ponds', 'filters', 'none'],
    safetyMeasures: ['basic', 'standard', 'advanced'],
    rehabilitationPlan: ['none', 'partial', 'full'],
    crushingStage: ['primary', 'secondary', 'tertiary'],
    tailings: ['tailing_ponds', 'pipeline_transport', 'thickened_sludge', 'others'],
    noiseLevel: ['Low', 'Moderate', 'High'],
    dustLevel: ['Low', 'Moderate', 'High'],
    oreType: ['oxide', 'sulfide'],
    waterSource: ['ground', 'recycled', 'surface'],
    acidMineDrainageRisk: ['low', 'medium', 'high'],
    cellTechnology: ['Pre-baked', 'Soderberg', 'Inert Anode'],
    recyclingMethod: ['closed-loop', 'open-loop', 'mixed'],
    transportMode: ['Road', 'Rail', 'Sea', 'Air', 'Mixed', 'Others'],
    toxicity: ['Low', 'Moderate', 'High', 'Others'],
    toxicityRedMud: ['low', 'moderate', 'high', 'others'],
    toxicitySPL: ['low', 'moderate', 'high', 'others'],
    toxicityDross: ['low', 'moderate', 'high', 'others'],
    toxicityFluoride: ['low', 'moderate', 'high', 'others'],
    toxicitySlag: ['low', 'moderate', 'high', 'others'],
    groundwaterRedMud: ['low', 'moderate', 'high', 'others'],
    groundwaterSPL: ['low', 'moderate', 'high', 'others'],
    groundwaterDross: ['low', 'moderate', 'high', 'others'],
    groundwaterFluoride: ['low', 'moderate', 'high', 'others'],
    groundwaterSlag: ['low', 'moderate', 'high', 'others'],
    econCementAdditive: ['low', 'moderate', 'high'],
    econSoilStabilization: ['low', 'moderate', 'high'],
    ironExtractionEconomicViability: ['low', 'moderate', 'high'],
    econRareEarthExtraction: ['low', 'moderate', 'high'],
    econSPLEncapsulation: ['low', 'moderate', 'high'],
    econDrossRecovery: ['low', 'moderate', 'high'],
    econFluorideCapture: ['low', 'moderate', 'high']
  };
  return optionsMap[key] || [];
};

/**
 * Format parameter value for display
 */
export const formatParameterValue = (value, paramName) => {
  if (typeof value === 'number') {
    // Add appropriate units
    const lowerName = paramName.toLowerCase();
    if (lowerName.includes('temperature')) {
      return `${value}°C`;
    }
    if (lowerName.includes('percent') || lowerName.includes('grade')) {
      return `${value}%`;
    }
    if (lowerName.includes('energy') || lowerName.includes('power') || lowerName.includes('kwh')) {
      return `${value} kWh`;
    }
    if (lowerName.includes('water')) {
      return `${value} m³`;
    }
    if (lowerName.includes('pressure')) {
      return `${value} bar`;
    }
    if (lowerName.includes('flow')) {
      return `${value} m³/h`;
    }
    return value.toString();
  }
  
  if (typeof value === 'string') {
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  return value;
};
