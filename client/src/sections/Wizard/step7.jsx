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
  Leaf, 
  Zap, 
  Droplet, 
  Trash2,
  Settings,
  Info,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Recycle,
  AlertTriangle,
  Factory
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Form schema
const formSchema = z.object({
  // Waste and By-Product Characteristics
  Waste_Type: z.string().min(1, "Waste type is required"),
  Waste_Generation_kg_per_tonne_Cu: z.number().optional(),
  Metal_Content_in_Waste: z.number().optional(),
  Chemical_Composition_FeO: z.number().optional(),
  Chemical_Composition_SiO2: z.number().optional(),
  Chemical_Composition_CuO: z.number().optional(),
  Moisture_Content: z.number().optional(),
  
  // Valorization / Treatment Process
  Valorization_Method: z.string().min(1, "Required"),
  Valorization_Rate: z.number().min(0, "Required"),
  Metal_Recovery_Rate: z.number().min(0, "Required"),
  Sulfur_Capture_Efficiency: z.number().optional(),
  Furnace_Gas_SO2_Concentration: z.number().optional(),
  Acid_Plant_Capacity_t_per_day: z.number().optional(),
  Energy_for_Valorization_kWh_per_tonne_waste: z.number().optional(),
  Water_Used_in_Treatment_m3_per_tonne_waste: z.number().optional(),
  
  // Outputs and Residuals
  Residue_After_Treatment_kg_per_tonne_Cu: z.number().optional(),
  Leachate_Toxicity_Index: z.number().optional(),
  Heavy_Metal_Residue_mg_per_L: z.number().optional(),
  Slag_Reuse_as_Construction_Material: z.number().optional(),
  Acid_Produced_kg_H2SO4_per_tonne_Cu: z.number().optional(),
  GHG_Emissions_kgCO2e_per_tonne_Cu: z.number().optional(),
  
  // Economic / Circular Value
  Revenue_from_ByProducts_USD_per_tonne_Cu: z.number().optional(),
  Market_Price_Acid_USD_per_tonne: z.number().optional(),
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
        layoutId="selected-indicator-step7"
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

export default function Step7({ onNext, onBack, onSave, initialValues, onGenerateAIPrediction, predicting }) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      Waste_Type: "",
      Metal_Content_in_Waste: 0.5,
      Moisture_Content: 5,
      Valorization_Method: "",
      Valorization_Rate: 70,
      Metal_Recovery_Rate: 60,
      Sulfur_Capture_Efficiency: 95,
      Furnace_Gas_SO2_Concentration: 10,
      Slag_Reuse_as_Construction_Material: 50,
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
                  <span className="text-sm font-medium">Step 7 of 7 - Valorization</span>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Waste Valorization & By-Product Recovery
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Enter waste treatment and valorization data. Fields marked with ★ are required.
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
                
                {/* Waste and By-Product Characteristics */}
                <Section title="Waste and By-Product Characteristics" icon={Trash2} defaultExpanded={true} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Waste Type */}
                    <FormField
                      control={control}
                      name="Waste_Type"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Waste Type" required>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {['slag', 'tailings', 'dust', 'acidic effluent'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Trash2}
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
                      {/* Waste Generation */}
                      <FormField
                        control={control}
                        name="Waste_Generation_kg_per_tonne_Cu"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Waste Generation (kg/t Cu)">
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

                      {/* Metal Content in Waste */}
                      <FormField
                        control={control}
                        name="Metal_Content_in_Waste"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Metal Content in Waste (%)">
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
                                  <span className="text-xl font-bold text-orange-600">{(field.value || 0).toFixed(1)}%</span>
                                  <Input
                                    type="number"
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right"
                                    step={0.1}
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

                    {/* Chemical Composition */}
                    <div className="space-y-4 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-amber-600" />
                        Chemical Composition (%)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={control}
                          name="Chemical_Composition_FeO"
                          render={({ field }) => (
                            <FormItem>
                              <FieldWrapper label="FeO (%)">
                                <Input 
                                  type="number" 
                                  placeholder="e.g., 40" 
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

                        <FormField
                          control={control}
                          name="Chemical_Composition_SiO2"
                          render={({ field }) => (
                            <FormItem>
                              <FieldWrapper label="SiO₂ (%)">
                                <Input 
                                  type="number" 
                                  placeholder="e.g., 35" 
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

                        <FormField
                          control={control}
                          name="Chemical_Composition_CuO"
                          render={({ field }) => (
                            <FormItem>
                              <FieldWrapper label="CuO (%)">
                                <Input 
                                  type="number" 
                                  placeholder="e.g., 1.5" 
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
                      </div>
                    </div>
                  </div>
                </Section>

                {/* Valorization / Treatment Process */}
                <Section title="Valorization / Treatment Process" icon={Recycle} required={true}>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Valorization Method */}
                    <FormField
                      control={control}
                      name="Valorization_Method"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Valorization Method" required>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {['reuse', 'recycle', 'neutralize', 'dispose'].map((type) => (
                                <OptionButton
                                  key={type}
                                  selected={field.value === type}
                                  onClick={() => field.onChange(field.value === type ? "" : type)}
                                  icon={Recycle}
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
                      {/* Valorization Rate */}
                      <FormField
                        control={control}
                        name="Valorization_Rate"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Valorization Rate (%)" required tooltip="Percentage of waste successfully valorized">
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

                      {/* Metal Recovery Rate */}
                      <FormField
                        control={control}
                        name="Metal_Recovery_Rate"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Metal Recovery Rate (%)" required>
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

                      {/* Sulfur Capture Efficiency */}
                      <FormField
                        control={control}
                        name="Sulfur_Capture_Efficiency"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Sulfur Capture Efficiency (%)">
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

                      {/* Furnace Gas SO2 Concentration */}
                      <FormField
                        control={control}
                        name="Furnace_Gas_SO2_Concentration"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Furnace Gas SO₂ Concentration (%)">
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
                                  <span className="text-xl font-bold text-orange-600">{(field.value || 0)}%</span>
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

                      {/* Acid Plant Capacity */}
                      <FormField
                        control={control}
                        name="Acid_Plant_Capacity_t_per_day"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Acid Plant Capacity (t/day)">
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

                      {/* Energy for Valorization */}
                      <FormField
                        control={control}
                        name="Energy_for_Valorization_kWh_per_tonne_waste"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Energy for Valorization (kWh/t waste)">
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

                      {/* Water Used in Treatment */}
                      <FormField
                        control={control}
                        name="Water_Used_in_Treatment_m3_per_tonne_waste"
                        render={({ field }) => (
                          <FormItem>
                            <FieldWrapper label="Water Used in Treatment (m³/t waste)">
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

                {/* Outputs and Residuals */}
                <Section title="Outputs and Residuals" icon={AlertTriangle}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Residue After Treatment */}
                    <FormField
                      control={control}
                      name="Residue_After_Treatment_kg_per_tonne_Cu"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Residue After Treatment (kg/t Cu)">
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

                    {/* Leachate Toxicity Index */}
                    <FormField
                      control={control}
                      name="Leachate_Toxicity_Index"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Leachate Toxicity Index" tooltip="Toxicity measure (higher = more toxic)">
                            <Input 
                              type="number" 
                              placeholder="e.g., 5.5" 
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
                              step={0.01}
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
                      name="Acid_Produced_kg_H2SO4_per_tonne_Cu"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Acid Produced (kg H₂SO₄/t Cu)">
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

                    {/* GHG Emissions */}
                    <FormField
                      control={control}
                      name="GHG_Emissions_kgCO2e_per_tonne_Cu"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="GHG Emissions (kgCO₂e/t Cu)">
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

                    {/* Slag Reuse as Construction Material */}
                    <FormField
                      control={control}
                      name="Slag_Reuse_as_Construction_Material"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Slag Reuse as Construction Material (%)">
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

                {/* Economic / Circular Value */}
                <Section title="Economic / Circular Value" icon={DollarSign}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Revenue from By-Products */}
                    <FormField
                      control={control}
                      name="Revenue_from_ByProducts_USD_per_tonne_Cu"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Revenue from By-Products (USD/t Cu)" tooltip="Economic value generated from waste valorization">
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

                    {/* Market Price Acid */}
                    <FormField
                      control={control}
                      name="Market_Price_Acid_USD_per_tonne"
                      render={({ field }) => (
                        <FormItem>
                          <FieldWrapper label="Market Price Acid (USD/t)">
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
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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
                        Complete & Submit
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
