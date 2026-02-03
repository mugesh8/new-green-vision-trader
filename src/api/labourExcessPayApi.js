import api from './axiosConfig';

export const createLabourExcessPay = async (data) => {
  try {
    const response = await api.post('/labour/excess-pay/create', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllLabourExcessPay = async () => {
  try {
    const response = await api.get('/labour/excess-pay/list');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getLabourExcessPayById = async (id) => {
  try {
    const response = await api.get(`/labour/excess-pay/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateLabourExcessPay = async (id, data) => {
  try {
    const response = await api.put(`/labour/excess-pay/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteLabourExcessPay = async (id) => {
  try {
    const response = await api.delete(`/labour/excess-pay/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
