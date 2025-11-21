const Report = require('../models/Report');
const Project = require('../models/Project');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Export Controller
 * Handles export of reports in various formats
 */

// Generate PDF report
exports.exportToPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { template = 'standard', includeCharts = true } = req.body;

    // Fetch report with populated project data
    const report = await Report.findById(id)
      .populate('projectId', 'name metalType circularityScore gwp energyConsumption waterUsage wasteGenerated')
      .lean();

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    // TODO: Check permissions when auth is enabled
    // if (report.visibility === 'private' && report.author.userId.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: 'Access denied' 
    //   });
    // }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: report.title,
        Author: report.author.name,
        Subject: 'LCA Report',
        Keywords: report.tags?.join(', ')
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(report.title)}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Generate PDF content based on template
    if (template === 'executive') {
      generateExecutivePDF(doc, report);
    } else if (template === 'technical') {
      generateTechnicalPDF(doc, report);
    } else {
      generateStandardPDF(doc, report, includeCharts);
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate PDF export',
      error: error.message 
    });
  }
};

// Export as JSON
exports.exportToJSON = async (req, res) => {
  try {
    const { id } = req.params;
    const { pretty = true } = req.query;

    const report = await Report.findById(id)
      .populate('projectId')
      .lean();

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    // TODO: Check permissions when auth is enabled
    // if (report.visibility === 'private' && report.author.userId.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: 'Access denied' 
    //   });
    // }

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(report.title)}.json"`);

    // Send JSON
    const jsonString = pretty ? JSON.stringify(report, null, 2) : JSON.stringify(report);
    res.send(jsonString);

  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate JSON export',
      error: error.message 
    });
  }
};

// Helper: Generate standard PDF
function generateStandardPDF(doc, report, includeCharts) {
  // Cover page
  doc.fontSize(24).font('Helvetica-Bold').text(report.title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text(report.description || '', { align: 'center' });
  doc.moveDown(2);

  // Metadata
  doc.fontSize(10);
  doc.text(`Author: ${report.author.name}`);
  doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`);
  doc.text(`Status: ${report.status.toUpperCase()}`);
  doc.text(`Version: ${report.version}`);
  doc.moveDown(2);

  // Key metrics box
  doc.rect(50, doc.y, 495, 120).stroke();
  const metricsY = doc.y + 10;
  doc.fontSize(14).font('Helvetica-Bold').text('Key Metrics', 60, metricsY);
  doc.moveDown();
  
  doc.fontSize(11).font('Helvetica');
  doc.text(`Circularity Score: ${report.circularityScore || 'N/A'}%`, 60);
  doc.text(`CO₂ Savings: ${report.co2Savings || 'N/A'} kg CO₂e`, 60);
  
  if (report.projectId) {
    doc.text(`GWP: ${report.projectId.gwp || 'N/A'} kg CO₂e`, 60);
    doc.text(`Energy: ${report.projectId.energyConsumption || 'N/A'} kWh`, 60);
    doc.text(`Water: ${report.projectId.waterUsage || 'N/A'} L`, 60);
  }

  doc.addPage();

  // Table of contents
  doc.fontSize(16).font('Helvetica-Bold').text('Table of Contents', { underline: true });
  doc.moveDown();
  
  doc.fontSize(11).font('Helvetica');
  if (report.sections) {
    report.sections.sort((a, b) => a.order - b.order).forEach((section, idx) => {
      doc.text(`${idx + 1}. ${section.title}`, { indent: 20 });
    });
  }

  doc.addPage();

  // Sections
  if (report.sections) {
    report.sections.sort((a, b) => a.order - b.order).forEach((section, idx) => {
      // Section header
      doc.fontSize(16).font('Helvetica-Bold').text(`${idx + 1}. ${section.title}`, { underline: true });
      doc.moveDown();

      // Section content
      doc.fontSize(11).font('Helvetica').text(section.content, { align: 'justify' });
      doc.moveDown();

      // Section metrics
      if (section.metrics && section.metrics.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Metrics:', { underline: true });
        doc.moveDown(0.5);
        
        section.metrics.forEach(metric => {
          doc.fontSize(10).font('Helvetica');
          doc.text(`• ${metric.name}: ${metric.value} ${metric.unit}`, { indent: 20 });
        });
        doc.moveDown();
      }

      // Page break between sections (except last)
      if (idx < report.sections.length - 1) {
        doc.addPage();
      }
    });
  }

  // Footer on each page
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).text(
      `Page ${i + 1} of ${range.count}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  }
}

// Helper: Generate executive summary PDF
function generateExecutivePDF(doc, report) {
  // Condensed version focusing on key insights
  doc.fontSize(20).font('Helvetica-Bold').text('Executive Summary', { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(16).text(report.title);
  doc.moveDown();

  // Key highlights only
  doc.fontSize(12).font('Helvetica');
  doc.text(report.summary?.executiveSummary || report.description || '');
  doc.moveDown(2);

  // Key metrics in visual format
  doc.fontSize(14).font('Helvetica-Bold').text('Key Performance Indicators');
  doc.moveDown();

  const metrics = [
    { label: 'Circularity Score', value: `${report.circularityScore || 'N/A'}%`, target: '≥70%' },
    { label: 'CO₂ Savings', value: `${report.co2Savings || 'N/A'} kg`, target: 'Maximize' }
  ];

  metrics.forEach(metric => {
    doc.fontSize(11).font('Helvetica-Bold').text(metric.label);
    doc.fontSize(10).font('Helvetica').text(`Value: ${metric.value} | Target: ${metric.target}`);
    doc.moveDown();
  });

  // Recommendations only
  const recommendationsSection = report.sections?.find(s => s.title.includes('Recommendation'));
  if (recommendationsSection) {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Recommendations');
    doc.moveDown();
    doc.fontSize(11).font('Helvetica').text(recommendationsSection.content, { align: 'justify' });
  }
}

// Helper: Generate technical PDF
function generateTechnicalPDF(doc, report) {
  // Detailed technical version with all data
  generateStandardPDF(doc, report, true);
  
  // Add appendix with raw data
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold').text('Appendix: Raw Data', { underline: true });
  doc.moveDown();

  if (report.projectId) {
    doc.fontSize(11).font('Helvetica');
    const project = report.projectId;
    
    Object.entries(project).forEach(([key, value]) => {
      if (typeof value !== 'object' || value === null) {
        doc.text(`${key}: ${value}`);
      }
    });
  }
}

// Helper: Sanitize filename
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 100);
}

// Helper: Sanitize sheet name for Excel
function sanitizeSheetName(name) {
  return name
    .replace(/[:\\\/\?\*\[\]]/g, '_')
    .substring(0, 31); // Excel limit
}
