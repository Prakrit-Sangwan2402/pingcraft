const express = require('express');
const {
  createMonitor,
  getMonitors,
  getMonitorById,
  updateMonitor,
  togglePauseMonitor,
  deleteMonitor,
  instantProbe,
  getMonitorPingLogs
} = require('../controllers/monitorController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Instant probe can be run with auth
router.post('/instant-probe', protect, instantProbe);

router.route('/')
  .post(protect, createMonitor)
  .get(protect, getMonitors);

router.route('/:id')
  .get(protect, getMonitorById)
  .put(protect, updateMonitor)
  .delete(protect, deleteMonitor);

router.patch('/:id/pause', protect, togglePauseMonitor);
router.get('/:id/logs', protect, getMonitorPingLogs);

module.exports = router;
