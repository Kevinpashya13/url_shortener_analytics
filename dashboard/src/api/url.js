import api from './axiosInstance';

export const createShortUrl = (originalUrl, customAlias, expiredAt) =>
  api.post('/shorten', { originalUrl, customAlias, expiredAt });

export const getMyUrls = () => api.get('/my-urls');

export const getAnalytics = (shortCode, days) =>
  api.get(`/analytics/${shortCode}`, { params: days ? { days } : {} });