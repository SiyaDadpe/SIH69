/**
 * CanvasToolbar Component
 * Toolbar with actions: Connect, Clear
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Trash2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CanvasToolbar = ({
  isConnectMode,
  onToggleConnectMode,
  onClear,
  nodeCount,
  edgeCount,
  hasRightSidebar = false
}) => {
  return (
    <div className={`absolute top-4 z-10 transition-all duration-300 ${
      hasRightSidebar ? 'left-1/2 -translate-x-1/2' : 'right-4'
    }`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-md">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#BA7967]" />
              <span className="text-xs font-medium text-gray-700">
                {nodeCount} {nodeCount === 1 ? 'process' : 'processes'}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-1.5">
              <Link2 className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">
                {edgeCount} {edgeCount === 1 ? 'connection' : 'connections'}
              </span>
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />
          
          {/* Connect Mode Toggle */}
          <Button
            size="sm"
            variant={isConnectMode ? "default" : "outline"}
            onClick={onToggleConnectMode}
            className={`
              ${isConnectMode 
                ? 'bg-[#BA7967] text-white hover:bg-[#3d3635]' 
                : 'border-gray-300 hover:border-[#BA7967] hover:text-[#BA7967]'
              }
            `}
          >
            <Link2 className="w-4 h-4 mr-1.5" />
            Connect
          </Button>
          
          {/* Clear Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onClear}
            disabled={nodeCount === 0}
            className="border-gray-300 hover:border-red-500 hover:text-red-500 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear
          </Button>
        </div>
        
        {/* Connect Mode Instructions */}
        <AnimatePresence>
          {isConnectMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 pt-2 border-t border-gray-200"
            >
              <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-md">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <p className="font-semibold mb-1">Connect Mode Active</p>
                  <p>Click on a node's handle, then click on another node's handle to create a connection.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CanvasToolbar;
