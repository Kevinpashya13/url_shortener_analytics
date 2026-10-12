require('dotenv').config();
const express = require('express');
const prisma = require('./config/prisma');
const { redisClient, connectRedis } = require('./config/redis');

const app = express();
app.set('trust proxy', 1);

const cors = require('cors');
const shortenRoutes = require('./routes/shorten');
const redirectRoutes = require('./routes/redirect');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const accountRoutes = require('./routes/account');

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(express.json());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', shortenRoutes);
app.use('/', analyticsRoutes);
app.use('/', accountRoutes);


const PORT = process.env.PORT || 3000;

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

app.use('/', redirectRoutes);


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