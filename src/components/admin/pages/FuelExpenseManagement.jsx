import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ArrowLeft, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { getAllFuelExpenses, getFuelExpensesByDriverId, deleteFuelExpense } from '../../../api/fuelExpenseApi';
import { getAllDrivers } from '../../../api/driverApi';

const FuelExpenseManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [fuelExpenses, setFuelExpenses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(location.state?.driverId || '');
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    fetchFuelExpenses();
  }, [selectedDriverId]);

  const fetchDrivers = async () => {
    try {
      const response = await getAllDrivers();
      setDrivers(response.data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchFuelExpenses = async () => {
    try {
      setLoading(true);
      let response;
      if (selectedDriverId) {
        response = await getFuelExpensesByDriverId(selectedDriverId);
      } else {
        response = await getAllFuelExpenses();
      }

      console.log('Fuel Expenses API Response:', response);

      // Handle different response structures
      const expensesData = response.data?.data || response.data || [];
      console.log('Processed Expenses Data:', expensesData);

      setFuelExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error) {
      console.error('Error fetching fuel expenses:', error);
      // Show user-friendly error message if backend association error
      if (error.error && error.error.includes('association')) {
        console.warn('Backend database association error. Please contact the backend developer to fix the Driver-FuelExpense association.');
      }
      setFuelExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (expenseId, event) => {
    if (openDropdown === expenseId) {
      setOpenDropdown(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 128
      });
      setOpenDropdown(expenseId);
    }
  };

  const handleAction = (action, expense) => {
    if (action === 'view') {
      navigate(`/fuel-expenses/view/${expense.id}`);
    } else if (action === 'edit') {
      navigate(`/fuel-expenses/edit/${expense.id}`);
    } else if (action === 'delete') {
      setSelectedExpense(expense);
      setShowDeleteModal(true);
    }
    setOpenDropdown(null);
  };

  const handleDelete = async () => {
    try {
      await deleteFuelExpense(selectedExpense.id);
      await fetchFuelExpenses();
      setShowDeleteModal(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Error deleting fuel expense:', error);
      alert('Failed to delete fuel expense');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(selectedDriverId ? `/drivers/${selectedDriverId}` : '/drivers')}
            className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Driver Details</span>
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Fuel Expense Management
            {selectedDriverId && drivers.find(d => (d.id || d.did) == selectedDriverId)
              ? ` - ${drivers.find(d => (d.id || d.did) == selectedDriverId).driver_name}`
              : ''}
          </h1>
        </div>



        {/* Add Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate(selectedDriverId ? `/drivers/${selectedDriverId}/fuel-expenses` : '/drivers/1/fuel-expenses')}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Fuel Expense
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Vehicle Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Fuel Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Petrol Bunk</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Unit Price (₹)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Litre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Total (₹)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : fuelExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      {selectedDriverId ? 'No fuel expenses found for this driver' : 'No fuel expenses found'}
                    </td>
                  </tr>
                ) : (
                  fuelExpenses.map((expense, index) => (
                    <tr key={expense.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-6 py-4 text-sm text-gray-900">{expense.date}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.driver?.driver_name || drivers.find(d => d.id === expense.driver_id || d.did === expense.driver_id)?.driver_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.driver?.vehicle_number ||
                          drivers.find(d => d.id === expense.driver_id || d.did === expense.driver_id)?.vehicle_number ||
                          'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{expense.fuel_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{expense.petrol_bunk_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{parseFloat(expense.unit_price).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{expense.litre}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{parseFloat(expense.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={(event) => toggleDropdown(expense.id, event)}
                            className="text-[#6B8782] hover:text-[#0D5C4D] transition-colors p-1 hover:bg-[#F0F4F3] rounded"
                          >
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
            onClick={() => handleAction('view', fuelExpenses.find(e => e.id === openDropdown))}
            className="w-full text-left px-4 py-2 text-sm text-[#0D5C4D] hover:bg-[#F0F4F3] transition-colors flex items-center gap-2"
          >
            <Eye size={14} />
            View
          </button>
          <button
            onClick={() => handleAction('edit', fuelExpenses.find(e => e.id === openDropdown))}
            className="w-full text-left px-4 py-2 text-sm text-[#0D5C4D] hover:bg-[#F0F4F3] transition-colors flex items-center gap-2"
          >
            <Edit size={14} />
            Edit
          </button>
          <button
            onClick={() => handleAction('delete', fuelExpenses.find(e => e.id === openDropdown))}
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Fuel Expense</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this fuel expense record for {selectedExpense?.driver?.driver_name || 'this driver'}?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedExpense(null);
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

export default FuelExpenseManagement;