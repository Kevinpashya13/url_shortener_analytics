const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../services/analyticsService');

router.get('/analytics/:code', async (req, res) => {
  const { code } = req.params;
  const { days } = req.query;

  try {
    const summary = await getAnalyticsSummary(code, days ? parseInt(days) : null);

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