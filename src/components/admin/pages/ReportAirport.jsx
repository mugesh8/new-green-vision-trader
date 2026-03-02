import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Plane } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getFlowerOrderAssignment } from '../../../api/flowerOrderAssignmentApi';

const ReportAirport = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getAllOrders();
        if (response.success && response.data) {
          // Box orders (flight) and Flower orders have Stage 3 airport delivery
          const airportOrders = response.data.filter(o =>
            o.order_type === 'flight' || o.order_type === 'BOX ORDER' ||
            o.order_type === 'flower' || o.order_type === 'FLOWER ORDER'
          );
          const sorted = airportOrders.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setOrders(sorted);

          const assignmentsData = {};
          for (const order of sorted) {
            try {
              const isFlower = order.order_type === 'flower' || order.order_type === 'FLOWER ORDER';
              const res = isFlower
                ? await getFlowerOrderAssignment(order.oid)
                : await getOrderAssignment(order.oid);
              assignmentsData[order.oid] = res.data;
            } catch {
              assignmentsData[order.oid] = null;
            }
          }
          setAssignments(assignmentsData);
        }
      } catch (error) {
        console.error('Error fetching airport orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      const assignment = assignments[order.oid];
      if (!assignment?.stage3_data) return false;

      if (fromDate || toDate) {
        const orderDate = new Date(order.createdAt || order.order_received_date);
        if (fromDate && orderDate < new Date(fromDate)) return false;
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          if (orderDate > to) return false;
        }
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = (order.order_auto_id || order.order_id || '').toLowerCase().includes(q);
        const matchCustomer = (order.customer_name || '').toLowerCase().includes(q);
        if (!matchId && !matchCustomer) return false;
      }

      return true;
    });
  }, [orders, assignments, fromDate, toDate, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      const date = new Date(d);
      return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getOrderTypeLabel = (order) => {
    const t = order?.order_type || '';
    if (t === 'flower' || t === 'FLOWER ORDER') return 'Flower';
    if (t === 'flight' || t === 'BOX ORDER') return 'Box';
    return t || 'N/A';
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading airport orders...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <button
        onClick={() => navigate('/reports')}
        className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] mb-6"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Reports</span>
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D5C4D] flex items-center gap-2">
          <Plane size={28} />
          Airport Report
        </h1>
        <p className="text-[#6B8782] mt-1">Stage 3 delivery routes for box and flower orders</p>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6 border border-[#D0E0DB]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0D5C4D] mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-[#D0E0DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D5C4D] mb-2">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-[#D0E0DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0D5C4D] mb-2">Search</label>
            <input
              type="text"
              placeholder="Order ID or Customer"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-[#D0E0DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
        <table className="w-full">
          <thead>
            <tr className="bg-[#D4F4E8]">
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Order ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Client</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Value</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length > 0 ? (
              currentOrders.map((order, index) => {
                const orderTotal = order.items?.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0) || 0;
                return (
                  <tr
                    key={order.oid}
                    className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] ${index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'}`}
                  >
                    <td className="px-6 py-4 text-sm text-[#0D5C4D]">{order.order_auto_id || `ORD-${order.oid}`}</td>
                    <td className="px-6 py-4 font-semibold text-[#0D5C4D]">{order.customer_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-[#D4F4E8] text-[#0D5C4D]">
                        {getOrderTypeLabel(order)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#0D5C4D]">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#0D5C4D]">{formatCurrency(orderTotal)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/reports/airport/${order.oid}`)}
                        className="p-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors flex items-center gap-2"
                        title="View Airport Report"
                      >
                        <Eye size={16} />
                        View Airport Report
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No orders with airport delivery data found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredOrders.length > 0 && totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
            <span className="text-sm text-[#6B8782]">
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-[#D0E0DB] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-[#D0E0DB] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportAirport;
