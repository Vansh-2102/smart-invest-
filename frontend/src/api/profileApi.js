import api from './axios';

export const profileApi = {
  getProfile: () =>
    api.get('/financial-profile'),

  createOrUpdate: (data) =>
    api.post('/financial-profile', data),
};
