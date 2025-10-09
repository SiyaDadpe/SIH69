/**
 * Project Controller
 * 
 * Handles CRUD operations for project management with pagination,
 * filtering, and authorization checks.
 * 
 * @module controllers/projectController
 */

const asyncHandler = require('express-async-handler');
const { Project } = require('../models');

const { clearCache } = require('../utils/localCache');

/**
 * Create a new project
 * 
 * @route   POST /api/projects
 * @access  Private (Authenticated users)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with created project
 */
const createProject = asyncHandler(async (req, res) => {
  const {
    name,
    metalType,
    processType,
    circularityScore,
    gwp,
    status,
    metadata
  } = req.body;

  // Create project with authenticated user as owner
  const project = await Project.create({
    name,
    metalType,
    processType,
    circularityScore,
    gwp,
    status: status || 'draft',
    owner: req.user._id, // Set owner from authenticated user
    metadata: metadata || {}
  });

  console.log('[INFO]', 'Project created successfully', {
    projectId: project._id,
    projectName: project.name,
    owner: req.user._id,
    ownerEmail: req.user.email
  });

  clearCache(`dashboard:${req.user._id}`);

  if (circularityScore && gwp) {
    try {
      const { generateMockInsightsForProject } = require('./insightController');
      
      setImmediate(async () => {
        try {
          await generateMockInsightsForProject({ projectId: project._id.toString() });
          console.log('[INFO]', 'Auto-insights generated for new project', {
            projectId: project._id
          });
        } catch (error) {
          console.error('[ERROR]', 'Auto-insight generation failed', {
            projectId: project._id,
            error: error.message
          });
        }
      });
    } catch (error) {
      console.error('[WARN]', 'Could not initiate auto-insight generation', {
        error: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: {
      project
    }
  });
});

/**
 * Get all projects with pagination, filtering, and sorting
 * 
 * @route   GET /api/projects
 * @access  Private (Authenticated users)
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10)
 * @query   {string} metalType - Filter by metal type
 * @query   {string} processType - Filter by process type
 * @query   {string} status - Filter by status
 * @query   {string} sort - Sort field (default: -createdAt)
 * @query   {string} search - Search in project name
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with projects and pagination metadata
 */
const getProjects = asyncHandler(async (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build filter query
  const filter = {};

  // Filter by metal type
  if (req.query.metalType) {
    filter.metalType = req.query.metalType;
  }

  // Filter by process type
  if (req.query.processType) {
    filter.processType = req.query.processType;
  }

  // Filter by status
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by owner (show user's own projects)
  // Admins can see all projects, others see only their own
  if (req.user.role !== 'admin') {
    filter.owner = req.user._id;
  }

  // Search in project name (text search)
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  // Sorting
  const sortBy = req.query.sort || '-createdAt';

  // Execute query with pagination
  const [projects, totalProjects] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'name email organization role')
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter)
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalProjects / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  console.log('[DEBUG]', 'Projects retrieved', {
    userId: req.user._id,
    page,
    limit,
    totalProjects,
    filters: filter
  });

  res.status(200).json({
    success: true,
    data: {
      projects,
      pagination: {
        currentPage: page,
        totalPages,
        totalProjects,
        projectsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    }
  });
});

/**
 * Get a single project by ID
 * 
 * @route   GET /api/projects/:id
 * @access  Private (Authenticated users)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with project details
 */
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email organization role');

  if (!project) {
    console.warn('[WARN]', 'Project not found', {
      projectId: req.params.id,
      userId: req.user._id
    });

    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if user has access to view this project
  // User can view if: they own it, or they are admin
  const isOwner = project.owner._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    console.warn('[WARN]', 'Unauthorized project access attempt', {
      projectId: project._id,
      userId: req.user._id,
      ownerId: project.owner._id
    });

    return res.status(403).json({
      success: false,
      message: 'Access forbidden. You do not have permission to view this project.'
    });
  }

  console.log('[DEBUG]', 'Project retrieved', {
    projectId: project._id,
    userId: req.user._id
  });

  res.status(200).json({
    success: true,
    data: {
      project
    }
  });
});

/**
 * Update a project
 * 
 * @route   PUT /api/projects/:id
 * @access  Private (Owner or Admin)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated project
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    console.warn('[WARN]', 'Project not found for update', {
      projectId: req.params.id,
      userId: req.user._id
    });

    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if user is owner or admin
  const isOwner = project.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    console.warn('[WARN]', 'Unauthorized project update attempt', {
      projectId: project._id,
      userId: req.user._id,
      ownerId: project.owner
    });

    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Only the project owner or admin can update this project.'
    });
  }

  // Update allowed fields
  const allowedUpdates = [
    'name',
    'metalType',
    'processType',
    'circularityScore',
    'gwp',
    'status',
    'metadata'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      project[field] = req.body[field];
    }
  });

  // Save updated project
  await project.save();

  // Populate owner details
  await project.populate('owner', 'name email organization role');

  console.log('[INFO]', 'Project updated successfully', {
    projectId: project._id,
    projectName: project.name,
    updatedBy: req.user._id,
    updatedByEmail: req.user.email
  });

  // Invalidate dashboard cache for the project owner (Redis - async operation)
  await clearCache(`dashboard:${project.owner._id}`);

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: {
      project
    }
  });
});

/**
 * Delete a project
 * 
 * @route   DELETE /api/projects/:id
 * @access  Private (Owner or Admin)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    console.warn('[WARN]', 'Project not found for deletion', {
      projectId: req.params.id,
      userId: req.user._id
    });

    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if user is owner or admin
  const isOwner = project.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    console.warn('[WARN]', 'Unauthorized project deletion attempt', {
      projectId: project._id,
      userId: req.user._id,
      ownerId: project.owner
    });

    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Only the project owner or admin can delete this project.'
    });
  }

  const projectName = project.name;
  const projectId = project._id;
  const ownerId = project.owner;

  // Delete the project
  await project.deleteOne();

  console.log('[INFO]', 'Project deleted successfully', {
    projectId,
    projectName,
    deletedBy: req.user._id,
    deletedByEmail: req.user.email
  });

  // Invalidate dashboard cache for the project owner (Redis - async operation)
  await clearCache(`dashboard:${ownerId}`);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
    data: {
      deletedProjectId: projectId,
      deletedProjectName: projectName
    }
  });
});

/**
 * Get project statistics for the authenticated user
 * 
 * @route   GET /api/projects/stats
 * @access  Private
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with project statistics
 */
const getProjectStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Project.aggregate([
    { $match: { owner: userId } },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        averageCircularity: { $avg: '$circularityScore' },
        averageGWP: { $avg: '$gwp' },
        statusBreakdown: {
          $push: '$status'
        }
      }
    }
  ]);

  const statusCount = await Project.aggregate([
    { $match: { owner: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = stats[0] || {
    totalProjects: 0,
    averageCircularity: 0,
    averageGWP: 0
  };

  const statusCounts = statusCount.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  console.log('[DEBUG]', 'Project stats retrieved', {
    userId,
    totalProjects: result.totalProjects
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalProjects: result.totalProjects,
        averageCircularity: result.averageCircularity?.toFixed(2) || 0,
        averageGWP: result.averageGWP?.toFixed(2) || 0,
        byStatus: statusCounts
      }
    }
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats
};
