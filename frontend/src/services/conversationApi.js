// Conversations API endpoints
import { api } from './api';

export const conversationApi = {
  getConversations: () => api.get('/conversations'),
  createOrGetDirect: (participantId) =>
    api.post('/conversations', { participant_id: participantId }),
  getConversationDetail: (id) => api.get(`/conversations/${id}`),
};
