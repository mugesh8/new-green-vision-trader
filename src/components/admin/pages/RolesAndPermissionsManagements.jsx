import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, X, Info, Edit2, Trash2, MoreVertical, Shield } from 'lucide-react';
import AddAdmin from './AddAdmin';
import EditAdmin from './EditAdmin';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';
import { getAllAdmins, deleteAdmin, updateRolesPermissions, getRolesPermissions } from '../../../api/adminApi';

// ===== EDIT ROLES & PERMISSIONS MODAL COMPONENT =====
const EditRolesPermissionsModal = ({ isOpen, onClose, userName = 'Priya Sharma', userRole = 'Supervisor', userId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([
    {
      id: 1,
      name: 'Dashboard',
      description: 'View and manage dashboard analytics',
      enabled: false,
      permissions: {}
    },
    {
      id: 2,
      name: 'Vendors',
      description: 'Manage vendor information and relationships',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        edit: false,
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
        orderlist: false,
        payout: false,
        vegetableavailability: false,
        edit: false,
        delete: false
      }
    },
    {
      id: 4,
      name: 'Drivers',
      description: 'Manage driver information and assignments',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        edit: false,
        delete: false,
        attendance: false,
        attendance_edit: false,
        startkm_endkm: false,
        localgradeorder: false,
        boxorder: false,
        fuelexpense: false,
        advancepay: false,
        remarks: false,
        dailypayout: false
      }
    },
    {
      id: 5,
      name: 'Suppliers',
      description: 'Manage supplier relationships and inventory',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        orderlist: false,
        payout: false,
        edit: false,
        delete: false
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
        orderlist: false,
        payout: false,
        edit: false,
        delete: false
      }
    },
    {
      id: 7,
      name: 'Labour',
      description: 'Manage labour workforce and attendance',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        attendance: false,
        attendance_edit: false,
        excesspay: false,
        dailypayout: false,
        edit: false,
        delete: false
      }
    },
    {
      id: 8,
      name: 'Add Product',
      description: 'Add new products to the system',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        allcategory: false,
        customerproductorder: false,
        edit: false,
        delete: false
      }
    },
    {
      id: 9,
      name: 'Orders',
      description: 'Process and track orders from customers',
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
      id: 11,
      name: 'Stock Management',
      description: 'Manage inventory and stock levels',
      enabled: false,
      permissions: {
        add: false,
        view: false,
        marketpriceentry: false,
        sellstock: false,
        inventorystock: false,
        edit: false,
        delete: false
      }
    },
    {
      id: 12,
      name: 'Payouts',
      description: 'Manage payment processing and disbursements',
      enabled: false,
      permissions: {
        farmerpayout: false,
        supplierpayout: false,
        thirdpartypayout: false,
        driverpayout: false,
        labourpayout: false
      }
    },
    {
      id: 13,
      name: 'Reports',
      description: 'View and export order, farmer, supplier, driver, labour and payout reports',
      enabled: false,
      permissions: {
        orderreports: false,
        flowerorderreports: false,
        farmerreports: false,
        supplierreports: false,
        thirdpartyreports: false,
        driverreports: false,
        labourreports: false,
        payoutreports: false,
        invoicereports: false
      }
    },
    {
      id: 14,
      name: 'Notification',
      description: 'Manage system notifications and alerts',
      enabled: false,
      permissions: {}
    },
    {
      id: 15,
      name: 'Settings',
      description: 'Configure system settings and preferences',
      enabled: false,
      permissions: {
        inventorymanagement: false,
        inventorycompany: false,
        airportlocation: false,
        petroleummanagement: false,
        labourrate: false,
        driverrate: false,
        customer: false
      }
    }
  ]);

  // Load existing permissions when modal opens
  useEffect(() => {
    const loadPermissions = async () => {
      if (isOpen && userId) {
        try {
          const response = await getRolesPermissions(userId);
          const permissionsData = response.data || response;
          
          // Map database permissions back to module structure
          setModules(prevModules => prevModules.map(module => {
            const moduleName = module.name.toLowerCase().replace(/ /g, '_');
            const enabled = permissionsData[`${moduleName}_enabled`] || false;
            
            if (!enabled) {
              return module;
            }
            
            // Map all permissions for this module
            const modulePermissions = { ...module.permissions };
            Object.keys(modulePermissions).forEach(permission => {
              const dbFieldName = `${moduleName}_${permission}`;
              if (permissionsData.hasOwnProperty(dbFieldName)) {
                modulePermissions[permission] = permissionsData[dbFieldName] || false;
              }
            });
            
            return {
              ...module,
              enabled,
              permissions: modulePermissions
            };
          }));
        } catch (error) {
          console.error('Failed to load permissions:', error);
        }
      }
    };
    
    loadPermissions();
  }, [isOpen, userId]);

  const toggleModule = (moduleId) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        const newEnabled = !module.enabled;
        // Reset permissions to false when disabling, but preserve structure
        if (!newEnabled) {
          const resetPermissions = {};
          Object.keys(module.permissions).forEach(key => {
            resetPermissions[key] = false;
          });
          return {
            ...module,
            enabled: newEnabled,
            permissions: resetPermissions
          };
        }
        return {
          ...module,
          enabled: newEnabled
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                  {Object.keys(module.permissions).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(module.permissions).map(([permission, isEnabled]) => {
                        // Format permission label for better readability
                        const formatPermissionLabel = (perm) => {
                          // Handle special cases
                          const specialCases = {
                            'orderlist': 'Order List',
                            'startkm_endkm': 'Start KM / End KM',
                            'attendance_edit': 'Attendance Edit',
                            'allcategory': 'All Category',
                            'customerproductorder': 'Customer Product Order',
                            'marketpriceentry': 'Market Price Entry',
                            'sellstock': 'Sell Stock',
                            'inventorystock': 'Inventory Stock',
                            'farmerpayout': 'Farmer Payout',
                            'supplierpayout': 'Supplier Payout',
                            'thirdpartypayout': 'Third Party Payout',
                            'driverpayout': 'Driver Payout',
                            'labourpayout': 'Labour Payout',
                            'orderreports': 'Order Reports',
                            'flowerorderreports': 'Flower Order Reports',
                            'farmerreports': 'Farmer Reports',
                            'supplierreports': 'Supplier Reports',
                            'thirdpartyreports': 'Third Party Reports',
                            'driverreports': 'Driver Reports',
                            'labourreports': 'Labour Reports',
                            'payoutreports': 'Payout Reports',
                            'invoicereports': 'Invoice Reports',
                            'inventorymanagement': 'Inventory Management',
                            'inventorycompany': 'Inventory Company',
                            'airportlocation': 'Airport Location',
                            'petroleummanagement': 'Petroleum Management',
                            'labourrate': 'Labour Rate',
                            'driverrate': 'Driver Rate',
                            'vegetableavailability': 'Vegetable Availability',
                            'localgradeorder': 'Local Grade Order',
                            'fuelexpense': 'Fuel Expense',
                            'advancepay': 'Advance Pay',
                            'dailypayout': 'Daily Payout',
                            'excesspay': 'Excess Pay'
                          };
                          
                          if (specialCases[perm]) {
                            return specialCases[perm];
                          }
                          
                          // Default formatting
                          return perm
                            .replace(/_/g, ' ')
                            .replace(/([a-z])([A-Z])/g, '$1 $2')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                        };
                        
                        return (
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
                            <span className="text-sm font-medium text-gray-700">
                              {formatPermissionLabel(permission)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic py-2">
                      No additional permissions available for this module
                    </div>
                  )}
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
              onClick={async () => {
                setLoading(true);
                try {
                  const permissionsData = {};
                  
                  // Helper function to convert module name to database field format
                  const getModuleFieldName = (moduleName) => {
                    return moduleName.toLowerCase().replace(/ /g, '_');
                  };
                  
                  modules.forEach(module => {
                    const moduleName = getModuleFieldName(module.name);
                    permissionsData[`${moduleName}_enabled`] = module.enabled;
                    
                    if (module.enabled && Object.keys(module.permissions).length > 0) {
                      // Map each permission to its database field name
                      Object.entries(module.permissions).forEach(([permission, value]) => {
                        permissionsData[`${moduleName}_${permission}`] = value;
                      });
                    }
                  });
                  
                  await updateRolesPermissions(userId, permissionsData);
                  onClose();
                } catch (error) {
                  console.error('Failed to update permissions:', error);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== ROLES & PERMISSION MANAGEMENT PAGE COMPONENT =====
const RolesPermissionPage = ({ onEditPermissions, onAddAdmin, onEditAdmin, onDeleteAdmin, users, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
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

  const toggleDropdown = (userId, event) => {
    if (openDropdown === userId) {
      setOpenDropdown(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 160
      });
      setOpenDropdown(userId);
    }
  };

  const handleAction = (action, user) => {
    if (action === 'permissions') {
      onEditPermissions(user);
    } else if (action === 'edit') {
      onEditAdmin(user);
    } else if (action === 'delete') {
      onDeleteAdmin(user);
    }
    setOpenDropdown(null);
  };

  const filteredUsers = users.filter(user =>
    user.role?.toLowerCase() !== 'superadmin' &&
    (user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 relative">
      {/* Header with Add Admin Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0D5C4D]">Roles & Permissions</h1>
        <button
          onClick={onAddAdmin}
          className="px-4 py-2 bg-[#0D7C66] text-white rounded-lg hover:bg-[#0a6354] transition-colors font-medium text-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Admin
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B8782]" size={20} />
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[#F0F4F3] border-none rounded-xl text-[#0D5C4D] placeholder-[#6B8782] focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#D4F4E8]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">User Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[#6B8782]">
                    Loading admins...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[#6B8782]">
                    No admins found
                  </td>
                </tr>
              ) : filteredUsers.map((user, index) => (
                <tr 
                  key={user.aid} 
                  className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#B8F4D8] flex items-center justify-center text-[#0D5C4D] font-semibold text-sm">
                        {user.username?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-[#0D5C4D]">{user.username}</div>
                        <div className="text-xs text-[#6B8782]">ID: {user.aid}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#0D5C4D]">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#D4F4E8] text-[#047857] capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-[#4ED39A] text-white">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(user.aid, e);
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
          <div className="text-sm text-[#6B8782]">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors">
              &lt;
            </button>
            <button className="px-4 py-2 rounded-lg font-medium transition-colors bg-[#0D8568] text-white">
              1
            </button>
            <button className="px-4 py-2 rounded-lg font-medium transition-colors text-[#6B8782] hover:bg-[#D0E0DB]">
              2
            </button>
            <button className="px-4 py-2 rounded-lg font-medium transition-colors text-[#6B8782] hover:bg-[#D0E0DB]">
              3
            </button>
            <button className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors">
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {openDropdown && (
        <div 
          ref={dropdownRef}
          className="fixed w-40 bg-white rounded-lg shadow-lg border border-[#D0E0DB] py-1 z-[100]"
          style={{ 
            top: `${dropdownPosition.top}px`, 
            left: `${dropdownPosition.left}px` 
          }}
        >
          {users.find(u => u.aid === openDropdown)?.role?.toLowerCase() !== 'superadmin' && (
            <button
              onClick={() => handleAction('permissions', users.find(u => u.aid === openDropdown))}
              className="w-full text-left px-4 py-2 text-sm text-[#0D5C4D] hover:bg-[#F0F4F3] transition-colors flex items-center gap-2"
            >
              <Shield size={14} />
              Permissions
            </button>
          )}
          <button
            onClick={() => handleAction('edit', users.find(u => u.aid === openDropdown))}
            className="w-full text-left px-4 py-2 text-sm text-[#0D5C4D] hover:bg-[#F0F4F3] transition-colors flex items-center gap-2"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={() => handleAction('delete', users.find(u => u.aid === openDropdown))}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[#F0F4F3] transition-colors flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ===== MAIN APP COMPONENT (Integration Example) =====
const RolesPermissionSystem = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await getAllAdmins();
      // Check if response has success flag and data
      if (response.success === false) {
        console.error('Server error:', response.message);
        setUsers([]);
        // Show user-friendly error message
        alert(`Error: ${response.message || 'Server error occurred'}`);
        return;
      }
      // Handle both { data: [...] } and direct array responses
      setUsers(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      setUsers([]);
      // Show user-friendly error message
      // Handle both string errors and object errors
      const errorMessage = error.message || (typeof error === 'object' && error !== null && error.message) || 'Server error occurred';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleAddAdmin = () => {
    fetchAdmins();
  };

  const handleEditAdmin = (user) => {
    setSelectedUser(user);
    setIsEditAdminOpen(true);
  };

  const handleUpdateAdmin = () => {
    fetchAdmins();
  };

  const handleDeleteAdmin = (user) => {
    setDeleteModal({ isOpen: true, id: user.aid, name: user.username });
  };

  const confirmDelete = async () => {
    try {
      await deleteAdmin(deleteModal.id);
      fetchAdmins();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Failed to delete admin:', error);
    }
  };

  return (
    <>
      <RolesPermissionPage 
        onEditPermissions={handleEditPermissions}
        onAddAdmin={() => setIsAddAdminOpen(true)}
        onEditAdmin={handleEditAdmin}
        onDeleteAdmin={handleDeleteAdmin}
        users={users}
        loading={loading}
      />
      
      <EditRolesPermissionsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userName={selectedUser?.username}
        userRole={selectedUser?.role}
        userId={selectedUser?.aid}
      />

      {isAddAdminOpen && (
        <AddAdmin
          onClose={() => setIsAddAdminOpen(false)}
          onAdd={handleAddAdmin}
        />
      )}

      {isEditAdminOpen && (
        <EditAdmin
          onClose={() => setIsEditAdminOpen(false)}
          onUpdate={handleUpdateAdmin}
          admin={selectedUser}
        />
      )}

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Admin"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
      />
    </>
  );
};

export default RolesPermissionSystem;