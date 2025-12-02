import React, { useMemo, useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import WizardForm from "@/sections/Wizard/wizardForm"
import ProgressTracker from "@/sections/Wizard/progressTracker"
import MetalSelection from "@/components/MetalSelection"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react"
import {
  createWizardWorkflow,
  getWizardWorkflow,
  submitWizardWorkflow,
  generateWizardReport,
} from "@/services/wizardService"

export default function Wizard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [selectedMetal, setSelectedMetal] = useState(null)
  
  const steps = useMemo(() => [
    { title: "Mining", description: "Extract raw materials from ore deposits", key: "mining" },
    { title: "Beneficiation", description: "Process and concentrate the ore", key: "beneficiation" },
    { title: "Refining", description: "Purify the metal to required standards", key: "refining" },
    { title: "Smelting", description: "Extract metal from concentrated ore", key: "smelting" },
    { title: "Manufacturing", description: "Transform refined metal into products", key: "manufacturing" },
    { title: "Recycling", description: "Recover and reprocess metal waste", key: "recycling" },
    { title: "Valorization", description: "Create value from by-products and waste", key: "valorization" },
  ], [])

  const [generatingReport, setGeneratingReport] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [workflowId, setWorkflowId] = useState(null)
  const [workflowData, setWorkflowData] = useState(null)
  const [projectBrief, setProjectBrief] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)


  // Initialize or load workflow
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (isInitialized) return;
    
    const id = searchParams.get('id')
    if (id) {
      console.log('📂 Loading existing workflow:', id);
      loadWorkflow(id).then(() => {
        setIsInitialized(true)
        // Metal type will be set from loadWorkflow based on workflow.metalType
      });
    } else {
      // Check if we have a workflow ID in localStorage to reuse
      const savedWorkflowId = localStorage.getItem('currentWizardWorkflowId');
      if (savedWorkflowId) {
        console.log('♻️ Reusing existing workflow from localStorage:', savedWorkflowId);
        // Verify the workflow exists before navigating
        loadWorkflow(savedWorkflowId).then(() => {
          setIsInitialized(true);
          // Metal type will be set from loadWorkflow based on workflow.metalType
        }).catch(() => {
          // If loading fails, clear localStorage - show metal selection
          console.warn('⚠️ Saved workflow invalid, showing metal selection');
          localStorage.removeItem('currentWizardWorkflowId');
          setIsInitialized(true);
        });
      } else {
        // Show metal selection screen
        console.log('🆕 No existing workflow, showing metal selection...');
        setIsInitialized(true);
      }
    }
  }, [searchParams, isInitialized])


  
  const initializeWorkflow = async (metalType = 'Aluminium', projectMeta = null) => {
    // Prevent duplicate calls
    if (loading || workflowId) {
      console.log('⏭️ Skipping workflow creation - already in progress or exists');
      return;
    }
    
    console.log('🆕 Creating new wizard workflow for:', metalType);
    setLoading(true)
    setError(null)
    try {
      // Get userId from localStorage or auth context
      const projectName = projectMeta?.projectName?.trim()
      const projectDescription = projectMeta?.projectDescription?.trim()
      
      const response = await createWizardWorkflow({
        name: projectName || `LCA Wizard - ${metalType} - ${new Date().toLocaleDateString()}`,
        metalType: metalType,
        description: projectDescription || `Wizard-based lifecycle assessment for ${metalType}`,
      })

      if (response.success && response.data?.workflow) {
        const newId = response.data.workflow._id
        console.log('✅ Workflow created:', newId);
        setWorkflowId(newId)
        setWorkflowData(response.data.workflow)
        
        // Save to localStorage for continuity
        localStorage.setItem('currentWizardWorkflowId', newId);
        console.log('💾 Saved workflow ID to localStorage');
        
        // Update URL with workflow ID
        navigate(`/wizard?id=${newId}`, { replace: true })
        
        setSuccess('Workflow created successfully!')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      console.error('❌ Error creating workflow:', err);
      setError('Failed to create workflow: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const loadWorkflow = async (id) => {
    // Prevent duplicate loads
    if (loading || workflowId === id) {
      console.log('⏭️ Skipping workflow load - already loaded');
      return;
    }
    
    console.log('📥 Loading workflow:', id);
    setLoading(true)
    setError(null)
    let shouldRethrow = false;
    
    try {
      const response = await getWizardWorkflow(id)
      
      if (response.success && response.data?.workflow) {
        console.log('✅ Workflow loaded:', id);
        setWorkflowId(id)
        setWorkflowData(response.data.workflow)
        
        // Set metal type from loaded workflow
        const metalType = response.data.workflow.metalType;
        if (metalType) {
          const workflowMetal = metalType.toLowerCase() === 'steel' ? 'steel' : 'aluminum';
          setSelectedMetal(workflowMetal);
          console.log('🎯 Metal type from workflow:', workflowMetal);
        }
        
        // Save valid workflow to localStorage
        localStorage.setItem('currentWizardWorkflowId', id);
        
        // Update URL if needed
        if (searchParams.get('id') !== id) {
          navigate(`/wizard?id=${id}`, { replace: true });
        }
        
        // Set active step based on workflow progress
        const completedCount = response.data.workflow.completedSteps?.length || 0
        setActiveStep(Math.min(completedCount, steps.length - 1))
      }
    } catch (err) {
      console.error('❌ Error loading workflow:', err);
      
      // Check if it's a timeout error
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        console.warn('⏱️ Workflow loading timed out. Creating a new one...');
        
        // Clear the potentially corrupted workflow ID from localStorage
        localStorage.removeItem('currentWizardWorkflowId');
        
        // Create a new workflow
        setError(null); // Clear error before creating new workflow
        setLoading(false); // Reset loading state before calling initializeWorkflow
        await initializeWorkflow();
        shouldRethrow = true;
      }
      // Check if it's a 404 error (workflow not found)
      else if (err.response?.status === 404) {
        console.warn('⚠️ Workflow not found in database. Creating a new one...');
        
        // Clear the invalid workflow ID from localStorage
        localStorage.removeItem('currentWizardWorkflowId');
        
        // Create a new workflow
        setError(null); // Clear error before creating new workflow
        setLoading(false); // Reset loading state before calling initializeWorkflow
        await initializeWorkflow();
        shouldRethrow = true;
      } 
      // Check if it's a network error
      else if (err.message === 'Network Error' || !err.response) {
        console.warn('🌐 Network error. Creating a new workflow...');
        
        // Clear the workflow ID from localStorage
        localStorage.removeItem('currentWizardWorkflowId');
        
        // Create a new workflow
        setError(null);
        setLoading(false);
        await initializeWorkflow();
        shouldRethrow = true;
      }
      else {
        setError('Failed to load workflow: ' + (err.response?.data?.message || err.message))
        shouldRethrow = true;
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitWorkflow = async () => {
    if (!workflowId) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await submitWizardWorkflow(workflowId)
      
      if (response.success) {
        setSuccess('Workflow submitted successfully!')
        setWorkflowData(response.data.workflow)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to submit workflow: ' + (err.response?.data?.message || err.message))
      console.error('Error submitting workflow:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!workflowId) return
    
    setGeneratingReport(true)
    setError(null)
    try {
      const response = await generateWizardReport(workflowId)
      
      if (response.success && response.data?.report) {
        setSuccess('Report generated successfully!')
        
        // Navigate to reports page or show report
        setTimeout(() => {
          navigate(`/reports/${response.data.report._id}`)
        }, 1500)
      }
    } catch (err) {
      setError('Failed to generate report: ' + (err.response?.data?.message || err.message))
      console.error('Error generating report:', err)
    } finally {
      setGeneratingReport(false)
    }
  }

  const completionPercentage = workflowData?.completionPercentage || 0
  const isCompleted = completionPercentage === 100
  const isSubmitted = workflowData?.status === 'submitted'

  // On Create Wizard
  const handleMetalSelection = (selection) => {
    const metalType = typeof selection === 'string' ? selection : selection?.metal;
    if (!metalType) return;

    console.log('🎯 Metal selected:', metalType, selection);

    // Handle loading existing workflow
    if (selection && typeof selection === 'object' && selection.mode === 'load') {
      console.log('🔄 Loading existing workflow:', selection.workflowId);
      setSelectedMetal(metalType);
      loadWorkflow(selection.workflowId);
      return;
    }

    // Handle creating new workflow
    if (selection && typeof selection === 'object' && selection.mode === 'create') {
      setProjectBrief({
        name: selection.projectName,
        description: selection.projectDescription,
      });
    } else {
      setProjectBrief(null);
    }

    setSelectedMetal(metalType);
    const normalizedMetal = metalType === 'steel' ? 'Steel' : 'Aluminium';
    const projectMeta = selection && typeof selection === 'object' ? selection : null;
    initializeWorkflow(normalizedMetal, projectMeta);
  }

  // Handle workflow update from each step
  const handleWorkflowUpdate = (updatedWorkflow) => {
    console.log('📊 [Wizard Page] Workflow updated:', updatedWorkflow);
    console.log('📊 [Wizard Page] Completed steps:', updatedWorkflow.completedSteps);
    console.log('📊 [Wizard Page] Current step:', updatedWorkflow.currentStep);
    setWorkflowData(updatedWorkflow);
  }

  // Handle workflow submission from Step 7
  const handleWorkflowSubmitted = (data) => {
    console.log('✅ [Wizard Page] Workflow submitted:', data);
    setWorkflowData(data.workflow);
    
    // Clear the saved workflow ID from localStorage since it's completed
    localStorage.removeItem('currentWizardWorkflowId');
    console.log('🗑️ Cleared workflow ID from localStorage');
    
    setSuccess('🎉 Workflow submitted successfully! Redirecting to dashboard...');
    
    // Navigate to dashboard after 2 seconds
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  }

  const showMetalSelection = !selectedMetal && !workflowId;

  return (
    <div className={`relative min-h-screen ${showMetalSelection ? 'overflow-hidden' : ''}`}>
      {showMetalSelection && <MetalSelection onSelect={handleMetalSelection} />}

      {/* Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg animate-in slide-in-from-top">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg animate-in slide-in-from-top">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">Success</h4>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">×</button>
          </div>
        </div>
      )}

      {/* Header with Actions */}
      <div className="sticky top-0 z-20 bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wizard Workflow</h1>
            {workflowData && (
              <p className="text-sm text-gray-600 mt-1">
                Progress: {completionPercentage}% • Status: <span className="font-medium capitalize">{workflowData.status}</span>
              </p>
            )}
            {projectBrief && (
              <div className="mt-1 text-sm text-gray-600">
                Project: <span className="font-semibold text-gray-900">{projectBrief.name}</span>
                {projectBrief.description && (
                  <span className="text-gray-500"> — {projectBrief.description}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Wizard Home / Metal Selection button - Always visible when workflow exists */}
            {workflowId && (
              <Button
                onClick={() => {
                  const message = isSubmitted 
                    ? 'Return to wizard home page to start a new project?' 
                    : 'Are you sure you want to return to wizard home? Current progress will be saved.';
                  
                  if (confirm(message)) {
                    // Don't remove from localStorage - just return to metal selection
                    // User can load this workflow again from recent projects
                    setSelectedMetal(null);
                    setWorkflowId(null);
                    setWorkflowData(null);
                    setProjectBrief(null);
                    setActiveStep(0);
                    console.log('🏠 Returning to wizard home page');
                    navigate('/wizard', { replace: true });
                  }
                }}
                variant="outline"
                className="border-[#BA7967] text-[#BA7967] hover:bg-[#BA7967] hover:text-white"
              >
                🏠 Wizard Home
              </Button>
            )}
            
            {isSubmitted && (
              <Button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="bg-[#BA7967] hover:bg-[#a86b5c] text-white"
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading && !workflowData ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#BA7967]" />
        </div>
      ) : (
        <>
          <WizardForm 
            steps={steps} 
            activeStep={activeStep} 
            onStepChange={setActiveStep}
            workflowId={workflowId}
            workflowData={workflowData}
            onWorkflowUpdate={handleWorkflowUpdate}
            onWorkflowSubmitted={handleWorkflowSubmitted}
          />
          <ProgressTracker 
            steps={steps} 
            currentStep={activeStep} 
            onStepClick={setActiveStep}
            completedSteps={workflowData?.completedSteps || []}
            completionPercentage={completionPercentage}
          />
        </>
      )}
    </div>
  )
}