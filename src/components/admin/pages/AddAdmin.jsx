import React, { useState } from 'react';
import { registerAdmin } from '../../../api/adminApi';


const AddAdmin = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    role: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const roles = ['admin', 'superadmin', 'supervisor', 'accountant', 'driver'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      setApiError('');
      
      try {
        const response = await registerAdmin(formData);
        if (response.success) {
          onAdd(formData);
          onClose();
        } else {
          setApiError(response.message || 'Failed to add admin');
        }
      } catch (error) {
        setApiError(error.response?.data?.message || 'Server error. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-emerald-700">Add Admin</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {apiError}
            </div>
          )}
          
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={`w-full px-4 py-2.5 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder-gray-400`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                className={`w-full px-4 py-2.5 border ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder-gray-400`}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">{errors.username}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border ${
                    errors.role ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm appearance-none bg-white cursor-pointer ${
                    !formData.role ? 'text-gray-400' : 'text-gray-900'
                  }`}
                >
                  <option value="">Select role</option>
                  {roles.map(role => (
                    <option key={role} value={role} className="text-gray-900 capitalize">{role}</option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {errors.role && (
                <p className="mt-1 text-xs text-red-500">{errors.role}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password (min 8 characters)"
                  className={`w-full px-4 py-2.5 pr-10 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder-gray-400`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAdmin;