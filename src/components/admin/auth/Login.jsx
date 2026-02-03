import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginAdmin } from '../../../api/authApi';
import logo from '../../../assets/logo.png';

const VeggiChainLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      try {
        const response = await loginAdmin(formData.email, formData.password);
        
        if (response.success) {
          // Store access token
          localStorage.setItem('authToken', response.token);
          
          // Decode JWT token to extract admin aid
          try {
            const tokenParts = response.token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              if (payload.aid) {
                localStorage.setItem('adminAid', payload.aid);
              }
              // Optionally store role and username as well
              if (payload.role) {
                localStorage.setItem('adminRole', payload.role);
              }
              if (payload.username) {
                localStorage.setItem('adminUsername', payload.username);
              }
            }
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError);
          }
          
          navigate('/dashboard');
        } else {
          setErrors({ general: response.message || 'Login failed. Please try again.' });
        }
      } catch (error) {
        // Handle different error formats
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'An error occurred. Please try again.';
        setErrors({ general: errorMessage });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = () => {
    // console.log('Forgot password clicked');
    // Add forgot password logic here
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left vegetables */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-teal-600/30 rounded-full blur-3xl"></div>
        <div className="absolute top-32 left-10 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl"></div>
        
        {/* Top right vegetables */}
        <div className="absolute -top-10 right-20 w-48 h-48 bg-teal-600/25 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -right-10 w-36 h-36 bg-teal-500/20 rounded-full blur-2xl"></div>
        
        {/* Bottom left vegetables */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-600/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl"></div>
        
        {/* Bottom right vegetables */}
        <div className="absolute -bottom-10 right-32 w-56 h-56 bg-teal-600/25 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 -right-20 w-44 h-44 bg-teal-500/20 rounded-full blur-2xl"></div>
        
        {/* Center decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-teal-400/15 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-teal-400/15 rounded-full blur-xl"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden p-2">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-700 mb-1">Green Vision Traders</h1>
          <p className="text-gray-500 text-sm mb-6">Supply Chain Management</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back!</h2>
          <p className="text-gray-500 text-sm">Sign in to continue to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {errors.general}
            </div>
          )}
          {/* Email Input */}
          <div>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email address"
                className={`w-full px-4 py-3.5 pr-12 rounded-xl border ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-teal-500 focus:ring-teal-200'
                } focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400`}
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className={`w-full px-4 py-3.5 pr-12 rounded-xl border ${
                  errors.password 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-teal-500 focus:ring-teal-200'
                } focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default VeggiChainLogin;