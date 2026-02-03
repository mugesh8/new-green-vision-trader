import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getFlowerOrderAssignment } from '../../../api/flowerOrderAssignmentApi';
import { getLocalOrder } from '../../../api/localOrderApi';

const OrderAssignManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [localOrders, setLocalOrders] = useState({}); // Track local order assignments

  // Fetch orders from API
  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      const ordersData = response.data || [];
      setOrders(ordersData);

      // Fetch assignment data for each order
      const assignmentsData = {};
      const localOrdersData = {};

      for (const order of ordersData) {
        try {
          const isFlowerOrder = order.order_type === 'flower' || order.order_type === 'FLOWER ORDER';
          const assignmentResponse = isFlowerOrder
            ? await getFlowerOrderAssignment(order.oid)
            : await getOrderAssignment(order.oid);
          assignmentsData[order.oid] = assignmentResponse.data;
        } catch (err) {
          // If assignment doesn't exist, that's fine
          assignmentsData[order.oid] = null;
        }

        // Fetch local order data for local orders (check both 'local' and 'LOCAL GRADE ORDER')
        if (order.order_type === 'local' || order.order_type === 'LOCAL GRADE ORDER') {
          try {
            const localOrderResponse = await getLocalOrder(order.oid);
            // Handle different response structures
            if (localOrderResponse.success && localOrderResponse.data) {
              localOrdersData[order.oid] = localOrderResponse.data;
            } else if (localOrderResponse.data) {
              localOrdersData[order.oid] = localOrderResponse.data;
            } else {
              localOrdersData[order.oid] = localOrderResponse;
            }
          } catch (err) {
            // If local order doesn't exist, that's fine
            localOrdersData[order.oid] = null;
          }
        }
      }

      setAssignments(assignmentsData);
      setLocalOrders(localOrdersData);

      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  const stats = [
    { label: 'Total Orders', value: orders.length.toString(), bgColor: 'bg-emerald-50', textColor: 'text-emerald-900' },
    { label: 'Created', value: orders.filter(o => o.order_status === 'pending').length.toString(), bgColor: 'bg-emerald-100', textColor: 'text-emerald-900' },
    { label: 'Assigned', value: Object.values(assignments).filter(a => a !== null).length.toString(), bgColor: 'bg-emerald-200', textColor: 'text-emerald-900' },
    { label: 'In Transit', value: orders.filter(o => o.order_status === 'processing').length.toString(), bgColor: 'bg-emerald-500', textColor: 'text-white' },
    { label: 'Delivered', value: orders.filter(o => o.order_status === 'delivered').length.toString(), bgColor: 'bg-[#0D7C66]', textColor: 'text-white' },
  ];

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_id.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
          {/* Search */}
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order ID, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
              <span className="text-sm font-medium text-gray-700">All Time</span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
              <span className="text-sm font-medium text-gray-700">All Status</span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
              <span className="text-sm font-medium text-gray-700">Product Type</span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Export Button */}
        <button className="px-6 py-2.5 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium whitespace-nowrap">
          Export
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-xl p-6`}>
            <p className={`text-sm font-medium ${stat.textColor} opacity-80 mb-2`}>{stat.label}</p>
            <p className={`text-4xl font-bold ${stat.textColor}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order Received Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order, index) => (
                <tr key={order.oid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{order.order_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.customer_id || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      order.order_type === 'flight' || order.order_type === 'BOX ORDER' ? 'bg-blue-100 text-blue-700' :
                      order.order_type === 'flower' || order.order_type === 'FLOWER ORDER' ? 'bg-pink-100 text-pink-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {order.order_type === 'flight' || order.order_type === 'BOX ORDER' ? 'BOX ORDER' : order.order_type === 'flower' || order.order_type === 'FLOWER ORDER' ? 'FLOWER ORDER' : order.order_type === 'local' || order.order_type === 'LOCAL GRADE ORDER' ? 'LOCAL GRADE ORDER' : order.order_type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{order.order_received_date || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {order.items && order.items.slice(0, 2).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {item.product || 'Unknown Product'}
                        </span>
                      ))}
                      {order.items && order.items.length > 2 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          +{order.items.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${{
                      'pending': 'bg-purple-100 text-purple-700',
                      'confirmed': 'bg-emerald-100 text-emerald-700',
                      'processing': 'bg-yellow-100 text-yellow-700',
                      'shipped': 'bg-blue-100 text-blue-700',
                      'delivered': 'bg-emerald-600 text-white',
                      'cancelled': 'bg-red-100 text-red-700'
                    }[order.order_status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      // Check for both 'local' and 'LOCAL GRADE ORDER' order types
                      const isLocalOrder = order.order_type === 'local' || order.order_type === 'LOCAL GRADE ORDER';
                      const isFlowerOrder = order.order_type === 'flower' || order.order_type === 'FLOWER ORDER';
                      const assignment = assignments[order.oid];
                      const isStage1Completed = assignment?.stage1_status === 'completed';

                      // For local orders, check if local order data actually exists
                      const localOrderData = localOrders[order.oid];
                      const hasLocalOrderData = isLocalOrder && localOrderData && (
                        localOrderData.product_assignments ||
                        localOrderData.productAssignments ||
                        localOrderData.delivery_routes ||
                        localOrderData.deliveryRoutes ||
                        localOrderData.local_order_id
                      );

                      // For box/flower orders, also consider stage 2 / stage 3 data as "already assigned"
                      const hasStage2Or3Data = !isLocalOrder && assignment && (
                        assignment.stage2_data ||
                        assignment.stage2_summary_data ||
                        assignment.stage3_data ||
                        assignment.stage3_summary_data
                      );

                      const shouldShowEdit = isLocalOrder ? hasLocalOrderData : (isStage1Completed || hasStage2Or3Data);

                      const getAssignPath = (forEdit) => {
                        if (isLocalOrder) return { path: `/order-assign/local/${order.oid}`, state: forEdit ? { orderData: order, localOrderData: localOrderData, isEdit: true } : { orderData: order } };
                        if (isFlowerOrder) return { path: `/order-assign/flower/stage1/${order.oid}`, state: forEdit ? { orderData: order, isEdit: true } : { orderData: order } };
                        return { path: `/order-assign/stage1/${order.oid}`, state: forEdit ? { orderData: order, isEdit: true } : { orderData: order } };
                      };

                      const assignNav = getAssignPath(shouldShowEdit);

                      if (shouldShowEdit) {
                        return (
                          <button
                            onClick={() => navigate(assignNav.path, { state: assignNav.state })}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Edit Assign
                          </button>
                        );
                      } else {
                        return (
                          <button
                            onClick={() => navigate(assignNav.path, { state: assignNav.state })}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Assign
                          </button>
                        );
                      }
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredOrders.length}</span> of <span className="font-medium">{orders.length}</span> Orders
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button className="w-10 h-10 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                1
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderAssignManagement;