import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFarmerById } from '../../../api/farmerApi';
import { getVegetableHistoryByFarmer } from '../../../api/vegetableAvailabilityApi';

const VegetableHistory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [farmer, setFarmer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [farmerRes, historyRes] = await Promise.all([
          getFarmerById(id),
          getVegetableHistoryByFarmer(id)
        ]);
        setFarmer(farmerRes.data);
        const data = historyRes?.data;
        setHistory(Array.isArray(data?.vegetable_history) ? data.vegetable_history : []);
      } catch (error) {
        console.error('Failed to fetch vegetable history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/farmers/${id}`)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Farmer Details</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => navigate(`/farmers/${id}`)}
          className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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
        <button className="px-6 py-2.5 bg-[#0D7C66] text-white rounded-lg font-medium transition-colors shadow-sm">
          Vegetable History
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Vegetable History - {farmer?.farmer_name || 'Farmer'}
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vegetable Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">From Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">To Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <tr key={item.availability_id + '-' + index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{item.vegetable_name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.from_date ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.to_date ?? '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                      No vegetable history found for this farmer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VegetableHistory;
