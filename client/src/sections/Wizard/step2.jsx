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
  Beaker, 
  Zap, 
  Droplet, 
  Leaf,
  DollarSign,
  Info,
  ArrowLeft,
  Settings
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Form schema
const formSchema = z.object({
  // Ore and Material Characteristics
  Ore_Type: z.string().min(1, "Ore type is required"),
  Ore_Grade_Cu: z.number().min(0).max(100),
  Concentrate_Grade_Cu: z.number().min(0).max(100),
  Mineralogy_Details: z.string().optional(),
  Particle_Size_After_Grinding_μm: z.number().optional(),
  Moisture_Content: z.number().optional(),
  
  // Process and Equipment
  Grinding_Energy_kWh_per_tonne_ore: z.number().min(0, "Required"),
  Reagent_Consumption_kg_per_tonne_ore: z.number().min(0, "Required"),
  Reagent_Type: z.string().optional(),
  Reagent_Mix_Ratio: z.number().optional(),
  Flotation_Cell_Type: z.string().optional(),
  Thickener_Efficiency: z.number().optional(),
  Filtration_Type: z.string().optional(),
  Equipment_Age_years: z.number().optional(),
  Mill_Loading: z.number().optional(),
  
  // Water and Resource Use
  Water_Consumption_m3_per_tonne_ore: z.number().min(0, "Required"),
  Water_Recycled: z.number().min(0, "Required"),
  Water_Source: z.string().optional(),
  Process_Water_Temperature_C: z.number().optional(),
  Slurry_Pumping_Distance_km: z.number().optional(),
  
  // Outputs and Environmental Data
  Recovery_Efficiency: z.number().min(0, "Required"),
  Tailings_Produced_tonne_per_tonne_ore: z.number().optional(),
  Tailings_Solids_Content: z.number().optional(),
  Tailings_Storage_Type: z.string().optional(),
  Chemical_Residue_in_Tailings_mg_per_L: z.number().optional(),
  Air_Emissions_PM_kg_per_tonne_ore: z.number().optional(),
  Wastewater_pH: z.number().optional(),
  Wastewater_COD_mg_per_L: z.number().optional(),
  GHG_Emissions_kgCO2e_per_tonne_ore: z.number().optional(),
  
  // Operational and Economic Data
  Plant_Capacity_t_per_day: z.number().optional(),
  Operating_Hours_per_day: z.number().optional(),
  Power_Cost_USD_per_kWh: z.number().optional(),
  Reagent_Cost_USD_per_kg: z.number().optional(),
  Maintenance_Cost_USD_per_tonne_ore: z.number().optional(),
})

// Option button component
const OptionButton = ({ selected, onClick, children, icon: Icon }) => (
  <motion.button
    type="button"
    onClick={onClick}
    className={`
      relative px-4 py-3 rounded-lg border-2 transition-all duration-300
      flex items-center gap-2 justify-center font-medium
      ${selected 
        ? 'border-[#BA7967] bg-[#BA7967] text-white shadow-lg shadow-[#BA7967]/30' 
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
        layoutId="selected-indicator-step2"
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

// Section component with collapse
const Section = ({ title, icon: Icon, children, defaultExpanded = true, required = false }) => {
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
            <div className="p-2 bg-[#BA7967] rounded-lg">
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

export default function Step2({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      Ore_Type: "",
      Ore_Grade_Cu: 0.5,
      Concentrate_Grade_Cu: 25,
      Grinding_Energy_kWh_per_tonne_ore: 0,
      Reagent_Consumption_kg_per_tonne_ore: 0,
      Water_Consumption_m3_per_tonne_ore: 0,
      Water_Recycled: 80,
      Recovery_Efficiency: 90,
      Thickener_Efficiency: 0,
      Mill_Loading: 0,
      Moisture_Content: 0,
      Reagent_Mix_Ratio: 0,
      Tailings_Solids_Content: 0,
    },
    mode: "onChange",
  })

  const { handleSubmit, control, formState: { isValid, errors } } = form

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
                  <span className="text-sm font-medium">Step 2 of 7</span>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Beneficiation Process
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Enter ore processing and concentration details. Fields marked with ★ are required.
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
                
                {/* Ore and Material Characteristics */}
                <Section title="Ore and Material Characteristics" icon={Beaker} defaultExpanded={true} required={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Ore Type */}
                    <FormField
                      control={control}
                      name="Ore_Type"
                      render={({ field }) => (
                        <FormItem className="col-span-full md:col-span-1">
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

                    {/* Ore Grade %Cu */}
                    <FormField
                      control={control}
                      name="Ore_Grade_Cu"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Ore Grade (% Cu)" required tooltip="Copper content in feed ore">
                            <div className="space-y-3">
                              <Slider
                                value={[field.value || 0]}
                                onValueChange={(v) => field.onChange(v[0])}
                                min={0}
                                max={10}
                                step={0.1}
                                className="w-full"
                              />
                              <div className="flex justify-between items-center">
                                <span className="text-2xl font-bold text-[#BA7967]">{(field.value || 0).toFixed(2)}%</span>
                                <Input
                                  type="number"
                                  value={field.value || 0}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right"
                                  step={0.1}
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

                    {/* Concentrate Grade %Cu */}
                    <FormField
                      control={control}
                      name="Concentrate_Grade_Cu"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Concentrate Grade (% Cu)" required tooltip="Copper content in final concentrate">
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

                    {/* Mineralogy Details */}
                    <FormField
                      control={control}
                      name="Mineralogy_Details"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Mineralogy Details" tooltip="e.g., chalcopyrite, bornite, malachite">
                            <Input 
                              placeholder="e.g., chalcopyrite" 
                              {...field} 
                              className="border-2 focus:border-[#BA7967]"
                            />
                          </FieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Particle Size */}
                    <FormField
                      control={control}
                      name="Particle_Size_After_Grinding_μm"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Particle Size After Grinding (μm)" tooltip="P80 grind size">
                            <Input 
                              type="number" 
                              placeholder="e.g., 150" 
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
                  </div>
                </Section>

                {/* Process and Equipment */}
                <Section title="Process and Equipment" icon={Settings} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Grinding Energy */}
                      <FormField
                        control={control}
                        name="Grinding_Energy_kWh_per_tonne_ore"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Grinding Energy (kWh/t ore)" required>
                              <Input 
                                type="number" 
                                placeholder="e.g., 15" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                value={field.value || ""}
                                className="border-2 focus:border-[#BA7967]"
                              />
                            </FieldWrapper>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Reagent Consumption */}
                      <FormField
                        control={control}
                        name="Reagent_Consumption_kg_per_tonne_ore"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Reagent Consumption (kg/t ore)" required>
                              <Input 
                                type="number" 
                                placeholder="e.g., 0.5" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                value={field.value || ""}
                                className="border-2 focus:border-[#BA7967]"
                              />
                            </FieldWrapper>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Equipment Age */}
                      <FormField
                        control={control}
                        name="Equipment_Age_years"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Equipment Age (years)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 10" 
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

                    {/* Reagent Type */}
                    <FormField
                      control={control}
                      name="Reagent_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Reagent Type">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['collector', 'frother', 'modifier'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Beaker}
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
                      {/* Reagent Mix Ratio */}
                      <FormField
                        control={control}
                        name="Reagent_Mix_Ratio"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Reagent Mix Ratio (%)">
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
                                  <span className="text-xl font-bold text-[#BA7967]">{(field.value || 0)}%</span>
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

                      {/* Thickener Efficiency */}
                      <FormField
                        control={control}
                        name="Thickener_Efficiency"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Thickener Efficiency (%)">
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

                      {/* Mill Loading */}
                      <FormField
                        control={control}
                        name="Mill_Loading"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Mill Loading (%)">
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
                                  <span className="text-xl font-bold text-orange-600">{(field.value || 0)}%</span>
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

                    {/* Flotation Cell Type */}
                    <FormField
                      control={control}
                      name="Flotation_Cell_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Flotation Cell Type">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['mechanical', 'column', 'pneumatic'].map((type) => (
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

                    {/* Filtration Type */}
                    <FormField
                      control={control}
                      name="Filtration_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Filtration Type">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {['vacuum', 'pressure'].map((type) => (
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
                  </div>
                </Section>

                {/* Water and Resource Use */}
                <Section title="Water and Resource Use" icon={Droplet} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Water Source */}
                    <FormField
                      control={control}
                      name="Water_Source"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Water Source">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['ground', 'recycled', 'surface'].map((source) => (
                                <OptionButton
                                  key={source}
                                  selected={field.value === source}
                                  onClick={() => field.onChange(field.value === source ? "" : source)}
                                  icon={Droplet}
                                >
                                  {source.charAt(0).toUpperCase() + source.slice(1)}
                                </OptionButton>
                              ))}
                            </div>
                          </FieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Water Consumption */}
                      <FormField
                        control={control}
                        name="Water_Consumption_m3_per_tonne_ore"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Water Consumption (m³/t ore)" required>
                              <Input 
                                type="number" 
                                placeholder="e.g., 1.5" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                value={field.value || ""}
                                className="border-2 focus:border-[#BA7967]"
                              />
                            </FieldWrapper>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Water Recycled */}
                      <FormField
                        control={control}
                        name="Water_Recycled"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Water Recycled (%)" required>
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

                      {/* Process Water Temperature */}
                      <FormField
                        control={control}
                        name="Process_Water_Temperature_C"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Process Water Temperature (°C)">
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

                      {/* Slurry Pumping Distance */}
                      <FormField
                        control={control}
                        name="Slurry_Pumping_Distance_km"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Slurry Pumping Distance (km)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 2.5" 
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

                {/* Outputs and Environmental Data */}
                <Section title="Outputs and Environmental Data" icon={Leaf} required={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Recovery Efficiency */}
                    <FormField
                      control={control}
                      name="Recovery_Efficiency"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Recovery Efficiency (%)" required tooltip="Copper recovery from ore to concentrate">
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

                    {/* Tailings Produced */}
                    <FormField
                      control={control}
                      name="Tailings_Produced_tonne_per_tonne_ore"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Tailings Produced (t/t ore)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 0.95" 
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

                    {/* Tailings Solids Content */}
                    <FormField
                      control={control}
                      name="Tailings_Solids_Content"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Tailings Solids Content (%)">
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
                                <span className="text-xl font-bold text-orange-600">{(field.value || 0)}%</span>
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

                    {/* Chemical Residue */}
                    <FormField
                      control={control}
                      name="Chemical_Residue_in_Tailings_mg_per_L"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Chemical Residue in Tailings (mg/L)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 5.2" 
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

                    {/* Air Emissions */}
                    <FormField
                      control={control}
                      name="Air_Emissions_PM_kg_per_tonne_ore"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Air Emissions PM (kg/t ore)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 0.2" 
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

                    {/* Wastewater pH */}
                    <FormField
                      control={control}
                      name="Wastewater_pH"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Wastewater pH">
                            <Input 
                              type="number" 
                              placeholder="e.g., 7.5" 
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

                    {/* Wastewater COD */}
                    <FormField
                      control={control}
                      name="Wastewater_COD_mg_per_L"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Wastewater COD (mg/L)" tooltip="Chemical Oxygen Demand">
                            <Input 
                              type="number" 
                              placeholder="e.g., 150" 
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

                    {/* GHG Emissions */}
                    <FormField
                      control={control}
                      name="GHG_Emissions_kgCO2e_per_tonne_ore"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="GHG Emissions (kgCO₂e/t ore)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 12.5" 
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

                  {/* Tailings Storage Type */}
                  <FormField
                    control={control}
                    name="Tailings_Storage_Type"
                    render={({ field }) => (
                      <FormItem>
                        <FieldWrapper label="Tailings Storage Type">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {['wet', 'dry', 'paste'].map((type) => (
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
                </Section>

                {/* Operational and Economic Data */}
                <Section title="Operational and Economic Data" icon={DollarSign} defaultExpanded={false}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={control}
                      name="Plant_Capacity_t_per_day"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Plant Capacity (t/day)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 50000" 
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

                    <FormField
                      control={control}
                      name="Operating_Hours_per_day"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Operating Hours per Day">
                            <Input 
                              type="number" 
                              placeholder="e.g., 24" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              value={field.value || ""}
                              max={24}
                              className="border-2 focus:border-[#BA7967]"
                            />
                          </FieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="Power_Cost_USD_per_kWh"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Power Cost (USD/kWh)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 0.10" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              value={field.value || ""}
                              step={0.01}
                              className="border-2 focus:border-[#BA7967]"
                            />
                          </FieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="Reagent_Cost_USD_per_kg"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Reagent Cost (USD/kg)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 2.50" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              value={field.value || ""}
                              step={0.01}
                              className="border-2 focus:border-[#BA7967]"
                            />
                          </FieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="Maintenance_Cost_USD_per_tonne_ore"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Maintenance Cost (USD/t ore)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 1.50" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              value={field.value || ""}
                              step={0.01}
                              className="border-2 focus:border-[#BA7967]"
                            />
                          </FieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Section>

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
                    disabled={isSaving}
                    className="bg-gradient-to-r from-[#BA7967] to-[#a86b5c] hover:from-[#a86b5c] hover:to-[#BA7967] text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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
