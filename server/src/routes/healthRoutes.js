/**
 * Health Check Routes
 * 
 * Provides system health status including MongoDB connectivity.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const config = require('../config');

/**
 * @route   GET /api/health
 * @desc    System health check with MongoDB status
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      mongo: 'disconnected'
    };

    // Check MongoDB connection
    try {
      const mongoState = mongoose.connection.readyState;
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (mongoState === 1) {
        healthCheck.mongo = 'connected';
      } else if (mongoState === 2) {
        healthCheck.mongo = 'connecting';
      } else if (mongoState === 3) {
        healthCheck.mongo = 'disconnecting';
      } else {
        healthCheck.mongo = 'disconnected';
        healthCheck.status = 'degraded';
      }
    } catch (mongoError) {
      console.error('[Health] MongoDB error:', mongoError.message);
      healthCheck.mongo = 'error';
      healthCheck.status = 'degraded';
    }

    // Set response status based on overall health
    const statusCode = healthCheck.status === 'ok' ? 200 : 503;

    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('[Health] Health check error:', error.message);

    // Return a fallback response even if health check fails
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      mongo: 'unknown',
      error: 'Health check failed'
    });
  }
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with additional system metrics
 * @access  Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      node: {
        version: process.version,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      mongo: {
        status: 'disconnected',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      }
    };

    // Check MongoDB connection
    try {
      const mongoState = mongoose.connection.readyState;
      if (mongoState === 1) {
        healthCheck.mongo.status = 'connected';
      } else if (mongoState === 2) {
        healthCheck.mongo.status = 'connecting';
      } else if (mongoState === 3) {
        healthCheck.mongo.status = 'disconnecting';
      } else {
        healthCheck.mongo.status = 'disconnected';
        healthCheck.status = 'degraded';
      }
    } catch (mongoError) {
      console.error('[Health] MongoDB error:', mongoError.message);
      healthCheck.mongo.status = 'error';
      healthCheck.mongo.error = mongoError.message;
      healthCheck.status = 'degraded';
    }

    // Set response status based on overall health
    const statusCode = healthCheck.status === 'ok' ? 200 : 503;

    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('[Health] Detailed health check error:', error.message);

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

module.exports = router;
