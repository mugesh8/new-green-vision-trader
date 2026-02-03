import axios from 'axios';
import { API_BASE_URL } from '../config/config';
const API_URL = `${API_BASE_URL}/driver-rate`;
export const getAllDriverRates = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/list`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const getDriverRateById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const createDriverRate = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/create`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const updateDriverRate = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/update/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const deleteDriverRate = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};