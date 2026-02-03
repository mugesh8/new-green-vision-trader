import api from './axiosConfig';

const API_BASE_URL = '/sell-stock';

export const createSellStock = async (data) => {
  const response = await api.post(`${API_BASE_URL}/`, data);
  return response.data;
};

export const getAllSellStocks = async () => {
  const response = await api.get(`${API_BASE_URL}/`);
  return response.data;
};

export const getSellStockById = async (id) => {
  const response = await api.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const updateSellStock = async (id, data) => {
  const response = await api.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteSellStock = async (id) => {
  const response = await api.delete(`${API_BASE_URL}/${id}`);
  return response.data;
};
