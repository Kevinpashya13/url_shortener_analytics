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

async function getAnalyticsSummary(shortCode, days = null) {
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

  const clicksByDay = groupClicksByDay(filteredLogs);
  const deviceBreakdown = groupByField(filteredLogs, 'deviceType');
  const browserBreakdown = groupByField(filteredLogs, 'browser');
  const countryBreakdown = groupByField(filteredLogs, 'country');
  const topReferrers = groupByField(filteredLogs, 'referrer', 'direct');

  return {
    shortCode: url.shortCode,
    originalUrl: url.originalUrl,
    totalClicks: url.clickCount,
    createdAt: url.createdAt,
    clicksByDay,
    deviceBreakdown,
    browserBreakdown,
    countryBreakdown,
    topReferrers,
  };
}

function groupClicksByDay(clickLogs) {
  const counts = {};

  for (const log of clickLogs) {
    const date = log.clickedAt.toISOString().split('T')[0]; // "2026-09-16"
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