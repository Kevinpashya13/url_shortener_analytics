const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middlewares/auth');
const { getLimits } = require('../config/planLimits');
const { getUserOverviewAnalytics } = require('../services/analyticsService');

// GET /account/analytics-overview — returns aggregated real analytics across all user's URLs
router.get('/account/analytics-overview', authenticate, async (req, res) => {
  try {
    const role = req.user.role || 'STANDARD';
    const overview = await getUserOverviewAnalytics(req.user.userId, role);
    res.status(200).json(overview);
  } catch (err) {
    console.error('Error fetching analytics overview:', err);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});


// GET /account/me — returns current user profile, role, and quota usage
router.get('/account/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const limits = getLimits(user.role);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [urlsThisMonth, clicksThisMonth] = await Promise.all([
      prisma.url.count({
        where: { userId: user.id, createdAt: { gte: startOfMonth } },
      }),
      prisma.clickLog.count({
        where: {
          url: { userId: user.id },
          clickedAt: { gte: startOfMonth },
        },
      }),
    ]);

    res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      usage: {
        urlsThisMonth,
        urlsLimit: limits.urlsPerMonth,
        clicksThisMonth,
        clicksLimit: limits.clicksPerMonth,
      },
      features: {
        customAlias: limits.customAlias,
        expiry: limits.expiry,
        fullAnalytics: limits.fullAnalytics,
        fallback: limits.fallback,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /account/upgrade — simple plan upgrade (no payment, for dev/admin use)
// Body: { role: 'PRO' | 'PREMIUM' }
router.post('/account/upgrade', authenticate, async (req, res) => {
  const { role } = req.body;
  const UPGRADEABLE_ROLES = ['PRO', 'PREMIUM'];

  if (!UPGRADEABLE_ROLES.includes(role)) {
    return res.status(400).json({
      error: 'Invalid role. Must be PRO or PREMIUM.',
      validRoles: UPGRADEABLE_ROLES,
    });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    res.status(200).json({
      message: `Account successfully upgraded to ${role}`,
      user: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

