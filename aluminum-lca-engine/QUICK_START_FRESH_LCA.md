# Quick Start: Fresh Workflow LCA Calculation

## Overview

This Python script automatically processes **fresh workflows** (updated within the last 15 minutes) from `LCA.wizardworkflowoutputs` and saves calculated LCA data to `LCA.calculatelca` in MongoDB.

## Output Format

### Clean Structure

```javascript
{
  // GENERAL PROJECT INFO (Top Level)
  "_id": workflowId,
  "workflowId": workflowId,
  "userId": userId,
  "projectName": "Aluminum Production Project",
  "metalType": "Aluminium",
  "location": "Queensland, Australia",
  "status": "completed",
  
  // OVERALL LCA METRICS
  "totalEnergyConsumption": 52500.5,    // kWh
  "totalCO2Emissions": 12750.25,        // kg CO2e
  "totalWaterUsage": 8500.0,            // m³
  "totalWasteGeneration": 450.5,        // kg
  "energyIntensity": 52.5,              // kWh/kg
  "carbonIntensity": 12.75,             // kg CO2e/kg
  "circularityScore": 68.5,             // 0-100
  "circularityRating": "Good",
  "materialRecoveryRate": 45.0,         // %
  
  // STAGE-SPECIFIC LCA PARAMETERS (Nested Objects)
  "lcaStages": {
    "mining": {
      "energyConsumption": 5000.0,
      "co2Emissions": 1200.0,
      "waterUsage": 2000.0,
      "wasteGeneration": 150.0,
      "airQualityImpact": 0.5,
      "completed": true,
      "parameters": {}  // Original workflow inputs
    },
    "beneficiation": { /* same structure */ },
    "refining": { /* same structure */ },
    "smelting": { /* same structure */ },
    "manufacturing": { /* same structure */ },
    "recycling": { /* same structure */ },
    "valorization": { /* same structure */ }
  },
  
  "recommendations": [
    {
      "priority": "HIGH",
      "title": "Optimize Smelting Energy",
      "description": "..."
    }
  ],
  
  "metadata": {
    "calculationEngine": "Aluminum LCA Engine v1.0",
    "calculationTimestamp": "2025-12-04T10:30:00Z",
    "sourceCollection": "wizardworkflowoutputs",
    "lcaMethodology": "Brightway2"
  },
  
  "analysisDate": Date,
  "createdAt": Date,
  "updatedAt": Date
}
```

## Usage

### 1. Set Environment Variable

```powershell
$env:MONGO_URI="mongodb://localhost:27017/your-database"
```

### 2. Basic Usage (Default: 15 minutes)

```powershell
cd aluminum-lca-engine
python -m scripts.calculate_lca_fresh_workflows
```

### 3. Custom Time Window

```powershell
# Process workflows from last 30 minutes
python -m scripts.calculate_lca_fresh_workflows --window 30

# Process workflows from last 5 minutes
python -m scripts.calculate_lca_fresh_workflows --window 5
```

### 4. With LLM Recommendations

**Requires:** `GEMINI_API_KEY` environment variable

```powershell
$env:GEMINI_API_KEY="your-api-key"
python -m scripts.calculate_lca_fresh_workflows --llm
```

### 5. Dry Run (Don't Save to Database)

```powershell
# Test without writing to database
python -m scripts.calculate_lca_fresh_workflows --window 15 --dry-run
```

### 6. Custom Collections

```powershell
python -m scripts.calculate_lca_fresh_workflows \
  --db LCA \
  --source wizardworkflowoutputs \
  --target calculatelca
```

## Command Line Options

| Option | Default | Description |
|--------|---------|-------------|
| `--db` | `LCA` | MongoDB database name |
| `--source` | `wizardworkflowoutputs` | Input collection name |
| `--target` | `calculatelca` | Output collection name |
| `--mongo-uri` | (from env) | MongoDB connection URI |
| `--window` | `15` | Time window in minutes |
| `--llm` | `false` | Include AI recommendations |
| `--dry-run` | `false` | Don't write to database |

## Example Output

```
======================================================================
PROCESSING FRESH WORKFLOWS (Last 15 minutes)
Time threshold: 2025-12-04T10:15:00Z
======================================================================

Found 3 fresh workflow(s)

Processing: Aluminum Production Project (ID: 507f1f77bcf86cd799439011)
  Updated at: 2025-12-04T10:28:00Z
  ✓ LCA calculated and saved
  📊 Total Energy: 52500.50 kWh
  📊 Total CO2: 12750.25 kg
  📊 Circularity Score: 68.5/100
  📊 Stages processed: 7

Processing: Secondary Aluminum Recovery (ID: 507f1f77bcf86cd799439012)
  Updated at: 2025-12-04T10:26:00Z
  ✓ LCA calculated and saved
  📊 Total Energy: 28000.00 kWh
  📊 Total CO2: 6500.00 kg
  📊 Circularity Score: 82.0/100
  📊 Stages processed: 5

======================================================================
SUMMARY
======================================================================
  Time window: Last 15 minutes
  Fresh workflows found: 3
  Successfully processed: 3
  Failures: 0
  Results written to: LCA.calculatelca
======================================================================
```

## Scheduled Execution

### Windows Task Scheduler

Run every 5 minutes:

```powershell
# Create a batch file: run_lca.bat
@echo off
cd C:\path\to\aluminum-lca-engine
set MONGO_URI=mongodb://localhost:27017/your-database
python -m scripts.calculate_lca_fresh_workflows --window 15
```

Then schedule with Task Scheduler:
- Trigger: Every 5 minutes
- Action: Run `run_lca.bat`

### Linux Cron Job

```bash
# Edit crontab
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * cd /path/to/aluminum-lca-engine && MONGO_URI="mongodb://localhost:27017/your-database" python -m scripts.calculate_lca_fresh_workflows --window 15
```

## Verification

### Check MongoDB

```javascript
// Connect to MongoDB
use LCA;

// Count documents
db.calculatelca.count();

// View latest LCA result
db.calculatelca.find().sort({createdAt: -1}).limit(1).pretty();

// Check stage-specific data
db.calculatelca.findOne({}, {
  projectName: 1,
  totalCO2Emissions: 1,
  circularityScore: 1,
  'lcaStages.mining': 1,
  'lcaStages.beneficiation': 1
});

// List all workflows with LCA
db.calculatelca.find({}, {
  projectName: 1,
  totalCO2Emissions: 1,
  circularityScore: 1,
  createdAt: 1
});
```

## Troubleshooting

### No workflows found

```
No fresh workflows found in the last 15 minutes.
```

**Solution:** This is normal if no workflows were created/updated recently. Create a test workflow or update an existing one:

```javascript
// Update a workflow to trigger processing
db.wizardworkflowoutputs.updateOne(
  { _id: ObjectId("...") },
  { $set: { updatedAt: new Date() } }
);
```

### MongoDB connection error

```
MONGO_URI environment variable not set
```

**Solution:** Set the environment variable:

```powershell
$env:MONGO_URI="mongodb://localhost:27017/your-database"
```

### Python module not found

```
ModuleNotFoundError: No module named 'brightway2'
```

**Solution:** Install dependencies:

```powershell
cd aluminum-lca-engine
pip install -r requirements.txt
```

## Integration with Backend

The Python script works independently and writes directly to MongoDB. Your Node.js backend can:

1. **Read LCA results** from `LCA.calculatelca` collection
2. **Trigger the script** via scheduled job or on-demand
3. **Query results** by workflowId, userId, or date range

Example Node.js query:

```javascript
// Get LCA result for a specific workflow
const lcaResult = await db.collection('calculatelca').findOne({
  workflowId: ObjectId('...')
});

// Get all LCA results for a user
const userLCAs = await db.collection('calculatelca')
  .find({ userId: ObjectId('...') })
  .sort({ createdAt: -1 })
  .toArray();
```

## Performance

- **Processing time:** ~3-5 seconds per workflow (without LLM)
- **With LLM:** ~5-10 seconds per workflow
- **Recommended window:** 15 minutes for real-time processing
- **Batch size:** Processes all fresh workflows found in time window

## Next Steps

1. **Test the script** with a sample workflow
2. **Set up scheduled execution** (Task Scheduler or cron)
3. **Integrate with backend** to display LCA results
4. **Add monitoring** to track calculation success rate

---

**Version:** 1.0.0  
**Last Updated:** December 4, 2025
