import api from './axiosConfig';

// Create a new farmer
export const createFarmer = async (farmerData) => {
  try {
    const response = await api.post('/farmer/create', farmerData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all farmers
export const getAllFarmers = async () => {
  try {
    const response = await api.get('/farmer/list');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get farmer by ID
export const getFarmerById = async (id) => {
  try {
    const response = await api.get(`/farmer/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update farmer
export const updateFarmer = async (id, farmerData) => {
  try {
    const response = await api.put(`/farmer/${id}`, farmerData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete farmer
export const deleteFarmer = async (id) => {
  try {
    const response = await api.delete(`/farmer/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
