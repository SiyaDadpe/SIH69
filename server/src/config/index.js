/**
 * Configuration Module
 * 
 * Centralized configuration management for the application.
 * Loads, validates, and exports environment variables with proper type coercion.
 * Includes database connection utilities.
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from .env file in non-production environments
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

/**
 * List of required environment variables
 */
const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'BCRYPT_SALT_ROUNDS',
  'PORT'
];

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variable is missing
 */
function validateEnvVars() {
  const missingVars = REQUIRED_ENV_VARS.filter(varName => {
    const value = process.env[varName];
    return value === undefined || value === null || value === '';
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env file against .env.example'
    );
  }
}

/**
 * Validates and runs the configuration setup
 */
validateEnvVars();

/**
 * Application Configuration Object
 * 
 * All configuration values are typed and validated.
 */
const config = {
  // Server Configuration
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  mongoUri: process.env.MONGO_URI,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  redisUrl: process.env.REDIS_URL || null,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  apiVersion: process.env.API_VERSION || 'v1',
  logLevel: process.env.LOG_LEVEL || 'info'
};

/**
 * Validate parsed numeric values
 */
if (isNaN(config.port)) {
  throw new Error('PORT must be a valid number');
}

if (isNaN(config.bcryptSaltRounds) || config.bcryptSaltRounds < 1) {
  throw new Error('BCRYPT_SALT_ROUNDS must be a valid number greater than 0');
}

if (config.nodeEnv !== 'production') {
  console.log('Configuration loaded successfully:');
  console.log({
    port: config.port,
    nodeEnv: config.nodeEnv,
    mongoUri: config.mongoUri ? '***configured***' : 'missing',
    jwtSecret: config.jwt.secret ? '***configured***' : 'missing',
    jwtExpiresIn: config.jwt.expiresIn,
    bcryptSaltRounds: config.bcryptSaltRounds,
    redisUrl: config.redisUrl ? '***configured***' : 'not set',
    corsOrigin: config.corsOrigin
  });
}

Object.freeze(config);
Object.freeze(config.jwt);

/**
 * Connect to MongoDB
 * @returns {Promise<void>}
 */
async function connectDB() {
  try {
    const options = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(config.mongoUri, options);
    
    console.log('[INFO] MongoDB connected successfully');
    console.log(`[INFO] Database: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error('[ERROR] MongoDB connection failed:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log('[INFO] MongoDB disconnected');
  } catch (error) {
    console.error('[ERROR] MongoDB disconnection failed:', error.message);
    throw error;
  }
}

module.exports = {
  ...config,
  connectDB,
  disconnectDB
};
