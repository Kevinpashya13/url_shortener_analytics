const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient, connectRedis } = require('../config/redis');

// Rate limiter for link creation: 10 requests / minute
const shortenLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args) => {
      await connectRedis();
      return redisClient.sendCommand(args);
    },
  }),
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for authentication (login/register): 20 attempts / 15 minutes to prevent brute-force
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args) => {
      await connectRedis();
      return redisClient.sendCommand(args);
    },
  }),
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { shortenLimiter, authLimiter };