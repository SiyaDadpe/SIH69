/**
 * Application Entry Point
 * 
 * This file initializes the Express server, connects to MongoDB,
 * and starts the HTTP server with graceful shutdown handling.
 */

const config = require('./config');
const { connectDB } = require('./config');

/**
 * Start the application server
 */
async function startServer() {
  try {
    // Import app after config validation
    const app = require('./app');
    
    // Connect to MongoDB with retry logic
    await connectDB();

    
    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  Server Status: RUNNING                                   ║
║  Environment: ${config.nodeEnv.toUpperCase().padEnd(44)}║
║  Port: ${config.port.toString().padEnd(51)}║
║  Database: CONNECTED                                      ║
║  API Docs: http://localhost:${config.port}/api-docs${' '.repeat(25)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handler
    // Note: MongoDB shutdown is handled in dbConnect.js
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('HTTP server closed.');
        // MongoDB will be closed by the handler in dbConnect.js
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
