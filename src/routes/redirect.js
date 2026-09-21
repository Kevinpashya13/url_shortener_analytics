const express = require('express');
const router = express.Router();
const { getOriginalUrl } = require('../services/urlService');
const { logClick } = require('../services/analyticsService');

router.get('/:code', async (req, res) => {
  const { code } = req.params;
  const start = Date.now();

  const url = await getOriginalUrl(code);

  const duration = Date.now() - start;
  console.log(`[${code}] Lookup took ${duration}ms`);

  if (!url) {
    return res.status(404).json({ error: 'Short URL not found or expired' });
  }

  // Premium custom fallback: redirect to fallbackUrl instead of 404
  if (url.isFallback) {
    return res.redirect(302, url.fallbackUrl);
  }

  res.redirect(302, url.originalUrl);
  logClick(url.id, req);
});

module.exports = router;