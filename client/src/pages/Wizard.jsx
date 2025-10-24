import React, { useMemo, useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import WizardForm from "@/sections/Wizard/wizardForm"
import ProgressTracker from "@/sections/Wizard/progressTracker"
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
  
  const steps = useMemo(() => [
    { title: "Mining", description: "Extract raw materials from ore deposits", key: "mining" },
    { title: "Beneficiation", description: "Process and concentrate the ore", key: "beneficiation" },
    { title: "Refining", description: "Purify the metal to required standards", key: "refining" },
    { title: "Smelting", description: "Extract metal from concentrated ore", key: "smelting" },
    { title: "Manufacturing", description: "Transform refined metal into products", key: "manufacturing" },
    { title: "Recycling", description: "Recover and reprocess metal waste", key: "recycling" },
    { title: "Valorization", description: "Create value from by-products and waste", key: "valorization" },
  ], [])

  const [activeStep, setActiveStep] = useState(0)
  const [workflowId, setWorkflowId] = useState(null)
  const [workflowData, setWorkflowData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [generatingReport, setGeneratingReport] = useState(false)

  // Initialize or load workflow
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      loadWorkflow(id)
    } else {
      // Auto-create workflow if no ID present
      initializeWorkflow()
    }
  }, [searchParams])

  const initializeWorkflow = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get userId from localStorage or auth context
      const userId = localStorage.getItem('userId') || '68f5f9e48a8acc3f27b21ad0'
      
      const response = await createWizardWorkflow({
        name: `LCA Wizard - ${new Date().toLocaleDateString()}`,
        metalType: 'Aluminium',
        userId: userId,
        description: 'Wizard-based lifecycle assessment',
      })

      if (response.success && response.data?.workflow) {
        const newId = response.data.workflow._id
        setWorkflowId(newId)
        setWorkflowData(response.data.workflow)
        
        // Update URL with workflow ID
        navigate(`/wizard?id=${newId}`, { replace: true })
        
        setSuccess('Workflow created successfully!')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Failed to create workflow: ' + (err.response?.data?.message || err.message))
      console.error('Error initializing workflow:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadWorkflow = async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getWizardWorkflow(id)
      
      if (response.success && response.data?.workflow) {
        setWorkflowId(id)
        setWorkflowData(response.data.workflow)
        
        // Set active step based on workflow progress
        const completedCount = response.data.workflow.completedSteps?.length || 0
        setActiveStep(Math.min(completedCount, steps.length - 1))
      }
    } catch (err) {
      setError('Failed to load workflow: ' + (err.response?.data?.message || err.message))
      console.error('Error loading workflow:', err)
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

  // Handle workflow submission from Step 7
  const handleWorkflowSubmitted = (data) => {
    setWorkflowData(data.workflow)
    setSuccess('🎉 Workflow submitted successfully! Redirecting to dashboard...')
    
    // Navigate to dashboard after 2 seconds
    setTimeout(() => {
      navigate('/dashboard')
    }, 2000)
  }

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
          </div>
          
          <div className="flex items-center gap-3">
            {/* Submit Workflow button removed - now auto-submits on Step 7 completion */}
            
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
            onWorkflowUpdate={setWorkflowData}
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