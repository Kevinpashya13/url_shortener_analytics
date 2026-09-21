const express = require('express');
const router = express.Router();
const { createShortUrl } = require('../services/urlService');
const { shortenLimiter } = require('../middlewares/rateLimiter');
const { validateShortenRequest } = require('../middlewares/validateUrl');
const { authenticate } = require('../middlewares/auth');
const { checkUrlQuota, requireFeature } = require('../middlewares/planGuard');

// POST /shorten — requires login; enforces plan quota and feature gates
router.post(
  '/shorten',
  shortenLimiter,
  authenticate,          // login required
  checkUrlQuota,         // monthly URL limit check
  validateShortenRequest,
  async (req, res) => {
    const { originalUrl, customAlias, expiredAt, fallbackUrl } = req.body;
    const userId = req.user.userId;
    const limits = req.planLimits;

    // Feature gates — return 403 if feature not allowed for this plan
    if (customAlias && !limits.customAlias) {
      return res.status(403).json({
        error: 'Custom alias is not available on your current plan',
        requiredPlan: 'PRO',
      });
    }

    if (expiredAt && !limits.expiry) {
      return res.status(403).json({
        error: 'Link expiry is not available on your current plan',
        requiredPlan: 'PRO',
      });
    }

    if (fallbackUrl && !limits.fallback) {
      return res.status(403).json({
        error: 'Custom fallback URL is not available on your current plan',
        requiredPlan: 'PREMIUM',
      });
    }

    try {
      const result = await createShortUrl(
        originalUrl,
        customAlias || null,
        expiredAt ? new Date(expiredAt) : null,
        userId,
        fallbackUrl || null
      );

      res.status(201).json({
        shortUrl: `${req.protocol}://${req.get('host')}/${result.shortCode}`,
        shortCode: result.shortCode,
        originalUrl: result.originalUrl,
        expiredAt: result.expiredAt,
        fallbackUrl: result.fallbackUrl || null,
      });
    } catch (err) {
      if (err.message === 'ALIAS_TAKEN') {
        return res.status(409).json({ error: 'Custom alias already taken' });
      }
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;