import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, TrendingUp, Package, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getThirdPartyById } from '../../../api/thirdPartyApi';
import { BASE_URL } from '../../../config/config';

const ThirdPartyDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [thirdParty, setThirdParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleBackClick = () => {
    navigate('/third-party');
  };

  useEffect(() => {
    const fetchThirdParty = async () => {
      try {
        setLoading(true);
        const response = await getThirdPartyById(id);
        setThirdParty(response.data);
      } catch (error) {
        console.error('Failed to fetch third party:', error);
        setError(error.message || 'Failed to fetch third party details');
      } finally {
        setLoading(false);
      }
    };

    fetchThirdParty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading third party details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => navigate('/third-party')}
            className="mt-4 px-4 py-2 bg-[#0D7C66] text-white rounded-lg hover:bg-[#0a6354] transition-colors"
          >
            Back to Third Parties
          </button>
        </div>
      </div>
    );
  }

  if (!thirdParty) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Third party not found</p>
          <button 
            onClick={() => navigate('/third-party')}
            className="mt-4 px-4 py-2 bg-[#0D7C66] text-white rounded-lg hover:bg-[#0a6354] transition-colors"
          >
            Back to Third Parties
          </button>
        </div>
      </div>
    );
  }

  // Transform API data to match component structure
  const transformedData = {
    id: thirdParty.tpid,
    name: thirdParty.third_party_name,
    registrationNumber: thirdParty.registration_number,
    phone: thirdParty.phone,
    email: thirdParty.email,
    secondaryPhone: thirdParty.secondary_phone,
    contactPerson: thirdParty.contact_person,
    dealingPerson: thirdParty.dealing_person,
    products: thirdParty.detailed_products?.map(product => product.product_name).join(', ') || 'No products assigned',
    productList: thirdParty.detailed_products || [],
    city: thirdParty.city,
    state: thirdParty.state,
    address: thirdParty.address,
    pinCode: thirdParty.pin_code,
    status: thirdParty.status,
    accountHolderName: thirdParty.account_holder_name,
    bankName: thirdParty.bank_name,
    accountNumber: thirdParty.account_number,
    ifscCode: thirdParty.IFSC_code,
    profileImage: thirdParty.profile_image,
    performance: thirdParty.performance || 'N/A',
    createdAt: thirdParty.createdAt,
    updatedAt: thirdParty.updatedAt
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Third Parties</span>
          </button>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button className="px-6 py-2.5 bg-[#0D7C66] text-white rounded-lg font-medium transition-colors shadow-sm">
          Personal Info
        </button>
        <button 
          onClick={() => navigate(`/third-party/${id}/orders`)}
          className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Order List
        </button>
        <button 
          onClick={() => navigate(`/third-party/${id}/payout`)}
          className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Payout
        </button>
      </div>

      <div className="rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {transformedData?.profileImage ? (
              <img 
                src={`${BASE_URL}${transformedData.profileImage}`} 
                alt={transformedData?.name || 'Third Party'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-teal-800 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">{transformedData?.name?.substring(0, 2).toUpperCase() || 'TP'}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{transformedData?.name || 'N/A'}</h2>
            <p className="text-gray-600 mb-2">Third Party ID: {transformedData?.registrationNumber || 'N/A'}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="text-red-500">🛒</span>
                Member since {new Date(transformedData?.createdAt).toLocaleDateString() || 'N/A'}
              </span>
              <span>•</span>
              <span>Last updated: {new Date(transformedData?.updatedAt).toLocaleDateString() || 'N/A'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-sm font-medium border border-teal-200">
              Third Party
            </span>
            <span className={`px-4 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${
              transformedData?.status === 'active' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                transformedData?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              {transformedData?.status === 'active' ? 'Active' : 'Inactive'}
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
              <p className="text-gray-800">{transformedData?.phone || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Email Address</p>
              <p className="text-teal-600">{transformedData?.email || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Alternate Contact</p>
              <p className="text-gray-800">{transformedData?.secondaryPhone || 'N/A'}</p>
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
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Products Supplied</p>
              <div className="flex flex-wrap gap-2">
                {transformedData?.productList && transformedData.productList.length > 0 ? 
                  transformedData.productList.map((product, index) => (
                    <span key={index} className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm">
                      {product.product_name}
                    </span>
                  )) : 
                  <span className="text-gray-500">No products assigned</span>
                }
              </div>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Contact Person</p>
              <p className="text-gray-800">{transformedData?.contactPerson || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Dealing Person</p>
              <p className="text-gray-800">{transformedData?.dealingPerson || 'N/A'}</p>
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
              <p className="text-gray-800">{transformedData?.city}, {transformedData?.state}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Full Address</p>
              <p className="text-gray-800">{transformedData?.address || 'N/A'}</p>
              <p className="text-gray-800">Pin Code: {transformedData?.pinCode || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ThirdPartyDetails;