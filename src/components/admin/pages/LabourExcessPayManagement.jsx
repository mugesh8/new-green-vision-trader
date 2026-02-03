import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, ArrowLeft } from 'lucide-react';
import { getAllLabourExcessPay, deleteLabourExcessPay } from '../../../api/labourExcessPayApi';

const LabourExcessPayManagement = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const [excessPayRecords, setExcessPayRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await getAllLabourExcessPay();
      const records = response.data.map(record => ({
        id: record.id,
        date: record.date,
        labourName: record.labour?.full_name || 'N/A',
        excessHours: record.excess_hours.toString(),
        amount: record.amount.toString()
      }));
      setExcessPayRecords(records);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (recordId, event) => {
    if (openDropdown === recordId) {
      setOpenDropdown(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 128
      });
      setOpenDropdown(recordId);
    }
  };

  const handleAction = async (action, recordId) => {
    if (action === 'edit') {
      navigate(`/labour/excess-pay/${recordId}/edit`);
    } else if (action === 'delete') {
      if (window.confirm('Are you sure you want to delete this record?')) {
        try {
          await deleteLabourExcessPay(recordId);
          fetchRecords();
        } catch (error) {
          console.error('Error deleting record:', error);
          alert('Failed to delete record');
        }
      }
    }
    setOpenDropdown(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/labour')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Labour Management</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0D5C4D] mb-1">Labour Excess Pay</h1>
          <p className="text-sm text-[#6B8782]">Manage labour excess pay records</p>
        </div>
        <button 
          onClick={() => navigate('/labour/excess-pay/add')}
          className="bg-[#0D7C66] hover:bg-[#0a6354] text-white px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Excess Pay
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[#D4F4E8]">
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Date</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Labour Name</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Excess Hours</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Amount</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[#6B8782]">
                    Loading records...
                  </td>
                </tr>
              ) : excessPayRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[#6B8782]">
                    No excess pay records found
                  </td>
                </tr>
              ) : excessPayRecords.map((record, index) => (
                <tr 
                  key={record.id} 
                  className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'
                  }`}
                >
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm text-[#0D5C4D]">{record.date}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm font-medium text-[#0D5C4D]">{record.labourName}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm text-[#0D5C4D]">{record.excessHours} hrs</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm font-semibold text-[#0D5C4D]">₹{record.amount}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(record.id, e);
                      }}
                      className="text-[#6B8782] hover:text-[#0D5C4D] transition-colors p-1 hover:bg-[#F0F4F3] rounded"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            onClick={() => handleAction('edit', openDropdown)}
            className="w-full text-left px-4 py-2 text-sm text-[#0D5C4D] hover:bg-[#F0F4F3] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleAction('delete', openDropdown)}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[#F0F4F3] transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default LabourExcessPayManagement;
