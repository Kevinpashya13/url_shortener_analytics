const { redisClient } = require('../config/redis');

const CACHE_PREFIX = 'url:';
const CACHE_TTL_SECONDS = 60 * 60 * 24;

async function getCachedUrl(shortCode) {
  const cached = await redisClient.get(`${CACHE_PREFIX}${shortCode}`);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedUrl(shortCode, data) {
  await redisClient.setEx(
    `${CACHE_PREFIX}${shortCode}`,
    CACHE_TTL_SECONDS,
    JSON.stringify(data)
  );
}

async function deleteCachedUrl(shortCode) {
  await redisClient.del(`${CACHE_PREFIX}${shortCode}`);
}

module.exports = { getCachedUrl, setCachedUrl, deleteCachedUrl };