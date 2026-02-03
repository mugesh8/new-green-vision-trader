import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';
import { getAllLabourRates, createLabourRate, updateLabourRate, deleteLabourRate } from '../../../api/labourRateApi';

const LabourRateManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const [labourRates, setLabourRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemsPerPage = 7;
  const [formData, setFormData] = useState({ labourType: 'Normal', amount: '', status: 'Active' });

  useEffect(() => {
    fetchLabourRates();
  }, []);

  const fetchLabourRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllLabourRates();
      const rates = Array.isArray(response) ? response : (response?.data || []);
      setLabourRates(rates);
    } catch (error) {
      console.error('Error fetching labour rates:', error);
      setError('Failed to load labour rates');
      // Set empty array on error
      setLabourRates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rate) => {
    setSelectedRate(rate);
    setFormData({ labourType: rate.labourType, amount: rate.amount.toString(), status: rate.status });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRate(null);
    setFormData({ labourType: 'Normal', amount: '', status: 'Active' });
  };

  const handleDelete = (rate, labourType) => {
    // Try multiple possible ID field names
    const rateId = rate.lrid || rate._id || rate.id;
    setDeleteModal({ isOpen: true, id: rateId, name: labourType });
  };

  const confirmDelete = async () => {
    try {
      await deleteLabourRate(deleteModal.id);
      await fetchLabourRates();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting labour rate:', error);
      alert(error.message || 'Failed to delete labour rate. Please try again.');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        labourType: formData.labourType,
        amount: parseFloat(formData.amount),
        status: formData.status
      };
      await createLabourRate(data);
      await fetchLabourRates();
      setIsAddModalOpen(false);
      setFormData({ labourType: 'Normal', amount: '', status: 'Active' });
    } catch (error) {
      console.error('Error creating labour rate:', error);
      alert(error.message || 'Failed to create labour rate. Please try again.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        labourType: formData.labourType,
        amount: parseFloat(formData.amount),
        status: formData.status
      };
      // Try multiple possible ID field names
      const rateId = selectedRate.lrid || selectedRate._id || selectedRate.id;
      if (!rateId) {
        console.error('Rate object:', selectedRate);
        alert('Error: Rate ID not found. Please check the console for details and refresh the page.');
        return;
      }
      await updateLabourRate(rateId, data);
      await fetchLabourRates();
      setIsEditModalOpen(false);
      setSelectedRate(null);
      setFormData({ labourType: 'Normal', amount: '', status: 'Active' });
    } catch (error) {
      console.error('Error updating labour rate:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update labour rate. Please try again.';
      alert(errorMessage);
    }
  };

  const filteredRates = labourRates.filter(rate =>
    rate.labourType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const _totalPages = Math.ceil(filteredRates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRates = filteredRates.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tabs */}
      <div className="px-6 sm:px-8 py-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/settings')} className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/settings' ? 'bg-[#0D7C66] text-white' : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'}`}>Inventory Management</button>
          <button onClick={() => navigate('/settings/inventory-company')} className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/settings/inventory-company' ? 'bg-[#0D7C66] text-white' : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'}`}>Inventory Company</button>
          <button onClick={() => navigate('/settings/airport')} className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/settings/airport' ? 'bg-[#0D7C66] text-white' : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'}`}>Airport Locations</button>
          <button onClick={() => navigate('/settings/petroleum')} className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/settings/petroleum' ? 'bg-[#0D7C66] text-white' : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'}`}>Petroleum Management</button>
          <button onClick={() => navigate('/settings/labour-rate')} className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/settings/labour-rate' ? 'bg-[#0D7C66] text-white' : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'}`}>Labour Rate</button>
          <button onClick={() => navigate('/settings/driver-rate')} className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/settings/driver-rate' ? 'bg-[#0D7C66] text-white' : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'}`}>Driver Rate</button>
          <button onClick={() => navigate('/settings/customers')} className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/settings/customers' ? 'bg-[#0D7C66] text-white' : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'}`}>Customers</button>
          {/* <button onClick={() => navigate('/settings/payout-formulas')} className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/settings/payout-formulas' ? 'bg-[#0D7C66] text-white' : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'}`}>Payout Formulas</button> */}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search labour rates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
              <button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"><span className="text-lg">+</span>Add Labour Rate</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Labour Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount (₹)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      Loading labour rates...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : paginatedRates.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No labour rates found
                    </td>
                  </tr>
                ) : (
                  paginatedRates.map((rate) => {
                    const rateId = rate.lrid || rate._id || rate.id;
                    return (
                      <tr key={rateId || rate.labourType} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{rate.labourType}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">₹{rate.amount}</td>
                        <td className="px-6 py-4 text-sm"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${rate.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{rate.status}</span></td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(rate)} className="px-4 py-1.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Edit</button>
                            <button onClick={() => handleDelete(rate, rate.labourType)} className="px-4 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Add Labour Rate</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labour Type</label>
                <select required value={formData.labourType} onChange={(e) => setFormData({ ...formData, labourType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="Normal">Normal</option>
                  <option value="Medium">Medium</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter amount" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium">Add Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Labour Rate"
        message={`Are you sure you want to delete "${deleteModal.name}" labour rate? This action cannot be undone.`}
      />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edit Labour Rate</h2>
              <button onClick={handleCloseEditModal} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labour Type</label>
                <select required value={formData.labourType} onChange={(e) => setFormData({ ...formData, labourType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="Normal">Normal</option>
                  <option value="Medium">Medium</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseEditModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium">Update Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourRateManagement;