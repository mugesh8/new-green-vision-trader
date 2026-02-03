import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getAllLabours } from '../../../api/labourApi';
import { getAllLabourRates } from '../../../api/labourRateApi';
import { getAllLabourExcessPay } from '../../../api/labourExcessPayApi';
import { getAllAttendance, getAttendanceByLabourId } from '../../../api/labourAttendanceApi';

const ITEMS_PER_PAGE = 7;

const toDateStr = (val) => {
  if (!val) return '';
  try {
    return new Date(val).toISOString().split('T')[0];
  } catch {
    return String(val).substring(0, 10);
  }
};

const getStorageKey = (labourId) => (labourId ? `labour-daily-paid-${labourId}` : 'labour-daily-paid');

const LabourDailyPayout = () => {
  const navigate = useNavigate();
  const { id: labourIdParam } = useParams();
  const labourId = labourIdParam ? String(labourIdParam) : '';

  const [loading, setLoading] = useState(true);
  const [labourName, setLabourName] = useState('');
  const [payoutData, setPayoutData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [paidKeys, setPaidKeys] = useState(() => {
    try {
      const key = getStorageKey(labourId);
      const stored = localStorage.getItem(key);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (!labourId) {
      navigate('/labour', { replace: true });
      return;
    }
    try {
      const key = getStorageKey(labourId);
      const stored = localStorage.getItem(key);
      setPaidKeys(stored ? new Set(JSON.parse(stored)) : new Set());
    } catch {
      setPaidKeys(new Set());
    }
    fetchLabourDailyPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch when labourId is set
  }, [labourId]);

  useEffect(() => {
    if (!labourId) return;
    try {
      const key = getStorageKey(labourId);
      localStorage.setItem(key, JSON.stringify([...paidKeys]));
    } catch {
      // ignore
    }
  }, [labourId, paidKeys]);

  const fetchLabourDailyPayouts = async () => {
    try {
      setLoading(true);

      const [ordersRes, laboursRes, ratesRes, excessRes, attendanceForLabourRes] = await Promise.all([
        getAllOrders().catch(() => ({ data: [] })),
        getAllLabours(1, 1000).catch(() => ({ data: [] })),
        getAllLabourRates().catch(() => []),
        getAllLabourExcessPay().catch(() => ({ data: [] })),
        labourId ? getAttendanceByLabourId(labourId).catch(() => null) : Promise.resolve(null)
      ]);

      const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
      const labours = Array.isArray(laboursRes) ? laboursRes : (laboursRes?.data || laboursRes?.labours || []);
      const labourRates = Array.isArray(ratesRes) ? ratesRes : (ratesRes?.data || []);
      const excessPays = Array.isArray(excessRes) ? excessRes : (excessRes?.data || []);

      const labourMap = new Map(labours.map((l) => [String(l.lid), l]));
      const ratesMap = {};
      labourRates.forEach((rate) => {
        if (rate.status === 'Active' && rate.labourType) {
          ratesMap[rate.labourType] = parseFloat(rate.amount) || 0;
        }
      });
      // Excess pay is per labour AND per date – key by date_labourId so we only show it on the matching day
      const excessByDateAndLabour = {};
      excessPays.forEach((pay) => {
        const id = String(pay.labour_id ?? pay.labourId ?? '');
        const dateStr = toDateStr(pay.date ?? pay.pay_date);
        if (id && dateStr) {
          const key = `${dateStr}_${id}`;
          excessByDateAndLabour[key] = (excessByDateAndLabour[key] || 0) + (parseFloat(pay.amount) || 0);
        }
      });

      const rowKeyToWage = {};
      const rowKeyToLabourId = {};
      const rowKeyToLabourName = {};

      const assignmentPromises = orders.map(async (order) => {
        try {
          const assignmentRes = await getOrderAssignment(order.oid).catch(() => null);
          if (!assignmentRes?.data?.stage2_summary_data) return;

          let summary;
          try {
            summary =
              typeof assignmentRes.data.stage2_summary_data === 'string'
                ? JSON.parse(assignmentRes.data.stage2_summary_data)
                : assignmentRes.data.stage2_summary_data;
          } catch {
            return;
          }

          const orderDate = order.order_received_date || order.createdAt;
          const dateStr = toDateStr(orderDate);
          if (!dateStr) return;

          const labourPrices = summary.labourPrices || [];
          labourPrices.forEach((lp) => {
            const labourId = lp.labourId ?? lp.labour_id;
            const labourName = lp.labourName ?? lp.labour ?? '';
            if (!labourId && !labourName) return;

            const idKey = labourId ? String(labourId) : null;
            const nameKey = (labourName || '').trim().toLowerCase();
            const labour = idKey ? labourMap.get(idKey) : labours.find((l) => (l.full_name || l.name || '').trim().toLowerCase() === nameKey);
            const resolvedId = labour ? String(labour.lid) : idKey || nameKey;
            const resolvedName = labour ? labour.full_name || labour.name : labourName || resolvedId;

            const key = `${dateStr}_${resolvedId}`;
            const wage = parseFloat(lp.totalAmount ?? lp.labourWage ?? lp.amount ?? 0) || 0;
            rowKeyToWage[key] = (rowKeyToWage[key] || 0) + wage;
            rowKeyToLabourId[key] = resolvedId;
            rowKeyToLabourName[key] = resolvedName;
          });
        } catch (err) {
          console.error('Error processing order for labour daily payout:', err);
        }
      });

      await Promise.all(assignmentPromises);

      const presentDatesSet = new Set();
      if (labourId) {
        const list = Array.isArray(attendanceForLabourRes?.data) ? attendanceForLabourRes.data : (attendanceForLabourRes?.records || []);
        list.forEach((rec) => {
          const status = (rec.status ?? rec.attendance_status ?? rec.attendanceStatus ?? '').toString().toLowerCase();
          const dateStr = toDateStr(rec.date ?? rec.attendance_date ?? rec.attendanceDate);
          if (dateStr && (status === 'present' || status === 'Present')) {
            presentDatesSet.add(dateStr);
          }
        });
        if (presentDatesSet.size === 0 && list.length === 0) {
          const end = new Date();
          const start = new Date(end);
          start.setDate(start.getDate() - 60);
          const datesToFetch = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            datesToFetch.push(toDateStr(d));
          }
          const overviews = await Promise.all(
            datesToFetch.map((dateStr) => getAllAttendance({ date: dateStr, status: 'Present' }).catch(() => ({ data: { labours: [] } })))
          );
          overviews.forEach((res, i) => {
            const labours = res?.data?.labours || [];
            const hasThisLabour = labours.some((l) => String(l.lid ?? l.labour_id ?? l.id ?? '') === String(labourId));
            if (hasThisLabour && datesToFetch[i]) presentDatesSet.add(datesToFetch[i]);
          });
        }
      }

      let paidSet = new Set();
      try {
        const storageKey = getStorageKey(labourId);
        const stored = localStorage.getItem(storageKey);
        if (stored) JSON.parse(stored).forEach((k) => paidSet.add(k));
      } catch {
        // ignore
      }

      let rows = Object.entries(rowKeyToWage).map(([key]) => {
        const labourId = rowKeyToLabourId[key] || '';
        const labourName = rowKeyToLabourName[key] || labourId;
        const labour = labourMap.get(labourId);
        const workType = (labour?.work_type || 'Normal').trim();
        const workload = workType === 'Heavy' ? 'Heavy' : workType === 'Light' ? 'Light' : 'Normal';
        const dailyWage = (ratesMap[workType] ?? ratesMap['Normal'] ?? parseFloat(labour?.daily_wage)) || 0;
        const status = paidSet.has(key) ? 'Paid' : 'Pending';
        const [date] = key.split('_');
        return {
          key,
          date,
          labourId,
          labourName,
          workload,
          dailyWage,
          excessPay: 0,
          totalPayout: dailyWage,
          status
        };
      });

      rows.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

      // Assign excess pay only to the row whose date matches the excess pay record
      rows.forEach((r) => {
        const key = `${r.date}_${r.labourId}`;
        const excess = excessByDateAndLabour[key] ?? 0;
        r.excessPay = excess;
        r.totalPayout = r.dailyWage + excess;
      });

      if (labourId) {
        rows = rows.filter((r) => String(r.labourId) === labourId);
        if (presentDatesSet.size > 0) {
          rows = rows.filter((r) => presentDatesSet.has(r.date));
          const labour = labourMap.get(labourId);
          const resolvedName = labour ? (labour.full_name || labour.name || '') : '';
          const workType = (labour?.work_type || 'Normal').trim();
          const workload = workType === 'Heavy' ? 'Heavy' : workType === 'Light' ? 'Light' : 'Normal';
          const dailyWageFromRate = (ratesMap[workType] ?? ratesMap['Normal'] ?? parseFloat(labour?.daily_wage)) || 0;
          presentDatesSet.forEach((dateStr) => {
            if (!rows.some((r) => r.date === dateStr)) {
              const key = `${dateStr}_${labourId}`;
              const excess = excessByDateAndLabour[key] ?? 0;
              rows.push({
                key,
                date: dateStr,
                labourId,
                labourName: resolvedName,
                workload,
                dailyWage: dailyWageFromRate,
                excessPay: excess,
                totalPayout: dailyWageFromRate + excess,
                status: paidSet.has(key) ? 'Paid' : 'Pending'
              });
            }
          });
          rows.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
        }
        if (rows.length > 0) {
          setLabourName(rows[0].labourName || '');
        } else {
          const labour = labourMap.get(labourId);
          setLabourName(labour ? (labour.full_name || labour.name || '') : '');
        }
      }

      setPayoutData(rows);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching labour daily payouts:', error);
      setPayoutData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = (key) => {
    setPaidKeys((prev) => new Set([...prev, key]));
    setPayoutData((prev) => prev.map((p) => (p.key === key ? { ...p, status: 'Paid' } : p)));
  };

  const getStatusColor = (status) => {
    return status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700';
  };

  const getWorkloadColor = (workload) => {
    if (workload === 'Light') return 'bg-blue-100 text-blue-700';
    if (workload === 'Normal') return 'bg-green-100 text-green-700';
    return 'bg-orange-100 text-orange-700';
  };

  const formatNum = (n) =>
    Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';

  const totalPending = payoutData
    .filter((p) => p.status === 'Pending')
    .reduce((sum, p) => sum + p.totalPayout, 0);

  const totalPages = Math.max(1, Math.ceil(payoutData.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = payoutData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const startItem = payoutData.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + ITEMS_PER_PAGE, payoutData.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(labourId ? `/labour/${labourId}` : '/labour')}
            className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{labourId ? 'Back to Labour Details' : 'Back to Labour'}</span>
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Labour Daily Payout{labourName ? ` – ${labourName}` : ''}
          </h1>
          <p className="text-gray-600 mt-1">
            {labourId ? `Daily payout for this labour` : 'Manage daily payouts for labour'}
          </p>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#D4F4E8]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Labour Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Workload</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Daily Wage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Excess Pay</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Total Payout</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-[#6B8782]">
                      Loading daily payouts...
                    </td>
                  </tr>
                ) : payoutData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-[#6B8782]">
                      No payout data yet.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((payout, index) => (
                    <tr
                      key={payout.key}
                      className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0D5C4D] text-sm">
                          {new Date(payout.date + 'T12:00:00').toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0D5C4D] text-sm">{payout.labourName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getWorkloadColor(payout.workload)}`}>
                          {payout.workload}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0D5C4D] text-sm">₹{formatNum(payout.dailyWage)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-green-600 text-sm">+₹{formatNum(payout.excessPay)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0D5C4D] text-sm">₹{formatNum(payout.totalPayout)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {payout.status === 'Pending' ? (
                          <button
                            onClick={() => handlePay(payout.key)}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors"
                          >
                            Pay
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 font-medium">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
            <div className="text-sm text-[#6B8782]">
              Showing {startItem}–{endItem} of {payoutData.length} days
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#0D5C4D] bg-white border border-[#D0E0DB] hover:bg-[#D4F4E8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-[#6B8782] px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#0D5C4D] bg-white border border-[#D0E0DB] hover:bg-[#D4F4E8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="text-sm font-semibold text-[#0D5C4D]">
              Total Pending: <span className="text-[#0D7C66]">₹{formatNum(totalPending)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabourDailyPayout;