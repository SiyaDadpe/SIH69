/**
 * Stage Mapping Configuration
 * Maps stages to their display properties and process configurations
 */

export const stageConfig = {
  steel: {
    stages: [
      { id: 'extraction', label: 'Stage 1: Mining', order: 1 },
      { id: 'processing', label: 'Stage 2: Beneficiation', order: 2 },
      { id: 'ironmaking', label: 'Stage 3: Ironmaking', order: 3 },
      { id: 'steelmaking', label: 'Stage 4: Steelmaking', order: 4 },
      { id: 'manufacturing', label: 'Stage 5: Manufacturing', order: 5 },
      { id: 'recycling', label: 'Stage 6: Recycling', order: 6 },
      { id: 'valorization', label: 'Stage 7: Valorization', order: 7 }
    ]
  },
  aluminum: {
    stages: [
      { id: 'extraction', label: 'Stage 1: Mining', order: 1 },
      { id: 'processing', label: 'Stage 2: Beneficiation', order: 2 },
      { id: 'alumina_refining', label: 'Stage 3: Refining', order: 3 },
      { id: 'smelting', label: 'Stage 4: Smelting', order: 4 },
      { id: 'manufacturing', label: 'Stage 5: Manufacturing', order: 5 },
      { id: 'recycling', label: 'Stage 6: Recycling', order: 6 },
      { id: 'valorization', label: 'Stage 7: Valorization', order: 7 }
    ]
  }
};

export const getStagesForMetal = (metal) => {
  return stageConfig[metal]?.stages || [];
};

export const getStageLabel = (metal, stageId) => {
  const stages = getStagesForMetal(metal);
  const stage = stages.find(s => s.id === stageId);
  return stage?.label || stageId;
};

export const getStageOrder = (metal, stageId) => {
  const stages = getStagesForMetal(metal);
  const stage = stages.find(s => s.id === stageId);
  return stage?.order || 999;
};

// Stage to API endpoint mapping
export const stageApiMapping = {
  extraction: 'mining',
  processing: 'beneficiation',
  beneficiation: 'beneficiation',
  ironmaking: 'ironmaking',
  steelmaking: 'steelmaking',
  alumina_refining: 'refining',
  smelting: 'smelting',
  refining: 'refining',
  manufacturing: 'manufacturing',
  use_phase: 'use_phase',
  recycling: 'recycling',
  valorization: 'valorization'
};

export const getApiEndpointForStage = (stageId) => {
  return stageApiMapping[stageId] || stageId;
};
