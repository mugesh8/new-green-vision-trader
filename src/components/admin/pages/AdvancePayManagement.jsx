import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ArrowLeft, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { getAllAdvancePays, getAdvancePaysByDriverId, deleteAdvancePay } from '../../../api/advancePayApi';

const AdvancePayManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const driverId = location.state?.driverId ? String(location.state.driverId) : null;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPay, setSelectedPay] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [advancePayData, setAdvancePayData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvancePays();
  }, [driverId]);

  const fetchAdvancePays = async () => {
    try {
      setLoading(true);
      const response = driverId
        ? await getAdvancePaysByDriverId(driverId)
        : await getAllAdvancePays();
      if (response.success) {
        const transformed = response.data.map(item => ({
          id: item.id,
          date: item.date,
          driverName:
            item.advancePayDriver?.driver_name ||
            item.driver?.driver_name ||
            item.driverName ||
            'N/A',
          driverId: item.driver_id,
          amount: parseFloat(item.advance_amount)
        }));
        const filtered = driverId
          ? transformed.filter(p => String(p.driverId) === driverId)
          : transformed;
        setAdvancePayData(filtered);
      }
    } catch (error) {
      console.error('Error fetching advance pays:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (payId, event) => {
    if (openDropdown === payId) {
      setOpenDropdown(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 128
      });
      setOpenDropdown(payId);
    }
  };

  const handleAction = (action, pay) => {
    if (action === 'view') {
      navigate(`/advance-pay/view/${pay.id}`);
    } else if (action === 'edit') {
      navigate(`/advance-pay/edit/${pay.id}`);
    } else if (action === 'delete') {
      setSelectedPay(pay);
      setShowDeleteModal(true);
    }
    setOpenDropdown(null);
  };

  const handleDelete = async () => {
    try {
      await deleteAdvancePay(selectedPay.id);
      await fetchAdvancePays();
      setShowDeleteModal(false);
      setSelectedPay(null);
    } catch (error) {
      console.error('Error deleting advance pay:', error);
      alert('Failed to delete advance pay');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(driverId ? `/drivers/${driverId}` : '/drivers')}
            className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Driver Details</span>
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Advance Pay Management</h1>
        </div>

        {/* Add Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate(driverId ? `/drivers/${driverId}/advance-pay` : '/drivers/1/advance-pay')}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Advance Pay
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#D4F4E8]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Driver Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Advance Amount (₹)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : advancePayData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No advance pay records found</td>
                  </tr>
                ) : advancePayData.map((data, index) => (
                  <tr key={data.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4 text-sm text-gray-900">{data.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{data.driverName}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{data.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={(event) => toggleDropdown(data.id, event)}
                          className="text-[#6B8782] hover:text-[#0D5C4D] transition-colors p-1 hover:bg-[#F0F4F3] rounded"
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

      {/* Dropdown Menu */}
      {openDropdown && (
        <div 
          ref={dropdownRef}
          className="fixed w-32 bg-white rounded-lg shadow-lg border border-[#D0E0DB] py-1 z-[100]"
          style={{ 
            top: `${dropdownPosition.top}px`, 
            left: `${dropdownPosition.left}px` 
          }}
        >
          <button
            onClick={() => handleAction('view', advancePayData.find(p => p.id === openDropdown))}
            className="w-full text-left px-4 py-2 text-sm text-[#0D5C4D] hover:bg-[#F0F4F3] transition-colors flex items-center gap-2"
          >
            <Eye size={14} />
            View
          </button>
          <button
            onClick={() => handleAction('edit', advancePayData.find(p => p.id === openDropdown))}
            className="w-full text-left px-4 py-2 text-sm text-[#0D5C4D] hover:bg-[#F0F4F3] transition-colors flex items-center gap-2"
          >
            <Edit size={14} />
            Edit
          </button>
          <button
            onClick={() => handleAction('delete', advancePayData.find(p => p.id === openDropdown))}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[#F0F4F3] transition-colors flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Advance Pay</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this advance pay record for {selectedPay?.driverName}?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPay(null);
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

export default AdvancePayManagement;