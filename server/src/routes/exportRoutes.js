const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
// const { authenticate } = require('../middleware/authMiddleware');

/**
 * Export Routes
 * TODO: Add authentication when auth system is ready
 */

// Export report as PDF
router.post('/reports/:id/pdf', exportController.exportToPDF);

// Export report as JSON
router.get('/reports/:id/json', exportController.exportToJSON);

module.exports = router;
