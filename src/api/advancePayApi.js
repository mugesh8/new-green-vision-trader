import api from './axiosConfig';

export const getAllAdvancePays = async () => {
  try {
    const response = await api.get('/advance-pay/list');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdvancePayById = async (id) => {
  try {
    const response = await api.get(`/advance-pay/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdvancePaysByDriverId = async (driverId) => {
  try {
    const response = await api.get(`/advance-pay/driver/${driverId}`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error === "Driver is not associated to AdvancePay!") {
      return { success: true, data: [], message: "No advance payments found for this driver" };
    }
    throw error.response?.data || error.message;
  }
};

export const createAdvancePay = async (data) => {
  try {
    const response = await api.post('/advance-pay/create', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateAdvancePay = async (id, data) => {
  try {
    const response = await api.put(`/advance-pay/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteAdvancePay = async (id) => {
  try {
    const response = await api.delete(`/advance-pay/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdvancePayStats = async (params) => {
  try {
    const response = await api.get('/advance-pay/stats', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdvancePaysByDateRange = async (startDate, endDate) => {
  try {
    const response = await api.get('/advance-pay/date-range', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
