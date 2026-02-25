import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, ChevronDown, Pencil, Trash2, X } from 'lucide-react';
import {
  getAllAttendance,
  markPresent,
  markAbsent,
  deleteAttendanceRecord
} from '../../../api/labourAttendanceApi';

const getCurrentTimeHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const parseTimeToHHMM = (str) => {
  if (!str || str === '--:-- --') return '';
  const trimmed = String(str).trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    if (match[4]) {
      if (match[4].toUpperCase() === 'PM' && h < 12) h += 12;
      if (match[4].toUpperCase() === 'AM' && h === 12) h = 0;
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed.length === 4 ? `0${trimmed}` : trimmed;
  return '';
};

const ABSENT_STATUSES = ['informed leave', 'uninformed leave', 'leave', 'voluntary leave', 'normal absent', 'Absent'];

const STATUS_OPTIONS = [
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'informed leave', label: 'Informed Leave' },
  { value: 'uninformed leave', label: 'Uninformed Leave' },
  { value: 'leave', label: 'Leave' },
  { value: 'voluntary leave', label: 'Voluntary Leave' },
  { value: 'normal absent', label: 'Normal Absent' }
];

const getTodayYYYYMMDD = () => new Date().toISOString().split('T')[0];

const LabourAttendanceEdit = () => {
  const navigate = useNavigate();
  const [attendanceDate, setAttendanceDate] = useState(getTodayYYYYMMDD);
  const [activeTab, setActiveTab] = useState('attendanceEdit');
  const [filters, setFilters] = useState({
    status: 'All'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Total Registered', value: '0', color: 'bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0]', textColor: 'text-[#0D5C4D]' },
    { label: 'Present', value: '0', color: 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]', textColor: 'text-[#0D5C4D]' },
    { label: 'Absent', value: '0', color: 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]', textColor: 'text-[#0D5C4D]' },
    { label: 'Not Marked Yet', value: '0', color: 'bg-gradient-to-r from-[#047857] to-[#065F46]', textColor: 'text-white' }
  ]);
  const [editModal, setEditModal] = useState(null);
  const [editStatus, setEditStatus] = useState('Present');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, [filters, attendanceDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const params = {
        date: attendanceDate,
        status: filters.status !== 'All' ? filters.status : undefined
      };
      const response = await getAllAttendance(params);

      if (response.success) {
        const { labours: labourData, stats: statsData } = response.data;
        setStats([
          { label: 'Total Registered', value: statsData.totalRegistered?.toString() || '0', color: 'bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0]', textColor: 'text-[#0D5C4D]' },
          { label: 'Present', value: statsData.present?.toString() || '0', color: 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]', textColor: 'text-[#0D5C4D]' },
          { label: 'Absent', value: statsData.absent?.toString() || '0', color: 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]', textColor: 'text-[#0D5C4D]' },
          { label: 'Not Marked Yet', value: statsData.notMarked?.toString() || '0', color: 'bg-gradient-to-r from-[#047857] to-[#065F46]', textColor: 'text-white' }
        ]);

        const transformedLabours = labourData.map(labour => {
          const status = labour.attendance_status || 'Not Marked';
          let statusColor = 'bg-orange-500';
          if (status === 'Present') statusColor = 'bg-[#10B981]';
          else if (ABSENT_STATUSES.includes(status)) statusColor = 'bg-red-500';

          return {
            id: labour.lid,
            attendanceId: labour.attendance_id || null,
            name: labour.full_name,
            labourId: labour.labour_id,
            phone: labour.mobile_number,
            department: labour.department,
            checkIn: parseTimeToHHMM(labour.check_in_time) || '',
            checkOut: parseTimeToHHMM(labour.check_out_time) || '',
            status,
            statusColor
          };
        });

        setLabours(transformedLabours);
      }
    } catch (error) {
      console.error('Error fetching labour attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'labourList') navigate('/labour');
    else if (tab === 'attendance') navigate('/labour/attendance');
    else if (tab === 'attendanceEdit') navigate('/labour/attendance/edit');
    else if (tab === 'excessPay') navigate('/labour/excess-pay');
    else if (tab === 'dailyPayout') navigate('/labour/daily-payout');
  };

  const openEditModal = (labour) => {
    setEditModal(labour);
    setEditStatus(
      labour.status === 'Present'
        ? 'Present'
        : ABSENT_STATUSES.includes(labour.status)
          ? labour.status
          : 'Absent'
    );
  };

  const closeEditModal = () => {
    setEditModal(null);
    setEditStatus('Present');
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const time = editModal.checkIn ? `${editModal.checkIn}:00` : getCurrentTimeHHMM() + ':00';
      if (editStatus === 'Present') {
        await markPresent(editModal.id, { date: attendanceDate, time });
      } else {
        await markAbsent(editModal.id, { date: attendanceDate, type: editStatus });
      }
      closeEditModal();
      await fetchAttendanceData();
    } catch (error) {
      console.error('Error updating labour attendance:', error);
      alert('Failed to update attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (labour) => {
    if (!labour.attendanceId) {
      alert('No attendance record to delete.');
      return;
    }
    if (!window.confirm(`Delete attendance record for ${labour.name} on ${attendanceDate}?`)) return;
    try {
      await deleteAttendanceRecord(labour.attendanceId);
      await fetchAttendanceData();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      alert('Failed to delete attendance record.');
    }
  };

  const filteredLabours = labours.filter(labour => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      labour.name.toLowerCase().includes(q) ||
      labour.labourId.toLowerCase().includes(q) ||
      (labour.phone && labour.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleTabChange('labourList')}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'labourList'
            ? 'bg-[#10B981] text-white'
            : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'
            }`}
        >
          Labour List
        </button>
        <button
          onClick={() => handleTabChange('attendance')}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'attendance'
            ? 'bg-[#0D7C66] text-white'
            : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'
            }`}
        >
          Attendance
        </button>
        <button
          onClick={() => handleTabChange('attendanceEdit')}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'attendanceEdit'
            ? 'bg-[#0D7C66] text-white'
            : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'
            }`}
        >
          Attendance Edit
        </button>
        <button
          onClick={() => handleTabChange('excessPay')}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'excessPay'
            ? 'bg-[#10B981] text-white'
            : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'
            }`}
        >
          Excess Pay
        </button>
        <button
          onClick={() => handleTabChange('dailyPayout')}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'dailyPayout'
            ? 'bg-[#10B981] text-white'
            : 'bg-[#D4F4E8] text-[#0D5C4D] hover:bg-[#B8F4D8]'
            }`}
        >
          Labour Daily Payout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.color} rounded-2xl p-6 ${stat.textColor}`}>
            <div className="text-sm font-medium mb-2 opacity-90">{stat.label}</div>
            <div className="text-3xl sm:text-4xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B8782]" size={20} />
          <input
            type="text"
            placeholder="Search labour..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-[#D0E0DB] rounded-lg text-[#0D5C4D] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
          />
        </div>
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="appearance-none bg-white border border-[#D0E0DB] rounded-lg px-4 py-2.5 pr-10 text-sm text-[#0D5C4D] focus:outline-none focus:ring-2 focus:ring-[#0D8568] cursor-pointer min-w-[140px]"
          >
            <option value="All">Status: All</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B8782] pointer-events-none" size={16} />
        </div>
        <div className="flex items-center gap-2 min-w-[160px]">
          <Calendar size={16} className="text-[#6B8782] flex-shrink-0" />
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="flex-1 bg-white border border-[#D0E0DB] rounded-lg px-3 py-2.5 text-sm text-[#0D5C4D] focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-[#D4F4E8]">
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Labour Info</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Department</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Check-in Time</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Check-out Time</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Status</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-[#0D5C4D]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-[#6B8782]">Loading attendance data...</td>
                </tr>
              ) : filteredLabours.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-[#6B8782]">No labours found</td>
                </tr>
              ) : (
                filteredLabours.map((labour, index) => (
                  <tr
                    key={labour.id}
                    className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'}`}
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {labour.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#0D5C4D]">{labour.name}</div>
                          <div className="text-xs text-[#6B8782]">{labour.labourId} • {labour.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-[#0D5C4D]">
                      {labour.department || '--'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-[#0D5C4D]">
                      {labour.checkIn || '--'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-[#0D5C4D]">
                      {labour.checkOut || '--'}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit text-white ${labour.statusColor}`}>
                        <span className="w-2 h-2 rounded-full bg-white" />
                        {labour.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(labour)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0D7C66] hover:bg-[#0a6354] text-white"
                          title="Edit attendance"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(labour)}
                          disabled={!labour.attendanceId}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${labour.attendanceId ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                          title="Delete attendance record"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
          <div className="text-sm text-[#6B8782]">
            Showing {filteredLabours.length} of {labours.length} labours
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeEditModal}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0D5C4D]">Edit Attendance</h3>
              <button onClick={closeEditModal} className="p-1 rounded hover:bg-gray-100 text-[#6B8782]">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[#6B8782] mb-4">{editModal.name} • {attendanceDate}</p>
            <label className="block text-sm font-medium text-[#0D5C4D] mb-2">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full bg-white border border-[#D0E0DB] rounded-lg px-4 py-2.5 text-sm text-[#0D5C4D] focus:outline-none focus:ring-2 focus:ring-[#0D8568] mb-6"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#0D5C4D] bg-[#D4F4E8] hover:bg-[#B8F4D8]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#0D7C66] hover:bg-[#0a6354] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourAttendanceEdit;

