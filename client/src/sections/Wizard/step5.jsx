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
  Package, 
  Zap, 
  Wrench, 
  Truck,
  Leaf,
  Info,
  ArrowLeft,
  Activity,
  TrendingUp,
  Clock
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Form schema
const formSchema = z.object({
  // Product and Application Data
  Product_Type: z.string().min(1, "Product type is required"),
  Application_Sector: z.string().min(1, "Application sector is required"),
  Product_Lifetime_years: z.number().optional(),
  Installation_Method: z.string().optional(),
  Service_Weight_kg_per_unit: z.number().optional(),
  Operating_Temperature_C: z.number().optional(),
  Environment_Type: z.string().optional(),
  
  // Performance and Efficiency
  Efficiency_Rating: z.number().min(0, "Required"),
  Energy_Savings_vs_Alternative: z.number().min(0, "Required"),
  Average_Annual_Use_Energy_kWh: z.number().min(0, "Required"),
  Copper_Loss_during_Use: z.number().optional(),
  Operating_Hours_per_year: z.number().optional(),
  Failure_Rate: z.number().optional(),
  Replacement_Cycle_years: z.number().optional(),
  
  // Maintenance and Resource Use
  Maintenance_Frequency_per_year: z.number().min(0, "Required"),
  Maintenance_Material_Use_kg_per_year: z.number().optional(),
  Lubricant_or_Cleaner_Use_L_per_year: z.number().optional(),
  Downtime_Hours_per_year: z.number().optional(),
  
  // Transport and Installation
  Transportation_Distance_km: z.number().optional(),
  Transportation_Mode: z.string().optional(),
  Packaging_Material_kg_per_unit: z.number().optional(),
  
  // Environmental Impacts / Benefits
  GHG_Avoided_through_Efficiency_kgCO2e_per_unit: z.number().optional(),
  Reuse_Potential: z.number().optional(),
  Energy_Return_on_Investment: z.number().optional(),
  Use_Phase_Water_Consumption_L_per_year: z.number().optional(),
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
        layoutId="selected-indicator-step5"
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

export default function Step5({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      Product_Type: "",
      Application_Sector: "",
      Product_Lifetime_years: 20,
      Installation_Method: "",
      Environment_Type: "",
      Efficiency_Rating: 90,
      Energy_Savings_vs_Alternative: 15,
      Average_Annual_Use_Energy_kWh: 0,
      Copper_Loss_during_Use: 0.1,
      Failure_Rate: 1,
      Maintenance_Frequency_per_year: 0,
      Transportation_Mode: "",
      Reuse_Potential: 80,
      Energy_Return_on_Investment: 0,
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
                  <span className="text-sm font-medium">Step 5 of 7 - Manufacturing</span>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Use Phase
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Enter product usage and performance data. Fields marked with ★ are required.
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
                
                {/* Product and Application Data */}
                <Section title="Product and Application Data" icon={Package} defaultExpanded={true} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Product Type */}
                    <FormField
                      control={control}
                      name="Product_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Product Type" required>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {['wire', 'motor', 'component', 'tube'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Package}
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

                    {/* Application Sector */}
                    <FormField
                      control={control}
                      name="Application_Sector"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Application Sector" required>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {['electrical', 'construction', 'transport', 'others'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Activity}
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

                    {/* Installation Method */}
                    <FormField
                      control={control}
                      name="Installation_Method"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Installation Method">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {['permanent', 'temporary'].map((type) => (
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

                    {/* Environment Type */}
                    <FormField
                      control={control}
                      name="Environment_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Environment Type">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {['indoor', 'outdoor', 'humid', 'corrosive'].map((type) => (
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
                      {/* Product Lifetime */}
                      <FormField
                        control={control}
                        name="Product_Lifetime_years"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Product Lifetime (years)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 20" 
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

                      {/* Service Weight */}
                      <FormField
                        control={control}
                        name="Service_Weight_kg_per_unit"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Service Weight (kg/unit)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 10.5" 
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

                      {/* Operating Temperature */}
                      <FormField
                        control={control}
                        name="Operating_Temperature_C"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Operating Temperature (°C)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 75" 
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

                {/* Performance and Efficiency */}
                <Section title="Performance and Efficiency" icon={Zap} required={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Efficiency Rating */}
                    <FormField
                      control={control}
                      name="Efficiency_Rating"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Efficiency Rating (%)" required>
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

                    {/* Energy Savings vs Alternative */}
                    <FormField
                      control={control}
                      name="Energy_Savings_vs_Alternative"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Energy Savings vs Alternative (%)" required>
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

                    {/* Average Annual Use Energy */}
                    <FormField
                      control={control}
                      name="Average_Annual_Use_Energy_kWh"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Average Annual Use Energy (kWh)" required>
                            <Input 
                              type="number" 
                              placeholder="e.g., 5000" 
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

                    {/* Copper Loss during Use */}
                    <FormField
                      control={control}
                      name="Copper_Loss_during_Use"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Copper Loss during Use (%)">
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
                                <span className="text-xl font-bold text-red-600">{(field.value || 0).toFixed(1)}%</span>
                                <Input
                                  type="number"
                                  value={field.value || 0}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right"
                                  step={0.1}
                                  min={0}
                                  max={10}
                                />
                              </div>
                            </div>
                          </FieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Operating Hours per year */}
                    <FormField
                      control={control}
                      name="Operating_Hours_per_year"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Operating Hours per Year">
                            <Input 
                              type="number" 
                              placeholder="e.g., 8760" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              value={field.value || ""}
                              max={8760}
                              className="border-2 focus:border-[#BA7967]"
                            />
                          </FieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Failure Rate */}
                    <FormField
                      control={control}
                      name="Failure_Rate"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Failure Rate (%)">
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
                                <span className="text-xl font-bold text-orange-600">{(field.value || 0).toFixed(1)}%</span>
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

                    {/* Replacement Cycle */}
                    <FormField
                      control={control}
                      name="Replacement_Cycle_years"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Replacement Cycle (years)">
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
                  </div>
                </Section>

                {/* Maintenance and Resource Use */}
                <Section title="Maintenance and Resource Use" icon={Wrench} required={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Maintenance Frequency */}
                    <FormField
                      control={control}
                      name="Maintenance_Frequency_per_year"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Maintenance Frequency (per year)" required>
                            <Input 
                              type="number" 
                              placeholder="e.g., 4" 
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

                    {/* Maintenance Material Use */}
                    <FormField
                      control={control}
                      name="Maintenance_Material_Use_kg_per_year"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Maintenance Material Use (kg/year)">
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

                    {/* Lubricant or Cleaner Use */}
                    <FormField
                      control={control}
                      name="Lubricant_or_Cleaner_Use_L_per_year"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Lubricant or Cleaner Use (L/year)">
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

                    {/* Downtime Hours */}
                    <FormField
                      control={control}
                      name="Downtime_Hours_per_year"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Downtime Hours per Year">
                            <Input 
                              type="number" 
                              placeholder="e.g., 24" 
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
                </Section>

                {/* Transport and Installation */}
                <Section title="Transport and Installation" icon={Truck}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Transportation Mode */}
                    <FormField
                      control={control}
                      name="Transportation_Mode"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Transportation Mode">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['truck', 'ship', 'rail'].map((type) => (
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Transportation Distance */}
                      <FormField
                        control={control}
                        name="Transportation_Distance_km"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Transportation Distance (km)">
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

                      {/* Packaging Material */}
                      <FormField
                        control={control}
                        name="Packaging_Material_kg_per_unit"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Packaging Material (kg/unit)">
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
                    </div>
                  </div>
                </Section>

                {/* Environmental Impacts / Benefits */}
                <Section title="Environmental Impacts / Benefits" icon={Leaf}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* GHG Avoided */}
                    <FormField
                      control={control}
                      name="GHG_Avoided_through_Efficiency_kgCO2e_per_unit"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="GHG Avoided through Efficiency (kgCO₂e/unit)" tooltip="CO2 emissions avoided due to product efficiency">
                            <Input 
                              type="number" 
                              placeholder="e.g., 1500" 
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

                    {/* Use Phase Water Consumption */}
                    <FormField
                      control={control}
                      name="Use_Phase_Water_Consumption_L_per_year"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Use Phase Water Consumption (L/year)">
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

                    {/* Reuse Potential */}
                    <FormField
                      control={control}
                      name="Reuse_Potential"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Reuse Potential (%)">
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

                    {/* Energy Return on Investment */}
                    <FormField
                      control={control}
                      name="Energy_Return_on_Investment"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Energy Return on Investment (%)">
                            <div className="space-y-3">
                              <Slider
                                value={[field.value || 0]}
                                onValueChange={(v) => field.onChange(v[0])}
                                min={0}
                                max={500}
                                step={5}
                                className="w-full"
                              />
                              <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-green-600">{(field.value || 0)}%</span>
                                <Input
                                  type="number"
                                  value={field.value || 0}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right"
                                  min={0}
                                  max={500}
                                  step={5}
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
