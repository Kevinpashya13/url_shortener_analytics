const express = require('express');
const router = express.Router();
const { createShortUrl } = require('../services/urlService');
const { shortenLimiter } = require('../middlewares/rateLimiter');
const { validateShortenRequest } = require('../middlewares/validateUrl');
const { optionalAuthenticate } = require('../middlewares/auth');

router.post('/shorten', shortenLimiter, optionalAuthenticate, validateShortenRequest, async (req, res) => {
  const { originalUrl, customAlias, expiredAt } = req.body;
  const userId = req.user ? req.user.userId : null;

  try {
    const result = await createShortUrl(originalUrl, customAlias, expiredAt ? new Date(expiredAt) : null, userId);

    res.status(201).json({
      shortUrl: `${req.protocol}://${req.get('host')}/${result.shortCode}`,
      shortCode: result.shortCode,
      originalUrl: result.originalUrl,
      expiredAt: result.expiredAt,
    });
  } catch (err) {
    if (err.message === 'ALIAS_TAKEN') {
      return res.status(409).json({ error: 'Custom alias already taken' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;