import api from './axiosConfig';

export const getPreferencesByCustomer = async (customerId) => {
  const response = await api.get(`customer-product/preferences/customer/${customerId}`);
  return response.data;
};

export const createPreference = async (data) => {
  const response = await api.post('customer-product/preferences', data);
  return response.data;
};

export const updatePreference = async (customer_id, product_id, data) => {
  const response = await api.put(`customer-product/preferences/${customer_id}/${product_id}`, data);
  return response.data;
};

export const deletePreference = async (customer_id, product_id) => {
  const response = await api.delete(`customer-product/preferences/${customer_id}/${product_id}`);
  return response.data;
};

