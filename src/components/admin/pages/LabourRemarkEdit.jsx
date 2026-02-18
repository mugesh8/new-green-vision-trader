import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getLabourRemarkById, updateLabourRemark } from '../../../api/labourRemarkApi';
import { toast } from 'react-toastify';

const LabourRemarkEdit = () => {
  const navigate = useNavigate();
  const { id, remarkId } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    labour_id: id,
    date: '',
    remarks: ''
  });

  useEffect(() => {
    fetchRemark();
  }, [remarkId]);

  const fetchRemark = async () => {
    try {
      setFetching(true);
      const response = await getLabourRemarkById(remarkId);
      const remark = response.data;
      setFormData({
        labour_id: remark.labour_id || id,
        date: remark.date || '',
        remarks: remark.remarks || ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch remark');
      navigate(`/labour/${id}/labour-remarks`);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateLabourRemark(remarkId, formData);
      toast.success('Remark updated successfully');
      navigate(`/labour/${id}/labour-remarks`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update remark');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/labour/${id}/labour-remarks`)}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Remarks</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Labour Remark</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Enter remarks"
                rows="6"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => navigate(`/labour/${id}/labour-remarks`)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Remark'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LabourRemarkEdit;