import api from './axiosConfig';

const API_BASE_URL = '/inventory';

export const createInventory = async (data) => {
  const response = await api.post(`${API_BASE_URL}/create`, data);
  return response.data;
};

export const getAllInventory = async (page = 1, limit = 10) => {
  const response = await api.get(`${API_BASE_URL}/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const getInventoryById = async (id) => {
  const response = await api.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const updateInventory = async (id, data) => {
  const response = await api.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteInventory = async (id) => {
  const response = await api.delete(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const getBoxesAndBags = async () => {
  const response = await api.get(`${API_BASE_URL}/list?page=1&limit=1000`);
  const allItems = response.data.data || [];
  return allItems.filter(item => item.category === 'Boxes' || item.category === 'Bags');
};

export const getTapes = async () => {
  const response = await api.get(`${API_BASE_URL}/list?page=1&limit=1000&category=Tape`);
  return response.data;
};
