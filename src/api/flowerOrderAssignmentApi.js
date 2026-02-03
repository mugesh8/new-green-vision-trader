import api from './axiosConfig';

const API_BASE_URL = '/flower-order-assignment';

/**
 * Get flower order assignment by order ID (only for FLOWER ORDER type).
 */
export const getFlowerOrderAssignment = async (orderId) => {
  try {
    const response = await api.get(`${API_BASE_URL}/${orderId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Update Stage 1 - Product Collection
 */
export const updateStage1Assignment = async (orderId, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${orderId}/stage1`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Update Stage 2 - Packaging
 */
export const updateStage2Assignment = async (orderId, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${orderId}/stage2`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Update Stage 3 - Airport Delivery
 */
export const updateStage3Assignment = async (orderId, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${orderId}/stage3`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Update Stage 4 - Review
 */
export const updateStage4Assignment = async (orderId, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${orderId}/stage4`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
