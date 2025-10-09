/**
 * Benchmark Controller
 * 
 * Provides endpoints for managing industry benchmark data used by the dashboard.
 * Benchmarks include user performance metrics compared to industry standards.
 */

const asyncHandler = require('express-async-handler');
const { Benchmark, Project } = require('../models');


/**
 * @desc    Get latest benchmark data
 * @route   GET /api/benchmarks
 * @access  Private
 */
const getLatestBenchmark = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  console.log('[INFO]', `Fetching latest benchmark for user: ${userId}`);

  // Try to get latest benchmark for this user
  let benchmark = await Benchmark.findOne({ userId })
    .sort({ lastUpdated: -1 })
    .lean();

  // If no benchmark exists, compute defaults from user's projects
  if (!benchmark) {
    console.log('[INFO]', `No benchmark found for user: ${userId}, computing defaults`);
    
    // Aggregate user's project statistics
    const projectStats = await Project.aggregate([
      {
        $match: { owner: userId }
      },
      {
        $group: {
          _id: null,
          avgCircularity: { $avg: '$circularityScore' },
          projectCount: { $sum: 1 }
        }
      }
    ]);

    const userStats = projectStats[0] || { avgCircularity: 0, projectCount: 0 };

    // Create default benchmark with computed values
    benchmark = {
      userId,
      userAverageCircularity: userStats.avgCircularity 
        ? parseFloat(userStats.avgCircularity.toFixed(2)) 
        : 0,
      industryMedianCircularity: 65.0, // Default industry median
      userPercentile: 50, // Default to median
      comparisonSectors: ['General Manufacturing'],
      lastUpdated: new Date(),
      period: 'current',
      projectCount: userStats.projectCount,
      isComputed: true, // Flag to indicate this is computed, not stored
      note: 'Default benchmark data. Admin can update with actual industry data.'
    };

    console.log('[INFO]', `Computed default benchmark for user: ${userId}`);
  }

  res.status(200).json({
    success: true,
    data: { benchmark }
  });
});

/**
 * @desc    Get benchmark by ID
 * @route   GET /api/benchmarks/:id
 * @access  Private
 */
const getBenchmarkById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const isAdmin = ['admin', 'manager', 'policymaker'].includes(req.user.role);

  console.log('[INFO]', `Fetching benchmark: ${id} for user: ${userId}`);

  const benchmark = await Benchmark.findById(id).lean();

  if (!benchmark) {
    console.warn('[WARN]', `Benchmark not found: ${id}`);
    return res.status(404).json({
      success: false,
      message: 'Benchmark not found'
    });
  }

  // Check authorization (owner or admin)
  if (!isAdmin && benchmark.userId.toString() !== userId.toString()) {
    console.warn('[WARN]', `Unauthorized access to benchmark: ${id} by user: ${userId}`);
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. You do not have permission to view this benchmark.'
    });
  }

  console.log('[INFO]', `Benchmark retrieved successfully: ${id}`);

  res.status(200).json({
    success: true,
    data: { benchmark }
  });
});

/**
 * @desc    Get all benchmarks (Admin only)
 * @route   GET /api/benchmarks/all
 * @access  Private/Admin (manager, policymaker)
 */
const getAllBenchmarks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    period,
    sort = '-lastUpdated'
  } = req.query;

  console.log('[INFO]', `Fetching all benchmarks by admin: ${req.user._id}`);

  // Build filter
  const filter = {};
  if (period) filter.period = period;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Execute query
  const [benchmarks, totalBenchmarks] = await Promise.all([
    Benchmark.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email organization role')
      .lean(),
    Benchmark.countDocuments(filter)
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalBenchmarks / limitNum);
  const currentPage = parseInt(page);

  console.log('[INFO]', `Retrieved ${benchmarks.length} benchmarks`);

  res.status(200).json({
    success: true,
    data: {
      benchmarks,
      pagination: {
        currentPage,
        totalPages,
        totalBenchmarks,
        benchmarksPerPage: limitNum,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null
      }
    }
  });
});

/**
 * @desc    Create or update benchmark
 * @route   PUT /api/benchmarks
 * @access  Private/Admin (manager, policymaker)
 */
const updateBenchmark = asyncHandler(async (req, res) => {
  const {
    userId,
    userAverageCircularity,
    industryMedianCircularity,
    userPercentile,
    comparisonSectors,
    period,
    projectCount
  } = req.body;

  console.log('[INFO]', `Updating benchmark for user: ${userId} by admin: ${req.user._id}`);

  // Find existing benchmark or create new one
  let benchmark = await Benchmark.findOne({ userId, period: period || 'current' });

  if (benchmark) {
    // Update existing benchmark
    benchmark.userAverageCircularity = userAverageCircularity ?? benchmark.userAverageCircularity;
    benchmark.industryMedianCircularity = industryMedianCircularity ?? benchmark.industryMedianCircularity;
    benchmark.userPercentile = userPercentile ?? benchmark.userPercentile;
    benchmark.comparisonSectors = comparisonSectors ?? benchmark.comparisonSectors;
    benchmark.projectCount = projectCount ?? benchmark.projectCount;
    benchmark.lastUpdated = new Date();

    await benchmark.save();

    console.log('[INFO]', `Benchmark updated successfully: ${benchmark._id}`);

    res.status(200).json({
      success: true,
      message: 'Benchmark updated successfully',
      data: { benchmark }
    });
  } else {
    // Create new benchmark
    benchmark = await Benchmark.create({
      userId,
      userAverageCircularity,
      industryMedianCircularity,
      userPercentile,
      comparisonSectors,
      period: period || 'current',
      projectCount: projectCount || 0,
      lastUpdated: new Date()
    });

    console.log('[INFO]', `Benchmark created successfully: ${benchmark._id}`);

    res.status(201).json({
      success: true,
      message: 'Benchmark created successfully',
      data: { benchmark }
    });
  }
});

/**
 * @desc    Bulk update benchmarks from industry data (Admin only)
 * @route   POST /api/benchmarks/bulk-update
 * @access  Private/Admin (manager, policymaker)
 */
const bulkUpdateBenchmarks = asyncHandler(async (req, res) => {
  const { benchmarks } = req.body;

  console.log('[INFO]', `Bulk updating ${benchmarks.length} benchmarks by admin: ${req.user._id}`);

  if (!Array.isArray(benchmarks) || benchmarks.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Benchmarks array is required and must not be empty'
    });
  }

  const results = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: []
  };

  // Process each benchmark
  for (const benchmarkData of benchmarks) {
    try {
      const { userId, period = 'current', ...data } = benchmarkData;

      if (!userId) {
        results.failed++;
        results.errors.push({ userId: 'missing', error: 'userId is required' });
        continue;
      }

      // Find or create benchmark
      let benchmark = await Benchmark.findOne({ userId, period });

      if (benchmark) {
        // Update existing
        Object.assign(benchmark, data);
        benchmark.lastUpdated = new Date();
        await benchmark.save();
        results.updated++;
      } else {
        // Create new
        await Benchmark.create({
          userId,
          period,
          ...data,
          lastUpdated: new Date()
        });
        results.created++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        userId: benchmarkData.userId,
        error: error.message
      });
      console.error('[ERROR]', `Failed to process benchmark for user: ${benchmarkData.userId}`, error);
    }
  }

  console.log('[INFO]', `Bulk update completed: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);

  res.status(200).json({
    success: true,
    message: 'Bulk update completed',
    data: { results }
  });
});

/**
 * @desc    Delete benchmark (Admin only)
 * @route   DELETE /api/benchmarks/:id
 * @access  Private/Admin (manager, policymaker)
 */
const deleteBenchmark = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('[INFO]', `Deleting benchmark: ${id} by admin: ${req.user._id}`);

  const benchmark = await Benchmark.findById(id);

  if (!benchmark) {
    return res.status(404).json({
      success: false,
      message: 'Benchmark not found'
    });
  }

  await benchmark.deleteOne();

  console.log('[INFO]', `Benchmark deleted successfully: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Benchmark deleted successfully',
    data: {
      deletedBenchmarkId: id
    }
  });
});

/**
 * @desc    Get industry statistics (Admin only)
 * @route   GET /api/benchmarks/industry-stats
 * @access  Private/Admin (manager, policymaker)
 */
const getIndustryStats = asyncHandler(async (req, res) => {
  console.log('[INFO]', `Fetching industry statistics by admin: ${req.user._id}`);

  // Aggregate industry-wide statistics
  const stats = await Benchmark.aggregate([
    {
      $group: {
        _id: null,
        avgUserCircularity: { $avg: '$userAverageCircularity' },
        avgIndustryMedian: { $avg: '$industryMedianCircularity' },
        avgPercentile: { $avg: '$userPercentile' },
        totalUsers: { $sum: 1 },
        totalProjects: { $sum: '$projectCount' }
      }
    }
  ]);

  // Get sector breakdown
  const sectorStats = await Benchmark.aggregate([
    { $unwind: '$comparisonSectors' },
    {
      $group: {
        _id: '$comparisonSectors',
        count: { $sum: 1 },
        avgCircularity: { $avg: '$userAverageCircularity' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const industryStats = stats[0] || {
    avgUserCircularity: 0,
    avgIndustryMedian: 0,
    avgPercentile: 0,
    totalUsers: 0,
    totalProjects: 0
  };

  console.log('[INFO]', 'Industry statistics retrieved successfully');

  res.status(200).json({
    success: true,
    data: {
      overall: {
        averageUserCircularity: parseFloat((industryStats.avgUserCircularity || 0).toFixed(2)),
        averageIndustryMedian: parseFloat((industryStats.avgIndustryMedian || 0).toFixed(2)),
        averagePercentile: parseFloat((industryStats.avgPercentile || 0).toFixed(2)),
        totalUsers: industryStats.totalUsers,
        totalProjects: industryStats.totalProjects
      },
      bySector: sectorStats.map(s => ({
        sector: s._id,
        userCount: s.count,
        averageCircularity: parseFloat((s.avgCircularity || 0).toFixed(2))
      }))
    }
  });
});

module.exports = {
  getLatestBenchmark,
  getBenchmarkById,
  getAllBenchmarks,
  updateBenchmark,
  bulkUpdateBenchmarks,
  deleteBenchmark,
  getIndustryStats
};
