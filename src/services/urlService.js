const prisma = require('../config/prisma');
const { encodeBase62 } = require('../utility/base62');

async function createShortUrl(originalUrl, customAlias = null, expiredAt = null) {
  if (customAlias) {
    const existing = await prisma.url.findUnique({ where: { shortCode: customAlias } });
    if (existing) {
      throw new Error('ALIAS_TAKEN');
    }
    return prisma.url.create({
      data: { originalUrl, shortCode: customAlias, customAlias: true, expiredAt },
    });
  }

  const newUrl = await prisma.url.create({
    data: { originalUrl, shortCode: '', expiredAt },
  });

  const shortCode = encodeBase62(newUrl.id);

  return prisma.url.update({
    where: { id: newUrl.id },
    data: { shortCode },
  });
}

async function getOriginalUrl(shortCode) {
  const url = await prisma.url.findUnique({ where: { shortCode } });

  if (!url) return null;
  if (url.expiredAt && new Date() > url.expiredAt) return null;

  return url;
}

module.exports = { createShortUrl, getOriginalUrl };