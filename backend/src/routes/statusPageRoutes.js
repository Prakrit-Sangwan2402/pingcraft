const express = require('express');
const {
  getPublicStatusPage,
  getMyStatusPage,
  updateMyStatusPage
} = require('../controllers/statusPageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public status page (Unauthenticated)
router.get('/public/:slug', getPublicStatusPage);

// Authenticated status page management
router.get('/me', protect, getMyStatusPage);
router.put('/me', protect, updateMyStatusPage);

module.exports = router;
