import api from './axiosConfig';

// Create a new notification
export const createNotification = async (data) => {
  const response = await api.post('/notification/create', data);
  return response.data;
};

// Get all notifications for current admin
export const getNotifications = async () => {
  const response = await api.get('/notification/list');
  return response.data;
};

// Get a single notification by ID
export const getNotificationById = async (id) => {
  const response = await api.get(`/notification/${id}`);
  return response.data;
};

// Mark a single notification as read
export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notification/${id}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notification/mark-all/read');
  return response.data;
};

// Delete a single notification
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notification/${id}`);
  return response.data;
};

// Clear all notifications
export const clearNotifications = async () => {
  const response = await api.delete('/notification');
  return response.data;
};

