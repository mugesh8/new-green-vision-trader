import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, FileText, Users, Wallet, Briefcase, FileBarChart } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getAllFarmers } from '../../../api/farmerApi';
import { getAllSuppliers } from '../../../api/supplierApi';
import { getAllThirdParties } from '../../../api/thirdPartyApi';
import { getAllLabours } from '../../../api/labourApi';
import { getAllFuelExpenses } from '../../../api/fuelExpenseApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getAllDrivers } from '../../../api/driverApi';

const ReportManagement = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    orders: 0,
    flowerOrders: 0,
    farmers: 0,
    suppliers: 0,
    thirdParties: 0,
    payouts: 0,
    labourers: 0,
    invoices: 0,
    // New stats
    totalGoodsValue: 0,
    totalExpenses: 0,
    totalShipments: 0,
    netWeight: 0,
    grossWeight: 0,
    recentOrders: [],
    startDate: '',
    endDate: '',
    filterType: 'all'
  });
  const [loading, setLoading] = useState(true);

  // Re-fetch or re-calc when filters change
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [ordersRes, farmersRes, suppliersRes, thirdPartiesRes, laboursRes, fuelRes, driversRes] = await Promise.all([
          getAllOrders(),
          getAllFarmers(),
          getAllSuppliers(),
          getAllThirdParties(),
          getAllLabours(1, 1000),
          getAllFuelExpenses().catch(() => ({ data: [] })),
          getAllDrivers().catch(() => ({ data: [] }))
        ]);

        let orders = ordersRes?.data || [];
        const farmers = farmersRes?.data || [];
        const suppliers = suppliersRes?.data || [];
        const thirdParties = thirdPartiesRes?.data || [];
        const labours = laboursRes?.labours || (Array.isArray(laboursRes) ? laboursRes : laboursRes?.data || []);
        let fuelExpenses = fuelRes?.data || (Array.isArray(fuelRes) ? fuelRes : []);
        const drivers = driversRes?.data || (Array.isArray(driversRes) ? driversRes : []);

        // --- FILTER LOGIC ---
        // Filter Orders by Date
        if (stats.startDate) {
          const start = new Date(stats.startDate);
          start.setHours(0, 0, 0, 0);
          orders = orders.filter(o => new Date(o.createdAt || o.date) >= start);
        }
        if (stats.endDate) {
          const end = new Date(stats.endDate);
          end.setHours(23, 59, 59, 999);
          orders = orders.filter(o => new Date(o.createdAt || o.date) <= end);
        }

        // Filter Fuel Expenses by Date
        if (stats.startDate) {
          const start = new Date(stats.startDate);
          start.setHours(0, 0, 0, 0);
          fuelExpenses = fuelExpenses.filter(f => new Date(f.date) >= start);
        }
        if (stats.endDate) {
          const end = new Date(stats.endDate);
          end.setHours(23, 59, 59, 999);
          fuelExpenses = fuelExpenses.filter(f => new Date(f.date) <= end);
        }
        // --- END FILTER LOGIC ---

        // 1. Calculate Total Payouts (Goods Value) & Weights
        let totalPayoutAmount = 0;
        let totalNetWeight = 0;
        let totalBoxCount = 0;

        const cleanForMatching = (name) => {
          if (!name) return '';
          return name.replace(/^\d+\s*-\s*/, '').trim();
        };

        const assignmentPromises = orders.map(async (order) => {
          try {
            const assignmentRes = await getOrderAssignment(order.oid).catch(() => null);
            if (!assignmentRes?.data?.product_assignments) return;

            let assignments = [];
            try {
              assignments = typeof assignmentRes.data.product_assignments === 'string'
                ? JSON.parse(assignmentRes.data.product_assignments)
                : assignmentRes.data.product_assignments;
            } catch {
              return;
            }

            if (assignments.length === 0) return;

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

            assignments.forEach(assignment => {
              const cleanAssignmentProduct = cleanForMatching(assignment.product);

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

              // Weight Accumulation
              totalNetWeight += qty;
              const boxes = parseFloat(assignment.assignedBoxes || assignment.boxes || 0);
              totalBoxCount += boxes;

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

              totalPayoutAmount += (qty * price);
            });

          } catch (error) {
            console.error(`Error processing order ${order.oid} for stats`, error);
          }
        });

        await Promise.all(assignmentPromises);

        // 2. Calculate Total Expenses
        // Fuel Expenses
        let totalFuel = fuelExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

        // Labour Wages (Approximate pending + paid if available, or just calculate from logic if needed)
        let totalExpenses = totalFuel;


        // 3. Gross Weight Calculation (Estimate: Net + 0.5kg/box)
        const totalGrossWeight = totalNetWeight + (totalBoxCount * 0.5);

        // 4. Recent Activity (Recent Orders)
        const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        const recent = sortedOrders.slice(0, 3);

        const flowerOrdersCount = orders.filter(o => o.order_type === 'flower' || o.order_type === 'FLOWER ORDER').length;

        setStats(prev => ({
          ...prev,
          orders: orders.length,
          flowerOrders: flowerOrdersCount,
          farmers: farmers.length,
          suppliers: suppliers.length,
          thirdParties: thirdParties.length,
          payouts: totalPayoutAmount,
          labourers: labours.length,
          invoices: orders.length,
          drivers: drivers.length,

          totalGoodsValue: totalPayoutAmount,
          totalExpenses: totalExpenses, // Currently mostly fuel
          totalShipments: totalBoxCount, // PCS usually means pieces/boxes
          netWeight: totalNetWeight,
          grossWeight: totalGrossWeight,
          recentOrders: recent
        }));

      } catch (e) {
        console.error('Error fetching dashboard stats:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [stats.startDate, stats.endDate]); // Depend on filter changes

  const reportCards = [
    {
      title: 'Orders Report',
      description: 'Summary by date, client, and status',
      metric: `Total Orders: ${loading ? '...' : stats.orders}`,
      link: 'View Report →',
      icon: FileText,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
      path: '/reports/order',
      type: 'operations'
    },
    {
      title: 'Flower Order Report',
      description: 'Flower orders only – summary by date, client, and status',
      metric: `Flower Orders: ${loading ? '...' : stats.flowerOrders}`,
      link: 'View Report →',
      icon: FileText,
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-500',
      path: '/reports/flower-order',
      type: 'operations'
    },
    {
      title: 'Farmer Report',
      description: 'Supply quantity, payout, pending dues',
      metric: `Active Farmers: ${loading ? '...' : stats.farmers}`,
      link: 'View Report →',
      icon: Users,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500',
      path: '/reports/farmer',
      type: 'partners'
    },
    {
      title: 'Supplier Report',
      description: 'Supply quantity, payout, pending dues',
      metric: `Active Suppliers: ${loading ? '...' : stats.suppliers}`,
      link: 'View Report →',
      icon: Users,
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-500',
      path: '/reports/supplier',
      type: 'partners'
    },
    {
      title: 'Third Party Report',
      description: 'Supply quantity, payout, pending dues',
      metric: `Active Third Parties: ${loading ? '...' : stats.thirdParties}`,
      link: 'View Report →',
      icon: Users,
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-500',
      path: '/reports/third-party',
      type: 'partners'
    },
    {
      title: 'Payout Report',
      description: 'For farmers, labour, and drivers',
      metric: `Total Payouts: ${loading ? '...' : '₹' + stats.payouts.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      link: 'View Report →',
      icon: Wallet,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500',
      path: '/reports/payout',
      type: 'financial'
    },
    {
      title: 'Labour Report',
      description: 'Attendance and wage details',
      metric: `Total Labourers: ${loading ? '...' : stats.labourers}`,
      link: 'View Report →',
      icon: Briefcase,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
      path: '/reports/labour',
      type: 'operations'
    },
    {
      title: 'Invoice cum Packing List Report',
      description: 'Comprehensive invoice and packing details',
      metric: `Total Invoices: ${loading ? '...' : stats.invoices}`,
      link: 'View Report →',
      icon: FileBarChart,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500',
      path: '/reports/invoice-cum-packing-list',
      type: 'financial'
    },
    {
      title: 'Driver Report',
      description: 'Driver details, KM records, and fuel expenses',
      metric: `Active Drivers: ${loading ? '...' : stats.drivers || 0}`,
      link: 'View Report →',
      icon: Briefcase,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
      path: '/reports/driver',
      type: 'operations'
    }
  ];

  const statistics = [
    {
      value: loading ? '...' : `₹${stats.totalGoodsValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      label: 'Total Goods Value',
      sublabel: 'Total Purchase Cost',
      bgColor: 'bg-emerald-200'
    },
    {
      value: loading ? '...' : `₹${stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      label: 'Total Fuel Expenses',
      sublabel: 'Verified Expenses',
      bgColor: 'bg-emerald-300'
    },
    {
      value: loading ? '...' : `${Math.round(stats.totalShipments)} PCS`,
      label: 'Total Shipments',
      sublabel: 'Total Boxes/Bags',
      bgColor: 'bg-emerald-400'
    },
    {
      value: loading ? '...' : `${Math.round(stats.netWeight)} KG`,
      label: 'Net Weight',
      sublabel: 'Total transported',
      bgColor: 'bg-emerald-600'
    },
    {
      value: loading ? '...' : `${Math.round(stats.grossWeight)} KG`,
      label: 'Gross Weight',
      sublabel: 'Including packaging (est.)',
      bgColor: 'bg-emerald-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={stats.startDate || ''}
              onChange={(e) => setStats(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={stats.endDate || ''}
              onChange={(e) => setStats(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Filter Cards</label>
            <div className="relative">
              <select
                value={stats.filterType || 'all'}
                onChange={(e) => setStats(prev => ({ ...prev, filterType: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="all">All Reports</option>
                <option value="financial">Financial (Payouts, Invoices)</option>
                <option value="partners">Partners (Farmers, Suppliers)</option>
                <option value="operations">Operations (Orders, Labour)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {reportCards
          .filter(card => stats.filterType === 'all' || card.type === stats.filterType)
          .map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer hover:border-emerald-200"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
                  <p className="text-sm text-gray-500">{card.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{card.metric}</span>
                <span className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                  {card.link}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Quick Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statistics.map((stat, index) => (
            <div key={index} className={`${stat.bgColor} rounded-xl p-6 text-white`}>
              <div className="text-2xl md:text-3xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm font-medium opacity-90 mb-1">{stat.label}</div>
              <div className="text-xs opacity-75">{stat.sublabel}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Report Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent System Activity</h2>
        <div className="space-y-4">
          {stats.recentOrders.length > 0 ? (
            stats.recentOrders.map((order, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-blue-400'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">New Order Received: {order.oid}</p>
                    <p className="text-sm text-gray-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                  {order.payment_status || 'Pending'}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-500">No recent activity found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportManagement;