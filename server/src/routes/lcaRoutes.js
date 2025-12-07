/**
 * LCA Routes
 * 
 * API endpoints for Life Cycle Assessment calculations and report generation
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

const {
  calculateLCA,
  getUserLCAReports,
  getLCAReportById,
  getCalculatelcaById,
  getUserLCAStats,
  deleteLCAReport
} = require('../controllers/lcaController');

// ============================================================================
// LCA CALCULATION ROUTES
// ============================================================================

/**
 * @route   POST /api/lca/calculate
 * @desc    Calculate LCA Score and Generate Report
 * @access  Private (authenticated users only)
 * 
 * @body    {
 *            workflowId: string (optional),
 *            projectName: string (required),
 *            location: string (optional),
 *            wizardData: object (required) - stage-wise form data
 *          }
 * 
 * @returns {
 *            success: boolean,
 *            message: string,
 *            data: {
 *              reportId: string,
 *              pdfUrl: string,
 *              pdfFilename: string,
 *              summary: object
 *            }
 *          }
 */
router.post('/calculate', authenticate, calculateLCA);

// ============================================================================
// LCA REPORTS ROUTES
// ============================================================================

/**
 * @route   GET /api/lca/reports
 * @desc    Get all LCA reports for current user
 * @access  Private
 * 
 * @query   {
 *            limit: number (default: 20),
 *            page: number (default: 1),
 *            status: string (optional) - 'pending', 'completed', 'failed'
 *          }
 * 
 * @returns {
 *            success: boolean,
 *            data: {
 *              reports: array,
 *              pagination: object
 *            }
 *          }
 */
router.get('/reports', authenticate, getUserLCAReports);

/**
 * @route   GET /api/lca/reports/:id
 * @desc    Get specific LCA report by ID
 * @access  Private (user must own the report)
 * 
 * @param   id - LCA report ID
 * 
 * @returns {
 *            success: boolean,
 *            data: { report: object }
 *          }
 */
router.get('/reports/:id', authenticate, getLCAReportById);

/**
 * @route   GET /api/lca/calculatelca/:id
 * @desc    Get calculatelca report by ID (enriched format for analytics)
 * @access  Private
 * 
 * @param   id - CalculateLCA document ID
 * 
 * @returns {
 *            success: boolean,
 *            data: object (enriched report with lcaStages)
 *          }
 */
router.get('/calculatelca/:id', authenticate, getCalculatelcaById);

/**
 * @route   DELETE /api/lca/reports/:id
 * @desc    Delete LCA report
 * @access  Private (user must own the report)
 * 
 * @param   id - LCA report ID
 * 
 * @returns {
 *            success: boolean,
 *            message: string
 *          }
 */
router.delete('/reports/:id', authenticate, deleteLCAReport);

// ============================================================================
// LCA STATISTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/lca/stats
 * @desc    Get LCA statistics for current user
 * @access  Private
 * 
 * @returns {
 *            success: boolean,
 *            data: {
 *              stats: {
 *                totalReports: number,
 *                averageCircularityScore: number,
 *                averageCO2Emissions: number,
 *                totalEnergyConsumed: number
 *              }
 *            }
 *          }
 */
router.get('/stats', authenticate, getUserLCAStats);

module.exports = router;
