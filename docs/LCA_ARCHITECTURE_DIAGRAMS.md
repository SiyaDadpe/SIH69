# LCA System Architecture Diagrams

## 📐 System Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT SIDE (React)                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────────┐         ┌──────────────────┐        ┌─────────────────┐ │
│  │  Metal Selection│         │   Wizard Form    │        │    Analytics    │ │
│  │   Component     │ ────→   │   (7 Stages)     │  ───→  │    Dashboard    │ │
│  │  (Entry Point)  │         │                  │        │  (5 Tabs)       │ │
│  └─────────────────┘         └──────────────────┘        └─────────────────┘ │
│         │                             │                            │           │
│         │                             │                            │           │
│         ↓                             ↓                            ↓           │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                       Service Layer (API Calls)                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │  │
│  │  │wizardService │  │  lcaService  │  │  api.js      │                 │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                          │
└─────────────────────────────────────┼──────────────────────────────────────────┘
                                      │ HTTP/HTTPS
                                      ↓
┌───────────────────────────────────────────────────────────────────────────────┐
│                            SERVER SIDE (Node.js)                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                           Express Middleware                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │  │
│  │  │   CORS     │  │    Auth    │  │   Logger   │  │   Parser   │      │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘      │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                          │
│                                     ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                             Routes Layer                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │wizardRoutes  │  │  lcaRoutes   │  │  userRoutes  │                │  │
│  │  │   /wizard    │  │    /lca      │  │    /user     │                │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                          │
│                                     ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                          Controllers Layer                              │  │
│  │  ┌────────────────────┐         ┌────────────────────┐                 │  │
│  │  │ wizardController   │         │   lcaController    │                 │  │
│  │  │ - CRUD operations  │         │ - calculateLCA()   │                 │  │
│  │  │ - Validation       │         │ - getReports()     │                 │  │
│  │  └────────────────────┘         └────────────────────┘                 │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                          │
│                                     ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                          Business Logic Layer                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │  │              LCA Calculation Engine                             │   │  │
│  │  │  ┌──────────────────┐  ┌──────────────────┐                    │   │  │
│  │  │  │calculateStage    │  │calculateCircular │                    │   │  │
│  │  │  │Impact()          │  │ityMetrics()      │                    │   │  │
│  │  │  └──────────────────┘  └──────────────────┘                    │   │  │
│  │  │  ┌──────────────────┐  ┌──────────────────┐                    │   │  │
│  │  │  │generate          │  │generateLCAReport │                    │   │  │
│  │  │  │Recommendations() │  │(PDF)             │                    │   │  │
│  │  │  └──────────────────┘  └──────────────────┘                    │   │  │
│  │  └─────────────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                          │
│                                     ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                          Database Layer (Mongoose)                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │WizardWorkflow│  │ CalculateLCA │  │     User     │                │  │
│  │  │    Model     │  │    Model     │  │    Model     │                │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                          │
└─────────────────────────────────────┼──────────────────────────────────────────┘
                                      │
                                      ↓
                            ┌──────────────────┐
                            │   MongoDB Atlas  │
                            │   (Database)     │
                            └──────────────────┘
```

---

## 🔄 LCA Calculation Flow (Detailed)

```
USER FILLS WIZARD FORM
         │
         ↓
┌────────────────────────┐
│  Stage 1: Mining       │ ──→ Auto-save to WizardWorkflow
├────────────────────────┤      Load AI predictions
│ • Mining method        │      User edits/confirms
│ • Ore grade %          │
│ • Production volume    │
│ • Equipment type       │
└────────────────────────┘
         │
         ↓
┌────────────────────────┐
│  Stage 2: Benefic.     │ ──→ Auto-save
├────────────────────────┤      Continue pattern
│ • Process types        │
│ • Ore feed rate        │
│ • Energy use           │
└────────────────────────┘
         │
         ↓
    (Stages 3-7)
         │
         ↓
┌────────────────────────┐
│  Submit Button         │
├────────────────────────┤
│ Triggers calculateLCA()│
└────────────────────────┘
         │
         ↓
         
═══════════════════════════════════════════════════════════════
         BACKEND PROCESSING STARTS
═══════════════════════════════════════════════════════════════

         ↓
┌─────────────────────────────────────────────────┐
│  1. VALIDATION PHASE                            │
├─────────────────────────────────────────────────┤
│  ✓ Authenticate user                            │
│  ✓ Check projectName exists                     │
│  ✓ Check wizardData structure                   │
│  ✓ Verify at least 1 stage has data            │
│  ✓ Validate required fields per stage          │
│    - mining: method, ore_grade, location        │
│    - beneficiation: processes, feed_rate        │
│    - refining: energy, water                    │
│    - smelting: electricity, cell_tech           │
│    - manufacturing: processes, scrap_rate       │
│    - recycling: scrap_input, collection         │
│    - valorization: waste_types, methods         │
└─────────────────────────────────────────────────┘
         │
         ↓ (if validation passes)
         
┌─────────────────────────────────────────────────┐
│  2. CREATE LCA RECORD                           │
├─────────────────────────────────────────────────┤
│  new CalculateLCA({                             │
│    userId: req.user._id,                        │
│    workflowId: workflowId,                      │
│    projectName: projectName,                    │
│    status: 'pending',                           │
│    calculationParams: wizardData keys           │
│  })                                             │
│  .save()                                        │
└─────────────────────────────────────────────────┘
         │
         ↓
         
┌─────────────────────────────────────────────────┐
│  3. STAGE-BY-STAGE CALCULATION                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  FOR EACH STAGE (mining → valorization):       │
│                                                 │
│    ┌──────────────────────────────────────┐   │
│    │ Get Stage Coefficients               │   │
│    │  - energyFactor                      │   │
│    │  - co2Factor                         │   │
│    │  - waterFactor                       │   │
│    │  - wasteFactor                       │   │
│    │  - airQualityFactor                  │   │
│    └──────────────────────────────────────┘   │
│               ↓                                 │
│    ┌──────────────────────────────────────┐   │
│    │ Calculate Base Impacts               │   │
│    │  energy = amount × energyFactor      │   │
│    │  co2 = amount × co2Factor            │   │
│    │  water = amount × waterFactor        │   │
│    │  waste = amount × wasteFactor        │   │
│    │  air = amount × airQualityFactor     │   │
│    └──────────────────────────────────────┘   │
│               ↓                                 │
│    ┌──────────────────────────────────────┐   │
│    │ Apply Stage-Specific Modifiers       │   │
│    │                                       │   │
│    │ IF mining:                            │   │
│    │   Adjust for ore grade               │   │
│    │   Adjust for mining method           │   │
│    │                                       │   │
│    │ IF smelting:                          │   │
│    │   Adjust for renewable energy %      │   │
│    │   Account for electricity source     │   │
│    │                                       │   │
│    │ IF recycling:                         │   │
│    │   Reduce impact by scrap input %     │   │
│    │   Adjust for collection efficiency   │   │
│    │                                       │   │
│    │ (Similar for all 7 stages)           │   │
│    └──────────────────────────────────────┘   │
│               ↓                                 │
│    ┌──────────────────────────────────────┐   │
│    │ Accumulate Totals                    │   │
│    │  totalEnergy += stageEnergy          │   │
│    │  totalCO2 += stageCO2                │   │
│    │  totalWater += stageWater            │   │
│    │  totalWaste += stageWaste            │   │
│    │  totalAir += stageAir                │   │
│    └──────────────────────────────────────┘   │
│                                                 │
│  END FOR EACH                                  │
└─────────────────────────────────────────────────┘
         │
         ↓
         
┌─────────────────────────────────────────────────┐
│  4. CALCULATE INTENSITY METRICS                 │
├─────────────────────────────────────────────────┤
│  productionAmount = 1000 kg (default)           │
│                                                 │
│  energyIntensity = totalEnergy / amount         │
│  carbonIntensity = totalCO2 / amount            │
│                                                 │
│  Result: Impact per kg aluminum produced        │
└─────────────────────────────────────────────────┘
         │
         ↓
         
┌─────────────────────────────────────────────────┐
│  5. CALCULATE CIRCULARITY METRICS               │
├─────────────────────────────────────────────────┤
│                                                 │
│  A. Material Recovery Rate                      │
│     - Find recycling stage                      │
│     - Extract scrap_input_percentage            │
│     - Find valorization stage                   │
│     - Extract waste_utilization_%               │
│     - Sum and cap at 100%                       │
│                                                 │
│  B. Component Scores (0-100 each)               │
│     energyScore = 100 - (energy/max × 100)     │
│     emissionsScore = 100 - (co2/max × 100)     │
│     wasteScore = 100 - (waste/max × 100)       │
│     recoveryScore = materialRecoveryRate        │
│                                                 │
│  C. Weighted Circularity Score                  │
│     score =                                     │
│       energyScore × 0.25 +                      │
│       emissionsScore × 0.30 +                   │
│       wasteScore × 0.20 +                       │
│       recoveryScore × 0.25                      │
│                                                 │
│  D. Rating Assignment                           │
│     ≥85 → Excellent                             │
│     ≥65 → Good                                  │
│     ≥45 → Fair                                  │
│     ≥25 → Poor                                  │
│     <25 → Very Poor                             │
└─────────────────────────────────────────────────┘
         │
         ↓
         
┌─────────────────────────────────────────────────┐
│  6. GENERATE RECOMMENDATIONS                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Rule-Based System:                             │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ IF totalEnergy > 50,000 MJ             │    │
│  │   → HIGH: Switch to renewable energy   │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ IF totalCO2 > 10,000 kg                │    │
│  │   → HIGH: Implement carbon capture     │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ IF no recycling stage                  │    │
│  │   → MEDIUM: Establish recycling        │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ IF waterUsage > 5,000 m³               │    │
│  │   → MEDIUM: Water reclamation system   │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ IF waste > 300 kg                      │    │
│  │   → HIGH: Improve waste valorization   │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ IF airQuality > 2 kg pollutants        │    │
│  │   → MEDIUM: Install emission controls  │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ IF low impact AND high circularity     │    │
│  │   → LOW: Maintain best practices       │    │
│  └────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
         │
         ↓
         
┌─────────────────────────────────────────────────┐
│  7. UPDATE LCA RECORD                           │
├─────────────────────────────────────────────────┤
│  lcaRecord.totalEnergyConsumption = total       │
│  lcaRecord.totalCO2Emissions = total            │
│  lcaRecord.totalWaterUsage = total              │
│  lcaRecord.totalWasteGeneration = total         │
│  lcaRecord.totalAirQualityImpact = total        │
│  lcaRecord.energyIntensity = intensity          │
│  lcaRecord.carbonIntensity = intensity          │
│  lcaRecord.circularityScore = score             │
│  lcaRecord.circularityRating = rating           │
│  lcaRecord.materialRecoveryRate = rate          │
│  lcaRecord.stageData = stageImpacts[]           │
│  lcaRecord.recommendations = recs[]             │
│  (status still 'pending')                       │
└─────────────────────────────────────────────────┘
         │
         ↓
         
┌─────────────────────────────────────────────────┐
│  8. GENERATE PDF REPORT                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  A. Create Filename                             │
│     LCA_Report_{userId}_{timestamp}.pdf         │
│                                                 │
│  B. Setup PDFKit Document                       │
│     - A4 size                                   │
│     - Margins: 50px all sides                   │
│     - Metadata: title, author, keywords         │
│                                                 │
│  C. Generate Sections                           │
│     ┌─────────────────────────────────┐        │
│     │ 1. Header & Title               │        │
│     │    - "LCA ANALYSIS SUMMARY"     │        │
│     │    - Professional formatting    │        │
│     └─────────────────────────────────┘        │
│     ┌─────────────────────────────────┐        │
│     │ 2. Project Information          │        │
│     │    - Project name               │        │
│     │    - Location                   │        │
│     │    - Analysis date              │        │
│     └─────────────────────────────────┘        │
│     ┌─────────────────────────────────┐        │
│     │ 3. Executive Summary            │        │
│     │    - Circularity score          │        │
│     │    - Rating (Excellent/Good...) │        │
│     │    - Key metrics highlights     │        │
│     └─────────────────────────────────┘        │
│     ┌─────────────────────────────────┐        │
│     │ 4. Total Environmental Impacts  │        │
│     │    - Energy: X MJ               │        │
│     │    - CO2: X kg                  │        │
│     │    - Water: X m³                │        │
│     │    - Waste: X kg                │        │
│     │    - Air quality: X kg          │        │
│     └─────────────────────────────────┘        │
│     ┌─────────────────────────────────┐        │
│     │ 5. Stage-by-Stage Breakdown     │        │
│     │    For each of 7 stages:        │        │
│     │    - Stage name                 │        │
│     │    - Energy consumed            │        │
│     │    - Emissions                  │        │
│     │    - Water used                 │        │
│     │    - Waste generated            │        │
│     └─────────────────────────────────┘        │
│     ┌─────────────────────────────────┐        │
│     │ 6. Impact Categories            │        │
│     │    - 🌍 Climate Change          │        │
│     │    - 💧 Water Footprint         │        │
│     │    - ♻️ Circularity            │        │
│     │    - 🏭 Resource Efficiency     │        │
│     └─────────────────────────────────┘        │
│     ┌─────────────────────────────────┐        │
│     │ 7. Recommendations              │        │
│     │    [HIGH] Title                 │        │
│     │      Description                │        │
│     │    [MEDIUM] Title               │        │
│     │      Description                │        │
│     │    (All recommendations)        │        │
│     └─────────────────────────────────┘        │
│     ┌─────────────────────────────────┐        │
│     │ 8. Footer                       │        │
│     │    - Disclaimer                 │        │
│     │    - Generated by LCA Platform  │        │
│     │    - Page numbers               │        │
│     └─────────────────────────────────┘        │
│                                                 │
│  D. Save to File                                │
│     uploads/lca-reports/{filename}.pdf          │
│                                                 │
│  E. Calculate File Size                         │
└─────────────────────────────────────────────────┘
         │
         ↓
         
┌─────────────────────────────────────────────────┐
│  9. MARK RECORD AS COMPLETED                    │
├─────────────────────────────────────────────────┤
│  lcaRecord.markCompleted(                       │
│    pdfUrl: '/uploads/lca-reports/file.pdf',    │
│    filename: 'LCA_Report_...pdf',               │
│    fileSize: 245678 bytes                       │
│  )                                              │
│                                                 │
│  lcaRecord.status = 'completed'                 │
│  lcaRecord.pdfReportUrl = pdfUrl                │
│  lcaRecord.pdfFilename = filename               │
│  lcaRecord.pdfFileSize = fileSize               │
│  lcaRecord.save()                               │
└─────────────────────────────────────────────────┘
         │
         ↓
         
┌─────────────────────────────────────────────────┐
│  10. SEND RESPONSE TO FRONTEND                  │
├─────────────────────────────────────────────────┤
│  res.status(200).json({                         │
│    success: true,                               │
│    message: 'LCA Report Generated',             │
│    data: {                                      │
│      reportId: '673abc...',                     │
│      pdfUrl: '/uploads/...',                    │
│      pdfFilename: 'LCA_Report_...',             │
│      summary: {                                 │
│        projectName,                             │
│        location,                                │
│        analysisDate,                            │
│        totalEnergy,                             │
│        totalCO2,                                │
│        energyIntensity,                         │
│        carbonIntensity,                         │
│        circularityScore,                        │
│        circularityRating,                       │
│        materialRecoveryRate,                    │
│        status: 'completed',                     │
│        createdAt                                │
│      }                                          │
│    }                                            │
│  })                                             │
└─────────────────────────────────────────────────┘
         │
         ↓
         
═══════════════════════════════════════════════════════════════
         FRONTEND RECEIVES RESPONSE
═══════════════════════════════════════════════════════════════

         │
         ↓
┌─────────────────────────────────────────────────┐
│  FRONTEND ACTIONS                               │
├─────────────────────────────────────────────────┤
│  ✓ Show success notification                    │
│  ✓ Store reportId in state                      │
│  ✓ Offer to download PDF                        │
│  ⚠️  Navigation to analytics (MISSING)          │
│  ⚠️  Load data into dashboard (UNCLEAR)         │
└─────────────────────────────────────────────────┘
```

---

## 🔀 Current vs Intended Integration

### Current State (Disconnected):

```
Wizard Form              Analytics Dashboard
     │                          │
     │                          │
     ↓                          ↓
  Submit  ──X──  No Clear  ──X──  Displays
calculateLCA()    Connection     Mock Data
     │                          │
     ↓                          │
  Backend                       │
  Calculates                    │
  LCA Report                    │
     │                          │
     ↓                          │
  Stores in DB  ──────X─────────┘
  (No retrieval)
```

### Intended State (Connected):

```
Wizard Form              Analytics Dashboard
     │                          ↑
     │                          │
     ↓                          │
  Submit  ────→  Navigate  ─────┘
calculateLCA()  with reportId
     │                          │
     ↓                          │
  Backend                       │
  Calculates                    │
  LCA Report                    │
     │                          │
     ↓                          ↓
  Stores in DB  ←──── Fetch Report
  (Retrieval ready)    by reportId
                              │
                              ↓
                    Transform data to
                    analytics format
                              │
                              ↓
                    Display in dashboard
                    - Executive Summary
                    - Process Stages
                    - Recommendations
```

---

## 🗄️ Database Schema Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    MongoDB Collections                   │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│      User        │         │ WizardWorkflow   │
├──────────────────┤         ├──────────────────┤
│ _id              │◄────┐   │ _id              │
│ email            │     │   │ userId ──────────┼─┐
│ name             │     │   │ name             │ │
│ role             │     │   │ metalType        │ │
│ createdAt        │     │   │ status           │ │
└──────────────────┘     │   │                  │ │
        ▲                │   │ mining: {...}    │ │
        │                │   │ beneficiation    │ │
        │                └───┼─ refining        │ │
        │                    │ smelting         │ │
        │                    │ manufacturing    │ │
        │                    │ recycling        │ │
        │                    │ valorization     │ │
        │                    │                  │ │
        │                    │ createdAt        │ │
        │                    └──────────────────┘ │
        │                            ▲            │
        │                            │            │
        │                     Optional Link       │
        │                            │            │
┌──────────────────┐         ┌──────────────────┐ │
│  CalculateLCA    │         │WizardWorkflow    │ │
├──────────────────┤         │   Output         │ │
│ _id              │         ├──────────────────┤ │
│ userId ──────────┼────┐    │ _id              │ │
│ workflowId ──────┼────┼────┼─ workflowId ─────┼─┘
│ projectName      │    │    │ predictions      │
│ location         │    │    │ metadata         │
│                  │    │    │ createdAt        │
│ totalEnergy      │    │    └──────────────────┘
│ totalCO2         │    │
│ totalWater       │    │
│ totalWaste       │    │
│ totalAir         │    │
│                  │    │
│ energyIntensity  │    │
│ carbonIntensity  │    │
│                  │    │
│ circularityScore │    └────────────────────────────┐
│ circularityRating│                                 │
│ materialRecovery │                                 │
│                  │                                 │
│ stageData: [     │         Relationship:          │
│   {              │         ─────────────          │
│     stageName,   │                                 │
│     energy,      │         User has many           │
│     co2,         │         WizardWorkflows         │
│     water,       │                                 │
│     waste        │         User has many           │
│   }              │         CalculateLCA reports    │
│ ]                │                                 │
│                  │         WizardWorkflow          │
│ recommendations  │         can have one            │
│                  │         CalculateLCA report     │
│ pdfReportUrl     │                                 │
│ pdfFilename      │         WizardWorkflow          │
│ pdfFileSize      │         can have one            │
│                  │         WizardWorkflowOutput    │
│ status           │                                 │
│ createdAt        │                                 │
└──────────────────┘                                 │
        ▲                                            │
        │                                            │
        └────────────────────────────────────────────┘
```

---

## 📊 Data Transformation Needed

### What Backend Returns:
```javascript
{
  reportId: "...",
  projectName: "Aluminum Plant 2024",
  totalEnergyConsumption: 45678,
  totalCO2Emissions: 12345,
  circularityScore: 72.5,
  stageData: [
    {
      stageName: "mining",
      energyConsumption: 5000,
      co2Emissions: 1200,
      // ...
    }
  ],
  recommendations: [...]
}
```

### What Analytics Expects:
```javascript
{
  projectName: "Aluminum Plant 2024",
  linearModel: {
    totalCost: 5000000,
    totalEmissions: 25000,
    // ...
  },
  circularModel: {
    totalCost: 4000000,
    totalEmissions: 10000,
    recyclingRate: 65,
    materialCircularity: 72.5,
    // ...
  },
  productionStages: [
    {
      stageName: "Bauxite Mining",
      materialInput: 1000,
      productOutput: 800,
      energyInput: 5000,
      // ...
    }
  ],
  aiRecommendations: [...]
}
```

### Required Adapter:
```javascript
// utils/lcaDataAdapter.js
export function adaptLCAReportForAnalytics(lcaReport) {
  // Map CalculateLCA schema → Analytics expected schema
  
  return {
    projectName: lcaReport.projectName,
    analysisDate: lcaReport.analysisDate,
    
    // Circular model (from LCA calculation)
    circularModel: {
      totalCost: estimateCost(lcaReport.totalEnergyConsumption),
      totalEmissions: lcaReport.totalCO2Emissions,
      waterConsumption: lcaReport.totalWaterUsage,
      recyclingRate: lcaReport.materialRecoveryRate,
      materialCircularity: lcaReport.circularityScore,
      implementationTimeline: estimateTimeline(lcaReport.stageData.length)
    },
    
    // Linear model (baseline comparison)
    linearModel: {
      totalCost: estimateCost(lcaReport.totalEnergyConsumption) * 1.25,
      totalEmissions: lcaReport.totalCO2Emissions * 2.5,
      waterConsumption: lcaReport.totalWaterUsage * 2,
      // ... baseline higher impacts
    },
    
    // Stage data transformation
    productionStages: lcaReport.stageData.map(stage => ({
      stageName: formatStageName(stage.stageName),
      materialInput: estimateMaterialInput(stage),
      productOutput: estimateOutput(stage),
      wasteOutput: stage.wasteGeneration,
      emissions: stage.co2Emissions,
      energyInput: stage.energyConsumption,
      circularMetrics: {
        efficiency: calculateEfficiency(stage),
        // ...
      }
    })),
    
    // Recommendations
    aiRecommendations: lcaReport.recommendations.map(rec => ({
      priority: mapPriority(rec.priority), // HIGH → 4
      title: rec.title,
      description: rec.description,
      efficiencyImpact: estimateEfficiencyImpact(rec),
      emissionImpact: estimateEmissionImpact(rec),
      complexity: estimateComplexity(rec)
    })),
    
    // Comparative metrics
    comparativeMetrics: {
      carbonFootprint: {
        linear: lcaReport.totalCO2Emissions * 2.5,
        circular: lcaReport.totalCO2Emissions,
        reduction: calculateReduction(...)
      },
      waterUsage: {
        linear: lcaReport.totalWaterUsage * 2,
        circular: lcaReport.totalWaterUsage,
        reduction: calculateReduction(...)
      }
    }
  };
}
```

---

## 🎯 Implementation Roadmap

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: Critical Fixes (Week 1)                        │
├─────────────────────────────────────────────────────────┤
│ Day 1-2:                                                │
│   ✓ Create lcaDataAdapter.js                           │
│   ✓ Fix PDF URL construction                           │
│   ✓ Add wizard→analytics navigation                    │
│                                                         │
│ Day 3-4:                                                │
│   ✓ Test adapter with real wizard data                 │
│   ✓ Update analytics components to use adapter         │
│   ✓ Add loading/error states                           │
│                                                         │
│ Day 5:                                                  │
│   ✓ End-to-end testing                                 │
│   ✓ Bug fixes and polish                               │
└─────────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 2: Code Consolidation (Week 2)                    │
├─────────────────────────────────────────────────────────┤
│ Day 1-3:                                                │
│   ✓ Create unified LCAEngine class                     │
│   ✓ Merge lcaController + lcaCalculator logic          │
│   ✓ Extract STAGE_COEFFICIENTS to config               │
│                                                         │
│ Day 4-5:                                                │
│   ✓ Update both Canvas and Wizard to use engine        │
│   ✓ Test both workflows                                │
│   ✓ Remove duplicate code                              │
└─────────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 3: Improvements (Week 3)                          │
├─────────────────────────────────────────────────────────┤
│ Day 1-2:                                                │
│   ✓ Add request cancellation                           │
│   ✓ Implement PDF cleanup job                          │
│   ✓ Add caching layer                                  │
│                                                         │
│ Day 3-4:                                                │
│   ✓ Enhance recommendations engine                     │
│   ✓ Add industry benchmarks                            │
│   ✓ Improve validation with Joi                        │
│                                                         │
│ Day 5:                                                  │
│   ✓ Documentation updates                              │
│   ✓ Performance testing                                │
│   ✓ Deploy to staging                                  │
└─────────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 4: Advanced Features (Future)                     │
├─────────────────────────────────────────────────────────┤
│   □ Real-time calculation progress                      │
│   □ ML-based recommendations                            │
│   □ Multi-tenant support                                │
│   □ Advanced analytics dashboard                        │
│   □ Export to multiple formats                          │
│   □ API for third-party integrations                    │
└─────────────────────────────────────────────────────────┘
```

---

**Generated:** December 4, 2024  
**Version:** 1.0  
**Purpose:** Architecture visualization and implementation guidance
