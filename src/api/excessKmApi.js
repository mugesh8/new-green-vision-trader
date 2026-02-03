import api from './axiosConfig';

export const getAllExcessKMs = async () => {
  try {
    const response = await api.get('/excess-km/list');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getExcessKMById = async (id) => {
  try {
    const response = await api.get(`/excess-km/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getExcessKMsByDriverId = async (driverId) => {
  try {
    const response = await api.get(`/excess-km/driver/${driverId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createExcessKM = async (data) => {
  try {
    const response = await api.post('/excess-km/create', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateExcessKM = async (id, data) => {
  try {
    const response = await api.put(`/excess-km/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteExcessKM = async (id) => {
  try {
    const response = await api.delete(`/excess-km/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getExcessKMStats = async (params) => {
  try {
    const response = await api.get('/excess-km/stats', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getExcessKMsByDateRange = async (startDate, endDate) => {
  try {
    const response = await api.get('/excess-km/date-range', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
