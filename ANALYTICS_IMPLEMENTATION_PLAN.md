# Analytics Implementation Plan - LCA Data Visualization

## Current State Analysis

### ✅ What's Working
1. **Backend**: 
   - LCA calculation saves all metrics to `CalculateLCA` model
   - Fields available: energy, CO2, water, waste, air quality, circularity score, stage data
   - `getLCAReportById` endpoint exists

2. **Frontend**:
   - LCASuccessModal shows after calculation ✅
   - Analytics page has tab structure ✅
   - Basic project selector exists ✅

### ❌ Issues Identified

1. **Backend**: Missing endpoint `/api/lca/calculatelca/:id` (referenced in frontend but doesn't exist)
2. **Frontend**: 
   - Still shows dummy/static data when no reportId
   - Conversion function `convertCalculatelcaToAnalytics` expects wrong field names
   - No workflow selector - users can't choose which workflow to view
   - Visualizations use dummy data instead of real CalculateLCA data

## Recommended Solution (Simple & Effective)

### Phase 1: Fix Backend Endpoint ⭐ HIGH PRIORITY

**Create missing endpoint to get CalculateLCA by ID:**

```javascript
// server/src/controllers/lcaController.js

/**
 * @desc    Get calculatelca report by ID (enriched format for analytics)
 * @route   GET /api/lca/calculatelca/:id
 * @access  Private
 */
const getCalculatelcaById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const report = await CalculateLCA.findOne({ _id: id, userId })
    .select('-__v');

  if (!report) {
    res.status(404);
    throw new Error('LCA report not found');
  }

  // Transform stageData array to object format for frontend
  const lcaStages = {};
  if (report.stageData && Array.isArray(report.stageData)) {
    report.stageData.forEach(stage => {
      lcaStages[stage.stageName] = {
        energyConsumption: stage.energyConsumption,
        co2Emissions: stage.co2Emissions,
        waterUsage: stage.waterUsage,
        wasteGeneration: stage.wasteGeneration,
        airQualityImpact: stage.airQualityImpact,
        completed: stage.completed
      };
    });
  }

  // Return enriched format
  const enrichedReport = {
    _id: report._id,
    workflowId: report.workflowId,
    projectName: report.projectName,
    metalType: report.metalType,
    location: report.location,
    analysisDate: { $date: report.analysisDate.toISOString() },
    status: report.status,
    
    // Totals
    totalEnergyConsumption: report.totalEnergyConsumption,
    totalCO2Emissions: report.totalCO2Emissions,
    totalWaterUsage: report.totalWaterUsage,
    totalWasteGeneration: report.totalWasteGeneration,
    totalAirQualityImpact: report.totalAirQualityImpact,
    
    // Intensity
    energyIntensity: report.energyIntensity,
    carbonIntensity: report.carbonIntensity,
    
    // Circularity
    circularityScore: report.circularityScore,
    circularityRating: report.circularityRating,
    materialRecoveryRate: report.materialRecoveryRate,
    
    // Stage data
    lcaStages: lcaStages,
    
    // Recommendations
    recommendations: report.recommendations,
    
    // PDF
    pdfReportUrl: report.pdfReportUrl,
    pdfFilename: report.pdfFilename,
    
    // Metadata
    createdAt: { $date: report.createdAt.toISOString() },
    updatedAt: { $date: report.updatedAt.toISOString() }
  };

  res.status(200).json({
    success: true,
    data: enrichedReport
  });
});

// Export
module.exports = {
  // ... existing exports
  getCalculatelcaById
};
```

**Add route:**
```javascript
// server/src/routes/lcaRoutes.js
const { 
  // ... existing imports
  getCalculatelcaById 
} = require('../controllers/lcaController');

router.get('/calculatelca/:id', authenticate, getCalculatelcaById);
```

### Phase 2: Fix LCA Success Modal Navigation

**Update LCASuccessModal to navigate to analytics:**

```javascript
// Already correct! Just change button text:
const handleViewReport = () => {
  navigate(`/analytics?reportId=${reportData.reportId}`);
  onClose();
};

// Button should say "View Analytics" not "View Detailed Report"
```

### Phase 3: Add Workflow Selector to Analytics

**Add workflow/report selector at top of analytics page:**

```jsx
// client/src/pages/Analytics.jsx

const [availableReports, setAvailableReports] = useState([]);
const [selectedReportId, setSelectedReportId] = useState(reportId);

useEffect(() => {
  // Fetch all user's LCA reports for selector
  const fetchReports = async () => {
    try {
      const response = await getUserLCAReports({ limit: 100 });
      if (response.success) {
        setAvailableReports(response.data.reports);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };
  
  fetchReports();
}, []);

// Add selector component
<div className="px-6 py-4 bg-white border-b">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Select Workflow to Analyze
  </label>
  <select 
    value={selectedReportId}
    onChange={(e) => {
      setSelectedReportId(e.target.value);
      navigate(`/analytics?reportId=${e.target.value}`);
    }}
    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
  >
    {availableReports.map(report => (
      <option key={report._id} value={report._id}>
        {report.projectName} - {new Date(report.analysisDate).toLocaleDateString()}
      </option>
    ))}
  </select>
</div>
```

### Phase 4: Update Analytics Data Conversion

**Fix the conversion function to match actual CalculateLCA schema:**

```javascript
// client/src/pages/Analytics.jsx

const convertCalculatelcaToAnalytics = (doc) => {
  return {
    // Basic info
    projectName: doc.projectName || 'Aluminum LCA Project',
    location: doc.location || 'Unknown',
    metalType: doc.metalType || 'Aluminium',
    timestamp: doc.analysisDate?.$date || doc.createdAt?.$date || new Date().toISOString(),
    reportId: doc._id || doc.workflowId,

    // Aggregate metrics - USE ACTUAL DATA
    totalGWP: doc.totalCO2Emissions || 0,
    totalEnergy: doc.totalEnergyConsumption || 0,
    totalWater: doc.totalWaterUsage || 0,
    totalWaste: doc.totalWasteGeneration || 0,
    totalAirQuality: doc.totalAirQualityImpact || 0,
    
    // Intensity
    energyIntensity: doc.energyIntensity || 0,
    carbonIntensity: doc.carbonIntensity || 0,
    
    // Circularity
    circularityScore: doc.circularityScore || 0,
    circularityRating: doc.circularityRating || 'Unknown',
    materialRecoveryRate: doc.materialRecoveryRate || 0,

    // Stage-wise data - USE ACTUAL STAGE DATA
    stages: doc.lcaStages || {},

    // Metadata
    calculatedAt: doc.analysisDate?.$date || doc.createdAt?.$date,
    status: doc.status,
    pdfUrl: doc.pdfReportUrl,
    
    // Recommendations
    recommendations: doc.recommendations || []
  };
};
```

### Phase 5: Enhance Visualizations

**Update each tab component to use real data:**

#### ExecutiveSummary.jsx
```jsx
// Show key metrics from actual data
<MetricCard
  title="Total Energy"
  value={selectedProject.totalEnergy}
  unit="MJ"
  icon={<EnergyIcon />}
/>
<MetricCard
  title="Carbon Footprint"
  value={selectedProject.totalGWP}
  unit="kg CO₂e"
  icon={<CO2Icon />}
/>
<MetricCard
  title="Water Usage"
  value={selectedProject.totalWater}
  unit="m³"
  icon={<WaterIcon />}
/>
<MetricCard
  title="Circularity Score"
  value={selectedProject.circularityScore}
  unit="%"
  icon={<CircularIcon />}
  color="green"
/>
```

#### ProcessStages.jsx
```jsx
// Show stage-by-stage breakdown
const stageNames = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {stageNames.map(stageName => {
    const stageData = selectedProject.stages[stageName];
    if (!stageData || !stageData.completed) return null;
    
    return (
      <StageCard
        key={stageName}
        name={stageName}
        energy={stageData.energyConsumption}
        co2={stageData.co2Emissions}
        water={stageData.waterUsage}
        waste={stageData.wasteGeneration}
      />
    );
  })}
</div>

// Add comparison bar chart
<BarChart
  data={stageNames.map(name => ({
    stage: name,
    energy: selectedProject.stages[name]?.energyConsumption || 0,
    co2: selectedProject.stages[name]?.co2Emissions || 0
  }))}
/>
```

#### AIRecommendations.jsx
```jsx
// Show actual recommendations from CalculateLCA
{selectedProject.recommendations.map((rec, idx) => (
  <RecommendationCard
    key={idx}
    priority={rec.priority}
    title={rec.title}
    description={rec.description}
  />
))}
```

## Implementation Steps (In Order)

### Step 1: Backend (15 minutes)
1. ✅ Add `getCalculatelcaById` function to lcaController.js
2. ✅ Export it in module.exports
3. ✅ Add route in lcaRoutes.js: `router.get('/calculatelca/:id', authenticate, getCalculatelcaById)`
4. ✅ Test endpoint with Postman/Thunder Client

### Step 2: Frontend - Modal (5 minutes)
1. ✅ Verify LCASuccessModal navigates to `/analytics?reportId=...`
2. ✅ Update button text to "View Analytics"

### Step 3: Frontend - Workflow Selector (20 minutes)
1. ✅ Add state for available reports
2. ✅ Fetch all reports on component mount
3. ✅ Add dropdown selector UI
4. ✅ Handle selection change to update URL

### Step 4: Frontend - Data Conversion (10 minutes)
1. ✅ Update `convertCalculatelcaToAnalytics` to use correct field names
2. ✅ Remove dummy data fallback (force real data only)
3. ✅ Add error handling for missing data

### Step 5: Frontend - Visualizations (30 minutes)
1. ✅ Update ExecutiveSummary to show real metrics
2. ✅ Update ProcessStages to show real stage data
3. ✅ Update AIRecommendations to show real recommendations
4. ✅ Add loading states and error handling

## Data Visualization Recommendations

### Charts to Implement:

1. **Executive Summary**
   - 4 Metric Cards (Energy, CO2, Water, Circularity)
   - Trend line showing progress over time (if multiple reports)
   - Donut chart for circularity breakdown

2. **Process Stages**
   - Horizontal bar chart comparing stages
   - Stage cards with detailed metrics
   - Flow diagram showing material flow

3. **Linear vs Circular**
   - Side-by-side comparison
   - Sankey diagram for material flows
   - Recovery rate visualization

4. **AI Recommendations**
   - Priority-based card layout
   - Impact estimation per recommendation
   - Implementation timeline

## Benefits of This Approach

✅ **Simple**: Uses existing CalculateLCA model - no schema changes
✅ **Fast**: Most components already exist - just connect real data
✅ **Flexible**: Workflow selector allows comparing different runs
✅ **Accurate**: Shows actual calculated values, not dummy data
✅ **Maintainable**: Clear separation of concerns

## Testing Checklist

- [ ] Backend endpoint returns correct data format
- [ ] LCA calculation saves all required fields
- [ ] Success modal navigates to analytics
- [ ] Workflow selector shows all user reports
- [ ] Selecting different workflows updates analytics
- [ ] All metrics display real calculated values
- [ ] Stage data shows correctly for completed stages
- [ ] Recommendations display from actual calculation
- [ ] PDF download works
- [ ] Error handling for missing/invalid reportId

## Timeline Estimate

- **Backend fixes**: 30 minutes
- **Frontend fixes**: 1.5 hours
- **Testing**: 30 minutes
- **Total**: ~2.5 hours

This is a practical, working solution that delivers real value quickly! 🚀
