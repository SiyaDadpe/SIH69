/**
 * Dashboard Controller
 * 
 * Provides comprehensive dashboard metrics and insights for authenticated users.
 * Uses Mongoose aggregation pipelines for efficient KPI calculations.
 */

const asyncHandler = require('express-async-handler');
const { Project, Insight } = require('../models');
const { getCache, setCache } = require('../utils/localCache');
const { generateMockBenchmark, getIndustryInsights } = require('../utils/mockDataGenerator');

// Cache TTL: 1 hour (in milliseconds for local cache)
const DASHBOARD_CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

/**
 * @desc    Get dashboard data with KPIs, recent projects, and insights
 * @route   GET /api/dashboard
 * @access  Public (TEMPORARY - for testing)
 */
const getDashboard = asyncHandler(async (req, res) => {
  // TEMPORARY: For testing without auth, get data for all users or first user
  const userId = req.user?._id || null;
  
  console.log(`[Dashboard] Fetching data for user: ${userId || 'ALL USERS (no auth)'}`);

  // Check cache first (local cache - synchronous operation)
  const cacheKey = userId ? `dashboard:${userId}` : 'dashboard:all';
  const cachedData = getCache(cacheKey);
  
  if (cachedData) {
    console.log(`[Dashboard] Returning cached data for user: ${userId || 'ALL'}`);
    return res.status(200).json({
      success: true,
      data: cachedData.data,
      cached: true,
      cachedAt: cachedData.cachedAt
    });
  }

  // Get current date boundaries for month calculations
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // --- KPI Calculations using Aggregation Pipelines ---

  // 1. Total Projects, Average Circularity, Total CO2 Saved, Projects This Month, Completed Assessments
  const matchStage = userId ? { owner: userId } : {};
  const kpiAggregation = await Project.aggregate([
    {
      $match: matchStage
    },
    {
      $facet: {
        // Overall stats
        overallStats: [
          {
            $group: {
              _id: null,
              totalProjects: { $sum: 1 },
              averageCircularityScore: { $avg: '$circularityScore' },
              totalCO2Saved: { $sum: { $ifNull: ['$gwpSaved', '$gwp'] } },
              completedAssessments: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              }
            }
          }
        ],
        // Projects this month
        thisMonthStats: [
          {
            $match: {
              createdAt: { $gte: startOfCurrentMonth }
            }
          },
          {
            $count: 'count'
          }
        ],
        // Current month average circularity for trending
        currentMonthCircularity: [
          {
            $match: {
              createdAt: { $gte: startOfCurrentMonth }
            }
          },
          {
            $group: {
              _id: null,
              avgCircularity: { $avg: '$circularityScore' }
            }
          }
        ],
        // Last month average circularity for trending
        lastMonthCircularity: [
          {
            $match: {
              createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
            }
          },
          {
            $group: {
              _id: null,
              avgCircularity: { $avg: '$circularityScore' }
            }
          }
        ]
      }
    }
  ]);

  // Extract and defensive check for empty datasets
  const overallStats = kpiAggregation[0]?.overallStats[0] || {
    totalProjects: 0,
    averageCircularityScore: 0,
    totalCO2Saved: 0,
    completedAssessments: 0
  };

  const projectsThisMonth = kpiAggregation[0]?.thisMonthStats[0]?.count || 0;

  // Calculate trending score: compare avg circularity last month vs this month
  const currentMonthAvg = kpiAggregation[0]?.currentMonthCircularity[0]?.avgCircularity || null;
  const lastMonthAvg = kpiAggregation[0]?.lastMonthCircularity[0]?.avgCircularity || null;

  let trendingScore = 0;
  if (currentMonthAvg !== null && lastMonthAvg !== null && lastMonthAvg !== 0) {
    // Calculate percentage change and scale to -10..+10
    const percentageChange = ((currentMonthAvg - lastMonthAvg) / lastMonthAvg) * 100;
    // Scale: 10% change = ±10 score (cap at ±10)
    trendingScore = Math.max(-10, Math.min(10, percentageChange));
  } else if (currentMonthAvg !== null && lastMonthAvg === null) {
    // New user with projects only this month - positive trend
    trendingScore = 5;
  }

  // Round values for cleaner response
  const kpis = {
    totalProjects: overallStats.totalProjects,
    averageCircularityScore: overallStats.averageCircularityScore 
      ? parseFloat(overallStats.averageCircularityScore.toFixed(2)) 
      : 0,
    totalCO2Saved: overallStats.totalCO2Saved 
      ? parseFloat(overallStats.totalCO2Saved.toFixed(2)) 
      : 0,
    projectsThisMonth,
    completedAssessments: overallStats.completedAssessments,
    trendingScore: parseFloat(trendingScore.toFixed(2))
  };

  // --- Recent Projects (last 5, sorted by lastModified) ---
  const recentProjects = await Project.find(matchStage)
    .sort({ lastModified: -1 })
    .limit(5)
    .select('name metalType processType circularityScore gwp status lastModified createdAt')
    .lean();

  // --- Latest Insights ---
  let insights = await Insight.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .select('type title description confidenceScore priority createdAt')
    .lean();

  // If no insights in database, use mock industry insights
  if (insights.length === 0) {
    insights = getIndustryInsights().slice(0, 3);
  }

  // --- Generate Mock Benchmark Data ---
  const userCircularityScore = kpis.averageCircularityScore || 0;
  const benchmarkData = generateMockBenchmark(userCircularityScore);

  // --- Response ---
  console.log(`[Dashboard] Data retrieved successfully for user: ${userId || 'ALL'}`);

  const responseData = {
    kpis,
    recentProjects,
    insights,
    benchmark: benchmarkData,
    meta: {
      currentMonth: startOfCurrentMonth.toISOString().slice(0, 7), // YYYY-MM format
      dataGeneratedAt: now.toISOString()
    }
  };

  // Cache the dashboard data for 1 hour (local cache - synchronous operation)
  setCache(cacheKey, {
    data: responseData,
    cachedAt: now.toISOString()
  }, DASHBOARD_CACHE_TTL);

  res.status(200).json({
    success: true,
    data: responseData,
    cached: false
  });
});

/**
 * @desc    Get user-specific insights with filtering
 * @route   GET /api/dashboard/insights
 * @access  Private
 */
const getUserInsights = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { priority, type, limit = 10 } = req.query;

  console.log(`[Dashboard] Fetching insights for user: ${userId}`);

  // Build filter for user's projects
  const userProjects = await Project.find({ owner: userId }).select('_id').lean();
  const projectIds = userProjects.map(p => p._id);

  const filter = {
    $or: [
      { relatedProjectId: { $in: projectIds } },
      { relatedProjectId: { $exists: false } } // Global insights
    ]
  };

  if (priority) filter.priority = priority;
  if (type) filter.type = type;

  const insights = await Insight.find(filter)
    .sort({ priority: 1, confidenceScore: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .populate('relatedProjectId', 'name status')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      insights,
      count: insights.length
    }
  });
});

/**
 * @desc    Get monthly trends for charts
 * @route   GET /api/dashboard/trends
 * @access  Private
 */
const getMonthlyTrends = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { months = 6 } = req.query; // Default to last 6 months

  console.log(`[Dashboard] Fetching monthly trends for user: ${userId}, months: ${months}`);

  // Calculate date range
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - parseInt(months) + 1, 1);

  // Aggregation for monthly trends
  const trends = await Project.aggregate([
    {
      $match: {
        owner: userId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        projectCount: { $sum: 1 },
        avgCircularityScore: { $avg: '$circularityScore' },
        avgGWP: { $avg: '$gwp' },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' }
              ]
            }
          ]
        },
        projectCount: 1,
        avgCircularityScore: { $round: ['$avgCircularityScore', 2] },
        avgGWP: { $round: ['$avgGWP', 2] },
        completedCount: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      trends,
      period: {
        from: startDate.toISOString().slice(0, 7),
        to: now.toISOString().slice(0, 7),
        months: parseInt(months)
      }
    }
  });
});

/**
 * @desc    Get performance summary comparison
 * @route   GET /api/dashboard/performance
 * @access  Private
 */
const getPerformanceSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  console.log(`[Dashboard] Fetching performance summary for user: ${userId}`);

  // Calculate date boundaries
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Aggregation for current vs last month comparison
  const performance = await Project.aggregate([
    {
      $match: { owner: userId }
    },
    {
      $facet: {
        currentMonth: [
          {
            $match: { createdAt: { $gte: startOfCurrentMonth } }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              avgCircularity: { $avg: '$circularityScore' },
              avgGWP: { $avg: '$gwp' },
              completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
            }
          }
        ],
        lastMonth: [
          {
            $match: {
              createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              avgCircularity: { $avg: '$circularityScore' },
              avgGWP: { $avg: '$gwp' },
              completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
            }
          }
        ]
      }
    }
  ]);

  const currentMonth = performance[0]?.currentMonth[0] || {
    count: 0,
    avgCircularity: 0,
    avgGWP: 0,
    completed: 0
  };

  const lastMonth = performance[0]?.lastMonth[0] || {
    count: 0,
    avgCircularity: 0,
    avgGWP: 0,
    completed: 0
  };

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  };

  res.status(200).json({
    success: true,
    data: {
      currentMonth: {
        projects: currentMonth.count,
        avgCircularityScore: parseFloat((currentMonth.avgCircularity || 0).toFixed(2)),
        avgGWP: parseFloat((currentMonth.avgGWP || 0).toFixed(2)),
        completedProjects: currentMonth.completed
      },
      lastMonth: {
        projects: lastMonth.count,
        avgCircularityScore: parseFloat((lastMonth.avgCircularity || 0).toFixed(2)),
        avgGWP: parseFloat((lastMonth.avgGWP || 0).toFixed(2)),
        completedProjects: lastMonth.completed
      },
      changes: {
        projectsChange: calculateChange(currentMonth.count, lastMonth.count),
        circularityChange: calculateChange(
          currentMonth.avgCircularity || 0,
          lastMonth.avgCircularity || 0
        ),
        gwpChange: calculateChange(currentMonth.avgGWP || 0, lastMonth.avgGWP || 0),
        completedChange: calculateChange(currentMonth.completed, lastMonth.completed)
      }
    }
  });
});

module.exports = {
  getDashboard,
  getUserInsights,
  getMonthlyTrends,
  getPerformanceSummary
};
