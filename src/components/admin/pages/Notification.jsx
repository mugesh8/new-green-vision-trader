import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Package, 
  Clock,
  Filter,
  Search,
  MoreVertical,
  Trash2,
  Check
} from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications
} from '../../../api/notificationApi';

const Notifications = () => {
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to calculate time ago
  const getTimeAgo = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getNotifications();
        // Expecting res.data or res.notifications; handle both
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.notifications || []);

        const mapped = list.map((n) => {
          // Backend uses is_read (with underscore) and nid (not id)
          const isUnread = n.is_read === false || n.read === false || n.status === 'unread';
          const createdAt = n.createdAt ? new Date(n.createdAt) : null;

          return {
            id: n.nid || n._id || n.id, // Backend uses nid
            backend: n,
            type: n.type || 'info',
            icon: (n.type === 'urgent' || n.priority === 'high') ? AlertCircle
              : n.type === 'warning' ? AlertTriangle
              : n.type === 'success' ? CheckCircle
              : Package,
            iconBg: (n.type === 'urgent' || n.priority === 'high') ? 'bg-red-100'
              : n.type === 'warning' ? 'bg-orange-100'
              : n.type === 'success' ? 'bg-green-100'
              : 'bg-blue-100',
            iconColor: (n.type === 'urgent' || n.priority === 'high') ? 'text-red-600'
              : n.type === 'warning' ? 'text-orange-600'
              : n.type === 'success' ? 'text-green-600'
              : 'text-blue-600',
            title: n.title || n.heading || 'Notification',
            description: n.message || n.description || '',
            time: getTimeAgo(createdAt),
            timestamp: createdAt ? createdAt.toLocaleString() : '',
            unread: isUnread,
            category: n.category || n.module || 'General',
          };
        });

        setNotifications(mapped);
      } catch (err) {
        console.error('Error fetching notifications', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      // Optimistically update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      
      // Mark all as read in backend
      await markAllNotificationsAsRead();
      
      // Trigger Navbar refresh immediately (multiple times to ensure it catches)
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 200);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 500);
    } catch (err) {
      console.error('Error marking all notifications as read', err);
      // Refresh to get correct state on error
      const res = await getNotifications();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.notifications || []);
      const mapped = list.map((n) => {
        // Backend uses is_read (with underscore)
        const isUnread = n.is_read === false || n.read === false || n.status === 'unread';
        const createdAt = n.createdAt ? new Date(n.createdAt) : null;
        return {
          id: n._id || n.id,
          backend: n,
          type: n.type || 'info',
          icon: (n.type === 'urgent' || n.priority === 'high') ? AlertCircle
            : n.type === 'warning' ? AlertTriangle
            : n.type === 'success' ? CheckCircle
            : Package,
          iconBg: (n.type === 'urgent' || n.priority === 'high') ? 'bg-red-100'
            : n.type === 'warning' ? 'bg-orange-100'
            : n.type === 'success' ? 'bg-green-100'
            : 'bg-blue-100',
          iconColor: (n.type === 'urgent' || n.priority === 'high') ? 'text-red-600'
            : n.type === 'warning' ? 'text-orange-600'
            : n.type === 'success' ? 'text-green-600'
            : 'text-blue-600',
          title: n.title || n.heading || 'Notification',
          description: n.message || n.description || '',
          time: getTimeAgo(createdAt),
          timestamp: createdAt ? createdAt.toLocaleString() : '',
          unread: isUnread,
          category: n.category || n.module || 'General',
        };
      });
      setNotifications(mapped);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearNotifications();
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications', err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      // Optimistically update local state immediately
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
      
      // Mark as read in backend
      await markNotificationAsRead(id);
      
      // Trigger Navbar refresh immediately (multiple times to ensure it catches)
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 200);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 500);
    } catch (err) {
      console.error('Error marking notification as read', err);
      // Revert on error
      const res = await getNotifications();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.notifications || []);
      const mapped = list.map((n) => {
        // Backend uses is_read (with underscore)
        const isUnread = n.is_read === false || n.read === false || n.status === 'unread';
        const createdAt = n.createdAt ? new Date(n.createdAt) : null;
        return {
          id: n._id || n.id,
          backend: n,
          type: n.type || 'info',
          icon: (n.type === 'urgent' || n.priority === 'high') ? AlertCircle
            : n.type === 'warning' ? AlertTriangle
            : n.type === 'success' ? CheckCircle
            : Package,
          iconBg: (n.type === 'urgent' || n.priority === 'high') ? 'bg-red-100'
            : n.type === 'warning' ? 'bg-orange-100'
            : n.type === 'success' ? 'bg-green-100'
            : 'bg-blue-100',
          iconColor: (n.type === 'urgent' || n.priority === 'high') ? 'text-red-600'
            : n.type === 'warning' ? 'text-orange-600'
            : n.type === 'success' ? 'text-green-600'
            : 'text-blue-600',
          title: n.title || n.heading || 'Notification',
          description: n.message || n.description || '',
          time: getTimeAgo(createdAt),
          timestamp: createdAt ? createdAt.toLocaleString() : '',
          unread: isUnread,
          category: n.category || n.module || 'General',
        };
      });
      setNotifications(mapped);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return notification.unread;
    if (filter === 'read') return !notification.unread;
    return true;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Notifications</h1>
            <p className="text-sm sm:text-base text-gray-500">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleMarkAllRead}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="hidden sm:inline">Mark all as read</span>
              <span className="sm:hidden">Mark all</span>
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="hidden sm:inline">Clear all</span>
              <span className="sm:hidden">Clear</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-[#0D7C66] text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                filter === 'unread'
                  ? 'bg-[#0D7C66] text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                filter === 'read'
                  ? 'bg-[#0D7C66] text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7C66] focus:border-transparent text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading notifications...</h3>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No notifications found</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id || `notification-${index}`}
                onClick={() => {
                  // Mark as read when clicked if unread
                  if (notification.unread) {
                    handleMarkOneRead(notification.id);
                  }
                }}
                className={`p-4 sm:p-6 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  notification.unread ? 'bg-blue-50/30' : ''
                } ${index === filteredNotifications.length - 1 ? 'border-b-0' : ''}`}
              >
                <div className="flex gap-3 sm:gap-4">
                  {/* Icon */}
                  <div className={`${notification.iconBg} w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${notification.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`text-sm sm:text-base font-semibold pr-2 ${
                        notification.type === 'urgent' ? 'text-red-600' : 
                        notification.type === 'success' ? 'text-green-600' :
                        notification.type === 'warning' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {notification.title}
                      </h4>
                      <button
                        onClick={() => handleMarkOneRead(notification.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      {notification.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{notification.time}</span>
                        {notification.timestamp && (
                          <span className="text-[10px] text-gray-400 ml-1">
                            ({notification.timestamp})
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Filter className="w-3 h-3 flex-shrink-0" />
                        {notification.category}
                      </span>
                      {notification.unread && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium whitespace-nowrap">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
