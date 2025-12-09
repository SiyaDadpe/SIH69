import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

const HEADING_TEXT = "text-[22px] sm:text-[24px]";
const GROUP_TEXT = "text-[16px] sm:text-[18px]";

const stepVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -18 },
};

function CardCheckbox({ id, label, checked, onChange }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            className={`cursor-pointer rounded-xl border p-3 transition-all ${checked ? "bg-[#BA7967] border-[#BA7967] text-white shadow-md" : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-[#BA7967]"
                }`}
        >
            <div className="font-medium text-sm">{label}</div>
        </div>
    )
}

function CardRadio({ id, label, selected, onSelect }) {
    return (
        <div
            onClick={onSelect}
            className={`cursor-pointer rounded-xl border p-3 transition-all ${selected ? "bg-[#BA7967] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
                }`}
        >
            <div className="font-medium text-sm">{label}</div>
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
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#6B5B59] shadow-sm">
                                <span className="inline-flex h-2 w-2 rounded-full bg-[#BA7967] animate-pulse" />
                                {`Step ${stepNumber} • ${badgeLabel}`}
                            </div>
                            <CardTitle className={`${HEADING_TEXT} mt-3 text-gray-900`}>{title}</CardTitle>
                            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
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
                                    {predicting ? "Generating..." : "Generate AI Predictions"}
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-6">{children}</CardContent>
                {footer && (
                    <CardFooter className="relative z-10 flex flex-col gap-4 border-t border-[#e3d4c8] pt-6">
                        {footer}
                    </CardFooter>
                )}
            </Card>
        </motion.div>
    )
}

function StepFooter({ onBack, onForward, disabled }) {
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
            <div className="flex gap-3 ml-auto">
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-green-500 text-green-600 hover:bg-green-50 px-6 py-2 transition-colors duration-200"
                    onClick={() => console.log('Sustainable solutions clicked')}
                >
                    <span className="mr-2">🌱</span>
                    Sustainable solutions
                </Button>
                <Button
                    type="button"
                    className="relative overflow-hidden bg-linear-to-r from-[#ef5350] to-[#ff8a65] text-white shadow-md transition-all duration-200 hover:from-[#e53935] hover:to-[#ff7043]"
                >
                    <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-200 hover:opacity-100" />
                    <span className="relative">Calculate LCA Score</span>
                </Button>
                <Button
                    onClick={onForward}
                    disabled={disabled}
                    className="bg-[#BA7967] hover:bg-[#a86b5c] text-white rounded-full px-6 py-2 shadow-md transition-all duration-200"
                >
                    Next →
                </Button>
            </div>
        </div>
    )
}

// Guided Mode Toggle Component
function GuidedModeToggle({ enabled, onToggle }) {
    return (
        <div className="border-2 border-blue-200 rounded-2xl bg-blue-50/50 p-4 mb-6">
            <div className="flex items-start gap-3">
                <Checkbox
                    id="guided-mode"
                    checked={enabled}
                    onCheckedChange={onToggle}
                    className="mt-1"
                />
                <div className="flex-1">
                    <label
                        htmlFor="guided-mode"
                        className="flex items-center gap-2 text-blue-700 font-semibold text-base cursor-pointer"
                    >
                        🔍 Guided Mode Active
                    </label>
                    <p className="text-sm text-blue-600 mt-1">
                        Smart defaults applied based on industry standards.{" "}
                        <span className="text-blue-700 font-medium">Review and customize as needed.</span>
                    </p>
                </div>
                <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            </div>
        </div>
    );
}

// Advanced Options Collapsible Section
function AdvancedOptionsSection({ title = "Advanced Options", children, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-[#e3d4c8] rounded-xl overflow-hidden bg-linear-to-br from-[#fbfaf7] to-[#f8f6f1] shadow-sm">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-5 py-1 hover:bg-white/30 transition-all duration-200"
            >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm">
                    🔧
                </span>
                <span className="font-semibold text-gray-800 text-[15px]">{title}</span>
                <div className="ml-auto">
                    {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 py-6 bg-white/40">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const requiredNumber = (min = 0) => z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(min, 'Required')
);

export default function WizardFormPb({ steps, activeStep, onStepChange, onMaterialSourceChange, workflowId, navigate }) {
    const [materialSource, setMaterialSource] = useState('primary')
    const [primaryPct, setPrimaryPct] = useState(100)
    const [secondaryPct, setSecondaryPct] = useState(0)

    useEffect(() => {
        onMaterialSourceChange?.({ materialSource, primaryPercentage: primaryPct, secondaryPercentage: secondaryPct });
    }, [materialSource, primaryPct, secondaryPct]);

    const currentStep = steps[activeStep]
    const stepKey = currentStep?.key

    const handleNext = () => activeStep < steps.length - 1 && onStepChange(activeStep + 1)
    const handleBack = () => activeStep > 0 && onStepChange(activeStep - 1)

    const renderStep = () => {
        if (materialSource === 'secondary' && ['mining', 'beneficiation', 'smelting', 'refining'].includes(stepKey)) {
            return (
                <div className="p-8 text-center">
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 max-w-2xl mx-auto">
                        <div className="text-6xl mb-4">♻️</div>
                        <h3 className="text-xl font-semibold mb-2">Stage Not Applicable</h3>
                        <p className="text-gray-600">100% Secondary Lead skips Mining, Beneficiation, Smelting, and Refining.</p>
                    </div>
                </div>
            );
        }

        const steps = {
            mining: <MiningStep onNext={handleNext} />,
            beneficiation: <BeneficiationStep onNext={handleNext} onBack={handleBack} />,
            smelting: <SmeltingStep onNext={handleNext} onBack={handleBack} />,
            refining: <RefiningStep onNext={handleNext} onBack={handleBack} />,
            manufacturing: <ManufacturingStep onNext={handleNext} onBack={handleBack} />,
            usePhase: <UsePhaseStep onNext={handleNext} onBack={handleBack} />,
            recycling: <RecyclingStep onNext={handleNext} onBack={handleBack} />,
            valorization: <ValorizationStep onNext={handleNext} onBack={handleBack} />,
        }
        return steps[stepKey] || <div>Step not found</div>
    }

    return (
        <>
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
            <div className="mx-auto w-full max-w-none md:max-w-[calc(100vw-28rem)] space-y-4 sm:space-y-6">
                {/* Material Source Selection */}
                <div className="mb-6 p-6 rounded-3xl border border-[#e7dfd2] bg-linear-to-br from-[#fbfaf7] via-[#f4f2ec] to-[#efe6dd] shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-5">Primary Material Source</h3>
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
                                    setPrimaryPct(100);
                                    setSecondaryPct(0);
                                }}
                                className="w-5 h-5 text-[#BA7967] focus:ring-2 focus:ring-[#BA7967]"
                            />
                            <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                                100% Primary Lead (from galena ore)
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
                                    setPrimaryPct(0);
                                    setSecondaryPct(100);
                                }}
                                className="w-5 h-5 text-[#BA7967] focus:ring-2 focus:ring-[#BA7967]"
                            />
                            <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                                100% Secondary/Recycled Lead
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
                                        setPrimaryPct(50);
                                        setSecondaryPct(50);
                                    }}
                                    className="w-5 h-5 text-[#BA7967] focus:ring-2 focus:ring-[#BA7967]"
                                />
                                <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                                    Mixed Primary/Secondary →
                                </span>
                            </label>
                            {materialSource === 'mixed' && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={primaryPct}
                                        onChange={(e) => {
                                            const v = Math.min(100, Math.max(0, +e.target.value || 0));
                                            setPrimaryPct(v);
                                            setSecondaryPct(100 - v);
                                        }}
                                        className="w-16 px-2 py-1 border rounded"
                                    />
                                    <span className="text-sm">% Primary |</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={secondaryPct}
                                        onChange={(e) => {
                                            const v = Math.min(100, Math.max(0, +e.target.value || 0));
                                            setSecondaryPct(v);
                                            setPrimaryPct(100 - v);
                                        }}
                                        className="w-16 px-2 py-1 border rounded"
                                    />
                                    <span className="text-sm">% Secondary</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Wizard Home Button */}
                {workflowId && (
                    <div className="flex justify-end mb-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (confirm('Return to wizard home page? Your current progress is saved and you can resume from Recent Projects.')) {
                                    localStorage.removeItem('currentWizardWorkflowIdLead');
                                    navigate('/wizard-lead', { replace: true });
                                    window.location.reload();
                                }
                            }}
                            className="border-[#BA7967] text-[#BA7967] hover:bg-[#BA7967] hover:text-white px-6 py-3"
                        >
                            🏠 Wizard Home
                        </Button>
                    </div>
                )}

                {renderStep()}
            </div>
        </>
    )
}

// Step Components
function MiningStep({ onNext }) {
    const [guidedMode, setGuidedMode] = useState(true);

    const schema = z.object({
        // Mandatory fields
        miningMethod: z.array(z.string()).min(1, "Select at least one method"),
        oreType: z.string().min(1, "Required"),
        oreGrade: requiredNumber(0),
        overburdenRatio: requiredNumber(0),
        haulDistance: requiredNumber(0),
        equipmentType: z.string().min(1, "Required"),
        fuelConsumption: requiredNumber(0),
        electricityConsumption: requiredNumber(0),
        waterConsumption: requiredNumber(0),
        waterSource: z.string().min(1, "Required"),

        // Additional/Advanced fields
        location: z.string().optional(),
        dustEmissions: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        landDisturbed: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        explosivesKg: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        leadDustRisk: z.string().optional(),

        // Sustainability Toggle and Parameters
        sustainabilityFocused: z.boolean().optional(),
        equipmentTypeElectricHybrid: z.boolean().optional(),
        waterSourceRecycledSurface: z.boolean().optional(),
        waterUsageCapped: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        rehabilitationPlan: z.boolean().optional(),
        overburdenRestored: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        renewableEnergyPercent: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        biodiversityOffsetArea: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        waterRecyclingRate: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        rehabilitationProgress: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        communityDevelopmentInvestment: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        carbonOffsetTonnes: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
    })

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            miningMethod: guidedMode ? ['Underground (cut & fill)'] : [],
            oreType: guidedMode ? 'Galena (PbS)' : '',
            oreGrade: guidedMode ? 5 : 0,
            overburdenRatio: guidedMode ? 2.5 : 0,
            haulDistance: guidedMode ? 5 : 0,
            equipmentType: guidedMode ? 'Diesel' : '',
            fuelConsumption: guidedMode ? 2.5 : 0,
            electricityConsumption: guidedMode ? 15 : 0,
            waterConsumption: guidedMode ? 0.5 : 0,
            waterSource: guidedMode ? 'Ground' : '',
            sustainabilityFocused: false,
            rehabilitationPlan: false,
            equipmentTypeElectricHybrid: false,
            waterSourceRecycledSurface: false
        }
    })
    const { control, handleSubmit, formState: { isValid }, watch, setValue } = form

    // Apply guided mode defaults when toggled
    useEffect(() => {
        if (guidedMode) {
            setValue('miningMethod', ['Underground (cut & fill)']);
            setValue('oreType', 'Galena (PbS)');
            setValue('oreGrade', 5);
            setValue('overburdenRatio', 2.5);
            setValue('haulDistance', 5);
            setValue('equipmentType', 'Diesel');
            setValue('fuelConsumption', 2.5);
            setValue('electricityConsumption', 15);
            setValue('waterConsumption', 0.5);
            setValue('waterSource', 'Ground');
        }
    }, [guidedMode, setValue]);

    return (
        <FormProvider {...form}>
            <StepSection
                stepNumber={1}
                badgeLabel="MINING"
                title="Mining & Ore Extraction (Galena – PbS)"
                description="Enter core parameters for mining process. Fields marked with * are required."
                onPredict={() => console.log('AI Predictions for Mining')}
                predicting={false}
                footer={<StepFooter onForward={handleSubmit(onNext)} disabled={!isValid} />}
            >
                <form className="space-y-8">
                    {/* Guided Mode Toggle */}
                    <GuidedModeToggle enabled={guidedMode} onToggle={setGuidedMode} />

                    {/* MANDATORY CORE PARAMETERS */}
                    <div className="space-y-6">
                        <FormField control={control} name="miningMethod" render={() => (
                            <FormItem>
                                <div className="mb-4">
                                    <FormLabel className={GROUP_TEXT}>Mining Method*</FormLabel>
                                    <FormDescription>
                                        Select all applicable mining methods for lead ore extraction.
                                    </FormDescription>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {['Underground (cut & fill)', 'Underground (room & pillar)', 'Underground (long-wall)', 'Open-Pit', 'Shrinkage Stoping', 'Sublevel Stoping', 'Block Caving'].map((m) => (
                                        <FormField key={m} control={control} name="miningMethod" render={({ field }) => (
                                            <CardCheckbox id={m} label={m} checked={field.value?.includes(m)}
                                                onChange={(c) => { const s = new Set(field.value); c ? s.add(m) : s.delete(m); field.onChange([...s]); }} />
                                        )} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={control} name="oreType" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={GROUP_TEXT}>Ore Type*</FormLabel>
                                <FormDescription>Primary lead-bearing mineral in the ore deposit.</FormDescription>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                    {['Galena (PbS)', 'Cerussite (PbCO₃)', 'Anglesite (PbSO₄)', 'Mixed Sulfide-Oxide'].map((o) => (
                                        <CardRadio key={o} id={o} label={o} selected={field.value === o} onSelect={() => field.onChange(o)} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField control={control} name="oreGrade" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Ore Grade (%Pb)*</FormLabel>
                                    <FormDescription>Lead content percentage in the ore.</FormDescription>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <Slider value={[field.value || 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={0.1} />
                                            <div className="text-sm text-muted-foreground">{(field.value || 0).toFixed(1)}%</div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="overburdenRatio" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Overburden Ratio*</FormLabel>
                                    <FormDescription>Ratio of waste rock to ore extracted.</FormDescription>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} placeholder="e.g., 2.5" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField control={control} name="haulDistance" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Haul Distance (km)*</FormLabel>
                                    <FormDescription>Distance to processing facility.</FormDescription>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} placeholder="e.g., 5.0" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="equipmentType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Equipment Type*</FormLabel>
                                    <FormDescription>Primary equipment energy source.</FormDescription>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        {['Diesel', 'Electric', 'Hybrid'].map((type) => (
                                            <CardRadio key={type} id={type} label={type} selected={field.value === type} onSelect={() => field.onChange(type)} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField control={control} name="fuelConsumption" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Fuel Consumption (L/t ore)*</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} placeholder="e.g., 2.5" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="electricityConsumption" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Electricity (kWh/t ore)*</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} placeholder="e.g., 15.0" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField control={control} name="waterConsumption" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Water Consumption (m³/t ore)*</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} placeholder="e.g., 0.5" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="waterSource" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Water Source*</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select water source" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Ground">Ground</SelectItem>
                                            <SelectItem value="Surface">Surface</SelectItem>
                                            <SelectItem value="Recycled">Recycled</SelectItem>
                                            <SelectItem value="Mixed">Mixed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    <hr className="my-8 border-gray-200" />

                    {/* ADVANCED OPTIONS */}
                    <AdvancedOptionsSection defaultOpen={false}>
                        <div className="space-y-6">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Additional Inputs</h4>

                            <FormField control={control} name="location" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mine Location</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select location" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="rajasthan">Rajasthan</SelectItem>
                                            <SelectItem value="andhra_pradesh">Andhra Pradesh</SelectItem>
                                            <SelectItem value="gujarat">Gujarat</SelectItem>
                                            <SelectItem value="meghalaya">Meghalaya</SelectItem>
                                            <SelectItem value="odisha">Odisha</SelectItem>
                                            
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="dustEmissions" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dust Emissions PM10 (kg/t)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} placeholder="e.g., 0.5" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="landDisturbed" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Land Disturbed (m²/t)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 10" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="explosivesKg" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Explosives (kg ANFO/t)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} placeholder="e.g., 0.8" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="leadDustRisk" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lead-in-Dust Risk Level</FormLabel>
                                        <div className="grid grid-cols-3 gap-3 mt-2">
                                            {['Low', 'Medium', 'High'].map((level) => (
                                                <CardRadio key={level} id={level} label={level} selected={field.value === level}
                                                    onSelect={() => field.onChange(level)} />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <hr className="my-6 border-gray-200" />

                            {/* Sustainability Toggle and Parameters */}
                            <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                                <FormField control={control} name="sustainabilityFocused" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
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
                                )} />
                            </div>

                            {watch("sustainabilityFocused") === true && (
                                <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Sustainability Parameters</h4>

                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="equipmentTypeElectricHybrid" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Equipment Type: Electric or Hybrid</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="waterSourceRecycledSurface" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Water Source: Recycled or Surface</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="waterUsageCapped" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Water Usage Capped (m³/t ore, max 0.25)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" max="0.25" {...field} placeholder="≤0.25" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="rehabilitationPlan" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Rehabilitation Plan in Place</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="overburdenRestored" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Overburden Restored (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" max="100" {...field} placeholder="60-100" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="renewableEnergyPercent" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Renewable Energy (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="biodiversityOffsetArea" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Biodiversity Offset Area (hectares)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" {...field} placeholder="Hectares" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="waterRecyclingRate" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Water Recycling Rate (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="rehabilitationProgress" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Rehabilitation Progress (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="communityDevelopmentInvestment" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Community Development Investment ($)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" {...field} placeholder="e.g., 50000" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={control} name="carbonOffsetTonnes" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Carbon Offset (tonnes)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="0" {...field} placeholder="e.g., 5" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </AdvancedOptionsSection>
                </form>
            </StepSection>
        </FormProvider>
    )
}

function BeneficiationStep({ onNext, onBack }) {
    const schema = z.object({
        // Mandatory
        flotationMethod: z.string().min(1, "Required"),
        concentrateGrade: requiredNumber(0),
        recoveryRate: requiredNumber(0),

        // Advanced
        crushingStages: z.string().optional(),
        grindingFineness: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        flotationReagents: z.array(z.string()).optional(),
        tailingsDisposal: z.string().optional(),
        waterRecycling: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        energyConsumption: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Sustainability
        sustainabilityFocused: z.boolean().optional(),
        tailingsDryStacking: z.boolean().optional(),
        waterRecyclingHigh: z.boolean().optional(),
        reagentOptimization: z.boolean().optional(),
        energyEfficiency: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        tailingsReprocessing: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        dustSuppression: z.boolean().optional(),
    })

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            concentrateGrade: 60,
            recoveryRate: 85,
            flotationReagents: [],
            sustainabilityFocused: false,
            tailingsDryStacking: false,
            waterRecyclingHigh: false,
            reagentOptimization: false,
            dustSuppression: false
        }
    })
    const { control, handleSubmit, formState: { isValid }, watch } = form

    return (
        <FormProvider {...form}>
            <StepSection
                stepNumber={2}
                badgeLabel="BENEFICIATION"
                title="Beneficiation (Froth Flotation)"
                description="Process and concentrate lead ore through flotation methods. Fields marked with * are required."
                onPredict={() => console.log('AI Predictions for Beneficiation')}
                predicting={false}
                footer={<StepFooter onBack={onBack} onForward={handleSubmit(onNext)} disabled={!isValid} />}
            >
                <form className="space-y-8">
                    {/* MANDATORY FIELDS */}
                    <div className="space-y-6">
                        <FormField control={control} name="flotationMethod" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={GROUP_TEXT}>Flotation Method*</FormLabel>
                                <FormDescription>Primary beneficiation process used.</FormDescription>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                    {['Bulk Flotation', 'Selective Flotation', 'Differential Flotation', 'Reverse Flotation', 'Column Flotation', 'Flash Flotation'].map((m) => (
                                        <CardRadio key={m} id={m} label={m} selected={field.value === m} onSelect={() => field.onChange(m)} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField control={control} name="concentrateGrade" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Lead Concentrate Grade (%Pb)*</FormLabel>
                                    <FormDescription>Lead content in final concentrate.</FormDescription>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <Slider value={[field.value || 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={0.5} />
                                            <div className="text-sm text-muted-foreground">{(field.value || 0).toFixed(1)}%</div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="recoveryRate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Recovery Rate (%)*</FormLabel>
                                    <FormDescription>Percentage of lead recovered from ore.</FormDescription>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <Slider value={[field.value || 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={0.5} />
                                            <div className="text-sm text-muted-foreground">{(field.value || 0).toFixed(1)}%</div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    <hr className="my-8 border-gray-200" />

                    {/* ADVANCED OPTIONS */}
                    <AdvancedOptionsSection defaultOpen={false}>
                        <div className="space-y-6">
                            <FormField control={control} name="crushingStages" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Crushing Stages</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select crushing configuration" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Single Stage">Single Stage</SelectItem>
                                            <SelectItem value="Two Stage">Two Stage (Primary + Secondary)</SelectItem>
                                            <SelectItem value="Three Stage">Three Stage (Primary + Secondary + Tertiary)</SelectItem>
                                            <SelectItem value="Four Stage">Four Stage (with Fine Crushing)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="grindingFineness" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Grinding Fineness (% passing 75μm)</FormLabel>
                                    <FormDescription>Particle size distribution target.</FormDescription>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} placeholder="e.g., 80" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="flotationReagents" render={() => (
                                <FormItem>
                                    <FormLabel>Flotation Reagents Used</FormLabel>
                                    <FormDescription>Chemical agents used in flotation process.</FormDescription>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        {['Xanthates (Collectors)', 'Pine Oil (Frother)', 'Lime (pH Modifier)', 'Sodium Sulfide (Activator)', 'Cyanide (Depressant)', 'Zinc Sulfate'].map((reagent) => (
                                            <FormField key={reagent} control={control} name="flotationReagents" render={({ field }) => (
                                                <CardCheckbox id={reagent} label={reagent} checked={field.value?.includes(reagent)}
                                                    onChange={(c) => { const s = new Set(field.value || []); c ? s.add(reagent) : s.delete(reagent); field.onChange([...s]); }} />
                                            )} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="tailingsDisposal" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tailings Disposal Method</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select disposal method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Tailings Dam">Tailings Dam</SelectItem>
                                            <SelectItem value="Dry Stacking">Dry Stacking</SelectItem>
                                            <SelectItem value="Paste Tailings">Paste Tailings</SelectItem>
                                            <SelectItem value="Underground Backfill">Underground Backfill</SelectItem>
                                            <SelectItem value="Co-disposal">Co-disposal with Waste Rock</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="waterRecycling" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Water Recycling Rate (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 75" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="energyConsumption" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Energy Consumption (kWh/tonne concentrate)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 45" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <hr className="my-6 border-gray-200" />

                            {/* Sustainability Toggle and Parameters */}
                            <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                                <FormField control={control} name="sustainabilityFocused" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
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
                                )} />
                            </div>

                            {watch("sustainabilityFocused") === true && (
                                <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Sustainability Parameters</h4>

                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="tailingsDryStacking" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Dry Stacking Tailings Management</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="waterRecyclingHigh" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Water Recycling ≥ 75%</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="reagentOptimization" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Reagent Optimization Program</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="dustSuppression" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Dust Suppression Systems</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="energyEfficiency" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Energy Efficiency Improvement (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" {...field} placeholder="e.g., 20" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="tailingsReprocessing" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tailings Reprocessing Rate (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AdvancedOptionsSection>
                </form>
            </StepSection>
        </FormProvider>
    )
}

function SmeltingStep({ onNext, onBack }) {
    const schema = z.object({
        // Mandatory
        smeltingRoute: z.string().min(1, "Required"),

        // Route 3A: Sintering + Blast Furnace
        sinteringFeedRate: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        blastFurnaceTemp: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        cokeConsumption: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Route 3B: Kivcet Furnace
        kivcetFeedRate: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        oxygenEnrichment: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Route 3C: QSL Furnace
        qslFeedRate: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        oxygenFlow: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Route 3D: ISA/Ausmelt
        isaFeedRate: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        lanceImmersion: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Common fields
        leadProduction: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        energyConsumption: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Advanced
        operatingTemperature: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        fuelType: z.string().optional(),
        fluxAgents: z.array(z.string()).optional(),
        slagGeneration: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        so2Capture: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Sustainability
        sustainabilityFocused: z.boolean().optional(),
        sulfuricAcidProduction: z.boolean().optional(),
        so2CaptureHigh: z.boolean().optional(),
        energyRecovery: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        wasteHeatUtilization: z.boolean().optional(),
        slagRecycling: z.boolean().optional(),
        emissionReduction: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
    })

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            smeltingRoute: '',
            fluxAgents: [],
            sulfuricAcidProduction: false,
            sustainabilityFocused: false,
            so2CaptureHigh: false,
            wasteHeatUtilization: false,
            slagRecycling: false
        }
    })
    const { control, handleSubmit, formState: { isValid }, watch } = form
    const selectedRoute = watch('smeltingRoute')

    return (
        <FormProvider {...form}>
            <StepSection
                stepNumber={3}
                badgeLabel="SMELTING"
                title="Smelting & Primary Extraction"
                description="Extract lead from concentrate through pyrometallurgical processes. Fields marked with * are required."
                onPredict={() => console.log('AI Predictions for Smelting')}
                predicting={false}
                footer={<StepFooter onBack={onBack} onForward={handleSubmit(onNext)} disabled={!isValid} />}
            >
                <form className="space-y-8">
                    {/* SMELTING ROUTE SELECTION */}
                    <div className="space-y-6">
                        <FormField control={control} name="smeltingRoute" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={GROUP_TEXT}>Smelting Route*</FormLabel>
                                <FormDescription>Select the primary smelting process route.</FormDescription>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                    {[
                                        { id: '3A', label: 'Route 3A: Sintering + Blast Furnace' },
                                        { id: '3B', label: 'Route 3B: Kivcet Furnace' },
                                        { id: '3C', label: 'Route 3C: QSL Furnace' },
                                        { id: '3D', label: 'Route 3D: ISA/Ausmelt' }
                                    ].map((route) => (
                                        <CardRadio key={route.id} id={route.id} label={route.label}
                                            selected={field.value === route.id} onSelect={() => field.onChange(route.id)} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    {/* ROUTE-SPECIFIC PARAMETERS */}
                    {selectedRoute === '3A' && (
                        <div className="space-y-6 p-6 border border-[#e3d4c8] rounded-xl bg-white/50">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Route 3A: Sintering + Blast Furnace Parameters</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="sinteringFeedRate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sintering Feed Rate (t/h)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="blastFurnaceTemp" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Blast Furnace Temperature (°C)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} placeholder="e.g., 1200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="cokeConsumption" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coke Consumption (kg/t Pb)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 150" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="leadProduction" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lead Production (t/day)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 1000" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    )}

                    {selectedRoute === '3B' && (
                        <div className="space-y-6 p-6 border border-[#e3d4c8] rounded-xl bg-white/50">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Route 3B: Kivcet Furnace Parameters</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="kivcetFeedRate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Feed Rate (t/h)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 40" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="oxygenEnrichment" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Oxygen Enrichment (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 30" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="energyConsumption" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Energy Consumption (GJ/t Pb)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 8" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="leadProduction" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lead Production (t/day)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 900" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    )}

                    {selectedRoute === '3C' && (
                        <div className="space-y-6 p-6 border border-[#e3d4c8] rounded-xl bg-white/50">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Route 3C: QSL Furnace Parameters</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="qslFeedRate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Feed Rate (t/h)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 45" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="oxygenFlow" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Oxygen Flow Rate (Nm³/h)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 5000" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="operatingTemperature" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operating Temperature (°C)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} placeholder="e.g., 1250" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="leadProduction" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lead Production (t/day)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 1100" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    )}

                    {selectedRoute === '3D' && (
                        <div className="space-y-6 p-6 border border-[#e3d4c8] rounded-xl bg-white/50">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Route 3D: ISA/Ausmelt Parameters</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="isaFeedRate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Feed Rate (t/h)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 35" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="lanceImmersion" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lance Immersion Depth (m)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 1.5" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="energyConsumption" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Energy Consumption (GJ/t Pb)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 7.5" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="leadProduction" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lead Production (t/day)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 850" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    )}

                    {!selectedRoute && (
                        <div className="text-center p-8 text-gray-500">
                            <p>Please select a smelting route to continue</p>
                        </div>
                    )}

                    {selectedRoute && (
                        <>
                            <hr className="my-8 border-gray-200" />

                            {/* ADVANCED OPTIONS */}
                            <AdvancedOptionsSection defaultOpen={false}>
                                <div className="space-y-6">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Additional Inputs</h4>

                                    <FormField control={control} name="fuelType" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fuel Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select fuel" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Coke">Coke</SelectItem>
                                                    <SelectItem value="Coal">Coal</SelectItem>
                                                    <SelectItem value="Natural Gas">Natural Gas</SelectItem>
                                                    <SelectItem value="Heavy Fuel Oil">Heavy Fuel Oil</SelectItem>
                                                    <SelectItem value="Electricity">Electricity</SelectItem>
                                                    <SelectItem value="Mixed">Mixed Fuels</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={control} name="fluxAgents" render={() => (
                                        <FormItem>
                                            <FormLabel>Flux Agents Used</FormLabel>
                                            <FormDescription>Additives used to facilitate slag formation.</FormDescription>
                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                {['Limestone (CaCO₃)', 'Silica (SiO₂)', 'Iron Ore', 'Fluorspar (CaF₂)', 'Borax', 'Soda Ash'].map((flux) => (
                                                    <FormField key={flux} control={control} name="fluxAgents" render={({ field }) => (
                                                        <CardCheckbox id={flux} label={flux} checked={field.value?.includes(flux)}
                                                            onChange={(c) => { const s = new Set(field.value || []); c ? s.add(flux) : s.delete(flux); field.onChange([...s]); }} />
                                                    )} />
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={control} name="slagGeneration" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Slag Generation (t/t Pb)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.1" {...field} placeholder="e.g., 1.5" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={control} name="so2Capture" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>SO₂ Capture Efficiency (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.1" {...field} placeholder="e.g., 95" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <hr className="my-6 border-gray-200" />

                                    {/* Sustainability Toggle and Parameters */}
                                    <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                                        <FormField control={control} name="sustainabilityFocused" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
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
                                        )} />
                                    </div>

                                    {watch("sustainabilityFocused") === true && (
                                        <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                                            <h4 className="text-base font-semibold text-gray-900 mb-4">Sustainability Parameters</h4>

                                            <div className="space-y-6">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <FormField control={control} name="sulfuricAcidProduction" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Sulfuric Acid Production from SO₂</FormLabel>
                                                        </FormItem>
                                                    )} />

                                                    <FormField control={control} name="so2CaptureHigh" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">SO₂ Capture Efficiency ≥ 95%</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <FormField control={control} name="wasteHeatUtilization" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Waste Heat Utilization</FormLabel>
                                                        </FormItem>
                                                    )} />

                                                    <FormField control={control} name="slagRecycling" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Slag Recycling/Utilization</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <FormField control={control} name="energyRecovery" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Energy Recovery (%)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />

                                                    <FormField control={control} name="emissionReduction" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Emission Reduction vs Baseline (%)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" {...field} placeholder="e.g., 20" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AdvancedOptionsSection>
                        </>
                    )}
                </form>
            </StepSection>
        </FormProvider>
    )
}

function RefiningStep({ onNext, onBack }) {
    const schema = z.object({
        // Mandatory
        refiningRoute: z.string().min(1, "Required"),

        // Route 4A: Electrolytic Refining (Betts Process)
        electrolysisVoltage: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        currentDensity: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        electrolyteComposition: z.string().optional(),

        // Route 4B: Pyrometallurgical Refining
        pyroTemp: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        oxidationAgent: z.string().optional(),

        // Route 4C: Combined Refining
        pyroStages: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        electroStages: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Common
        targetPurity: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        yield: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Advanced
        impuritiesRemoved: z.array(z.string()).optional(),
        energyConsumption: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Sustainability
        sustainabilityFocused: z.boolean().optional(),
        purityHigh: z.boolean().optional(),
        yieldHigh: z.boolean().optional(),
        energyEfficient: z.boolean().optional(),
        impurityRecovery: z.boolean().optional(),
        waterRecycling: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        wasteMinimization: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
    })

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            refiningRoute: '',
            impuritiesRemoved: [],
            sustainabilityFocused: false,
            purityHigh: false,
            yieldHigh: false,
            energyEfficient: false,
            impurityRecovery: false
        }
    })
    const { control, handleSubmit, formState: { isValid }, watch } = form
    const selectedRoute = watch('refiningRoute')

    return (
        <FormProvider {...form}>
            <StepSection
                stepNumber={4}
                badgeLabel="REFINING"
                title="Lead Refining"
                description="Purify lead to the desired quality. Fields marked with * are required."
                onPredict={() => console.log('AI Predictions for Refining')}
                predicting={false}
                footer={<StepFooter onBack={onBack} onForward={handleSubmit(onNext)} disabled={!isValid} />}
            >
                <form className="space-y-8">
                    {/* REFINING ROUTE SELECTION */}
                    <div className="space-y-6">
                        <FormField control={control} name="refiningRoute" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={GROUP_TEXT}>Refining Route*</FormLabel>
                                <FormDescription>Select the primary refining process route.</FormDescription>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                    {[
                                        { id: '4A', label: 'Route 4A: Electrolytic Refining (Betts Process)' },
                                        { id: '4B', label: 'Route 4B: Pyrometallurgical Refining' },
                                        { id: '4C', label: 'Route 4C: Combined Pyro + Electrolytic' }
                                    ].map((route) => (
                                        <CardRadio key={route.id} id={route.id} label={route.label}
                                            selected={field.value === route.id} onSelect={() => field.onChange(route.id)} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    {/* ROUTE-SPECIFIC PARAMETERS */}
                    {selectedRoute === '4A' && (
                        <div className="space-y-6 p-6 border border-[#e3d4c8] rounded-xl bg-white/50">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Route 4A: Electrolytic Refining (Betts Process)</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="electrolysisVoltage" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Electrolysis Voltage (V)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} placeholder="e.g., 0.5" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="currentDensity" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Density (A/m²)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 150" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="electrolyteComposition" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Electrolyte Composition</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select electrolyte" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Fluosilicic Acid + Gelatin">Fluosilicic Acid + Gelatin</SelectItem>
                                                <SelectItem value="Fluoboric Acid">Fluoboric Acid</SelectItem>
                                                <SelectItem value="Sulfamic Acid">Sulfamic Acid</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="targetPurity" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Purity (%Pb)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" min="90" max="100" {...field} placeholder="e.g., 99.99" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    )}

                    {selectedRoute === '4B' && (
                        <div className="space-y-6 p-6 border border-[#e3d4c8] rounded-xl bg-white/50">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Route 4B: Pyrometallurgical Refining</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="pyroTemp" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Process Temperature (°C)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} placeholder="e.g., 650" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="oxidationAgent" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Oxidation Agent</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select agent" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Air">Air</SelectItem>
                                                <SelectItem value="Oxygen">Oxygen</SelectItem>
                                                <SelectItem value="Sodium Nitrate">Sodium Nitrate</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="targetPurity" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Purity (%Pb)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" min="90" max="100" {...field} placeholder="e.g., 99.9" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="yield" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Refining Yield (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 98" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    )}

                    {selectedRoute === '4C' && (
                        <div className="space-y-6 p-6 border border-[#e3d4c8] rounded-xl bg-white/50">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Route 4C: Combined Pyro + Electrolytic Refining</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="pyroStages" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pyrometallurgical Stages</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} placeholder="e.g., 2" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="electroStages" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Electrolytic Stages</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} placeholder="e.g., 1" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="targetPurity" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Purity (%Pb)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" min="90" max="100" {...field} placeholder="e.g., 99.995" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="energyConsumption" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Energy (kWh/t Pb)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 300" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    )}

                    {!selectedRoute && (
                        <div className="text-center p-8 text-gray-500">
                            <p>Please select a refining route to continue</p>
                        </div>
                    )}

                    {selectedRoute && (
                        <>
                            <hr className="my-8 border-gray-200" />

                            {/* ADVANCED OPTIONS */}
                            <AdvancedOptionsSection defaultOpen={false}>
                                <div className="space-y-6">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Additional Inputs</h4>

                                    <FormField control={control} name="impuritiesRemoved" render={() => (
                                        <FormItem>
                                            <FormLabel>Impurities Removed</FormLabel>
                                            <FormDescription>Select major impurities removed during refining.</FormDescription>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                                {['Copper (Cu)', 'Silver (Ag)', 'Gold (Au)', 'Antimony (Sb)', 'Arsenic (As)', 'Bismuth (Bi)', 'Tin (Sn)', 'Zinc (Zn)', 'Iron (Fe)'].map((imp) => (
                                                    <FormField key={imp} control={control} name="impuritiesRemoved" render={({ field }) => (
                                                        <CardCheckbox id={imp} label={imp} checked={field.value?.includes(imp)}
                                                            onChange={(c) => { const s = new Set(field.value || []); c ? s.add(imp) : s.delete(imp); field.onChange([...s]); }} />
                                                    )} />
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <hr className="my-6 border-gray-200" />

                                    {/* Sustainability Toggle and Parameters */}
                                    <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                                        <FormField control={control} name="sustainabilityFocused" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
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
                                        )} />
                                    </div>

                                    {watch("sustainabilityFocused") === true && (
                                        <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                                            <h4 className="text-base font-semibold text-gray-900 mb-4">Sustainability Parameters</h4>

                                            <div className="space-y-6">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <FormField control={control} name="purityHigh" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Purity ≥ 99.97% (High Grade)</FormLabel>
                                                        </FormItem>
                                                    )} />

                                                    <FormField control={control} name="yieldHigh" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Yield ≥ 98%</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <FormField control={control} name="energyEfficient" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Energy Efficient Process</FormLabel>
                                                        </FormItem>
                                                    )} />

                                                    <FormField control={control} name="impurityRecovery" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Impurity Recovery (Ag, Au, Cu)</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <FormField control={control} name="waterRecycling" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Water Recycling Rate (%)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />

                                                    <FormField control={control} name="wasteMinimization" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Waste Minimization (%)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" {...field} placeholder="e.g., 80" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AdvancedOptionsSection>
                        </>
                    )}
                </form>
            </StepSection>
        </FormProvider>
    )
}

function ManufacturingStep({ onNext, onBack }) {
    const schema = z.object({
        // Mandatory
        manufacturingRoute: z.string().min(1, "Required"),

        // Route 5A: Battery Manufacturing
        batteryType: z.string().optional(),
        gridCastingMethod: z.string().optional(),
        activeMaterialPaste: z.boolean().optional(),

        // Route 5B: Sheet/Pipe Products
        rollingProcess: z.string().optional(),
        thickness: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        surfaceTreatment: z.string().optional(),

        // Route 5C: Alloys & Specialized Products
        alloyType: z.string().optional(),
        alloyElements: z.array(z.string()).optional(),
        specialApplication: z.string().optional(),

        // Common
        productionRate: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        energyIntensity: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Advanced
        qualityStandard: z.string().optional(),
        scrapRate: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),

        // Sustainability
        sustainabilityFocused: z.boolean().optional(),
        scrapRecycling: z.boolean().optional(),
        energyEfficiency: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        wasteReduction: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        renewableEnergy: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        waterRecycling: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        emissionControl: z.boolean().optional(),
    })

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            manufacturingRoute: '',
            alloyElements: [],
            activeMaterialPaste: false,
            sustainabilityFocused: false,
            scrapRecycling: false,
            emissionControl: false
        }
    })
    const { control, handleSubmit, formState: { isValid }, watch } = form
    const selectedRoute = watch('manufacturingRoute')

    return (
        <FormProvider {...form}>
            <StepSection
                stepNumber={5}
                badgeLabel="MANUFACTURING"
                title="Product Manufacturing"
                description="Transform refined lead into finished products. Fields marked with * are required."
                onPredict={() => console.log('AI Predictions for Manufacturing')}
                predicting={false}
                footer={<StepFooter onBack={onBack} onForward={handleSubmit(onNext)} disabled={!isValid} />}
            >
                <form className="space-y-8">
                    {/* MANUFACTURING ROUTE SELECTION */}
                    <div className="space-y-6">
                        <FormField control={control} name="manufacturingRoute" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={GROUP_TEXT}>Manufacturing Route*</FormLabel>
                                <FormDescription>Select the primary product manufacturing route.</FormDescription>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                    {[
                                        { id: '5A', label: 'Route 5A: Battery Manufacturing' },
                                        { id: '5B', label: 'Route 5B: Sheet/Pipe/Foil Products' },
                                        { id: '5C', label: 'Route 5C: Alloys & Specialized Products' }
                                    ].map((route) => (
                                        <CardRadio key={route.id} id={route.id} label={route.label}
                                            selected={field.value === route.id} onSelect={() => field.onChange(route.id)} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    {/* ROUTE-SPECIFIC PARAMETERS */}
                    {selectedRoute === '5A' && (
                        <div className="space-y-6 p-6 border border-[#e3d4c8] rounded-xl bg-white/50">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Route 5A: Battery Manufacturing</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="batteryType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Battery Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select battery type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="SLI (Automotive)">SLI (Automotive)</SelectItem>
                                                <SelectItem value="Industrial (UPS)">Industrial (UPS)</SelectItem>
                                                <SelectItem value="Traction (Forklift)">Traction (Forklift)</SelectItem>
                                                <SelectItem value="Stationary (Telecom)">Stationary (Telecom)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="gridCastingMethod" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Grid Casting Method</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Gravity Casting">Gravity Casting</SelectItem>
                                                <SelectItem value="Continuous Casting">Continuous Casting</SelectItem>
                                                <SelectItem value="Expanded Metal">Expanded Metal</SelectItem>
                                                <SelectItem value="Punched Grid">Punched Grid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="activeMateria lPaste" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">Active Material Paste Application</FormLabel>
                                    </FormItem>
                                )} />

                                <FormField control={control} name="productionRate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Production Rate (units/day)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 10000" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    )}

                    {selectedRoute === '5B' && (
                        <div className="space-y-6 p-6 border border-[#e3d4c8] rounded-xl bg-white/50">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Route 5B: Sheet/Pipe/Foil Products</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="rollingProcess" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rolling Process</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select process" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Hot Rolling">Hot Rolling</SelectItem>
                                                <SelectItem value="Cold Rolling">Cold Rolling</SelectItem>
                                                <SelectItem value="Continuous Rolling">Continuous Rolling</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="thickness" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Thickness (mm)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 2.5" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="surfaceTreatment" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Surface Treatment</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select treatment" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="None">None</SelectItem>
                                                <SelectItem value="Coating">Coating</SelectItem>
                                                <SelectItem value="Oxidation">Oxidation</SelectItem>
                                                <SelectItem value="Polishing">Polishing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="productionRate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Production Rate (t/day)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    )}

                    {selectedRoute === '5C' && (
                        <div className="space-y-6 p-6 border border-[#e3d4c8] rounded-xl bg-white/50">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Route 5C: Alloys & Specialized Products</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="alloyType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alloy Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select alloy type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Lead-Antimony">Lead-Antimony</SelectItem>
                                                <SelectItem value="Lead-Tin (Solder)">Lead-Tin (Solder)</SelectItem>
                                                <SelectItem value="Lead-Calcium">Lead-Calcium</SelectItem>
                                                <SelectItem value="Lead-Silver">Lead-Silver</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="specialApplication" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Specialized Application</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select application" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Radiation Shielding">Radiation Shielding</SelectItem>
                                                <SelectItem value="Ammunition">Ammunition</SelectItem>
                                                <SelectItem value="Solder">Solder</SelectItem>
                                                <SelectItem value="Cable Sheathing">Cable Sheathing</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={control} name="alloyElements" render={() => (
                                <FormItem>
                                    <FormLabel>Alloying Elements</FormLabel>
                                    <FormDescription>Select elements added to create lead alloys.</FormDescription>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                        {['Antimony (Sb)', 'Tin (Sn)', 'Calcium (Ca)', 'Silver (Ag)', 'Arsenic (As)', 'Copper (Cu)'].map((elem) => (
                                            <FormField key={elem} control={control} name="alloyElements" render={({ field }) => (
                                                <CardCheckbox id={elem} label={elem} checked={field.value?.includes(elem)}
                                                    onChange={(c) => { const s = new Set(field.value || []); c ? s.add(elem) : s.delete(elem); field.onChange([...s]); }} />
                                            )} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="productionRate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Production Rate (t/day)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} placeholder="e.g., 30" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    )}

                    {!selectedRoute && (
                        <div className="text-center p-8 text-gray-500">
                            <p>Please select a manufacturing route to continue</p>
                        </div>
                    )}

                    {selectedRoute && (
                        <>
                            <hr className="my-8 border-gray-200" />

                            {/* ADVANCED OPTIONS */}
                            <AdvancedOptionsSection defaultOpen={false}>
                                <div className="space-y-6">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Additional Inputs</h4>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={control} name="qualityStandard" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quality Standard Compliance</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select standard" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="ISO 9001">ISO 9001</SelectItem>
                                                        <SelectItem value="ASTM Standards">ASTM Standards</SelectItem>
                                                        <SelectItem value="EN Standards">EN Standards</SelectItem>
                                                        <SelectItem value="JIS Standards">JIS Standards</SelectItem>
                                                        <SelectItem value="Internal Standards">Internal Standards</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={control} name="scrapRate" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Manufacturing Scrap Rate (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.1" {...field} placeholder="e.g., 5" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={control} name="energyIntensity" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Energy Intensity (MJ/kg product)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" {...field} placeholder="e.g., 2.5" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <hr className="my-6 border-gray-200" />

                                    {/* Sustainability Toggle and Parameters */}
                                    <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                                        <FormField control={control} name="sustainabilityFocused" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
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
                                        )} />
                                    </div>

                                    {watch("sustainabilityFocused") === true && (
                                        <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                                            <h4 className="text-base font-semibold text-gray-900 mb-4">Sustainability Parameters</h4>

                                            <div className="space-y-6">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <FormField control={control} name="scrapRecycling" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">In-Process Scrap Recycling</FormLabel>
                                                        </FormItem>
                                                    )} />

                                                    <FormField control={control} name="emissionControl" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Emission Control Systems</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <FormField control={control} name="energyEfficiency" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Energy Efficiency Improvement (%)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" {...field} placeholder="e.g., 15" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />

                                                    <FormField control={control} name="wasteReduction" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Waste Reduction (%)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <FormField control={control} name="renewableEnergy" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Renewable Energy Use (%)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />

                                                    <FormField control={control} name="waterRecycling" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Water Recycling Rate (%)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AdvancedOptionsSection>
                        </>
                    )}
                </form>
            </StepSection>
        </FormProvider>
    )
}

function UsePhaseStep({ onNext, onBack }) {
    const schema = z.object({
        // Mandatory
        application: z.string().min(1, "Required"),
        expectedLifetime: requiredNumber(0),

        // Advanced
        usageIntensity: z.string().optional(),
        maintenanceFrequency: z.string().optional(),
        operatingConditions: z.array(z.string()).optional(),
        performanceDegradation: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        energyConsumption: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        safetyConsiderations: z.array(z.string()).optional(),

        // Sustainability
        sustainabilityFocused: z.boolean().optional(),
        extendedLifetime: z.boolean().optional(),
        regularMaintenance: z.boolean().optional(),
        safetyCompliance: z.boolean().optional(),
        endOfLifeCollection: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        productDurability: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
    })

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            expectedLifetime: 10,
            operatingConditions: [],
            safetyConsiderations: [],
            sustainabilityFocused: false,
            extendedLifetime: false,
            regularMaintenance: false,
            safetyCompliance: false
        }
    })
    const { control, handleSubmit, formState: { isValid }, watch } = form

    return (
        <FormProvider {...form}>
            <StepSection
                stepNumber={6}
                badgeLabel="USE PHASE"
                title="Use Phase"
                description="Product lifetime, maintenance, and operational impacts. Fields marked with * are required."
                onPredict={() => console.log('AI Predictions for Use Phase')}
                predicting={false}
                footer={<StepFooter onBack={onBack} onForward={handleSubmit(onNext)} disabled={!isValid} />}
            >
                <form className="space-y-8">
                    {/* MANDATORY FIELDS */}
                    <div className="space-y-6">
                        <FormField control={control} name="application" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={GROUP_TEXT}>Primary Application*</FormLabel>
                                <FormDescription>Main use case for the lead product.</FormDescription>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                    {['Automotive Batteries (SLI)', 'Industrial Batteries (UPS/Traction)', 'Building & Construction', 'Medical Radiation Shielding', 'Ammunition & Ballistics', 'Cable Sheathing', 'Chemical Processing', 'Electronic Solder', 'Other Applications'].map((app) => (
                                        <CardRadio key={app} id={app} label={app} selected={field.value === app} onSelect={() => field.onChange(app)} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={control} name="expectedLifetime" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={GROUP_TEXT}>Expected Product Lifetime (years)*</FormLabel>
                                <FormDescription>Average operational lifespan before end-of-life.</FormDescription>
                                <FormControl>
                                    <Input type="number" step="0.5" {...field} placeholder="e.g., 10" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <hr className="my-8 border-gray-200" />

                    {/* ADVANCED OPTIONS */}
                    <AdvancedOptionsSection defaultOpen={false}>
                        <div className="space-y-6">
                            <FormField control={control} name="usageIntensity" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Usage Intensity</FormLabel>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        {['Low', 'Medium', 'High'].map((level) => (
                                            <CardRadio key={level} id={level} label={level} selected={field.value === level}
                                                onSelect={() => field.onChange(level)} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="maintenanceFrequency" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Maintenance Frequency</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="None Required">None Required</SelectItem>
                                            <SelectItem value="Annual">Annual</SelectItem>
                                            <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                                            <SelectItem value="Monthly">Monthly</SelectItem>
                                            <SelectItem value="As Needed">As Needed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="operatingConditions" render={() => (
                                <FormItem>
                                    <FormLabel>Operating Conditions</FormLabel>
                                    <FormDescription>Environmental and operational conditions during use.</FormDescription>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        {['Indoor Use', 'Outdoor Exposure', 'High Temperature', 'Low Temperature', 'Corrosive Environment', 'Mechanical Stress'].map((cond) => (
                                            <FormField key={cond} control={control} name="operatingConditions" render={({ field }) => (
                                                <CardCheckbox id={cond} label={cond} checked={field.value?.includes(cond)}
                                                    onChange={(c) => { const s = new Set(field.value || []); c ? s.add(cond) : s.delete(cond); field.onChange([...s]); }} />
                                            )} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={control} name="performanceDegradation" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Performance Degradation Rate (%/year)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} placeholder="e.g., 2" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={control} name="energyConsumption" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Energy Consumption During Use (kWh/year)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} placeholder="e.g., 0" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={control} name="safetyConsiderations" render={() => (
                                <FormItem>
                                    <FormLabel>Safety & Health Considerations</FormLabel>
                                    <FormDescription>Relevant safety measures during product use phase.</FormDescription>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        {['Lead Exposure Risk', 'Ventilation Required', 'PPE Recommended', 'Child Safety', 'Disposal Protocols', 'Regular Monitoring'].map((safety) => (
                                            <FormField key={safety} control={control} name="safetyConsiderations" render={({ field }) => (
                                                <CardCheckbox id={safety} label={safety} checked={field.value?.includes(safety)}
                                                    onChange={(c) => { const s = new Set(field.value || []); c ? s.add(safety) : s.delete(safety); field.onChange([...s]); }} />
                                            )} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <hr className="my-6 border-gray-200" />

                            {/* Sustainability Toggle and Parameters */}
                            <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                                <FormField control={control} name="sustainabilityFocused" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-base font-semibold cursor-pointer">
                                                Sustainability Focused
                                            </FormLabel>
                                            <FormDescription className="text-sm">
                                                Enable to include sustainability parameters for product use phase
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )} />
                            </div>

                            {watch("sustainabilityFocused") === true && (
                                <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Sustainability Parameters</h4>

                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="extendedLifetime" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Extended Product Lifetime</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="regularMaintenance" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Regular Maintenance Program</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="safetyCompliance" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Safety & Health Compliance</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="endOfLifeCollection" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End-of-Life Collection Rate (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={control} name="productDurability" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product Durability Index (1-10)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="1" max="10" {...field} placeholder="1-10" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </AdvancedOptionsSection>
                </form>
            </StepSection>
        </FormProvider>
    )
}

function RecyclingStep({ onNext, onBack }) {
    const schema = z.object({
        // Mandatory
        recyclingMethod: z.string().min(1, "Required"),
        collectionRate: requiredNumber(0),
        recyclingEfficiency: requiredNumber(0),

        // Advanced
        pretreatmentSteps: z.array(z.string()).optional(),
        sortingMethod: z.string().optional(),
        contaminants: z.array(z.string()).optional(),
        energyRecovery: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        downcycling: z.boolean().optional(),
        certificationType: z.string().optional(),

        // Sustainability
        sustainabilityFocused: z.boolean().optional(),
        collectionRateHigh: z.boolean().optional(),
        recyclingEfficiencyHigh: z.boolean().optional(),
        closedLoopRecycling: z.boolean().optional(),
        energySavingsHigh: z.boolean().optional(),
        emissionReduction: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        certificationsHeld: z.boolean().optional(),
    })

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            collectionRate: 70,
            recyclingEfficiency: 95,
            pretreatmentSteps: [],
            contaminants: [],
            downcycling: false,
            sustainabilityFocused: false,
            collectionRateHigh: false,
            recyclingEfficiencyHigh: false,
            closedLoopRecycling: false,
            energySavingsHigh: false,
            certificationsHeld: false
        }
    })
    const { control, handleSubmit, formState: { isValid }, watch } = form

    return (
        <FormProvider {...form}>
            <StepSection
                stepNumber={7}
                badgeLabel="RECYCLING"
                title="End-of-Life Recycling"
                description="Recover and reprocess lead from end-of-life products. Fields marked with * are required."
                onPredict={() => console.log('AI Predictions for Recycling')}
                predicting={false}
                footer={<StepFooter onBack={onBack} onForward={handleSubmit(onNext)} disabled={!isValid} />}
            >
                <form className="space-y-8">
                    {/* MANDATORY FIELDS */}
                    <div className="space-y-6">
                        <FormField control={control} name="recyclingMethod" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={GROUP_TEXT}>Recycling Method*</FormLabel>
                                <FormDescription>Primary process for recovering lead from scrap.</FormDescription>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                    {['Secondary Smelting', 'Battery Breaking & Smelting', 'Reverberatory Furnace Recycling', 'Rotary Furnace', 'Electrolytic Recovery', 'Hydrometallurgical Processing'].map((method) => (
                                        <CardRadio key={method} id={method} label={method} selected={field.value === method}
                                            onSelect={() => field.onChange(method)} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField control={control} name="collectionRate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Collection Rate (%)*</FormLabel>
                                    <FormDescription>Percentage of end-of-life products collected.</FormDescription>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <Slider value={[field.value || 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={1} />
                                            <div className="text-sm text-muted-foreground">{(field.value || 0).toFixed(0)}%</div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="recyclingEfficiency" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={GROUP_TEXT}>Recycling Efficiency (%)*</FormLabel>
                                    <FormDescription>Lead recovery rate from collected scrap.</FormDescription>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <Slider value={[field.value || 0]} onValueChange={(v) => field.onChange(v[0])} min={0} max={100} step={0.5} />
                                            <div className="text-sm text-muted-foreground">{(field.value || 0).toFixed(1)}%</div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    <hr className="my-8 border-gray-200" />

                    {/* ADVANCED OPTIONS */}
                    <AdvancedOptionsSection defaultOpen={false}>
                        <div className="space-y-6">
                            <FormField control={control} name="pretreatmentSteps" render={() => (
                                <FormItem>
                                    <FormLabel>Pre-treatment Steps</FormLabel>
                                    <FormDescription>Processing before main recycling operation.</FormDescription>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        {['Dismantling', 'Crushing', 'Shredding', 'Separation', 'Acid Drainage', 'Neutralization'].map((step) => (
                                            <FormField key={step} control={control} name="pretreatmentSteps" render={({ field }) => (
                                                <CardCheckbox id={step} label={step} checked={field.value?.includes(step)}
                                                    onChange={(c) => { const s = new Set(field.value || []); c ? s.add(step) : s.delete(step); field.onChange([...s]); }} />
                                            )} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="sortingMethod" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sorting Method</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select sorting method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Manual Sorting">Manual Sorting</SelectItem>
                                            <SelectItem value="Magnetic Separation">Magnetic Separation</SelectItem>
                                            <SelectItem value="Density Separation">Density Separation</SelectItem>
                                            <SelectItem value="XRF Sorting">XRF Sorting</SelectItem>
                                            <SelectItem value="Automated Systems">Automated Systems</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="contaminants" render={() => (
                                <FormItem>
                                    <FormLabel>Major Contaminants</FormLabel>
                                    <FormDescription>Common impurities in recycled feedstock.</FormDescription>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                        {['Plastics', 'Acid Residues', 'Iron/Steel', 'Other Metals', 'Sulfates', 'Organic Materials'].map((contam) => (
                                            <FormField key={contam} control={control} name="contaminants" render={({ field }) => (
                                                <CardCheckbox id={contam} label={contam} checked={field.value?.includes(contam)}
                                                    onChange={(c) => { const s = new Set(field.value || []); c ? s.add(contam) : s.delete(contam); field.onChange([...s]); }} />
                                            )} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="energyRecovery" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Energy Savings vs. Primary Production (%)</FormLabel>
                                    <FormDescription>Energy reduction compared to mining/smelting.</FormDescription>
                                    <FormControl>
                                        <Input type="number" step="1" {...field} placeholder="e.g., 65" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="downcycling" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="cursor-pointer">
                                            Downcycling Occurs
                                        </FormLabel>
                                        <FormDescription>
                                            Recycled lead used for lower-grade applications.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )} />

                            <FormField control={control} name="certificationType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Recycling Certification</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select certification" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="None">None</SelectItem>
                                            <SelectItem value="ISO 14001">ISO 14001</SelectItem>
                                            <SelectItem value="R2 Certified">R2 Certified</SelectItem>
                                            <SelectItem value="e-Stewards">e-Stewards</SelectItem>
                                            <SelectItem value="Local Certification">Local Certification</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <hr className="my-6 border-gray-200" />

                            {/* Sustainability Toggle and Parameters */}
                            <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                                <FormField control={control} name="sustainabilityFocused" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
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
                                )} />
                            </div>

                            {watch("sustainabilityFocused") === true && (
                                <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Sustainability Parameters</h4>

                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="collectionRateHigh" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Collection Rate ≥ 90%</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="recyclingEfficiencyHigh" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Recycling Efficiency ≥ 95%</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="closedLoopRecycling" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Closed-Loop Recycling System</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="energySavingsHigh" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Energy Savings ≥ 60%</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="certificationsHeld" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Environmental Certifications (ISO 14001, R2)</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="emissionReduction" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Emission Reduction vs Primary (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" {...field} placeholder="e.g., 70" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AdvancedOptionsSection>
                </form>
            </StepSection>
        </FormProvider>
    )
}

function ValorizationStep({ onNext, onBack }) {
    const schema = z.object({
        // Mandatory
        byproducts: z.array(z.string()).min(1, "Select at least one"),
        valorizationApproach: z.string().min(1, "Required"),

        // Advanced
        slagUtilization: z.string().optional(),
        metalRecovery: z.array(z.string()).optional(),
        economicValue: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        marketDemand: z.string().optional(),
        environmentalBenefit: z.array(z.string()).optional(),

        // Sustainability
        sustainabilityFocused: z.boolean().optional(),
        fullUtilization: z.boolean().optional(),
        valueAddedProducts: z.boolean().optional(),
        wasteToZero: z.boolean().optional(),
        circularEconomy: z.boolean().optional(),
        co2Savings: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
        revenueFromByproducts: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().optional()),
    })

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            byproducts: [],
            metalRecovery: [],
            environmentalBenefit: [],
            sustainabilityFocused: false,
            fullUtilization: false,
            valueAddedProducts: false,
            wasteToZero: false,
            circularEconomy: false
        }
    })
    const { control, handleSubmit, formState: { isValid }, watch } = form

    return (
        <FormProvider {...form}>
            <StepSection
                stepNumber={8}
                badgeLabel="VALORIZATION"
                title="Byproduct & Waste Valorization"
                description="Create value from by-products and waste materials. Fields marked with * are required."
                onPredict={() => console.log('AI Predictions for Valorization')}
                predicting={false}
                footer={<StepFooter onBack={onBack} onForward={handleSubmit(onNext)} disabled={!isValid} />}
            >
                <form className="space-y-8">
                    {/* MANDATORY FIELDS */}
                    <div className="space-y-6">
                        <FormField control={control} name="byproducts" render={() => (
                            <FormItem>
                                <FormLabel className={GROUP_TEXT}>Byproducts/Waste Streams*</FormLabel>
                                <FormDescription>Select all byproducts generated in the lifecycle.</FormDescription>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                    {['Lead Slag', 'Sulfuric Acid (H₂SO₄)', 'Zinc Recovery', 'Silver Recovery', 'Copper Recovery', 'Tailings', 'Captured Dust', 'Battery Plastics (PP/PE)'].map((bp) => (
                                        <FormField key={bp} control={control} name="byproducts" render={({ field }) => (
                                            <CardCheckbox id={bp} label={bp} checked={field.value?.includes(bp)}
                                                onChange={(c) => { const s = new Set(field.value || []); c ? s.add(bp) : s.delete(bp); field.onChange([...s]); }} />
                                        )} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={control} name="valorizationApproach" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={GROUP_TEXT}>Valorization Approach*</FormLabel>
                                <FormDescription>How byproducts are utilized or processed.</FormDescription>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                    {['Material Recovery', 'Energy Recovery', 'Construction Materials', 'Chemical Production', 'Agriculture Use', 'Landfill Disposal'].map((app) => (
                                        <CardRadio key={app} id={app} label={app} selected={field.value === app}
                                            onSelect={() => field.onChange(app)} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <hr className="my-8 border-gray-200" />

                    {/* ADVANCED OPTIONS */}
                    <AdvancedOptionsSection defaultOpen={false}>
                        <div className="space-y-6">
                            <FormField control={control} name="slagUtilization" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slag Utilization Method</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select utilization method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Cement Production">Cement Production</SelectItem>
                                            <SelectItem value="Road Construction">Road Construction</SelectItem>
                                            <SelectItem value="Aggregate">Aggregate for Concrete</SelectItem>
                                            <SelectItem value="Glass/Ceramics">Glass/Ceramics</SelectItem>
                                            <SelectItem value="Soil Amendment">Soil Amendment</SelectItem>
                                            <SelectItem value="Not Utilized">Not Utilized</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="metalRecovery" render={() => (
                                <FormItem>
                                    <FormLabel>Valuable Metals Recovered</FormLabel>
                                    <FormDescription>Precious/valuable metals extracted from byproducts.</FormDescription>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                        {['Silver (Ag)', 'Gold (Au)', 'Copper (Cu)', 'Zinc (Zn)', 'Bismuth (Bi)', 'Antimony (Sb)'].map((metal) => (
                                            <FormField key={metal} control={control} name="metalRecovery" render={({ field }) => (
                                                <CardCheckbox id={metal} label={metal} checked={field.value?.includes(metal)}
                                                    onChange={(c) => { const s = new Set(field.value || []); c ? s.add(metal) : s.delete(metal); field.onChange([...s]); }} />
                                            )} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="economicValue" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Economic Value ($/tonne byproduct)</FormLabel>
                                    <FormDescription>Revenue generated from valorized materials.</FormDescription>
                                    <FormControl>
                                        <Input type="number" step="1" {...field} placeholder="e.g., 50" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="marketDemand" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Market Demand for Byproducts</FormLabel>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        {['Low', 'Medium', 'High'].map((level) => (
                                            <CardRadio key={level} id={level} label={level} selected={field.value === level}
                                                onSelect={() => field.onChange(level)} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={control} name="environmentalBenefit" render={() => (
                                <FormItem>
                                    <FormLabel>Environmental Benefits</FormLabel>
                                    <FormDescription>Positive environmental impacts of valorization.</FormDescription>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        {['Waste Reduction', 'CO₂ Emission Reduction', 'Resource Conservation', 'Circular Economy', 'Hazard Mitigation', 'Land Use Reduction'].map((benefit) => (
                                            <FormField key={benefit} control={control} name="environmentalBenefit" render={({ field }) => (
                                                <CardCheckbox id={benefit} label={benefit} checked={field.value?.includes(benefit)}
                                                    onChange={(c) => { const s = new Set(field.value || []); c ? s.add(benefit) : s.delete(benefit); field.onChange([...s]); }} />
                                            )} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <hr className="my-6 border-gray-200" />

                            {/* Sustainability Toggle and Parameters */}
                            <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                                <FormField control={control} name="sustainabilityFocused" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
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
                                )} />
                            </div>

                            {watch("sustainabilityFocused") === true && (
                                <div className="rounded-lg border border-[#e3d4c8] bg-white/50 p-6">
                                    <h4 className="text-base font-semibold text-gray-900 mb-4">Sustainability Parameters</h4>

                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="fullUtilization" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Full Byproduct Utilization</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="valueAddedProducts" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Value-Added Product Creation</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="wasteToZero" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Zero Waste Approach</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="circularEconomy" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Circular Economy Principles Applied</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={control} name="co2Savings" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CO₂ Savings (tonnes/year)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" {...field} placeholder="e.g., 1000" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={control} name="revenueFromByproducts" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Revenue from Byproducts ($/year)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" {...field} placeholder="e.g., 500000" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AdvancedOptionsSection>
                </form>
            </StepSection>
        </FormProvider>
    )
}