import api from './axiosConfig';

// Get all orders
export const getAllOrders = async () => {
  try {
    const response = await api.get('/order/list');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get order by ID
export const getOrderById = async (id) => {
  try {
    const response = await api.get(`/order/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/order/create', orderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update an order
export const updateOrder = async (id, orderData) => {
  try {
    const response = await api.put(`/order/${id}`, orderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete an order
export const deleteOrder = async (id) => {
  try {
    const response = await api.delete(`/order/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Draft APIs
// Create a new draft
export const createDraft = async (draftData) => {
  try {
    const response = await api.post('/draft/create', draftData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all drafts
export const getAllDrafts = async () => {
  try {
    const response = await api.get('/draft/list');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get draft by ID
export const getDraftById = async (id) => {
  try {
    const response = await api.get(`/draft/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a draft
export const updateDraft = async (id, draftData) => {
  try {
    const response = await api.put(`/draft/${id}`, draftData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a draft
export const deleteDraft = async (id) => {
  try {
    const response = await api.delete(`/draft/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Preorder APIs
// Get all preorders
export const getAllPreorders = async () => {
  try {
    const response = await api.get('/preorder/list');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get preorder by ID
export const getPreorderById = async (id) => {
  try {
    const response = await api.get(`/preorder/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new preorder
export const createPreorder = async (preorderData) => {
  try {
    const response = await api.post('/preorder/create', preorderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a preorder
export const updatePreorder = async (id, preorderData) => {
  try {
    const response = await api.put(`/preorder/${id}`, preorderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a preorder
export const deletePreorder = async (id) => {
  try {
    const response = await api.delete(`/preorder/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  createDraft,
  getAllDrafts,
  getDraftById,
  updateDraft,
  deleteDraft,
  getAllPreorders,
  getPreorderById,
  createPreorder,
  updatePreorder,
  deletePreorder
};