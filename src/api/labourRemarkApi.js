import api from './axiosConfig';

export const createLabourRemark = async (data) => {
  try {
    const response = await api.post('/labour-remark', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllLabourRemarks = async () => {
  try {
    const response = await api.get('/labour-remark');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getLabourRemarkById = async (id) => {
  try {
    const response = await api.get(`/labour-remark/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getLabourRemarksByLabourId = async (labourId) => {
  try {
    const response = await api.get(`/labour-remark/labour/${labourId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateLabourRemark = async (id, data) => {
  try {
    const response = await api.put(`/labour-remark/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteLabourRemark = async (id) => {
  try {
    const response = await api.delete(`/labour-remark/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};