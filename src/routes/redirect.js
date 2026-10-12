const express = require('express');
const router = express.Router();
const { getOriginalUrl } = require('../services/urlService');
const { logClick } = require('../services/analyticsService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderNotFoundHtml(code) {
  const safeCode = escapeHtml(code);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Not Found | KPShortLink</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0b0f19;
      color: #f3f4f6;
      padding: 24px;
    }
    .card {
      max-width: 460px;
      width: 100%;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 40px 28px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .icon-badge {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.25);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin-bottom: 20px;
    }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
    p { font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
    .code-pill {
      display: inline-block;
      padding: 4px 12px;
      background: #1f2937;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #e5e7eb;
      font-size: 13px;
      margin-bottom: 24px;
      word-break: break-all;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 12px 20px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      border-radius: 10px;
      transition: background 0.15s ease;
    }
    .btn:hover { background: #1d4ed8; }
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
      font-size: 13px;
      color: #6b7280;
    }
    .brand-logo {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: #2563eb;
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-badge">🔗</div>
    <h1>Link Not Found or Expired</h1>
    <div class="code-pill">/${safeCode}</div>
    <p>The short link you followed does not exist, has expired, or was removed by its owner.</p>
    <a href="${FRONTEND_URL}" class="btn">Create Your Own Short Link</a>
    <div class="brand">
      <span class="brand-logo">KP</span>
      <span>KPShortLink</span>
    </div>
  </div>
</body>
</html>`;
}

router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const start = Date.now();

    const url = await getOriginalUrl(code);

    const duration = Date.now() - start;
    console.log(`[${code}] Lookup took ${duration}ms`);

    if (!url) {
      if (req.accepts('html')) {
        return res.status(404).send(renderNotFoundHtml(code));
      }
      return res.status(404).json({ error: 'Short URL not found or expired' });
    }

    // Premium custom fallback: redirect to fallbackUrl instead of 404
    if (url.isFallback) {
      return res.redirect(302, url.fallbackUrl);
    }

    res.redirect(302, url.originalUrl);
    logClick(url.id, req);
  } catch (err) {
    console.error(`[${req.params.code}] Redirect failed:`, err);
    if (req.accepts('html')) {
      return res.status(500).send('<h3>Internal Server Error</h3>');
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;