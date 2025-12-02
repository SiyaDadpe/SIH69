/**
 * DraggableProcess Component
 * Individual draggable process card in the library
 */

import React from 'react';
import { motion } from 'framer-motion';

const DraggableProcess = ({ process, onDragStart, isDisabled = false, isOnCanvas = false }) => {
  const IconComponent = process.icon;
  
  const handleDragStart = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    onDragStart(e, process);
  };
  
  return (
    <motion.div
      draggable={!isDisabled}
      onDragStart={handleDragStart}
      className={`group ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
    >
      <div className={`bg-white border-2 rounded-lg p-3 transition-all duration-200 flex flex-col items-center text-center h-full ${
        isDisabled 
          ? 'border-gray-200 bg-gray-50' 
          : 'border-gray-200 hover:border-[#BA7967] hover:shadow-md'
      }`}>
        {/* Icon */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center mb-2"
          style={{ backgroundColor: isDisabled ? '#e5e7eb' : `${process.color}20` }}
        >
          <IconComponent
            className="w-6 h-6"
            style={{ color: isDisabled ? '#9ca3af' : process.color }}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 w-full">
          <h4 className={`text-sm font-semibold mb-1 ${
            isDisabled ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {process.name}
          </h4>
          <p className={`text-xs line-clamp-2 ${
            isDisabled ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {process.description}
          </p>
        </div>
        
        {/* Drag hint or disabled message */}
        <div className={`mt-2 text-center text-xs transition-opacity ${
          isOnCanvas
            ? 'text-red-500 opacity-100' 
            : isDisabled 
            ? 'text-gray-400 opacity-0' 
            : 'text-gray-400 opacity-0 group-hover:opacity-100'
        }`}>
          {isOnCanvas ? 'Already on canvas' : 'Drag to canvas'}
        </div>
      </div>
    </motion.div>
  );
};

export default DraggableProcess;
