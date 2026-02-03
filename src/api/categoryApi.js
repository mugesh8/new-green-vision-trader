import api from './axiosConfig';

export const createCategory = async (formData) => {
  const token = localStorage.getItem('token');
  const response = await api.post('/category/create', formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getAllCategories = async (page = 1, limit = 10) => {
  const response = await api.get(`/category/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const updateCategory = async (id, formData) => {
  const token = localStorage.getItem('token');
  const response = await api.put(`/category/${id}`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/category/${id}`);
  return response.data;
};
