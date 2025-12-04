# AI Prediction Polling Implementation

## Overview
Implemented database polling mechanism for AI predictions where:
1. Backend saves user data to `WizardWorkflow` and returns `{status: 'processing'}`
2. External ML model (deployed separately) watches `WizardWorkflow` and creates predictions in `WizardWorkflowOutput`
3. Frontend polls `WizardWorkflowOutput` every 2 seconds (max 15 attempts = 30 seconds)
4. When predictions found, extract from nested structure and populate form

## Architecture

```
User clicks "Generate AI Predictions"
  ↓
Backend: Save data with smartMergeStepData → Return {status: 'processing'}
  ↓
ML Model (External): Watch WizardWorkflow → Generate predictions → Save to WizardWorkflowOutput
  ↓
Frontend: Poll WizardWorkflowOutput every 2s → Extract nested aiPredictions → Display
```

## Backend Changes

### server/src/controllers/wizardController.js

#### 1. `generateStepPrediction` (lines ~1520-1563)
**Purpose**: Handle "Generate AI Predictions" button click

**Changes Made**:
- Removed: ML function call, WizardWorkflowOutput creation
- Added: `smartMergeStepData()` usage (same logic as Next button)
- Behavior: Save user data and return immediately

```javascript
// Get existing data
const existingData = workflow[stepName]?.toObject?.() || workflow[stepName] || null;

// Use smart merge (same as Next button - preserves values, sets unfilled to null)
const mergedData = smartMergeStepData(stepName, existingData, userData);

// Save to WizardWorkflow
workflow[stepName] = mergedData;
workflow.markModified(stepName);
await workflow.save();

// Return immediately - ML model will process in background
return {
  success: true,
  status: 'processing',
  data: { workflowId, stepName }
};
```

#### 2. `getPredictions` (lines 1585-1650)
**Purpose**: Polling endpoint for frontend to check predictions

**Status**: Already correct, no changes needed

**Returns**:
```javascript
{
  success: true,
  hasPredictions: true/false,
  data: {
    predictions: {
      mining: {
        aiPredictions: {
          mining_ore_grade_percent: {
            prediction: 2.5,
            confidence: 0.85,
            prediction_interval: [2.3, 2.7],
            rmse: 0.15,
            mae: 0.12
          },
          // ... more predictions
        }
      },
      beneficiation: { aiPredictions: {...} },
      // ... other steps
    },
    predictionMetadata: {
      mining: { confidence: 0.85, modelVersion: '1.0', timestamp: '...' }
    }
  }
}
```

## Frontend Changes

### client/src/sections/Wizard/wizardForm.jsx

#### 1. Added Polling Progress State (line ~1719)
```javascript
const [pollingProgress, setPollingProgress] = useState({ current: 0, max: 15 });
```

#### 2. Updated `handleGenerateAIPrediction` (lines ~2140-2280)
**Complete rewrite with 5-step polling flow**:

```javascript
// Step 1: Trigger backend to save user data
const triggerResponse = await generateStepPrediction(workflowId, stepName, mappedData);

if (triggerResponse.status === 'processing') {
  // Step 2: Poll WizardWorkflowOutput every 2 seconds
  setPollingProgress({ current: 0, max: 15 });
  
  const pollResponse = await pollForPredictions(
    workflowId,
    15,  // maxAttempts
    2000,  // interval (2 seconds)
    (attempt, maxAttempts) => {
      setPollingProgress({ current: attempt, max: maxAttempts });
    }
  );
  
  setPollingProgress({ current: 0, max: 15 }); // Reset
  
  // Step 3: Handle polling results
  if (!pollResponse?.success || !pollResponse.data?.hasPredictions) {
    setPredictionError('Predictions still being generated. Please try again.');
    return { success: false, error: 'Polling timeout' };
  }
  
  // Step 4: Extract predictions from nested structure
  const stepPredictions = pollResponse.data.predictions?.[stepName];
  const processedPredictions = {};
  
  Object.entries(stepPredictions.aiPredictions).forEach(([fieldName, predData]) => {
    if (predData && 'prediction' in predData) {
      processedPredictions[fieldName] = predData.prediction;
    }
  });
  
  // Step 5: Merge predictions with current form data
  const mergedData = { ...currentFormData, ...processedPredictions };
  setFormValues(prev => ({ ...prev, [stepName]: mergedData }));
  
  // Store for accept/reject UI (only newly predicted fields)
  const newPredictions = {};
  Object.entries(processedPredictions).forEach(([fieldName, value]) => {
    if (!currentFormData.hasOwnProperty(fieldName) || currentFormData[fieldName] == null) {
      newPredictions[fieldName] = value;
    }
  });
  
  setAiPredictions(prev => ({ ...prev, [stepName]: newPredictions }));
  setPredictionSuccess(`🎉 Successfully loaded ${Object.keys(processedPredictions).length} AI predictions`);
}
```

#### 3. Updated Button UI (lines ~325-340)
Shows polling progress:
```javascript
{predicting 
  ? `Polling... (${pollingProgress.current}/${pollingProgress.max})` 
  : "Generate AI Predictions"}
```

#### 4. Updated All 7 Step Components
Added `pollingProgress={pollingProgress}` prop to:
- Mining (line 718)
- Beneficiation (line 1305)
- Refining (line 2655)
- Smelting (line 3093)
- Manufacturing (line 3557)
- Recycling (line 4002)
- Valorization (line 4534)

#### 5. Updated `StepSection` Component (line ~290)
Added polling progress parameter:
```javascript
function StepSection({
  stepNumber,
  badgeLabel,
  title,
  description,
  children,
  onPredict,
  predicting,
  pollingProgress = { current: 0, max: 15 }, // NEW
  footer,
}) {
```

### client/src/services/aiPredictionService.js

**Status**: Already correct with `pollForPredictions()` function

**Key features**:
- Polls `GET /api/wizard/workflows/:workflowId/predictions`
- 15 attempts max, 2-second intervals
- Progress callback updates UI
- Returns predictions or timeout

## Data Flow

### 1. User Clicks "Generate AI Predictions"
```javascript
// Frontend sends current form data
generateStepPrediction(workflowId, 'beneficiation', {
  beneficiation_ore_grade_percent: 3.0,
  beneficiation_recovery_rate_percent: null,
  // ... other fields
})
```

### 2. Backend Saves with smartMergeStepData
```javascript
// Backend merges with existing data
const existingData = { beneficiation_water_m3_per_t_ore: 5.0 };
const userData = { beneficiation_ore_grade_percent: 3.0 };

// smartMergeStepData logic:
// - Preserve existing values
// - Add new user values
// - Set unfilled required fields to null
const mergedData = {
  beneficiation_water_m3_per_t_ore: 5.0,  // preserved
  beneficiation_ore_grade_percent: 3.0,   // new
  beneficiation_recovery_rate_percent: null  // unfilled
};

// Save to WizardWorkflow
workflow.beneficiation = mergedData;
await workflow.save();

// Return immediately
return { status: 'processing', workflowId: '123' };
```

### 3. ML Model Processes (External Service)
```javascript
// ML model watches WizardWorkflow
// When new data detected, generates predictions
// Saves to WizardWorkflowOutput:
{
  workflowId: '123',
  beneficiation: {
    aiPredictions: {
      beneficiation_recovery_rate_percent: {
        prediction: 85.5,
        confidence: 0.92,
        prediction_interval: [83.0, 88.0],
        rmse: 2.1,
        mae: 1.8
      }
    }
  }
}
```

### 4. Frontend Polls and Extracts
```javascript
// Poll every 2 seconds
for (let attempt = 1; attempt <= 15; attempt++) {
  const response = await fetchWorkflowPredictions(workflowId);
  
  if (response.hasPredictions) {
    // Extract nested predictions
    const predictions = response.predictions.beneficiation.aiPredictions;
    
    // Get prediction values
    const processedPredictions = {
      beneficiation_recovery_rate_percent: predictions.beneficiation_recovery_rate_percent.prediction,
      // ... more fields
    };
    
    // Merge with form data and display
    setFormValues({ ...currentFormData, ...processedPredictions });
    break;
  }
  
  await sleep(2000);
}
```

## Key Features

### 1. Smart Data Merging
- Uses same `smartMergeStepData()` logic as Next button
- Preserves existing values
- Sets unfilled required fields to null
- Consistent behavior across app

### 2. Non-Blocking Polling
- Backend returns immediately with `status: 'processing'`
- Frontend polls in background
- User sees progress: "Polling... (5/15)"
- Max 30 seconds (15 attempts × 2 seconds)

### 3. Nested Prediction Extraction
```javascript
// WizardWorkflowOutput structure:
stepName.aiPredictions.fieldName.prediction

// Example:
beneficiation.aiPredictions.beneficiation_water_m3_per_t_ore.prediction
```

### 4. Accept/Reject UI
- Only stores newly predicted fields (not user-entered)
- Existing accept/reject UI works with polled predictions
- Metadata (confidence, intervals) preserved

### 5. Error Handling
- Timeout: "Predictions still being generated. Please try again."
- No predictions found: Shows warning, doesn't error out
- ML model can still process, predictions may arrive later

## Testing Checklist

- [ ] Click "Generate AI Predictions" with partial form data
- [ ] Verify backend saves data to WizardWorkflow
- [ ] Verify button shows "Polling... (1/15)" progress
- [ ] Wait for ML model to create WizardWorkflowOutput
- [ ] Verify polling detects predictions after creation
- [ ] Verify nested predictions extracted correctly
- [ ] Verify form populated with prediction values
- [ ] Verify accept/reject UI appears for predicted fields
- [ ] Test timeout scenario (no predictions after 30s)
- [ ] Test with all 7 steps (Mining, Beneficiation, Refining, Smelting, Manufacturing, Recycling, Valorization)

## Files Modified

### Backend
- `server/src/controllers/wizardController.js`
  - `generateStepPrediction` function (~lines 1520-1563)
  - Uses `smartMergeStepData` (line 73)

### Frontend
- `client/src/sections/Wizard/wizardForm.jsx`
  - Added `pollingProgress` state (line ~1719)
  - Updated `handleGenerateAIPrediction` (lines ~2140-2280)
  - Updated `StepSection` component (line ~290)
  - Updated button UI (line ~335)
  - Updated all 7 step components to pass `pollingProgress`

### Service Layer
- `client/src/services/aiPredictionService.js` (already correct)

## Example Console Output

```
🤖 [AI Prediction] Button clicked for step: beneficiation
🔄 [AI Prediction] Mapped data (backend format): {...}
🚀 [AI Prediction] Saving user data and triggering ML model...
⏳ [AI Prediction] User data saved. ML model processing in background. Starting to poll...
🔄 [Polling] Attempt 1/15 - Checking WizardWorkflowOutput...
🔄 [Polling] Attempt 2/15 - Checking WizardWorkflowOutput...
🔄 [Polling] Attempt 3/15 - Checking WizardWorkflowOutput...
✅ [AI Prediction] Predictions found in WizardWorkflowOutput
✅ [AI Prediction] Extracted beneficiation_recovery_rate_percent = 85.5
✅ [AI Prediction] Extracted beneficiation_water_m3_per_t_ore = 4.2
🔄 [AI Prediction] Merged data with predictions
🤖 [AI Prediction] Storing predictions for accept/reject UI
📊 [AI Prediction] Successfully processed 5 predictions
```

## Technical Notes

### Why External ML Model?
- ML model is deployed as separate service (not part of backend code)
- Watches `WizardWorkflow` collection for new data
- Runs predictions independently
- Creates `WizardWorkflowOutput` when complete
- Decoupled architecture allows ML model updates without backend changes

### Why Polling Instead of Webhooks?
- Simpler implementation (no webhook endpoints needed)
- Works with external ML service (no direct communication)
- 2-second intervals acceptable for 15-30 second predictions
- Easy to add progress indicator
- No need for WebSockets or Server-Sent Events

### Why smartMergeStepData?
- Consistency with Next button behavior
- Preserves existing user data
- Sets unfilled fields to null (required for ML model)
- Single source of truth for data merging logic

## Future Improvements

1. **Optimistic Updates**: Show spinner immediately when clicking button
2. **Long Polling**: Use longer timeout for complex predictions
3. **Real-time Updates**: Consider WebSockets for instant notification
4. **Partial Predictions**: Display predictions as they arrive (field by field)
5. **Prediction Queue**: Show "Position in queue" if ML model is busy
6. **Retry Logic**: Automatically retry after timeout with user confirmation
