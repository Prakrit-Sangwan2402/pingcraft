require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const schedulerService = require('./services/schedulerService');
const logger = require('./utils/logger');

async function runStandaloneWorker() {
  try {
    await connectDB();
    schedulerService.start();

    const shutdown = async signal => {
      logger.info(`Worker received ${signal}, stopping...`);
      await schedulerService.stop();
      await disconnectDB();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('Worker startup failed', { error: err.message });
    process.exit(1);
  }
}

runStandaloneWorker();
