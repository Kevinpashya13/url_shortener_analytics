function validateShortenRequest(req, res, next) {
  const { originalUrl, customAlias } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'originalUrl is required' });
  }

  try {
    new URL(originalUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  if (customAlias && !/^[a-zA-Z0-9_-]{3,20}$/.test(customAlias)) {
    return res.status(400).json({ error: 'Invalid custom alias format' });
  }

  next();
}

module.exports = { validateShortenRequest };