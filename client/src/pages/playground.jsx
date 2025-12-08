import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Activity, 
  Zap, 
  Droplet, 
  Flame, 
  Recycle, 
  TrendingDown, 
  TrendingUp,
  Leaf,
  AlertCircle,
  CheckCircle2,
  Download,
  RotateCcw,
  Calculator,
  Loader2
} from "lucide-react"

// FastAPI LCA Engine endpoint
const LCA_ENGINE_API = "http://localhost:8100/api/playground/calculate"

// LCA Input Schema
const LCA_SCHEMA = {
  "1. Mining (Bauxite Extraction)": {
    icon: Activity,
    color: "bg-amber-500",
    fields: {
      "Mining Method": {
        type: "select",
        options: ["Open Pit", "Strip", "Hydraulic", "Drilling & Blasting", "Electric Excavation", "Diesel Excavation"],
        impact: { co2: 1.2, energy: 1.1 }
      },
      "Ore Grade (%)": {
        type: "slider",
        min: 20,
        max: 60,
        default: 40,
        unit: "%",
        impact: { co2: -0.5, energy: -0.3 }
      },
      "Overburden Ratio": {
        type: "slider",
        min: 0.5,
        max: 5,
        default: 2,
        step: 0.1,
        impact: { co2: 0.8, energy: 0.6 }
      },
      "Equipment Type": {
        type: "select",
        options: ["Diesel", "Electric", "Hybrid"],
        impact: { co2: 1.5, energy: 1.3 }
      },
      "Water Usage (m³/t)": {
        type: "number",
        default: 0.5,
        unit: "m³/t",
        impact: { co2: 0.2, energy: 0.1 }
      },
      "Red Mud Generation (kg/t)": {
        type: "number",
        default: 1200,
        unit: "kg/t",
        impact: { co2: 0.4, energy: 0.2 }
      }
    }
  },
  "2. Beneficiation (Ore Processing)": {
    icon: Droplet,
    color: "bg-blue-500",
    fields: {
      "Processes": {
        type: "multiselect",
        options: ["Crushing", "Grinding", "Washing", "Magnetic Separation", "Dry Separation"],
        impact: { co2: 0.5, energy: 0.6 }
      },
      "Water Consumption (m³/t)": {
        type: "slider",
        min: 0.5,
        max: 3,
        default: 1.5,
        step: 0.1,
        unit: "m³/t",
        impact: { co2: 0.3, energy: 0.2 }
      },
      "Electricity Use (kWh/t)": {
        type: "number",
        default: 150,
        unit: "kWh/t",
        impact: { co2: 0.8, energy: 1.0 }
      },
      "Chemical Use": {
        type: "select",
        options: ["Flocculants", "Dispersants", "None"],
        impact: { co2: 0.4, energy: 0.3 }
      },
      "Tailings Management": {
        type: "select",
        options: ["Pond Storage", "Pipeline Disposal", "Thickened Sludge"],
        impact: { co2: 0.5, energy: 0.4 }
      }
    }
  },
  "3. Alumina Refining (Bayer Process)": {
    icon: Flame,
    color: "bg-orange-500",
    fields: {
      "Process Type": {
        type: "multiselect",
        options: ["Caustic Digestion", "Clarification", "Calcination"],
        impact: { co2: 0.7, energy: 0.8 }
      },
      "Enhancements": {
        type: "multiselect",
        options: ["Heat Recovery", "Green Solvents", "Automation"],
        impact: { co2: -0.6, energy: -0.7 }
      },
      "Energy Use (kWh/t)": {
        type: "number",
        default: 1000,
        unit: "kWh/t",
        impact: { co2: 1.2, energy: 1.5 }
      },
      "Water Use (m³/t)": {
        type: "slider",
        min: 1,
        max: 10,
        default: 5,
        step: 0.5,
        unit: "m³/t",
        impact: { co2: 0.3, energy: 0.2 }
      },
      "Red Mud Generation (kg/t)": {
        type: "number",
        default: 1500,
        unit: "kg/t",
        impact: { co2: 0.5, energy: 0.3 }
      },
      "Chemical Consumption (kg/t)": {
        type: "number",
        default: 50,
        unit: "kg/t",
        impact: { co2: 0.4, energy: 0.3 }
      }
    }
  },
  "4. Aluminium Smelting (Hall-Héroult)": {
    icon: Zap,
    color: "bg-yellow-500",
    fields: {
      "Cell Type": {
        type: "select",
        options: ["Pre-baked", "Soderberg", "Inert Anodes"],
        impact: { co2: 1.8, energy: 2.0 }
      },
      "Energy Source": {
        type: "select",
        options: ["Grid", "Renewable Mix"],
        impact: { co2: 2.0, energy: 1.5 }
      },
      "Electricity Demand (kWh/t)": {
        type: "number",
        default: 15000,
        unit: "kWh/t",
        impact: { co2: 2.5, energy: 3.0 }
      },
      "CO₂ Emissions (kg/t)": {
        type: "number",
        default: 1600,
        unit: "kg/t",
        impact: { co2: 3.0, energy: 1.0 }
      },
      "Fluoride Recovery Efficiency (%)": {
        type: "slider",
        min: 50,
        max: 98,
        default: 85,
        unit: "%",
        impact: { co2: -0.3, energy: -0.2 }
      }
    }
  },
  "5. Fabrication & Use Phase": {
    icon: Activity,
    color: "bg-purple-500",
    fields: {
      "Processes": {
        type: "multiselect",
        options: ["Casting", "Rolling", "Extrusion", "Surface Treatment"],
        impact: { co2: 0.6, energy: 0.7 }
      },
      "Recycled Content (%)": {
        type: "slider",
        min: 0,
        max: 100,
        default: 30,
        unit: "%",
        impact: { co2: -1.2, energy: -1.0 }
      },
      "Scrap Rate (%)": {
        type: "slider",
        min: 0,
        max: 30,
        default: 10,
        unit: "%",
        impact: { co2: 0.5, energy: 0.4 }
      },
      "Energy Use (kWh/t)": {
        type: "number",
        default: 500,
        unit: "kWh/t",
        impact: { co2: 0.8, energy: 1.0 }
      },
      "Transport Mode": {
        type: "select",
        options: ["Road", "Rail", "Sea"],
        impact: { co2: 0.6, energy: 0.5 }
      },
      "Transport Distance (km)": {
        type: "number",
        default: 500,
        unit: "km",
        impact: { co2: 0.4, energy: 0.3 }
      }
    }
  },
  "6. Recycling (End-of-Life)": {
    icon: Recycle,
    color: "bg-green-500",
    fields: {
      "Process": {
        type: "multiselect",
        options: ["Collection", "Sorting", "Remelting"],
        impact: { co2: -0.8, energy: -0.6 }
      },
      "Recycling Type": {
        type: "select",
        options: ["Closed-loop", "Open-loop"],
        impact: { co2: -0.5, energy: -0.4 }
      },
      "Recovery Yield (%)": {
        type: "slider",
        min: 60,
        max: 95,
        default: 85,
        unit: "%",
        impact: { co2: -1.0, energy: -0.8 }
      },
      "Energy Demand (kWh/t)": {
        type: "number",
        default: 2800,
        unit: "kWh/t",
        impact: { co2: 0.8, energy: 1.0 }
      },
      "Emission Savings (kg CO₂e/t)": {
        type: "number",
        default: 9000,
        unit: "kg CO₂e/t",
        impact: { co2: -2.0, energy: -1.5 }
      }
    }
  },
  "7. Waste Valorization": {
    icon: Leaf,
    color: "bg-teal-500",
    fields: {
      "Waste Type": {
        type: "multiselect",
        options: ["Red Mud", "SPL", "Dross", "Slag"],
        impact: { co2: -0.4, energy: -0.3 }
      },
      "Valorization Method": {
        type: "multiselect",
        options: ["Cement Additive", "Iron Recovery", "Dross Recovery"],
        impact: { co2: -0.6, energy: -0.5 }
      },
      "Waste Utilized (%)": {
        type: "slider",
        min: 0,
        max: 80,
        default: 20,
        unit: "%",
        impact: { co2: -0.8, energy: -0.6 }
      },
      "Emission Reduction (kg CO₂e/t)": {
        type: "number",
        default: 500,
        unit: "kg CO₂e/t",
        impact: { co2: -1.0, energy: -0.7 }
      }
    }
  }
}

export default function Playground() {
  // State for loading and real calculations
  const [isCalculating, setIsCalculating] = useState(false)
  const [realLCAResults, setRealLCAResults] = useState(null)
  const [calculationError, setCalculationError] = useState(null)
  const [useRealCalculation, setUseRealCalculation] = useState(false)

  // Initialize form data with defaults
  const [formData, setFormData] = useState(() => {
    const initialData = {}
    Object.keys(LCA_SCHEMA).forEach(sectionKey => {
      initialData[sectionKey] = {}
      Object.entries(LCA_SCHEMA[sectionKey].fields).forEach(([fieldKey, config]) => {
        if (config.type === "select") {
          initialData[sectionKey][fieldKey] = config.options[0]
        } else if (config.type === "slider" || config.type === "number") {
          initialData[sectionKey][fieldKey] = config.default || config.min || 0
        } else if (config.type === "multiselect") {
          initialData[sectionKey][fieldKey] = []
        }
      })
    })
    return initialData
  })

  // Calculate LCA scores in real-time
  const lcaScores = useMemo(() => {
    let baseCO2 = 12000 // Base kg CO₂e per tonne of aluminium
    let baseEnergy = 18000 // Base kWh per tonne
    let co2Modifier = 0
    let energyModifier = 0

    Object.keys(LCA_SCHEMA).forEach(sectionKey => {
      Object.entries(LCA_SCHEMA[sectionKey].fields).forEach(([fieldKey, config]) => {
        const value = formData[sectionKey]?.[fieldKey]
        
        if (config.type === "select") {
          const index = config.options.indexOf(value)
          const factor = index === 0 ? 1 : index === 1 ? 0.8 : 0.6
          co2Modifier += (config.impact.co2 * factor * 100)
          energyModifier += (config.impact.energy * factor * 100)
        } else if (config.type === "slider" || config.type === "number") {
          const normalizedValue = (value - (config.min || 0)) / ((config.max || 100) - (config.min || 0))
          co2Modifier += (config.impact.co2 * normalizedValue * 100)
          energyModifier += (config.impact.energy * normalizedValue * 100)
        } else if (config.type === "multiselect") {
          const selectionFactor = value.length / config.options.length
          co2Modifier += (config.impact.co2 * selectionFactor * 100)
          energyModifier += (config.impact.energy * selectionFactor * 100)
        }
      })
    })

    const totalCO2 = Math.max(1000, baseCO2 + co2Modifier)
    const totalEnergy = Math.max(2000, baseEnergy + energyModifier)
    
    // Calculate rating based on performance
    const co2Rating = totalCO2 < 8000 ? "Excellent" : totalCO2 < 10000 ? "Good" : totalCO2 < 12000 ? "Average" : "Poor"
    const energyRating = totalEnergy < 14000 ? "Excellent" : totalEnergy < 16000 ? "Good" : totalEnergy < 18000 ? "Average" : "Poor"
    
    // Overall score (0-100, higher is better)
    const overallScore = Math.max(0, Math.min(100, 100 - (totalCO2 / 150) - (totalEnergy / 250)))

    return {
      co2: Math.round(totalCO2),
      energy: Math.round(totalEnergy),
      co2Rating,
      energyRating,
      overallScore: Math.round(overallScore),
      baseline: { co2: baseCO2, energy: baseEnergy }
    }
  }, [formData])

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleMultiSelectToggle = (section, field, option) => {
    setFormData(prev => {
      const currentValues = prev[section][field] || []
      const newValues = currentValues.includes(option)
        ? currentValues.filter(v => v !== option)
        : [...currentValues, option]
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newValues
        }
      }
    })
  }

  const handleReset = () => {
    const initialData = {}
    Object.keys(LCA_SCHEMA).forEach(sectionKey => {
      initialData[sectionKey] = {}
      Object.entries(LCA_SCHEMA[sectionKey].fields).forEach(([fieldKey, config]) => {
        if (config.type === "select") {
          initialData[sectionKey][fieldKey] = config.options[0]
        } else if (config.type === "slider" || config.type === "number") {
          initialData[sectionKey][fieldKey] = config.default || config.min || 0
        } else if (config.type === "multiselect") {
          initialData[sectionKey][fieldKey] = []
        }
      })
    })
    setFormData(initialData)
  }

  const getRatingColor = (rating) => {
    switch(rating) {
      case "Excellent": return "text-green-600 bg-green-50 border-green-200"
      case "Good": return "text-blue-600 bg-blue-50 border-blue-200"
      case "Average": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "Poor": return "text-red-600 bg-red-50 border-red-200"
      default: return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-600"
    if (score >= 50) return "text-blue-600"
    if (score >= 30) return "text-yellow-600"
    return "text-red-600"
  }

  // Function to call real LCA engine
  const calculateRealLCA = async () => {
    setIsCalculating(true)
    setCalculationError(null)
    
    try {
      // TODO: Update this URL when API is ready
      // For now, just simulate a calculation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock response with better scores based on inputs
      const mockResult = {
        success: true,
        data: {
          co2: lcaScores.co2 * 0.95, // Slightly better than estimate
          energy: lcaScores.energy * 0.93,
          co2Rating: lcaScores.co2Rating,
          energyRating: lcaScores.energyRating,
          overallScore: Math.min(100, lcaScores.overallScore + 5),
          baseline: { co2: 12000, energy: 18000 },
          recommendations: [
            {
              type: "success",
              title: "Calculation Complete",
              message: "Mock calculation completed. Connect to real API for accurate results.",
              icon: "check-circle"
            }
          ]
        }
      }
      
      setRealLCAResults(mockResult.data)
      setUseRealCalculation(true)
      
      /* 
      // Uncomment when API is ready:
      const response = await fetch(LCA_ENGINE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        setRealLCAResults(result.data)
        setUseRealCalculation(true)
      } else {
        throw new Error(result.error || 'Calculation failed')
      }
      */
    } catch (error) {
      console.error('Real LCA calculation error:', error)
      setCalculationError(error.message)
    } finally {
      setIsCalculating(false)
    }
  }

  // Use real results if available, otherwise use estimated
  const displayScores = useRealCalculation && realLCAResults ? {
    co2: realLCAResults.co2,
    energy: realLCAResults.energy,
    co2Rating: realLCAResults.co2Rating,
    energyRating: realLCAResults.energyRating,
    overallScore: realLCAResults.overallScore,
    baseline: realLCAResults.baseline
  } : lcaScores

  const displayRecommendations = useRealCalculation && realLCAResults?.recommendations 
    ? realLCAResults.recommendations 
    : null

  return (
    <div className="relative min-h-screen">
      {/* Header with Actions */}
      <div className="sticky top-0 z-20 bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">LCA Playground</h1>
            <p className="text-sm text-gray-600 mt-1">
              Interactive Life Cycle Assessment for Aluminium Production
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleReset} 
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All
            </Button>
            <Button 
              onClick={calculateRealLCA}
              disabled={isCalculating}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  Calculate Real LCA
                </>
              )}
            </Button>
            <Button className="bg-[#BA7967] hover:bg-[#a86b5c] text-white gap-2">
              <Download className="h-4 w-4" />
              Export Results
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Input Parameters (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(LCA_SCHEMA).map(([sectionKey, sectionConfig]) => {
              const Icon = sectionConfig.icon
              return (
                <Card key={sectionKey} className="bg-[#F3F2EC]">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`${sectionConfig.color} p-2 rounded-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{sectionKey}</CardTitle>
                        <CardDescription className="text-sm">
                          Configure parameters for this stage
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(sectionConfig.fields).map(([fieldKey, fieldConfig]) => (
                        <div key={fieldKey} className="space-y-2">
                          <Label className="text-sm font-medium">
                            {fieldKey}
                            {fieldConfig.unit && (
                              <span className="text-xs text-muted-foreground ml-1">({fieldConfig.unit})</span>
                            )}
                          </Label>

                          {fieldConfig.type === "select" && (
                            <Select
                              value={formData[sectionKey]?.[fieldKey] || fieldConfig.options[0]}
                              onValueChange={(value) => handleInputChange(sectionKey, fieldKey, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldConfig.options.map(option => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {fieldConfig.type === "slider" && (
                            <div className="space-y-2">
                              <Slider
                                value={[formData[sectionKey]?.[fieldKey] || fieldConfig.default]}
                                onValueChange={(values) => handleInputChange(sectionKey, fieldKey, values[0])}
                                min={fieldConfig.min}
                                max={fieldConfig.max}
                                step={fieldConfig.step || 1}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{fieldConfig.min}</span>
                                <span className="font-medium text-foreground">
                                  {formData[sectionKey]?.[fieldKey] || fieldConfig.default}
                                </span>
                                <span>{fieldConfig.max}</span>
                              </div>
                            </div>
                          )}

                          {fieldConfig.type === "number" && (
                            <Input
                              type="number"
                              value={formData[sectionKey]?.[fieldKey] || fieldConfig.default}
                              onChange={(e) => handleInputChange(sectionKey, fieldKey, parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          )}

                          {fieldConfig.type === "multiselect" && (
                            <div className="space-y-2">
                              {fieldConfig.options.map(option => (
                                <div key={option} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${sectionKey}-${fieldKey}-${option}`}
                                    checked={(formData[sectionKey]?.[fieldKey] || []).includes(option)}
                                    onCheckedChange={() => handleMultiSelectToggle(sectionKey, fieldKey, option)}
                                  />
                                  <label
                                    htmlFor={`${sectionKey}-${fieldKey}-${option}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Right Side - Fixed Recommendation Panel (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Overall Score Card */}
              <Card className="bg-[#F3F2EC]">
                <CardHeader className="text-black">
                  <CardTitle className="flex items-center gap-2 text-black">
                    <Activity className="h-5 w-5" />
                    Overall LCA Score
                  </CardTitle>
                  <CardDescription className="text-black/90">
                    {useRealCalculation ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Real-time calculation via LCA engine
                      </span>
                    ) : (
                      <span>Estimated impact (click "Calculate Real LCA" for precise results)</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {calculationError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>Calculation error: {calculationError}</span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        Make sure the LCA engine is running on port 8100
                      </p>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className={`text-6xl font-bold ${getScoreColor(displayScores.overallScore)}`}>
                      {displayScores.overallScore}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                    <Progress 
                      value={displayScores.overallScore} 
                      className="mt-4 h-3"
                    />
                  </div>

                  <div className="space-y-4">
                    {/* CO2 Emissions */}
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">CO₂ Emissions</span>
                        </div>
                        <Badge className={getRatingColor(displayScores.co2Rating)}>
                          {displayScores.co2Rating}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {displayScores.co2.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">kg CO₂e/t</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Baseline: {displayScores.baseline.co2.toLocaleString()} kg CO₂e/t
                      </div>
                    </div>

                    {/* Energy Consumption */}
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">Energy Use</span>
                        </div>
                        <Badge className={getRatingColor(displayScores.energyRating)}>
                          {displayScores.energyRating}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {displayScores.energy.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">kWh/t</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Baseline: {displayScores.baseline.energy.toLocaleString()} kWh/t
                      </div>
                    </div>

                    {/* Impact Comparison */}
                    <div className="border rounded-lg p-4 bg-blue-50/50">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">Impact vs Baseline</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">CO₂ Impact</span>
                          <span className={displayScores.co2 < displayScores.baseline.co2 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {displayScores.co2 < displayScores.baseline.co2 ? "↓" : "↑"} 
                            {" "}{Math.abs(((displayScores.co2 - displayScores.baseline.co2) / displayScores.baseline.co2 * 100).toFixed(1))}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Energy Impact</span>
                          <span className={displayScores.energy < displayScores.baseline.energy ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {displayScores.energy < displayScores.baseline.energy ? "↓" : "↑"}
                            {" "}{Math.abs(((displayScores.energy - displayScores.baseline.energy) / displayScores.baseline.energy * 100).toFixed(1))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations Card */}
              <Card className="bg-[#F3F2EC]">
                <CardHeader className="bg-green-50/50">
                  <CardTitle className="flex items-center gap-2 text-green-900 text-lg">
                    <Leaf className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {displayRecommendations ? (
                      // Show real recommendations from LCA engine
                      displayRecommendations.map((rec, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-start gap-2 p-3 border rounded-lg ${
                            rec.type === 'critical' ? 'bg-red-50 border-red-200' :
                            rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            rec.type === 'success' ? 'bg-green-50 border-green-200' :
                            'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <AlertCircle className={`h-4 w-4 mt-0.5 ${
                            rec.type === 'critical' ? 'text-red-600' :
                            rec.type === 'warning' ? 'text-yellow-600' :
                            rec.type === 'success' ? 'text-green-600' :
                            'text-blue-600'
                          }`} />
                          <div>
                            <p className={`font-medium ${
                              rec.type === 'critical' ? 'text-red-900' :
                              rec.type === 'warning' ? 'text-yellow-900' :
                              rec.type === 'success' ? 'text-green-900' :
                              'text-blue-900'
                            }`}>{rec.title}</p>
                            <p className={`text-xs mt-1 ${
                              rec.type === 'critical' ? 'text-red-700' :
                              rec.type === 'warning' ? 'text-yellow-700' :
                              rec.type === 'success' ? 'text-green-700' :
                              'text-blue-700'
                            }`}>{rec.message}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Show default estimated recommendations
                      <>
                        {displayScores.overallScore < 50 && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-red-900">High Impact Detected</p>
                              <p className="text-xs text-red-700 mt-1">Consider increasing recycled content and renewable energy sources.</p>
                            </div>
                          </div>
                        )}
                        
                        {displayScores.co2 > 10000 && (
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-yellow-900">CO₂ Reduction Opportunity</p>
                              <p className="text-xs text-yellow-700 mt-1">Switch to electric equipment and renewable energy mix in smelting.</p>
                            </div>
                          </div>
                        )}

                        {displayScores.overallScore >= 70 && (
                          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-900">Excellent Performance</p>
                              <p className="text-xs text-green-700 mt-1">Your configuration demonstrates sustainable practices with low environmental impact.</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <Recycle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900">Optimize Recycling</p>
                            <p className="text-xs text-blue-700 mt-1">Increase recovery yield to {Math.min(95, (formData["6. Recycling (End-of-Life)"]?.["Recovery Yield (%)"] || 85) + 10)}% for better results.</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
