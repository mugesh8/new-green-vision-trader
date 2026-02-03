import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, TrendingUp, Package, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFarmerById } from '../../../api/farmerApi';
import { BASE_URL } from '../../../config/config';

const FarmerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [farmer, setFarmer] = useState(null);

  const handleBackClick = () => {
    navigate('/farmers');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const farmerResponse = await getFarmerById(id);
        const farmerData = farmerResponse.data;

        let productList = [];
        if (typeof farmerData.product_list === 'string') {
          try {
            const parsed = JSON.parse(farmerData.product_list);
            if (Array.isArray(parsed)) {
              productList = parsed;
            }
          } catch (e) {
            productList = [];
          }
        }

        setFarmer({ ...farmerData, product_list: productList });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [id]);



  if (!farmer) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farmer details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Farmers</span>
          </button>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className="px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm bg-[#0D7C66] text-white"
        >
          Personal Info
        </button>
        <button
          onClick={() => navigate(`/farmers/${id}/orders`)}
          className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Order List
        </button>
        <button
          onClick={() => navigate(`/farmers/${id}/payout`)}
          className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Payout
        </button>
        <button
          onClick={() => navigate(`/farmers/${id}/vegetable-availability`)}
          className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Vegetable Availability
        </button>
      </div>

      <>
        <div className="rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 bg-teal-800 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {farmer?.profile_image ? (
                  <img
                    src={`${BASE_URL}${farmer.profile_image}`}
                    alt={farmer?.farmer_name || 'Farmer'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : null}
                {!farmer?.profile_image && (
                  <span className="text-white text-3xl font-bold">{farmer?.farmer_name?.substring(0, 2).toUpperCase() || 'FR'}</span>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{farmer?.farmer_name || 'N/A'}</h2>
                <p className="text-gray-600 mb-2">Farmer ID: {farmer?.registration_number || 'N/A'}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="text-red-500">🛒</span>
                    Member since January 15, 2024
                  </span>
                  <span>•</span>
                  <span>Last updated: Oct 28, 2025</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-sm font-medium border border-teal-200">
                  {farmer?.type || 'Farmer'}
                </span>
                <span className={`px-4 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${farmer?.status === 'active'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${farmer?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                  {farmer?.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-teal-50 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Phone Number</p>
                  <p className="text-gray-800">{farmer?.phone || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Email Address</p>
                  <p className="text-teal-600">{farmer?.email || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Alternate Contact</p>
                  <p className="text-gray-800">{farmer?.secondary_phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-800">Business Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Assigned Products</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(farmer?.product_list) && farmer.product_list.length > 0 ? farmer.product_list.map((item, index) => (
                      <span key={index} className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm">
                        {item.product_name}
                      </span>
                    )) : <span className="text-gray-500">No products assigned</span>}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Contact Person</p>
                  <p className="text-gray-800">{farmer?.contact_person || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-800">Location Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Region</p>
                  <p className="text-gray-800">{farmer?.city}, {farmer?.state}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Full Address</p>
                  <p className="text-gray-800">{farmer?.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

         
      </>
    </div>
  );
};

export default FarmerDetails;
