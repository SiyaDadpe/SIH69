/**
 * useCanvasState Hook
 * Central state management for canvas operations
 */

import { useState, useCallback, useRef } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { createProcessNode, createConnection, buildWorkflowObject } from '@/utils/canvasUtils';
import { getProcessById } from '@/data/processLibrary';

export const useCanvasState = (initialMetal = 'steel') => {
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Canvas configuration state
  const [selectedMetal, setSelectedMetal] = useState(initialMetal);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  
  // UI state
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSubprocessModal, setShowSubprocessModal] = useState(false);
  const [modalProcess, setModalProcess] = useState(null);
  
  // Workflow state
  const [workflow, setWorkflow] = useState(null);
  
  // ReactFlow instance ref
  const reactFlowInstance = useRef(null);
  
  /**
   * Add a process node to the canvas
   */
  const addNode = useCallback((process, position) => {
    // Check if a node from the same stage already exists
    const existingNodeInStage = nodes.find(node => node.data.stage === process.stage);
    
    if (existingNodeInStage) {
      // Return null to indicate the node was not added
      return null;
    }
    
    const newNode = createProcessNode(process, position, selectedMetal, process.stage);
    setNodes(nds => [...nds, newNode]);
    return newNode;
  }, [selectedMetal, setNodes, nodes]);
  
  /**
   * Update node data
   */
  const updateNode = useCallback((nodeId, updates) => {
    setNodes(nds =>
      nds.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates,
              process: {
                ...node.data.process,
                ...updates.process
              }
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);
  
  /**
   * Update node parameters
   */
  const updateNodeParameters = useCallback((nodeId, parameters) => {
    setNodes(nds =>
      nds.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              process: {
                ...node.data.process,
                parameters: {
                  ...node.data.process.parameters,
                  ...parameters
                }
              }
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);
  
  /**
   * Delete a node
   */
  const deleteNode = useCallback((nodeId) => {
    setNodes(nds => nds.filter(node => node.id !== nodeId));
    setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);
  
  /**
   * Add an edge/connection
   */
  const addEdge = useCallback((connection) => {
    const newEdge = createConnection(connection.source, connection.target);
    setEdges(eds => [...eds, newEdge]);
    return newEdge;
  }, [setEdges]);
  
  /**
   * Delete an edge
   */
  const deleteEdge = useCallback((edgeId) => {
    setEdges(eds => eds.filter(edge => edge.id !== edgeId));
  }, [setEdges]);
  
  /**
   * Clear all nodes and edges
   */
  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  }, [setNodes, setEdges]);
  
  /**
   * Handle node selection
   */
  const selectNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    setSelectedNode(node || null);
  }, [nodes]);
  
  /**
   * Build workflow object for API
   */
  const buildWorkflow = useCallback(() => {
    return buildWorkflowObject(nodes, edges, selectedMetal);
  }, [nodes, edges, selectedMetal]);
  
  /**
   * Export canvas state
   */
  const exportState = useCallback(() => {
    return {
      nodes,
      edges,
      selectedMetal,
      projectName,
      workflow: buildWorkflow()
    };
  }, [nodes, edges, selectedMetal, projectName, buildWorkflow]);
  
  /**
   * Import canvas state
   */
  const importState = useCallback((state) => {
    if (state.nodes) {
      // Hydrate nodes with icon data from process library
      const hydratedNodes = state.nodes.map(node => {
        const processId = node.data?.process?.id;
        const metal = node.data?.metal || state.selectedMetal || selectedMetal;
        if (processId && metal) {
          const processDefinition = getProcessById(metal, processId);
          if (processDefinition && processDefinition.icon) {
            return {
              ...node,
              data: {
                ...node.data,
                process: {
                  ...node.data.process,
                  icon: processDefinition.icon,
                  color: processDefinition.color || node.data.process.color
                }
              }
            };
          }
        }
        return node;
      });
      setNodes(hydratedNodes);
    }
    if (state.edges) setEdges(state.edges);
    if (state.selectedMetal) setSelectedMetal(state.selectedMetal);
    if (state.projectName) setProjectName(state.projectName);
  }, [setNodes, setEdges, selectedMetal]);
  
  return {
    // State
    nodes,
    edges,
    selectedMetal,
    selectedStage,
    selectedNode,
    projectName,
    isConnectMode,
    isDragging,
    showSubprocessModal,
    modalProcess,
    workflow,
    reactFlowInstance,
    
    // Setters
    setNodes,
    setEdges,
    setSelectedMetal,
    setSelectedStage,
    setSelectedNode,
    setProjectName,
    setIsConnectMode,
    setIsDragging,
    setShowSubprocessModal,
    setModalProcess,
    setWorkflow,
    
    // Actions
    addNode,
    updateNode,
    updateNodeParameters,
    deleteNode,
    addEdge,
    deleteEdge,
    clearCanvas,
    selectNode,
    buildWorkflow,
    exportState,
    importState,
    
    // ReactFlow handlers
    onNodesChange,
    onEdgesChange
  };
};
