const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../services/analyticsService');
const { authenticate } = require('../middlewares/auth');

// GET /analytics/:code — requires login; returns role-filtered analytics
router.get('/analytics/:code', authenticate, async (req, res) => {
  const { code } = req.params;
  const { days } = req.query;
  const role = req.user.role || 'STANDARD';

  try {
    const summary = await getAnalyticsSummary(code, days ? parseInt(days) : null, role);

    if (!summary) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    res.status(200).json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;