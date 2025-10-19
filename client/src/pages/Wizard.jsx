import React, { useMemo, useState } from "react"
import WizardForm from "@/sections/Wizard/wizardForm"
import ProgressTracker from "@/sections/Wizard/progressTracker"

export default function Wizard() {
  const steps = useMemo(() => [
    { title: "Mining", description: "Extract raw materials from ore deposits", key: "mining" },
    { title: "Beneficiation", description: "Process and concentrate the ore", key: "beneficiation" },
    { title: "Smelting", description: "Extract metal from concentrated ore", key: "smelting" },
    { title: "Refining", description: "Purify the metal to required standards", key: "refining" },
    { title: "Manufacturing", description: "Transform refined metal into products", key: "manufacturing" },
    { title: "Recycling", description: "Recover and reprocess metal waste", key: "recycling" },
    { title: "Valorization", description: "Create value from by-products and waste", key: "valorization" },
  ], [])

  const [activeStep, setActiveStep] = useState(0)

  return (
    <div>
      <WizardForm steps={steps} activeStep={activeStep} onStepChange={setActiveStep} />
      <ProgressTracker steps={steps} currentStep={activeStep} onStepClick={setActiveStep} />
    </div>
  )
}