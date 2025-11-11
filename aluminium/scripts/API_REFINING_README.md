# Refining Stage API with MongoDB Integration

## Overview
Complete MongoDB-integrated REST API for the aluminium refining stage prediction, mirroring the beneficiation API pattern.

## Setup

### Virtual Environment
A dedicated virtual environment `.venv-refining` has been created:
```powershell
python -m venv .venv-refining
.venv-refining\Scripts\activate
pip install fastapi uvicorn motor pymongo python-dotenv joblib pandas numpy scikit-learn==1.5.2
```

### Environment Variables
Create a `.env` file with:
```
MONGODB_URI=your_mongodb_connection_string
```

## Running the Server
```powershell
.venv-refining\Scripts\python.exe -m uvicorn aluminium.scripts.api_refining:app --host 127.0.0.1 --port 5002 --reload
```

The API will be available at: `http://127.0.0.1:5002`
Interactive API docs: `http://127.0.0.1:5002/docs`

## Endpoints

### Core Endpoints
- **GET /** - Root endpoint with API info
- **GET /health** - Health check (model, preprocessor, database status)
- **GET /model-info** - Model metadata (type, targets, training date)
- **GET /features** - List all input features with types

### Prediction Endpoints
- **POST /predict** - Predict outputs for given refining input (direct prediction, no DB)
  - Input: `RefiningInput` schema (18 fields)
  - Output: Predictions with confidence intervals

### MongoDB Integration Endpoints
- **GET /wizard** - List recent wizard workflows (with pagination)
- **GET /wizard/{workflow_id}/refining** - Retrieve refining object from workflow
- **GET /wizard/{workflow_id}/refining/metadata** - **NEW** Analyze missing fields and propose defaults
- **POST /wizard/{workflow_id}/refining/predict-and-save** - Predict + save to MongoDB + update metadata

## Input Schema: RefiningInput

### Binary Fields (0/1)
**Processes:**
- `process_crushing`
- `process_digestion`
- `process_clarification`
- `process_precipitation`
- `process_calcination`

**Variants:**
- `variant_high_pressure`
- `variant_multi_stage`
- `variant_heat_recovery`
- `variant_green_add`
- `variant_automation`

### Numeric Fields
- `digestionTemperature` (float)
- `digestionPressure` (float)
- `causticConcentration` (float)
- `processIntensityFactor` (float)
- `techImprovementFactor` (float)
- `operationalVariability` (float)

### Categorical Fields
- `location` (string) - One-hot encoded
- `toxicity_Red_Mud` (string) - Ordinal: "Low", "Moderate", "High"

## Metadata Endpoint Details

### GET /wizard/{workflow_id}/refining/metadata
This **NEW** endpoint addresses the requirement for handling missing attributes:

**Purpose:** 
- Identifies which refining fields are missing or empty
- Proposes default values for each field type
- Returns available options (locations, toxicity levels, processes, variants)

**Response Structure:**
```json
{
  "workflowId": "...",
  "refiningObject": {...},
  "analysis": {
    "totalExpectedFields": 10,
    "presentFields": 5,
    "missingFields": 5
  },
  "presentFields": [...],
  "missingFields": [...],
  "proposedDefaults": {
    "redMudToxicity": "Moderate",
    "processes": [],
    "variants": [],
    "digestionTemperature": 145.5,  // median from training
    "causticConcentration": null,
    ...
  },
  "availableOptions": {
    "locations": ["China", "India", "Australia", ...],
    "toxicityLevels": ["Low", "Moderate", "High"],
    "processes": ["crushing", "digestion", "clarification", "precipitation", "calcination"],
    "variants": ["high_pressure", "multi_stage", "heat_recovery", "green_add", "automation"]
  },
  "message": "Fill missing fields before calling predict-and-save..."
}
```

**Use Case:**
1. Client calls `/metadata` to see what's missing
2. User fills in missing values (or accepts proposed defaults)
3. Client calls `/predict-and-save` which auto-enriches with defaults if still missing

## Enrichment & Prediction Flow

### POST /wizard/{workflow_id}/refining/predict-and-save

**Process:**
1. Fetch workflow from `wizardworkflows` or `wizardworkflowoutputs` (multi-collection fallback)
2. Extract `refining` object
3. **Enrich with defaults** for missing fields:
   - `redMudToxicity`: "Moderate"
   - `processes`: [] (empty list)
   - `variants`: [] (empty list)
   - Numeric fields: `None` or median from preprocessing metadata
   - `location`: `None` (must be provided)
4. Map wizard object to `RefiningInput` schema
5. Build feature row with one-hot encoding (location) and ordinal encoding (toxicity)
6. Transform with preprocessor
7. Predict using gradient boosting model
8. Write predictions to `refining.aiPredictions`
9. Update `predictionMetadata.stepsWithPredictions` with "refining" step

**Response:**
```json
{
  "success": true,
  "workflowId": "...",
  "updatedFields": ["refining.field1", "refining.field2", ...],
  "avgConfidence": 0.85,
  "inputUsed": {...},
  "timestamp": "2025-01-...",
  "metadataUpdated": true
}
```

## Mapping Function
`_map_wizard_refining_to_model_input(ref_raw: dict) -> RefiningInput`

**Field Aliases:**
The mapping function handles multiple possible key names from wizard objects:
- Processes: `processes`, `refiningProcesses`
- Variants: `variants`, `refiningVariants`
- Temperature: `digestionTemperature`, `temperature`
- Pressure: `digestionPressure`, `pressure`
- Caustic: `causticConcentration`, `caustic`
- Toxicity: `redMudToxicity`, `toxicity`

## Target Variables
The model predicts multiple refining outcomes (exact targets loaded from `refining_target_names.joblib`):
- Recovery rates
- Product purity metrics
- Process efficiency indicators

## MongoDB Collections
- **Primary:** `wizardworkflows` (active workflows)
- **Fallback:** `wizardworkflowoutputs` (completed workflows)

Both collections support lookups by:
- `_id` (ObjectId)
- `workflowId` (ObjectId field)

## Artifacts
All artifacts are loaded from `aluminium/preprocessing/` and `aluminium/models/`:
- `refining_preprocessor.joblib` (ColumnTransformer)
- `refining_feature_names.joblib` (list of feature names)
- `refining_target_names.joblib` (list of prediction targets)
- `refining_model.joblib` (MultiOutputRegressor with GradientBoostingRegressor)
- `refining_model_metrics.json` (training metrics)
- `refining_model_metadata.json` (training date, versions)
- `refining_preprocessing_metadata.joblib` (numeric stats for defaults)

## Version Notes
- **scikit-learn**: 1.5.2 (models trained with 1.2.2/1.5.1, minor version warnings expected)
- **Python**: 3.13
- **FastAPI**: 0.121.1
- **Motor**: 3.7.1 (async MongoDB driver)
- **PyMongo**: 4.15.3 (sync fallback)

## Key Differences from Beneficiation API
1. **Input fields**: Refining-specific processes (digestion, clarification, etc.) vs beneficiation (crushing, grinding, etc.)
2. **Toxicity encoding**: Red mud toxicity as ordinal feature (Low=0, Moderate=1, High=2)
3. **Enrichment defaults**: Refining-appropriate defaults (redMudToxicity, processes, variants)
4. **Single model**: Uses one MultiOutputRegressor (not separate regressor + classifier)
5. **New metadata endpoint**: Analyzes missing fields before prediction

## Testing
Use the interactive docs at `/docs` to test all endpoints. Example workflow:
1. GET `/wizard` to list workflows
2. GET `/wizard/{id}/refining` to see current refining data
3. GET `/wizard/{id}/refining/metadata` to analyze missing fields
4. POST `/wizard/{id}/refining/predict-and-save` to generate predictions

## Error Handling
- 400: Invalid workflow ID format
- 404: Workflow not found
- 500: Database or prediction errors
- 503: Database not configured

All errors include descriptive detail messages.
