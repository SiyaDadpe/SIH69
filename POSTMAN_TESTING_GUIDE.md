# Canvas Backend - Postman Testing Guide

**Complete guide for testing Canvas Backend with Postman**

---

## 🎯 Prerequisites

### 1. Verify Backend is Running
```bash
cd server
npm start
# Wait for: "Server is running on port 5000"
```

### 2. Get Valid User IDs
```bash
cd server
node scripts/getUserIds.js
```

Output will show:
```
ObjectId: 68f5f9e48a8acc3f27b21ad0  - Hashim Ansari
ObjectId: 68f5f9e48a8acc3f27b21ad1  - Sarah Johnson
ObjectId: 68f5f9e48a8acc3f27b21ad2  - Michael Chen
ObjectId: 68f5f9e48a8acc3f27b21ad3  - Emma Wilson
ObjectId: 68f5f9e48a8acc3f27b21ad4  - David Kumar
```

**Copy one of these ObjectIds for Postman requests.**

---

## ✅ Backend Health Check

**First, verify your backend is running:**

**Request:**
```
GET http://localhost:5000/api/health
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "API is running",
  "database": "connected"
}
```

If this works, your backend is running! ✅

---

## 📦 API Endpoint: Get Aluminium Operations

Get all available operations for Aluminium metal type.

**Request:**
```
GET http://localhost:5000/api/canvas/operations?metalType=Aluminium
```

**Parameters:**
- `metalType` (query): `Aluminium` (case-sensitive - British spelling with double L)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "68f600a123456789abcdef00",
      "name": "Crushing",
      "description": "Crushing bauxite ore",
      "stage": "stage1-extraction",
      "metalTypes": ["Aluminum", "universal"],
      "gwp": 5.2,
      "waterUsage": 150,
      "wasteGenerated": 25,
      "energyRequired": 40,
      "recoveryRate": 75,
      "category": "Extraction",
      "isActive": true
    },
    // ... 14 more operations
  ]
}
```

**Copy the `_id` from first operation. You'll need it for the next step.**

---

## 🛠️ API Endpoint: Create Canvas Workflow

Create a new canvas workflow for LCA calculation.

**Request:**
```
POST http://localhost:5000/api/canvas/workflows
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "userId": "68f5f9e48a8acc3f27b21ad0",
  "name": "My Aluminium LCA",
  "metalType": "Aluminium",
  "description": "Testing aluminium recycling workflow"
}
```

**⚠️ Important Requirements:**
- `userId` must be a valid MongoDB ObjectId (24 hex characters)
- `metalType` must be CAPITALIZED with British spelling: `Aluminium`, `Steel`, `Copper`, etc.
- `name` must be 3-200 characters long
- `description` is optional

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Workflow created successfully",
  "data": {
    "_id": "68f612d76b4e45c55ad912cc",
    "userId": "68f5f9e48a8acc3f27b21ad0",
    "name": "My Aluminium LCA",
    "metalType": "Aluminium",
    "description": "Testing aluminium recycling workflow",
    "status": "draft",
    "stages": [
      {
        "stageId": "stage1-extraction",
        "stageNumber": 1,
        "operations": []
      },
      // ... stages 2-7
    ],
    "results": null,
    "createdAt": "2024-10-20T11:00:00.000Z"
  }
}
```

**Copy the `_id` (workflow ID). You'll need it for all following requests.**

---

## ⚙️ API Endpoint: Add Operation to Workflow

Add an operation to a specific stage in the workflow.

**Request:**
```
POST http://localhost:5000/api/canvas/workflows/{WORKFLOW_ID}/operations
```

Replace `{WORKFLOW_ID}` with the workflow ID from the previous step. Example:
```
POST http://localhost:5000/api/canvas/workflows/68f612d76b4e45c55ad912cc/operations
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "stageNumber": 1,
  "operationId": "68f600a123456789abcdef00",
  "quantity": 1000,
  "parameters": {}
}
```

**⚠️ Important Requirements:**

| Field | Type | Range | Example | Notes |
|-------|------|-------|---------|-------|
| `stageNumber` | integer | 1-7 | `1` | **Stage 1 = Extraction, Stage 2 = Processing**, etc. NOT the string ID |
| `operationId` | string | - | `68f600a123456789abcdef00` | Must be valid MongoDB ObjectId from operations list |
| `quantity` | number | > 0 | `1000` | Amount in tons |
| `parameters` | object | - | `{}` | Optional parameters |

**Stage Number Reference:**
- `1` = Stage 1: Extraction
- `2` = Stage 2: Processing
- `3` = Stage 3: Alumina Refining (for Aluminum)
- `4` = Stage 4: Smelting
- `5` = Stage 5: Manufacturing
- `6` = Stage 6: Recycling
- `7` = Stage 7: Valorization

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation added successfully",
  "data": {
    "_id": "68f612d76b4e45c55ad912cc",
    "stages": [
      {
        "stageId": "stage1-extraction",
        "stageNumber": 1,
        "operations": [
          {
            "operationId": "68f600a123456789abcdef00",
            "operationName": "Crushing",
            "quantity": 1000,
            "category": "Extraction",
            "impactData": {
              "gwp": 5200,
              "waterUsage": 150000,
              "wasteGenerated": 25
            }
          }
        ]
      }
    ]
  }
}
```

---

## 📊 API Endpoint: Calculate Workflow Impact

Calculate all environmental impacts for the workflow.

**Request:**
```
POST http://localhost:5000/api/canvas/workflows/{WORKFLOW_ID}/calculate
```

Example:
```
POST http://localhost:5000/api/canvas/workflows/68f612d76b4e45c55ad912cc/calculate
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "includeOptimizations": true
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Workflow impact calculated",
  "data": {
    "results": {
      "totalGWP": 5200,
      "totalWaterUsage": 150000,
      "totalEnergyRequired": 40000,
      "totalWasteGenerated": 25,
      "circularityScore": 75,
      "environmentalRating": "EXCELLENT",
      "cumulativeImpact": {
        "stage1": {
          "gwp": 5200,
          "waterUsage": 150000,
          "energyRequired": 40000
        },
        "stage2": { "gwp": 0 },
        "stage3": { "gwp": 0 }
        // ... etc
      }
    }
  }
}
```

---

## 📄 API Endpoint: Generate Report

Generate a comprehensive LCA report for the workflow.

**Request:**
```
GET http://localhost:5000/api/canvas/workflows/{WORKFLOW_ID}/report
```

Example:
```
GET http://localhost:5000/api/canvas/workflows/68f612d76b4e45c55ad912cc/report
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reportId": "68f612d76b4e45c55ad912cc",
    "workflowName": "My Aluminum LCA",
    "metalType": "Aluminum",
    "summary": {
      "totalOperations": 1,
      "totalGWP": 5200,
      "totalWaterUsage": 150000,
      "circularityScore": 75,
      "environmentalRating": "EXCELLENT"
    },
    "stageBreakdown": [
      {
        "stage": "Stage 1: Extraction",
        "operations": 1,
        "gwp": 5200,
        "waterUsage": 150000,
        "energyRequired": 40000,
        "wasteGenerated": 25
      }
    ],
    "recommendations": [
      "Implement water recycling systems",
      "Improve waste management processes"
    ],
    "generatedAt": "2024-10-20T11:00:00.000Z"
  }
}
```

---

## 🔗 API Endpoint: Get User Workflows

Get all workflows created by a specific user.

**Request:**
```
GET http://localhost:5000/api/canvas/workflows?userId=68f5f9e48a8acc3f27b21ad0
```

**Parameters:**
- `userId` (query): User's MongoDB ObjectId
- `status` (optional query): `draft`, `validated`, `calculated`, or `published`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "68f612d76b4e45c55ad912cc",
      "userId": "68f5f9e48a8acc3f27b21ad0",
      "name": "My Aluminum LCA",
      "metalType": "Aluminum",
      "status": "calculated",
      "createdAt": "2024-10-20T11:00:00.000Z"
    },
    {
      "_id": "68f612e87c5f56d66be023dd",
      "userId": "68f5f9e48a8acc3f27b21ad0",
      "name": "Steel Workflow",
      "metalType": "Steel",
      "status": "draft",
      "createdAt": "2024-10-20T10:30:00.000Z"
    }
  ]
}
```

---

## 🔧 API Endpoint: Get Single Workflow

Get detailed information about a specific workflow.

**Request:**
```
GET http://localhost:5000/api/canvas/workflows/{WORKFLOW_ID}
```

Example:
```
GET http://localhost:5000/api/canvas/workflows/68f612d76b4e45c55ad912cc
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "68f612d76b4e45c55ad912cc",
    "userId": "68f5f9e48a8acc3f27b21ad0",
    "name": "My Aluminum LCA",
    "metalType": "Aluminum",
    "description": "Testing aluminum recycling",
    "status": "calculated",
    "stages": [
      {
        "stageId": "stage1-extraction",
        "stageNumber": 1,
        "stageName": "Extraction",
        "operations": [
          {
            "operationId": "68f600a123456789abcdef00",
            "operationName": "Crushing",
            "quantity": 1000
          }
        ]
      }
      // ... stages 2-7
    ],
    "results": { /* calculation results */ }
  }
}
```

---

## ❌ Common Error Responses

### Error: "Invalid metal type"
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "metalType",
      "message": "Invalid metal type",
      "value": "aluminum"
    }
  ]
}
```

**Fix:** Use capitalized metal type: `"Aluminum"` not `"aluminum"`

---

### Error: "Cast to ObjectId failed"
```json
{
  "success": false,
  "message": "User ID is required - Cast to ObjectId failed"
}
```

**Fix:** Use valid MongoDB ObjectId from `node scripts/getUserIds.js`, not `"123"`

---

### Error: "Stage number must be between 1 and 7"
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "stageNumber",
      "message": "Stage number must be between 1 and 7",
      "value": "stage1-extraction"
    }
  ]
}
```

**Fix:** Use integer 1-7, not string: `1` not `"stage1-extraction"`

---

### Error: "No operations in workflow"
```json
{
  "success": false,
  "message": "No operations in workflow"
}
```

**Fix:** Add at least one operation before calculating impact

---

## 📋 Quick Copy-Paste Sequence

### Step 1: Health Check
```
GET http://localhost:5000/api/health
```

### Step 2: Get Operations
```
GET http://localhost:5000/api/canvas/operations?metalType=Aluminium

Copy first _id from response
```

### Step 3: Create Workflow
```
POST http://localhost:5000/api/canvas/workflows

{
  "userId": "68f5f9e48a8acc3f27b21ad0",
  "name": "Test",
  "metalType": "Aluminium"
}

Copy _id from response
```

### Step 4: Add Operation (REPLACE IDs)
```
POST http://localhost:5000/api/canvas/workflows/{WORKFLOW_ID}/operations

{
  "stageNumber": 1,
  "operationId": "{OPERATION_ID}",
  "quantity": 1000,
  "parameters": {}
}
```

### Step 5: Calculate
```
POST http://localhost:5000/api/canvas/workflows/{WORKFLOW_ID}/calculate

{
  "includeOptimizations": true
}
```

### Step 6: Get Report
```
GET http://localhost:5000/api/canvas/workflows/{WORKFLOW_ID}/report
```

**If all steps return success: true with 200 status, your backend is working! ✅**

---

## 🚀 Running Automated Tests

Instead of manual testing, run:

```bash
cd server
node TEST_CANVAS_API.js
```

This will automatically test all 7 endpoints and show pass/fail results.

---

## 📚 Valid Values Reference

**Metal Types (Case-Sensitive - British Spelling):**
```
Aluminium, Steel, Copper, Titanium, Lithium, Nickel, Gold, Zinc
```

**Workflow Status:**
```
draft, validated, calculated, published
```

**Stage Numbers:**
```
1 = Extraction
2 = Processing
3 = Refining (Alumina Refining for Aluminum)
4 = Smelting
5 = Manufacturing
6 = Recycling
7 = Valorization
```

**HTTP Status Codes:**
```
200 = OK / Success
201 = Created
400 = Bad Request (validation error)
404 = Not Found
500 = Server Error
```

---

**Last Updated:** October 20, 2025  
**Status:** ✅ Backend Fully Functional  
**Test Coverage:** 7/7 endpoints tested and working
