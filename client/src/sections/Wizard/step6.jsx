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
  Recycle, 
  Zap, 
  Droplet, 
  Leaf,
  Settings,
  Info,
  ArrowLeft,
  TrendingUp,
  Truck,
  DollarSign,
  Factory,
  Filter
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Form schema
const formSchema = z.object({
  // Scrap Collection & Source
  Scrap_Type: z.string().min(1, "Scrap type is required"),
  Collection_Rate: z.number().min(0, "Required"),
  Collection_Area: z.string().optional(),
  Average_Scrap_Quality_Grade: z.string().optional(),
  Product_Sector_Source: z.string().optional(),
  
  // Sorting and Pre-Treatment
  Sorting_Technology: z.string().min(1, "Required"),
  Sorting_Efficiency: z.number().optional(),
  Contamination_Level: z.number().min(0, "Required"),
  Pre_Treatment_Process: z.string().optional(),
  Pre_Treatment_Energy_kWh_per_tonne_scrap: z.number().optional(),
  Labor_Intensity_hours_per_tonne: z.number().optional(),
  
  // Remelting and Refining
  Remelting_Energy_kWh_per_tonne_scrap: z.number().min(0, "Required"),
  Refining_Energy_kWh_per_tonne_scrap: z.number().optional(),
  Furnace_Type: z.string().optional(),
  Melting_Temperature_C: z.number().optional(),
  Metal_Loss_in_Slag: z.number().optional(),
  Slag_Generation_kg_per_tonne_scrap: z.number().optional(),
  Recovered_Copper_Purity: z.number().optional(),
  
  // Output & Circularity
  Recovery_Yield: z.number().min(0, "Required"),
  Recycled_Content: z.number().min(0, "Required"),
  Recycled_Output_Form: z.string().optional(),
  Slag_Recycled: z.number().optional(),
  By_Product_Recovery_kg_per_tonne_Cu: z.number().optional(),
  
  // Water, Energy & Emissions
  Water_Consumption_m3_per_tonne_scrap: z.number().optional(),
  Recycled_Water: z.number().optional(),
  GHG_Emissions_kgCO2e_per_tonne_scrap: z.number().optional(),
  Dust_Emissions_PM_kg_per_tonne_scrap: z.number().optional(),
  Residue_Disposal_kg_per_tonne_scrap: z.number().optional(),
  Energy_Source_Mix: z.string().optional(),
  
  // Logistics & Economic Data
  Transportation_Distance_km: z.number().optional(),
  Transport_Mode: z.string().optional(),
  Scrap_Price_USD_per_tonne: z.number().optional(),
  Recycled_Product_Value_USD_per_tonne: z.number().optional(),
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
        layoutId="selected-indicator-step6"
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

export default function Step6({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      Scrap_Type: "",
      Collection_Rate: 75,
      Collection_Area: "",
      Product_Sector_Source: "",
      Sorting_Technology: "",
      Sorting_Efficiency: 95,
      Contamination_Level: 5,
      Pre_Treatment_Process: "",
      Remelting_Energy_kWh_per_tonne_scrap: 0,
      Furnace_Type: "",
      Recovery_Yield: 95,
      Recycled_Content: 30,
      Recycled_Output_Form: "",
      Slag_Recycled: 50,
      Recycled_Water: 80,
      Energy_Source_Mix: "",
      Transport_Mode: "",
      Metal_Loss_in_Slag: 2,
      Recovered_Copper_Purity: 99,
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
                  <span className="text-sm font-medium">Step 6 of 7 - Recycling</span>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  End of Life and Recycling
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Enter recycling and recovery process data. Fields marked with ★ are required.
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
                
                {/* Scrap Collection & Source */}
                <Section title="Scrap Collection & Source" icon={Recycle} defaultExpanded={true} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Scrap Type */}
                    <FormField
                      control={control}
                      name="Scrap_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Scrap Type" required>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {['pre-consumer', 'post-consumer', 'E-waste', 'mixed'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Recycle}
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

                    {/* Collection Area */}
                    <FormField
                      control={control}
                      name="Collection_Area"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Collection Area">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['urban', 'industrial', 'rural'].map((type) => (
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

                    {/* Product Sector Source */}
                    <FormField
                      control={control}
                      name="Product_Sector_Source"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Product Sector Source">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {['construction', 'transport', 'electronics', 'machinery'].map((type) => (
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Collection Rate */}
                      <FormField
                        control={control}
                        name="Collection_Rate"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Collection Rate (%)" required>
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
                                  <span className="text-2xl font-bold text-green-600">{(field.value || 0)}%</span>
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

                      {/* Average Scrap Quality Grade */}
                      <FormField
                        control={control}
                        name="Average_Scrap_Quality_Grade"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Average Scrap Quality Grade" tooltip="Quality grade or classification of collected scrap">
                              <Input 
                                placeholder="e.g., Grade A, B, C" 
                                {...field} 
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

                {/* Sorting and Pre-Treatment */}
                <Section title="Sorting and Pre-Treatment" icon={Filter} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Pre-Treatment Process */}
                    <FormField
                      control={control}
                      name="Pre_Treatment_Process"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Pre-Treatment Process">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['shredding', 'de-coating', 'manual'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
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
                      {/* Sorting Technology */}
                      <FormField
                        control={control}
                        name="Sorting_Technology"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Sorting Technology" required>
                              <Input 
                                placeholder="e.g., XRF, eddy current" 
                                {...field} 
                                className="border-2 focus:border-[#BA7967]"
                              />
                            </FieldWrapper>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Pre-Treatment Energy */}
                      <FormField
                        control={control}
                        name="Pre_Treatment_Energy_kWh_per_tonne_scrap"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Pre-Treatment Energy (kWh/t scrap)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 50" 
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

                      {/* Labor Intensity */}
                      <FormField
                        control={control}
                        name="Labor_Intensity_hours_per_tonne"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Labor Intensity (hours/t)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 2.5" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                value={field.value || ""}
                                step={0.1}
                                className="border-2 focus:border-[#BA7967]"
                              />
                            </FieldWrapper>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Sorting Efficiency */}
                      <FormField
                        control={control}
                        name="Sorting_Efficiency"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Sorting Efficiency (%)">
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

                      {/* Contamination Level */}
                      <FormField
                        control={control}
                        name="Contamination_Level"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Contamination Level (%)" required>
                              <div className="space-y-3">
                                <Slider
                                  value={[field.value || 0]}
                                  onValueChange={(v) => field.onChange(v[0])}
                                  min={0}
                                  max={50}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="flex justify-between items-center">
                                  <span className="text-xl font-bold text-red-600">{(field.value || 0)}%</span>
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
                  </div>
                </Section>

                {/* Remelting and Refining */}
                <Section title="Remelting and Refining" icon={Factory} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Furnace Type */}
                    <FormField
                      control={control}
                      name="Furnace_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Furnace Type">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['induction', 'shaft', 'rotary'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Factory}
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
                      {/* Remelting Energy */}
                      <FormField
                        control={control}
                        name="Remelting_Energy_kWh_per_tonne_scrap"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Remelting Energy (kWh/t scrap)" required>
                              <Input 
                                type="number" 
                                placeholder="e.g., 400" 
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

                      {/* Refining Energy */}
                      <FormField
                        control={control}
                        name="Refining_Energy_kWh_per_tonne_scrap"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Refining Energy (kWh/t scrap)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 200" 
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

                      {/* Melting Temperature */}
                      <FormField
                        control={control}
                        name="Melting_Temperature_C"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Melting Temperature (°C)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 1200" 
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

                      {/* Slag Generation */}
                      <FormField
                        control={control}
                        name="Slag_Generation_kg_per_tonne_scrap"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Slag Generation (kg/t scrap)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 100" 
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
                                  step={0.5}
                                  className="w-full"
                                />
                                <div className="flex justify-between items-center">
                                  <span className="text-xl font-bold text-red-600">{(field.value || 0).toFixed(1)}%</span>
                                  <Input
                                    type="number"
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right"
                                    step={0.5}
                                    min={0}
                                    max={20}
                                  />
                                </div>
                              </div>
                            </FieldWrapper>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Recovered Copper Purity */}
                      <FormField
                        control={control}
                        name="Recovered_Copper_Purity"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Recovered Copper Purity (%)">
                              <div className="space-y-3">
                                <Slider
                                  value={[field.value || 0]}
                                  onValueChange={(v) => field.onChange(v[0])}
                                  min={90}
                                  max={100}
                                  step={0.1}
                                  className="w-full"
                                />
                                <div className="flex justify-between items-center">
                                  <span className="text-xl font-bold text-green-600">{(field.value || 0).toFixed(1)}%</span>
                                  <Input
                                    type="number"
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right"
                                    step={0.1}
                                    min={90}
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
                  </div>
                </Section>

                {/* Output & Circularity */}
                <Section title="Output & Circularity" icon={TrendingUp} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Recycled Output Form */}
                    <FormField
                      control={control}
                      name="Recycled_Output_Form"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Recycled Output Form">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['billet', 'rod', 'alloy'].map((type) => (
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Recovery Yield */}
                      <FormField
                        control={control}
                        name="Recovery_Yield"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Recovery Yield (%)" required tooltip="Percentage of copper recovered from scrap input">
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
                                  <span className="text-2xl font-bold text-green-600">{(field.value || 0)}%</span>
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

                      {/* Recycled Content */}
                      <FormField
                        control={control}
                        name="Recycled_Content"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Recycled Content (%)" required tooltip="Percentage of recycled material in output">
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
                                  <span className="text-2xl font-bold text-green-600">{(field.value || 0)}%</span>
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

                      {/* Slag Recycled */}
                      <FormField
                        control={control}
                        name="Slag_Recycled"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Slag Recycled (%)">
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

                      {/* By-Product Recovery */}
                      <FormField
                        control={control}
                        name="By_Product_Recovery_kg_per_tonne_Cu"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="By-Product Recovery (kg/t Cu)">
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
                  </div>
                </Section>

                {/* Water, Energy & Emissions */}
                <Section title="Water, Energy & Emissions" icon={Leaf}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Energy Source Mix */}
                    <FormField
                      control={control}
                      name="Energy_Source_Mix"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Energy Source Mix">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {['renewable', 'fossil'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Zap}
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
                      {/* Water Consumption */}
                      <FormField
                        control={control}
                        name="Water_Consumption_m3_per_tonne_scrap"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Water Consumption (m³/t scrap)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 1.5" 
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
                        name="GHG_Emissions_kgCO2e_per_tonne_scrap"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="GHG Emissions (kgCO₂e/t scrap)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 500" 
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

                      {/* Dust Emissions */}
                      <FormField
                        control={control}
                        name="Dust_Emissions_PM_kg_per_tonne_scrap"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Dust Emissions PM (kg/t scrap)">
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

                      {/* Residue Disposal */}
                      <FormField
                        control={control}
                        name="Residue_Disposal_kg_per_tonne_scrap"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Residue Disposal (kg/t scrap)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 50" 
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

                      {/* Recycled Water */}
                      <FormField
                        control={control}
                        name="Recycled_Water"
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
                    </div>
                  </div>
                </Section>

                {/* Logistics & Economic Data */}
                <Section title="Logistics & Economic Data" icon={DollarSign}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Transport Mode */}
                    <FormField
                      control={control}
                      name="Transport_Mode"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Transport Mode">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['truck', 'rail', 'ship'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Truck}
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
                      {/* Transportation Distance */}
                      <FormField
                        control={control}
                        name="Transportation_Distance_km"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Transportation Distance (km)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 100" 
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

                      {/* Scrap Price */}
                      <FormField
                        control={control}
                        name="Scrap_Price_USD_per_tonne"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Scrap Price (USD/t)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 5000" 
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

                      {/* Recycled Product Value */}
                      <FormField
                        control={control}
                        name="Recycled_Product_Value_USD_per_tonne"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Recycled Product Value (USD/t)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 7000" 
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
