# Export Feature Implementation Guide

## Overview
This document describes the complete export functionality for LCA reports supporting PDF, Excel, and JSON formats.

## Backend Implementation

### 1. Dependencies to Install

```bash
cd server
npm install pdfkit exceljs
```

### 2. File Structure

```
server/src/
├── controllers/
│   └── exportController.js   # Export logic (PDF, Excel, JSON)
├── routes/
│   └── exportRoutes.js        # Export endpoints
```

### 3. Register Routes

Add to `server/src/app.js`:

```javascript
const exportRoutes = require('./routes/exportRoutes');

// Register export routes
app.use('/api/export', exportRoutes);
```

### 4. API Endpoints

**Export as PDF:**
```http
POST /api/export/reports/:id/pdf
Authorization: Bearer <token>
Content-Type: application/json

{
  "template": "standard" | "executive" | "technical",
  "includeCharts": true
}

Response: PDF file download
```

**Export as Excel:**
```http
POST /api/export/reports/:id/excel
Authorization: Bearer <token>
Content-Type: application/json

{
  "includeRawData": true
}

Response: Excel file download
```

**Export as JSON:**
```http
GET /api/export/reports/:id/json?pretty=true
Authorization: Bearer <token>

Response: JSON file download
```

## Frontend Implementation

### 1. Dependencies to Install

```bash
cd client
npm install lucide-react
```

### 2. File Structure

```
client/src/
└── components/
    └── ExportDialog.jsx    # Export UI component
```

### 3. Integration Example

Update your report card component (e.g., in `Reports.jsx` or report detail page):

```javascript
import { useState } from 'react';
import ExportDialog from '@/components/ExportDialog';

function ReportCard({ report }) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <div className="report-card">
      {/* ... existing card content ... */}
      
      <button onClick={() => setExportDialogOpen(true)}>
        <FileDown className="w-4 h-4" />
        Export
      </button>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportId={report._id}
        reportTitle={report.title}
      />
    </div>
  );
}
```

## Export Formats

### PDF Export

**Templates:**

1. **Standard** - Complete report with all sections
   - Cover page with metadata
   - Table of contents
   - All sections in order
   - Metrics tables
   - Page numbering

2. **Executive** - High-level summary
   - Key highlights only
   - KPIs and metrics
   - Recommendations
   - No technical details

3. **Technical** - Detailed technical report
   - Everything from standard
   - Raw data appendix
   - All calculations and formulas

**Features:**
- Professional formatting
- Automatic page breaks
- Headers and footers
- Metric tables
- Proper typography

### Excel Export

**Sheets:**

1. **Summary** - Overview and key metrics
   - Report metadata
   - Key performance indicators
   - Targets vs actuals

2. **Section Sheets** - One per report section
   - Section content
   - Section-specific metrics
   - Charts data

3. **Raw Data** (optional) - Complete project data
   - All project fields
   - Unformatted data for analysis

**Features:**
- Formatted headers
- Color-coded tabs
- Auto-fit columns
- Conditional formatting ready

### JSON Export

**Format:**
- Complete report object
- Populated project data
- Pretty-printed (optional)
- Ready for data processing/APIs

**Use cases:**
- Data migration
- API integration
- Backup/archival
- Custom processing

## Security Features

1. **Authentication Required** - All endpoints require valid JWT token
2. **Permission Checks:**
   - Private reports: Only owner can export
   - Project-level: Team members can export
   - Public: Anyone authenticated can export
3. **Filename Sanitization** - Prevents path traversal attacks
4. **Rate Limiting** - Should be added via existing middleware

## Performance Considerations

1. **Large Reports:**
   - PDF generation is synchronous - may take time for large reports
   - Consider adding queue system for very large exports (future enhancement)

2. **Memory:**
   - Excel exports load entire workbook in memory
   - Limit report size or use streaming (future enhancement)

3. **Caching:**
   - Consider caching generated exports (future enhancement)
   - Add cache headers for static exports

## Future Enhancements

1. **Email Export** - Send exported report via email
2. **Scheduled Exports** - Automatic periodic exports
3. **Batch Export** - Export multiple reports at once
4. **Custom Templates** - User-defined PDF templates
5. **Chart Rendering** - Include actual chart images in PDF/Excel
6. **DOCX Export** - Editable Word documents
7. **Cloud Storage** - Direct upload to S3/Google Drive
8. **Export History** - Track who exported what and when

## Testing

### Manual Testing

```bash
# Start server
cd server
npm run dev

# Test PDF export
curl -X POST http://localhost:5000/api/export/reports/REPORT_ID/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template":"standard","includeCharts":true}' \
  --output test-report.pdf

# Test Excel export
curl -X POST http://localhost:5000/api/export/reports/REPORT_ID/excel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"includeRawData":true}' \
  --output test-report.xlsx

# Test JSON export
curl -X GET http://localhost:5000/api/export/reports/REPORT_ID/json?pretty=true \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test-report.json
```

## Troubleshooting

**Issue: PDF fonts look wrong**
- Solution: Install additional fonts or use PDFKit's built-in fonts

**Issue: Excel file won't open**
- Solution: Check for invalid characters in sheet names (max 31 chars, no special chars)

**Issue: Large files timeout**
- Solution: Increase server timeout or implement queue system

**Issue: Charts not appearing**
- Solution: Current implementation doesn't render charts - requires chart-to-image conversion (future enhancement)
