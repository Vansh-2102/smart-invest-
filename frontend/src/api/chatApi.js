import api from './axios';

export const chatApi = {
  sendMessage: (message) =>
    api.post('/chat', { message }),

  getHistory: (limit = 50) =>
    api.get('/chat/history', { params: { limit } }),
};
