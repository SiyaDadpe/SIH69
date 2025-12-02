/**
 * usePredictionEngine Hook
 * Mock prediction engine for frontend-only workflow predictions
 * Implements the exact behavior described in documentation but fully client-side
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from '@/utils/canvasUtils';

/**
 * Mock prediction API call
 * Simulates backend prediction processing
 */
const mockPredictionAPI = async (workflow) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Calculate mock predictions based on workflow
  const { processes, connections } = workflow;
  
  // Base impact per process
  const baseGWP = 2.5; // kg CO2 equivalent per process
  const baseEnergy = 15; // MJ per process
  const baseWater = 0.5; // m³ per process
  
  // Calculate totals
  const totalGWP = processes.length * baseGWP * (1 + Math.random() * 0.3);
  const totalEnergy = processes.length * baseEnergy * (1 + Math.random() * 0.25);
  const totalWater = processes.length * baseWater * (1 + Math.random() * 0.2);
  
  // Calculate efficiency (more connections = better efficiency)
  const connectionRatio = connections.length / Math.max(processes.length - 1, 1);
  const efficiency = Math.min(95, 60 + connectionRatio * 30 + Math.random() * 10);
  
  // Generate process-level predictions
  const processPredictions = processes.map(process => ({
    processId: process.id,
    processName: process.label,
    stage: process.stage,
    gwp: (baseGWP * (1 + Math.random() * 0.4)).toFixed(2),
    energyConsumption: (baseEnergy * (1 + Math.random() * 0.3)).toFixed(2),
    waterUsage: (baseWater * (1 + Math.random() * 0.25)).toFixed(3),
    confidence: (85 + Math.random() * 10).toFixed(1)
  }));
  
  return {
    success: true,
    predictions: {
      total: {
        gwp: totalGWP.toFixed(2),
        energyConsumption: totalEnergy.toFixed(2),
        waterUsage: totalWater.toFixed(3),
        unit_gwp: 'kg CO₂ eq',
        unit_energy: 'MJ',
        unit_water: 'm³'
      },
      workflowEfficiency: efficiency.toFixed(1),
      processBreakdown: processPredictions,
      stageBreakdown: calculateStageBreakdown(processPredictions),
      recommendations: generateRecommendations(workflow, efficiency)
    },
    metadata: {
      calculatedAt: new Date().toISOString(),
      processingTime: '0.8s',
      modelVersion: '1.0.0-mock'
    }
  };
};

/**
 * Calculate stage-level breakdown
 */
const calculateStageBreakdown = (processPredictions) => {
  const stages = {};
  
  processPredictions.forEach(pred => {
    if (!stages[pred.stage]) {
      stages[pred.stage] = {
        stage: pred.stage,
        gwp: 0,
        energyConsumption: 0,
        waterUsage: 0,
        processCount: 0
      };
    }
    
    stages[pred.stage].gwp += parseFloat(pred.gwp);
    stages[pred.stage].energyConsumption += parseFloat(pred.energyConsumption);
    stages[pred.stage].waterUsage += parseFloat(pred.waterUsage);
    stages[pred.stage].processCount += 1;
  });
  
  return Object.values(stages).map(stage => ({
    ...stage,
    gwp: stage.gwp.toFixed(2),
    energyConsumption: stage.energyConsumption.toFixed(2),
    waterUsage: stage.waterUsage.toFixed(3)
  }));
};

/**
 * Generate recommendations
 */
const generateRecommendations = (workflow, efficiency) => {
  const recommendations = [];
  
  if (efficiency < 70) {
    recommendations.push({
      type: 'warning',
      message: 'Low workflow efficiency detected. Consider connecting more processes.',
      priority: 'high'
    });
  }
  
  if (workflow.processes.length < 3) {
    recommendations.push({
      type: 'info',
      message: 'Add more processes to build a comprehensive workflow.',
      priority: 'medium'
    });
  }
  
  if (workflow.connections.length === 0 && workflow.processes.length > 1) {
    recommendations.push({
      type: 'warning',
      message: 'No connections between processes. Use "Connect" button to link them.',
      priority: 'high'
    });
  }
  
  recommendations.push({
    type: 'success',
    message: 'Workflow structure looks good. Configure parameters for accurate predictions.',
    priority: 'low'
  });
  
  return recommendations;
};

/**
 * usePredictionEngine Hook
 */
export const usePredictionEngine = (buildWorkflow) => {
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const abortControllerRef = useRef(null);
  const predictionTimeoutRef = useRef(null);
  
  /**
   * Trigger prediction calculation
   */
  const triggerPrediction = useCallback(async (force = false) => {
    try {
      // Cancel any pending prediction
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const workflow = buildWorkflow();
      
      // Validate workflow
      if (!workflow || workflow.processes.length === 0) {
        setPredictions(null);
        setError(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Call mock API
      const result = await mockPredictionAPI(workflow);
      
      if (result.success) {
        setPredictions(result.predictions);
        setLastUpdate(new Date());
        console.log('✅ Predictions calculated:', result.predictions);
      } else {
        throw new Error('Prediction failed');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('❌ Prediction error:', err);
        setError(err.message || 'Failed to calculate predictions');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [buildWorkflow]);
  
  /**
   * Debounced prediction trigger (500ms)
   */
  const debouncedTrigger = useCallback(
    debounce((force) => {
      triggerPrediction(force);
    }, 500),
    [triggerPrediction]
  );
  
  /**
   * Schedule prediction update
   */
  const schedulePrediction = useCallback(() => {
    if (predictionTimeoutRef.current) {
      clearTimeout(predictionTimeoutRef.current);
    }
    
    predictionTimeoutRef.current = setTimeout(() => {
      debouncedTrigger(false);
    }, 100);
  }, [debouncedTrigger]);
  
  /**
   * Clear predictions
   */
  const clearPredictions = useCallback(() => {
    setPredictions(null);
    setError(null);
    setLastUpdate(null);
  }, []);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    predictions,
    isLoading,
    error,
    lastUpdate,
    triggerPrediction,
    schedulePrediction,
    clearPredictions
  };
};
