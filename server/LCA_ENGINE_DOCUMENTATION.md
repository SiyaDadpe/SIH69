# LCA Engine Documentation

## Overview

The LCA (Life Cycle Assessment) Engine consists of two main components that work together to provide real-time LCA analysis for aluminum production:

1. **LCA Engine Generator** (`lca_engine_generator.py`) - Collects data from 7 aluminum production stage APIs
2. **LCA Display Engine** (`lca_display_engine.py`) - Processes collected data into display-ready format

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Data Flow Pipeline                        │
└─────────────────────────────────────────────────────────────────┘

Step 1: API Data Collection
┌──────────────┐
│   7 APIs     │  Mining (8001)
│   Running    │  Beneficiation (8002)
│   on Ports   │  Refining (8003)
│   8001-8007  │  Smelting (8004)
│              │  Manufacturing (8005)
│              │  Recycling (8006)
│              │  Valorization (8007)
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  lca_engine_         │  • Calls all 7 APIs
│  generator.py        │  • Aggregates predictions
│                      │  • Calculates totals
│  LCAEngineGenerator  │  • Provides fallback data
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  lca_engine_         │  {
│  output.json         │    "metadata": {...},
│                      │    "stages": {...},
│  Intermediate Data   │    "aggregated_metrics": {...}
└──────┬───────────────┘  }
       │
       ▼
┌──────────────────────┐
│  lca_display_        │  • Categorizes impacts
│  engine.py           │  • Calculates circularity
│                      │  • Generates recommendations
│  LCADisplayEngine    │  • Creates visualizations
└──────┬───────────────┘
       │
       ├──────────────────┐
       ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│  lca_display_    │  │  lca_summary_    │
│  output.json     │  │  report.txt      │
│                  │  │                  │
│  Frontend Ready  │  │  Human Readable  │
└──────────────────┘  └──────────────────┘
```

---

## Component 1: LCA Engine Generator

### Purpose
Collects predictions from all 7 aluminum production stage APIs and consolidates them into a single JSON file.

### Key Features
- ✅ Calls 7 independent FastAPI services
- ✅ Fallback data when APIs are unavailable
- ✅ Aggregated metrics calculation
- ✅ Timestamp-based output files
- ✅ Comprehensive logging

### Input Parameters
```python
{
    "ore_grade": 0.45,
    "energy_intensity": 250.0,
    "electricity_mix_renewable": 0.40,
    "bauxite_quality": 8.5,
    "electricity_source": "renewable",
    "recycled_content": 0.30,
    "processing_temperature": 960.0
}
```

### Output Format (`lca_engine_output.json`)
```json
{
  "metadata": {
    "timestamp": "2025-10-25T13:10:11.881967",
    "version": "1.0.0",
    "metal": "Aluminum",
    "location": "Odisha",
    "year": 2024
  },
  "stages": {
    "mining": {
      "predictions": {
        "mining_energy_MJ_per_t_ore": {"prediction": 465.0, "confidence": 0.85},
        "mining_co2_kg_per_t_ore": {"prediction": 71.0, "confidence": 0.85}
      },
      "source": "api" or "fallback"
    },
    // ... 6 more stages
  },
  "aggregated_metrics": {
    "total_energy_MJ": 113015.0,
    "total_co2_kg": 2471.0,
    "energy_intensity_MJ_per_kg_aluminum": 113.02,
    "carbon_intensity_kg_per_kg_aluminum": 2.47
  }
}
```

### Usage
```bash
python lca_engine_generator.py
```

---

## Component 2: LCA Display Engine

### Purpose
Transforms raw LCA data into a structured, display-ready format with impact categorization, circularity metrics, and AI-powered recommendations.

### Key Features
- ✅ **Impact Categorization**: Automatically categorizes metrics into 5 impact categories
- ✅ **Stage Processing**: Processes each stage individually with confidence scores
- ✅ **Overall Impact Analysis**: Calculates totals and stage contributions
- ✅ **Circularity Metrics**: Computes circularity score (0-100) and rating
- ✅ **AI Recommendations**: Generates actionable insights with priority levels
- ✅ **Visualization Data**: Provides ready-to-use arrays for charts

### Impact Categories

| Category | Icon | Color | Keywords | Unit |
|----------|------|-------|----------|------|
| Energy | ⚡ | #F59E0B | energy, electricity, mj | MJ |
| CO2 | 🌍 | #10B981 | co2, emission, carbon | kg CO₂e |
| Water | 💧 | #3B82F6 | water, h2o | m³ |
| Waste | ♻️ | #8B5CF6 | waste, red_mud, slag, scrap | kg |
| Air Quality | 💨 | #EF4444 | sox, nox, pm, pfc | kg |

### Output Format (`lca_display_output.json`)

#### Structure
```json
{
  "metadata": {
    "timestamp": "2025-10-25T13:27:41.926084",
    "version": "1.0.0",
    "metal": "Aluminum",
    "location": "Odisha",
    "engine": "LCA Display Engine"
  },
  
  "summary": {
    "total_energy_MJ": 113015.0,
    "total_co2_kg": 2471.0,
    "energy_intensity": 113.02,
    "carbon_intensity": 2.47,
    "stages_analyzed": 7,
    "circularity_score": 50.7
  },
  
  "stages": {
    "mining": {
      "stage_id": "mining",
      "stage_name": "Mining & Extraction",
      "status": "fallback",
      "impacts": {
        "energy": {"value": 465.0, "unit": "MJ", "confidence": 0.85},
        "co2": {"value": 71.0, "unit": "kg CO₂e", "confidence": 0.85}
      },
      "metrics": [/* individual metrics */],
      "raw_data": {/* original stage data */}
    }
    // ... 6 more stages
  },
  
  "overall_impacts": {
    "energy": {
      "name": "Energy Consumption",
      "total": 113015.0,
      "unit": "MJ",
      "icon": "⚡",
      "color": "#F59E0B",
      "contributions": [
        {
          "stage": "smelting",
          "stage_name": "Smelting (Hall-Héroult)",
          "value": 51000.0,
          "percentage": 45.13,
          "confidence": 0.9
        }
        // ... sorted by value
      ]
    }
    // ... 4 more categories
  },
  
  "circularity_metrics": {
    "circularity_score": 50.7,
    "material_recovery_rate": 33.0,
    "recycling_efficiency": 0.9,
    "valorization_efficiency": 65.0,
    "waste_reduction": 25.0,
    "rating": {
      "level": "Fair",
      "color": "#F59E0B",
      "icon": "⭐"
    }
  },
  
  "recommendations": [
    {
      "priority": "high",
      "category": "Energy Efficiency",
      "title": "Optimize Smelting Energy Usage",
      "description": "The Smelting stage accounts for 45.1% of total energy...",
      "impact": "High",
      "potential_savings": "15300 MJ",
      "stage": "smelting"
    }
    // ... more recommendations
  ],
  
  "visualization_data": {
    "stage_names": ["Mining & Extraction", "Beneficiation", ...],
    "stage_ids": ["mining", "beneficiation", ...],
    "energy_by_stage": [465.0, 850.0, 12500.0, ...],
    "co2_by_stage": [71.0, 95.0, 450.0, ...],
    "water_by_stage": [0.0, 2.5, 0.0, ...]
  }
}
```

### Circularity Score Calculation

The circularity score (0-100) is calculated as:

```
Circularity Score = 
  (Material Recovery Rate × 0.4) +     // 40% weight
  (Waste Reduction / 100 × 30) +       // 30% weight
  30                                    // 30% base score
```

**Ratings:**
- 80-100: Excellent ⭐⭐⭐ (Green)
- 60-79: Good ⭐⭐ (Blue)
- 40-59: Fair ⭐ (Orange)
- 0-39: Poor ⚠️ (Red)

### Recommendation Generation

The engine generates AI-powered recommendations based on:

1. **Energy Consumption**: If > 50,000 MJ → High priority energy optimization
2. **CO2 Emissions**: If > 1,000 kg → High priority carbon reduction
3. **Circularity**: If < 70% → Medium priority circularity improvement
4. **Water Usage**: If > 2 m³ → Medium priority water conservation
5. **Valorization**: If < 50% → Low priority waste valorization

### Usage
```bash
python lca_display_engine.py
```

---

## Frontend Integration

### Using the Display Output

The `lca_display_output.json` is designed for direct frontend consumption:

#### 1. Summary Dashboard
```javascript
const { summary } = lca_data;

<div className="summary-cards">
  <Card>
    <h3>Energy Consumption</h3>
    <p>{summary.total_energy_MJ.toLocaleString()} MJ</p>
  </Card>
  <Card>
    <h3>CO₂ Emissions</h3>
    <p>{summary.total_co2_kg.toLocaleString()} kg</p>
  </Card>
  <Card>
    <h3>Circularity Score</h3>
    <p>{summary.circularity_score}%</p>
  </Card>
</div>
```

#### 2. Stage Breakdown Charts
```javascript
const { visualization_data } = lca_data;

<BarChart
  labels={visualization_data.stage_names}
  data={visualization_data.energy_by_stage}
/>
```

#### 3. Impact Category Breakdown
```javascript
const { overall_impacts } = lca_data;

Object.entries(overall_impacts).map(([key, impact]) => (
  <div key={key} className="impact-card" style={{borderColor: impact.color}}>
    <span className="icon">{impact.icon}</span>
    <h4>{impact.name}</h4>
    <p className="total">{impact.total} {impact.unit}</p>
    <div className="contributions">
      {impact.contributions.slice(0, 3).map(contrib => (
        <div>
          <span>{contrib.stage_name}</span>
          <span>{contrib.percentage}%</span>
        </div>
      ))}
    </div>
  </div>
))
```

#### 4. Recommendations
```javascript
const { recommendations } = lca_data;

recommendations.map(rec => (
  <div className={`recommendation priority-${rec.priority}`}>
    <h4>{rec.title}</h4>
    <p>{rec.description}</p>
    <span className="category">{rec.category}</span>
    {rec.potential_savings && (
      <p className="savings">Potential Savings: {rec.potential_savings}</p>
    )}
  </div>
))
```

#### 5. Circularity Metrics
```javascript
const { circularity_metrics } = lca_data;

<div className="circularity-card">
  <h3>Circularity Performance</h3>
  <div className="score" style={{color: circularity_metrics.rating.color}}>
    <span className="value">{circularity_metrics.circularity_score}%</span>
    <span className="icon">{circularity_metrics.rating.icon}</span>
    <span className="level">{circularity_metrics.rating.level}</span>
  </div>
  <div className="metrics">
    <div>Material Recovery: {circularity_metrics.material_recovery_rate}%</div>
    <div>Recycling Efficiency: {circularity_metrics.recycling_efficiency}%</div>
    <div>Valorization: {circularity_metrics.valorization_efficiency}%</div>
  </div>
</div>
```

---

## Complete Workflow

### Step 1: Generate LCA Engine Output
```bash
cd c:\Users\OMEN-AYAN\Desktop\mohanbabu\aluminium\scripts
python lca_engine_generator.py
```
**Output**: `lca_engine_output.json`

### Step 2: Process for Display
```bash
python lca_display_engine.py
```
**Outputs**: 
- `lca_display_output.json` (for frontend)
- `lca_summary_report.txt` (human-readable)

### Step 3: Frontend Integration
```javascript
// In your React component
const [lcaData, setLcaData] = useState(null);

useEffect(() => {
  fetch('/api/lca/display-output')
    .then(res => res.json())
    .then(data => setLcaData(data));
}, []);
```

---

## File Structure

```
aluminium/
├── scripts/
│   ├── lca_engine_generator.py      # Step 1: Data collection
│   ├── lca_display_engine.py        # Step 2: Data processing
│   ├── lca_engine_output.json       # Intermediate output
│   ├── lca_display_output.json      # Final display output
│   ├── lca_summary_report.txt       # Text summary
│   └── LCA_ENGINE_DOCUMENTATION.md  # This file
│
├── api_mining.py (port 8001)
├── api_bene.py (port 8002)
├── api_refining.py (port 8003)
├── api_smelting.py (port 8004)
├── api_manu.py (port 8005)
├── api_recycling.py (port 8006)
└── api_valo.py (port 8007)
```

---

## API Endpoints (Future Implementation)

### Generate LCA Engine Output
```
POST /api/lca/generate
Content-Type: application/json

{
  "ore_grade": 0.45,
  "energy_intensity": 250.0,
  "electricity_mix_renewable": 0.40,
  "bauxite_quality": 8.5
}

Response: lca_engine_output.json
```

### Get Display Output
```
GET /api/lca/display-output
Response: lca_display_output.json
```

### Get Specific Stage
```
GET /api/lca/stages/smelting
Response: Stage-specific data from lca_display_output.json
```

### Get Recommendations
```
GET /api/lca/recommendations
Query params: priority=high|medium|low
Response: Filtered recommendations array
```

---

## Key Metrics Explained

### Energy Intensity
**Formula**: `Total Energy (MJ) / kg of Aluminum Produced`
- Industry Average: 50-150 MJ/kg
- Best Practice: <100 MJ/kg

### Carbon Intensity
**Formula**: `Total CO₂ (kg) / kg of Aluminum Produced`
- Industry Average: 10-15 kg CO₂e/kg
- Best Practice: <8 kg CO₂e/kg

### Material Recovery Rate
**Formula**: `(Recycling Efficiency + Valorization Efficiency) / 2`
- Target: >60%
- Excellent: >80%

---

## Customization Guide

### Adding New Impact Categories

Edit `lca_display_engine.py`:

```python
self.impact_categories = {
    # ... existing categories
    'biodiversity': {
        'name': 'Biodiversity Impact',
        'unit': 'species',
        'keywords': ['biodiversity', 'habitat', 'species'],
        'icon': '🦋',
        'color': '#A855F7'
    }
}
```

### Modifying Circularity Formula

Edit `generate_circularity_metrics()`:

```python
circularity_score = min(100, (
    material_recovery * 0.5 +        # 50% weight
    (waste_reduction / 100) * 30 +   # 30% weight
    recycling_rate * 0.2             # 20% weight
))
```

### Adding Custom Recommendations

Edit `generate_recommendations()`:

```python
# Add your custom logic
if custom_condition:
    recommendations.append({
        'priority': 'high',
        'category': 'Custom Category',
        'title': 'Custom Recommendation',
        'description': 'Custom description',
        'impact': 'High',
        'stage': 'applicable_stage'
    })
```

---

## Troubleshooting

### Issue: APIs not responding
**Solution**: The generator uses fallback data automatically. Check API status:
```bash
curl http://localhost:8001/health
```

### Issue: Missing metrics in output
**Solution**: Check keyword matching in `categorize_impact()` method. Add missing keywords to impact categories.

### Issue: Low confidence scores
**Solution**: Improve ML model training data or adjust confidence thresholds in API responses.

### Issue: Incorrect circularity calculation
**Solution**: Verify that recycling and valorization metrics are properly extracted in `generate_circularity_metrics()`.

---

## Best Practices

1. **Run Generator First**: Always run `lca_engine_generator.py` before `lca_display_engine.py`
2. **Check Timestamps**: Verify metadata timestamps match between files
3. **Monitor Confidence**: Low confidence scores (<0.7) indicate unreliable predictions
4. **Update Regularly**: Re-run both scripts when input parameters change
5. **Validate Output**: Check `lca_summary_report.txt` for sanity checks

---

## Performance Metrics

- **Generator Runtime**: ~5-10 seconds (with API calls)
- **Display Engine Runtime**: <1 second (pure processing)
- **JSON File Size**: ~100-200 KB (display output)
- **Memory Usage**: <50 MB

---

## Version History

### v1.0.0 (2025-10-25)
- ✅ Initial release
- ✅ 7-stage aluminum production support
- ✅ 5 impact categories
- ✅ Circularity metrics calculation
- ✅ AI-powered recommendations
- ✅ Visualization-ready output
- ✅ Comprehensive documentation

---

## Contact & Support

For issues, questions, or feature requests, refer to the project documentation or contact the development team.

---

**Generated by**: LCA Display Engine v1.0.0  
**Last Updated**: October 25, 2025  
**License**: MIT
