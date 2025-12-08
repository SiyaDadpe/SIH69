# Copper LCA Processing Guide

## Quick Start

### 1. Activate Conda Environment
```powershell
cd C:\Users\Hp\Desktop\SIH69\lcaEng
conda activate lca
```

### 2. Set MongoDB URI
```powershell
$env:MONGO_URI="your_mongodb_connection_string_here"
```

### 3. Run Copper LCA Processor
```powershell
# Basic run (processes once every 10 seconds)
python scripts\calculate_lca_fresh_workflows_copper.py

# With LLM recommendations (requires GEMINI_API_KEY)
$env:GEMINI_API_KEY="your_gemini_key"
python scripts\calculate_lca_fresh_workflows_copper.py --llm

# With custom interval (30 seconds between cycles)
python scripts\calculate_lca_fresh_workflows_copper.py --interval 30

# Dry run (test without writing to database)
python scripts\calculate_lca_fresh_workflows_copper.py --dry-run
```

## What It Does

1. **Reads from**: `LCA.wizardworkflowoutputs`
   - Filters only `metalType: "Copper"` workflows
   - Gets latest version of each workflow by `workflowId`

2. **Processes**:
   - Maps copper-specific fields (`copperMining`, `copperBeneficiation`, etc.) to engine format
   - Calculates LCA metrics (energy, CO2, water, waste, air quality)
   - Computes circularity scores and indices
   - Generates Sankey data for material flows
   - Optional: Gets LLM recommendations

3. **Writes to**: `LCA.calculatelca` (same collection as aluminum!)
   - **Key**: Uses `_id: workflowId` (upserts by workflow ID)
   - **Format**: Same structure as aluminum output
   - **metalType**: Set to "Copper" in output

## Output Structure

```json
{
  "_id": "workflowId",
  "workflowId": "...",
  "userId": "...",
  "projectName": "Copper Test 2",
  "metalType": "Copper",
  "location": "Not specified",
  
  // Overall metrics with units
  "totalEnergyConsumption": {"value": 150.5, "unit": "kWh"},
  "totalCO2Emissions": {"value": 75.3, "unit": "kg CO2-eq"},
  "totalWaterUsage": {"value": 2.5, "unit": "m³"},
  "totalWasteGeneration": {"value": 100.0, "unit": "kg"},
  "totalAirQualityImpact": {"value": 5.2, "unit": "kg PM2.5-eq"},
  
  // Circularity metrics
  "circularityScore": {"value": 65.0, "unit": "score (0-100)"},
  "circularityRating": "Good",
  "materialRecoveryRate": {"value": 85.0, "unit": "%"},
  
  // Stage-specific LCA data
  "lcaStages": {
    "mining": {
      "energyConsumption": {"value": 50.0, "unit": "kWh"},
      "co2Emissions": {"value": 25.0, "unit": "kg CO2-eq"},
      "waterUsage": {"value": 1.0, "unit": "m³"},
      "wasteGeneration": {"value": 50.0, "unit": "kg"},
      "airQualityImpact": {"value": 2.0, "unit": "kg PM2.5-eq"},
      "completed": true,
      "parameters": { /* original copperMining data */ }
    },
    "beneficiation": { /* ... */ },
    "refining": { /* ... */ },
    "smelting": { /* ... */ },
    "manufacturing": { /* ... */ },
    "recycling": { /* ... */ },
    "valorization": { /* ... */ }
  },
  
  // Additional data
  "impactBreakdown": [...],
  "sustainabilityParameters": {...},
  "circularityIndex": {"value": 0.65, "unit": "index (0-1)"},
  "linearityIndex": {"value": 0.35, "unit": "index (0-1)"},
  "circularityComponents": {...},
  "sankeyData": {"nodes": [...], "links": [...]},
  "recommendations": [...],
  "metadata": {...}
}
```

## Copper Input Format (from wizardworkflowoutputs)

The script expects copper workflows with these fields:
- `copperMining` - Mining stage parameters
- `copperBeneficiation` - Beneficiation/concentration stage
- `copperRefining` - Refining stage (split into smelting + electrorefining)
- `copperManufacturing` - Manufacturing stage
- `copperUsePhase` - Use phase parameters
- `copperRecycling` - Recycling stage
- `copperValorization` - Waste valorization stage

Each stage contains:
- Energy/water/waste metrics
- Sustainability parameters
- Process-specific fields

## Comparison with Aluminum

### Aluminum Script:
```powershell
python scripts\calculate_lca_fresh_workflows.py --llm
```
- Reads: `metalType: "Aluminium"`
- Writes to: `LCA.calculatelca`
- metalType in output: "Aluminium"

### Copper Script:
```powershell
python scripts\calculate_lca_fresh_workflows_copper.py --llm
```
- Reads: `metalType: "Copper"`
- Writes to: `LCA.calculatelca` (same collection!)
- metalType in output: "Copper"

## Troubleshooting

### Error: "No copper workflows found"
- Check that workflows in `wizardworkflowoutputs` have `metalType: "Copper"`
- Case insensitive matching is enabled

### Error: Import errors
- Ensure you're in `lcaEng` directory
- Ensure conda environment is activated: `conda activate lca`

### Error: MongoDB connection failed
- Verify `MONGO_URI` environment variable is set
- Check MongoDB connection string is correct

### Error: Missing fields
- All null values in input are handled with safe defaults
- Check that required fields exist in copper workflow document

## Command Examples

### Full Example
```powershell
# Navigate to directory
cd C:\Users\Hp\Desktop\SIH69\lcaEng

# Activate environment
conda activate lca

# Set MongoDB connection
$env:MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/"

# Optional: Set Gemini API key for recommendations
$env:GEMINI_API_KEY="your_key_here"

# Run with all features
python scripts\calculate_lca_fresh_workflows_copper.py --llm --interval 15

# The script will run continuously, processing copper workflows every 15 seconds
```

### Test Run (Dry Run)
```powershell
# Test without writing to database
python scripts\calculate_lca_fresh_workflows_copper.py --dry-run

# Check what would be processed
```

## Stopping the Script

The script runs continuously. To stop it:
- Press `Ctrl+C` in the terminal
