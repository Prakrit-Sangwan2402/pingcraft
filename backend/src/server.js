require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const schedulerService = require('./services/schedulerService');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Create HTTP server
    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`PingCraft API server listening on port ${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development'
      });
    });

    // 3. Start background monitoring scheduler (unless explicitly separated)
    if (process.env.RUN_WORKER !== 'false') {
      schedulerService.start();
    }

    // 4. Graceful shutdown handler
    const gracefulShutdown = async signal => {
      logger.info(`Received ${signal}. Initiating graceful shutdown...`);

      // Stop receiving new HTTP requests
      server.close(async () => {
        logger.info('HTTP server closed.');

        // Stop scheduler and wait for active probes
        if (schedulerService.isRunning) {
          await schedulerService.stop();
        }

        // Disconnect DB
        await disconnectDB();

        logger.info('Graceful shutdown complete. Exiting process.');
        process.exit(0);
      });

      // Force exit if drain takes too long
      setTimeout(() => {
        logger.error('Shutdown timed out after 10s. Forcing exit.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (err) {
    logger.error('Failed to bootstrap PingCraft server', { error: err.message });
    process.exit(1);
  }
}

bootstrap();
