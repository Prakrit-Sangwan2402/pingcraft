const express = require('express');
const {
  getIncidents,
  getIncidentById,
  updateIncidentStatus
} = require('../controllers/incidentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.patch('/:id/status', updateIncidentStatus);

module.exports = router;
