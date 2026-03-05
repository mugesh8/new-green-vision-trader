import api from './axiosConfig';

export const createMultipleProductBox = async (data) => {
  const response = await api.post('/multiple-product-box', data);
  return response.data;
};

export const getAllMultipleProductBoxes = async () => {
  const response = await api.get('/multiple-product-box');
  return response.data;
};

export const getMultipleProductBoxById = async (id) => {
  const response = await api.get(`/multiple-product-box/${id}`);
  return response.data;
};

export const updateMultipleProductBox = async (id, data) => {
  const response = await api.put(`/multiple-product-box/${id}`, data);
  return response.data;
};

export const deleteMultipleProductBox = async (id) => {
  const response = await api.delete(`/multiple-product-box/${id}`);
  return response.data;
};
