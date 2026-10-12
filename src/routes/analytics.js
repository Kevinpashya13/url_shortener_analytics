const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../services/analyticsService');
const { authenticate } = require('../middlewares/auth');

// GET /analytics/:code — requires login; returns role-filtered analytics
router.get('/analytics/:code', authenticate, async (req, res) => {
  const { code } = req.params;
  const { days, startDate, endDate } = req.query;
  const role = req.user.role || 'STANDARD';
  const userId = req.user.userId;

  try {
    const summary = await getAnalyticsSummary(code, { days, startDate, endDate }, role, userId);

    if (!summary) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    if (summary.forbidden) {
      return res.status(403).json({ error: 'You are not authorized to view analytics for this URL' });
    }

    res.status(200).json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;