import api from './axiosConfig';

export const loginAdmin = async (email, password) => {
  const response = await api.post ('/admin/login', {
    email,
    password
  });

  const data = await response.data;
  // console.log('Login response data:', data);
  if (!response.data.success) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
};
