import api from './axiosConfig';

export const getPreferencesByCustomer = async (customerId, full = false) => {
  const response = await api.get(`/customer-product/preferences/customer/${customerId}${full ? '?full=true' : ''}`);
  return response.data;
};

export const createPreference = async (data) => {
  const response = await api.post('/customer-product/preferences', data);
  return response.data;
};

export const updatePreference = async (customer_id, product_id, data) => {
  const response = await api.put(`/customer-product/preferences/${customer_id}/${product_id}`, data);
  return response.data;
};

export const updatePreferenceForBox = async (customer_id, boxId, data) => {
  const response = await api.put(`/customer-product/preferences/box/${customer_id}/${boxId}`, data);
  return response.data;
};

export const deletePreference = async (customer_id, product_id) => {
  const response = await api.delete(`/customer-product/preferences/${customer_id}/${product_id}`);
  return response.data;
};

export const deletePreferenceForBox = async (customer_id, boxId) => {
  const response = await api.delete(`/customer-product/preferences/box/${customer_id}/${boxId}`);
  return response.data;
};