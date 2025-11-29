/**
 * Test file to verify Canvas imports
 * Run this to check if components are being imported correctly
 */

import CanvasNode from './components/canvas/CanvasNode';
import ProcessLibrary from './components/canvas/ProcessLibrary';
import CanvasArea from './components/canvas/CanvasArea';
import DraggableProcess from './components/canvas/DraggableProcess';
import RightSidebar from './components/canvas/RightSidebar';
import CanvasToolbar from './components/canvas/CanvasToolbar';
import WorkflowPredictionPanel from './components/canvas/WorkflowPredictionPanel';
import SubprocessSelectionModal from './components/canvas/SubprocessSelectionModal';

console.log('CanvasNode type:', typeof CanvasNode);
console.log('CanvasNode:', CanvasNode);
console.log('ProcessLibrary type:', typeof ProcessLibrary);
console.log('CanvasArea type:', typeof CanvasArea);
console.log('DraggableProcess type:', typeof DraggableProcess);
console.log('RightSidebar type:', typeof RightSidebar);
console.log('CanvasToolbar type:', typeof CanvasToolbar);
console.log('WorkflowPredictionPanel type:', typeof WorkflowPredictionPanel);
console.log('SubprocessSelectionModal type:', typeof SubprocessSelectionModal);

// All should log 'function' or 'object' (for memo'd components)
// If any log 'object' with keys like { default: function }, there's an export/import mismatch
