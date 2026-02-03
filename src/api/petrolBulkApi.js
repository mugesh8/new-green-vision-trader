import api from './axiosConfig';

const API_BASE_URL = '/petrol-bulk';

export const petrolBulkApi = {
  getAll: (page = 1, limit = 10, search = '') => 
    api.get(`${API_BASE_URL}/list`, { params: { page, limit, search } }),
  
  getById: (id) => 
    api.get(`${API_BASE_URL}/${id}`),
  
  create: (data) => 
    api.post(`${API_BASE_URL}/create`, data),
  
  update: (id, data) => 
    api.put(`${API_BASE_URL}/update/${id}`, data),
  
  delete: (id) => 
    api.delete(`${API_BASE_URL}/delete/${id}`)
};
