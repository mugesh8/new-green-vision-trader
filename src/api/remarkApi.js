import api from './axiosConfig';

export const getAllRemarks = async () => {
  try {
    const response = await api.get('/remark/list');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getRemarkById = async (id) => {
  try {
    const response = await api.get(`/remark/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getRemarksByDriverId = async (driverId) => {
  try {
    const response = await api.get(`/remark/driver/${driverId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createRemark = async (data) => {
  try {
    const response = await api.post('/remark/create', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateRemark = async (id, data) => {
  try {
    const response = await api.put(`/remark/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteRemark = async (id) => {
  try {
    const response = await api.delete(`/remark/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const searchRemarks = async (query) => {
  try {
    const response = await api.get('/remark/search/query', { params: { query } });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getRemarksByDateRange = async (startDate, endDate) => {
  try {
    const response = await api.get('/remark/date-range', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
