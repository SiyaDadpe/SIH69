import React, { useMemo, useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import miningData from "@/data/mining.json";
import beneficiationData from "@/data/beneficiation.json";
import {
  updateMiningStep,
  updateBeneficiationStep,
  updateRefiningStep,
  updateSmeltingStep,
  updateManufacturingStep,
  updateRecyclingStep,
  updateValorizationStep,
  completeStep,
  saveAndCompleteStep,
  submitWizardWorkflow
} from "@/services/wizardService";
import {
  generateStepPrediction,
  validateRequiredFields,
  getPredictionInfo,
  fetchWorkflowPredictions,
  pollForPredictions
} from "@/services/aiPredictionService";
import { calculateLCA } from "@/services/lcaService";
// Removed other data imports to avoid pre-filling from dataset
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import LCASuccessModal from "@/components/LCASuccessModal";
import LCAPromptModal from "@/components/LCAPromptModal";
import SustainableSolutionsModal from "@/components/SustainableSolutionsModal";
import { GuidedModeToggle } from "@/components/GuidedModeToggle";
import { AdvancedOptionsSection } from "@/components/AdvancedOptionsSection";
import { GUIDED_MODE_DEFAULTS } from "@/constants/guidedModeDefaults";

// Inline metal composition calculation utilities
const getDefaultPrimaryComposition = (grade) => {
  const compositions = {
    'P1020': { Al: 99.7, Cu: 0.05, Mg: 0.05, Si: 0.1, Others: 0.1 },
    'P1050': { Al: 99.5, Cu: 0.05, Mg: 0.05, Si: 0.25, Others: 0.15 },
    'P1060': { Al: 99.6, Cu: 0.05, Mg: 0.03, Si: 0.25, Others: 0.07 },
  };
  return compositions[grade] || compositions['P1020'];
};

const computeManufacturingOutput = (productMass, scrapRatePercent) => {
  const scrapRate = Math.max(0, Math.min(100, scrapRatePercent)) / 100;
  const internalScrapMass = productMass * scrapRate;
  return { productMass, internalScrapMass };
};

const computeMeltComposition = (streams) => {
  let totalMass = 0;
  const totalComp = { Al: 0, Cu: 0, Mg: 0, Si: 0, Others: 0 };
  
  streams.forEach(stream => {
    totalMass += stream.mass;
    Object.keys(totalComp).forEach(element => {
      totalComp[element] += stream.mass * (stream.composition[element] || 0) / 100;
    });
  });
  
  const composition = {};
  if (totalMass > 0) {
    Object.keys(totalComp).forEach(element => {
      composition[element] = (totalComp[element] / totalMass) * 100;
    });
  } else {
    Object.keys(totalComp).forEach(element => {
      composition[element] = 0;
    });
  }
  
  return { totalMass, composition };
};

const computeMakeupAdditions = (target, currentMelt) => {
  const targetComp = target.composition;
  const currentComp = currentMelt.composition;
  const mass = currentMelt.totalMass;
  const tolerance = target.tolerance || {};
  
  const additionsArray = [];
  const elements = ['Al', 'Cu', 'Mg', 'Si', 'Others'];
  
  if (mass === 0) return additionsArray;
  
  elements.forEach(element => {
    const targetPct = targetComp[element] || 0;
    const currentPct = currentComp[element] || 0;
    const allowedTolerance = tolerance[element] || 0;
    
    // Calculate deficit: if current is less than target (accounting for tolerance)
    const deficit = targetPct - currentPct - allowedTolerance;
    
    if (deficit > 0.01) { // Only show if deficit is significant (> 0.01%)
      const requiredMass = (mass * deficit) / 100;
      additionsArray.push({
        element,
        deficit: deficit.toFixed(2),
        requiredMass,
        targetPct,
        currentPct
      });
    }
  });
  
  return additionsArray;
};

const computeRecyclingResult = (scrapStream, yieldPercent, slagPercent) => {
  const yieldFraction = Math.max(0, Math.min(100, yieldPercent)) / 100;
  const slagFraction = Math.max(0, Math.min(100, slagPercent)) / 100;
  
  const recoveredMass = scrapStream.mass * yieldFraction;
  const slagMass = scrapStream.mass * slagFraction;
  const lostMass = scrapStream.mass - recoveredMass - slagMass;
  
  return {
    recoveredMass,
    slagMass,
    lostMass,
    composition: scrapStream.composition
  };
};

const computeValorizationResult = (slagMass, valorizationRatePercent) => {
  const rate = Math.max(0, Math.min(100, valorizationRatePercent)) / 100;
  return {
    slagMass,
    valorizedMass: slagMass * rate,
    wastedMass: slagMass * (1 - rate)
  };
};

// Add CSS for AI-populated fields
const aiFieldStyles = `
  .ai-populated-field {
    background-color: #e0f2fe !important;
    border-color: #0ea5e9 !important;
    transition: background-color 0.3s ease;
  }
  .ai-populated-field:focus {
    background-color: #f0f9ff !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'ai-field-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = aiFieldStyles;
    document.head.appendChild(style);
  }
}

// Typography scale (edit these to tweak sizes globally)
const HEADING_TEXT = "text-[22px] sm:text-[24px] md:text-[26px]"; // Step titles
const GROUP_HEADING_TEXT = "text-[16px] sm:text-[18px]"; // Section/group labels
const OPTION_TEXT = "text-[13px] sm:text-[14px]"; // Card options and radio labels

const stepVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -18, scale: 0.98 },
};

const cardHoverTransition = {
  scale: 1.01,
  boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
};
// Reusable card-style checkbox option for multi-select lists
function CardCheckbox({ id, label, checked, onChange }) {
  const labelId = `${id}-label`
  return (
    <div
      role="checkbox"
      aria-checked={!!checked}
      aria-labelledby={labelId}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onChange(!checked)
        }
      }}
      className={[
        "group cursor-pointer rounded-xl border p-3 shadow-sm transition-all duration-200 ease-out focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#BA7967] focus-visible:ring-offset-2",
        checked
          ? "bg-linear-to-br from-[#6B5B59] to-[#3f3634] text-white border-transparent shadow-md -translate-y-0.5"
          : "bg-white text-gray-900 border-gray-200 hover:border-[#BA7967]/60 hover:bg-[#f8f4f0]",
      ].join(" ")}
      id={id}
    >
      <div className="flex items-start gap-3">
        {/* Keep a hidden checkbox element for assistive tech; not used for state */}
        <input type="checkbox" className="sr-only" aria-hidden="true" tabIndex={-1} checked={!!checked} readOnly />
        <div id={labelId} className={`font-medium leading-snug ${OPTION_TEXT}`}>{label}</div>
      </div>
    </div>
  )
}

// Reusable card-style radio option for single-select lists
function CardRadio({ id, label, selected, onSelect }) {
  const labelId = `${id}-label`
  return (
    <div
      role="radio"
      aria-checked={!!selected}
      aria-labelledby={labelId}
      tabIndex={0}
      onClick={() => onSelect()}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={[
        "group cursor-pointer rounded-xl border p-3 shadow-sm transition-all duration-200 ease-out focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#BA7967] focus-visible:ring-offset-2",
        selected
          ? "bg-linear-to-br from-[#6B5B59] to-[#3f3634] text-white border-transparent shadow-md -translate-y-0.5"
          : "bg-white text-gray-900 border-gray-200 hover:border-[#BA7967]/60 hover:bg-[#f8f4f0]",
      ].join(" ")}
      id={id}
    >
      <div className="flex items-start gap-3">
        {/* Hidden native radio for AT context; state managed by RHF */}
        <input type="radio" className="sr-only" aria-hidden="true" tabIndex={-1} checked={!!selected} readOnly />
        <div id={labelId} className={`font-medium leading-snug ${OPTION_TEXT}`}>{label}</div>
      </div>
    </div>
  )
}

function StepSection({
  stepNumber,
  badgeLabel,
  title,
  description,
  children,
  onPredict,
  predicting,
  pollingProgress = { current: 0, max: 15 },
  footer,
}) {
  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative"
    >
      <Card className="w-full rounded-3xl border border-[#e7dfd2] bg-linear-to-br from-[#fbfaf7] via-[#f4f2ec] to-[#efe6dd] shadow-xl">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{
          background: "radial-gradient(circle at 20% 20%, rgba(186,121,103,0.15), transparent 45%)",
        }} />
        <CardHeader className="relative border-b border-[#e3d4c8] pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#6B5B59] shadow-sm">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#BA7967] animate-pulse" />
                {`Step ${stepNumber} • ${badgeLabel}`}
              </div>
              <CardTitle className={`${HEADING_TEXT} mt-3 text-gray-900`}>{title}</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">{description}</CardDescription>
            </div>
            {onPredict && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="button"
                  className="bg-[#BA7967] text-white shadow-sm transition-all duration-200 hover:bg-[#a86b5c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={onPredict}
                  disabled={predicting}
                >
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                    🤖
                  </span>
                  {predicting 
                    ? `Polling... (${pollingProgress.current}/${pollingProgress.max})` 
                    : "Generate AI Predictions"}
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent className="relative z-10">{children}</CardContent>
        {footer && (
          <CardFooter className="relative z-10 flex flex-col gap-4 border-t border-[#e3d4c8] pt-6">
            {footer}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}

function StepFooterActions({ onBack, onForward, forwardDisabled, forwardLabel = 'Next', showLca = true, onLcaCalculate, isCalculatingLca = false, showSustainableButton = false, onShowSustainable }) {
  const handleForwardClick = () => {
    if (typeof onForward === 'function') {
      onForward()
    }
  }

  const handleLcaClick = () => {
    if (typeof onLcaCalculate === 'function') {
      onLcaCalculate()
    }
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
      {onBack && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="relative overflow-hidden rounded-full border-gray-300 px-6 py-2 text-[#6B5B59] transition-colors duration-200 hover:border-[#6B5B59]"
        >
          <span className="mr-2">←</span>
          Previous
        </Button>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {showSustainableButton && (
          <motion.div whileHover={{ scale: 1.03 }}>
            <Button
              type="button"
              onClick={() => {
                if (typeof onShowSustainable === 'function') {
                  onShowSustainable();
                }
              }}
              className="relative overflow-hidden rounded-full border border-[#6B5B59] px-6 py-2 text-[#6B5B59] shadow-md transition-all duration-200 hover:bg-[#6B5B59] hover:text-white"
              variant="outline"
            >
              🌱 Sustainable solutions
            </Button>
          </motion.div>
        )}
        {showLca && (
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.04 }}
          >
            <Button
              type="button"
              onClick={handleLcaClick}
              disabled={isCalculatingLca || !onLcaCalculate}
              className="relative overflow-hidden bg-linear-to-r from-[#ef5350] to-[#ff8a65] text-white shadow-md transition-all duration-200 hover:from-[#e53935] hover:to-[#ff7043] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-200 hover:opacity-100" />
              <span className="relative flex items-center gap-2">
                {isCalculatingLca && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isCalculatingLca ? 'Calculating...' : 'Calculate LCA Score'}
              </span>
            </Button>
          </motion.div>
        )}
        <motion.div whileHover={{ scale: 1.03 }}>
          <Button
            type="button"
            onClick={handleForwardClick}
            disabled={forwardDisabled}
            className="relative overflow-hidden rounded-full bg-[#BA7967] px-6 py-2 text-white shadow-md transition-all duration-200 hover:bg-[#a86b5c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {forwardLabel}
            {forwardLabel && <span className="ml-2">→</span>}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}


// Data for form fields
const miningProcesses = [
  { id: "openPit", label: "Open Pit Mining" },
  { id: "strip", label: "Strip Mining" },
  { id: "drilling", label: "Drilling & Blasting" },
  { id: "hydraulic", label: "Hydraulic Mining" },
  { id: "manual", label: "Manual Extraction" },
  { id: "electricShovel", label: "Electric Shovel / Excavator" },
  { id: "dieselHaul", label: "Diesel-powered Haul Trucks" },
  { id: "inSitu", label: "In-situ Leaching (experimental)" },
  { id: "others", label: "Others" },
];

/**
 * Utility function to process AI prediction data from backend
 * Handles both formats:
 * 1. New prediction generation: data.combinedData with data.predictionMetadata
 * 2. Fetched predictions: stepData.aiPredictions with nested prediction objects
 */
const processAIPredictions = (predictionsData, stepName) => {
  const newPredictions = {};
  
  if (!predictionsData?.data) {
    return newPredictions;
  }
  
  // Case 1: New prediction generation response
  if (predictionsData.data.combinedData && predictionsData.data.predictionMetadata) {
    const stepData = predictionsData.data.combinedData;
    const metadata = predictionsData.data.predictionMetadata;
    
    if (metadata.predictedFields && Array.isArray(metadata.predictedFields)) {
      metadata.predictedFields.forEach(field => {
        if (stepData[field] !== undefined) {
          newPredictions[field] = {
            value: stepData[field],
            confidence: metadata.confidence || null
          };
        }
      });
    }
  }
  // Case 2: Fetched predictions with aiPredictions nested structure
  else if (predictionsData.data[stepName]?.aiPredictions) {
    const aiPreds = predictionsData.data[stepName].aiPredictions;
    
    Object.keys(aiPreds).forEach(fieldName => {
      const predData = aiPreds[fieldName];
      if (predData && predData.prediction !== undefined) {
        newPredictions[fieldName] = {
          value: predData.prediction,
          confidence: predData.confidence,
          interval: predData.interval,
          rmse: predData.rmse,
          mae: predData.mae
        };
      }
    });
  }
  
  console.log(`🤖 [${stepName}] Processed predictions:`, newPredictions);
  return newPredictions;
};

const locations = [...new Set(miningData.map((d) => d.location))];
const equipmentTypes = ["Diesel", "Electric", "Hybrid"];
const biodiversityImpacts = [
  { id: "low", label: "Low – Minimal disruption, already cleared land" },
  { id: "moderate", label: "Moderate – Some clearing required, limited wildlife impact" },
  { id: "high", label: "High – Large-scale forest clearing, high ecological loss" },
];

// Helper to handle empty string inputs for required number fields
const requiredNumber = (min = 0, max, message = 'Required') => {
  // Handle case where max is actually a message string
  let actualMax = max;
  let actualMessage = message;
  
  if (typeof max === 'string') {
    actualMessage = max;
    actualMax = undefined;
  }
  
  // Build the number schema with min/max constraints before wrapping in preprocess
  let numberSchema = z.coerce.number().min(min, { message: actualMessage });
  
  if (actualMax !== undefined && typeof actualMax === 'number') {
    numberSchema = numberSchema.max(actualMax, { message: `Must be between ${min}-${actualMax}` });
  }
  
  // Wrap the complete schema in preprocess
  return z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : val,
    numberSchema
  );
};

const formSchema = z.object({
  applicableProcesses: z.array(z.string()).min(1, {
    message: "You have to select at least one process.",
  }).optional().or(z.array(z.string()).default([])),
  others: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear()).nullable().optional(),
  oreGrade: requiredNumber(0, 100).nullable().optional(),
  overburdenRatio: z.coerce.number().nullable().optional(),
  typeOfEquipment: z.enum(equipmentTypes.map(t => t.toLowerCase())).nullable().optional(),
  fuelConsumption: z.coerce.number().nullable().optional(),
  waterSource: z.string().nullable().optional(),
  waterUsage: z.coerce.number().nullable().optional(),
  blastingFrequency: z.string().nullable().optional(),
  explosivesUsed: z.coerce.number().nullable().optional(),
  biodiversityImpact: z.string().nullable().optional(),
  landReclamation: z.string().nullable().optional(),
  dustControl: z.string().nullable().optional(),
  noiseLevel: z.coerce.number().nullable().optional(),
  redMudGeneration: z.coerce.number().nullable().optional(),
  transport: z.object({
    distance: z.coerce.number().nullable().optional(),
    mode: z.string().nullable().optional(),
    vehicleType: z.string().nullable().optional(),
  }).nullable().optional(),
  // AI Predicted fields
  mining_energy_MJ_per_t_ore: z.coerce.number().nullable().optional(),
  mining_co2_kg_per_t_ore: z.coerce.number().nullable().optional(),
  mining_sox_kg_per_t_ore: z.coerce.number().nullable().optional(),
  mining_nox_kg_per_t_ore: z.coerce.number().nullable().optional(),
  mining_pm_kg_per_t_ore: z.coerce.number().nullable().optional(),
  // Sustainability Parameters
  followingSustainableRules: z.boolean().nullable().optional(),
  sustainabilityParameters: z.object({
    equipment_type_electric_or_hybrid: z.boolean().nullable().optional(),
    water_source_recycled_or_surface: z.boolean().nullable().optional(),
    water_usage_capped: z.coerce.number().nullable().optional(),
    rehabilitation_plan_in_place: z.boolean().nullable().optional(),
    overburden_restored_percent: z.coerce.number().nullable().optional(),
   
    biodiversity_offset_area_ha: z.coerce.number().nullable().optional(),
    water_recycling_rate: z.coerce.number().nullable().optional(),
    rehabilitation_progress_percent: z.coerce.number().nullable().optional(),
    community_development_investment: z.coerce.number().nullable().optional(),
    carbon_offset_tonnes: z.coerce.number().nullable().optional(),
  }).nullable().optional(),
});

function MiningProcessDetails({ onNext, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), predictionMetadata = {}, onCalculateLCA, isCalculatingLca, setShowSustainableSolutions, setCurrentSustainableStage, setFormDataForSustainable }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Guided Mode state
  const [guidedMode, setGuidedMode] = useState(() => {
    // Enable guided mode by default for new forms (no initialValues)
    return !initialValues || Object.keys(initialValues).length === 0
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      applicableProcesses: [],
      sustainabilityParameters: {},
    },
    mode: "onTouched",
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    trigger,
    formState: { isValid, errors },
  } = form;
  
  // Apply smart defaults when guided mode is enabled
  useEffect(() => {
    if (guidedMode && (!initialValues || Object.keys(initialValues).length === 0)) {
      console.log('🔍 [Mining] Applying Guided Mode defaults');
      const defaults = GUIDED_MODE_DEFAULTS.mining;
      
      // Apply defaults recursively (handles nested objects like transport and sustainabilityParameters)
      const applyDefaults = (obj, path = '') => {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const fieldPath = path ? `${path}.${key}` : key;
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively apply nested defaults
            applyDefaults(value, fieldPath);
          } else {
            // Apply the default value
            setValue(fieldPath, value, { shouldValidate: false, shouldDirty: false });
          }
        });
      };
      
      applyDefaults(defaults);
    }
  }, [guidedMode, setValue, initialValues]);

  // Sync form with updated initialValues (e.g., when AI predictions are received)
  useEffect(() => {
    if (initialValues) {
      console.log('🔄 [Mining Form] Syncing with updated initial values:', initialValues);
      
      // Update each field individually using setValue to properly trigger re-renders
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      
      console.log('✅ [Mining Form] Form synced with AI predictions');
    }
  }, [JSON.stringify(initialValues), setValue]);



  const onSubmit = async (data) => {
    console.log('='.repeat(80));
    console.log('🎯 [Mining Form] FORM SUBMISSION STARTED');
    console.log('='.repeat(80));
    console.log('📋 Form Data:', JSON.stringify(data, null, 2));
    console.log('📊 Data Keys:', Object.keys(data));
    console.log('📏 Number of fields:', Object.keys(data).length);
    console.log('✅ Form is valid:', isValid);
    console.log('❌ Form errors:', Object.keys(errors));

    // Don't validate - let form validation handle it
    // Just save whatever data we have

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      console.log('💾 [Mining Form] Calling onSave function...');
      console.log('💾 [Mining Form] onSave exists?', typeof onSave);

      if (!onSave) {
        console.error('❌ [Mining Form] onSave function is not provided!');
        setSaveError('Save function not available');
        setIsSaving(false);
        return;
      }

      // Call onSave and WAIT for it to complete
      console.log('💾 [Mining Form] Executing onSave with data...');
      await onSave(data);
      console.log('✅ [Mining Form] onSave completed successfully');

      setSaveSuccess(true);

      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('➡️  [Mining Form] Calling onNext to move to next step...');
      if (onNext) {
        onNext();
        console.log('✅ [Mining Form] onNext called');
      } else {
        console.error('❌ [Mining Form] onNext function is not provided!');
      }

      console.log('='.repeat(80));
      console.log('✅ [Mining Form] FORM SUBMISSION COMPLETED');
      console.log('='.repeat(80));
    } catch (error) {
      console.error('='.repeat(80));
      console.error('❌ [Mining Form] FORM SUBMISSION FAILED');
      console.error('='.repeat(80));
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      setSaveError(error.message || 'Failed to save data');
      setIsSaving(false);
    } finally {
      // Don't reset isSaving here if we're moving to next step
      if (!saveSuccess) {
        setIsSaving(false);
      }
    }
  };

  const applicableProcesses = watch("applicableProcesses");

  // Handle guided mode toggle
  const handleGuidedModeToggle = (enabled) => {
    setGuidedMode(enabled);
    
    if (enabled) {
      const currentValues = form.getValues();
      const defaults = GUIDED_MODE_DEFAULTS.mining;
      
      // Smart apply: Only fill empty/undefined fields, never overwrite user data
      const applyDefaultsSelectively = (defaultObj, currentObj, path = '') => {
        Object.keys(defaultObj).forEach(key => {
          const defaultValue = defaultObj[key];
          const currentValue = currentObj?.[key];
          const fieldPath = path ? `${path}.${key}` : key;
          
          if (defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
            // Handle nested objects (like transport, sustainabilityParameters)
            applyDefaultsSelectively(defaultValue, currentValue || {}, fieldPath);
          } else {
            // Only apply default if current value is empty/undefined/null
            const isEmpty = currentValue === undefined || 
                           currentValue === null || 
                           currentValue === '' ||
                           (Array.isArray(currentValue) && currentValue.length === 0);
            
            if (isEmpty) {
              setValue(fieldPath, defaultValue, { shouldValidate: false, shouldDirty: true });
            }
          }
        });
      };
      
      applyDefaultsSelectively(defaults, currentValues);
      console.log('✅ [Mining] Guided Mode defaults applied selectively (preserving user data)');
    }
  };

  // Modified AI prediction handler
  const handleGenerateAIPrediction = async (formData) => {
    if (onGenerateAIPrediction) {
      await onGenerateAIPrediction(formData);
    }
  };

  const footerContent = (
    <>
      {saveSuccess && (
        <div className="w-full rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm flex items-center gap-2">
          <span className="text-lg">✅</span>
          <span>Data saved successfully!</span>
        </div>
      )}
      {saveError && (
        <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span>{saveError}</span>
        </div>
      )}
      {!isValid && Object.keys(errors).length > 0 && (
        <div className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          ℹ️ Please fill required fields: {Object.keys(errors).join(', ')}
        </div>
      )}
      <StepFooterActions
        onForward={handleSubmit(onSubmit)}
        forwardDisabled={!isValid || isSaving}
        forwardLabel={isSaving ? '💾 Saving...' : 'Next'}
        onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
        isCalculatingLca={isCalculatingLca}
        showSustainableButton
        onShowSustainable={() => {
          setCurrentSustainableStage?.('mining');
          setFormDataForSustainable?.(form.getValues());
          setShowSustainableSolutions?.(true);
        }}
      />
    </>
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={1}
        badgeLabel="Mining"
        title="Mining Process Details"
        description="Enter the details of the mining process. Fields marked with * are required."
        onPredict={() => handleGenerateAIPrediction(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
        footer={footerContent}
      >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Guided Mode Toggle */}
            <GuidedModeToggle 
              enabled={guidedMode} 
              onToggle={handleGuidedModeToggle}
            />
            
            {/* REQUIRED FIELDS - Always visible */}
            <div className="space-y-8">
              <FormField
                control={control}
                name="applicableProcesses"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className={GROUP_HEADING_TEXT}>
                        Select Applicable Processes*
                      </FormLabel>
                      <FormDescription>
                        Select all the processes that apply.
                      </FormDescription>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {miningProcesses.map(item => (
                        <FormField key={item.id} control={control} name="applicableProcesses" render={({ field }) => (
                          <CardCheckbox
                            id={`mining-proc-${item.id}`}
                            label={item.label}
                            checked={field.value?.includes(item.id)}
                            onChange={(checked) => {
                              const next = new Set(field.value || [])
                              if (checked) next.add(item.id); else next.delete(item.id)
                              field.onChange(Array.from(next))
                            }}
                          />
                        )} />
                      ))}
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {applicableProcesses?.includes("others") && (
                <FormField
                  control={control}
                  name="others"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Other Process</FormLabel>
                      <FormControl>
                        <Input placeholder="Please specify" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Location*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="oreGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Ore Grade (%)*</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Slider
                            value={[typeof field.value === 'number' ? field.value : 0]}
                            onValueChange={(v) => field.onChange(v[0])}
                            min={0}
                            max={100}
                            step={1}
                          />
                          <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <hr className="my-8 border-gray-200" />

            {/* ADVANCED OPTIONS - Collapsible section with ALL other fields */}
            <AdvancedOptionsSection 
              title="Advanced Options" 
              defaultOpen={!guidedMode}
            >
              <div className="space-y-8">
                {/* Year of Operation */}
                <FormField
                  control={control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Year of Operation</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2023" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="overburdenRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`flex items-center ${GROUP_HEADING_TEXT}`}>
                        Overburden Ratio
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-2 cursor-help text-muted-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Volume of waste removed per volume of ore</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="typeOfEquipment"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className={GROUP_HEADING_TEXT}>Type of Equipment</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {equipmentTypes.map((type) => (
                            <CardRadio
                              key={type}
                              id={`equip-${type}`}
                              label={type}
                              selected={field.value === type.toLowerCase()}
                              onSelect={() =>
                                field.onChange(
                                  field.value === type.toLowerCase()
                                    ? undefined
                                    : type.toLowerCase()
                                )
                              }
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={control}
                    name="fuelConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Fuel Consumption (liters or kWh per tonne)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 7" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="waterSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Water Source</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select water source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Surface water">Surface water</SelectItem>
                            <SelectItem value="Groundwater">Groundwater</SelectItem>
                            <SelectItem value="Recycled water">Recycled water</SelectItem>
                            <SelectItem value="Mixed sources">Mixed sources</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={control}
                    name="waterUsage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Water Usage (m³ per tonne of ore)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 0.5" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="redMudGeneration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={`flex items-center ${GROUP_HEADING_TEXT}`}>
                          Red Mud Generation (kg per tonne of ore)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-2 cursor-help text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Depends on ore composition and extraction
                                  process
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={control}
                    name="blastingFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Blasting Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Daily">Daily</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                            <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="explosivesUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Explosives Used (kg per blast)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="e.g., 50" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="landReclamation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Land Reclamation</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="Planned">Planned</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="dustControl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Dust Control Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Water spraying">Water spraying</SelectItem>
                            <SelectItem value="Dust suppressants">Dust suppressants</SelectItem>
                            <SelectItem value="Enclosures">Enclosures</SelectItem>
                            <SelectItem value="None">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="noiseLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Noise Level (dB)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="e.g., 70" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <hr className="my-4 border-gray-200" />

                {/* Transport Section */}
                <h4 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold`}>Transport Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FormField
                    control={control}
                    name="transport.distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Distance to Processing (km)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="e.g., 20" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="transport.mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Transport Mode</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Road">Road</SelectItem>
                            <SelectItem value="Rail">Rail</SelectItem>
                            <SelectItem value="Conveyor">Conveyor</SelectItem>
                            <SelectItem value="Pipeline">Pipeline</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="transport.vehicleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Vehicle Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Diesel trucks">Diesel trucks</SelectItem>
                            <SelectItem value="Electric vehicles">Electric vehicles</SelectItem>
                            <SelectItem value="Rail cars">Rail cars</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <hr className="my-4 border-gray-200" />

                <FormField
                  control={control}
                  name="biodiversityImpact"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className={GROUP_HEADING_TEXT}>Land Use / Biodiversity Impact</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {biodiversityImpacts.map((impact) => (
                            <CardRadio
                              key={impact.id}
                              id={`bio-${impact.id}`}
                              label={impact.label}
                              selected={field.value === impact.id}
                              onSelect={() =>
                                field.onChange(
                                  field.value === impact.id ? undefined : impact.id
                                )
                              }
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <hr className="my-4 border-gray-200" />

                {/* Sustainability Checkbox */}
                <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                  <FormField
                    control={control}
                    name="followingSustainableRules"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            Sustainability Focused
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Enable to include sustainability parameters in your mining process
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sustainability Parameters */}
                {watch("followingSustainableRules") === true && (
                  <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                    <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                      Sustainability Parameters
                    </h3>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.equipment_type_electric_or_hybrid"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Equipment Type: Electric or Hybrid</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.water_source_recycled_or_surface"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Water Source: Recycled or Surface</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.water_usage_capped"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Water Usage Capped (m³/t ore, max 0.25)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" max="0.25" placeholder="≤0.25" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.rehabilitation_plan_in_place"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Rehabilitation Plan in Place</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.overburden_restored_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Overburden Restored (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="60-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                     
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.biodiversity_offset_area_ha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biodiversity Offset Area (hectares)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="Hectares" min="0" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.water_recycling_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Water Recycling Rate (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.rehabilitation_progress_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rehabilitation Progress (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.community_development_investment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Community Development Investment ($)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="e.g., 50000" min="0" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.carbon_offset_tonnes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carbon Offset (tonnes)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="e.g., 5" min="0" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                <hr className="my-8 border-gray-200" />

                {/* AI Predicted Values Section */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">AI Predicted Values</h3>
                  {predictionMetadata?.confidence && (
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {(predictionMetadata.confidence * 100).toFixed(1)}% confidence
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={control}
                    name="mining_energy_MJ_per_t_ore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Energy (MJ per tonne)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="AI predicted" 
                            className={aiPopulatedFields.has('mining_energy_MJ_per_t_ore') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="mining_co2_kg_per_t_ore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>CO₂ (kg per tonne)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="AI predicted" 
                            className={aiPopulatedFields.has('mining_co2_kg_per_t_ore') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="mining_sox_kg_per_t_ore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>SOx (kg per tonne)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="AI predicted" 
                            className={aiPopulatedFields.has('mining_sox_kg_per_t_ore') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="mining_nox_kg_per_t_ore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>NOx (kg per tonne)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="AI predicted" 
                            className={aiPopulatedFields.has('mining_nox_kg_per_t_ore') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="mining_pm_kg_per_t_ore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Particulate Matter (PM)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="AI predicted" 
                            className={aiPopulatedFields.has('mining_pm_kg_per_t_ore') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </AdvancedOptionsSection>
          </form>
      </StepSection>
    </FormProvider>
  );
}


// Step 2: Beneficiation
function BeneficiationDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), predictionMetadata = {}, onCalculateLCA, isCalculatingLca, setShowSustainableSolutions, setCurrentSustainableStage, setFormDataForSustainable }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Guided Mode state
  const [guidedMode, setGuidedMode] = useState(() => {
    return !initialValues || Object.keys(initialValues).length === 0
  });
  const benLocations = [...new Set((Array.isArray(beneficiationData) ? beneficiationData : []).map((d) => d.location))]
    .filter(Boolean)

  const processes = [
    { id: "crushing", label: "Crushing" },
    { id: "washing_screening", label: "Washing & Screening" },
    { id: "gravity_separation", label: "Gravity Separation" },
    { id: "dry_separation", label: "Dry Separation" },
    { id: "grinding", label: "Grinding" },
    { id: "magnetic_separation", label: "Magnetic Separation" },
    { id: "flotation", label: "Flotation Methods" },
    { id: "others", label: "Others" },
  ]

  const crushingOptions = [
    { id: "primary", label: "Primary Crushing" },
    { id: "secondary", label: "Secondary Crushing" },
    { id: "tertiary", label: "Tertiary Crushing" },
  ]

  const tailingsOptions = [
    { id: "tailing_ponds", label: "Stored in tailing ponds" },
    { id: "pipeline_transport", label: "Pipeline transport to disposal site" },
    { id: "thickened_sludge", label: "Thickened/sludge management" },
    { id: "others", label: "Others" },
  ]

  const levelOptions = [
    { id: "Low", label: "Low" },
    { id: "Moderate", label: "Moderate" },
    { id: "High", label: "High" },
  ]

  // Helper to handle empty string inputs for required number fields
  const requiredNumber = (min = 0, max, message = 'Required') => {
    // Handle case where max is actually a message string
    let actualMax = max;
    let actualMessage = message;
    
    if (typeof max === 'string') {
      actualMessage = max;
      actualMax = undefined;
    }
    
    // Build the number schema with min/max constraints before wrapping in preprocess
    let numberSchema = z.coerce.number().min(min, { message: actualMessage });
    
    if (actualMax !== undefined && typeof actualMax === 'number') {
      numberSchema = numberSchema.max(actualMax, { message: `Must be between ${min}-${actualMax}` });
    }
    
    // Wrap the complete schema in preprocess
    return z.preprocess(
      (val) => (val === '' || val === null || val === undefined) ? undefined : val,
      numberSchema
    );
  };

  const schema = z.object({
    processes: z.array(z.string()).min(1, {
      message: "You have to select at least one process.",
    }).optional().or(z.array(z.string()).default([])),
    processOthers: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    oreFeedRate: requiredNumber(0, undefined, "Must be >= 0").nullable().optional(),
    waterConsumption: z.coerce.number().min(0).nullable().optional(),
    electricityUse: z.coerce.number().min(0).nullable().optional(),
    beneficiationEfficiency: requiredNumber(0, 100).nullable().optional(),
    crushingStage: z.string().nullable().optional(),
    chemicalAgents: z.array(z.string()).default([]),
    chemicalOthers: z.string().nullable().optional(),
    tailings: z.string().nullable().optional(),
    tailingsOthers: z.string().nullable().optional(),
    noiseLevel: z.string().nullable().optional(),
    dustLevel: z.string().nullable().optional(),
    // AI Predicted fields
    beneficiation_water_m3_per_t_ore: z.coerce.number().nullable().optional(),
    beneficiation_electricity_kWh_per_t_ore: z.coerce.number().nullable().optional(),
    beneficiation_tailings_management: z.string().nullable().optional(),
    beneficiation_noise_pollution: z.string().nullable().optional(),
    beneficiation_dust_pollution: z.string().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      water_recycled_percent: z.coerce.number().nullable().optional(),
      tailings_storage_type_thickened_or_dry: z.boolean().nullable().optional(),
      bio_based_flocculant_used: z.boolean().nullable().optional(),
      renewable_energy_percent: z.coerce.number().nullable().optional(),
      chemical_recovery_rate: z.coerce.number().nullable().optional(),
      emission_control_efficiency: z.coerce.number().nullable().optional(),
    }).nullable().optional(),
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      processes: [],
      crushingStage: '',
      sustainabilityParameters: {},
    },
    mode: "onTouched",
  })

  const { control, handleSubmit, watch, reset, setValue, trigger, formState: { isValid, errors } } = form
  
  // Apply smart defaults when guided mode is enabled (on initial render only)
  useEffect(() => {
    if (guidedMode && (!initialValues || Object.keys(initialValues).length === 0)) {
      console.log('🔍 [Beneficiation] Applying Guided Mode defaults');
      const beneficiationDefaults = GUIDED_MODE_DEFAULTS.beneficiation || {};
      
      // Only apply defaults if there are any defined
      if (Object.keys(beneficiationDefaults).length > 0) {
        reset(beneficiationDefaults);
      }
    }
  }, [guidedMode, initialValues, reset]);
  
  // Sync form with updated initialValues (e.g., when AI predictions are received)
  useEffect(() => {
    if (initialValues) {
      console.log('🔄 [Beneficiation Form] Syncing with updated initial values:', initialValues);
      
      // Update each field individually using setValue to properly trigger re-renders
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      
      console.log('✅ [Beneficiation Form] Form synced with AI predictions');
    }
  }, [JSON.stringify(initialValues), setValue]);

  const selectedProcesses = watch("processes")
  const selectedTailings = watch("tailings")
  const selectedChemicals = watch("chemicalAgents")
  
  // Handle guided mode toggle with smart defaults (preserves user data)
  const handleGuidedModeToggle = (enabled) => {
    setGuidedMode(enabled);
    if (enabled) {
      // Get current form values
      const currentValues = form.getValues();
      
      // Prepare updated values - only fill empty fields
      const updatedValues = { ...currentValues };
      
      // Note: Defaults will be provided by user later
      // This smart logic is ready to apply defaults when they are added to GUIDED_MODE_DEFAULTS.beneficiation
      const beneficiationDefaults = GUIDED_MODE_DEFAULTS.beneficiation || {};
      
      // Helper function to apply defaults recursively (handles nested objects)
      const applyDefaultsRecursively = (defaults, current, target) => {
        Object.keys(defaults).forEach((key) => {
          const defaultValue = defaults[key];
          const currentValue = current[key];
          
          // If default is an object and not an array, recurse
          if (defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
            if (!target[key] || typeof target[key] !== 'object') {
              target[key] = {};
            }
            applyDefaultsRecursively(defaultValue, currentValue || {}, target[key]);
          } else {
            // Only apply default if current value is empty/null/undefined
            if (currentValue === null || currentValue === undefined || currentValue === '' || 
                (Array.isArray(currentValue) && currentValue.length === 0)) {
              target[key] = defaultValue;
            }
          }
        });
      };
      
      applyDefaultsRecursively(beneficiationDefaults, currentValues, updatedValues);
      
      // Apply updated values
      reset(updatedValues);
    }
  };

  // Modified AI prediction handler - just call parent's handler
  const handleGenerateAIPrediction = async (formData) => {
    if (onGenerateAIPrediction) {
      await onGenerateAIPrediction(formData);
    }
  };

  const onSubmit = async (data) => {
    console.log('='.repeat(80));
    console.log('🎯 [Beneficiation Form] FORM SUBMISSION STARTED');
    console.log('='.repeat(80));
    console.log('📋 [Beneficiation Form] Form data:', data);
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      await onSave?.(data);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('✅ [Beneficiation Form] Form saved successfully');
      onNext?.();
    } catch (error) {
      console.error('❌ [Beneficiation Form] Save error:', error);
      setSaveError(error.message || 'Failed to save form data');
    } finally {
      setIsSaving(false);
    }
  };

  const footerContent = (
    <>
      {saveSuccess && (
        <div className="w-full rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm flex items-center gap-2">
          <span className="text-lg">✅</span>
          <span>Data saved successfully!</span>
        </div>
      )}
      {saveError && (
        <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span>{saveError}</span>
        </div>
      )}
      {!isValid && Object.keys(errors).length > 0 && (
        <div className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          ℹ️ Please fill required fields: {Object.keys(errors).join(', ')}
        </div>
      )}
      <StepFooterActions
        onBack={onBack}
        onForward={handleSubmit(onSubmit)}
        forwardDisabled={!isValid || isSaving}
        forwardLabel={isSaving ? '💾 Saving...' : 'Next'}
        onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
        isCalculatingLca={isCalculatingLca}
        showSustainableButton
        onShowSustainable={() => {
          setCurrentSustainableStage?.('beneficiation');
          setFormDataForSustainable?.(form.getValues());
          setShowSustainableSolutions?.(true);
        }}
      />
    </>
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={2}
        badgeLabel="Beneficiation"
        title="Beneficiation"
        description="Provide beneficiation process details. Fields marked with * are required."
        onPredict={() => handleGenerateAIPrediction(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
        footer={footerContent}
      >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Guided Mode Toggle */}
            <GuidedModeToggle 
              enabled={guidedMode} 
              onToggle={handleGuidedModeToggle}
            />
            
            {/* ========================================
                REQUIRED FIELDS SECTION (Always Visible)
                ======================================== */}
            
            {/* 1. Select Applicable Processes */}
            <FormField
              control={control}
              name="processes"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className={GROUP_HEADING_TEXT}>
                      Select Applicable Process*
                    </FormLabel>
                    <FormDescription>Choose one process.</FormDescription>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {processes.map((p) => (
                      <FormField key={p.id} control={control} name="processes" render={({ field }) => (
                        <CardCheckbox
                          id={`beneficiation-proc-${p.id}`}
                          label={p.label}
                          checked={field.value?.includes(p.id)}
                          onChange={(checked) => {
                            const next = new Set(field.value || [])
                            if (checked) next.add(p.id); else next.delete(p.id)
                            field.onChange(Array.from(next))
                          }}
                        />
                      )} />
                    ))}
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedProcesses?.includes("others") && (
              <FormField
                control={control}
                name="processOthers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Other Process</FormLabel>
                    <FormControl>
                      <Input placeholder="Specify other beneficiation processes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <hr className="my-4 border-gray-200" />

            {/* 2. Required Operation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Location*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {benLocations.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="oreFeedRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Feed Rate (t/h)*</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="e.g., 200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <hr className="my-4 border-gray-200" />

            {/* 3. Beneficiation Efficiency */}
            <FormField
              control={control}
              name="beneficiationEfficiency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Beneficiation Efficiency (%)*</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[typeof field.value === 'number' ? field.value : 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ========================================
                ADVANCED OPTIONS SECTION (Collapsible)
                ======================================== */}
            
            <AdvancedOptionsSection 
              title="Advanced Options" 
              defaultOpen={!guidedMode}
            >
              <div className="space-y-8">
                
                {/* Crushing Stage */}
                <FormField
                  control={control}
                  name="crushingStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Crushing Stage</FormLabel>
                      <FormDescription>Select the crushing stage.</FormDescription>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {crushingOptions.map((c) => (
                          <CardRadio
                            key={c.id}
                            id={`ben-crush-${c.id}`}
                            label={c.label}
                            selected={field.value === c.id}
                            onSelect={() => field.onChange(c.id)}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <hr className="my-4 border-gray-200" />

                {/* Water and Electricity Consumption */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={control}
                    name="waterConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Water Consumption (m³ per tonne of ore)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.1" placeholder="e.g., 1.2" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="electricityUse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Electricity Use (kWh per tonne of ore)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.1" placeholder="e.g., 18.5" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <hr className="my-4 border-gray-200" />
                {/* 4. Chemical Agents */}
                <FormField
                  control={control}
                  name="chemicalAgents"
                  render={() => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Chemical Agents</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {[
                          { id: "flocculants", label: "Flocculants" },
                          { id: "dispersants", label: "Dispersants" },
                          { id: "coagulants", label: "Coagulants" },
                          { id: "none", label: "None / Natural separation" },
                          { id: "others", label: "Others" },
                        ].map((chem) => (
                          <FormField key={chem.id} control={control} name="chemicalAgents" render={({ field }) => (
                            <CardCheckbox
                              id={`chem-${chem.id}`}
                              label={chem.label}
                              checked={field.value?.includes(chem.id)}
                              onChange={(checked) => {
                                const next = new Set(field.value || [])
                                if (checked) next.add(chem.id); else next.delete(chem.id)
                                field.onChange(Array.from(next))
                              }}
                            />
                          )} />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedChemicals?.includes("others") && (
                  <FormField
                    control={control}
                    name="chemicalOthers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Other Chemical Agents</FormLabel>
                        <FormControl>
                          <Input placeholder="Specify other chemical agents used" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <hr className="my-4 border-gray-200" />

                {/* 5. Waste and Pollution Management */}
                <FormField
                  control={control}
                  name="tailings"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className={GROUP_HEADING_TEXT}>Waste Tailings & Slurry Management</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {tailingsOptions.map((opt) => (
                            <CardRadio
                              key={opt.id}
                              id={`tail-${opt.id}`}
                              label={opt.label}
                              selected={field.value === opt.id}
                              onSelect={() => field.onChange(field.value === opt.id ? undefined : opt.id)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedTailings === "others" && (
                  <FormField
                    control={control}
                    name="tailingsOthers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Other Tailings Management</FormLabel>
                        <FormControl>
                          <Input placeholder="Specify other tailings management methods" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={control}
                    name="noiseLevel"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className={GROUP_HEADING_TEXT}>Noise Pollution Level</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-3 gap-3">
                            {levelOptions.map((opt) => (
                              <CardRadio
                                key={opt.id}
                                id={`noise-${opt.id}`}
                                label={opt.label}
                                selected={field.value === opt.id}
                                onSelect={() => field.onChange(field.value === opt.id ? undefined : opt.id)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="dustLevel"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className={GROUP_HEADING_TEXT}>Dust Pollution Level</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-3 gap-3">
                            {levelOptions.map((opt) => (
                              <CardRadio
                                key={opt.id}
                                id={`dust-${opt.id}`}
                                label={opt.label}
                                selected={field.value === opt.id}
                                onSelect={() => field.onChange(field.value === opt.id ? undefined : opt.id)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <hr className="my-4 border-gray-200" />

                {/* Sustainability Section */}
                <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                  <FormField
                    control={control}
                    name="followingSustainableRules"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            Sustainability Focused
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Enable to include sustainability parameters in your beneficiation process
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sustainability Parameters */}
                {watch("followingSustainableRules") === true && (
                  <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6 mt-4">
                    <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                      Sustainability Parameters
                    </h3>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.water_recycled_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Water Recycled (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.tailings_storage_type_thickened_or_dry"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Tailings Storage Type: Thickened or Dry</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.bio_based_flocculant_used"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Bio-Based Flocculant Used</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.reagent_dosage_optimized"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Reagent Dosage Optimized</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.concentrate_grade_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Concentrate Grade (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.renewable_energy_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renewable Energy (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                <hr className="my-4 border-gray-200" />

                {/* AI Predicted Values */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">AI Predicted Values</h3>
                    {predictionMetadata?.confidence && (
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {(predictionMetadata.confidence * 100).toFixed(1)}% confidence
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={control}
                      name="beneficiation_water_m3_per_t_ore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={GROUP_HEADING_TEXT}>Water Usage (m³ per tonne)</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly placeholder="AI predicted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="beneficiation_electricity_kWh_per_t_ore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={GROUP_HEADING_TEXT}>Electricity Usage (kWh per tonne)</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly placeholder="AI predicted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="beneficiation_tailings_management"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={GROUP_HEADING_TEXT}>Tailings Management</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly placeholder="AI predicted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="beneficiation_noise_pollution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={GROUP_HEADING_TEXT}>Noise Pollution Level</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly placeholder="AI predicted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="beneficiation_dust_pollution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={GROUP_HEADING_TEXT}>Dust Pollution Level</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly placeholder="AI predicted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

              </div>
            </AdvancedOptionsSection>
          </form>
      </StepSection>
    </FormProvider>
  )
}


// Main Wizard Form Component
export default function WizardForm({ steps, activeStep, onStepChange, workflowId, workflowData, onWorkflowUpdate, onWorkflowSubmitted, onOpenWorkflow, onMaterialSourceChange }) {
  const [formValues, setFormValues] = useState({})
  const [completed, setCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [pollingProgress, setPollingProgress] = useState({ current: 0, max: 15 }) // Track polling attempts
  const [predictionError, setPredictionError] = useState(null)
  const [predictionSuccess, setPredictionSuccess] = useState(null)
  
  // LCA Success Modal state
  const [showLCAModal, setShowLCAModal] = useState(false)
  const [lcaReportData, setLcaReportData] = useState(null)
  const [isCalculatingLca, setIsCalculatingLca] = useState(false)
  
  // LCA Prompt Modal state (new simple modal)
  const [showLCAPromptModal, setShowLCAPromptModal] = useState(false)
  const [lcaPromptReportId, setLcaPromptReportId] = useState(null)
  
  // AI Prediction state management
  const [aiPredictions, setAiPredictions] = useState({})  // Stores all predictions by step
  const [predictionMetadata, setPredictionMetadata] = useState({})  // Stores metadata for each step
  const [aiPopulatedFields, setAiPopulatedFields] = useState({})  // Tracks which fields were populated by AI (for styling)
  
  // Sustainable Solutions Modal state
  const [showSustainableSolutions, setShowSustainableSolutions] = useState(false)
  const [currentSustainableStage, setCurrentSustainableStage] = useState(null)
  const [formDataForSustainable, setFormDataForSustainable] = useState(null)
  
  // Material Source Selection state
  const [materialSource, setMaterialSource] = useState('primary') // 'primary', 'secondary', or 'mixed'
  const [primaryPercentage, setPrimaryPercentage] = useState(100)
  const [secondaryPercentage, setSecondaryPercentage] = useState(0)
  const [primaryGrade, setPrimaryGrade] = useState('P1020')
  const [customPrimaryGrade, setCustomPrimaryGrade] = useState('')
  const [hasLoopedToManufacturing, setHasLoopedToManufacturing] = useState(false)
  
  // Notify parent of material source changes (only when it actually changes)
  useEffect(() => {
    const primaryGradeLabel = materialSource === 'secondary'
      ? null
      : (primaryGrade === 'Other' ? (customPrimaryGrade?.trim() || 'Other') : primaryGrade);

    if (onMaterialSourceChange) {
      onMaterialSourceChange({
        materialSource,
        primaryPercentage,
        secondaryPercentage,
        primaryGrade,
        primaryGradeLabel,
        customPrimaryGrade,
      });
    }
    }, [materialSource, primaryPercentage, secondaryPercentage, primaryGrade, customPrimaryGrade]); // Removed onMaterialSourceChange from deps

    // Reset the recycling→manufacturing loop flag when source mix changes
    useEffect(() => {
      setHasLoopedToManufacturing(false);
    }, [materialSource, primaryPercentage, secondaryPercentage]);

  // Auto-navigate to Manufacturing when 100% secondary is selected
  useEffect(() => {
    if (materialSource === 'secondary' && activeStep < 4) {
      // Jump to Manufacturing (step 4, index 4)
      onStepChange(4);
    }
  }, [materialSource, activeStep]); // Removed onStepChange from deps

  // Debug: Track formValues changes
  React.useEffect(() => {
    console.log('📊 [Wizard] formValues changed:', formValues);
  }, [formValues]);

  // Load existing workflow data and AI predictions
  React.useEffect(() => {
    if (workflowData && workflowId) {
      const values = {}
      steps.forEach(step => {
        if (workflowData[step.key]) {
          values[step.key] = workflowData[step.key]
        }
      })
      setFormValues(values)
      
      // Fetch AI predictions from WizardWorkflowOutput
      fetchWorkflowPredictions(workflowId).then(response => {
        if (response.success && response.data?.hasPredictions) {
          console.log('🤖 [Wizard] Loaded workflow data:', response.data.predictions);
          console.log('📊 [Wizard] Prediction metadata:', response.data.predictionMetadata);
          
          // Extract aiPredictions from each step
          const extractedPredictions = {};
          const extractedMetadata = response.data.predictionMetadata || {}; // Use step-level metadata from backend
          
          Object.keys(response.data.predictions).forEach(stepName => {
            const stepData = response.data.predictions[stepName];
            if (stepData && stepData.aiPredictions) {
              extractedPredictions[stepName] = {};
              
              // Extract each prediction value
              Object.keys(stepData.aiPredictions).forEach(fieldName => {
                const predData = stepData.aiPredictions[fieldName];
                if (predData && predData.prediction !== undefined) {
                  extractedPredictions[stepName][fieldName] = predData.prediction;
                }
              });
            }
          });
          
          console.log('✅ [Wizard] Extracted predictions:', extractedPredictions);
          console.log('📈 [Wizard] Extracted metadata:', extractedMetadata);
          
          setAiPredictions(extractedPredictions);
          setPredictionMetadata(extractedMetadata);
          
          // Auto-populate predictions into formValues and track for blue tint
          const updatedFormValues = { ...values };
          const aiFieldsByStep = {};
          
          Object.keys(extractedPredictions).forEach(stepName => {
            const stepPredictions = extractedPredictions[stepName];
            if (Object.keys(stepPredictions).length > 0) {
              // Merge predictions into form values
              updatedFormValues[stepName] = {
                ...updatedFormValues[stepName],
                ...stepPredictions
              };
              
              // Track which fields were populated by AI
              aiFieldsByStep[stepName] = new Set(Object.keys(stepPredictions));
              
              console.log(`✅ [Wizard] Auto-populated ${Object.keys(stepPredictions).length} predictions for ${stepName}`);
            }
          });
          
          setFormValues(updatedFormValues);
          setAiPopulatedFields(aiFieldsByStep);
        }
      }).catch(error => {
        console.error('❌ [Wizard] Error loading predictions:', error);
      });
    }
  }, [workflowData, workflowId])

  const handleValueChange = (stepKey, field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [field]: value,
      },
    }))
  }
  

  
  const handleNext = () => {
    // Validate current step before moving to next
    const stepData = formValues[stepKey] || {};
    const mappedData = mapFormDataToBackendFields(stepKey, stepData);
    const validation = validateRequiredFields(stepKey, mappedData);
    
    if (!validation.valid) {
      // Show validation error
      alert(`Please fill in the required fields for ${currentStep.label}:\n\n- ${validation.missingFields.join('\n- ')}`);
      return;
    }

    // Mixed route: when leaving Recycling, loop back to Manufacturing once to set alloy target/makeup
    if (stepKey === 'recycling' && materialSource === 'mixed' && !hasLoopedToManufacturing) {
      const manufacturingIndex = steps.findIndex((s) => s.key === 'manufacturing');
      if (manufacturingIndex >= 0) {
        setHasLoopedToManufacturing(true);
        onStepChange(manufacturingIndex);
        return;
      }
    }

    // Move to next step if validation passes
    if (activeStep < steps.length - 1) {
      onStepChange(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      onStepChange(activeStep - 1)
    }
  }

  const currentStep = steps[activeStep]
  const stepKey = currentStep.key
  const stepValues = formValues[stepKey] || {}

  // Helper function to save step data to backend
  const handleSaveStep = async (stepName, data) => {
    console.log('💾 [handleSaveStep] Called for step:', stepName);
    console.log('💾 [handleSaveStep] Workflow ID:', workflowId);
    console.log('💾 [handleSaveStep] Data received:', data);
    console.log('💾 [handleSaveStep] Data keys:', Object.keys(data));
    console.log('💾 [handleSaveStep] Data size:', Object.keys(data).length);

    if (!workflowId) {
      console.error('❌ [handleSaveStep] No workflow ID available');
      return;
    }
    
    // Data already includes AI predictions (auto-populated), just save directly
    console.log('💾 [handleSaveStep] Saving data:', data);

    setSaving(true);
    try {
      // Map step names to API functions
      const stepFunctions = {
        mining: updateMiningStep,
        beneficiation: updateBeneficiationStep,
        refining: updateRefiningStep,
        smelting: updateSmeltingStep,
        manufacturing: updateManufacturingStep,
        recycling: updateRecyclingStep,
        valorization: updateValorizationStep,
      };

      const updateFn = stepFunctions[stepName];
      console.log('💾 [handleSaveStep] Update function found:', !!updateFn);

      if (updateFn) {
        // Save the step data (already includes AI predictions)
        console.log('💾 [handleSaveStep] Calling API function...');
        const response = await updateFn(workflowId, data);
        console.log('💾 [handleSaveStep] API Response:', response);

        if (response.success && response.data?.workflow) {
          onWorkflowUpdate?.(response.data.workflow);
          console.log('✅ [handleSaveStep] Workflow updated successfully');

          // Mark step as complete
          try {
            console.log('💾 [handleSaveStep] Marking step as complete...');
            const completeResponse = await completeStep(workflowId, stepName);
            if (completeResponse.success && completeResponse.data?.workflow) {
              onWorkflowUpdate?.(completeResponse.data.workflow);
              console.log(`✅ Step "${stepName}" completed successfully`);
            }
          } catch (completeError) {
            console.error(`❌ Error marking ${stepName} as complete:`, completeError);
          }
        }
      } else {
        console.error('❌ [handleSaveStep] No update function found for step:', stepName);
      }

      // Save to local state
      setFormValues((p) => ({ ...p, [stepName]: data }));
      console.log('💾 [handleSaveStep] Saved to local state');
    } catch (error) {
      console.error(`❌ Error saving ${stepName} step:`, error);
      throw error;
    } finally {
      setSaving(false);
      console.log('💾 [handleSaveStep] Completed (saving flag reset)');
    }
  }

  // Validate current and previous steps' required fields
  const validateCurrentAndPreviousSteps = (updatedFormValues = null) => {
    const stepsToValidate = steps.slice(0, activeStep + 1); // Current step + all previous
    const allMissingFields = [];
    
    // Use updated values if provided, otherwise use current state
    const valuesToValidate = updatedFormValues || formValues;
    
    for (const step of stepsToValidate) {
      const stepName = step.key;
      const stepData = valuesToValidate[stepName] || {};
      
      // Map frontend field names to backend field names for validation
      const mappedData = mapFormDataToBackendFields(stepName, stepData);
      
      // Validate using the existing validation function
      const validation = validateRequiredFields(stepName, mappedData);
      
      if (!validation.valid) {
        allMissingFields.push({
          stepName: step.label || stepName,
          missingFields: validation.missingFields
        });
      }
    }
    
    return {
      valid: allMissingFields.length === 0,
      missingByStep: allMissingFields
    };
  };

  // Handle LCA Calculation
  const handleCalculateLCA = async (currentStepData = null) => {
    if (!workflowId) {
      alert('No workflow found. Please save your progress first.');
      return;
    }

    console.log('📊 [LCA] Starting LCA calculation process...');
    console.log('📊 [LCA] Current step:', stepKey);
    console.log('📊 [LCA] Current step data provided:', !!currentStepData);

    // Create updated form values with current step data
    let updatedFormValues = { ...formValues };
    
    // Step 1: Integrate current step data if provided (without saving again to avoid rate limit)
    // The step data should already be saved by the step's auto-save functionality
    if (currentStepData) {
      console.log('📊 [LCA] Integrating current step data for validation...');
      
      // Update the form values object immediately for validation
      updatedFormValues = {
        ...formValues,
        [stepKey]: currentStepData
      };
      
      // Update formValues state
      setFormValues(updatedFormValues);
    }

    // Step 2: Validate current and previous steps using the updated values
    console.log('🔍 [LCA] Validating current and previous steps...');
    const validation = validateCurrentAndPreviousSteps(updatedFormValues);
    
    if (!validation.valid) {
      // Show detailed validation error
      let errorMsg = 'Please fill in the required fields before calculating LCA:\n\n';
      validation.missingByStep.forEach(({ stepName, missingFields }) => {
        errorMsg += `${stepName}:\n  - ${missingFields.join('\n  - ')}\n\n`;
      });
      alert(errorMsg);
      return;
    }
    
    console.log('✅ [LCA] Validation passed!');

    // Step 3: Actually calculate and save LCA data
    setIsCalculatingLca(true);
    
    try {
      console.log('📊 [LCA] Starting LCA calculation...');
      console.log('📊 [LCA] Workflow ID:', workflowId);
      console.log('📊 [LCA] Current form values:', updatedFormValues);
      
      // Map all wizard data to backend field names
      const mappedWizardData = {};
      Object.keys(updatedFormValues).forEach(stepName => {
        const stepData = updatedFormValues[stepName];
        if (stepData && Object.keys(stepData).length > 0) {
          mappedWizardData[stepName] = mapFormDataToBackendFields(stepName, stepData);
        }
      });
      
      console.log('📊 [LCA] Mapped wizard data:', mappedWizardData);
      
      // Prepare LCA data with current wizard state
      // Use workflowData.name (the actual project name from wizard workflow)
      const lcaData = {
        workflowId: workflowId,
        projectName: workflowData?.name || workflowData?.projectName || `LCA Report ${new Date().toLocaleDateString()}`,
        location: workflowData?.location || mappedWizardData?.mining?.location || 'Not specified',
        currentStage: stepKey, // Send current step so backend only validates up to this step
        wizardData: mappedWizardData // Send mapped data
      };
      
      console.log('📊 [LCA] Sending data with currentStage:', stepKey);
      console.log('📊 [LCA] Full data:', lcaData);
      const lcaResponse = await calculateLCA(lcaData);
      console.log('📊 [LCA] Response received:', lcaResponse);
      
      if (lcaResponse.success) {
        console.log('✅ [LCA] Calculation successful!', lcaResponse.data);
        
        // Show the simple prompt modal with the reportId
        setLcaPromptReportId(lcaResponse.data.reportId || workflowId);
        setShowLCAPromptModal(true);
      } else {
        console.error('❌ [LCA] Response was not successful:', lcaResponse);
        alert(lcaResponse.message || 'LCA calculation failed');
      }
    } catch (error) {
      console.error('❌ [LCA] Calculation failed:', error);
      alert(error.message || 'Failed to calculate LCA. Please try again.');
    } finally {
      setIsCalculatingLca(false);
    }
  };

  // Map frontend field names to backend field names
  const mapFormDataToBackendFields = (stepName, formData) => {
    const mappings = {
      mining: {
        applicableProcesses: 'mining_method',
        oreGrade: 'mining_ore_grade_percent',
        location: 'location' // Keep as-is
      },
      beneficiation: {
        processes: 'beneficiation_process_Crushing', // Backend expects this specific field
        oreFeedRate: 'ore_feed_rate',
        location: 'location'
      },
      refining: {
        energyUse: 'energy_use',
        waterUse: 'water_use',
        redMudGen: 'red_mud_generation'
      },
      smelting: {
        electricityDemand: 'electricity_demand',
        co2Emissions: 'co2_emissions',
        cellTechnology: 'cell_technology'
      },
      manufacturing: {
        processes: 'manufacturing_process_Casting', // Backend expects this specific field
        transportDistance: 'transport_distance',
        scrapRate: 'scrap_rate'
      },
      recycling: {
        scrapInputPercent: 'scrap_input_percentage',
        collectionRatePercent: 'collection_rate',
        recyclingMethod: 'recycling_methods'
      },
      valorization: {
        wasteTypes: 'waste_types',
        valorizationMethods: 'valorization_methods',
        wasteUtilizationOverallPercent: 'waste_utilization_percentages',
        ironExtractionEconomicViability: 'ironExtractionEconomicViability'
      }
    };

    const stepMappings = mappings[stepName] || {};
    const mappedData = { ...formData };

    // Apply field name mappings
    Object.entries(stepMappings).forEach(([frontendField, backendField]) => {
      if (formData[frontendField] !== undefined) {
        let value = formData[frontendField];

        // Handle special conversions
        if (frontendField === 'applicableProcesses' && Array.isArray(value)) {
          // Convert array to first element or joined string
          value = value.length > 0 ? value[0] : '';
        } else if (frontendField === 'processes' && Array.isArray(value)) {
          // For beneficiation/manufacturing, check if specific process is included
          if (stepName === 'beneficiation') {
            value = value.includes('crushing') ? 1 : 0;
          } else if (stepName === 'manufacturing') {
            value = value.includes('casting') ? 1 : 0;
          }
        } else if (Array.isArray(value)) {
          // Keep arrays as-is for other fields
          value = value.length > 0 ? value : [];
        }

        mappedData[backendField] = value;

        // Remove the old field name if different
        if (frontendField !== backendField) {
          delete mappedData[frontendField];
        }
      }
    });

    return mappedData;
  };

  // Handle AI Prediction with polling for WizardWorkflowOutput
  const handleGenerateAIPrediction = async (stepName, currentFormData) => {
    console.log('🤖 [AI Prediction] Button clicked for step:', stepName);
    console.log('🤖 [AI Prediction] Current form data (frontend):', currentFormData);

    if (!workflowId) {
      setPredictionError('No workflow ID available. Please create a workflow first.');
      return;
    }

    // Clear previous messages
    setPredictionError(null);
    setPredictionSuccess(null);

    // Map frontend field names to backend field names
    const mappedData = mapFormDataToBackendFields(stepName, currentFormData);
    console.log('🔄 [AI Prediction] Mapped data (backend format):', mappedData);

    // Validate required fields with mapped data
    const validation = validateRequiredFields(stepName, mappedData);
    if (!validation.valid) {
      setPredictionError(validation.error);
      console.error('❌ [AI Prediction] Validation failed:', validation.error);
      setTimeout(() => setPredictionError(null), 5000);
      return;
    }

    setPredicting(true);

    try {
      // Step 1: Trigger backend to save user data
      console.log('🚀 [AI Prediction] Saving user data and triggering ML model...');
      const triggerResponse = await generateStepPrediction(workflowId, stepName, mappedData);
      
      if (triggerResponse.status === 'processing') {
        console.log('⏳ [AI Prediction] User data saved. ML model processing in background. Starting to poll...');
        
        // Reset and set polling progress
        setPollingProgress({ current: 0, max: 15 });
        
        // Step 2: Poll WizardWorkflowOutput every 2 seconds (max 15 attempts = 30 seconds)
        const pollResponse = await pollForPredictions(
          workflowId,
          15,  // maxAttempts
          2000,  // interval (2 seconds)
          (attempt, maxAttempts) => {
            console.log(`🔄 [Polling] Attempt ${attempt}/${maxAttempts} - Checking WizardWorkflowOutput...`);
            setPollingProgress({ current: attempt, max: maxAttempts });
          }
        );
        
        // Reset polling progress after completion
        setPollingProgress({ current: 0, max: 15 });
        
        // Step 3: Handle polling results
        if (!pollResponse || !pollResponse.success || !pollResponse.data?.hasPredictions) {
          // Timeout or no predictions found
          console.warn('⚠️ [AI Prediction] Polling timed out - predictions not ready yet');
          setPredictionError('Predictions are still being generated by ML model. Please wait a moment and try again.');
          setTimeout(() => setPredictionError(null), 8000);
          return {
            success: false,
            error: 'Polling timeout'
          };
        }
        
        // Step 4: Extract predictions from nested structure
        console.log('✅ [AI Prediction] Predictions found in WizardWorkflowOutput:', pollResponse.data);
        
        const stepPredictions = pollResponse.data.predictions?.[stepName];
        if (!stepPredictions?.aiPredictions) {
          throw new Error(`No aiPredictions found for step: ${stepName}`);
        }
        
        // Extract prediction values from nested aiPredictions structure
        const processedPredictions = {};
        Object.entries(stepPredictions.aiPredictions).forEach(([fieldName, predData]) => {
          if (predData && typeof predData === 'object' && 'prediction' in predData) {
            processedPredictions[fieldName] = predData.prediction;
            console.log(`✅ [AI Prediction] Extracted ${fieldName} = ${predData.prediction}`);
          }
        });
        
        if (Object.keys(processedPredictions).length === 0) {
          throw new Error('No valid predictions found in aiPredictions');
        }
        
        // Step 5: Auto-populate predictions directly into form and track with blue tint
        const mergedData = { ...currentFormData, ...processedPredictions };
        console.log('🔄 [AI Prediction] Auto-populating predictions into form:', mergedData);
        
        // Update form values immediately with predictions
        setFormValues((prev) => ({
          ...prev,
          [stepName]: mergedData
        }));
        
        // Track all predicted fields for blue tint styling (override any existing values)
        const predictedFieldNames = new Set(Object.keys(processedPredictions));
        setAiPopulatedFields(prev => ({
          ...prev,
          [stepName]: predictedFieldNames
        }));
        
        // Store predictions and metadata for reference
        setAiPredictions(prev => ({
          ...prev,
          [stepName]: processedPredictions
        }));
        
        const stepMetadata = pollResponse.data.predictionMetadata?.[stepName];
        if (stepMetadata) {
          setPredictionMetadata(prev => ({
            ...prev,
            [stepName]: stepMetadata
          }));
        }
        
        console.log('✅ [AI Prediction] Auto-populated fields:', Array.from(predictedFieldNames));

        
        // Show success message
        const predictedCount = Object.keys(processedPredictions).length;
        const confidence = pollResponse.data.predictionMetadata?.[stepName]?.confidence 
          ? (pollResponse.data.predictionMetadata[stepName].confidence * 100).toFixed(1)
          : 'N/A';
        
        setPredictionSuccess(
          `🎉 Successfully loaded ${predictedCount} AI predictions from ML model (Confidence: ${confidence}%)`
        );
        
        console.log(`📊 [AI Prediction] Successfully processed ${predictedCount} predictions`);
        setTimeout(() => setPredictionSuccess(null), 5000);
        
        return {
          success: true,
          updatedCount: predictedCount,
          confidence: pollResponse.data.predictionMetadata?.[stepName]?.confidence
        };
        
      } else {
        throw new Error('Unexpected response from backend. Expected status: "processing"');
      }
    } catch (error) {
      console.error('❌ [AI Prediction] Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate predictions';
      setPredictionError(`AI Prediction Error: ${errorMessage}`);
      setTimeout(() => setPredictionError(null), 5000);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setPredicting(false);
    }
  };

  const renderStep = () => {
    // If 100% secondary aluminium is selected, skip first 4 stages
    if (materialSource === 'secondary' && ['mining', 'beneficiation', 'refining', 'smelting'].includes(stepKey)) {
      return (
        <div className="p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <div className="text-6xl mb-4">♻️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                This stage is not applicable
              </h3>
              <p className="text-gray-600 mb-4">
                Since you've selected <strong>100% Secondary/Recycled Aluminium</strong>, the upstream stages 
                (Mining, Beneficiation, Refining, and Smelting) are skipped.
              </p>
              <p className="text-sm text-gray-500">
                Your workflow begins at the <strong>Manufacturing</strong> stage.
              </p>
            </div>
          </div>
        </div>
      );
    }

    switch (stepKey) {
      case 'mining':
        return (
          <MiningProcessDetails
            onNext={handleNext}
            onSave={(data) => handleSaveStep('mining', data)}
            initialValues={formValues.mining}
            onGenerateAIPrediction={(data) => handleGenerateAIPrediction('mining', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            onOpenWorkflow={onOpenWorkflow}
            aiPopulatedFields={aiPopulatedFields['mining'] || new Set()}
            predictionMetadata={predictionMetadata['mining'] || {}}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );
      case 'beneficiation':
        return (
          <BeneficiationDetails
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('beneficiation', data)}
            initialValues={formValues.beneficiation}
            onGenerateAIPrediction={(data) => handleGenerateAIPrediction('beneficiation', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            onOpenWorkflow={onOpenWorkflow}
            aiPopulatedFields={aiPopulatedFields['beneficiation'] || new Set()}
            predictionMetadata={predictionMetadata['beneficiation'] || {}}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );
      case 'refining':
        return (
          <RefiningDetails
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('refining', data)}
            initialValues={formValues.refining}
            onGenerateAIPrediction={(data) => handleGenerateAIPrediction('refining', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields['refining'] || new Set()}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );
      case 'smelting':
        return (
          <SmeltingDetails
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('smelting', data)}
            initialValues={formValues.smelting}
            onGenerateAIPrediction={(data) => handleGenerateAIPrediction('smelting', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields['smelting'] || new Set()}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );
      case 'manufacturing':
        return (
          <ManufacturingDetails
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('manufacturing', data)}
            initialValues={formValues.manufacturing}
            onGenerateAIPrediction={(data) => handleGenerateAIPrediction('manufacturing', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields['manufacturing'] || new Set()}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
            recyclingData={formValues.recycling}
            materialSourceInfo={{
              materialSource,
              primaryPercentage,
              secondaryPercentage,
              primaryGrade,
              customPrimaryGrade,
            }}
          />
        );
      case 'recycling':
        return (
          <RecyclingDetails
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('recycling', data)}
            initialValues={formValues.recycling}
            onGenerateAIPrediction={(data) => handleGenerateAIPrediction('recycling', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields['recycling'] || new Set()}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );
      case 'valorization':
        return (
          <ValorizationDetails
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('valorization', data)}
            initialValues={formValues.valorization}
            onGenerateAIPrediction={(data) => handleGenerateAIPrediction('valorization', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields['valorization'] || new Set()}
            onSubmitSuccess={() => {
              setCompleted(true)
            }}
            workflowId={workflowId}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );
      default:
        return (
          <StepForm
            stepKey={stepKey}
            stepTitle={currentStep.title}
            values={stepValues}
            onChange={(field, value) => handleValueChange(stepKey, field, value)}
          />
        );
    }
  }

  return (
    <WizardContainer title={currentStep.title} subtitle={currentStep.description}>
      {/* Wizard Home Button */}
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            if (confirm('Return to wizard home page? Your current progress is saved and you can resume from Recent Projects.')) {
              // Clear localStorage so it shows metal selection instead of auto-loading
              localStorage.removeItem('currentWizardWorkflowId');
              window.location.href = '/wizard';
            }
          }}
          className="border-[#BA7967] text-[#BA7967] hover:bg-[#BA7967] hover:text-white"
        >
          🏠 Wizard Home
        </Button>
      </div>

      {/* Material Source Selection */}
      <div className="mb-6 p-5 rounded-3xl border border-[#e7dfd2] bg-linear-to-br from-[#fbfaf7] via-[#f4f2ec] to-[#efe6dd] shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Primary Material Source</h3>
        <div className="space-y-3">
          {/* Option 1: 100% Primary */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="materialSource"
              value="primary"
              checked={materialSource === 'primary'}
              onChange={(e) => {
                setMaterialSource('primary');
                setPrimaryPercentage(100);
                setSecondaryPercentage(0);
                setPrimaryGrade((prev) => prev || 'P1020');
              }}
              className="w-5 h-5 text-[#BA7967] focus:ring-2 focus:ring-[#BA7967]"
            />
            <span className="text-gray-700 group-hover:text-gray-900 font-medium">
              100% Primary Aluminium (from bauxite)
            </span>
          </label>

          {/* Option 2: 100% Secondary */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="materialSource"
              value="secondary"
              checked={materialSource === 'secondary'}
              onChange={(e) => {
                setMaterialSource('secondary');
                setPrimaryPercentage(0);
                setSecondaryPercentage(100);
                setPrimaryGrade(null);
                setCustomPrimaryGrade('');
              }}
              className="w-5 h-5 text-[#BA7967] focus:ring-2 focus:ring-[#BA7967]"
            />
            <span className="text-gray-700 group-hover:text-gray-900 font-medium">
              100% Secondary/Recycled Aluminium
            </span>
          </label>

          {/* Option 3: Mixed */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="materialSource"
                value="mixed"
                checked={materialSource === 'mixed'}
                onChange={(e) => {
                  setMaterialSource('mixed');
                  setPrimaryPercentage(50);
                  setSecondaryPercentage(50);
                  setPrimaryGrade((prev) => prev || 'P1020');
                }}
                className="w-5 h-5 text-[#BA7967] focus:ring-2 focus:ring-[#BA7967]"
              />
              <span className="text-gray-700 group-hover:text-gray-900 font-medium whitespace-nowrap">
                Mixed Primary/Secondary →
              </span>
            </label>
            {materialSource === 'mixed' && (
              <div className="flex items-center gap-2 flex-1">
                <label className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Primary:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={primaryPercentage}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setPrimaryPercentage(val);
                      setSecondaryPercentage(100 - val);
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#BA7967] focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </label>
                <span className="text-gray-400">|</span>
                <label className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Secondary:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={secondaryPercentage}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setSecondaryPercentage(val);
                      setPrimaryPercentage(100 - val);
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#BA7967] focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Primary grade selection (shown for Primary or Mixed routes) */}
        {materialSource !== 'secondary' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-[220px,1fr] items-center">
            <div className="text-sm font-semibold text-gray-800">Primary aluminium grade</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <select
                value={primaryGrade || 'P1020'}
                onChange={(e) => setPrimaryGrade(e.target.value)}
                className="w-full sm:w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#BA7967] focus:ring-2 focus:ring-[#BA7967]"
              >
                <option value="P1020">P1020 (≈99.7% Al)</option>
                <option value="Foundry">Foundry alloy (cast)</option>
                <option value="WireRod">Wire rod (conductive)</option>
                <option value="Other">Other / custom</option>
              </select>
              {primaryGrade === 'Other' && (
                <input
                  type="text"
                  value={customPrimaryGrade}
                  onChange={(e) => setCustomPrimaryGrade(e.target.value)}
                  placeholder="Describe custom grade"
                  className="w-full sm:flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#BA7967] focus:ring-2 focus:ring-[#BA7967]"
                />
              )}
            </div>
          </div>
        )}

        {/* Info message for secondary selection */}
        {materialSource === 'secondary' && (
          <div className="mt-4 p-3 rounded-lg border border-[#e3d4c8] bg-linear-to-br from-amber-50 to-orange-50 text-sm text-gray-700">
            ℹ️ With 100% Secondary Aluminium, the first 4 stages (Mining, Beneficiation, Refining, Smelting) are skipped. 
            The workflow starts from Manufacturing stage.
          </div>
        )}
      </div>
      
      {/* AI Prediction Notifications */}
      {predictionError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 animate-in slide-in-from-top">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Prediction Failed</p>
              <p className="text-sm mt-1">{predictionError}</p>
            </div>
          </div>
        </div>
      )}

      {predictionSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 animate-in slide-in-from-top">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Predictions Generated!</p>
              <p className="text-sm mt-1">{predictionSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {renderStep()}
      {!(stepKey === 'mining' || stepKey === 'beneficiation' || stepKey === 'refining' || stepKey === 'smelting' || stepKey === 'manufacturing' || stepKey === 'recycling' || stepKey === 'valorization') && (
        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={activeStep === 0} className="relative overflow-hidden border-gray-300 hover:border-gray-400 rounded-none" style={{
            clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 15% 100%, 0% 50%)',
            paddingLeft: '2rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span className="pl-4">Back</span>
          </Button>
          <Button onClick={handleNext} className="relative overflow-hidden bg-[#BA7967] hover:bg-[#a86b5c] text-white border-0 rounded-none" style={{
            clipPath: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)',
            paddingRight: '2rem'
          }}>
            <span className="pr-4">{activeStep === steps.length - 1 ? "Finish" : "Next"}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Button>
        </div>
      )}

      {completed && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="rounded-lg bg-emerald-600 text-white px-4 py-3 shadow-lg">
            Submission successful! Your inputs have been saved.
          </div>
        </div>
      )}
      
      {/* LCA Success Modal */}
      <LCASuccessModal
        isOpen={showLCAModal}
        onClose={() => setShowLCAModal(false)}
        reportData={lcaReportData || {}}
      />
      
      {/* LCA Prompt Modal (Simple) */}
      <LCAPromptModal
        isOpen={showLCAPromptModal}
        onClose={() => setShowLCAPromptModal(false)}
        reportId={lcaPromptReportId}
      />
      
      {/* Sustainable Solutions Modal */}
      <SustainableSolutionsModal
        open={showSustainableSolutions}
        onClose={() => setShowSustainableSolutions(false)}
        stage={currentSustainableStage}
        formData={formDataForSustainable}
      />
    </WizardContainer>
  )
}

// Step 3: Refining
function RefiningDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), onCalculateLCA, isCalculatingLca, setShowSustainableSolutions, setCurrentSustainableStage, setFormDataForSustainable }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const processOptions = [
    { id: 'crushing', label: 'Crushing' },
    { id: 'clarification', label: 'Clarification (separating alumina liquor from red mud)' },
    { id: 'calcination', label: 'Calcination (removal of water to produce alumina powder)' },
    { id: 'digestion', label: 'Digestion (caustic soda process)' },
    { id: 'precipitation', label: 'Precipitation (alumina hydrate recovery)' },
    { id: 'others', label: 'Others' },
  ]

  const variantOptions = [
    { id: 'high_pressure_digestion', label: 'High-pressure digestion (faster, energy-efficient)' },
    { id: 'heat_recovery', label: 'Heat recovery loops (capture waste heat)' },
    { id: 'automation_sensors', label: 'Automation & sensors (real-time optimization)' },
    { id: 'multi_stage_clarification', label: 'Multi-stage clarification (better recovery, less red mud)' },
    { id: 'green_solvents', label: 'Green solvents / additives (improve kinetics)' },
    { id: 'others', label: 'Others' },
  ]

  const toxicityOptions = [
    { id: 'Low', label: 'Low - minimal heavy metals' },
    { id: 'Moderate', label: 'Moderate - presence of iron, trace metals' },
    { id: 'High', label: 'High - elevated levels of toxic elements, highly alkaline' },
    { id: 'Others', label: 'Others' },
  ]

  // Helper to handle empty string inputs for required number fields
  const requiredNumber = (min = 0, message = 'Required') => 
    z.preprocess(
      (val) => (val === '' || val === null || val === undefined) ? undefined : val,
      z.coerce.number().min(min, { message })
    );

  const schema = z.object({
    processes: z.array(z.string()).default([]),
    processOthers: z.string().nullable().optional(),
    variants: z.array(z.string()).default([]),
    variantOthers: z.string().nullable().optional(),
    energyUse: requiredNumber(0, 'Required and must be >= 0').nullable().optional(),
    waterUse: requiredNumber(0, 'Required and must be >= 0').nullable().optional(),
    redMudGen: requiredNumber(0, 'Required and must be >= 0').nullable().optional(),
    causticSoda: z.coerce.number().min(0).nullable().optional(),
    limeAdditives: z.coerce.number().min(0).nullable().optional(),
    so2: z.coerce.number().min(0).nullable().optional(),
    nox: z.coerce.number().min(0).nullable().optional(),
    dust: z.coerce.number().min(0).nullable().optional(),
    toxicity: z.string().nullable().optional(),
    toxicityOthers: z.string().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      renewable_energy_percent: z.coerce.number().nullable().optional(),
      red_mud_utilization_percent: z.coerce.number().nullable().optional(),
      water_recycling_rate: z.coerce.number().nullable().optional(),
      caustic_soda_recovery_percent: z.coerce.number().nullable().optional(),
      heat_recovery_loops_enabled: z.boolean().nullable().optional(),
      emission_control_efficiency: z.coerce.number().nullable().optional(),
    }).nullable().optional(),
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      processes: [],
      variants: [],
      sustainabilityParameters: {},
    },
    mode: 'onTouched',
  })

  const { control, handleSubmit, watch, formState: { isValid }, trigger } = form
  const selectedProcesses = watch('processes')
  const selectedVariants = watch('variants')
  const toxicity = watch('toxicity')

  // Trigger validation when component mounts with existing data
  React.useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      trigger();
    }
  }, []);

  // Modified AI prediction handler
  const handleGenerateAIPrediction = async (formData) => {
    if (onGenerateAIPrediction) {
      await onGenerateAIPrediction(formData);
    }
  };

  const onSubmit = (data) => {
    onSave?.(data)
    onNext?.()
  }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
      onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
      isCalculatingLca={isCalculatingLca}
      showSustainableButton
      onShowSustainable={() => {
        setCurrentSustainableStage?.('refining');
        setFormDataForSustainable?.(form.getValues());
        setShowSustainableSolutions?.(true);
      }}
    />
  )

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={3}
        badgeLabel="Bayer Process (Alumina Production)"
        title="Bayer Process (Alumina Production)"
        description="Fill in refining processes, variants, resource consumption, and emissions. Fields marked with * are required."
        onPredict={() => handleGenerateAIPrediction(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* REQUIRED FIELDS - Always visible */}
            <FormField
              control={control}
              name="processes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className={GROUP_HEADING_TEXT}>Select Applicable Processes*</FormLabel>
                    <FormDescription>Choose all that apply.</FormDescription>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {processOptions.map((opt) => (
                      <FormField key={opt.id} control={control} name="processes" render={({ field }) => (
                        <CardCheckbox
                          id={`ref-proc-${opt.id}`}
                          label={opt.label}
                          checked={field.value?.includes(opt.id)}
                          onChange={(checked) => {
                            const next = new Set(field.value || [])
                            if (checked) next.add(opt.id); else next.delete(opt.id)
                            field.onChange(Array.from(next))
                          }}
                        />
                      )} />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedProcesses?.includes('others') && (
              <FormField control={control} name="processOthers" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Other Process</FormLabel>
                  <FormControl><Input placeholder="Specify other process" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <hr className="my-4 border-gray-200" />

            {/* Required Resource Consumption */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={control} name="energyUse" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Energy Use (kWh or MJ per tonne of alumina)*</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 12000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="waterUse" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Water Use (m³ per tonne of alumina)*</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 2.5" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="redMudGen" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Red Mud Generation (kg per tonne of alumina)*</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 1000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <hr className="my-8 border-gray-200" />

            {/* ADVANCED OPTIONS - Collapsible section with ALL other fields */}
            <AdvancedOptionsSection title="Advanced Options" defaultOpen={false}>
              <div className="space-y-8">

                {/* Variants / Enhancements */}
                <FormField
                  control={control}
                  name="variants"
                  render={() => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Variants / Enhancements</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {variantOptions.map((opt) => (
                          <FormField key={opt.id} control={control} name="variants" render={({ field }) => (
                            <CardCheckbox
                              id={`ref-var-${opt.id}`}
                              label={opt.label}
                              checked={field.value?.includes(opt.id)}
                              onChange={(checked) => {
                                const next = new Set(field.value || [])
                                if (checked) next.add(opt.id); else next.delete(opt.id)
                                field.onChange(Array.from(next))
                              }}
                            />
                          )} />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedVariants?.includes('others') && (
                  <FormField control={control} name="variantOthers" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Other Variant / Enhancement</FormLabel>
                      <FormControl><Input placeholder="Specify other variant" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <hr className="my-4 border-gray-200" />

            {/* 4. AI-Predictable Fields Section */}
            <div className="space-y-4">
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold`}>AI-Predictable Metrics</h3>
                <p className="text-sm text-gray-600 mt-1">These fields can be auto-filled using AI predictions</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="refining_energy_MJ_per_t_alumina" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Energy (MJ per tonne alumina)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('refining_energy_MJ_per_t_alumina') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="refining_water_m3_per_t_alumina" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Water (m³ per tonne alumina)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('refining_water_m3_per_t_alumina') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="refining_red_mud_kg_per_t_alumina" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Red Mud (kg per tonne alumina)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('refining_red_mud_kg_per_t_alumina') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="refining_caustic_soda_kg_per_t_alumina" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Caustic Soda (kg per tonne alumina)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('refining_caustic_soda_kg_per_t_alumina') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="refining_lime_kg_per_t_alumina" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Lime (kg per tonne alumina)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('refining_lime_kg_per_t_alumina') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="refining_so2_kg_per_t_alumina" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>SO₂ (kg per tonne alumina)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('refining_so2_kg_per_t_alumina') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="refining_nox_kg_per_t_alumina" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>NOₓ (kg per tonne alumina)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('refining_nox_kg_per_t_alumina') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="refining_dust_kg_per_t_alumina" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Dust (kg per tonne alumina)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('refining_dust_kg_per_t_alumina') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <hr className="my-4 border-gray-200" />

                {/* Toxicity Indicators */}
                <FormField control={control} name="toxicity" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Toxicity Indicators of Red Mud</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {toxicityOptions.map((opt) => (
                          <CardRadio
                            key={opt.id}
                            id={`tox-${opt.id}`}
                            label={opt.label}
                            selected={field.value === opt.id}
                            onSelect={() => field.onChange(field.value === opt.id ? undefined : opt.id)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {toxicity === 'Others' && (
                  <FormField control={control} name="toxicityOthers" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Specify Toxicity</FormLabel>
                      <FormControl><Input placeholder="Describe toxicity indicator" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <hr className="my-4 border-gray-200" />

                {/* Sustainability Section */}
                <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                  <FormField
                    control={control}
                    name="followingSustainableRules"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            Sustainability Focused
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Enable to include sustainability parameters in your refining process
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sustainability Parameters */}
                {watch("followingSustainableRules") === true && (
                  <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                    <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                      Sustainability Parameters
                    </h3>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.red_mud_utilization_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Red Mud Utilization (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.caustic_soda_recovery_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Caustic Soda Recovery (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.heat_recovery_loops_enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Heat Recovery Loops Enabled</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.bauxite_residue_management_certified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Bauxite Residue Management Certified</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.emission_scrubbing_efficiency_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emission Scrubbing Efficiency (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.renewable_energy_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renewable Energy (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </AdvancedOptionsSection>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  )
}

// Step 4: Smelting
function SmeltingDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), onCalculateLCA, isCalculatingLca, setShowSustainableSolutions, setCurrentSustainableStage, setFormDataForSustainable }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const processOptions = [
    { id: 'pre_baking_anodes', label: 'Pre-baking anodes (heat treatment)' },
    { id: 'anode_effect_control', label: 'Anode effect control (stability maintenance)' },
    { id: 'off_gas_treatment', label: 'Off-gas treatment (scrubber systems)' },
    { id: 'electrolysis', label: 'Electrolysis (cell operation)' },
    { id: 'bath_chemistry', label: 'Bath chemistry management (fluoride & alumina concentration)' },
    { id: 'others', label: 'Others' },
  ]

  const variantOptions = [
    { id: 'pre_baked_cells', label: 'Pre-baked anode cells (standard technology)' },
    { id: 'inert_anodes_low_carbon', label: 'Low-carbon inert anodes (experimental, reduce CO₂ footprint)' },
    { id: 'dynamic_load', label: 'Dynamic load management (shift operations to clean energy availability)' },
    { id: 'soderberg_cells', label: 'Soderberg cells (more polluting)' },
    { id: 'renewable_powered', label: 'Renewable-powered smelters (intermittent optimization possible)' },
    { id: 'others', label: 'Others' },
  ]

  const cellTechOptions = [
    { id: 'Pre-baked', label: 'Pre-baked' },
    { id: 'Soderberg', label: 'Soderberg' },
    { id: 'Inert Anode', label: 'Inert Anode' },
  ]

  // Helper to handle empty string inputs for required number fields
  const requiredNumber = (min = 0, message = 'Required') => 
    z.preprocess(
      (val) => (val === '' || val === null || val === undefined) ? undefined : val,
      z.coerce.number().min(min, { message })
    );

  const schema = z.object({
    processes: z.array(z.string()).default([]),
    processOthers: z.string().nullable().optional(),
    variants: z.array(z.string()).default([]),
    variantOthers: z.string().nullable().optional(),
    electricityDemand: requiredNumber(0, 'Required and must be >= 0').nullable().optional(),
    co2Emissions: requiredNumber(0, 'Required and must be >= 0').nullable().optional(),
    cellTechnology: z.enum(["Pre-baked", "Soderberg", "Inert Anode"]).nullable().optional(),
    pfcEmissions: z.coerce.number().min(0).nullable().optional(),
    so2: z.coerce.number().min(0).nullable().optional(),
    nox: z.coerce.number().min(0).nullable().optional(),
    fluorideRecovery: z.coerce.number().min(0).max(100).nullable().optional(),
    thermalRecovery: z.coerce.number().min(0).max(100).nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      renewable_power_mix_percent: z.coerce.number().nullable().optional(),
      anode_type_prebaked_or_low_carbon: z.boolean().nullable().optional(),
      fluoride_recovery_efficiency_percent: z.coerce.number().nullable().optional(),
      pfc_emission_factor_low_band: z.boolean().nullable().optional(),
      thermal_energy_recovery_percent: z.coerce.number().nullable().optional(),
      carbon_capture_rate: z.coerce.number().nullable().optional(),
    }).nullable().optional(),
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      processes: [],
      variants: [],
      sustainabilityParameters: {},
    },
    mode: 'onTouched',
  })

  const { control, handleSubmit, watch, setValue, formState: { isValid }, trigger } = form
  const selectedProcesses = watch('processes')
  const selectedVariants = watch('variants')

  // Trigger validation when component mounts with existing data
  React.useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      trigger();
    }
  }, []);

  // Modified AI prediction handler
  const handleGenerateAIPrediction = async (formData) => {
    if (onGenerateAIPrediction) {
      await onGenerateAIPrediction(formData);
    }
  };

  const onSubmit = (data) => {
    onSave?.(data)
    onNext?.()
  }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
      onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
      isCalculatingLca={isCalculatingLca}
      showSustainableButton
      onShowSustainable={() => {
        setCurrentSustainableStage?.('smelting');
        setFormDataForSustainable?.(form.getValues());
        setShowSustainableSolutions?.(true);
      }}
    />
  )

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={4}
        badgeLabel="Hall–Héroult Process (Aluminium Smelting)"
        title="Hall–Héroult Process (Aluminium Smelting)"
        description="Select processes, variants, and enter required energy and emissions data. Fields marked with * are required."
        onPredict={() => handleGenerateAIPrediction(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* REQUIRED FIELDS - Always visible */}
            <FormField control={control} name="processes" render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className={GROUP_HEADING_TEXT}>Select Applicable Processes*</FormLabel>
                  <FormDescription>Choose all that apply.</FormDescription>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {processOptions.map((opt) => (
                    <FormField key={opt.id} control={control} name="processes" render={({ field }) => (
                      <CardCheckbox
                        id={`sml-proc-${opt.id}`}
                        label={opt.label}
                        checked={field.value?.includes(opt.id)}
                        onChange={(checked) => {
                          const next = new Set(field.value || [])
                          if (checked) next.add(opt.id); else next.delete(opt.id)
                          field.onChange(Array.from(next))
                        }}
                      />
                    )} />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {selectedProcesses?.includes('others') && (
              <FormField control={control} name="processOthers" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Other Process</FormLabel>
                  <FormControl><Input placeholder="Specify other process" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <hr className="my-4 border-gray-200" />

            {/* Required Core Technology and Resource Demand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={control} name="electricityDemand" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Electricity Demand (kWh per tonne of aluminium)*</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 14000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="co2Emissions" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>CO₂ Emissions (kg per tonne of aluminium)*</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 2000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="cellTechnology" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={GROUP_HEADING_TEXT}>Cell Technology*</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {cellTechOptions.map((opt) => (
                        <CardRadio
                          key={opt.id}
                          id={`cell-${opt.id}`}
                          label={opt.label}
                          selected={field.value === opt.id}
                          onSelect={() => field.onChange(field.value === opt.id ? undefined : opt.id)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <hr className="my-8 border-gray-200" />

            {/* ADVANCED OPTIONS - Collapsible section with ALL other fields */}
            <AdvancedOptionsSection title="Advanced Options" defaultOpen={false}>
              <div className="space-y-8">

                {/* Variants / Enhancements */}
                <FormField control={control} name="variants" render={() => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Variants / Enhancements</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {variantOptions.map((opt) => (
                        <FormField key={opt.id} control={control} name="variants" render={({ field }) => (
                          <CardCheckbox
                            id={`sml-var-${opt.id}`}
                            label={opt.label}
                            checked={field.value?.includes(opt.id)}
                            onChange={(checked) => {
                              const next = new Set(field.value || [])
                              if (checked) next.add(opt.id); else next.delete(opt.id)
                              field.onChange(Array.from(next))
                            }}
                          />
                        )} />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                {selectedVariants?.includes('others') && (
                  <FormField control={control} name="variantOthers" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Other Variant / Enhancement</FormLabel>
                      <FormControl><Input placeholder="Specify other variant" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <hr className="my-4 border-gray-200" />

                {/* AI-Predictable Fields Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className={`${GROUP_HEADING_TEXT} font-semibold`}>AI-Predictable Metrics</h3>
                    <p className="text-sm text-gray-600 mt-1">These fields can be auto-filled using AI predictions</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={control} name="smelting_energy_kWh_per_t_al" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Energy (kWh per tonne aluminum)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.1" 
                            placeholder="AI predicted" 
                            {...field} 
                            value={field.value ?? ''} 
                            className={aiPopulatedFields.has('smelting_energy_kWh_per_t_al') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={control} name="smelting_energy_MJ_per_t_al" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Energy (MJ per tonne aluminum)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.1" 
                            placeholder="AI predicted" 
                            {...field} 
                            value={field.value ?? ''} 
                            className={aiPopulatedFields.has('smelting_energy_MJ_per_t_al') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={control} name="smelting_co2_kg_per_t_al" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>CO₂ (kg per tonne aluminum)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.1" 
                            placeholder="AI predicted" 
                            {...field} 
                            value={field.value ?? ''} 
                            className={aiPopulatedFields.has('smelting_co2_kg_per_t_al') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={control} name="smelting_pfc_kg_per_t_al" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>PFC (kg per tonne aluminum)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="AI predicted" 
                            {...field} 
                            value={field.value ?? ''} 
                            className={aiPopulatedFields.has('smelting_pfc_kg_per_t_al') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={control} name="smelting_so2_kg_per_t_al" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>SO₂ (kg per tonne aluminum)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="AI predicted" 
                            {...field} 
                            value={field.value ?? ''} 
                            className={aiPopulatedFields.has('smelting_so2_kg_per_t_al') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={control} name="smelting_nox_kg_per_t_al" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>NOₓ (kg per tonne aluminum)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="AI predicted" 
                            {...field} 
                            value={field.value ?? ''} 
                            className={aiPopulatedFields.has('smelting_nox_kg_per_t_al') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={control} name="smelting_fluoride_recovery_percent" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Fluoride Recovery (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="0.1" 
                            placeholder="AI predicted" 
                            {...field} 
                            value={field.value ?? ''} 
                            className={aiPopulatedFields.has('smelting_fluoride_recovery_percent') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={control} name="smelting_thermal_recovery_percent" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={GROUP_HEADING_TEXT}>Thermal Recovery (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="0.1" 
                            placeholder="AI predicted" 
                            {...field} 
                            value={field.value ?? ''} 
                            className={aiPopulatedFields.has('smelting_thermal_recovery_percent') ? 'ai-populated-field' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <hr className="my-4 border-gray-200" />

                {/* Sustainability Section */}
                <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                  <FormField
                    control={control}
                    name="followingSustainableRules"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            Sustainability Focused
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Enable to include sustainability parameters in your smelting process
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sustainability Parameters */}
                {watch("followingSustainableRules") === true && (
                  <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                    <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                      Sustainability Parameters
                    </h3>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.renewable_power_mix_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renewable Power Mix (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.anode_type_prebaked_or_low_carbon"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Anode Type: Prebaked or Low Carbon</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.fluoride_recovery_efficiency_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fluoride Recovery Efficiency (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.pfc_abatement_enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">PFC Abatement Enabled</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.dross_valorization_rate_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dross Valorization Rate (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.spl_reused_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SPL Reused (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </AdvancedOptionsSection>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  )
}

// Alloy presets for common applications
const ALLOY_PRESETS = {
  automotive_casting: { name: 'Automotive Casting (A380)', Al: 85, Si: 8.5, Cu: 3.5, Fe: 1.3, Zn: 1, Others: 0.7 },
  automotive_wrought: { name: 'Automotive Wrought (6061)', Al: 97.9, Mg: 1, Si: 0.6, Cu: 0.3, Cr: 0.2 },
  aerospace: { name: 'Aerospace (7075)', Al: 90, Zn: 5.6, Mg: 2.5, Cu: 1.6, Others: 0.3 },
  packaging: { name: 'Packaging (3004)', Al: 97.8, Mn: 1.2, Mg: 1, Others: 0 },
  construction: { name: 'Construction (6063)', Al: 98.5, Mg: 0.7, Si: 0.4, Others: 0.4 },
  custom: { name: 'Custom', Al: 95, Cu: 5, Mg: 0, Si: 0, Others: 0 },
};

// Estimated composition from scrap quality
const estimateMeasuredComposition = (targetComp, scrapQuality, scrapSource) => {
  // High-grade scrap is closer to target; low-grade has more impurities
  const qualityFactor = scrapQuality === 'high' ? 0.98 : scrapQuality === 'medium' ? 0.92 : 0.85;
  const estimatedAl = targetComp.Al * qualityFactor;
  const impurityIncrease = targetComp.Al * (1 - qualityFactor);
  
  return {
    Al: estimatedAl,
    Cu: targetComp.Cu * 0.6, // Assume some Cu loss/dilution
    Mg: targetComp.Mg * 0.7,
    Si: targetComp.Si + impurityIncrease * 0.4, // Si often increases in scrap
    Others: targetComp.Others + impurityIncrease * 0.6,
  };
};

// Step 5: Manufacturing
function ManufacturingDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), onCalculateLCA, isCalculatingLca, setShowSustainableSolutions, setCurrentSustainableStage, setFormDataForSustainable, recyclingData, materialSourceInfo }) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [scrapQuality, setScrapQuality] = useState('medium');
  const [autoEstimateMeasured, setAutoEstimateMeasured] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const processOptions = [
    { id: 'casting', label: 'Casting (ingots, billets - high-temperature energy)' },
    { id: 'extrusion', label: 'Extrusion (tubes, profiles - efficient shaping)' },
    { id: 'surface_treatment', label: 'Surface Treatment (anodizing, coating - chemical & energy use)' },
    { id: 'design_recycling', label: 'Design for Recycling (optimized alloys, less contamination)' },
    { id: 'rolling', label: 'Rolling (sheet metal - mechanical deformation)' },
    { id: 'forging', label: 'Forging (metal strengthening, scrap generation)' },
    { id: 'joining', label: 'Joining Processes (welding, mechanical fastening - emissions, waste)' },
    { id: 'others', label: 'Others' },
  ]

  const castingOptions = [
    { id: 'ingot', label: 'Ingot Casting' },
    { id: 'billet', label: 'Billet Casting' },
    { id: 'continuous', label: 'Continuous Casting' },
  ]

  const transportModes = ['Road', 'Rail', 'Sea', 'Air', 'Mixed', 'Others']

  const sectors = [
    { id: 'automotive', label: 'Automotive' },
    { id: 'aerospace', label: 'Aerospace' },
    { id: 'construction', label: 'Construction' },
    { id: 'packaging', label: 'Packaging' },
    { id: 'others', label: 'Others' },
  ]

  const corrosionOptions = [
    { id: 'minimal', label: 'Minimal (long lifespan, low maintenance)' },
    { id: 'moderate', label: 'Moderate (occasional maintenance)' },
    { id: 'severe', label: 'Severe (frequent maintenance, repairs)' },
    { id: 'others', label: 'Others' },
  ]

  // Helper to handle empty string inputs for required number fields
  const requiredNumber = (min = 0, max, message = 'Required') => {
    // Handle case where max is actually a message string
    let actualMax = max;
    let actualMessage = message;
    
    if (typeof max === 'string') {
      actualMessage = max;
      actualMax = undefined;
    }
    
    // Build the number schema with min/max constraints before wrapping in preprocess
    let numberSchema = z.coerce.number().min(min, { message: actualMessage });
    
    if (actualMax !== undefined && typeof actualMax === 'number') {
      numberSchema = numberSchema.max(actualMax, { message: `Must be between ${min}-${actualMax}` });
    }
    
    // Wrap the complete schema in preprocess
    return z.preprocess(
      (val) => (val === '' || val === null || val === undefined) ? undefined : val,
      numberSchema
    );
  };

  const schema = z.object({
    processes: z.array(z.string()).optional().default([]),
    processOthers: z.string().nullable().optional(),
    castingProcesses: z.array(z.string()).default([]),
    // Alloy / mass balance inputs
    finalProductMass: z.coerce.number().min(0.1).nullable().optional(),
    targetAlPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    targetCuPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    targetMgPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    targetSiPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    targetOthersPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    // Measured composition toggle and fields
    useMeasuredComposition: z.boolean().nullable().optional(),
    measuredAlPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    measuredCuPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    measuredMgPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    measuredSiPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    measuredOthersPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    scrapRate: requiredNumber(0, 100, 'Scrap rate must be between 0-100%').nullable().optional(),
    recycledContent: z.coerce.number().min(0).max(100).nullable().optional(),
    energyUsePerStep: z.coerce.number().min(0).nullable().optional(),
    fabricationEmissions: z.coerce.number().min(0).nullable().optional(),
    transportDistance: requiredNumber(0, undefined, 'Transport distance is required and must be >= 0').nullable().optional(),
    transportMode: z.enum(['Road', 'Rail', 'Sea', 'Air', 'Mixed', 'Others']).nullable().optional(),
    transportModeOthers: z.string().nullable().optional(),
    transportEmissionsPerTkm: z.coerce.number().min(0).nullable().optional(),
    lightweightingSectors: z.array(z.string()).default([]),
    lightweightingOthers: z.string().nullable().optional(),
    corrosionImpact: z.enum(['minimal', 'moderate', 'severe', 'others']).nullable().optional(),
    corrosionOthers: z.string().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      design_for_recycling_enabled: z.boolean().nullable().optional(),
      scrap_recycled_onsite_percent: z.coerce.number().nullable().optional(),
      surface_treatment_chemical_use_reduced: z.boolean().nullable().optional(),
      transport_mode_rail_or_sea_preferred: z.boolean().nullable().optional(),
      product_lifetime_years: z.coerce.number().nullable().optional(),
      
    }).nullable().optional(),
  }).superRefine((val, ctx) => {
    // Alloy composition sanity check (sum within 0-101%)
    const targetSum = [val.targetAlPercent, val.targetCuPercent, val.targetMgPercent, val.targetSiPercent, val.targetOthersPercent]
      .map((v) => (typeof v === 'number' ? v : 0))
      .reduce((a, b) => a + b, 0);
    if (targetSum > 101) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Target alloy percentages should sum to ~100%', path: ['targetAlPercent'] });
    }
    // Measured composition sanity check
    if (val.useMeasuredComposition) {
      const measuredSum = [val.measuredAlPercent, val.measuredCuPercent, val.measuredMgPercent, val.measuredSiPercent, val.measuredOthersPercent]
        .map((v) => (typeof v === 'number' ? v : 0))
        .reduce((a, b) => a + b, 0);
      if (measuredSum > 101) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Measured composition percentages should sum to ~100%', path: ['measuredAlPercent'] });
      }
    }
    // Casting sub-selection is required only if Casting is selected
    if (val.processes?.includes('casting') && (!val.castingProcesses || val.castingProcesses.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select at least one casting process', path: ['castingProcesses'] })
    }
    // If Others selected in processes, require processOthers text
    if (val.processes?.includes('others') && !val.processOthers?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other process', path: ['processOthers'] })
    }
    // If Others transport, require transportModeOthers
    if (val.transportMode === 'Others' && !val.transportModeOthers?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other transport mode', path: ['transportModeOthers'] })
    }
    // If Others in lightweighting sectors
    if (val.lightweightingSectors?.includes('others') && !val.lightweightingOthers?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other sector', path: ['lightweightingOthers'] })
    }
    // If Others in corrosion behavior
    if (val.corrosionImpact === 'others' && !val.corrosionOthers?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify corrosion impact', path: ['corrosionOthers'] })
    }
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || { 
      processes: [], 
      castingProcesses: [], 
      lightweightingSectors: [],
      finalProductMass: 1000,
      targetAlPercent: 95,
      targetCuPercent: 5,
      targetMgPercent: 0,
      targetSiPercent: 0,
      targetOthersPercent: 0,
      useMeasuredComposition: false,
      measuredAlPercent: 0,
      measuredCuPercent: 0,
      measuredMgPercent: 0,
      measuredSiPercent: 0,
      measuredOthersPercent: 0,
      scrapRate: 0,
      sustainabilityParameters: {},
      transportDistance: 0
    },
    mode: 'onTouched',
  })

  const { control, handleSubmit, watch, setValue, formState: { isValid }, trigger } = form
  const selectedProcesses = watch('processes')
  const selectedSectors = watch('lightweightingSectors')
  const transportMode = watch('transportMode')
  const finalProductMass = watch('finalProductMass')
  const scrapRatePercent = watch('scrapRate')
  const targetAl = watch('targetAlPercent')
  const targetCu = watch('targetCuPercent')
  const targetMg = watch('targetMgPercent')
  const targetSi = watch('targetSiPercent')
  const targetOthers = watch('targetOthersPercent')
  const useMeasuredComposition = watch('useMeasuredComposition')
  const measuredAl = watch('measuredAlPercent')
  const measuredCu = watch('measuredCuPercent')
  const measuredMg = watch('measuredMgPercent')
  const measuredSi = watch('measuredSiPercent')
  const measuredOthers = watch('measuredOthersPercent')

  const targetComposition = React.useMemo(() => ({
    Al: Number(targetAl) || 0,
    Cu: Number(targetCu) || 0,
    Mg: Number(targetMg) || 0,
    Si: Number(targetSi) || 0,
    Others: Number(targetOthers) || 0,
  }), [targetAl, targetCu, targetMg, targetSi, targetOthers])

  const measuredComposition = React.useMemo(() => {
    const raw = {
      Al: Number(measuredAl) || 0,
      Cu: Number(measuredCu) || 0,
      Mg: Number(measuredMg) || 0,
      Si: Number(measuredSi) || 0,
      Others: Number(measuredOthers) || 0,
    };
    // Calculate sum for validation
    const sum = raw.Al + raw.Cu + raw.Mg + raw.Si + raw.Others;
    // If sum is non-zero, normalize to 100% to ensure mass balance
    if (sum > 0 && Math.abs(sum - 100) > 0.01) {
      return {
        Al: (raw.Al / sum) * 100,
        Cu: (raw.Cu / sum) * 100,
        Mg: (raw.Mg / sum) * 100,
        Si: (raw.Si / sum) * 100,
        Others: (raw.Others / sum) * 100,
        _rawSum: sum, // Store original sum for display
      };
    }
    return { ...raw, _rawSum: sum };
  }, [measuredAl, measuredCu, measuredMg, measuredSi, measuredOthers])

  const alloyBalancePreview = React.useMemo(() => {
    const productMass = Number(finalProductMass) > 0 ? Number(finalProductMass) : 0;
    const scrapPct = Number(scrapRatePercent) || 0;

    const manufacturingBalance = computeManufacturingOutput(productMass, scrapPct);
    const totalCharge = manufacturingBalance.productMass + manufacturingBalance.internalScrapMass;

    const primaryShare = materialSourceInfo?.materialSource === 'secondary'
      ? 0
      : Math.max(0, Math.min(1, (materialSourceInfo?.primaryPercentage ?? 100) / 100));
    const secondaryShare = Math.max(0, 1 - primaryShare);

    const primaryGrade = materialSourceInfo?.primaryGrade || 'P1020';
    const primaryComposition = getDefaultPrimaryComposition(primaryGrade);

    const secondaryComposition = (materialSourceInfo?.materialSource === 'primary')
      ? targetComposition
      : (recyclingData?.recoveredComposition || targetComposition || { Al: 95, Others: 5 });

    const meltStreams = [];
    if (totalCharge > 0 && primaryShare > 0) {
      meltStreams.push({ id: 'primary_charge', mass: totalCharge * primaryShare, composition: primaryComposition, sourceType: 'primary' });
    }
    if (totalCharge > 0 && secondaryShare > 0) {
      meltStreams.push({ id: 'secondary_charge', mass: totalCharge * secondaryShare, composition: secondaryComposition, sourceType: 'recycled' });
    }

    const melt = computeMeltComposition(meltStreams);
    
    // Use measured composition if toggle is on, otherwise use calculated melt
    // Extract only composition properties (exclude _rawSum)
    const pureComposition = useMeasuredComposition
      ? { Al: measuredComposition.Al, Cu: measuredComposition.Cu, Mg: measuredComposition.Mg, Si: measuredComposition.Si, Others: measuredComposition.Others }
      : null;
    
    // If totalCharge is 0 but using measured composition, use reference mass (1000 kg) for calculations
    const effectiveMass = (useMeasuredComposition && melt.totalMass === 0) ? 1000 : melt.totalMass;
    
    const compositionForAdditions = useMeasuredComposition
      ? { totalMass: effectiveMass, composition: pureComposition }
      : melt;
    
    // When using measured composition, use zero tolerance to show exact additions needed
    const targetWithTolerance = useMeasuredComposition
      ? { name: 'Target', composition: targetComposition, tolerance: { Al: 0, Cu: 0, Mg: 0, Si: 0, Others: 0 } }
      : { name: 'Target', composition: targetComposition };
    
    const additions = computeMakeupAdditions(targetWithTolerance, compositionForAdditions);

    const recyclingYield = Number(recyclingData?.recoveryYieldPercent ?? recyclingData?.recycling_recovery_yield_percent ?? 0);
    const slagPercent = Number(recyclingData?.slagPercent ?? 0);
    const valorizationRate = Number(recyclingData?.valorizationRatePercent ?? 0);

    const recyclingResult = computeRecyclingResult(
      { id: 'internal_scrap', mass: manufacturingBalance.internalScrapMass, composition: targetComposition, sourceType: 'scrap' },
      recyclingYield,
      slagPercent
    );

    const valorization = computeValorizationResult(recyclingResult.slagMass, valorizationRate);

    return {
      manufacturingBalance,
      totalCharge,
      primaryMass: totalCharge * primaryShare,
      secondaryMass: totalCharge * secondaryShare,
      calculatedMelt: melt,
      effectiveMelt: compositionForAdditions,
      additions,
      recyclingResult,
      valorization,
    };
  }, [finalProductMass, scrapRatePercent, materialSourceInfo, recyclingData, targetComposition, useMeasuredComposition, measuredComposition]);

  // Trigger validation when component mounts with existing data
  React.useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      trigger();
    }
  }, []);

  // Modified AI prediction handler
  const handleGenerateAIPrediction = async (formData) => {
    if (onGenerateAIPrediction) {
      await onGenerateAIPrediction(formData);
    }
  };

  const onSubmit = (data) => { onSave?.(data); onNext?.() }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
      onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
      isCalculatingLca={isCalculatingLca}
      showSustainableButton
      onShowSustainable={() => {
        setCurrentSustainableStage?.('manufacturing');
        setFormDataForSustainable?.(form.getValues());
        setShowSustainableSolutions?.(true);
      }}
    />
  )

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={5}
        badgeLabel="Manufacturing"
        title="Manufacturing"
        description="Select processes, then fill in required logistics and casting details as applicable."
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. Select Applicable Processes */}
            <FormField control={control} name="processes" render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className={GROUP_HEADING_TEXT}>Select Applicable Processes</FormLabel>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {processOptions.map((opt) => (
                    <FormField key={opt.id} control={control} name="processes" render={({ field }) => (
                      <CardCheckbox
                        id={`mfg-proc-${opt.id}`}
                        label={opt.label}
                        checked={field.value?.includes(opt.id)}
                        onChange={(checked) => {
                          const next = new Set(field.value || [])
                          if (checked) next.add(opt.id); else next.delete(opt.id)
                          field.onChange(Array.from(next))
                        }}
                      />
                    )} />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {selectedProcesses?.includes('others') && (
              <FormField control={control} name="processOthers" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Other Process</FormLabel>
                  <FormControl><Input placeholder="Specify other process" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* 2. Process Details and Metrics */}
            {selectedProcesses?.includes('casting') && (
              <FormField control={control} name="castingProcesses" render={() => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Manufacturing Process - Casting*</FormLabel>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {castingOptions.map((opt) => (
                      <FormField key={opt.id} control={control} name="castingProcesses" render={({ field }) => (
                        <CardCheckbox
                          id={`casting-${opt.id}`}
                          label={opt.label}
                          checked={field.value?.includes(opt.id)}
                          onChange={(checked) => {
                            const next = new Set(field.value || [])
                            if (checked) next.add(opt.id); else next.delete(opt.id)
                            field.onChange(Array.from(next))
                          }}
                        />
                      )} />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Required Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={control} name="finalProductMass" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Final Product Mass (kg)*</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.1" placeholder="e.g., 1000" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="scrapRate" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Scrap Rate (%)*</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" step="0.1" placeholder="e.g., 15" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="transportDistance" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Transport Distance (km)*</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 120" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <hr className="my-8 border-gray-200" />

            {/* Target alloy and loop preview */}
            <div className="rounded-3xl border border-[#e7dfd2] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Target Alloy Composition (Manufacturing ↔ Recycling)</h3>
                  {/* Alloy preset selector */}
                  <div className="mt-3 mb-3 p-3 rounded-lg border border-green-200 bg-green-50">
                    <label className="block text-sm font-medium text-gray-800 mb-2">🎯 Choose Alloy Preset (or select Custom to enter manually)</label>
                    <select value={selectedPreset} onChange={(e) => { const preset = e.target.value; setSelectedPreset(preset); if (preset !== 'custom' && ALLOY_PRESETS[preset]) { const comp = ALLOY_PRESETS[preset]; setValue('targetAlPercent', comp.Al); setValue('targetCuPercent', comp.Cu || 0); setValue('targetMgPercent', comp.Mg || 0); setValue('targetSiPercent', comp.Si || 0); setValue('targetOthersPercent', comp.Others || 0); }}} className="w-full rounded-lg border border-green-300 bg-white px-3 py-2 text-sm font-medium focus:border-[#BA7967] focus:ring-2 focus:ring-[#BA7967]">
                      {Object.entries(ALLOY_PRESETS).map(([key, preset]) => (<option key={key} value={key}>{preset.name}</option>))}
                    </select>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">Set the desired alloy; we’ll compare against the melt and show make-up additions plus the recycling loop back to manufacturing.</p>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <FormField control={control} name="targetAlPercent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aluminium (%)</FormLabel>
                        <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); setSelectedPreset('custom'); }} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={control} name="targetCuPercent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copper (%)</FormLabel>
                        <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); setSelectedPreset('custom'); }} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={control} name="targetMgPercent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Magnesium (%)</FormLabel>
                        <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); setSelectedPreset('custom'); }} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={control} name="targetSiPercent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Silicon (%)</FormLabel>
                        <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); setSelectedPreset('custom'); }} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={control} name="targetOthersPercent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Others (%)</FormLabel>
                        <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); setSelectedPreset('custom'); }} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Measured composition toggle and inputs */}
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                    <FormField control={control} name="useMeasuredComposition" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 mb-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            Use Measured Composition (After Melting)
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Check this if you have actual lab measurements after melting. We'll calculate make-up additions based on measured values instead of theoretical calculations.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )} />

                    {useMeasuredComposition && (
                      <>
                        {/* Auto-estimate option */}
                        <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50">
                          <div className="flex items-center gap-3 mb-2">
                            <Checkbox
                              checked={autoEstimateMeasured}
                              onCheckedChange={(checked) => {
                                setAutoEstimateMeasured(checked);
                                if (checked) {
                                  const estimated = estimateMeasuredComposition(targetComposition, scrapQuality, 'mixed');
                                  setValue('measuredAlPercent', Number(estimated.Al.toFixed(2)));
                                  setValue('measuredCuPercent', Number(estimated.Cu.toFixed(2)));
                                  setValue('measuredMgPercent', Number(estimated.Mg.toFixed(2)));
                                  setValue('measuredSiPercent', Number(estimated.Si.toFixed(2)));
                                  setValue('measuredOthersPercent', Number(estimated.Others.toFixed(2)));
                                }
                              }}
                            />
                            <label className="text-sm font-medium text-blue-900">Auto-estimate from scrap quality (for non-metallurgists)</label>
                          </div>
                          {autoEstimateMeasured && (
                            <div className="flex items-center gap-3">
                              <label className="text-sm text-blue-800">Scrap Quality:</label>
                              <select
                                value={scrapQuality}
                                onChange={(e) => {
                                  setScrapQuality(e.target.value);
                                  const estimated = estimateMeasuredComposition(targetComposition, e.target.value, 'mixed');
                                  setValue('measuredAlPercent', Number(estimated.Al.toFixed(2)));
                                  setValue('measuredCuPercent', Number(estimated.Cu.toFixed(2)));
                                  setValue('measuredMgPercent', Number(estimated.Mg.toFixed(2)));
                                  setValue('measuredSiPercent', Number(estimated.Si.toFixed(2)));
                                  setValue('measuredOthersPercent', Number(estimated.Others.toFixed(2)));
                                }}
                                className="rounded border border-blue-300 px-2 py-1 text-sm"
                              >
                                <option value="high">High (post-consumer, sorted)</option>
                                <option value="medium">Medium (mixed scrap)</option>
                                <option value="low">Low (contaminated)</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        <FormField control={control} name="measuredAlPercent" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Measured Al (%)</FormLabel>
                            <FormControl><Input type="number" min="0" max="100" step="0.01" placeholder="e.g., 97" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={control} name="measuredCuPercent" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Measured Cu (%)</FormLabel>
                            <FormControl><Input type="number" min="0" max="100" step="0.01" placeholder="e.g., 3" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={control} name="measuredMgPercent" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Measured Mg (%)</FormLabel>
                            <FormControl><Input type="number" min="0" max="100" step="0.01" placeholder="0" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={control} name="measuredSiPercent" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Measured Si (%)</FormLabel>
                            <FormControl><Input type="number" min="0" max="100" step="0.01" placeholder="0" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={control} name="measuredOthersPercent" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Measured Others (%)</FormLabel>
                            <FormControl><Input type="number" min="0" max="100" step="0.01" placeholder="0" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:w-[320px] rounded-2xl border border-[#e3d4c8] bg-linear-to-br from-[#fbfaf7] via-[#f4f2ec] to-[#efe6dd] p-4 shadow-inner">
                  <h4 className="font-semibold text-gray-900 mb-2">Alloy Balance Preview</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between"><span>Total melt (kg)</span><span>{alloyBalancePreview.totalCharge?.toFixed(1) || '0.0'}</span></div>
                    <div className="flex justify-between"><span>Primary charge (kg)</span><span>{alloyBalancePreview.primaryMass?.toFixed(1) || '0.0'}</span></div>
                    <div className="flex justify-between"><span>Secondary/scrap (kg)</span><span>{alloyBalancePreview.secondaryMass?.toFixed(1) || '0.0'}</span></div>
                    
                    <div className="pt-2 text-xs font-semibold text-gray-600">
                      {useMeasuredComposition ? '📊 Measured Composition:' : '🧪 Calculated Melt Composition:'}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-800">
                      {Object.entries(alloyBalancePreview.effectiveMelt?.composition || {}).map(([el, pct]) => (
                        <div key={el} className="flex justify-between bg-white/60 px-2 py-1 rounded">
                          <span>{el}</span><span>{pct.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-2 text-xs font-semibold text-gray-600">🎯 Target Composition:</div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-800">
                      {Object.entries(targetComposition).filter(([_, pct]) => pct > 0).map(([el, pct]) => (
                        <div key={el} className="flex justify-between bg-green-50 px-2 py-1 rounded border border-green-200">
                          <span>{el}</span><span>{pct.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-2 text-xs font-semibold text-amber-700">⚗️ Virgin Metal to Add:</div>
                    {alloyBalancePreview.additions?.length ? (
                      <>
                        <ul className="space-y-1">
                          {alloyBalancePreview.additions.map((add) => (
                            <li key={add.element} className="flex items-center justify-between bg-amber-100 px-3 py-2 rounded-lg border border-amber-300">
                              <span className="font-semibold text-amber-900">{add.element}</span>
                              <span className="text-amber-800 font-mono">{add.requiredMass.toFixed(2)} kg</span>
                            </li>
                          ))}
                        </ul>
                        {alloyBalancePreview.totalCharge === 0 && useMeasuredComposition && (
                          <p className="text-[10px] text-amber-700 italic mt-1">* Based on 1000 kg reference mass. Enter Final Product Mass above for actual values.</p>
                        )}
                      </>
                    ) : (
                      <div className="text-xs bg-green-100 px-3 py-2 rounded-lg border border-green-300 text-green-800 font-medium">
                        ✓ Already within target window. No additions needed.
                      </div>
                    )}
                    
                    <div className="pt-2 text-xs text-gray-600">♻️ Scrap → Recycling → Back:</div>
                    {alloyBalancePreview.totalCharge > 0 ? (
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span>Internal scrap</span><span>{alloyBalancePreview.recyclingResult?.otherLossesMass !== undefined ? alloyBalancePreview.manufacturingBalance?.internalScrapMass?.toFixed(2) : '0.00'} kg</span></div>
                        <div className="flex justify-between"><span>Recovered metal</span><span>{alloyBalancePreview.recyclingResult?.recoveredMetalMass?.toFixed(2) || '0.00'} kg</span></div>
                        <div className="flex justify-between"><span>Slag/Dross</span><span>{alloyBalancePreview.recyclingResult?.slagMass?.toFixed(2) || '0.00'} kg</span></div>
                        <div className="flex justify-between"><span>Valorized</span><span>{alloyBalancePreview.valorization?.valorizedMass?.toFixed(2) || '0.00'} kg</span></div>
                        <div className="flex justify-between"><span>Landfilled</span><span>{alloyBalancePreview.valorization?.landfilledMass?.toFixed(2) || '0.00'} kg</span></div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-500 italic bg-gray-50 px-2 py-1 rounded">
                        📝 <strong>Recycling Flow:</strong> Shows scrap generated during manufacturing → recovered in recycling stage → split into slag for valorization vs landfill. 
                        Enter Final Product Mass above to see actual scrap flows.
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-[11px] text-gray-500">
                    {useMeasuredComposition 
                      ? 'Using measured post-melt composition to calculate virgin metal additions needed.'
                      : 'Using calculated melt from primary/secondary mix. Enable measured composition for actual lab values.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Required Transport Distance */}
            {/* <FormField control={control} name="transportDistance" render={({ field }) => (
              <FormItem>
                <FormLabel className={GROUP_HEADING_TEXT}>Transport Distance (km)*</FormLabel>
                <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 120" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} /> */}

            <hr className="my-8 border-gray-200" />

            {/* ADVANCED OPTIONS - Collapsible section */}
            <AdvancedOptionsSection title="Advanced Options" defaultOpen={false}>
              <div className="space-y-8">
                {/* Sustainability Section */}
                <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                  <FormField
                    control={control}
                    name="followingSustainableRules"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            Sustainability Focused
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Enable to include sustainability parameters in your manufacturing process
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sustainability Parameters */}
                {watch("followingSustainableRules") === true && (
                  <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                    <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                      Sustainability Parameters
                    </h3>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.design_for_recycling_enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Design for Recycling Enabled</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.scrap_recycled_onsite_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scrap Recycled Onsite (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.transport_mode_rail_or_sea_preferred"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Transport Mode: Rail or Sea Preferred</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.coating_voc_free"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Coating: VOC Free</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.renewable_energy_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renewable Energy (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.product_expected_lifetime_years"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Expected Lifetime (years)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="Years" min="0" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">

                {/* Logistics and Transport */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              <FormField control={control} name="transportMode" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={GROUP_HEADING_TEXT}>Transport Mode</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {transportModes.map((m) => (
                        <CardRadio
                          key={m}
                          id={`transport-${m}`}
                          label={m}
                          selected={field.value === m}
                          onSelect={() => field.onChange(field.value === m ? undefined : m)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {transportMode === 'Others' && (
                <FormField control={control} name="transportModeOthers" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Other Transport Mode</FormLabel>
                    <FormControl><Input placeholder="Specify other transport mode" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={control} name="transportEmissionsPerTkm" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Transport Emissions (kg CO₂e per tonne-km)</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.01" placeholder="e.g., 0.08" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <hr className="my-4 border-gray-200" />

            {/* 3.5. AI-Predictable Fields Section */}
            <div className="space-y-4">
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold`}>AI-Predictable Metrics</h3>
                <p className="text-sm text-gray-600 mt-1">These fields can be auto-filled using AI predictions</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="manufacturing_energy_MJ_per_t_product" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Energy (MJ per tonne product)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('manufacturing_energy_MJ_per_t_product') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="manufacturing_recycled_content_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Recycled Content (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('manufacturing_recycled_content_percent') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="manufacturing_transport_emissions_kgCO2e_per_t" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Transport Emissions (kg CO₂e per tonne)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('manufacturing_transport_emissions_kgCO2e_per_t') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <hr className="my-4 border-gray-200" />

            {/* 4. Product End-Use Impact */}
            <FormField control={control} name="lightweightingSectors" render={() => (
              <FormItem>
                <FormLabel className={GROUP_HEADING_TEXT}>Lightweighting (select applicable sectors)</FormLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {sectors.map((opt) => (
                    <FormField key={opt.id} control={control} name="lightweightingSectors" render={({ field }) => (
                      <CardCheckbox
                        id={`mfg-sector-${opt.id}`}
                        label={opt.label}
                        checked={field.value?.includes(opt.id)}
                        onChange={(checked) => {
                          const next = new Set(field.value || [])
                          if (checked) next.add(opt.id); else next.delete(opt.id)
                          field.onChange(Array.from(next))
                        }}
                      />
                    )} />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {selectedSectors?.includes('others') && (
              <FormField control={control} name="lightweightingOthers" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Other Sector</FormLabel>
                  <FormControl><Input placeholder="Specify other sector" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={control} name="corrosionImpact" render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className={GROUP_HEADING_TEXT}>Corrosion Behavior Impact</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {corrosionOptions.map((opt) => (
                      <CardRadio
                        key={opt.id}
                        id={`cor-${opt.id}`}
                        label={opt.label}
                        selected={field.value === opt.id}
                        onSelect={() => field.onChange(field.value === opt.id ? undefined : opt.id)}
                      />
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

                {watch('corrosionImpact') === 'others' && (
                  <FormField control={control} name="corrosionOthers" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Other Corrosion Impact</FormLabel>
                      <FormControl><Input placeholder="Describe corrosion behavior" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <hr className="my-4 border-gray-200" />

                {/* Sustainability Section */}
                <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                  <FormField
                    control={control}
                    name="followingSustainableRules"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            Sustainability Focused
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Enable to include sustainability parameters in your manufacturing process
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {watch("followingSustainableRules") === true && (
                  <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                    <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                      Sustainability Parameters
                    </h3>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.design_for_recycling_enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Design for Recycling Enabled</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.scrap_recycled_onsite_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scrap Recycled Onsite (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.transport_mode_rail_or_sea_preferred"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Transport Mode: Rail or Sea Preferred</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.surface_treatment_chemical_use_reduced"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Surface Treatment: Chemical Use Reduced</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.coating_voc_free"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Coating: VOC Free</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.renewable_energy_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renewable Energy (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={control}
                        name="sustainabilityParameters.product_expected_lifetime_years"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Expected Lifetime (years)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="Years" min="0" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </AdvancedOptionsSection>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  )
}

// Step 6: Recycling
function RecyclingDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), onCalculateLCA, isCalculatingLca, setShowSustainableSolutions, setCurrentSustainableStage, setFormDataForSustainable }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const processOptions = [
    { id: 'collection', label: 'Collection (scrap gathering – manual or automated)' },
    { id: 'cleaning', label: 'Cleaning (removal of coatings, oils)' },
    { id: 're_alloying', label: 'Re-alloying (composition adjustment)' },
    { id: 'others', label: 'Others' },
    { id: 'sorting', label: 'Sorting' },
    { id: 'remelting', label: 'Remelting (furnace heating – energy intensive)' },
    { id: 'casting_new', label: 'Casting into new products (e.g., cans, construction materials)' },
  ]

  const variantOptions = [
    { id: 'closed_loop', label: 'Closed-loop recycling (same product, high purity, lower emissions)' },
    { id: 'secondary', label: 'Secondary aluminium production (5-10% of primary energy use)' },
    { id: 'open_loop', label: 'Open-loop recycling (different products, potential contamination)' },
    { id: 'others', label: 'Others' },
  ]

  const methodOptions = [
    { id: 'closed-loop', label: 'Closed-loop' },
    { id: 'open-loop', label: 'Open-loop' },
    { id: 'mixed', label: 'Mixed' },
  ]

  const sortingOptions = [
    { id: 'manual', label: 'Manual sorting (labor-intensive, prone to misclassification)' },
    { id: 'optical', label: 'Optical sorting (computer vision + ML, accurate alloy separation)' },
    { id: 'others', label: 'Others' },
  ]

  const schema = z.object({
    processes: z.array(z.string()).default([]),
    processOthers: z.string().nullable().optional(),
    variants: z.array(z.string()).default([]),
    variantOthers: z.string().nullable().optional(),
    scrapInputPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    collectionRatePercent: z.coerce.number().min(0).max(100).nullable().optional(),
    recyclingMethod: z.enum(['closed-loop', 'open-loop', 'mixed']).nullable().optional(),
    recoveryYieldPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    recyclingEfficiencyPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    slagPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    valorizationRatePercent: z.coerce.number().min(0).max(100).nullable().optional(),
    closedLoopPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    openLoopPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    furnaceEnergyDemand: z.coerce.number().min(0).nullable().optional(),
    emissionSavings: z.coerce.number().min(0).nullable().optional(),
    sortingMethods: z.array(z.string()).default([]),
    sortingOthers: z.string().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      collection_rate_percent: z.coerce.number().nullable().optional(),
      sorting_technology_optical_or_advanced: z.boolean().nullable().optional(),
      recovery_yield_percent: z.coerce.number().nullable().optional(),
      recycled_content_in_new_products_percent: z.coerce.number().nullable().optional(),
      renewable_energy_source_mix: z.coerce.number().nullable().optional(),
      emission_reduction_percent: z.coerce.number().nullable().optional(),
    }).nullable().optional(),
  }).superRefine((val, ctx) => {
    if (val.processes?.includes('others') && !val.processOthers?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other process', path: ['processOthers'] })
    }
    if (val.variants?.includes('others') && !val.variantOthers?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other variant', path: ['variantOthers'] })
    }
    if (val.sortingMethods?.includes('others') && !val.sortingOthers?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other sorting method', path: ['sortingOthers'] })
    }
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || { processes: [], variants: [], sortingMethods: [], sustainabilityParameters: {} },
    mode: 'onTouched',
  })

  const { control, handleSubmit, watch, setValue, formState: { isValid }, trigger } = form
  const selectedProcesses = watch('processes')
  const selectedVariants = watch('variants')
  const selectedSorting = watch('sortingMethods')

  // Trigger validation when component mounts with existing data
  React.useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      trigger();
    }
  }, []);

  // Modified AI prediction handler
  const handleGenerateAIPrediction = async (formData) => {
    if (onGenerateAIPrediction) {
      await onGenerateAIPrediction(formData);
    }
  };

  const onSubmit = (data) => { onSave?.(data); onNext?.() }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
      onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
      isCalculatingLca={isCalculatingLca}
      showSustainableButton
      onShowSustainable={() => {
        setCurrentSustainableStage?.('recycling');
        setFormDataForSustainable?.(form.getValues());
        setShowSustainableSolutions?.(true);
      }}
    />
  )

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={6}
        badgeLabel="Recycling"
        title="Recycling"
        description="Define processes, variants, and core metrics for recycling."
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. Select Applicable Processes */}
            <FormField control={control} name="processes" render={() => (
              <FormItem>
                <FormLabel className={GROUP_HEADING_TEXT}>Select Applicable Processes</FormLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {processOptions.map((opt) => (
                    <FormField key={opt.id} control={control} name="processes" render={({ field }) => (
                      <CardCheckbox
                        id={`rcy-proc-${opt.id}`}
                        label={opt.label}
                        checked={field.value?.includes(opt.id)}
                        onChange={(checked) => {
                          const next = new Set(field.value || [])
                          if (checked) next.add(opt.id); else next.delete(opt.id)
                          field.onChange(Array.from(next))
                        }}
                      />
                    )} />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {selectedProcesses?.includes('others') && (
              <FormField control={control} name="processOthers" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Other Process</FormLabel>
                  <FormControl><Input placeholder="Specify other process" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Required Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={control} name="scrapInputPercent" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Scrap Input Percentage (% of total feedstock)*</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[typeof field.value === 'number' ? field.value : 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="collectionRatePercent" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Collection Rate (% of available scrap collected)*</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[typeof field.value === 'number' ? field.value : 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={control} name="recyclingMethod" render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className={GROUP_HEADING_TEXT}>Recycling Methods*</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {methodOptions.map((opt) => (
                      <CardRadio
                        key={opt.id}
                        id={`recycle-method-${opt.id}`}
                        label={opt.label}
                        selected={field.value === opt.id}
                        onSelect={() => field.onChange(field.value === opt.id ? undefined : opt.id)}
                      />
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <hr className="my-8 border-gray-200" />

            {/* ADVANCED OPTIONS - Collapsible section */}
            <AdvancedOptionsSection title="Advanced Options" defaultOpen={false}>
              <div className="space-y-8">

                {/* Variants / Enhancements */}
                <FormField control={control} name="variants" render={() => (
              <FormItem>
                <FormLabel className={GROUP_HEADING_TEXT}>Variants / Enhancements</FormLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {variantOptions.map((opt) => (
                    <FormField key={opt.id} control={control} name="variants" render={({ field }) => (
                      <CardCheckbox
                        id={`rcy-var-${opt.id}`}
                        label={opt.label}
                        checked={field.value?.includes(opt.id)}
                        onChange={(checked) => {
                          const next = new Set(field.value || [])
                          if (checked) next.add(opt.id); else next.delete(opt.id)
                          field.onChange(Array.from(next))
                        }}
                      />
                    )} />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {selectedVariants?.includes('others') && (
              <FormField control={control} name="variantOthers" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Other Variant</FormLabel>
                  <FormControl><Input placeholder="Specify other variant" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Optional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={control} name="recoveryYieldPercent" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Recovery Yield (% of aluminium recovered)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[typeof field.value === 'number' ? field.value : 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="slagPercent" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Slag / Dross Generation (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[typeof field.value === 'number' ? field.value : 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="recyclingEfficiencyPercent" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Recycling Efficiency (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[typeof field.value === 'number' ? field.value : 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="closedLoopPercent" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Closed-loop Recycling Percentage (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[typeof field.value === 'number' ? field.value : 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="openLoopPercent" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Open-loop Recycling Percentage (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[typeof field.value === 'number' ? field.value : 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="valorizationRatePercent" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Valorization Rate for Slag/Dross (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[typeof field.value === 'number' ? field.value : 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <hr className="my-4 border-gray-200" />

            {/* 3.5. AI-Predictable Fields Section */}
            <div className="space-y-4">
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold`}>AI-Predictable Metrics</h3>
                <p className="text-sm text-gray-600 mt-1">These fields can be auto-filled using AI predictions</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="recycling_recovery_yield_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Recovery Yield (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('recycling_recovery_yield_percent') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="recycling_energy_kWh_per_t_Al" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Energy (kWh per tonne Al)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('recycling_energy_kWh_per_t_Al') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="recycling_emission_savings_kgCO2e_per_t_Al" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Emission Savings (kg CO₂e per tonne Al)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('recycling_emission_savings_kgCO2e_per_t_Al') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="recycling_closed_loop_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Closed-loop Recycling (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('recycling_closed_loop_percent') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="recycling_open_loop_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Open-loop Recycling (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('recycling_open_loop_percent') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <hr className="my-4 border-gray-200" />

            {/* 4. Energy, Emissions, and Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={control} name="furnaceEnergyDemand" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Furnace Energy Demand (kWh or MJ per tonne)</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 1100" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="emissionSavings" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Emission Savings (kg CO₂e avoided per tonne)</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 11800" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={control} name="sortingMethods" render={() => (
              <FormItem>
                <FormLabel className={GROUP_HEADING_TEXT}>Sorting Methods</FormLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {sortingOptions.map((opt) => (
                    <FormField key={opt.id} control={control} name="sortingMethods" render={({ field }) => (
                      <CardCheckbox
                        id={`rcy-sort-${opt.id}`}
                        label={opt.label}
                        checked={field.value?.includes(opt.id)}
                        onChange={(checked) => {
                          const next = new Set(field.value || [])
                          if (checked) next.add(opt.id); else next.delete(opt.id)
                          field.onChange(Array.from(next))
                        }}
                      />
                    )} />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {selectedSorting?.includes('others') && (
              <FormField control={control} name="sortingOthers" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Other Sorting Method</FormLabel>
                  <FormControl><Input placeholder="Specify other sorting method" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <hr className="my-4 border-gray-200" />

            {/* Sustainability Parameters */}
            <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
              <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                Sustainability Parameters
              </h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="sustainabilityParameters.collection_rate_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection Rate (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.sorting_technology_optical_or_advanced"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Sorting Technology: Optical or Advanced</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.recovery_yield_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recovery Yield (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.downcycling_avoided"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Downcycling Avoided</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.renewable_energy_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renewable Energy (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.end_of_life_tracking_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">End of Life Tracking Enabled</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
              </div>
            </AdvancedOptionsSection>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  )
}

// Step 7: Valorization
function ValorizationDetails({ onNext, onBack, onSave, initialValues, onSubmitSuccess, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), onCalculateLCA, isCalculatingLca, setShowSustainableSolutions, setCurrentSustainableStage, setFormDataForSustainable }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const wasteTypeOptions = [
    { id: 'red_mud', label: 'Red Mud (iron, titanium, rare earths)' },
    { id: 'spl', label: 'Spent Pot Lining (SPL – hazardous cyanide, fluoride)' },
    { id: 'dross', label: 'Dross (aluminium oxide-rich waste)' },
    { id: 'fluoride_gases', label: 'Fluoride Gases (from electrolysis)' },
    { id: 'slag', label: 'Slag (mineral-rich waste)' },
    { id: 'others', label: 'Others' },
  ]

  const methodOptions = [
    { id: 'cement_additive', label: 'Cement additive (red mud replaces clinker → avoids emissions)' },
    { id: 'iron_extraction', label: 'Iron extraction (magnetite recovery → reuse in steel industry)' },
    { id: 'spl_encapsulation', label: 'SPL encapsulation (reduce leaching → safer disposal)' },
    { id: 'fluoride_capture', label: 'Fluoride capture (recovery from gases → reuse)' },
    { id: 'soil_stabilization', label: 'Soil stabilization (improves mechanical properties)' },
    { id: 'rare_earth_extraction', label: 'Rare earth extraction (scandium, titanium → new revenue)' },
    { id: 'dross_recovery', label: 'Dross recovery (melt scrap → reclaim aluminium)' },
    { id: 'others', label: 'Others' },
  ]

  const riskLevels = ['low', 'moderate', 'high', 'others']
  const econLevels = ['low', 'moderate', 'high']

  const schema = z.object({
    wasteTypes: z.array(z.string()).optional().default([]),
    wasteTypeOthers: z.string().nullable().optional(),
    valorizationMethods: z.array(z.string()).optional().default([]),
    methodsOthers: z.string().nullable().optional(),

    wasteUtilizationOverallPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    emissionReductionsPerTonne: z.coerce.number().min(0).nullable().optional(),

    redMudUtilized: z.coerce.number().min(0).max(100).nullable().optional(),
    splUtilized: z.coerce.number().min(0).max(100).nullable().optional(),
    drossUtilized: z.coerce.number().min(0).max(100).nullable().optional(),
    fluorideUtilized: z.coerce.number().min(0).max(100).nullable().optional(),
    slagUtilized: z.coerce.number().min(0).max(100).nullable().optional(),

    redMudRecovery: z.coerce.number().min(0).max(100).nullable().optional(),
    splRecovery: z.coerce.number().min(0).max(100).nullable().optional(),
    drossRecovery: z.coerce.number().min(0).max(100).nullable().optional(),
    fluorideRecovery: z.coerce.number().min(0).max(100).nullable().optional(),
    slagRecovery: z.coerce.number().min(0).max(100).nullable().optional(),

    toxicityRedMud: z.enum(['low', 'moderate', 'high', 'others']).nullable().optional(),
    toxicitySPL: z.enum(['low', 'moderate', 'high', 'others']).nullable().optional(),
    toxicityDross: z.enum(['low', 'moderate', 'high', 'others']).nullable().optional(),
    toxicityFluoride: z.enum(['low', 'moderate', 'high', 'others']).nullable().optional(),
    toxicitySlag: z.enum(['low', 'moderate', 'high', 'others']).nullable().optional(),

    groundwaterRedMud: z.enum(['low', 'moderate', 'high', 'others']).nullable().optional(),
    groundwaterSPL: z.enum(['low', 'moderate', 'high', 'others']).nullable().optional(),
    groundwaterDross: z.enum(['low', 'moderate', 'high', 'others']).nullable().optional(),
    groundwaterFluoride: z.enum(['low', 'moderate', 'high', 'others']).nullable().optional(),
    groundwaterSlag: z.enum(['low', 'moderate', 'high', 'others']).nullable().optional(),

    econCementAdditive: z.enum(['low', 'moderate', 'high']).nullable().optional(),
    econSoilStabilization: z.enum(['low', 'moderate', 'high']).nullable().optional(),
    ironExtractionEconomicViability: z.enum(['low', 'moderate', 'high']).nullable().optional(),
    econRareEarthExtraction: z.enum(['low', 'moderate', 'high']).nullable().optional(),
    econSPLEncapsulation: z.enum(['low', 'moderate', 'high']).nullable().optional(),
    econDrossRecovery: z.enum(['low', 'moderate', 'high']).nullable().optional(),
    econFluorideCapture: z.enum(['low', 'moderate', 'high']).nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      red_mud_valorization_rate_percent: z.coerce.number().nullable().optional(),
      dross_valorization_rate_percent: z.coerce.number().nullable().optional(),
      spl_valorization_rate_percent: z.coerce.number().nullable().optional(),
      metal_recovery_rate_percent: z.coerce.number().nullable().optional(),
      circular_economy_integration: z.boolean().nullable().optional(),
      environmental_impact_reduction_percent: z.coerce.number().nullable().optional(),
    }).nullable().optional(),
  }).superRefine((val, ctx) => {
    if (val.wasteTypes?.includes('others') && !val.wasteTypeOthers?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other waste type', path: ['wasteTypeOthers'] })
    }
    if (val.valorizationMethods?.includes('others') && !val.methodsOthers?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other valorization method', path: ['methodsOthers'] })
    }
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || { wasteTypes: [], valorizationMethods: [], sustainabilityParameters: {} },
    mode: 'onTouched',
  })

  const { control, handleSubmit, watch, setValue, formState: { isValid }, trigger } = form
  const selectedWaste = watch('wasteTypes')
  const selectedMethods = watch('valorizationMethods')

  // Trigger validation when component mounts with existing data
  React.useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      trigger();
    }
  }, []);

  // Modified AI prediction handler
  const handleGenerateAIPrediction = async (formData) => {
    if (onGenerateAIPrediction) {
      await onGenerateAIPrediction(formData);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Save the valorization step data
      await onSave?.(data)
      console.log('✅ Valorization step saved successfully')

    } catch (e) {
      console.error('❌ Valorization submission failed:', e)
    }
  }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
      onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
      isCalculatingLca={isCalculatingLca}
      showSustainableButton
      onShowSustainable={() => {
        setCurrentSustainableStage?.('valorization');
        setFormDataForSustainable?.(form.getValues());
        setShowSustainableSolutions?.(true);
      }}
    />
  )

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={7}
        badgeLabel="Valorization"
        title="Valorization"
        description="Waste types, valorization methods, utilization metrics, risks, and viability."
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. Waste Types and Valorization Processes */}
            <div className="space-y-6">
              <FormField control={control} name="wasteTypes" render={() => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Waste Types*</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {wasteTypeOptions.map((opt) => (
                      <FormField key={opt.id} control={control} name="wasteTypes" render={({ field }) => (
                        <CardCheckbox
                          id={`val-waste-${opt.id}`}
                          label={opt.label}
                          checked={field.value?.includes(opt.id)}
                          onChange={(checked) => {
                            const next = new Set(field.value || [])
                            if (checked) next.add(opt.id); else next.delete(opt.id)
                            field.onChange(Array.from(next))
                          }}
                        />
                      )} />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              {selectedWaste?.includes('others') && (
                <FormField control={control} name="wasteTypeOthers" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Other Waste Type</FormLabel>
                    <FormControl><Input placeholder="Specify other waste type" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={control} name="valorizationMethods" render={() => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Valorization Methods*</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {methodOptions.map((opt) => (
                      <FormField key={opt.id} control={control} name="valorizationMethods" render={({ field }) => (
                        <CardCheckbox
                          id={`val-method-${opt.id}`}
                          label={opt.label}
                          checked={field.value?.includes(opt.id)}
                          onChange={(checked) => {
                            const next = new Set(field.value || [])
                            if (checked) next.add(opt.id); else next.delete(opt.id)
                            field.onChange(Array.from(next))
                          }}
                        />
                      )} />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              {selectedMethods?.includes('others') && (
                <FormField control={control} name="methodsOthers" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Other Valorization Method</FormLabel>
                    <FormControl><Input placeholder="Specify other method" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>

            <hr className="my-8 border-gray-200" />

            {/* ADVANCED OPTIONS - Collapsible section */}
            <AdvancedOptionsSection title="Advanced Options" defaultOpen={false}>
              <div className="space-y-6">

            {/* 2. Utilization and Efficiency Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={control} name="wasteUtilizationOverallPercent" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Waste Utilization Percentages (%)*</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[typeof field.value === 'number' ? field.value : 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="emissionReductionsPerTonne" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Emission Reductions via Substitution (kg CO₂e per tonne)</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 210" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="redMudUtilized" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Red Mud Waste Utilized (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider value={[typeof field.value === 'number' ? field.value : 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="splUtilized" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>SPL Waste Utilized (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider value={[typeof field.value === 'number' ? field.value : 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="drossUtilized" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Dross Waste Utilized (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider value={[typeof field.value === 'number' ? field.value : 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="fluorideUtilized" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Fluoride Gases Waste Utilized (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider value={[typeof field.value === 'number' ? field.value : 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="slagUtilized" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Slag Waste Utilized (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider value={[typeof field.value === 'number' ? field.value : 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <hr className="my-4 border-gray-200" />

            {/* 2.5. AI-Predictable Fields Section */}
            <div className="space-y-4">
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold`}>AI-Predictable Metrics</h3>
                <p className="text-sm text-gray-600 mt-1">These fields can be auto-filled using AI predictions</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="valorization_recovery_efficiency_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Recovery Efficiency (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('valorization_recovery_efficiency_percent') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={control} name="valorization_emission_reduction_kgCO2e_per_t_waste" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Emission Reduction (kg CO₂e per tonne waste)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('valorization_emission_reduction_kgCO2e_per_t_waste') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <hr className="my-4 border-gray-200" />

            {/* 3. Recovery Efficiency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={control} name="redMudRecovery" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Red Mud Recovery Efficiency (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider value={[typeof field.value === 'number' ? field.value : 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="splRecovery" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>SPL Recovery Efficiency (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider value={[typeof field.value === 'number' ? field.value : 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="drossRecovery" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Dross Recovery Efficiency (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider value={[typeof field.value === 'number' ? field.value : 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="fluorideRecovery" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Fluoride Gases Recovery Efficiency (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider value={[typeof field.value === 'number' ? field.value : 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={control} name="slagRecovery" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Slag Recovery Efficiency (%)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider value={[typeof field.value === 'number' ? field.value : 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                      <div className="text-sm text-muted-foreground">{(field.value ?? 0)}%</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* 4. Toxicity and Environmental Risk */}
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Toxicity Level (Low / Moderate / High / Others)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: 'toxicityRedMud', label: 'Red Mud Toxicity Level' },
                    { name: 'toxicitySPL', label: 'SPL Toxicity Level' },
                    { name: 'toxicityDross', label: 'Dross Toxicity Level' },
                    { name: 'toxicityFluoride', label: 'Fluoride Gases Toxicity Level' },
                    { name: 'toxicitySlag', label: 'Slag Toxicity Level' },
                  ].map((f) => (
                    <FormField key={f.name} control={control} name={f.name} render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{f.label}</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {riskLevels.map((lvl) => (
                              <CardRadio
                                key={lvl}
                                id={`${f.name}-${lvl}`}
                                label={lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                                selected={field.value === lvl}
                                onSelect={() => field.onChange(field.value === lvl ? undefined : lvl)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Groundwater Risk (Low / Moderate / High / Others)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: 'groundwaterRedMud', label: 'Red Mud Groundwater Risk' },
                    { name: 'groundwaterSPL', label: 'SPL Groundwater Risk' },
                    { name: 'groundwaterDross', label: 'Dross Groundwater Risk' },
                    { name: 'groundwaterFluoride', label: 'Fluoride Gases Groundwater Risk' },
                    { name: 'groundwaterSlag', label: 'Slag Groundwater Risk' },
                  ].map((f) => (
                    <FormField key={f.name} control={control} name={f.name} render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{f.label}</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {riskLevels.map((lvl) => (
                              <CardRadio
                                key={lvl}
                                id={`${f.name}-${lvl}`}
                                label={lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                                selected={field.value === lvl}
                                onSelect={() => field.onChange(field.value === lvl ? undefined : lvl)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Economic Viability */}
            <div className="space-y-6">
              <h4 className="font-medium">Economic Viability (Low / Moderate / High)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'econCementAdditive', label: 'Cement Additive Economic Viability' },
                  { name: 'econSoilStabilization', label: 'Soil Stabilization Economic Viability' },
                  { name: 'ironExtractionEconomicViability', label: 'Iron Extraction Economic Viability' },
                  { name: 'econRareEarthExtraction', label: 'Rare Earth Extraction Economic Viability' },
                  { name: 'econSPLEncapsulation', label: 'SPL Encapsulation Economic Viability' },
                  { name: 'econDrossRecovery', label: 'Dross Recovery Economic Viability' },
                  { name: 'econFluorideCapture', label: 'Fluoride Capture Economic Viability' },
                ].map((f) => (
                  <FormField key={f.name} control={control} name={f.name} render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{f.label}</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-3">
                          {econLevels.map((lvl) => (
                            <CardRadio
                              key={lvl}
                              id={`${f.name}-${lvl}`}
                              label={lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                              selected={field.value === lvl}
                              onSelect={() => field.onChange(field.value === lvl ? undefined : lvl)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </div>
            </div>

            <hr className="my-4 border-gray-200" />

            {/* Sustainability Parameters */}
            <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
              <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                Sustainability Parameters
              </h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="sustainabilityParameters.red_mud_valorization_rate_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Red Mud Valorization Rate (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.dross_valorization_rate_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dross Valorization Rate (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.spl_valorization_rate_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SPL Valorization Rate (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.metal_recovery_rate_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metal Recovery Rate (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.circular_economy_integration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Circular Economy Integration</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.environmental_impact_reduction_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environmental Impact Reduction (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0-100" min="0" max="100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
              </div>
            </AdvancedOptionsSection>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  )
}


// Clean container without tracking UI, with space for right sidebar tracker on md+
function WizardContainer({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4 sm:p-6 md:pr-86">
      <div className="mx-auto w-full max-w-none md:max-w-[calc(100vw-28rem)] space-y-4 sm:space-y-6">
        {/* This title is now handled inside the MiningProcessDetails card */}
        {/* <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#181814]">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div> */}
        <div>{children}</div>
      </div>
    </div>
  )
}

// Placeholder step fields with Mining-specialized rendering
function StepForm({ stepKey, stepTitle, values, onChange, miningOptions }) {
  if (stepKey === "mining") {
    const { methods = [], locations = [], oreGradeRange } = miningOptions || {}
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#181814]">{stepTitle}</h2>
          <p className="text-sm text-gray-600">Provide mining inputs. Options are derived from the project data.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#181814] mb-1">Mining Method</label>
            <select
              value={values.mining_method || ""}
              onChange={(e) => onChange("mining_method", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] text-sm"
            >
              <option value="" disabled>Select method</option>
              {methods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#181814] mb-1">Ore Grade (%)</label>
            <div className="space-y-2">
              <Slider
                value={[typeof values.mining_ore_grade_percent === 'number' ? values.mining_ore_grade_percent : 0]}
                onValueChange={(v) => onChange("mining_ore_grade_percent", v[0])}
                min={oreGradeRange?.min ?? 0}
                max={oreGradeRange?.max ?? 100}
                step={1}
              />
              <div className="text-sm text-muted-foreground">{(values.mining_ore_grade_percent ?? 0)}%</div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[#181814] mb-1">Location</label>
            <select
              value={values.location || ""}
              onChange={(e) => onChange("location", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] text-sm"
            >
              <option value="" disabled>Select location</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  // Placeholder step fields
  return (
    <Card className="p-4 sm:p-6 bg-[#F3F2EC]">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#181814]">{stepTitle}</h2>
          <p className="text-sm text-gray-600">Provide the details. Replace with real fields later.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${stepKey}-field1`} className="block text-sm font-medium text-[#181814] mb-1">
              {stepTitle} Field 1
            </label>
            <input
              id={`${stepKey}-field1`}
              type="text"
              value={values.field1}
              onChange={(e) => onChange("field1", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] text-sm bg-white"
              placeholder="Enter value"
            />
          </div>
          <div>
            <label htmlFor={`${stepKey}-field2`} className="block text-sm font-medium text-[#181814] mb-1">
              {stepTitle} Field 2
            </label>
            <input
              id={`${stepKey}-field2`}
              type="number"
              value={values.field2}
              onChange={(e) => onChange("field2", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] text-sm bg-white"
              placeholder="Enter number"
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

