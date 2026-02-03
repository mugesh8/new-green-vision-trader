import api from './axiosConfig';

// Create a new supplier
export const createSupplier = async (supplierData) => {
  try {
    const config = supplierData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await api.post('/supplier/create', supplierData, config);
    return response.data;
  } catch (error) {
    console.error('Supplier API Error:', error.response?.data);
    throw error.response?.data || error.message;
  }
};

// Get all suppliers
export const getAllSuppliers = async () => {
  try {
    const response = await api.get('/supplier/list');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get supplier by ID
export const getSupplierById = async (id) => {
  try {
    const response = await api.get(`/supplier/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update supplier
export const updateSupplier = async (id, supplierData) => {
  try {
    const response = await api.put(`/supplier/${id}`, supplierData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete supplier
export const deleteSupplier = async (id) => {
  try {
    const response = await api.delete(`/supplier/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
