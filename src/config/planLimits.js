// Central source of truth for per-role feature limits.
// All enforcement middleware and services should reference this.

const PLAN_LIMITS = {
  STANDARD: {
    urlsPerMonth: 50,
    clicksPerMonth: 1000,
    customAlias: false,
    expiry: false,
    fullAnalytics: false, // only totalClicks + clicksByDay
    fallback: false,
  },
  PRO: {
    urlsPerMonth: 1000,
    clicksPerMonth: 5000,
    customAlias: true,
    expiry: true,
    fullAnalytics: true,
    fallback: false,
  },
  PREMIUM: {
    urlsPerMonth: 5000,
    clicksPerMonth: 500000,
    customAlias: true,
    expiry: true,
    fullAnalytics: true,
    fallback: true,
  },
  ADMIN: {
    urlsPerMonth: Infinity,
    clicksPerMonth: Infinity,
    customAlias: true,
    expiry: true,
    fullAnalytics: true,
    fallback: true,
  },
};

function getLimits(role) {
  return PLAN_LIMITS[role] || PLAN_LIMITS.STANDARD;
}

module.exports = { PLAN_LIMITS, getLimits };

