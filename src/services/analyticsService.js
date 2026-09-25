const prisma = require('../config/prisma');
const { UAParser } = require('ua-parser-js');
const geoip = require('geoip-lite');
const { getLimits } = require('../config/planLimits');

async function logClick(urlId, req) {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const isLocalIp = !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.') || ip.startsWith('192.168.') || ip.startsWith('10.');

    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    const geo = isLocalIp ? { country: 'ID' } : geoip.lookup(ip);

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

function toDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getAnalyticsSummary(shortCode, options = {}, role = 'STANDARD') {
  const days = typeof options === 'number' ? options : options?.days;
  const startDate = typeof options === 'object' ? options?.startDate : null;
  const endDate = typeof options === 'object' ? options?.endDate : null;

  const url = await prisma.url.findUnique({
    where: { shortCode },
    include: { clickLogs: true },
  });

  if (!url) return null;

  let filteredLogs = url.clickLogs;

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filteredLogs = url.clickLogs.filter((log) => log.clickedAt >= start && log.clickedAt <= end);
  } else if (days && days !== 'all') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (parseInt(days) - 1));
    cutoff.setHours(0, 0, 0, 0);
    filteredLogs = url.clickLogs.filter((log) => log.clickedAt >= cutoff);
  }

  const limits = getLimits(role);
  const clicksByDay = groupClicksByDay(filteredLogs);

  const summary = {
    shortCode: url.shortCode,
    originalUrl: url.originalUrl,
    totalClicks: url.clickCount,
    filteredClicks: filteredLogs.length,
    createdAt: url.createdAt,
    expiredAt: url.expiredAt || null,
    fallbackUrl: url.fallbackUrl || null,
    clicksByDay,
  };

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
    const date = toDateKey(log.clickedAt);
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

async function getUserOverviewAnalytics(userId, role = 'STANDARD', options = {}) {
  const { days = '7', startDate = null, endDate = null } = options;

  const userUrls = await prisma.url.findMany({
    where: { userId },
    select: { id: true, shortCode: true, clickCount: true, createdAt: true },
  });

  const totalUrls = userUrls.length;
  const totalClicks = userUrls.reduce((sum, u) => sum + (u.clickCount || 0), 0);
  const urlIds = userUrls.map((u) => u.id);

  if (urlIds.length === 0) {
    return {
      totalUrls: 0,
      totalClicks: 0,
      clicksTrend: [],
      deviceBreakdown: [],
      browserBreakdown: [],
      countryBreakdown: [],
    };
  }

  let dateFilter = {};
  let startD = null;
  let endD = null;

  if (startDate && endDate) {
    startD = new Date(startDate);
    startD.setHours(0, 0, 0, 0);
    endD = new Date(endDate);
    endD.setHours(23, 59, 59, 999);
    dateFilter = { gte: startD, lte: endD };
  } else if (days !== 'all' && days !== null) {
    const numDays = parseInt(days) || 7;
    endD = new Date();
    endD.setHours(23, 59, 59, 999);
    startD = new Date();
    startD.setDate(startD.getDate() - (numDays - 1));
    startD.setHours(0, 0, 0, 0);
    dateFilter = { gte: startD, lte: endD };
  }

  const logs = await prisma.clickLog.findMany({
    where: {
      urlId: { in: urlIds },
      ...(Object.keys(dateFilter).length > 0 ? { clickedAt: dateFilter } : {}),
    },
    orderBy: { clickedAt: 'asc' },
  });

  const points = [];
  if (startD && endD) {
    const curr = new Date(startD);
    while (curr <= endD) {
      const dateStr = toDateKey(curr);
      const monthName = curr.toLocaleString('en-US', { month: 'short' });
      const dayNum = curr.getDate();
      const label = `${monthName} ${dayNum}`;

      const count = logs.filter((l) => toDateKey(l.clickedAt) === dateStr).length;
      points.push({ date: label, count });

      curr.setDate(curr.getDate() + 1);
    }
  } else {
    const dailyMap = {};
    logs.forEach((l) => {
      const dateStr = toDateKey(l.clickedAt);
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
    });

    if (Object.keys(dailyMap).length === 0) {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const monthName = d.toLocaleString('en-US', { month: 'short' });
        points.push({ date: `${monthName} ${d.getDate()}`, count: 0 });
      }
    } else {
      Object.entries(dailyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([dStr, count]) => {
          const d = new Date(dStr);
          const monthName = d.toLocaleString('en-US', { month: 'short' });
          points.push({ date: `${monthName} ${d.getDate()}`, count });
        });
    }
  }

  const limits = getLimits(role);

  const overview = {
    totalUrls,
    totalClicks,
    filteredClicks: logs.length,
    clicksTrend: points,
    deviceBreakdown: [],
    browserBreakdown: [],
    countryBreakdown: [],
  };

  if (limits.fullAnalytics) {
    overview.deviceBreakdown = groupByField(logs, 'deviceType');
    overview.browserBreakdown = groupByField(logs, 'browser');
    overview.countryBreakdown = groupByField(logs, 'country');
  }

  return overview;
}


module.exports = { logClick, getAnalyticsSummary, getUserOverviewAnalytics };