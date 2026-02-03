import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';
import { getAllDriverRates, createDriverRate, updateDriverRate, deleteDriverRate } from '../../../api/driverRateApi';

const DriverRateManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const [driverRates, setDriverRates] = useState([]);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 7;
  const [formData, setFormData] = useState({ deliveryType: 'LOCAL GRADE ORDER', amount: '', kilometer: '', status: 'Active' });

  useEffect(() => {
    fetchDriverRates();
  }, []);

  const fetchDriverRates = async () => {
    try {
      setLoading(true);
      const response = await getAllDriverRates();
      if (response.success) {
        setDriverRates(response.data);
      }
    } catch (error) {
      console.error('Error fetching driver rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rate) => {
    setSelectedRate(rate);
    setFormData({ deliveryType: rate.deliveryType, amount: rate.amount, kilometers: rate.kilometers ?? '', status: rate.status });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id, deliveryType) => {
    setDeleteModal({ isOpen: true, id, name: deliveryType });
  };

  const confirmDelete = async () => {
    try {
      await deleteDriverRate(deleteModal.id);
      await fetchDriverRates();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting driver rate:', error);
      alert('Failed to delete driver rate');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createDriverRate(formData);
      await fetchDriverRates();
      setIsAddModalOpen(false);
      setFormData({ deliveryType: 'LOCAL GRADE ORDER', amount: '', kilometers: '', status: 'Active' });
    } catch (error) {
      console.error('Error creating driver rate:', error);
      alert('Failed to create driver rate');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const rateId = selectedRate.drid || selectedRate.id;
      await updateDriverRate(rateId, formData);
      await fetchDriverRates();
      setIsEditModalOpen(false);
      setFormData({ deliveryType: 'LOCAL GRADE ORDER', amount: '', kilometers: '', status: 'Active' });
      setSelectedRate(null);
    } catch (error) {
      console.error('Error updating driver rate:', error);
      alert('Failed to update driver rate');
    } finally {
      setLoading(false);
    }
  };

  const filteredRates = driverRates.filter(rate =>
    rate.deliveryType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRates.length / itemsPerPage);
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
                <input type="text" placeholder="Search driver rates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
              </div>
              <button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"><span className="text-lg">+</span>Add Driver Rate</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Delivery Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount (₹)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kilometer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedRates.map((rate) => (
                  <tr key={rate.drid || rate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{rate.deliveryType}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{rate.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rate.kilometers ?? '—'}</td>
                    <td className="px-6 py-4 text-sm"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${rate.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{rate.status}</span></td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(rate)} className="px-4 py-1.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Edit</button>
                        <button onClick={() => handleDelete(rate.drid || rate.id, rate.deliveryType)} className="px-4 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <h2 className="text-xl font-semibold text-gray-900">Add Driver Rate</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Delivery Type</label>
                <select required value={formData.deliveryType} onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="LOCAL GRADE ORDER">LOCAL GRADE ORDER</option>
                  <option value="BOX ORDER">BOX ORDER</option>
                  <option value="Both Types">Both Types</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter amount" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilometer</label>
                <input type="number" value={formData.kilometers} onChange={(e) => setFormData({ ...formData, kilometers: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter kilometers" />
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
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium disabled:opacity-50">{loading ? 'Adding...' : 'Add Rate'}</button>
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
        title="Delete Driver Rate"
        message={`Are you sure you want to delete "${deleteModal.name}" driver rate? This action cannot be undone.`}
      />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edit Driver Rate</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Delivery Type</label>
                <select required value={formData.deliveryType} onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="LOCAL GRADE ORDER">LOCAL GRADE ORDER</option>
                  <option value="BOX ORDER">BOX ORDER</option>
                  <option value="Both Types">Both Types</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilometer</label>
                <input type="number" value={formData.kilometers} onChange={(e) => setFormData({ ...formData, kilometers: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter kilometers" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium disabled:opacity-50">{loading ? 'Updating...' : 'Update Rate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverRateManagement;