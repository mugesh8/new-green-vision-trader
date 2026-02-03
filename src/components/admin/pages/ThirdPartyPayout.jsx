import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, ChevronDown, ArrowLeft } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getAllThirdParties, getThirdPartyById } from '../../../api/thirdPartyApi';

const cleanForMatching = (name) => {
  if (!name) return '';
  return name.replace(/^\d+\s*-\s*/, '').trim();
};

const ITEMS_PER_PAGE = 7;

const ThirdPartyPayout = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const thirdPartyId = String(id || '');

  const [thirdParty, setThirdParty] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!thirdPartyId) {
      setLoading(false);
      return;
    }
    fetchThirdPartyPayouts();
  }, [thirdPartyId]);

  const fetchThirdPartyPayouts = async () => {
    if (!thirdPartyId) return;
    try {
      setLoading(true);
      const [ordersRes, thirdRes, thirdPartyRes] = await Promise.all([
        getAllOrders().catch(() => ({ data: [] })),
        getAllThirdParties().catch(() => ({ data: [] })),
        getThirdPartyById(thirdPartyId).catch(() => null)
      ]);

      const orders = ordersRes?.data || ordersRes || [];
      const thirdParties = thirdRes?.data || thirdRes || [];
      const thirdPartyData = thirdPartyRes?.data ?? thirdPartyRes ?? thirdParties.find((t) => String(t.tpid) === thirdPartyId);
      setThirdParty(thirdPartyData || null);

      const thirdMap = new Map(thirdParties.map((t) => [String(t.tpid), t]));
      const processedPayouts = [];

      const assignmentPromises = orders.map(async (order) => {
        try {
          const assignmentRes = await getOrderAssignment(order.oid).catch(() => null);
          if (!assignmentRes?.data?.product_assignments) return;

          let assignments = [];
          try {
            assignments =
              typeof assignmentRes.data.product_assignments === 'string'
                ? JSON.parse(assignmentRes.data.product_assignments)
                : assignmentRes.data.product_assignments;
          } catch {
            return;
          }

          let stage4ProductRows = [];
          try {
            if (assignmentRes.data?.stage4_data) {
              const stage4Data =
                typeof assignmentRes.data.stage4_data === 'string'
                  ? JSON.parse(assignmentRes.data.stage4_data)
                  : assignmentRes.data.stage4_data;
              if (stage4Data?.reviewData?.productRows) {
                stage4ProductRows = stage4Data.reviewData.productRows;
              }
            }
          } catch {
            // ignore
          }

          const thirdGroups = {};
          assignments.forEach((assignment) => {
            if (assignment.entityType !== 'thirdParty' || !assignment.entityId) return;
            const key = String(assignment.entityId);
            if (!thirdGroups[key]) {
              thirdGroups[key] = { thirdId: key, assignments: [] };
            }
            thirdGroups[key].assignments.push(assignment);
          });

          const group = thirdGroups[thirdPartyId];
          if (!group) return;

          const enrichedAssignments = group.assignments.map((a) => {
            const cleanAssignmentProduct = cleanForMatching(a.product);
            let qty = parseFloat(a.assignedQty) || 0;
            if (!qty && order.items) {
              const matchingItem = order.items.find((item) => {
                const itemProduct = item.product_name || item.product || '';
                return cleanForMatching(itemProduct) === cleanAssignmentProduct;
              });
              if (matchingItem) {
                qty = parseFloat(matchingItem.net_weight) || parseFloat(matchingItem.quantity) || 0;
              }
            }
            let price = parseFloat(a.price) || 0;
            if (!price && stage4ProductRows.length > 0) {
              const stage4Entry = stage4ProductRows.find((s4) => {
                const s4Product = cleanForMatching(s4.product || s4.product_name || '');
                const s4AssignedTo = s4.assignedTo || s4.assigned_to || '';
                return (
                  s4Product === cleanAssignmentProduct &&
                  (s4AssignedTo === a.assignedTo || !a.assignedTo)
                );
              });
              if (stage4Entry) {
                price = parseFloat(stage4Entry.price) || 0;
                if (!qty) {
                  qty =
                    parseFloat(stage4Entry.net_weight) ||
                    parseFloat(stage4Entry.quantity) ||
                    0;
                }
              }
            }
            return { ...a, assignedQty: qty, price };
          });

          const totalAmount = enrichedAssignments.reduce(
            (sum, a) => sum + (parseFloat(a.assignedQty) || 0) * (parseFloat(a.price) || 0),
            0
          );
          if (totalAmount > 0) {
            const thirdInfo = thirdMap.get(group.thirdId);
            const orderDate = order.order_received_date || order.createdAt;
            const orderDateStr = orderDate
              ? new Date(orderDate).toISOString().split('T')[0]
              : '';
            processedPayouts.push({
              id: `${order.oid}_${group.thirdId}`,
              orderId: order.oid,
              thirdPartyName: thirdInfo?.third_party_name || 'Unknown Third Party',
              thirdPartyCode: thirdInfo?.third_party_id || `TP-${group.thirdId}`,
              orderDate: orderDateStr,
              orderDateRaw: orderDate,
              amount: totalAmount,
              orderStatus: order.order_status || order.status || order.delivery_status || '—',
              paymentStatus:
                order.payment_status === 'paid' || order.payment_status === 'completed'
                  ? 'Paid'
                  : 'Pending'
            });
          }
        } catch (err) {
          console.error('Error processing order for third party payout:', err);
        }
      });

      await Promise.all(assignmentPromises);
      processedPayouts.sort((a, b) => new Date(b.orderDateRaw) - new Date(a.orderDateRaw));
      setPayouts(processedPayouts);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching third party payouts:', error);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayouts = useMemo(() => {
    let list = payouts;
    const query = searchTerm.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (p) =>
          String(p.orderId || '').toLowerCase().includes(query) ||
          (p.thirdPartyName || '').toLowerCase().includes(query) ||
          (p.thirdPartyCode || '').toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'All Status') {
      if (statusFilter === 'Unpaid') {
        list = list.filter((p) => p.paymentStatus === 'Pending');
      } else {
        list = list.filter((p) => p.paymentStatus === statusFilter);
      }
    }
    if (timeFilter !== 'All Time' && timeFilter !== '') {
      const now = new Date();
      let start;
      if (timeFilter === 'Today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (timeFilter === 'This Week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff);
      } else if (timeFilter === 'This Month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (timeFilter === 'Last Month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        list = list.filter((p) => {
          const d = new Date(p.orderDateRaw);
          return d >= start && d <= end;
        });
        return list;
      } else {
        return list;
      }
      const startStr = start.toISOString().split('T')[0];
      list = list.filter((p) => (p.orderDate || '') >= startStr);
    }
    return list;
  }, [payouts, searchTerm, statusFilter, timeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPayouts.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPayouts = filteredPayouts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const statsCards = useMemo(() => {
    const total = payouts.length;
    const pending = payouts.filter((p) => p.paymentStatus === 'Pending').length;
    const completed = payouts.filter((p) => p.paymentStatus === 'Paid').length;
    const totalValue = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const valueStr =
      totalValue >= 100000
        ? `₹${(totalValue / 100000).toFixed(1)} L`
        : `₹${Number(totalValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    return [
      { label: 'Total Payouts', value: String(total), color: 'bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0]', textColor: 'text-[#0D5C4D]' },
      { label: 'Pending Payouts', value: String(pending), color: 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]', textColor: 'text-[#0D5C4D]' },
      { label: 'Completed Payouts', value: String(completed), color: 'bg-gradient-to-r from-[#10B981] to-[#059669]', textColor: 'text-white' },
      { label: 'Total Payout Value', value: valueStr, color: 'bg-gradient-to-r from-[#047857] to-[#065F46]', textColor: 'text-white' }
    ];
  }, [payouts]);

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const formatOrderDate = (dateStr) =>
    dateStr ? new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB') : '—';

  return (
    <div className="min-h-screen bg-[#E8F5F1] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(`/third-party/${id}`)}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-white rounded-lg text-gray-600 hover:text-gray-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Third Party Details</span>
        </button>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => navigate(`/third-party/${id}`)}
            className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Personal Info
          </button>
          <button
            onClick={() => navigate(`/third-party/${id}/orders`)}
            className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Order List
          </button>
          <button className="px-6 py-2.5 bg-[#0D7C66] text-white rounded-lg font-medium transition-colors shadow-sm">
            Payout
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66] focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D7C66] focus:border-transparent cursor-pointer min-w-[130px]"
            >
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Month</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D7C66] focus:border-transparent cursor-pointer min-w-[130px]"
            >
              <option>All Status</option>
              <option>Paid</option>
              <option>Unpaid</option>
              <option>Pending</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          <button className="px-6 py-2.5 bg-[#1DB890] hover:bg-[#19a57e] text-white font-semibold rounded-lg text-sm transition-colors whitespace-nowrap">
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className={`${stat.color} rounded-2xl p-6`}>
              <div className={`text-sm font-medium mb-2 opacity-90 ${stat.textColor}`}>{stat.label}</div>
              <div className={`text-4xl font-bold mb-2 ${stat.textColor}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#D4F4E8]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Third Party Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Order Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Payment Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      Loading payouts...
                    </td>
                  </tr>
                ) : paginatedPayouts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No payout records found for this third party
                    </td>
                  </tr>
                ) : (
                  paginatedPayouts.map((payout, index) => (
                    <tr
                      key={payout.id}
                      className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#B8F4D8] flex items-center justify-center text-[#0D5C4D] font-semibold text-sm">
                            {(payout.thirdPartyCode || 'TP').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-[#0D5C4D]">
                            {payout.orderId || payout.id?.split('_')[0] || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#0D5C4D]">{payout.thirdPartyName}</div>
                        <div className="text-xs text-[#6B8782]">{payout.thirdPartyCode}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#0D5C4D]">{formatOrderDate(payout.orderDate)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-[#0D5C4D]">{formatAmount(payout.amount)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-[#4ED39A] text-white">
                          <div className="w-2 h-2 rounded-full bg-white" />
                          {payout.orderStatus || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            payout.paymentStatus === 'Paid'
                              ? 'bg-[#D4F4E8] text-[#047857]'
                              : payout.paymentStatus === 'Pending'
                                ? 'bg-[#FFF4CC] text-[#CC9900]'
                                : 'bg-[#FFE0E0] text-[#CC0000]'
                          }`}
                        >
                          {payout.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/orders/${payout.orderId}`)}
                            className="px-4 py-2 bg-[#0D8568] hover:bg-[#0a6354] text-white font-semibold rounded-lg text-xs transition-colors"
                          >
                            View
                          </button>
                          <button className="px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white font-semibold rounded-lg text-xs transition-colors">
                            Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
            <div className="text-sm text-[#6B8782]">
              Showing {filteredPayouts.length === 0 ? 0 : startIndex + 1}–
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredPayouts.length)} of {filteredPayouts.length} payouts
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page ? 'bg-[#0D8568] text-white' : 'text-[#6B8782] hover:bg-[#D0E0DB]'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThirdPartyPayout;