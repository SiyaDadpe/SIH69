import React, { useMemo, useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import WizardForm from "@/sections/Wizard/wizardForm"
import ProgressTracker from "@/sections/Wizard/progressTracker"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Download, Loader2, Sparkles } from "lucide-react"
import {
  createWizardWorkflow,
  getWizardWorkflow,
  submitWizardWorkflow,
  generateWizardReport,
} from "@/services/wizardService"
import PlasmaBackground from "@/components/animations/plasma"

export default function Wizard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const steps = useMemo(() => [
    { title: "Mining", description: "Extract raw materials from ore deposits", key: "mining" },
    { title: "Beneficiation", description: "Process and concentrate the ore", key: "beneficiation" },
    { title: "Refining and Smelting", description: "Purify and extract metal from ore", key: "refining" },
    { title: "Manufacturing", description: "Transform refined metal into products", key: "smelting" },
    { title: "Use Phase", description: "Product usage and performance over lifetime", key: "manufacturing" },
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
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedOreType, setSelectedOreType] = useState(null) // null, 'copper', 'aluminum'
  const [showOreSelection, setShowOreSelection] = useState(true)

  // Initialize or load workflow
  useEffect(() => {
    // Skip initialization if we haven't selected ore type yet
    if (!selectedOreType) return;
    
    // Prevent double initialization in React Strict Mode
    if (isInitialized) return;
    
    const id = searchParams.get('id')
    if (id) {
      console.log('📂 Loading existing workflow:', id);
      loadWorkflow(id).then(() => {
        setIsInitialized(true)
      });
    } else {
      // Check if we have a workflow ID in localStorage to reuse
      const savedWorkflowId = localStorage.getItem('currentWizardWorkflowId');
      if (savedWorkflowId) {
        console.log('♻️ Reusing existing workflow from localStorage:', savedWorkflowId);
        // Verify the workflow exists before navigating
        loadWorkflow(savedWorkflowId).then(() => {
          setIsInitialized(true);
        }).catch(() => {
          // If loading fails, clear localStorage and create new workflow
          console.warn('⚠️ Saved workflow invalid, creating new one');
          localStorage.removeItem('currentWizardWorkflowId');
          initializeWorkflow().then(() => {
            setIsInitialized(true);
          });
        });
      } else {
        // Auto-create workflow if no ID present
        console.log('🆕 No existing workflow, creating new one...');
        initializeWorkflow().then(() => {
          setIsInitialized(true);
        });
      }
    }
  }, [searchParams, isInitialized, selectedOreType])

  const handleOreSelection = (oreType) => {
    if (oreType === 'aluminum') {
      setError('Aluminum ore processing is not available at this time. Please select Copper ore to continue.')
      setTimeout(() => setError(null), 4000)
      return
    }
    
    setSelectedOreType(oreType)
    setShowOreSelection(false)
    setSuccess(`${oreType === 'copper' ? 'Copper' : 'Aluminum'} ore selected! Initializing workflow...`)
    setTimeout(() => setSuccess(null), 3000)
  }

  const initializeWorkflow = async () => {
    // Prevent duplicate calls
    if (loading || workflowId) {
      console.log('⏭️ Skipping workflow creation - already in progress or exists');
      return;
    }
    
    console.log('🆕 Creating new wizard workflow...');
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
        console.log('✅ Workflow created:', newId);
        setWorkflowId(newId)
        setWorkflowData(response.data.workflow)
        
        // Save to localStorage to reuse this workflow
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

  // Ore selection screen component
  const OreSelectionScreen = () => (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <PlasmaBackground 
          color="#BA7967"
          speed={0.3}
          opacity={0.15}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-6xl w-full">
          {/* Header */}
          <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
            <div className="inline-flex items-center gap-2 bg-[#BA7967]/10 text-[#BA7967] px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Lifecycle Assessment</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Select Your Ore Type
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the type of ore you want to process through our comprehensive lifecycle assessment wizard
            </p>
          </div>

          {/* Ore Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Copper Ore Card */}
            <div 
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 border-transparent hover:border-[#BA7967] overflow-hidden animate-in fade-in slide-in-from-left delay-100"
              onClick={() => handleOreSelection('copper')}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative p-8">
                {/* Icon */}
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-600 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500 opacity-20" />
                  <div className="relative w-full h-full bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                      <circle cx="12" cy="8" r="1.5" fill="white" opacity="0.8"/>
                      <circle cx="8" cy="12" r="1" fill="white" opacity="0.6"/>
                      <circle cx="16" cy="12" r="1" fill="white" opacity="0.6"/>
                      <circle cx="12" cy="16" r="1.5" fill="white" opacity="0.8"/>
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                  Copper Ore
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Process copper ore through mining, beneficiation, smelting, refining, and manufacturing stages
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Complete lifecycle assessment
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    AI-powered predictions
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Environmental impact analysis
                  </li>
                </ul>

                {/* Button */}
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-6 rounded-xl group-hover:shadow-lg transition-all duration-300">
                  Select Copper Ore
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Aluminum Ore Card */}
            <div 
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 border-transparent hover:border-gray-300 overflow-hidden opacity-75 animate-in fade-in slide-in-from-right delay-200"
              onClick={() => handleOreSelection('aluminum')}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-300/5 to-gray-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative p-8">
                {/* Icon */}
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-500 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500 opacity-20" />
                  <div className="relative w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <circle cx="12" cy="7" r="1.5" fill="white" opacity="0.8"/>
                      <circle cx="7" cy="12" r="1.2" fill="white" opacity="0.7"/>
                      <circle cx="17" cy="12" r="1.2" fill="white" opacity="0.7"/>
                      <circle cx="10" cy="15" r="1" fill="white" opacity="0.6"/>
                      <circle cx="14" cy="15" r="1" fill="white" opacity="0.6"/>
                    </svg>
                  </div>
                </div>

                {/* Coming Soon Badge */}
                <div className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Coming Soon
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                  Aluminum Ore
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Aluminum ore processing and lifecycle assessment - Currently under development
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-400" />
                    Bauxite extraction analysis
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-400" />
                    Bayer process modeling
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-400" />
                    Electrolysis impact assessment
                  </li>
                </ul>

                {/* Button */}
                <Button 
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-6 rounded-xl transition-all duration-300"
                  disabled
                >
                  Not Available Yet
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-12 animate-in fade-in duration-1000 delay-300">
            <p className="text-gray-500 text-sm">
              💡 More ore types will be added in future updates
            </p>
          </div>
        </div>
      </div>
    </div>
  )

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

  return (
    <>
      {/* Show Ore Selection Screen if not selected yet */}
      {showOreSelection && !selectedOreType ? (
        <>
          {/* Notifications for ore selection */}
          {error && (
            <div className="fixed top-4 right-4 z-50 max-w-md bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg animate-in slide-in-from-top">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900">Notice</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
              </div>
            </div>
          )}
          <OreSelectionScreen />
        </>
      ) : (
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
            {/* Start New Workflow button */}
            {!isSubmitted && workflowId && (
              <Button
                onClick={() => {
                  if (confirm('Are you sure you want to start a new workflow? Current progress will be saved but you will create a new workflow.')) {
                    localStorage.removeItem('currentWizardWorkflowId');
                    console.log('🗑️ Cleared workflow ID - will create new one');
                    navigate('/wizard', { replace: true });
                    window.location.reload();
                  }
                }}
                variant="outline"
                className="border-[#BA7967] text-[#BA7967] hover:bg-[#BA7967] hover:text-white"
              >
                Start New Workflow
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
      )}
    </>
  )
}