import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getAdvancePayById } from '../../../api/advancePayApi';

const ViewAdvancePay = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [payData, setPayData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvancePay();
  }, [id]);

  const fetchAdvancePay = async () => {
    try {
      setLoading(true);
      const response = await getAdvancePayById(id);
      if (response.success) {
        const driverIdNum = response.data.driver_id ?? response.data.driver?.did ?? response.data.driver?.id;
        setPayData({
          id: response.data.id,
          date: response.data.date,
          driverName: response.data.driver?.driver_name || 'N/A',
          driverId: response.data.driver?.driver_id || 'N/A',
          driverIdNum: driverIdNum != null ? String(driverIdNum) : null,
          phoneNumber: response.data.driver?.phone_number || 'N/A',
          vehicleNumber: response.data.driver?.vehicle_number || 'N/A',
          amount: parseFloat(response.data.advance_amount)
        });
      }
    } catch (error) {
      console.error('Error fetching advance pay:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/advance-pay-management', payData?.driverIdNum ? { state: { driverId: payData.driverIdNum } } : undefined)}
            className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Advance Pay</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Advance Pay Details</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : payData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Date</label>
                <div className="text-sm font-medium text-gray-900">{payData.date}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Driver Name</label>
                <div className="text-sm font-medium text-gray-900">{payData.driverName}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Driver ID</label>
                <div className="text-sm font-medium text-gray-900">{payData.driverId}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Phone Number</label>
                <div className="text-sm font-medium text-gray-900">{payData.phoneNumber}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Vehicle Number</label>
                <div className="text-sm font-medium text-gray-900">{payData.vehicleNumber}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Advance Amount</label>
                <div className="text-lg font-bold text-[#0D7C66]">₹{payData.amount.toFixed(2)}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Advance pay not found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAdvancePay;