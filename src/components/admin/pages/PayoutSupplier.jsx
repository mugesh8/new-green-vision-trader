import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getAllSuppliers } from '../../../api/supplierApi';

const PayoutSupplier = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);

  const formatCurrency = (amount) =>
    `₹${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const cleanForMatching = (name) =>
    name ? name.replace(/^\d+\s*-\s*/, '').trim() : '';

  useEffect(() => {
    fetchSupplierPayouts();
  }, []);

  const fetchSupplierPayouts = async () => {
    try {
      setLoading(true);
      const [ordersRes, suppliersRes] = await Promise.all([
        getAllOrders(),
        getAllSuppliers(),
      ]);

      const orders = ordersRes?.data || [];
      const suppliers = suppliersRes?.data || [];

      const supplierMap = new Map(suppliers.map((s) => [String(s.sid), s]));

      const processed = [];

      const assignmentPromises = orders.map(async (order) => {
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

        // Stage 4 data for final pricing
        let stage4Rows = [];
        try {
          if (assignmentRes.data?.stage4_data) {
            const s4 =
              typeof assignmentRes.data.stage4_data === 'string'
                ? JSON.parse(assignmentRes.data.stage4_data)
                : assignmentRes.data.stage4_data;
            stage4Rows = s4.reviewData?.productRows || [];
          }
        } catch {
          // ignore parsing errors
        }

        const groups = {};
        assignments.forEach((a) => {
          if (a.entityType !== 'supplier' || !a.entityId) return;
          const key = String(a.entityId);
          if (!groups[key]) groups[key] = { supplierId: key, assignments: [] };
          groups[key].assignments.push(a);
        });

        Object.values(groups).forEach((group) => {
          const enriched = group.assignments.map((a) => {
            const cleanProd = cleanForMatching(a.product);

            // qty
            let qty = parseFloat(a.assignedQty) || 0;
            if (!qty && order.items) {
              const item = order.items.find(
                (it) =>
                  cleanForMatching(it.product_name || it.product || '') === cleanProd
              );
              if (item) {
                qty =
                  parseFloat(item.net_weight) ||
                  parseFloat(item.quantity) ||
                  0;
              }
            }

            // price
            let price = parseFloat(a.price) || 0;
            if (!price && stage4Rows.length) {
              const s4 = stage4Rows.find((row) => {
                const rowProd = cleanForMatching(row.product || row.product_name || '');
                const assignedTo = row.assignedTo || row.assigned_to || '';
                return (
                  rowProd === cleanProd &&
                  (assignedTo === a.assignedTo || !a.assignedTo)
                );
              });
              if (s4) {
                price = parseFloat(s4.price) || 0;
                if (!qty) {
                  qty =
                    parseFloat(s4.net_weight) ||
                    parseFloat(s4.quantity) ||
                    0;
                }
              }
            }

            return { ...a, assignedQty: qty, price };
          });

          const totalQty = enriched.reduce(
            (sum, a) => sum + (parseFloat(a.assignedQty) || 0),
            0
          );
          const totalAmount = enriched.reduce(
            (sum, a) =>
              sum +
              (parseFloat(a.assignedQty) || 0) * (parseFloat(a.price) || 0),
            0
          );

          if (totalAmount > 0) {
            const supplier = supplierMap.get(group.supplierId);
            processed.push({
              id: `${order.oid}_${group.supplierId}`,
              supplierName: supplier?.supplier_name || 'Unknown Supplier',
              supplierCode: supplier?.supplier_id || `SID-${group.supplierId}`,
              lastSupplied: order.order_received_date || order.createdAt,
              quantityKg: totalQty,
              amount: totalAmount,
              status:
                order.payment_status === 'paid' ||
                order.payment_status === 'completed'
                  ? 'Paid'
                  : 'Pending',
            });
          }
        });
      });

      await Promise.all(assignmentPromises);
      processed.sort((a, b) => new Date(b.lastSupplied) - new Date(a.lastSupplied));
      setPayouts(processed);
    } catch (e) {
      console.error('Error fetching supplier payouts:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayouts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return payouts;
    return payouts.filter(
      (p) =>
        p.supplierName.toLowerCase().includes(q) ||
        p.supplierCode.toLowerCase().includes(q)
    );
  }, [payouts, searchQuery]);

  const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filteredPayouts.slice(startIndex, startIndex + itemsPerPage);

  const summary = useMemo(() => {
    const totalPayouts = payouts.length;
    const pending = payouts.filter((p) => p.status === 'Pending').length;

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let paidThisMonth = 0;
    payouts.forEach((p) => {
      if (p.status === 'Paid') {
        const d = new Date(p.lastSupplied);
        if (d >= from && d <= to) paidThisMonth += p.amount;
      }
    });

    const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0);
    const averagePayout = totalPayouts ? totalAmount / totalPayouts : 0;

    return { totalPayouts, pending, paidThisMonth, averagePayout };
  }, [payouts]);

  const stats = [
    { label: 'Total Payouts', value: summary.totalPayouts.toString() },
    { label: 'Pending Payouts', value: summary.pending.toString() },
    { label: 'Paid This Month', value: formatCurrency(summary.paidThisMonth) },
    { label: 'Average Payout', value: formatCurrency(summary.averagePayout) },
  ];

  const getStatusColor = (status) =>
    status === 'Paid'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-yellow-100 text-yellow-700';

  const getActionButton = (status) =>
    status === 'Paid'
      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => navigate('/payouts')}
            className="px-5 py-2.5 rounded-lg font-medium transition-all text-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            Farmer Payout
          </button>
          <button
            onClick={() => navigate('/payout-supplier')}
            className="px-5 py-2.5 rounded-lg font-medium transition-all text-sm bg-[#0D7C66] text-white shadow-md"
          >
            Supplier Payout
          </button>
          <button
            onClick={() => navigate('/payout-thirdparty')}
            className="px-5 py-2.5 rounded-lg font-medium transition-all text-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            Third Party Payout
          </button>
          <button
            onClick={() => navigate('/payout-labour')}
            className="px-5 py-2.5 rounded-lg font-medium transition-all text-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            Labour Payout
          </button>
          <button
            onClick={() => navigate('/payout-driver')}
            className="px-5 py-2.5 rounded-lg font-medium transition-all text-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            Driver Payout
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${
                index === 0
                  ? 'bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0]'
                  : index === 1
                  ? 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]'
                  : index === 2
                  ? 'bg-gradient-to-r from-[#10B981] to-[#059669]'
                  : 'bg-gradient-to-r from-[#047857] to-[#065F46]'
              } rounded-2xl p-6 ${
                index === 2 || index === 3 ? 'text-white' : 'text-[#0D5C4D]'
              }`}
            >
              <div className="text-sm font-medium mb-2 opacity-90">{stat.label}</div>
              <div className="text-4xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by supplier name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50"
              />
            </div>

            {/* Filter Button */}
            <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 hover:bg-gray-50 text-gray-700 text-sm">
              <Filter className="w-4 h-4" />
              Filter
            </button>

            {/* Export Button */}
            <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#D4F4E8]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">
                    Supplier Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">
                    Supplier ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">
                    Quantity Supplied (kg)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-[#6B8782]">
                      Loading supplier payouts...
                    </td>
                  </tr>
                ) : !paginated.length ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-[#6B8782]">
                      No supplier payouts found
                    </td>
                  </tr>
                ) : (
                  paginated.map((payout, index) => (
                    <tr
                      key={payout.id}
                      className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0D5C4D] text-sm">
                          {payout.supplierName}
                        </div>
                        <div className="text-xs text-[#6B8782]">
                          Last supplied:{' '}
                          {payout.lastSupplied
                            ? new Date(payout.lastSupplied).toLocaleDateString('en-IN')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#0D5C4D]">
                          {payout.supplierCode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#0D5C4D]">
                          {payout.quantityKg.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-[#0D5C4D]">
                          {formatCurrency(payout.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-4 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
                            payout.status
                          )}`}
                        >
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className={`px-6 py-2 rounded-lg text-xs font-semibold transition-colors ${getActionButton(
                            payout.status
                          )}`}
                        >
                          {payout.status === 'Paid' ? 'View' : 'Pay'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
            <div className="text-sm text-[#6B8782]">
              Showing {filteredPayouts.length === 0 ? 0 : startIndex + 1} to{' '}
              {Math.min(startIndex + itemsPerPage, filteredPayouts.length)} of{' '}
              {filteredPayouts.length} Suppliers
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-[#6B8782] hover:bg-[#D0E0DB]'
                }`}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#0D8568] text-white'
                        : 'text-[#6B8782] hover:bg-[#D0E0DB]'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-[#6B8782] hover:bg-[#D0E0DB]'
                }`}
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

export default PayoutSupplier;
