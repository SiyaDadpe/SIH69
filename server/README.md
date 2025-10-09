# LCA Platform Backend - API Documentation

> RESTful API for metal circularity assessment and sustainability analytics

## Quick Setup

1. **Install dependencies**
```bash
cd server
npm install
```

2. **Create `.env` file**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/lca_platform
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

3. **Run the server**
```bash
npm run dev  # Development mode
npm start    # Production mode
```

Server runs at: `http://localhost:5000`


---

## API Endpoints

**Base URL**: `http://localhost:5000/api`

### 🔹 Health Check

**GET** `/health` - Check system status (Public)

---

### 🔹 Authentication

**POST** `/auth/register` - Register user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "engineer"
}
```

**POST** `/auth/login` - Login user
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**POST** `/auth/refresh-token` - Refresh token
```json
{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

**GET** `/auth/me` - Get profile (Private)  
**PATCH** `/auth/me` - Update profile (Private)
```json
{
  "name": "John Updated",
  "email": "john.new@example.com"
}
```

**POST** `/auth/change-password` - Change password (Private)
```json
{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**POST** `/auth/logout` - Logout (Private)

---

### 🔹 Projects

**GET** `/projects` - List all projects (Private)  
Query: `?page=1&limit=10&metalType=Steel&status=completed`

**POST** `/projects` - Create project (Private)
```json
{
  "name": "Steel Recycling Assessment 2025",
  "metalType": "Steel",
  "processType": "Recycling",
  "circularityScore": 85.5,
  "energyConsumption": 1200.5,
  "wasteGeneration": 45.2,
  "co2Emissions": 320.8,
  "waterUsage": 550.0,
  "description": "LCA for steel recycling facility",
  "status": "in-progress"
}
```

**GET** `/projects/stats` - Get statistics (Private)

**GET** `/projects/:id` - Get single project (Private)

**PUT** `/projects/:id` - Update project (Private)
```json
{
  "name": "Updated Project Name",
  "circularityScore": 90.0,
  "status": "completed"
}
```

**DELETE** `/projects/:id` - Delete project (Private)

---

### 🔹 Dashboard

**GET** `/dashboard` - Get dashboard data (Private)

**GET** `/dashboard/insights` - Get insights (Private)  
Query: `?priority=high&type=energy-efficiency&limit=5`

**GET** `/dashboard/trends` - Get monthly trends (Private)  
Query: `?months=6`

**GET** `/dashboard/performance` - Get performance summary (Private)

---

### 🔹 Insights

**GET** `/insights` - List insights (Private)  
Query: `?page=1&limit=10&projectId=PROJECT_ID&priority=high`

**POST** `/insights` - Create insight (Admin)
```json
{
  "projectId": "654abc123def456789012345",
  "type": "energy-efficiency",
  "priority": "high",
  "title": "Reduce Energy Consumption",
  "description": "Implement heat recovery system",
  "recommendations": [
    "Install heat exchangers",
    "Optimize furnace schedule"
  ],
  "estimatedImpact": {
    "energySavings": 180.5,
    "co2Reduction": 95.2,
    "costSavings": 45000
  }
}
```

**POST** `/insights/generate-mock` - Generate AI insights (Private)
```json
{
  "projectId": "654abc123def456789012345"
}
```

**GET** `/insights/:id` - Get single insight (Private)

**DELETE** `/insights/:id` - Delete insight (Admin)

---

### 🔹 Benchmarks

**GET** `/benchmarks/latest` - Get latest benchmark (Private)

**GET** `/benchmarks` - List benchmarks (Private)  
Query: `?page=1&limit=10`

**GET** `/benchmarks/stats` - Get industry stats (Private)

**PUT** `/benchmarks/:id` - Update benchmark (Admin)
```json
{
  "metrics": {
    "averageCircularityScore": 78.5,
    "averageEnergyConsumption": 1350.0,
    "averageCO2Emissions": 285.5,
    "averageWasteGeneration": 52.3
  }
}
```

---

### 🔹 System Status

**GET** `/system-status` - Get system status (Admin)

**POST** `/system-status` - Create status (Admin)
```json
{
  "version": "1.2.0",
  "status": "operational",
  "features": [
    {
      "name": "Project Management",
      "status": "operational",
      "description": "All features working"
    }
  ],
  "alerts": []
}
```

**POST** `/system-status/:id/features` - Add feature (Admin)
```json
{
  "name": "AI Insights",
  "status": "beta",
  "description": "AI-powered recommendations"
}
```

**POST** `/system-status/:id/alerts` - Add alert (Admin)
```json
{
  "type": "maintenance",
  "severity": "info",
  "message": "Scheduled maintenance on Oct 15",
  "affectedFeatures": ["Dashboard"]
}
```

---

## 🧪 Testing with Postman

### Setup
1. **Set Authorization Header** for private routes:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

2. **Get Token**: Use `/auth/register` or `/auth/login`, copy token from response

3. **Set Body**: Select `Body` → `raw` → `JSON`, paste payload

### HTTP Status Codes
- `200` OK | `201` Created | `204` No Content
- `400` Validation Error | `401` Unauthorized | `403` Forbidden
- `404` Not Found | `429` Rate Limited | `500` Server Error

---

**Version**: 1.0.0 | **Tech**: Node.js, Express, MongoDB, JWT  
**Maintained by**: SIH69 Team

