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
  Mountain, 
  Zap, 
  Droplet, 
  Leaf,
  DollarSign,
  Info
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Form schema with all fields
const formSchema = z.object({
  // General Site and Ore Details
  Mining_Method: z.string().min(1, "Mining method is required"),
  Ore_Type: z.string().min(1, "Ore type is required"),
  Ore_Grade_Cu: z.number().min(0).max(100),
  Region_or_Country: z.string().min(1, "Region/Country is required"),
  Deposit_Depth_m: z.number().optional(),
  Bench_Height_m: z.number().optional(),
  Rock_Hardness_Index: z.number().optional(),
  
  // Material Ratios
  Overburden_or_Waste_Rock_Ratio: z.number().min(0, "Required"),
  Stripping_Ratio: z.number().optional(),
  Tailings_Generation_Rate: z.number().optional(),
  
  // Production and Operations
  Mine_Production_t_per_day: z.number().min(0, "Required"),
  Average_Haul_Distance_km: z.number().min(0, "Required"),
  Mine_Lifetime_years: z.number().optional(),
  Ore_Throughput_t_per_year: z.number().optional(),
  Shift_Hours_per_Day: z.number().optional(),
  Equipment_Availability: z.number().optional(),
  
  // Equipment and Energy
  Equipment_Type: z.string().min(1, "Equipment type is required"),
  Equipment_Count: z.number().optional(),
  Equipment_Capacity_t: z.number().optional(),
  Explosives_Used_kg_per_tonne_ore: z.number().optional(),
  Fuel_Consumption_L_per_tonne_ore: z.number().min(0, "Required"),
  Electricity_Consumption_kWh_per_tonne_ore: z.number().min(0, "Required"),
  Power_Source_Renewable: z.number().optional(),
  Power_Source_Fossil: z.number().optional(),
  Power_Source_Grid: z.number().optional(),
  Energy_Efficiency_of_Machines: z.number().optional(),
  
  // Water and Environmental Management
  Water_Consumption_m3_per_tonne_ore: z.number().min(0, "Required"),
  Water_Source: z.string().min(1, "Water source is required"),
  Water_Reuse_Rate: z.number().optional(),
  Water_Discharge_Quality_pH: z.number().optional(),
  Acid_Mine_Drainage_Risk: z.string().optional(),
  
  // Emissions and Land Impact
  Direct_GHG_Emissions_kgCO2e_per_tonne_ore: z.number().optional(),
  Dust_Emissions_PM10_kg_per_tonne_ore: z.number().optional(),
  Noise_Level_dB: z.number().optional(),
  Land_Disturbed_m2_per_tonne_ore: z.number().optional(),
  Rehabilitation_Area_ha_per_year: z.number().optional(),
  Biodiversity_Impact_Score: z.number().optional(),
  
  // Economic and Process Data
  Ore_Recovery: z.number().optional(),
  Ore_Loss: z.number().optional(),
  Mining_Cost_USD_per_tonne_ore: z.number().optional(),
  Diesel_Price_USD_per_Litre: z.number().optional(),
  Electricity_Cost_USD_per_kWh: z.number().optional(),
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
        layoutId="selected-indicator"
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

// Field with label and optional indicator
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

export default function EnhancedMiningStep({ onNext, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      Mining_Method: "",
      Ore_Type: "",
      Ore_Grade_Cu: 0.5,
      Region_or_Country: "",
      Equipment_Type: "",
      Water_Source: "",
      Power_Source_Renewable: 0,
      Power_Source_Fossil: 0,
      Power_Source_Grid: 0,
      Overburden_or_Waste_Rock_Ratio: 0,
      Mine_Production_t_per_day: 0,
      Average_Haul_Distance_km: 0,
      Fuel_Consumption_L_per_tonne_ore: 0,
      Electricity_Consumption_kWh_per_tonne_ore: 0,
      Water_Consumption_m3_per_tonne_ore: 0,
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
                  <span className="text-sm font-medium">Step 1 of 7</span>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  General Site and Ore Details
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Complete the mining process details. Fields marked with ★ are required.
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
                
                {/* General Site and Ore Details Section */}
                <Section title="General Site and Ore Details" icon={Mountain} defaultExpanded={true} required={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Mining Method */}
                    <FormField
                      control={control}
                      name="Mining_Method"
                      render={({ field }) => (
                        <FormItem className="col-span-full">
                          <FieldWrapper label="Mining Method" required>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {['open-pit', 'underground', 'ISL', 'solution extraction'].map((method) => (
                                <OptionButton
                                  key={method}
                                  selected={field.value === method}
                                  onClick={() => field.onChange(field.value === method ? "" : method)}
                                >
                                  {method.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </OptionButton>
                              ))}
                            </div>
                          </FieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                    {/* Ore Grade */}
                    <FormField
                      control={control}
                      name="Ore_Grade_Cu"
                      render={({ field }) => (
                        <FormItem className="col-span-full md:col-span-2">
                          <FieldWrapper label="Ore Grade (% Cu)" required tooltip="Copper content percentage in the ore">
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

                    {/* Region/Country */}
                    <FormField
                      control={control}
                      name="Region_or_Country"
                      render={({ field }) => (
                        <FormItem className="col-span-full md:col-span-1">
                          <FieldWrapper label="Region or Country" required>
                            <Input placeholder="e.g., Chile, Peru" {...field} className="border-2 focus:border-[#BA7967]" />
                          </FieldWrapper>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Deposit Depth */}
                    <FormField
                      control={control}
                      name="Deposit_Depth_m"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Deposit Depth (m)" tooltip="Depth of the ore deposit below surface">
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

                    {/* Bench Height */}
                    <FormField
                      control={control}
                      name="Bench_Height_m"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Bench Height (m)" tooltip="Height of mining benches in open-pit operations">
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

                    {/* Rock Hardness Index */}
                    <FormField
                      control={control}
                      name="Rock_Hardness_Index"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Rock Hardness Index" tooltip="Mohs hardness scale or similar">
                            <Input 
                              type="number" 
                              placeholder="e.g., 6.5" 
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

                {/* Material Ratios Section */}
                <Section title="Material Ratios" icon={Mountain} required={true}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={control}
                      name="Overburden_or_Waste_Rock_Ratio"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Overburden/Waste Rock Ratio" required tooltip="m³ waste per tonne ore">
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

                    <FormField
                      control={control}
                      name="Stripping_Ratio"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Stripping Ratio" tooltip="Tonnes waste per tonne ore">
                            <Input 
                              type="number" 
                              placeholder="e.g., 1.8" 
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
                      name="Tailings_Generation_Rate"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Tailings Generation Rate" tooltip="Tonnes per tonne copper">
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
                  </div>
                </Section>

                {/* Production and Operations Section */}
                <Section title="Production and Operations" icon={Mountain} required={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={control}
                      name="Mine_Production_t_per_day"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Mine Production (t/day)" required>
                            <Input 
                              type="number" 
                              placeholder="e.g., 100000" 
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

                    <FormField
                      control={control}
                      name="Average_Haul_Distance_km"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Average Haul Distance (km)" required tooltip="Distance from pit to processing">
                            <Input 
                              type="number" 
                              placeholder="e.g., 5.2" 
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

                    <FormField
                      control={control}
                      name="Mine_Lifetime_years"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Mine Lifetime (years)">
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

                    <FormField
                      control={control}
                      name="Ore_Throughput_t_per_year"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Ore Throughput (t/year)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 36500000" 
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
                      name="Shift_Hours_per_Day"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Shift Hours per Day">
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
                      name="Equipment_Availability"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Equipment Availability (%)">
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
                  </div>
                </Section>

                {/* Equipment and Energy Section */}
                <Section title="Equipment and Energy" icon={Zap} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Equipment Type */}
                    <FormField
                      control={control}
                      name="Equipment_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Equipment Type" required>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['diesel', 'electric', 'hybrid'].map((type) => (
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
                      <FormField
                        control={control}
                        name="Equipment_Count"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Equipment Count">
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

                      <FormField
                        control={control}
                        name="Equipment_Capacity_t"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Equipment Capacity (t)">
                              <Input 
                                type="number" 
                                placeholder="e.g., 300" 
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
                        name="Explosives_Used_kg_per_tonne_ore"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Explosives Used (kg/t ore)">
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

                      <FormField
                        control={control}
                        name="Fuel_Consumption_L_per_tonne_ore"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Fuel Consumption (L/t ore)" required>
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

                      <FormField
                        control={control}
                        name="Electricity_Consumption_kWh_per_tonne_ore"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Electricity Consumption (kWh/t ore)" required>
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

                      <FormField
                        control={control}
                        name="Energy_Efficiency_of_Machines"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Energy Efficiency (%)">
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
                    </div>

                    {/* Power Source Mix */}
                    <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        Power Source Mix
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={control}
                          name="Power_Source_Renewable"
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
                          name="Power_Source_Fossil"
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

                        <FormField
                          control={control}
                          name="Power_Source_Grid"
                          render={({ field }) => (
                            <FormItem>
                              <FieldWrapper label="Grid (%)">
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
                                    <span className="text-2xl font-bold text-blue-600">{(field.value || 0)}%</span>
                                  </div>
                                </div>
                              </FieldWrapper>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </Section>

                {/* Water and Environmental Management Section */}
                <Section title="Water and Environmental Management" icon={Droplet} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Water Source */}
                    <FormField
                      control={control}
                      name="Water_Source"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Water Source" required>
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
                      <FormField
                        control={control}
                        name="Water_Consumption_m3_per_tonne_ore"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Water Consumption (m³/t ore)" required>
                              <Input 
                                type="number" 
                                placeholder="e.g., 0.8" 
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

                      <FormField
                        control={control}
                        name="Water_Reuse_Rate"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Water Reuse Rate (%)">
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

                      <FormField
                        control={control}
                        name="Water_Discharge_Quality_pH"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Water Discharge pH">
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
                    </div>

                    {/* Acid Mine Drainage Risk */}
                    <FormField
                      control={control}
                      name="Acid_Mine_Drainage_Risk"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Acid Mine Drainage Risk">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {['low', 'medium', 'high'].map((risk) => (
                                <OptionButton
                                  key={risk}
                                  selected={field.value === risk}
                                  onClick={() => field.onChange(field.value === risk ? "" : risk)}
                                >
                                  {risk.charAt(0).toUpperCase() + risk.slice(1)}
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

                {/* Emissions and Land Impact Section */}
                <Section title="Emissions and Land Impact" icon={Leaf} defaultExpanded={false}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={control}
                      name="Direct_GHG_Emissions_kgCO2e_per_tonne_ore"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Direct GHG Emissions (kgCO₂e/t ore)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 25.5" 
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
                      name="Dust_Emissions_PM10_kg_per_tonne_ore"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Dust Emissions PM10 (kg/t ore)">
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

                    <FormField
                      control={control}
                      name="Noise_Level_dB"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Noise Level (dB)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 85" 
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
                      name="Land_Disturbed_m2_per_tonne_ore"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Land Disturbed (m²/t ore)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 0.1" 
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
                      name="Rehabilitation_Area_ha_per_year"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Rehabilitation Area (ha/year)">
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

                    <FormField
                      control={control}
                      name="Biodiversity_Impact_Score"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Biodiversity Impact Score" tooltip="1-10 scale, higher is worse">
                            <div className="space-y-3">
                              <Slider
                                value={[field.value || 0]}
                                onValueChange={(v) => field.onChange(v[0])}
                                min={0}
                                max={10}
                                step={1}
                                className="w-full"
                              />
                              <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-[#BA7967]">{(field.value || 0)}/10</span>
                                <Input
                                  type="number"
                                  value={field.value || 0}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right"
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
                  </div>
                </Section>

                {/* Economic and Process Data Section */}
                <Section title="Economic and Process Data (Optional)" icon={DollarSign} defaultExpanded={false}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={control}
                      name="Ore_Recovery"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Ore Recovery (%)">
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

                    <FormField
                      control={control}
                      name="Ore_Loss"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Ore Loss (%)">
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
                                <span className="text-xl font-bold text-red-600">{(field.value || 0)}%</span>
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

                    <FormField
                      control={control}
                      name="Mining_Cost_USD_per_tonne_ore"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Mining Cost (USD/t ore)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 15.50" 
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
                      name="Diesel_Price_USD_per_Litre"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Diesel Price (USD/L)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 1.20" 
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
                      name="Electricity_Cost_USD_per_kWh"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Electricity Cost (USD/kWh)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 0.12" 
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

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200">
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
