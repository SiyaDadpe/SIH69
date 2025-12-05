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
import FallbackConflictModal from "@/components/FallbackConflictModal";
import FallbackReasoningModal from "@/components/FallbackReasoningModal";
import { generateFallbacks } from "@/services/aiFallbackGenerator";

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
  onGenerateFallbacks,
  generatingFallbacks,
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
            <div className="flex flex-col gap-2">
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
              {onGenerateFallbacks && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    type="button"
                    className="bg-[#BA7967] text-white shadow-sm transition-all duration-200 hover:bg-[#a86b5c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={onGenerateFallbacks}
                    disabled={generatingFallbacks}
                  >
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                      ✨
                    </span>
                    {generatingFallbacks 
                      ? "Generating..." 
                      : "Generate Fallbacks"}
                  </Button>
                </motion.div>
              )}
            </div>
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
                console.log('Sustainable button clicked in StepFooterActions');
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
  // Year is optional for Step 1 as per requirements
  year: z.coerce.number().min(1900).max(new Date().getFullYear()).nullable().optional(),
  oreGrade: requiredNumber(0, 100).nullable().optional(),
  overburdenRatio: z.coerce.number().nullable().optional(),
  typeOfEquipment: z.enum(equipmentTypes.map(t => t.toLowerCase())).nullable().optional(),
  waterUsage: z.coerce.number().nullable().optional(),
  biodiversityImpact: z.string().nullable().optional(),
  redMudGeneration: z.coerce.number().nullable().optional(),
  // AI Predicted fields
  mining_energy_MJ_per_t_ore: z.coerce.number().nullable().optional(),
  mining_co2_kg_per_t_ore: z.coerce.number().nullable().optional(),
  mining_sox_kg_per_t_ore: z.coerce.number().nullable().optional(),
  mining_nox_kg_per_t_ore: z.coerce.number().nullable().optional(),
  mining_pm_kg_per_t_ore: z.coerce.number().nullable().optional(),
  // Sustainability Parameters
  followingSustainableRules: z.boolean().nullable().optional(),
  sustainabilityParameters: z.object({
    renewable_energy_percent: z.coerce.number().nullable().optional(),
    water_recycling_rate: z.coerce.number().nullable().optional(),
    biodiversity_offset_area_ha: z.coerce.number().nullable().optional(),
    rehabilitation_progress_percent: z.coerce.number().nullable().optional(),
    community_development_investment: z.coerce.number().nullable().optional(),
    carbon_offset_tonnes: z.coerce.number().nullable().optional(),
  }).nullable().optional(),
});

function MiningProcessDetails({ onNext, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), predictionMetadata = {}, onGenerateFallbacks, generatingFallbacks, setShowSustainableSolutions, setCurrentSustainableStage }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        showSustainableButton
        onShowSustainable={() => { 
          console.log('Mining sustainable button clicked'); 
          setCurrentSustainableStage('mining'); 
          setShowSustainableSolutions(true); 
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
        onGenerateFallbacks={() => onGenerateFallbacks && onGenerateFallbacks(form.getValues())}
        generatingFallbacks={generatingFallbacks}
        footer={footerContent}
      >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Sustainability Checkbox */}
            <div className="mb-6 rounded-lg border border-[#e3d4c8] bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
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
                    name="sustainabilityParameters.renewable_energy_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewable Energy (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
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
                          <Input {...field} type="number" placeholder="0-100" />
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
                          <Input {...field} type="number" placeholder="Hectares" />
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
                          <Input {...field} type="number" placeholder="0-100" />
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
                        <FormLabel>Community Development Investment</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Amount" />
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
                          <Input {...field} type="number" placeholder="Tonnes CO₂" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

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

            <hr className="my-4 border-gray-200" />

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
            </div>

            <hr className="my-4 border-gray-200" />

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

            <hr className="my-4 border-gray-200" />

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
                        type="number"
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
                        type="number"
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
                        type="number"
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
                        type="number"
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
                        type="number"
                        placeholder="AI predicted" 
                        className={aiPopulatedFields.has('mining_pm_kg_per_t_ore') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </form>
      </StepSection>
    </FormProvider>
  );
}


// Step 2: Beneficiation
function BeneficiationDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), predictionMetadata = {}, onGenerateFallbacks, generatingFallbacks, setShowSustainableSolutions, setCurrentSustainableStage }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
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
      water_recycling_rate: z.coerce.number().nullable().optional(),
      energy_from_renewables_percent: z.coerce.number().nullable().optional(),
      tailings_dry_stacking: z.boolean().nullable().optional(),
      chemical_recovery_rate: z.coerce.number().nullable().optional(),
      dust_emission_control_efficiency: z.coerce.number().nullable().optional(),
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
        showSustainableButton
        onShowSustainable={() => { setCurrentSustainableStage('beneficiation'); setShowSustainableSolutions(true); }}
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
        onGenerateFallbacks={() => onGenerateFallbacks && onGenerateFallbacks(form.getValues())}
        generatingFallbacks={generatingFallbacks}
        footer={footerContent}
      >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Sustainability Checkbox */}
            <div className="mb-6 rounded-lg border border-[#e3d4c8] bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
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
              <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                  Sustainability Parameters
                </h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name="sustainabilityParameters.water_recycling_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Water Recycling Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.energy_from_renewables_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Energy from Renewables (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.tailings_dry_stacking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Tailings Dry Stacking</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.chemical_recovery_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chemical Recovery Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.dust_emission_control_efficiency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dust Emission Control Efficiency (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

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

            {/* 2. Operation Details */}
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

            {/* 3. Recovery and Crushing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={control}
                name="beneficiationEfficiency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Beneficiation Efficiency (%)</FormLabel>
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
                name="beneficiation_water_m3_per_t_ore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Usage (m³ per tonne)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="AI predicted" />
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
                      <Input {...field} type="number" placeholder="AI predicted" />
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
                      <Input {...field} placeholder="AI predicted" />
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
                      <Input {...field} placeholder="AI predicted" />
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
                      <Input {...field} placeholder="AI predicted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </form>
      </StepSection>
    </FormProvider>
  )
}


// Main Wizard Form Component
export default function WizardForm({ steps, activeStep, onStepChange, workflowId, workflowData, onWorkflowUpdate, onWorkflowSubmitted, onOpenWorkflow }) {
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
  
  // AI Prediction state management
  const [aiPredictions, setAiPredictions] = useState({})  // Stores all predictions by step
  const [predictionMetadata, setPredictionMetadata] = useState({})  // Stores metadata for each step
  const [aiPopulatedFields, setAiPopulatedFields] = useState({})  // Tracks which fields were populated by AI (for styling)
  
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
    // Simply move to next step - AI predictions are already populated
    if (activeStep < steps.length - 1) {
      onStepChange(activeStep + 1)
    }
  }

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

  // Handle LCA Calculation
  const handleCalculateLCA = async () => {
    if (!workflowId) {
      alert('No workflow found. Please save your progress first.');
      return;
    }

    setIsCalculatingLca(true);
    
    try {
      console.log('📊 [LCA] Starting LCA calculation...');
      console.log('📊 [LCA] Workflow ID:', workflowId);
      console.log('📊 [LCA] Current form values:', formValues);
      
      // Prepare LCA data with current wizard state
      const lcaData = {
        workflowId: workflowId,
        projectName: workflowData?.projectName || 'Aluminum LCA Project',
        location: workflowData?.location || 'Unknown',
        wizardData: formValues // Send current form values
      };
      
      console.log('📊 [LCA] Sending data:', lcaData);
      const lcaResponse = await calculateLCA(lcaData);
      console.log('📊 [LCA] Response received:', lcaResponse);
      
      if (lcaResponse.success) {
        console.log('✅ [LCA] Calculation successful!', lcaResponse.data);
        
        // Extract report data for modal
        const reportData = {
          reportId: lcaResponse.data.reportId,
          projectName: lcaData.projectName,
          pdfUrl: lcaResponse.data.pdfUrl,
          summary: lcaResponse.data.summary || {}
        };
        
        setLcaReportData(reportData);
        setShowLCAModal(true);
      } else {
        console.error('❌ [LCA] Response was not successful:', lcaResponse);
        alert(lcaResponse.message || 'LCA calculation failed');
      }
    } catch (error) {
      console.error('❌ [LCA] Calculation failed:', error);
      console.error('❌ [LCA] Error details:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to calculate LCA';
      alert(`LCA Calculation Error: ${errorMessage}`);
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
            // Normalize field name: replace % with _percent to match frontend schema
            const normalizedFieldName = fieldName.replace(/_(%|percent)$/i, '_percent');
            processedPredictions[normalizedFieldName] = predData.prediction;
            console.log(`✅ [AI Prediction] Extracted ${fieldName} → ${normalizedFieldName} = ${predData.prediction}`);
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

  // Fallback generation handler
  const [generatingFallbacks, setGeneratingFallbacks] = useState(false);
  const [fallbackSuccess, setFallbackSuccess] = useState(null);
  const [fallbackError, setFallbackError] = useState(null);
  const [showSustainableSolutions, setShowSustainableSolutions] = useState(false);
  const [currentSustainableStage, setCurrentSustainableStage] = useState('mining');
  
  // Debug logging for sustainable solutions modal
  useEffect(() => {
    console.log('Sustainable Solutions State Changed:', { showSustainableSolutions, currentSustainableStage });
  }, [showSustainableSolutions, currentSustainableStage]);
  
  // Modal states for conflict detection and reasoning display
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [reasoningModalOpen, setReasoningModalOpen] = useState(false);
  const [pendingFallback, setPendingFallback] = useState(null);
  const [fallbackResults, setFallbackResults] = useState(null);

  /**
   * Intelligent Fallback Generation Handler
   * Uses AI Fallback Generator with scenario matching, dependency rules, and conflict detection
   */
  const handleGenerateFallbacks = async (stepName, currentData) => {
    try {
      setGeneratingFallbacks(true);
      setFallbackError(null);
      setFallbackSuccess(null);
      
      console.log(`🎯 [Intelligent Fallback] Starting for step: ${stepName}`);
      console.log(`📝 [Intelligent Fallback] Current data:`, currentData);
      
      // Get current form values for this step
      const currentStepValues = currentData || formValues[stepName] || {};
      
      // Check if sustainability mode is enabled
      const isSustainable = currentStepValues.followingSustainableRules === true;
      console.log(`🌱 [Intelligent Fallback] Sustainable mode: ${isSustainable}`);
      
      // Generate intelligent fallbacks using the AI Fallback Generator
      const {
        fallbacks: generatedFallbacks,
        reasoning,
        conflicts,
        matchedScenarios
      } = generateFallbacks(stepName, currentStepValues, isSustainable);
      
      console.log(`✨ [Intelligent Fallback] Generated fallbacks:`, generatedFallbacks);
      console.log(`⚠️ [Intelligent Fallback] Conflicts detected: ${conflicts.length}`);
      
      // If conflicts detected, show modal and wait for user decision
      if (conflicts.length > 0) {
        console.log(`🛑 [Intelligent Fallback] Showing conflict modal`);
        setPendingFallback({
          stepName,
          currentStepValues,
          generatedFallbacks,
          reasoning,
          matchedScenarios,
          conflicts
        });
        setConflictModalOpen(true);
        setGeneratingFallbacks(false);
        return;
      }
      
      // No conflicts, proceed with applying fallbacks
      await applyFallbackValues(
        stepName,
        currentStepValues,
        generatedFallbacks,
        reasoning,
        matchedScenarios
      );
      
    } catch (error) {
      console.error('❌ [Intelligent Fallback] Error:', error);
      const errorMessage = error.message || 'Failed to generate intelligent fallback values';
      setFallbackError(`Fallback Error: ${errorMessage}`);
      setTimeout(() => setFallbackError(null), 5000);
    } finally {
      setGeneratingFallbacks(false);
    }
  };

  /**
   * Apply fallback values after conflict resolution
   */
  const applyFallbackValues = async (
    stepName,
    currentStepValues,
    generatedFallbacks,
    reasoning,
    matchedScenarios
  ) => {
    try {
      // Get AI populated field names to exclude them
      const aiFields = aiPopulatedFields[stepName] || new Set();
      
      // Filter: only populate fields that are empty AND not AI-predicted AND not sustainability params
      let populatedCount = 0;
      const updatedFields = {};
      const appliedReasoning = {};
      
      Object.entries(generatedFallbacks).forEach(([fieldName, fallbackValue]) => {
        const currentValue = currentStepValues[fieldName];
        const isAIField = aiFields.has(fieldName);
        const isSustainabilityField = fieldName.startsWith('sustainability');
        
        // Only populate if field is empty and not AI-predicted and not sustainability
        const isEmpty = currentValue === null || 
                       currentValue === undefined || 
                       currentValue === '' ||
                       (typeof currentValue === 'number' && isNaN(currentValue));
        
        if (isEmpty && !isAIField && !isSustainabilityField) {
          updatedFields[fieldName] = fallbackValue;
          appliedReasoning[fieldName] = reasoning[fieldName];
          populatedCount++;
        }
      });
      
      console.log(`✅ [Intelligent Fallback] Will populate ${populatedCount} fields:`, Object.keys(updatedFields));
      
      // Save to backend and update formValues
      if (populatedCount > 0) {
        const updatedStepData = {
          ...currentStepValues,
          ...updatedFields
        };
        
        console.log(`📝 [Intelligent Fallback] Updated step data:`, updatedStepData);
        
        // Update formValues state - this will trigger form re-render with new initialValues
        setFormValues(prev => {
          const newFormValues = {
            ...prev,
            [stepName]: updatedStepData
          };
          console.log(`🔄 [Intelligent Fallback] New formValues state:`, newFormValues);
          return newFormValues;
        });
        
        // Small delay to ensure state update propagates before saving
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Save to backend
        await handleSaveStep(stepName, updatedStepData);
        
        // Store results for reasoning modal
        setFallbackResults({
          stepName,
          populatedCount,
          reasoning: appliedReasoning,
          matchedScenarios
        });
        
        // Show reasoning modal
        setReasoningModalOpen(true);
        
        setFallbackSuccess(
          `✨ Successfully populated ${populatedCount} intelligent fallback values`
        );
      } else {
        setFallbackSuccess(
          `ℹ️ All fields are already filled or predicted by AI`
        );
      }
      
      setTimeout(() => setFallbackSuccess(null), 5000);
      
      return {
        success: true,
        populatedCount
      };
      
    } catch (error) {
      console.error('❌ [Intelligent Fallback] Error applying values:', error);
      const errorMessage = error.message || 'Failed to apply fallback values';
      setFallbackError(`Fallback Error: ${errorMessage}`);
      setTimeout(() => setFallbackError(null), 5000);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  /**
   * Handle user proceeding despite conflicts
   */
  const handleConflictProceed = async () => {
    if (!pendingFallback) return;
    
    const {
      stepName,
      currentStepValues,
      generatedFallbacks,
      reasoning,
      matchedScenarios
    } = pendingFallback;
    
    setConflictModalOpen(false);
    setPendingFallback(null);
    setGeneratingFallbacks(true);
    
    await applyFallbackValues(
      stepName,
      currentStepValues,
      generatedFallbacks,
      reasoning,
      matchedScenarios
    );
    
    setGeneratingFallbacks(false);
  };

  /**
   * Handle user canceling after seeing conflicts
   */
  const handleConflictCancel = () => {
    setConflictModalOpen(false);
    setPendingFallback(null);
    setFallbackError('Fallback generation cancelled due to conflicts');
    setTimeout(() => setFallbackError(null), 3000);
  };

  const renderStep = () => {
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
            onGenerateFallbacks={(data) => handleGenerateFallbacks('mining', data)}
            generatingFallbacks={generatingFallbacks}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
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
            onGenerateFallbacks={(data) => handleGenerateFallbacks('beneficiation', data)}
            generatingFallbacks={generatingFallbacks}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
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
            onGenerateFallbacks={(data) => handleGenerateFallbacks('refining', data)}
            generatingFallbacks={generatingFallbacks}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
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
            onGenerateFallbacks={(data) => handleGenerateFallbacks('smelting', data)}
            generatingFallbacks={generatingFallbacks}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
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
            onGenerateFallbacks={(data) => handleGenerateFallbacks('manufacturing', data)}
            generatingFallbacks={generatingFallbacks}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
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
            onGenerateFallbacks={(data) => handleGenerateFallbacks('recycling', data)}
            generatingFallbacks={generatingFallbacks}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
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
            onGenerateFallbacks={(data) => handleGenerateFallbacks('valorization', data)}
            generatingFallbacks={generatingFallbacks}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
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

      {/* Fallback Generation Notifications */}
      {fallbackError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 animate-in slide-in-from-top">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Fallback Generation Failed</p>
              <p className="text-sm mt-1">{fallbackError}</p>
            </div>
          </div>
        </div>
      )}

      {fallbackSuccess && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 animate-in slide-in-from-top">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Fallback Values Generated!</p>
              <p className="text-sm mt-1">{fallbackSuccess}</p>
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
      
      {/* Fallback Conflict Detection Modal */}
      <FallbackConflictModal
        isOpen={conflictModalOpen}
        onClose={handleConflictCancel}
        onProceed={handleConflictProceed}
        conflicts={pendingFallback?.conflicts || []}
        stepName={pendingFallback?.stepName || ''}
      />
      
      {/* Fallback Reasoning Display Modal */}
      <FallbackReasoningModal
        isOpen={reasoningModalOpen}
        onClose={() => setReasoningModalOpen(false)}
        reasoning={fallbackResults?.reasoning || {}}
        matchedScenarios={fallbackResults?.matchedScenarios || []}
        populatedCount={fallbackResults?.populatedCount || 0}
        stepName={fallbackResults?.stepName || ''}
      />

      {/* Sustainable Solutions Modal */}
      <AnimatePresence>
        {showSustainableSolutions && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSustainableSolutions(false)}
          >
            <motion.div
              className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b pb-3 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Sustainable Solutions – {currentSustainableStage.charAt(0).toUpperCase() + currentSustainableStage.slice(1)}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Byproducts and sustainable alternatives suggested by the LCA engine for this stage.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setShowSustainableSolutions(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-3 text-sm text-gray-800">
                {currentSustainableStage === 'mining' && (
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      <span className="font-semibold">Overburden & waste rock</span> – stripped soil, rock, clays — backfilling & land rehabilitation, bund construction, noise berms.
                    </li>
                    <li>
                      <span className="font-semibold">Topsoil</span> – if stripped and stored — road base, embankments, aggregate in local construction, mine road surfacing.
                    </li>
                    <li>
                      <span className="font-semibold">Dust (PM₁₀ / PM₂.₅)</span> – drilling, blasting, haul roads — improve dust suppression plans, use covered conveyors, vegetative barriers.
                    </li>
                    <li>
                      <span className="font-semibold">Mine drainage</span> – possibly with high suspended solids; occasionally alkaline/metal-bearing — settling ponds, constructed wetlands, reuse for dust suppression.
                    </li>
                    <li>
                      <span className="font-semibold">Diesel fumes & GHGs</span> – from trucks, excavators — switch to hybrid/electric haul trucks, optimize routes, idle reduction.
                    </li>
                    <li>
                      <span className="font-semibold">Noise & vibration</span> – blasting — blast optimization, scheduling.
                    </li>
                  </ul>
                )}
                {currentSustainableStage === 'beneficiation' && (
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      <span className="font-semibold">Tailings (slurry)</span> – fine clays, silica, iron oxides in water — thickened tailings, dry stacking, or backfilling pits; use in bricks, tiles, road base where feasible.
                    </li>
                    <li>
                      <span className="font-semibold">Process water</span> – solids and reagents (flocculants, dispersants) — closed-loop reuse in washing circuits.
                    </li>
                    <li>
                      <span className="font-semibold">Dust</span> – from crushing, dry screening — bag filters, water sprays, enclosures. Fine residue → cement raw mix, soil conditioning after treatment.
                    </li>
                    <li>
                      <span className="font-semibold">Noise</span> – crushers, mills — acoustic enclosures.
                    </li>
                  </ul>
                )}
                {currentSustainableStage === 'refining' && (
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      <span className="font-semibold">Red mud / bauxite residue</span> – highly alkaline sludge containing Fe₂O₃, TiO₂, residual Al₂O₃, silica, minor REEs — cement & clinker substitute (part replacement), brick/ceramic products, iron recovery (magnetite), TiO₂ extraction, rare earth recovery, soil stabilization for roads/foundations (after neutralization).
                    </li>
                    <li>
                      <span className="font-semibold">Spent caustic liquor</span> – NaOH-rich streams — caustic recovery, neutralization & reuse.
                    </li>
                    <li>
                      <span className="font-semibold">Gypsum / scale</span> – from lime use and precipitation — sell to gypsum into cement/board industry.
                    </li>
                    <li>
                      <span className="font-semibold">Evaporator condensates</span> — reuse as process water.
                    </li>
                    <li>
                      <span className="font-semibold">Air emissions</span> – dust, some NOₓ/SO₂ from heating — electrostatic precipitators, scrubbers.
                    </li>
                  </ul>
                )}
                {currentSustainableStage === 'smelting' && (
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      <span className="font-semibold">CO₂ from carbon anodes</span> – huge energy-related GHG footprint — focus on energy efficiency and low-carbon power.
                    </li>
                    <li>
                      <span className="font-semibold">Dross & skim</span> – oxide-rich layer from casting — dross recovery plants to reclaim metal.
                    </li>
                    <li>
                      <span className="font-semibold">Spent Pot Lining (SPL)</span> – hazardous waste with cyanide and fluorides — encapsulation in cement, high-temp vitrification, or controlled co-processing in cement kilns.
                    </li>
                    <li>
                      <span className="font-semibold">Fluoride gases & particulates</span> – HF, particulate alumina/cryolite — dry/wet scrubbers, recovery of fluoride salts back to bath.
                    </li>
                    <li>
                      <span className="font-semibold">Waste heat</span> – off-gases at high temperature — heat recovery for pre-heating combustion air, buildings, or low-temp processes.
                    </li>
                    <li>
                      <span className="font-semibold">PFCs (perfluorocarbons)</span> during anode effects — green variants: inert anodes, renewable electricity contracts.
                    </li>
                  </ul>
                )}
                {currentSustainableStage === 'manufacturing' && (
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      <span className="font-semibold">Scrap</span> – offcuts, trimmings, machining chips — closed-loop recycling into same product line, on-site remelting.
                    </li>
                    <li>
                      <span className="font-semibold">Dross from remelting</span> — sent to dross recovery.
                    </li>
                    <li>
                      <span className="font-semibold">Spent process chemicals</span> – from anodizing, coating, cleaning — recovery of aluminium salts, proper neutralization, sludge reused in cement.
                    </li>
                    <li>
                      <span className="font-semibold">Used lubricants & coolants</span> — regeneration, energy recovery via co-processing.
                    </li>
                    <li>
                      <span className="font-semibold">Packaging waste at customer end</span> — design for disassembly, mono-material packaging, easy separable fasteners.
                    </li>
                  </ul>
                )}
                {currentSustainableStage === 'recycling' && (
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      <span className="font-semibold">Salt slag / black dross</span> from rotary furnaces — specialized processing to recover aluminium, salts, and inert residue.
                    </li>
                    <li>
                      <span className="font-semibold">Dust & filter cake</span> – with salts and metal oxides — stabilized and used in cement/bricks where allowed.
                    </li>
                    <li>
                      <span className="font-semibold">Non-metallic fraction</span> – plastics, paints, organics from coated scrap — RDF fuel (Refuse Derived Fuel) or pyrolysis.
                    </li>
                    <li>
                      <span className="font-semibold">Off-gases</span> – combustion products — high-efficiency baghouse filtration, heat recovery from furnaces.
                    </li>
                  </ul>
                )}
                {currentSustainableStage === 'valorization' && (
                  <div className="text-center text-gray-500 py-4">
                    Valorization sustainable solutions are similar to recycling stage. Please refer to recycling recommendations.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </WizardContainer>
  )
}

// Step 3: Refining
function RefiningDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), onCalculateLCA, isCalculatingLca, onGenerateFallbacks, generatingFallbacks, setShowSustainableSolutions, setCurrentSustainableStage }) {
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
    // AI Predicted fields
    refining_energy_MJ_per_t_alumina: z.coerce.number().nullable().optional(),
    refining_water_m3_per_t_alumina: z.coerce.number().nullable().optional(),
    refining_red_mud_kg_per_t_alumina: z.coerce.number().nullable().optional(),
    refining_caustic_soda_kg_per_t_alumina: z.coerce.number().nullable().optional(),
    refining_lime_kg_per_t_alumina: z.coerce.number().nullable().optional(),
    refining_so2_kg_per_t_alumina: z.coerce.number().nullable().optional(),
    refining_nox_kg_per_t_alumina: z.coerce.number().nullable().optional(),
    refining_dust_kg_per_t_alumina: z.coerce.number().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      renewable_energy_percent: z.coerce.number().nullable().optional(),
      water_recycling_rate: z.coerce.number().nullable().optional(),
      caustic_recovery_rate: z.coerce.number().nullable().optional(),
      red_mud_utilization_percent: z.coerce.number().nullable().optional(),
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
      onLcaCalculate={onCalculateLCA}
      isCalculatingLca={isCalculatingLca}
      showSustainableButton
      onShowSustainable={() => { setCurrentSustainableStage('refining'); setShowSustainableSolutions(true); }}
    />
  )

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={3}
        badgeLabel="Refining"
        title="Refining"
        description="Fill in refining processes, variants, resource consumption, and emissions. Fields marked with * are required."
        onPredict={() => handleGenerateAIPrediction(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
        onGenerateFallbacks={() => onGenerateFallbacks && onGenerateFallbacks(form.getValues())}
        generatingFallbacks={generatingFallbacks}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Sustainability Checkbox */}
            <div className="mb-6 rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
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
                    name="sustainabilityParameters.renewable_energy_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewable Energy (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
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
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.caustic_recovery_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caustic Recovery Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.red_mud_utilization_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Red Mud Utilization (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.emission_control_efficiency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emission Control Efficiency (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* 1. Processes */}
            <FormField
              control={control}
              name="processes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className={GROUP_HEADING_TEXT}>Select Applicable Processes</FormLabel>
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

            {/* 2. Variants / Enhancements */}
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

            {/* 3. Resource Consumption */}
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

            {/* 5. Toxicity Indicators */}
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
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  )
}

// Step 4: Smelting
function SmeltingDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), onCalculateLCA, isCalculatingLca, onGenerateFallbacks, generatingFallbacks, setShowSustainableSolutions, setCurrentSustainableStage }) {
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
    // AI Predicted fields
    smelting_energy_kWh_per_t_al: z.coerce.number().nullable().optional(),
    smelting_energy_MJ_per_t_al: z.coerce.number().nullable().optional(),
    smelting_co2_kg_per_t_al: z.coerce.number().nullable().optional(),
    smelting_pfc_kg_per_t_al: z.coerce.number().nullable().optional(),
    smelting_so2_kg_per_t_al: z.coerce.number().nullable().optional(),
    smelting_nox_kg_per_t_al: z.coerce.number().nullable().optional(),
    smelting_fluoride_recovery_percent: z.coerce.number().nullable().optional(),
    smelting_thermal_recovery_percent: z.coerce.number().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      renewable_energy_percent: z.coerce.number().nullable().optional(),
      inert_anode_technology: z.boolean().nullable().optional(),
      pfc_capture_rate: z.coerce.number().nullable().optional(),
      thermal_energy_recovery_percent: z.coerce.number().nullable().optional(),
      fluoride_recycling_rate: z.coerce.number().nullable().optional(),
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
      onLcaCalculate={onCalculateLCA}
      isCalculatingLca={isCalculatingLca}
      showSustainableButton
      onShowSustainable={() => { setCurrentSustainableStage('smelting'); setShowSustainableSolutions(true); }}
    />
  )

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={4}
        badgeLabel="Smelting"
        title="Smelting"
        description="Select processes, variants, and enter required energy and emissions data. Fields marked with * are required."
        onPredict={() => handleGenerateAIPrediction(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
        onGenerateFallbacks={() => onGenerateFallbacks && onGenerateFallbacks(form.getValues())}
        generatingFallbacks={generatingFallbacks}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Sustainability Checkbox */}
            <div className="mb-6 rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
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
                    name="sustainabilityParameters.renewable_energy_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewable Energy (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.inert_anode_technology"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Inert Anode Technology</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.pfc_capture_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PFC Capture Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.thermal_energy_recovery_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thermal Energy Recovery (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.fluoride_recycling_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fluoride Recycling Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.carbon_capture_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbon Capture Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* 1. Processes */}
            <FormField control={control} name="processes" render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className={GROUP_HEADING_TEXT}>Select Applicable Processes</FormLabel>
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

            {/* 2. Variants / Enhancements */}
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

            {/* 3. Core Technology and Resource Demand */}
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

            <hr className="my-4 border-gray-200" />

            {/* 4. AI-Predictable Fields Section */}
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
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  )
}

// Step 5: Manufacturing
function ManufacturingDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), onCalculateLCA, isCalculatingLca, onGenerateFallbacks, generatingFallbacks, setShowSustainableSolutions, setCurrentSustainableStage }) {
  const [isSaving, setIsSaving] = useState(false);
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
    processes: z.array(z.string()).min(1, { message: 'Select at least one manufacturing process' }).optional().or(z.array(z.string()).default([])),
    processOthers: z.string().nullable().optional(),
    castingProcesses: z.array(z.string()).default([]),
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
    // AI Predicted fields
    manufacturing_energy_MJ_per_t_product: z.coerce.number().nullable().optional(),
    manufacturing_scrap_rate_percent: z.coerce.number().nullable().optional(),
    manufacturing_recycled_content_percent: z.coerce.number().nullable().optional(),
    manufacturing_transport_emissions_kgCO2e_per_t: z.coerce.number().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      renewable_energy_percent: z.coerce.number().nullable().optional(),
      recycled_content_percent: z.coerce.number().nullable().optional(),
      scrap_recovery_rate: z.coerce.number().nullable().optional(),
      low_carbon_transport_percent: z.coerce.number().nullable().optional(),
      design_for_recyclability: z.boolean().nullable().optional(),
      product_lifetime_years: z.coerce.number().nullable().optional(),
    }).nullable().optional(),
  }).superRefine((val, ctx) => {
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
      onLcaCalculate={onCalculateLCA}
      isCalculatingLca={isCalculatingLca}
      showSustainableButton
      onShowSustainable={() => { setCurrentSustainableStage('manufacturing'); setShowSustainableSolutions(true); }}
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
        onGenerateFallbacks={() => onGenerateFallbacks && onGenerateFallbacks(form.getValues())}
        generatingFallbacks={generatingFallbacks}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Sustainability Checkbox */}
            <div className="mb-6 rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
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
                    name="sustainabilityParameters.renewable_energy_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewable Energy (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.recycled_content_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recycled Content (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.scrap_recovery_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scrap Recovery Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.low_carbon_transport_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Carbon Transport (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.design_for_recyclability"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Design for Recyclability</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.product_lifetime_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Lifetime (years)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Years" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

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
                          id={`mfg-cast-${opt.id}`}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={control} name="scrapRate" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Scrap Rate (% of material lost)*</FormLabel>
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

              <FormField control={control} name="recycledContent" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Recycled Content (%)</FormLabel>
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

              <FormField control={control} name="energyUsePerStep" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Energy Use per Process Step (MJ/t or kWh/t)</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 980" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={control} name="fabricationEmissions" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Emissions from Fabrication (kg CO₂e per tonne)</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 120" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* 3. Logistics and Transport */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={control} name="transportDistance" render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Transport Distance (km)*</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 120" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

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

                <FormField control={control} name="manufacturing_scrap_rate_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Scrap Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('manufacturing_scrap_rate_percent') ? 'ai-populated-field' : ''}
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
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  )
}

// Step 6: Recycling
function RecyclingDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), onCalculateLCA, isCalculatingLca, onGenerateFallbacks, generatingFallbacks, setShowSustainableSolutions, setCurrentSustainableStage }) {
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
    closedLoopPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    openLoopPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    furnaceEnergyDemand: z.coerce.number().min(0).nullable().optional(),
    emissionSavings: z.coerce.number().min(0).nullable().optional(),
    sortingMethods: z.array(z.string()).default([]),
    sortingOthers: z.string().nullable().optional(),
    // AI Predicted fields
    recycling_scrap_input_percent: z.coerce.number().nullable().optional(),
    recycling_recovery_yield_percent: z.coerce.number().nullable().optional(),
    recycling_energy_kWh_per_t_Al: z.coerce.number().nullable().optional(),
    recycling_emission_savings_kgCO2e_per_t_Al: z.coerce.number().nullable().optional(),
    recycling_collection_rate_percent: z.coerce.number().nullable().optional(),
    recycling_closed_loop_percent: z.coerce.number().nullable().optional(),
    recycling_open_loop_percent: z.coerce.number().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      collection_efficiency_percent: z.coerce.number().nullable().optional(),
      sorting_accuracy_percent: z.coerce.number().nullable().optional(),
      energy_from_renewables_percent: z.coerce.number().nullable().optional(),
      closed_loop_target_percent: z.coerce.number().nullable().optional(),
      contamination_rate_percent: z.coerce.number().nullable().optional(),
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
      onLcaCalculate={onCalculateLCA}
      isCalculatingLca={isCalculatingLca}
      showSustainableButton
      onShowSustainable={() => { setCurrentSustainableStage('recycling'); setShowSustainableSolutions(true); }}
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
        onGenerateFallbacks={() => onGenerateFallbacks && onGenerateFallbacks(form.getValues())}
        generatingFallbacks={generatingFallbacks}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Sustainability Checkbox */}
            <div className="mb-6 rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
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
                        Enable to include sustainability parameters in your recycling process
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
                    name="sustainabilityParameters.collection_efficiency_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection Efficiency (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.sorting_accuracy_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sorting Accuracy (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.energy_from_renewables_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Energy from Renewables (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.closed_loop_target_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Closed Loop Target (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.contamination_rate_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contamination Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

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

            {/* 2. Variants / Enhancements */}
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

            {/* 3. Core Metrics and Yield */}
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
            </div>

            <hr className="my-4 border-gray-200" />

            {/* 3.5. AI-Predictable Fields Section */}
            <div className="space-y-4">
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold`}>AI-Predictable Metrics</h3>
                <p className="text-sm text-gray-600 mt-1">These fields can be auto-filled using AI predictions</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="recycling_scrap_input_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Scrap Input (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('recycling_scrap_input_percent') ? 'ai-populated-field' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

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

                <FormField control={control} name="recycling_collection_rate_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Collection Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        placeholder="AI predicted" 
                        {...field} 
                        value={field.value ?? ''} 
                        className={aiPopulatedFields.has('recycling_collection_rate_percent') ? 'ai-populated-field' : ''}
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
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  )
}

// Step 7: Valorization
function ValorizationDetails({ onNext, onBack, onSave, initialValues, onSubmitSuccess, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), onCalculateLCA, isCalculatingLca, onGenerateFallbacks, generatingFallbacks, setShowSustainableSolutions, setCurrentSustainableStage }) {
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
    wasteTypes: z.array(z.string()).min(1, { message: 'Select at least one waste type' }).optional().or(z.array(z.string()).default([])),
    wasteTypeOthers: z.string().nullable().optional(),
    valorizationMethods: z.array(z.string()).min(1, { message: 'Select at least one valorization method' }).optional().or(z.array(z.string()).default([])),
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
    // AI Predicted fields
    valorization_recovery_efficiency_percent: z.coerce.number().nullable().optional(),
    valorization_emission_reduction_kgCO2e_per_t_waste: z.coerce.number().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      waste_valorization_rate_percent: z.coerce.number().nullable().optional(),
      emission_reduction_per_tonne: z.coerce.number().nullable().optional(),
      circular_economy_integration: z.boolean().nullable().optional(),
      zero_waste_target_progress_percent: z.coerce.number().nullable().optional(),
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
    console.log('💾 [Valorization] Form submission started');
    console.log('📋 [Valorization] Form data:', data);
    
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      console.log('💾 [Valorization] Calling onSave...');
      await onSave?.(data);
      console.log('✅ [Valorization] Step saved successfully');
      
      setSaveSuccess(true);
      
      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use onNext logic just like other steps (don't trigger final submission)
      console.log('➡️  [Valorization] Calling onNext');
      if (onNext) {
        onNext();
      }
    } catch (e) {
      console.error('❌ [Valorization] Submission failed:', e);
      setSaveError(e.message || 'Failed to save valorization data');
    } finally {
      setIsSaving(false);
    }
  }

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
      <StepFooterActions
        onBack={onBack}
        onForward={handleSubmit(onSubmit)}
        forwardDisabled={!isValid || isSaving}
        forwardLabel={isSaving ? '💾 Saving...' : (onSubmitSuccess ? 'Submit' : 'Next')}
        onLcaCalculate={onCalculateLCA}
        isCalculatingLca={isCalculatingLca}
        showSustainableButton
        onShowSustainable={() => { setCurrentSustainableStage('valorization'); setShowSustainableSolutions(true); }}
      />
    </>
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
        onGenerateFallbacks={() => onGenerateFallbacks && onGenerateFallbacks(form.getValues())}
        generatingFallbacks={generatingFallbacks}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Sustainability Checkbox */}
            <div className="mb-6 rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
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
                        Enable to include sustainability parameters in your valorization process
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
                    name="sustainabilityParameters.waste_valorization_rate_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waste Valorization Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.emission_reduction_per_tonne"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emission Reduction per Tonne (kg CO₂)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="kg CO₂" />
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
                    name="sustainabilityParameters.zero_waste_target_progress_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zero Waste Target Progress (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
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
                          <Input {...field} type="number" placeholder="0-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

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

