const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middlewares/auth');

const { getLimits } = require('../config/planLimits');
const { deleteCachedUrl } = require('../services/cacheService');

router.get('/my-urls', authenticate, async (req, res) => {
  const userId = req.user.userId;

  const urls = await prisma.url.findMany({
    where: { userId, isDeleted: false },
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

router.delete('/urls/:shortCode', authenticate, async (req, res) => {
  const { shortCode } = req.params;
  const userId = req.user.userId;
  const role = req.user.role || 'STANDARD';
  const limits = getLimits(role);

  if (!limits.deleteUrl) {
    return res.status(403).json({
      error: 'Deleting short links is not available on the Free plan. Upgrade to Pro or Premium.',
      requiredPlan: 'PRO',
    });
  }

  try {
    const url = await prisma.url.findUnique({
      where: { shortCode },
      select: { id: true, userId: true },
    });

    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    if (url.userId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this URL' });
    }

    await prisma.url.update({
      where: { shortCode },
      data: {
        isDeleted: true,
        shortCode: `deleted_${Date.now()}_${shortCode}`,
      },
    });

    await deleteCachedUrl(shortCode);

    res.status(200).json({ message: 'Short URL deleted successfully' });
  } catch (err) {
    console.error('Error deleting URL:', err);
    res.status(500).json({ error: 'Failed to delete short URL' });
  }
});

router.patch('/urls/:shortCode', authenticate, async (req, res) => {
  const { shortCode } = req.params;
  const { newAlias, originalUrl } = req.body;
  const userId = req.user.userId;
  const role = req.user.role || 'STANDARD';
  const limits = getLimits(role);

  try {
    const url = await prisma.url.findUnique({
      where: { shortCode },
      select: { id: true, userId: true, shortCode: true, originalUrl: true, isDeleted: true },
    });

    if (!url || url.isDeleted) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    if (url.userId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this URL' });
    }

    const updateData = {};

    // 1. Rename alias logic (allowed for all roles)
    if (newAlias && newAlias !== shortCode) {
      const aliasClean = newAlias.trim();
      if (!/^[a-zA-Z0-9-_]{3,30}$/.test(aliasClean)) {
        return res.status(400).json({
          error: 'Alias must be between 3 and 30 characters and contain only letters, numbers, hyphens, and underscores.',
        });
      }

      const existing = await prisma.url.findUnique({ where: { shortCode: aliasClean } });
      if (existing && existing.id !== url.id) {
        return res.status(409).json({ error: 'Alias already in use. Please choose another.' });
      }

      updateData.shortCode = aliasClean;
      updateData.customAlias = true;
    }

    // 2. Edit destination logic (only PRO, PREMIUM, ADMIN)
    if (originalUrl && originalUrl !== url.originalUrl) {
      if (!limits.editDestination) {
        return res.status(403).json({
          error: 'Editing destination URL is only available on Pro and Premium plans.',
          requiredPlan: 'PRO',
        });
      }

      try {
        new URL(originalUrl);
      } catch {
        return res.status(400).json({ error: 'Invalid destination URL format' });
      }

      updateData.originalUrl = originalUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({ message: 'No changes provided', url });
    }

    const updated = await prisma.url.update({
      where: { shortCode },
      data: updateData,
    });

    await deleteCachedUrl(shortCode);
    if (updateData.shortCode) {
      await deleteCachedUrl(updateData.shortCode);
    }

    res.status(200).json({
      message: 'Short URL updated successfully',
      url: updated,
    });
  } catch (err) {
    console.error('Error updating URL:', err);
    res.status(500).json({ error: 'Failed to update short URL' });
  }
});

module.exports = router;