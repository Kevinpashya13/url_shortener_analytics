const RESERVED_ALIASES = new Set([
  'api', 'auth', 'login', 'register', 'dashboard', 'analytics',
  'pricing', 'features', 'health', 'urls', 'account', 'my-urls',
  'admin', 'user', 'users', 'shorten', 'logout', 'terms', 'privacy',
  'docs', 'settings', 'profile', 'static', 'assets', 'favicon.ico', 'robots.txt'
]);

function isReservedAlias(alias) {
  if (!alias || typeof alias !== 'string') return false;
  return RESERVED_ALIASES.has(alias.trim().toLowerCase());
}

function isValidHttpUrl(string) {
  try {
    const parsed = new URL(string);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateShortenRequest(req, res, next) {
  const { originalUrl, customAlias, fallbackUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'originalUrl is required' });
  }

  if (!isValidHttpUrl(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL format. Only http:// and https:// URLs are allowed.' });
  }

  if (fallbackUrl && !isValidHttpUrl(fallbackUrl)) {
    return res.status(400).json({ error: 'Invalid fallback URL format. Only http:// and https:// URLs are allowed.' });
  }

  if (customAlias) {
    const aliasClean = customAlias.trim();
    if (!/^[a-zA-Z0-9-_]{3,30}$/.test(aliasClean)) {
      return res.status(400).json({
        error: 'Invalid custom alias format. Must be between 3 and 30 characters (letters, numbers, hyphens, underscores).',
      });
    }

    if (isReservedAlias(aliasClean)) {
      return res.status(400).json({
        error: `Alias "${aliasClean}" is reserved by the system. Please choose another alias.`,
      });
    }
  }

  next();
}

module.exports = { validateShortenRequest, isReservedAlias, isValidHttpUrl };