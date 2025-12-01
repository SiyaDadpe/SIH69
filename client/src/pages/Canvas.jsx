import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  updateEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  Zap,
  Recycle,
  Factory,
  Settings,
  ChevronRight,
  TrendingUp,
  Wrench,
  Package,
  AlertTriangle,
  Pickaxe,
  Hammer,
  Droplet,
  HardHat,
  Truck,
  FlaskConical,
  CirclePlus,
  Cog,
  Sparkles,
  Magnet,
  Scale,
  Wind,
  Flame,
  Snowflake,
  Gem,
  Gauge,
  Cloud,
  Building2,
  TrendingDown,
  Sparkle,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Link,
  Eraser,
  Box,
  Boxes,
  Layers,
  Construction,
  Menu,
  X,
} from 'lucide-react';

const palette = {
  background: '#FFFFFF',
  sidebar: '#F3F2EC',
  cardBg: '#F3F2EC',
  border: '#E3DACB',
  cardBorder: '#E6DDCD',
  accent: '#C17A64',
  accentHover: '#AE6A53',
  neutralBadge: '#ECE2D2',
  neutralDarkText: '#5E5248',
  neutralLightText: '#836F62',
};

const CANVAS_PROJECT_STORAGE_KEY = 'canvasProjectSummary';

const processIcons = {
  openPitMining: Pickaxe,
  stripMining: Construction,
  drillingBlasting: Hammer,
  hydraulicMining: Droplet,
  manualExtraction: HardHat,
  electricShovel: Factory,
  dieselHaulTrucks: Truck,
  customExtraction: CirclePlus,
  copperOpenPitMining: Pickaxe,
  copperUndergroundMining: Pickaxe,
  copperISL: FlaskConical,
  copperSolutionExtraction: Droplet,
  copperCustomExtraction: CirclePlus,
  crushing: Hammer,
  grinding: Cog,
  washingScreening: Sparkles,
  magneticSeparation: Magnet,
  gravitySeparation: Scale,
  floatationMethod: Droplet,
  drySeparation: Wind,
  customProcessing: CirclePlus,
  copperCrushing: Hammer,
  copperFlotation: Droplet,
  copperThickening: Droplet,
  copperTailingsRecycling: Recycle,
  copperCustomProcessing: CirclePlus,
  aluminaCrushing: Hammer,
  digestion: FlaskConical,
  clarification: Gem,
  precipitation: Snowflake,
  calcination: Flame,
  otherRefining: CirclePlus,
  preBakingAnodes: Flame,
  electrolysis: Zap,
  anodeEffectControl: Gauge,
  bathChemistryManagement: FlaskConical,
  offGasTreatment: Cloud,
  othersPleaseSpecify: CirclePlus,
  copperSmelting: Flame,
  copperElectrorefining: Zap,
  copperLeaching: Droplet,
  copperElectrowinning: Zap,
  copperOthersSmelting: CirclePlus,
  casting: Building2,
  rolling: TrendingDown,
  extrusion: Wrench,
  forgingDF: Hammer,
  surfaceTreatment: Sparkle,
  joiningProcesses: Link,
  designForRecycling: Recycle,
  othersManufacturing: CirclePlus,
  copperSemiFabrication: Building2,
  copperCasting: Building2,
  copperRolling: TrendingDown,
  copperOthersManufacturing: CirclePlus,
  usePhase: Zap,
  collection: Trash2,
  sorting: Package,
  cleaning: Eraser,
  remelting: Flame,
  realloying: FlaskConical,
  castingIntoNewProducts: Box,
  othersRecycling: CirclePlus,
  copperCollection: Trash2,
  copperSorting: Package,
  copperCleaning: Eraser,
  copperRemelting: Flame,
  copperOthersRecycling: CirclePlus,
  redMudValorization: Boxes,
  spentPotLiningTreatment: Zap,
  drossRecovery: Gem,
  fluorideGasRecovery: Cloud,
  slagUtilization: Layers,
  otherWasteValorization: CirclePlus,
  copperWasteValorization: Boxes,
  copperSlagUtilization: Layers,
  copperOthersValorization: CirclePlus,
};

const ProcessNode = ({ data }) => {
  const IconComponent = data.typeId && processIcons[data.typeId]
    ? processIcons[data.typeId]
    : (typeof data.icon === 'function' ? data.icon : Factory);
  const badgeBg = data.badgeBg || palette.neutralBadge;
  const badgeBorder = data.badgeBorder || palette.cardBorder;
  const badgeText = data.badgeText || palette.neutralDarkText;
  const iconColor = data.iconColor || palette.neutralLightText;

  return (
    <div
      className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border"
      style={{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder }}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2" style={{ backgroundColor: palette.accent }} />
      <div className="p-4 w-56">
        <div className="flex justify-center mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center border"
            style={{ backgroundColor: badgeBg, borderColor: badgeBorder || 'transparent', color: badgeText }}
          >
            <IconComponent className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        </div>
        <div className="text-center mb-2">
          <div className="text-sm font-semibold text-gray-900 mb-1">{data.label}</div>
          <div className="text-xs" style={{ color: data.accentColor || palette.neutralLightText }}>{data.stageName}</div>
        </div>
        <div className="text-xs text-gray-500 text-center">Configure details on the right</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" style={{ backgroundColor: palette.accent }} />
    </div>
  );
};

const nodeTypes = { processNode: ProcessNode };

const defaultEdgeOptions = {
  type: 'bezier',
  animated: true,
  style: { strokeWidth: 2, stroke: palette.accent },
};

function CanvasFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedCategory, setSelectedCategory] = useState('extraction');
  const [selectedMetal, setSelectedMetal] = useState('copper');
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(320);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [projectSummary, setProjectSummary] = useState(null);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [projectDescriptionInput, setProjectDescriptionInput] = useState('');
  const [openProjectsExpanded, setOpenProjectsExpanded] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(true);
  const [welcomeStage, setWelcomeStage] = useState('metal'); // 'metal' or 'project'

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem(CANVAS_PROJECT_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setProjectSummary(parsed);
        setProjectNameInput(parsed?.name || '');
        setProjectDescriptionInput(parsed?.description || '');
        if (parsed?.metal) {
          setSelectedMetal(parsed.metal);
        }
      }
    } catch (error) {
      console.warn('Failed to load canvas project summary', error);
    }
  }, []);

  const handleProjectDetailsSubmit = (event) => {
    event.preventDefault();
    if (!projectNameInput.trim()) return;
    const payload = {
      name: projectNameInput.trim(),
      description: projectDescriptionInput.trim(),
      metal: selectedMetal,
      updatedAt: new Date().toISOString(),
    };
    setProjectSummary(payload);
    try {
      localStorage.setItem(CANVAS_PROJECT_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Unable to persist canvas project summary', error);
    }
  };

  const clearProjectSummary = () => {
    setProjectSummary(null);
    setProjectNameInput('');
    setProjectDescriptionInput('');
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CANVAS_PROJECT_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Unable to clear canvas project summary', error);
    }
  };

  const recentProjects = useMemo(() => {
    if (projectSummary?.name) {
      return [projectSummary];
    }
    return [];
  }, [projectSummary]);

  useEffect(() => {
    if (projectSummary?.name) {
      setShowWelcomeOverlay(false);
    }
  }, [projectSummary]);

  const handleMetalSelection = (metal) => {
    setSelectedMetal(metal);
    setWelcomeStage('project');
  };

  const handleBackToMetals = () => {
    setWelcomeStage('metal');
  };

  // COPPER FORM DEFAULTS - COMPREHENSIVE
  const copperMiningDefaults = useMemo(() => ({
    miningMethod: 'open-pit',
    oreType: 'sulfide',
    oreGradePercentCu: 0.5,
    regionOrCountry: '',
    overburdenWasteRockRatio: 0,
    averageHaulDistanceKm: 0,
    equipmentType: 'diesel',
    mineProductionTPerDay: 0,
    waterConsumptionM3PerTonneOre: 0,
    waterSource: 'ground',
    fuelConsumptionLPerTonneOre: 0,
    electricityConsumptionKWhPerTonneOre: 0,
    depositDepthM: 0,
    benchHeightM: 0,
    rockHardnessIndex: 0,
    strippingRatio: 0,
    tailingsGenerationRate: 0,
    mineLifetimeYears: 0,
    oreThroughputTPerYear: 0,
    shiftHoursPerDay: 0,
    equipmentAvailabilityPercent: 0,
    equipmentCount: 0,
    equipmentCapacityT: 0,
    explosivesUsedKgPerTonneOre: 0,
    powerSourceMix: '',
    energyEfficiencyOfMachinesPercent: 0,
    waterReuseRatePercent: 0,
    waterDischargeQualityPH: 7,
    acidMineDrainageRisk: 'low',
    directGHGEmissionsKgCO2ePerTonneOre: 0,
    dustEmissionsPM10KgPerTonneOre: 0,
    noiseLevelDB: 0,
    landDisturbedM2PerTonneOre: 0,
    rehabilitationAreaHaPerYear: 0,
    biodiversityImpactScore: 0,
    oreRecoveryPercent: 0,
    oreLossPercent: 0,
    miningCostUSDPerTonneOre: 0,
    dieselPriceUSDPerLitre: 0,
    electricityCostUSDPerKWh: 0,
  }), []);
  const [copperMiningForm, setCopperMiningForm] = useState(copperMiningDefaults);

  const copperBeneficiationDefaults = useMemo(() => ({
    oreType: 'sulfide',
    oreGradePercentCu: 0.5,
    concentrateGradePercentCu: 25,
    grindingEnergyKWhPerTonneOre: 0,
    reagentConsumptionKgPerTonneOre: 0,
    waterConsumptionM3PerTonneOre: 0,
    waterRecycledPercent: 0,
    recoveryEfficiencyPercent: 0,
    mineralogyDetails: '',
    particleSizeAfterGrindingMicrons: 0,
    moistureContentPercent: 0,
    reagentType: '',
    flotationCellType: '',
    thickenerEfficiency: 0,
    filtrationType: '',
    equipmentAgeYears: 0,
    millLoadingPercent: 0,
    slurryDistanceKm: 0,
    electricityUseKWhPerTonneOre: 0,
    tailingsProducedTonnesPerTonneConcentrate: 0,
    tailingsStorageType: '',
  }), []);
  const [copperBeneficiationForm, setCopperBeneficiationForm] = useState(copperBeneficiationDefaults);

  const copperSmeltingDefaults = useMemo(() => ({
    processRoute: 'pyro',
    oreType: 'sulfide',
    concentrateGradePercentCu: 25,
    smeltingTechnique: '',
    smeltingEnergyMJPerTonneConcentrate: 0,
    sulfurCaptureEfficiencyPercent: 0,
    slagProducedKgPerTonneConcentrate: 0,
    electrorefiningEnergyKWhPerTonneCathode: 0,
    leachingMethod: '',
    acidConsumptionKgH2SO4PerTonneOre: 0,
    leachingEfficiencyPercent: 0,
    electrowinningEnergyKWhPerKgCu: 0,
    furnaceType: '',
    oxygenEnrichmentPercent: 0,
    fluxAdditionKgPerTonne: 0,
    coolingWaterM3PerTonne: 0,
    so2EmissionsKgPerTonne: 0,
    particulateEmissionsKgPerTonne: 0,
    electrolyteCuSO4Concentration: 0,
    electrolyteTemperatureC: 0,
    currentDensityAPerM2: 0,
    cathodeQualityPercent: 99.99,
  }), []);
  const [copperSmeltingForm, setCopperSmeltingForm] = useState(copperSmeltingDefaults);

  const copperManufacturingDefaults = useMemo(() => ({
    productType: '',
    inputCathodePurityPercentCu: 99.9,
    castingMethod: '',
    furnaceType: '',
    meltingEnergyKWhPerTonneProduct: 0,
    rollingEnergyKWhPerTonneProduct: 0,
    electricityMixRenewablePercent: 0,
    electricityMixFossilPercent: 0,
    processWaterConsumptionM3PerTonneProduct: 0,
    scrapGeneratedPercent: 0,
    annealingTemperatureC: 0,
    surfaceTreatment: '',
    productYieldPercent: 0,
    qualityGradeStandard: '',
    packagingMaterialKgPerTonne: 0,
  }), []);
  const [copperManufacturingForm, setCopperManufacturingForm] = useState(copperManufacturingDefaults);

  const usePhaseDefaults = useMemo(() => ({
    productType: '',
    applicationSector: '',
    efficiencyRatingPercent: 0,
    energySavingsVsAlternativePercent: 0,
    averageAnnualUseEnergyKWh: 0,
    maintenanceFrequencyPerYear: 0,
    productLifespanYears: 0,
    operatingTemperatureC: 0,
    corrosionProtection: '',
    replacementPartsNeeded: '',
    endOfLifeCondition: '',
  }), []);
  const [usePhaseForm, setUsePhaseForm] = useState(usePhaseDefaults);

  const copperRecyclingDefaults = useMemo(() => ({
    scrapType: '',
    collectionRatePercent: 0,
    sortingTechnology: '',
    contaminationLevelPercent: 0,
    remeltingEnergyKWhPerTonneScrap: 0,
    recoveryYieldPercent: 0,
    recycledContentPercent: 0,
    transportDistanceKm: 0,
    preProcessingRequired: '',
    coalloySeparation: false,
    furnaceEfficiencyPercent: 0,
    emissionReductionVsPrimaryPercent: 0,
  }), []);
  const [copperRecyclingForm, setCopperRecyclingForm] = useState(copperRecyclingDefaults);

  const copperValorizationDefaults = useMemo(() => ({
    wasteType: '',
    valorizationMethod: '',
    valorizationRatePercent: 0,
    metalRecoveryRatePercent: 0,
    processEnergyKWhPerTonneWaste: 0,
    revenueUSDPerTonneWaste: 0,
    environmentalBenefitScore: 0,
  }), []);
  const [copperValorizationForm, setCopperValorizationForm] = useState(copperValorizationDefaults);

  // ALUMINUM FORM DEFAULTS
  const opmDefaults = useMemo(() => ({
    oreGrade: 45,
    overburdenRatio: 3.2,
    equipmentType: 'Electric',
    waterUsage: 0.05,
    landUseImpact: 'Moderate',
    redMudGeneration: 120,
  }), []);
  const [opmForm, setOpmForm] = useState(opmDefaults);

  const processingDefaults = useMemo(() => ({
    waterConsumption: 0.01,
    electricityUse: 5,
    chemicalAgents: [],
    chemicalAgentsOther: '',
    wasteTailings: 'Stored in tailing ponds',
    noisePollution: 'Low',
    dustPollution: 'Low',
    toxicityIndicator: '',
    toxicityOther: '',
  }), []);
  const [processingForm, setProcessingForm] = useState(processingDefaults);

  const aluminaRefiningDefaults = useMemo(() => ({
    enhancement: 'None',
    energyUse: 900,
    waterUse: 0.2,
    redMudGeneration: 50,
    causticSoda: 0,
    limeAdditives: 0,
    chemicalOther: '',
    so2Emissions: 0.05,
    noxEmissions: 0.08,
    dustEmissions: 0.1,
    toxicityIndicator: '',
    toxicityOther: '',
  }), []);
  const [aluminaRefiningForm, setAluminaRefiningForm] = useState(aluminaRefiningDefaults);

  const smeltingDefaults = useMemo(() => ({
    anodePreBakingTemp: 1100,
    electrolysisVoltage: 4.5,
    currentEfficiency: 95,
    bathTemp: 960,
    aluminaConcentration: 3.5,
    fluorideContent: 12,
    anodeEffectFrequency: 'Low',
    offGasTreatmentEfficiency: 98,
    energyConsumption: 15000,
    co2EmissionsPerTonne: 1.7,
    pfcEmissions: 0.3,
    soxEmissions: 0.05,
    dustEmissions: 0.08,
    scrubberType: 'Wet scrubber',
    otherSpecify: '',
  }), []);
  const [smeltingForm, setSmeltingForm] = useState(smeltingDefaults);

  const manufacturingDefaults = useMemo(() => ({
    lightweighting: [],
    lightweightingOther: '',
    corrosionBehavior: '',
    corrosionBehaviorOther: '',
    energyUsePerStep: 900,
    scrapRate: 3,
    recycledContent: 20,
    emissionsFromFabrication: 400,
    transportDistance: 0,
    transportMode: '',
    transportEmissions: 0,
  }), []);
  const [manufacturingForm, setManufacturingForm] = useState(manufacturingDefaults);

  const recyclingDefaults = useMemo(() => ({
    sortingMethods: [],
    sortingMethodsOther: '',
    recyclingApproach: [],
    recyclingApproachOther: '',
    scrapInput: 0,
    recoveryYield: 0,
    furnaceEnergyDemand: 0,
    emissionSavings: 0,
    recyclingEfficiency: 0,
    collectionRate: 0,
    closedLoopPercentage: 0,
    openLoopPercentage: 0,
  }), []);
  const [recyclingForm, setRecyclingForm] = useState(recyclingDefaults);

  const valorizationDefaults = useMemo(() => ({
    wasteTreatment: [],
    wasteTreatmentOther: '',
    valorizationMethods: [],
    valorizationMethodsOther: '',
    recoveryEfficiency: 0,
    environmentalImpactReduction: 0,
    processingTechnique: '',
    conditioningMethod: [],
    conditioningMethodOther: '',
    soilAmendment: false,
    cementAddition: false,
    wasteUnburntCarbon: false,
    emissionsReduction: '',
    emissionsReductionOther: '',
    toxicityFeedback: '',
    toxicityFeedbackOther: '',
    recoveryEfficiencyMaterial: 0,
    economicViability: '',
  }), []);
  const [valorizationForm, setValorizationForm] = useState(valorizationDefaults);

  const [customProcessName, setCustomProcessName] = useState('');

  const stages = useMemo(() => {
    if (selectedMetal === 'copper') {
      return [
        { id: 'extraction', label: 'Stage 1: Extraction' },
        { id: 'beneficiation', label: 'Stage 2: Beneficiation' },
        { id: 'smelting', label: 'Stage 3: Smelting' },
        { id: 'manufacturing', label: 'Stage 4: Manufacturing' },
        { id: 'use_phase', label: 'Stage 5: Use Phase' },
        { id: 'recycling', label: 'Stage 6: Recycling' },
        { id: 'valorization', label: 'Stage 7: Valorization' },
      ];
    }
    return [
      { id: 'extraction', label: 'Stage 1: Extraction' },
      { id: 'processing', label: 'Stage 2: Processing' },
      { id: 'alumina_refining', label: 'Stage 3: Alumina Refining' },
      { id: 'smelting', label: 'Stage 4: Smelting' },
      { id: 'manufacturing', label: 'Stage 5: Manufacturing' },
      { id: 'recycling', label: 'Stage 6: Recycling' },
      { id: 'valorization', label: 'Stage 7: Valorization' },
    ];
  }, [selectedMetal]);

  const metals = [
    { id: 'aluminum', label: 'Aluminum' },
    { id: 'steel', label: 'Steel' },
    { id: 'copper', label: 'Copper' }
  ];

  const processTypes = [
    // Extraction - Copper
    { id: 'copperOpenPitMining', label: 'Open-Pit Mining', stage: 'extraction', metal: 'copper', emoji: '⛏️' },
    { id: 'copperUndergroundMining', label: 'Underground Mining', stage: 'extraction', metal: 'copper', emoji: '⛏️' },
    { id: 'copperISL', label: 'In-situ Leaching (ISL)', stage: 'extraction', metal: 'copper', emoji: '🧪' },
    { id: 'copperSolutionExtraction', label: 'Solution Extraction', stage: 'extraction', metal: 'copper', emoji: '💧' },
    { id: 'copperCustomExtraction', label: 'Others (custom)', stage: 'extraction', metal: 'copper', emoji: '➕' },

    // Beneficiation - Copper
    { id: 'copperCrushing', label: 'Crushing & Grinding', stage: 'beneficiation', metal: 'copper', emoji: '🔨' },
    { id: 'copperFlotation', label: 'Flotation', stage: 'beneficiation', metal: 'copper', emoji: '🫧' },
    { id: 'copperThickening', label: 'Thickening & Filtration', stage: 'beneficiation', metal: 'copper', emoji: '💧' },
    { id: 'copperCustomProcessing', label: 'Others (custom)', stage: 'beneficiation', metal: 'copper', emoji: '➕' },

    // Smelting - Copper
    { id: 'copperSmelting', label: 'Smelting (Pyro)', stage: 'smelting', metal: 'copper', emoji: '🔥' },
    { id: 'copperElectrorefining', label: 'Electrorefining', stage: 'smelting', metal: 'copper', emoji: '⚡' },
    { id: 'copperLeaching', label: 'Leaching (Hydro)', stage: 'smelting', metal: 'copper', emoji: '💧' },
    { id: 'copperElectrowinning', label: 'Electrowinning', stage: 'smelting', metal: 'copper', emoji: '⚡' },
    { id: 'copperOthersSmelting', label: 'Others (custom)', stage: 'smelting', metal: 'copper', emoji: '➕' },

    // Manufacturing - Copper
    { id: 'copperSemiFabrication', label: 'Cathode Melting', stage: 'manufacturing', metal: 'copper', emoji: '🏭' },
    { id: 'copperCasting', label: 'Casting', stage: 'manufacturing', metal: 'copper', emoji: '🏭' },
    { id: 'copperRolling', label: 'Rolling/Extrusion', stage: 'manufacturing', metal: 'copper', emoji: '📊' },
    { id: 'copperOthersManufacturing', label: 'Others (custom)', stage: 'manufacturing', metal: 'copper', emoji: '➕' },

    // Use Phase - Copper
    { id: 'usePhase', label: 'Product Operation', stage: 'use_phase', metal: 'copper', emoji: '⚡' },

    // Recycling - Copper
    { id: 'copperCollection', label: 'Collection', stage: 'recycling', metal: 'copper', emoji: '🗑️' },
    { id: 'copperSorting', label: 'Sorting', stage: 'recycling', metal: 'copper', emoji: '📦' },
    { id: 'copperCleaning', label: 'Cleaning', stage: 'recycling', metal: 'copper', emoji: '🧹' },
    { id: 'copperRemelting', label: 'Remelting', stage: 'recycling', metal: 'copper', emoji: '🔥' },
    { id: 'copperOthersRecycling', label: 'Others (custom)', stage: 'recycling', metal: 'copper', emoji: '➕' },

    // Valorization - Copper
    { id: 'copperWasteValorization', label: 'Slag Processing', stage: 'valorization', metal: 'copper', emoji: '♻️' },
    { id: 'copperSlagUtilization', label: 'Slag Utilization', stage: 'valorization', metal: 'copper', emoji: '🏗️' },
    { id: 'copperOthersValorization', label: 'Others (custom)', stage: 'valorization', metal: 'copper', emoji: '➕' },

    // Extraction - Aluminum
    { id: 'openPitMining', label: 'Open Pit Mining', stage: 'extraction', metal: 'aluminum', emoji: '⛏️' },
    { id: 'stripMining', label: 'Strip Mining', stage: 'extraction', metal: 'aluminum', emoji: '🏗️' },
    { id: 'customExtraction', label: 'Others (custom)', stage: 'extraction', metal: 'aluminum', emoji: '➕' },

    // Processing - Aluminum
    { id: 'crushing', label: 'Crushing', stage: 'processing', metal: 'aluminum', emoji: '🔨' },
    { id: 'grinding', label: 'Grinding', stage: 'processing', metal: 'aluminum', emoji: '⚙️' },
    { id: 'magneticSeparation', label: 'Magnetic Separation', stage: 'processing', metal: 'aluminum', emoji: '🧲' },

    // Alumina Refining - Aluminum
    { id: 'digestion', label: 'Digestion', stage: 'alumina_refining', metal: 'aluminum', emoji: '🧬' },
    { id: 'calcination', label: 'Calcination', stage: 'alumina_refining', metal: 'aluminum', emoji: '🔥' },

    // Smelting - Aluminum
    { id: 'electrolysis', label: 'Electrolysis', stage: 'smelting', metal: 'aluminum', emoji: '⚡' },

    // Manufacturing - Aluminum
    { id: 'casting', label: 'Casting', stage: 'manufacturing', metal: 'aluminum', emoji: '🏭' },
    { id: 'rolling', label: 'Rolling', stage: 'manufacturing', metal: 'aluminum', emoji: '📊' },

    // Recycling - Aluminum
    { id: 'collection', label: 'Collection', stage: 'recycling', metal: 'aluminum', emoji: '🗑️' },
    { id: 'remelting', label: 'Remelting', stage: 'recycling', metal: 'aluminum', emoji: '🔥' },

    // Valorization - Aluminum
    { id: 'redMudValorization', label: 'Red Mud Valorization', stage: 'valorization', metal: 'aluminum', emoji: '🧱' },
    { id: 'slagUtilization', label: 'Slag Utilization', stage: 'valorization', metal: 'aluminum', emoji: '🏗️' },
  ];

  const stageConfig = {
    extraction: { icon: Factory, name: 'Extraction', badgeBg: '#C47D65', badgeText: '#FFFFFF', iconColor: '#FFFFFF', accentColor: '#C47D65' },
    processing: { icon: Wrench, name: 'Processing', badgeBg: '#C47D65', badgeText: '#FFFFFF', iconColor: '#FFFFFF', accentColor: '#C47D65' },
    beneficiation: { icon: Wrench, name: 'Beneficiation', badgeBg: '#C47D65', badgeText: '#FFFFFF', iconColor: '#FFFFFF', accentColor: '#C47D65' },
    alumina_refining: { icon: Settings, name: 'Alumina Refining', badgeBg: '#C47D65', badgeText: '#FFFFFF', iconColor: '#FFFFFF', accentColor: '#C47D65' },
    smelting: { icon: Zap, name: 'Smelting', badgeBg: '#C47D65', badgeText: '#FFFFFF', iconColor: '#FFFFFF', accentColor: '#C47D65' },
    manufacturing: { icon: Package, name: 'Manufacturing', badgeBg: '#C47D65', badgeText: '#FFFFFF', iconColor: '#FFFFFF', accentColor: '#C47D65' },
    use_phase: { icon: Zap, name: 'Use Phase', badgeBg: '#C47D65', badgeText: '#FFFFFF', iconColor: '#FFFFFF', accentColor: '#C47D65' },
    recycling: { icon: Recycle, name: 'Recycling', badgeBg: '#C47D65', badgeText: '#FFFFFF', iconColor: '#FFFFFF', accentColor: '#C47D65' },
    valorization: { icon: TrendingUp, name: 'Valorization', badgeBg: '#C47D65', badgeText: '#FFFFFF', iconColor: '#FFFFFF', accentColor: '#C47D65' },
  };

  const processCategories = useMemo(
    () =>
      stages.map((stage) => ({
        id: stage.id,
        name: stage.label,
        icon: stageConfig[stage.id].icon,
        badgeBg: stageConfig[stage.id].badgeBg,
        badgeText: stageConfig[stage.id].badgeText,
        badgeBorder: stageConfig[stage.id].badgeBorder,
        iconColor: stageConfig[stage.id].iconColor,
        accentColor: stageConfig[stage.id].accentColor,
        nodes: processTypes
          .filter((p) => p.stage === stage.id && p.metal === selectedMetal)
          .map((p) => ({
            id: p.id,
            name: p.label,
            icon: stageConfig[stage.id].icon,
            badgeBg: stageConfig[stage.id].badgeBg,
            badgeText: stageConfig[stage.id].badgeText,
            badgeBorder: stageConfig[stage.id].badgeBorder,
            iconColor: stageConfig[stage.id].iconColor,
            accentColor: stageConfig[stage.id].accentColor,
            description: '',
            circularityImpact: 0,
            co2Impact: 0,
            duration: 'Variable',
            complexity: 'Medium',
          })),
      })),
    [stages, selectedMetal]
  );

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const edgeUpdateSuccessful = useRef(true);

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    edgeUpdateSuccessful.current = true;
    setEdges((els) => updateEdge(oldEdge, newConnection, els));
  }, [setEdges]);

  const onEdgeUpdateEnd = useCallback((_, edge) => {
    if (!edgeUpdateSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeUpdateSuccessful.current = true;
  }, [setEdges]);

  const addProcessNode = (process) => {
    const position = {
      x: Math.random() * 500 + 100,
      y: Math.random() * 300 + 100,
    };
    const newNode = {
      id: `${process.id}-${Date.now()}`,
      type: 'processNode',
      position,
      data: {
        label: process.name,
        typeId: process.id,
        stageName: stageConfig[selectedCategory]?.name || '',
        icon: process.icon,
        badgeBg: process.badgeBg,
        badgeText: process.badgeText,
        badgeBorder: process.badgeBorder,
        iconColor: process.iconColor,
        accentColor: process.accentColor,
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNode.id);
    setInspectorOpen(true);
    setRightSidebarOpen(true);
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    setInspectorOpen(false);
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    setInspectorOpen(true);
    setRightSidebarOpen(true);
  }, []);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const saveProject = () => {
    const project = { nodes, edges };
    const dataStr = JSON.stringify(project, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'metal-lca-project.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const loadProject = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target?.result);
        setNodes(project.nodes || []);
        setEdges(project.edges || []);
      } catch (error) {
        alert('Error loading project file');
      }
    };
    reader.readAsText(file);
  };

  const handleMouseDownLeft = useCallback(() => {
    setIsResizingLeft(true);
  }, []);

  const handleMouseDownRight = useCallback(() => {
    setIsResizingRight(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isResizingLeft) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setLeftSidebarWidth(newWidth);
      }
    }
    if (isResizingRight) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setRightSidebarWidth(newWidth);
      }
    }
  }, [isResizingLeft, isResizingRight]);

  const handleMouseUp = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingLeft, isResizingRight, handleMouseMove, handleMouseUp]);

  const renderInspectorContent = () => {
    if (!selectedNode) return null;

    const nodeTypeId = selectedNode.data.typeId;
    const stageName = selectedNode.data.stageName;

    // COPPER MINING/EXTRACTION FORM
    if (selectedMetal === 'copper' && (nodeTypeId === 'copperOpenPitMining' || nodeTypeId === 'copperUndergroundMining' || nodeTypeId === 'copperISL' || nodeTypeId === 'copperSolutionExtraction' || nodeTypeId === 'copperCustomExtraction')) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Copper Mining/Extraction Parameters</h3>

          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-800 mb-2">★ MINIMUM REQUIRED INPUTS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Mining Method</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.miningMethod}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, miningMethod: e.target.value })}
              >
                <option value="open-pit">Open-Pit</option>
                <option value="underground">Underground</option>
                <option value="isl">In-Situ Leaching</option>
                <option value="solution">Solution Extraction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Ore Type</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.oreType}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, oreType: e.target.value })}
              >
                <option value="sulfide">Sulfide</option>
                <option value="oxide">Oxide</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Ore Grade (% Cu)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.oreGradePercentCu}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, oreGradePercentCu: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Region/Country</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.regionOrCountry}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, regionOrCountry: e.target.value })}
                placeholder="e.g., Chile, Peru"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Overburden/Waste Rock Ratio</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.overburdenWasteRockRatio}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, overburdenWasteRockRatio: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Average Haul Distance (km)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.averageHaulDistanceKm}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, averageHaulDistanceKm: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Equipment Type</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.equipmentType}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, equipmentType: e.target.value })}
              >
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Mine Production (t/day)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.mineProductionTPerDay}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, mineProductionTPerDay: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Water Consumption (m³/tonne ore)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.waterConsumptionM3PerTonneOre}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, waterConsumptionM3PerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Water Source</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.waterSource}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, waterSource: e.target.value })}
              >
                <option value="ground">Groundwater</option>
                <option value="surface">Surface Water</option>
                <option value="recycled">Recycled Water</option>
                <option value="desalinated">Desalinated Water</option>
              </select>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs font-semibold text-gray-700 mb-2">ADDITIONAL PARAMETERS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fuel Consumption (L/tonne ore)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.fuelConsumptionLPerTonneOre}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, fuelConsumptionLPerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Electricity Consumption (kWh/tonne ore)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.electricityConsumptionKWhPerTonneOre}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, electricityConsumptionKWhPerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Deposit Depth (m)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.depositDepthM}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, depositDepthM: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bench Height (m)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.benchHeightM}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, benchHeightM: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rock Hardness Index</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.rockHardnessIndex}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, rockHardnessIndex: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stripping Ratio</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.strippingRatio}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, strippingRatio: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tailings Generation Rate</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.tailingsGenerationRate}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, tailingsGenerationRate: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mine Lifetime (years)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.mineLifetimeYears}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, mineLifetimeYears: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ore Throughput (t/year)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.oreThroughputTPerYear}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, oreThroughputTPerYear: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shift Hours/Day</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.shiftHoursPerDay}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, shiftHoursPerDay: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Equipment Availability (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.equipmentAvailabilityPercent}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, equipmentAvailabilityPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Equipment Count</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.equipmentCount}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, equipmentCount: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Equipment Capacity (t)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.equipmentCapacityT}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, equipmentCapacityT: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Explosives Used (kg/tonne ore)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.explosivesUsedKgPerTonneOre}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, explosivesUsedKgPerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Power Source Mix</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.powerSourceMix}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, powerSourceMix: e.target.value })}
                placeholder="e.g., 60% grid, 40% diesel"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Energy Efficiency of Machines (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.energyEfficiencyOfMachinesPercent}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, energyEfficiencyOfMachinesPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Water Reuse Rate (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.waterReuseRatePercent}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, waterReuseRatePercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Water Discharge Quality (pH)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.waterDischargeQualityPH}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, waterDischargeQualityPH: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Acid Mine Drainage Risk</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.acidMineDrainageRisk}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, acidMineDrainageRisk: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Direct GHG Emissions (kg CO₂e/tonne ore)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.directGHGEmissionsKgCO2ePerTonneOre}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, directGHGEmissionsKgCO2ePerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dust Emissions PM10 (kg/tonne ore)</label>
              <input
                type="number"
                step="0.001"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.dustEmissionsPM10KgPerTonneOre}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, dustEmissionsPM10KgPerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Noise Level (dB)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.noiseLevelDB}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, noiseLevelDB: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Land Disturbed (m²/tonne ore)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.landDisturbedM2PerTonneOre}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, landDisturbedM2PerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rehabilitation Area (ha/year)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.rehabilitationAreaHaPerYear}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, rehabilitationAreaHaPerYear: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Biodiversity Impact Score</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.biodiversityImpactScore}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, biodiversityImpactScore: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ore Recovery (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.oreRecoveryPercent}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, oreRecoveryPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ore Loss (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.oreLossPercent}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, oreLossPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mining Cost (USD/tonne ore)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.miningCostUSDPerTonneOre}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, miningCostUSDPerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Diesel Price (USD/L)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.dieselPriceUSDPerLitre}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, dieselPriceUSDPerLitre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Electricity Cost (USD/kWh)</label>
              <input
                type="number"
                step="0.001"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperMiningForm.electricityCostUSDPerKWh}
                onChange={(e) => setCopperMiningForm({ ...copperMiningForm, electricityCostUSDPerKWh: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>
      );
    }

    // COPPER BENEFICIATION FORM
    if (selectedMetal === 'copper' && (nodeTypeId === 'copperCrushing' || nodeTypeId === 'copperFlotation' || nodeTypeId === 'copperThickening' || nodeTypeId === 'copperCustomProcessing')) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Copper Beneficiation Parameters</h3>

          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-800 mb-2">★ MINIMUM REQUIRED INPUTS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Ore Type</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.oreType}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, oreType: e.target.value })}
              >
                <option value="sulfide">Sulfide</option>
                <option value="oxide">Oxide</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Ore Grade (% Cu)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.oreGradePercentCu}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, oreGradePercentCu: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Concentrate Grade (% Cu)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.concentrateGradePercentCu}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, concentrateGradePercentCu: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Grinding Energy (kWh/tonne ore)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.grindingEnergyKWhPerTonneOre}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, grindingEnergyKWhPerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Reagent Consumption (kg/tonne ore)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.reagentConsumptionKgPerTonneOre}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, reagentConsumptionKgPerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Water Consumption (m³/tonne ore)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.waterConsumptionM3PerTonneOre}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, waterConsumptionM3PerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Water Recycled (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.waterRecycledPercent}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, waterRecycledPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs font-semibold text-gray-700 mb-2">ADDITIONAL PARAMETERS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Recovery Efficiency (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.recoveryEfficiencyPercent}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, recoveryEfficiencyPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mineralogy Details</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.mineralogyDetails}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, mineralogyDetails: e.target.value })}
                placeholder="e.g., Chalcopyrite dominant"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Particle Size After Grinding (microns)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.particleSizeAfterGrindingMicrons}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, particleSizeAfterGrindingMicrons: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Moisture Content (%)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.moistureContentPercent}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, moistureContentPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reagent Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.reagentType}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, reagentType: e.target.value })}
                placeholder="e.g., Xanthate, frother"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Flotation Cell Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.flotationCellType}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, flotationCellType: e.target.value })}
                placeholder="e.g., Column, mechanical"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Thickener Efficiency</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.thickenerEfficiency}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, thickenerEfficiency: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Filtration Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.filtrationType}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, filtrationType: e.target.value })}
                placeholder="e.g., Pressure, vacuum"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Equipment Age (years)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.equipmentAgeYears}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, equipmentAgeYears: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mill Loading (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.millLoadingPercent}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, millLoadingPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Slurry Distance (km)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.slurryDistanceKm}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, slurryDistanceKm: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Electricity Use (kWh/tonne ore)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.electricityUseKWhPerTonneOre}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, electricityUseKWhPerTonneOre: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tailings Produced (tonnes/tonne concentrate)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.tailingsProducedTonnesPerTonneConcentrate}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, tailingsProducedTonnesPerTonneConcentrate: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tailings Storage Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperBeneficiationForm.tailingsStorageType}
                onChange={(e) => setCopperBeneficiationForm({ ...copperBeneficiationForm, tailingsStorageType: e.target.value })}
                placeholder="e.g., Dam, dry stack"
              />
            </div>
          </div>
        </div>
      );
    }

    // COPPER SMELTING FORM
    if (selectedMetal === 'copper' && (nodeTypeId === 'copperSmelting' || nodeTypeId === 'copperElectrorefining' || nodeTypeId === 'copperLeaching' || nodeTypeId === 'copperElectrowinning' || nodeTypeId === 'copperOthersSmelting')) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Copper Smelting/Refining Parameters</h3>

          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-800 mb-2">★ MINIMUM REQUIRED INPUTS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Process Route</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperSmeltingForm.processRoute}
                onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, processRoute: e.target.value })}
              >
                <option value="pyro">Pyrometallurgy</option>
                <option value="hydro">Hydrometallurgy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Ore Type</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperSmeltingForm.oreType}
                onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, oreType: e.target.value })}
              >
                <option value="sulfide">Sulfide</option>
                <option value="oxide">Oxide</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Concentrate Grade (% Cu)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperSmeltingForm.concentrateGradePercentCu}
                onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, concentrateGradePercentCu: parseFloat(e.target.value) })}
              />
            </div>

            {copperSmeltingForm.processRoute === 'pyro' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">★ Smelting Technique</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.smeltingTechnique}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, smeltingTechnique: e.target.value })}
                    placeholder="e.g., Flash smelting, blast furnace"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">★ Smelting Energy (MJ/tonne concentrate)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.smeltingEnergyMJPerTonneConcentrate}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, smeltingEnergyMJPerTonneConcentrate: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">★ Sulfur Capture Efficiency (%)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.sulfurCaptureEfficiencyPercent}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, sulfurCaptureEfficiencyPercent: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">★ Slag Produced (kg/tonne concentrate)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.slagProducedKgPerTonneConcentrate}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, slagProducedKgPerTonneConcentrate: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">★ Electrorefining Energy (kWh/tonne cathode)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.electrorefiningEnergyKWhPerTonneCathode}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, electrorefiningEnergyKWhPerTonneCathode: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}

            {copperSmeltingForm.processRoute === 'hydro' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">★ Leaching Method</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.leachingMethod}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, leachingMethod: e.target.value })}
                    placeholder="e.g., Heap leach, tank leach"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">★ Acid Consumption (kg H₂SO₄/tonne ore)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.acidConsumptionKgH2SO4PerTonneOre}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, acidConsumptionKgH2SO4PerTonneOre: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">★ Leaching Efficiency (%)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.leachingEfficiencyPercent}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, leachingEfficiencyPercent: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">★ Electrowinning Energy (kWh/kg Cu)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.electrowinningEnergyKWhPerKgCu}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, electrowinningEnergyKWhPerKgCu: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}

            <div className="pt-3 border-t">
              <p className="text-xs font-semibold text-gray-700 mb-2">ADDITIONAL PARAMETERS</p>
            </div>

            {copperSmeltingForm.processRoute === 'pyro' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Furnace Type</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.furnaceType}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, furnaceType: e.target.value })}
                    placeholder="e.g., Flash, reverberatory"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Oxygen Enrichment (%)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.oxygenEnrichmentPercent}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, oxygenEnrichmentPercent: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Flux Addition (kg/tonne)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.fluxAdditionKgPerTonne}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, fluxAdditionKgPerTonne: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cooling Water (m³/tonne)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.coolingWaterM3PerTonne}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, coolingWaterM3PerTonne: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SO₂ Emissions (kg/tonne)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.so2EmissionsKgPerTonne}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, so2EmissionsKgPerTonne: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Particulate Emissions (kg/tonne)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.particulateEmissionsKgPerTonne}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, particulateEmissionsKgPerTonne: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Electrolyte CuSO₄ Concentration</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.electrolyteCuSO4Concentration}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, electrolyteCuSO4Concentration: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Electrolyte Temperature (°C)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.electrolyteTemperatureC}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, electrolyteTemperatureC: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Density (A/m²)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.currentDensityAPerM2}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, currentDensityAPerM2: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cathode Quality (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    value={copperSmeltingForm.cathodeQualityPercent}
                    onChange={(e) => setCopperSmeltingForm({ ...copperSmeltingForm, cathodeQualityPercent: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // COPPER MANUFACTURING FORM
    if (selectedMetal === 'copper' && (nodeTypeId === 'copperSemiFabrication' || nodeTypeId === 'copperCasting' || nodeTypeId === 'copperRolling' || nodeTypeId === 'copperOthersManufacturing')) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Copper Manufacturing Parameters</h3>

          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-800 mb-2">★ MINIMUM REQUIRED INPUTS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Product Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.productType}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, productType: e.target.value })}
                placeholder="e.g., Wire, rod, sheet, tube"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Input Cathode Purity (% Cu)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.inputCathodePurityPercentCu}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, inputCathodePurityPercentCu: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Casting Method</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.castingMethod}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, castingMethod: e.target.value })}
                placeholder="e.g., Continuous casting, DC casting"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Furnace Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.furnaceType}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, furnaceType: e.target.value })}
                placeholder="e.g., Shaft furnace, induction"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Melting Energy (kWh/tonne product)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.meltingEnergyKWhPerTonneProduct}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, meltingEnergyKWhPerTonneProduct: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Rolling Energy (kWh/tonne product)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.rollingEnergyKWhPerTonneProduct}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, rollingEnergyKWhPerTonneProduct: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Electricity Mix - Renewable (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.electricityMixRenewablePercent}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, electricityMixRenewablePercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Electricity Mix - Fossil (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.electricityMixFossilPercent}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, electricityMixFossilPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs font-semibold text-gray-700 mb-2">ADDITIONAL PARAMETERS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Process Water Consumption (m³/tonne product)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.processWaterConsumptionM3PerTonneProduct}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, processWaterConsumptionM3PerTonneProduct: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Scrap Generated (%)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.scrapGeneratedPercent}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, scrapGeneratedPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Annealing Temperature (°C)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.annealingTemperatureC}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, annealingTemperatureC: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Surface Treatment</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.surfaceTreatment}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, surfaceTreatment: e.target.value })}
                placeholder="e.g., Coating, polishing"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Yield (%)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.productYieldPercent}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, productYieldPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quality Grade/Standard</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.qualityGradeStandard}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, qualityGradeStandard: e.target.value })}
                placeholder="e.g., ASTM B1, EN 1652"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Packaging Material (kg/tonne)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperManufacturingForm.packagingMaterialKgPerTonne}
                onChange={(e) => setCopperManufacturingForm({ ...copperManufacturingForm, packagingMaterialKgPerTonne: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>
      );
    }

    // USE PHASE FORM
    if (selectedMetal === 'copper' && nodeTypeId === 'usePhase') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Use Phase Parameters</h3>

          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-800 mb-2">★ MINIMUM REQUIRED INPUTS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Product Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.productType}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, productType: e.target.value })}
                placeholder="e.g., Electric motor, transformer, cable"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Application Sector</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.applicationSector}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, applicationSector: e.target.value })}
                placeholder="e.g., Building, automotive, electronics"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Efficiency Rating (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.efficiencyRatingPercent}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, efficiencyRatingPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Energy Savings vs Alternative (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.energySavingsVsAlternativePercent}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, energySavingsVsAlternativePercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Average Annual Use Energy (kWh)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.averageAnnualUseEnergyKWh}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, averageAnnualUseEnergyKWh: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Maintenance Frequency (/year)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.maintenanceFrequencyPerYear}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, maintenanceFrequencyPerYear: parseFloat(e.target.value) })}
              />
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs font-semibold text-gray-700 mb-2">ADDITIONAL PARAMETERS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Lifespan (years)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.productLifespanYears}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, productLifespanYears: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Operating Temperature (°C)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.operatingTemperatureC}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, operatingTemperatureC: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Corrosion Protection</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.corrosionProtection}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, corrosionProtection: e.target.value })}
                placeholder="e.g., Coating, galvanization"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Replacement Parts Needed</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.replacementPartsNeeded}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, replacementPartsNeeded: e.target.value })}
                placeholder="e.g., Bearings, brushes"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End-of-Life Condition</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={usePhaseForm.endOfLifeCondition}
                onChange={(e) => setUsePhaseForm({ ...usePhaseForm, endOfLifeCondition: e.target.value })}
                placeholder="e.g., Fully functional, degraded"
              />
            </div>
          </div>
        </div>
      );
    }

    // COPPER RECYCLING FORM
    if (selectedMetal === 'copper' && (nodeTypeId === 'copperCollection' || nodeTypeId === 'copperSorting' || nodeTypeId === 'copperCleaning' || nodeTypeId === 'copperRemelting' || nodeTypeId === 'copperOthersRecycling')) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Copper Recycling Parameters</h3>

          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-800 mb-2">★ MINIMUM REQUIRED INPUTS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Scrap Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.scrapType}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, scrapType: e.target.value })}
                placeholder="e.g., New scrap, old scrap, mixed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Collection Rate (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.collectionRatePercent}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, collectionRatePercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Sorting Technology</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.sortingTechnology}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, sortingTechnology: e.target.value })}
                placeholder="e.g., Manual, eddy current, optical"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Contamination Level (%)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.contaminationLevelPercent}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, contaminationLevelPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Remelting Energy (kWh/tonne scrap)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.remeltingEnergyKWhPerTonneScrap}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, remeltingEnergyKWhPerTonneScrap: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Recovery Yield (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.recoveryYieldPercent}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, recoveryYieldPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Recycled Content (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.recycledContentPercent}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, recycledContentPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs font-semibold text-gray-700 mb-2">ADDITIONAL PARAMETERS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Transport Distance (km)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.transportDistanceKm}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, transportDistanceKm: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pre-Processing Required</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.preProcessingRequired}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, preProcessingRequired: e.target.value })}
                placeholder="e.g., Shredding, cleaning"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={copperRecyclingForm.coalloySeparation}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, coalloySeparation: e.target.checked })}
              />
              <label className="text-xs font-medium text-gray-700">Co-alloy Separation Required</label>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Furnace Efficiency (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.furnaceEfficiencyPercent}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, furnaceEfficiencyPercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Emission Reduction vs Primary (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperRecyclingForm.emissionReductionVsPrimaryPercent}
                onChange={(e) => setCopperRecyclingForm({ ...copperRecyclingForm, emissionReductionVsPrimaryPercent: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>
      );
    }

    // COPPER VALORIZATION FORM
    if (selectedMetal === 'copper' && (nodeTypeId === 'copperWasteValorization' || nodeTypeId === 'copperSlagUtilization' || nodeTypeId === 'copperOthersValorization')) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Copper Valorization Parameters</h3>

          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-800 mb-2">★ MINIMUM REQUIRED INPUTS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Waste Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperValorizationForm.wasteType}
                onChange={(e) => setCopperValorizationForm({ ...copperValorizationForm, wasteType: e.target.value })}
                placeholder="e.g., Slag, dust, sludge"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Valorization Method</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperValorizationForm.valorizationMethod}
                onChange={(e) => setCopperValorizationForm({ ...copperValorizationForm, valorizationMethod: e.target.value })}
                placeholder="e.g., Cement additive, aggregate, metal recovery"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Valorization Rate (%)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperValorizationForm.valorizationRatePercent}
                onChange={(e) => setCopperValorizationForm({ ...copperValorizationForm, valorizationRatePercent: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">★ Metal Recovery Rate (%)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperValorizationForm.metalRecoveryRatePercent}
                onChange={(e) => setCopperValorizationForm({ ...copperValorizationForm, metalRecoveryRatePercent: parseFloat(e.target.value) })}
              />
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs font-semibold text-gray-700 mb-2">ADDITIONAL PARAMETERS</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Process Energy (kWh/tonne waste)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperValorizationForm.processEnergyKWhPerTonneWaste}
                onChange={(e) => setCopperValorizationForm({ ...copperValorizationForm, processEnergyKWhPerTonneWaste: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Revenue (USD/tonne waste)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperValorizationForm.revenueUSDPerTonneWaste}
                onChange={(e) => setCopperValorizationForm({ ...copperValorizationForm, revenueUSDPerTonneWaste: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Environmental Benefit Score</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={copperValorizationForm.environmentalBenefitScore}
                onChange={(e) => setCopperValorizationForm({ ...copperValorizationForm, environmentalBenefitScore: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>
      );
    }

    // Default fallback for aluminum/steel or unmatched nodes
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Process Configuration</h3>
        <p className="text-sm text-gray-600">
          Configure parameters for {selectedNode.data.label} in the {selectedNode.data.stageName} stage.
        </p>
        <div className="text-xs text-gray-500 italic">
          Generic aluminum/steel forms - detailed parameters coming soon.
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-white flex flex-col relative">
      <AnimatePresence>
        {showWelcomeOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl border border-[#efe4d5] max-h-[85vh] overflow-y-auto"
            >
              <div className="relative z-10 flex flex-col items-center justify-center px-6 py-8">
                {welcomeStage === 'metal' ? (
                  // STAGE 1: METAL SELECTION
                  <>
                    <div className="text-center mb-6 space-y-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Choose Your Metal</h1>
                      <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                        Select the metal type for your canvas lifecycle assessment project
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full">
                      {/* Aluminum Card */}
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="cursor-pointer"
                        onClick={() => handleMetalSelection('aluminum')}
                      >
                        <div className="bg-white border-[#E0D5CC] hover:border-[#6B5B59] border-2 hover:shadow-xl transition-all duration-300 h-full rounded-2xl overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E5D9CF] via-[#F7F1EA] to-[#DED2C9] border-2 border-[#CFC2B9] flex items-center justify-center shadow-md relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/40 to-transparent"></div>
                                <Zap className="w-7 h-7 text-[#6B5B59] relative z-10" strokeWidth={2.5} />
                              </div>
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1EBE5] border border-[#E3D7CF] rounded-full">
                                <Sparkles className="w-3.5 h-3.5 text-[#6B5B59]" />
                                <span className="text-xs font-medium text-[#6B5B59]">Available</span>
                              </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">Aluminum</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Complete lifecycle assessment for aluminum production and recycling
                            </p>
                            <div className="space-y-2 text-gray-700 text-sm mb-4">
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B59] mt-1.5" />
                                <p className="flex-1">Mining and ore extraction analysis</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B59] mt-1.5" />
                                <p className="flex-1">Beneficiation and refining processes</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B59] mt-1.5" />
                                <p className="flex-1">Manufacturing and recycling workflows</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B59] mt-1.5" />
                                <p className="flex-1">Visual canvas-based design</p>
                              </div>
                            </div>
                            <Button className="w-full bg-gradient-to-r from-[#6B5B59] to-[#5C4F4B] hover:from-[#5C4F4B] hover:to-[#4F4441] text-white font-semibold py-4 text-base shadow-md transition-all">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Start with Aluminum
                            </Button>
                          </div>
                        </div>
                      </motion.div>

                      {/* Copper Card */}
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="cursor-pointer"
                        onClick={() => handleMetalSelection('copper')}
                      >
                        <div className="bg-white border-[#E8D0C3] hover:border-[#BA7967] border-2 hover:shadow-xl transition-all duration-300 h-full rounded-2xl overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#EACFC1] via-[#BA7967] to-[#A86B5C] border-2 border-[#A86B5C] flex items-center justify-center shadow-md relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent"></div>
                                <Zap className="w-7 h-7 text-white relative z-10" strokeWidth={2.5} />
                              </div>
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5E8E2] border border-[#E6CEC1] rounded-full">
                                <Sparkles className="w-3.5 h-3.5 text-[#BA7967]" />
                                <span className="text-xs font-medium text-[#BA7967]">Available</span>
                              </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">Copper</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Complete lifecycle assessment for copper production and recycling
                            </p>
                            <div className="space-y-2 text-gray-700 text-sm mb-4">
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#BA7967] mt-1.5" />
                                <p className="flex-1">Mining and ore extraction analysis</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#BA7967] mt-1.5" />
                                <p className="flex-1">Smelting and refining processes</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#BA7967] mt-1.5" />
                                <p className="flex-1">Manufacturing and recycling workflows</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#BA7967] mt-1.5" />
                                <p className="flex-1">Visual canvas-based design</p>
                              </div>
                            </div>
                            <Button className="w-full bg-gradient-to-r from-[#BA7967] to-[#A86B5C] hover:from-[#A86B5C] hover:to-[#915B4F] text-white font-semibold py-4 text-base shadow-md transition-all">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Start with Copper
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-gray-500 text-xs">More metals will be available soon. Stay tuned!</p>
                    </div>
                  </>
                ) : (
                  // STAGE 2: PROJECT CREATION
                  <>
                    <div className="w-full max-w-6xl space-y-6">
                      <div className="flex flex-col gap-3 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className={`text-xs uppercase tracking-[0.3em] ${selectedMetal === 'copper' ? 'text-[#BA7967]' : 'text-[#6B5B59]'} font-semibold`}>
                            Step 2
                          </p>
                          <h2 className="text-2xl font-bold text-gray-900 mt-1">How would you like to continue?</h2>
                          <p className="text-sm text-gray-600 mt-1">
                            Build a fresh {selectedMetal} canvas or relaunch one you worked on earlier.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className={`flex items-center gap-1.5 rounded-full ${selectedMetal === 'copper' ? 'bg-[#F5E8E2] text-[#BA7967]' : 'bg-[#F1EBE5] text-[#6B5B59]'} px-3 py-1.5 text-xs`}>
                            <Sparkles className="h-3.5 w-3.5" />
                            {selectedMetal === 'copper' ? 'Copper' : 'Aluminum'} mode unlocked
                          </div>
                          <Button variant="ghost" onClick={handleBackToMetals} className="text-gray-600 hover:text-gray-900 text-sm">
                            <ChevronDown className="h-3.5 w-3.5 mr-1.5 rotate-90" />
                            Change metal
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Create New Project Card */}
                        <div className={`rounded-2xl ${selectedMetal === 'copper' ? 'border-[#EDD8CB]' : 'border-[#DDD1C9]'} bg-white shadow-lg border`}>
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl ${selectedMetal === 'copper' ? 'bg-[#F2E2DA] text-[#BA7967]' : 'bg-[#E8DDD6] text-[#5A4D49]'}`}>
                                  <Plus className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className={`text-xs uppercase tracking-[0.4em] ${selectedMetal === 'copper' ? 'text-[#BA7967]' : 'text-[#6B5B59]'} font-semibold`}>
                                    Create
                                  </p>
                                  <h3 className="text-xl font-semibold text-gray-900">New canvas</h3>
                                </div>
                              </div>
                              <span className={`text-xs font-medium ${selectedMetal === 'copper' ? 'text-[#BA7967]' : 'text-[#6B5B59]'}`}>
                                Guided flow
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                              Name your canvas and jot down a short purpose. We'll pin it to this workspace for {selectedMetal}.
                            </p>
                            <form className="space-y-4" onSubmit={handleProjectDetailsSubmit}>
                              <div className="space-y-1.5">
                                <label htmlFor="canvas-project-name" className="text-xs font-medium text-gray-700">
                                  Project name
                                </label>
                                <Input
                                  id="canvas-project-name"
                                  placeholder="Lifecycle retrofit blueprint"
                                  value={projectNameInput}
                                  onChange={(e) => setProjectNameInput(e.target.value)}
                                  className="h-10 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="canvas-project-description" className="text-xs font-medium text-gray-700">
                                  Description
                                </label>
                                <textarea
                                  id="canvas-project-description"
                                  rows={3}
                                  placeholder="Interactive canvas used during the valorization pilot."
                                  value={projectDescriptionInput}
                                  onChange={(e) => setProjectDescriptionInput(e.target.value)}
                                  className={`w-full rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white ${selectedMetal === 'copper' ? 'focus:border-[#BA7967] focus:ring-[#BA7967]/20' : 'focus:border-[#6B5B59] focus:ring-[#6B5B59]/15'} focus:ring-2 px-3 py-2 text-sm text-gray-800 transition`}
                                />
                              </div>
                              <div className={`rounded-xl ${selectedMetal === 'copper' ? 'bg-[#F9F0EC] border-[#EDD8CB]' : 'bg-[#F5EEE9] border-[#DDD1C9]'} border border-dashed p-3 text-xs ${selectedMetal === 'copper' ? 'text-[#8A5A4A]' : 'text-[#4C413D]'}`}>
                                We'll auto-save these details locally and surface them inside the recent projects panel.
                              </div>
                              <Button
                                type="submit"
                                disabled={!projectNameInput.trim()}
                                className={`w-full h-10 text-sm font-semibold ${selectedMetal === 'copper' ? 'bg-[#BA7967] hover:bg-[#A86B5C]' : 'bg-[#6B5B59] hover:bg-[#5C4F4B]'} disabled:bg-gray-300 disabled:text-gray-500 text-white`}
                              >
                                Pin to canvas
                              </Button>
                            </form>
                          </div>
                        </div>

                        {/* Recent Projects Card */}
                        <div className={`rounded-2xl ${selectedMetal === 'copper' ? 'bg-gradient-to-br from-[#FBF3EF] via-[#FDF8F5] to-white' : 'bg-gradient-to-br from-[#F7F2EE] via-[#F9F6F3] to-white'} shadow-lg relative overflow-hidden border ${selectedMetal === 'copper' ? 'border-[#EDD8CB]' : 'border-[#DDD1C9]'}`}>
                          <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${selectedMetal === 'copper' ? 'from-[#EFDCD1]/60' : 'from-[#E4D8D0]/60'} to-transparent`} />
                          <div className="relative p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl ${selectedMetal === 'copper' ? 'bg-white/80 text-[#BA7967]' : 'bg-white/80 text-[#6B5B59]'} shadow`}>
                                  <FolderOpen className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className={`text-xs uppercase tracking-[0.4em] ${selectedMetal === 'copper' ? 'text-[#B07260]' : 'text-[#6B5B59]'} font-semibold`}>
                                    Open
                                  </p>
                                  <h3 className={`text-xl font-semibold ${selectedMetal === 'copper' ? 'text-[#8A5A4A]' : 'text-[#4C413D]'}`}>
                                    Recent drafts
                                  </h3>
                                </div>
                              </div>
                              <span className={`text-xs font-medium ${selectedMetal === 'copper' ? 'text-[#A86B5C]' : 'text-[#86756F]'}`}>
                                {recentProjects.length ? `${recentProjects.length} saved` : 'Coming soon'}
                              </span>
                            </div>

                            <div className={`rounded-xl ${selectedMetal === 'copper' ? 'bg-white/80 border-[#EBD5C7]' : 'bg-white/80 border-[#DAD0C8]'} border p-3`}>
                              <p className={`text-xs ${selectedMetal === 'copper' ? 'text-[#8A5A4A]' : 'text-[#4C413D]'} font-medium`}>
                                Pull the drawer down
                              </p>
                              <p className={`text-xs ${selectedMetal === 'copper' ? 'text-[#A97A69]' : 'text-[#6F615C]'}`}>
                                We'll surface your previously opened canvas sessions here. No dummy data until you've actually run projects.
                              </p>
                            </div>

                            <div className={`rounded-2xl border border-dashed ${selectedMetal === 'copper' ? 'border-[#E8CFC0]' : 'border-[#D7CBC3]'} bg-white/80 overflow-hidden`}>
                              <button
                                type="button"
                                onClick={() => setOpenProjectsExpanded((prev) => !prev)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left"
                              >
                                <div>
                                  <p className={`text-xs font-semibold ${selectedMetal === 'copper' ? 'text-[#8A5A4A]' : 'text-[#4C413D]'}`}>
                                    Local canvas drafts
                                  </p>
                                  <p className={`text-xs ${selectedMetal === 'copper' ? 'text-[#B27A66]' : 'text-[#7C6F6A]'}`}>
                                    {recentProjects.length ? 'Tap to view your latest saved project' : 'No local drafts yet'}
                                  </p>
                                </div>
                                {openProjectsExpanded ? (
                                  <ChevronUp className={`h-4 w-4 ${selectedMetal === 'copper' ? 'text-[#C08B76]' : 'text-[#A89A93]'}`} />
                                ) : (
                                  <ChevronDown className={`h-4 w-4 ${selectedMetal === 'copper' ? 'text-[#C08B76]' : 'text-[#A89A93]'}`} />
                                )}
                              </button>
                              <div
                                className={`transition-[max-height] duration-300 ${openProjectsExpanded ? 'max-h-96' : 'max-h-0'} overflow-hidden`}
                              >
                                <div className={`px-4 pb-4 space-y-2 text-xs ${selectedMetal === 'copper' ? 'text-[#8A5A4A]' : 'text-[#4C413D]'}`}>
                                  {recentProjects.length ? (
                                    recentProjects.map((project) => {
                                      const savedAt = project.updatedAt
                                        ? new Date(project.updatedAt).toLocaleDateString()
                                        : 'Just now';
                                      return (
                                        <div
                                          key={`${project.name}-${project.updatedAt}`}
                                          className={`rounded-xl border border-dashed ${selectedMetal === 'copper' ? 'border-[#E4C5B4] bg-[#F9EFEA]' : 'border-[#D6C9C2] bg-[#F4ECE7]'} px-3 py-2`}
                                        >
                                          <p className="font-semibold text-gray-900 text-sm">{project.name}</p>
                                          {project.description && (
                                            <p className="text-gray-600 mt-1 text-xs">{project.description}</p>
                                          )}
                                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                                            <Sparkles className="h-3 w-3" />
                                            Saved {savedAt}
                                          </p>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <p className={`text-xs ${selectedMetal === 'copper' ? 'text-[#B27A66]' : 'text-[#7C6F6A]'}`}>
                                      Create a project on the left to populate this list.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <p className={`text-xs ${selectedMetal === 'copper' ? 'text-[#A26956]' : 'text-[#7C6F6A]'}`}>
                              Want this to auto-populate? Connect your canvas history API and hydrate the list with real sessions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showWelcomeOverlay && (
        <button
          type="button"
          onClick={() => setShowWelcomeOverlay(true)}
          className="fixed bottom-6 right-6 z-20 inline-flex items-center gap-2 rounded-full bg-[#c17a64] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#c17a64]/40 hover:bg-[#a8654d]"
        >
          <Sparkles className="h-4 w-4" />
          Canvas starter
        </button>
      )}

      {projectSummary?.name && (
        <div className="px-6 pt-6">
          <div className="max-w-4xl mx-auto rounded-3xl border border-[#f1e7da] bg-white px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#9a7a62] font-semibold">Active canvas</p>
              <h3 className="text-2xl font-semibold text-gray-900 mt-1">{projectSummary.name}</h3>
              {projectSummary.description && (
                <p className="text-gray-600 mt-1">{projectSummary.description}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-2 rounded-full bg-[#F7EFE5] text-sm font-semibold text-[#7d5d46]">
                Last saved {projectSummary.updatedAt ? new Date(projectSummary.updatedAt).toLocaleString() : 'just now'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-900"
                onClick={clearProjectSummary}
              >
                Reset details
              </Button>
            </div>
          </div>
        </div>
      )}

  <div className={`flex flex-1 min-h-0 ${projectSummary?.name ? 'mt-4' : ''}`}>
        {/* LEFT SIDEBAR */}
        {leftSidebarOpen && (
          <div
            className="shrink-0 border-r overflow-y-auto h-full"
            style={{ width: `${leftSidebarWidth}px`, backgroundColor: palette.sidebar, borderColor: palette.border }}
          >
            <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: palette.neutralDarkText }}>Metal LCA Canvas</h2>
              <button onClick={() => setLeftSidebarOpen(false)} className="p-1 hover:bg-gray-200 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metal Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2" style={{ color: palette.neutralDarkText }}>Select Metal</label>
              <div className="flex gap-2">
                {metals.map((metal) => (
                  <button
                    key={metal.id}
                    onClick={() => setSelectedMetal(metal.id)}
                    className="flex-1 px-3 py-2 text-sm rounded-md transition-colors"
                    style={{
                      backgroundColor: selectedMetal === metal.id ? palette.accent : palette.cardBg,
                      color: selectedMetal === metal.id ? '#FFFFFF' : palette.neutralDarkText,
                      border: `1px solid ${palette.cardBorder}`,
                    }}
                  >
                    {metal.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={saveProject}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors flex-1"
                style={{ backgroundColor: palette.accent, color: '#FFFFFF' }}
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <label className="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors flex-1 cursor-pointer"
                style={{ backgroundColor: palette.cardBg, color: palette.neutralDarkText, border: `1px solid ${palette.cardBorder}` }}
              >
                <Upload className="w-4 h-4" />
                Load
                <input type="file" accept=".json" onChange={loadProject} className="hidden" />
              </label>
            </div>

            {/* Stage Categories */}
            <div className="space-y-2">
              {processCategories.map((category) => (
                <div key={category.id}>
                  <button
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                    style={{
                      backgroundColor: selectedCategory === category.id ? palette.accent : palette.cardBg,
                      color: selectedCategory === category.id ? '#FFFFFF' : palette.neutralDarkText,
                      border: `1px solid ${palette.cardBorder}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <category.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${selectedCategory === category.id ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {selectedCategory === category.id && category.nodes.length > 0 && (
                    <div className="mt-2 ml-4 space-y-2">
                      {category.nodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => addProcessNode(node)}
                          className="w-full flex items-center gap-2 p-2 rounded-md transition-colors text-left"
                          style={{
                            backgroundColor: palette.cardBg,
                            color: palette.neutralDarkText,
                            border: `1px solid ${palette.cardBorder}`,
                          }}
                        >
                          <Plus className="w-3 h-3" />
                          <span className="text-xs">{node.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resize Handle - Left */}
        {leftSidebarOpen && (
          <div
            className="w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
            style={{ backgroundColor: palette.border }}
            onMouseDown={handleMouseDownLeft}
          />
        )}

        {/* MAIN CANVAS */}
        <div className="flex-1 relative min-h-0">
          {!leftSidebarOpen && (
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="absolute top-4 left-4 z-10 p-2 rounded-md shadow-md"
              style={{ backgroundColor: palette.accent, color: '#FFFFFF' }}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeUpdate={onEdgeUpdate}
            onEdgeUpdateStart={onEdgeUpdateStart}
            onEdgeUpdateEnd={onEdgeUpdateEnd}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            style={{ width: '100%', height: '100%' }}
          >
            <Background color={palette.border} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Resize Handle - Right */}
        {rightSidebarOpen && (
          <div
            className="w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
            style={{ backgroundColor: palette.border }}
            onMouseDown={handleMouseDownRight}
          />
        )}

        {/* RIGHT SIDEBAR - Inspector */}
        {rightSidebarOpen && (
          <div
            className="shrink-0 border-l overflow-y-auto h-full"
            style={{ width: `${rightSidebarWidth}px`, backgroundColor: palette.sidebar, borderColor: palette.border }}
          >
            <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: palette.neutralDarkText }}>Inspector</h2>
              <button onClick={() => setRightSidebarOpen(false)} className="p-1 hover:bg-gray-200 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedNode ? (
              <>
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: palette.cardBg, border: `1px solid ${palette.cardBorder}` }}>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: palette.neutralDarkText }}>
                    {selectedNode.data.label}
                  </h3>
                  <p className="text-xs" style={{ color: palette.neutralLightText }}>
                    {selectedNode.data.stageName}
                  </p>
                </div>

                {renderInspectorContent()}

                <button
                  onClick={deleteSelectedNode}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors"
                  style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Node
                </button>
              </>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">
                Select a node to view and edit its parameters
              </div>
            )}
          </div>
        </div>
        )}

        {!rightSidebarOpen && selectedNode && (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="absolute top-4 right-4 z-10 p-2 rounded-md shadow-md"
            style={{ backgroundColor: palette.accent, color: '#FFFFFF' }}
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasFlow />
    </ReactFlowProvider>
  );
}