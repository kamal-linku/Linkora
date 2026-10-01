// Contacts API endpoints
import { api } from './api';

export const contactApi = {
  getContacts: () => api.get('/contacts'),
  addContact: (contactUserId, savedName) =>
    api.post('/contacts', { contact_user_id: contactUserId, saved_name: savedName }),
  updateContact: (contactId, savedName) =>
    api.put(`/contacts/${contactId}`, { saved_name: savedName }),
  deleteContact: (contactId) => api.delete(`/contacts/${contactId}`),
};
