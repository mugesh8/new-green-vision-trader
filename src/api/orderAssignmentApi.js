import api from './axiosConfig';

const API_BASE_URL = '/order-assignment';

// Get order assignment by order ID
export const getOrderAssignment = async (orderId) => {
  try {
    const response = await api.get(`${API_BASE_URL}/${orderId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update stage 1 assignment
export const updateStage1Assignment = async (orderId, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${orderId}/stage1`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update stage 2 assignment
export const updateStage2Assignment = async (orderId, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${orderId}/stage2`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update stage 3 assignment
export const updateStage3Assignment = async (orderId, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${orderId}/stage3`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update stage 4 assignment
export const updateStage4Assignment = async (orderId, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${orderId}/stage4`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


// Get all assignment options (farmers, suppliers, etc.)
export const getAssignmentOptions = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/options/all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Save item assignment by order item ID
export const saveItemAssignment = async (orderId, oiid, assignmentData) => {
  try {
    const response = await api.post(`${API_BASE_URL}/${orderId}/item-assignment/${oiid}`, assignmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get item assignments
export const getItemAssignments = async (orderId) => {
  try {
    const response = await api.get(`${API_BASE_URL}/${orderId}/item-assignments`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update complete order assignment (all stages)
export const updateOrderAssignment = async (orderId, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${orderId}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all stock data
export const getAllStock = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/stock/all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all available stock grouped by product
export const getAvailableStock = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/stock/available/all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching available stock:', error);
    throw error;
  }
};

// Get stock for a specific product
export const getProductStock = async (productName) => {
  try {
    const response = await api.get(`${API_BASE_URL}/stock/product/${encodeURIComponent(productName)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product stock:', error);
    throw error;
  }
};

