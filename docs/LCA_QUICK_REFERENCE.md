# LCA System - Quick Reference Guide

## 📋 What This System Does

Calculates environmental impact for aluminum production lifecycle across 7 stages:
1. **Mining** - Bauxite extraction
2. **Beneficiation** - Ore concentration
3. **Refining** - Alumina production (Bayer process)
4. **Smelting** - Aluminum metal production (Hall-Héroult)
5. **Manufacturing** - Product fabrication
6. **Recycling** - Scrap recovery
7. **Valorization** - Waste utilization

**Output:** PDF report with circularity score (0-100), environmental metrics, and recommendations.

---

## 🎯 Main Issues Found

| # | Issue | Severity | Impact | Fix Time |
|---|-------|----------|--------|----------|
| 1 | Two calculation engines (lcaController + lcaCalculator) | 🔴 Critical | Maintenance nightmare | 2 days |
| 2 | Frontend-backend data mismatch | 🔴 Critical | Analytics broken | 1 day |
| 3 | No wizard→analytics navigation | 🔴 Critical | Users can't see results | 4 hours |
| 4 | PDF URL construction bug | 🟡 High | Downloads fail | 1 hour |
| 5 | Hardcoded magic numbers | 🟡 High | Inflexible | 2 hours |
| 6 | No request cancellation | 🟡 High | Resource waste | 2 hours |
| 7 | Fragile field validation | 🟡 High | Breaks easily | 3 hours |
| 8 | Mock data in production | 🟢 Medium | Confusing | 1 day |
| 9 | No PDF cleanup | 🟢 Medium | Disk fills up | 3 hours |
| 10 | No loading states | 🟢 Medium | Poor UX | 4 hours |

---

## 🚀 Quick Wins (Can Do Right Now)

### 1. Fix PDF Download (5 min)
**File:** `client/src/services/lcaService.js` line 149

```javascript
// Replace:
const baseUrl = apiUrl.replace(/\/api$/, '');
fullUrl = `${baseUrl}${pdfUrl}`;

// With:
const baseUrl = new URL(apiUrl).origin;
const fullUrl = new URL(pdfUrl, baseUrl).href;
```

### 2. Add Post-Calculation Navigation (10 min)
**File:** `client/src/sections/Wizard/wizardForm.jsx` line ~2288

```javascript
// After calculateLCA success:
if (response.success) {
  const reportId = response.data.reportId;
  setTimeout(() => {
    window.location.href = `/analytics?reportId=${reportId}`;
  }, 2000);
}
```

### 3. Create Config File (15 min)
**Create:** `server/src/config/lcaConfig.js`

```javascript
module.exports = {
  thresholds: {
    energy: { max: 100000, high: 50000 },
    co2: { max: 15000, high: 10000 },
    water: { max: 10000, high: 5000 },
    waste: { max: 500, high: 300 }
  },
  circularityWeights: {
    energy: 0.25,
    emissions: 0.30,
    waste: 0.20,
    recovery: 0.25
  },
  stageCoefficients: {
    // Move STAGE_COEFFICIENTS here
  }
};
```

Then in `lcaController.js`:
```javascript
const LCA_CONFIG = require('../config/lcaConfig');
const STAGE_COEFFICIENTS = LCA_CONFIG.stageCoefficients;
```

---

## 📊 Key Formulas

### Circularity Score Calculation
```
energyScore = 100 - (totalEnergy / 100000 × 100)
emissionsScore = 100 - (totalCO2 / 15000 × 100)
wasteScore = 100 - (totalWaste / 500 × 100)
recoveryScore = materialRecoveryRate

circularityScore = 
  energyScore × 0.25 +
  emissionsScore × 0.30 +
  wasteScore × 0.20 +
  recoveryScore × 0.25
```

### Stage Impact Calculation
```
baseEnergy = productionAmount × energyFactor
baseCO2 = productionAmount × co2Factor
baseWater = productionAmount × waterFactor
baseWaste = productionAmount × wasteFactor

// Then apply stage-specific modifiers
// Example for mining:
if (oreGrade < 50%) {
  energy *= (1 / oreGrade)
}
```

### Intensity Metrics
```
energyIntensity = totalEnergy / productionAmount  (MJ per kg)
carbonIntensity = totalCO2 / productionAmount     (kg CO2 per kg)
```

---

## 🔍 How to Debug Issues

### Problem: LCA calculation fails
**Check:**
1. Browser console for API errors
2. Server logs for validation failures
3. Required fields per stage are filled
4. Field names match expected format

**Common causes:**
- Missing required field (e.g., `mining_ore_grade_percent`)
- Invalid field value (e.g., negative number)
- Network timeout (calculation takes too long)

### Problem: PDF download doesn't work
**Check:**
1. `pdfReportUrl` in response
2. File exists at `uploads/lca-reports/`
3. VITE_API_URL env variable
4. CORS settings allow file access

### Problem: Analytics shows mock data
**Check:**
1. Analytics receiving reportId?
2. Report fetched from API?
3. Data adapter applied?
4. Component using `selectedProject` prop?

---

## 📁 File Structure

```
server/src/
├── config/
│   └── lcaConfig.js          # NEW - Configuration
├── controllers/
│   └── lcaController.js       # Main LCA logic (Wizard)
├── models/
│   ├── CalculateLCA.js        # LCA results storage
│   ├── WizardWorkflow.js      # Wizard form data
│   └── WizardWorkflowOutput.js # AI predictions
├── routes/
│   └── lcaRoutes.js           # API endpoints
└── utils/
    ├── lcaCalculator.js       # Canvas LCA logic (DUPLICATE!)
    └── generateLCAReport.js   # PDF generation

client/src/
├── services/
│   ├── lcaService.js          # API calls
│   └── wizardService.js       # Wizard CRUD
├── sections/
│   ├── Wizard/
│   │   └── wizardForm.jsx     # 7-stage form
│   └── analytics/
│       ├── TabbedDashboard.jsx
│       ├── ExecutiveSummary.jsx
│       ├── ProcessStages.jsx
│       ├── AIRecommendations.jsx
│       └── DetailedReports.jsx
└── utils/
    └── lcaDataAdapter.js      # NEW - Transform data
```

---

## 🔗 API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/lca/calculate` | Calculate LCA & generate PDF | Required |
| GET | `/api/lca/reports` | List user's reports | Required |
| GET | `/api/lca/reports/:id` | Get specific report | Required |
| DELETE | `/api/lca/reports/:id` | Delete report | Required |
| GET | `/api/lca/stats` | User statistics | Required |

### Calculate LCA Request
```javascript
POST /api/lca/calculate
{
  "projectName": "Aluminum Plant 2024",
  "location": "Mumbai, India",
  "workflowId": "673abc...",
  "currentStage": "mining",
  "wizardData": {
    "mining": {
      "mining_method": "openPit",
      "mining_ore_grade_percent": 45,
      "production_volume": 50000,
      // ... all fields
    },
    "beneficiation": { ... },
    // ... other stages
  }
}
```

### Calculate LCA Response
```javascript
{
  "success": true,
  "message": "LCA Report Generated Successfully",
  "data": {
    "reportId": "673def...",
    "pdfUrl": "/uploads/lca-reports/LCA_Report_....pdf",
    "pdfFilename": "LCA_Report_user123_1701234567890.pdf",
    "summary": {
      "projectName": "Aluminum Plant 2024",
      "totalEnergy": 45678.90,
      "totalCO2": 12345.67,
      "circularityScore": 72.5,
      "circularityRating": "Good",
      "materialRecoveryRate": 65.0,
      // ... all metrics
    }
  }
}
```

---

## 🧪 Testing Checklist

### Manual Testing Steps

1. **Wizard Form Submission**
   - [ ] Fill all 7 stages
   - [ ] Submit form
   - [ ] Check success message appears
   - [ ] Verify redirected to analytics

2. **LCA Calculation**
   - [ ] Report ID generated
   - [ ] PDF file created in uploads/
   - [ ] Database record created with status='completed'
   - [ ] All metrics calculated correctly

3. **PDF Download**
   - [ ] Click download button
   - [ ] PDF opens/downloads
   - [ ] PDF contains all sections
   - [ ] Data matches calculation

4. **Analytics Dashboard**
   - [ ] Loads with reportId parameter
   - [ ] Displays correct project data
   - [ ] Charts render properly
   - [ ] Recommendations shown
   - [ ] No mock data visible

### Automated Testing (TODO)

```javascript
// Example test
describe('LCA Calculation', () => {
  it('should calculate circularity score correctly', async () => {
    const testData = {
      projectName: 'Test Project',
      wizardData: {
        mining: { /* test data */ },
        // ...
      }
    };
    
    const response = await request(app)
      .post('/api/lca/calculate')
      .set('Authorization', `Bearer ${token}`)
      .send(testData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.circularityScore).toBeGreaterThan(0);
  });
});
```

---

## 🎓 Key Concepts

### Circularity Rating Scale
- **Excellent** (85-100): Best-in-class circular practices
- **Good** (65-84): Strong circular economy implementation
- **Fair** (45-64): Moderate circularity, room for improvement
- **Poor** (25-44): Limited circular practices
- **Very Poor** (0-24): Minimal circularity

### Recommendation Priority
- **HIGH**: Immediate action required, significant impact
- **MEDIUM**: Important but can be phased in
- **LOW**: Nice-to-have improvements

### Stage Coefficients Source
Based on:
- International Aluminum Institute (IAI) data
- EPA guidelines
- Industry averages from 2020-2024
- Academic research (Journal of Cleaner Production)

---

## 💡 Pro Tips

1. **Always log validation errors** - Makes debugging 10x easier
2. **Round numbers early** - Prevents floating-point display issues
3. **Use async/await consistently** - Avoid promise hell
4. **Validate on both frontend and backend** - Security + UX
5. **Keep coefficients in config** - Easy to update without code changes
6. **Use TypeScript for new features** - Catch type errors early
7. **Add unit tests for calculations** - Formulas are critical
8. **Monitor PDF file sizes** - Compress if needed
9. **Cache calculation results** - Avoid recalculating same data
10. **Log everything in production** - Essential for debugging

---

## 🚨 Common Pitfalls

### 1. Field Name Mismatches
```javascript
// Frontend sends:
wizardData.mining.ore_grade

// Backend expects:
wizardData.mining.mining_ore_grade_percent

// Solution: Standardize naming convention
```

### 2. Missing Required Fields
```javascript
// Always check before submitting:
const requiredFields = ['mining_method', 'location', 'ore_grade'];
const missing = requiredFields.filter(f => !data[f]);
if (missing.length > 0) {
  alert(`Missing: ${missing.join(', ')}`);
}
```

### 3. Calculation Overflow
```javascript
// Production amount too high can cause issues:
if (productionAmount > 1000000) {
  console.warn('Large production amount, results may be inaccurate');
}
```

### 4. PDF Generation Timeout
```javascript
// For large reports, increase timeout:
router.post('/calculate', authenticate, 
  timeout('5min'), // Add timeout middleware
  calculateLCA
);
```

---

## 📚 Further Reading

- [Life Cycle Assessment (ISO 14040)](https://www.iso.org/standard/37456.html)
- [Circular Economy Principles](https://ellenmacarthurfoundation.org/)
- [Aluminum Production Impact](https://international-aluminium.org/)
- [PDFKit Documentation](http://pdfkit.org/)
- [Mongoose Best Practices](https://mongoosejs.com/docs/guide.html)

---

## 🤝 Getting Help

### Questions to Ask:
1. "What's the expected data structure for stage X?"
2. "Why is circularity score coming out as 0?"
3. "How do I add a new stage to the calculation?"
4. "Can I customize the recommendation thresholds?"
5. "How do I test the LCA calculation locally?"

### Where to Look:
- Server logs: Check terminal running `npm run dev`
- Browser console: F12 → Console tab
- Network tab: See API request/response
- Database: MongoDB Compass or Atlas UI
- PDF files: `server/uploads/lca-reports/`

---

## 🎯 Next Steps

### This Week:
1. Fix PDF download URL bug
2. Add wizard→analytics navigation
3. Create data adapter
4. Test end-to-end flow

### This Month:
5. Unify calculation engines
6. Move config to separate file
7. Add request cancellation
8. Improve error handling
9. Remove mock data
10. Add loading states

### Future:
- ML-based recommendations
- Real-time progress updates
- Multi-language support
- Cloud storage for PDFs
- Advanced analytics

---

**Last Updated:** December 4, 2024  
**Maintainer:** Development Team  
**Status:** Active Development

---

## 📞 Quick Commands

```bash
# Start development server
cd server && npm run dev

# Start frontend
cd client && npm run dev

# Check logs
pm2 logs

# Clear PDF uploads
rm -rf server/uploads/lca-reports/*

# Database backup
mongodump --uri="mongodb://..."

# Run tests
npm test
```

---

**Remember:** When in doubt, check the main review document (`LCA_SYSTEM_REVIEW_AND_LOGIC_FLOW.md`) for detailed explanations!
