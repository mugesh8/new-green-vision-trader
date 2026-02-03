import api from './axiosConfig';

export const createVegetableAvailability = async (data) => {
  try {
    const response = await api.post('/vegetable-availability/create', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getVegetableAvailabilityByFarmer = async (farmerId) => {
  try {
    const response = await api.get(`/vegetable-availability/farmer/${farmerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateVegetableAvailability = async (id, data) => {
  try {
    const response = await api.put(`/vegetable-availability/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteVegetableAvailability = async (id) => {
  try {
    const response = await api.delete(`/vegetable-availability/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
