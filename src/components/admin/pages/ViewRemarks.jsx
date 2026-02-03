import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getRemarkById } from '../../../api/remarkApi';
import { toast } from 'react-toastify';

const ViewRemarks = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [remarkData, setRemarkData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRemark();
  }, [id]);

  const fetchRemark = async () => {
    try {
      setLoading(true);
      const response = await getRemarkById(id);
      setRemarkData(response.data);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch remark');
      navigate('/remarks-management');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="text-center text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!remarkData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/remarks-management')}
            className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Remarks</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Remark Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Date</label>
              <div className="text-sm font-medium text-gray-900">{remarkData.date}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Driver Name</label>
              <div className="text-sm font-medium text-gray-900">{remarkData.driver?.driver_name || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Vehicle Number</label>
              <div className="text-sm font-medium text-gray-900">{remarkData.vehicle_number || remarkData.driver?.vehicle_number || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Remarks</label>
              <div className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{remarkData.remarks}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewRemarks;
