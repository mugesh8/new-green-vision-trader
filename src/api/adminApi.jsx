import api from './axiosConfig';

export const registerAdmin = async (adminData) => {
  try {
    const response = await api.post('/admin/register', adminData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllAdmins = async () => {
  try {
    const response = await api.get('/admin/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdminById = async (id) => {
  try {
    const response = await api.get(`/admin/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateAdmin = async (id, adminData) => {
  try {
    const response = await api.put(`/admin/${id}`, adminData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteAdmin = async (id) => {
  try {
    const response = await api.delete(`/admin/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateRolesPermissions = async (id, permissions) => {
  try {
    const response = await api.put(`/admin/${id}/permissions`, permissions);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getRolesPermissions = async (id) => {
  try {
    const response = await api.get(`/admin/${id}/permissions`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};