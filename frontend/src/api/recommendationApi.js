import api from './axios';

export const recommendationApi = {
  generate: (riskLevel, investmentAmount) =>
    api.post('/recommendations', { riskLevel, investmentAmount }),

  getHistory: () =>
    api.get('/recommendations'),

  getById: (id) =>
    api.get(`/recommendations/${id}`),
};
