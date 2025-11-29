/**
 * useDragDrop Hook
 * Handles drag and drop functionality for process library
 */

import { useCallback, useState } from 'react';
import { getCenterPosition } from '@/utils/canvasUtils';

export const useDragDrop = (reactFlowInstance, addNode) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedProcess, setDraggedProcess] = useState(null);
  
  /**
   * Handle drag start
   */
  const onDragStart = useCallback((event, process) => {
    event.dataTransfer.effectAllowed = 'move';
    // Store only serializable data, keep icon reference in state
    const serializableData = {
      id: process.id,
      name: process.name,
      label: process.label,
      description: process.description,
      color: process.color,
      hasSubprocesses: process.hasSubprocesses,
      stage: process.stage
    };
    event.dataTransfer.setData('application/reactflow', JSON.stringify(serializableData));
    setDraggedProcess(process);
  }, []);
  
  /**
   * Handle drag over canvas
   */
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);
  
  /**
   * Handle drag leave canvas
   */
  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);
  
  /**
   * Handle drop on canvas
   */
  const onDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (!reactFlowInstance.current) {
      console.warn('ReactFlow instance not ready');
      return;
    }
    
    try {
      const processData = event.dataTransfer.getData('application/reactflow');
      if (!processData) return;
      
      // Use the draggedProcess which has the full data including icon
      const process = draggedProcess;
      if (!process) {
        console.warn('No dragged process found');
        return;
      }
      
      // Get drop position in flow coordinates
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Add node at drop position with full process data
      const newNode = addNode(process, position);
      
      console.log('✅ Process dropped:', process.name, 'at', position);
      
      // Clear dragged process
      setDraggedProcess(null);
      
      return newNode;
    } catch (error) {
      console.error('❌ Failed to handle drop:', error);
      setDraggedProcess(null);
    }
  }, [reactFlowInstance, addNode, draggedProcess]);
  
  /**
   * Add process to center of viewport
   */
  const addProcessToCenter = useCallback((process) => {
    if (!reactFlowInstance.current) {
      console.warn('ReactFlow instance not ready');
      return;
    }
    
    const position = getCenterPosition(reactFlowInstance.current);
    return addNode(process, position);
  }, [reactFlowInstance, addNode, draggedProcess]);
  
  return {
    isDragOver,
    draggedProcess,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    addProcessToCenter
  };
};
