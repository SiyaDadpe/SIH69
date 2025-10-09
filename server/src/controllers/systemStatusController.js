/**
 * System Status Controller
 * 
 * Provides endpoints for managing system-wide status information.
 * Used by dashboard to show data freshness, new features, maintenance schedules, etc.
 */

const asyncHandler = require('express-async-handler');
const { SystemStatus } = require('../models');


/**
 * @desc    Get current system status
 * @route   GET /api/system-status
 * @access  Private
 */
const getSystemStatus = asyncHandler(async (req, res) => {
  console.log('[INFO]', `Fetching system status for user: ${req.user._id}`);

  // Get the most recent system status document
  let systemStatus = await SystemStatus.findOne()
    .sort({ updatedAt: -1 })
    .lean();

  // If no status exists, create default
  if (!systemStatus) {
    console.log('[INFO]', 'No system status found, creating default');

    systemStatus = {
      dataLastUpdated: new Date(),
      newFeatures: [],
      maintenanceSchedule: null,
      apiStatus: 'operational',
      serviceHealth: {
        database: 'healthy',
        api: 'healthy',
        authentication: 'healthy'
      },
      metrics: {
        totalUsers: 0,
        totalProjects: 0,
        avgResponseTime: 0,
        uptime: process.uptime()
      },
      alerts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: true,
      note: 'Default system status. Admin can update with actual data.'
    };
  }

  console.log('[INFO]', 'System status retrieved successfully');

  res.status(200).json({
    success: true,
    data: { systemStatus }
  });
});

/**
 * @desc    Get system status by ID (Admin only)
 * @route   GET /api/system-status/:id
 * @access  Private/Admin (manager, policymaker)
 */
const getSystemStatusById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('[INFO]', `Fetching system status: ${id} by admin: ${req.user._id}`);

  const systemStatus = await SystemStatus.findById(id).lean();

  if (!systemStatus) {
    console.warn('[WARN]', `System status not found: ${id}`);
    return res.status(404).json({
      success: false,
      message: 'System status not found'
    });
  }

  console.log('[INFO]', `System status retrieved successfully: ${id}`);

  res.status(200).json({
    success: true,
    data: { systemStatus }
  });
});

/**
 * @desc    Get all system status records (Admin only)
 * @route   GET /api/system-status/all
 * @access  Private/Admin (manager, policymaker)
 */
const getAllSystemStatus = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = '-updatedAt'
  } = req.query;

  console.log('[INFO]', `Fetching all system status records by admin: ${req.user._id}`);

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Execute query
  const [statusRecords, totalRecords] = await Promise.all([
    SystemStatus.find()
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    SystemStatus.countDocuments()
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalRecords / limitNum);
  const currentPage = parseInt(page);

  console.log('[INFO]', `Retrieved ${statusRecords.length} system status records`);

  res.status(200).json({
    success: true,
    data: {
      statusRecords,
      pagination: {
        currentPage,
        totalPages,
        totalRecords,
        recordsPerPage: limitNum,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null
      }
    }
  });
});

/**
 * @desc    Update system status (Admin only)
 * @route   PUT /api/system-status
 * @access  Private/Admin (manager, policymaker)
 */
const updateSystemStatus = asyncHandler(async (req, res) => {
  const {
    dataLastUpdated,
    newFeatures,
    maintenanceSchedule,
    apiStatus,
    serviceHealth,
    metrics,
    alerts
  } = req.body;

  console.log('[INFO]', `Updating system status by admin: ${req.user._id}`);

  // Get current system status or create new one
  let systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

  if (systemStatus) {
    // Update existing status
    if (dataLastUpdated) systemStatus.dataLastUpdated = new Date(dataLastUpdated);
    if (newFeatures) systemStatus.newFeatures = newFeatures;
    if (maintenanceSchedule !== undefined) systemStatus.maintenanceSchedule = maintenanceSchedule;
    if (apiStatus) systemStatus.apiStatus = apiStatus;
    if (serviceHealth) systemStatus.serviceHealth = { ...systemStatus.serviceHealth, ...serviceHealth };
    if (metrics) systemStatus.metrics = { ...systemStatus.metrics, ...metrics };
    if (alerts) systemStatus.alerts = alerts;

    await systemStatus.save();

    console.log('[INFO]', `System status updated successfully: ${systemStatus._id}`);

    res.status(200).json({
      success: true,
      message: 'System status updated successfully',
      data: { systemStatus }
    });
  } else {
    // Create new system status
    systemStatus = await SystemStatus.create({
      dataLastUpdated: dataLastUpdated ? new Date(dataLastUpdated) : new Date(),
      newFeatures: newFeatures || [],
      maintenanceSchedule: maintenanceSchedule || null,
      apiStatus: apiStatus || 'operational',
      serviceHealth: serviceHealth || {
        database: 'healthy',
        api: 'healthy',
        authentication: 'healthy'
      },
      metrics: metrics || {
        totalUsers: 0,
        totalProjects: 0,
        avgResponseTime: 0,
        uptime: process.uptime()
      },
      alerts: alerts || []
    });

    console.log('[INFO]', `System status created successfully: ${systemStatus._id}`);

    res.status(201).json({
      success: true,
      message: 'System status created successfully',
      data: { systemStatus }
    });
  }
});

/**
 * @desc    Add new feature announcement (Admin only)
 * @route   POST /api/system-status/features
 * @access  Private/Admin (manager, policymaker)
 */
const addFeature = asyncHandler(async (req, res) => {
  const { name, description, releaseDate, category } = req.body;

  console.log('[INFO]', `Adding new feature by admin: ${req.user._id}`, { name, category });

  // Get current system status
  let systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

  if (!systemStatus) {
    // Create new system status if doesn't exist
    systemStatus = await SystemStatus.create({
      dataLastUpdated: new Date(),
      newFeatures: [],
      apiStatus: 'operational',
      serviceHealth: {
        database: 'healthy',
        api: 'healthy',
        authentication: 'healthy'
      },
      metrics: {},
      alerts: []
    });
  }

  // Add new feature
  const newFeature = {
    name,
    description,
    releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
    category: category || 'general'
  };

  systemStatus.newFeatures.push(newFeature);
  await systemStatus.save();

  console.log('[INFO]', `Feature added successfully: ${name}`);

  res.status(201).json({
    success: true,
    message: 'Feature added successfully',
    data: {
      feature: systemStatus.newFeatures[systemStatus.newFeatures.length - 1]
    }
  });
});

/**
 * @desc    Add system alert (Admin only)
 * @route   POST /api/system-status/alerts
 * @access  Private/Admin (manager, policymaker)
 */
const addAlert = asyncHandler(async (req, res) => {
  const { severity, message, affectedServices, resolvedAt } = req.body;

  console.log('[INFO]', `Adding system alert by admin: ${req.user._id}`, { severity });

  // Get current system status
  let systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

  if (!systemStatus) {
    // Create new system status if doesn't exist
    systemStatus = await SystemStatus.create({
      dataLastUpdated: new Date(),
      newFeatures: [],
      apiStatus: 'operational',
      serviceHealth: {
        database: 'healthy',
        api: 'healthy',
        authentication: 'healthy'
      },
      metrics: {},
      alerts: []
    });
  }

  // Add new alert
  const newAlert = {
    severity,
    message,
    affectedServices: affectedServices || [],
    timestamp: new Date(),
    resolvedAt: resolvedAt ? new Date(resolvedAt) : null
  };

  systemStatus.alerts.push(newAlert);
  await systemStatus.save();

  console.log('[INFO]', `Alert added successfully`);

  res.status(201).json({
    success: true,
    message: 'Alert added successfully',
    data: {
      alert: systemStatus.alerts[systemStatus.alerts.length - 1]
    }
  });
});

/**
 * @desc    Resolve system alert (Admin only)
 * @route   PATCH /api/system-status/alerts/:alertId/resolve
 * @access  Private/Admin (manager, policymaker)
 */
const resolveAlert = asyncHandler(async (req, res) => {
  const { alertId } = req.params;

  console.log('[INFO]', `Resolving alert: ${alertId} by admin: ${req.user._id}`);

  // Get current system status
  const systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

  if (!systemStatus) {
    return res.status(404).json({
      success: false,
      message: 'System status not found'
    });
  }

  // Find and resolve alert
  const alert = systemStatus.alerts.id(alertId);

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: 'Alert not found'
    });
  }

  alert.resolvedAt = new Date();
  await systemStatus.save();

  console.log('[INFO]', `Alert resolved successfully: ${alertId}`);

  res.status(200).json({
    success: true,
    message: 'Alert resolved successfully',
    data: { alert }
  });
});

/**
 * @desc    Delete system status record (Admin only)
 * @route   DELETE /api/system-status/:id
 * @access  Private/Admin (manager, policymaker)
 */
const deleteSystemStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('[INFO]', `Deleting system status: ${id} by admin: ${req.user._id}`);

  const systemStatus = await SystemStatus.findById(id);

  if (!systemStatus) {
    return res.status(404).json({
      success: false,
      message: 'System status not found'
    });
  }

  await systemStatus.deleteOne();

  console.log('[INFO]', `System status deleted successfully: ${id}`);

  res.status(200).json({
    success: true,
    message: 'System status deleted successfully',
    data: {
      deletedSystemStatusId: id
    }
  });
});

/**
 * @desc    Get system health summary (Admin only)
 * @route   GET /api/system-status/health
 * @access  Private/Admin (manager, policymaker)
 */
const getHealthSummary = asyncHandler(async (req, res) => {
  console.log('[INFO]', `Fetching system health summary by admin: ${req.user._id}`);

  const systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

  if (!systemStatus) {
    return res.status(200).json({
      success: true,
      data: {
        health: {
          overall: 'healthy',
          services: {
            database: 'healthy',
            api: 'healthy',
            authentication: 'healthy'
          },
          unresolvedAlerts: 0,
          uptime: process.uptime()
        }
      }
    });
  }

  // Calculate unresolved alerts
  const unresolvedAlerts = systemStatus.alerts.filter(a => !a.resolvedAt).length;

  // Determine overall health
  const services = systemStatus.serviceHealth || {};
  const allHealthy = Object.values(services).every(status => status === 'healthy');
  const overallHealth = allHealthy && unresolvedAlerts === 0 ? 'healthy' : 'degraded';

  console.log('[INFO]', 'System health summary retrieved successfully');

  res.status(200).json({
    success: true,
    data: {
      health: {
        overall: overallHealth,
        services: systemStatus.serviceHealth,
        unresolvedAlerts,
        uptime: systemStatus.metrics?.uptime || process.uptime(),
        lastUpdated: systemStatus.updatedAt
      }
    }
  });
});

module.exports = {
  getSystemStatus,
  getSystemStatusById,
  getAllSystemStatus,
  updateSystemStatus,
  addFeature,
  addAlert,
  resolveAlert,
  deleteSystemStatus,
  getHealthSummary
};
