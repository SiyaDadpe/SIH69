# Guided Mode Design - Aluminium Processing (Steps 1 & 2)

## Overview
This document outlines the **Guided Mode** implementation with **Smart Defaults** and **Progressive Disclosure** for Aluminium processing, starting with Mining (Step 1) and Beneficiation (Step 2).

---

## 🎯 Design Principles

1. **Minimize User Input**: Show only essential fields upfront
2. **Smart Defaults**: Pre-fill with industry-standard values
3. **Progressive Disclosure**: Hide advanced/optional fields under collapsible sections
4. **Visual Guidance**: Tooltips, help text, and progress indicators
5. **Backward Compatible**: Works alongside Expert Mode without breaking existing functionality

---

## 📋 STEP 1: MINING

### Essential Fields (Always Visible)
These are the bare minimum fields required for basic LCA calculation:

| Field | Type | Smart Default | Rationale |
|-------|------|---------------|-----------|
| **Applicable Processes** | Multi-select | `["openPit", "drilling"]` | Most common for bauxite mining |
| **Ore Grade (%)** | Slider (0-100) | `45` | Typical bauxite ore grade (40-50%) |
| **Location** | Dropdown | `"India"` | Major aluminium producer |
| **Year** | Number | `2024` | Current year |

### Smart Default Values JSON
```json
{
  "guidedModeDefaults": {
    "mining": {
      "applicableProcesses": ["openPit", "drilling"],
      "oreGrade": 45,
      "location": "India",
      "year": 2024,
      "typeOfEquipment": "diesel",
      "overburdenRatio": 4.5,
      "waterUsage": 0.8,
      "biodiversityImpact": "moderate",
      "followingSustainableRules": false,
      "sustainabilityParameters": {
        "equipment_type_electric_or_hybrid": false,
        "water_source_recycled_or_surface": false,
        "water_usage_capped": 0.2,
        "rehabilitation_plan_in_place": true,
        "overburden_restored_percent": 70,
        "renewable_energy_percent": 15,
        "biodiversity_offset_area_ha": 50
      }
    }
  }
}
```

### Advanced Fields (Hidden Under Collapsible "Advanced Options")
These fields can be shown when user clicks "Show Advanced Options":

**Section: Equipment & Operations**
- Type of Equipment (Radio: Diesel/Electric/Hybrid) - Default: `Diesel`
- Overburden Ratio (Number) - Default: `4.5`
- Water Usage (m³/t ore) (Number) - Default: `0.8`

**Section: Environmental Impact**
- Biodiversity Impact (Dropdown) - Default: `Moderate`
- Red Mud Generation (Number) - Default: Empty (calculated by AI)

**Section: AI Predictions** (Read-only, populated after AI prediction)
- Mining Energy (MJ/t ore)
- Mining CO₂ (kg/t ore)
- Mining SOₓ (kg/t ore)
- Mining NOₓ (kg/t ore)
- Mining PM (kg/t ore)

**Section: Sustainability Parameters** (Shown only if "Sustainability Focused" is checked)
- All sustainability fields with defaults as shown above

### UI Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: MINING                                    [Progress] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🔍 Guided Mode Active                                        │
│ We'll help you with smart defaults. Review and customize.    │
│                                                               │
│ ✓ Select Mining Processes* [Open Pit ✓] [Drilling ✓]       │
│   [Strip] [Hydraulic] ... [+ More]                          │
│                                                               │
│ ✓ Ore Grade: [====●====] 45%                                │
│                                                               │
│ ✓ Location: [India ▼]                                       │
│                                                               │
│ ✓ Year: [2024]                                              │
│                                                               │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ 🔧 Advanced Options                        [Expand] │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                               │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ 🌱 Sustainability Parameters          [☐ Enable]    │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                               │
│                      [← Back] [Generate AI] [Next →]         │
└─────────────────────────────────────────────────────────────┘
```

### Tooltips & Help Text
- **Ore Grade**: "Typical bauxite ore contains 40-50% alumina content"
- **Overburden Ratio**: "Amount of waste rock removed per unit of ore extracted"
- **Water Usage**: "Industry standard: 0.5-1.5 m³ per tonne of ore"

---

## 📋 STEP 2: BENEFICIATION

### Essential Fields (Always Visible)

| Field | Type | Smart Default | Rationale |
|-------|------|---------------|-----------|
| **Applicable Processes** | Multi-select | `["crushing", "washing_screening"]` | Standard bauxite beneficiation |
| **Ore Feed Rate (t/h)** | Number | `500` | Typical medium-scale operation |
| **Beneficiation Efficiency (%)** | Slider (0-100) | `85` | Industry average |
| **Location** | Dropdown | `"India"` | Inherited from Step 1 |

### Smart Default Values JSON
```json
{
  "guidedModeDefaults": {
    "beneficiation": {
      "processes": ["crushing", "washing_screening"],
      "location": "India",
      "oreFeedRate": 500,
      "beneficiationEfficiency": 85,
      "waterConsumption": 2.5,
      "electricityUse": 150,
      "crushingStage": "secondary",
      "chemicalAgents": [],
      "tailings": "tailing_ponds",
      "noiseLevel": "Moderate",
      "dustLevel": "Moderate",
      "followingSustainableRules": false,
      "sustainabilityParameters": {
        "water_recycled_percent": 60,
        "tailings_storage_type_thickened_or_dry": false,
        "bio_based_flocculant_used": false,
        "reagent_dosage_optimized": true,
        "concentrate_grade_percent": 55,
        "renewable_energy_percent": 20
      }
    }
  }
}
```

### Advanced Fields (Hidden Under Collapsible "Advanced Options")

**Section: Resource Consumption**
- Water Consumption (m³/t ore) - Default: `2.5`
- Electricity Use (kWh/t ore) - Default: `150`

**Section: Process Details**
- Crushing Stage (Dropdown: Primary/Secondary/Tertiary) - Default: `Secondary`
- Chemical Agents (Multi-select) - Default: Empty
- Tailings Management (Dropdown) - Default: `Tailing Ponds`

**Section: Environmental Monitoring**
- Noise Level (Dropdown: Low/Moderate/High) - Default: `Moderate`
- Dust Level (Dropdown: Low/Moderate/High) - Default: `Moderate`

**Section: AI Predictions** (Read-only, populated after AI prediction)
- Water Consumption (m³/t ore)
- Electricity Use (kWh/t ore)
- Tailings Management Type
- Noise Pollution Level
- Dust Pollution Level

**Section: Sustainability Parameters** (Shown only if "Sustainability Focused" is checked)
- All sustainability fields with defaults as shown above

### UI Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: BENEFICIATION                             [Progress] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🔍 Guided Mode Active                                        │
│ Smart defaults applied based on your mining data.            │
│                                                               │
│ ✓ Select Beneficiation Processes*                           │
│   [Crushing ✓] [Washing ✓] [Grinding] [Flotation] [+ More] │
│                                                               │
│ ✓ Ore Feed Rate (t/h): [500] ℹ️                            │
│                                                               │
│ ✓ Beneficiation Efficiency: [====●====] 85%                 │
│                                                               │
│ ✓ Location: [India ▼]                                       │
│                                                               │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ 🔧 Advanced Options                        [Expand] │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                               │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ 🌱 Sustainability Parameters          [☐ Enable]    │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                               │
│                [← Back] [Generate AI] [Calculate LCA] [Next →]│
└─────────────────────────────────────────────────────────────┘
```

### Tooltips & Help Text
- **Ore Feed Rate**: "Typical range: 200-1000 t/h for medium-large operations"
- **Beneficiation Efficiency**: "Percentage of alumina successfully recovered from ore"
- **Water Consumption**: "Industry standard: 2-4 m³ per tonne of ore processed"

---

## 🎨 Frontend Implementation

### 1. New Component: `GuidedModeToggle.jsx`
```jsx
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function GuidedModeToggle({ enabled, onToggle }) {
  return (
    <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <Switch id="guided-mode" checked={enabled} onCheckedChange={onToggle} />
      <Label htmlFor="guided-mode" className="cursor-pointer">
        <div className="font-semibold">🔍 Guided Mode</div>
        <div className="text-sm text-gray-600">
          {enabled 
            ? "Smart defaults applied. Toggle off for Expert Mode." 
            : "Enable for pre-filled forms with smart defaults"}
        </div>
      </Label>
    </div>
  )
}
```

### 2. New Component: `AdvancedOptionsSection.jsx`
```jsx
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from "@/components/ui/button"

export function AdvancedOptionsSection({ title, children, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-semibold text-gray-700">{title}</span>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </Button>
      
      {isExpanded && (
        <div className="p-6 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  )
}
```

### 3. Modified Form Component Structure
```jsx
// In MiningProcessDetails component
const [guidedMode, setGuidedMode] = useState(true)
const [advancedExpanded, setAdvancedExpanded] = useState(false)

// Apply defaults on mount if guided mode is enabled
useEffect(() => {
  if (guidedMode && !initialValues) {
    const defaults = GUIDED_MODE_DEFAULTS.mining
    Object.keys(defaults).forEach(key => {
      setValue(key, defaults[key], { shouldValidate: false })
    })
  }
}, [guidedMode, initialValues, setValue])

// In JSX
return (
  <FormProvider {...form}>
    <StepSection {...props}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Guided Mode Toggle */}
        <GuidedModeToggle enabled={guidedMode} onToggle={setGuidedMode} />
        
        {/* Essential Fields */}
        <div className="space-y-6">
          {/* Applicable Processes */}
          {/* Ore Grade */}
          {/* Location */}
          {/* Year */}
        </div>
        
        {/* Advanced Options (Collapsible) */}
        <AdvancedOptionsSection 
          title="🔧 Advanced Options" 
          defaultExpanded={advancedExpanded}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type of Equipment */}
            {/* Overburden Ratio */}
            {/* Water Usage */}
            {/* Biodiversity Impact */}
            {/* Red Mud Generation */}
          </div>
        </AdvancedOptionsSection>
        
        {/* AI Predictions Section (if available) */}
        {hasAIPredictions && (
          <AdvancedOptionsSection title="🤖 AI Predictions" defaultExpanded={false}>
            {/* Read-only AI prediction fields */}
          </AdvancedOptionsSection>
        )}
        
        {/* Sustainability Section */}
        <div className="mb-6 rounded-lg border border-[#e3d4c8] bg-gradient-to-br from-green-50 to-emerald-50 p-4">
          <FormField control={control} name="followingSustainableRules" {...} />
        </div>
        
        {watch("followingSustainableRules") && (
          <AdvancedOptionsSection 
            title="🌱 Sustainability Parameters" 
            defaultExpanded={true}
          >
            {/* Sustainability fields */}
          </AdvancedOptionsSection>
        )}
        
        {/* Footer with navigation */}
      </form>
    </StepSection>
  </FormProvider>
)
```

### 4. Guided Mode Defaults File: `src/constants/guidedModeDefaults.js`
```javascript
export const GUIDED_MODE_DEFAULTS = {
  mining: {
    applicableProcesses: ["openPit", "drilling"],
    oreGrade: 45,
    location: "India",
    year: new Date().getFullYear(),
    typeOfEquipment: "diesel",
    overburdenRatio: 4.5,
    waterUsage: 0.8,
    biodiversityImpact: "moderate",
    followingSustainableRules: false,
    sustainabilityParameters: {
      equipment_type_electric_or_hybrid: false,
      water_source_recycled_or_surface: false,
      water_usage_capped: 0.2,
      rehabilitation_plan_in_place: true,
      overburden_restored_percent: 70,
      renewable_energy_percent: 15,
      biodiversity_offset_area_ha: 50
    }
  },
  
  beneficiation: {
    processes: ["crushing", "washing_screening"],
    location: "India", // Inherited from mining
    oreFeedRate: 500,
    beneficiationEfficiency: 85,
    waterConsumption: 2.5,
    electricityUse: 150,
    crushingStage: "secondary",
    chemicalAgents: [],
    tailings: "tailing_ponds",
    noiseLevel: "Moderate",
    dustLevel: "Moderate",
    followingSustainableRules: false,
    sustainabilityParameters: {
      water_recycled_percent: 60,
      tailings_storage_type_thickened_or_dry: false,
      bio_based_flocculant_used: false,
      reagent_dosage_optimized: true,
      concentrate_grade_percent: 55,
      renewable_energy_percent: 20
    }
  }
}

// Helper function to apply defaults with inheritance
export function getStepDefaults(stepName, previousStepData = {}) {
  const defaults = { ...GUIDED_MODE_DEFAULTS[stepName] }
  
  // Inherit location from previous step if available
  if (stepName === 'beneficiation' && previousStepData.location) {
    defaults.location = previousStepData.location
  }
  
  return defaults
}
```

---

## 🔧 Backend Integration

### 1. No Breaking Changes Required
The guided mode defaults are **frontend-only** and simply pre-fill the form fields. The backend API remains unchanged:

```
POST /api/wizard/workflows/:id/steps/:stepName
Body: { ...formData }
```

### 2. Optional: Guided Mode Flag (Future Enhancement)
If you want to track which workflows were created in guided mode:

```json
{
  "guidedModeEnabled": true,
  "stepData": { ... }
}
```

Backend can store this flag in the workflow document:
```javascript
// In wizardController.js
updateStep: async (req, res) => {
  const { stepName } = req.params
  const { guidedModeEnabled, ...stepData } = req.body
  
  // Store guided mode flag in metadata
  workflow.metadata = workflow.metadata || {}
  workflow.metadata.guidedModeEnabled = guidedModeEnabled
  
  // Process step data as usual
  workflow[stepName] = stepData
  await workflow.save()
}
```

### 3. Validation Logic Unchanged
The Zod schemas remain the same. Guided mode simply ensures users provide valid default values, reducing validation errors.

---

## 📊 Progress Indicator Enhancement

### Add Guided Mode Badge
```jsx
function ProgressTracker({ currentStep, guidedMode }) {
  return (
    <div className="space-y-2">
      {guidedMode && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <span className="px-2 py-1 bg-blue-100 rounded-full">🔍 Guided</span>
          <span>Smart defaults active</span>
        </div>
      )}
      
      {/* Existing progress tracker */}
    </div>
  )
}
```

---

## 🎯 User Experience Flow

### First-Time User Journey
1. User starts wizard → Guided Mode **enabled by default**
2. Step 1 (Mining): Form pre-filled with smart defaults
   - User reviews defaults
   - Changes only what's necessary (e.g., location, ore grade)
   - Clicks "Next" → saves quickly
3. Step 2 (Beneficiation): Location inherited, other defaults applied
   - User reviews and adjusts
   - Optionally expands "Advanced Options" for fine-tuning
4. User can toggle off Guided Mode at any time to switch to Expert Mode

### Expert User Journey
1. User toggles off Guided Mode
2. All fields shown (no collapsing)
3. No defaults applied (blank form)
4. Full control over all parameters

---

## 🚀 Implementation Phases

### Phase 1: Core Guided Mode (Recommended MVP)
- [ ] Create `GuidedModeToggle` component
- [ ] Create `AdvancedOptionsSection` component
- [ ] Create `guidedModeDefaults.js` constants file
- [ ] Modify `MiningProcessDetails` to support guided mode
- [ ] Modify `BeneficiationDetails` to support guided mode
- [ ] Add guided mode state to parent wizard component

### Phase 2: Enhanced UX
- [ ] Add inline tooltips with help text
- [ ] Add "Why these defaults?" info modal
- [ ] Add visual indicators for pre-filled fields
- [ ] Add smooth expand/collapse animations

### Phase 3: Smart Inheritance
- [ ] Auto-inherit location from Step 1 → Step 2
- [ ] Auto-calculate reasonable defaults based on ore grade
- [ ] Suggest processes based on location (e.g., India → open pit more common)

### Phase 4: User Preferences
- [ ] Save user's guided mode preference in localStorage
- [ ] Allow users to customize their own default templates
- [ ] Add "Reset to Defaults" button

---

## 📝 Field Classification Summary

### MINING
**Essential (4 fields)**:
- Applicable Processes
- Ore Grade
- Location
- Year

**Advanced (5+ fields)**:
- Type of Equipment
- Overburden Ratio
- Water Usage
- Biodiversity Impact
- Red Mud Generation
- AI Predictions (5 fields)

**Sustainability (7 fields)**: Hidden unless explicitly enabled

**Total**: 4 essential + 10+ advanced/optional

---

### BENEFICIATION
**Essential (4 fields)**:
- Applicable Processes
- Ore Feed Rate
- Beneficiation Efficiency
- Location

**Advanced (8+ fields)**:
- Water Consumption
- Electricity Use
- Crushing Stage
- Chemical Agents
- Tailings Management
- Noise Level
- Dust Level
- AI Predictions (5 fields)

**Sustainability (6 fields)**: Hidden unless explicitly enabled

**Total**: 4 essential + 13+ advanced/optional

---

## 🎨 Visual Design Mockup

```
┌───────────────────────────────────────────────────────────────┐
│  LCA Wizard - Aluminium                            Step 1 of 7 │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════╗    │
│  ║ 🔍 Guided Mode Active                                 ║    │
│  ║ We've pre-filled common values. Review & customize.   ║    │
│  ║                                         [Switch to Expert] ║
│  ╚═══════════════════════════════════════════════════════╝    │
│                                                                 │
│  ─────────────── ESSENTIAL FIELDS ───────────────              │
│                                                                 │
│  Mining Processes* ℹ️                                          │
│  [✓ Open Pit]  [✓ Drilling]  [ Strip]  [ Hydraulic]          │
│  [ Manual]  [ Electric Shovel]  ... [Show All 9 Options]      │
│                                                                 │
│  Ore Grade* ℹ️                                                 │
│  ├────────●──────────┤ 45%                                     │
│  0                 100                                         │
│                                                                 │
│  Location* ℹ️                    Year* ℹ️                      │
│  [India          ▼]              [2024        ]                │
│                                                                 │
│  ─────────────── ADVANCED OPTIONS ───────────────              │
│                                                                 │
│  ┌────────────────────────────────────────────────────┐       │
│  │ 🔧 Advanced Options                      [Expand ▼] │       │
│  └────────────────────────────────────────────────────┘       │
│                                                                 │
│  ─────────────── SUSTAINABILITY ───────────────                │
│                                                                 │
│  ┌────────────────────────────────────────────────────┐       │
│  │ ☐ Enable Sustainability Parameters                 │       │
│  │   Track environmental & social impact metrics      │       │
│  └────────────────────────────────────────────────────┘       │
│                                                                 │
│  ─────────────────────────────────────────────────────        │
│                                                                 │
│  [← Back]      [🤖 Generate AI Predictions]      [Next →]     │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

---

## ✅ Benefits Summary

### For New Users
- ✅ Faster onboarding (4 fields vs 15+ fields initially)
- ✅ Less overwhelming interface
- ✅ Smart defaults reduce decision fatigue
- ✅ Can complete wizard in 50% less time

### For Expert Users
- ✅ Can toggle off Guided Mode instantly
- ✅ Full access to all fields when needed
- ✅ No functionality removed
- ✅ Backward compatible with existing workflows

### For Development Team
- ✅ No backend changes required
- ✅ Minimal frontend changes (new components + toggle logic)
- ✅ Easy to test (just form pre-filling)
- ✅ Can be rolled out incrementally (step by step)

---

## 🔄 Next Steps

1. **Review & Approve** this design document
2. **Create new components**: `GuidedModeToggle`, `AdvancedOptionsSection`
3. **Create defaults file**: `guidedModeDefaults.js`
4. **Modify Mining form** with guided mode support
5. **Modify Beneficiation form** with guided mode support
6. **Test** with both guided and expert modes
7. **Iterate** based on user feedback

---

## 📚 References

- Current Forms: `client/src/sections/Wizard/wizardForm.jsx`
- Schemas: Lines 250-420 (Mining), 1100-1200 (Beneficiation)
- UI Components: `client/src/components/ui/`
- Backend API: `server/src/controllers/wizardController.js`

---

**Document Version**: 1.0  
**Last Updated**: December 9, 2025  
**Author**: AI Assistant  
**Status**: Ready for Implementation
