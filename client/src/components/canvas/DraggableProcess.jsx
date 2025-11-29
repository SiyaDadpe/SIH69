/**
 * DraggableProcess Component
 * Individual draggable process card in the library
 */

import React from 'react';
import { motion } from 'framer-motion';

const DraggableProcess = ({ process, onDragStart }) => {
  const IconComponent = process.icon;
  
  const handleDragStart = (e) => {
    onDragStart(e, process);
  };
  
  return (
    <motion.div
      draggable
      onDragStart={handleDragStart}
      className="group cursor-grab active:cursor-grabbing"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="bg-white border-2 border-gray-200 rounded-lg p-3 transition-all duration-200 hover:border-[#BA7967] hover:shadow-md">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${process.color}20` }}
          >
            <IconComponent
              className="w-5 h-5"
              style={{ color: process.color }}
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-0.5 truncate">
              {process.name}
            </h4>
            <p className="text-xs text-gray-500 line-clamp-2">
              {process.description}
            </p>
          </div>
        </div>
        
        {/* Drag hint */}
        <div className="mt-2 text-center text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Drag to canvas
        </div>
      </div>
    </motion.div>
  );
};

export default DraggableProcess;
