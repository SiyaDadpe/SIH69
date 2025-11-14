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
  Factory, 
  Zap, 
  Droplet, 
  Leaf,
  Settings,
  Info,
  ArrowLeft,
  TrendingUp,
  Recycle
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Form schema
const formSchema = z.object({
  // Feed and Material Characteristics
  Product_Type: z.string().min(1, "Product type is required"),
  Input_Cathode_Purity_Cu: z.number().min(0).max(100),
  Scrap_Input: z.number().optional(),
  Alloying_Metal_Type: z.string().optional(),
  Alloying_Metal_Content: z.number().optional(),
  Moisture_Content: z.number().optional(),
  
  // Process and Equipment
  Casting_Method: z.string().min(1, "Casting method is required"),
  Furnace_Type: z.string().min(1, "Furnace type is required"),
  Melting_Energy_kWh_per_tonne_product: z.number().min(0, "Required"),
  Rolling_Energy_kWh_per_tonne_product: z.number().min(0, "Required"),
  Extrusion_Energy_kWh_per_tonne_product: z.number().optional(),
  Drawing_Energy_kWh_per_tonne_product: z.number().optional(),
  Electricity_Mix_Renewable: z.number().min(0, "Required"),
  Electricity_Mix_Fossil: z.number().min(0, "Required"),
  Cooling_Method: z.string().optional(),
  Annealing_Frequency: z.number().optional(),
  Surface_Treatment_Type: z.string().optional(),
  Surface_Treatment_Chemical_Use_kg_per_tonne_product: z.number().optional(),
  
  // Water and Environmental Data
  Process_Water_Consumption_m3_per_tonne_product: z.number().min(0, "Required"),
  Cooling_Water_Reused: z.number().optional(),
  Waste_Water_pH: z.number().optional(),
  Air_Emissions_PM_kg_per_tonne_product: z.number().optional(),
  GHG_Emissions_kgCO2e_per_tonne_product: z.number().optional(),
  Waste_Heat_Recovered: z.number().optional(),
  Solid_Waste_Generated_kg_per_tonne_product: z.number().optional(),
  
  // Production and Efficiency
  Scrap_Generated: z.number().min(0, "Required"),
  Scrap_Recycled_Onsite: z.number().optional(),
  Product_Yield: z.number().optional(),
  Operating_Hours_per_day: z.number().optional(),
  Plant_Capacity_t_per_day: z.number().optional(),
  Maintenance_Cost_USD_per_tonne_product: z.number().optional(),
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
        layoutId="selected-indicator-step4"
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

export default function Step4({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      Product_Type: "",
      Input_Cathode_Purity_Cu: 99.99,
      Scrap_Input: 0,
      Alloying_Metal_Content: 0,
      Moisture_Content: 0,
      Casting_Method: "",
      Furnace_Type: "",
      Melting_Energy_kWh_per_tonne_product: 0,
      Rolling_Energy_kWh_per_tonne_product: 0,
      Electricity_Mix_Renewable: 30,
      Electricity_Mix_Fossil: 70,
      Process_Water_Consumption_m3_per_tonne_product: 0,
      Scrap_Generated: 5,
      Cooling_Water_Reused: 80,
      Annealing_Frequency: 0,
      Scrap_Recycled_Onsite: 95,
      Product_Yield: 95,
      Waste_Heat_Recovered: 0,
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
                  <span className="text-sm font-medium">Step 4 of 7 - Smelting</span>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Semi-Fabrication & Product Manufacturing
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Enter manufacturing process details. Fields marked with ★ are required.
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
                
                {/* Feed and Material Characteristics */}
                <Section title="Feed and Material Characteristics" icon={Factory} defaultExpanded={true} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Product Type */}
                    <FormField
                      control={control}
                      name="Product_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Product Type" required>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                              {['wire rod', 'sheet', 'tube', 'bar', 'alloy'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Factory}
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
                      {/* Input Cathode Purity */}
                      <FormField
                        control={control}
                        name="Input_Cathode_Purity_Cu"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Input Cathode Purity (% Cu)" required tooltip="Copper purity in input cathodes">
                              <div className="space-y-3">
                                <Slider
                                  value={[field.value || 0]}
                                  onValueChange={(v) => field.onChange(v[0])}
                                  min={95}
                                  max={100}
                                  step={0.01}
                                  className="w-full"
                                />
                                <div className="flex justify-between items-center">
                                  <span className="text-2xl font-bold text-green-600">{(field.value || 0).toFixed(2)}%</span>
                                  <Input
                                    type="number"
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="w-28 text-right"
                                    step={0.01}
                                    min={95}
                                    max={100}
                                  />
                                </div>
                              </div>
                            </FieldWrapper>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Scrap Input */}
                      <FormField
                        control={control}
                        name="Scrap_Input"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Scrap Input (%)" tooltip="Percentage of recycled scrap in feed">
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
                                  max={20}
                                  step={0.1}
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

                      {/* Alloying Metal Type */}
                      <FormField
                        control={control}
                        name="Alloying_Metal_Type"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Alloying Metal Type" tooltip="Zn, Sn, Ni, etc.">
                              <Input 
                                placeholder="e.g., Zn, Sn, Ni" 
                                {...field} 
                                className="border-2 focus:border-[#BA7967]"
                              />
                            </FieldWrapper>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Alloying Metal Content */}
                      <FormField
                        control={control}
                        name="Alloying_Metal_Content"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Alloying Metal Content (%)">
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
                                  <span className="text-xl font-bold text-purple-600">{(field.value || 0).toFixed(1)}%</span>
                                  <Input
                                    type="number"
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right"
                                    min={0}
                                    max={50}
                                    step={0.5}
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

                {/* Process and Equipment */}
                <Section title="Process and Equipment" icon={Settings} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Casting Method */}
                    <FormField
                      control={control}
                      name="Casting_Method"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Casting Method" required>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {['continuous', 'batch'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Settings}
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

                    {/* Furnace Type */}
                    <FormField
                      control={control}
                      name="Furnace_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Furnace Type" required>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['induction', 'electric', 'gas'].map((type) => (
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
                      {/* Melting Energy */}
                      <FormField
                        control={control}
                        name="Melting_Energy_kWh_per_tonne_product"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Melting Energy (kWh/t product)" required>
                              <Input 
                                type="number" 
                                placeholder="e.g., 500" 
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

                      {/* Rolling Energy */}
                      <FormField
                        control={control}
                        name="Rolling_Energy_kWh_per_tonne_product"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Rolling Energy (kWh/t product)" required>
                              <Input 
                                type="number" 
                                placeholder="e.g., 300" 
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

                      {/* Extrusion Energy */}
                      <FormField
                        control={control}
                        name="Extrusion_Energy_kWh_per_tonne_product"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Extrusion Energy (kWh/t product)">
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

                      {/* Drawing Energy */}
                      <FormField
                        control={control}
                        name="Drawing_Energy_kWh_per_tonne_product"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Drawing Energy (kWh/t product)">
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
                    </div>

                    {/* Electricity Mix */}
                    <div className="space-y-4 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-green-600" />
                        Electricity Mix
                        <span className="text-red-500 text-sm">★ Required</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={control}
                          name="Electricity_Mix_Renewable"
                          render={({ field }) => (
                            <FormItem>
                              <FieldWrapper label="Renewable (%)">
                                <div className="space-y-3">
                                  <Slider
                                    value={[field.value || 0]}
                                    onValueChange={(v) => field.onChange(v[0])}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                  />
                                  <div className="text-center">
                                    <span className="text-2xl font-bold text-green-600">{(field.value || 0)}%</span>
                                  </div>
                                </div>
                              </FieldWrapper>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="Electricity_Mix_Fossil"
                          render={({ field }) => (
                            <FormItem>
                              <FieldWrapper label="Fossil (%)">
                                <div className="space-y-3">
                                  <Slider
                                    value={[field.value || 0]}
                                    onValueChange={(v) => field.onChange(v[0])}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                  />
                                  <div className="text-center">
                                    <span className="text-2xl font-bold text-orange-600">{(field.value || 0)}%</span>
                                  </div>
                                </div>
                              </FieldWrapper>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Cooling Method */}
                    <FormField
                      control={control}
                      name="Cooling_Method"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Cooling Method">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['air', 'water', 'oil'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Droplet}
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
                      {/* Annealing Frequency */}
                      <FormField
                        control={control}
                        name="Annealing_Frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Annealing Frequency (%)" tooltip="Percentage of production requiring annealing">
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

                      {/* Surface Treatment Chemical Use */}
                      <FormField
                        control={control}
                        name="Surface_Treatment_Chemical_Use_kg_per_tonne_product"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Surface Treatment Chemical Use (kg/t product)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 5" 
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

                    {/* Surface Treatment Type */}
                    <FormField
                      control={control}
                      name="Surface_Treatment_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Surface Treatment Type">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['pickling', 'plating', 'coating'].map((type) => (
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

                {/* Water and Environmental Data */}
                <Section title="Water and Environmental Data" icon={Leaf} required={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Process Water Consumption */}
                    <FormField
                      control={control}
                      name="Process_Water_Consumption_m3_per_tonne_product"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Process Water Consumption (m³/t product)" required>
                            <Input 
                              type="number" 
                              placeholder="e.g., 2.5" 
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

                    {/* Waste Water pH */}
                    <FormField
                      control={control}
                      name="Waste_Water_pH"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Waste Water pH">
                            <Input 
                              type="number" 
                              placeholder="e.g., 7.0" 
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

                    {/* Air Emissions PM */}
                    <FormField
                      control={control}
                      name="Air_Emissions_PM_kg_per_tonne_product"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Air Emissions PM (kg/t product)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 0.3" 
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
                      name="GHG_Emissions_kgCO2e_per_tonne_product"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="GHG Emissions (kgCO₂e/t product)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 800" 
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

                    {/* Solid Waste Generated */}
                    <FormField
                      control={control}
                      name="Solid_Waste_Generated_kg_per_tonne_product"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Solid Waste Generated (kg/t product)">
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
                  </div>

                  {/* Efficiency Sliders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Cooling Water Reused */}
                    <FormField
                      control={control}
                      name="Cooling_Water_Reused"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Cooling Water Reused (%)">
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

                    {/* Waste Heat Recovered */}
                    <FormField
                      control={control}
                      name="Waste_Heat_Recovered"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Waste Heat Recovered (%)">
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

                {/* Production and Efficiency */}
                <Section title="Production and Efficiency" icon={TrendingUp} required={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Scrap Generated */}
                    <FormField
                      control={control}
                      name="Scrap_Generated"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Scrap Generated (%)" required tooltip="Manufacturing scrap as % of input">
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
                                <span className="text-2xl font-bold text-red-600">{(field.value || 0).toFixed(1)}%</span>
                                <Input
                                  type="number"
                                  value={field.value || 0}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right"
                                  step={0.5}
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

                    {/* Scrap Recycled Onsite */}
                    <FormField
                      control={control}
                      name="Scrap_Recycled_Onsite"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Scrap Recycled Onsite (%)" tooltip="% of generated scrap recycled onsite">
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

                    {/* Product Yield */}
                    <FormField
                      control={control}
                      name="Product_Yield"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Product Yield (%)" tooltip="Final product as % of input material">
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

                    {/* Operating Hours per day */}
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

                    {/* Plant Capacity */}
                    <FormField
                      control={control}
                      name="Plant_Capacity_t_per_day"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Plant Capacity (t/day)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 1000" 
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

                    {/* Maintenance Cost */}
                    <FormField
                      control={control}
                      name="Maintenance_Cost_USD_per_tonne_product"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Maintenance Cost (USD/t product)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 25.00" 
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
