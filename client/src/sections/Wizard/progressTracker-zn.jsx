import React from "react"
import { CheckCircle2 } from "lucide-react"

export default function ProgressTrackerZn({ steps, currentStep = 0, onStepClick, completedSteps = [], completionPercentage = 0, materialSource = 'primary' }) {
  const defaultSteps = [
    { title: "Mining", description: "Extract zinc ore from deposits" },
    { title: "Beneficiation", description: "Concentrate and process zinc ore" },
    { title: "Extraction", description: "Extract zinc via RLE or ISF process" },
    { title: "Manufacturing", description: "Zinc casting and product manufacturing" },
    { title: "Use Phase", description: "Product lifetime and maintenance" },
    { title: "Recycling", description: "Recover and reprocess zinc waste" },
    { title: "Valorization", description: "Create value from by-products and waste" },
  ]

  const items = steps?.length ? steps : defaultSteps
  
  // Check if step should be disabled (first 6 steps when 100% secondary)
  const isStepDisabled = (idx) => {
    return materialSource === 'secondary' && idx < 6;
  };
  
  const handleClick = (idx) => {
    if (isStepDisabled(idx)) return; // Don't allow clicking disabled steps
    if (typeof onStepClick === "function") onStepClick(idx)
  }
  
  const isStepCompleted = (idx) => completedSteps.includes(idx)

  return (
    <aside className="hidden md:block fixed inset-y-0 right-0 z-30 w-80 border-l bg-[#F3F2EC] p-6 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-[#181814]">Progress</h3>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#BA7967] transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
      
      <ol className="relative min-h-full">
        <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true" />
        {items.map((step, idx) => {
          const completed = isStepCompleted(idx)
          const active = idx === currentStep
          const upcoming = !completed && idx > currentStep
          const disabled = isStepDisabled(idx)

          return (
            <li key={idx} className="relative pl-14 py-5">
              <button
                type="button"
                onClick={() => handleClick(idx)}
                disabled={disabled}
                className={`group text-left w-full ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={[
                    "absolute left-2 mt-1 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300",
                    disabled && "bg-gray-300 text-gray-500 border-gray-400",
                    !disabled && completed && "bg-[#6b5b59] text-white border-transparent",
                    !disabled && active && "bg-[#BA7967] text-white border-transparent ring-8 ring-[#BA7967]/30 shadow-lg animate-float-strong",
                    !disabled && upcoming && "bg-white text-gray-700 border-gray-300",
                  ].filter(Boolean).join(" ")}
                >
                  {disabled ? (
                    <span className="text-lg">🚫</span>
                  ) : completed ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-semibold">{idx + 1}</span>
                  )}
                </span>
                <div className="transition-all duration-300">
                  <p className={["font-semibold", disabled ? "text-gray-500" : active ? "text-[#181814]" : completed ? "text-[#6b5b59]" : "text-gray-800", "text-base sm:text-lg"].join(" ")}>{step.title}</p>
                  <p className={`text-sm sm:text-base ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{step.description}</p>
                  {disabled && <p className="text-xs text-gray-500 mt-1">⊘ Not applicable (100% Secondary)</p>}
                  {!disabled && completed && <p className="text-xs text-green-600 mt-1">✓ Completed</p>}
                </div>
              </button>
            </li>
          )
        })}
      </ol>

      <style>{`
        @keyframes floatStrong { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float-strong { animation: floatStrong 1.6s ease-in-out infinite; }
      `}</style>
    </aside>
  )
}
