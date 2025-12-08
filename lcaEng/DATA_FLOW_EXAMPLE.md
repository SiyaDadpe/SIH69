# Data Flow Example: Fresh Workflow LCA Processing

## Input Data: `LCA.wizardworkflowoutputs`

```javascript
{
  "_id": ObjectId("674f8a5c3e4b2a1234567890"),
  "workflowId": ObjectId("674f8a5c3e4b2a1234567890"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Aluminum Production Project",
  "metalType": "Aluminium",
  
  // Stage data with user inputs + AI predictions
  "mining": {
    "mining_method": "open pit",
    "location": "Queensland, Australia",
    "mining_ore_grade_percent": 45.5,
    "ore_recovery_percent": 92.0,
    "energy_consumption": 850.0
  },
  
  "beneficiation": {
    "beneficiation_process_Crushing": true,
    "beneficiation_process_Grinding": true,
    "ore_feed_rate": 2500.0,
    "electricity_kwh_per_kg": 1.2
  },
  
  "refining": {
    "energy_use": 12500.0,
    "water_use": 3200.0,
    "red_mud_generation": 450.0,
    "bauxite_to_alumina_ratio": 2.5
  },
  
  "smelting": {
    "electricity_demand": 45000.0,
    "cell_technology": "Hall-Heroult",
    "renewable_energy_percent": 30.0,
    "co2_emissions": 11500.0
  },
  
  "manufacturing": {
    "manufacturing_process_Casting": true,
    "manufacturing_process_Rolling": true,
    "scrap_rate": 8.5,
    "electricity_kwh_per_kg": 8.5
  },
  
  "recycling": {
    "scrap_input_percentage": 25.0,
    "collection_rate": 85.0,
    "electricity_kwh_per_kg": 2.8
  },
  
  "valorization": {
    "waste_types": ["Red Mud", "Spent Pot Lining"],
    "waste_utilization_percentages": 60.0,
    "valorization_methods": ["Construction Materials"]
  },
  
  "updatedAt": ISODate("2025-12-04T10:28:00.000Z"),
  "createdAt": ISODate("2025-12-04T10:15:00.000Z")
}
```

---

## Processing Step

Script executes:
```powershell
python -m scripts.calculate_lca_fresh_workflows --window 15
```

The script:
1. ✅ Finds workflows with `updatedAt >= (now - 15 minutes)`
2. ✅ Reads workflow data from `wizardworkflowoutputs`
3. ✅ Runs Brightway2 LCA calculations
4. ✅ Calculates stage-specific metrics
5. ✅ Structures output with general info + stage objects
6. ✅ Writes to `calculatelca` collection

---

## Output Data: `LCA.calculatelca`

```javascript
{
  // PRIMARY KEY (same as workflowId for easy lookup)
  "_id": ObjectId("674f8a5c3e4b2a1234567890"),
  
  // ========== GENERAL PROJECT INFORMATION ==========
  "workflowId": ObjectId("674f8a5c3e4b2a1234567890"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "projectName": "Aluminum Production Project",
  "metalType": "Aluminium",
  "location": "Queensland, Australia",
  "status": "completed",
  
  // ========== OVERALL LCA METRICS ==========
  "totalEnergyConsumption": 52500.5,      // kWh (sum of all stages)
  "totalCO2Emissions": 12750.25,          // kg CO2e
  "totalWaterUsage": 8500.0,              // m³
  "totalWasteGeneration": 450.5,          // kg
  "totalAirQualityImpact": 2.5,           // kg pollutants
  
  // Intensity metrics (per kg aluminum, assuming 1000 kg production)
  "energyIntensity": 52.5,                // kWh/kg
  "carbonIntensity": 12.75,               // kg CO2e/kg
  
  // Circularity metrics
  "circularityScore": 68.5,               // 0-100 scale
  "circularityRating": "Good",            // Excellent/Good/Fair/Poor/Very Poor
  "materialRecoveryRate": 45.0,           // % of material recovered
  
  // ========== STAGE-SPECIFIC LCA PARAMETERS ==========
  // Clean nested objects for each production stage
  "lcaStages": {
    
    "mining": {
      "energyConsumption": 5000.0,        // kWh for this stage
      "co2Emissions": 1200.0,             // kg CO2e for this stage
      "waterUsage": 2000.0,               // m³ for this stage
      "wasteGeneration": 150.0,           // kg for this stage
      "airQualityImpact": 0.5,            // kg pollutants for this stage
      "completed": true,                  // Stage was completed in workflow
      "parameters": {                     // Original workflow inputs
        "mining_method": "open pit",
        "location": "Queensland, Australia",
        "mining_ore_grade_percent": 45.5,
        "ore_recovery_percent": 92.0,
        "energy_consumption": 850.0
      }
    },
    
    "beneficiation": {
      "energyConsumption": 8000.0,
      "co2Emissions": 1800.0,
      "waterUsage": 3000.0,
      "wasteGeneration": 250.0,
      "airQualityImpact": 0.8,
      "completed": true,
      "parameters": {
        "beneficiation_process_Crushing": true,
        "beneficiation_process_Grinding": true,
        "ore_feed_rate": 2500.0,
        "electricity_kwh_per_kg": 1.2
      }
    },
    
    "refining": {
      "energyConsumption": 12500.0,
      "co2Emissions": 2800.0,
      "waterUsage": 3200.0,
      "wasteGeneration": 450.0,
      "airQualityImpact": 1.8,
      "completed": true,
      "parameters": {
        "energy_use": 12500.0,
        "water_use": 3200.0,
        "red_mud_generation": 450.0,
        "bauxite_to_alumina_ratio": 2.5
      }
    },
    
    "smelting": {
      "energyConsumption": 45000.0,
      "co2Emissions": 11500.0,
      "waterUsage": 500.0,
      "wasteGeneration": 80.0,
      "airQualityImpact": 3.5,
      "completed": true,
      "parameters": {
        "electricity_demand": 45000.0,
        "cell_technology": "Hall-Heroult",
        "renewable_energy_percent": 30.0,
        "co2_emissions": 11500.0
      }
    },
    
    "manufacturing": {
      "energyConsumption": 8500.0,
      "co2Emissions": 1800.0,
      "waterUsage": 1200.0,
      "wasteGeneration": 120.0,
      "airQualityImpact": 0.8,
      "completed": true,
      "parameters": {
        "manufacturing_process_Casting": true,
        "manufacturing_process_Rolling": true,
        "scrap_rate": 8.5,
        "electricity_kwh_per_kg": 8.5
      }
    },
    
    "recycling": {
      "energyConsumption": 2800.0,
      "co2Emissions": 650.0,
      "waterUsage": 400.0,
      "wasteGeneration": 100.0,
      "airQualityImpact": 0.3,
      "completed": true,
      "parameters": {
        "scrap_input_percentage": 25.0,
        "collection_rate": 85.0,
        "electricity_kwh_per_kg": 2.8
      }
    },
    
    "valorization": {
      "energyConsumption": 1500.0,
      "co2Emissions": 350.0,
      "waterUsage": 600.0,
      "wasteGeneration": 50.0,
      "airQualityImpact": 0.2,
      "completed": true,
      "parameters": {
        "waste_types": ["Red Mud", "Spent Pot Lining"],
        "waste_utilization_percentages": 60.0,
        "valorization_methods": ["Construction Materials"]
      }
    }
  },
  
  // ========== IMPACT BREAKDOWN ==========
  "impactBreakdown": [
    {
      "category": "Global Warming Potential",
      "value": 12750.25,
      "unit": "kg CO2e",
      "percentage": 100
    },
    {
      "category": "Water Depletion",
      "value": 8500.0,
      "unit": "m³",
      "percentage": 100
    },
    {
      "category": "Land Use",
      "value": 450.5,
      "unit": "m²",
      "percentage": 100
    }
  ],
  
  // ========== RECOMMENDATIONS ==========
  "recommendations": [
    {
      "priority": "HIGH",
      "title": "Optimize Smelting (Hall-Héroult) Energy Usage",
      "description": "Consider implementing energy recovery systems or switching to renewable energy sources for the smelting process, which consumes 85.7% of total energy."
    },
    {
      "priority": "HIGH",
      "title": "Implement Carbon Capture Technologies",
      "description": "High CO2 emissions detected (12,750 kg). Consider carbon capture and storage (CCS) systems or carbon offset programs."
    },
    {
      "priority": "MEDIUM",
      "title": "Implement Water Recycling Systems",
      "description": "Significant water consumption in refining stage (3,200 m³). Implement closed-loop water systems to reduce usage."
    },
    {
      "priority": "MEDIUM",
      "title": "Improve Air Quality Control",
      "description": "Implement or upgrade air filtration systems, particularly in smelting operations (3.5 kg pollutants)."
    },
    {
      "priority": "LOW",
      "title": "Continue Valorization Practices",
      "description": "Your waste valorization efforts (60% utilization) are commendable. Continue exploring additional waste stream applications."
    }
  ],
  
  // ========== METADATA ==========
  "metadata": {
    "calculationEngine": "Aluminum LCA Engine v1.0",
    "calculationTimestamp": "2025-12-04T10:30:15.523Z",
    "sourceCollection": "wizardworkflowoutputs",
    "lcaMethodology": "Brightway2",
    "impactCategories": ["GWP", "Water Use", "Land Use"]
  },
  
  // ========== TIMESTAMPS ==========
  "analysisDate": ISODate("2025-12-04T10:30:15.523Z"),
  "createdAt": ISODate("2025-12-04T10:30:15.523Z"),
  "updatedAt": ISODate("2025-12-04T10:30:15.523Z")
}
```

---

## Key Features of Output Structure

### ✅ Clean Organization

1. **General Info at Top Level**
   - Easy to query: `db.calculatelca.find({ userId: ... })`
   - Project metadata immediately accessible

2. **Stage-Specific Objects in `lcaStages`**
   - Nested structure: `lcaStages.mining`, `lcaStages.beneficiation`, etc.
   - Each stage has consistent schema
   - Original parameters preserved for reference

3. **No Redundancy**
   - Each metric appears once
   - Clear hierarchy: general → stages → parameters

### ✅ Easy Querying

```javascript
// Get specific stage data
db.calculatelca.findOne(
  { workflowId: ObjectId("...") },
  { "lcaStages.smelting": 1 }
);

// Compare energy across workflows
db.calculatelca.find(
  { userId: ObjectId("...") },
  { projectName: 1, totalEnergyConsumption: 1, circularityScore: 1 }
).sort({ totalEnergyConsumption: 1 });

// Get all high-priority recommendations
db.calculatelca.aggregate([
  { $unwind: "$recommendations" },
  { $match: { "recommendations.priority": "HIGH" } },
  { $project: { projectName: 1, "recommendations": 1 } }
]);

// Stage-wise energy comparison
db.calculatelca.aggregate([
  { $project: {
      projectName: 1,
      miningEnergy: "$lcaStages.mining.energyConsumption",
      smeltingEnergy: "$lcaStages.smelting.energyConsumption"
    }
  }
]);
```

---

## Time Window Logic

```
Current Time: 2025-12-04 10:30:00
Window: 15 minutes
Threshold: 2025-12-04 10:15:00

Query: Find workflows where updatedAt >= 10:15:00

Result:
✅ Workflow updated at 10:28:00 → PROCESSED
✅ Workflow updated at 10:20:00 → PROCESSED
❌ Workflow updated at 10:10:00 → SKIPPED (too old)
```

---

## Usage Examples

### Run Once

```powershell
# Process fresh workflows now
cd aluminum-lca-engine
$env:MONGO_URI="mongodb://localhost:27017/your-db"
python -m scripts.calculate_lca_fresh_workflows
```

### Scheduled (Every 5 Minutes)

**Windows:**
```powershell
# Create run_lca.bat
@echo off
cd C:\path\to\aluminum-lca-engine
set MONGO_URI=mongodb://localhost:27017/your-db
python -m scripts.calculate_lca_fresh_workflows --window 15
```

Schedule with Task Scheduler: Run `run_lca.bat` every 5 minutes

**Linux:**
```bash
# Add to crontab
*/5 * * * * cd /path/to/aluminum-lca-engine && MONGO_URI="mongodb://..." python -m scripts.calculate_lca_fresh_workflows
```

---

## Verification

```javascript
// MongoDB shell
use LCA;

// Check latest LCA result
db.calculatelca.find().sort({createdAt: -1}).limit(1).pretty();

// Verify stage structure
db.calculatelca.findOne({}, {
  projectName: 1,
  totalCO2Emissions: 1,
  'lcaStages.mining.energyConsumption': 1,
  'lcaStages.smelting.energyConsumption': 1
});

// Count workflows with LCA data
db.calculatelca.count();

// List all projects with circularity scores
db.calculatelca.find({}, {
  projectName: 1,
  circularityScore: 1,
  circularityRating: 1
}).sort({ circularityScore: -1 });
```

---

**Last Updated:** December 4, 2025
