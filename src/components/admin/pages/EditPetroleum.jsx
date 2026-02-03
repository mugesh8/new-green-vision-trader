import React, { useState } from 'react';

const EditPetroleum = ({ item, onClose, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    name: item.name,
    location: item.location,
    status: item.status
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Petrol bunk name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length === 0) {
      onUpdate(formData);
      onClose();
    } else {
      setErrors(newErrors);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this petrol bunk?')) {
      onDelete(item.pbid);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-emerald-700">Edit Petrol Bunk</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Petrol Bunk Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Petrol Bunk Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location"
                className={`w-full px-4 py-2.5 border ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm`}
              />
              {errors.location && (
                <p className="mt-1 text-xs text-red-500">{errors.location}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPetroleum;
