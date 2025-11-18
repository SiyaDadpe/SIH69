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
  validateRequiredFields 
} from "@/services/aiPredictionService";
import { calculateLCA, downloadLCAReport } from "@/services/lcaService";
import { toast } from "sonner";
// Removed other data imports to avoid pre-filling from dataset
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
                  {predicting ? "Predicting..." : "Generate AI Predictions"}
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

function StepFooterActions({ onBack, onForward, forwardDisabled, forwardLabel = 'Next', showLca = true }) {
  const handleForwardClick = () => {
    if (typeof onForward === 'function') {
      onForward()
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
        {showLca && (
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.04 }}
          >
            <Button
              type="button"
              className="relative overflow-hidden bg-linear-to-r from-[#ef5350] to-[#ff8a65] text-white shadow-md transition-all duration-200 hover:from-[#e53935] hover:to-[#ff7043]"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-200 hover:opacity-100" />
              <span className="relative">Calculate LCA Score</span>
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

const locations = [...new Set(miningData.map((d) => d.location))];
const equipmentTypes = ["Diesel", "Electric", "Hybrid"];
const biodiversityImpacts = [
    { id: "low", label: "Low – Minimal disruption, already cleared land" },
    { id: "moderate", label: "Moderate – Some clearing required, limited wildlife impact" },
    { id: "high", label: "High – Large-scale forest clearing, high ecological loss" },
];

const formSchema = z.object({
  applicableProcesses: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
  others: z.string().optional(),
  location: z.string({ required_error: "Location is required." }),
  // Year is optional for Step 1 as per requirements
  year: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
  oreGrade: z.coerce.number().min(0).max(100),
  overburdenRatio: z.coerce.number().optional(),
  typeOfEquipment: z.enum(equipmentTypes.map(t => t.toLowerCase())).optional(),
  waterUsage: z.coerce.number().optional(),
  biodiversityImpact: z.string().optional(),
  redMudGeneration: z.coerce.number().optional(),
});

function MiningProcessDetails({ onNext, onSave, initialValues, onGenerateAIPrediction, predicting, onCalculateLCA, calculatingLCA }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      applicableProcesses: [],
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    control,
    watch,
    formState: { isValid, errors },
  } = form;

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
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={control}
                  name="applicableProcesses"
                  render={() => (
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
                        {miningProcesses.map((item) => (
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
              </form>
            </Form>
          </StepSection>
        </FormProvider>
      );
}


// Step 2: Beneficiation
function BeneficiationDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, onCalculateLCA, calculatingLCA }) {
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

  const schema = z.object({
    processes: z.array(z.string()).min(1, { message: "Select at least one process" }),
    processOthers: z.string().optional(),
    location: z.string({ required_error: "Location is required" }),
    oreFeedRate: z.coerce.number().min(0, { message: "Must be >= 0" }),
    waterConsumption: z.coerce.number().min(0).optional(),
    electricityUse: z.coerce.number().min(0).optional(),
    beneficiationEfficiency: z.coerce.number().min(0).max(100).optional(),
    crushingSelections: z.array(z.string()).default([]),
    chemicalAgents: z.array(z.string()).default([]),
    chemicalOthers: z.string().optional(),
    tailings: z.string().optional(),
    tailingsOthers: z.string().optional(),
    noiseLevel: z.string().optional(),
    dustLevel: z.string().optional(),
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      processes: [],
      crushingSelections: [],
    },
    mode: "onChange",
  })

  const { control, handleSubmit, watch, formState: { isValid } } = form

  const selectedProcesses = watch("processes")
  const selectedTailings = watch("tailings")
  const selectedChemicals = watch("chemicalAgents")

  const onSubmit = (data) => {
    onSave?.(data)
    onNext?.()
  }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
    />
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={2}
        badgeLabel="Beneficiation"
        title="Beneficiation"
        description="Provide beneficiation process details. Fields marked with * are required."
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* 1. Select Applicable Processes */}
                <FormField
                  control={control}
                  name="processes"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className={GROUP_HEADING_TEXT}>Select Applicable Processes*</FormLabel>
                        <FormDescription>Choose all processes that apply.</FormDescription>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                  <div className="space-y-2">
                    <FormLabel className={GROUP_HEADING_TEXT}>Crushing</FormLabel>
                    <FormDescription>Select stages involved.</FormDescription>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {crushingOptions.map((c) => (
                        <FormField key={c.id} control={control} name="crushingSelections" render={({ field }) => (
                          <CardCheckbox
                            id={`ben-crush-${c.id}`}
                            label={c.label}
                            checked={field.value?.includes(c.id)}
                            onChange={(checked) => {
                              const next = new Set(field.value || [])
                              if (checked) next.add(c.id); else next.delete(c.id)
                              field.onChange(Array.from(next))
                            }}
                          />
                        )} />
                      ))}
                    </div>
                    <FormMessage />
                  </div>
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
              </form>
            </Form>
          </StepSection>
        </FormProvider>
      )
}


// Main Wizard Form Component
export default function WizardForm({ steps, activeStep, onStepChange, workflowId, workflowData, onWorkflowUpdate, onWorkflowSubmitted }) {
  const [formValues, setFormValues] = useState({})
  const [completed, setCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [predictionError, setPredictionError] = useState(null)
  const [predictionSuccess, setPredictionSuccess] = useState(null)
  const [calculatingLCA, setCalculatingLCA] = useState(false)

  // Load existing workflow data into form values
  React.useEffect(() => {
    if (workflowData) {
      const values = {}
      steps.forEach(step => {
        if (workflowData[step.key]) {
          values[step.key] = workflowData[step.key]
        }
      })
      setFormValues(values)
    }
  }, [workflowData, steps])

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

  // Helper function to get stage name from step key
  const getStageName = (stepKey) => {
    const stageNames = {
      mining: "Mining & Extraction",
      beneficiation: "Beneficiation",
      refining: "Refining (Bayer Process)",
      smelting: "Smelting (Hall-Héroult)",
      manufacturing: "Manufacturing",
      recycling: "Recycling",
      valorization: "Valorization"
    };
    return stageNames[stepKey] || stepKey;
  };

  // Define required fields for each stage
  const getRequiredFieldsByStage = () => {
    return {
      mining: {
        fields: ['applicableProcesses', 'location', 'oreGrade'],
        labels: {
          applicableProcesses: 'Mining Process',
          location: 'Location',
          oreGrade: 'Ore Grade'
        }
      },
      beneficiation: {
        fields: ['processes', 'oreFeedRate'],
        labels: {
          processes: 'Beneficiation Process',
          oreFeedRate: 'Ore Feed Rate'
        }
      },
      refining: {
        fields: ['energyUse', 'waterUse'],
        labels: {
          energyUse: 'Energy Use',
          waterUse: 'Water Use'
        }
      },
      smelting: {
        fields: ['electricityDemand', 'cellTechnology'],
        labels: {
          electricityDemand: 'Electricity Demand',
          cellTechnology: 'Cell Technology'
        }
      },
      manufacturing: {
        fields: ['processes', 'scrapRate'],
        labels: {
          processes: 'Manufacturing Process',
          scrapRate: 'Scrap Rate'
        }
      },
      recycling: {
        fields: ['scrapInputPercent', 'collectionRatePercent'],
        labels: {
          scrapInputPercent: 'Scrap Input Percentage',
          collectionRatePercent: 'Collection Rate'
        }
      },
      valorization: {
        fields: ['wasteTypes', 'valorizationMethods'],
        labels: {
          wasteTypes: 'Waste Types',
          valorizationMethods: 'Valorization Methods'
        }
      }
    };
  };

  // Validate required fields for ONLY the current stage
  const validateRequiredFields = () => {
    const requiredFieldsByStage = getRequiredFieldsByStage();
    const missingFieldsByStage = [];
    
    // Only validate the current stage
    const currentStageKey = stepKey;
    const stepData = formValues[currentStageKey];
    const requiredConfig = requiredFieldsByStage[currentStageKey];
    
    if (!requiredConfig) {
      // No validation rules for this stage
      return [];
    }
    
    // Check if this stage has any data at all
    if (!stepData || Object.keys(stepData).length === 0) {
      // Stage is completely empty - check if required fields exist
      const missingFields = requiredConfig.fields.map(fieldName => ({
        field: fieldName,
        label: requiredConfig.labels[fieldName] || fieldName
      }));
      
      if (missingFields.length > 0) {
        return [{
          stage: currentStageKey,
          stageName: getStageName(currentStageKey),
          missingFields: missingFields
        }];
      }
      return [];
    }
    
    // If stage has some data, validate required fields
    const missingFields = [];
    
    requiredConfig.fields.forEach(fieldName => {
      const value = stepData[fieldName];
      
      // Check if field is empty or invalid
      if (value === undefined || value === null || value === '') {
        missingFields.push({
          field: fieldName,
          label: requiredConfig.labels[fieldName] || fieldName
        });
      } else if (Array.isArray(value) && value.length === 0) {
        missingFields.push({
          field: fieldName,
          label: requiredConfig.labels[fieldName] || fieldName
        });
      } else if (typeof value === 'number' && isNaN(value)) {
        missingFields.push({
          field: fieldName,
          label: requiredConfig.labels[fieldName] || fieldName
        });
      }
    });
    
    if (missingFields.length > 0) {
      missingFieldsByStage.push({
        stage: currentStageKey,
        stageName: getStageName(currentStageKey),
        missingFields: missingFields
      });
    }
    
    return missingFieldsByStage;
  };

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
        // Save the step data
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
        wasteUtilizationOverallPercent: 'waste_utilization_percentages'
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

  // Handle Calculate LCA Score
  const handleCalculateLCA = async (currentFormData = null) => {
    console.log('📊 [LCA Calculation] Button clicked');
    console.log('📊 [LCA Calculation] Form values (state):', formValues);
    console.log('📊 [LCA Calculation] Current form data (passed):', currentFormData);
    console.log('📊 [LCA Calculation] Workflow ID:', workflowId);
    console.log('📊 [LCA Calculation] Current Step:', activeStep, '- Step Key:', stepKey);
    
    if (!workflowId) {
      toast.error("No workflow ID available. Please save your workflow first.");
      return;
    }

    // If current form data is passed, update formValues with it for validation
    let dataToValidate = formValues;
    if (currentFormData) {
      console.log('📝 [LCA Calculation] Using current form data for validation');
      dataToValidate = {
        ...formValues,
        [stepKey]: currentFormData
      };
      // Also update the state so it's available for the API call
      setFormValues(dataToValidate);
    }

    // Validate required fields for ONLY the current stage
    console.log('🔍 [LCA Calculation] Running validation for current stage only:', stepKey);
    console.log('🔍 [LCA Calculation] Current stage data:', dataToValidate[stepKey]);
    
    // Validate using the updated data
    const requiredFieldsByStage = getRequiredFieldsByStage();
    const currentStageKey = stepKey;
    const stepData = dataToValidate[currentStageKey];
    const requiredConfig = requiredFieldsByStage[currentStageKey];
    
    const validationErrors = [];
    
    if (requiredConfig) {
      // Check if this stage has any data at all
      if (!stepData || Object.keys(stepData).length === 0) {
        const missingFields = requiredConfig.fields.map(fieldName => ({
          field: fieldName,
          label: requiredConfig.labels[fieldName] || fieldName
        }));
        
        if (missingFields.length > 0) {
          validationErrors.push({
            stage: currentStageKey,
            stageName: getStageName(currentStageKey),
            missingFields: missingFields
          });
        }
      } else {
        // If stage has some data, validate required fields
        const missingFields = [];
        
        requiredConfig.fields.forEach(fieldName => {
          const value = stepData[fieldName];
          
          // Check if field is empty or invalid
          if (value === undefined || value === null || value === '') {
            missingFields.push({
              field: fieldName,
              label: requiredConfig.labels[fieldName] || fieldName
            });
          } else if (Array.isArray(value) && value.length === 0) {
            missingFields.push({
              field: fieldName,
              label: requiredConfig.labels[fieldName] || fieldName
            });
          } else if (typeof value === 'number' && isNaN(value)) {
            missingFields.push({
              field: fieldName,
              label: requiredConfig.labels[fieldName] || fieldName
            });
          }
        });
        
        if (missingFields.length > 0) {
          validationErrors.push({
            stage: currentStageKey,
            stageName: getStageName(currentStageKey),
            missingFields: missingFields
          });
        }
      }
    }
    
    if (validationErrors.length > 0) {
      console.log('❌ [LCA Calculation] Validation failed for current stage:', validationErrors);
      
      // Show error for the current stage's missing fields
      const firstError = validationErrors[0];
      const missingFieldsList = firstError.missingFields
        .map(f => f.label)
        .join(', ');
      
      toast.error(
        `🚫 Please fill all required fields in ${firstError.stageName} before calculating LCA.`,
        {
          description: `Missing: ${missingFieldsList}`,
          duration: 6000,
        }
      );
      return;
    }

    console.log('✅ [LCA Calculation] Current stage validation passed');
    setCalculatingLCA(true);

    try {
      // Map frontend field names to backend field names for all stages
      const mappedWizardData = {};
      const stageNames = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];
      
      stageNames.forEach(stageName => {
        if (formValues[stageName] && Object.keys(formValues[stageName]).length > 0) {
          mappedWizardData[stageName] = mapFormDataToBackendFields(stageName, formValues[stageName]);
          console.log(`📋 [LCA Calculation] Mapped ${stageName}:`, mappedWizardData[stageName]);
        }
      });

      // Prepare LCA calculation data with current stage information
      const lcaData = {
        workflowId: workflowId,
        projectName: workflowData?.name || 'Aluminum Production',
        location: workflowData?.location || formValues.mining?.location || 'Not specified',
        currentStage: stepKey, // Send current stage to backend
        wizardData: mappedWizardData
      };

      console.log('📊 [LCA Calculation] Sending data:', lcaData);

      // Call LCA calculation API
      const response = await calculateLCA(lcaData);

      if (response.success) {
        console.log('✅ [LCA Calculation] Success:', response.data);

        // Show success toast
        const summary = response.data.summary;
        toast.success('✅ LCA Analysis Report Generated Successfully!', {
          description: `Circularity Score: ${summary.circularityScore?.toFixed(1)}% | Energy: ${summary.totalEnergy?.toFixed(2)} MJ | CO₂: ${summary.totalCO2?.toFixed(2)} kg`,
          duration: 8000,
        });

        // Auto-download the report
        setTimeout(() => {
          downloadLCAReport(response.data.pdfUrl, response.data.pdfFilename);
        }, 1000);
      }
    } catch (error) {
      console.error('❌ [LCA Calculation] Error:', error);
      
      toast.error(error.message || "Failed to calculate LCA score. Please try again.");
    } finally {
      setCalculatingLCA(false);
    }
  };

  // Handle AI Prediction
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
    console.log('🔄 [AI Prediction] Mapped keys:', Object.keys(mappedData).join(', '));
    console.log('🔄 [AI Prediction] Mapped values:', Object.entries(mappedData).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join(', '));
    
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
      // Call AI prediction API with mapped data
      const response = await generateStepPrediction(workflowId, stepName, mappedData);
      
      if (response.success && response.data?.combinedData) {
        console.log('✅ [AI Prediction] Predictions received:', response.data.combinedData);
        console.log('📊 [AI Prediction] Metadata:', response.data.predictionMetadata);
        
        // Map the response back to frontend field names for form population
        const frontendData = { ...currentFormData, ...response.data.combinedData };
        
        // Update form values with predicted data
        setFormValues((prev) => ({
          ...prev,
          [stepName]: frontendData
        }));
        
        // Show success message
        const predictedCount = response.data.predictionMetadata.predictedCount;
        const confidence = (response.data.predictionMetadata.confidence * 100).toFixed(1);
        setPredictionSuccess(`🎉 Generated ${predictedCount} predictions with ${confidence}% confidence`);
        
        console.log('✅ [AI Prediction] Form values updated successfully');
        
        // Clear success message after 5 seconds
        setTimeout(() => setPredictionSuccess(null), 5000);
      }
    } catch (error) {
      console.error('❌ [AI Prediction] Error:', error);
      setPredictionError(error.response?.data?.message || 'Failed to generate predictions');
      setTimeout(() => setPredictionError(null), 5000);
    } finally {
      setPredicting(false);
    }
  };

  const renderStep = () => {
    switch(stepKey) {
      case 'mining':
        return (
          <MiningProcessDetails
            onNext={handleNext}
            onSave={(data) => handleSaveStep('mining', data)}
            initialValues={formValues.mining}
            onGenerateAIPrediction={(data) => handleGenerateAIPrediction('mining', data)}
            predicting={predicting}
            onCalculateLCA={handleCalculateLCA}
            calculatingLCA={calculatingLCA}
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
            onCalculateLCA={handleCalculateLCA}
            calculatingLCA={calculatingLCA}
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
            onCalculateLCA={handleCalculateLCA}
            calculatingLCA={calculatingLCA}
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
            onCalculateLCA={handleCalculateLCA}
            calculatingLCA={calculatingLCA}
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
            onCalculateLCA={handleCalculateLCA}
            calculatingLCA={calculatingLCA}
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
            onCalculateLCA={handleCalculateLCA}
            calculatingLCA={calculatingLCA}
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
            onCalculateLCA={handleCalculateLCA}
            calculatingLCA={calculatingLCA}
            onSubmitSuccess={async () => {
              setCompleted(true)
              // Auto-submit workflow after Step 7 completion
              if (workflowId && onWorkflowSubmitted) {
                try {
                  console.log('🚀 Auto-submitting workflow...')
                  const response = await submitWizardWorkflow(workflowId)
                  if (response.success) {
                    console.log('✅ Workflow submitted successfully')
                    onWorkflowSubmitted(response.data)
                  }
                } catch (error) {
                  console.error('❌ Failed to auto-submit workflow:', error)
                }
              }
            }}
            workflowId={workflowId}
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
    </WizardContainer>
  )
}

// Step 3: Refining
function RefiningDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, onCalculateLCA, calculatingLCA }) {
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

  const schema = z.object({
    processes: z.array(z.string()).default([]),
    processOthers: z.string().optional(),
    variants: z.array(z.string()).default([]),
    variantOthers: z.string().optional(),
    energyUse: z.coerce.number().min(0, { message: 'Required and must be >= 0' }),
    waterUse: z.coerce.number().min(0, { message: 'Required and must be >= 0' }),
    redMudGen: z.coerce.number().min(0, { message: 'Required and must be >= 0' }),
    causticSoda: z.coerce.number().min(0).optional(),
    limeAdditives: z.coerce.number().min(0).optional(),
    so2: z.coerce.number().min(0).optional(),
    nox: z.coerce.number().min(0).optional(),
    dust: z.coerce.number().min(0).optional(),
    toxicity: z.string().optional(),
    toxicityOthers: z.string().optional(),
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      processes: [],
      variants: [],
    },
    mode: 'onChange',
  })

  const { control, handleSubmit, watch, formState: { isValid } } = form
  const selectedProcesses = watch('processes')
  const selectedVariants = watch('variants')
  const toxicity = watch('toxicity')

  const onSubmit = (data) => {
    onSave?.(data)
    onNext?.()
  }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
    />
  )

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={3}
        badgeLabel="Refining"
        title="Refining"
        description="Fill in refining processes, variants, resource consumption, and emissions. Fields marked with * are required."
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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

                  <FormField control={control} name="causticSoda" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Caustic soda (kg/t)</FormLabel>
                      <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 90" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="limeAdditives" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Lime / other additives (kg/t)</FormLabel>
                      <FormControl><Input type="number" min="0" step="0.1" placeholder="e.g., 40" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <hr className="my-4 border-gray-200" />

                {/* 4. Emissions and Toxicity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FormField control={control} name="so2" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>SO₂ emissions (kg per tonne)</FormLabel>
                      <FormControl><Input type="number" min="0" step="0.01" placeholder="e.g., 0.7" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="nox" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>NOₓ emissions (kg per tonne)</FormLabel>
                      <FormControl><Input type="number" min="0" step="0.01" placeholder="e.g., 0.9" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="dust" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Dust emissions (kg per tonne)</FormLabel>
                      <FormControl><Input type="number" min="0" step="0.01" placeholder="e.g., 0.2" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

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
function SmeltingDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, onCalculateLCA, calculatingLCA }) {
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

  const schema = z.object({
    processes: z.array(z.string()).default([]),
    processOthers: z.string().optional(),
    variants: z.array(z.string()).default([]),
    variantOthers: z.string().optional(),
    electricityDemand: z.coerce.number().min(0, { message: 'Required and must be >= 0' }),
    co2Emissions: z.coerce.number().min(0, { message: 'Required and must be >= 0' }),
    cellTechnology: z.enum(["Pre-baked","Soderberg","Inert Anode"], { required_error: 'Select a cell technology' }),
    pfcEmissions: z.coerce.number().min(0).optional(),
    so2: z.coerce.number().min(0).optional(),
    nox: z.coerce.number().min(0).optional(),
    fluorideRecovery: z.coerce.number().min(0).max(100).optional(),
    thermalRecovery: z.coerce.number().min(0).max(100).optional(),
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      processes: [],
      variants: [],
    },
    mode: 'onChange',
  })

  const { control, handleSubmit, watch, formState: { isValid } } = form
  const selectedProcesses = watch('processes')
  const selectedVariants = watch('variants')

  const onSubmit = (data) => {
    onSave?.(data)
    onNext?.()
  }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
    />
  )

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={4}
        badgeLabel="Smelting"
        title="Smelting"
        description="Select processes, variants, and enter required energy and emissions data. Fields marked with * are required."
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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

                  <FormField control={control} name="pfcEmissions" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>PFC Emissions - Perfluorocarbon (kg per tonne)</FormLabel>
                      <FormControl><Input type="number" min="0" step="0.01" placeholder="e.g., 0.8" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <hr className="my-4 border-gray-200" />

                {/* 4. Emissions and Efficiency Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField control={control} name="so2" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>SO₂ Emissions (kg per tonne)</FormLabel>
                      <FormControl><Input type="number" min="0" step="0.01" placeholder="e.g., 1.1" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="nox" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>NOₓ Emissions (kg per tonne)</FormLabel>
                      <FormControl><Input type="number" min="0" step="0.01" placeholder="e.g., 1.6" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="fluorideRecovery" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Fluoride Recovery Efficiency (%)</FormLabel>
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

                  <FormField control={control} name="thermalRecovery" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Thermal Energy Recovery Potential (% of total energy)</FormLabel>
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
              </form>
            </Form>
          </StepSection>
        </FormProvider>
      )
}

// Step 5: Manufacturing
function ManufacturingDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, onCalculateLCA, calculatingLCA }) {
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

  const transportModes = ['Road','Rail','Sea','Air','Mixed','Others']

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

  const schema = z.object({
    processes: z.array(z.string()).default([]),
    processOthers: z.string().optional(),
    castingProcesses: z.array(z.string()).default([]),
    scrapRate: z.coerce.number().min(0).max(100, { message: '0 - 100' }),
    recycledContent: z.coerce.number().min(0).max(100).optional(),
    energyUsePerStep: z.coerce.number().min(0).optional(),
    fabricationEmissions: z.coerce.number().min(0).optional(),
    transportDistance: z.coerce.number().min(0, { message: 'Required and must be >= 0' }),
    transportMode: z.enum(['Road','Rail','Sea','Air','Mixed','Others']).optional(),
    transportModeOthers: z.string().optional(),
    transportEmissionsPerTkm: z.coerce.number().min(0).optional(),
    lightweightingSectors: z.array(z.string()).default([]),
    lightweightingOthers: z.string().optional(),
    corrosionImpact: z.enum(['minimal','moderate','severe','others']).optional(),
    corrosionOthers: z.string().optional(),
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
    defaultValues: initialValues || { processes: [], castingProcesses: [], lightweightingSectors: [] },
    mode: 'onChange',
  })

  const { control, handleSubmit, watch, formState: { isValid } } = form
  const selectedProcesses = watch('processes')
  const selectedSectors = watch('lightweightingSectors')
  const transportMode = watch('transportMode')
  const onSubmit = (data) => { onSave?.(data); onNext?.() }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
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
function RecyclingDetails({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, onCalculateLCA, calculatingLCA }) {
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
    processOthers: z.string().optional(),
    variants: z.array(z.string()).default([]),
    variantOthers: z.string().optional(),
    scrapInputPercent: z.coerce.number().min(0).max(100, { message: '0 - 100 required' }),
    collectionRatePercent: z.coerce.number().min(0).max(100, { message: '0 - 100 required' }),
    recyclingMethod: z.enum(['closed-loop','open-loop','mixed'], { required_error: 'Select a primary recycling method' }),
    recoveryYieldPercent: z.coerce.number().min(0).max(100).optional(),
    recyclingEfficiencyPercent: z.coerce.number().min(0).max(100).optional(),
    closedLoopPercent: z.coerce.number().min(0).max(100).optional(),
    openLoopPercent: z.coerce.number().min(0).max(100).optional(),
    furnaceEnergyDemand: z.coerce.number().min(0).optional(),
    emissionSavings: z.coerce.number().min(0).optional(),
    sortingMethods: z.array(z.string()).default([]),
    sortingOthers: z.string().optional(),
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
    defaultValues: initialValues || { processes: [], variants: [], sortingMethods: [] },
    mode: 'onChange',
  })

  const { control, handleSubmit, watch, formState: { isValid } } = form
  const selectedProcesses = watch('processes')
  const selectedVariants = watch('variants')
  const selectedSorting = watch('sortingMethods')
  const onSubmit = (data) => { onSave?.(data); onNext?.() }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
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
function ValorizationDetails({ onNext, onBack, onSave, initialValues, onSubmitSuccess, onGenerateAIPrediction, predicting, onCalculateLCA, calculatingLCA }) {
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

  const riskLevels = ['low','moderate','high','others']
  const econLevels = ['low','moderate','high']

  const schema = z.object({
    wasteTypes: z.array(z.string()).min(1, { message: 'Select at least one waste type' }),
    wasteTypeOthers: z.string().optional(),
    valorizationMethods: z.array(z.string()).min(1, { message: 'Select at least one valorization method' }),
    methodsOthers: z.string().optional(),

    wasteUtilizationOverallPercent: z.coerce.number().min(0).max(100, { message: '0 - 100 required' }),
    emissionReductionsPerTonne: z.coerce.number().min(0).optional(),

    redMudUtilized: z.coerce.number().min(0).max(100).optional(),
    splUtilized: z.coerce.number().min(0).max(100).optional(),
    drossUtilized: z.coerce.number().min(0).max(100).optional(),
    fluorideUtilized: z.coerce.number().min(0).max(100).optional(),
    slagUtilized: z.coerce.number().min(0).max(100).optional(),

    redMudRecovery: z.coerce.number().min(0).max(100).optional(),
    splRecovery: z.coerce.number().min(0).max(100).optional(),
    drossRecovery: z.coerce.number().min(0).max(100).optional(),
    fluorideRecovery: z.coerce.number().min(0).max(100).optional(),
    slagRecovery: z.coerce.number().min(0).max(100).optional(),

    toxicityRedMud: z.enum(['low','moderate','high','others']).optional(),
    toxicitySPL: z.enum(['low','moderate','high','others']).optional(),
    toxicityDross: z.enum(['low','moderate','high','others']).optional(),
    toxicityFluoride: z.enum(['low','moderate','high','others']).optional(),
    toxicitySlag: z.enum(['low','moderate','high','others']).optional(),

    groundwaterRedMud: z.enum(['low','moderate','high','others']).optional(),
    groundwaterSPL: z.enum(['low','moderate','high','others']).optional(),
    groundwaterDross: z.enum(['low','moderate','high','others']).optional(),
    groundwaterFluoride: z.enum(['low','moderate','high','others']).optional(),
    groundwaterSlag: z.enum(['low','moderate','high','others']).optional(),

    econCementAdditive: z.enum(['low','moderate','high']).optional(),
    econSoilStabilization: z.enum(['low','moderate','high']).optional(),
    econIronExtraction: z.enum(['low','moderate','high']).optional(),
    econRareEarthExtraction: z.enum(['low','moderate','high']).optional(),
    econSPLEncapsulation: z.enum(['low','moderate','high']).optional(),
    econDrossRecovery: z.enum(['low','moderate','high']).optional(),
    econFluorideCapture: z.enum(['low','moderate','high']).optional(),
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
    defaultValues: initialValues || { wasteTypes: [], valorizationMethods: [] },
    mode: 'onChange',
  })

  const { control, handleSubmit, watch, formState: { isValid } } = form
  const selectedWaste = watch('wasteTypes')
  const selectedMethods = watch('valorizationMethods')
  const onSubmit = async (data) => {
    try {
      // Save the valorization step data
      await onSave?.(data)
      console.log('✅ Valorization step saved successfully')
      
      // Trigger workflow submission callback
      onSubmitSuccess?.()
    } catch (e) {
      console.error('❌ Valorization submission failed:', e)
    }
  }

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={!isValid}
      forwardLabel="Submit"
      showLca={false}
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
                      { name: 'econIronExtraction', label: 'Iron Extraction Economic Viability' },
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




