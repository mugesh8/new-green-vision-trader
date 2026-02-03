import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getFuelExpenseById } from '../../../api/fuelExpenseApi';

const ViewFuelExpense = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFuelExpense();
  }, [id]);

  const fetchFuelExpense = async () => {
    try {
      setLoading(true);
      const response = await getFuelExpenseById(id);
      setExpense(response.data);
    } catch (error) {
      console.error('Error fetching fuel expense:', error);
      alert('Failed to load fuel expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/fuel-expense-management')}
            className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Fuel Expenses</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Fuel Expense Details</h2>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : expense ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Date</label>
                <div className="text-sm font-medium text-gray-900">{expense.date}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Driver Name</label>
                <div className="text-sm font-medium text-gray-900">{expense.driver?.driver_name || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Vehicle Number</label>
                <div className="text-sm font-medium text-gray-900">{expense.driver?.vehicle_number || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Fuel Type</label>
                <div className="text-sm font-medium text-gray-900">{expense.fuel_type}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Petrol Bunk</label>
                <div className="text-sm font-medium text-gray-900">{expense.petrol_bunk_name}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Unit Price</label>
                <div className="text-sm font-medium text-gray-900">₹{parseFloat(expense.unit_price).toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Litre</label>
                <div className="text-sm font-medium text-gray-900">{expense.litre}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Total Amount</label>
                <div className="text-lg font-bold text-[#0D7C66]">₹{parseFloat(expense.total_amount).toFixed(2)}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Fuel expense not found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewFuelExpense;