# ✅ Python LCA Engine - Ready to Use

## What You Have

A **Python script** that:
- ✅ Reads from `LCA.wizardworkflowoutputs` 
- ✅ Processes only **fresh workflows** (last 15 minutes)
- ✅ Calculates LCA metrics using Brightway2
- ✅ Saves to `LCA.calculatelca` in **clean format**

## Clean Output Format

```javascript
{
  // GENERAL INFO (Top Level)
  workflowId, userId, projectName, metalType, location,
  totalEnergyConsumption, totalCO2Emissions, circularityScore,
  
  // STAGE-SPECIFIC (Nested Objects)
  lcaStages: {
    mining: { energyConsumption, co2Emissions, ... },
    beneficiation: { energyConsumption, co2Emissions, ... },
    refining: { ... },
    smelting: { ... },
    manufacturing: { ... },
    recycling: { ... },
    valorization: { ... }
  },
  
  recommendations: [...]
}
```

## How to Run

### Quick Start

```powershell
# 1. Set MongoDB connection
$env:MONGO_URI="mongodb://localhost:27017/your-database"

# 2. Run the script
cd aluminum-lca-engine
python -m scripts.calculate_lca_fresh_workflows
```

### Options

```powershell
# Custom time window
python -m scripts.calculate_lca_fresh_workflows --window 30

# With AI recommendations
$env:GEMINI_API_KEY="your-key"
python -m scripts.calculate_lca_fresh_workflows --llm

# Test without saving
python -m scripts.calculate_lca_fresh_workflows --dry-run
```

## Files Created

1. **`scripts/calculate_lca_fresh_workflows.py`**
   - Main Python script
   - Processes fresh workflows
   - Outputs clean structure

2. **`QUICK_START_FRESH_LCA.md`**
   - Complete usage guide
   - All command options
   - Troubleshooting

3. **`DATA_FLOW_EXAMPLE.md`**
   - Full input/output example
   - Query examples
   - Verification steps

## Collections

### Input: `LCA.wizardworkflowoutputs`
- Your existing workflow data
- User inputs + AI predictions
- Script reads from here

### Output: `LCA.calculatelca`
- Clean LCA results
- General info + stage objects
- Script writes to here

## Backend Integration

Your Node.js backend can query the results:

```javascript
// Get LCA for a workflow
const lca = await db.collection('calculatelca').findOne({
  workflowId: ObjectId('...')
});

// Get all LCA for a user
const lcas = await db.collection('calculatelca')
  .find({ userId: ObjectId('...') })
  .sort({ createdAt: -1 })
  .toArray();
```

## Automated Execution

### Option 1: Windows Task Scheduler
Create `run_lca.bat`:
```batch
@echo off
cd C:\path\to\aluminum-lca-engine
set MONGO_URI=mongodb://localhost:27017/your-db
python -m scripts.calculate_lca_fresh_workflows
```

Schedule to run every 5 minutes.

### Option 2: Linux Cron
```bash
*/5 * * * * cd /path/to/aluminum-lca-engine && MONGO_URI="mongodb://..." python -m scripts.calculate_lca_fresh_workflows
```

## Verification

```javascript
// Check MongoDB
use LCA;
db.calculatelca.find().sort({createdAt: -1}).limit(1).pretty();

// Verify structure
db.calculatelca.findOne({}, {
  projectName: 1,
  totalCO2Emissions: 1,
  'lcaStages.mining': 1,
  'lcaStages.smelting': 1
});
```

## Next Steps

1. **Test**: Run `python -m scripts.calculate_lca_fresh_workflows --dry-run`
2. **Verify**: Check output in MongoDB
3. **Automate**: Set up scheduled execution
4. **Integrate**: Query results from your backend
5. **Display**: Show LCA data in your frontend

## Documentation

- **Quick Start**: `QUICK_START_FRESH_LCA.md`
- **Data Flow**: `DATA_FLOW_EXAMPLE.md`
- **This Summary**: `PYTHON_LCA_SUMMARY.md`

## Key Points

✅ **No backend changes needed** - Script works independently  
✅ **Clean data structure** - Easy to query and display  
✅ **Fresh workflows only** - Processes recent data (15 min)  
✅ **Stage-specific objects** - Nested, organized structure  
✅ **Ready to use** - Just set MONGO_URI and run  

---

**Status:** ✅ Ready to Use  
**Last Updated:** December 4, 2025
