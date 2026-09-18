const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient, connectRedis } = require('../config/redis');

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

module.exports = { shortenLimiter };