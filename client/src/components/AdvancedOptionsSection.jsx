import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Collapsible section for advanced/optional form fields
 * Helps reduce visual clutter by hiding non-essential fields initially
 */
export function AdvancedOptionsSection({ 
  title, 
  children, 
  defaultExpanded = false,
  icon = "🔧",
  description = null,
  className = ""
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden shadow-sm ${className}`}>
      <Button
        type="button"
        variant="ghost"
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-lg">{icon}</span>
          <div>
            <span className="font-semibold text-gray-800">{title}</span>
            {description && !isExpanded && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-gray-500" />
        </motion.div>
      </Button>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-6 bg-white border-t border-gray-200">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
