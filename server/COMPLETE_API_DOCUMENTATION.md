# Complete API Documentation - Canvas, Wizard & Reports

**Base URL:** `http://localhost:5000/api`

**Last Updated:** October 22, 2025

---

## Table of Contents

1. [Canvas Workflow API](#canvas-workflow-api)
2. [Wizard Workflow API](#wizard-workflow-api)
3. [Reports API](#reports-api)
4. [Testing Guide (Postman)](#testing-guide-postman)
5. [Data Flow](#data-flow)

---

# Canvas Workflow API

Base Path: `/api/canvas`

## 1. Get All Operations

**GET** `/canvas/operations`

Get all available operations with optional filtering.

**Query Parameters:**
- `stage` (optional) - Filter by stage
- `metalType` (optional) - Filter by metal type
- `category` (optional) - Filter by category

**Example Request (Postman):**
```
GET http://localhost:5000/api/canvas/operations?metalType=Aluminium
```

**Response:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "...",
      "name": "Bauxite Extraction",
      "stage": "stage1-extraction",
      "category": "mining",
      "metalTypes": ["Aluminium"],
      "impacts": {
        "gwp": 2.5,
        "waterUsage": 100,
        "wasteGenerated": 50
      }
    }
  ]
}
```

---

## 2. Create Canvas Workflow

**POST** `/canvas/workflows`

Create a new canvas workflow.

**Request Body:**
```json
{
  "name": "Aluminium Recycling Project",
  "description": "Testing canvas workflow creation",
  "metalType": "Aluminium",
  "userId": "68f5f9e48a8acc3f27b21ad0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Canvas workflow created successfully",
  "data": {
    "workflow": {
      "_id": "68f79abc123...",
      "name": "Aluminium Recycling Project",
      "metalType": "Aluminium",
      "userId": "68f5f9e48a8acc3f27b21ad0",
      "stages": [],
      "status": "draft",
      "createdAt": "2025-10-22T10:00:00.000Z"
    }
  }
}
```

---

## 3. Get All Canvas Workflows

**GET** `/canvas/workflows`

Get all workflows with pagination and filtering.

**Query Parameters:**
- `userId` (optional) - Filter by user
- `metalType` (optional) - Filter by metal type
- `status` (optional) - draft/active/completed/archived
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Example Request:**
```
GET http://localhost:5000/api/canvas/workflows?userId=68f5f9e48a8acc3f27b21ad0&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "page": 1,
  "pages": 1,
  "data": {
    "workflows": [...]
  }
}
```

---

## 4. Get Single Canvas Workflow

**GET** `/canvas/workflows/:id`

Get detailed information about a specific workflow.

**Example Request:**
```
GET http://localhost:5000/api/canvas/workflows/68f79abc123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow": {
      "_id": "68f79abc123",
      "name": "Aluminium Recycling Project",
      "stages": [...],
      "results": {
        "totalGWP": 18.5,
        "circularityScore": 85.5
      }
    }
  }
}
```

---

## 5. Add Operation to Canvas Workflow

**POST** `/canvas/workflows/:workflowId/operations`

Add an operation to a specific stage.

**Request Body:**
```json
{
  "operationId": "68f5f9e48a8acc3f27b21ad5",
  "stageId": "stage1-extraction",
  "quantity": 1000,
  "unit": "tons"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Operation added successfully",
  "data": {
    "workflow": {...},
    "addedOperation": {...}
  }
}
```

---

## 6. Calculate LCA for Canvas Workflow

**POST** `/canvas/workflows/:workflowId/calculate`

Calculate environmental impacts for the workflow.

**No Request Body Required**

**Example Request:**
```
POST http://localhost:5000/api/canvas/workflows/68f79abc123/calculate
```

**Response:**
```json
{
  "success": true,
  "message": "LCA calculations completed successfully",
  "data": {
    "workflow": {...},
    "results": {
      "totalGWP": 18.5,
      "totalWaterUsage": 2500,
      "totalWasteGenerated": 850,
      "totalEnergyRequired": 12000,
      "circularityScore": 85.5,
      "operationCount": 12
    }
  }
}
```

---

## 7. Generate Report from Canvas Workflow

**POST** `/canvas/workflows/:workflowId/generate-report`

Generate and save a comprehensive report from canvas data.

**No Request Body Required**

**Example Request:**
```
POST http://localhost:5000/api/canvas/workflows/68f79abc123/generate-report
```

**Response:**
```json
{
  "success": true,
  "message": "Report generated and saved successfully from Canvas workflow",
  "data": {
    "report": {
      "_id": "68f79def456",
      "title": "LCA Report: Aluminium Recycling Project",
      "sections": [
        {
          "title": "Executive Summary",
          "order": 0,
          "content": "...",
          "metrics": [...]
        }
      ],
      "tags": ["lca", "canvas-generated", "aluminium"],
      "metadata": {
        "sourceType": "canvas-workflow",
        "workflowId": "68f79abc123"
      }
    },
    "lcaPreview": {...}
  }
}
```

---

## 8. Delete Canvas Workflow

**DELETE** `/canvas/workflows/:id`

Delete a canvas workflow.

**Example Request:**
```
DELETE http://localhost:5000/api/canvas/workflows/68f79abc123
```

**Response:**
```json
{
  "success": true,
  "message": "Canvas workflow deleted successfully"
}
```

---

# Wizard Workflow API

Base Path: `/api/wizard`

## 1. Create Wizard Workflow

**POST** `/wizard/workflows`

Create a new wizard workflow.

**Request Body:**
```json
{
  "name": "Complete Aluminium LCA Study",
  "metalType": "Aluminium",
  "userId": "68f5f9e48a8acc3f27b21ad0",
  "description": "Comprehensive wizard-based LCA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wizard workflow created successfully",
  "data": {
    "workflow": {
      "_id": "68f79xyz789",
      "name": "Complete Aluminium LCA Study",
      "metalType": "Aluminium",
      "status": "draft",
      "currentStep": 0,
      "completedSteps": [],
      "completionPercentage": 0
    }
  }
}
```

---

## 2. Get All Wizard Workflows

**GET** `/wizard/workflows`

Get all wizard workflows with filtering and pagination.

**Query Parameters:**
- `userId` (optional)
- `metalType` (optional)
- `status` (optional) - draft/completed/submitted/archived
- `isPublic` (optional) - true/false
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Example Request:**
```
GET http://localhost:5000/api/wizard/workflows?userId=68f5f9e48a8acc3f27b21ad0&status=draft
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "pages": 1,
  "data": {
    "workflows": [...]
  }
}
```

---

## 3. Get Single Wizard Workflow

**GET** `/wizard/workflows/:id`

Get detailed information about a specific wizard workflow.

**Example Request:**
```
GET http://localhost:5000/api/wizard/workflows/68f79xyz789
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow": {
      "_id": "68f79xyz789",
      "name": "Complete Aluminium LCA Study",
      "completionPercentage": 42,
      "currentStep": 3,
      "completedSteps": [0, 1, 2],
      "mining": {...},
      "beneficiation": {...},
      "refining": {...}
    }
  }
}
```

---

## 4. Update Mining Step (Step 0)

**PUT** `/wizard/workflows/:id/steps/mining`

Update mining stage data.

**Request Body:**
```json
{
  "applicableProcesses": ["openPit", "drilling", "electricShovel"],
  "location": "Western Australia",
  "year": 2024,
  "oreGrade": 42,
  "overburdenRatio": 3.5,
  "productionVolume": 50000,
  "equipmentType": "Electric",
  "fuelConsumption": 15,
  "waterSource": "Recycled water",
  "waterConsumption": 2.5,
  "biodiversityImpact": "Moderate",
  "landReclamation": "Planned",
  "dustControl": "Water spraying",
  "noiseLevel": 85,
  "transport": {
    "distance": 50,
    "mode": "Conveyor",
    "vehicleType": "Electric vehicles"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Step 'mining' updated successfully",
  "data": {
    "workflow": {...},
    "completionPercentage": 14,
    "isCompleted": false
  }
}
```

---

## 5. Update Beneficiation Step (Step 1)

**PUT** `/wizard/workflows/:id/steps/beneficiation`

Update beneficiation stage data.

**Request Body:**
```json
{
  "applicableProcesses": ["Crushing", "Washing & Screening", "Grinding"],
  "location": "Australia",
  "feedRate": 500,
  "waterConsumption": 1.8,
  "electricityUse": 45,
  "beneficiationEfficiency": 92,
  "crushing": ["Primary Crushing", "Secondary Crushing"],
  "chemicalAgents": ["Flocculants"],
  "wasteTailingsSlurry": {
    "stored": "Stored in tailing ponds",
    "volume": 2.5,
    "toxicity": "Moderate"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Step 'beneficiation' updated successfully",
  "data": {
    "workflow": {...},
    "completionPercentage": 28,
    "isCompleted": false
  }
}
```

---

## 6. Update Refining Step (Step 2)

**PUT** `/wizard/workflows/:id/steps/refining`

Update alumina refining (Bayer process) data.

**Request Body:**
```json
{
  "applicableProcesses": [
    "Digestion (caustic soda process)",
    "Clarification (separating alumina liquor from red mud)",
    "Calcination (removal of water to produce alumina powder)"
  ],
  "location": "Queensland",
  "energyUse": 250,
  "waterUse": 3.2,
  "redMudGeneration": 1.5,
  "causticSoda": 85,
  "limeOtherAdditives": 20,
  "so2Emissions": 0.8,
  "noxEmissions": 0.5,
  "dustEmissions": 0.3,
  "redMudToxicityLevel": "Moderate",
  "wasteTailingsManagement": "Stored in tailing ponds"
}
```

---

## 7. Update Smelting Step (Step 3)

**PUT** `/wizard/workflows/:id/steps/smelting`

Update aluminium smelting (Hall-Héroult process) data.

**Request Body:**
```json
{
  "applicableProcesses": [
    "Electrolysis (cell operation)",
    "Off-gas treatment (scrubber systems)"
  ],
  "variants": [
    "Pre-baked anode cells (standard technology)",
    "Renewable-powered smelters (intermittent optimization possible)"
  ],
  "energySource": "Hydropower",
  "energyDemand": 13500,
  "fluorideRecoveryEfficiency": 95,
  "thermalEnergyRecoveryPotential": 15
}
```

---

## 8. Update Manufacturing Step (Step 4)

**PUT** `/wizard/workflows/:id/steps/manufacturing`

Update product manufacturing and fabrication data.

**Request Body:**
```json
{
  "applicableProcesses": [
    "Casting (ingots, billets – high-temperature energy)",
    "Rolling (sheet metal – mechanical deformation)",
    "Extrusion (tubes, profiles – efficient shaping)"
  ],
  "casting": ["Ingot Casting", "Continuous Casting"],
  "transportDistance": 150,
  "scrapRate": 8,
  "recycledContent": 35,
  "transportMode": "Rail",
  "energyUsePerProcessStep": 180,
  "emissionsFromFabrication": 2.1,
  "lightweighting": ["Automotive", "Aerospace"],
  "corrosionBehaviorImpact": "Minimal (long lifespan, low maintenance)"
}
```

---

## 9. Update Recycling Step (Step 5)

**PUT** `/wizard/workflows/:id/steps/recycling`

Update end-of-life recycling data.

**Request Body:**
```json
{
  "applicableProcesses": [
    "Collection (scrap gathering – manual or automated)",
    "Sorting",
    "Remelting (furnace heating – energy intensive)"
  ],
  "variants": [
    "Closed-loop recycling (same product, high purity, lower emissions)",
    "Secondary aluminium production (5–10% of primary energy use)"
  ],
  "scrapInputPercentage": 90,
  "collectionRate": 85,
  "recyclingMethods": "Closed-loop",
  "recoveryYield": 95,
  "furnaceEnergyDemand": 800,
  "emissionSavings": 15.2,
  "sortingMethods": [
    "Optical sorting (computer vision + ML, accurate alloy separation)"
  ],
  "closedLoopRecyclingPercentage": 70,
  "openLoopRecyclingPercentage": 30
}
```

---

## 10. Update Valorization Step (Step 6)

**PUT** `/wizard/workflows/:id/steps/valorization`

Update byproduct and waste valorization data.

**Request Body:**
```json
{
  "wasteTypes": ["Red Mud", "Dross", "Fluoride Gases"],
  "valorizationMethods": [
    "Cement additive",
    "Iron extraction",
    "Dross recovery",
    "Fluoride capture"
  ],
  "wasteUtilizationPercentages": 65,
  "redMudWasteUtilized": 45,
  "drossWasteUtilized": 85,
  "fluorideGasesWasteUtilized": 90,
  "emissionReductions": 3.5,
  "ironExtractionEconomicViability": "Moderate",
  "drossRecoveryEconomicViability": "High",
  "fluorideCaptureEconomicViability": "High",
  "drossRecoveryEfficiency": 85,
  "fluorideGasesRecoveryEfficiency": 92
}
```

---

## 11. Mark Step as Complete

**POST** `/wizard/workflows/:id/steps/:stepName/complete`

Mark a specific step as completed.

**Step Names:** `mining`, `beneficiation`, `refining`, `smelting`, `manufacturing`, `recycling`, `valorization`

**No Request Body Required**

**Example Request:**
```
POST http://localhost:5000/api/wizard/workflows/68f79xyz789/steps/mining/complete
```

**Response:**
```json
{
  "success": true,
  "message": "Step 'mining' marked as completed",
  "data": {
    "workflow": {...},
    "completionPercentage": 14,
    "isCompleted": false,
    "nextStep": 1
  }
}
```

---

## 12. Submit Wizard Workflow

**POST** `/wizard/workflows/:id/submit`

Submit a completed wizard workflow (all 7 steps must be completed).

**No Request Body Required**

**Example Request:**
```
POST http://localhost:5000/api/wizard/workflows/68f79xyz789/submit
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Wizard workflow submitted successfully",
  "data": {
    "workflow": {
      "status": "submitted",
      "completionPercentage": 100
    }
  }
}
```

**Response (Error - Incomplete):**
```json
{
  "success": false,
  "message": "Cannot submit incomplete workflow. Please complete all 7 steps first.",
  "data": {
    "completionPercentage": 57,
    "completedSteps": [0, 1, 2, 3],
    "remainingSteps": [4, 5, 6]
  }
}
```

---

## 13. Generate Report from Wizard Workflow

**POST** `/wizard/workflows/:id/generate-report`

Generate and save a comprehensive report from wizard data.

**No Request Body Required**

**Example Request:**
```
POST http://localhost:5000/api/wizard/workflows/68f79xyz789/generate-report
```

**Response:**
```json
{
  "success": true,
  "message": "Report generated and saved successfully from wizard workflow",
  "data": {
    "report": {
      "_id": "68f79report123",
      "title": "LCA Report: Complete Aluminium LCA Study",
      "sections": [
        {
          "title": "Executive Summary",
          "order": 0,
          "content": "...",
          "metrics": [...]
        },
        {
          "title": "Mining (Extraction) Stage",
          "order": 1,
          "content": "...",
          "metrics": [...]
        }
      ],
      "tags": ["lca", "wizard-generated", "aluminium"],
      "metadata": {
        "sourceType": "wizard-workflow",
        "workflowId": "68f79xyz789",
        "wizardData": {
          "completionPercentage": 100,
          "completedSteps": [0, 1, 2, 3, 4, 5, 6]
        }
      }
    },
    "workflowSummary": {...}
  }
}
```

---

## 14. Get Wizard Statistics

**GET** `/wizard/statistics`

Get aggregated statistics for wizard workflows.

**Query Parameters:**
- `userId` (optional) - Filter by specific user

**Example Request:**
```
GET http://localhost:5000/api/wizard/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalWorkflows": 15,
      "completedWorkflows": 8,
      "submittedWorkflows": 5,
      "draftWorkflows": 7,
      "avgCompletionPercentage": 67.8
    },
    "byMetalType": [
      { "_id": "Aluminium", "count": 10 },
      { "_id": "Copper", "count": 3 },
      { "_id": "Steel", "count": 2 }
    ]
  }
}
```

---

## 15. Delete Wizard Workflow

**DELETE** `/wizard/workflows/:id`

Delete a wizard workflow.

**Example Request:**
```
DELETE http://localhost:5000/api/wizard/workflows/68f79xyz789
```

**Response:**
```json
{
  "success": true,
  "message": "Wizard workflow deleted successfully"
}
```

---

# Reports API

Base Path: `/api/reports`

## 1. Create Report (BLOCKED - Must Use Canvas/Wizard)

**POST** `/reports`

⚠️ **This endpoint is blocked for manual creation!**

Reports must be generated from Canvas or Wizard workflows.

**Example Request (Will Fail):**
```json
{
  "title": "Manual Report",
  "sections": []
}
```

**Response:**
```json
{
  "success": false,
  "message": "Reports must be generated from Canvas or Wizard workflows. Please use the generate-report endpoints instead.",
  "hint": {
    "canvas": "POST /api/canvas/workflows/:id/generate-report",
    "wizard": "POST /api/wizard/workflows/:id/generate-report"
  }
}
```

---

## 2. Get All Reports

**GET** `/reports`

Get all reports with filtering, search, and pagination.

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `status` (optional) - draft/final/archived
- `visibility` (optional) - private/project/public
- `tags` (optional) - Comma-separated tags (e.g., "lca,aluminium")
- `search` (optional) - Search in title, description, content
- `sort` (optional, default: "-updatedAt")

**Example Request:**
```
GET http://localhost:5000/api/reports?tags=canvas-generated,aluminium&status=final&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "pages": 1,
  "data": {
    "reports": [
      {
        "_id": "68f79report123",
        "title": "LCA Report: Aluminium Recycling",
        "status": "final",
        "visibility": "public",
        "tags": ["lca", "canvas-generated", "aluminium"],
        "metadata": {
          "sourceType": "canvas-workflow",
          "workflowId": "68f79abc123"
        },
        "createdAt": "2025-10-22T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 3. Get Single Report

**GET** `/reports/:id`

Get detailed information about a specific report.

**Example Request:**
```
GET http://localhost:5000/api/reports/68f79report123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {
      "_id": "68f79report123",
      "title": "LCA Report: Aluminium Recycling",
      "description": "Comprehensive LCA report...",
      "sections": [
        {
          "title": "Executive Summary",
          "order": 0,
          "content": "Full text content...",
          "metrics": [
            {
              "name": "circularity_score",
              "label": "Circularity Score",
              "value": 85.5,
              "unit": "%"
            }
          ]
        }
      ],
      "tags": ["lca", "canvas-generated", "aluminium"],
      "metadata": {
        "sourceType": "canvas-workflow",
        "workflowId": "68f79abc123"
      },
      "totalMetrics": 15,
      "totalSections": 6
    }
  }
}
```

---

## 4. Export Report as PDF

**GET** `/reports/:id/export?format=pdf`

Export a report as a PDF file.

**Query Parameters:**
- `format` - Must be "pdf"

**Example Request:**
```
GET http://localhost:5000/api/reports/68f79report123/export?format=pdf
```

**Response:** PDF file download

**Postman Setup:**
1. Set method to GET
2. Enter URL with `?format=pdf`
3. Click "Send and Download"
4. PDF will be saved to your downloads

---

## 5. Export Report as JSON

**GET** `/reports/:id/export?format=json`

Export a report as JSON.

**Example Request:**
```
GET http://localhost:5000/api/reports/68f79report123/export?format=json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {...},
    "exportedAt": "2025-10-22T10:00:00.000Z",
    "format": "json"
  }
}
```

---

## 6. Update Report

**PUT** `/reports/:id`

Update report metadata (title, description, status, etc.).

**Request Body:**
```json
{
  "title": "Updated Report Title",
  "description": "Updated description",
  "status": "final",
  "visibility": "public",
  "tags": ["lca", "aluminium", "optimized"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report updated successfully",
  "data": {
    "report": {...}
  }
}
```

---

## 7. Delete Report

**DELETE** `/reports/:id`

Delete a report.

**Example Request:**
```
DELETE http://localhost:5000/api/reports/68f79report123
```

**Response:**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

---

## 8. Get Report Statistics

**GET** `/reports/statistics`

Get aggregated statistics for all reports.

**Example Request:**
```
GET http://localhost:5000/api/reports/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReports": 25,
    "totalSections": 150,
    "totalAttachments": 10,
    "byStatus": {
      "draft": 8,
      "final": 15,
      "archived": 2
    },
    "byVisibility": {
      "public": 18,
      "private": 5,
      "project": 2
    }
  }
}
```

---

# Testing Guide (Postman)

## Setup

1. **Install Postman** (if not already installed)
2. **Create a new Collection** named "LCA Platform APIs"
3. **Set Base URL** as environment variable:
   - Variable: `base_url`
   - Value: `http://localhost:5000/api`

## Complete Testing Workflow

### Scenario 1: Canvas Workflow → Report

#### Step 1: Create Canvas Workflow
```
POST {{base_url}}/canvas/workflows

Body (raw JSON):
{
  "name": "Test Canvas Workflow",
  "metalType": "Aluminium",
  "userId": "68f5f9e48a8acc3f27b21ad0",
  "description": "Testing canvas workflow"
}

Save the workflow ID from response!
```

#### Step 2: Get Available Operations
```
GET {{base_url}}/canvas/operations?metalType=Aluminium
```

#### Step 3: Add Operations to Workflow
```
POST {{base_url}}/canvas/workflows/YOUR_WORKFLOW_ID/operations

Body (raw JSON):
{
  "operationId": "OPERATION_ID_FROM_STEP_2",
  "stageId": "stage1-extraction",
  "quantity": 1000,
  "unit": "tons"
}

Repeat for multiple operations across different stages
```

#### Step 4: Calculate LCA
```
POST {{base_url}}/canvas/workflows/YOUR_WORKFLOW_ID/calculate
```

#### Step 5: Generate Report
```
POST {{base_url}}/canvas/workflows/YOUR_WORKFLOW_ID/generate-report

Save the report ID from response!
```

#### Step 6: View Report
```
GET {{base_url}}/reports/YOUR_REPORT_ID
```

#### Step 7: Export as PDF
```
GET {{base_url}}/reports/YOUR_REPORT_ID/export?format=pdf

In Postman: Click "Send and Download"
```

---

### Scenario 2: Wizard Workflow → Report

#### Step 1: Create Wizard Workflow
```
POST {{base_url}}/wizard/workflows

Body (raw JSON):
{
  "name": "Complete Aluminium LCA",
  "metalType": "Aluminium",
  "userId": "68f5f9e48a8acc3f27b21ad0",
  "description": "Full wizard test"
}

Save the workflow ID!
```

#### Step 2: Fill Mining Data
```
PUT {{base_url}}/wizard/workflows/YOUR_WORKFLOW_ID/steps/mining

Body (raw JSON):
{
  "applicableProcesses": ["openPit", "drilling"],
  "location": "Australia",
  "oreGrade": 45,
  "productionVolume": 50000,
  "equipmentType": "Electric",
  "waterConsumption": 2.5
}
```

#### Step 3: Mark Mining Complete
```
POST {{base_url}}/wizard/workflows/YOUR_WORKFLOW_ID/steps/mining/complete
```

#### Step 4: Fill Beneficiation Data
```
PUT {{base_url}}/wizard/workflows/YOUR_WORKFLOW_ID/steps/beneficiation

Body (raw JSON):
{
  "applicableProcesses": ["Crushing", "Washing & Screening"],
  "feedRate": 500,
  "electricityUse": 45,
  "beneficiationEfficiency": 92
}
```

#### Step 5: Mark Beneficiation Complete
```
POST {{base_url}}/wizard/workflows/YOUR_WORKFLOW_ID/steps/beneficiation/complete
```

#### Repeat Steps 4-5 for remaining stages:
- `refining` (Step 2)
- `smelting` (Step 3)
- `manufacturing` (Step 4)
- `recycling` (Step 5)
- `valorization` (Step 6)

#### Step 6: Check Completion Status
```
GET {{base_url}}/wizard/workflows/YOUR_WORKFLOW_ID
```

#### Step 7: Submit Workflow (if 100% complete)
```
POST {{base_url}}/wizard/workflows/YOUR_WORKFLOW_ID/submit
```

#### Step 8: Generate Report
```
POST {{base_url}}/wizard/workflows/YOUR_WORKFLOW_ID/generate-report

Save the report ID!
```

#### Step 9: Export Report as PDF
```
GET {{base_url}}/reports/YOUR_REPORT_ID/export?format=pdf

Click "Send and Download"
```

---

### Scenario 3: Query and Filter Reports

#### Get Canvas-Generated Reports
```
GET {{base_url}}/reports?tags=canvas-generated
```

#### Get Wizard-Generated Reports
```
GET {{base_url}}/reports?tags=wizard-generated
```

#### Get Aluminium Reports
```
GET {{base_url}}/reports?tags=aluminium
```

#### Search Reports
```
GET {{base_url}}/reports?search=circularity
```

#### Get Final Reports Only
```
GET {{base_url}}/reports?status=final
```

#### Get Public Reports
```
GET {{base_url}}/reports?visibility=public
```

---

## Postman Collection Export

Create a collection with these folders:

```
📁 LCA Platform APIs
  📁 Canvas Workflows
    ├─ Get Operations
    ├─ Create Workflow
    ├─ Get All Workflows
    ├─ Get Single Workflow
    ├─ Add Operation
    ├─ Calculate LCA
    ├─ Generate Report
    └─ Delete Workflow
  
  📁 Wizard Workflows
    ├─ Create Workflow
    ├─ Get All Workflows
    ├─ Get Single Workflow
    ├─ Update Mining Step
    ├─ Complete Mining Step
    ├─ Update Beneficiation Step
    ├─ Complete Beneficiation Step
    ├─ Update Refining Step
    ├─ Complete Refining Step
    ├─ Update Smelting Step
    ├─ Complete Smelting Step
    ├─ Update Manufacturing Step
    ├─ Complete Manufacturing Step
    ├─ Update Recycling Step
    ├─ Complete Recycling Step
    ├─ Update Valorization Step
    ├─ Complete Valorization Step
    ├─ Submit Workflow
    ├─ Generate Report
    ├─ Get Statistics
    └─ Delete Workflow
  
  📁 Reports
    ├─ Get All Reports
    ├─ Get Single Report
    ├─ Search Reports
    ├─ Filter by Tags
    ├─ Export as PDF
    ├─ Export as JSON
    ├─ Update Report
    ├─ Delete Report
    └─ Get Statistics
```

---

# Data Flow

## Canvas → Report Flow

```
1. Create Canvas Workflow
   ↓
2. Add Operations (multiple stages)
   ↓
3. Calculate LCA (generates environmental metrics)
   ↓
4. Generate Report (creates Report document with 6 sections)
   ↓
5. Export as PDF (download formatted document)
```

**Report Sections from Canvas:**
1. Executive Summary (circularity, rating)
2. Environmental Impact Assessment (GWP, water, waste, energy)
3. Stage-by-Stage Analysis (per-stage breakdown)
4. Industry Benchmark Comparison
5. Improvement Opportunities (AI recommendations)
6. Operations Summary

---

## Wizard → Report Flow

```
1. Create Wizard Workflow
   ↓
2. Fill Step 0: Mining
3. Mark Mining Complete (14%)
   ↓
4. Fill Step 1: Beneficiation
5. Mark Beneficiation Complete (28%)
   ↓
6. Fill Step 2: Refining
7. Mark Refining Complete (42%)
   ↓
8. Fill Step 3: Smelting
9. Mark Smelting Complete (57%)
   ↓
10. Fill Step 4: Manufacturing
11. Mark Manufacturing Complete (71%)
   ↓
12. Fill Step 5: Recycling
13. Mark Recycling Complete (85%)
   ↓
14. Fill Step 6: Valorization
15. Mark Valorization Complete (100%)
   ↓
16. Submit Workflow
   ↓
17. Generate Report (creates Report document with 8 sections)
   ↓
18. Export as PDF
```

**Report Sections from Wizard:**
1. Executive Summary (completion status)
2. Mining Stage (ore grade, production, water use)
3. Beneficiation Stage (efficiency, electricity)
4. Refining Stage (energy, red mud, emissions)
5. Smelting Stage (energy source, demand)
6. Manufacturing Stage (recycled content, emissions)
7. Recycling Stage (recovery yield, savings)
8. Valorization Stage (waste utilization)

---

## Key Points

✅ **Reports MUST be generated from Canvas or Wizard**
- Manual report creation is blocked
- All reports are traceable to source workflows

✅ **Canvas Reports** = Operation-based, LCA calculations
- Best for: Process optimization, benchmarking
- Sections: 6 (technical analysis focus)

✅ **Wizard Reports** = Form-based, comprehensive data
- Best for: Complete lifecycle assessment, compliance
- Sections: 8 (full lifecycle coverage)

✅ **Both can export to PDF**
- Professional formatting
- Color-coded sections
- Auto-pagination
- Metrics with baselines

✅ **Reports are searchable and filterable**
- By tags (lca, canvas-generated, wizard-generated, metal type)
- By status (draft, final, archived)
- By visibility (public, private, project)
- Full-text search

---

## Common Issues & Solutions

### Issue: "User not found"
**Solution:** Make sure the `userId` exists in your database. Use a valid user ID from your Users collection.

### Issue: "Operation not found"
**Solution:** First call `GET /canvas/operations` to get valid operation IDs before adding them to workflows.

### Issue: "Cannot submit incomplete workflow"
**Solution:** Complete all 7 steps in the wizard before submitting. Check `completionPercentage` should be 100%.

### Issue: "Reports must be generated from Canvas or Wizard"
**Solution:** Don't create reports manually. Use:
- `POST /canvas/workflows/:id/generate-report` OR
- `POST /wizard/workflows/:id/generate-report`

### Issue: PDF download not working in Postman
**Solution:** Use "Send and Download" button instead of "Send". The response will be a binary file.

---

## Need Help?

- Check server logs for detailed error messages
- Verify MongoDB is connected
- Ensure server is running on port 5000
- Use the test scripts:
  - `node scripts/testWizardReportIntegration.js`
  - `node scripts/testCanvasReportIntegration.js`

---

**End of Documentation**
