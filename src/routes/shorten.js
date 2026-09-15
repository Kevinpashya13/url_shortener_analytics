const express = require('express');
const router = express.Router();
const { createShortUrl } = require('../services/urlService');
const { validateShortenRequest } = require('../middlewares/validateUrl');

router.post('/shorten', validateShortenRequest, async (req, res) => {
  const { originalUrl, customAlias, expiredAt } = req.body;

  try {
    const result = await createShortUrl(originalUrl, customAlias, expiredAt ? new Date(expiredAt) : null);

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