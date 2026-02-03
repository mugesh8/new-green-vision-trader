import React, { useState, useEffect } from 'react';
import { TrendingUp, Check, Package as PackageIcon, DollarSign } from 'lucide-react';
import { getAllFarmers } from '../../../api/farmerApi';
import { getAllDrivers } from '../../../api/driverApi';
import { getAllLabours } from '../../../api/labourApi';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFarmers: 0,
    availableDrivers: 0,
    totalOrders: 0,
    totalLabours: 0
  });

  const [dailySummary, setDailySummary] = useState([
    { icon: PackageIcon, label: 'Total Orders Today', value: '0', color: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { icon: Check, label: 'Deliveries Completed', value: '0', color: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: PackageIcon, label: 'Pending Collections', value: '0', color: 'bg-orange-100', iconColor: 'text-orange-600' },
    { icon: DollarSign, label: 'Total Payouts', value: '0', color: 'bg-blue-100', iconColor: 'text-blue-600' }
  ]);

  const [vegQuantities, setVegQuantities] = useState([]);
  const [payoutAnalytics, setPayoutAnalytics] = useState([]);
  const [deliveryCounts, setDeliveryCounts] = useState([]);
  const [weekTotalPayout, setWeekTotalPayout] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [farmersRes, driversRes, laboursRes, ordersRes] = await Promise.all([
          getAllFarmers(),
          getAllDrivers(),
          getAllLabours(),
          getAllOrders()
        ]);

        const farmers = farmersRes.data || [];
        const drivers = driversRes.data || [];
        const labours = laboursRes.labours || (Array.isArray(laboursRes) ? laboursRes : laboursRes?.data || []);
        const orders = ordersRes.data || [];

        // 1. Basic Stats
        const availableDriversCount = drivers.filter(d => d.status?.toLowerCase() === 'available').length;

        setStats({
          totalFarmers: farmers.length,
          availableDrivers: availableDriversCount,
          totalOrders: orders.length,
          totalLabours: labours.length
        });

        // 2. Process Orders & Assignments for deeper analytics
        // Fetch all assignments (can be heavy, but needed for totals)
        const assignmentsMap = {};
        const assignmentPromises = orders.map(async (order) => {
          try {
            const res = await getOrderAssignment(order.oid).catch(() => null);
            if (res?.data) {
              assignmentsMap[order.oid] = res.data;
            }
          } catch (e) { /* ignore */ }
        });
        await Promise.all(assignmentPromises);

        // --- Daily Summary Calculations ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = orders.filter(o => {
          const d = new Date(o.createdAt || o.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });

        const completedOrdersToday = ordersToday.filter(o => {
          // Check if status is paid/completed or check assignment stages
          // Using assignment stages for stricter "delivery completed"
          const assign = assignmentsMap[o.oid];
          if (!assign) return false;
          return assign.stage4_status === 'completed';
        });

        const pendingCollectionsToday = ordersToday.filter(o => {
          const assign = assignmentsMap[o.oid];
          if (!assign) return true; // No assignment yet = pending
          return assign.stage1_status !== 'completed';
        });

        const payoutsToday = ordersToday.filter(o => o.payment_status === 'paid');

        setDailySummary([
          { icon: PackageIcon, label: 'Total Orders Today', value: ordersToday.length.toString(), color: 'bg-emerald-100', iconColor: 'text-emerald-600' },
          { icon: Check, label: 'Deliveries Completed', value: completedOrdersToday.length.toString(), color: 'bg-green-100', iconColor: 'text-green-600' },
          { icon: PackageIcon, label: 'Pending Collections', value: pendingCollectionsToday.length.toString(), color: 'bg-orange-100', iconColor: 'text-orange-600' },
          { icon: DollarSign, label: 'Total Payouts', value: payoutsToday.length.toString(), color: 'bg-blue-100', iconColor: 'text-blue-600' }
        ]);

        // --- Weekly/Trend Analytics Helpers ---
        const getLastDays = (n) => {
          const days = [];
          for (let i = n - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            days.push(d);
          }
          return days;
        };

        const last7Days = getLastDays(7);
        const last10Days = getLastDays(10);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // --- Vegetable Quantities (Last 7 Days) ---
        // Sum total weight of orders for each day
        const vegQtyData = last7Days.map(day => {
          const dayOrders = orders.filter(o => {
            const d = new Date(o.createdAt || o.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === day.getTime();
          });

          let totalWeight = 0;
          dayOrders.forEach(o => {
            const assign = assignmentsMap[o.oid];
            if (assign) {
              // Try to get weight from assignments
              const assignmentsList = typeof assign.product_assignments === 'string'
                ? JSON.parse(assign.product_assignments)
                : assign.product_assignments || [];

              assignmentsList.forEach(a => {
                totalWeight += parseFloat(a.assignedQty || 0);
              });
            } else {
              // Fallback to order items
              o.items?.forEach(i => {
                totalWeight += parseFloat(i.net_weight || i.quantity || 0);
              });
            }
          });
          return { day: dayNames[day.getDay()], weight: totalWeight };
        });
        setVegQuantities(vegQtyData);

        // --- Payout Analytics (Last 7 Days) ---
        let totalWeekPayout = 0;
        const payoutTrendData = last7Days.map(day => {
          const dayOrders = orders.filter(o => {
            const d = new Date(o.createdAt || o.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === day.getTime();
          });

          let dayAmount = 0;
          dayOrders.forEach(o => {
            // Calculate estimated amount primarily from stage 4 or assignments
            const assign = assignmentsMap[o.oid];
            if (assign) {
              const assignmentsList = typeof assign.product_assignments === 'string'
                ? JSON.parse(assign.product_assignments)
                : assign.product_assignments || [];

              // Basic calc: qty * price
              assignmentsList.forEach(a => {
                dayAmount += (parseFloat(a.assignedQty || 0) * parseFloat(a.price || 0));
              });
            }
          });
          totalWeekPayout += dayAmount;

          // Format label for chart (e.g. 1.2K)
          let label = '';
          if (dayAmount >= 100000) label = `₹${(dayAmount / 100000).toFixed(1)}L`;
          else if (dayAmount >= 1000) label = `${(dayAmount / 1000).toFixed(0)}K`;
          else label = dayAmount.toFixed(0);

          return { day: dayNames[day.getDay()], amount: dayAmount, label: label };
        });
        setPayoutAnalytics(payoutTrendData);
        setWeekTotalPayout(totalWeekPayout);

        // --- Delivery Count (Last 10 Days) ---
        // Count assignment activities per day
        const deliveryTrendData = last10Days.map((day, idx) => {
          const dayOrders = orders.filter(o => {
            const d = new Date(o.createdAt || o.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === day.getTime();
          });

          let driversSet = new Set();
          dayOrders.forEach(o => {
            const assign = assignmentsMap[o.oid];
            if (assign && assign.stage3_data) {
              // Parse stage 3 to find drivers
              try {
                const s3 = typeof assign.stage3_data === 'string' ? JSON.parse(assign.stage3_data) : assign.stage3_data;
                const prods = s3.products || [];
                prods.forEach(p => {
                  if (p.selectedDriver) driversSet.add(p.selectedDriver);
                });
                // Also check summary data
                if (s3.summaryData?.driverAssignments) {
                  s3.summaryData.driverAssignments.forEach(da => {
                    if (da.driverId) driversSet.add(da.driverId);
                  });
                }
              } catch (e) { }
            }
          });

          return {
            day: `Day ${idx + 1}`, // Or calculate relative day name
            driver: driversSet.size, // Unique drivers active
            packaging: 0 // Placeholder or calculate packaging usage if data available
          };
        });
        setDeliveryCounts(deliveryTrendData);

      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cardStats = [
    {
      title: 'Total Farmers',
      value: loading ? '...' : stats.totalFarmers.toString(),
      bgColor: 'bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0]',
      textColor: 'text-[#0D5C4D]'
    },
    {
      title: 'Available Drivers',
      value: loading ? '...' : stats.availableDrivers.toString(),
      bgColor: 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]',
      textColor: 'text-[#0D5C4D]'
    },
    {
      title: 'Total Orders',
      value: loading ? '...' : stats.totalOrders.toString(),
      bgColor: 'bg-gradient-to-r from-[#10B981] to-[#059669]',
      textColor: 'text-white'
    },
    {
      title: 'Total Labours',
      value: loading ? '...' : stats.totalLabours.toString(),
      bgColor: 'bg-gradient-to-r from-[#047857] to-[#065F46]',
      textColor: 'text-white'
    }
  ];

  // Max value for scaling charts
  const maxDelivery = Math.max(...deliveryCounts.map(d => d.driver), 1); // Avoid div by 0
  const maxVeg = Math.max(...vegQuantities.map(v => v.weight), 1);
  const maxPayout = Math.max(...payoutAnalytics.map(p => p.amount), 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          Welcome back, Admin!
        </h1>
        <p className="text-sm sm:text-base text-gray-500">Here's what's happening with your supply chain today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {cardStats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-2xl p-6 shadow-sm`}>
            <div className={`text-sm font-medium mb-2 opacity-90 ${stat.textColor}`}>
              {stat.title}
            </div>
            <div className={`text-4xl font-bold ${stat.textColor}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Daily Summary */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Daily Summary</h3>
            <p className="text-xs sm:text-sm text-gray-500">Real-time operational overview</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {dailySummary.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className={`${item.color} rounded-lg sm:rounded-xl p-3 sm:p-4`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{item.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Vegetable Quantities */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Total Vegetable Quantities</h3>
              <p className="text-xs sm:text-sm text-gray-500">Weekly stock levels (in kg)</p>
            </div>
            <div className="bg-green-100 text-green-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm">
              {vegQuantities.reduce((a, b) => a + b.weight, 0).toLocaleString()} kg
            </div>
          </div>
          <div className="h-40 sm:h-48 flex items-end justify-between gap-2 relative">
            {/* Simple bar chart approximation for stability */}
            {vegQuantities.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group">
                <div
                  className="w-full bg-[#0D7C66] opacity-80 rounded-t hover:opacity-100 transition-opacity"
                  style={{ height: `${(item.weight / maxVeg) * 100}%`, minHeight: '4px' }}
                ></div>
                <span className="text-xs text-gray-400 mt-2">{item.day}</span>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded hidden group-hover:block z-10">
                  {item.weight} kg
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Payout Analytics */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Payout Analytics</h3>
            <p className="text-xs sm:text-sm text-gray-500">Weekly payout distribution (₹)</p>
          </div>
          <div className="h-48 sm:h-64 flex items-end justify-between gap-2 sm:gap-3 px-1 sm:px-2">
            {payoutAnalytics.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
                  <span className="text-[10px] sm:text-xs font-semibold text-purple-600 mb-1">{item.label}</span>
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${(item.amount / maxPayout) * 100}%`, minHeight: '40px' }}
                  ></div>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500 mt-2 font-medium">{item.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 sm:mt-6 text-center">
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Total Week: </span>
            <span className="text-xs sm:text-sm font-bold text-purple-600">
              {weekTotalPayout >= 100000 ? `₹${(weekTotalPayout / 100000).toFixed(2)}L` : `₹${weekTotalPayout.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Delivery Count */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800">Delivery Count</h3>
            <div className="flex gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#0D7C66] rounded"></div>
                <span className="text-xs sm:text-sm text-gray-600">Active Drivers</span>
              </div>
            </div>
          </div>
          <div className="h-48 sm:h-64">
            <div className="h-full flex items-end justify-between gap-1 sm:gap-2">
              {deliveryCounts.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div className="w-full relative flex flex-col items-center justify-end" style={{ height: '100%' }}>
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">{item.driver}</span>
                    <div
                      className="w-full bg-[#0D7C66] rounded-t transition-all duration-500"
                      style={{ height: `${(item.driver / maxDelivery) * 100}%`, minHeight: '4px' }}
                    ></div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 mt-2">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;