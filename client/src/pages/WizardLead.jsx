import React, { useMemo, useState, useEffect, useCallback } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import WizardFormPb from "@/sections/Wizard/wizardForm-pb"
import ProgressTrackerPb from "@/sections/Wizard/progressTracker-pb"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import {
  createWizardWorkflow,
  getWizardWorkflow,
} from "@/services/wizardService"

export default function WizardPb() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [selectedMetal, setSelectedMetal] = useState('lead')
  
  const steps = useMemo(() => [
    { title: "Mining & Ore Extraction (Galena – PbS)", description: "Extract galena ore from deposits", key: "mining" },
    { title: "Beneficiation (Froth Flotation)", description: "Process and concentrate the ore", key: "beneficiation" },
    { title: "Smelting & Primary Metallurgical Extraction", description: "Extract lead from concentrate", key: "smelting" },
    { title: "Lead Refining (Pyrorefining + Electrorefining)", description: "Purify lead to desired quality", key: "refining" },
    { title: "Product Manufacturing", description: "Transform lead into products", key: "manufacturing" },
    { title: "Use Phase", description: "Product lifetime and maintenance", key: "usePhase" },
    { title: "End-of-Life Recycling", description: "Recover and reprocess lead scrap", key: "recycling" },
    { title: "Byproduct & Waste Valorization", description: "Create value from by-products", key: "valorization" },
  ], [])

  const [isInitialized, setIsInitialized] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [workflowId, setWorkflowId] = useState(null)
  const [workflowData, setWorkflowData] = useState(null)
  const [projectBrief, setProjectBrief] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Material source state
  const [materialSourceInfo, setMaterialSourceInfo] = useState({ 
    materialSource: 'primary', 
    primaryPercentage: 100, 
    secondaryPercentage: 0 
  })
  
  const handleMaterialSourceChange = useCallback((info) => {
    setMaterialSourceInfo(info);
  }, []);

  // Initialize workflow
  useEffect(() => {
    if (isInitialized) return;
    
    const id = searchParams.get('id')
    if (id) {
      console.log('📂 Loading existing workflow:', id);
      loadWorkflow(id).then(() => setIsInitialized(true));
    } else {
      const savedWorkflowId = localStorage.getItem('currentWizardWorkflowIdLead');
      if (savedWorkflowId) {
        console.log('♻️ Reusing existing workflow:', savedWorkflowId);
        loadWorkflow(savedWorkflowId).then(() => setIsInitialized(true)).catch(() => {
          localStorage.removeItem('currentWizardWorkflowIdLead');
          setIsInitialized(true);
        });
      } else {
        console.log('🆕 New workflow session');
        setIsInitialized(true);
      }
    }
  }, [searchParams, isInitialized])

  const initializeWorkflow = async () => {
    if (loading || workflowId) return;
    
    console.log('🆕 Creating new lead wizard workflow');
    setLoading(true)
    setError(null)
    
    try {
      // Create workflow using wizardService API
      const response = await createWizardWorkflow({
        name: `LCA Wizard - Lead - ${new Date().toLocaleDateString()}`,
        metalType: 'Lead',
        description: `Wizard-based lifecycle assessment for Lead`,
      })

      if (response.success && response.data?.workflow) {
        const newId = response.data.workflow._id
        console.log('✅ Workflow created:', newId);
        setWorkflowId(newId)
        setWorkflowData(response.data.workflow)
        
        localStorage.setItem('currentWizardWorkflowIdLead', newId);
        navigate(`/wizard-lead?id=${newId}`, { replace: true })
        
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
    if (loading || workflowId === id) return;
    
    console.log('📥 Loading workflow:', id);
    setLoading(true)
    setError(null)
    
    try {
      // Load workflow from backend using wizardService API
      const response = await getWizardWorkflow(id)
      
      if (response.success && response.data?.workflow) {
        console.log('✅ Workflow loaded:', response.data.workflow);
        setWorkflowId(id)
        setWorkflowData(response.data.workflow)
        
        localStorage.setItem('currentWizardWorkflowIdLead', id);
        
        if (searchParams.get('id') !== id) {
          navigate(`/wizard-lead?id=${id}`, { replace: true });
        }
      } else {
        throw new Error('Workflow not found')
      }
    } catch (err) {
      console.error('❌ Error loading workflow:', err);
      setError('Failed to load workflow: ' + (err.response?.data?.message || err.message))
      // Clear invalid workflow from localStorage
      localStorage.removeItem('currentWizardWorkflowIdLead');
    } finally {
      setLoading(false)
    }
  }

  const handleWorkflowUpdate = (updatedWorkflow) => {
    console.log('📊 Workflow updated:', updatedWorkflow);
    setWorkflowData(updatedWorkflow);
  }

  const completionPercentage = workflowData?.completionPercentage || 0

  return (
    <div className="relative min-h-screen">
      {/* Error Notification */}
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

      {/* Success Notification */}
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

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Wizard Workflow</h1>
            <p className="text-sm text-gray-600 mt-1">
              Project: <span className="font-semibold text-gray-900">p1</span>
            </p>
            {workflowData && (
              <p className="text-sm text-gray-600">
                Progress: {completionPercentage}% • Status: <span className="font-medium capitalize">{workflowData.status}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Start New Project Button */}
            {!workflowId && (
              <Button
                onClick={initializeWorkflow}
                disabled={loading}
                className="bg-[#BA7967] hover:bg-[#a86b5c] text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {loading ? 'Creating...' : 'Start New Project'}
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
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 lg:pr-96 py-8">
          <WizardFormPb 
            steps={steps} 
            activeStep={activeStep} 
            onStepChange={setActiveStep}
            workflowId={workflowId}
            workflowData={workflowData}
            onWorkflowUpdate={handleWorkflowUpdate}
            onMaterialSourceChange={handleMaterialSourceChange}
            navigate={navigate}
          />
          <ProgressTrackerPb 
            steps={steps} 
            currentStep={activeStep} 
            onStepClick={setActiveStep}
            completedSteps={workflowData?.completedSteps || []}
            completionPercentage={completionPercentage}
            materialSource={materialSourceInfo.materialSource}
          />
        </div>
      )}
    </div>
  )
}