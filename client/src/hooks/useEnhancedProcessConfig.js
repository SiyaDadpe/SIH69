/**
 * useEnhancedProcessConfig Hook
 * Manages subprocess selection and enhanced process configuration
 */

import { useState, useCallback, useMemo } from 'react';
import { getProcessDefaults } from '@/data/processDefaults';

export const useEnhancedProcessConfig = () => {
  const [selectedSubprocesses, setSelectedSubprocesses] = useState({
    methods: [],
    variants: [],
    parameters: {}
  });
  
  /**
   * Select a method
   */
  const selectMethod = useCallback((method) => {
    setSelectedSubprocesses(prev => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter(m => m !== method)
        : [...prev.methods, method]
    }));
  }, []);
  
  /**
   * Select a variant
   */
  const selectVariant = useCallback((variant) => {
    setSelectedSubprocesses(prev => ({
      ...prev,
      variants: prev.variants.includes(variant)
        ? prev.variants.filter(v => v !== variant)
        : [...prev.variants, variant]
    }));
  }, []);
  
  /**
   * Update subprocess parameters
   */
  const updateParameter = useCallback((key, value) => {
    setSelectedSubprocesses(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }));
  }, []);
  
  /**
   * Clear selections
   */
  const clearSelections = useCallback(() => {
    setSelectedSubprocesses({
      methods: [],
      variants: [],
      parameters: {}
    });
  }, []);
  
  /**
   * Build enhanced process object
   */
  const buildEnhancedProcess = useCallback((baseProcess, metal) => {
    const defaults = getProcessDefaults(metal, baseProcess.id);
    
    return {
      ...baseProcess,
      subprocesses: {
        methods: selectedSubprocesses.methods,
        variants: selectedSubprocesses.variants
      },
      parameters: {
        ...defaults,
        ...selectedSubprocesses.parameters
      },
      isEnhanced: true
    };
  }, [selectedSubprocesses]);
  
  /**
   * Get selection summary
   */
  const getSelectionSummary = useMemo(() => {
    const { methods, variants, parameters } = selectedSubprocesses;
    const count = methods.length + variants.length + Object.keys(parameters).length;
    
    return {
      count,
      hasSelections: count > 0,
      methods: methods.length,
      variants: variants.length,
      parameters: Object.keys(parameters).length
    };
  }, [selectedSubprocesses]);
  
  /**
   * Check if ready to add
   */
  const isReadyToAdd = useMemo(() => {
    return selectedSubprocesses.methods.length > 0 || selectedSubprocesses.variants.length > 0;
  }, [selectedSubprocesses]);
  
  return {
    selectedSubprocesses,
    selectMethod,
    selectVariant,
    updateParameter,
    clearSelections,
    buildEnhancedProcess,
    getSelectionSummary,
    isReadyToAdd
  };
};
