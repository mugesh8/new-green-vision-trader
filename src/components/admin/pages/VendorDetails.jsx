import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, TrendingUp, Package, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const SupplierDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);

  const handleBackClick = () => {
    navigate('/vendors');
  };

  // Mock vendor data - in real app, this would come from API
  const vendorData = {
    '1': {
      id: 'VEN-001',
      name: 'Green Fields Farm',
      type: 'Farmer',
      phone: '+91 98765 43210',
      email: 'contact@greenfields.in',
      alternatePhone: '+91 98765 43211',
      produce: 'Tomatoes, Carrots, Beans, Potatoes',
      supplyFrequency: 'Weekly - Every Monday & Thursday',
      region: 'Tamil Nadu, India',
      address: '123 Farm Road, Coimbatore District, Tamil Nadu - 641001, India',
      status: 'Active',
      rating: '4.8',
      ratingText: 'Excellent Rating',
      reviewCount: '189',
      totalOrders: '247',
      onTimeDelivery: '95%',
      revenue: '₹12.4 Lakhs',
      qualityScore: '9.5/10',
      responseTime: '2.5 hrs',
      supplyReliability: '98%',
      activeSince: '10 Months'
    },
    '2': {
      id: 'VEN-002',
      name: 'Fresh Vegetable Supply Co.',
      type: 'Supplier',
      phone: '+91 98765 43211',
      email: 'sales@freshveg.com',
      alternatePhone: '+91 98765 43212',
      produce: 'Potatoes, Onions, Cabbage',
      supplyFrequency: 'Bi-weekly - Every Tuesday & Friday',
      region: 'Kerala, India',
      address: '456 Supply Street, Kochi, Kerala - 682001, India',
      status: 'Active',
      rating: '4.2',
      ratingText: 'Good Rating',
      reviewCount: '156',
      totalOrders: '189',
      onTimeDelivery: '88%',
      revenue: '₹8.7 Lakhs',
      qualityScore: '8.2/10',
      responseTime: '3.1 hrs',
      supplyReliability: '92%',
      activeSince: '8 Months'
    },
    'VEN-001': {
      id: 'VEN-001',
      name: 'Green Fields Farm',
      type: 'Farmer',
      phone: '+91 98765 43210',
      email: 'contact@greenfields.in',
      alternatePhone: '+91 98765 43211',
      produce: 'Tomatoes, Carrots, Beans, Potatoes',
      supplyFrequency: 'Weekly - Every Monday & Thursday',
      region: 'Tamil Nadu, India',
      address: '123 Farm Road, Coimbatore District, Tamil Nadu - 641001, India',
      status: 'Active',
      rating: '4.8',
      ratingText: 'Excellent Rating',
      reviewCount: '189',
      totalOrders: '247',
      onTimeDelivery: '95%',
      revenue: '₹12.4 Lakhs',
      qualityScore: '9.5/10',
      responseTime: '2.5 hrs',
      supplyReliability: '98%',
      activeSince: '10 Months'
    },
    'VEN-002': {
      id: 'VEN-002',
      name: 'Fresh Vegetable Supply Co.',
      type: 'Supplier',
      phone: '+91 98765 43211',
      email: 'sales@freshveg.com',
      alternatePhone: '+91 98765 43212',
      produce: 'Potatoes, Onions, Cabbage',
      supplyFrequency: 'Bi-weekly - Every Tuesday & Friday',
      region: 'Kerala, India',
      address: '456 Supply Street, Kochi, Kerala - 682001, India',
      status: 'Active',
      rating: '4.2',
      ratingText: 'Good Rating',
      reviewCount: '156',
      totalOrders: '189',
      onTimeDelivery: '88%',
      revenue: '₹8.7 Lakhs',
      qualityScore: '8.2/10',
      responseTime: '3.1 hrs',
      supplyReliability: '92%',
      activeSince: '8 Months'
    }
  };

  useEffect(() => {
    // Simulate API call to fetch vendor data
    const fetchVendor = () => {
      const vendorInfo = vendorData[id];
      if (vendorInfo) {
        setVendor(vendorInfo);
      }
    };

    fetchVendor();
  }, [id]);

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header Section with Back Button */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Vendors</span>
          </button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Vendor Details</h1>
        <p className="text-gray-600">Complete vendor profile and performance metrics</p>
      </div>

      {/* Vendor Profile Card */}
      <div className=" rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-teal-800 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-3xl font-bold">{vendor?.name?.substring(0, 2).toUpperCase() || 'VN'}</span>
          </div>
          
          {/* Vendor Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{vendor?.name || 'N/A'}</h2>
            <p className="text-gray-600 mb-2">Vendor ID: {vendor?.id || 'N/A'}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="text-red-500">🛒</span>
                Member since January 15, 2024
              </span>
              <span>•</span>
              <span>Last updated: Oct 28, 2025</span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-col gap-2">
            <span className="bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-sm font-medium border border-teal-200">
              {vendor?.type || 'Vendor'}
            </span>
            <span className={`px-4 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${
              vendor?.status === 'Active' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                vendor?.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              {vendor?.status || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Contact Information */}
        <div className="bg-teal-50 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Phone Number</p>
              <p className="text-gray-800">{vendor?.phone || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Email Address</p>
              <p className="text-teal-600">{vendor?.email || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Alternate Contact</p>
              <p className="text-gray-800">{vendor?.alternatePhone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-teal-50 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-800">Business Details</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Assigned Produce</p>
              <div className="flex flex-wrap gap-2">
                {vendor?.produce ? vendor.produce.split(', ').map((item, index) => (
                  <span key={index} className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">
                    {item}
                  </span>
                )) : <span className="text-gray-500">No produce assigned</span>}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Supply Frequency</p>
              <p className="text-gray-800">{vendor?.supplyFrequency || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="bg-teal-50 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-800">Location Details</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Region</p>
              <p className="text-gray-800">{vendor?.region || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Full Address</p>
              <p className="text-gray-800">{vendor?.address || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Rating */}
        <div className="bg-teal-50 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">⭐</span>
            <h3 className="text-lg font-semibold text-gray-800">Performance Rating</h3>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#14b8a6"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(4.8 / 5) * 439.8} 439.8`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-teal-600">{vendor?.rating || '0.0'}</span>
                <span className="text-sm text-gray-500">/5.0</span>
              </div>
            </div>
            <p className="text-gray-600 font-medium mt-4">{vendor?.ratingText || 'No Rating'}</p>
            <p className="text-sm text-gray-500 mt-1">Based on {vendor?.reviewCount || 0} reviews</p>
          </div>
        </div>

        {/* Orders Summary */}
        <div className="bg-teal-50 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-800">Orders Summary</h3>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-6xl font-bold text-teal-600 mb-2">{vendor?.totalOrders || 0}</div>
            <p className="text-gray-600 mb-6">Total Completed Orders</p>
            
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">On-Time Delivery</span>
                <span className="font-semibold text-green-600">{vendor?.onTimeDelivery || '0%'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-gray-800">{vendor?.revenue || '₹0'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-teal-50 rounded-lg shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Quality Score</p>
          <p className="text-3xl font-bold text-teal-600">{vendor?.qualityScore || '0/10'}</p>
        </div>
        
        <div className="bg-teal-50 rounded-lg shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Response Time</p>
          <p className="text-3xl font-bold text-teal-600">{vendor?.responseTime || 'N/A'}</p>
        </div>
        
        <div className="bg-teal-50 rounded-lg shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Supply Reliability</p>
          <p className="text-3xl font-bold text-teal-600">{vendor?.supplyReliability || '0%'}</p>
        </div>
        
        <div className="bg-teal-50 rounded-lg shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Active Since</p>
          <p className="text-3xl font-bold text-teal-600">{vendor?.activeSince || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetails;