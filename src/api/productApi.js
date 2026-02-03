import api from './axiosConfig';

export const createProduct = async (formData) => {
  const token = localStorage.getItem('token');
  const response = await api.post('/product/create', formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getAllProducts = async (page = 1, limit = 10) => {
  const response = await api.get(`/product/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const updateProduct = async (id, formData) => {
  const token = localStorage.getItem('token');
  const response = await api.put(`/product/${id}`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/product/${id}`);
  return response.data;
};