import React from "react"
import { CheckCircle2 } from "lucide-react"

export default function ProgressTracker({ steps, currentStep = 0, onStepClick }) {
  const defaultSteps = [
    { title: "Mining", description: "Extract raw materials from ore deposits" },
    { title: "Beneficiation", description: "Process and concentrate the ore" },
    { title: "Smelting", description: "Extract metal from concentrated ore" },
    { title: "Refining", description: "Purify the metal to required standards" },
    { title: "Manufacturing", description: "Transform refined metal into products" },
    { title: "Recycling", description: "Recover and reprocess metal waste" },
    { title: "Valorization", description: "Create value from by-products and waste" },
  ]

  const items = steps?.length ? steps : defaultSteps
  const handleClick = (idx) => {
    if (typeof onStepClick === "function") onStepClick(idx)
  }

  return (
    <aside className="hidden md:block fixed inset-y-0 right-0 z-30 w-80 border-l bg-[#F3F2EC] p-6 overflow-y-auto">
      <h3 className="text-lg sm:text-xl font-bold text-[#181814] mb-4">Progress</h3>
      <ol className="relative min-h-full">
        <div className="absolute left-[1.75rem] top-0 bottom-0 w-[2px] bg-gray-200" aria-hidden="true" />
        {items.map((step, idx) => {
          const completed = idx < currentStep
          const active = idx === currentStep
          const upcoming = idx > currentStep

          return (
            <li key={idx} className="relative pl-14 py-5">
              <button
                type="button"
                onClick={() => handleClick(idx)}
                className="group text-left"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={[
                    "absolute left-2 mt-1 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300",
                    completed && "bg-[#6b5b59] text-white border-transparent",
                    active && "bg-[#BA7967] text-white border-transparent ring-8 ring-[#BA7967]/30 shadow-lg animate-float-strong",
                    upcoming && "bg-white text-gray-700 border-gray-300",
                  ].filter(Boolean).join(" ")}
                >
                  {completed ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-semibold">{idx + 1}</span>
                  )}
                </span>
                <div className="transition-all duration-300">
                  <p className={["font-semibold", active ? "text-[#181814]" : completed ? "text-[#6b5b59]" : "text-gray-800", "text-base sm:text-lg"].join(" ")}>{step.title}</p>
                  <p className="text-sm sm:text-base text-gray-700">{step.description}</p>
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
