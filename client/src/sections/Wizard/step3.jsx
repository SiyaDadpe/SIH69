import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Flame, 
  Droplets, 
  Zap, 
  Leaf,
  FlaskConical,
  Info,
  ArrowLeft,
  GitBranch
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Form schema - conditionally required based on process route
const formSchema = z.object({
  // General Inputs
  Process_Route: z.string().min(1, "Process route is required"),
  Ore_Type: z.string().min(1, "Ore type is required"),
  Concentrate_Grade_Cu: z.number().min(0).max(100),
  Ore_Throughput_t_per_day: z.number().optional(),
  Moisture_Content: z.number().optional(),
  Impurity_Content: z.string().optional(),
  
  // Pyrometallurgical Process Inputs
  Smelting_Technique: z.string().optional(),
  Smelting_Energy_MJ_per_tonne_concentrate: z.number().optional(),
  Fuel_Type: z.string().optional(),
  Sulfur_Capture_Efficiency: z.number().optional(),
  Slag_Produced_kg_per_tonne_concentrate: z.number().optional(),
  Metal_Loss_in_Slag: z.number().optional(),
  Electrorefining_Energy_kWh_per_tonne_cathode: z.number().optional(),
  Pyro_Water_Consumption_m3_per_tonne_concentrate: z.number().optional(),
  Pyro_Recycled_Water: z.number().optional(),
  Acid_Produced_kg_H2SO4_per_tonne_concentrate: z.number().optional(),
  
  // Hydrometallurgical Process Inputs
  Leaching_Method: z.string().optional(),
  Acid_Consumption_kg_H2SO4_per_tonne_ore: z.number().optional(),
  Leaching_Efficiency: z.number().optional(),
  Electrowinning_Energy_kWh_per_kg_Cu: z.number().optional(),
  Solvent_Loss_kg_per_tonne_Cu: z.number().optional(),
  Electrowinning_Current_Density_A_per_m2: z.number().optional(),
  Hydro_Water_Consumption_m3_per_tonne_ore: z.number().optional(),
  Hydro_Recycled_Water: z.number().optional(),
  Temperature_C: z.number().optional(),
  
  // Environmental and By-Product Data
  GHG_Emissions_kgCO2e_per_tonne_Cu: z.number().optional(),
  SO2_Emissions_kg_per_tonne_concentrate: z.number().optional(),
  Slag_Recycling_Rate: z.number().optional(),
  Acid_Recycling: z.number().optional(),
  Heavy_Metal_Residue_mg_per_L: z.number().optional(),
  Waste_Solution_pH: z.number().optional(),
  By_Product_Recovery_AuAg_kg_per_tonne_Cu: z.number().optional(),
})

// Option button component
const OptionButton = ({ selected, onClick, children, icon: Icon, highlighted = false }) => (
  <motion.button
    type="button"
    onClick={onClick}
    className={`
      relative px-4 py-3 rounded-lg border-2 transition-all duration-300
      flex items-center gap-2 justify-center font-medium
      ${selected 
        ? highlighted
          ? 'border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-500/30'
          : 'border-[#BA7967] bg-[#BA7967] text-white shadow-lg shadow-[#BA7967]/30'
        : 'border-gray-300 bg-white text-gray-700 hover:border-[#BA7967]/50 hover:shadow-md'
      }
    `}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {children}
    {selected && (
      <motion.div
        layoutId="selected-indicator-step3"
        className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </motion.div>
    )}
  </motion.button>
)

// Section component
const Section = ({ title, icon: Icon, children, defaultExpanded = true, required = false, color = "bg-[#BA7967]" }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2 ${color} rounded-lg`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {title}
              {required && <span className="text-red-500 text-sm">*Required</span>}
            </h3>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6 bg-gray-50/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Field wrapper
const FieldWrapper = ({ label, required, tooltip, children }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">★</span>}
      </Label>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    {children}
  </div>
)

export default function Step3({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      Process_Route: "",
      Ore_Type: "",
      Concentrate_Grade_Cu: 25,
      Moisture_Content: 0,
      Metal_Loss_in_Slag: 0,
      Sulfur_Capture_Efficiency: 95,
      Pyro_Recycled_Water: 80,
      Leaching_Efficiency: 85,
      Hydro_Recycled_Water: 90,
      Slag_Recycling_Rate: 0,
      Acid_Recycling: 0,
    },
    mode: "onChange",
  })

  const { handleSubmit, control, watch, formState: { isValid, errors } } = form
  
  // Watch for process route to conditionally show sections
  const processRoute = watch("Process_Route")
  const isPyro = processRoute === "pyrometallurgical"
  const isHydro = processRoute === "hydrometallurgical"

  const onSubmit = async (data) => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    
    try {
      if (onSave) {
        await onSave(data)
        setSaveSuccess(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        if (onNext) onNext()
      }
    } catch (error) {
      setSaveError(error.message || 'Failed to save data')
    } finally {
      if (!saveSuccess) setIsSaving(false)
    }
  }

  return (
    <FormProvider {...form}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full bg-gradient-to-br from-[#F3F2EC] to-white shadow-2xl border-none">
          <CardHeader className="border-b-2 border-gray-200 bg-white">
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
              <div className="col-start-2 text-center">
                <div className="inline-flex items-center gap-2 bg-[#BA7967]/10 text-[#BA7967] px-4 py-2 rounded-full mb-3">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Step 3 of 7</span>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Metallurgical Extraction
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Select your process route and enter extraction details. Fields marked with ★ are required.
                </CardDescription>
              </div>
              <div className="col-start-3 justify-self-end sticky top-4">
                <Button 
                  type="button" 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg" 
                  onClick={() => onGenerateAIPrediction?.(form.getValues())}
                  disabled={predicting}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {predicting ? 'Predicting...' : 'AI Predictions'}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Process Route Selection - Most Important */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-2xl border-2 border-purple-200 p-8 shadow-lg"
                >
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-full mb-3">
                      <GitBranch className="h-5 w-5" />
                      <span className="font-semibold">Choose Your Extraction Route</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      This determines which process fields will be shown below
                    </p>
                  </div>

                  <FormField
                    control={control}
                    name="Process_Route"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Pyrometallurgical Route */}
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                              relative p-6 rounded-xl border-3 cursor-pointer transition-all duration-300
                              ${field.value === 'pyrometallurgical'
                                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 shadow-xl shadow-orange-500/20'
                                : 'border-gray-300 bg-white hover:border-orange-300 hover:shadow-lg'
                              }
                            `}
                            onClick={() => field.onChange('pyrometallurgical')}
                          >
                            <div className="flex flex-col items-center text-center space-y-4">
                              <div className={`
                                p-4 rounded-full transition-all duration-300
                                ${field.value === 'pyrometallurgical'
                                  ? 'bg-gradient-to-br from-orange-500 to-red-600'
                                  : 'bg-gray-200'
                                }
                              `}>
                                <Flame className={`h-8 w-8 ${field.value === 'pyrometallurgical' ? 'text-white' : 'text-gray-600'}`} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                  Pyrometallurgical
                                </h3>
                                <p className="text-sm text-gray-600 mb-3">
                                  High-temperature smelting process for sulfide ores
                                </p>
                                <div className="space-y-1 text-xs text-left bg-white/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                                    <span>Flash/Bath Smelting</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                                    <span>Electrorefining</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                                    <span>Sulfuric Acid Production</span>
                                  </div>
                                </div>
                              </div>
                              {field.value === 'pyrometallurgical' && (
                                <motion.div
                                  layoutId="route-selected"
                                  className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>

                          {/* Hydrometallurgical Route */}
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                              relative p-6 rounded-xl border-3 cursor-pointer transition-all duration-300
                              ${field.value === 'hydrometallurgical'
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl shadow-blue-500/20'
                                : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-lg'
                              }
                            `}
                            onClick={() => field.onChange('hydrometallurgical')}
                          >
                            <div className="flex flex-col items-center text-center space-y-4">
                              <div className={`
                                p-4 rounded-full transition-all duration-300
                                ${field.value === 'hydrometallurgical'
                                  ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                                  : 'bg-gray-200'
                                }
                              `}>
                                <Droplets className={`h-8 w-8 ${field.value === 'hydrometallurgical' ? 'text-white' : 'text-gray-600'}`} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                  Hydrometallurgical
                                </h3>
                                <p className="text-sm text-gray-600 mb-3">
                                  Solution-based extraction (SX-EW) for oxide ores
                                </p>
                                <div className="space-y-1 text-xs text-left bg-white/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                    <span>Heap/Agitated Leaching</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                    <span>Solvent Extraction</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                    <span>Electrowinning</span>
                                  </div>
                                </div>
                              </div>
                              {field.value === 'hydrometallurgical' && (
                                <motion.div
                                  layoutId="route-selected"
                                  className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Show message if no route selected */}
                {!processRoute && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                  >
                    <GitBranch className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">
                      Please select a process route above to continue
                    </p>
                  </motion.div>
                )}

                {/* General Inputs - Always shown if route is selected */}
                <AnimatePresence>
                  {processRoute && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Section title="General Inputs" icon={FlaskConical} defaultExpanded={true} required={true}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Ore Type */}
                          <FormField
                            control={control}
                            name="Ore_Type"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Ore Type" required>
                                  <div className="grid grid-cols-2 gap-3">
                                    {['oxide', 'sulfide'].map((type) => (
                                      <OptionButton
                                        key={type}
                                        selected={field.value === type}
                                        onClick={() => field.onChange(field.value === type ? "" : type)}
                                      >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                      </OptionButton>
                                    ))}
                                  </div>
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Concentrate Grade */}
                          <FormField
                            control={control}
                            name="Concentrate_Grade_Cu"
                            render={({ field }) => (
                              <FormItem className="col-span-full md:col-span-2">
                                <FieldWrapper label="Concentrate Grade (% Cu)" required tooltip="Copper content in concentrate feed">
                                  <div className="space-y-3">
                                    <Slider
                                      value={[field.value || 0]}
                                      onValueChange={(v) => field.onChange(v[0])}
                                      min={0}
                                      max={100}
                                      step={0.5}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between items-center">
                                      <span className="text-2xl font-bold text-[#BA7967]">{(field.value || 0).toFixed(1)}%</span>
                                      <Input
                                        type="number"
                                        value={field.value || 0}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        className="w-24 text-right"
                                        step={0.5}
                                        min={0}
                                        max={100}
                                      />
                                    </div>
                                  </div>
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Ore Throughput */}
                          <FormField
                            control={control}
                            name="Ore_Throughput_t_per_day"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Ore Throughput (t/day)">
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 10000" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                    value={field.value || ""}
                                    className="border-2 focus:border-[#BA7967]"
                                  />
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Moisture Content */}
                          <FormField
                            control={control}
                            name="Moisture_Content"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Moisture Content (%)">
                                  <div className="space-y-3">
                                    <Slider
                                      value={[field.value || 0]}
                                      onValueChange={(v) => field.onChange(v[0])}
                                      min={0}
                                      max={50}
                                      step={0.5}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between items-center">
                                      <span className="text-xl font-bold text-blue-600">{(field.value || 0).toFixed(1)}%</span>
                                      <Input
                                        type="number"
                                        value={field.value || 0}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        className="w-20 text-right"
                                        min={0}
                                        max={50}
                                      />
                                    </div>
                                  </div>
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Impurity Content */}
                          <FormField
                            control={control}
                            name="Impurity_Content"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Impurity Content (%)" tooltip="Fe, S, As, Pb, etc.">
                                  <Input 
                                    placeholder="e.g., Fe: 30, S: 28, As: 0.5" 
                                    {...field} 
                                    className="border-2 focus:border-[#BA7967]"
                                  />
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Section>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pyrometallurgical Process Inputs */}
                <AnimatePresence>
                  {isPyro && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Section 
                        title="Pyrometallurgical Process" 
                        icon={Flame} 
                        defaultExpanded={true} 
                        required={true}
                        color="bg-gradient-to-r from-orange-500 to-red-600"
                      >
                        <div className="grid grid-cols-1 gap-6">
                          {/* Smelting Technique */}
                          <FormField
                            control={control}
                            name="Smelting_Technique"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Smelting Technique" required>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {['flash', 'bath', 'reverberatory'].map((type) => (
                                      <OptionButton
                                        key={type}
                                        selected={field.value === type}
                                        onClick={() => field.onChange(field.value === type ? "" : type)}
                                        icon={Flame}
                                      >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                      </OptionButton>
                                    ))}
                                  </div>
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Smelting Energy */}
                            <FormField
                              control={control}
                              name="Smelting_Energy_MJ_per_tonne_concentrate"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Smelting Energy (MJ/t concentrate)" required>
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 3000" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Electrorefining Energy */}
                            <FormField
                              control={control}
                              name="Electrorefining_Energy_kWh_per_tonne_cathode"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Electrorefining Energy (kWh/t cathode)" required>
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 250" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Slag Produced */}
                            <FormField
                              control={control}
                              name="Slag_Produced_kg_per_tonne_concentrate"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Slag Produced (kg/t concentrate)" required>
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 2500" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Fuel Type */}
                          <FormField
                            control={control}
                            name="Fuel_Type"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Fuel Type">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {['coal', 'oil', 'natural gas'].map((type) => (
                                      <OptionButton
                                        key={type}
                                        selected={field.value === type}
                                        onClick={() => field.onChange(field.value === type ? "" : type)}
                                        icon={Zap}
                                      >
                                        {type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                      </OptionButton>
                                    ))}
                                  </div>
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Sulfur Capture Efficiency */}
                            <FormField
                              control={control}
                              name="Sulfur_Capture_Efficiency"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Sulfur Capture Efficiency (%)" required>
                                    <div className="space-y-3">
                                      <Slider
                                        value={[field.value || 0]}
                                        onValueChange={(v) => field.onChange(v[0])}
                                        min={0}
                                        max={100}
                                        step={1}
                                        className="w-full"
                                      />
                                      <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-green-600">{(field.value || 0)}%</span>
                                        <Input
                                          type="number"
                                          value={field.value || 0}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          className="w-20 text-right"
                                          min={0}
                                          max={100}
                                        />
                                      </div>
                                    </div>
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Metal Loss in Slag */}
                            <FormField
                              control={control}
                              name="Metal_Loss_in_Slag"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Metal Loss in Slag (%)">
                                    <div className="space-y-3">
                                      <Slider
                                        value={[field.value || 0]}
                                        onValueChange={(v) => field.onChange(v[0])}
                                        min={0}
                                        max={20}
                                        step={0.1}
                                        className="w-full"
                                      />
                                      <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-red-600">{(field.value || 0).toFixed(1)}%</span>
                                        <Input
                                          type="number"
                                          value={field.value || 0}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          className="w-20 text-right"
                                          min={0}
                                          max={20}
                                          step={0.1}
                                        />
                                      </div>
                                    </div>
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Pyro Recycled Water */}
                            <FormField
                              control={control}
                              name="Pyro_Recycled_Water"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Recycled Water (%)">
                                    <div className="space-y-3">
                                      <Slider
                                        value={[field.value || 0]}
                                        onValueChange={(v) => field.onChange(v[0])}
                                        min={0}
                                        max={100}
                                        step={1}
                                        className="w-full"
                                      />
                                      <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-blue-600">{(field.value || 0)}%</span>
                                        <Input
                                          type="number"
                                          value={field.value || 0}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          className="w-20 text-right"
                                          min={0}
                                          max={100}
                                        />
                                      </div>
                                    </div>
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Water Consumption */}
                            <FormField
                              control={control}
                              name="Pyro_Water_Consumption_m3_per_tonne_concentrate"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Water Consumption (m³/t concentrate)">
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 1.2" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Acid Produced */}
                            <FormField
                              control={control}
                              name="Acid_Produced_kg_H2SO4_per_tonne_concentrate"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Acid Produced (kg H₂SO₄/t concentrate)">
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 2000" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </Section>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hydrometallurgical Process Inputs */}
                <AnimatePresence>
                  {isHydro && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Section 
                        title="Hydrometallurgical Process (SX-EW)" 
                        icon={Droplets} 
                        defaultExpanded={true} 
                        required={true}
                        color="bg-gradient-to-r from-blue-500 to-cyan-600"
                      >
                        <div className="grid grid-cols-1 gap-6">
                          {/* Leaching Method */}
                          <FormField
                            control={control}
                            name="Leaching_Method"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Leaching Method" required>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {['heap', 'in-situ', 'agitated'].map((type) => (
                                      <OptionButton
                                        key={type}
                                        selected={field.value === type}
                                        onClick={() => field.onChange(field.value === type ? "" : type)}
                                        icon={Droplets}
                                      >
                                        {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
                                      </OptionButton>
                                    ))}
                                  </div>
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Acid Consumption */}
                            <FormField
                              control={control}
                              name="Acid_Consumption_kg_H2SO4_per_tonne_ore"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Acid Consumption (kg H₂SO₄/t ore)" required>
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 25" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Electrowinning Energy */}
                            <FormField
                              control={control}
                              name="Electrowinning_Energy_kWh_per_kg_Cu"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Electrowinning Energy (kWh/kg Cu)" required>
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 2.0" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Solvent Loss */}
                            <FormField
                              control={control}
                              name="Solvent_Loss_kg_per_tonne_Cu"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Solvent Loss (kg/t Cu)">
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 0.5" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Leaching Efficiency */}
                            <FormField
                              control={control}
                              name="Leaching_Efficiency"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Leaching Efficiency (%)" required>
                                    <div className="space-y-3">
                                      <Slider
                                        value={[field.value || 0]}
                                        onValueChange={(v) => field.onChange(v[0])}
                                        min={0}
                                        max={100}
                                        step={0.5}
                                        className="w-full"
                                      />
                                      <div className="flex justify-between items-center">
                                        <span className="text-2xl font-bold text-green-600">{(field.value || 0).toFixed(1)}%</span>
                                        <Input
                                          type="number"
                                          value={field.value || 0}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          className="w-24 text-right"
                                          step={0.5}
                                          min={0}
                                          max={100}
                                        />
                                      </div>
                                    </div>
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Hydro Recycled Water */}
                            <FormField
                              control={control}
                              name="Hydro_Recycled_Water"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Recycled Water (%)">
                                    <div className="space-y-3">
                                      <Slider
                                        value={[field.value || 0]}
                                        onValueChange={(v) => field.onChange(v[0])}
                                        min={0}
                                        max={100}
                                        step={1}
                                        className="w-full"
                                      />
                                      <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-blue-600">{(field.value || 0)}%</span>
                                        <Input
                                          type="number"
                                          value={field.value || 0}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          className="w-20 text-right"
                                          min={0}
                                          max={100}
                                        />
                                      </div>
                                    </div>
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Water Consumption */}
                            <FormField
                              control={control}
                              name="Hydro_Water_Consumption_m3_per_tonne_ore"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Water Consumption (m³/t ore)">
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 0.8" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Electrowinning Current Density */}
                            <FormField
                              control={control}
                              name="Electrowinning_Current_Density_A_per_m2"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="EW Current Density (A/m²)">
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 250" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Temperature */}
                            <FormField
                              control={control}
                              name="Temperature_C"
                              render={({ field }) => (
                                <FormItem>
                                  <FieldWrapper label="Temperature (°C)">
                                    <Input 
                                      type="number" 
                                      placeholder="e.g., 45" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                      value={field.value || ""}
                                      className="border-2 focus:border-[#BA7967]"
                                    />
                                  </FieldWrapper>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </Section>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Environmental and By-Product Data - Always shown if route is selected */}
                <AnimatePresence>
                  {processRoute && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <Section title="Environmental and By-Product Data" icon={Leaf} defaultExpanded={false}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* GHG Emissions */}
                          <FormField
                            control={control}
                            name="GHG_Emissions_kgCO2e_per_tonne_Cu"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="GHG Emissions (kgCO₂e/t Cu)">
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 3500" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                    value={field.value || ""}
                                    className="border-2 focus:border-[#BA7967]"
                                  />
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* SO2 Emissions */}
                          <FormField
                            control={control}
                            name="SO2_Emissions_kg_per_tonne_concentrate"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="SO₂ Emissions (kg/t concentrate)" tooltip="Sulfur dioxide emissions">
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 15" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                    value={field.value || ""}
                                    className="border-2 focus:border-[#BA7967]"
                                  />
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Heavy Metal Residue */}
                          <FormField
                            control={control}
                            name="Heavy_Metal_Residue_mg_per_L"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Heavy Metal Residue (mg/L)">
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 0.5" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                    value={field.value || ""}
                                    className="border-2 focus:border-[#BA7967]"
                                  />
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Waste Solution pH */}
                          <FormField
                            control={control}
                            name="Waste_Solution_pH"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Waste Solution pH">
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 2.5" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                    value={field.value || ""}
                                    step={0.1}
                                    min={0}
                                    max={14}
                                    className="border-2 focus:border-[#BA7967]"
                                  />
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* By-Product Recovery */}
                          <FormField
                            control={control}
                            name="By_Product_Recovery_AuAg_kg_per_tonne_Cu"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="By-Product Recovery Au/Ag (kg/t Cu)" tooltip="Gold and silver recovery">
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 0.002" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                    value={field.value || ""}
                                    step={0.001}
                                    className="border-2 focus:border-[#BA7967]"
                                  />
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Recycling Rates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          {/* Slag Recycling Rate */}
                          <FormField
                            control={control}
                            name="Slag_Recycling_Rate"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Slag Recycling Rate (%)">
                                  <div className="space-y-3">
                                    <Slider
                                      value={[field.value || 0]}
                                      onValueChange={(v) => field.onChange(v[0])}
                                      min={0}
                                      max={100}
                                      step={1}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between items-center">
                                      <span className="text-xl font-bold text-green-600">{(field.value || 0)}%</span>
                                      <Input
                                        type="number"
                                        value={field.value || 0}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        className="w-20 text-right"
                                        min={0}
                                        max={100}
                                      />
                                    </div>
                                  </div>
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Acid Recycling */}
                          <FormField
                            control={control}
                            name="Acid_Recycling"
                            render={({ field }) => (
                              <FormItem>
                                <FieldWrapper label="Acid Recycling (%)">
                                  <div className="space-y-3">
                                    <Slider
                                      value={[field.value || 0]}
                                      onValueChange={(v) => field.onChange(v[0])}
                                      min={0}
                                      max={100}
                                      step={1}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between items-center">
                                      <span className="text-xl font-bold text-green-600">{(field.value || 0)}%</span>
                                      <Input
                                        type="number"
                                        value={field.value || 0}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        className="w-20 text-right"
                                        min={0}
                                        max={100}
                                      />
                                    </div>
                                  </div>
                                </FieldWrapper>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Section>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error/Success Messages */}
                {saveError && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800">
                    {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-green-800">
                    Data saved successfully!
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between gap-4 pt-6 border-t-2 border-gray-200">
                  <Button
                    type="button"
                    onClick={onBack}
                    variant="outline"
                    className="border-2 border-gray-300 hover:bg-gray-100 px-6 py-6 text-lg"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSaving || !processRoute}
                    className="bg-gradient-to-r from-[#BA7967] to-[#a86b5c] hover:from-[#a86b5c] hover:to-[#BA7967] text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save & Continue
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </FormProvider>
  )
}
