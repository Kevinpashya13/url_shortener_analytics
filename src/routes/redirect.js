const express = require('express');
const router = express.Router();
const { getOriginalUrl } = require('../services/urlService');

router.get('/:code', async (req, res) => {
  const { code } = req.params;

  const url = await getOriginalUrl(code);

  if (!url) {
    return res.status(404).json({ error: 'Short URL not found or expired' });
  }

  res.redirect(302, url.originalUrl);
});

module.exports = router;