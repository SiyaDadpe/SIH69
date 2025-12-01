# Aluminum LCA Engine - Complete Setup Guide

This guide will walk you through setting up a conda environment and running the complete LCA engine.

---

## Prerequisites

- **Anaconda** or **Miniconda** installed
- **Python 3.8 - 3.10** (Brightway2 compatibility)
- **MongoDB** running (for Wizard data integration)

---

## Step 1: Create Conda Environment

Open **PowerShell** or **Command Prompt** and navigate to the project directory:

```powershell
# Navigate to the LCA engine directory
cd C:\Users\Hp\Desktop\SIH69\aluminum-lca-engine

# Create a new conda environment named 'lca-engine' with Python 3.9
conda create -n lca-engine python=3.9 -y

# Activate the environment
conda activate lca-engine
```

---

## Step 2: Install Dependencies

```powershell
# Install required packages
pip install -r requirements.txt

# Verify installation
python -c "import brightway2 as bw; print(f'Brightway2 version: {bw.__version__}')"
```

### Required Packages (from requirements.txt):
- `brightway2>=2.4` - LCA framework
- `bw2io>=0.8` - Brightway I/O
- `pandas>=1.3` - Data manipulation
- `numpy>=1.21` - Numerical computing
- `matplotlib>=3.5` - Visualization
- `seaborn>=0.11` - Statistical visualization
- `jupyter>=1.0` - Notebook support
- `python-dotenv>=0.19` - Environment variables
- `pymongo>=4.6` - MongoDB integration
- `google-generativeai>=0.5.0` - AI recommendations

---

## Step 3: Initialize Brightway2 Database

This step sets up the Brightway2 project with biosphere database and LCIA methods:

```powershell
# Initialize Brightway2 with biosphere database
python -m scripts.initialize_bw --project Aluminum_LCA_Engine
```

**Expected Output:**
```
✓ Current Brightway project: Aluminum_LCA_Engine
Running bw2setup() – this may take a minute...
✓ bw2setup complete

Available climate change methods containing 'GWP':
  - ('IPCC 2013', 'climate change', 'GWP 100a')
  - ('IPCC 2021', 'climate change', 'GWP 100a')
  ...

Next steps:
  1. Import foreground/background databases
  2. Adjust Config.DEFAULT_METHODS if needed
  3. Re-run LCA scripts
```

---

## Step 4: Run Demo (Quick Test)

Test the complete system with the demo script:

```powershell
# Run the demonstration
python examples\demo_usage.py
```

**This will:**
1. Initialize the LCA engine
2. Create 4 different scenarios:
   - Baseline (default parameters)
   - Renewable Energy (hydro-powered smelting)
   - High Recycling (75% recycled content)
   - Improved Efficiency (better ore grade)
3. Calculate LCA impacts
4. Generate visualizations
5. Export results to Excel and JSON

**Expected Outputs** (in project root):
- `demo_results.xlsx` - Multi-sheet Excel workbook
- `demo_results.json` - JSON export
- `demo_viz_baseline.png` - Baseline visualization
- `demo_viz_renewable_energy.png` - Renewable scenario chart
- `demo_viz_high_recycling.png` - High recycling chart
- `demo_viz_improved_efficiency.png` - Efficiency chart
- `demo_sensitivity_analysis.xlsx` - Sensitivity analysis

---

## Step 5: Integration with Wizard Data

To calculate LCA for workflows created via the Wizard UI:

### 5.1 Configure MongoDB Connection

Create a `.env` file in the `aluminum-lca-engine` directory:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=lca-platform
```

### 5.2 Calculate LCA for All Workflows

```powershell
# Calculate LCA for all wizard workflows in MongoDB
python -m scripts.calculate_lca_all_workflows
```

### 5.3 Calculate LCA for Specific Workflow

```powershell
# Calculate LCA by workflow ID
python -m scripts.calculate_lca_by_id --workflow-id YOUR_WORKFLOW_ID_HERE
```

### 5.4 Analyze Wizard Data

```powershell
# Analyze all wizard workflows in MongoDB
python -m scripts.analyze_wizard_mongo
```

---

## Step 6: Build Complete Production Chain

For advanced usage, build the full 7-stage aluminum production chain:

```powershell
# Run the complete chain builder
python run_build_chain.py
```

**This creates:**
- Mining activity
- Beneficiation activity
- Refining activity
- Smelting activity
- Manufacturing activity
- Recycling activity
- Valorization activity

**With all:**
- Technosphere exchanges (material flows)
- Biosphere exchanges (environmental flows)
- Complete linkages between stages

---

## Step 7: Run Validation Tests

Verify everything is working correctly:

```powershell
# Run Part 3 validation
python validate_part3.py

# Run complete functionality test
python test_complete_functionality.py

# Run final validation
python final_validation.py
```

---

## API Usage Examples

### Basic Usage (Python)

```python
from src.engine.main_engine import AluminumLCAEngine

# Initialize engine
engine = AluminumLCAEngine()

# Quick analysis with default parameters
results = engine.quick_analysis()

# Print summary
print(f"Total GWP: {results['total_impacts']['GWP 100a']:.2f} kg CO2-eq")
print(f"Stage breakdown:")
for stage, impact in results['stage_contributions']['GWP 100a'].items():
    print(f"  {stage}: {impact:.2f} kg CO2-eq")

# Export results
engine.export_results(results, "my_results.xlsx", format="excel")
```

### Custom Scenario

```python
# Create custom scenario
custom_params = engine.param_manager.create_scenario_from_user_input({
    "smelting": {
        "electricity_kwh_per_kg": 13.2,
        "electricity_source": "hydro"
    },
    "recycling": {
        "scrap_input_fraction": 0.75
    }
})

# Run analysis
results = engine.quick_analysis(parameters=custom_params)
```

### Batch Processing

```python
scenarios = {
    "baseline": baseline_params,
    "renewable": renewable_params,
    "high_recycling": high_recycling_params
}

# Process all scenarios
batch_results = engine.run_batch_analysis(scenarios)

# Compare scenarios
comparison = engine.compare_scenarios(batch_results)
print(comparison)
```

---

## Common Issues & Solutions

### Issue 1: Brightway2 Import Error
**Error:** `ModuleNotFoundError: No module named 'brightway2'`

**Solution:**
```powershell
conda activate lca-engine
pip install brightway2 bw2io
```

### Issue 2: MongoDB Connection Error
**Error:** `pymongo.errors.ServerSelectionTimeoutError`

**Solution:**
- Ensure MongoDB is running: `net start MongoDB` (Windows)
- Check `.env` file has correct `MONGODB_URI`

### Issue 3: LCIA Method Not Found
**Error:** `Method not found in database`

**Solution:**
```powershell
# Re-initialize Brightway2
python -m scripts.initialize_bw --project Aluminum_LCA_Engine
```

### Issue 4: Matplotlib Display Issues
**Error:** Plots not showing or saving

**Solution:**
```powershell
# Install backend
pip install pillow
# Or use different backend
set MPLBACKEND=Agg
```

---

## Project Structure

```
aluminum-lca-engine/
├── src/                          # Source code
│   ├── engine/                   # Core LCA engine
│   │   ├── base_engine.py       # Brightway2 initialization
│   │   ├── calculator.py        # LCA calculations
│   │   ├── database_manager.py  # Database creation
│   │   └── main_engine.py       # Main interface
│   ├── models/                   # Data models
│   │   ├── parameters.py        # Stage parameters
│   │   ├── parameter_manager.py # Parameter management
│   │   └── wizard_input_mapper.py # Wizard integration
│   └── utils/                    # Utilities
│       ├── config.py            # Configuration
│       └── mongo_client.py      # MongoDB client
├── scripts/                      # Utility scripts
│   ├── initialize_bw.py         # Brightway2 setup
│   ├── calculate_lca_all_workflows.py
│   ├── calculate_lca_by_id.py
│   └── analyze_wizard_mongo.py
├── examples/                     # Example usage
│   └── demo_usage.py            # Full demonstration
├── tests/                        # Test suite
├── data/                         # Data files
│   └── default_parameters.json  # Default parameters
├── requirements.txt              # Dependencies
└── setup.py                      # Package setup
```

---

## Next Steps

1. **Explore the Demo**: Run `python examples\demo_usage.py` to see all features
2. **Integrate with Wizard**: Connect to MongoDB and calculate LCA for workflows
3. **Customize Parameters**: Modify `data/default_parameters.json` for your needs
4. **Add Custom Stages**: Extend the engine with new production stages
5. **Generate Reports**: Export results to Excel/JSON for analysis

---

## Support & Documentation

- **Full Documentation**: See `FUNCTIONALITY_CHECK.md`
- **Validation Results**: See `PART3_COMPLETE.md`, `PART4_COMPLETE.md`
- **API Reference**: Check docstrings in source files

---

## Quick Start Checklist

- [ ] Conda environment created (`lca-engine`)
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Brightway2 initialized (`python -m scripts.initialize_bw`)
- [ ] Demo runs successfully (`python examples\demo_usage.py`)
- [ ] MongoDB connected (optional, for Wizard integration)
- [ ] Outputs generated (Excel, JSON, PNG charts)

**Ready to go! 🚀**
