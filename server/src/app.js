/**
 * Express Application Configuration
 * 
 * This file sets up the Express app with middleware, routes, and error handlers.
 * The app is exported for use in index.js and for testing.
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const config = require('./config');
const { 
  sanitizeMongoInput, 
  detectSuspiciousInput,
  contentSecurityPolicy,
  strictContentSecurityPolicy
} = require('./middleware/inputSanitizer');
const { apiLimiter } = require('./middleware/rateLimiter');

// Initialize Express app
const app = express();

// ============================================================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ============================================================================

// Disable X-Powered-By header to hide Express fingerprint
app.disable('x-powered-by');

// Helmet helps secure Express apps by setting various HTTP headers
// Enhanced configuration for production security
const helmetOptions = {
  contentSecurityPolicy: config.nodeEnv === 'production' 
    ? strictContentSecurityPolicy 
    : contentSecurityPolicy,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
};

app.use(helmet(helmetOptions));

// Compression middleware to compress response bodies
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// CORS configuration - allows cross-origin requests
// Restrict to allowed origins from config
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.corsOrigin.split(',').map(o => o.trim());
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn('[CORS] Request blocked:', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// ============================================================================
// REQUEST PARSING MIDDLEWARE
// ============================================================================

// Parse JSON request bodies
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ============================================================================
// INPUT SANITIZATION & SECURITY MIDDLEWARE
// ============================================================================

app.use(sanitizeMongoInput);
app.use(detectSuspiciousInput);
app.use('/api/', apiLimiter);

// ============================================================================
// REQUEST LOGGING
// ============================================================================

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Log application startup
console.log('[INFO] Express application initialized', {
  environment: config.nodeEnv,
  corsOrigin: config.corsOrigin
});

// ============================================================================
// HEALTH CHECK ROUTE
// ============================================================================

// Health check endpoint with MongoDB status
const healthRoutes = require('./routes/healthRoutes');
app.use('/api/health', healthRoutes);

// ============================================================================
// API ROUTES
// ============================================================================

const projectRoutes = require('./routes/projectRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const insightRoutes = require('./routes/insightRoutes');
const benchmarkRoutes = require('./routes/benchmarkRoutes');
const systemStatusRoutes = require('./routes/systemStatusRoutes');
const canvasRoutes = require('./routes/canvasRoutes');
const reportRoutes = require('./routes/reportRoutes');
const wizardRoutes = require('./routes/wizardRoutes');
const exportRoutes = require('./routes/exportRoutes');

app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/benchmarks', benchmarkRoutes);
app.use('/api/system-status', systemStatusRoutes);
app.use('/api/canvas', canvasRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/wizard', wizardRoutes);
app.use('/api/export', exportRoutes);

// Serve uploaded files (mounted at root level for /uploads/:filename route)
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Additional routes will be mounted here as they are created
// app.use('/api/users', userRoutes);

// ============================================================================
// API DOCUMENTATION (Swagger)
// ============================================================================

/**
 * Swagger API Documentation
 * 
 * Uncomment the following section when you're ready to set up API docs:
 * 
 * const swaggerJsdoc = require('swagger-jsdoc');
 * const swaggerUi = require('swagger-ui-express');
 * 
 * const swaggerOptions = {
 *   definition: {
 *     openapi: '3.0.0',
 *     info: {
 *       title: 'SIH69 API Documentation',
 *       version: '1.0.0',
 *       description: 'API documentation for SIH69 project',
 *     },
 *     servers: [
 *       {
 *         url: `http://localhost:${process.env.PORT || 5000}`,
 *         description: 'Development server',
 *       },
 *     ],
 *   },
 *   apis: ['./src/routes/*.js', './src/controllers/*.js'],
 * };
 * 
 * const swaggerSpec = swaggerJsdoc(swaggerOptions);
 * app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 Handler - Catch unhandled routes
app.use((req, res, next) => {
  console.warn('[404] Route not found:', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Log error with appropriate level
  if (statusCode >= 500) {
    console.error('[ERROR] Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      statusCode
    });
  } else {
    console.warn('[WARN] Client Error:', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      statusCode
    });
  }

  // Build error response
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(config.nodeEnv !== 'production' && {
      stack: err.stack,
      error: err
    })
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
});

// ============================================================================
// EXPORT APP
// ============================================================================

// Export the app for use in index.js and for testing
module.exports = app;
