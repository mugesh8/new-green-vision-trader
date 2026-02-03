import api from './axiosConfig';

export const getAllLabourRates = async () => {
    try {
        const response = await api.get('/labour-rate/list');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getLabourRateById = async (id) => {
    try {
        const response = await api.get(`/labour-rate/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createLabourRate = async (data) => {
    try {
        const response = await api.post('/labour-rate/create', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateLabourRate = async (id, data) => {
    try {
        const response = await api.put(`/labour-rate/update/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteLabourRate = async (id) => {
    try {
        const response = await api.delete(`/labour-rate/delete/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};