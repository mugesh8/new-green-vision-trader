import api from './axiosConfig';

export const getAllProductCounts = async (page = 1, limit = 20, search = '') => {
  const params = new URLSearchParams({ page, limit });
  if (search && search.trim()) params.append('search', search.trim());
  const response = await api.get(`/product-count?${params.toString()}`);
  return response.data;
};

export const updateProductCountStatus = async (productId, status) => {
  const response = await api.put(`/product-count/${productId}`, { status });
  return response.data;
};

export const bulkUpdateProductCountStatus = async (updates) => {
  const response = await api.put('/product-count/bulk/status', { updates });
  return response.data;
};