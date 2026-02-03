import api from './axiosConfig';
const API_BASE_URL = '/preorders';

export const createOrUpdatePreOrder = async (preOrderData) => {
    try {
        const response = await api.post(`${API_BASE_URL}/create`, preOrderData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getPreOrderByOrderId = async (orderId) => {
    try {
        const response = await api.get(`${API_BASE_URL}/${orderId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAllPreOrders = async (status = null) => {
    try {
        const url = status ? `${API_BASE_URL}?status=${status}` : API_BASE_URL;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updatePreOrderStatus = async (orderId, status) => {
    try {
        const response = await api.patch(`${API_BASE_URL}/${orderId}/status`, { status });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deletePreOrder = async (orderId) => {
    try {
        const response = await api.delete(`${API_BASE_URL}/${orderId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
