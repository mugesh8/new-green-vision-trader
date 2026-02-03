import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFarmerById } from '../../../api/farmerApi';
import { createVegetableAvailability, getVegetableAvailabilityByFarmer, updateVegetableAvailability, deleteVegetableAvailability } from '../../../api/vegetableAvailabilityApi';

const VegetableAvailability = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [farmer, setFarmer] = useState(null);
  const [farmerProducts, setFarmerProducts] = useState([]); // Only this farmer's products (from product_list)
  const [availabilities, setAvailabilities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    vegetable_name: '',
    from_date: '',
    to_date: '',
    status: 'Available'
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [farmerRes, availabilityRes] = await Promise.all([
        getFarmerById(id),
        getVegetableAvailabilityByFarmer(id)
      ]);

      const farmerData = farmerRes.data;
      setFarmer(farmerData);

      // Parse farmer's product_list (JSON string like "[{\"pid\":6,\"product_name\":\"...\"}]")
      let parsed = [];
      if (farmerData?.product_list) {
        try {
          const raw = farmerData.product_list;
          parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!Array.isArray(parsed)) parsed = [];
        } catch (e) {
          console.warn('Failed to parse farmer product_list:', e);
        }
      }
      setFarmerProducts(parsed);

      setAvailabilities(Array.isArray(availabilityRes.data) ? availabilityRes.data : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setFarmerProducts([]);
      setAvailabilities([]);
    }
  };

  const handleAdd = () => {
    setModalMode('add');
    setFormData({ vegetable_name: '', from_date: '', to_date: '', status: 'Available' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    setFormData({
      vegetable_name: item.vegetable_name,
      from_date: item.from_date,
      to_date: item.to_date,
      status: item.status
    });
    setShowModal(true);
  };

  const handleView = (item) => {
    setModalMode('view');
    setSelectedItem(item);
    setFormData({
      vegetable_name: item.vegetable_name,
      from_date: item.from_date,
      to_date: item.to_date,
      status: item.status
    });
    setShowModal(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this availability?')) {
      try {
        await deleteVegetableAvailability(itemId);
        fetchData();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        farmer_id: id,
        farmer_name: farmer?.farmer_name,
        ...formData
      };

      if (modalMode === 'add') {
        await createVegetableAvailability(data);
      } else if (modalMode === 'edit') {
        await updateVegetableAvailability(selectedItem.id, data);
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  if (!farmer) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/farmers/${id}`)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Farmer Details</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => navigate(`/farmers/${id}`)}
          className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Personal Info
        </button>
        <button
          onClick={() => navigate(`/farmers/${id}/orders`)}
          className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Order List
        </button>
        <button
          onClick={() => navigate(`/farmers/${id}/payout`)}
          className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Payout
        </button>
        <button className="px-6 py-2.5 bg-[#0D7C66] text-white rounded-lg font-medium transition-colors shadow-sm">
          Vegetable Availability
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Vegetable Availability - {farmer?.farmer_name}</h2>
          <button
            onClick={handleAdd}
            disabled={farmerProducts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D7C66] text-white rounded-lg hover:bg-[#0a6352] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Add Availability
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vegetable Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">From Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">To Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {availabilities.length > 0 ? availabilities.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">{item.vegetable_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.from_date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.to_date}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'Available'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-teal-600 hover:bg-teal-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No availability records found. Click "Add Availability" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {modalMode === 'add' ? 'Add' : modalMode === 'edit' ? 'Edit' : 'View'} Vegetable Availability
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vegetable Name</label>
                  <select
                    value={formData.vegetable_name}
                    onChange={(e) => setFormData({ ...formData, vegetable_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    disabled={modalMode === 'view'}
                  >
                    <option value="">
                      {farmerProducts.length === 0 ? 'No products assigned to this farmer' : 'Select Vegetable'}
                    </option>
                    {farmerProducts.map((product) => (
                      <option key={product.pid} value={product.product_name}>
                        {product.product_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={formData.from_date}
                    onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    disabled={modalMode === 'view'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={formData.to_date}
                    onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    disabled={modalMode === 'view'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    disabled={modalMode === 'view'}
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#0D7C66] text-white rounded-lg hover:bg-[#0a6352] transition-colors"
                  >
                    {modalMode === 'add' ? 'Add' : 'Update'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VegetableAvailability;