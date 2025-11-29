/**
 * CanvasNode Component
 * Custom ReactFlow node component for process representation
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';

const CanvasNode = ({ data, selected }) => {
  const process = data?.process;
  const IconComponent = process?.icon;
  
  // Debug icon
  if (process && !IconComponent) {
    console.log('❌ No icon for process:', process.name, process);
  }
  
  if (!data || !process) {
    return null;
  }

  // Get stage label from stageMapping
  const getStageLabel = (stageId, metal) => {
    const stageConfig = {
      steel: [
        { id: 'extraction', label: 'Stage 1: Mining' },
        { id: 'processing', label: 'Stage 2: Beneficiation' },
        { id: 'ironmaking', label: 'Stage 3: Ironmaking' },
        { id: 'steelmaking', label: 'Stage 4: Steelmaking' },
        { id: 'manufacturing', label: 'Stage 5: Manufacturing' },
        { id: 'recycling', label: 'Stage 6: Recycling' },
        { id: 'valorization', label: 'Stage 7: Valorization' }
      ],
      aluminum: [
        { id: 'extraction', label: 'Stage 1: Mining' },
        { id: 'processing', label: 'Stage 2: Beneficiation' },
        { id: 'alumina_refining', label: 'Stage 3: Refining' },
        { id: 'smelting', label: 'Stage 4: Smelting' },
        { id: 'manufacturing', label: 'Stage 5: Manufacturing' },
        { id: 'recycling', label: 'Stage 6: Recycling' },
        { id: 'valorization', label: 'Stage 7: Valorization' }
      ]
    };
    
    const stages = stageConfig[metal] || [];
    const stage = stages.find(s => s.id === stageId);
    return stage?.label || stageId;
  };
  
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md transition-all duration-200
        border ${selected ? 'border-black border-2 shadow-lg' : 'border-gray-400'}
        w-[200px]
      `}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-black border border-white"
      />
      
      {/* Node Content */}
      <div className="p-3">
        {/* Icon and Title - Centered Layout */}
        <div className="flex flex-col items-center text-center gap-2">
          <div
            className="shrink-0 w-10 h-10 rounded-md flex items-center justify-center"
            style={{ backgroundColor: process.color || '#8B4513' }}
          >
            {IconComponent && typeof IconComponent === 'function' ? (
              <IconComponent className="w-5 h-5 text-white" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/30" />
            )}
          </div>
          
          <div className="w-full">
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
              {data.label}
            </h3>
            <p className="text-xs text-gray-500">
              {getStageLabel(data.stage, data.metal)}
            </p>
          </div>
          
          <p className="text-xs text-gray-400 italic mt-1">
            Configure details on the right
          </p>
        </div>
      </div>
      
      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-black border border-white"
      />
      
      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-black border border-white"
      />
      
      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-black border border-white"
      />
    </div>
  );
};

export default CanvasNode;
