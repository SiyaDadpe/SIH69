/**
 * CanvasArea Component
 * Main ReactFlow canvas area with drag-drop support and empty state
 */

import React from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const CanvasArea = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver,
  nodeTypes,
  onInit,
  isConnectMode
}) => {
  const isEmpty = nodes.length === 0;
  
  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick(node)}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        attributionPosition="bottom-left"
        className={`
          transition-all duration-300
          ${isDragOver ? 'bg-blue-50' : 'bg-[#f5f1ed]'}
          ${isConnectMode ? 'cursor-crosshair' : ''}
        `}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { strokeWidth: 2, stroke: '#BA7967' }
        }}
        connectionLineStyle={{ stroke: '#BA7967', strokeWidth: 2 }}
        connectionLineType="smoothstep"
      >
        <Background
          gap={16}
          size={1}
          color="#d4c9be"
        />
        <Controls
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
          showInteractive={false}
        />

        
        {/* Empty State */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md px-6"
            >
              <div className="w-24 h-24 bg-[#EEEBE5] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-[#D4A574]">
                <Network className="w-12 h-12 text-[#A0735C]" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Start Building Your LCA
              </h2>
              
              <p className="text-gray-600 mb-6">
                Drag processes from the library on the left to build your 
                lifecycle assessment workflow. Choose from {' '}
                <span className="font-semibold text-[#BA7967]">Steel</span> or {' '}
                <span className="font-semibold text-[#BA7967]">Aluminum</span> processes 
                covering all 7 stages.
              </p>
              
              <div className="inline-flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-900 text-left">
                  <span className="font-semibold">Tip:</span> Use the "Connect" button to link processes together
                </p>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Drag Over Indicator */}
        {isDragOver && (
          <div className="absolute inset-0 border-4 border-dashed border-[#BA7967] rounded-lg pointer-events-none flex items-center justify-center">
            <div className="bg-white px-6 py-3 rounded-lg shadow-lg">
              <p className="text-lg font-semibold text-[#BA7967]">
                Drop to add process
              </p>
            </div>
          </div>
        )}
        
        {/* Connect Mode Overlay */}
        {isConnectMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">Connect Mode Active</span>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
};

export default CanvasArea;
