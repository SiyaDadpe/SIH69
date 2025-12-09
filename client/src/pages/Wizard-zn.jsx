import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import WizardFormZn from "@/sections/Wizard/wizardForm-zn"
import ProgressTrackerZn from "@/sections/Wizard/progressTracker-zn"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function WizardZinc() {
  const navigate = useNavigate()
  
  // Define zinc processing steps
  const zincSteps = [
    { title: "Mining", description: "Extract zinc ore from deposits", key: "mining" },
    { title: "Beneficiation", description: "Concentrate and process zinc ore", key: "beneficiation" },
    { title: "Extraction", description: "Extract zinc via RLE or ISF process", key: "extraction" },
    { title: "Manufacturing", description: "Zinc casting and product manufacturing", key: "manufacturing" },
    { title: "Use Phase", description: "Product lifetime and maintenance", key: "usePhase" },
    { title: "Recycling", description: "Recover and reprocess zinc waste", key: "recycling" },
    { title: "Valorization", description: "Create value from by-products and waste", key: "valorization" },
  ]

  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [workflowData, setWorkflowData] = useState({})
  
  // Material source state
  const [materialSource, setMaterialSource] = useState('primary')
  const [primaryPercentage, setPrimaryPercentage] = useState(100)
  const [secondaryPercentage, setSecondaryPercentage] = useState(0)

  // Load workflow data from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('zinc_workflow_data')
    const savedMetadata = localStorage.getItem('zinc_workflow_metadata')
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setWorkflowData(parsedData)
        
        // Calculate completed steps based on saved data
        const completed = Object.keys(parsedData).map((key) => {
          return zincSteps.findIndex(step => step.key === key)
        }).filter(idx => idx !== -1)
        
        setCompletedSteps(completed)
        console.log('📂 Loaded zinc workflow from local storage')
      } catch (error) {
        console.error('Error loading workflow data:', error)
      }
    }
    
    if (savedMetadata) {
      try {
        const metadata = JSON.parse(savedMetadata)
        console.log('📂 Loaded zinc workflow metadata:', metadata)
      } catch (error) {
        console.error('Error loading workflow metadata:', error)
      }
    }
  }, [])

  // Calculate completion percentage
  const completionPercentage = Math.round((completedSteps.length / zincSteps.length) * 100)

  // Handle step change
  const handleStepChange = (stepIndex) => {
    // Allow navigation to any step
    setActiveStep(stepIndex)
  }

  // Handle workflow update (called from form when data is saved)
  const handleWorkflowUpdate = (updatedData) => {
    setWorkflowData(updatedData)
    
    // Mark current step as completed if it has data
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep])
      setSuccess(`✅ Step ${activeStep + 1} completed!`)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  // Handle material source changes
  const handleMaterialSourceChange = (info) => {
    setMaterialSource(info.materialSource)
    setPrimaryPercentage(info.primaryPercentage)
    setSecondaryPercentage(info.secondaryPercentage)
  }

  // Handle reset/new workflow
  const handleReset = () => {
    if (confirm('Are you sure you want to start a new zinc workflow? All current data will be cleared.')) {
      // Clear local storage
      localStorage.removeItem('zinc_workflow_data')
      localStorage.removeItem('zinc_workflow_metadata')
      
      // Reset state
      setActiveStep(0)
      setCompletedSteps([])
      setWorkflowData({})
      setMaterialSource('primary')
      setPrimaryPercentage(100)
      setSecondaryPercentage(0)
      
      setSuccess('🆕 New zinc workflow started!')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  // Auto-navigate to Manufacturing when 100% secondary is selected
  useEffect(() => {
    if (materialSource === 'secondary' && activeStep < 6) {
      // Jump to Manufacturing (step 6, index 6)
      setActiveStep(6)
    }
  }, [materialSource, activeStep])

  return (
    <div className="relative min-h-screen">
      {/* Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg animate-in slide-in-from-top">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xl leading-none">×</button>
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
            <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600 text-xl leading-none">×</button>
          </div>
        </div>
      )}

      {/* Header with Actions */}
      <div className="sticky top-0 z-20 bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚡ Zinc LCA Wizard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Progress: {completionPercentage}% • Completed: {completedSteps.length}/{zincSteps.length} steps
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-[#BA7967] text-[#BA7967] hover:bg-[#BA7967] hover:text-white"
            >
              🔄 New Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 lg:pr-96 space-y-8 pt-8">
        <WizardFormZn 
          steps={zincSteps} 
          activeStep={activeStep} 
          onStepChange={handleStepChange}
          workflowData={workflowData}
          onWorkflowUpdate={handleWorkflowUpdate}
          onMaterialSourceChange={handleMaterialSourceChange}
        />
        
        <ProgressTrackerZn 
          steps={zincSteps} 
          currentStep={activeStep} 
          onStepClick={handleStepChange}
          completedSteps={completedSteps}
          completionPercentage={completionPercentage}
          materialSource={materialSource}
        />
      </div>
    </div>
  )
}
