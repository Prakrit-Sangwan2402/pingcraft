require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const schedulerService = require('./services/schedulerService');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development'
      });
    });

    if (process.env.RUN_WORKER !== 'false') {
      schedulerService.start();
    }

    const gracefulShutdown = async signal => {
      logger.info(`Received ${signal}, shutting down...`);

      server.close(async () => {
        if (schedulerService.isRunning) {
          await schedulerService.stop();
        }
        await disconnectDB();
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Shutdown timed out, exiting');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

bootstrap();
