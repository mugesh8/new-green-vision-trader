import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getAllLabours } from '../../../api/labourApi';
import { getAllAttendance } from '../../../api/labourAttendanceApi';
import { getAllLabourRates } from '../../../api/labourRateApi';
import { getAllLabourExcessPay } from '../../../api/labourExcessPayApi';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';

const ReportLabour = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [labours, setLabours] = useState([]);
  const [stats, setStats] = useState({
    totalLabour: 0,
    presentToday: 0,
    totalWages: 0,
    pendingWages: 0,
    pendingCount: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    const value = Number.isFinite(amount) ? amount : 0;
    // Show full amount in rupees with Indian grouping (no K/L shorthand)
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [laboursRes, todayAttendanceRes, labourRatesRes, excessPayRes] = await Promise.all([
        getAllLabours(1, 1000).catch(() => ({ data: [] })),
        getAllAttendance({ date: new Date().toISOString().split('T')[0] }).catch(() => ({ data: { labours: [], stats: {} } })),
        getAllLabourRates().catch(() => []),
        getAllLabourExcessPay().catch(() => ({ data: [] }))
      ]);

      const allLabours = laboursRes?.data || laboursRes?.labours || [];
      const todayAttendance = todayAttendanceRes?.data || {};
      const todayLabours = todayAttendance.labours || [];
      const labourRates = Array.isArray(labourRatesRes) ? labourRatesRes : (labourRatesRes?.data || []);
      const excessPays = excessPayRes?.data || [];

      // Create a map of labour rates by type
      const ratesMap = {};
      labourRates.forEach(rate => {
        if (rate.status === 'Active') {
          ratesMap[rate.labourType] = parseFloat(rate.amount) || 0;
        }
      });

      // Create a map of excess pay by labour ID
      const excessPayMap = {};
      excessPays.forEach(pay => {
        excessPayMap[pay.labour_id] = parseFloat(pay.amount) || 0;
      });

      // Get current month dates
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Fetch attendance for current month (sample dates)
      const monthDates = [];
      for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
        monthDates.push(new Date(d).toISOString().split('T')[0]);
      }

      // Fetch attendance for all dates in month (in batches to avoid too many requests)
      const attendancePromises = monthDates.slice(0, 10).map(date => 
        getAllAttendance({ date }).catch(() => ({ data: { labours: [] } }))
      );
      const attendanceResults = await Promise.all(attendancePromises);

      // Fetch all orders and their assignments to calculate wages from assigned orders
      let ordersData = [];
      try {
        const ordersResponse = await getAllOrders();
        ordersData = ordersResponse?.data || [];
      } catch (err) {
        console.error('Error fetching orders:', err);
      }

      // Filter orders to current month only (using already declared variables)
      const currentMonthOrders = ordersData.filter(order => {
        if (!order.order_received_date) return false;
        const orderDate = new Date(order.order_received_date);
        return orderDate >= firstDayOfMonth && orderDate <= lastDayOfMonth;
      });

      console.log(`Total orders: ${ordersData.length}, Current month orders: ${currentMonthOrders.length}`);

      // Fetch assignments for current month orders (in batches to avoid too many requests)
      const assignmentPromises = currentMonthOrders.slice(0, 100).map(async (order) => {
        try {
          const assignment = await getOrderAssignment(order.oid);
          return { orderId: order.oid, assignment: assignment?.data || assignment };
        } catch {
          return { orderId: order.oid, assignment: null };
        }
      });
      const assignmentResults = await Promise.all(assignmentPromises);
      
      console.log(`Fetched ${assignmentResults.length} assignments`);

      // Calculate wages from assigned orders using Stage 2 summary labourPrices.
      // Use labourType to get per-day wage from settings and multiply by number of days worked.
      const labourWagesFromOrders = {}; // Map of labourId/name -> total wages from orders
      const labourDaysFromOrders = {};  // Map of labourId/name -> total days worked (from assignments)

      assignmentResults.forEach(({ assignment }) => {
        if (!assignment || !assignment.stage2_summary_data) return;

        try {
          const stage2Summary =
            typeof assignment.stage2_summary_data === 'string'
              ? JSON.parse(assignment.stage2_summary_data)
              : assignment.stage2_summary_data;

          const labourPrices = stage2Summary?.labourPrices || [];

          labourPrices.forEach((lp) => {
            const labourId = lp.labourId || lp.labour_id;
            const labourName = lp.labourName || lp.labour;
            if (!labourId && !labourName) return;

            const idKey = labourId ? String(labourId) : null;
            const nameKey = (labourName || '').trim().toLowerCase();
            const key = idKey || nameKey;

            // Find matching labour to determine work type
            const labourRecord = allLabours.find((l) => {
              const lId = l.lid || l.id;
              if (idKey && String(lId) === idKey) return true;
              const lname = (l.full_name || l.name || '').trim().toLowerCase();
              return !idKey && lname === nameKey;
            });

            const workType = (labourRecord?.work_type || 'Normal').trim();
            const dailyRate =
              ratesMap[workType] ||
              parseFloat(labourRecord?.daily_wage) ||
              ratesMap['Normal'] ||
              0;

            if (!dailyRate) return;

            // Derive worked days from explicit field or from totalAmount / dailyRate
            const totalAmount = parseFloat(
              lp.totalAmount ?? lp.labourWage ?? lp.amount ?? 0
            );
            let days =
              parseFloat(lp.days || lp.workDays || lp.noOfDays || 0) || 0;

            if (!days && totalAmount) {
              days = totalAmount / dailyRate;
            }

            if (!days) {
              // Fallback: treat each line as one day
              days = 1;
            }

            const wageToAdd = dailyRate * days;

            if (!labourWagesFromOrders[key]) {
              labourWagesFromOrders[key] = 0;
            }
            if (!labourDaysFromOrders[key]) {
              labourDaysFromOrders[key] = 0;
            }

            labourWagesFromOrders[key] += wageToAdd;
            labourDaysFromOrders[key] += days;
          });
        } catch (error) {
          console.error('Error parsing stage2_summary_data for labour wages:', error);
        }
      });

      // Debug: Log the wages we found from orders
      console.log('Labour wages from orders (by id/name):', labourWagesFromOrders);

      // Calculate attendance stats for each labour
      const labourStats = {};
      allLabours.forEach(labour => {
        const labourId = labour.lid || labour.id;
        const labourName = labour.full_name || labour.name;
        let daysPresent = 0;
        let totalWages = 0;
        let totalPaid = 0; // This would come from payout API if available

        // Count present days from attendance data
        attendanceResults.forEach(result => {
          const labours = result?.data?.labours || [];
          const found = labours.find(l => (l.lid || l.id) === labourId);
          if (found && found.attendance_status?.toLowerCase() === 'present') {
            daysPresent++;
          }
        });

        // Calculate wages from assigned orders (primary source)
        // Try matching by normalized name (case-insensitive)
        const normalizedLabourName = labourName ? labourName.trim().toLowerCase() : '';
        // Prefer matching by ID, then fallback to name
        const idKey = String(labourId);
        let wagesFromOrders = labourWagesFromOrders[idKey] || 0;
        let daysFromOrders = labourDaysFromOrders[idKey] || 0;

        if (wagesFromOrders === 0 && normalizedLabourName) {
          wagesFromOrders = labourWagesFromOrders[normalizedLabourName] || 0;
          daysFromOrders = labourDaysFromOrders[normalizedLabourName] || 0;
        }
        
        // Use wages from assigned orders (based on labourType per-day rate × days)
        if (wagesFromOrders > 0) {
          totalWages = wagesFromOrders;
        } else {
          // No wages from orders - labour has no assigned orders
          totalWages = 0;
        }

        labourStats[labourId] = {
          daysPresent: daysFromOrders || daysPresent,
          totalWages,
          totalPaid,
          dues: totalWages - totalPaid,
          dailyWage:
            parseFloat(labour.daily_wage) ||
            ratesMap[labour.work_type] ||
            ratesMap['Normal'] ||
            0,
        };
      });

      // Calculate present today
      const presentToday = todayLabours.filter(l => 
        l.attendance_status?.toLowerCase() === 'present'
      ).length;

      // Calculate total wages and pending wages
      let totalWages = 0;
      let pendingWages = 0;
      let pendingCount = 0;

      Object.values(labourStats).forEach(stat => {
        totalWages += stat.totalWages;
        if (stat.dues > 0) {
          pendingWages += stat.dues;
          pendingCount++;
        }
      });

      // Prepare labour list with calculated data
      const labourList = allLabours.map(labour => {
        const labourId = labour.lid || labour.id;
        const stats = labourStats[labourId] || { daysPresent: 0, totalWages: 0, totalPaid: 0, dues: 0, dailyWage: 0 };
        const currentMonthDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        
        return {
          id: labour.labour_id || `LAB-${String(labourId).padStart(3, '0')}`,
          name: labour.full_name || labour.name || 'N/A',
          attendance: `${stats.daysPresent}/${currentMonthDays}`,
          wages: `₹${stats.totalWages.toLocaleString('en-IN')}`,
          paid: `₹${stats.totalPaid.toLocaleString('en-IN')}`,
          dues: `₹${stats.dues.toLocaleString('en-IN')}`,
          status: labour.status || 'Active',
          lid: labourId
        };
      });

      setLabours(labourList);
      setStats({
        totalLabour: allLabours.length,
        presentToday: presentToday,
        totalWages: totalWages,
        pendingWages: pendingWages,
        pendingCount: pendingCount
      });

    } catch (error) {
      console.error('Error fetching labour data:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayStats = [
    { 
      label: 'Total Labour', 
      value: stats.totalLabour.toString(), 
      change: `${Math.round((stats.presentToday / stats.totalLabour) * 100) || 0}% Present`, 
      color: 'bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0]' 
    },
    { 
      label: 'Present Today', 
      value: stats.presentToday.toString(), 
      change: `${Math.round((stats.presentToday / stats.totalLabour) * 100) || 0}%`, 
      color: 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]' 
    },
    { 
      label: 'Total Wages', 
      value: formatCurrency(stats.totalWages), 
      change: 'This Month', 
      color: 'bg-gradient-to-r from-[#10B981] to-[#059669]' 
    },
    { 
      label: 'Pending Wages', 
      value: formatCurrency(stats.pendingWages), 
      change: `${stats.pendingCount} Labour`, 
      color: 'bg-gradient-to-r from-[#047857] to-[#065F46]' 
    }
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D8568] mx-auto"></div>
            <p className="mt-4 text-[#0D5C4D]">Loading labour data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] mb-6">
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Reports</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {displayStats.map((stat, index) => (
          <div key={index} className={`${stat.color} rounded-2xl p-6 ${index === 2 || index === 3 ? 'text-white' : 'text-[#0D5C4D]'}`}>
            <div className="text-sm font-medium mb-2 opacity-90">{stat.label}</div>
            <div className="text-4xl font-bold mb-2">{stat.value}</div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${index === 2 || index === 3 ? 'bg-white/20 text-white' : 'bg-white/60 text-[#0D5C4D]'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#D4F4E8]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Labour ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Total Wages</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Paid</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Dues</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Status</th>
              </tr>
            </thead>
            <tbody>
              {labours.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-[#6B8782]">
                    No labour data available
                  </td>
                </tr>
              ) : (
                labours.map((labour, index) => (
                  <tr key={index} className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'}`}>
                    <td className="px-6 py-4 text-sm text-[#0D5C4D]">{labour.id}</td>
                    <td className="px-6 py-4 font-semibold text-[#0D5C4D]">{labour.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#0D5C4D]">{labour.wages}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#047857]">{labour.paid}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600">{labour.dues}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#4ED39A] text-white flex items-center gap-1 w-fit">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                        {labour.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
          <div className="text-sm text-[#6B8782]">Showing {labours.length} of {stats.totalLabour} labours</div>
          <div className="flex items-center gap-2">
            {/* Pagination can be added here if needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportLabour;