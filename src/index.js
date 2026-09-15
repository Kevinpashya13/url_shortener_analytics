require('dotenv').config();
const express = require('express');
const prisma = require('./config/prisma');
const { redisClient, connectRedis } = require('./config/redis');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', async (req, res) => {
  const status = { server: 'ok', database: 'unknown', redis: 'unknown' };

  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database = 'ok';
  } catch (err) {
    status.database = 'error';
  }

  try {
    await redisClient.ping();
    status.redis = 'ok';
  } catch (err) {
    status.redis = 'error';
  }

  const isHealthy = status.database === 'ok' && status.redis === 'ok';
  res.status(isHealthy ? 200 : 503).json(status);
});

async function startServer() {
  try {
    await connectRedis();
    console.log('Redis connected');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();