const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      connected: isHealthy
    },
    system: {
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      nodeVersion: process.version
    }
  });
});

module.exports = router;
