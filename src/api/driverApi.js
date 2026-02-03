import api from './axiosConfig';

// Create a new driver with file upload
export const createDriver = async (driverData) => {
  try {
    const response = await api.post('/driver/create', driverData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all drivers
export const getAllDrivers = async () => {
  try {
    const response = await api.get('/driver/list');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get driver by ID
export const getDriverById = async (id) => {
  try {
    const response = await api.get(`/driver/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update driver
export const updateDriver = async (id, driverData) => {
  try {
    const response = await api.put(`/driver/${id}`, driverData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete driver
export const deleteDriver = async (id) => {
  try {
    const response = await api.delete(`/driver/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get driver statistics
export const getDriverStats = async () => {
  try {
    const response = await api.get('/driver/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get present drivers today
export const getPresentDriversToday = async () => {
  try {
    const response = await api.get('/driver-attendance/present-today');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};