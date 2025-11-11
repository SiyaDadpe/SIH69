/**
 * Ownership Verification Middleware
 * 
 * Provides middleware to verify that a user owns/created a resource
 * before allowing update or delete operations.
 * 
 * @module middleware/ownershipMiddleware
 */

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { Project, WizardWorkflow, WizardWorkflowOutput, Report } = require('../models');

/**
 * Verify Project Ownership
 * 
 * Checks if the authenticated user owns the project specified in req.params.id
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const verifyProjectOwnership = asyncHandler(async (req, res, next) => {
  const projectId = req.params.id;

  // Validate project ID format
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project ID format'
    });
  }

  // Find the project
  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check ownership (support both userId and owner fields)
  const projectUserId = project.userId || project.owner;
  if (!projectUserId || projectUserId.toString() !== req.user._id.toString()) {
    console.warn('[WARN]', 'Unauthorized project access attempt', {
      projectId,
      requestedBy: req.user._id,
      projectOwner: projectUserId
    });

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to modify this project.'
    });
  }

  // Attach project to request for use in the controller
  req.project = project;
  next();
});

/**
 * Verify Wizard Workflow Ownership
 * 
 * Checks if the authenticated user owns the wizard workflow specified in req.params.id
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const verifyWizardOwnership = asyncHandler(async (req, res, next) => {
  const workflowId = req.params.id;

  // Validate workflow ID format
  if (!mongoose.Types.ObjectId.isValid(workflowId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid workflow ID format'
    });
  }

  // Find the workflow
  const workflow = await WizardWorkflow.findById(workflowId);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: 'Workflow not found'
    });
  }

  // Check ownership
  if (!workflow.userId || workflow.userId.toString() !== req.user._id.toString()) {
    console.warn('[WARN]', 'Unauthorized workflow access attempt', {
      workflowId,
      requestedBy: req.user._id,
      workflowOwner: workflow.userId
    });

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to modify this workflow.'
    });
  }

  // Attach workflow to request for use in the controller
  req.workflow = workflow;
  next();
});

/**
 * Verify Report Ownership
 * 
 * Checks if the authenticated user owns the report specified in req.params.id
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const verifyReportOwnership = asyncHandler(async (req, res, next) => {
  const reportId = req.params.id;

  // Validate report ID format
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  // Find the report
  const report = await Report.findById(reportId);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  // Check ownership (support both userId and author.userId fields)
  const reportUserId = report.userId || report.author?.userId;
  if (!reportUserId || reportUserId.toString() !== req.user._id.toString()) {
    console.warn('[WARN]', 'Unauthorized report access attempt', {
      reportId,
      requestedBy: req.user._id,
      reportOwner: reportUserId
    });

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to modify this report.'
    });
  }

  // Attach report to request for use in the controller
  req.report = report;
  next();
});

module.exports = {
  verifyProjectOwnership,
  verifyWizardOwnership,
  verifyReportOwnership
};
