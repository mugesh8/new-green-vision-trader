import api from './axiosConfig';

const API_BASE_URL = '/airport';

export const createAirport = async (data) => {
  try {
    const response = await api.post(`${API_BASE_URL}/create`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllAirports = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/list`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAirportById = async (id) => {
  try {
    const response = await api.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateAirport = async (id, data) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteAirport = async (id) => {
  try {
    const response = await api.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const searchAirports = async (query) => {
  try {
    const response = await api.get(`${API_BASE_URL}/search/query?query=${query}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
