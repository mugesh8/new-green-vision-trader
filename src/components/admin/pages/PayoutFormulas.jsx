import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PayoutFormulas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('labour');
  const [normalRate, setNormalRate] = useState(150);
  const [heavyRate, setHeavyRate] = useState(200);

  const normalOvertimeRate = (normalRate * 1.5).toFixed(2);
  const heavyOvertimeRate = (heavyRate * 1.5).toFixed(2);

  const handleSave = () => {
    //console.log('Saving payout formulas...', { normalRate, heavyRate });
    alert('Payout formulas saved successfully!');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to default values?')) {
      setNormalRate(150);
      setHeavyRate(200);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Tabs */}
      <div className="px-6 sm:px-8 py-4">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => navigate('/settings')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              location.pathname === '/settings' 
                ? 'bg-[#0D7C66] text-white' 
                : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'
            }`}
          >
            Packing Inventory
          </button>
          <button 
            onClick={() => navigate('/settings/airport')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              location.pathname === '/settings/airport' 
                ? 'bg-[#0D7C66] text-white' 
                : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'
            }`}
          >
            Airport Locations
          </button>
          <button 
            onClick={() => navigate('/settings/payout-formulas')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              location.pathname === '/settings/payout-formulas' 
                ? 'bg-[#0D7C66] text-white' 
                : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'
            }`}
          >
            Payout Formulas
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 sm:p-8">

            {/* Labour Payout Content */}
            {activeTab === 'labour' && (
              <div>
                {/* Title and Description */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Labour Payout Configuration
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configure category-based hourly rates for labour payments
                  </p>
                </div>

                {/* Base Formula */}
                <div className="mb-8 p-5 border-2 border-emerald-500 rounded-lg bg-emerald-50">
                  <div className="mb-2">
                    <span className="text-sm font-semibold text-indigo-700">Base Formula:</span>
                  </div>
                  <div className="font-mono text-sm text-gray-800 mb-2">
                    Labour Payout = Hours Worked × Category Hourly Rate + Overtime
                  </div>
                  <div className="text-xs text-gray-600">
                    Note: Overtime is calculated at 1.5x the hourly rate for hours beyond standard working hours (8 hours/day).
                  </div>
                </div>

                {/* Save and Reset Buttons */}
                <div className="flex justify-end gap-3 mb-6">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors"
                  >
                    Save
                  </button>
                </div>

                {/* Category-Based Hourly Rates */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Category-Based Hourly Rates
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Normal Work Card */}
                    <div className="border-2 border-emerald-500 rounded-lg overflow-hidden">
                      {/* Card Header */}
                      <div className="bg-emerald-500 px-6 py-4 flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-white">Normal Work</h4>
                        <button className="px-4 py-1.5 bg-white text-emerald-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
                          Edit
                        </button>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 bg-white">
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Tasks:</span> Sorting, Cleaning, Basic Packing
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Hourly Rate */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Hourly Rate (₹/hour):
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={normalRate}
                                onChange={(e) => setNormalRate(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 text-center text-2xl font-bold text-gray-900 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50"
                                min="0"
                                step="10"
                              />
                            </div>
                          </div>

                          {/* Overtime Rate */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Overtime Rate (₹/hour):
                            </label>
                            <div className="px-4 py-3 text-center text-xl font-semibold text-emerald-600 border-2 border-emerald-300 rounded-lg bg-emerald-50">
                              ₹{normalOvertimeRate} (1.5x)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Heavy Work Card */}
                    <div className="border-2 border-orange-400 rounded-lg overflow-hidden">
                      {/* Card Header */}
                      <div className="bg-orange-400 px-6 py-4 flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-white">Heavy Work</h4>
                        <button className="px-4 py-1.5 bg-white text-orange-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
                          Edit
                        </button>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 bg-white">
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Tasks:</span> Loading, Unloading, Heavy Lifting, Transport
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Hourly Rate */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Hourly Rate (₹/hour):
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={heavyRate}
                                onChange={(e) => setHeavyRate(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 text-center text-2xl font-bold text-gray-900 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-yellow-50"
                                min="0"
                                step="10"
                              />
                            </div>
                          </div>

                          {/* Overtime Rate */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Overtime Rate (₹/hour):
                            </label>
                            <div className="px-4 py-3 text-center text-xl font-semibold text-orange-600 border-2 border-yellow-300 rounded-lg bg-yellow-50">
                              ₹{heavyOvertimeRate} (1.5x)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Farmer Payout Content (Placeholder) */}
            {activeTab === 'farmer' && (
              <div className="py-12 text-center">
                <div className="max-w-md mx-auto">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Farmer Payout Configuration</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure farmer payout formulas and rates here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutFormulas;