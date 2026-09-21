const prisma = require('../config/prisma');
const { getLimits } = require('../config/planLimits');

/**
 * Middleware: ensure user is authenticated and within monthly URL creation quota.
 * Attach plan limits to req.planLimits for downstream use.
 */
async function checkUrlQuota(req, res, next) {
  const role = req.user.role || 'STANDARD';
  const userId = req.user.userId;
  const limits = getLimits(role);

  req.planLimits = limits;

  if (limits.urlsPerMonth === Infinity) return next();

  // Count URLs created by this user in the current calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await prisma.url.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  });

  if (count >= limits.urlsPerMonth) {
    return res.status(403).json({
      error: 'Monthly URL limit reached',
      limit: limits.urlsPerMonth,
      role,
    });
  }

  next();
}

/**
 * Middleware: block feature use if not allowed by plan.
 * Usage: requireFeature('customAlias'), requireFeature('expiry'), etc.
 */
function requireFeature(feature) {
  return (req, res, next) => {
    const role = req.user.role || 'STANDARD';
    const limits = getLimits(role);

    if (!limits[feature]) {
      return res.status(403).json({
        error: `Feature "${feature}" is not available on your current plan`,
        role,
        requiredPlan: feature === 'fallback' ? 'PREMIUM' : 'PRO',
      });
    }

    next();
  };
}

module.exports = { checkUrlQuota, requireFeature };

