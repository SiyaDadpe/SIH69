import React, { useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import miningData from "@/data/mining.json";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Data for form fields
const miningProcesses = [
  { id: "openPit", label: "Open Pit Mining" },
  { id: "strip", label: "Strip Mining" },
  { id: "drilling", label: "Drilling & Blasting" },
  { id: "hydraulic", label: "Hydraulic Mining" },
  { id: "manual", label: "Manual Extraction" },
  { id: "electricShovel", label: "Electric Shovel / Excavator" },
  { id: "dieselHaul", label: "Diesel-powered Haul Trucks" },
  { id: "inSitu", label: "In-situ Leaching (experimental)" },
  { id: "others", label: "Others" },
];

const locations = [...new Set(miningData.map((d) => d.location))];
const equipmentTypes = ["Diesel", "Electric", "Hybrid"];
const biodiversityImpacts = [
    { id: "low", label: "Low – Minimal disruption, already cleared land" },
    { id: "moderate", label: "Moderate – Some clearing required, limited wildlife impact" },
    { id: "high", label: "High – Large-scale forest clearing, high ecological loss" },
];

const formSchema = z.object({
  applicableProcesses: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
  others: z.string().optional(),
  location: z.string({ required_error: "Location is required." }),
  year: z.coerce.number().min(1900).max(new Date().getFullYear()),
  oreGrade: z.coerce.number().min(0).max(100),
  overburdenRatio: z.coerce.number().optional(),
  typeOfEquipment: z.enum(equipmentTypes.map(t => t.toLowerCase()), {
    required_error: "You need to select a type of equipment.",
  }),
  waterUsage: z.coerce.number().optional(),
  biodiversityImpact: z.string({
    required_error: "You need to select a biodiversity impact level.",
  }),
  redMudGeneration: z.coerce.number().optional(),
});

function MiningProcessDetails({ onNext }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicableProcesses: [],
      year: new Date().getFullYear(),
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    control,
    watch,
    formState: { isValid },
  } = form;

  const onSubmit = (data) => {
    console.log(data);
    onNext();
  };

  const applicableProcesses = watch("applicableProcesses");

  return (
    <FormProvider {...form}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
  <Card className="w-full bg-[#F3F2EC]">
          <CardHeader>
            <CardTitle>Step 1: Mining Process Details</CardTitle>
            <CardDescription>
              Enter the details of the mining process. Fields marked with * are
              required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={control}
                  name="applicableProcesses"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">
                          Select Applicable Processes*
                        </FormLabel>
                        <FormDescription>
                          Select all the processes that apply.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {miningProcesses.map((item) => (
                          <FormField
                            key={item.id}
                            control={control}
                            name="applicableProcesses"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...(field.value || []),
                                              item.id,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {applicableProcesses?.includes("others") && (
                  <FormField
                    control={control}
                    name="others"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Process</FormLabel>
                        <FormControl>
                          <Input placeholder="Please specify" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <hr className="my-4 border-gray-200" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
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
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year of Operation</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 2023" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="oreGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ore Grade (%)*</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 12" {...field} min="0" max="100" />
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
                        <FormLabel className="flex items-center">
                          Overburden Ratio
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-2 cursor-help text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Volume of waste removed per volume of ore</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <hr className="my-4 border-gray-200" />

                <FormField
                  control={control}
                  name="typeOfEquipment"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Type of Equipment*</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0"
                        >
                          {equipmentTypes.map((type) => (
                            <FormItem
                              key={type}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={type.toLowerCase()} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {type}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <hr className="my-4 border-gray-200" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={control}
                    name="waterUsage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Water Usage (m³ per tonne of ore)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 0.5" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="redMudGeneration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Red Mud Generation (kg per tonne of ore)
                           <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-2 cursor-help text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Depends on ore composition and extraction
                                  process
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <hr className="my-4 border-gray-200" />

                <FormField
                  control={control}
                  name="biodiversityImpact"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Land Use / Biodiversity Impact*</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          {biodiversityImpacts.map((impact) => (
                            <FormItem
                              key={impact.id}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={impact.id} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {impact.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={!isValid}
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </FormProvider>
  );
}


// Main Wizard Form Component
export default function WizardForm({ steps, activeStep, onStepChange }) {
  const [formValues, setFormValues] = useState({})

  const handleValueChange = (stepKey, field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [field]: value,
      },
    }))
  }

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      onStepChange(activeStep + 1)
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      onStepChange(activeStep - 1)
    }
  }

  const currentStep = steps[activeStep]
  const stepKey = currentStep.key
  const stepValues = formValues[stepKey] || {}

  // Derive options for the mining step from the JSON data
  const miningOptions = useMemo(() => {
    if (!miningData) return {}
    const methods = [...new Set(miningData.flatMap((d) => d.mining_method))]
    const locations = [...new Set(miningData.map((d) => d.location))]
    const oreGrades = miningData.map((d) => d.mining_ore_grade_percent)
    return {
      methods,
      locations,
      oreGradeRange: { min: Math.min(...oreGrades), max: Math.max(...oreGrades) },
    }
  }, [])

  const renderStep = () => {
    switch(stepKey) {
      case 'mining':
        return <MiningProcessDetails onNext={handleNext} />;
      default:
        return (
            <StepForm
                stepKey={stepKey}
                stepTitle={currentStep.title}
                values={stepValues}
                onChange={(field, value) => handleValueChange(stepKey, field, value)}
                miningOptions={miningOptions}
            />
        );
    }
  }

  return (
    <WizardContainer title={currentStep.title} subtitle={currentStep.description}>
      {renderStep()}
      {stepKey !== 'mining' && (
        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={activeStep === 0}>
            Back
          </Button>
          <Button onClick={handleNext}>
            {activeStep === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      )}
    </WizardContainer>
  )
}

// Clean container without tracking UI, with space for right sidebar tracker on md+
function WizardContainer({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4 sm:p-6 md:pr-86">
      <div className="mx-auto w-full max-w-none md:max-w-[calc(100vw-28rem)] space-y-4 sm:space-y-6">
        {/* This title is now handled inside the MiningProcessDetails card */}
        {/* <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#181814]">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div> */}
        <div>{children}</div>
      </div>
    </div>
  )
}

// Placeholder step fields with Mining-specialized rendering
function StepForm({ stepKey, stepTitle, values, onChange, miningOptions }) {
  if (stepKey === "mining") {
    const { methods = [], locations = [], oreGradeRange } = miningOptions || {}
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#181814]">{stepTitle}</h2>
          <p className="text-sm text-gray-600">Provide mining inputs. Options are derived from the project data.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#181814] mb-1">Mining Method</label>
            <select
              value={values.mining_method || ""}
              onChange={(e) => onChange("mining_method", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] text-sm"
            >
              <option value="" disabled>Select method</option>
              {methods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#181814] mb-1">Ore Grade (%)</label>
            <input
              type="number"
              min={oreGradeRange?.min ?? 0}
              max={oreGradeRange?.max ?? 100}
              step="0.1"
              value={values.mining_ore_grade_percent ?? ""}
              onChange={(e) => onChange("mining_ore_grade_percent", e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] text-sm"
              placeholder="e.g., 45.0"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[#181814] mb-1">Location</label>
            <select
              value={values.location || ""}
              onChange={(e) => onChange("location", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] text-sm"
            >
              <option value="" disabled>Select location</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  // Placeholder step fields
  return (
    <Card className="p-4 sm:p-6 bg-[#F3F2EC]">
        <div className="space-y-6">
        <div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#181814]">{stepTitle}</h2>
            <p className="text-sm text-gray-600">Provide the details. Replace with real fields later.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
            <label htmlFor={`${stepKey}-field1`} className="block text-sm font-medium text-[#181814] mb-1">
                {stepTitle} Field 1
            </label>
            <input
                id={`${stepKey}-field1`}
                type="text"
                value={values.field1}
                onChange={(e) => onChange("field1", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] text-sm bg-white"
                placeholder="Enter value"
            />
            </div>
            <div>
            <label htmlFor={`${stepKey}-field2`} className="block text-sm font-medium text-[#181814] mb-1">
                {stepTitle} Field 2
            </label>
            <input
                id={`${stepKey}-field2`}
                type="number"
                value={values.field2}
                onChange={(e) => onChange("field2", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] text-sm bg-white"
                placeholder="Enter number"
            />
            </div>
        </div>
        </div>
    </Card>
  )
}
