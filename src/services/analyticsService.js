const prisma = require('../config/prisma');
const { UAParser } = require('ua-parser-js');
const geoip = require('geoip-lite');
const { getLimits } = require('../config/planLimits');

async function logClick(urlId, req) {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    const geo = geoip.lookup(ip);

    // Check owner's monthly click tracking quota before logging
    const url = await prisma.url.findUnique({
      where: { id: urlId },
      select: { userId: true, user: { select: { role: true } } },
    });

    if (url?.userId && url?.user?.role) {
      const limits = getLimits(url.user.role);

      if (limits.clicksPerMonth !== Infinity) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Count clicks across ALL of this user's URLs this month
        const monthlyClicks = await prisma.clickLog.count({
          where: {
            url: { userId: url.userId },
            clickedAt: { gte: startOfMonth },
          },
        });

        if (monthlyClicks >= limits.clicksPerMonth) {
          // Quota exceeded — don't log the click but still increment clickCount
          await prisma.url.update({
            where: { id: urlId },
            data: { clickCount: { increment: 1 } },
          });
          return;
        }
      }
    }

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

    await prisma.url.update({
      where: { id: urlId },
      data: { clickCount: { increment: 1 } },
    });
  } catch (err) {
    console.error('Failed to log click:', err);
  }
}

async function getAnalyticsSummary(shortCode, days = null, role = 'STANDARD') {
  const url = await prisma.url.findUnique({
    where: { shortCode },
    include: { clickLogs: true },
  });

  if (!url) return null;

  let filteredLogs = url.clickLogs;
  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    filteredLogs = url.clickLogs.filter((log) => log.clickedAt >= cutoff);
  }

  const limits = getLimits(role);

  const clicksByDay = groupClicksByDay(filteredLogs);

  // Base analytics available to all roles
  const summary = {
    shortCode: url.shortCode,
    originalUrl: url.originalUrl,
    totalClicks: url.clickCount,
    createdAt: url.createdAt,
    expiredAt: url.expiredAt || null,
    fallbackUrl: url.fallbackUrl || null,
    clicksByDay,
  };

  // Full analytics only for PRO, PREMIUM, ADMIN
  if (limits.fullAnalytics) {
    summary.deviceBreakdown = groupByField(filteredLogs, 'deviceType');
    summary.browserBreakdown = groupByField(filteredLogs, 'browser');
    summary.countryBreakdown = groupByField(filteredLogs, 'country');
    summary.topReferrers = groupByField(filteredLogs, 'referrer', 'direct');
  }

  return summary;
}

function groupClicksByDay(clickLogs) {
  const counts = {};

  for (const log of clickLogs) {
    const date = log.clickedAt.toISOString().split('T')[0];
    counts[date] = (counts[date] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function groupByField(clickLogs, field, fallbackValue = 'unknown') {
  const counts = {};

  for (const log of clickLogs) {
    const key = log[field] || fallbackValue;
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([key, count]) => ({ [field === 'referrer' ? 'referrer' : field]: key, count }))
    .sort((a, b) => b.count - a.count);
}

module.exports = { logClick, getAnalyticsSummary };