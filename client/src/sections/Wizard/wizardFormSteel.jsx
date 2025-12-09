import React, { useMemo, useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  updateMiningStep,
  updateBeneficiationStep,
  updateIronmakingStep,
  updateSteelmakingStep,
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
  const styleId = 'ai-field-styles-steel';
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
  footer,
  onPredict,
  predicting = false,
  pollingProgress = { current: 0, max: 15 },
}) {
  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full"
    >
      <Card className="border-2 border-[#e3d4c8] bg-gradient-to-br from-white via-[#faf8f5] to-[#f5f1eb] shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/40 to-transparent opacity-50 pointer-events-none" />
        <CardHeader className="relative z-10 space-y-2 border-b border-[#e3d4c8] bg-white/70 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#BA7967] to-[#6B5B59] text-lg font-bold text-white shadow-md">
                {stepNumber}
              </span>
              <div>
                <div className="mb-1">
                  <span className="inline-block rounded-full bg-[#BA7967]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#BA7967]">
                    {badgeLabel}
                  </span>
                </div>
                <CardTitle className={`${HEADING_TEXT} font-bold text-gray-900`}>{title}</CardTitle>
                {description && (
                  <CardDescription className="mt-1 text-sm text-gray-600">{description}</CardDescription>
                )}
              </div>
            </div>
            {onPredict && (
              <Button
                onClick={onPredict}
                disabled={predicting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md"
              >
                {predicting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Predicting... {pollingProgress.current}/{pollingProgress.max}
                  </>
                ) : (
                  <>
                    🤖 AI Predict
                  </>
                )}
              </Button>
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

// =============================================================================
// STEEL MINING STEP - Based on Steel LCA Requirements
// =============================================================================

const miningMethodOptions = [
  { id: "openPit", label: "Open-Pit" },
  { id: "underground", label: "Underground" },
  { id: "inSitu", label: "In-situ / Experimental" },
  { id: "others", label: "Others" },
];

const oreTypeOptions = [
  { id: "hematite", label: "Hematite" },
  { id: "magnetite", label: "Magnetite" },
  { id: "goethite", label: "Goethite/Limonite" },
  { id: "mixed", label: "Mixed" },
];

const equipmentTypeOptions = [
  { id: "diesel", label: "Diesel" },
  { id: "electric", label: "Electric" },
  { id: "hybrid", label: "Hybrid" },
];

const waterSourceOptions = [
  { id: "groundwater", label: "Groundwater" },
  { id: "surface", label: "Surface" },
  { id: "recycled", label: "Recycled" },
  { id: "mixed", label: "Mixed" },
];

const biodiversityProtectionOptions = [
  { id: "low", label: "Low" },
  { id: "moderate", label: "Moderate" },
  { id: "high", label: "High" },
];

const dustSuppressionOptions = [
  { id: "basic", label: "Basic" },
  { id: "advanced", label: "Advanced" },
  { id: "smartAI", label: "Smart-AI" },
];

// Beneficiation options (Steel)
const beneficiationProcesses = [
  { id: "crushing", label: "Crushing" },
  { id: "grinding", label: "Grinding" },
  { id: "screening", label: "Screening" },
  { id: "washing", label: "Washing" },
  { id: "magneticSeparation", label: "Magnetic Separation" },
  { id: "gravitySeparation", label: "Gravity Separation" },
  { id: "thickening", label: "Thickening" },
  { id: "others", label: "Others" },
];

const tailingsStorageOptions = [
  { id: "wet", label: "Wet" },
  { id: "paste", label: "Paste" },
  { id: "dryStack", label: "Dry Stack" },
];

const tailingsDewateringOptions = [
  { id: "conventional", label: "Conventional" },
  { id: "thickened", label: "Thickened" },
  { id: "dryStack", label: "Dry Stack" },
];

const waterTreatmentOptions = [
  { id: "basic", label: "Basic" },
  { id: "advanced", label: "Advanced" },
  { id: "aiHybrid", label: "AI-Hybrid" },
];

// Ironmaking options (Steel)
const ironmakingRouteOptions = [
  { id: "blastFurnace", label: "Blast Furnace (BF)" },
  { id: "driGas", label: "Direct Reduced Iron – Gas" },
  { id: "driCoal", label: "Direct Reduced Iron – Coal" },
];

const feedstockOptions = [
  { id: "pellets", label: "Pellets" },
  { id: "lump", label: "Lump" },
];

const sinteringOptions = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];

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

const miningFormSchema = z.object({
  // Core Parameters (Mandatory marked with *)
  miningMethod: z.string().min(1, "Mining method is required"),
  miningMethodOthers: z.string().nullable().optional(),
  oreType: z.string().min(1, "Ore type is required"),
  oreGradeFe: requiredNumber(0, 100, "Ore grade is required"),
  overburdenRatio: requiredNumber(0, undefined, "Overburden ratio is required"),
  avgHaulDistance: requiredNumber(0, undefined, "Average haul distance is required"),
  equipmentType: z.string().min(1, "Equipment type is required"),
  fuelConsumption: requiredNumber(0, undefined, "Fuel consumption is required"),
  electricityConsumption: requiredNumber(0, undefined, "Electricity consumption is required"),
  waterConsumption: requiredNumber(0, undefined, "Water consumption is required"),
  waterSource: z.string().min(1, "Water source is required"),
  
  // Additional Inputs (Optional)
  landDisturbed: z.coerce.number().nullable().optional(),
  dustEmissions: z.coerce.number().nullable().optional(),
  explosives: z.coerce.number().nullable().optional(),
  oreMoisture: z.coerce.number().nullable().optional(),
  
  // Sustainability Parameters
  followingSustainableRules: z.boolean().nullable().optional(),
  sustainabilityParameters: z.object({
    rehabilitationPlanActive: z.boolean().nullable().optional(),
    overburdenRestored: z.coerce.number().nullable().optional(),
    waterReuseRate: z.coerce.number().nullable().optional(),
    biodiversityProtectionLevel: z.string().nullable().optional(),
    dustSuppression: z.string().nullable().optional(),
  }).nullable().optional(),
});

// Beneficiation schema (Steel)
const beneficiationFormSchema = z.object({
  processes: z.array(z.string()).min(1, { message: "Select at least one process" }).optional().or(z.array(z.string()).default([])),
  processOthers: z.string().nullable().optional(),
  concentrateGradeFe: requiredNumber(0, 100, "Concentrate grade is required"),
  grindingEnergy: requiredNumber(0, undefined, "Grinding energy is required"),
  waterConsumption: requiredNumber(0, undefined, "Water consumption is required"),
  waterRecycled: requiredNumber(0, 100, "Water recycled is required"),
  electricityUse: requiredNumber(0, undefined, "Electricity use is required"),
  recoveryEfficiency: requiredNumber(0, 100, "Recovery efficiency is required"),
  tailingsProduced: z.coerce.number().nullable().optional(),
  tailingsSolids: z.coerce.number().nullable().optional(),
  tailingsStorageType: z.string().nullable().optional(),
  // Sustainability
  followingSustainableRules: z.boolean().nullable().optional(),
  sustainabilityParameters: z.object({
    bioReagents: z.boolean().nullable().optional(),
    zeroLiquidDischarge: z.boolean().nullable().optional(),
    tailingsDewatering: z.string().nullable().optional(),
    waterTreatment: z.string().nullable().optional(),
    tailingsReusePotential: z.coerce.number().nullable().optional(),
  }).nullable().optional(),
});

// Ironmaking schema (Steel) - Blast Furnace
const blastFurnaceSchema = z.object({
  sintering: z.string().min(1, { message: "Select if sintering is used" }),
  pelletRatio: requiredNumber(0, 100, "Pellet ratio is required"),
  cokeRate: requiredNumber(0, undefined, "Coke rate is required"),
  pciRate: requiredNumber(0, undefined, "PCI rate is required"),
  electricity: requiredNumber(0, undefined, "Electricity is required"),
  thermalEnergy: requiredNumber(0, undefined, "Thermal energy is required"),
  slagGeneration: z.coerce.number().nullable().optional(),
  // Emissions
  co2: requiredNumber(0, undefined, "CO₂ is required"),
  sox: z.coerce.number().nullable().optional(),
  nox: z.coerce.number().nullable().optional(),
  dust: z.coerce.number().nullable().optional(),
  // Sustainability
  renewablePower: z.coerce.number().nullable().optional(),
  slagInCement: z.coerce.number().nullable().optional(),
  heatRecovery: z.coerce.number().nullable().optional(),
});

// Ironmaking schema (Steel) - DRI
const driSchema = z.object({
  feedstock: z.string().min(1, { message: "Select feedstock type" }),
  reductant: requiredNumber(0, undefined, "Reductant value is required"),
  electricity: requiredNumber(0, undefined, "Electricity is required"),
  metallization: requiredNumber(0, 100, "Metallization is required"),
  // Emissions
  co2: requiredNumber(0, undefined, "CO₂ is required"),
  // Sustainability
  hydrogenSubstitution: z.coerce.number().nullable().optional(),
  syngasRecycle: z.coerce.number().nullable().optional(),
});

// Parent ironmaking schema with conditional validation
const ironmakingFormSchema = z.object({
  ironmakingRoute: z.string().min(1, { message: "Select an ironmaking route" }),
  // BF fields (conditionally required)
  blastFurnace: blastFurnaceSchema.partial().optional(),
  // DRI fields (conditionally required)
  dri: driSchema.partial().optional(),
}).refine((data) => {
  if (data.ironmakingRoute === "blastFurnace") {
    if (!data.blastFurnace?.sintering) return false;
    if (data.blastFurnace?.pelletRatio === undefined || data.blastFurnace?.pelletRatio === null) return false;
    if (data.blastFurnace?.cokeRate === undefined || data.blastFurnace?.cokeRate === null) return false;
    if (data.blastFurnace?.pciRate === undefined || data.blastFurnace?.pciRate === null) return false;
    if (data.blastFurnace?.electricity === undefined || data.blastFurnace?.electricity === null) return false;
    if (data.blastFurnace?.thermalEnergy === undefined || data.blastFurnace?.thermalEnergy === null) return false;
    if (data.blastFurnace?.co2 === undefined || data.blastFurnace?.co2 === null) return false;
  }
  if (data.ironmakingRoute.startsWith("dri")) {
    if (!data.dri?.feedstock) return false;
    if (data.dri?.reductant === undefined || data.dri?.reductant === null) return false;
    if (data.dri?.electricity === undefined || data.dri?.electricity === null) return false;
    if (data.dri?.metallization === undefined || data.dri?.metallization === null) return false;
    if (data.dri?.co2 === undefined || data.dri?.co2 === null) return false;
  }
  return true;
}, { message: "Fill all required fields for selected route" });

// Steelmaking options (Steel)
const steelmakingRouteOptions = [
  { id: "bof", label: "BOF (Basic Oxygen Furnace)" },
  { id: "eaf", label: "EAF (Electric Arc Furnace)" },
];

// Steelmaking schema (Steel) - BOF
const bofSchema = z.object({
  scrapCharge: requiredNumber(0, 100, "Scrap charge is required"),
  oxygenConsumption: requiredNumber(0, undefined, "Oxygen consumption is required"),
  fluxUsage: requiredNumber(0, undefined, "Flux usage is required"),
  electricity: requiredNumber(0, undefined, "Electricity is required"),
  // Emissions
  co2: requiredNumber(0, undefined, "CO₂ is required"),
  so2: z.coerce.number().nullable().optional(),
  nox: z.coerce.number().nullable().optional(),
  // Sustainability
  highScrapUtilization: z.boolean().nullable().optional(),
  renewableEnergy: z.coerce.number().nullable().optional(),
  slagReuse: z.coerce.number().nullable().optional(),
});

// Steelmaking schema (Steel) - EAF
const eafSchema = z.object({
  electricityConsumption: requiredNumber(0, undefined, "Electricity consumption is required"),
  scrapInput: requiredNumber(0, 100, "Scrap input is required"),
  driInput: requiredNumber(0, 100, "DRI input is required"),
  electrodesConsumption: z.coerce.number().nullable().optional(),
  // Sustainability
  renewablePower: z.coerce.number().nullable().optional(),
  onsiteScrapSorting: z.boolean().nullable().optional(),
});

// Parent steelmaking schema with conditional validation
const steelmakingFormSchema = z.object({
  steelmakingRoute: z.string().min(1, { message: "Select a steelmaking route" }),
  bof: bofSchema.partial().optional(),
  eaf: eafSchema.partial().optional(),
}).refine((data) => {
  if (data.steelmakingRoute === "bof") {
    if (data.bof?.scrapCharge === undefined || data.bof?.scrapCharge === null) return false;
    if (data.bof?.oxygenConsumption === undefined || data.bof?.oxygenConsumption === null) return false;
    if (data.bof?.fluxUsage === undefined || data.bof?.fluxUsage === null) return false;
    if (data.bof?.electricity === undefined || data.bof?.electricity === null) return false;
    if (data.bof?.co2 === undefined || data.bof?.co2 === null) return false;
  }
  if (data.steelmakingRoute === "eaf") {
    if (data.eaf?.electricityConsumption === undefined || data.eaf?.electricityConsumption === null) return false;
    if (data.eaf?.scrapInput === undefined || data.eaf?.scrapInput === null) return false;
    if (data.eaf?.driInput === undefined || data.eaf?.driInput === null) return false;
  }
  return true;
}, { message: "Fill all required fields for selected route" });

// Manufacturing options (Steel)
const productTypeOptions = [
  { id: "rod", label: "Rod" },
  { id: "rebar", label: "Rebar" },
  { id: "coil", label: "Coil" },
  { id: "plate", label: "Plate" },
  { id: "structuralSteel", label: "Structural Steel" },
  { id: "others", label: "Others" },
];

const castingMethodOptions = [
  { id: "continuous", label: "Continuous" },
  { id: "batch", label: "Batch" },
];

const furnaceTypeOptions = [
  { id: "induction", label: "Induction" },
  { id: "eaf", label: "EAF" },
  { id: "gas", label: "Gas" },
];

const furnaceTypeRecyclingOptions = [
  { id: "eaf", label: "EAF" },
  { id: "induction", label: "Induction" },
  { id: "rotary", label: "Rotary" },
];

const corrosionEnvironmentOptions = [
  { id: "low", label: "Low" },
  { id: "moderate", label: "Moderate" },
  { id: "high", label: "High" },
];

const scrapTypeOptions = [
  { id: "preConsumer", label: "Pre-consumer" },
  { id: "postConsumer", label: "Post-consumer" },
  { id: "mixed", label: "Mixed" },
];

const sortingTechnologyOptions = [
  { id: "manual", label: "Manual" },
  { id: "magnetic", label: "Magnetic" },
  { id: "optical", label: "Optical" },
  { id: "libs", label: "LIBS" },
  { id: "xrf", label: "XRF" },
];

const wasteTypeOptions = [
  { id: "bfSlag", label: "BF Slag" },
  { id: "bofSlag", label: "BOF Slag" },
  { id: "millScale", label: "Mill Scale" },
  { id: "dust", label: "Dust" },
  { id: "effluent", label: "Effluent" },
];

const valorizationMethodOptions = [
  { id: "reuse", label: "Reuse" },
  { id: "recycle", label: "Recycle" },
  { id: "neutralize", label: "Neutralize" },
  { id: "dispose", label: "Dispose" },
];

// Manufacturing schema (Steel)
const manufacturingFormSchema = z.object({
  productType: z.string().min(1, "Product type is required"),
  productTypeOthers: z.string().nullable().optional(),
  castingMethod: z.string().min(1, "Casting method is required"),
  furnaceType: z.string().min(1, "Furnace type is required"),
  meltingEnergy: requiredNumber(0, undefined, "Melting energy is required"),
  rollingEnergy: requiredNumber(0, undefined, "Rolling energy is required"),
  electricityMixRenewable: requiredNumber(0, 100, "Electricity mix is required"),
  processWater: requiredNumber(0, undefined, "Process water is required"),
  scrapGenerated: requiredNumber(0, 100, "Scrap generated is required"),
  // Other inputs
  scrapRecycledOnsite: z.coerce.number().nullable().optional(),
  surfaceTreatmentChemical: z.coerce.number().nullable().optional(),
  // Sustainability
  followingSustainableRules: z.boolean().nullable().optional(),
  sustainabilityParameters: z.object({
    designForRecycling: z.boolean().nullable().optional(),
    wasteHeatRecovery: z.coerce.number().nullable().optional(),
    renewableEnergy: z.coerce.number().nullable().optional(),
  }).nullable().optional(),
});

// Use Phase schema (Steel)
const usePhaseFormSchema = z.object({
  productLifetime: requiredNumber(0, undefined, "Product lifetime is required"),
  maintenanceFrequency: requiredNumber(0, undefined, "Maintenance frequency is required"),
  corrosionEnvironment: z.string().nullable().optional(),
  energySavings: z.coerce.number().nullable().optional(),
  reusePotential: z.coerce.number().nullable().optional(),
  // Sustainability
  followingSustainableRules: z.boolean().nullable().optional(),
  sustainabilityParameters: z.object({
    lifetimeExtension: z.coerce.number().nullable().optional(),
  }).nullable().optional(),
});

// Recycling schema (Steel)
const recyclingFormSchema = z.object({
  scrapType: z.string().min(1, "Scrap type is required"),
  collectionRate: requiredNumber(0, 100, "Collection rate is required"),
  sortingTechnology: z.string().min(1, "Sorting technology is required"),
  contaminationLevel: requiredNumber(0, 100, "Contamination level is required"),
  remeltingEnergy: requiredNumber(0, undefined, "Remelting energy is required"),
  recoveryYield: requiredNumber(0, 100, "Recovery yield is required"),
  recycledContent: requiredNumber(0, 100, "Recycled content is required"),
  // Other inputs
  furnaceType: z.string().nullable().optional(),
  slagGeneration: z.coerce.number().nullable().optional(),
  // Sustainability
  followingSustainableRules: z.boolean().nullable().optional(),
  sustainabilityParameters: z.object({
    highPuritySorting: z.boolean().nullable().optional(),
    slagReused: z.coerce.number().nullable().optional(),
    renewablePower: z.coerce.number().nullable().optional(),
  }).nullable().optional(),
});

// Valorization schema (Steel)
const valorizationFormSchema = z.object({
  wasteType: z.string().min(1, "Waste type is required"),
  valorizationMethod: z.string().min(1, "Valorization method is required"),
  valorizationRate: requiredNumber(0, 100, "Valorization rate is required"),
  metalRecoveryRate: requiredNumber(0, 100, "Metal recovery rate is required"),
  // Other inputs
  waterForTreatment: z.coerce.number().nullable().optional(),
  residue: z.coerce.number().nullable().optional(),
  // Sustainability
  followingSustainableRules: z.boolean().nullable().optional(),
  sustainabilityParameters: z.object({
    circularEconomyPartnerships: z.boolean().nullable().optional(),
    slagInCement: z.coerce.number().nullable().optional(),
  }).nullable().optional(),
});

function SteelMiningStep({ 
  onNext, 
  onSave, 
  initialValues, 
  onGenerateAIPrediction, 
  predicting, 
  pollingProgress = { current: 0, max: 15 }, 
  aiPopulatedFields = new Set(), 
  predictionMetadata = {}, 
  onCalculateLCA, 
  isCalculatingLca, 
  setShowSustainableSolutions, 
  setCurrentSustainableStage, 
  setFormDataForSustainable 
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(miningFormSchema),
    defaultValues: initialValues || {
      miningMethod: '',
      oreType: '',
      equipmentType: '',
      waterSource: '',
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
      console.log('🔄 [Steel Mining Form] Syncing with updated initial values:', initialValues);
      
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      
      console.log('✅ [Steel Mining Form] Form synced');
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    console.log('='.repeat(80));
    console.log('🎯 [Steel Mining Form] FORM SUBMISSION STARTED');
    console.log('='.repeat(80));
    console.log('📋 Form Data:', JSON.stringify(data, null, 2));
    console.log('✅ Form is valid:', isValid);
    console.log('❌ Form errors:', Object.keys(errors));

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      console.log('💾 [Steel Mining Form] Calling onSave function...');

      if (!onSave) {
        console.error('❌ [Steel Mining Form] onSave function is not provided!');
        setSaveError('Save function not available');
        setIsSaving(false);
        return;
      }

      await onSave(data);
      console.log('✅ [Steel Mining Form] onSave completed successfully');

      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('➡️  [Steel Mining Form] Calling onNext to move to next step...');
      if (onNext) {
        onNext();
        console.log('✅ [Steel Mining Form] onNext called');
      }

      console.log('='.repeat(80));
      console.log('✅ [Steel Mining Form] FORM SUBMISSION COMPLETED');
      console.log('='.repeat(80));
    } catch (error) {
      console.error('❌ [Steel Mining Form] FORM SUBMISSION FAILED');
      console.error('Error details:', error);
      setSaveError(error.message || 'Failed to save data');
      setIsSaving(false);
    } finally {
      if (!saveSuccess) {
        setIsSaving(false);
      }
    }
  };

  const miningMethod = watch("miningMethod");
  const followingSustainableRules = watch("followingSustainableRules");

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
        title="Iron Ore Mining / Extraction"
        description="Enter the details of the iron ore mining process. Fields marked with * are required."
        onPredict={() => handleGenerateAIPrediction(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
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
          {followingSustainableRules === true && (
            <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
              <h3 className={`${GROUP_HEADING_TEXT} mb-4 font-semibold text-gray-900`}>
                Sustainability Parameters
              </h3>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="sustainabilityParameters.rehabilitationPlanActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Rehabilitation Plan Active</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="sustainabilityParameters.overburdenRestored"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overburden Restored (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0-100" />
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
                        <Input {...field} type="number" placeholder="0-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          {biodiversityProtectionOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.label}
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
                  name="sustainabilityParameters.dustSuppression"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dust Suppression</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dustSuppressionOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Core Parameters */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Core Parameters</h3>

            {/* Mining Method */}
            <FormField
              control={control}
              name="miningMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={GROUP_HEADING_TEXT}>Mining Method*</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {miningMethodOptions.map((method) => (
                        <CardRadio
                          key={method.id}
                          id={`mining-method-${method.id}`}
                          label={method.label}
                          selected={field.value === method.id}
                          onSelect={() => field.onChange(field.value === method.id ? '' : method.id)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {miningMethod === "others" && (
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
                <FormItem className="space-y-3">
                  <FormLabel className={GROUP_HEADING_TEXT}>Ore Type*</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {oreTypeOptions.map((type) => (
                        <CardRadio
                          key={type.id}
                          id={`ore-type-${type.id}`}
                          label={type.label}
                          selected={field.value === type.id}
                          onSelect={() => field.onChange(field.value === type.id ? '' : type.id)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <hr className="my-4 border-gray-200" />

            {/* Numeric Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="oreGradeFe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Ore Grade % Fe*</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          value={[typeof field.value === 'number' ? field.value : 0]}
                          onValueChange={(v) => field.onChange(v[0])}
                          min={0}
                          max={100}
                          step={0.1}
                        />
                        <div className="text-sm text-muted-foreground">{(field.value ?? 0).toFixed(1)}%</div>
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
                      Overburden Ratio (m³ waste per tonne ore)*
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-2 cursor-help text-muted-foreground">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Volume of waste removed per tonne of ore</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="avgHaulDistance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Average Haul Distance (km)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 5.0" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="fuelConsumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Fuel Consumption (L/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 2.5" {...field} value={field.value ?? ""} />
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
                      <Input type="number" step="0.1" placeholder="e.g., 15.0" {...field} value={field.value ?? ""} />
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
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Consumption (m³/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <hr className="my-4 border-gray-200" />

            {/* Equipment Type */}
            <FormField
              control={control}
              name="equipmentType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={GROUP_HEADING_TEXT}>Equipment Type*</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {equipmentTypeOptions.map((type) => (
                        <CardRadio
                          key={type.id}
                          id={`equipment-${type.id}`}
                          label={type.label}
                          selected={field.value === type.id}
                          onSelect={() => field.onChange(field.value === type.id ? '' : type.id)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Water Source */}
            <FormField
              control={control}
              name="waterSource"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={GROUP_HEADING_TEXT}>Water Source*</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {waterSourceOptions.map((source) => (
                        <CardRadio
                          key={source.id}
                          id={`water-source-${source.id}`}
                          label={source.label}
                          selected={field.value === source.id}
                          onSelect={() => field.onChange(field.value === source.id ? '' : source.id)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Additional Inputs */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Additional Inputs</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="landDisturbed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Land Disturbed (m²/t)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Optional" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="dustEmissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Dust Emissions PM10 (kg/t)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="explosives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Explosives (kg ANFO/t)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Optional" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="oreMoisture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Iron Ore Moisture (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Optional" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </StepSection>
    </FormProvider>
  );
}

// Step 2: Beneficiation (Steel)
function SteelBeneficiationStep({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting, pollingProgress = { current: 0, max: 15 }, aiPopulatedFields = new Set(), predictionMetadata = {}, onCalculateLCA, isCalculatingLca, materialSource, setShowSustainableSolutions, setCurrentSustainableStage, setFormDataForSustainable }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(beneficiationFormSchema),
    defaultValues: initialValues || {
      processes: [],
      sustainabilityParameters: {},
    },
    mode: "onTouched",
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isValid, errors },
  } = form;

  useEffect(() => {
    if (initialValues) {
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
    }
  }, [JSON.stringify(initialValues), setValue]);

  const processes = watch("processes");
  const followingSustainableRules = watch("followingSustainableRules");

  const onSubmit = async (data) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await onSave?.(data);
      setSaveSuccess(true);
      await new Promise(r => setTimeout(r, 400));
      onNext?.();
    } catch (error) {
      setSaveError(error.message || 'Failed to save data');
      setIsSaving(false);
    } finally {
      if (!saveSuccess) setIsSaving(false);
    }
  };

  // If material source is secondary, render not-applicable guard (UI parity with disabling)
  if (materialSource === 'secondary') {
    return (
      <StepSection
        stepNumber={2}
        badgeLabel="Beneficiation"
        title="Beneficiation (Not applicable for 100% secondary)"
        description="This step is skipped because material source is secondary."
      >
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-700">
          Beneficiation is only applicable for Primary or Mixed sources.
          {onBack && (
            <div className="mt-6">
              <StepFooterActions onBack={onBack} onForward={onNext} forwardLabel="Next" />
            </div>
          )}
        </div>
      </StepSection>
    );
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
        title="Beneficiation (Crushing, Screening, Washing, Magnetic Separation)"
        description="Fields marked with * are required. Visible for Primary or Mixed sources."
        onPredict={() => onGenerateAIPrediction?.(form.getValues())}
        predicting={predicting}
        pollingProgress={pollingProgress}
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
                      Enable to include sustainability parameters for beneficiation
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
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="sustainabilityParameters.bioReagents"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Bio-based Reagents</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="sustainabilityParameters.zeroLiquidDischarge"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Zero Liquid Discharge</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="sustainabilityParameters.tailingsDewatering"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tailings Dewatering</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tailingsDewateringOptions.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                          ))}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {waterTreatmentOptions.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="sustainabilityParameters.tailingsReusePotential"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tailings Reuse Potential (%)</FormLabel>
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

          {/* Core Parameters */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Core Parameters</h3>

            <FormField
              control={control}
              name="processes"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className={GROUP_HEADING_TEXT}>Processes Selected*</FormLabel>
                    <FormDescription>Select all applicable processes.</FormDescription>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {beneficiationProcesses.map(item => (
                      <CardCheckbox
                        key={item.id}
                        id={`bene-proc-${item.id}`}
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

            {processes?.includes("others") && (
              <FormField
                control={control}
                name="processOthers"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="concentrateGradeFe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Concentrate Grade % Fe*</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          value={[typeof field.value === 'number' ? field.value : 0]}
                          onValueChange={(v) => field.onChange(v[0])}
                          min={0}
                          max={100}
                          step={0.1}
                        />
                        <div className="text-sm text-muted-foreground">{(field.value ?? 0).toFixed(1)}%</div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="grindingEnergy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Grinding Energy (kWh/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 15" {...field} value={field.value ?? ""} />
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
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Consumption (m³/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 0.8" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="waterRecycled"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Water Recycled (%)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 60" {...field} value={field.value ?? ""} />
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
                    <FormLabel className={GROUP_HEADING_TEXT}>Electricity Use (kWh/t ore)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 20" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="recoveryEfficiency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Recovery Efficiency (%)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 85" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Tailings & Storage */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Tailings & Storage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="tailingsProduced"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Tailings Produced (t/t ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="tailingsSolids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={GROUP_HEADING_TEXT}>Tailings Solids (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Optional" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="tailingsStorageType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={GROUP_HEADING_TEXT}>Tailings Storage Type</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {tailingsStorageOptions.map((opt) => (
                        <CardRadio
                          key={opt.id}
                          id={`tailings-${opt.id}`}
                          label={opt.label}
                          selected={field.value === opt.id}
                          onSelect={() => field.onChange(field.value === opt.id ? '' : opt.id)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* AI predicted placeholder (none defined) */}
        </form>
      </StepSection>
    </FormProvider>
  );
}

// =============================================================================
// STEEL IRONMAKING STEP - Blast Furnace vs DRI Routes
// =============================================================================

function SteelIronmakingStep({
  onNext,
  onBack,
  onSave,
  initialValues,
  onGenerateAIPrediction,
  predicting,
  pollingProgress = { current: 0, max: 15 },
  aiPopulatedFields = new Set(),
  predictionMetadata = {},
  onCalculateLCA,
  isCalculatingLca,
  setShowSustainableSolutions,
  setCurrentSustainableStage,
  setFormDataForSustainable,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(ironmakingFormSchema),
    defaultValues: initialValues || {
      ironmakingRoute: '',
      blastFurnace: {},
      dri: {},
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

  // Sync form with updated initialValues
  useEffect(() => {
    if (initialValues) {
      console.log('🔄 [Steel Ironmaking Form] Syncing with updated initial values:', initialValues);
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      console.log('✅ [Steel Ironmaking Form] Form synced');
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    console.log('='.repeat(80));
    console.log('🎯 [Steel Ironmaking Form] FORM SUBMISSION STARTED');
    console.log('='.repeat(80));
    console.log('📋 Form Data:', JSON.stringify(data, null, 2));
    console.log('✅ Form is valid:', isValid);

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      console.log('💾 [Steel Ironmaking Form] Calling onSave function...');
      if (!onSave) {
        console.error('❌ [Steel Ironmaking Form] onSave function is not provided!');
        setSaveError('Save function not available');
        setIsSaving(false);
        return;
      }

      await onSave(data);
      console.log('✅ [Steel Ironmaking Form] onSave completed successfully');

      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('➡️  [Steel Ironmaking Form] Calling onNext to move to next step...');
      if (onNext) {
        onNext();
        console.log('✅ [Steel Ironmaking Form] onNext called');
      }

      console.log('='.repeat(80));
      console.log('✅ [Steel Ironmaking Form] FORM SUBMISSION COMPLETED');
      console.log('='.repeat(80));
    } catch (error) {
      console.error('❌ [Steel Ironmaking Form] FORM SUBMISSION FAILED');
      console.error('Error details:', error);
      setSaveError(error.message || 'Failed to save data');
      setIsSaving(false);
    } finally {
      if (!saveSuccess) {
        setIsSaving(false);
      }
    }
  };

  const ironmakingRoute = watch("ironmakingRoute");
  const followingSustainableRules = watch("followingSustainableRules");
  const isBF = ironmakingRoute === "blastFurnace";
  const isDRI = ironmakingRoute && ironmakingRoute.startsWith("dri");

  return (
    <FormProvider {...form}>
      <StepSection
        title="Ironmaking"
        stepNumber={3}
        badgeLabel="IRON"
        showLCA={true}
        onLcaCalculate={() => onCalculateLCA(form.getValues())}
        isCalculatingLca={isCalculatingLca}
        showSustainableButton={true}
        onShowSustainable={() => {
          setCurrentSustainableStage('ironmaking');
          setFormDataForSustainable(form.getValues());
          setShowSustainableSolutions(true);
        }}
        footer={
          <StepFooterActions
            onBack={onBack}
            onForward={() => handleSubmit(onSubmit)()}
            forwardDisabled={!isValid || isSaving}
            forwardLabel="Save & Next"
            showLca={true}
            onLcaCalculate={() => onCalculateLCA(form.getValues())}
            isCalculatingLca={isCalculatingLca}
            showSustainableButton={true}
            onShowSustainable={() => {
              setCurrentSustainableStage('ironmaking');
              setFormDataForSustainable(form.getValues());
              setShowSustainableSolutions(true);
            }}
          />
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {saveError}
            </div>
          )}

          {/* Ironmaking Route Selection */}
          <div className="space-y-4">
            <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>
              Ironmaking Route*
            </FormLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ironmakingRouteOptions.map((opt) => (
                <CardRadio
                  key={opt.id}
                  id={`iron-route-${opt.id}`}
                  label={opt.label}
                  selected={ironmakingRoute === opt.id}
                  onSelect={() => {
                    setValue("ironmakingRoute", ironmakingRoute === opt.id ? '' : opt.id, { shouldValidate: true });
                  }}
                />
              ))}
            </div>
          </div>

          {/* BLAST FURNACE ROUTE */}
          {isBF && (
            <div className="space-y-6 p-6 rounded-lg border border-amber-200 bg-amber-50">
              <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-amber-900`}>
                Blast Furnace Parameters
              </h4>

              <FormField
                control={control}
                name="blastFurnace.sintering"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sintering Used*</FormLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {sinteringOptions.map((opt) => (
                        <CardRadio
                          key={opt.id}
                          id={`sintering-${opt.id}`}
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
                  name="blastFurnace.pelletRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pellet Ratio (%)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="blastFurnace.cokeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coke Rate (kg/t)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="blastFurnace.pciRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PCI Rate (kg/t)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="blastFurnace.electricity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electricity (kWh/t)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="kWh/t" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="blastFurnace.thermalEnergy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thermal Energy (MJ/t)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="MJ/t" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="blastFurnace.slagGeneration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slag Generation (kg/t)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Emissions section for BF */}
              <div className="space-y-4 pt-4 border-t border-amber-300">
                <h5 className={`${OPTION_TEXT} font-semibold text-amber-900`}>Emissions</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="blastFurnace.co2"
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
                    name="blastFurnace.sox"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SOx (kg/t)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="blastFurnace.nox"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NOx (kg/t)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="blastFurnace.dust"
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

              {/* Sustainability for BF */}
              <div className="space-y-4 pt-4 border-t border-amber-300">
                <FormField
                  control={control}
                  name="followingSustainableRules"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer font-semibold text-green-900">
                        🌱 Following Sustainable Rules
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {followingSustainableRules && (
                  <>
                    <h5 className={`${OPTION_TEXT} font-semibold text-amber-900`}>Sustainability Parameters</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={control}
                    name="blastFurnace.renewablePower"
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
                    name="blastFurnace.slagInCement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slag Used in Cement (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="blastFurnace.heatRecovery"
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
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* DRI ROUTE */}
          {isDRI && (
            <div className="space-y-6 p-6 rounded-lg border border-blue-200 bg-blue-50">
              <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-blue-900`}>
                Direct Reduced Iron (DRI) Parameters
              </h4>

              <FormField
                control={control}
                name="dri.feedstock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedstock Type*</FormLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {feedstockOptions.map((opt) => (
                        <CardRadio
                          key={opt.id}
                          id={`feedstock-${opt.id}`}
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
                  name="dri.reductant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {ironmakingRoute === "driCoal" ? "Reductant Coal (kg/t)" : "Natural Gas (Nm³/t)"}*
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="value" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="dri.electricity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electricity (kWh/t)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="kWh/t" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="dri.metallization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metallization (%)*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="dri.co2"
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
              </div>

              {/* Sustainability for DRI */}
              <div className="space-y-4 pt-4 border-t border-blue-300">
                <FormField
                  control={control}
                  name="followingSustainableRules"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer font-semibold text-green-900">
                        🌱 Following Sustainable Rules
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {followingSustainableRules && (
                  <>
                    <h5 className={`${OPTION_TEXT} font-semibold text-blue-900`}>Sustainability Parameters</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="dri.hydrogenSubstitution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hydrogen Substitution (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="dri.syngasRecycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Syngas Recycle (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </form>
      </StepSection>
    </FormProvider>
  );
}

// =============================================================================
// STEEL STEELMAKING STEP - BOF vs EAF Routes
// =============================================================================

function SteelSteelmakingStep({
  onNext,
  onBack,
  onSave,
  initialValues,
  onGenerateAIPrediction,
  predicting,
  pollingProgress = { current: 0, max: 15 },
  aiPopulatedFields = new Set(),
  predictionMetadata = {},
  onCalculateLCA,
  isCalculatingLca,
  setShowSustainableSolutions,
  setCurrentSustainableStage,
  setFormDataForSustainable,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(steelmakingFormSchema),
    defaultValues: initialValues || {
      steelmakingRoute: '',
      bof: {},
      eaf: {},
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

  // Sync form with updated initialValues
  useEffect(() => {
    if (initialValues) {
      console.log('🔄 [Steel Steelmaking Form] Syncing with updated initial values:', initialValues);
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
      console.log('✅ [Steel Steelmaking Form] Form synced');
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    console.log('='.repeat(80));
    console.log('🎯 [Steel Steelmaking Form] FORM SUBMISSION STARTED');
    console.log('='.repeat(80));
    console.log('📋 Form Data:', JSON.stringify(data, null, 2));
    console.log('✅ Form is valid:', isValid);

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      console.log('💾 [Steel Steelmaking Form] Calling onSave function...');
      if (!onSave) {
        console.error('❌ [Steel Steelmaking Form] onSave function is not provided!');
        setSaveError('Save function not available');
        setIsSaving(false);
        return;
      }

      await onSave(data);
      console.log('✅ [Steel Steelmaking Form] onSave completed successfully');

      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('➡️  [Steel Steelmaking Form] Calling onNext to move to next step...');
      if (onNext) {
        onNext();
        console.log('✅ [Steel Steelmaking Form] onNext called');
      }

      console.log('='.repeat(80));
      console.log('✅ [Steel Steelmaking Form] FORM SUBMISSION COMPLETED');
      console.log('='.repeat(80));
    } catch (error) {
      console.error('❌ [Steel Steelmaking Form] FORM SUBMISSION FAILED');
      console.error('Error details:', error);
      setSaveError(error.message || 'Failed to save data');
      setIsSaving(false);
    } finally {
      if (!saveSuccess) {
        setIsSaving(false);
      }
    }
  };

  const steelmakingRoute = watch("steelmakingRoute");
  const followingSustainableRules = watch("followingSustainableRules");
  const isBOF = steelmakingRoute === "bof";
  const isEAF = steelmakingRoute === "eaf";

  return (
    <FormProvider {...form}>
      <StepSection
        title="Steelmaking"
        stepNumber={4}
        badgeLabel="STEEL"
        footer={
          <StepFooterActions
            onBack={onBack}
            onForward={() => handleSubmit(onSubmit)()}
            forwardDisabled={!isValid || isSaving}
            forwardLabel="Save & Next"
            showLca={true}
            onLcaCalculate={() => onCalculateLCA(form.getValues())}
            isCalculatingLca={isCalculatingLca}
            showSustainableButton={true}
            onShowSustainable={() => {
              setCurrentSustainableStage('steelmaking');
              setFormDataForSustainable(form.getValues());
              setShowSustainableSolutions(true);
            }}
          />
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {saveError}
            </div>
          )}

          {/* Steelmaking Route Selection */}
          <div className="space-y-4">
            <FormLabel className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>
              Steelmaking Route*
            </FormLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {steelmakingRouteOptions.map((opt) => (
                <CardRadio
                  key={opt.id}
                  id={`steel-route-${opt.id}`}
                  label={opt.label}
                  selected={steelmakingRoute === opt.id}
                  onSelect={() => {
                    setValue("steelmakingRoute", steelmakingRoute === opt.id ? '' : opt.id, { shouldValidate: true });
                  }}
                />
              ))}
            </div>
          </div>

          {/* BOF ROUTE */}
          {isBOF && (
            <div className="space-y-6 p-6 rounded-lg border border-orange-200 bg-orange-50">
              <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-orange-900`}>
                BOF (Basic Oxygen Furnace) Parameters
              </h4>

              {/* Core Parameters */}
              <div className="space-y-4">
                <h5 className={`${OPTION_TEXT} font-semibold text-orange-900`}>Core Parameters</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="bof.scrapCharge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scrap Charge (%)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="bof.oxygenConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oxygen Consumption (Nm³/t)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Nm³/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="bof.fluxUsage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flux Usage (Lime/Dolomite) (kg/t)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="bof.electricity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electricity (kWh/t)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kWh/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Emissions section for BOF */}
              <div className="space-y-4 pt-4 border-t border-orange-300">
                <h5 className={`${OPTION_TEXT} font-semibold text-orange-900`}>Emissions</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={control}
                    name="bof.co2"
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
                    name="bof.so2"
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
                    name="bof.nox"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NOx (kg/t)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Sustainability for BOF */}
              <div className="space-y-4 pt-4 border-t border-orange-300">
                <FormField
                  control={control}
                  name="followingSustainableRules"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer font-semibold text-green-900">
                        🌱 Following Sustainable Rules
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {followingSustainableRules && (
                  <>
                    <h5 className={`${OPTION_TEXT} font-semibold text-orange-900`}>Sustainability Parameters</h5>
                    
                    <FormField
                      control={control}
                      name="bof.highScrapUtilization"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">
                            High Scrap Utilization Mode
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="bof.renewableEnergy"
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
                    name="bof.slagReuse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slag Reuse (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* EAF ROUTE */}
          {isEAF && (
            <div className="space-y-6 p-6 rounded-lg border border-purple-200 bg-purple-50">
              <h4 className={`${GROUP_HEADING_TEXT} font-semibold text-purple-900`}>
                EAF (Electric Arc Furnace) Parameters
              </h4>

              {/* Core Parameters */}
              <div className="space-y-4">
                <h5 className={`${OPTION_TEXT} font-semibold text-purple-900`}>Core Parameters</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="eaf.electricityConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electricity Consumption (kWh/t)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kWh/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="eaf.scrapInput"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scrap Input (%)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="eaf.driInput"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DRI Input (%)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="eaf.electrodesConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electrodes Consumption (kg/t)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Sustainability for EAF */}
              <div className="space-y-4 pt-4 border-t border-purple-300">
                <FormField
                  control={control}
                  name="followingSustainableRules"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer font-semibold text-green-900">
                        🌱 Following Sustainable Rules
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {followingSustainableRules && (
                  <>
                    <h5 className={`${OPTION_TEXT} font-semibold text-purple-900`}>Sustainability Parameters</h5>
                    
                    <FormField
                      control={control}
                      name="eaf.onsiteScrapSorting"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">
                            Onsite Scrap Sorting
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="eaf.renewablePower"
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
                  </>
                )}
              </div>
            </div>
          )}
        </form>
      </StepSection>
    </FormProvider>
  );
}

// =============================================================================
// STEEL MANUFACTURING STEP
// =============================================================================

function SteelManufacturingStep({
  onNext,
  onBack,
  onSave,
  initialValues,
  onGenerateAIPrediction,
  predicting,
  pollingProgress = { current: 0, max: 15 },
  aiPopulatedFields = new Set(),
  predictionMetadata = {},
  onCalculateLCA,
  isCalculatingLca,
  setShowSustainableSolutions,
  setCurrentSustainableStage,
  setFormDataForSustainable,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(manufacturingFormSchema),
    defaultValues: initialValues || {
      productType: '',
      castingMethod: '',
      furnaceType: '',
      sustainabilityParameters: {},
    },
    mode: "onTouched",
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isValid, errors },
  } = form;

  useEffect(() => {
    if (initialValues) {
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (!onSave) {
        setSaveError('Save function not available');
        setIsSaving(false);
        return;
      }

      await onSave(data);
      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onNext) {
        onNext();
      }
    } catch (error) {
      console.error('Error:', error);
      setSaveError(error.message || 'Failed to save data');
      setIsSaving(false);
    } finally {
      if (!saveSuccess) {
        setIsSaving(false);
      }
    }
  };

  const productType = watch("productType");
  const followingSustainableRules = watch("followingSustainableRules");

  return (
    <FormProvider {...form}>
      <StepSection
        title="Manufacturing"
        stepNumber={5}
        badgeLabel="MFG"
        footer={
          <StepFooterActions
            onBack={onBack}
            onForward={() => handleSubmit(onSubmit)()}
            forwardDisabled={!isValid || isSaving}
            forwardLabel="Save & Next"
            showLca={true}
            onLcaCalculate={() => onCalculateLCA(form.getValues())}
            isCalculatingLca={isCalculatingLca}
            showSustainableButton={true}
            onShowSustainable={() => {
              setCurrentSustainableStage('manufacturing');
              setFormDataForSustainable(form.getValues());
              setShowSustainableSolutions(true);
            }}
          />
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {saveError}
            </div>
          )}

          {/* Core Parameters */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Core Parameters</h3>

            <FormField
              control={control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type*</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {productTypeOptions.map((opt) => (
                      <CardRadio
                        key={opt.id}
                        id={`product-${opt.id}`}
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

            {productType === "others" && (
              <FormField
                control={control}
                name="productTypeOthers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Product Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product type" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={control}
              name="castingMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Casting Method*</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {castingMethodOptions.map((opt) => (
                      <CardRadio
                        key={opt.id}
                        id={`casting-${opt.id}`}
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

            <FormField
              control={control}
              name="furnaceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Furnace Type*</FormLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {furnaceTypeOptions.map((opt) => (
                      <CardRadio
                        key={opt.id}
                        id={`furnace-${opt.id}`}
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
                name="meltingEnergy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Melting Energy (kWh/t)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="kWh/t" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="rollingEnergy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rolling Energy (kWh/t)*</FormLabel>
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
                    <FormLabel>Electricity Mix - Renewable (%)*</FormLabel>
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
                    <FormLabel>Process Water (m³/t)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="m³/t" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="scrapGenerated"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scrap Generated (%)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Other Inputs */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Other Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <FormField
                control={control}
                name="surfaceTreatmentChemical"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surface Treatment Chemical Use (kg/t)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Sustainability */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <FormField
              control={control}
              name="followingSustainableRules"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer font-semibold text-green-900">
                    🌱 Following Sustainable Rules
                  </FormLabel>
                </FormItem>
              )}
            />

            {followingSustainableRules && (
              <>
                <h5 className={`${OPTION_TEXT} font-semibold text-gray-900`}>Sustainability Parameters</h5>
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.designForRecycling"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">
                        Design for Recycling Enabled
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="sustainabilityParameters.wasteHeatRecovery"
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

                  <FormField
                    control={control}
                    name="sustainabilityParameters.renewableEnergy"
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
              </>
            )}
          </div>
        </form>
      </StepSection>
    </FormProvider>
  );
}

// =============================================================================
// STEEL USE PHASE STEP
// =============================================================================

function SteelUsePhaseStep({
  onNext,
  onBack,
  onSave,
  initialValues,
  onGenerateAIPrediction,
  predicting,
  pollingProgress = { current: 0, max: 15 },
  aiPopulatedFields = new Set(),
  predictionMetadata = {},
  onCalculateLCA,
  isCalculatingLca,
  setShowSustainableSolutions,
  setCurrentSustainableStage,
  setFormDataForSustainable,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(usePhaseFormSchema),
    defaultValues: initialValues || {
      sustainabilityParameters: {},
    },
    mode: "onTouched",
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isValid, errors },
  } = form;

  useEffect(() => {
    if (initialValues) {
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (!onSave) {
        setSaveError('Save function not available');
        setIsSaving(false);
        return;
      }

      await onSave(data);
      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onNext) {
        onNext();
      }
    } catch (error) {
      console.error('Error:', error);
      setSaveError(error.message || 'Failed to save data');
      setIsSaving(false);
    } finally {
      if (!saveSuccess) {
        setIsSaving(false);
      }
    }
  };

  const followingSustainableRules = watch("followingSustainableRules");

  return (
    <FormProvider {...form}>
      <StepSection
        title="Use Phase"
        stepNumber={6}
        badgeLabel="USE"
        footer={
          <StepFooterActions
            onBack={onBack}
            onForward={() => handleSubmit(onSubmit)()}
            forwardDisabled={!isValid || isSaving}
            forwardLabel="Save & Next"
            showLca={true}
            onLcaCalculate={() => onCalculateLCA(form.getValues())}
            isCalculatingLca={isCalculatingLca}
            showSustainableButton={true}
            onShowSustainable={() => {
              setCurrentSustainableStage('usePhase');
              setFormDataForSustainable(form.getValues());
              setShowSustainableSolutions(true);
            }}
          />
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {saveError}
            </div>
          )}

          {/* Core Parameters */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Core Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="productLifetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Lifetime (years)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="years" {...field} value={field.value ?? ""} />
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
                    <FormLabel>Maintenance Frequency (per year)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="per year" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="corrosionEnvironment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corrosion Environment</FormLabel>
                    <div className="grid grid-cols-3 gap-3">
                      {corrosionEnvironmentOptions.map((opt) => (
                        <CardRadio
                          key={opt.id}
                          id={`corrosion-${opt.id}`}
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

              <FormField
                control={control}
                name="energySavings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energy Savings vs Alternative (%)</FormLabel>
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

          {/* Sustainability */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <FormField
              control={control}
              name="followingSustainableRules"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer font-semibold text-green-900">
                    🌱 Following Sustainable Rules
                  </FormLabel>
                </FormItem>
              )}
            />

            {followingSustainableRules && (
              <>
                <h5 className={`${OPTION_TEXT} font-semibold text-gray-900`}>Sustainability Parameters</h5>
                <FormField
                  control={control}
                  name="sustainabilityParameters.lifetimeExtension"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lifetime Extension (years)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="years" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </form>
      </StepSection>
    </FormProvider>
  );
}

// =============================================================================
// STEEL RECYCLING STEP
// =============================================================================

function SteelRecyclingStep({
  onNext,
  onBack,
  onSave,
  initialValues,
  onGenerateAIPrediction,
  predicting,
  pollingProgress = { current: 0, max: 15 },
  aiPopulatedFields = new Set(),
  predictionMetadata = {},
  onCalculateLCA,
  isCalculatingLca,
  setShowSustainableSolutions,
  setCurrentSustainableStage,
  setFormDataForSustainable,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(recyclingFormSchema),
    defaultValues: initialValues || {
      scrapType: '',
      sortingTechnology: '',
      sustainabilityParameters: {},
    },
    mode: "onTouched",
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isValid, errors },
  } = form;

  useEffect(() => {
    if (initialValues) {
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (!onSave) {
        setSaveError('Save function not available');
        setIsSaving(false);
        return;
      }

      await onSave(data);
      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onNext) {
        onNext();
      }
    } catch (error) {
      console.error('Error:', error);
      setSaveError(error.message || 'Failed to save data');
      setIsSaving(false);
    } finally {
      if (!saveSuccess) {
        setIsSaving(false);
      }
    }
  };

  const followingSustainableRules = watch("followingSustainableRules");

  return (
    <FormProvider {...form}>
      <StepSection
        title="End-of-Life Recycling"
        stepNumber={7}
        badgeLabel="RECYCLE"
        footer={
          <StepFooterActions
            onBack={onBack}
            onForward={() => handleSubmit(onSubmit)()}
            forwardDisabled={!isValid || isSaving}
            forwardLabel="Save & Next"
            showLca={true}
            onLcaCalculate={() => onCalculateLCA(form.getValues())}
            isCalculatingLca={isCalculatingLca}
            showSustainableButton={true}
            onShowSustainable={() => {
              setCurrentSustainableStage('recycling');
              setFormDataForSustainable(form.getValues());
              setShowSustainableSolutions(true);
            }}
          />
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {saveError}
            </div>
          )}

          {/* Core Parameters */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Core Parameters</h3>

            <FormField
              control={control}
              name="scrapType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scrap Type*</FormLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {scrapTypeOptions.map((opt) => (
                      <CardRadio
                        key={opt.id}
                        id={`scrap-${opt.id}`}
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

            <FormField
              control={control}
              name="sortingTechnology"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sorting Technology*</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sortingTechnologyOptions.map((opt) => (
                      <CardRadio
                        key={opt.id}
                        id={`sorting-${opt.id}`}
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
                name="collectionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection Rate (%)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="contaminationLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contamination Level (%)*</FormLabel>
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
                    <FormLabel>Remelting Energy (kWh/t)*</FormLabel>
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
                    <FormLabel>Recovery Yield (%)*</FormLabel>
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
                    <FormLabel>Recycled Content (%)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Other Inputs */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Other Inputs</h3>
            
            <FormField
              control={control}
              name="furnaceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Furnace Type</FormLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {furnaceTypeRecyclingOptions.map((opt) => (
                      <CardRadio
                        key={opt.id}
                        id={`rec-furnace-${opt.id}`}
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

            <FormField
              control={control}
              name="slagGeneration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slag Generation (kg/t)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Sustainability */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <FormField
              control={control}
              name="followingSustainableRules"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer font-semibold text-green-900">
                    🌱 Following Sustainable Rules
                  </FormLabel>
                </FormItem>
              )}
            />

            {followingSustainableRules && (
              <>
                <h5 className={`${OPTION_TEXT} font-semibold text-gray-900`}>Sustainability Parameters</h5>
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.highPuritySorting"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">
                        High Purity Sorting Enabled
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="sustainabilityParameters.slagReused"
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
                    name="sustainabilityParameters.renewablePower"
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
                </div>
              </>
            )}
          </div>
        </form>
      </StepSection>
    </FormProvider>
  );
}

// =============================================================================
// STEEL VALORIZATION STEP
// =============================================================================

function SteelValorizationStep({
  onNext,
  onBack,
  onSave,
  initialValues,
  onGenerateAIPrediction,
  predicting,
  pollingProgress = { current: 0, max: 15 },
  aiPopulatedFields = new Set(),
  predictionMetadata = {},
  onCalculateLCA,
  isCalculatingLca,
  setShowSustainableSolutions,
  setCurrentSustainableStage,
  setFormDataForSustainable,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(valorizationFormSchema),
    defaultValues: initialValues || {
      wasteType: '',
      valorizationMethod: '',
      sustainabilityParameters: {},
    },
    mode: "onTouched",
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isValid, errors },
  } = form;

  useEffect(() => {
    if (initialValues) {
      Object.keys(initialValues).forEach((key) => {
        setValue(key, initialValues[key], { shouldValidate: true, shouldDirty: false });
      });
    }
  }, [JSON.stringify(initialValues), setValue]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (!onSave) {
        setSaveError('Save function not available');
        setIsSaving(false);
        return;
      }

      await onSave(data);
      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onNext) {
        onNext();
      }
    } catch (error) {
      console.error('Error:', error);
      setSaveError(error.message || 'Failed to save data');
      setIsSaving(false);
    } finally {
      if (!saveSuccess) {
        setIsSaving(false);
      }
    }
  };

  const followingSustainableRules = watch("followingSustainableRules");

  return (
    <FormProvider {...form}>
      <StepSection
        title="Byproduct & Waste Valorization"
        stepNumber={8}
        badgeLabel="VALOR"
        footer={
          <StepFooterActions
            onBack={onBack}
            onForward={() => handleSubmit(onSubmit)()}
            forwardDisabled={!isValid || isSaving}
            forwardLabel="Complete"
            showLca={true}
            onLcaCalculate={() => onCalculateLCA(form.getValues())}
            isCalculatingLca={isCalculatingLca}
            showSustainableButton={true}
            onShowSustainable={() => {
              setCurrentSustainableStage('valorization');
              setFormDataForSustainable(form.getValues());
              setShowSustainableSolutions(true);
            }}
          />
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {saveError}
            </div>
          )}

          {/* Core Parameters */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Core Parameters</h3>

            <FormField
              control={control}
              name="wasteType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waste Type*</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {wasteTypeOptions.map((opt) => (
                      <CardRadio
                        key={opt.id}
                        id={`waste-${opt.id}`}
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

            <FormField
              control={control}
              name="valorizationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valorization Method*</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {valorizationMethodOptions.map((opt) => (
                      <CardRadio
                        key={opt.id}
                        id={`valorization-${opt.id}`}
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
                name="valorizationRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valorization Rate (%)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="metalRecoveryRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metal Recovery Rate (%)*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Other Inputs */}
          <div className="space-y-6">
            <h3 className={`${GROUP_HEADING_TEXT} font-semibold text-gray-900`}>Other Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="waterForTreatment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Water for Treatment (m³/t)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="m³/t" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="residue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Residue (kg/t)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="kg/t" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Sustainability */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <FormField
              control={control}
              name="followingSustainableRules"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer font-semibold text-green-900">
                    🌱 Following Sustainable Rules
                  </FormLabel>
                </FormItem>
              )}
            />

            {followingSustainableRules && (
              <>
                <h5 className={`${OPTION_TEXT} font-semibold text-gray-900`}>Sustainability Parameters</h5>
                
                <FormField
                  control={control}
                  name="sustainabilityParameters.circularEconomyPartnerships"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">
                        Circular Economy Partnerships
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="sustainabilityParameters.slagInCement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slag in Cement (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="0-100" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </form>
      </StepSection>
    </FormProvider>
  );
}

// =============================================================================
// MAIN WIZARD FORM COMPONENT
// =============================================================================

export default function WizardFormSteel({
  steps,
  activeStep,
  onStepChange,
  workflowId,
  workflowData,
  onWorkflowUpdate,
  onWorkflowSubmitted,
  onMaterialSourceChange,
  materialSource = 'primary',
}) {
  const [stepData, setStepData] = useState({
    mining: {},
    beneficiation: {},
    ironmaking: {},
    steelmaking: {},
    manufacturing: {},
    usePhase: {},
    recycling: {},
    valorization: {},
  });

  const [predicting, setPredicting] = useState(false);
  const [pollingProgress, setPollingProgress] = useState({ current: 0, max: 15 });
  const [aiPopulatedFields, setAiPopulatedFields] = useState(new Set());
  const [predictionMetadata, setPredictionMetadata] = useState({});

  const [showLcaSuccessModal, setShowLcaSuccessModal] = useState(false);
  const [lcaResult, setLcaResult] = useState(null);
  const [isCalculatingLca, setIsCalculatingLca] = useState(false);

  const [showSustainableSolutions, setShowSustainableSolutions] = useState(false);
  const [currentSustainableStage, setCurrentSustainableStage] = useState(null);
  const [formDataForSustainable, setFormDataForSustainable] = useState(null);

  // Load existing step data from workflow
  useEffect(() => {
    if (workflowData) {
      const newStepData = { ...stepData };
      
      if (workflowData.mining) {
        newStepData.mining = workflowData.mining;
      }
      if (workflowData.beneficiation) {
        newStepData.beneficiation = workflowData.beneficiation;
      }
      if (workflowData.ironmaking) {
        newStepData.ironmaking = workflowData.ironmaking;
      }
      if (workflowData.steelmaking) {
        newStepData.steelmaking = workflowData.steelmaking;
      }
      if (workflowData.manufacturing) {
        newStepData.manufacturing = workflowData.manufacturing;
      }
      if (workflowData.usePhase) {
        newStepData.usePhase = workflowData.usePhase;
      }
      if (workflowData.recycling) {
        newStepData.recycling = workflowData.recycling;
      }
      if (workflowData.valorization) {
        newStepData.valorization = workflowData.valorization;
      }
      
      setStepData(newStepData);
    }
  }, [workflowData]);

  const handleSaveStep = async (stepKey, data) => {
    console.log(`💾 [WizardForm Steel] Saving step: ${stepKey}`, data);
    
    try {
      let response;
      
      if (stepKey === 'mining') {
        response = await updateMiningStep(workflowId, data);
      }
      if (stepKey === 'beneficiation') {
        response = await updateBeneficiationStep(workflowId, data);
      }
      if (stepKey === 'ironmaking') {
        response = await updateIronmakingStep(workflowId, data);
      }
      if (stepKey === 'steelmaking') {
        response = await updateSteelmakingStep(workflowId, data);
      }
      if (stepKey === 'manufacturing') {
        response = await updateManufacturingStep(workflowId, data);
      }
      if (stepKey === 'usePhase') {
        response = await updateManufacturingStep(workflowId, data); // Note: backend uses same endpoint
      }
      if (stepKey === 'recycling') {
        response = await updateRecyclingStep(workflowId, data);
      }
      if (stepKey === 'valorization') {
        response = await updateValorizationStep(workflowId, data);
      }
      
      if (response?.success && response.data?.workflow) {
        console.log('✅ Step saved successfully:', response.data.workflow);
        onWorkflowUpdate?.(response.data.workflow);
        
        setStepData(prev => ({
          ...prev,
          [stepKey]: data
        }));
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Error saving ${stepKey} step:`, error);
      throw error;
    }
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

  const handleCalculateLCA = async (formData) => {
    setIsCalculatingLca(true);
    try {
      console.log('📊 Calculating LCA for Steel workflow:', workflowId);
      const result = await calculateLCA(workflowId, formData);
      
      if (result.success) {
        setLcaResult(result.data);
        setShowLcaSuccessModal(true);
      }
    } catch (error) {
      console.error('❌ Error calculating LCA:', error);
    } finally {
      setIsCalculatingLca(false);
    }
  };

  const renderStep = () => {
    const stepKey = steps[activeStep]?.key;

    switch (stepKey) {
      case 'mining':
        return (
          <SteelMiningStep
            onNext={handleNext}
            onSave={(data) => handleSaveStep('mining', data)}
            initialValues={stepData.mining}
            onGenerateAIPrediction={(data) => console.log('AI prediction requested', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields}
            predictionMetadata={predictionMetadata}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );

      case 'beneficiation':
        return (
          <SteelBeneficiationStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('beneficiation', data)}
            initialValues={stepData.beneficiation}
            onGenerateAIPrediction={(data) => console.log('AI prediction requested', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields}
            predictionMetadata={predictionMetadata}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            materialSource={materialSource}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );

      case 'ironmaking':
        return (
          <SteelIronmakingStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('ironmaking', data)}
            initialValues={stepData.ironmaking}
            onGenerateAIPrediction={(data) => console.log('AI prediction requested', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields}
            predictionMetadata={predictionMetadata}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );

      case 'steelmaking':
        return (
          <SteelSteelmakingStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('steelmaking', data)}
            initialValues={stepData.steelmaking}
            onGenerateAIPrediction={(data) => console.log('AI prediction requested', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields}
            predictionMetadata={predictionMetadata}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );

      case 'manufacturing':
        return (
          <SteelManufacturingStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('manufacturing', data)}
            initialValues={stepData.manufacturing}
            onGenerateAIPrediction={(data) => console.log('AI prediction requested', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields}
            predictionMetadata={predictionMetadata}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );

      case 'usePhase':
        return (
          <SteelUsePhaseStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('usePhase', data)}
            initialValues={stepData.usePhase}
            onGenerateAIPrediction={(data) => console.log('AI prediction requested', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields}
            predictionMetadata={predictionMetadata}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );

      case 'recycling':
        return (
          <SteelRecyclingStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('recycling', data)}
            initialValues={stepData.recycling}
            onGenerateAIPrediction={(data) => console.log('AI prediction requested', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields}
            predictionMetadata={predictionMetadata}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );

      case 'valorization':
        return (
          <SteelValorizationStep
            onNext={handleNext}
            onBack={handleBack}
            onSave={(data) => handleSaveStep('valorization', data)}
            initialValues={stepData.valorization}
            onGenerateAIPrediction={(data) => console.log('AI prediction requested', data)}
            predicting={predicting}
            pollingProgress={pollingProgress}
            aiPopulatedFields={aiPopulatedFields}
            predictionMetadata={predictionMetadata}
            onCalculateLCA={handleCalculateLCA}
            isCalculatingLca={isCalculatingLca}
            setShowSustainableSolutions={setShowSustainableSolutions}
            setCurrentSustainableStage={setCurrentSustainableStage}
            setFormDataForSustainable={setFormDataForSustainable}
          />
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              The {steps[activeStep]?.title} step is under development.
            </p>
            <div className="flex gap-4">
              {activeStep > 0 && (
                <Button onClick={handleBack} variant="outline">
                  ← Previous Step
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-9xl px-4 py-8 sm:px-6 lg:px-8">
      <AnimatePresence mode="wait">
        <motion.div key={activeStep}>
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* LCA Success Modal */}
      {showLcaSuccessModal && lcaResult && (
        <LCASuccessModal
          isOpen={showLcaSuccessModal}
          onClose={() => setShowLcaSuccessModal(false)}
          lcaData={lcaResult}
        />
      )}

      {/* Sustainable Solutions Modal */}
      {showSustainableSolutions && (
        <SustainableSolutionsModal
          isOpen={showSustainableSolutions}
          onClose={() => setShowSustainableSolutions(false)}
          stage={currentSustainableStage}
          formData={formDataForSustainable}
        />
      )}
    </div>
  );
}
