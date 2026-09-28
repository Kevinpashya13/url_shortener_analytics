import api from './axiosInstance';

export const createShortUrl = (originalUrl, customAlias, expiredAt, fallbackUrl) =>
  api.post('/shorten', { originalUrl, customAlias, expiredAt, fallbackUrl });

export const getMyUrls = () => api.get('/my-urls');

export const getAnalytics = (shortCode, params = {}) =>
  api.get(`/analytics/${shortCode}`, {
    params: typeof params === 'object' ? params : { days: params },
  });

export const getAccountMe = () => api.get('/account/me');

export const getAccountAnalyticsOverview = (params = {}) =>
  api.get('/account/analytics-overview', { params });

export const upgradeAccount = (role) => api.post('/account/upgrade', { role });
export const deleteShortUrl = (shortCode) => api.delete(`/urls/${shortCode}`);
export const updateShortUrl = (shortCode, data) => api.patch(`/urls/${shortCode}`, data);