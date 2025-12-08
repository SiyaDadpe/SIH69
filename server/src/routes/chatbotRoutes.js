/**
 * Chatbot Routes
 * Routes for Gemini AI chatbot
 */

const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { body } = require('express-validator');
const validate = require('../middleware/validator');

/**
 * POST /chat
 * Send a message to the chatbot
 * Public endpoint - no authentication required for better user experience
 */
router.post(
  '/chat',
  [
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 5000 })
      .withMessage('Message too long (max 5000 characters)')
  ],
  validate,
  chatbotController.chat
);

module.exports = router;
