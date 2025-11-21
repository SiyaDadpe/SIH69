// All requires at the top, no duplicates
const asyncHandler = require('express-async-handler');
const { Report, Project } = require('../models');
const mongoose = require('mongoose');

/**
 * Bulk export reports as PDF or Excel bundle
 *
 * @route   POST /api/reports/bulk-export
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} PDF or Excel file as download
 */
const bulkExportReports = asyncHandler(async (req, res) => {
  const { reportIds, format } = req.body;
  if (!Array.isArray(reportIds) || reportIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'reportIds must be a non-empty array'
    });
  }
  if (!['pdf', 'excel'].includes(format)) {
    return res.status(400).json({
      success: false,
      message: 'Format must be pdf or excel'
    });
  }
  // Fetch all reports
  const reports = await Report.find({ _id: { $in: reportIds } }).lean();
  if (!reports.length) {
    return res.status(404).json({
      success: false,
      message: 'No reports found for the provided IDs'
    });
  }
  if (format === 'pdf') {
    // Create a PDF bundle (one PDF with all reports)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    const stream = res;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reports-bundle.pdf"');
    doc.pipe(stream);
    reports.forEach((report, idx) => {
      if (idx > 0) doc.addPage();
      doc.fontSize(20).text(report.title || 'Untitled Report', { align: 'center' }).moveDown();
      doc.fontSize(10).text(`Status: ${report.status || 'N/A'} | Created: ${new Date(report.createdAt).toLocaleDateString()}`);
      if (report.description) {
        doc.moveDown().fontSize(12).text(report.description);
      }
      if (report.tags && report.tags.length > 0) {
        doc.moveDown().fontSize(10).text('Tags: ' + report.tags.join(', '));
      }
      // Add more fields as needed
    });
    doc.end();
    return;
  }
  if (format === 'excel') {
    // Create an Excel workbook with one sheet per report
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    for (const report of reports) {
      const sheet = workbook.addWorksheet(report.title?.substring(0, 31) || 'Report');
      sheet.addRow(['Title', report.title || 'Untitled']);
      sheet.addRow(['Status', report.status || 'N/A']);
      sheet.addRow(['Created', new Date(report.createdAt).toLocaleDateString()]);
      sheet.addRow(['Description', report.description || '']);
      sheet.addRow(['Tags', (report.tags || []).join(', ')]);
      // Add more fields as needed
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="reports-bundle.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
    return;
  }
  return res.status(400).json({
    success: false,
    message: 'Invalid export format.'
  });
});

/**
 * Report Controller
 * 
 * Handles CRUD operations for sustainability and circularity reports
 * with pagination, filtering, search, and export capabilities.
 * 
 * @module controllers/reportController
 */



/**
 * Get analytics/overview for reports (for dashboard)
 *
 * @route   GET /api/reports/analytics
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with analytics data
 */
const getReportsAnalytics = asyncHandler(async (req, res) => {
  // Filter by authenticated user
  const filter = {
    userId: req.user._id
  };
  
  if (req.query.projectId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }
    filter.projectId = req.query.projectId;
  }

  // Fetch all reports matching filter
  const reports = await Report.find(filter).lean();

  // Total reports
  const totalReports = reports.length;

  // Average circularity and CO2 savings
  let circularitySum = 0;
  let circularityCount = 0;
  let totalSavings = 0;
  let energyTotal = 0;
  let waterTotal = 0;
  let gwpTotal = 0;
  const categoryMap = { Active: 0, Completed: 0, Archived: 0 };

  reports.forEach((r) => {
    // Use top-level circularityScore field first, then fall back to summary
    const score = Number(r.circularityScore) || Number(r.summary?.circularityScore);
    if (Number.isFinite(score) && score > 0) {
      circularitySum += score;
      circularityCount += 1;
    }
    
    // Use top-level co2Savings field first, then fall back to other sources
    const co2 = Number(r.co2Savings);
    if (Number.isFinite(co2) && co2 > 0) {
      totalSavings += co2;
    } else {
      // Fallback: CO2 savings from rawData
      const savings = Array.isArray(r.rawData?.energySavingsStack)
        ? r.rawData.energySavingsStack.reduce((acc, item) => acc + (Number(item?.value) || 0), 0)
        : 0;
      totalSavings += savings;
    }
    
    // Impact metrics
    const energy = Number(r.summary?.energyDemand);
    if (Number.isFinite(energy)) energyTotal += energy;
    const water = Number(r.summary?.waterConsumption);
    if (Number.isFinite(water)) waterTotal += water;
    const gwp = Number(r.summary?.gwp);
    if (Number.isFinite(gwp)) gwpTotal += gwp;
    
    // Category distribution
    const status = (r.status || '').toLowerCase();
    if (status === 'archived') categoryMap.Archived += 1;
    else if (status === 'final') categoryMap.Completed += 1;
    else categoryMap.Active += 1;
  });

  const averageCircularity = circularityCount > 0 ? (circularitySum / circularityCount) : 0;

  // Category distribution for donut chart
  const categoryDistribution = [
    { name: 'Active', value: categoryMap.Active },
    { name: 'Archived', value: categoryMap.Archived },
    { name: 'Completed', value: categoryMap.Completed },
  ];

  // Impact breakdown for bar chart
  const impactBreakdown = [
    { name: 'Energy demand', value: energyTotal },
    { name: 'Water use', value: waterTotal },
    { name: 'GWP', value: gwpTotal },
  ];

  res.status(200).json({
    success: true,
    data: {
      totalReports,
      averageCircularity,
      totalSavings,
      categoryDistribution,
      impactBreakdown,
    }
  });
});


/**
 * Create a new report
 * 
 * @route   POST /api/reports
 * @access  Public (no authentication required)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with created report
 */
const createReport = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    projectId,
    status,
    visibility,
    sections,
    tags,
    metadata,
    attachments
  } = req.body;

  // Validate projectId if provided
  if (projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    // Ensure the project belongs to the authenticated user
    const projectExists = await Project.findOne({
      _id: projectId,
      userId: req.user._id
    });
    
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: 'Referenced project not found or you do not have access to it'
      });
    }
  }

  // Create report with authenticated user's ID
  const report = await Report.create({
    title,
    description,
    projectId: projectId || undefined,
    userId: req.user._id, // Set userId from authenticated user
    author: {
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email
    },
    status: status || 'draft',
    visibility: visibility || 'private',
    sections: sections || [],
    tags: tags || [],
    metadata: metadata || {},
    attachments: attachments || []
  });

  console.log('[INFO]', 'Report created successfully', {
    reportId: report._id,
    reportTitle: report.title,
    userId: req.user._id,
    userEmail: req.user.email,
    source: metadata?.sourceType || 'direct'
  });

  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: {
      report
    }
  });
});

/**
 * Get all reports with pagination, filtering, and sorting
 * 
 * @route   GET /api/reports
 * @access  Public
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10)
 * @query   {string} projectId - Filter by project ID
 * @query   {string} status - Filter by status (draft, final, archived)
 * @query   {string} visibility - Filter by visibility (private, project, public)
 * @query   {string} tags - Filter by tags (comma-separated)
 * @query   {string} sort - Sort field (default: -updatedAt)
 * @query   {string} search - Text search in title, description, content
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with reports and pagination metadata
 */
const getReports = asyncHandler(async (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // Max 100 per page
  const skip = (page - 1) * limit;

  // Build filter query - filter by authenticated user
  const filter = {
    userId: req.user._id
  };

  // Filter by project ID
  if (req.query.projectId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }
    filter.projectId = req.query.projectId;
  }

  // Filter by status
  if (req.query.status) {
    const validStatuses = ['draft', 'final', 'archived'];
    if (!validStatuses.includes(req.query.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    filter.status = req.query.status;
  }

  // Filter by visibility
  if (req.query.visibility) {
    const validVisibilities = ['private', 'project', 'public'];
    if (!validVisibilities.includes(req.query.visibility)) {
      return res.status(400).json({
        success: false,
        message: `Invalid visibility. Must be one of: ${validVisibilities.join(', ')}`
      });
    }
    filter.visibility = req.query.visibility;
  }

  // Filter by tags
  if (req.query.tags) {
    const tagsArray = req.query.tags.split(',').map(tag => tag.trim().toLowerCase());
    filter.tags = { $in: tagsArray };
  }

  // Text search
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  // Sorting
  const sortBy = req.query.sort || '-updatedAt';

  // Build query
  let query = Report.find(filter);

  // Add text score if searching
  if (req.query.search) {
    query = query.select({ score: { $meta: 'textScore' } });
    query = query.sort({ score: { $meta: 'textScore' }, updatedAt: -1 });
  } else {
    query = query.sort(sortBy);
  }

  // Execute query with pagination
  const [reports, totalReports] = await Promise.all([
    query
      .populate('projectId', 'name metalType processType circularityScore')
      .populate('userId', 'name email organization')
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments(filter)
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalReports / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  console.log('[DEBUG]', 'Reports retrieved', {
    page,
    limit,
    totalReports,
    filters: filter
  });

  // Map backend fields to match frontend expectations
  const mappedReports = reports.map(r => {
    // Convert metrics array to object if needed
    const mapSectionMetrics = (metrics) => {
      if (Array.isArray(metrics)) {
        // Convert array of {name, value} to object {name: value}
        const obj = {};
        metrics.forEach(m => {
          if (m && m.name !== undefined && m.value !== undefined) {
            obj[m.name] = m.value;
          }
        });
        return obj;
      }
      return metrics || {};
    };

    return {
      id: r._id,
      projectId: r.projectId?._id || r.projectId,
      name: r.title,
      description: r.description,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      generatedBy: r.author?.name || 'system',
      version: r.schemaVersion || r.version || '1.0',
      status: r.status,
      category: r.status === 'archived' ? 'archived' : (r.status === 'final' ? 'completed' : 'active'),
      tags: r.tags,
      summary: {
        circularityScore: r.summary?.circularityScore,
        gwp: r.summary?.gwp,
        energyDemand: r.summary?.energyDemand,
        waterConsumption: r.summary?.waterConsumption,
        costAnalysis: r.summary?.costAnalysis,
        keyFindings: r.summary?.keyFindings,
        recommendations: r.summary?.recommendations
      },
      sections: (r.sections || []).map(s => ({
        id: s._id || s.id,
        title: s.title,
        content: s.content,
        metrics: mapSectionMetrics(s.metrics),
      })),
      visualizations: r.visualizations || [],
      rawData: r.rawData || {},
      exports: r.exports || {},
      sharedWith: r.sharedWith || [],
      visibility: r.visibility === 'public' ? 'public' : 'restricted',
    };
  });
  res.status(200).json({
    success: true,
    data: {
      reports: mappedReports,
      pagination: {
        currentPage: page,
        totalPages,
        totalReports,
        reportsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    }
  });
});

/**
 * Get a single report by ID
 * 
 * @route   GET /api/reports/:id
 * @access  Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with report details
 */
const getReportById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  const report = await Report.findById(req.params.id)
    .populate('projectId', 'name metalType processType circularityScore gwp status')
    .populate('author.userId', 'name email organization');

  if (!report) {
    console.warn('[WARN]', 'Report not found', {
      reportId: req.params.id
    });

    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  console.log('[DEBUG]', 'Report retrieved', {
    reportId: report._id,
    reportTitle: report.title
  });

  // Map backend fields to match frontend expectations for single report
  const r = report.toObject ? report.toObject() : report;
  // Convert metrics array to object if needed
  const mapSectionMetrics = (metrics) => {
    if (Array.isArray(metrics)) {
      const obj = {};
      metrics.forEach(m => {
        if (m && m.name !== undefined && m.value !== undefined) {
          obj[m.name] = m.value;
        }
      });
      return obj;
    }
    return metrics || {};
  };

  const mappedReport = {
    id: r._id,
    projectId: r.projectId?._id || r.projectId,
    name: r.title,
    description: r.description,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    generatedBy: r.author?.name || 'system',
    version: r.schemaVersion || r.version || '1.0',
    status: r.status,
    category: r.status === 'archived' ? 'archived' : (r.status === 'final' ? 'completed' : 'active'),
    tags: r.tags,
    summary: {
      circularityScore: r.summary?.circularityScore,
      gwp: r.summary?.gwp,
      energyDemand: r.summary?.energyDemand,
      waterConsumption: r.summary?.waterConsumption,
      costAnalysis: r.summary?.costAnalysis,
      keyFindings: r.summary?.keyFindings,
      recommendations: r.summary?.recommendations
    },
    sections: (r.sections || []).map(s => ({
      id: s._id || s.id,
      title: s.title,
      content: s.content,
      metrics: mapSectionMetrics(s.metrics),
    })),
    visualizations: r.visualizations || [],
    rawData: r.rawData || {},
    exports: r.exports || {},
    sharedWith: r.sharedWith || [],
    visibility: r.visibility === 'public' ? 'public' : 'restricted',
  };
  res.status(200).json({
    success: true,
    data: {
      report: mappedReport
    }
  });
});

/**
 * Update a report
 * 
 * @route   PATCH /api/reports/:id
 * @access  Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated report
 */
const updateReport = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    console.warn('[WARN]', 'Report not found for update', {
      reportId: req.params.id
    });

    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  // Update allowed fields
  const allowedUpdates = [
    'title',
    'description',
    'projectId',
    'author',
    'status',
    'visibility',
    'sections',
    'tags',
    'metadata',
    'attachments'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      report[field] = req.body[field];
    }
  });

  // Validate projectId if being updated
  if (req.body.projectId) {
    if (!mongoose.Types.ObjectId.isValid(req.body.projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    const projectExists = await Project.findById(req.body.projectId);
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: 'Referenced project not found'
      });
    }
  }

  // Save updated report
  await report.save();

  // Populate related fields
  await report.populate('projectId', 'name metalType processType');
  await report.populate('author.userId', 'name email');

  console.log('[INFO]', 'Report updated successfully', {
    reportId: report._id,
    reportTitle: report.title
  });

  res.status(200).json({
    success: true,
    message: 'Report updated successfully',
    data: {
      report
    }
  });
});

/**
 * Delete a report
 * 
 * @route   DELETE /api/reports/:id
 * @access  Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion
 */
const deleteReport = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    console.warn('[WARN]', 'Report not found for deletion', {
      reportId: req.params.id
    });

    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  const reportTitle = report.title;
  const reportId = report._id;

  // Delete the report
  await report.deleteOne();

  console.log('[INFO]', 'Report deleted successfully', {
    reportId,
    reportTitle
  });

  res.status(200).json({
    success: true,
    message: 'Report deleted successfully',
    data: {
      deletedReportId: reportId,
      deletedReportTitle: reportTitle
    }
  });
});

/**
 * Publish a report (set status to final)
 * 
 * @route   POST /api/reports/:id/publish
 * @access  Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with published report
 */
const publishReport = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  // Use the model's publish method
  await report.publish();

  await report.populate('projectId', 'name metalType processType');
  await report.populate('author.userId', 'name email');

  console.log('[INFO]', 'Report published successfully', {
    reportId: report._id,
    reportTitle: report.title,
    publishedAt: report.publishedAt
  });

  res.status(200).json({
    success: true,
    message: 'Report published successfully',
    data: {
      report
    }
  });
});

/**
 * Archive a report
 * 
 * @route   POST /api/reports/:id/archive
 * @access  Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with archived report
 */
const archiveReport = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  // Use the model's archive method
  await report.archive();

  await report.populate('projectId', 'name metalType processType');
  await report.populate('author.userId', 'name email');

  console.log('[INFO]', 'Report archived successfully', {
    reportId: report._id,
    reportTitle: report.title
  });

  res.status(200).json({
    success: true,
    message: 'Report archived successfully',
    data: {
      report
    }
  });
});

/**
 * Get report statistics
 * 
 * @route   GET /api/reports/stats
 * @access  Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with report statistics
 */
const getReportStats = asyncHandler(async (req, res) => {
  // Build filter if projectId is provided
  const filter = {};
  if (req.query.projectId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }
    filter.projectId = req.query.projectId;
  }

  const stats = await Report.getStatistics(filter);

  console.log('[DEBUG]', 'Report stats retrieved', {
    filter,
    totalReports: stats.totalReports
  });

  res.status(200).json({
    success: true,
    data: {
      stats
    }
  });
});

/**
 * Export report (JSON format)
 * 
 * @route   GET /api/reports/:id/export
 * @access  Public
 * @query   {string} format - Export format (json, pdf) - default: json
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Exported report data
 */
const exportReport = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  const report = await Report.findById(req.params.id)
    .populate('projectId')
    .populate('author.userId', 'name email organization')
    .lean();

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  const format = req.query.format || 'json';

  if (format === 'json') {
    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="report-${report._id}.json"`);
    
    console.log('[INFO]', 'Report exported as JSON', {
      reportId: report._id,
      reportTitle: report.title
    });

    return res.status(200).json(report);
  }

  if (format === 'pdf') {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${report._id}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // PDF Header
    doc.fontSize(24)
       .fillColor('#2c3e50')
       .text(report.title, { align: 'center' })
       .moveDown();

    // Status and Visibility badges
    doc.fontSize(10)
       .fillColor('#7f8c8d')
       .text(`Status: ${report.status.toUpperCase()} | Visibility: ${report.visibility}`, { align: 'center' })
       .moveDown(0.5);

    // Date information
    const createdDate = new Date(report.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    doc.text(`Created: ${createdDate}`, { align: 'center' })
       .moveDown(1.5);

    // Description section
    if (report.description) {
      doc.fontSize(12)
         .fillColor('#34495e')
         .text('Description', { underline: true })
         .moveDown(0.5);
      
      doc.fontSize(10)
         .fillColor('#2c3e50')
         .text(report.description, { align: 'justify' })
         .moveDown(1.5);
    }

    // Author information
    if (report.author && report.author.name) {
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text(`Author: ${report.author.name}${report.author.email ? ` (${report.author.email})` : ''}`)
         .moveDown(1);
    }

    // Project information
    if (report.projectId) {
      const projectName = report.projectId.name || report.projectId;
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text(`Project: ${projectName}`)
         .moveDown(1.5);
    }

    // Add horizontal line
    doc.strokeColor('#bdc3c7')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke()
       .moveDown(1.5);

    // Sections
    if (report.sections && report.sections.length > 0) {
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text('Report Sections', { underline: true })
         .moveDown(1);

      report.sections.forEach((section, index) => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 150) {
          doc.addPage();
        }

        // Section title
        doc.fontSize(14)
           .fillColor('#34495e')
           .text(`${index + 1}. ${section.title}`)
           .moveDown(0.5);

        // Section content
        if (section.content) {
          doc.fontSize(10)
             .fillColor('#2c3e50')
             .text(section.content, { align: 'justify' })
             .moveDown(1);
        }

        // Section metrics
        if (section.metrics && section.metrics.length > 0) {
          doc.fontSize(11)
             .fillColor('#16a085')
             .text('Metrics:', { continued: false })
             .moveDown(0.3);

          section.metrics.forEach((metric) => {
            const metricText = `  • ${metric.label}: ${metric.value}${metric.unit ? ' ' + metric.unit : ''}`;
            doc.fontSize(9)
               .fillColor('#2c3e50')
               .text(metricText);
            
            if (metric.baseline !== undefined || metric.change !== undefined) {
              const changeText = `    Baseline: ${metric.baseline || 'N/A'}, Change: ${metric.change !== undefined ? metric.change + '%' : 'N/A'}`;
              doc.fontSize(8)
                 .fillColor('#7f8c8d')
                 .text(changeText);
            }
          });
          doc.moveDown(0.5);
        }

        // Section charts info
        if (section.charts && section.charts.length > 0) {
          doc.fontSize(9)
             .fillColor('#7f8c8d')
             .text(`Charts: ${section.charts.length} chart(s) included`)
             .moveDown(0.5);
        }

        doc.moveDown(1);
      });
    }

    // Summary section
    if (report.summary && Object.keys(report.summary).length > 0) {
      // Check if we need a new page
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      }

      doc.strokeColor('#bdc3c7')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke()
         .moveDown(1.5);

      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text('Summary', { underline: true })
         .moveDown(1);

      doc.fontSize(10)
         .fillColor('#34495e')
         .text(`Total Sections: ${report.summary.totalSections || 0}`)
         .text(`Total Metrics: ${report.summary.totalMetrics || 0}`)
         .moveDown(1);

      // Metrics by type
      if (report.summary.metricsByType) {
        doc.fontSize(11)
           .fillColor('#16a085')
           .text('Metrics by Type:')
           .moveDown(0.3);

        Object.entries(report.summary.metricsByType).forEach(([type, count]) => {
          doc.fontSize(9)
             .fillColor('#2c3e50')
             .text(`  • ${type}: ${count}`);
        });
        doc.moveDown(1);
      }

      // Average values
      if (report.summary.averageValues) {
        doc.fontSize(11)
           .fillColor('#16a085')
           .text('Average Values:')
           .moveDown(0.3);

        Object.entries(report.summary.averageValues).forEach(([metric, data]) => {
          doc.fontSize(9)
             .fillColor('#2c3e50')
             .text(`  • ${metric}: ${data.average}${data.unit ? ' ' + data.unit : ''}`);
        });
        doc.moveDown(1);
      }
    }

    // Tags
    if (report.tags && report.tags.length > 0) {
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text(`Tags: ${report.tags.join(', ')}`)
         .moveDown(1);
    }

    // Footer
    doc.fontSize(8)
       .fillColor('#95a5a6')
       .text(
         `Generated on ${new Date().toLocaleString('en-US')} | Report ID: ${report._id}`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );

    console.log('[INFO]', 'Report exported as PDF', {
      reportId: report._id,
      reportTitle: report.title
    });

    // Finalize PDF
    doc.end();
    return;
  }

  return res.status(400).json({
    success: false,
    message: 'Invalid export format. Supported formats: json, pdf'
  });
});

/**
 * Bulk create reports
 * 
 * @route   POST /api/reports/bulk
 * @access  Public
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with bulk creation results
 */
const bulkCreateReports = asyncHandler(async (req, res) => {
  const { reports } = req.body;

  if (!Array.isArray(reports) || reports.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain a non-empty array of reports'
    });
  }

  if (reports.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 100 reports can be created at once'
    });
  }

  const results = {
    successful: [],
    failed: []
  };

  for (let i = 0; i < reports.length; i++) {
    try {
      const reportData = reports[i];
      
      // Validate projectId if provided
      if (reportData.projectId && !mongoose.Types.ObjectId.isValid(reportData.projectId)) {
        throw new Error('Invalid project ID format');
      }

      const report = await Report.create({
        title: reportData.title,
        description: reportData.description,
        projectId: reportData.projectId || undefined,
        author: reportData.author || { name: 'Anonymous', email: 'anonymous@example.com' },
        status: reportData.status || 'draft',
        visibility: reportData.visibility || 'public',
        sections: reportData.sections || [],
        tags: reportData.tags || [],
        metadata: reportData.metadata || {},
        attachments: reportData.attachments || []
      });

      results.successful.push({
        index: i,
        reportId: report._id,
        title: report.title
      });
    } catch (error) {
      results.failed.push({
        index: i,
        title: reports[i].title || 'Untitled',
        error: error.message
      });
    }
  }

  console.log('[INFO]', 'Bulk report creation completed', {
    total: reports.length,
    successful: results.successful.length,
    failed: results.failed.length
  });

  res.status(201).json({
    success: true,
    message: `Bulk creation completed: ${results.successful.length} successful, ${results.failed.length} failed`,
    data: results
  });
});

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  publishReport,
  archiveReport,
  getReportStats,
  exportReport,
  bulkCreateReports,
  getReportsAnalytics
  ,bulkExportReports
};
