import api from './axiosConfig';

export const createFuelExpense = async (expenseData) => {
  try {
    const response = await api.post('/fuel-expense/create', expenseData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllFuelExpenses = async () => {
  try {
    const response = await api.get('/fuel-expense/list');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getFuelExpenseById = async (id) => {
  try {
    const response = await api.get(`/fuel-expense/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateFuelExpense = async (id, expenseData) => {
  try {
    const response = await api.put(`/fuel-expense/${id}`, expenseData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteFuelExpense = async (id) => {
  try {
    const response = await api.delete(`/fuel-expense/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getFuelExpensesByDriverId = async (driverId) => {
  try {
    const response = await api.get(`/fuel-expense/driver/${driverId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
