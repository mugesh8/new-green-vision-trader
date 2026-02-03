import axios from 'axios';
import { BASE_URL } from '../config/config';

const API_URL = `${BASE_URL}/api/v1/driver-attendance`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('authToken')}`
});

// Get attendance overview
export const getAttendanceOverview = async (params = {}) => {
  const response = await axios.get(`${API_URL}/overview`, {
    params,
    headers: getAuthHeaders()
  });
  return response.data;
};

// Mark driver check-in
export const markCheckIn = async (driverId, data = {}) => {
  const response = await axios.post(`${API_URL}/check-in/${driverId}`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Mark driver check-out
export const markCheckOut = async (driverId, data = {}) => {
  const response = await axios.post(`${API_URL}/check-out/${driverId}`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Mark driver as present
export const markPresent = async (driverId, data = {}) => {
  const response = await axios.post(`${API_URL}/mark-present/${driverId}`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Mark driver as absent
export const markAbsent = async (driverId, data = {}) => {
  const response = await axios.post(`${API_URL}/mark-absent/${driverId}`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Update check-in time (for existing attendance)
export const updateCheckInTime = async (driverId, data = {}) => {
  const response = await axios.patch(`${API_URL}/check-in/${driverId}`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Update check-out time (for existing attendance)
export const updateCheckOutTime = async (driverId, data = {}) => {
  const response = await axios.patch(`${API_URL}/check-out/${driverId}`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Get driver attendance history
export const getDriverAttendanceHistory = async (driverId, params = {}) => {
  const response = await axios.get(`${API_URL}/history/${driverId}`, {
    params,
    headers: getAuthHeaders()
  });
  return response.data;
};

// Get driver attendance stats
export const getDriverAttendanceStats = async (driverId, params = {}) => {
  const response = await axios.get(`${API_URL}/stats/${driverId}`, {
    params,
    headers: getAuthHeaders()
  });
  return response.data;
};

// Get attendance report
export const getAttendanceReport = async (params = {}) => {
  const response = await axios.get(`${API_URL}/report`, {
    params,
    headers: getAuthHeaders()
  });
  return response.data;
};

// Bulk mark attendance
export const bulkMarkAttendance = async (data) => {
  const response = await axios.post(`${API_URL}/bulk-mark`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Update attendance remarks
export const updateAttendanceRemarks = async (attendanceId, data) => {
  const response = await axios.patch(`${API_URL}/remarks/${attendanceId}`, data, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Delete attendance record
export const deleteAttendanceRecord = async (attendanceId) => {
  const response = await axios.delete(`${API_URL}/${attendanceId}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};