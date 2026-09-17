const prisma = require('../config/prisma');
const { UAParser } = require('ua-parser-js');
const geoip = require('geoip-lite');

async function logClick(urlId, req) {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    const geo = geoip.lookup(ip);

    await prisma.clickLog.create({
      data: {
        urlId,
        ipAddress: ip,
        userAgent,
        referrer,
        deviceType: uaResult.device.type || 'desktop',
        browser: uaResult.browser.name || 'unknown',
        country: geo?.country || 'unknown',
      },
    });

    // Update counter cepat di tabel urls
    await prisma.url.update({
      where: { id: urlId },
      data: { clickCount: { increment: 1 } },
    });
  } catch (err) {
    // Sengaja gak throw error ke atas, cukup log aja
    console.error('Failed to log click:', err);
  }
}

module.exports = { logClick };