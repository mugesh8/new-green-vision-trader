import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ArrowLeft, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { getLabourRemarksByLabourId, deleteLabourRemark } from '../../../api/labourRemarkApi';
import { toast } from 'react-toastify';

const LabourRemarksManagement = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const [remarksData, setRemarksData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchRemarks();
  }, [id]);

  const fetchRemarks = async () => {
    try {
      setLoading(true);
      const response = await getLabourRemarksByLabourId(id);
      setRemarksData(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch remarks');
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (remarkId, event) => {
    if (openDropdown === remarkId) {
      setOpenDropdown(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 128
      });
      setOpenDropdown(remarkId);
    }
  };

  const handleAction = (action, remark) => {
    if (action === 'edit') {
      navigate(`/labour/${id}/labour-remarks/edit/${remark.id}`);
    } else if (action === 'delete') {
      setSelectedRemark(remark);
      setShowDeleteModal(true);
    }
    setOpenDropdown(null);
  };

  const handleDelete = async () => {
    try {
      await deleteLabourRemark(selectedRemark.id);
      toast.success('Remark deleted successfully');
      fetchRemarks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete remark');
    } finally {
      setShowDeleteModal(false);
      setSelectedRemark(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/labour')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Labour Management</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => navigate(`/labour/${id}`)}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            Labour Details
          </button>
          <button
            onClick={() => navigate(`/labour/${id}/daily-works`)}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            Daily Works
          </button>
          <button
            onClick={() => navigate(`/labour/${id}/daily-payout`)}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            Daily Payout
          </button>
          <button
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap bg-teal-600 text-white shadow-md"
          >
            Labour Remarks
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Labour Remarks</h1>
          <button
            onClick={() => navigate(`/labour/${id}/labour-remarks/add`)}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Remark
          </button>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Remarks</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : remarksData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No remarks found</td>
                  </tr>
                ) : remarksData.map((data, index) => (
                  <tr key={data.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4 text-sm text-gray-900">{data.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{data.remarks}</td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={(event) => toggleDropdown(data.id, event)}
                          className="text-gray-600 hover:text-teal-600 transition-colors p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openDropdown && (
        <div 
          ref={dropdownRef}
          className="fixed w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[100]"
          style={{ 
            top: `${dropdownPosition.top}px`, 
            left: `${dropdownPosition.left}px` 
          }}
        >
          <button
            onClick={() => handleAction('edit', remarksData.find(r => r.id === openDropdown))}
            className="w-full text-left px-4 py-2 text-sm text-teal-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Edit size={14} />
            Edit
          </button>
          <button
            onClick={() => handleAction('delete', remarksData.find(r => r.id === openDropdown))}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Remark</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this remark?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRemark(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourRemarksManagement;