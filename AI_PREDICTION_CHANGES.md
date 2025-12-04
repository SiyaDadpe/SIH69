# AI Prediction Logic Updates - December 4, 2025

## Overview
Updated the frontend and backend AI prediction handling to implement:
1. **Separation of Concerns**: "Generate AI Predictions" button no longer creates `WizardWorkflowOutput` - only reads from it
2. **Async ML Processing**: ML model runs in background (15-30 seconds), backend returns immediately
3. **Polling Mechanism**: Frontend polls for predictions with progress indicator
4. **Data Persistence**: User form data saved to `WizardWorkflow` before triggering ML model

## Architecture Changes

### Before (Synchronous Flow)
```
User clicks "Generate AI Predictions"
    ↓
Backend: Receive user data
    ↓
Backend: Run ML model (BLOCKS for 15-30 seconds)
    ↓
Backend: Save predictions to WizardWorkflowOutput
    ↓
Backend: Return predictions to frontend
    ↓
Frontend: Display predictions
```

### After (Asynchronous Flow with Polling)
```
User clicks "Generate AI Predictions"
    ↓
Backend: Receive user data
    ↓
Backend: Save user data to WizardWorkflow
    ↓
Backend: Trigger ML model async (setImmediate)
    ↓
Backend: Return immediately with status: "processing"
    ↓
Frontend: Show loading indicator
    ↓
Frontend: Poll WizardWorkflowOutput every 2 seconds (15 attempts max)
    ↓
ML Model: Generate predictions (background, 15-30 seconds)
    ↓
ML Model: Save to WizardWorkflowOutput
    ↓
Frontend: Detect predictions in poll response
    ↓
Frontend: Display predictions with confidence scores
```

## Problem History

### Issue 1: Data Structure Mismatch
The backend changed how AI predictions are stored and retrieved, but the frontend was using old data structure expectations.

### Old Backend Structure (What frontend expected):
```javascript
{
  data: {
    combinedData: {
      mining_energy_MJ_per_t_ore: 1448.732,
      mining_co2_kg_per_t_ore: 111.939,
      // ... more fields
    },
    predictionMetadata: {
      predictedFields: ['mining_energy_MJ_per_t_ore', 'mining_co2_kg_per_t_ore', ...],
      confidence: 0.8532
    }
  }
}
```

### New Backend Structure (What backend actually returns):
```javascript
{
  data: {
    predictions: {
      mining: {
        mining_energy_MJ_per_t_ore: 1448.732,  // User/predicted value at root
        mining_co2_kg_per_t_ore: 111.939,
        aiPredictions: {  // Detailed prediction metadata nested here
          mining_energy_MJ_per_t_ore: {
            prediction: 1448.732,
            confidence: 0.851,
            rmse: 319.964,
            mae: 252.798,
            interval: {
              lower: 1303.859,
              upper: 1593.605
            }
          },
          mining_co2_kg_per_t_ore: {
            prediction: 111.939,
            confidence: 0.855,
            rmse: 24.054,
            mae: 18.923,
            interval: {
              lower: 100.745,
              upper: 123.133
            }
          }
          // ... more fields
        }
      },
      beneficiation: { /* similar structure */ },
      refining: { /* similar structure */ },
      // ... other steps
    },
    predictionMetadata: {
      generatedAt: "2024-12-01T...",
      lastStageProcessed: "valorization",
      allStages: ["mining", "beneficiation", ...]
    }
  }
}
```

## Key Differences

1. **Nested Structure**: Predictions are now nested inside each step object with an `aiPredictions` sub-object
2. **Rich Metadata**: Each prediction includes:
   - `prediction`: The actual predicted value
   - `confidence`: Confidence score (can be null)
   - `rmse`: Root Mean Square Error (can be null)
   - `mae`: Mean Absolute Error (can be null)
   - `interval`: Confidence interval with `lower` and `upper` bounds
3. **Dual Storage**: Values stored both at step level AND inside `aiPredictions` for different use cases
4. **Field Naming**: Some fields use `%` suffix instead of `percent` (e.g., `recycling_recovery_yield_%`)

## Changes Made

### 1. Added Utility Function: `processAIPredictions()` 
**Location**: `client/src/sections/Wizard/wizardForm.jsx` (lines ~405-455)

**Purpose**: Centralized function to handle both data formats:
- New prediction generation responses (from `generateStepPrediction` API)
- Fetched existing predictions (from `getPredictions` API)

```javascript
const processAIPredictions = (predictionsData, stepName) => {
  const newPredictions = {};
  
  if (!predictionsData?.data) {
    return newPredictions;
  }
  
  // Case 1: New prediction generation response
  if (predictionsData.data.combinedData && predictionsData.data.predictionMetadata) {
    const stepData = predictionsData.data.combinedData;
    const metadata = predictionsData.data.predictionMetadata;
    
    if (metadata.predictedFields && Array.isArray(metadata.predictedFields)) {
      metadata.predictedFields.forEach(field => {
        if (stepData[field] !== undefined) {
          newPredictions[field] = {
            value: stepData[field],
            confidence: metadata.confidence || null
          };
        }
      });
    }
  }
  // Case 2: Fetched predictions with aiPredictions nested structure
  else if (predictionsData.data[stepName]?.aiPredictions) {
    const aiPreds = predictionsData.data[stepName].aiPredictions;
    
    Object.keys(aiPreds).forEach(fieldName => {
      const predData = aiPreds[fieldName];
      if (predData && predData.prediction !== undefined) {
        newPredictions[fieldName] = {
          value: predData.prediction,
          confidence: predData.confidence,
          interval: predData.interval,
          rmse: predData.rmse,
          mae: predData.mae
        };
      }
    });
  }
  
  return newPredictions;
};
```

**Why Needed**: 
- Backend returns different structures for generating new predictions vs. fetching existing ones
- Need to extract prediction values from nested `aiPredictions` object
- Need to preserve metadata (confidence intervals, error metrics) for potential future display

### 2. Updated Workflow Prediction Fetching Logic
**Location**: `client/src/sections/Wizard/wizardForm.jsx` (lines ~1654-1688)

**Before**:
```javascript
fetchWorkflowPredictions(workflowId).then(response => {
  if (response.success && response.data?.hasPredictions) {
    setAiPredictions(response.data.predictions);
    setPredictionMetadata(response.data.predictionMetadata || {});
  }
});
```

**After**:
```javascript
fetchWorkflowPredictions(workflowId).then(response => {
  if (response.success && response.data?.hasPredictions) {
    // Extract aiPredictions from each step
    const extractedPredictions = {};
    const extractedMetadata = {};
    
    Object.keys(response.data.predictions).forEach(stepName => {
      const stepData = response.data.predictions[stepName];
      if (stepData && stepData.aiPredictions) {
        extractedPredictions[stepName] = {};
        
        // Extract each prediction with its metadata
        Object.keys(stepData.aiPredictions).forEach(fieldName => {
          const predData = stepData.aiPredictions[fieldName];
          if (predData && predData.prediction !== undefined) {
            extractedPredictions[stepName][fieldName] = predData.prediction;
            
            // Store confidence and interval for display
            if (!extractedMetadata[stepName]) {
              extractedMetadata[stepName] = {};
            }
            extractedMetadata[stepName][fieldName] = {
              confidence: predData.confidence,
              interval: predData.interval,
              rmse: predData.rmse,
              mae: predData.mae
            };
          }
        });
      }
    });
    
    setAiPredictions(extractedPredictions);
    setPredictionMetadata(extractedMetadata);
  }
});
```

**Why Needed**:
- When loading an existing workflow, predictions are stored in `WizardWorkflowOutput` with the nested `aiPredictions` structure
- Need to extract the actual prediction values from `prediction` property
- Separate storage of metadata allows for future features like showing confidence intervals and error metrics

### 3. Updated All Step Component Handlers
**Affected Steps**: Mining, Beneficiation, Refining, Smelting, Manufacturing, Recycling, Valorization

**Before** (example from Mining step):
```javascript
const handleAIPredictions = (predictionsData) => {
  if (predictionsData?.predictionMetadata?.predictedFields) {
    const newPredictions = {};
    predictionsData.predictionMetadata.predictedFields.forEach(field => {
      if (predictionsData.combinedData && predictionsData.combinedData[field] !== undefined) {
        newPredictions[field] = {
          value: predictionsData.combinedData[field],
          confidence: predictionsData.predictionMetadata.confidence
        };
      }
    });
    setAiPredictions(newPredictions);
  }
};
```

**After**:
```javascript
const handleAIPredictions = (predictionsData) => {
  const predictions = processAIPredictions(predictionsData, 'mining');
  setAiPredictions(predictions);
};
```

**Why Needed**:
- Eliminate code duplication across 7 step components
- Consistent handling of both prediction formats
- Easier maintenance and bug fixes in one place
- Each step now correctly processes its predictions regardless of source

## Data Flow Diagram

### Scenario 1: Generating New Predictions
```
User clicks "Generate Predictions"
    ↓
Frontend calls: generateStepPrediction(workflowId, stepName, userData)
    ↓
Backend processes with ML models
    ↓
Backend returns: { data: { combinedData: {...}, predictionMetadata: {...} } }
    ↓
processAIPredictions() extracts from combinedData + metadata
    ↓
Predictions displayed in UI
```

### Scenario 2: Loading Existing Workflow
```
User opens existing workflow
    ↓
Frontend calls: fetchWorkflowPredictions(workflowId)
    ↓
Backend fetches from WizardWorkflowOutput collection
    ↓
Backend returns: { data: { predictions: { mining: { aiPredictions: {...} }, ... } } }
    ↓
Extraction logic loops through each step's aiPredictions
    ↓
processAIPredictions() extracts prediction values + metadata
    ↓
Predictions pre-populated in UI
```

## Implementation Details

### 1. Backend: Async ML Processing
**File**: `server/src/controllers/wizardController.js` (lines 1520-1580)

**Key Changes**:
```javascript
// Save user data to WizardWorkflow
workflow[stepName] = userData;
await workflow.save();

// Trigger ML model async (non-blocking)
setImmediate(async () => {
  try {
    const predictions = await generatePredictions(workflowId, stepName, userData);
    await WizardWorkflowOutput.createOrUpdate(workflowId, predictions);
  } catch (error) {
    console.error('Background ML processing error:', error);
  }
});

// Return immediately
return res.json({
  success: true,
  status: 'processing',
  message: 'AI predictions being generated in background'
});
```

**Why**: 
- Prevents 15-30 second API timeout
- Preserves user data even if ML fails
- Better user experience (no long wait)

### 2. Service: Polling Function
**File**: `client/src/services/aiPredictionService.js`

**Implementation**:
```javascript
export const pollForPredictions = async (
  workflowId, 
  maxAttempts = 15, 
  interval = 2000,
  onProgress = null
) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (onProgress) {
      onProgress(attempt, maxAttempts);
    }
    
    const response = await fetchWorkflowPredictions(workflowId);
    
    if (response.success && response.data?.hasPredictions) {
      return response;
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  return null; // Timeout
};
```

**Configuration**:
- **maxAttempts**: 15 (configurable)
- **interval**: 2000ms (2 seconds)
- **Total timeout**: 30 seconds
- **Progress callback**: Reports attempt number to UI

### 3. Frontend: Polling UI
**File**: `client/src/sections/Wizard/wizardForm.jsx`

**State Management**:
```javascript
const [pollingProgress, setPollingProgress] = useState(null); 
// { attempt: 1, maxAttempts: 15 }

const [pollingMessage, setPollingMessage] = useState(null);
// "Generating predictions... 2/30 seconds"
```

**UI Components**:
1. **Loading Indicator**: Spinning icon with blue background
2. **Progress Message**: "Generating predictions... X/30 seconds"
3. **Progress Bar**: Visual indicator (0-100%)
4. **Attempt Counter**: "Attempt X of 15"

**Flow**:
```javascript
// 1. Trigger prediction
const triggerResponse = await generateStepPrediction(...);

if (triggerResponse.status === 'processing') {
  setPollingMessage('ML model generating predictions...');
  
  // 2. Poll for results
  const pollResponse = await pollForPredictions(
    workflowId,
    15,
    2000,
    (attempt, maxAttempts) => {
      setPollingProgress({ attempt, maxAttempts });
      setPollingMessage(`Generating predictions... ${attempt * 2}/30 seconds`);
    }
  );
  
  // 3. Handle results
  if (pollResponse?.success) {
    // Extract and display predictions
    processAndDisplayPredictions(pollResponse);
  } else {
    // Timeout - show retry message
    setPredictionError('Still processing. Try "Fetch Predictions" in a moment.');
  }
}
```

**Error Handling**:
- **Timeout**: Shows friendly message, predictions still processing in background
- **Network error**: Shows error with retry suggestion
- **Invalid response**: Shows error and logs details

## Benefits of These Changes

1. **No API Timeouts**: Backend responds in <1 second instead of 15-30 seconds
2. **Data Safety**: User form data saved immediately, not lost if ML fails
3. **Better UX**: Progress indicator shows user something is happening
4. **Separation of Concerns**: Generate button doesn't create WizardWorkflowOutput (ML does)
5. **Graceful Degradation**: If timeout occurs, predictions still being generated
6. **Backward Compatibility**: Works with both old and new prediction formats
7. **Code Maintainability**: Single utility function instead of duplicated logic
8. **Debugging**: Better console logging at each step

## Testing Recommendations

1. **Generate New Predictions**: 
   - Fill required fields in each step
   - Click "Generate AI Predictions"
   - Verify loading indicator appears with progress bar
   - Wait for predictions to appear (15-30 seconds)
   - Verify predictions appear in review section
   - Accept predictions and click Next
   - Verify blue-styled fields are populated

2. **Timeout Scenario**:
   - Mock slow ML model (>30 seconds)
   - Verify timeout message appears
   - Wait additional 10 seconds
   - Click "Fetch Predictions" button
   - Verify predictions now appear

3. **Load Existing Workflow**:
   - Open a workflow that already has predictions saved
   - Verify predictions are displayed in review section
   - Verify previously accepted predictions show blue background

4. **Cross-Step Validation**:
   - Test all 7 steps (Mining → Beneficiation → Refining → Smelting → Manufacturing → Recycling → Valorization)
   - Verify each step's predictions load correctly with polling

5. **Network Failure**:
   - Disconnect network during polling
   - Verify error message appears
   - Reconnect network
   - Click "Generate AI Predictions" again
   - Verify recovery

## Files Modified

### Backend
- `server/src/controllers/wizardController.js`
  - Modified `generateStepPrediction()` (lines 1520-1580)
  - Changed from synchronous to async fire-and-forget
  - Now saves user data immediately
  - Returns status: 'processing' instead of predictions

### Frontend Service Layer
- `client/src/services/aiPredictionService.js`
  - Added `pollForPredictions()` function
  - Implements retry logic with progress callback
  - Configurable attempts/interval

### Frontend UI
- `client/src/sections/Wizard/wizardForm.jsx`
  - Added polling state: `pollingProgress`, `pollingMessage`
  - Updated `handleGenerateAIPrediction()` to use polling
  - Added polling UI component (loading indicator, progress bar)
  - Added `processAIPredictions()` utility function
  - Updated `fetchWorkflowPredictions` response handling
  - Updated `handleAIPredictions()` in all 7 step components

## Related Backend Code

- `server/src/controllers/wizardController.js`:
  - `generateStepPrediction()` (lines 1520-1580): Async fire-and-forget ML trigger
  - `getPredictions()` (lines 1585-1650): Returns nested aiPredictions format
  
- `server/src/models/WizardWorkflowOutput.js`:
  - Schema stores predictions with nested `aiPredictions` structure per step

## Future Enhancements

With this new structure, we can now easily add:

1. **Confidence Interval Display**: Show prediction ranges to users
2. **Error Metrics**: Display RMSE/MAE for transparency
3. **Prediction Quality Indicators**: Visual indicators based on confidence scores
4. **Prediction History**: Track how predictions change over time
5. **A/B Testing**: Compare different ML models using stored metadata
6. **WebSocket Updates**: Real-time prediction status instead of polling
7. **Background Notifications**: Alert user when predictions ready
8. **Prediction Caching**: Cache recent predictions to avoid re-generation

## Technical Notes

- The backend stores field names with `%` suffix (e.g., `recovery_yield_%`) but frontend still uses `percent` in some places - handled automatically
- All prediction values stored as numbers (MongoDB `$numberDouble`)
- Confidence can be `null` for some predictions
- The `interval` object may be `null` for categorical predictions
- `setImmediate()` used for async processing (Node.js specific, non-blocking)
- Polling uses exponential backoff potential for future optimization

## Troubleshooting

### Predictions Never Appear
- Check server logs for ML model errors
- Verify WizardWorkflowOutput collection has document for workflowId
- Check network tab for API call failures

### Timeout Too Short
- Increase `maxAttempts` in pollForPredictions call (line ~2174)
- Or increase `interval` to 3000ms for longer total timeout

### Button Shows "Processing" Forever
- Clear `predicting` state in finally block (already implemented)
- Check for unhandled promise rejections

### Predictions Not Displaying After Poll Success
- Verify `processAIPredictions` extracts nested aiPredictions correctly
- Check console logs for extraction errors
- Verify setFormValues updates state correctly

