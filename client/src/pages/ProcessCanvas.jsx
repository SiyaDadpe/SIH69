/**
 * ProcessCanvas Component
 * Main canvas page - orchestrates all canvas functionality
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';

// Components
import ProcessLibrary from '@/components/canvas/ProcessLibrary';
import CanvasArea from '@/components/canvas/CanvasArea';
import RightSidebar from '@/components/canvas/RightSidebar';
import CanvasToolbar from '@/components/canvas/CanvasToolbar';
import SubprocessSelectionModal from '@/components/canvas/SubprocessSelectionModal';
import CanvasNodeComponent from '@/components/canvas/CanvasNode';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FloatingChatbot from '@/components/FloatingChatbot';

// Hooks
import { useCanvasState } from '@/hooks/useCanvasState';
import { useDragDrop } from '@/hooks/useDragDrop';

// Utils
import { exportWorkflow } from '@/utils/canvasUtils';

const ProcessCanvas = ({ initialMetal = 'steel', projectName = 'Untitled Workflow' }) => {
  // Core state management
  const {
    nodes,
    edges,
    selectedMetal,
    selectedStage,
    selectedNode,
    isConnectMode,
    showSubprocessModal,
    modalProcess,
    reactFlowInstance,
    setSelectedMetal,
    setSelectedStage,
    setSelectedNode,
    setIsConnectMode,
    setShowSubprocessModal,
    setModalProcess,
    addNode,
    updateNodeParameters,
    deleteNode,
    addEdge,
    clearCanvas,
    buildWorkflow,
    onNodesChange,
    onEdgesChange
  } = useCanvasState(initialMetal);
  
  // Drag and drop functionality
  const {
    isDragOver,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    addProcessToCenter
  } = useDragDrop(reactFlowInstance, addNode);
  
  // UI state
  const [isLibraryCollapsed, setIsLibraryCollapsed] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [libraryWidth, setLibraryWidth] = React.useState(320);
  
  // Node types for ReactFlow
  const nodeTypes = useMemo(() => ({
    canvasNode: CanvasNodeComponent
  }), []);
  
  // Initialize ReactFlow instance
  const onReactFlowInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
  }, [reactFlowInstance]);
  
  // Handle process drag from library
  const handleProcessDrag = useCallback((event, process) => {
    // Check if process has subprocesses
    if (process.hasSubprocesses) {
      event.preventDefault();
      setModalProcess(process);
      setShowSubprocessModal(true);
    } else {
      onDragStart(event, process);
    }
  }, [onDragStart, setModalProcess, setShowSubprocessModal]);
  
  // Handle subprocess modal - add to canvas
  const handleAddFromModal = useCallback((enhancedProcess) => {
    const result = addProcessToCenter(enhancedProcess);
    if (result) {
      toast.success(`Added ${enhancedProcess.name} to canvas`);
    } else {
      toast.error(`Cannot add ${enhancedProcess.name}. A process from this stage already exists on the canvas.`);
    }
  }, [addProcessToCenter]);
  
  // Handle node click
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    setIsSidebarCollapsed(false);
  }, [setSelectedNode]);
  
  // Handle pane click (deselect)
  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);
  
  // Handle connection
  const handleConnect = useCallback((connection) => {
    addEdge(connection);
    toast.success('Processes connected');
  }, [addEdge]);
  
  // Toggle connect mode
  const toggleConnectMode = useCallback(() => {
    setIsConnectMode(prev => !prev);
    if (!isConnectMode) {
      toast.info('Connect mode enabled. Click node handles to connect processes.');
    } else {
      toast.info('Connect mode disabled');
    }
  }, [isConnectMode, setIsConnectMode]);
  
  // Handle clear canvas
  const handleClear = useCallback(() => {
    setShowClearDialog(true);
  }, []);
  
  const confirmClear = useCallback(() => {
    clearCanvas();
    toast.success('Canvas cleared');
  }, [clearCanvas]);
  
  // Handle export
  const handleExport = useCallback(() => {
    try {
      exportWorkflow(nodes, edges, selectedMetal, projectName);
      toast.success('Workflow exported successfully');
    } catch (error) {
      toast.error('Failed to export workflow');
      console.error(error);
    }
  }, [nodes, edges, selectedMetal, projectName]);
  
  // Handle parameter update
  const handleParameterUpdate = useCallback((nodeId, parameters) => {
    updateNodeParameters(nodeId, parameters);
    toast.success('Parameters saved');
  }, [updateNodeParameters]);
  
  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId) => {
    deleteNode(nodeId);
    toast.success('Process removed');
  }, [deleteNode]);
  
  // Handle drop with validation
  const handleDrop = useCallback((event) => {
    const result = onDrop(event);
    if (result === null) {
      // Node was not added due to stage conflict
      toast.error('Cannot add process. A process from this stage already exists on the canvas.');
    }
  }, [onDrop]);
  
  return (
    <ReactFlowProvider>
      <div className="w-full h-screen bg-gray-100 relative overflow-hidden">
        {/* Process Library - Left Sidebar */}
        <ProcessLibrary
          selectedMetal={selectedMetal}
          selectedStage={selectedStage}
          onSelectMetal={setSelectedMetal}
          onSelectStage={setSelectedStage}
          onDragStart={handleProcessDrag}
          isCollapsed={isLibraryCollapsed}
          onToggleCollapse={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
          existingNodes={nodes}
          onWidthChange={setLibraryWidth}
        />
        
        {/* Canvas Area */}
        <div
          className="absolute inset-0 transition-all duration-150"
          style={{
            left: isLibraryCollapsed ? '48px' : `${libraryWidth}px`,
            right: (selectedNode && !isSidebarCollapsed) ? '384px' : (selectedNode ? '48px' : '0')
          }}
        >
          <CanvasArea
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onDrop={handleDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            isDragOver={isDragOver}
            nodeTypes={nodeTypes}
            onInit={onReactFlowInit}
            isConnectMode={isConnectMode}
          />
          
          {/* Toolbar */}
          <CanvasToolbar
            isConnectMode={isConnectMode}
            onToggleConnectMode={toggleConnectMode}
            onClear={handleClear}
            nodeCount={nodes.length}
            edgeCount={edges.length}
            hasRightSidebar={!!selectedNode}
          />
        </div>
        
        {/* Right Sidebar - Parameters */}
        {selectedNode && (
          <RightSidebar
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdateParameters={handleParameterUpdate}
            onDeleteNode={handleNodeDelete}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}
        
        {/* Subprocess Selection Modal */}
        <SubprocessSelectionModal
          isOpen={showSubprocessModal}
          process={modalProcess}
          onClose={() => {
            setShowSubprocessModal(false);
            setModalProcess(null);
          }}
          onAddToCanvas={handleAddFromModal}
        />
        
        {/* Clear Canvas Confirmation Dialog */}
        <ConfirmDialog
          open={showClearDialog}
          onOpenChange={setShowClearDialog}
          title="localhost:5173 says"
          description="Are you sure you want to clear the entire canvas? This action cannot be undone."
          onConfirm={confirmClear}
          confirmText="OK"
          cancelText="Cancel"
        />
        <FloatingChatbot />
      </div>
    </ReactFlowProvider>
  );
};

export default ProcessCanvas;
