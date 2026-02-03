import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Leaf, 
  Truck, 
  Package, 
  UserCheck, 
  DollarSign, 
  ShoppingCart, 
  ClipboardList, 
  CreditCard, 
  FileText, 
  Shield, 
  Bell, 
  Settings,
  X,
  Plus,
  Archive
} from 'lucide-react';
import logo from '../../assets/logo.png';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Vendors', path: '/vendors' },
    { icon: Leaf, label: 'Farmers', path: '/farmers' },
    { icon: Truck, label: 'Drivers', path: '/drivers' },
    { icon: Package, label: 'Suppliers', path: '/suppliers' },
    { icon: UserCheck, label: 'Third Party', path: '/third-party' },
    { icon: DollarSign, label: 'Labour', path: '/labour' },
    { icon: Plus, label: 'Add Product', path: '/products/add' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: ClipboardList, label: 'Order Assign', path: '/order-assign' },
    { icon: Archive, label: 'Stock Management', path: '/stock' },
    { icon: CreditCard, label: 'Payouts', path: '/payouts' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Shield, label: 'Roles And Permission', path: '/roles' },
    { icon: Bell, label: 'Notification', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0D7C66] to-[#0a6354] text-white flex flex-col transform transition-transform duration-300 lg:transform-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Logo */}
      <div className="p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
          <img src={logo} alt="Logo" className="w-full h-full object-cover" />
        </div>
          <span className="text-xl font-bold">Green Vision Traders</span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 sm:px-3 py-4 space-y-1 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.3) transparent'}}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
    </>
  );
};

export default Sidebar;