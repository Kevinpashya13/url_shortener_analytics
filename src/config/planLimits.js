// Central source of truth for per-role feature limits.
// All enforcement middleware and services should reference this.

const PLAN_LIMITS = {
  STANDARD: {
    urlsPerMonth: 25,
    clicksPerMonth: 1000,
    customAlias: true,
    renameAlias: true,
    editDestination: false,
    deleteUrl: false,
    expiry: false,
    fullAnalytics: false, // only totalClicks + clicksByDay
    fallback: false,
  },
  PRO: {
    urlsPerMonth: 150,
    clicksPerMonth: 5000,
    customAlias: true,
    renameAlias: true,
    editDestination: true,
    deleteUrl: true,
    expiry: true,
    fullAnalytics: true,
    fallback: false,
  },
  PREMIUM: {
    urlsPerMonth: 1000,
    clicksPerMonth: 100000,
    customAlias: true,
    renameAlias: true,
    editDestination: true,
    deleteUrl: true,
    expiry: true,
    fullAnalytics: true,
    fallback: true,
  },
  ADMIN: {
    urlsPerMonth: Infinity,
    clicksPerMonth: Infinity,
    customAlias: true,
    renameAlias: true,
    editDestination: true,
    deleteUrl: true,
    expiry: true,
    fullAnalytics: true,
    fallback: true,
  },
};

function getLimits(role) {
  return PLAN_LIMITS[role] || PLAN_LIMITS.STANDARD;
}

module.exports = { PLAN_LIMITS, getLimits };

