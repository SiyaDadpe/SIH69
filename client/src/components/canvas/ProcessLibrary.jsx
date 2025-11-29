/**
 * ProcessLibrary Component
 * Left sidebar with metal selector, stage selector, and process cards
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DraggableProcess from './DraggableProcess';
import { getStagesForMetal } from '@/data/stageMapping';
import { getProcessesForStage } from '@/data/processLibrary';

const ProcessLibrary = ({
  selectedMetal,
  selectedStage,
  onSelectMetal,
  onSelectStage,
  onDragStart,
  isCollapsed,
  onToggleCollapse,
  existingNodes = [],
  onWidthChange
}) => {
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const metals = [
    { id: 'steel', label: 'Steel', color: '#708090' },
    { id: 'aluminum', label: 'Aluminum', color: '#A8A9AD' }
  ];
  
  const stages = useMemo(() => {
    return getStagesForMetal(selectedMetal);
  }, [selectedMetal]);
  
  const processes = useMemo(() => {
    if (!selectedStage) return [];
    return getProcessesForStage(selectedMetal, selectedStage);
  }, [selectedMetal, selectedStage]);
  
  // Get set of stages that already have nodes on canvas
  const occupiedStages = useMemo(() => {
    return new Set(existingNodes.map(node => node.data.stage));
  }, [existingNodes]);
  
  // Get set of process IDs with their stages (stage:processId) that are on canvas
  const processesOnCanvas = useMemo(() => {
    return new Set(existingNodes.map(node => {
      const processId = node.data.process?.id || node.data.process?.typeId;
      const stage = node.data.stage;
      return `${stage}:${processId}`;
    }));
  }, [existingNodes]);
  
  // Auto-select first stage when metal changes
  React.useEffect(() => {
    if (stages.length > 0 && !selectedStage) {
      onSelectStage(stages[0].id);
    }
  }, [stages, selectedStage, onSelectStage]);
  
  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= 280 && newWidth <= 500) {
        setWidth(newWidth);
        if (onWidthChange) {
          onWidthChange(newWidth);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onWidthChange]);
  
  if (isCollapsed) {
    return (
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-white border-r border-gray-200 flex items-center justify-center z-10">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }
  
  return (
    <div 
      ref={sidebarRef}
      className="absolute left-0 top-0 bottom-0 bg-white border-r border-gray-200 flex flex-col z-10"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b-2 border-[#D4A574] bg-[#EEEBE5]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#A0735C]">Process Library</h2>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-[#D4A574]/15 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#A0735C]" />
          </button>
        </div>
      </div>
      
      {/* Metal Selector */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <label className="text-xs font-semibold text-gray-700 mb-2 block">
          Select Metal
        </label>
        <select
          value={selectedMetal}
          onChange={(e) => {
            onSelectMetal(e.target.value);
            onSelectStage(null);
          }}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BA7967] focus:border-transparent transition-all"
        >
          {metals.map((metal) => (
            <option key={metal.id} value={metal.id}>
              {metal.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Stage Selector */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <label className="text-xs font-semibold text-gray-700 mb-2 block">
          Select Stage
        </label>
        <select
          value={selectedStage || ''}
          onChange={(e) => onSelectStage(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BA7967] focus:border-transparent transition-all"
        >
          <option value="">Choose a stage...</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Process List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selectedStage ? (
            <motion.div
              key={selectedStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4"
            >
              {/* Stage Header */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  {stages.find(s => s.id === selectedStage)?.label}
                </h3>
                <p className="text-xs text-gray-500">
                  {processes.length} {processes.length === 1 ? 'process' : 'processes'} available
                </p>
              </div>
              
              {/* Process Cards */}
              {processes.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {processes.map((process) => (
                    <DraggableProcess
                      key={process.id}
                      process={process}
                      onDragStart={onDragStart}
                      isDisabled={occupiedStages.has(process.stage)}
                      isOnCanvas={processesOnCanvas.has(`${process.stage}:${process.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">No processes available for this stage</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full p-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ChevronRight className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Select a Stage</p>
                <p className="text-xs text-gray-500">
                  Choose a stage from the dropdown above to see available processes
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer Hint */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          💡 Drag processes to the canvas to build your workflow
        </p>
      </div>
      
      {/* Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[#BA7967] transition-colors group"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-[#BA7967]" />
        </div>
      </div>
    </div>
  );
};

export default ProcessLibrary;
