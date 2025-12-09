import { Checkbox } from "@/components/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Toggle component for switching between Guided Mode and Expert Mode
 * Guided Mode pre-fills forms with smart defaults
 * Expert Mode shows empty forms for full manual control
 */
export function GuidedModeToggle({ enabled, onToggle, className = "" }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
          enabled 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-sm' 
            : 'bg-gray-50 border-gray-300'
        } ${className}`}
      >
        <Checkbox 
          id="guided-mode-toggle" 
          checked={enabled} 
          onCheckedChange={onToggle}
          className="mt-1"
        />
        
        <div className="flex-1 space-y-1">
          <label 
            htmlFor="guided-mode-toggle" 
            className="cursor-pointer flex items-center gap-2 text-base font-semibold"
          >
            <span className={enabled ? "text-blue-700" : "text-gray-700"}>
              {enabled ? "🔍 Guided Mode Active" : "🎯 Expert Mode Active"}
            </span>
          </label>
          
          <p className="text-sm text-gray-600 leading-relaxed">
            {enabled ? (
              <>
                Smart defaults applied based on industry standards. 
                <span className="font-medium text-blue-700"> Review and customize as needed.</span>
              </>
            ) : (
              <>
                All fields are blank. You have full control over every parameter.
                <span className="font-medium text-gray-700"> Switch to Guided Mode for smart defaults.</span>
              </>
            )}
          </p>
        </div>
        
        {enabled && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex-shrink-0"
          >
            <div className="p-2 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
