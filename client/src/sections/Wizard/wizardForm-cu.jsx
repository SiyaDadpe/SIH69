import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Typography scale
const HEADING_TEXT = "text-[22px] sm:text-[24px] md:text-[26px]";
const GROUP_HEADING_TEXT = "text-[16px] sm:text-[18px]";
const OPTION_TEXT = "text-[13px] sm:text-[14px]";

const stepVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -18, scale: 0.98 },
};

// Reusable card-style checkbox
function CardCheckbox({ id, label, checked, onChange }) {
  const labelId = `${id}-label`;
  return (
    <div
      role="checkbox"
      aria-checked={!!checked}
      aria-labelledby={labelId}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={[
        "group cursor-pointer rounded-lg border p-3 shadow-sm transition-colors duration-200 ease-in-out focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#BA7967] focus-visible:ring-offset-2",
        checked ? "bg-[#BA7967] text-white border-transparent" : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50",
      ].join(" ")}
      id={id}
    >
      <div className="flex items-start gap-3">
        <input type="checkbox" className="sr-only" aria-hidden="true" tabIndex={-1} checked={!!checked} readOnly />
        <div id={labelId} className={`font-medium leading-snug ${OPTION_TEXT}`}>{label}</div>
      </div>
    </div>
  );
}

// Reusable card-style radio
function CardRadio({ id, label, selected, onSelect }) {
  const labelId = `${id}-label`;
  return (
    <div
      role="radio"
      aria-checked={!!selected}
      aria-labelledby={labelId}
      tabIndex={0}
      onClick={() => onSelect()}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={[
        "group cursor-pointer rounded-lg border p-3 shadow-sm transition-colors duration-200 ease-in-out focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#BA7967] focus-visible:ring-offset-2",
        selected ? "bg-[#BA7967] text-white border-transparent" : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50",
      ].join(" ")}
      id={id}
    >
      <div className="flex items-start gap-3">
        <input type="radio" className="sr-only" aria-hidden="true" tabIndex={-1} checked={!!selected} readOnly />
        <div id={labelId} className={`font-medium leading-snug ${OPTION_TEXT}`}>{label}</div>
      </div>
    </div>
  );
}

function StepSection({ stepNumber, badgeLabel, title, description, children, onPredict, predicting, footer }) {
  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative"
    >
      <Card className="w-full rounded-3xl border border-[#e7dfd2] bg-linear-to-br from-[#fbfaf7] via-[#f4f2ec] to-[#efe6dd] shadow-xl">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{
          background: "radial-gradient(circle at 20% 20%, rgba(186,121,103,0.12), transparent 55%)",
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
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">🤖</span>
                  {predicting ? "Predicting..." : "Generate AI Predictions"}
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent className="relative z-10">{children}</CardContent>
        {footer && (
          <CardFooter className="relative z-10 border-t border-[#e3d4c8] pt-6">
            {footer}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

function StepFooterActions({ onBack, onForward, forwardDisabled, forwardLabel = 'Next', showLca = true }) {
  const handleForwardClick = () => {
    if (typeof onForward === 'function') {
      onForward()
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            <span className="ml-2">→</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// Step 1: Mining
function CopperMiningStep({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const schema = z.object({
    miningMethod: z.string().nullable().optional(),
    oreType: z.string().nullable().optional(),
    oreGradePercentCu: z.coerce.number().nullable().optional(),
    region: z.string().nullable().optional(),
    depositDepth: z.coerce.number().nullable().optional(),
    benchHeight: z.coerce.number().nullable().optional(),
    rockHardnessIndex: z.coerce.number().nullable().optional(),
    overburdenWasteRatio: z.coerce.number().nullable().optional(),
    strippingRatio: z.coerce.number().nullable().optional(),
    tailingsGenerationRate: z.coerce.number().nullable().optional(),
    mineProductionPerDay: z.coerce.number().nullable().optional(),
    averageHaulDistance: z.coerce.number().nullable().optional(),
    mineLifetimeYears: z.coerce.number().nullable().optional(),
    oreThroughputPerYear: z.coerce.number().nullable().optional(),
    shiftHoursPerDay: z.coerce.number().nullable().optional(),
    equipmentAvailabilityPercent: z.coerce.number().nullable().optional(),
    equipmentType: z.string().nullable().optional(),
    equipmentCount: z.coerce.number().nullable().optional(),
    equipmentCapacity: z.coerce.number().nullable().optional(),
    explosivesUsed: z.coerce.number().nullable().optional(),
    fuelConsumption: z.coerce.number().nullable().optional(),
    electricityConsumption: z.coerce.number().nullable().optional(),
    powerSourceMixRenewable: z.coerce.number().nullable().optional(),
    powerSourceMixFossil: z.coerce.number().nullable().optional(),
    powerSourceMixGrid: z.coerce.number().nullable().optional(),
    energyEfficiency: z.coerce.number().nullable().optional(),
    waterConsumption: z.coerce.number().nullable().optional(),
    waterSource: z.string().nullable().optional(),
    waterReuseRate: z.coerce.number().nullable().optional(),
    waterDischargePh: z.coerce.number().nullable().optional(),
    acidMineDrainageRisk: z.string().nullable().optional(),
    directGhgEmissions: z.coerce.number().nullable().optional(),
    dustEmissions: z.coerce.number().nullable().optional(),
    noiseLevel: z.coerce.number().nullable().optional(),
    landDisturbed: z.coerce.number().nullable().optional(),
    rehabilitationArea: z.coerce.number().nullable().optional(),
    biodiversityImpact: z.coerce.number().nullable().optional(),
    oreRecovery: z.coerce.number().nullable().optional(),
    oreLoss: z.coerce.number().nullable().optional(),
    miningCost: z.coerce.number().nullable().optional(),
    dieselPrice: z.coerce.number().nullable().optional(),
    electricityCost: z.coerce.number().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      rehabilitationPlanActive: z.boolean().nullable().optional(),
      overburdenRestoredPercent: z.coerce.number().nullable().optional(),
      waterReuseRate: z.coerce.number().nullable().optional(),
      biodiversityProtectionScore: z.string().nullable().optional(),
      dustSuppression: z.string().nullable().optional(),
    }).nullable().optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      sustainabilityParameters: {},
    },
    mode: "onTouched",
  });

  const { control, handleSubmit, setValue, watch, formState: { isValid, errors } } = form;

  useEffect(() => {
    if (initialValues) {
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: false, shouldDirty: false });
      });
    }
  }, [initialValues, setValue]);

  const onSubmit = async (data) => {
    console.log('='.repeat(80));
    console.log('🎯 [Copper Mining Form] FORM SUBMISSION STARTED');
    console.log('='.repeat(80));
    console.log('📋 Form Data:', JSON.stringify(data, null, 2));
    console.log('✅ Form is valid:', isValid);
    console.log('❌ Form errors:', Object.keys(errors));

    try {
      console.log('💾 [Copper Mining Form] Calling onSave function...');
      if (!onSave) {
        console.error('❌ [Copper Mining Form] onSave function is not provided!');
        return;
      }

      await onSave(data);
      console.log('✅ [Copper Mining Form] onSave completed successfully');

      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('➡️  [Copper Mining Form] Calling onNext to move to next step...');
      if (onNext) {
        onNext();
        console.log('✅ [Copper Mining Form] onNext called');
      }

      console.log('='.repeat(80));
      console.log('✅ [Copper Mining Form] FORM SUBMISSION COMPLETED');
      console.log('='.repeat(80));
    } catch (e) {
      console.error('='.repeat(80));
      console.error('❌ [Copper Mining Form] FORM SUBMISSION FAILED');
      console.error('='.repeat(80));
      console.error('Error details:', e);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);
    }
  };

  const miningMethodOptions = [
    { value: "open-pit", label: "Open Pit" },
    { value: "underground", label: "Underground" },
    { value: "ISL", label: "In-situ Leaching (ISL)" },
    { value: "solution extraction", label: "Solution Extraction" },
  ];
  const oreTypeOptions = [
    { value: "oxide", label: "Oxide" },
    { value: "sulfide", label: "Sulfide" },
  ];
  const equipmentTypeOptions = [
    { value: "diesel", label: "Diesel" },
    { value: "electric", label: "Electric" },
    { value: "hybrid", label: "Hybrid" },
  ];
  const waterSources = [
    { value: "ground", label: "Ground" },
    { value: "recycled", label: "Recycled" },
    { value: "surface", label: "Surface" },
  ];
  const acidRiskOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={false}
    />
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={1}
        badgeLabel="Mining"
        title="Copper Mining Inputs"
        description="Capture extraction, material balance, energy, water, and emissions for the copper site."
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* Sustainability Checkbox - COMMENTED OUT FOR NOW */}
            {/* 
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
                        Enable to include sustainability parameters for copper mining
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            */}

            {/* Sustainability Parameters - COMMENTED OUT FOR NOW */}
            {/* 
            {watch("followingSustainableRules") === true && (
              <div className="rounded-lg border border-[#BA7967] bg-white/50 p-6">
                <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                  Sustainability Parameters
                </h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name="sustainabilityParameters.rehabilitationPlanActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-medium">Rehabilitation Plan Active</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.overburdenRestoredPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overburden Restored (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.waterReuseRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Water Reuse Rate (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0-100" value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={control}
                    name="sustainabilityParameters.biodiversityProtectionScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biodiversity Protection Score</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select score" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Moderate">Moderate</SelectItem>
                            <SelectItem value="High">High</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Smart AI-Atomization">Smart AI-Atomization</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            */}

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Geology & Site Fundamentals</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="miningMethod" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Mining Method*</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {miningMethodOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`mining-method-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="oreType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Type*</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                        {oreTypeOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`ore-type-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="oreGradePercentCu" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Grade (% Cu)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.85" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="region" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Region or Country*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chile, Atacama" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="depositDepth" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Deposit Depth (m)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 350" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="benchHeight" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Bench Height (m)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 15" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="rockHardnessIndex" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Rock Hardness Index</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 65" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Material Ratios</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="overburdenWasteRatio" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Overburden / Waste Rock Ratio* (m³/t)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 1.9" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="strippingRatio" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Stripping Ratio (t waste / t ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 2.3" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="tailingsGenerationRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Tailings Generation Rate (t/t Cu)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.4" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Production & Operations</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="mineProductionPerDay" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Mine Production (t/day)*</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 120000" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="averageHaulDistance" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Average Haul Distance (km)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 4.5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="mineLifetimeYears" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Mine Lifetime (years)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 22" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="oreThroughputPerYear" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Throughput (t/year)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 35,000,000" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="shiftHoursPerDay" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Shift Hours per Day</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 20" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="equipmentAvailabilityPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Equipment Availability (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 87" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Equipment & Energy</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="equipmentType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Equipment Type*</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-3">
                        {equipmentTypeOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`equipment-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="equipmentCount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Equipment Count</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 45" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="equipmentCapacity" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Equipment Capacity (t)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 320" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="explosivesUsed" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Explosives Used (kg/t ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.35" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="fuelConsumption" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Fuel Consumption (L/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 2.1" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="electricityConsumption" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Electricity Consumption (kWh/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 15" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="powerSourceMixRenewable" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Power Mix Renewable (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 25" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="powerSourceMixFossil" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Power Mix Fossil (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 60" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="powerSourceMixGrid" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Grid Mix (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 15" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="energyEfficiency" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Energy Efficiency of Machines (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 78" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Water & Environmental Management</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="waterConsumption" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Consumption (m³/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.6" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="waterSource" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Source*</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-3">
                        {waterSources.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`water-source-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="waterReuseRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Reuse Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 45" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="waterDischargePh" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Discharge Quality (pH)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 7.2" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="acidMineDrainageRisk" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Acid Mine Drainage Risk</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {acidRiskOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`acid-risk-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Emissions & Land Impact</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="directGhgEmissions" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Direct GHG (kg CO₂e/t ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 45" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="dustEmissions" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Dust Emissions PM10 (kg/t ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.08" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="noiseLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Noise Level (dB)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 78" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="landDisturbed" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Land Disturbed (m²/t ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.15" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="rehabilitationArea" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Rehabilitation Area (ha/year)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 120" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="biodiversityImpact" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Biodiversity Impact Score</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 6" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Economic & Advanced Inputs</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="oreRecovery" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Recovery (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 92" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="oreLoss" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Loss (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 3" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="miningCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Mining Cost (USD/t ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 12.5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="dieselPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Diesel Price (USD/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 1.1" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="electricityCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Electricity Cost (USD/kWh)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" placeholder="e.g., 0.09" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  );
}

// Step 2: Beneficiation
function CopperBeneficiationStep({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const schema = z.object({
    oreType: z.string().nullable().optional(),
    oreGradePercentCu: z.coerce.number().nullable().optional(),
    concentrateGradePercentCu: z.coerce.number().nullable().optional(),
    mineralogyDetails: z.string().nullable().optional(),
    mineralogyDetailsOther: z.string().nullable().optional(),
    particleSizeAfterGrinding: z.coerce.number().nullable().optional(),
    moistureContentPercent: z.coerce.number().nullable().optional(),
    grindingEnergyKwhPerTonne: z.coerce.number().nullable().optional(),
    reagentConsumptionKgPerTonne: z.coerce.number().nullable().optional(),
    reagentType: z.string().nullable().optional(),
    reagentMixRatioPercent: z.coerce.number().nullable().optional(),
    flotationCellType: z.string().nullable().optional(),
    thickenerEfficiencyPercent: z.coerce.number().nullable().optional(),
    filtrationType: z.string().nullable().optional(),
    equipmentAgeYears: z.coerce.number().nullable().optional(),
    millLoadingPercent: z.coerce.number().nullable().optional(),
    waterConsumptionM3PerTonne: z.coerce.number().nullable().optional(),
    waterRecycledPercent: z.coerce.number().nullable().optional(),
    waterSource: z.string().nullable().optional(),
    processWaterTemperature: z.coerce.number().nullable().optional(),
    slurryPumpingDistanceKm: z.coerce.number().nullable().optional(),
    recoveryEfficiencyPercent: z.coerce.number().nullable().optional(),
    tailingsProducedTonnePerTonne: z.coerce.number().nullable().optional(),
    tailingsSolidsContentPercent: z.coerce.number().nullable().optional(),
    tailingsStorageType: z.string().nullable().optional(),
    chemicalResidueInTailingsMgPerL: z.coerce.number().nullable().optional(),
    airEmissionsPmKgPerTonne: z.coerce.number().nullable().optional(),
    wastewaterPh: z.coerce.number().nullable().optional(),
    wastewaterCodMgPerL: z.coerce.number().nullable().optional(),
    ghgEmissionsKgCo2ePerTonne: z.coerce.number().nullable().optional(),
    plantCapacityTPerDay: z.coerce.number().nullable().optional(),
    operatingHoursPerDay: z.coerce.number().nullable().optional(),
    powerCostUsdPerKwh: z.coerce.number().nullable().optional(),
    reagentCostUsdPerKg: z.coerce.number().nullable().optional(),
    maintenanceCostUsdPerTonne: z.coerce.number().nullable().optional(),
    // Sustainability Parameters
    followingSustainableRules: z.boolean().nullable().optional(),
    sustainabilityParameters: z.object({
      bioBasedReagents: z.boolean().nullable().optional(),
      zeroLiquidDischargeEnabled: z.boolean().nullable().optional(),
      tailingsDewateringMethod: z.string().nullable().optional(),
      waterTreatment: z.string().nullable().optional(),
      tailingsReusePotentialPercent: z.coerce.number().nullable().optional(),
    }).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {},
    mode: "onTouched",
  });

  const { control, handleSubmit, setValue, formState: { isValid, errors }, watch } = form;

  // Sync form with updated initialValues
  useEffect(() => {
    if (initialValues) {
      console.log('🔄 [Beneficiation Form] Syncing with updated initial values:', initialValues);
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      console.log('✅ [Beneficiation Form] Form synced');
    }
  }, [JSON.stringify(initialValues), setValue]);

  const selectedMineralogy = watch("mineralogyDetails");

  const onSubmit = async (data) => {
    console.log('🎯 [Beneficiation Form] FORM SUBMISSION STARTED');
    console.log('📋 Form Data:', JSON.stringify(data, null, 2));
    try {
      if (!onSave) {
        console.error('❌ [Beneficiation Form] onSave not provided!');
        return;
      }
      await onSave(data);
      console.log('✅ [Beneficiation Form] onSave completed');
      await new Promise(resolve => setTimeout(resolve, 500));
      if (onNext) {
        onNext();
        console.log('✅ [Beneficiation Form] onNext called');
      }
    } catch (e) {
      console.error('❌ [Beneficiation Form] submission failed:', e);
    }
  };

  const oreTypeOptions = [
    { value: "oxide", label: "Oxide" },
    { value: "sulfide", label: "Sulfide" },
  ];
  const mineralogyOptions = [
    { value: "chalcopyrite", label: "Chalcopyrite" },
    { value: "bornite", label: "Bornite" },
    { value: "malachite", label: "Malachite" },
    { value: "azurite", label: "Azurite" },
    { value: "chalcocite", label: "Chalcocite" },
    { value: "other", label: "Other" },
  ];
  const reagentTypeOptions = [
    { value: "collector", label: "Collector" },
    { value: "frother", label: "Frother" },
    { value: "modifier", label: "Modifier" },
  ];
  const flotationCellTypeOptions = [
    { value: "mechanical", label: "Mechanical" },
    { value: "column", label: "Column" },
    { value: "pneumatic", label: "Pneumatic" },
  ];
  const filtrationTypeOptions = [
    { value: "vacuum", label: "Vacuum" },
    { value: "pressure", label: "Pressure" },
  ];
  const waterSourceOptions = [
    { value: "ground", label: "Ground" },
    { value: "recycled", label: "Recycled" },
    { value: "surface", label: "Surface" },
  ];
  const tailingsStorageTypeOptions = [
    { value: "wet", label: "Wet" },
    { value: "dry", label: "Dry" },
    { value: "paste", label: "Paste" },
  ];

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={false}
    />
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={2}
        badgeLabel="Beneficiation"
        title="Copper Beneficiation Inputs"
        description="Ore concentration, flotation, grinding, water use, and process efficiency."
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Ore Characteristics</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="oreType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Type*</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {oreTypeOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`ben-ore-type-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="oreGradePercentCu" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Grade (% Cu)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.85" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="concentrateGradePercentCu" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Concentrate Grade (% Cu)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 28" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="mineralogyDetails" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Mineralogy Details</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mineralogy" />
                        </SelectTrigger>
                        <SelectContent>
                          {mineralogyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="particleSizeAfterGrinding" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Particle Size After Grinding (μm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 75" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="moistureContentPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Moisture Content (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 8" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              {selectedMineralogy === "other" && (
                <FormField control={control} name="mineralogyDetailsOther" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Specify Other Mineralogy</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Covellite" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Process and Equipment</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="grindingEnergyKwhPerTonne" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Grinding Energy (kWh/tonne ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 18" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="reagentConsumptionKgPerTonne" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Reagent Consumption (kg/tonne ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 1.2" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="reagentType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Reagent Type</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-3">
                        {reagentTypeOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`reagent-type-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="reagentMixRatioPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Reagent Mix Ratio (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 30" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="flotationCellType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Flotation Cell Type</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-3">
                        {flotationCellTypeOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`flotation-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="thickenerEfficiencyPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Thickener Efficiency (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 85" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="filtrationType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Filtration Type</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filtrationTypeOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`filtration-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="equipmentAgeYears" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Equipment Age (years)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 12" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="millLoadingPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Mill Loading (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 75" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Water and Resource Use</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="waterConsumptionM3PerTonne" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Consumption (m³/tonne ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 1.2" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="waterRecycledPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Recycled (%)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 75" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="waterSource" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Source</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-3">
                        {waterSourceOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`ben-water-source-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="processWaterTemperature" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Process Water Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 22" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="slurryPumpingDistanceKm" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Slurry Pumping Distance (km)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 3.5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Outputs and Environmental Data</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="recoveryEfficiencyPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Recovery Efficiency (%)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 88" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="tailingsProducedTonnePerTonne" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Tailings Produced (tonne/tonne ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.9" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="tailingsSolidsContentPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Tailings Solids Content (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 65" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="tailingsStorageType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Tailings Storage Type</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {tailingsStorageTypeOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`tailings-storage-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="chemicalResidueInTailingsMgPerL" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Chemical Residue in Tailings (mg/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 2.5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="airEmissionsPmKgPerTonne" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Air Emissions PM (kg/tonne ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.15" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="wastewaterPh" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Wastewater pH</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 7.4" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="wastewaterCodMgPerL" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Wastewater COD (mg/L)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 120" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="ghgEmissionsKgCo2ePerTonne" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>GHG Emissions (kgCO₂e/tonne ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 35" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Operational and Economic Data</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="plantCapacityTPerDay" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Plant Capacity (t/day)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50000" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="operatingHoursPerDay" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Operating Hours per Day</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 22" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="powerCostUsdPerKwh" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Power Cost (USD/kWh)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" placeholder="e.g., 0.08" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="reagentCostUsdPerKg" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Reagent Cost (USD/kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 2.5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="maintenanceCostUsdPerTonne" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Maintenance Cost (USD/tonne ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 1.2" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            {/* Sustainability Parameters - COMMENTED OUT */}
            {/* 
            <section className="space-y-6">
              <div className="space-y-4">
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
                          Enable to include sustainability parameters for copper beneficiation
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("followingSustainableRules") === true && (
                <div className="rounded-lg border border-[#BA7967] bg-white/50 p-6">
                  <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                    Sustainability Parameters
                  </h3>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={control}
                      name="sustainabilityParameters.bioBasedReagents"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={(checked) => field.onChange(checked)}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">Bio-based Reagents</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={control}
                      name="sustainabilityParameters.zeroLiquidDischargeEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={(checked) => field.onChange(checked)}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">Zero-Liquid-Discharge Enabled</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={control}
                      name="sustainabilityParameters.tailingsDewateringMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tailings Dewatering Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Conventional">Conventional</SelectItem>
                              <SelectItem value="Thickened">Thickened</SelectItem>
                              <SelectItem value="Dry Stack">Dry Stack</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={control}
                      name="sustainabilityParameters.waterTreatment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Water Treatment</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select treatment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Basic">Basic</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                              <SelectItem value="Hybrid AI-Controlled">Hybrid AI-Controlled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={control}
                      name="sustainabilityParameters.tailingsReusePotentialPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tailings Reuse Potential (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0-100" value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </section>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  );
}

// Step 3: Refining
// Step 3: Extraction (formerly Refining)
function CopperRefiningStep({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const schema = z.object({
    processRoute: z.string().nullable().optional(),
    oreType: z.string().nullable().optional(),
    concentrateGradePercentCu: z.coerce.number().nullable().optional(),
    oreThroughputTPerDay: z.coerce.number().nullable().optional(),
    moistureContentPercent: z.coerce.number().nullable().optional(),
    impurityContentPercent: z.coerce.number().nullable().optional(),
    // Pyrometallurgical
    smeltingTechnique: z.string().nullable().optional(),
    smeltingEnergyMjPerTonne: z.coerce.number().nullable().optional(),
    fuelType: z.string().nullable().optional(),
    sulfurCaptureEfficiencyPercent: z.coerce.number().nullable().optional(),
    slagProducedKgPerTonne: z.coerce.number().nullable().optional(),
    metalLossInSlagPercent: z.coerce.number().nullable().optional(),
    electrorefiningEnergyKwhPerTonne: z.coerce.number().nullable().optional(),
    waterConsumptionM3PerTonnePyro: z.coerce.number().nullable().optional(),
    recycledWaterPercentPyro: z.coerce.number().nullable().optional(),
    acidProducedKgH2SO4PerTonne: z.coerce.number().nullable().optional(),
    // Hydrometallurgical
    leachingMethod: z.string().nullable().optional(),
    acidConsumptionKgH2SO4PerTonne: z.coerce.number().nullable().optional(),
    leachingEfficiencyPercent: z.coerce.number().nullable().optional(),
    electrowinningEnergyKwhPerKgCu: z.coerce.number().nullable().optional(),
    solventLossKgPerTonneCu: z.coerce.number().nullable().optional(),
    electrowinningCurrentDensity: z.coerce.number().nullable().optional(),
    waterConsumptionM3PerTonneHydro: z.coerce.number().nullable().optional(),
    recycledWaterPercentHydro: z.coerce.number().nullable().optional(),
    temperatureCelsius: z.coerce.number().nullable().optional(),
    // Environmental and By-Product
    ghgEmissionsKgCo2ePerTonne: z.coerce.number().nullable().optional(),
    so2EmissionsKgPerTonne: z.coerce.number().nullable().optional(),
    slagRecyclingRatePercent: z.coerce.number().nullable().optional(),
    acidRecyclingPercent: z.coerce.number().nullable().optional(),
    heavyMetalResidueMgPerL: z.coerce.number().nullable().optional(),
    wasteSolutionPh: z.coerce.number().nullable().optional(),
    byProductRecoveryAuAgKgPerTonne: z.coerce.number().nullable().optional(),
    followingSustainableRules: z.boolean().optional(),
    sustainabilityParameters: z.object({
      pyro_renewablePowerPercent: z.coerce.number().nullable().optional(),
      pyro_slagRecyclingRate: z.coerce.number().nullable().optional(),
      pyro_so2CaptureIntoSulfuricAcid: z.boolean().nullable().optional(),
      pyro_flueGasCleaning: z.string().nullable().optional(),
      pyro_wasteHeatCapturePercent: z.coerce.number().nullable().optional(),
      hydro_acidRecoveryPercent: z.coerce.number().nullable().optional(),
      hydro_organicSolventRecovery: z.boolean().nullable().optional(),
      hydro_renewableElectricityUseInElectrowinning: z.boolean().nullable().optional(),
      hydro_recycledWaterRate: z.coerce.number().nullable().optional(),
    }).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {},
    mode: "onTouched",
  });

  const { control, handleSubmit, setValue, formState: { isValid, errors }, watch } = form;

  useEffect(() => {
    if (initialValues) {
      console.log('🔄 [Refining Form] Syncing with initial values');
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      console.log('✅ [Refining Form] Form synced');
    }
  }, [JSON.stringify(initialValues), setValue]);

  const selectedRoute = watch("processRoute");

  const onSubmit = async (data) => {
    console.log('🎯 [Refining Form] FORM SUBMISSION');
    try {
      if (!onSave) return;
      await onSave(data);
      console.log('✅ [Refining Form] Saved');
      await new Promise(resolve => setTimeout(resolve, 500));
      if (onNext) onNext();
    } catch (e) {
      console.error('❌ [Refining Form] Failed:', e);
    }
  };

  const processRouteOptions = [
    { value: "pyrometallurgical", label: "Pyrometallurgical Route", subtitle: "For sulfide ores" },
    { value: "hydrometallurgical", label: "Hydrometallurgical Route (SX-EW)", subtitle: "Solvent extraction & electrowinning" },
  ];
  const oreTypeOptions = [
    { value: "oxide", label: "Oxide" },
    { value: "sulfide", label: "Sulfide" },
  ];
  const smeltingTechniqueOptions = [
    { value: "flash", label: "Flash" },
    { value: "bath", label: "Bath" },
    { value: "reverberatory", label: "Reverberatory" },
  ];
  const fuelTypeOptions = [
    { value: "coal", label: "Coal" },
    { value: "oil", label: "Oil" },
    { value: "natural gas", label: "Natural Gas" },
  ];
  const leachingMethodOptions = [
    { value: "heap", label: "Heap" },
    { value: "in-situ", label: "In-situ" },
    { value: "agitated", label: "Agitated" },
  ];

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={false}
    />
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={3}
        badgeLabel="Extraction"
        title="Copper Extraction Inputs"
        description="Choose extraction route and provide process-specific parameters."
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Extraction Route Selection</p>
              <FormField control={control} name="processRoute" render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className={GROUP_HEADING_TEXT}>Process Route*</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {processRouteOptions.map((option) => (
                        <motion.div
                          key={option.value}
                          whileHover={{ scale: 1.02, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div
                            role="radio"
                            aria-checked={field.value === option.value}
                            tabIndex={0}
                            onClick={() => field.onChange(field.value === option.value ? "" : option.value)}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                field.onChange(field.value === option.value ? "" : option.value);
                              }
                            }}
                            className={[
                              "relative cursor-pointer rounded-2xl border-2 p-6 shadow-lg transition-all duration-300 ease-out focus:outline-none",
                              "focus-visible:ring-4 focus-visible:ring-[#BA7967] focus-visible:ring-offset-2",
                              field.value === option.value
                                ? "border-[#BA7967] bg-linear-to-br from-[#BA7967] to-[#a86b5c] text-white shadow-2xl"
                                : "border-gray-200 bg-white text-gray-900 hover:border-[#BA7967]/50 hover:shadow-xl",
                            ].join(" ")}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <h3 className={`text-lg font-bold ${field.value === option.value ? 'text-white' : 'text-gray-900'}`}>
                                  {option.label}
                                </h3>
                                {field.value === option.value && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#BA7967]"
                                  >
                                    ✓
                                  </motion.div>
                                )}
                              </div>
                              <p className={`text-sm ${field.value === option.value ? 'text-white/90' : 'text-gray-600'}`}>
                                {option.subtitle}
                              </p>
                            </div>
                            {field.value === option.value && (
                              <motion.div
                                layoutId="route-indicator"
                                className="absolute inset-0 rounded-2xl border-4 border-[#BA7967]"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </section>

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">General Inputs</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="oreType" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Type*</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {oreTypeOptions.map((option) => (
                          <CardRadio
                            key={option.value}
                            id={`ext-ore-type-${option.value}`}
                            label={option.label}
                            selected={field.value === option.value}
                            onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="concentrateGradePercentCu" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Concentrate Grade (% Cu)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 28" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="oreThroughputTPerDay" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Throughput (t/day)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 8000" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="moistureContentPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Moisture Content (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="impurityContentPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Impurity Content (% Fe, S, As, Pb, etc.)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 2.5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            {selectedRoute === "pyrometallurgical" && (
              <section className="space-y-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Pyrometallurgical Process Inputs</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={control} name="smeltingTechnique" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className={GROUP_HEADING_TEXT}>Smelting Technique*</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-3">
                          {smeltingTechniqueOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`smelting-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="smeltingEnergyMjPerTonne" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Smelting Energy (MJ/tonne concentrate)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 3500" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="fuelType" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className={GROUP_HEADING_TEXT}>Fuel Type</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-3">
                          {fuelTypeOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`fuel-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="sulfurCaptureEfficiencyPercent" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Sulfur Capture Efficiency (%)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 95" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="slagProducedKgPerTonne" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Slag Produced (kg/tonne concentrate)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 800" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="metalLossInSlagPercent" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Metal Loss in Slag (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 1.5" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="electrorefiningEnergyKwhPerTonne" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Electrorefining Energy (kWh/tonne cathode)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 250" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="waterConsumptionM3PerTonnePyro" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Water Consumption (m³/tonne concentrate)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 2.5" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="recycledWaterPercentPyro" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Recycled Water (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 70" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="acidProducedKgH2SO4PerTonne" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Acid Produced (kg H₂SO₄/tonne concentrate)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 600" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>
            )}

            {selectedRoute === "hydrometallurgical" && (
              <section className="space-y-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Hydrometallurgical Process Inputs</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={control} name="leachingMethod" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className={GROUP_HEADING_TEXT}>Leaching Method*</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-3">
                          {leachingMethodOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`leaching-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="acidConsumptionKgH2SO4PerTonne" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Acid Consumption (kg H₂SO₄/tonne ore)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 15" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="leachingEfficiencyPercent" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Leaching Efficiency (%)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 85" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="electrowinningEnergyKwhPerKgCu" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Electrowinning Energy (kWh/kg Cu)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 2.5" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="solventLossKgPerTonneCu" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Solvent Loss (kg/tonne Cu)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 0.5" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="electrowinningCurrentDensity" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Electrowinning Current Density (A/m²)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 280" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="waterConsumptionM3PerTonneHydro" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Water Consumption (m³/tonne ore)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 1.2" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="recycledWaterPercentHydro" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Recycled Water (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 80" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="temperatureCelsius" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={GROUP_HEADING_TEXT}>Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 45" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>
            )}

            <section className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5B59]">Environmental and By-Product Data</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="ghgEmissionsKgCo2ePerTonne" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>GHG Emissions (kgCO₂e/tonne Cu)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 3500" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="so2EmissionsKgPerTonne" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>SO₂ Emissions (kg/tonne concentrate)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 25" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="slagRecyclingRatePercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Slag Recycling Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 30" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="acidRecyclingPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Acid Recycling (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 85" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="heavyMetalResidueMgPerL" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Heavy Metal Residue (mg/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="wasteSolutionPh" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Waste Solution pH</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 2.5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={control} name="byProductRecoveryAuAgKgPerTonne" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>By-Product Recovery Au/Ag (kg/tonne Cu)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" placeholder="e.g., 0.025" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            {/* Sustainability Parameters Section - COMMENTED OUT */}
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  );
}

// Step 5: Use Phase
function CopperUsePhaseStep({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const schema = z.object({
    // Product & Application Data
    productType: z.string().nullable().optional(),
    applicationSector: z.string().nullable().optional(),
    productLifetimeYears: z.coerce.number().nullable().optional(),
    installationMethod: z.string().nullable().optional(),
    serviceWeight: z.coerce.number().nullable().optional(),
    operatingTemperature: z.coerce.number().nullable().optional(),
    environmentType: z.string().nullable().optional(),

    // Performance & Efficiency
    efficiencyRating: z.coerce.number().nullable().optional(),
    energySavingsPercent: z.coerce.number().nullable().optional(),
    averageAnnualEnergy: z.coerce.number().nullable().optional(),
    copperLossDuringUse: z.coerce.number().nullable().optional(),
    operatingHoursPerYear: z.coerce.number().nullable().optional(),
    failureRatePercent: z.coerce.number().nullable().optional(),
    replacementCycleYears: z.coerce.number().nullable().optional(),

    // Maintenance & Resource Use
    maintenanceFrequency: z.coerce.number().nullable().optional(),
    maintenanceMaterialUse: z.coerce.number().nullable().optional(),
    lubricantUseLiters: z.coerce.number().nullable().optional(),
    downtimeHoursPerYear: z.coerce.number().nullable().optional(),

    // Transport & Installation
    transportationDistance: z.coerce.number().nullable().optional(),
    transportationMode: z.string().nullable().optional(),
    packagingMaterialPerUnit: z.coerce.number().nullable().optional(),

    // Environmental Impacts / Benefits
    ghgAvoidedPerUnit: z.coerce.number().nullable().optional(),
    reusePotentialPercent: z.coerce.number().nullable().optional(),
    energyReturnOnInvestment: z.coerce.number().nullable().optional(),
    usePhaseWaterConsumption: z.coerce.number().nullable().optional(),
    followingSustainableRules: z.boolean().optional(),
    sustainabilityParameters: z.object({
      lifetimeExtensionYears: z.coerce.number().nullable().optional(),
      reusePotentialPercent: z.coerce.number().nullable().optional(),
      reducedMaintenanceMaterialsPercent: z.coerce.number().nullable().optional(),
    }).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {},
    mode: "onTouched",
  });

  const { control, handleSubmit, setValue, formState: { isValid, errors } } = form;

  useEffect(() => {
    if (initialValues) {
      console.log('🔄 [UsePhase Form] Syncing with initial values');
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      console.log('✅ [UsePhase Form] Form synced');
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    console.log('🎯 [UsePhase Form] FORM SUBMISSION');
    try {
      if (!onSave) return;
      await onSave(data);
      console.log('✅ [UsePhase Form] Saved');
      await new Promise(resolve => setTimeout(resolve, 500));
      if (onNext) onNext();
    } catch (e) {
      console.error('❌ [UsePhase Form] Failed:', e);
    }
  };

  const productTypeOptions = [
    { value: "wire", label: "Wire" },
    { value: "motor", label: "Motor" },
    { value: "component", label: "Component" },
    { value: "tube", label: "Tube" },
  ];

  const applicationSectorOptions = [
    { value: "electrical", label: "Electrical" },
    { value: "construction", label: "Construction" },
    { value: "transport", label: "Transport" },
    { value: "others", label: "Others" },
  ];

  const installationMethodOptions = [
    { value: "permanent", label: "Permanent" },
    { value: "temporary", label: "Temporary" },
  ];

  const environmentOptions = [
    { value: "indoor", label: "Indoor" },
    { value: "outdoor", label: "Outdoor" },
    { value: "humid", label: "Humid" },
    { value: "corrosive", label: "Corrosive" },
  ];

  const transportationModeOptions = [
    { value: "truck", label: "Truck" },
    { value: "ship", label: "Ship" },
    { value: "rail", label: "Rail" },
  ];

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={false}
      showLca={true}
    />
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={5}
        badgeLabel="Use Phase"
        title="In-Use Performance"
        description="Capture how copper performs during service life"
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-10">
              {/* Product & Application Data */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Product & Application Data
                </h3>
                <div className="space-y-6">
                  {/* Product Type */}
                  <FormField control={control} name="productType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Product Type *</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {productTypeOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`use-product-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Application Sector */}
                  <FormField control={control} name="applicationSector" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Application Sector *</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {applicationSectorOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`use-sector-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={control} name="productLifetimeYears" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Product Lifetime (years)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={control} name="installationMethod" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Installation Method</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {installationMethodOptions.map((option) => (
                              <CardRadio
                                key={option.value}
                                id={`install-${option.value}`}
                                label={option.label}
                                selected={field.value === option.value}
                                onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={control} name="serviceWeight" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Service Weight (kg/unit)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 12.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={control} name="operatingTemperature" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Operating Temperature (°C)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 75" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={control} name="environmentType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Environment Type</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {environmentOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`env-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Performance and Efficiency */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Performance & Efficiency
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={control} name="efficiencyRating" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Efficiency Rating (%) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 92" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="energySavingsPercent" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Energy Savings vs. Alternative (%) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 18" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="averageAnnualEnergy" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Average Annual Use Energy (kWh) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 1450" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="copperLossDuringUse" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Copper Loss during Use (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 0.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="operatingHoursPerYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Operating Hours per Year</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="e.g., 6000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="failureRatePercent" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Failure Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 2.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="replacementCycleYears" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Replacement Cycle (years)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Maintenance & Resource Use */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Maintenance & Resource Use
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={control} name="maintenanceFrequency" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Maintenance Frequency (per year) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="maintenanceMaterialUse" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Maintenance Material Use (kg/year)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="lubricantUseLiters" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Lubricant/Cleaner Use (L/year)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 6" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="downtimeHoursPerYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Downtime (hours/year)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="e.g., 120" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Transport & Installation */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Transport & Installation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={control} name="transportationDistance" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Transportation Distance (km)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 350" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="transportationMode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Transportation Mode</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {transportationModeOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`transport-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="packagingMaterialPerUnit" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Packaging Material (kg/unit)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 1.3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Environmental Impacts / Benefits */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Environmental Impacts / Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={control} name="ghgAvoidedPerUnit" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">GHG Avoided through Efficiency (kgCO₂e/unit)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 45" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="reusePotentialPercent" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Reuse Potential (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 70" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="energyReturnOnInvestment" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Energy Return on Investment (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 250" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={control} name="usePhaseWaterConsumption" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Use Phase Water Consumption (L/year)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 120" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Sustainability Parameters Section - COMMENTED OUT */}
              {/*
              <section className="space-y-6 mt-8">
                <FormField
                  control={control}
                  name="followingSustainableRules"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#BA7967] p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Sustainability Focused
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable to provide sustainability parameters for this use phase
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("followingSustainableRules") && (
                  <div className="rounded-lg border border-[#BA7967] bg-white/50 p-6 space-y-6">
                    <div className="flex items-center gap-2 border-b border-[#BA7967]/20 pb-3">
                      <div className="h-2 w-2 rounded-full bg-[#BA7967]" />
                      <h4 className="text-sm font-semibold text-[#BA7967] uppercase tracking-wide">
                        Use Phase Sustainability Parameters
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.lifetimeExtensionYears"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lifetime Extension (years)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="Additional years" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.reusePotentialPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reuse Potential (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.reducedMaintenanceMaterialsPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reduced Maintenance Materials (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </section>
              */}
            </div>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  );
}

// Step 4: Manufacturing
function CopperManufacturingStep({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const schema = z.object({
    // Feed and Material Characteristics
    productType: z.string().nullable().optional(),
    inputCathodePurity: z.coerce.number().nullable().optional(),
    scrapInput: z.coerce.number().nullable().optional(),
    alloyingMetalType: z.string().nullable().optional(),
    alloyingMetalContent: z.coerce.number().nullable().optional(),
    moistureContent: z.coerce.number().nullable().optional(),

    // Process and Equipment
    castingMethod: z.string().nullable().optional(),
    furnaceType: z.string().nullable().optional(),
    meltingEnergy: z.coerce.number().nullable().optional(),
    rollingEnergy: z.coerce.number().nullable().optional(),
    extrusionEnergy: z.coerce.number().nullable().optional(),
    drawingEnergy: z.coerce.number().nullable().optional(),
    electricityMixRenewable: z.coerce.number().nullable().optional(),
    electricityMixFossil: z.coerce.number().nullable().optional(),
    coolingMethod: z.string().nullable().optional(),
    annealingFrequency: z.coerce.number().nullable().optional(),
    surfaceTreatmentType: z.string().nullable().optional(),
    surfaceTreatmentChemicalUse: z.coerce.number().nullable().optional(),

    // Water and Environmental Data
    processWaterConsumption: z.coerce.number().nullable().optional(),
    coolingWaterReused: z.coerce.number().nullable().optional(),
    wasteWaterPH: z.coerce.number().nullable().optional(),
    airEmissionsPM: z.coerce.number().nullable().optional(),
    ghgEmissions: z.coerce.number().nullable().optional(),
    wasteHeatRecovered: z.coerce.number().nullable().optional(),
    solidWasteGenerated: z.coerce.number().nullable().optional(),

    // Production and Efficiency
    scrapGenerated: z.coerce.number().nullable().optional(),
    scrapRecycledOnsite: z.coerce.number().nullable().optional(),
    productYield: z.coerce.number().nullable().optional(),
    operatingHours: z.coerce.number().nullable().optional(),
    plantCapacity: z.coerce.number().nullable().optional(),
    maintenanceCost: z.coerce.number().nullable().optional(),
    followingSustainableRules: z.boolean().optional(),
    sustainabilityParameters: z.object({
      designForRecycling: z.boolean().nullable().optional(),
      surfaceTreatmentType: z.string().nullable().optional(),
      wasteHeatRecoveryPercent: z.coerce.number().nullable().optional(),
      renewableEnergySharePercent: z.coerce.number().nullable().optional(),
      productLifetimeExtensionYears: z.coerce.number().nullable().optional(),
    }).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {},
    mode: "onTouched",
  });

  const { control, handleSubmit, setValue, formState: { isValid, errors } } = form;

  useEffect(() => {
    if (initialValues) {
      console.log('🔄 [Manufacturing Form] Syncing with initial values');
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      console.log('✅ [Manufacturing Form] Form synced');
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    console.log('🎯 [Manufacturing Form] FORM SUBMISSION');
    try {
      if (!onSave) return;
      await onSave(data);
      console.log('✅ [Manufacturing Form] Saved');
      await new Promise(resolve => setTimeout(resolve, 500));
      if (onNext) onNext();
    } catch (e) {
      console.error('❌ [Manufacturing Form] Failed:', e);
    }
  };

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={false}
      showLca={true}
    />
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={4}
        badgeLabel="Manufacturing"
        title="Manufacturing Process"
        description="Transform refined copper into final products"
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-10">
              {/* Feed and Material Characteristics */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Feed and Material Characteristics
                </h3>
                <div className="space-y-6">
                  {/* Product Type - CardRadio (5 options) */}
                  <FormField
                    control={control}
                    name="productType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Product Type *
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {[
                              { value: "wire_rod", label: "Wire Rod" },
                              { value: "sheet", label: "Sheet" },
                              { value: "tube", label: "Tube" },
                              { value: "bar", label: "Bar" },
                              { value: "alloy", label: "Alloy" },
                            ].map((option) => (
                              <CardRadio
                                key={option.value}
                                id={`productType-${option.value}`}
                                label={option.label}
                                selected={field.value === option.value}
                                onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input Cathode Purity */}
                    <FormField
                      control={control}
                      name="inputCathodePurity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Input Cathode Purity (% Cu) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 99.95"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Scrap Input */}
                    <FormField
                      control={control}
                      name="scrapInput"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Scrap Input (%)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="e.g., 15"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Alloying Metal Type */}
                    <FormField
                      control={control}
                      name="alloyingMetalType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Alloying Metal Type
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]">
                                <SelectValue placeholder="Select metal type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="zinc">Zinc (Zn)</SelectItem>
                              <SelectItem value="tin">Tin (Sn)</SelectItem>
                              <SelectItem value="nickel">Nickel (Ni)</SelectItem>
                              <SelectItem value="aluminum">Aluminum (Al)</SelectItem>
                              <SelectItem value="silicon">Silicon (Si)</SelectItem>
                              <SelectItem value="manganese">Manganese (Mn)</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Alloying Metal Content */}
                    <FormField
                      control={control}
                      name="alloyingMetalContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Alloying Metal Content (%)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 5.5"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Moisture Content */}
                    <FormField
                      control={control}
                      name="moistureContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Moisture Content (%)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 0.5"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Process and Equipment */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Process and Equipment
                </h3>
                <div className="space-y-6">
                  {/* Casting Method - CardRadio (2 options) */}
                  <FormField
                    control={control}
                    name="castingMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Casting Method *
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { value: "continuous", label: "Continuous Casting" },
                              { value: "batch", label: "Batch Casting" },
                            ].map((option) => (
                              <CardRadio
                                key={option.value}
                                id={`castingMethod-${option.value}`}
                                label={option.label}
                                selected={field.value === option.value}
                                onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Furnace Type - CardRadio (3 options) */}
                  <FormField
                    control={control}
                    name="furnaceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Furnace Type *
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { value: "induction", label: "Induction Furnace" },
                              { value: "electric", label: "Electric Arc Furnace" },
                              { value: "gas", label: "Gas Furnace" },
                            ].map((option) => (
                              <CardRadio
                                key={option.value}
                                id={`furnaceType-${option.value}`}
                                label={option.label}
                                selected={field.value === option.value}
                                onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Melting Energy */}
                    <FormField
                      control={control}
                      name="meltingEnergy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Melting Energy (kWh/tonne product) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 450"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rolling Energy */}
                    <FormField
                      control={control}
                      name="rollingEnergy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Rolling Energy (kWh/tonne product) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 350"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Extrusion Energy */}
                    <FormField
                      control={control}
                      name="extrusionEnergy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Extrusion Energy (kWh/tonne product)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 280"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Drawing Energy */}
                    <FormField
                      control={control}
                      name="drawingEnergy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Drawing Energy (kWh/tonne product)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 200"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Electricity Mix Renewable */}
                    <FormField
                      control={control}
                      name="electricityMixRenewable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Electricity Mix - Renewable (%) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="e.g., 35"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Electricity Mix Fossil */}
                    <FormField
                      control={control}
                      name="electricityMixFossil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Electricity Mix - Fossil (%) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="e.g., 65"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Cooling Method - CardRadio (3 options) */}
                  <FormField
                    control={control}
                    name="coolingMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Cooling Method
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { value: "air", label: "Air Cooling" },
                              { value: "water", label: "Water Cooling" },
                              { value: "oil", label: "Oil Cooling" },
                            ].map((option) => (
                              <CardRadio
                                key={option.value}
                                id={`coolingMethod-${option.value}`}
                                label={option.label}
                                selected={field.value === option.value}
                                onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Annealing Frequency */}
                    <FormField
                      control={control}
                      name="annealingFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Annealing Frequency (%)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="e.g., 25"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Surface Treatment Type - CardRadio (3 options) */}
                  <FormField
                    control={control}
                    name="surfaceTreatmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Surface Treatment Type
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { value: "pickling", label: "Pickling" },
                              { value: "plating", label: "Plating" },
                              { value: "coating", label: "Coating" },
                            ].map((option) => (
                              <CardRadio
                                key={option.value}
                                id={`surfaceTreatmentType-${option.value}`}
                                label={option.label}
                                selected={field.value === option.value}
                                onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Surface Treatment Chemical Use */}
                    <FormField
                      control={control}
                      name="surfaceTreatmentChemicalUse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] font-semibold">
                            Surface Treatment Chemical Use (kg/tonne product)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 12.5"
                              className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Water and Environmental Data */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Water and Environmental Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Process Water Consumption */}
                  <FormField
                    control={control}
                    name="processWaterConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Process Water Consumption (m³/tonne product) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 2.5"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cooling Water Reused */}
                  <FormField
                    control={control}
                    name="coolingWaterReused"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Cooling Water Reused (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 85"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Waste Water pH */}
                  <FormField
                    control={control}
                    name="wasteWaterPH"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Waste Water pH
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 7.5"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Air Emissions PM */}
                  <FormField
                    control={control}
                    name="airEmissionsPM"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Air Emissions - PM (kg/tonne product)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 0.8"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* GHG Emissions */}
                  <FormField
                    control={control}
                    name="ghgEmissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          GHG Emissions (kgCO₂e/tonne product)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 750"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Waste Heat Recovered */}
                  <FormField
                    control={control}
                    name="wasteHeatRecovered"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Waste Heat Recovered (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 45"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Solid Waste Generated */}
                  <FormField
                    control={control}
                    name="solidWasteGenerated"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Solid Waste Generated (kg/tonne product)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 25"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Production and Efficiency */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Production and Efficiency
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Scrap Generated */}
                  <FormField
                    control={control}
                    name="scrapGenerated"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Scrap Generated (%) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 8"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Scrap Recycled Onsite */}
                  <FormField
                    control={control}
                    name="scrapRecycledOnsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Scrap Recycled Onsite (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 95"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Product Yield */}
                  <FormField
                    control={control}
                    name="productYield"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Product Yield (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 92"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Operating Hours */}
                  <FormField
                    control={control}
                    name="operatingHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Operating Hours per Day
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 20"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Plant Capacity */}
                  <FormField
                    control={control}
                    name="plantCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Plant Capacity (t/day)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 500"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Maintenance Cost */}
                  <FormField
                    control={control}
                    name="maintenanceCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">
                          Maintenance Cost (USD/tonne product)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 15.50"
                            className="border-[#e3d4c8] focus:border-[#BA7967] focus:ring-[#BA7967]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Sustainability Parameters Section - COMMENTED OUT */}
              {/*
              <section className="space-y-6 mt-8">
                <FormField
                  control={control}
                  name="followingSustainableRules"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#BA7967] p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Sustainability Focused
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable to provide sustainability parameters for this manufacturing stage
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("followingSustainableRules") && (
                  <div className="rounded-lg border border-[#BA7967] bg-white/50 p-6 space-y-6">
                    <div className="flex items-center gap-2 border-b border-[#BA7967]/20 pb-3">
                      <div className="h-2 w-2 rounded-full bg-[#BA7967]" />
                      <h4 className="text-sm font-semibold text-[#BA7967] uppercase tracking-wide">
                        Manufacturing Sustainability Parameters
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.designForRecycling"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Design for Recycling</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.surfaceTreatmentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surface Treatment Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select treatment" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Low-chemical">Low-chemical</SelectItem>
                                <SelectItem value="Water-based">Water-based</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.wasteHeatRecoveryPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Waste Heat Recovery (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.renewableEnergySharePercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renewable Energy Share (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.productLifetimeExtensionYears"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Lifetime Extension (years)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="Additional years" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </section>
              */}
            </div>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  );
}

// Step 6: Recycling
function CopperRecyclingStep({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const schema = z.object({
    // Scrap Collection & Source
    scrapType: z.string().nullable().optional(),
    collectionRate: z.coerce.number().nullable().optional(),
    collectionArea: z.string().nullable().optional(),
    averageScrapQualityGrade: z.string().nullable().optional(),
    productSectorSource: z.string().nullable().optional(),

    // Sorting and Pre-Treatment
    sortingTechnology: z.string().nullable().optional(),
    sortingEfficiency: z.coerce.number().nullable().optional(),
    contaminationLevel: z.coerce.number().nullable().optional(),
    preTreatmentProcess: z.string().nullable().optional(),
    preTreatmentEnergy: z.coerce.number().nullable().optional(),
    laborIntensity: z.coerce.number().nullable().optional(),

    // Remelting and Refining
    remeltingEnergy: z.coerce.number().nullable().optional(),
    refiningEnergy: z.coerce.number().nullable().optional(),
    furnaceType: z.string().nullable().optional(),
    meltingTemperature: z.coerce.number().nullable().optional(),
    metalLossInSlag: z.coerce.number().nullable().optional(),
    slagGeneration: z.coerce.number().nullable().optional(),
    recoveredCopperPurity: z.coerce.number().nullable().optional(),

    // Output & Circularity
    recoveryYield: z.coerce.number().nullable().optional(),
    recycledContent: z.coerce.number().nullable().optional(),
    recycledOutputForm: z.string().nullable().optional(),
    slagRecycled: z.coerce.number().nullable().optional(),
    byProductRecovery: z.coerce.number().nullable().optional(),

    // Water, Energy & Emissions
    waterConsumption: z.coerce.number().nullable().optional(),
    recycledWater: z.coerce.number().nullable().optional(),
    ghgEmissions: z.coerce.number().nullable().optional(),
    dustEmissions: z.coerce.number().nullable().optional(),
    residueDisposal: z.coerce.number().nullable().optional(),
    energySourceMix: z.string().nullable().optional(),

    // Logistics & Economic Data
    transportationDistance: z.coerce.number().nullable().optional(),
    transportMode: z.string().nullable().optional(),
    scrapPrice: z.coerce.number().nullable().optional(),
    recycledProductValue: z.coerce.number().nullable().optional(),
    followingSustainableRules: z.boolean().optional(),
    sustainabilityParameters: z.object({
      advancedCleaningSystems: z.boolean().nullable().optional(),
      alloySortingCapability: z.string().nullable().optional(),
      renewableEnergySharePercent: z.coerce.number().nullable().optional(),
      slagRecycledPercent: z.coerce.number().nullable().optional(),
    }).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {},
    mode: "onTouched",
  });

  const { control, handleSubmit, setValue, formState: { isValid, errors } } = form;

  useEffect(() => {
    if (initialValues) {
      console.log('🔄 [Recycling Form] Syncing with initial values');
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      console.log('✅ [Recycling Form] Form synced');
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    console.log('🎯 [Recycling Form] FORM SUBMISSION');
    try {
      if (!onSave) return;
      await onSave(data);
      console.log('✅ [Recycling Form] Saved');
      await new Promise(resolve => setTimeout(resolve, 500));
      if (onNext) onNext();
    } catch (e) {
      console.error('❌ [Recycling Form] Failed:', e);
    }
  };

  const scrapTypeOptions = [
    { value: "pre_consumer", label: "Pre-Consumer" },
    { value: "post_consumer", label: "Post-Consumer" },
    { value: "e_waste", label: "E-waste" },
  ];

  const collectionAreaOptions = [
    { value: "urban", label: "Urban" },
    { value: "industrial", label: "Industrial" },
    { value: "rural", label: "Rural" },
  ];

  const productSectorSourceOptions = [
    { value: "construction", label: "Construction" },
    { value: "transport", label: "Transport" },
    { value: "electronics", label: "Electronics" },
    { value: "machinery", label: "Machinery" },
  ];

  const preTreatmentProcessOptions = [
    { value: "shredding", label: "Shredding" },
    { value: "de_coating", label: "De-coating" },
    { value: "manual", label: "Manual" },
  ];

  const furnaceTypeOptions = [
    { value: "induction", label: "Induction" },
    { value: "shaft", label: "Shaft" },
    { value: "rotary", label: "Rotary" },
  ];

  const recycledOutputFormOptions = [
    { value: "billet", label: "Billet" },
    { value: "rod", label: "Rod" },
    { value: "alloy", label: "Alloy" },
  ];

  const transportModeOptions = [
    { value: "truck", label: "Truck" },
    { value: "rail", label: "Rail" },
    { value: "ship", label: "Ship" },
  ];

  const energySourceMixOptions = [
    { value: "renewable", label: "Renewable" },
    { value: "fossil", label: "Fossil" },
  ];

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={false}
      showLCA={true}
    />
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={6}
        badgeLabel="Recycling"
        title="Copper Recycling Process"
        description="Recover and reprocess copper waste"
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-10">
              {/* Scrap Collection & Source */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Scrap Collection & Source
                </h3>
                <div className="space-y-6">
                  {/* Scrap Type */}
                  <FormField control={control} name="scrapType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Scrap Type *</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {scrapTypeOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`scrapType-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Collection Rate */}
                    <FormField control={control} name="collectionRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Collection Rate (%) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 75" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Average Scrap Quality Grade */}
                    <FormField control={control} name="averageScrapQualityGrade" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Average Scrap Quality Grade</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="e.g., Grade A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Collection Area */}
                  <FormField control={control} name="collectionArea" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Collection Area</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {collectionAreaOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`collectionArea-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Product Sector Source */}
                  <FormField control={control} name="productSectorSource" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Product Sector Source</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {productSectorSourceOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`productSector-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Sorting and Pre-Treatment */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Sorting and Pre-Treatment
                </h3>
                <div className="space-y-6">
                  {/* Sorting Technology */}
                  <FormField control={control} name="sortingTechnology" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Sorting Technology *</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="e.g., Eddy current separation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sorting Efficiency */}
                    <FormField control={control} name="sortingEfficiency" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Sorting Efficiency (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Contamination Level */}
                    <FormField control={control} name="contaminationLevel" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Contamination Level (%) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Pre-Treatment Energy */}
                    <FormField control={control} name="preTreatmentEnergy" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Pre-Treatment Energy (kWh/tonne scrap)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Labor Intensity */}
                    <FormField control={control} name="laborIntensity" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Labor Intensity (hours/tonne)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Pre-Treatment Process */}
                  <FormField control={control} name="preTreatmentProcess" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Pre-Treatment Process</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {preTreatmentProcessOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`preTreatment-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Remelting and Refining */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Remelting and Refining
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Remelting Energy */}
                    <FormField control={control} name="remeltingEnergy" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Remelting Energy (kWh/tonne scrap) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 300" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Refining Energy */}
                    <FormField control={control} name="refiningEnergy" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Refining Energy (kWh/tonne scrap)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Melting Temperature */}
                    <FormField control={control} name="meltingTemperature" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Melting Temperature (°C)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 1085" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Metal Loss in Slag */}
                    <FormField control={control} name="metalLossInSlag" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Metal Loss in Slag (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Slag Generation */}
                    <FormField control={control} name="slagGeneration" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Slag Generation (kg/tonne scrap)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Recovered Copper Purity */}
                    <FormField control={control} name="recoveredCopperPurity" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Recovered Copper Purity (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 99.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Furnace Type */}
                  <FormField control={control} name="furnaceType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Furnace Type</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {furnaceTypeOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`furnaceType-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Output & Circularity */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Output & Circularity
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recovery Yield */}
                    <FormField control={control} name="recoveryYield" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Recovery Yield (%) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 95" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Recycled Content */}
                    <FormField control={control} name="recycledContent" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Recycled Content (%) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Slag Recycled */}
                    <FormField control={control} name="slagRecycled" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Slag Recycled (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 80" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* By-Product Recovery */}
                    <FormField control={control} name="byProductRecovery" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">By-Product Recovery (kg/tonne Cu)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Recycled Output Form */}
                  <FormField control={control} name="recycledOutputForm" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Recycled Output Form</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {recycledOutputFormOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`recycledOutput-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Water, Energy & Emissions */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Water, Energy & Emissions
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Water Consumption */}
                    <FormField control={control} name="waterConsumption" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Water Consumption (m³/tonne scrap)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 0.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Recycled Water */}
                    <FormField control={control} name="recycledWater" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Recycled Water (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 70" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* GHG Emissions */}
                    <FormField control={control} name="ghgEmissions" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">GHG Emissions (kgCO2e/tonne scrap)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Dust Emissions */}
                    <FormField control={control} name="dustEmissions" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Dust Emissions PM (kg/tonne scrap)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Residue Disposal */}
                    <FormField control={control} name="residueDisposal" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Residue Disposal (kg/tonne scrap)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Energy Source Mix */}
                  <FormField control={control} name="energySourceMix" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Energy Source Mix</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {energySourceMixOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`energySource-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Logistics & Economic Data */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Logistics & Economic Data
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Transportation Distance */}
                    <FormField control={control} name="transportationDistance" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Transportation Distance (km)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Scrap Price */}
                    <FormField control={control} name="scrapPrice" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Scrap Price (USD/tonne)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 6000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Recycled Product Value */}
                    <FormField control={control} name="recycledProductValue" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Recycled Product Value (USD/tonne)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 8000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Transport Mode */}
                  <FormField control={control} name="transportMode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Transport Mode</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {transportModeOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`transportMode-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Sustainability Parameters Section - COMMENTED OUT */}
              {/*
              <section className="space-y-6 mt-8">
                <FormField
                  control={control}
                  name="followingSustainableRules"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#BA7967] p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Sustainability Focused
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable to provide sustainability parameters for this recycling stage
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("followingSustainableRules") && (
                  <div className="rounded-lg border border-[#BA7967] bg-white/50 p-6 space-y-6">
                    <div className="flex items-center gap-2 border-b border-[#BA7967]/20 pb-3">
                      <div className="h-2 w-2 rounded-full bg-[#BA7967]" />
                      <h4 className="text-sm font-semibold text-[#BA7967] uppercase tracking-wide">
                        Recycling Sustainability Parameters
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.advancedCleaningSystems"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Advanced Cleaning Systems</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.alloySortingCapability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alloy Sorting Capability</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select capability" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Basic">Basic</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
                                <SelectItem value="Precision">Precision</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.renewableEnergySharePercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renewable Energy Share (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.slagRecycledPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slag Recycled (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </section>
              */}
            </div>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  );
}

// Step 7: Valorization
function CopperValorizationStep({ onNext, onBack, onSave, initialValues, onSubmitSuccess, onGenerateAIPrediction, predicting }) {
  const schema = z.object({
    // Waste and By-Product Characteristics
    wasteType: z.string().nullable().optional(),
    wasteGeneration: z.coerce.number().nullable().optional(),
    metalContentInWaste: z.coerce.number().nullable().optional(),
    chemicalCompositionFeO: z.coerce.number().nullable().optional(),
    chemicalCompositionSiO2: z.coerce.number().nullable().optional(),
    chemicalCompositionCuO: z.coerce.number().nullable().optional(),
    moistureContent: z.coerce.number().nullable().optional(),

    // Valorization / Treatment Process
    valorizationMethod: z.string().nullable().optional(),
    valorizationRate: z.coerce.number().nullable().optional(),
    metalRecoveryRate: z.coerce.number().nullable().optional(),
    sulfurCaptureEfficiency: z.coerce.number().nullable().optional(),
    furnaceGasSO2Concentration: z.coerce.number().nullable().optional(),
    acidPlantCapacity: z.coerce.number().nullable().optional(),
    energyForValorization: z.coerce.number().nullable().optional(),
    waterUsedInTreatment: z.coerce.number().nullable().optional(),

    // Outputs and Residuals
    residueAfterTreatment: z.coerce.number().nullable().optional(),
    leachateToxicityIndex: z.coerce.number().nullable().optional(),
    heavyMetalResidue: z.coerce.number().nullable().optional(),
    slagReuseAsConstruction: z.coerce.number().nullable().optional(),
    acidProduced: z.coerce.number().nullable().optional(),
    ghgEmissions: z.coerce.number().nullable().optional(),

    // Economic / Circular Value
    revenueFromByProducts: z.coerce.number().nullable().optional(),
    marketPriceAcid: z.coerce.number().nullable().optional(),
    followingSustainableRules: z.boolean().optional(),
    sustainabilityParameters: z.object({
      circularEconomyPartnerships: z.boolean().nullable().optional(),
      wasteToProductInnovationLevel: z.string().nullable().optional(),
      sulfurCaptureEfficiencyPercent: z.coerce.number().nullable().optional(),
    }).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {},
    mode: "onTouched",
  });

  const { control, handleSubmit, setValue, formState: { isValid, errors } } = form;

  useEffect(() => {
    if (initialValues) {
      console.log('🔄 [Valorization Form] Syncing with initial values');
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      console.log('✅ [Valorization Form] Form synced');
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    console.log('🎯 [Valorization Form] FORM SUBMISSION');
    try {
      if (!onSave) return;
      await onSave(data);
      console.log('✅ [Valorization Form] Saved');
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (e) {
      console.error('❌ [Valorization Form] Failed:', e);
    }
  };

  const wasteTypeOptions = [
    { value: "slag", label: "Slag" },
    { value: "tailings", label: "Tailings" },
    { value: "dust", label: "Dust" },
    { value: "acidic_effluent", label: "Acidic Effluent" },
  ];

  const valorizationMethodOptions = [
    { value: "reuse", label: "Reuse" },
    { value: "recycle", label: "Recycle" },
    { value: "neutralize", label: "Neutralize" },
    { value: "dispose", label: "Dispose" },
  ];

  const footerContent = (
    <StepFooterActions
      onBack={onBack}
      onForward={handleSubmit(onSubmit)}
      forwardDisabled={false}
      forwardLabel="Submit"
      showLca={true}
    />
  );

  return (
    <FormProvider {...form}>
      <StepSection
        stepNumber={7}
        badgeLabel="Valorization"
        title="Waste Valorization & By-Product Recovery"
        description="Create value from copper by-products and waste"
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        footer={footerContent}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-10">
              {/* Waste and By-Product Characteristics */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Waste and By-Product Characteristics
                </h3>
                <div className="space-y-6">
                  {/* Waste Type */}
                  <FormField control={control} name="wasteType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Waste Type *</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {wasteTypeOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`wasteType-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Waste Generation */}
                    <FormField control={control} name="wasteGeneration" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Waste Generation (kg/tonne Cu)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 150" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Metal Content in Waste */}
                    <FormField control={control} name="metalContentInWaste" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Metal Content in Waste (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Moisture Content */}
                    <FormField control={control} name="moistureContent" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Moisture Content (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Chemical Composition */}
                  <div>
                    <FormLabel className="text-[#6B5B59] font-semibold mb-3 block">Chemical Composition (%)</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField control={control} name="chemicalCompositionFeO" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] text-sm">FeO</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 35" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={control} name="chemicalCompositionSiO2" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] text-sm">SiO₂</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={control} name="chemicalCompositionCuO" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#6B5B59] text-sm">CuO</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Valorization / Treatment Process */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Valorization / Treatment Process
                </h3>
                <div className="space-y-6">
                  {/* Valorization Method */}
                  <FormField control={control} name="valorizationMethod" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Valorization Method *</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {valorizationMethodOptions.map((option) => (
                            <CardRadio
                              key={option.value}
                              id={`valorizationMethod-${option.value}`}
                              label={option.label}
                              selected={field.value === option.value}
                              onSelect={() => field.onChange(field.value === option.value ? "" : option.value)}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Valorization Rate */}
                    <FormField control={control} name="valorizationRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Valorization Rate (%) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 85" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Metal Recovery Rate */}
                    <FormField control={control} name="metalRecoveryRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Metal Recovery Rate (%) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Sulfur Capture Efficiency */}
                    <FormField control={control} name="sulfurCaptureEfficiency" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Sulfur Capture Efficiency (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 95" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Furnace Gas SO2 Concentration */}
                    <FormField control={control} name="furnaceGasSO2Concentration" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Furnace Gas SO₂ Concentration (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 8" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Acid Plant Capacity */}
                    <FormField control={control} name="acidPlantCapacity" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Acid Plant Capacity (t/day)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Energy for Valorization */}
                    <FormField control={control} name="energyForValorization" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Energy for Valorization (kWh/tonne waste)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 120" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Water Used in Treatment */}
                    <FormField control={control} name="waterUsedInTreatment" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Water Used in Treatment (m³/tonne waste)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 0.8" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              {/* Outputs and Residuals */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Outputs and Residuals
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Residue After Treatment */}
                    <FormField control={control} name="residueAfterTreatment" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Residue After Treatment (kg/tonne Cu)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Leachate Toxicity Index */}
                    <FormField control={control} name="leachateToxicityIndex" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Leachate Toxicity Index</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 1.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Heavy Metal Residue */}
                    <FormField control={control} name="heavyMetalResidue" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Heavy Metal Residue (mg/L)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 0.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Slag Reuse as Construction Material */}
                    <FormField control={control} name="slagReuseAsConstruction" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Slag Reuse as Construction Material (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Acid Produced */}
                    <FormField control={control} name="acidProduced" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">Acid Produced (kg H₂SO₄/tonne Cu)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 250" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* GHG Emissions */}
                    <FormField control={control} name="ghgEmissions" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5B59] font-semibold">GHG Emissions (kgCO₂e/tonne Cu)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 200" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              {/* Economic / Circular Value */}
              <div>
                <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-[#6B5B59] mb-5`}>
                  Economic / Circular Value
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue from By-Products */}
                  <FormField control={control} name="revenueFromByProducts" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Revenue from By-Products (USD/tonne Cu)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 1500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Market Price Acid */}
                  <FormField control={control} name="marketPriceAcid" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#6B5B59] font-semibold">Market Price Acid (USD/tonne)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Sustainability Parameters Section - COMMENTED OUT */}
              {/*
              <section className="space-y-6 mt-8">
                <FormField
                  control={control}
                  name="followingSustainableRules"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#BA7967] p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Sustainability Focused
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable to provide sustainability parameters for this valorization stage
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("followingSustainableRules") && (
                  <div className="rounded-lg border border-[#BA7967] bg-white/50 p-6 space-y-6">
                    <div className="flex items-center gap-2 border-b border-[#BA7967]/20 pb-3">
                      <div className="h-2 w-2 rounded-full bg-[#BA7967]" />
                      <h4 className="text-sm font-semibold text-[#BA7967] uppercase tracking-wide">
                        Valorization Sustainability Parameters
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={control}
                        name="sustainabilityParameters.circularEconomyPartnerships"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Circular Economy Partnerships</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.wasteToProductInnovationLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Waste-to-Product Innovation Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="Pilot">Pilot</SelectItem>
                                <SelectItem value="Commercial">Commercial</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="sustainabilityParameters.sulfurCaptureEfficiencyPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sulfur Capture Efficiency (%)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="0-100" value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </section>
              */}
            </div>
          </form>
        </Form>
      </StepSection>
    </FormProvider>
  );
}

// Clean container without tracking UI, with space for right sidebar tracker on md+
function WizardContainer({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4 sm:p-6 md:pr-86">
      <div className="mx-auto w-full max-w-none md:max-w-[calc(100vw-28rem)] space-y-4 sm:space-y-6">
        <div>{children}</div>
      </div>
    </div>
  )
}

// Main Wizard Container
export default function CopperWizardForm({ steps, activeStep, onStepChange, workflowId, workflowData, onWorkflowUpdate, onWorkflowSubmitted }) {
  const [stepData, setStepData] = useState({});
  const [predicting, setPredicting] = useState(false);
  const [saving, setSaving] = useState(false);

  const stepComponents = [
    { key: 'mining', backendKey: 'copperMining', Component: CopperMiningStep },
    { key: 'beneficiation', backendKey: 'copperBeneficiation', Component: CopperBeneficiationStep },
    { key: 'refining', backendKey: 'copperRefining', Component: CopperRefiningStep },
    { key: 'manufacturing', backendKey: 'copperManufacturing', Component: CopperManufacturingStep },
    { key: 'usePhase', backendKey: 'copperUsePhase', Component: CopperUsePhaseStep },
    { key: 'recycling', backendKey: 'copperRecycling', Component: CopperRecyclingStep },
    { key: 'valorization', backendKey: 'copperValorization', Component: CopperValorizationStep },
  ];

  // Load initial data from workflow
  useEffect(() => {
    if (workflowData) {
      const loadedData = {};
      stepComponents.forEach(({ key, backendKey }) => {
        if (workflowData[backendKey]) {
          loadedData[key] = workflowData[backendKey];
        }
      });
      setStepData(loadedData);
    }
  }, [workflowData]);

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

  const handleSave = async (data) => {
    const stepKey = steps[activeStep].key;
    const backendKey = stepComponents[activeStep].backendKey;
    
    console.log(`💾 [Copper] Saving ${stepKey} → ${backendKey}`, data);
    
    // Update local state
    setStepData(prev => ({ ...prev, [stepKey]: data }));
    
    // Save to backend if workflowId exists
    if (workflowId) {
      setSaving(true);
      try {
        const api = await import('@/services/api').then(m => m.default);
        const response = await api.put(`/wizard/workflows/${workflowId}/steps/${backendKey}`, data);
        
        if (response.data.success && response.data.data?.workflow) {
          console.log(`✅ [Copper] ${backendKey} saved successfully`);
          onWorkflowUpdate?.(response.data.data.workflow);
        }
      } catch (error) {
        console.error(`❌ [Copper] Error saving ${backendKey}:`, error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleGenerateAIPrediction = async (formData) => {
    setPredicting(true);
    console.log('🤖 [Copper] Generating AI predictions...', formData);
    // Simulate AI prediction
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPredicting(false);
  };

  const handleSubmitSuccess = () => {
    console.log('✅ [Copper] Wizard completed!', stepData);
    // Handle final submission
    onWorkflowSubmitted?.({ workflow: workflowData });
  };

  const { Component } = stepComponents[activeStep];
  const currentStep = steps[activeStep];
  const currentStepKey = stepComponents[activeStep].key;

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
      
      <Component
        onNext={handleNext}
        onBack={handleBack}
        onSave={handleSave}
        initialValues={stepData[currentStepKey]}
        onGenerateAIPrediction={handleGenerateAIPrediction}
        predicting={predicting}
        onSubmitSuccess={activeStep === steps.length - 1 ? handleSubmitSuccess : undefined}
        saving={saving}
      />
    </WizardContainer>
  );
}