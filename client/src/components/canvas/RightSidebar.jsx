/**
 * RightSidebar Component
 * Parameter configuration panel for selected nodes
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Trash2, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { getParameterConfig, formatParameterValue } from '@/data/processDefaults';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const RightSidebar = ({
  selectedNode,
  onClose,
  onUpdateParameters,
  onDeleteNode,
  isCollapsed,
  onToggleCollapse
}) => {
  const [parameters, setParameters] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const process = selectedNode?.data?.process;
  const metal = selectedNode?.data?.metal;
  
  // Get parameter configuration
  const parameterConfig = useMemo(() => {
    if (!process || !metal) return [];
    return getParameterConfig(metal, process.id || process.typeId);
  }, [process, metal]);
  
  // Initialize parameters when node changes
  useEffect(() => {
    if (process?.parameters) {
      setParameters(process.parameters);
      setHasChanges(false);
    }
  }, [process]);
  
  const handleParameterChange = (paramName, value) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
    setHasChanges(true);
  };
  
  const handleSave = () => {
    if (selectedNode) {
      onUpdateParameters(selectedNode.id, parameters);
      setHasChanges(false);
    }
  };
  
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    if (selectedNode) {
      onDeleteNode(selectedNode.id);
    }
  };
  
  if (!selectedNode) {
    return null;
  }
  
  if (isCollapsed) {
    return (
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-white border-l border-gray-200 flex items-center justify-center z-10">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronDown className="w-5 h-5 text-gray-600 -rotate-90" />
        </button>
      </div>
    );
  }
  
  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 flex flex-col z-10 shadow-xl">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b-2 border-[#D4A574] bg-[#EEEBE5]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#A0735C]">Configure Process</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#D4A574]/15 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#A0735C]" />
          </button>
        </div>
      </div>
      
      {/* Process Info */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start gap-3">
          {process.icon && typeof process.icon === 'function' && (
            <div
              className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: process.color || '#8B4513' }}
            >
              {React.createElement(process.icon, {
                className: "w-6 h-6 text-white"
              })}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {selectedNode.data.label}
            </h3>
            <p className="text-xs text-gray-500">
              {selectedNode.data.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            {process.description && (
              <p className="text-xs text-gray-600 mt-2">
                {process.description}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Parameters Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedNode.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {parameterConfig.length > 0 ? (
              parameterConfig.map((param) => (
                <div key={param.name} className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 block">
                    {param.label}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {param.type === 'number' && (
                    <Input
                      type="number"
                      value={parameters[param.name] ?? ''}
                      onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value) || 0)}
                      placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}`}
                      className="w-full"
                      step="any"
                    />
                  )}
                  
                  {param.type === 'text' && (
                    <Input
                      type="text"
                      value={parameters[param.name] ?? ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}`}
                      className="w-full"
                    />
                  )}
                  
                  {param.type === 'select' && (
                    <select
                      value={parameters[param.name] ?? ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BA7967] focus:border-transparent"
                    >
                      <option value="">Select an option...</option>
                      {param.options?.map((option) => (
                        <option key={option} value={option}>
                          {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {/* Current Value Display */}
                  {parameters[param.name] !== undefined && (
                    <p className="text-xs text-gray-500">
                      Current: {formatParameterValue(parameters[param.name], param.name)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 mb-2">No parameters available</p>
                <p className="text-xs text-gray-400">
                  This process doesn't have configurable parameters
                </p>
              </div>
            )}
            
            {/* Subprocess Info */}
            {process.subprocesses && (
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Enhanced Process</h4>
                {process.subprocesses.methods?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-blue-700 mb-1">Methods:</p>
                    <div className="flex flex-wrap gap-1">
                      {process.subprocesses.methods.map((method, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                        >
                          {method.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {process.subprocesses.variants?.length > 0 && (
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Variants:</p>
                    <div className="flex flex-wrap gap-1">
                      {process.subprocesses.variants.map((variant, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                        >
                          {variant.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Footer Actions */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2.5">
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 bg-[#BA7967] hover:bg-[#a66858] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          
          <Button
            onClick={handleDelete}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          onClick={() => {
            if (selectedNode) {
              handleSave();
              // TODO: Integrate with LCA calculation engine
              alert('LCA calculation will be integrated with the backend engine.');
            }
          }}
          className="w-full bg-gradient-to-r from-[#BA7967] to-[#8b6355] hover:from-[#a66858] hover:to-[#7a5648] text-white font-medium transition-all"
        >
          Calculate LCA
        </Button>
        
        <Button
          onClick={() => {
            if (selectedNode) {
              // TODO: Integrate with AI prediction engine
              alert('AI Prediction will analyze your parameters and suggest optimizations.');
            }
          }}
          className="w-full bg-gradient-to-r from-[#3d3635] to-[#5a5251] hover:from-[#2d2625] hover:to-[#4a4241] text-white font-medium transition-all"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Prediction
        </Button>
        
        {hasChanges && (
          <p className="text-xs text-amber-600 text-center">
            You have unsaved changes
          </p>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="localhost:5173 says"
        description="Are you sure you want to delete this process?"
        onConfirm={confirmDelete}
        confirmText="OK"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default RightSidebar;
