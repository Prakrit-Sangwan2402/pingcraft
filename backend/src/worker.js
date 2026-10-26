require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const schedulerService = require('./services/schedulerService');
const logger = require('./utils/logger');

async function runStandaloneWorker() {
  try {
    logger.info('Initializing PingCraft Standalone Background Worker...');
    await connectDB();

    schedulerService.start();

    const shutdown = async signal => {
      logger.info(`Worker received ${signal}. Stopping...`);
      await schedulerService.stop();
      await disconnectDB();
      logger.info('Worker cleanly stopped.');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('Worker failed to start', { error: err.message });
    process.exit(1);
  }
}

runStandaloneWorker();
