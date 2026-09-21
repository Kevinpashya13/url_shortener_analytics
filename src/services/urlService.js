const prisma = require('../config/prisma');
const { encodeBase62 } = require('../utility/base62');
const { getCachedUrl, setCachedUrl, deleteCachedUrl } = require('./cacheService');

async function createShortUrl(
  originalUrl,
  customAlias = null,
  expiredAt = null,
  userId = null,
  fallbackUrl = null
) {
  if (customAlias) {
    const existing = await prisma.url.findUnique({ where: { shortCode: customAlias } });
    if (existing) {
      throw new Error('ALIAS_TAKEN');
    }
    return prisma.url.create({
      data: { originalUrl, shortCode: customAlias, customAlias: true, expiredAt, userId, fallbackUrl },
    });
  }

  const newUrl = await prisma.url.create({
    data: { originalUrl, shortCode: '', expiredAt, userId, fallbackUrl },
  });

  const shortCode = encodeBase62(newUrl.id);

  return prisma.url.update({
    where: { id: newUrl.id },
    data: { shortCode },
  });
}

async function getOriginalUrl(shortCode) {
  const cached = await getCachedUrl(shortCode);
  if (cached) {
    if (cached.expiredAt && new Date() > new Date(cached.expiredAt)) {
      // Return fallback if available, null otherwise
      return cached.fallbackUrl
        ? { isFallback: true, fallbackUrl: cached.fallbackUrl }
        : null;
    }
    return cached;
  }

  const url = await prisma.url.findUnique({ where: { shortCode } });

  if (!url) return null;

  if (url.expiredAt && new Date() > url.expiredAt) {
    return url.fallbackUrl
      ? { isFallback: true, fallbackUrl: url.fallbackUrl }
      : null;
  }

  await setCachedUrl(shortCode, {
    id: url.id,
    originalUrl: url.originalUrl,
    expiredAt: url.expiredAt,
    fallbackUrl: url.fallbackUrl || null,
  });

  return url;
}

module.exports = { createShortUrl, getOriginalUrl, deleteCachedUrl };