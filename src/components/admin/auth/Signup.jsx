import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Eye, EyeOff } from 'lucide-react';

const VeggiChainSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, formData[fieldName]);
  };

  const validateField = (fieldName, value) => {
    let error = '';

    switch (fieldName) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Full name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        }
        break;
      
      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Email is invalid';
        }
        break;
      
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'Password must contain uppercase, lowercase, and number';
        }
        break;
      
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
      
      case 'agreeToTerms':
        if (!value) {
          error = 'You must agree to the terms and conditions';
        }
        break;
      
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return error === '';
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeToTerms: true
    });

    if (validateForm()) {
      console.log('Form submitted:', formData);
      // Add your signup logic here
    }
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    console.log('Open terms and conditions');
    // Add terms and conditions modal/page logic here
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

      {/* Signup Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-700 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-16 h-16 bg-teal-700 rounded-full flex items-center justify-center">
                <svg 
                  viewBox="0 0 40 40" 
                  className="w-10 h-10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <ellipse 
                    cx="20" 
                    cy="20" 
                    rx="12" 
                    ry="8" 
                    fill="white"
                    opacity="0.9"
                  />
                  <ellipse 
                    cx="20" 
                    cy="19" 
                    rx="8" 
                    ry="5" 
                    fill="#0D7C66"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-700 mb-1">VeggiChain</h1>
          <p className="text-gray-500 text-sm mb-6">Supply Chain Management</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Create Account</h2>
          <p className="text-gray-500 text-sm">Sign up to get started with VeggiChain</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Input */}
          <div>
            <div className="relative">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                onBlur={() => handleBlur('fullName')}
                placeholder="Full Name"
                className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                  touched.fullName && errors.fullName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-teal-500 focus:ring-teal-200'
                } focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400`}
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {touched.fullName && errors.fullName && (
              <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={() => handleBlur('email')}
                placeholder="Email address"
                className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                  touched.email && errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-teal-500 focus:ring-teal-200'
                } focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400`}
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {touched.email && errors.email && (
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
                onBlur={() => handleBlur('password')}
                placeholder="Password"
                className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                  touched.password && errors.password
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
            {touched.password && errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Confirm Password"
                className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                  touched.confirmPassword && errors.confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-teal-500 focus:ring-teal-200'
                } focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Terms and Conditions Checkbox */}
          <div>
            <label className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className={`w-4 h-4 mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-2 cursor-pointer ${
                  touched.agreeToTerms && errors.agreeToTerms ? 'border-red-300' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="#"
                  onClick={handleTermsClick}
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                  Terms & Conditions
                </a>
              </span>
            </label>
            {touched.agreeToTerms && errors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-500">{errors.agreeToTerms}</p>
            )}
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-6"
          >
            Create Account
          </button>

          {/* Sign In Link */}
          <div className="text-center pt-4">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleSignIn}
                className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VeggiChainSignup;