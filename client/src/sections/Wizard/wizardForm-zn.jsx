import React, { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GuidedModeToggle } from "@/components/GuidedModeToggle";
import { AdvancedOptionsSection } from "@/components/AdvancedOptionsSection";

// Local storage key for zinc workflow data
const ZINC_WORKFLOW_KEY = 'zinc_workflow_data';
const ZINC_WORKFLOW_METADATA_KEY = 'zinc_workflow_metadata';

// Typography scale
const HEADING_TEXT = "text-[22px] sm:text-[24px] md:text-[26px]";
const GROUP_HEADING_TEXT = "text-[16px] sm:text-[18px]";
const LABEL_TEXT = "text-[14px] sm:text-[15px] font-medium";
const OPTION_TEXT = "text-[13px] sm:text-[14px]";

const stepVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -18, scale: 0.98 },
};

// Reusable card-style checkbox option
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
        <input type="checkbox" className="sr-only" aria-hidden="true" tabIndex={-1} checked={!!checked} readOnly />
        <div id={labelId} className={`font-medium leading-snug ${OPTION_TEXT}`}>{label}</div>
      </div>
    </div>
  )
}

// Reusable card-style radio option
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
        <input type="radio" className="sr-only" aria-hidden="true" tabIndex={-1} checked={!!selected} readOnly />
        <div id={labelId} className={`font-medium leading-snug ${OPTION_TEXT}`}>{label}</div>
      </div>
    </div>
  )
}

// Step Section Component
function StepSection({ stepNumber, badgeLabel, title, description, children, footer }) {
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

// Step Footer Actions
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

// Helper to handle empty string inputs for required number fields
const requiredNumber = (min = 0, max, message = 'Required') => {
  let actualMax = max;
  let actualMessage = message;
  
  if (typeof max === 'string') {
    actualMessage = max;
    actualMax = undefined;
  }
  
  let numberSchema = z.coerce.number().min(min, { message: actualMessage });
  
  if (actualMax !== undefined && typeof actualMax === 'number') {
    numberSchema = numberSchema.max(actualMax, { message: `Must be between ${min}-${actualMax}` });
  }
  
  return z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : val,
    numberSchema
  );
};

// ==================== MINING STEP ====================
const miningMethodsList = [
  { id: "openPit", label: "Open-Pit" },
  { id: "underground", label: "Underground" },
  { id: "roomPillar", label: "Room & Pillar" },
  { id: "cutFill", label: "Cut & Fill" },
  { id: "blockCaving", label: "Block Caving" },
  { id: "others", label: "Others" },
];

const oreTypes = [
  { id: "sulfide", label: "Sulfide (Sphalerite)" },
  { id: "mixedSulfideOxide", label: "Mixed Sulfide-Oxide" },
  { id: "oxide", label: "Oxide (Smithsonite, Hemimorphite)" },
];

const equipmentTypes = ["diesel", "electric", "hybrid"];
const waterSources = ["groundwater", "surface", "recycled", "mixed"];
const acidMineDrainageRisks = ["low", "medium", "high"];
const biodiversityLevels = ["low", "moderate", "high"];
const dustSuppressionLevels = ["basic", "advanced", "smart-ai"];

const miningSchema = z.object({
  // Mining Methods
  miningMethods: z.array(z.string()).min(1, "Select at least one mining method"),
  miningMethodOthers: z.string().nullable().optional(),
  
  // Ore Type
  oreType: z.string().min(1, "Ore type is required"),
  
  // Core Parameters
  oreGradeZn: requiredNumber(0, 100, "Ore grade is required"),
  overburdenRatio: requiredNumber(0, undefined, "Overburden ratio is required"),
  averageHaulDistance: requiredNumber(0, undefined, "Average haul distance is required"),
  equipmentType: z.enum(["diesel", "electric", "hybrid"], { required_error: "Equipment type is required" }),
  fuelConsumption: requiredNumber(0, undefined, "Fuel consumption is required"),
  electricityConsumption: requiredNumber(0, undefined, "Electricity consumption is required"),
  waterConsumption: requiredNumber(0, undefined, "Water consumption is required"),
  waterSource: z.enum(["groundwater", "surface", "recycled", "mixed"], { required_error: "Water source is required" }),
  
  // Advanced Options
  landDisturbed: z.coerce.number().nullable().optional(),
  dustEmissionsPM10: z.coerce.number().nullable().optional(),
  explosivesKgANFO: z.coerce.number().nullable().optional(),
  acidMineDrainageRisk: z.enum(["low", "medium", "high"]).nullable().optional(),
  
  // Sustainability Parameters
  followingSustainableRules: z.boolean().nullable().optional(),
  sustainabilityParameters: z.object({
    rehabilitationPlanActive: z.boolean().nullable().optional(),
    overburdenRestoredPercent: z.coerce.number().nullable().optional(),
    waterReuseRatePercent: z.coerce.number().nullable().optional(),
    biodiversityProtectionLevel: z.enum(["low", "moderate", "high"]).nullable().optional(),
    dustSuppression: z.enum(["basic", "advanced", "smart-ai"]).nullable().optional(),
  }).nullable().optional(),
});

function MiningStep({ onNext, onSave, initialValues, onCalculateLCA, isCalculatingLca }) {
  const [isSaving, setIsSaving] = useState(false);
  const [guidedMode, setGuidedMode] = useState(() => {
    return !initialValues || Object.keys(initialValues).length === 0;
  });
  
  const form = useForm({
    resolver: zodResolver(miningSchema),
    defaultValues: initialValues || {
      miningMethods: [],
      miningMethodOthers: "",
      oreType: "",
      oreGradeZn: 5,
      overburdenRatio: 2.5,
      averageHaulDistance: 5.0,
      equipmentType: "diesel",
      fuelConsumption: 2.5,
      electricityConsumption: 15,
      waterConsumption: 1.5,
      waterSource: "surface",
      followingSustainableRules: false,
      sustainabilityParameters: {},
    },
    mode: "onTouched",
  });

  const { handleSubmit, control, watch, setValue, formState: { isValid, errors } } = form;
  
  const miningMethods = watch("miningMethods");
  const followingSustainableRules = watch("followingSustainableRules");

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await onSave(data);
      setTimeout(() => {
        onNext();
      }, 300);
    } catch (error) {
      console.error('Error saving mining data:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGuidedModeToggle = (enabled) => {
    setGuidedMode(enabled);
  };

  const footerContent = (
    <>
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
      />
    </>
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={1}
        badgeLabel="Mining"
        title="Zinc Mining Process Details"
        description="Enter the details of the zinc mining process. Fields marked with * are required."
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
            {/* Mining Methods */}
            <FormField
              control={control}
              name="miningMethods"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className={GROUP_HEADING_TEXT}>
                      Mining Method*
                    </FormLabel>
                    <FormDescription>
                      Select all applicable mining methods.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {miningMethodsList.map(item => (
                      <CardCheckbox
                        key={item.id}
                        id={`mining-method-${item.id}`}
                        label={item.label}
                        checked={field.value?.includes(item.id)}
                        onChange={(checked) => {
                          const next = new Set(field.value || [])
                          if (checked) next.add(item.id); else next.delete(item.id)
                          field.onChange(Array.from(next))
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Others specification */}
            {miningMethods?.includes("others") && (
              <FormField
                control={control}
                name="miningMethodOthers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Specify Other Mining Method</FormLabel>
                    <FormControl>
                      <Input placeholder="Please specify" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Ore Type */}
            <FormField
              control={control}
              name="oreType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Ore Type*</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    {oreTypes.map(type => (
                      <div
                        key={type.id}
                        onClick={() => field.onChange(type.id)}
                        className={[
                          "cursor-pointer rounded-xl border p-3 shadow-sm transition-all duration-200",
                          field.value === type.id
                            ? "bg-linear-to-br from-[#6B5B59] to-[#3f3634] text-white border-transparent shadow-md"
                            : "bg-white text-gray-900 border-gray-200 hover:border-[#BA7967]/60 hover:bg-[#f8f4f0]",
                        ].join(" ")}
                      >
                        <div className={`font-medium leading-snug ${OPTION_TEXT}`}>{type.label}</div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Core Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={control}
                name="oreGradeZn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Grade (% Zn)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="5.0" {...field} />
                    </FormControl>
                    <FormDescription>Typical range: 3-8%</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="overburdenRatio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Overburden Ratio (m³ waste / tonne ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="2.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={control}
                name="averageHaulDistance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Average Haul Distance (km)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="5.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="equipmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Equipment Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
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
                name="fuelConsumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Fuel Consumption (L/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="2.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="electricityConsumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Electricity Consumption (kWh/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="15.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={control}
                name="waterConsumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Consumption (m³/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="1.5" {...field} />
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
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Source*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select water source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="groundwater">Groundwater</SelectItem>
                        <SelectItem value="surface">Surface</SelectItem>
                        <SelectItem value="recycled">Recycled</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <hr className="my-8 border-gray-200" />

          {/* ADVANCED OPTIONS - Collapsible section */}
          <AdvancedOptionsSection 
            title="Advanced Options" 
            defaultOpen={!guidedMode}
          >
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={control}
                  name="landDisturbed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Land Disturbed (m²/t ore)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="dustEmissionsPM10"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Dust Emissions PM10 (kg/t ore)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={control}
                  name="explosivesKgANFO"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Explosives (kg ANFO/t)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="acidMineDrainageRisk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Acid Mine Drainage Risk</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <hr className="my-8 border-gray-200" />

              {/* SUSTAINABILITY FOCUSED */}
              <div className="rounded-2xl border border-[#e3d4c8] bg-linear-to-br from-green-50/50 to-emerald-50/50 p-6">
                <FormField
                  control={control}
                  name="followingSustainableRules"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base font-semibold text-gray-900">
                          Sustainability Focused
                        </FormLabel>
                        <FormDescription>
                          Enable to include sustainability parameters in your mining process
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {followingSustainableRules === true && (
                  <div className="mt-6 space-y-6 pl-7">
                    <FormField
                      control={control}
                      name="sustainabilityParameters.rehabilitationPlanActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Rehabilitation Plan Active</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.overburdenRestoredPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Overburden Restored (%)</FormLabel>
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
                        name="sustainabilityParameters.waterReuseRatePercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Water Reuse Rate (%)</FormLabel>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.biodiversityProtectionLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biodiversity Protection Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.dustSuppression"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dust Suppression</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                                <SelectItem value="smart-ai">Smart-AI</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AdvancedOptionsSection>
        </form>
      </StepSection>
    </FormProvider>
  );
}

// ==================== BENEFICIATION STEP ====================
const beneficiationProcessesList = [
  { id: "crushing", label: "Crushing" },
  { id: "grinding", label: "Grinding" },
  { id: "flotation", label: "Flotation" },
  { id: "gravitySeparation", label: "Gravity Separation" },
  { id: "magneticSeparation", label: "Magnetic Separation" },
  { id: "thickening", label: "Thickening" },
  { id: "filtration", label: "Filtration" },
  { id: "others", label: "Others" },
];

const tailingsStorageTypes = [
  { id: "wet", label: "Wet" },
  { id: "paste", label: "Paste" },
  { id: "dryStack", label: "Dry Stack" },
];

const tailingsDewateringTypes = [
  { id: "conventional", label: "Conventional" },
  { id: "thickened", label: "Thickened" },
  { id: "dryStack", label: "Dry Stack" },
];

const waterTreatmentTypes = [
  { id: "basic", label: "Basic" },
  { id: "advanced", label: "Advanced" },
  { id: "aiDriven", label: "AI-Driven" },
];

const beneficiationSchema = z.object({
  // Mandatory fields
  processesSelected: z.array(z.string()).min(1, "Select at least one process"),
  processesOthers: z.string().optional(),
  concentrateGradeZn: requiredNumber(0, 100, "Concentrate grade is required (0-100%)"),
  grindingEnergyKwh: requiredNumber(0, "Grinding energy is required"),
  reagentConsumptionKg: requiredNumber(0, "Reagent consumption is required"),
  waterConsumptionM3: requiredNumber(0, "Water consumption is required"),
  waterRecycledPercent: requiredNumber(0, 100, "Water recycled percentage is required (0-100%)"),
  electricityUseKwh: requiredNumber(0, "Electricity use is required"),
  recoveryEfficiencyPercent: requiredNumber(0, 100, "Recovery efficiency is required (0-100%)"),
  
  // Advanced options - Additional
  tailingsProducedT: z.coerce.number().min(0).nullable().optional(),
  tailingsSolidsPercent: z.coerce.number().min(0).max(100).nullable().optional(),
  tailingsStorageType: z.enum(["wet", "paste", "dryStack"]).nullable().optional(),
  chemicalResidueInTailingsMgL: z.coerce.number().min(0).nullable().optional(),
  
  // Sustainability toggle
  followingSustainableRules: z.boolean().optional(),
  
  // Sustainability Parameters
  bioBasedReagents: z.boolean().optional(),
  zeroLiquidDischarge: z.boolean().optional(),
  tailingsDewatering: z.enum(["conventional", "thickened", "dryStack"]).nullable().optional(),
  waterTreatment: z.enum(["basic", "advanced", "aiDriven"]).nullable().optional(),
  tailingsReusePotentialPercent: z.coerce.number().min(0).max(100).nullable().optional(),
});

function BeneficiationStep({ onNext, onBack, onSave, initialValues, onCalculateLCA, isCalculatingLca }) {
  const [isSaving, setIsSaving] = useState(false);
  const [guidedMode, setGuidedMode] = useState(() => {
    return !initialValues || Object.keys(initialValues).length === 0;
  });
  
  const form = useForm({
    resolver: zodResolver(beneficiationSchema),
    defaultValues: initialValues || {
      processesSelected: [],
      processesOthers: "",
      concentrateGradeZn: "",
      grindingEnergyKwh: "",
      reagentConsumptionKg: "",
      waterConsumptionM3: "",
      waterRecycledPercent: "",
      electricityUseKwh: "",
      recoveryEfficiencyPercent: "",
      // Advanced
      tailingsProducedT: "",
      tailingsSolidsPercent: "",
      tailingsStorageType: null,
      chemicalResidueInTailingsMgL: "",
      // Sustainability
      followingSustainableRules: false,
      bioBasedReagents: false,
      zeroLiquidDischarge: false,
      tailingsDewatering: null,
      waterTreatment: null,
      tailingsReusePotentialPercent: "",
    },
    mode: "onTouched",
  });

  const { handleSubmit, control, formState: { isValid, errors }, watch } = form;
  
  const processesSelected = watch("processesSelected") || [];
  const followingSustainableRules = watch("followingSustainableRules");

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await onSave(data);
      setTimeout(() => {
        onNext();
      }, 300);
    } catch (error) {
      console.error('Error saving beneficiation data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const footerContent = (
    <>
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
      />
    </>
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={2}
        badgeLabel="Beneficiation"
        title="Beneficiation Process Details"
        description="Enter the details of the zinc ore concentration process."
        footer={footerContent}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Guided/Expert Mode Toggle */}
          <GuidedModeToggle 
            guidedMode={guidedMode}
            onToggle={() => setGuidedMode(!guidedMode)}
          />

          {/* Processes Selected */}
          <FormField
            control={control}
            name="processesSelected"
            render={({ field }) => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className={GROUP_HEADING_TEXT}>
                    * Processes Selected
                  </FormLabel>
                  <FormDescription className="text-xs text-gray-500 mt-1">
                    Select all beneficiation processes used in your operation
                  </FormDescription>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {beneficiationProcessesList.map(item => (
                    <CardCheckbox
                      key={item.id}
                      id={`beneficiation-proc-${item.id}`}
                      label={item.label}
                      checked={field.value?.includes(item.id)}
                      onChange={(checked) => {
                        const next = new Set(field.value || [])
                        if (checked) next.add(item.id); else next.delete(item.id)
                        field.onChange(Array.from(next))
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Others text field - show only if "others" is selected */}
          {processesSelected.includes("others") && (
            <FormField
              control={control}
              name="processesOthers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_TEXT}>Specify Other Processes</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe other processes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Core Parameters - Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={control}
              name="concentrateGradeZn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_TEXT}>* Concentrate Grade (% Zn)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g., 55.5" 
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Zinc content in the final concentrate
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="grindingEnergyKwh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_TEXT}>* Grinding Energy (kWh/t ore)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g., 15.5" 
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Energy consumed during grinding per ton of ore
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Core Parameters - Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={control}
              name="reagentConsumptionKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_TEXT}>* Reagent Consumption (kg/t ore)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g., 2.5" 
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Flotation reagents and chemicals used per ton of ore
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="waterConsumptionM3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_TEXT}>* Water Consumption (m³/t ore)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g., 1.2" 
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Total water used in beneficiation process
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Core Parameters - Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={control}
              name="waterRecycledPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_TEXT}>* Water Recycled (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="e.g., 70" 
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Percentage of water recycled back into the process
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="electricityUseKwh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_TEXT}>* Electricity Use (kWh/t ore)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g., 25.5" 
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Total electrical energy consumed per ton of ore
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Core Parameters - Row 4 */}
          <FormField
            control={control}
            name="recoveryEfficiencyPercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_TEXT}>* Recovery Efficiency (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g., 85.5" 
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription className="text-xs text-gray-500">
                  Percentage of zinc recovered from the ore
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Advanced Options Section */}
          <AdvancedOptionsSection
            title="Advanced Options"
            description="Tailings management and sustainability parameters"
          >
            <div className="space-y-8">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={control}
                  name="tailingsProducedT"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL_TEXT}>Tailings Produced (t/t ore)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="e.g., 0.85" 
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Waste material produced per ton of ore processed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="tailingsSolidsPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL_TEXT}>Tailings Solids (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g., 30" 
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Solids content in tailings slurry
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                    control={control}
                    name="tailingsStorageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={LABEL_TEXT}>Tailings Storage Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select storage type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tailingsStorageTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs text-gray-500">
                          Method used to store tailings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="chemicalResidueInTailingsMgL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={LABEL_TEXT}>Chemical Residue in Tailings (mg/L)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="e.g., 5.2" 
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Concentration of chemical residues in tailings water
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <hr className="my-6 border-gray-200" />

              {/* SUSTAINABILITY FOCUSED */}
              <div className="rounded-2xl border border-[#e3d4c8] bg-linear-to-br from-green-50/50 to-emerald-50/50 p-6">
                <FormField
                  control={control}
                  name="followingSustainableRules"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base font-semibold text-gray-900">
                          Sustainability Focused
                        </FormLabel>
                        <FormDescription>
                          Enable to include sustainability parameters in your beneficiation process
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {followingSustainableRules === true && (
                  <div className="mt-6 space-y-6 pl-7">
                    {/* Sustainability Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="bioBasedReagents"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 p-4 bg-white/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                Bio-based Reagents
                              </FormLabel>
                              <FormDescription className="text-xs text-gray-500">
                                Use of environmentally friendly, bio-based flotation reagents
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="zeroLiquidDischarge"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 p-4 bg-white/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                Zero Liquid Discharge
                              </FormLabel>
                              <FormDescription className="text-xs text-gray-500">
                                No wastewater discharged from the facility
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Sustainability Selects */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="tailingsDewatering"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={LABEL_TEXT}>Tailings Dewatering</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select dewatering method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tailingsDewateringTypes.map(type => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs text-gray-500">
                              Technology used to remove water from tailings
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="waterTreatment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={LABEL_TEXT}>Water Treatment</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select treatment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {waterTreatmentTypes.map(type => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs text-gray-500">
                              Level of water treatment technology employed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Tailings Reuse */}
                    <FormField
                      control={control}
                      name="tailingsReusePotentialPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={LABEL_TEXT}>Tailings Reuse Potential (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              placeholder="e.g., 20" 
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Estimated percentage of tailings that can be reused (e.g., for backfill, construction materials)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </AdvancedOptionsSection>
        </form>
      </StepSection>
    </FormProvider>
  );
}

// ==================== EXTRACTION STEP ====================
// Extraction route options for Zinc
const extractionRouteOptions = [
  { id: "rle", label: "RLE (Roast–Leach–Electrowin)" },
  { id: "isf", label: "Imperial Smelting Furnace (ISF – for mixed Zn-Pb ores)" },
];

// Leaching type options
const leachingTypeOptions = [
  { id: "atmospheric", label: "Atmospheric" },
  { id: "pressure", label: "Pressure" },
  { id: "ferricChloride", label: "Ferric Chloride" },
  { id: "ammoniacal", label: "Ammoniacal" },
];

// Iron removal method options
const ironRemovalMethods = ["jarosite", "goethite", "hematite"];

// Anode type options
const anodeTypes = ["lead-silver", "manganese", "inert"];

// RLE Schema - with all parameters
const rleSchema = z.object({
  // Roasting Stage
  roastingTemperature: requiredNumber(0, undefined, "Roasting temperature is required"),
  sulfurCaptureEfficiency: requiredNumber(0, 100, "Sulfur capture efficiency is required"),
  roastingEnergy: requiredNumber(0, undefined, "Roasting energy is required"),
  so2Emissions: z.coerce.number().nullable().optional(),
  dustEmissions: z.coerce.number().nullable().optional(),
  
  // Leaching Stage
  leachingType: z.string().min(1, "Leaching type is required"),
  acidConsumption: requiredNumber(0, undefined, "Acid consumption is required"),
  leachingEfficiency: requiredNumber(0, 100, "Leaching efficiency is required"),
  waterConsumption: z.coerce.number().nullable().optional(),
  ironRemovalMethod: z.string().nullable().optional(),
  
  // Purification
  additives: requiredNumber(0, undefined, "Additives amount is required"),
  impurityRemovalEfficiency: z.coerce.number().min(0).max(100).nullable().optional(),
  
  // Electrowinning
  ewEnergy: requiredNumber(0, undefined, "Electrowinning energy is required"),
  currentEfficiency: requiredNumber(0, 100, "Current efficiency is required"),
  cellVoltage: z.coerce.number().nullable().optional(),
  anodeType: z.string().nullable().optional(),
  
  // Sustainability Parameters
  renewablePower: z.coerce.number().min(0).max(100).nullable().optional(),
  heatRecovery: z.coerce.number().min(0).max(100).nullable().optional(),
  acidRecovery: z.coerce.number().min(0).max(100).nullable().optional(),
  ironPrecipitateReuse: z.coerce.number().min(0).max(100).nullable().optional(),
});

// ISF Schema - Imperial Smelting Furnace parameters
const isfSchema = z.object({
  // Core Parameters
  cokeConsumption: requiredNumber(0, undefined, "Coke consumption is required"),
  blastAirFlowRate: requiredNumber(0, undefined, "Blast air flow rate is required"),
  furnaceTemperature: requiredNumber(0, undefined, "Furnace temperature is required"),
  slagGeneration: requiredNumber(0, undefined, "Slag generation is required"),
  
  // Emissions
  co2Emissions: requiredNumber(0, undefined, "CO₂ emissions is required"),
  so2Emissions: z.coerce.number().nullable().optional(),
  heavyMetals: z.coerce.number().nullable().optional(),
  
  // Sustainability Parameters
  zincSlagReuse: z.coerce.number().min(0).max(100).nullable().optional(),
  wasteHeatRecovery: z.coerce.number().min(0).max(100).nullable().optional(),
});

// Combined Extraction Schema
const extractionSchema = z.object({
  extractionRoute: z.string().min(1, "Extraction route is required"),
  rle: rleSchema.nullable().optional(),
  isf: isfSchema.nullable().optional(),
});

function ExtractionStep({ onNext, onBack, onSave, initialValues, onCalculateLCA, isCalculatingLca }) {
  const [isSaving, setIsSaving] = useState(false);
  const [sustainabilityOpen, setSustainabilityOpen] = useState(false);
  const [isfSustainabilityOpen, setIsfSustainabilityOpen] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(extractionSchema),
    defaultValues: initialValues || {
      extractionRoute: '',
      rle: {
        roastingTemperature: '',
        sulfurCaptureEfficiency: '',
        roastingEnergy: '',
        so2Emissions: '',
        dustEmissions: '',
        leachingType: '',
        acidConsumption: '',
        leachingEfficiency: '',
        waterConsumption: '',
        ironRemovalMethod: '',
        additives: '',
        impurityRemovalEfficiency: '',
        ewEnergy: '',
        currentEfficiency: '',
        cellVoltage: '',
        anodeType: '',
        renewablePower: '',
        heatRecovery: '',
        acidRecovery: '',
        ironPrecipitateReuse: '',
      },
      isf: {
        cokeConsumption: '',
        blastAirFlowRate: '',
        furnaceTemperature: '',
        slagGeneration: '',
        co2Emissions: '',
        so2Emissions: '',
        heavyMetals: '',
        zincSlagReuse: '',
        wasteHeatRecovery: '',
      },
    },
    mode: "onTouched",
  });

  const { handleSubmit, control, watch, setValue, formState: { isValid, errors } } = form;

  const extractionRoute = watch("extractionRoute");
  const isRLE = extractionRoute === "rle";
  const isISF = extractionRoute === "isf";

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await onSave(data);
      setTimeout(() => {
        onNext();
      }, 300);
    } catch (error) {
      console.error('Error saving extraction data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const footerContent = (
    <>
      {!isValid && Object.keys(errors).length > 0 && (
        <div className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          ℹ️ Please fill required fields
        </div>
      )}
      <StepFooterActions
        onBack={onBack}
        onForward={handleSubmit(onSubmit)}
        forwardDisabled={!isValid || isSaving}
        forwardLabel={isSaving ? '💾 Saving...' : 'Save & Next'}
        showLca={true}
        onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
        isCalculatingLca={isCalculatingLca}
      />
    </>
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={3}
        badgeLabel="Extraction"
        title="Zinc Extraction Process"
        description="Select the extraction route and enter process parameters."
        footer={footerContent}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Extraction Route Selection */}
          <div className="space-y-4">
            <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>
              Extraction Route*
            </FormLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {extractionRouteOptions.map((opt) => (
                <CardRadio
                  key={opt.id}
                  id={`extraction-route-${opt.id}`}
                  label={opt.label}
                  selected={extractionRoute === opt.id}
                  onSelect={() => {
                    setValue("extractionRoute", extractionRoute === opt.id ? '' : opt.id, { shouldValidate: true });
                  }}
                />
              ))}
            </div>
          </div>

          {/* RLE ROUTE PARAMETERS */}
          {isRLE && (
            <div className="space-y-8">
              {/* ========== ROASTING STAGE ========== */}
              <div className="space-y-6 p-6 rounded-lg border border-blue-200 bg-blue-50">
                <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-blue-900`}>
                  Roasting Stage
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="rle.roastingTemperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roasting Temperature (°C)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="e.g., 900" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.sulfurCaptureEfficiency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sulfur Capture Efficiency (%)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.roastingEnergy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roasting Energy (MJ/t concentrate)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="MJ/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.so2Emissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SO₂ Emissions (kg/t)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.dustEmissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dust (kg/t)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ========== LEACHING STAGE ========== */}
              <div className="space-y-6 p-6 rounded-lg border border-cyan-200 bg-cyan-50">
                <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-cyan-900`}>
                  Leaching Stage
                </h4>
                
                <FormField
                  control={control}
                  name="rle.leachingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leaching Type*</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {leachingTypeOptions.map((opt) => (
                          <CardRadio
                            key={opt.id}
                            id={`leaching-type-${opt.id}`}
                            label={opt.label}
                            selected={field.value === opt.id}
                            onSelect={() => field.onChange(field.value === opt.id ? '' : opt.id)}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="rle.acidConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acid Consumption (kg H₂SO₄/t concentrate)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.leachingEfficiency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leaching Efficiency (%)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.waterConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Water Consumption (m³/t)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="m³/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.ironRemovalMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Iron Removal Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="jarosite">Jarosite</SelectItem>
                            <SelectItem value="goethite">Goethite</SelectItem>
                            <SelectItem value="hematite">Hematite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ========== PURIFICATION ========== */}
              <div className="space-y-6 p-6 rounded-lg border border-violet-200 bg-violet-50">
                <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-violet-900`}>
                  Purification
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="rle.additives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additives - Zinc Dust / Lime / MgO (kg/t)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.impurityRemovalEfficiency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impurity Removal Efficiency (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ========== ELECTROWINNING ========== */}
              <div className="space-y-6 p-6 rounded-lg border border-amber-200 bg-amber-50">
                <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-amber-900`}>
                  Electrowinning
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="rle.ewEnergy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>EW Energy (kWh/t Zn)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kWh/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.currentEfficiency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Efficiency (%)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.cellVoltage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cell Voltage (V)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="V" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="rle.anodeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anode Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select anode type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lead-silver">Lead-Silver</SelectItem>
                            <SelectItem value="manganese">Manganese</SelectItem>
                            <SelectItem value="inert">Inert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ========== SUSTAINABILITY PARAMETERS (Collapsible) ========== */}
              <div className="rounded-lg border border-green-200 bg-green-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSustainabilityOpen(!sustainabilityOpen)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-green-100 transition-colors"
                >
                  <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-green-900 flex items-center gap-2`}>
                    🌱 Sustainability Parameters
                  </h4>
                  <span className={`transform transition-transform ${sustainabilityOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {sustainabilityOpen && (
                  <div className="p-6 pt-0 space-y-6 border-t border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="rle.renewablePower"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renewable Power (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="rle.heatRecovery"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heat Recovery (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="rle.acidRecovery"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Acid Recovery (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="rle.ironPrecipitateReuse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Iron Precipitate Reuse (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ISF ROUTE PARAMETERS */}
          {isISF && (
            <div className="space-y-8">
              {/* ========== CORE PARAMETERS ========== */}
              <div className="space-y-6 p-6 rounded-lg border border-amber-200 bg-amber-50">
                <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-amber-900`}>
                  Imperial Smelting Furnace (ISF) - Core Parameters
                </h4>
                <p className="text-sm text-amber-700 mb-4">
                  For mixed Pb-Zn ores
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="isf.cokeConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coke Consumption (kg/t)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="isf.blastAirFlowRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blast Air Flow Rate (Nm³/hr)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Nm³/hr" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="isf.furnaceTemperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Furnace Temperature (°C)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="e.g., 1200" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="isf.slagGeneration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slag Generation (kg/t)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ========== EMISSIONS ========== */}
              <div className="space-y-6 p-6 rounded-lg border border-red-200 bg-red-50">
                <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-red-900`}>
                  Emissions
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={control}
                    name="isf.co2Emissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CO₂ (kg/t)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="isf.so2Emissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SO₂ (kg/t)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="isf.heavyMetals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heavy Metals (mg/Nm³)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="mg/Nm³" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ========== SUSTAINABILITY PARAMETERS (Collapsible) ========== */}
              <div className="rounded-lg border border-green-200 bg-green-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsfSustainabilityOpen(!isfSustainabilityOpen)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-green-100 transition-colors"
                >
                  <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-green-900 flex items-center gap-2`}>
                    🌱 Sustainability Parameters
                  </h4>
                  <span className={`transform transition-transform ${isfSustainabilityOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {isfSustainabilityOpen && (
                  <div className="p-6 pt-0 space-y-6 border-t border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="isf.zincSlagReuse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zinc Slag Reuse (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="isf.wasteHeatRecovery"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Waste Heat Recovery (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </StepSection>
    </FormProvider>
  );
}

// ==================== ZINC CASTING AND PRODUCT MANUFACTURING STEP ====================
// Product type options
const productTypeOptions = [
  { id: "galvanized-steel-sheet", label: "Galvanized Steel Sheet" },
  { id: "zinc-ingot", label: "Zinc Ingot" },
  { id: "zinc-oxide", label: "Zinc Oxide" },
  { id: "die-cast-components", label: "Die-Cast Components" },
  { id: "others", label: "Others" },
];

// Casting method options
const castingMethodOptions = [
  { id: "continuous", label: "Continuous" },
  { id: "batch", label: "Batch" },
];

// Furnace type options
const furnaceTypeOptions = [
  { id: "induction", label: "Induction" },
  { id: "electric", label: "Electric" },
  { id: "gas", label: "Gas" },
];

const manufacturingSchema = z.object({
  // Core Parameters (Required)
  productType: z.string().min(1, "Product type is required"),
  productTypeOthers: z.string().nullable().optional(),
  castingMethod: z.string().min(1, "Casting method is required"),
  furnaceType: z.string().min(1, "Furnace type is required"),
  meltingEnergy: requiredNumber(0, undefined, "Melting energy is required"),
  rollingFormingEnergy: requiredNumber(0, undefined, "Rolling/Forming energy is required"),
  electricityMixRenewable: requiredNumber(0, 100, "Electricity mix renewable % is required"),
  processWater: requiredNumber(0, undefined, "Process water is required"),
  scrapGenerated: requiredNumber(0, 100, "Scrap generated % is required"),
  
  // Additional Parameters (Optional - in Advanced Options)
  surfaceTreatmentChemicals: z.coerce.number().nullable().optional(),
  scrapRecycledOnsite: z.coerce.number().min(0).max(100).nullable().optional(),
  
  // Sustainability Parameters (Optional - in Advanced Options > Sustainability Focused)
  designForRecycling: z.boolean().nullable().optional(),
  renewableEnergy: z.coerce.number().min(0).max(100).nullable().optional(),
  wasteHeatRecovery: z.coerce.number().min(0).max(100).nullable().optional(),
});

function ManufacturingStep({ onNext, onBack, onSave, initialValues, onCalculateLCA, isCalculatingLca }) {
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(manufacturingSchema),
    defaultValues: initialValues || {
      productType: '',
      productTypeOthers: '',
      castingMethod: '',
      furnaceType: '',
      meltingEnergy: '',
      rollingFormingEnergy: '',
      electricityMixRenewable: '',
      processWater: '',
      scrapGenerated: '',
      surfaceTreatmentChemicals: '',
      scrapRecycledOnsite: '',
      designForRecycling: false,
      renewableEnergy: '',
      wasteHeatRecovery: '',
    },
    mode: "onTouched",
  });

  const { handleSubmit, control, watch, formState: { isValid, errors } } = form;

  const productType = watch("productType");
  const followingSustainableRules = watch("designForRecycling");

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await onSave(data);
      setTimeout(() => {
        onNext();
      }, 300);
    } catch (error) {
      console.error('Error saving manufacturing data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const footerContent = (
    <>
      {!isValid && Object.keys(errors).length > 0 && (
        <div className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          ℹ️ Please fill required fields
        </div>
      )}
      <StepFooterActions
        onBack={onBack}
        onForward={handleSubmit(onSubmit)}
        forwardDisabled={!isValid || isSaving}
        forwardLabel={isSaving ? '💾 Saving...' : 'Save & Next'}
        showLca={true}
        onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
        isCalculatingLca={isCalculatingLca}
      />
    </>
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={4}
        badgeLabel="Manufacturing"
        title="Zinc Casting and Product Manufacturing"
        description="Enter the details of the zinc casting and product manufacturing process."
        footer={footerContent}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* ========== CORE PARAMETERS ========== */}
          
          {/* Product Type Selection */}
          <FormField
            control={control}
            name="productType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Product Type*</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
                  {productTypeOptions.map((opt) => (
                    <CardRadio
                      key={opt.id}
                      id={`product-type-${opt.id}`}
                      label={opt.label}
                      selected={field.value === opt.id}
                      onSelect={() => field.onChange(field.value === opt.id ? '' : opt.id)}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Others specification */}
          {productType === "others" && (
            <FormField
              control={control}
              name="productTypeOthers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Specify Other Product Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Please specify" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Casting Method */}
          <FormField
            control={control}
            name="castingMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Casting Method*</FormLabel>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {castingMethodOptions.map((opt) => (
                    <CardRadio
                      key={opt.id}
                      id={`casting-method-${opt.id}`}
                      label={opt.label}
                      selected={field.value === opt.id}
                      onSelect={() => field.onChange(field.value === opt.id ? '' : opt.id)}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Furnace Type */}
          <FormField
            control={control}
            name="furnaceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Furnace Type*</FormLabel>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {furnaceTypeOptions.map((opt) => (
                    <CardRadio
                      key={opt.id}
                      id={`furnace-type-${opt.id}`}
                      label={opt.label}
                      selected={field.value === opt.id}
                      onSelect={() => field.onChange(field.value === opt.id ? '' : opt.id)}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Energy and Process Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="meltingEnergy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Melting Energy (kWh/t)*</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="kWh/t" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="rollingFormingEnergy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Rolling/Forming Energy (kWh/t)*</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="kWh/t" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="electricityMixRenewable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Electricity Mix Renewable (%)*</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="processWater"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={GROUP_HEADING_TEXT}>Process Water (m³/t)*</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="m³/t" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Scrap Generated */}
          <FormField
            control={control}
            name="scrapGenerated"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={GROUP_HEADING_TEXT}>Scrap Generated (%)*</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ========== ADVANCED OPTIONS ========== */}
          <AdvancedOptionsSection title="Advanced Options" defaultOpen={false}>
            <div className="space-y-8">
              {/* Additional Parameters */}
              <div className="space-y-6">
                <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>
                  Additional Parameters
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="surfaceTreatmentChemicals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surface Treatment Chemicals (kg/t)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="scrapRecycledOnsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scrap Recycled Onsite (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              {/* Sustainability Focused Section */}
              <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                <FormField
                  control={control}
                  name="designForRecycling"
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
                          🌱 Sustainability Focused
                        </FormLabel>
                        <FormDescription className="text-sm">
                          Enable to include sustainability parameters and design for recycling
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Sustainability Parameters */}
              {followingSustainableRules === true && (
                <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                  <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                    Sustainability Parameters
                  </h3>
                  <div className="mt-4 grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={control}
                      name="renewableEnergy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renewable Energy (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="wasteHeatRecovery"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waste Heat Recovery (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
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
      </StepSection>
    </FormProvider>
  );
}

// ==================== USE PHASE STEP ====================
// Corrosion environment options
const corrosionEnvironmentOptions = [
  { id: "low", label: "Low" },
  { id: "moderate", label: "Moderate" },
  { id: "high", label: "High" },
];

const usePhaseSchema = z.object({
  // Core Parameters (Required)
  productLifetime: requiredNumber(0, undefined, "Product lifetime is required"),
  maintenanceFrequency: requiredNumber(0, undefined, "Maintenance frequency is required"),
  
  // Core Parameters (Optional)
  corrosionEnvironment: z.string().nullable().optional(),
  zincLossDuringUse: z.coerce.number().min(0).max(100).nullable().optional(),
  reusePotential: z.coerce.number().min(0).max(100).nullable().optional(),
  
  // Sustainability Parameters
  lifetimeExtensionYears: z.coerce.number().nullable().optional(),
});

function UsePhaseStep({ onNext, onBack, onSave, initialValues, onCalculateLCA, isCalculatingLca }) {
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(usePhaseSchema),
    defaultValues: initialValues || {
      productLifetime: '',
      maintenanceFrequency: '',
      corrosionEnvironment: '',
      zincLossDuringUse: '',
      reusePotential: '',
      lifetimeExtensionYears: '',
    },
    mode: "onTouched",
  });

  const { handleSubmit, control, watch, formState: { isValid, errors } } = form;

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await onSave(data);
      setTimeout(() => {
        onNext();
      }, 300);
    } catch (error) {
      console.error('Error saving use phase data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const footerContent = (
    <>
      {!isValid && Object.keys(errors).length > 0 && (
        <div className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          ℹ️ Please fill required fields
        </div>
      )}
      <StepFooterActions
        onBack={onBack}
        onForward={handleSubmit(onSubmit)}
        forwardDisabled={!isValid || isSaving}
        forwardLabel={isSaving ? '💾 Saving...' : 'Save & Next'}
        showLca={true}
        onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
        isCalculatingLca={isCalculatingLca}
      />
    </>
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={5}
        badgeLabel="Use Phase"
        title="Product Use Phase"
        description="Enter details about product lifetime and maintenance during use."
        footer={footerContent}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* ========== CORE PARAMETERS (Required) ========== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="productLifetime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Product Lifetime (years)*</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g., 25" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="maintenanceFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Maintenance Frequency (per year)*</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g., 1" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ========== ADVANCED OPTIONS ========== */}
          <AdvancedOptionsSection title="Advanced Options" defaultOpen={false}>
            <div className="space-y-8">
              {/* Additional Parameters */}
              <div className="space-y-6">
                <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>
                  Additional Parameters
                </h4>

                {/* Corrosion Environment */}
                <FormField
                  control={control}
                  name="corrosionEnvironment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Corrosion Environment</FormLabel>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        {corrosionEnvironmentOptions.map((opt) => (
                          <CardRadio
                            key={opt.id}
                            id={`corrosion-env-${opt.id}`}
                            label={opt.label}
                            selected={field.value === opt.id}
                            onSelect={() => field.onChange(field.value === opt.id ? '' : opt.id)}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="zincLossDuringUse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zinc Loss During Use (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="reusePotential"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reuse Potential (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              {/* Sustainability Focused Section */}
              <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                <div className="space-y-1 leading-none mb-4">
                  <h4 className="text-base font-semibold">
                    🌱 Sustainability Parameters
                  </h4>
                  <p className="text-sm text-gray-600">
                    Parameters related to extending product life and sustainability
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="lifetimeExtensionYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lifetime Extension (Years)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Additional years" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Additional years of product life achieved through sustainable practices
                        </FormDescription>
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
  );
}

// ==================== END OF LIFE RECYCLING STEP ====================
// Scrap type options
const scrapTypeOptions = [
  { id: "pre-consumer", label: "Pre-consumer" },
  { id: "post-consumer", label: "Post-consumer" },
  { id: "galvanized-steel-scrap", label: "Galvanized Steel Scrap" },
  { id: "mixed", label: "Mixed" },
];

// Sorting technology options
const sortingTechnologyOptions = [
  { id: "manual", label: "Manual" },
  { id: "magnetic", label: "Magnetic" },
  { id: "optical", label: "Optical" },
  { id: "xrf", label: "XRF" },
  { id: "libs", label: "LIBS" },
];

// Furnace type options for recycling
const recyclingFurnaceTypeOptions = [
  { id: "induction", label: "Induction" },
  { id: "eaf", label: "EAF" },
  { id: "rotary", label: "Rotary" },
];

const recyclingSchema = z.object({
  // Core Parameters (Required)
  scrapType: z.string().min(1, "Scrap type is required"),
  collectionRate: requiredNumber(0, 100, "Collection rate is required"),
  sortingTechnology: z.string().min(1, "Sorting technology is required"),
  contaminationLevel: requiredNumber(0, 100, "Contamination level is required"),
  remeltingEnergy: requiredNumber(0, undefined, "Remelting energy is required"),
  recoveryYield: requiredNumber(0, 100, "Recovery yield is required"),
  recycledContent: requiredNumber(0, 100, "Recycled content is required"),
  
  // Additional Parameters (Optional)
  furnaceType: z.string().nullable().optional(),
  slagGeneration: z.coerce.number().nullable().optional(),
  dustEmissionsPM: z.coerce.number().nullable().optional(),
  
  // Sustainability Parameters
  highPuritySorting: z.boolean().nullable().optional(),
  slagReused: z.coerce.number().min(0).max(100).nullable().optional(),
  renewableEnergy: z.coerce.number().min(0).max(100).nullable().optional(),
});

function RecyclingStep({ onNext, onBack, onSave, initialValues, onCalculateLCA, isCalculatingLca }) {
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(recyclingSchema),
    defaultValues: initialValues || {
      scrapType: '',
      collectionRate: '',
      sortingTechnology: '',
      contaminationLevel: '',
      remeltingEnergy: '',
      recoveryYield: '',
      recycledContent: '',
      furnaceType: '',
      slagGeneration: '',
      dustEmissionsPM: '',
      highPuritySorting: false,
      slagReused: '',
      renewableEnergy: '',
    },
    mode: "onTouched",
  });

  const { handleSubmit, control, watch, formState: { isValid, errors } } = form;

  const highPuritySorting = watch("highPuritySorting");

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await onSave(data);
      setTimeout(() => {
        onNext();
      }, 300);
    } catch (error) {
      console.error('Error saving recycling data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const footerContent = (
    <>
      {!isValid && Object.keys(errors).length > 0 && (
        <div className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          ℹ️ Please fill required fields
        </div>
      )}
      <StepFooterActions
        onBack={onBack}
        onForward={handleSubmit(onSubmit)}
        forwardDisabled={!isValid || isSaving}
        forwardLabel={isSaving ? '💾 Saving...' : 'Save & Next'}
        showLca={true}
        onLcaCalculate={() => onCalculateLCA?.(form.getValues())}
        isCalculatingLca={isCalculatingLca}
      />
    </>
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={6}
        badgeLabel="Recycling"
        title="End of Life Recycling"
        description="Enter details about zinc scrap collection, sorting, and recycling process."
        footer={footerContent}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* ========== CORE PARAMETERS (Required) ========== */}
          
          {/* Scrap Type Selection */}
          <FormField
            control={control}
            name="scrapType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Scrap Type*</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {scrapTypeOptions.map((opt) => (
                    <CardRadio
                      key={opt.id}
                      id={`scrap-type-${opt.id}`}
                      label={opt.label}
                      selected={field.value === opt.id}
                      onSelect={() => field.onChange(field.value === opt.id ? '' : opt.id)}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Collection Rate */}
          <FormField
            control={control}
            name="collectionRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Collection Rate (%)*</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sorting Technology Selection */}
          <FormField
            control={control}
            name="sortingTechnology"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Sorting Technology*</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                  {sortingTechnologyOptions.map((opt) => (
                    <CardRadio
                      key={opt.id}
                      id={`sorting-tech-${opt.id}`}
                      label={opt.label}
                      selected={field.value === opt.id}
                      onSelect={() => field.onChange(field.value === opt.id ? '' : opt.id)}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contamination, Energy, Yield, Recycled Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="contaminationLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Contamination Level (%)*</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="remeltingEnergy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Remelting Energy (kWh/t)*</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="kWh/t" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="recoveryYield"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Recovery Yield (%)*</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="recycledContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold`}>Recycled Content (%)*</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ========== ADVANCED OPTIONS ========== */}
          <AdvancedOptionsSection title="Advanced Options" defaultOpen={false}>
            <div className="space-y-8">
              {/* Additional Parameters */}
              <div className="space-y-6">
                <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>
                  Additional Parameters
                </h4>

                {/* Furnace Type */}
                <FormField
                  control={control}
                  name="furnaceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Furnace Type</FormLabel>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        {recyclingFurnaceTypeOptions.map((opt) => (
                          <CardRadio
                            key={opt.id}
                            id={`recycling-furnace-${opt.id}`}
                            label={opt.label}
                            selected={field.value === opt.id}
                            onSelect={() => field.onChange(field.value === opt.id ? '' : opt.id)}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="slagGeneration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slag Generation (kg/t scrap)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="dustEmissionsPM"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dust Emissions PM (kg/t)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              {/* Sustainability Focused Section */}
              <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                <div className="space-y-1 leading-none mb-4">
                  <h4 className="text-base font-semibold">
                    🌱 Sustainability Parameters
                  </h4>
                  <p className="text-sm text-gray-600">
                    Parameters related to sustainable recycling practices
                  </p>
                </div>
                
                <div className="space-y-6">
                  <FormField
                    control={control}
                    name="highPuritySorting"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          High Purity Sorting
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={control}
                      name="slagReused"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slag Reused (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="renewableEnergy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renewable Energy (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </AdvancedOptionsSection>
        </form>
      </StepSection>
    </FormProvider>
  );
}

// ==================== VALORIZATION STEP (STEP 7) ====================
const valorizationSchema = z.object({
  // Required Fields
  wasteType: z.string().min(1, 'Waste type is required'),
  valorizationMethod: z.string().min(1, 'Valorization method is required'),
  
  // Additional Inputs (Optional)
  valorizationRate: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  metalRecoveryRate: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  waterForTreatment: z.coerce.number().min(0).optional().or(z.literal('')),
  residue: z.coerce.number().min(0).optional().or(z.literal('')),
  sulfuricAcidProduced: z.coerce.number().min(0).optional().or(z.literal('')),
  
  // Sustainability Parameters
  circularEconomyPartnerships: z.boolean().optional(),
  slagInCement: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  jarositeBrickmaking: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  ironPrecipitateAsPigment: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
});

function ValorizationStep({ onNext, onBack, onSave, initialValues, onCalculateLCA, isCalculatingLca }) {
  const [isSaving, setIsSaving] = useState(false);
  const [sustainabilityOpen, setSustainabilityOpen] = useState(false);

  const methods = useForm({
    resolver: zodResolver(valorizationSchema),
    defaultValues: {
      wasteType: initialValues?.wasteType || '',
      valorizationMethod: initialValues?.valorizationMethod || '',
      valorizationRate: initialValues?.valorizationRate ?? '',
      metalRecoveryRate: initialValues?.metalRecoveryRate ?? '',
      waterForTreatment: initialValues?.waterForTreatment ?? '',
      residue: initialValues?.residue ?? '',
      sulfuricAcidProduced: initialValues?.sulfuricAcidProduced ?? '',
      circularEconomyPartnerships: initialValues?.circularEconomyPartnerships || false,
      slagInCement: initialValues?.slagInCement ?? '',
      jarositeBrickmaking: initialValues?.jarositeBrickmaking ?? '',
      ironPrecipitateAsPigment: initialValues?.ironPrecipitateAsPigment ?? '',
    },
    mode: 'onChange',
  });

  const { handleSubmit, formState: { errors, isValid }, watch, register, setValue } = methods;
  const wasteType = watch('wasteType');
  const valorizationMethod = watch('valorizationMethod');

  const wasteTypeOptions = [
    { id: 'jarosite', label: 'Jarosite' },
    { id: 'goethite', label: 'Goethite' },
    { id: 'ironPrecipitate', label: 'Iron Precipitate' },
    { id: 'leachResidue', label: 'Leach Residue' },
    { id: 'slag', label: 'Slag' },
    { id: 'dust', label: 'Dust' },
    { id: 'acidicEffluent', label: 'Acidic Effluent' },
  ];

  const valorizationMethodOptions = [
    { id: 'reuse', label: 'Reuse' },
    { id: 'recycle', label: 'Recycle' },
    { id: 'neutralize', label: 'Neutralize' },
    { id: 'dispose', label: 'Dispose' },
  ];

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await onSave(data);
      onNext();
    } catch (error) {
      console.error('Error saving valorization data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const footerContent = (
    <>
      {!isValid && Object.keys(errors).length > 0 && (
        <div className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          ℹ️ Please fill required fields
        </div>
      )}
      <StepFooterActions
        onBack={onBack}
        onForward={handleSubmit(onSubmit)}
        forwardDisabled={!isValid || isSaving}
        forwardLabel={isSaving ? '💾 Saving...' : '✓ Submit'}
        showLca={true}
        onLcaCalculate={() => onCalculateLCA?.(methods.getValues())}
        isCalculatingLca={isCalculatingLca}
      />
    </>
  );

  return (
    <FormProvider {...methods}>
      <StepSection
        stepNumber={7}
        badgeLabel="Valorization"
        title="Byproduct and Waste Valorization"
        description="Configure waste management and valorization parameters for zinc processing byproducts."
        footer={footerContent}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Waste Type Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Waste Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {wasteTypeOptions.map((opt) => (
                <CardRadio
                  key={opt.id}
                  id={`waste-type-${opt.id}`}
                  label={opt.label}
                  selected={wasteType === opt.id}
                  onSelect={() => setValue('wasteType', wasteType === opt.id ? '' : opt.id, { shouldValidate: true })}
                />
              ))}
            </div>
            {errors.wasteType && (
              <p className="text-red-500 text-sm mt-1">{errors.wasteType.message}</p>
            )}
          </div>

          {/* Valorization Method Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Valorization Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {valorizationMethodOptions.map((opt) => (
                <CardRadio
                  key={opt.id}
                  id={`valorization-method-${opt.id}`}
                  label={opt.label}
                  selected={valorizationMethod === opt.id}
                  onSelect={() => setValue('valorizationMethod', valorizationMethod === opt.id ? '' : opt.id, { shouldValidate: true })}
                />
              ))}
            </div>
            {errors.valorizationMethod && (
              <p className="text-red-500 text-sm mt-1">{errors.valorizationMethod.message}</p>
            )}
          </div>

          {/* Advanced Options */}
          <AdvancedOptionsSection title="Advanced Options" defaultOpen={false}>
            {/* Additional Inputs */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-4">Additional Inputs</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valorization Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('valorizationRate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 85"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metal Recovery Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('metalRecoveryRate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 92"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Water for Treatment (m³/t waste)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('waterForTreatment')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Residue (kg/t)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('residue')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sulfuric Acid Produced (kg/t)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('sulfuricAcidProduced')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 800 (if sulfur captured)"
                  />
                </div>
              </div>
            </div>

            {/* Sustainability Section */}
            <div className="border border-green-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setSustainabilityOpen(!sustainabilityOpen)}
                className="w-full px-6 py-4 bg-green-50 flex items-center justify-between hover:bg-green-100 transition-colors"
              >
                <span className="text-md font-semibold text-green-800">Sustainability Parameters</span>
                <svg
                  className={`w-5 h-5 text-green-600 transform transition-transform ${sustainabilityOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sustainabilityOpen && (
                <div className="p-6 bg-green-50/50 space-y-6">
                  {/* Circular Economy Partnerships Checkbox */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="circularEconomyPartnerships"
                      {...register('circularEconomyPartnerships')}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="circularEconomyPartnerships" className="text-sm font-medium text-gray-700">
                      Circular Economy Partnerships
                    </label>
                  </div>

                  {/* Valorization Percentages */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slag in Cement (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('slagInCement')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., 30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jarosite Brickmaking (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('jarositeBrickmaking')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Iron Precipitate as Pigment (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('ironPrecipitateAsPigment')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., 15"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AdvancedOptionsSection>
        </form>
      </StepSection>
    </FormProvider>
  );
}

// ==================== MAIN WIZARD FORM ====================
export default function WizardFormZn({ steps, activeStep, onStepChange, onMaterialSourceChange }) {
  const [formValues, setFormValues] = useState({});
  const [workflowId, setWorkflowId] = useState(null);
  const [isCalculatingLca, setIsCalculatingLca] = useState(false);
  
  // Material source state
  const [materialSource, setMaterialSource] = useState('primary'); // 'primary', 'secondary', or 'mixed'
  const [primaryPercentage, setPrimaryPercentage] = useState(100);
  const [secondaryPercentage, setSecondaryPercentage] = useState(0);
  
  // Notify parent of material source changes
  useEffect(() => {
    if (onMaterialSourceChange) {
      onMaterialSourceChange({ materialSource, primaryPercentage, secondaryPercentage });
    }
  }, [materialSource, primaryPercentage, secondaryPercentage, onMaterialSourceChange]);

  // Load data from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(ZINC_WORKFLOW_KEY);
    const savedMetadata = localStorage.getItem(ZINC_WORKFLOW_METADATA_KEY);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormValues(parsedData);
        console.log('📂 Loaded zinc workflow data from local storage:', parsedData);
      } catch (error) {
        console.error('Error parsing saved data:', error);
      }
    }
    
    if (savedMetadata) {
      try {
        const parsedMetadata = JSON.parse(savedMetadata);
        setWorkflowId(parsedMetadata.workflowId);
        console.log('📂 Loaded zinc workflow metadata from local storage:', parsedMetadata);
      } catch (error) {
        console.error('Error parsing saved metadata:', error);
      }
    } else {
      // Generate a new workflow ID if none exists
      const newWorkflowId = `zinc-workflow-${Date.now()}`;
      setWorkflowId(newWorkflowId);
      const metadata = {
        workflowId: newWorkflowId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(ZINC_WORKFLOW_METADATA_KEY, JSON.stringify(metadata));
      console.log('🆕 Created new zinc workflow:', newWorkflowId);
    }
  }, []);

  // Save to local storage whenever formValues changes
  useEffect(() => {
    if (Object.keys(formValues).length > 0) {
      localStorage.setItem(ZINC_WORKFLOW_KEY, JSON.stringify(formValues));
      
      // Update metadata timestamp
      const savedMetadata = localStorage.getItem(ZINC_WORKFLOW_METADATA_KEY);
      if (savedMetadata) {
        try {
          const metadata = JSON.parse(savedMetadata);
          metadata.lastUpdated = new Date().toISOString();
          localStorage.setItem(ZINC_WORKFLOW_METADATA_KEY, JSON.stringify(metadata));
        } catch (error) {
          console.error('Error updating metadata:', error);
        }
      }
      
      console.log('💾 Saved zinc workflow data to local storage');
    }
  }, [formValues]);

  const handleSaveStep = async (stepName, data) => {
    console.log(`💾 Saving ${stepName} step:`, data);
    setFormValues((prev) => ({
      ...prev,
      [stepName]: data,
    }));
    return Promise.resolve();
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      onStepChange(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      onStepChange(activeStep - 1);
    }
  };

  // Get current step info
  const currentStep = steps[activeStep];
  const stepKey = currentStep?.key;
  const stepValues = formValues[stepKey] || {};

  // Handle LCA calculation
  const handleCalculateLCA = useCallback((stepData) => {
    console.log('🧮 Calculating LCA Score for zinc workflow...', stepData);
    setIsCalculatingLca(true);
    
    // Simulate LCA calculation (since using local storage, no backend)
    setTimeout(() => {
      const allData = { ...formValues, [stepKey]: stepData };
      console.log('✅ LCA Calculation complete! Data:', allData);
      
      // TODO: Implement actual LCA calculation logic or show results modal
      alert('LCA Score calculation would happen here!\n\nThis is a placeholder for zinc LCA calculation.\nIntegrate with your LCA engine when ready.');
      
      setIsCalculatingLca(false);
    }, 1500);
  }, [formValues, stepKey]);

  // Render the appropriate step component
  const renderStep = () => {
    switch (stepKey) {
      case 'mining':
        return (
          <MiningStep
            onNext={handleNext}
            onSave={(data) => handleSaveStep('mining', data)}
            initialValues={stepValues}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
          />
        );
      case 'beneficiation':
        return (
          <BeneficiationStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('beneficiation', data)}
            initialValues={stepValues}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
          />
        );
      case 'extraction':
        return (
          <ExtractionStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('extraction', data)}
            initialValues={stepValues}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
          />
        );
      case 'manufacturing':
        return (
          <ManufacturingStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('manufacturing', data)}
            initialValues={stepValues}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
          />
        );
      case 'usePhase':
        return (
          <UsePhaseStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('usePhase', data)}
            initialValues={stepValues}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
          />
        );
      case 'recycling':
        return (
          <RecyclingStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('recycling', data)}
            initialValues={stepValues}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
          />
        );
      case 'valorization':
        return (
          <ValorizationStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('valorization', data)}
            initialValues={stepValues}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
          />
        );
      default:
        return (
          <div className="text-center p-8">
            <p className="text-lg text-gray-600">
              Step "{stepKey}" is not yet implemented.
            </p>
            <div className="mt-4 flex gap-4 justify-center">
              {activeStep > 0 && (
                <Button onClick={handleBack} variant="outline">
                  ← Previous
                </Button>
              )}
              {activeStep < steps.length - 1 && (
                <Button onClick={handleNext}>
                  Next →
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
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
              }}
              className="w-5 h-5 text-[#BA7967] focus:ring-2 focus:ring-[#BA7967]"
            />
            <span className="text-gray-700 group-hover:text-gray-900 font-medium">
              100% Primary Zinc (from ore)
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
              }}
              className="w-5 h-5 text-[#BA7967] focus:ring-2 focus:ring-[#BA7967]"
            />
            <span className="text-gray-700 group-hover:text-gray-900 font-medium">
              100% Secondary/Recycled Zinc
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

        {/* Info message for secondary selection */}
        {materialSource === 'secondary' && (
          <div className="mt-4 p-3 rounded-lg border border-[#e3d4c8] bg-linear-to-br from-amber-50 to-orange-50 text-sm text-gray-700">
            ℹ️ With 100% Secondary Zinc, the first 6 stages (Mining, Beneficiation, Roasting, Leaching, Purification, Electrolysis) are skipped. 
            The workflow starts from the Manufacturing stage.
          </div>
        )}
      </div>
      
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
}
