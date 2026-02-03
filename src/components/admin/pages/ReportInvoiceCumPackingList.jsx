import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Search } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getFlowerOrderAssignment } from '../../../api/flowerOrderAssignmentApi';

const ReportInvoiceCumPackingList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orderAmounts, setOrderAmounts] = useState({}); // Store calculated amounts by order ID
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getAllOrders();
        const ordersData = response?.data || [];
        
        // Filter to Box Orders and Flower Orders (invoice-cum-packing list applies to both)
        const invoiceOrders = ordersData.filter(order => {
          const orderType = (order.order_type || order.orderType || '').toUpperCase();
          const isBox = orderType === 'BOX ORDER' || orderType === 'FLIGHT';
          const isFlower = orderType === 'FLOWER ORDER' || (order.order_type || order.orderType || '').toLowerCase() === 'flower';
          return isBox || isFlower;
        });

        setOrders(invoiceOrders);
        setFilteredOrders(invoiceOrders);

        // Fetch stage4 data and calculate amounts for each order
        const amountsMap = {};
        const cleanForMatching = (name) => {
          if (!name) return '';
          return name.replace(/^\d+\s*-\s*/, '').trim();
        };

        const amountPromises = invoiceOrders.map(async (order) => {
          try {
            const isFlowerOrder = order.order_type === 'flower' || order.order_type === 'FLOWER ORDER';
            const assignmentRes = isFlowerOrder
              ? await getFlowerOrderAssignment(order.oid).catch(() => null)
              : await getOrderAssignment(order.oid).catch(() => null);
            if (!assignmentRes?.data?.product_assignments) {
              amountsMap[order.oid] = 0;
              return;
            }

            let assignments = [];
            try {
              assignments = typeof assignmentRes.data.product_assignments === 'string'
                ? JSON.parse(assignmentRes.data.product_assignments)
                : assignmentRes.data.product_assignments;
            } catch {
              amountsMap[order.oid] = 0;
              return;
            }

            if (assignments.length === 0) {
              amountsMap[order.oid] = 0;
              return;
            }

            // Get stage4 data
            let stage4ProductRows = [];
            try {
              if (assignmentRes.data?.stage4_data) {
                const stage4Data = typeof assignmentRes.data.stage4_data === 'string'
                  ? JSON.parse(assignmentRes.data.stage4_data)
                  : assignmentRes.data.stage4_data;
                if (stage4Data?.reviewData?.productRows) {
                  stage4ProductRows = stage4Data.reviewData.productRows;
                }
              }
            } catch {
              // ignore
            }

            let totalAmount = 0;
            assignments.forEach(assignment => {
              const cleanAssignmentProduct = cleanForMatching(assignment.product);

              // Get quantity
              let qty = parseFloat(assignment.assignedQty) || 0;
              if (!qty) {
                const matchingItem = order.items?.find(item => {
                  const itemProduct = item.product_name || item.product || '';
                  return cleanForMatching(itemProduct) === cleanAssignmentProduct;
                });
                if (matchingItem) {
                  qty = parseFloat(matchingItem.net_weight) || parseFloat(matchingItem.quantity) || 0;
                }
              }

              // Get price from stage4
              let price = parseFloat(assignment.price) || 0;
              if (!price) {
                const stage4Entry = stage4ProductRows.find(s4 => {
                  const s4Product = cleanForMatching(s4.product || s4.product_name || '');
                  const s4AssignedTo = s4.assignedTo || s4.assigned_to || '';
                  return s4Product === cleanAssignmentProduct && (s4AssignedTo === assignment.assignedTo || !assignment.assignedTo);
                });
                if (stage4Entry) {
                  price = parseFloat(stage4Entry.price) || 0;
                }
              }

              totalAmount += (qty * price);
            });

            amountsMap[order.oid] = totalAmount;
          } catch (error) {
            console.error(`Error calculating amount for order ${order.oid}:`, error);
            amountsMap[order.oid] = 0;
          }
        });

        await Promise.all(amountPromises);
        setOrderAmounts(amountsMap);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = [...orders];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.oid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => new Date(order.createdAt || order.date) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.createdAt || order.date) <= end);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, startDate, endDate]);

  const handleExport = () => {
    // Export functionality can be implemented here
    alert('Export feature coming soon!');
  };

  const stats = [
    { 
      label: 'Total Invoices', 
      value: loading ? '...' : filteredOrders.length.toString(), 
      change: 'All Time', 
      color: 'bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0]' 
    },
    { 
      label: 'Total Amount', 
      value: loading ? '...' : '₹' + filteredOrders.reduce((sum, order) => sum + (orderAmounts[order.oid] || 0), 0).toLocaleString(), 
      change: 'This Period', 
      color: 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]' 
    },
    { 
      label: 'Total Boxes', 
      value: loading ? '...' : filteredOrders.reduce((sum, order) => {
        const parseNumBoxes = (numBoxesStr) => {
          if (!numBoxesStr) return 0;
          if (typeof numBoxesStr === 'number') return numBoxesStr;
          const match = String(numBoxesStr).match(/^(\d+(?:\.\d+)?)/);
          return match ? parseFloat(match[1]) : 0;
        };
        return sum + (order.items?.reduce((itemSum, item) => {
          const numBoxes = parseNumBoxes(item.num_boxes);
          return itemSum + numBoxes;
        }, 0) || 0);
      }, 0).toLocaleString(), 
      change: 'Packed Items', 
      color: 'bg-gradient-to-r from-[#10B981] to-[#059669]' 
    },
    { 
      label: 'Total Weight', 
      value: loading ? '...' : `${Math.round(filteredOrders.reduce((sum, order) => {
        const grossWeight = order.items?.reduce((itemSum, item) => itemSum + (parseFloat(item.gross_weight) || 0), 0) || 0;
        return sum + grossWeight;
      }, 0))} KG`, 
      change: 'Gross Weight', 
      color: 'bg-gradient-to-r from-[#047857] to-[#065F46]' 
    }
  ];

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
        <h1 className="text-3xl font-bold text-[#0D5C4D] mb-2">Invoice cum Packing List Report</h1>
        <p className="text-gray-600">Comprehensive invoice and packing details for Box Orders and Flower Orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 mb-6 border border-[#D0E0DB]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Order ID or Client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0D8568]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0D8568]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0D8568]"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExport}
              className="w-full bg-[#0D8568] hover:bg-[#0a6354] text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.color} rounded-2xl p-6 ${index === 2 || index === 3 ? 'text-white' : 'text-[#0D5C4D]'}`}>
            <div className="text-sm font-medium mb-2 opacity-90">{stat.label}</div>
            <div className="text-4xl font-bold mb-2">{stat.value}</div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${index === 2 || index === 3 ? 'bg-white/20 text-white' : 'bg-white/60 text-[#0D5C4D]'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#D4F4E8]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Invoice No.</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Order Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Boxes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Net Weight</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Gross Weight</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-gray-500">No orders found</td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => {
                  // Helper function to parse num_boxes (handles both string "4boxes" and number)
                  const parseNumBoxes = (numBoxesStr) => {
                    if (!numBoxesStr) return 0;
                    if (typeof numBoxesStr === 'number') return numBoxesStr;
                    const match = String(numBoxesStr).match(/^(\d+(?:\.\d+)?)/);
                    return match ? parseFloat(match[1]) : 0;
                  };

                  // Calculate boxes, net weight and gross weight from order items
                  const totalBoxes = order.items?.reduce((sum, item) => {
                    const numBoxes = parseNumBoxes(item.num_boxes);
                    return sum + numBoxes;
                  }, 0) || 0;
                  const netWeight = order.items?.reduce((sum, item) => sum + (parseFloat(item.net_weight) || 0), 0) || 0;
                  const grossWeight = order.items?.reduce((sum, item) => sum + (parseFloat(item.gross_weight) || 0), 0) || 0;
                  
                  return (
                    <tr 
                      key={index} 
                      className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'}`}
                    >
                      <td className="px-6 py-4 text-sm text-[#0D5C4D]">INV-{order.oid || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#0D5C4D]">{order.oid || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.order_type === 'flower' || order.order_type === 'FLOWER ORDER'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-[#D4F4E8] text-[#0D5C4D]'
                        }`}>
                          {order.order_type === 'flower' || order.order_type === 'FLOWER ORDER' ? 'FLOWER ORDER' : 'BOX ORDER'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#0D5C4D]">{order.client_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-[#0D5C4D]">
                        {order.createdAt 
                          ? new Date(order.createdAt).toLocaleDateString() 
                          : order.date 
                          ? new Date(order.date).toLocaleDateString() 
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#0D5C4D]">
                        ₹{(orderAmounts[order.oid] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#0D5C4D]">
                        {totalBoxes > 0 ? Math.round(totalBoxes) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#0D5C4D]">
                        {netWeight > 0 ? `${netWeight.toFixed(2)} KG` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#0D5C4D]">
                        {grossWeight > 0 ? `${grossWeight.toFixed(2)} KG` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                          order.payment_status === 'paid' 
                            ? 'bg-[#4ED39A] text-white' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                          {order.payment_status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/reports/invoice-cum-packing-list/${order.oid || order._id}`)}
                          className="text-[#0D8568] hover:text-[#0a6354] font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
            <div className="text-sm text-[#6B8782]">
              Showing {filteredOrders.length} of {orders.length} invoices
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors">&lt;</button>
              <button className="px-4 py-2 rounded-lg font-medium bg-[#0D8568] text-white">1</button>
              <button className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors">&gt;</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportInvoiceCumPackingList;
