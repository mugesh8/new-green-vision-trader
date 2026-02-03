import React, { useState } from 'react';
import { Search, X, Info } from 'lucide-react';

const EditRolesPermissionsModal = ({ isOpen, onClose, userName = 'Priya Sharma', userRole = 'Supervisor' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modules, setModules] = useState([
    {
      id: 1,
      name: 'Dashboard',
      description: 'View and manage dashboard analytics',
      enabled: true,
      permissions: {
        add: true,
        view: true,
        edit: false,
        delete: false
      }
    },
    {
      id: 2,
      name: 'Vendors',
      description: 'Manage vendor information and relationships',
      enabled: true,
      permissions: {
        add: true,
        view: true,
        edit: true,
        delete: false
      }
    },
    {
      id: 3,
      name: 'Farmers',
      description: 'Manage farmer profiles and produce details',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        edit: false,
        delete: false
      }
    },
    {
      id: 4,
      name: 'Drivers',
      description: 'Manage driver information and assignments',
      enabled: true,
      permissions: {
        add: true,
        view: true,
        edit: true,
        delete: false
      }
    },
    {
      id: 5,
      name: 'Suppliers',
      description: 'Manage supplier relationships and inventory',
      enabled: true,
      permissions: {
        add: true,
        view: true,
        edit: true,
        delete: true
      }
    },
    {
      id: 6,
      name: 'Third Party',
      description: 'Manage third party service providers',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        edit: false,
        delete: false
      }
    },
    {
      id: 7,
      name: 'Labour',
      description: 'Manage labour workforce and attendance',
      enabled: true,
      permissions: {
        add: true,
        view: true,
        edit: true,
        delete: false
      }
    },
    {
      id: 8,
      name: 'Orders',
      description: 'Process and track orders from customers',
      enabled: true,
      permissions: {
        add: false,
        view: true,
        edit: true,
        delete: false
      }
    },
    {
      id: 9,
      name: 'Order Assign',
      description: 'Assign and manage order allocations',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        edit: false,
        delete: false
      }
    },
    {
      id: 10,
      name: 'Payouts',
      description: 'Manage payment processing and disbursements',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        edit: false,
        delete: false
      }
    },
    {
      id: 11,
      name: 'Reports',
      description: 'Generate and view system reports',
      enabled: true,
      permissions: {
        add: false,
        view: true,
        edit: false,
        delete: false
      }
    },
    {
      id: 12,
      name: 'Roles And Permission',
      description: 'Manage user roles and access permissions',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        edit: false,
        delete: false
      }
    },
    {
      id: 13,
      name: 'Notification',
      description: 'Manage system notifications and alerts',
      enabled: true,
      permissions: {
        add: true,
        view: true,
        edit: false,
        delete: true
      }
    },
    {
      id: 14,
      name: 'Settings',
      description: 'Configure system settings and preferences',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        edit: false,
        delete: false
      }
    }
  ]);

  const toggleModule = (moduleId) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        const newEnabled = !module.enabled;
        return {
          ...module,
          enabled: newEnabled,
          permissions: newEnabled ? module.permissions : {
            add: false,
            view: false,
            edit: false,
            delete: false
          }
        };
      }
      return module;
    }));
  };

  const togglePermission = (moduleId, permission) => {
    setModules(modules.map(module => {
      if (module.id === moduleId && module.enabled) {
        return {
          ...module,
          permissions: {
            ...module.permissions,
            [permission]: !module.permissions[permission]
          }
        };
      }
      return module;
    }));
  };

  const enabledModulesCount = modules.filter(m => m.enabled).length;

  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Edit Roles & Permissions
            </h2>
            <p className="text-sm text-gray-600">
              Configure module access and permissions for {userName} ({userRole})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className={`border rounded-lg transition-all ${
                module.enabled
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              {/* Module Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {module.description}
                  </p>
                </div>
                <button
                  onClick={() => toggleModule(module.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ml-4 flex-shrink-0 ${
                    module.enabled ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      module.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Permissions */}
              {module.enabled && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(module.permissions).map(([permission, isEnabled]) => (
                      <div key={permission} className="flex items-center gap-2">
                        <button
                          onClick={() => togglePermission(module.id, permission)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex-shrink-0 ${
                            isEnabled ? 'bg-teal-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {permission}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No modules found matching your search.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-teal-600 font-medium">
            <Info className="w-5 h-5" />
            <span>{enabledModulesCount} modules enabled</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toggle Switch Component (reusable)
const ToggleSwitch = ({ enabled, onToggle, size = 'md' }) => {
  const sizes = {
    sm: { container: 'h-5 w-9', toggle: 'h-3 w-3', translateOn: 'translate-x-5', translateOff: 'translate-x-1' },
    md: { container: 'h-6 w-11', toggle: 'h-4 w-4', translateOn: 'translate-x-6', translateOff: 'translate-x-1' },
    lg: { container: 'h-7 w-14', toggle: 'h-5 w-5', translateOn: 'translate-x-7', translateOff: 'translate-x-1' }
  };

  const sizeClasses = sizes[size];

  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex ${sizeClasses.container} items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
        enabled ? 'bg-teal-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block ${sizeClasses.toggle} transform rounded-full bg-white transition-transform ${
          enabled ? sizeClasses.translateOn : sizeClasses.translateOff
        }`}
      />
    </button>
  );
};

// Example usage component showing how to integrate both components
const RolesPermissionSystem = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleEditPermissions = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Your main page component would go here */}
      {/* <RolesPermissionPage onEditClick={handleEditPermissions} /> */}
      
      <EditRolesPermissionsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        userName={selectedUser?.name}
        userRole={selectedUser?.role}
      />
    </>
  );
};

export default EditRolesPermissionsModal;
export { ToggleSwitch, RolesPermissionSystem };