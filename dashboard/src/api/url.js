import api from './axiosInstance';

export const createShortUrl = (originalUrl, customAlias, expiredAt, fallbackUrl) =>
  api.post('/shorten', { originalUrl, customAlias, expiredAt, fallbackUrl });

export const getMyUrls = () => api.get('/my-urls');

export const getAnalytics = (shortCode, days) =>
  api.get(`/analytics/${shortCode}`, { params: days ? { days } : {} });

export const getAccountMe = () => api.get('/account/me');

export const upgradeAccount = (role) => api.post('/account/upgrade', { role });