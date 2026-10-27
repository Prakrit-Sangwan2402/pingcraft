const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../utils/logger');

let memoryServer = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';

  if (uri) {
    if (uri.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        // Fall back to system resolver if custom servers cannot be set
      }
    }

    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        autoIndex: true
      });
      logger.info('MongoDB connected', { host: mongoose.connection.host, port: mongoose.connection.port });
      return;
    } catch (err) {
      logger.error('Failed to connect to MONGODB_URI', { error: err.message });
      if (isProduction) {
        throw new Error(`Production database connection failed: ${err.message}`);
      }
      logger.warn('Falling back to local in-memory Mongo instance...');
    }
  } else if (isProduction) {
    throw new Error('MONGODB_URI is required in production');
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri, { autoIndex: true });
    logger.info('Connected to in-memory MongoDB instance', { uri: memUri });
  } catch (memErr) {
    logger.error('Failed to initialize in-memory database', { error: memErr.message });
    throw memErr;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (err) {
    logger.error('Error during database disconnect', { error: err.message });
  }
}

module.exports = { connectDB, disconnectDB };
