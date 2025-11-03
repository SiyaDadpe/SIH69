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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ChevronDown,
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
  Link,
  Eraser,
  Box,
  Boxes,
  Layers,
  Construction,
} from 'lucide-react';

const palette = {
  background: '#F3F2EC',
  sidebar: '#FFFFFF', // Changed from cream to white for left sidebar
  border: '#E3DACB',
  cardBorder: '#E6DDCD',
  accent: '#C17A64',
  accentHover: '#AE6A53',
  neutralBadge: '#ECE2D2',
  neutralDarkText: '#5E5248',
  neutralLightText: '#836F62',
};

// Icon mapping for each process type
const processIcons = {
  // Extraction
  openPitMining: Pickaxe,
  stripMining: Construction,
  drillingBlasting: Hammer,
  hydraulicMining: Droplet,
  manualExtraction: HardHat,
  electricShovel: Factory,
  dieselHaulTrucks: Truck,
  insituLeaching: FlaskConical,
  customExtraction: CirclePlus,
  
  // Processing
  crushing: Hammer,
  grinding: Cog,
  washingScreening: Sparkles,
  magneticSeparation: Magnet,
  gravitySeparation: Scale,
  floatationMethod: Droplet,
  drySeparation: Wind,
  customProcessing: CirclePlus,
  
  // Alumina Refining
  aluminaCrushing: Hammer,
  digestion: FlaskConical,
  clarification: Gem,
  precipitation: Snowflake,
  calcination: Flame,
  otherRefining: CirclePlus,
  
  // Smelting
  preBakingAnodes: Flame,
  electrolysis: Zap,
  anodeEffectControl: Gauge,
  bathChemistryManagement: FlaskConical,
  offGasTreatment: Cloud,
  othersPleaseSpecify: CirclePlus,
  
  // Manufacturing
  casting: Building2,
  rolling: TrendingDown,
  extrusion: Wrench,
  forgingDF: Hammer,
  surfaceTreatment: Sparkle,
  joiningProcesses: Link,
  designForRecycling: Recycle,
  othersManufacturing: CirclePlus,
  
  // Recycling
  collection: Trash2,
  sorting: Package,
  cleaning: Eraser,
  remelting: Flame,
  realloying: FlaskConical,
  castingIntoNewProducts: Box,
  othersRecycling: CirclePlus,
  
  // Valorization
  redMudValorization: Boxes,
  spentPotLiningTreatment: Zap,
  drossRecovery: Gem,
  fluorideGasRecovery: Cloud,
  slagUtilization: Layers,
  otherWasteValorization: CirclePlus,
};


// ----- Custom Node for ReactFlow -----
const ProcessNode = ({ data }) => {
  // Get icon from processIcons mapping using typeId
  const IconComponent = data.typeId && processIcons[data.typeId] 
    ? processIcons[data.typeId] 
    : (typeof data.icon === 'function' ? data.icon : Factory);
  const badgeBg = data.badgeBg || palette.neutralBadge;
  const badgeBorder = data.badgeBorder || palette.cardBorder;
  const badgeText = data.badgeText || palette.neutralDarkText;
  const iconColor = data.iconColor || palette.neutralLightText;

  return (
    <div
      className="rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 border"
      style={{ borderColor: palette.cardBorder }}
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
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  // UI state
  const [expandedCategories, setExpandedCategories] = useState({
    extraction: true,
    processing: true,
    alumina_refining: true,
    smelting: true,
    manufacturing: true,
    recycling: true,
    valorization: true,
  });
  const [selectedCategory, setSelectedCategory] = useState('extraction');
  const [selectedMetal, setSelectedMetal] = useState('all');
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(320); // 80 * 4 = 320px (w-80)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const opmDefaults = useMemo(() => ({
    oreGrade: 45,
    overburdenRatio: 3.2,
    equipmentType: 'Electric',
    waterUsage: 0.05,
    landUseImpact: 'Moderate',
    redMudGeneration: 120,
  }), []);
  const [opmForm, setOpmForm] = useState(opmDefaults);

  // Processing stage form defaults (Magnetic Separation)
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

  // Alumina Refining stage form defaults (Crushing/Bayer Process)
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

  // Smelting stage form defaults (Electrolysis/Hall-Héroult Process)
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

  // Manufacturing stage form defaults
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

  // Valorization stage form defaults (Red Mud & Waste Treatment)
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

  // Recycling stage form defaults
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

  // Custom process name for "others/custom" processes
  const [customProcessName, setCustomProcessName] = useState('');

  // Stages data
  const stages = [
    { id: 'extraction', label: 'Stage 1: Extraction' },
    { id: 'processing', label: 'Stage 2: Processing' },
    { id: 'alumina_refining', label: 'Stage 3: Alumina Refining' },
    { id: 'smelting', label: 'Stage 4: Smelting' },
    { id: 'manufacturing', label: 'Stage 5: Manufacturing' },
    { id: 'recycling', label: 'Stage 6: Recycling' },
    { id: 'valorization', label: 'Stage 7: Valorization' },
  ];

  // Available metals
  const metals = [
    { id: 'aluminum', label: 'Aluminum' },
    { id: 'steel', label: 'Steel' },
  ];

  // Process types data (unchanged)
  const processTypes = [
    // Stage 1: Extraction
    { id: 'openPitMining', label: 'Open Pit Mining', stage: 'extraction', metal: 'all', emoji: '⛏️' },
    { id: 'stripMining', label: 'Strip Mining', stage: 'extraction', metal: 'all', emoji: '🏗️' },
    { id: 'drillingBlasting', label: 'Drilling & Blasting', stage: 'extraction', metal: 'all', emoji: '💥' },
    { id: 'hydraulicMining', label: 'Hydraulic Mining', stage: 'extraction', metal: 'all', emoji: '💧' },
    { id: 'manualExtraction', label: 'Manual Extraction', stage: 'extraction', metal: 'all', emoji: '👷' },
    { id: 'electricShovel', label: 'Electric Shovel / Excavator', stage: 'extraction', metal: 'all', emoji: '🚜' },
    { id: 'dieselHaulTrucks', label: 'Diesel-powered Haul Trucks', stage: 'extraction', metal: 'all', emoji: '🚚' },
    { id: 'insituLeaching', label: 'In-situ Leaching (experimental)', stage: 'extraction', metal: 'all', emoji: '🧪' },
    { id: 'customExtraction', label: 'Others (custom)', stage: 'extraction', metal: 'all', emoji: '➕' },
    
    // Stage 2: Processing
    { id: 'crushing', label: 'Crushing', stage: 'processing', metal: 'all', emoji: '🔨' },
    { id: 'grinding', label: 'Grinding', stage: 'processing', metal: 'all', emoji: '⚙️' },
    { id: 'washingScreening', label: 'Washing and Screening', stage: 'processing', metal: 'all', emoji: '🚿' },
    { id: 'magneticSeparation', label: 'Magnetic Separation', stage: 'processing', metal: 'all', emoji: '🧲' },
    { id: 'gravitySeparation', label: 'Gravity Separation', stage: 'processing', metal: 'all', emoji: '⚖️' },
    { id: 'floatationMethod', label: 'Floatation Method', stage: 'processing', metal: 'all', emoji: '🫧' },
    { id: 'drySeparation', label: 'Dry Separation', stage: 'processing', metal: 'all', emoji: '💨' },
    { id: 'customProcessing', label: 'Other (Custom)', stage: 'processing', metal: 'all', emoji: '➕' },
    
    // Stage 3: Alumina Refining
    { id: 'aluminaCrushing', label: 'Crushing', stage: 'alumina_refining', metal: 'aluminum', emoji: '🔨' },
    { id: 'digestion', label: 'Digestion', stage: 'alumina_refining', metal: 'aluminum', emoji: '🧬' },
    { id: 'clarification', label: 'Clarification', stage: 'alumina_refining', metal: 'aluminum', emoji: '💎' },
    { id: 'precipitation', label: 'Precipitation', stage: 'alumina_refining', metal: 'aluminum', emoji: '❄️' },
    { id: 'calcination', label: 'Calcination', stage: 'alumina_refining', metal: 'aluminum', emoji: '🔥' },
    { id: 'otherRefining', label: 'Other', stage: 'alumina_refining', metal: 'aluminum', emoji: '➕' },
    
    // Stage 4: Smelting
    { id: 'preBakingAnodes', label: 'Pre-baking anodes (heat treatment)', stage: 'smelting', metal: 'all', emoji: '🔥' },
    { id: 'electrolysis', label: 'Electrolysis (cell operation)', stage: 'smelting', metal: 'all', emoji: '⚡' },
    { id: 'anodeEffectControl', label: 'Anode effect control (stability maintenance)', stage: 'smelting', metal: 'all', emoji: '🎛️' },
    { id: 'bathChemistryManagement', label: 'Bath chemistry management (fluoride & alumina concentration)', stage: 'smelting', metal: 'all', emoji: '🧪' },
    { id: 'offGasTreatment', label: 'Off-gas treatment (scrubber systems)', stage: 'smelting', metal: 'all', emoji: '🌫️' },
    { id: 'othersPleaseSpecify', label: 'Others (please specify)', stage: 'smelting', metal: 'all', emoji: '➕' },
    
    // Stage 5: Manufacturing
    { id: 'casting', label: 'Casting (ingots, billets – high-temperature energy)', stage: 'manufacturing', metal: 'all', emoji: '🏭' },
    { id: 'rolling', label: 'Rolling (sheet metal – mechanical deformation)', stage: 'manufacturing', metal: 'all', emoji: '📊' },
    { id: 'extrusion', label: 'Extrusion (tubes, profiles – efficient shaping)', stage: 'manufacturing', metal: 'all', emoji: '🔧' },
    { id: 'forgingDF', label: 'Forging (metal strengthening, scrap generation)', stage: 'manufacturing', metal: 'all', emoji: '🔨' },
    { id: 'surfaceTreatment', label: 'Surface Treatment (anodizing, coating – chemical & energy use)', stage: 'manufacturing', metal: 'all', emoji: '✨' },
    { id: 'joiningProcesses', label: 'Joining Processes (welding, mechanical fastening – emissions, waste)', stage: 'manufacturing', metal: 'all', emoji: '🔗' },
    { id: 'designForRecycling', label: 'Design for Recycling (optimized alloys, less contamination)', stage: 'manufacturing', metal: 'all', emoji: '♻️' },
    { id: 'othersManufacturing', label: 'Others (please specify)', stage: 'manufacturing', metal: 'all', emoji: '➕' },
    
    // Stage 6: Recycling
    { id: 'collection', label: 'Collection (scrap gathering – manual or automated)', stage: 'recycling', metal: 'all', emoji: '🗑️' },
    { id: 'sorting', label: 'Sorting', stage: 'recycling', metal: 'all', emoji: '🔀' },
    { id: 'cleaning', label: 'Cleaning (removal of coatings, oils)', stage: 'recycling', metal: 'all', emoji: '🧼' },
    { id: 'remelting', label: 'Remelting (furnace heating – energy intensive)', stage: 'recycling', metal: 'all', emoji: '🔥' },
    { id: 'realloying', label: 'Re-alloying (composition adjustment)', stage: 'recycling', metal: 'all', emoji: '⚗️' },
    { id: 'castingIntoNewProducts', label: 'Casting into new products (e.g., cans, construction materials)', stage: 'recycling', metal: 'all', emoji: '📦' },
    { id: 'othersRecycling', label: 'Others (please specify)', stage: 'recycling', metal: 'all', emoji: '➕' },
    
    // Stage 7: Valorization
    { id: 'redMudValorization', label: 'Red Mud Valorization', stage: 'valorization', metal: 'all', emoji: '🧱' },
    { id: 'spentPotLiningTreatment', label: 'Spent Pot Lining (SPL) Treatment', stage: 'valorization', metal: 'all', emoji: '⚡' },
    { id: 'drossRecovery', label: 'Dross Recovery', stage: 'valorization', metal: 'all', emoji: '💎' },
    { id: 'fluorideGasRecovery', label: 'Fluoride Gas Recovery', stage: 'valorization', metal: 'all', emoji: '🌫️' },
    { id: 'slagUtilization', label: 'Slag Utilization', stage: 'valorization', metal: 'all', emoji: '🏗️' },
    { id: 'otherWasteValorization', label: 'Other Waste Valorization', stage: 'valorization', metal: 'all', emoji: '➕' },
  ];

  // Stage configuration with icons and colors
  const stageConfig = {
    extraction: {
      icon: Factory,
      name: 'Extraction',
      emoji: '⛏️',
      badgeBg: '#C47D65',
      badgeText: '#FFFFFF',
      badgeBorder: '#C47D65',
      iconColor: '#FFFFFF',
      accentColor: '#C47D65',
    },
    processing: {
      icon: Wrench,
      name: 'Processing',
      emoji: '⚙️',
      badgeBg: '#C47D65',
      badgeText: '#FFFFFF',
      badgeBorder: '#C47D65',
      iconColor: '#FFFFFF',
      accentColor: '#C47D65',
    },
    alumina_refining: {
      icon: Settings,
      name: 'Alumina Refining',
      emoji: '🔬',
      badgeBg: '#C47D65',
      badgeText: '#FFFFFF',
      badgeBorder: '#C47D65',
      iconColor: '#FFFFFF',
      accentColor: '#C47D65',
    },
    smelting: {
      icon: Zap,
      name: 'Smelting',
      emoji: '🔥',
     badgeBg: '#C47D65',
      badgeText: '#FFFFFF',
      badgeBorder: '#C47D65',
      iconColor: '#FFFFFF',
      accentColor: '#C47D65',
    },
    manufacturing: {
      icon: Package,
      name: 'Manufacturing',
      emoji: '🏭',
      badgeBg: '#C47D65',
      badgeText: '#FFFFFF',
      badgeBorder: '#C47D65',
      iconColor: '#FFFFFF',
      accentColor: '#C47D65',
    },
    recycling: {
      icon: Recycle,
      name: 'Recycling',
      emoji: '♻️',
     badgeBg: '#C47D65',
      badgeText: '#FFFFFF',
      badgeBorder: '#C47D65',
      iconColor: '#FFFFFF',
      accentColor: '#C47D65',
    },
    valorization: {
      icon: TrendingUp,
      name: 'Valorization',
      emoji: '💎',
      badgeBg: '#C47D65',
      badgeText: '#FFFFFF',
      badgeBorder: '#C47D65',
      iconColor: '#FFFFFF',
      accentColor: '#C47D65',
    },
  };

  // Helper functions
  const getProcessDescription = (processId) => {
    const descriptions = {
      openPitMining: 'Large-scale surface mining method',
      stripMining: 'Surface mining technique for shallow deposits',
      drillingBlasting: 'Rock breaking technique using explosives',
      hydraulicMining: 'Water-based extraction method',
      manualExtraction: 'Hand-operated extraction processes',
      electricShovel: 'Electric-powered excavation equipment',
      dieselHaulTrucks: 'Diesel-powered material transport',
      insituLeaching: 'In-place mineral extraction technique',
      customExtraction: 'Custom extraction methods',
      crushing: 'Reduce ore size for further processing',
      grinding: 'Fine grinding for mineral liberation',
      washingScreening: 'Clean and size-separate materials',
      magneticSeparation: 'Separate magnetic materials',
      gravitySeparation: 'Density-based material separation',
      floatationMethod: 'Surface chemistry separation',
      drySeparation: 'Air-based separation techniques',
      customProcessing: 'Custom processing methods',
      aluminaCrushing: 'Crush bauxite for alumina extraction',
      digestion: 'Dissolve alumina from bauxite',
      clarification: 'Remove impurities from solution',
      precipitation: 'Crystallize alumina from solution',
      calcination: 'Heat treatment to remove water',
      otherRefining: 'Other alumina refining processes',
      preBakingAnodes: 'Heat treatment of carbon anodes',
      electrolysis: 'Electrochemical reduction process',
      anodeEffectControl: 'Maintain stable electrolysis',
      bathChemistryManagement: 'Control electrolyte composition',
      offGasTreatment: 'Clean emissions from smelting',
      othersPleaseSpecify: 'Other smelting processes',
      casting: 'Shape molten metal into forms',
      rolling: 'Deform metal into sheets',
      extrusion: 'Force metal through dies',
      forgingDF: 'Shape metal under pressure',
      surfaceTreatment: 'Apply protective coatings',
      joiningProcesses: 'Connect metal components',
      designForRecycling: 'Optimize for end-of-life recovery',
      othersManufacturing: 'Other manufacturing processes',
      collection: 'Gather scrap materials',
      sorting: 'Separate materials by type',
      cleaning: 'Remove contaminants',
      remelting: 'Melt scrap for reuse',
      realloying: 'Adjust metal composition',
      castingIntoNewProducts: 'Form new products from scrap',
      othersRecycling: 'Other recycling processes',
      redMudValorization: 'Extract value from bauxite residue',
      spentPotLiningTreatment: 'Process used electrolysis cells',
      drossRecovery: 'Recover metal from dross',
      fluorideGasRecovery: 'Capture and reuse fluorides',
      slagUtilization: 'Use slag as construction material',
      otherWasteValorization: 'Other waste valorization methods',
    };
    return descriptions[processId] || 'Process description not available';
  };

  const getCircularityImpact = (processId) => {
    const impacts = {
      openPitMining: -30, stripMining: -25, drillingBlasting: -20, hydraulicMining: -15,
      manualExtraction: -10, electricShovel: -20, dieselHaulTrucks: -25, insituLeaching: -5,
      customExtraction: -15, crushing: -8, grinding: -10, washingScreening: -5, magneticSeparation: -3,
      gravitySeparation: -2, floatationMethod: -6, drySeparation: -4, customProcessing: -5,
      aluminaCrushing: -5, digestion: -8, clarification: -3, precipitation: -4,
      calcination: -6, otherRefining: -5, preBakingAnodes: -8, electrolysis: -12, anodeEffectControl: -2, 
      bathChemistryManagement: -3, offGasTreatment: -1, othersPleaseSpecify: -6, casting: 0, rolling: 2, 
      extrusion: 3, forgingDF: 1, surfaceTreatment: -2, joiningProcesses: -1, designForRecycling: 15, 
      othersManufacturing: 0, collection: 20, sorting: 15, cleaning: 10, remelting: 25, realloying: 20,
      castingIntoNewProducts: 30, othersRecycling: 15, redMudValorization: 35, spentPotLiningTreatment: 40, 
      drossRecovery: 30, fluorideGasRecovery: 25, slagUtilization: 20, otherWasteValorization: 25,
    };
    return impacts[processId] || 0;
  };

  const getCO2Impact = (processId) => {
    const impacts = {
      openPitMining: 2000, stripMining: 1500, drillingBlasting: 1200, hydraulicMining: 800,
      manualExtraction: 200, electricShovel: 1000, dieselHaulTrucks: 1500, insituLeaching: 300,
      customExtraction: 1000, crushing: 400, grinding: 600, washingScreening: 200, magneticSeparation: 100,
      gravitySeparation: 50, floatationMethod: 300, drySeparation: 150, customProcessing: 200,
      aluminaCrushing: 200, digestion: 800, clarification: 100, precipitation: 200,
      calcination: 600, otherRefining: 300, preBakingAnodes: 500, electrolysis: 2000, anodeEffectControl: 50, 
      bathChemistryManagement: 100, offGasTreatment: 200, othersPleaseSpecify: 800, casting: 400, rolling: 300, 
      extrusion: 200, forgingDF: 250, surfaceTreatment: 150, joiningProcesses: 100, designForRecycling: -100, 
      othersManufacturing: 200, collection: -50, sorting: -30, cleaning: -20, remelting: -500, realloying: -300,
      castingIntoNewProducts: -800, othersRecycling: -200, redMudValorization: -600, spentPotLiningTreatment: -400, 
      drossRecovery: -300, fluorideGasRecovery: -200, slagUtilization: -150, otherWasteValorization: -250,
    };
    return impacts[processId] || 0;
  };

  const getProcessDuration = (processId) => {
    const durations = {
      openPitMining: '2-5 years', stripMining: '1-3 years', drillingBlasting: '6-12 months',
      hydraulicMining: '3-6 months', manualExtraction: '1-3 months', electricShovel: '6-12 months',
      dieselHaulTrucks: '6-12 months', insituLeaching: '1-2 years', customExtraction: '6-12 months',
      crushing: '1-3 months', grinding: '2-6 months', washingScreening: '2-4 weeks',
      magneticSeparation: '1-2 weeks', gravitySeparation: '1-2 weeks', floatationMethod: '2-4 weeks',
      drySeparation: '1-2 weeks', customProcessing: '2-4 weeks', aluminaCrushing: '1-2 weeks', digestion: '2-4 weeks', 
      clarification: '1-2 weeks', precipitation: '2-3 weeks', calcination: '1-2 weeks', otherRefining: '2-3 weeks',
      preBakingAnodes: '2-4 weeks', electrolysis: '3-6 months', anodeEffectControl: 'Continuous',
      bathChemistryManagement: 'Continuous', offGasTreatment: 'Continuous', othersPleaseSpecify: '2-4 weeks',
      casting: '1-3 months', rolling: '2-6 weeks', extrusion: '1-4 weeks', forgingDF: '2-4 weeks',
      surfaceTreatment: '1-2 weeks', joiningProcesses: '1-2 weeks', designForRecycling: '1-3 months',
      othersManufacturing: '2-4 weeks', collection: '1-2 weeks', sorting: '1-2 weeks', cleaning: '1-2 weeks', 
      remelting: '2-4 weeks', realloying: '1-2 weeks', castingIntoNewProducts: '2-4 weeks', othersRecycling: '1-2 weeks',
      redMudValorization: '3-6 months', spentPotLiningTreatment: '2-4 months', drossRecovery: '2-4 weeks',
      fluorideGasRecovery: '1-2 weeks', slagUtilization: '1-2 weeks', otherWasteValorization: '2-4 weeks',
    };
    return durations[processId] || 'Variable';
  };

  const getProcessComplexity = (processId) => {
    const complexities = {
      openPitMining: 'High', stripMining: 'High', drillingBlasting: 'High', hydraulicMining: 'Medium',
      manualExtraction: 'Low', electricShovel: 'Medium', dieselHaulTrucks: 'Medium', insituLeaching: 'High',
      customExtraction: 'Medium', crushing: 'Medium', grinding: 'Medium', washingScreening: 'Low', magneticSeparation: 'Low',
      gravitySeparation: 'Low', floatationMethod: 'High', drySeparation: 'Medium', customProcessing: 'Medium',
      aluminaCrushing: 'Low', digestion: 'High', clarification: 'Medium', precipitation: 'High',
      calcination: 'High', otherRefining: 'Medium', preBakingAnodes: 'High', electrolysis: 'High', anodeEffectControl: 'High', 
      bathChemistryManagement: 'High', offGasTreatment: 'Medium', othersPleaseSpecify: 'Medium', casting: 'Medium', 
      rolling: 'Medium', extrusion: 'Medium', forgingDF: 'High', surfaceTreatment: 'Medium',
      joiningProcesses: 'Low', designForRecycling: 'High', othersManufacturing: 'Medium', collection: 'Low', 
      sorting: 'Low', cleaning: 'Low', remelting: 'Medium', realloying: 'Medium',
      castingIntoNewProducts: 'Medium', othersRecycling: 'Low', redMudValorization: 'High', spentPotLiningTreatment: 'High', 
      drossRecovery: 'Medium', fluorideGasRecovery: 'Medium', slagUtilization: 'Low', otherWasteValorization: 'Medium',
    };
    return complexities[processId] || 'Medium';
  };

  // Build process library/stage
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
          .filter((p) => p.stage === stage.id)
          .map((p) => ({
            id: p.id,
            name: p.label,
            icon: stageConfig[stage.id].icon,
            badgeBg: stageConfig[stage.id].badgeBg,
            badgeText: stageConfig[stage.id].badgeText,
            badgeBorder: stageConfig[stage.id].badgeBorder,
            iconColor: stageConfig[stage.id].iconColor,
            accentColor: stageConfig[stage.id].accentColor,
            description: getProcessDescription(p.id),
            circularityImpact: getCircularityImpact(p.id),
            co2Impact: getCO2Impact(p.id),
            duration: getProcessDuration(p.id),
            complexity: getProcessComplexity(p.id),
            metal: p.metal,
            stage: p.stage,
          })),
      })),
    [stages]
  );

  const filteredCategories = useMemo(() => {
    return processCategories
      .map((category) => ({
        ...category,
        nodes: category.nodes.filter((n) => {
          const matchesCategory = category.id === selectedCategory;
          const matchesMetal = selectedMetal === 'all' || n.metal === 'all' || n.metal === selectedMetal;
          return matchesCategory && matchesMetal;
        }),
      }))
      .filter((c) => c.nodes.length > 0);
  }, [processCategories, selectedCategory, selectedMetal]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  // ---------- ReactFlow helpers ----------
  const edgeUpdateSuccessful = useRef(true);

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      edgeUpdateSuccessful.current = true;
      setEdges((els) => updateEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  const onEdgeUpdateEnd = useCallback(
    (_, edge) => {
      if (!edgeUpdateSuccessful.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
      edgeUpdateSuccessful.current = true;
    },
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const createRFNode = useCallback((nodeType, position) => {
    return {
      id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'processNode',
      position,
      data: {
        label: nodeType.name,
        typeId: nodeType.id,
        icon: nodeType.icon,
        color: nodeType.badgeBg,
        badgeBg: nodeType.badgeBg,
        badgeText: nodeType.badgeText,
        badgeBorder: nodeType.badgeBorder,
        iconColor: nodeType.iconColor,
  accentColor: nodeType.accentColor,
        stageName: stages.find((s) => s.id === nodeType.stage)?.label || 'Process',
        stageId: nodeType.stage,
        circularityImpact: nodeType.circularityImpact,
        co2Impact: nodeType.co2Impact,
      },
    };
  }, [stages]);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/json');
      if (!raw) return;
      const nodeType = JSON.parse(raw);
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = { x: event.clientX - bounds.left - 100, y: event.clientY - bounds.top - 60 };
      const newNode = createRFNode(nodeType, position);
      setNodes((nds) => nds.concat(newNode));
    },
    [createRFNode, setNodes]
  );

  // ---------- Persistence ----------
  const calculateTotalCircularity = useCallback(
    () => nodes.reduce((sum, n) => sum + (n.data?.circularityImpact || 0), 0),
    [nodes]
  );
  const calculateTotalCO2 = useCallback(
    () => nodes.reduce((sum, n) => sum + (n.data?.co2Impact || 0), 0),
    [nodes]
  );

  const saveCanvas = useCallback(() => {
    const payload = { nodes, edges, ts: Date.now() };
    localStorage.setItem('canvasStateRF', JSON.stringify(payload));
    alert('Canvas saved successfully! ✓');
  }, [nodes, edges]);

  const loadCanvas = useCallback(() => {
    const raw = localStorage.getItem('canvasStateRF');
    if (!raw) {
      alert('No saved canvas found!');
      return;
    }
    const parsed = JSON.parse(raw);
    setNodes(parsed.nodes || []);
    setEdges(parsed.edges || []);
  }, [setNodes, setEdges]);

  const downloadCanvas = useCallback(() => {
    if (nodes.length === 0 && edges.length === 0) {
      alert('Canvas is empty! Add some processes first.');
      return;
    }
    const payload = {
      nodes,
      edges,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    const dataStr = JSON.stringify(payload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lca-canvas-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Canvas downloaded successfully! ✓');
  }, [nodes, edges]);

  const clearCanvas = useCallback(() => {
    if (nodes.length === 0 && edges.length === 0) {
      alert('Canvas is already empty!');
      return;
    }
    const confirmed = window.confirm('Are you sure you want to clear the entire canvas? This action cannot be undone.');
    if (confirmed) {
      setNodes([]);
      setEdges([]);
      alert('Canvas cleared successfully! ✓');
    }
  }, [nodes, edges, setNodes, setEdges]);

  useEffect(() => {
    // Try restoring previous state on first mount
    loadCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Inspector ----------
  const openInspectorForNode = useCallback((node) => {
    if (!node) return;
    const stageId = node.data?.stageId;
    const isExtraction = stageId === 'extraction' || /Extraction/i.test(node.data?.stageName || '');
    const isProcessing = stageId === 'processing' || /Processing/i.test(node.data?.stageName || '');
    const isAluminaRefining = stageId === 'alumina_refining' || /Alumina Refining/i.test(node.data?.stageName || '');
    const isSmelting = stageId === 'smelting' || /Smelting/i.test(node.data?.stageName || '');
    const isManufacturing = stageId === 'manufacturing' || /Manufacturing/i.test(node.data?.stageName || '');
    const isValorization = stageId === 'valorization' || /Valorization/i.test(node.data?.stageName || '');
    const isRecycling = stageId === 'recycling' || /Recycling/i.test(node.data?.stageName || '');
    
    if (!isExtraction && !isProcessing && !isAluminaRefining && !isSmelting && !isManufacturing && !isValorization && !isRecycling) return;
    
    setSelectedNodeId(node.id);
    const existing = node.data?.processConfig || {};
    
    // Load custom process name if it exists
    if (node.data?.customName) {
      setCustomProcessName(node.data.customName);
    } else {
      setCustomProcessName('');
    }
    
    if (isExtraction) {
      setOpmForm({ ...opmDefaults, ...existing });
    } else if (isProcessing) {
      setProcessingForm({ ...processingDefaults, ...existing });
    } else if (isAluminaRefining) {
      setAluminaRefiningForm({ ...aluminaRefiningDefaults, ...existing });
    } else if (isSmelting) {
      setSmeltingForm({ ...smeltingDefaults, ...existing });
    } else if (isManufacturing) {
      setManufacturingForm({ ...manufacturingDefaults, ...existing });
    } else if (isValorization) {
      setValorizationForm({ ...valorizationDefaults, ...existing });
    } else if (isRecycling) {
      setRecyclingForm({ ...recyclingDefaults, ...existing });
    }
    
    setInspectorOpen(true);
  }, [opmDefaults, processingDefaults, aluminaRefiningDefaults, smeltingDefaults, manufacturingDefaults, valorizationDefaults, recyclingDefaults]);

  const closeInspector = useCallback(() => {
    setInspectorOpen(false);
    setSelectedNodeId(null);
    setCustomProcessName(''); // Clear custom process name when closing
  }, []);

  const handleCanvasPaneClick = useCallback(() => {
    closeInspector();
  }, [closeInspector]);

  const saveInspector = useCallback(() => {
    if (!selectedNodeId) return;
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    const stageId = selectedNode?.data?.stageId;
    let formData;
    if (stageId === 'extraction') {
      formData = opmForm;
    } else if (stageId === 'processing') {
      formData = processingForm;
    } else if (stageId === 'alumina_refining') {
      formData = aluminaRefiningForm;
    } else if (stageId === 'smelting') {
      formData = smeltingForm;
    } else if (stageId === 'manufacturing') {
      formData = manufacturingForm;
    } else if (stageId === 'valorization') {
      formData = valorizationForm;
    } else if (stageId === 'recycling') {
      formData = recyclingForm;
    }
    
    // Update node with form data and custom process name if provided
    setNodes((nds) => nds.map((n) => {
      if (n.id === selectedNodeId) {
        const updatedData = { 
          ...n.data, 
          processConfig: { ...formData } 
        };
        
        // Add custom name if it's a custom/others process and name is provided
        if (customProcessName.trim()) {
          updatedData.customName = customProcessName.trim();
          updatedData.label = customProcessName.trim(); // Update the label to display custom name
        }
        
        return { ...n, data: updatedData };
      }
      return n;
    }));
    
    setInspectorOpen(false);
  }, [selectedNodeId, opmForm, processingForm, aluminaRefiningForm, smeltingForm, manufacturingForm, valorizationForm, recyclingForm, customProcessName, nodes, setNodes]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setInspectorOpen(false);
    setSelectedNodeId(null);
  }, [selectedNodeId, setEdges, setNodes]);

  // Resize handlers for left sidebar
  const handleLeftMouseDown = useCallback(() => {
    setIsResizingLeft(true);
  }, []);

  const handleRightMouseDown = useCallback(() => {
    setIsResizingRight(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const newWidth = e.clientX;
        if (newWidth >= 250 && newWidth <= 600) {
          setLeftSidebarWidth(newWidth);
        }
      }
      if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 250 && newWidth <= 600) {
          setRightSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  return (
    <div className="h-full flex" style={{ backgroundColor: palette.background, cursor: isResizingLeft || isResizingRight ? 'col-resize' : 'default', userSelect: isResizingLeft || isResizingRight ? 'none' : 'auto' }}>
      {/* Left: Process Library */}
      {leftSidebarOpen && (
          <div
            className="flex flex-col h-full overflow-hidden border-r relative"
            style={{ backgroundColor: palette.sidebar, borderColor: palette.border, width: `${leftSidebarWidth}px` }}
          >
            {/* Fixed Header and Filters */}
            <div
              className="p-4 border-b flex-shrink-0"
              
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Process Library</h3>
                <button
                  onClick={() => setLeftSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  aria-label="Close sidebar"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Select Metal</label>
                  <select
                    value={selectedMetal}
                    onChange={(e) => setSelectedMetal(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-[#C17A64] focus:border-transparent bg-white"
                    style={{ borderColor: palette.cardBorder }}
                  >
                    {metals.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Select Stage</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-[#C17A64] focus:border-transparent bg-white"
                    style={{ borderColor: palette.cardBorder }}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">Drag processes to canvas</p>
            </div>

            {/* Scrollable Process Cards */}
            <div className="flex-1 overflow-y-auto p-4 sidebar-scroll">
              <div className="space-y-3">
            {filteredCategories.map((category) => {
              const CategoryIcon = typeof category.icon === 'function' ? category.icon : Factory;
              return (
                <div key={category.id}>
                  <div
                    className="flex items-center justify-between mb-2 cursor-pointer p-2 rounded-md transition-colors"
                    style={{ backgroundColor: 'transparent' }}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm"
                        style={{
                          backgroundColor: category.badgeBg,
                          color: category.badgeText,
                          border: `1px solid ${category.badgeBorder || 'transparent'}`,
                        }}
                      >
                        {category.nodes.length}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: category.accentColor }}>
                        {category.name}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${expandedCategories[category.id] ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </div>
                  {expandedCategories[category.id] && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {category.nodes.map((nodeType) => {
                        const ProcessIcon = processIcons[nodeType.id] || Package;
                        return (
                          <div
                            key={nodeType.id}
                            className="rounded-xl p-3 cursor-pointer transition-all group border hover:shadow-sm"
                            style={{ backgroundColor: '#F3F2EC', borderColor: palette.cardBorder }}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify(nodeType));
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newNode = createRFNode(nodeType, { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 });
                              setNodes((nds) => nds.concat(newNode));
                            }}
                          >
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-2">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center"
                                  style={{
                                    backgroundColor: category.badgeBg,
                                    border: `1px solid ${category.badgeBorder || 'transparent'}`,
                                  }}
                                >
                                  <ProcessIcon className="w-5 h-5" style={{ color: category.iconColor }} />
                                </div>
                              </div>
                              <div className="text-xs text-gray-900 font-medium leading-tight mb-1">{nodeType.name}</div>
                              <div className="text-xs text-gray-500">Drag to canvas</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Resize handle for left sidebar */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors group z-10"
          onMouseDown={handleLeftMouseDown}
          style={{ backgroundColor: isResizingLeft ? palette.accent : 'transparent' }}
        >
          <div 
            className="absolute top-1/2 -translate-y-1/2 -right-0.5 w-1 h-16 rounded-full transition-all duration-200" 
            style={{ 
              backgroundColor: isResizingLeft ? palette.accent : palette.border,
              width: isResizingLeft ? '3px' : '2px'
            }}
          ></div>
        </div>
        </div>
        )}

        {/* Right section: Header + Canvas + Right Sidebar */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div
            className="px-6 py-3 flex-shrink-0 border-b"
            style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {selectedMetal === 'aluminum' ? 'Aluminum' : selectedMetal === 'steel' ? 'Steel' : 'Aluminum'} LCA Canvas
                </h1>
                <p className="text-xs" style={{ color: palette.neutralLightText }}>Drag processes to build your assessment</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Metrics */}
                <div className="flex items-center gap-2">
                  <div className="text-center px-3 py-1.5 rounded-md border" style={{ backgroundColor: '#FFFFFF', borderColor: palette.cardBorder }}>
                    <div className="text-lg font-bold text-gray-900">{nodes.length}</div>
                    <div className="text-xs" style={{ color: palette.neutralLightText }}>processes</div>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-md border" style={{ backgroundColor: '#FFFFFF', borderColor: palette.cardBorder }}>
                    <div className="text-lg font-bold text-gray-900">{edges.length}</div>
                    <div className="text-xs" style={{ color: palette.neutralLightText }}>connections</div>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-md border" style={{ backgroundColor: '#FFFFFF', borderColor: palette.cardBorder }}>
                    <div className="text-lg font-bold" style={{ color: calculateTotalCO2() <= 0 ? '#2F855A' : '#C17A64' }}>
                      {calculateTotalCO2().toFixed(1)}
                    </div>
                    <div className="text-xs" style={{ color: palette.neutralLightText }}>kg CO₂</div>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-md border" style={{ backgroundColor: '#FFFFFF', borderColor: palette.cardBorder }}>
                    <div className="text-lg font-bold text-gray-900">0</div>
                    <div className="text-xs" style={{ color: palette.neutralLightText }}>MJ Energy</div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    className="text-xs font-medium hover:opacity-90"
                    style={{ backgroundColor: palette.accent, color: '#FFFFFF' }}
                    onClick={() => {}}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Connect
                  </Button>
                  <button
                    onClick={saveCanvas}
                    className="p-2 rounded-md transition-colors hover:bg-[#E9DDD0]"
                    style={{ color: palette.accent, backgroundColor: 'transparent' }}
                    title="Save Canvas to Browser Storage"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={downloadCanvas}
                    className="p-2 rounded-md transition-colors hover:bg-[#E9DDD0]"
                    style={{ color: palette.neutralLightText, backgroundColor: 'transparent' }}
                    title="Download Canvas as JSON File"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearCanvas}
                    className="p-2 rounded-md transition-colors hover:bg-[#F5D5D0]"
                    style={{ color: '#9B2C2C', backgroundColor: 'transparent' }}
                    title="Clear All Processes and Connections"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas and Right Sidebar Row */}
          <div className="flex-1 flex min-h-0 relative">

        {/* Toggle button for collapsed left sidebar */}
        {!leftSidebarOpen && (
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-lg p-2 shadow-md hover:bg-[#E9DDD0] z-10 border"
            style={{ backgroundColor: '#FFFFFF', borderColor: palette.cardBorder }}
            aria-label="Open library"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Center: ReactFlow Canvas */}
        <div className="flex-1 relative min-w-0">
          {/* Empty State Message */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div
                className="text-center p-6 rounded-lg shadow-md border max-w-md"
                style={{ backgroundColor: '#FFFFFF', borderColor: palette.cardBorder }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">Start Building Your LCA</h3>
                <p className="text-sm" style={{ color: palette.neutralLightText }}>Drag processes from the library on the left to begin creating your lifecycle assessment flow.</p>
                <div
                  className="rounded-md p-2.5 text-xs text-left mt-3"
                  style={{ backgroundColor: palette.sidebar, border: `1px solid ${palette.cardBorder}`, color: palette.neutralDarkText }}
                >
                  <p><strong style={{ color: palette.accent }}>Tip:</strong> Use the 'Connect' button to link processes after adding them to the canvas.</p>
                </div>
              </div>
            </div>
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
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(e, node) => openInspectorForNode(node)}
            onPaneClick={handleCanvasPaneClick}
            fitView
          >
            <Background gap={20} color="#D3C5B6" variant="dots" size={1} />
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>

        {/* Toggle button for collapsed right sidebar */}
        {!rightSidebarOpen && (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l-lg p-2 shadow-md hover:bg-[#E9DDD0] z-10 border"
            style={{ backgroundColor: '#FFFFFF', borderColor: palette.cardBorder }}
            aria-label="Open summary"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
          </button>
        )}

        {/* Right: Inspector or Summary */}
        {rightSidebarOpen && (
          <div
            className="p-4 overflow-y-auto h-full border-l relative sidebar-scroll"
            style={{ backgroundColor: '#FFFFFF', borderColor: palette.border, width: `${rightSidebarWidth}px` }}
          >
          {/* Resize handle for right sidebar */}
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize transition-colors group z-10"
            onMouseDown={handleRightMouseDown}
            style={{ backgroundColor: isResizingRight ? palette.accent : 'transparent' }}
          >
            <div 
              className="absolute top-1/2 -translate-y-1/2 -left-0.5 w-1 h-16 rounded-full transition-all duration-200" 
              style={{ 
                backgroundColor: isResizingRight ? palette.accent : palette.border,
                width: isResizingRight ? '3px' : '2px'
              }}
            ></div>
          </div>
          
          {!inspectorOpen && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Process Summary</h3>
                  <p className="text-xs" style={{ color: palette.neutralLightText }}>Overview of your LCA workflow</p>
                </div>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  aria-label="Close sidebar"
                >
                  ×
                </button>
              </div>

              <Card className="mb-3 shadow-sm rounded-xl" style={{ borderColor: palette.cardBorder, backgroundColor: '#F3F2EC' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-center">Overall Impact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: palette.neutralLightText }}>Circularity Score</span>
                    <span className={`text-xs font-bold ${calculateTotalCircularity() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateTotalCircularity()}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: palette.neutralLightText }}>CO₂ Impact</span>
                    <span className={`text-xs font-bold ${calculateTotalCO2() <= 0 ? 'text-green-600' : 'text-green-600'}`}>
                      {calculateTotalCO2()} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: palette.neutralLightText }}>Process Nodes</span>
                    <span className="text-xs font-bold" style={{ color: palette.accent }}>{nodes.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: palette.neutralLightText }}>Connections</span>
                    <span className="text-xs font-bold" style={{ color: palette.accent }}>{edges.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-3 shadow-sm rounded-xl" style={{ borderColor: palette.cardBorder, backgroundColor: '#F3F2EC' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-center">Process Nodes</CardTitle>
                </CardHeader>
                <CardContent>
                  {nodes.length === 0 ? (
                    <div className="text-xs text-center py-3" style={{ color: palette.accent }}>No processes added yet</div>
                  ) : (
                    <div className="space-y-2">
                      {nodes.map((n, index) => {
                        const nodeColor = n.data?.badgeBg || palette.neutralBadge;
                        const nodeTextColor = n.data?.badgeText || palette.neutralDarkText;
                        const nodeBorderColor = n.data?.badgeBorder || 'transparent';
                        return (
                          <div
                            key={n.id}
                            className="flex items-start gap-3 p-2.5 rounded-md transition-colors hover:bg-[#E9DDD0]"
                            style={{ backgroundColor: palette.sidebar }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm border"
                              style={{
                                backgroundColor: nodeColor,
                                color: nodeTextColor,
                                borderColor: nodeBorderColor,
                              }}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-900">{n.data?.label}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{n.data?.stageName || 'Process'}</div>
                            </div>
                            <button
                              className="text-gray-400 hover:text-red-500 text-lg leading-none flex-shrink-0"
                              onClick={() => {
                                setEdges((eds) => eds.filter((e) => e.source !== n.id && e.target !== n.id));
                                setNodes((nds) => nds.filter((x) => x.id !== n.id));
                              }}
                              title="Delete node"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-xl" style={{ borderColor: palette.cardBorder, backgroundColor: '#F3F2EC' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-center">Process Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  {edges.length === 0 ? (
                    <div className="text-xs text-center py-3" style={{ color: palette.accent }}>No connections yet</div>
                  ) : (
                    <div className="space-y-1.5">
                      {edges.map((e) => {
                        const from = nodes.find((n) => n.id === e.source)?.data?.label || e.source;
                        const to = nodes.find((n) => n.id === e.target)?.data?.label || e.target;
                        return (
                          <div
                            key={e.id}
                            className="flex items-center gap-2 p-2 rounded-md w-60 transition-colors text-xs hover:bg-[#E9DDD0]"
                            style={{ backgroundColor: palette.sidebar }}
                          >
                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-gray-700 truncate max-w-20 font-medium">{from}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-gray-700 truncate max-w-20 font-medium">{to}</span>
                            </div>
                            <button
                              onClick={() => setEdges((eds) => eds.filter((x) => x.id !== e.id))}
                              className="text-gray-400 hover:text-red-500 text-base leading-none"
                              title="Delete connection"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {inspectorOpen && selectedNodeId && (
            <div className="space-y-4">
                {(() => {
                  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
                  if (!selectedNode) return null;
                  
                  // Get icon from processIcons mapping using typeId
                  const HeaderIcon = selectedNode.data?.typeId && processIcons[selectedNode.data.typeId]
                    ? processIcons[selectedNode.data.typeId]
                    : (selectedNode && typeof selectedNode.data?.icon === 'function' ? selectedNode.data.icon : AlertTriangle);
                  const headerBadgeBg = selectedNode?.data?.badgeBg || palette.neutralBadge;
                  const headerBadgeText = selectedNode?.data?.badgeText || palette.neutralDarkText;
                  const headerBadgeBorder = selectedNode?.data?.badgeBorder || 'transparent';
                  const headerIconColor = selectedNode?.data?.iconColor || palette.neutralLightText;
                  const headerAccent = selectedNode?.data?.accentColor || palette.accent;
                  const headerLabel = selectedNode?.data?.label || 'Extraction Process';
                  const headerStage = selectedNode?.data?.stageName || 'Stage 1: Extraction';
                  return (
                    <div
                      className="p-4 rounded-lg border shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, rgba(243,242,236,0.6), rgba(255,255,255,0.9))',
                        borderColor: palette.cardBorder,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border"
                            style={{
                              backgroundColor: headerBadgeBg,
                              color: headerBadgeText,
                              borderColor: headerBadgeBorder,
                            }}
                          >
                            <HeaderIcon className="w-5 h-5" style={{ color: headerIconColor }} />
                          </div>
                          <div>
                            <div className="text-base font-bold text-gray-900">{headerLabel}</div>
                            <div className="text-xs font-medium" style={{ color: headerAccent }}>{headerStage}</div>
                          </div>
                        </div>
                        <button 
                          className="text-gray-400 hover:text-gray-600 text-2xl leading-none hover:bg-gray-100 rounded px-2 py-1 transition-colors" 
                          onClick={closeInspector} 
                          aria-label="Close"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Configure process parameters and environmental impact data</p>
                    </div>
                  );
                })()}

              {/* Custom Process Name Input for "others/custom" processes */}
              {(() => {
                const selectedNode = nodes.find((n) => n.id === selectedNodeId);
                const processLabel = selectedNode?.data?.label || '';
                const isCustomProcess = processLabel.toLowerCase().includes('custom') || 
                                       processLabel.toLowerCase().includes('others') || 
                                       processLabel.toLowerCase().includes('other') ||
                                       processLabel.toLowerCase().includes('please specify');

                if (isCustomProcess) {
                  return (
                    <div className="mb-5 px-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Custom Process Name
                      </label>
                      <input
                        type="text"
                        value={customProcessName}
                        onChange={(e) => setCustomProcessName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C17A64] focus:border-[#C17A64] transition-shadow"
                        placeholder="Enter custom process name"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Provide a specific name for this custom process</p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Form - Conditional based on stage */}
              {(() => {
                const selectedNode = nodes.find((n) => n.id === selectedNodeId);
                const stageId = selectedNode?.data?.stageId;

                // Extraction Stage Form
                if (stageId === 'extraction') {
                  return (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Ore Grade (%)</label>
                        <input
                          type="number"
                          value={opmForm.oreGrade}
                          onChange={(e) => setOpmForm((f) => ({ ...f, oreGrade: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C17A64] focus:border-[#C17A64] transition-shadow"
                          placeholder="Enter ore grade"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">Higher grade = lower energy/waste intensity</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Overburden Ratio</label>
                        <input
                          type="number"
                          value={opmForm.overburdenRatio}
                          onChange={(e) => setOpmForm((f) => ({ ...f, overburdenRatio: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C17A64] focus:border-[#C17A64] transition-shadow"
                          placeholder="Enter ratio"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Type of Equipment</label>
                        <select
                          value={opmForm.equipmentType}
                          onChange={(e) => setOpmForm((f) => ({ ...f, equipmentType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C17A64] focus:border-[#C17A64] transition-shadow bg-white"
                        >
                          <option value="Electric">Electric</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Water Usage (m³/tonne of ore)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={opmForm.waterUsage}
                          onChange={(e) => setOpmForm((f) => ({ ...f, waterUsage: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C17A64] focus:border-[#C17A64] transition-shadow"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">For washing, dust control, slurry management</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Land Use / Biodiversity Impact</label>
                        <select
                          value={opmForm.landUseImpact}
                          onChange={(e) => setOpmForm((f) => ({ ...f, landUseImpact: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C17A64] focus:border-[#C17A64] transition-shadow bg-white"
                        >
                          <option value="Low">Low</option>
                          <option value="Moderate">Moderate</option>
                          <option value="High">High</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Red Mud Generation (kg/tonne of ore)</label>
                        <input
                          type="number"
                          value={opmForm.redMudGeneration}
                          onChange={(e) => setOpmForm((f) => ({ ...f, redMudGeneration: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C17A64] focus:border-[#C17A64] transition-shadow"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">Depends on ore composition and extraction process</p>
                      </div>
                    </div>
                  );
                }

                // Processing Stage Form (Magnetic Separation)
                if (stageId === 'processing') {
                  return (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Water Consumption (m³/tonne of ore)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={processingForm.waterConsumption}
                          onChange={(e) => setProcessingForm((f) => ({ ...f, waterConsumption: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for washing, dust control, slurry handling</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Electricity Use (kWh/tonne of ore)</label>
                        <input
                          type="number"
                          value={processingForm.electricityUse}
                          onChange={(e) => setProcessingForm((f) => ({ ...f, electricityUse: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Chemical Agents (used in beneficiation)</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={processingForm.chemicalAgents.includes('Flocculants')}
                              onChange={(e) => {
                                setProcessingForm((f) => ({
                                  ...f,
                                  chemicalAgents: e.target.checked
                                    ? [...f.chemicalAgents, 'Flocculants']
                                    : f.chemicalAgents.filter(a => a !== 'Flocculants')
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded   focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Flocculants</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={processingForm.chemicalAgents.includes('Dispersants')}
                              onChange={(e) => {
                                setProcessingForm((f) => ({
                                  ...f,
                                  chemicalAgents: e.target.checked
                                    ? [...f.chemicalAgents, 'Dispersants']
                                    : f.chemicalAgents.filter(a => a !== 'Dispersants')
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded   focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Dispersants</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={processingForm.chemicalAgents.includes('Coagulants')}
                              onChange={(e) => {
                                setProcessingForm((f) => ({
                                  ...f,
                                  chemicalAgents: e.target.checked
                                    ? [...f.chemicalAgents, 'Coagulants']
                                    : f.chemicalAgents.filter(a => a !== 'Coagulants')
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded   focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Coagulants</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={processingForm.chemicalAgents.includes('None / Natural separation')}
                              onChange={(e) => {
                                setProcessingForm((f) => ({
                                  ...f,
                                  chemicalAgents: e.target.checked
                                    ? [...f.chemicalAgents, 'None / Natural separation']
                                    : f.chemicalAgents.filter(a => a !== 'None / Natural separation')
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded   focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">None / Natural separation</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={processingForm.chemicalAgentsOther}
                          onChange={(e) => setProcessingForm((f) => ({ ...f, chemicalAgentsOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent mt-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Waste Tailings & Slurry Management</label>
                        <select
                          value={processingForm.wasteTailings}
                          onChange={(e) => setProcessingForm((f) => ({ ...f, wasteTailings: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                        >
                          <option value="Stored in tailing ponds">Stored in tailing ponds</option>
                          <option value="Dry stacking">Dry stacking</option>
                          <option value="Recycled back to process">Recycled back to process</option>
                          <option value="Land disposal">Land disposal</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">Noise Pollution Level</label>
                          <select
                            value={processingForm.noisePollution}
                            onChange={(e) => setProcessingForm((f) => ({ ...f, noisePollution: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                          >
                            <option value="Low">Low</option>
                            <option value="Moderate">Moderate</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                        <div> 
                          <label className="block text-sm font-medium text-gray-900 mb-1">Dust Pollution Level</label>
                          <select
                            value={processingForm.dustPollution}
                            onChange={(e) => setProcessingForm((f) => ({ ...f, dustPollution: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                          >
                            <option value="Low">Low</option>
                            <option value="Moderate">Moderate</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Toxicity Indicators of Red Mud</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="proc_toxicityIndicator"
                              value="Low – minimal heavy metals"
                              checked={processingForm.toxicityIndicator === 'Low – minimal heavy metals'}
                              onChange={(e) => setProcessingForm((f) => ({ ...f, toxicityIndicator: e.target.value }))}
                              className="w-4 h-4 text-[#C17A64]  focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Low – minimal heavy metals</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="proc_toxicityIndicator"
                              value="Moderate – presence of iron, trace metals"
                              checked={processingForm.toxicityIndicator === 'Moderate – presence of iron, trace metals'}
                              onChange={(e) => setProcessingForm((f) => ({ ...f, toxicityIndicator: e.target.value }))}
                              className="w-4 h-4 text-[#C17A64]  focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Moderate – presence of iron, trace metals</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="proc_toxicityIndicator"
                              value="High – elevated levels of toxic elements, highly alkaline"
                              checked={processingForm.toxicityIndicator === 'High – elevated levels of toxic elements, highly alkaline'}
                              onChange={(e) => setProcessingForm((f) => ({ ...f, toxicityIndicator: e.target.value }))}
                              className="w-4 h-4 text-[#C17A64]   focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700 ">High – elevated levels of toxic and highly</span>
                          </label>
                           <div className='text-sm text-gray-700 flex align-middle pl-7 justify-self-start'>alkaline</div>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={processingForm.toxicityOther}
                          onChange={(e) => setProcessingForm((f) => ({ ...f, toxicityOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent mt-2"
                        />
                      </div>
                    </div>
                  );
                }

                // Alumina Refining Stage Form (Crushing/Bayer Process)
                if (stageId === 'alumina_refining') {
                  return (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Enhancement / Optional Variant</label>
                        <select
                          value={aluminaRefiningForm.enhancement}
                          onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, enhancement: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                        >
                          <option value="None">None</option>
                          <option value="Enhanced digestion">Enhanced digestion</option>
                          <option value="Pressure leaching">Pressure leaching</option>
                          <option value="Low-temperature refining">Low-temperature refining</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">Energy Use (kWh or MJ/tonne of alumina)</label>
                          <input
                            type="number"
                            value={aluminaRefiningForm.energyUse}
                            onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, energyUse: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900">Water Use </label>
                          <div className='block text-sm font-medium text-gray-900 mb-1'>(m³/tonne of alumina)</div>
                          <input
                            type="number"
                            step="0.1"
                            value={aluminaRefiningForm.waterUse}
                            onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, waterUse: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1 mt-8 pr-30">Red Mud Generation (kg/tonne of alumina)</label>
                        <input
                          type="number"
                          value={aluminaRefiningForm.redMudGeneration}
                          onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, redMudGeneration: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1 mt-8">Chemical Consumption (per tonne of alumina)</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600">Caustic soda</label>
                            <div className='block text-xs text-gray-600 mb-1'>
                              (kg/t)
                            </div>
                            <input
                              type="number"
                              value={aluminaRefiningForm.causticSoda}
                              onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, causticSoda: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Lime / other additives (kg/t)</label>
                            <input
                              type="number"
                              value={aluminaRefiningForm.limeAdditives}
                              onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, limeAdditives: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={aluminaRefiningForm.chemicalOther}
                          onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, chemicalOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-8">
                        <div> 
                          <label className="block text-sm font-medium text-gray-900 mb-1">SO₂ emissions (kg/tonne)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={aluminaRefiningForm.so2Emissions}
                            onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, so2Emissions: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">NOₓ emissions (kg/tonne)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={aluminaRefiningForm.noxEmissions}
                            onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, noxEmissions: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">Dust emissions (kg/tonne)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={aluminaRefiningForm.dustEmissions}
                            onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, dustEmissions: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-[#C17A64] focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Toxicity Indicators of Red Mud</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="toxicityIndicator"
                              value="Low – minimal heavy metals"
                              checked={aluminaRefiningForm.toxicityIndicator === 'Low – minimal heavy metals'}
                              onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, toxicityIndicator: e.target.value }))}
                              className="w-4 h-4 text-[#C17A64]   focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Low – minimal heavy metals</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="toxicityIndicator"
                              value="Moderate – presence of iron, trace metals"
                              checked={aluminaRefiningForm.toxicityIndicator === 'Moderate – presence of iron, trace metals'}
                              onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, toxicityIndicator: e.target.value }))}
                              className="w-4 h-4 text-[#C17A64]   focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Moderate – presence of iron, trace metals</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="toxicityIndicator"
                              value="High – elevated levels of toxic elements, highly alkaline"
                              checked={aluminaRefiningForm.toxicityIndicator === 'High – elevated levels of toxic elements, highly alkaline'}
                              onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, toxicityIndicator: e.target.value }))}
                              className="w-4 h-4 text-[#C17A64]   focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">High – elevated levels of toxic and highly</span>
                          </label>
                          <div className='text-sm text-gray-700 flex align-middle pl-6 justify-self-start'>alkaline</div>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={aluminaRefiningForm.toxicityOther}
                          onChange={(e) => setAluminaRefiningForm((f) => ({ ...f, toxicityOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg   focus:ring-blue-500 focus:border-transparent mt-2"
                        />
                      </div>
                    </div>
                  );
                }

                // Smelting Stage Form (Electrolysis/Hall-Héroult Process)
                if (stageId === 'smelting') {
                  return (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Anode Pre-baking Temperature (°C)</label>
                        <input
                          type="number"
                          value={smeltingForm.anodePreBakingTemp}
                          onChange={(e) => setSmeltingForm((f) => ({ ...f, anodePreBakingTemp: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="1100"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">Typical range: 1000-1200°C</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Electrolysis Voltage (V)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={smeltingForm.electrolysisVoltage}
                            onChange={(e) => setSmeltingForm((f) => ({ ...f, electrolysisVoltage: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="4.5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Current Efficiency (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={smeltingForm.currentEfficiency}
                            onChange={(e) => setSmeltingForm((f) => ({ ...f, currentEfficiency: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="95"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Bath Chemistry Management</label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Bath Temp (°C)</label>
                            <input
                              type="number"
                              value={smeltingForm.bathTemp}
                              onChange={(e) => setSmeltingForm((f) => ({ ...f, bathTemp: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                              placeholder="960"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Alumina Conc. (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={smeltingForm.aluminaConcentration}
                              onChange={(e) => setSmeltingForm((f) => ({ ...f, aluminaConcentration: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                              placeholder="3.5"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Fluoride (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={smeltingForm.fluorideContent}
                              onChange={(e) => setSmeltingForm((f) => ({ ...f, fluorideContent: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                              placeholder="12"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">Optimal control reduces energy consumption and emissions</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Anode Effect Frequency</label>
                        <select
                          value={smeltingForm.anodeEffectFrequency}
                          onChange={(e) => setSmeltingForm((f) => ({ ...f, anodeEffectFrequency: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                        >
                          <option value="Low">Low (well-controlled)</option>
                          <option value="Moderate">Moderate</option>
                          <option value="High">High (frequent instability)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1.5">Lower frequency indicates better process control</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Off-gas Treatment Efficiency (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={smeltingForm.offGasTreatmentEfficiency}
                          onChange={(e) => setSmeltingForm((f) => ({ ...f, offGasTreatmentEfficiency: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="98"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">Scrubber system efficiency for capturing fluorides and particulates</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Scrubber Type</label>
                        <select
                          value={smeltingForm.scrubberType}
                          onChange={(e) => setSmeltingForm((f) => ({ ...f, scrubberType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                        >
                          <option value="Wet scrubber">Wet scrubber</option>
                          <option value="Dry scrubber">Dry scrubber</option>
                          <option value="Hybrid system">Hybrid system</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Energy Consumption (kWh/tonne Al)</label>
                        <input
                          type="number"
                          value={smeltingForm.energyConsumption}
                          onChange={(e) => setSmeltingForm((f) => ({ ...f, energyConsumption: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="15000"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">Industry average: 13,000-16,000 kWh/tonne</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Emissions</label>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">CO₂ Emissions (tonnes/tonne Al)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={smeltingForm.co2EmissionsPerTonne}
                              onChange={(e) => setSmeltingForm((f) => ({ ...f, co2EmissionsPerTonne: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                              placeholder="1.7"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">PFC (kg/tonne)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={smeltingForm.pfcEmissions}
                                onChange={(e) => setSmeltingForm((f) => ({ ...f, pfcEmissions: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                placeholder="0.3"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">SOx (kg/tonne)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={smeltingForm.soxEmissions}
                                onChange={(e) => setSmeltingForm((f) => ({ ...f, soxEmissions: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                placeholder="0.05"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Dust (kg/tonne)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={smeltingForm.dustEmissions}
                                onChange={(e) => setSmeltingForm((f) => ({ ...f, dustEmissions: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                placeholder="0.08"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">PFC = Perfluorocarbon (CF₄, C₂F₆) - potent greenhouse gases</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Other Process Details</label>
                        <input
                          type="text"
                          placeholder="Specify any other smelting parameters or variations"
                          value={smeltingForm.otherSpecify}
                          onChange={(e) => setSmeltingForm((f) => ({ ...f, otherSpecify: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        />
                      </div>
                    </div>
                  );
                }

                // Manufacturing Stage Form
                if (stageId === 'manufacturing') {
                  return (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Lightweighting (select applicable sectors)</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Automotive"
                              checked={manufacturingForm.lightweighting.includes('Automotive')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManufacturingForm((f) => ({
                                  ...f,
                                  lightweighting: e.target.checked
                                    ? [...f.lightweighting, val]
                                    : f.lightweighting.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Automotive</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Aerospace"
                              checked={manufacturingForm.lightweighting.includes('Aerospace')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManufacturingForm((f) => ({
                                  ...f,
                                  lightweighting: e.target.checked
                                    ? [...f.lightweighting, val]
                                    : f.lightweighting.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Aerospace</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Construction"
                              checked={manufacturingForm.lightweighting.includes('Construction')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManufacturingForm((f) => ({
                                  ...f,
                                  lightweighting: e.target.checked
                                    ? [...f.lightweighting, val]
                                    : f.lightweighting.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Construction</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Packaging"
                              checked={manufacturingForm.lightweighting.includes('Packaging')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManufacturingForm((f) => ({
                                  ...f,
                                  lightweighting: e.target.checked
                                    ? [...f.lightweighting, val]
                                    : f.lightweighting.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Packaging</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={manufacturingForm.lightweightingOther}
                          onChange={(e) => setManufacturingForm((f) => ({ ...f, lightweightingOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">Predicts fuel reduction and emissions savings</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Corrosion Behavior Impact</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="corrosionBehavior"
                              value="Minimal (long lifespan, low maintenance)"
                              checked={manufacturingForm.corrosionBehavior === 'Minimal (long lifespan, low maintenance)'}
                              onChange={(e) => setManufacturingForm((f) => ({ ...f, corrosionBehavior: e.target.value }))}
                              className="w-4 h-4 text-[#C17A64] focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Minimal (long lifespan, low maintenance)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="corrosionBehavior"
                              value="Moderate (occasional maintenance)"
                              checked={manufacturingForm.corrosionBehavior === 'Moderate (occasional maintenance)'}
                              onChange={(e) => setManufacturingForm((f) => ({ ...f, corrosionBehavior: e.target.value }))}
                              className="w-4 h-4 text-[#C17A64] focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Moderate (occasional maintenance)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="corrosionBehavior"
                              value="Severe (frequent maintenance, repairs)"
                              checked={manufacturingForm.corrosionBehavior === 'Severe (frequent maintenance, repairs)'}
                              onChange={(e) => setManufacturingForm((f) => ({ ...f, corrosionBehavior: e.target.value }))}
                              className="w-4 h-4 text-[#C17A64] focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Severe (frequent maintenance, repairs)</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={manufacturingForm.corrosionBehaviorOther}
                          onChange={(e) => setManufacturingForm((f) => ({ ...f, corrosionBehaviorOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mt-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Energy Use per Process Step (MJ/t or kWh/t)</label>
                        <input
                          type="number"
                          value={manufacturingForm.energyUsePerStep}
                          onChange={(e) => setManufacturingForm((f) => ({ ...f, energyUsePerStep: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Scrap Rate (% of material lost)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={manufacturingForm.scrapRate}
                            onChange={(e) => setManufacturingForm((f) => ({ ...f, scrapRate: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Recycled Content (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={manufacturingForm.recycledContent}
                            onChange={(e) => setManufacturingForm((f) => ({ ...f, recycledContent: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Emissions from Fabrication (kg CO₂e per tonne)</label>
                        <input
                          type="number"
                          value={manufacturingForm.emissionsFromFabrication}
                          onChange={(e) => setManufacturingForm((f) => ({ ...f, emissionsFromFabrication: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Transport Distance (km)</label>
                          <input
                            type="number"
                            value={manufacturingForm.transportDistance}
                            onChange={(e) => setManufacturingForm((f) => ({ ...f, transportDistance: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Transport Mode</label>
                          <select
                            value={manufacturingForm.transportMode}
                            onChange={(e) => setManufacturingForm((f) => ({ ...f, transportMode: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                          >
                            <option value="">Select mode</option>
                            <option value="Truck">Truck</option>
                            <option value="Rail">Rail</option>
                            <option value="Ship">Ship</option>
                            <option value="Air">Air</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Transport Emissions (kg CO₂e per tonne-km)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={manufacturingForm.transportEmissions}
                          onChange={(e) => setManufacturingForm((f) => ({ ...f, transportEmissions: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  );
                }

                // Valorization Stage Form (Red Mud & Waste Treatment)
                if (stageId === 'valorization') {
                  return (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Waste Types (select one or more)</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Red Mud (RM) from bauxite refining"
                              checked={valorizationForm.wasteTreatment.includes('Red Mud (RM) from bauxite refining')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  wasteTreatment: e.target.checked
                                    ? [...f.wasteTreatment, val]
                                    : f.wasteTreatment.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Red Mud (RM) from bauxite refining</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Process slag (silica-rich, iron-rich, alumina-leaching)"
                              checked={valorizationForm.wasteTreatment.includes('Process slag (silica-rich, iron-rich, alumina-leaching)')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  wasteTreatment: e.target.checked
                                    ? [...f.wasteTreatment, val]
                                    : f.wasteTreatment.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Process slag (silica-rich, iron-rich, alumina-leaching)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Dross (aluminium oxide-rich waste)"
                              checked={valorizationForm.wasteTreatment.includes('Dross (aluminium oxide-rich waste)')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  wasteTreatment: e.target.checked
                                    ? [...f.wasteTreatment, val]
                                    : f.wasteTreatment.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Dross (aluminium oxide-rich waste)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Spent Pot Lining (SPL) from electrolysis"
                              checked={valorizationForm.wasteTreatment.includes('Spent Pot Lining (SPL) from electrolysis')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  wasteTreatment: e.target.checked
                                    ? [...f.wasteTreatment, val]
                                    : f.wasteTreatment.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Spent Pot Lining (SPL) from electrolysis</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Scrap (aluminium scrap-rich waste)"
                              checked={valorizationForm.wasteTreatment.includes('Scrap (aluminium scrap-rich waste)')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  wasteTreatment: e.target.checked
                                    ? [...f.wasteTreatment, val]
                                    : f.wasteTreatment.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Scrap (aluminium scrap-rich waste)</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={valorizationForm.wasteTreatmentOther}
                          onChange={(e) => setValorizationForm((f) => ({ ...f, wasteTreatmentOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mt-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Valorization Methods (select one or more)</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Cement industry (aggregate/filler – avoids virgin materials)"
                              checked={valorizationForm.valorizationMethods.includes('Cement industry (aggregate/filler – avoids virgin materials)')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  valorizationMethods: e.target.checked
                                    ? [...f.valorizationMethods, val]
                                    : f.valorizationMethods.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Cement industry (aggregate/filler – avoids virgin materials)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Iron extraction (high-iron slag – reuse metal)"
                              checked={valorizationForm.valorizationMethods.includes('Iron extraction (high-iron slag – reuse metal)')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  valorizationMethods: e.target.checked
                                    ? [...f.valorizationMethods, val]
                                    : f.valorizationMethods.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Iron extraction (high-iron slag – reuse metal)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Rare earth element recovery – high-value material"
                              checked={valorizationForm.valorizationMethods.includes('Rare earth element recovery – high-value material')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  valorizationMethods: e.target.checked
                                    ? [...f.valorizationMethods, val]
                                    : f.valorizationMethods.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Rare earth element recovery – high-value material</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Rare earth element recovery (scandium, yttrium – rare, efficient)"
                              checked={valorizationForm.valorizationMethods.includes('Rare earth element recovery (scandium, yttrium – rare, efficient)')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  valorizationMethods: e.target.checked
                                    ? [...f.valorizationMethods, val]
                                    : f.valorizationMethods.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Rare earth element recovery (scandium, yttrium – rare, efficient)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Pigment/chemical"
                              checked={valorizationForm.valorizationMethods.includes('Pigment/chemical')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  valorizationMethods: e.target.checked
                                    ? [...f.valorizationMethods, val]
                                    : f.valorizationMethods.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-[#C17A64] rounded focus:ring-2 focus:ring-[#C17A64]"
                            />
                            <span className="text-sm text-gray-700">Pigment/chemical</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Alumina-catalyst recovery from spent gases – closed-loop"
                              checked={valorizationForm.valorizationMethods.includes('Alumina-catalyst recovery from spent gases – closed-loop')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  valorizationMethods: e.target.checked
                                    ? [...f.valorizationMethods, val]
                                    : f.valorizationMethods.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Alumina-catalyst recovery from spent gases – closed-loop</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={valorizationForm.valorizationMethodsOther}
                          onChange={(e) => setValorizationForm((f) => ({ ...f, valorizationMethodsOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mt-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Recovery Efficiency (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={valorizationForm.recoveryEfficiency}
                          onChange={(e) => setValorizationForm((f) => ({ ...f, recoveryEfficiency: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Environmental Impact Reduction (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={valorizationForm.environmentalImpactReduction}
                          onChange={(e) => setValorizationForm((f) => ({ ...f, environmentalImpactReduction: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Processing Technique</label>
                        <select
                          value={valorizationForm.processingTechnique}
                          onChange={(e) => setValorizationForm((f) => ({ ...f, processingTechnique: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                        >
                          <option value="">Select technique</option>
                          <option value="Leaching (chemical separation)">Leaching (chemical separation)</option>
                          <option value="Conditioning/drying">Conditioning/drying</option>
                          <option value="Soil amendment">Soil amendment</option>
                          <option value="Cement addition">Cement addition</option>
                          <option value="Waste-to-energy">Waste-to-energy</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Conditioning Method</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Neutralization/washing"
                              checked={valorizationForm.conditioningMethod.includes('Neutralization/washing')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  conditioningMethod: e.target.checked
                                    ? [...f.conditioningMethod, val]
                                    : f.conditioningMethod.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Neutralization/washing</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Thermal treatment"
                              checked={valorizationForm.conditioningMethod.includes('Thermal treatment')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValorizationForm((f) => ({
                                  ...f,
                                  conditioningMethod: e.target.checked
                                    ? [...f.conditioningMethod, val]
                                    : f.conditioningMethod.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Thermal treatment</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={valorizationForm.conditioningMethodOther}
                          onChange={(e) => setValorizationForm((f) => ({ ...f, conditioningMethodOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mt-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Waste Utilization for Substitute (select if applicable)</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={valorizationForm.soilAmendment}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, soilAmendment: e.target.checked }))}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Soil amendment for RM CO2 per tonne</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={valorizationForm.cementAddition}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, cementAddition: e.target.checked }))}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Cement addition as substitute</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={valorizationForm.wasteUnburntCarbon}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, wasteUnburntCarbon: e.target.checked }))}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Waste unburnt carbon fuel waste type</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Emissions Reduction as Substitution (%)</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="emissionsReduction"
                              value="Minimal (limited substitute, marginal CO2 offset)"
                              checked={valorizationForm.emissionsReduction === 'Minimal (limited substitute, marginal CO2 offset)'}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, emissionsReduction: e.target.value }))}
                              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Minimal (limited substitute, marginal CO2 offset)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="emissionsReduction"
                              value="Moderate (partial displacement, moderate CO2 savings)"
                              checked={valorizationForm.emissionsReduction === 'Moderate (partial displacement, moderate CO2 savings)'}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, emissionsReduction: e.target.value }))}
                              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Moderate (partial displacement, moderate CO2 savings)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="emissionsReduction"
                              value="Significant (large share replaced, high emissions avoided)"
                              checked={valorizationForm.emissionsReduction === 'Significant (large share replaced, high emissions avoided)'}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, emissionsReduction: e.target.value }))}
                              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Significant (large share replaced, high emissions avoided)</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={valorizationForm.emissionsReductionOther}
                          onChange={(e) => setValorizationForm((f) => ({ ...f, emissionsReductionOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mt-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Toxicity Feedback (select best per waste type)</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="toxicityFeedback"
                              value="Leachate testing (before & after) – chemical analysis"
                              checked={valorizationForm.toxicityFeedback === 'Leachate testing (before & after) – chemical analysis'}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, toxicityFeedback: e.target.value }))}
                              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Leachate testing (before & after) – chemical analysis</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="toxicityFeedback"
                              value="Soil stabilization (improves mechanical properties)"
                              checked={valorizationForm.toxicityFeedback === 'Soil stabilization (improves mechanical properties)'}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, toxicityFeedback: e.target.value }))}
                              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Soil stabilization (improves mechanical properties)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="toxicityFeedback"
                              value="Lime addition (reduces leaching – binds trace metals)"
                              checked={valorizationForm.toxicityFeedback === 'Lime addition (reduces leaching – binds trace metals)'}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, toxicityFeedback: e.target.value }))}
                              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Lime addition (reduces leaching – binds trace metals)</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={valorizationForm.toxicityFeedbackOther}
                          onChange={(e) => setValorizationForm((f) => ({ ...f, toxicityFeedbackOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mt-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Recovery Efficiency (% of material recovered as usable product)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={valorizationForm.recoveryEfficiencyMaterial}
                          onChange={(e) => setValorizationForm((f) => ({ ...f, recoveryEfficiencyMaterial: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Economic Viability (select one valorization method)</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="economicViability"
                              value="High (profitable, low-cost process)"
                              checked={valorizationForm.economicViability === 'High (profitable, low-cost process)'}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, economicViability: e.target.value }))}
                              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">High (profitable, low-cost process)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="economicViability"
                              value="Moderate (break-even or minimal profit)"
                              checked={valorizationForm.economicViability === 'Moderate (break-even or minimal profit)'}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, economicViability: e.target.value }))}
                              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Moderate (break-even or minimal profit)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="economicViability"
                              value="Low (high costs, not commercially viable yet)"
                              checked={valorizationForm.economicViability === 'Low (high costs, not commercially viable yet)'}
                              onChange={(e) => setValorizationForm((f) => ({ ...f, economicViability: e.target.value }))}
                              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Low (high costs, not commercially viable yet)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Recycling Stage Form
                if (stageId === 'recycling') {
                  return (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Sorting Methods</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Manual"
                              checked={recyclingForm.sortingMethods.includes('Manual')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRecyclingForm((f) => ({
                                  ...f,
                                  sortingMethods: e.target.checked
                                    ? [...f.sortingMethods, val]
                                    : f.sortingMethods.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Manual</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Optical (sensor-based)"
                              checked={recyclingForm.sortingMethods.includes('Optical (sensor-based)')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRecyclingForm((f) => ({
                                  ...f,
                                  sortingMethods: e.target.checked
                                    ? [...f.sortingMethods, val]
                                    : f.sortingMethods.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Optical (sensor-based)</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={recyclingForm.sortingMethodsOther}
                          onChange={(e) => setRecyclingForm((f) => ({ ...f, sortingMethodsOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mt-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Recycling Approach</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Closed-loop recycling"
                              checked={recyclingForm.recyclingApproach.includes('Closed-loop recycling')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRecyclingForm((f) => ({
                                  ...f,
                                  recyclingApproach: e.target.checked
                                    ? [...f.recyclingApproach, val]
                                    : f.recyclingApproach.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Closed-loop recycling</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Open-loop recycling"
                              checked={recyclingForm.recyclingApproach.includes('Open-loop recycling')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRecyclingForm((f) => ({
                                  ...f,
                                  recyclingApproach: e.target.checked
                                    ? [...f.recyclingApproach, val]
                                    : f.recyclingApproach.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Open-loop recycling</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Secondary aluminium production"
                              checked={recyclingForm.recyclingApproach.includes('Secondary aluminium production')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRecyclingForm((f) => ({
                                  ...f,
                                  recyclingApproach: e.target.checked
                                    ? [...f.recyclingApproach, val]
                                    : f.recyclingApproach.filter((v) => v !== val)
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Secondary aluminium production</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Others (please specify)"
                          value={recyclingForm.recyclingApproachOther}
                          onChange={(e) => setRecyclingForm((f) => ({ ...f, recyclingApproachOther: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Scrap Input (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={recyclingForm.scrapInput}
                            onChange={(e) => setRecyclingForm((f) => ({ ...f, scrapInput: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Recovery Yield (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={recyclingForm.recoveryYield}
                            onChange={(e) => setRecyclingForm((f) => ({ ...f, recoveryYield: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Furnace Energy Demand (MJ/t)</label>
                        <input
                          type="number"
                          value={recyclingForm.furnaceEnergyDemand}
                          onChange={(e) => setRecyclingForm((f) => ({ ...f, furnaceEnergyDemand: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Emission Savings (kg CO₂/tonne vs primary)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={recyclingForm.emissionSavings}
                          onChange={(e) => setRecyclingForm((f) => ({ ...f, emissionSavings: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">Compared to primary aluminum production</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Recycling Efficiency (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={recyclingForm.recyclingEfficiency}
                            onChange={(e) => setRecyclingForm((f) => ({ ...f, recyclingEfficiency: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Collection Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={recyclingForm.collectionRate}
                            onChange={(e) => setRecyclingForm((f) => ({ ...f, collectionRate: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Closed-loop (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={recyclingForm.closedLoopPercentage}
                            onChange={(e) => setRecyclingForm((f) => ({ ...f, closedLoopPercentage: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Open-loop (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={recyclingForm.openLoopPercentage}
                            onChange={(e) => setRecyclingForm((f) => ({ ...f, openLoopPercentage: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Footer */}
              {selectedNodeId && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                    onClick={deleteSelectedNode}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={saveInspector}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        )}
          </div>
        </div>
    </div>
  );
}

export default function Canvas() {
  return (
    <>
      <style>{`
        /* Modern Scrollbar Styles */
        * {
          scrollbar-width: thin;
          scrollbar-color: #C17A64 #F3F2EC;
        }

        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        *::-webkit-scrollbar-track {
          background: #F3F2EC;
          border-radius: 4px;
        }

        *::-webkit-scrollbar-thumb {
          background: #C17A64;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: #AE6A53;
        }

        *::-webkit-scrollbar-corner {
          background: #F3F2EC;
        }

        /* Specific styles for sidebar scrollbars */
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #D9B8AB;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #C17A64;
        }
      `}</style>
      <ReactFlowProvider>
        <CanvasFlow />
      </ReactFlowProvider>
    </>
  );
}