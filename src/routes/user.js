const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middlewares/auth');

router.get('/my-urls', authenticate, async (req, res) => {
  const userId = req.user.userId;

  const urls = await prisma.url.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      shortCode: true,
      originalUrl: true,
      clickCount: true,
      createdAt: true,
      expiredAt: true,
    },
  });

  res.status(200).json(urls);
});

module.exports = router;