import api from './axiosConfig';

const API_BASE_URL = '/customer';

export const createCustomer = async (data) => {
  try {
    const response = await api.post(`${API_BASE_URL}/customers`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllCustomers = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`${API_BASE_URL}/customers?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCustomersByCategory = async (category) => {
  try {
    const response = await api.get(`${API_BASE_URL}/customers/category/${encodeURIComponent(category)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCustomerById = async (id) => {
  try {
    const response = await api.get(`${API_BASE_URL}/customers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateCustomer = async (id, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/customers/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteCustomer = async (id) => {
  try {
    const response = await api.delete(`${API_BASE_URL}/customers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
