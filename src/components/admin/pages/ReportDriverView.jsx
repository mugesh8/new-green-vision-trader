import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { getAllDrivers } from '../../../api/driverApi';
import { getAllExcessKMs } from '../../../api/excessKmApi';
import { getAllFuelExpenses } from '../../../api/fuelExpenseApi';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportDriverView = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState(null);
  const [excessKMs, setExcessKMs] = useState([]);
  const [fuelExpenses, setFuelExpenses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderAssignments, setOrderAssignments] = useState({});

  useEffect(() => {
    fetchData();
  }, [driverId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [driversRes, excessKMsRes, fuelExpensesRes, ordersRes] = await Promise.all([
        getAllDrivers().catch(() => ({ data: [] })),
        getAllExcessKMs().catch(() => ({ data: [] })),
        getAllFuelExpenses().catch(() => ({ data: [] })),
        getAllOrders().catch(() => ({ data: [] }))
      ]);

      const driversData = driversRes?.data || (Array.isArray(driversRes) ? driversRes : []);
      const excessKMData = excessKMsRes?.data || (Array.isArray(excessKMsRes) ? excessKMsRes : []);
      const fuelExpenseData = fuelExpensesRes?.data || (Array.isArray(fuelExpensesRes) ? fuelExpensesRes : []);
      const ordersData = ordersRes?.data || (Array.isArray(ordersRes) ? ordersRes : []);

      // Find the specific driver
      const foundDriver = driversData.find(d => String(d.did) === String(driverId));
      if (foundDriver) {
        setDriver(foundDriver);
      }

      setExcessKMs(excessKMData);
      setFuelExpenses(fuelExpenseData);
      setOrders(ordersData);

      // Fetch order assignments
      const assignmentsData = {};
      for (const order of ordersData) {
        try {
          const assignmentResponse = await getOrderAssignment(order.oid).catch(() => null);
          if (assignmentResponse?.data) {
            assignmentsData[order.oid] = assignmentResponse.data;
          }
        } catch {
          // If assignment doesn't exist, that's fine
          assignmentsData[order.oid] = null;
        }
      }
      setOrderAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching driver report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const driverReportData = useMemo(() => {
    if (!driver) return null;

    const driverIdStr = String(driver.did);
    
    // Get all excess KM records for this driver
    const driverExcessKMs = excessKMs.filter(km => 
      String(km.driver_id || km.did || km.driver?.did || '') === driverIdStr
    );

    // Get all fuel expenses for this driver
    const driverFuelExpenses = fuelExpenses.filter(expense => 
      String(expense.driver_id || expense.did || expense.driver?.did || '') === driverIdStr
    );

    // Calculate totals
    const totalStartKM = driverExcessKMs.reduce((sum, km) => sum + (parseFloat(km.start_km) || 0), 0);
    const totalEndKM = driverExcessKMs.reduce((sum, km) => sum + (parseFloat(km.end_km) || 0), 0);
    const totalKilometers = driverExcessKMs.reduce((sum, km) => sum + (parseFloat(km.kilometers) || 0), 0);
    
    // Calculate fuel expenses and litres
    let totalFuelExpenses = 0;
    let totalFuelLitres = 0;
    
    driverFuelExpenses.forEach(expense => {
      const total = parseFloat(expense.total_amount || expense.total || expense.amount || 0);
      
      if (total > 0) {
        totalFuelExpenses += total;
      } else {
        const unitPrice = parseFloat(expense.unit_price || expense.unitPrice || 0);
        const litre = parseFloat(expense.litre || expense.liter || 0);
        if (unitPrice > 0 && litre > 0) {
          totalFuelExpenses += (unitPrice * litre);
        }
      }
      
      const litre = parseFloat(expense.litre || expense.liter || 0);
      totalFuelLitres += litre;
    });

    return {
      id: driverIdStr,
      driverName: driver.driver_name || 'Unknown Driver',
      driverCode: driver.driver_id || `DRV-${driverIdStr}`,
      vehicleNumber: driver.vehicle_number || 'N/A',
      startKM: totalStartKM,
      endKM: totalEndKM,
      totalKilometers: totalKilometers,
      fuelLitres: totalFuelLitres,
      fuelExpenses: totalFuelExpenses,
      excessKMRecords: driverExcessKMs,
      fuelExpenseRecords: driverFuelExpenses
    };
  }, [driver, excessKMs, fuelExpenses]);

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    // Use Rs. instead of ₹ for better PDF compatibility
    return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num) => {
    return parseFloat(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const exportToExcel = () => {
    if (!driverReportData || dailyLogData.length === 0) return;

    const data = dailyLogData.map(row => ({
      'Date': row.date,
      'Local': row.isLocal,
      'AIRP': row.isAirport,
      'IN KM': row.inKM > 0 ? row.inKM.toFixed(0) : '',
      'OUT': row.outKM > 0 ? row.outKM.toFixed(0) : '',
      'LOC': row.locKM > 0 ? row.locKM.toFixed(0) : '0',
      'Diesel': row.diesel > 0 ? row.diesel.toFixed(2) : '0',
      'Fuel Expenses': row.fuelExpense > 0 ? row.fuelExpense.toFixed(2) : '0.00',
      'Driver': row.driverName
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Driver Daily Log');
    XLSX.writeFile(wb, `Driver_Report_${driverReportData.driverCode}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!driverReportData || dailyLogData.length === 0) return;

    const doc = new jsPDF();

    // Header
    doc.setFillColor(13, 92, 77);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('DRIVER DETAIL REPORT', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Driver: ${driverReportData.driverName} (${driverReportData.driverCode})`, 105, 28, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 105, 35, { align: 'center' });

    // Driver Summary Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Summary:', 14, 50);
    doc.setFont(undefined, 'normal');
    doc.text(`Vehicle Number: ${driverReportData.vehicleNumber}`, 14, 57);
    doc.text(`Total Kilometers: ${formatNumber(driverReportData.totalKilometers)}`, 14, 64);
    doc.text(`Total Fuel Litres: ${formatNumber(driverReportData.fuelLitres)}`, 14, 71);
    doc.text(`Total Fuel Expenses: ${formatNumber(driverReportData.fuelExpenses)}`, 14, 78);

    // Table
    const tableData = dailyLogData.map(row => [
      row.date,
      row.isLocal.toString(),
      row.isAirport.toString(),
      row.inKM > 0 ? row.inKM.toFixed(0) : '',
      row.outKM > 0 ? row.outKM.toFixed(0) : '',
      row.locKM > 0 ? row.locKM.toFixed(0) : '0',
      row.diesel > 0 ? row.diesel.toFixed(2) : '0',
      row.fuelExpense > 0 ? row.fuelExpense.toFixed(2) : '0.00',
      row.driverName
    ]);

    doc.autoTable({
      startY: 85,
      head: [['DATE', 'LOCAL', 'AIRP', 'IN KM', 'OUT', 'LOC', 'DIESEL', 'FUEL EXPENSES', 'DRIVER']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [13, 92, 77], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
      bodyStyles: { fontSize: 8, halign: 'center' },
      alternateRowStyles: { fillColor: [240, 253, 244] }
    });

    doc.save(`Driver_Report_${driverReportData.driverCode}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generate daily log data
  const dailyLogData = useMemo(() => {
    if (!driverReportData) return [];

    const allRecords = [];
    
    // Add excess KM records
    driverReportData.excessKMRecords.forEach(km => {
      const date = km.date || km.created_at || '';
      const normalizedDate = date ? new Date(date).toISOString().split('T')[0] : '';
      if (normalizedDate) {
        allRecords.push({
          date: normalizedDate,
          type: 'km',
          data: km
        });
      }
    });
    
    // Add fuel expense records
    driverReportData.fuelExpenseRecords.forEach(expense => {
      const date = expense.date || expense.created_at || '';
      const normalizedDate = date ? new Date(date).toISOString().split('T')[0] : '';
      if (normalizedDate) {
        allRecords.push({
          date: normalizedDate,
          type: 'fuel',
          data: expense
        });
      }
    });
    
    // Process orders to find driver assignments by date
    const ordersByDate = {};
    const driverIdStr = String(driverReportData.id);
    const driverName = driverReportData.driverName;
    
    console.log('Processing orders for driver:', { driverIdStr, driverName, totalOrders: orders.length });
    
    orders.forEach(order => {
      const assignment = orderAssignments[order.oid];
      if (!assignment) {
        console.log(`No assignment found for order ${order.oid}`);
        return;
      }
      
      // Get order date - try multiple date fields
      const orderDate = order.order_received_date || order.order_date || order.createdAt || order.created_at || '';
      if (!orderDate) {
        console.log(`No date found for order ${order.oid}`);
        return;
      }
      
      let normalizedOrderDate;
      try {
        normalizedOrderDate = new Date(orderDate).toISOString().split('T')[0];
      } catch (error) {
        console.error(`Error parsing date for order ${order.oid}:`, orderDate, error);
        return;
      }
      
      console.log(`Processing order ${order.oid}, date: ${normalizedOrderDate}, type: ${order.order_type}`);
      
      // Check if driver is assigned in this order
      let isDriverAssigned = false;
      
      // Check Stage 1 data (delivery routes)
      if (assignment.stage1_data) {
        try {
          const stage1Data = typeof assignment.stage1_data === 'string' 
            ? JSON.parse(assignment.stage1_data) 
            : assignment.stage1_data;
          
          const deliveryRoutes = stage1Data.deliveryRoutes || [];
          for (const route of deliveryRoutes) {
            const routeDriverId = String(route.driverId || route.driver_id || '');
            const routeDriverName = route.driverName || route.driver_name || '';
            
            if (routeDriverId === driverIdStr || 
                routeDriverName === driverName ||
                routeDriverName.includes(driverName) ||
                driverName.includes(routeDriverName)) {
              isDriverAssigned = true;
              break;
            }
          }
        } catch (e) {
          console.error('Error parsing stage1_data:', e);
        }
      }
      
      // Check Stage 3 data (driver assignments)
      if (!isDriverAssigned && assignment.stage3_data) {
        try {
          const stage3Data = typeof assignment.stage3_data === 'string' 
            ? JSON.parse(assignment.stage3_data) 
            : assignment.stage3_data;
          
          // Check driverAssignments in summaryData
          const driverAssignments = stage3Data.summaryData?.driverAssignments || [];
          for (const da of driverAssignments) {
            const daDriverId = String(da.driverId || da.driver_id || '');
            let daDriverName = da.driver || da.driverName || '';
            
            // Handle "Name - DRV-001" format
            if (daDriverName.includes(' - ')) {
              const nameParts = daDriverName.split(' - ');
              daDriverName = nameParts[0].trim();
            }
            
            if (daDriverId === driverIdStr || 
                daDriverName.toLowerCase() === driverName.toLowerCase() ||
                daDriverName.toLowerCase().includes(driverName.toLowerCase()) ||
                driverName.toLowerCase().includes(daDriverName.toLowerCase())) {
              isDriverAssigned = true;
              break;
            }
          }
          
          // Check products array for driver assignments
          if (!isDriverAssigned) {
            const products = stage3Data.products || [];
            for (const product of products) {
              let productDriverName = product.selectedDriver || product.driver || product.driverName || '';
              
              // Handle "Name - DRV-001" format
              if (productDriverName.includes(' - ')) {
                const nameParts = productDriverName.split(' - ');
                productDriverName = nameParts[0].trim();
              }
              
              if (productDriverName.toLowerCase() === driverName.toLowerCase() ||
                  productDriverName.toLowerCase().includes(driverName.toLowerCase()) ||
                  driverName.toLowerCase().includes(productDriverName.toLowerCase())) {
                isDriverAssigned = true;
                break;
              }
            }
          }
          
          // Check airportGroups
          if (!isDriverAssigned) {
            const airportGroups = stage3Data.summaryData?.airportGroups || {};
            for (const group of Object.values(airportGroups)) {
              let groupDriver = group.driver || '';
              
              // Handle "Name - DRV-001" format
              if (groupDriver.includes(' - ')) {
                const nameParts = groupDriver.split(' - ');
                groupDriver = nameParts[0].trim();
              }
              
              if (groupDriver.toLowerCase() === driverName.toLowerCase() || 
                  (groupDriver && groupDriver.toLowerCase().includes(driverName.toLowerCase())) ||
                  (driverName && driverName.toLowerCase().includes(groupDriver.toLowerCase()))) {
                isDriverAssigned = true;
                break;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing stage3_data:', e);
        }
      }
      
      // Also check stage3_summary_data if available
      if (!isDriverAssigned && assignment.stage3_summary_data) {
        try {
          const stage3SummaryData = typeof assignment.stage3_summary_data === 'string' 
            ? JSON.parse(assignment.stage3_summary_data) 
            : assignment.stage3_summary_data;
          
          // Check driverAssignments
          const driverAssignments = stage3SummaryData.driverAssignments || [];
          for (const da of driverAssignments) {
            const daDriverId = String(da.driverId || da.driver_id || '');
            let daDriverName = da.driver || da.driverName || '';
            
            // Handle "Name - DRV-001" format
            if (daDriverName.includes(' - ')) {
              const nameParts = daDriverName.split(' - ');
              daDriverName = nameParts[0].trim();
            }
            
            if (daDriverId === driverIdStr || 
                daDriverName.toLowerCase() === driverName.toLowerCase() ||
                daDriverName.toLowerCase().includes(driverName.toLowerCase()) ||
                driverName.toLowerCase().includes(daDriverName.toLowerCase())) {
              isDriverAssigned = true;
              break;
            }
          }
          
          // Check airportGroups
          if (!isDriverAssigned) {
            const airportGroups = stage3SummaryData.airportGroups || {};
            for (const group of Object.values(airportGroups)) {
              let groupDriver = group.driver || '';
              
              // Handle "Name - DRV-001" format
              if (groupDriver.includes(' - ')) {
                const nameParts = groupDriver.split(' - ');
                groupDriver = nameParts[0].trim();
              }
              
              if (groupDriver.toLowerCase() === driverName.toLowerCase() || 
                  (groupDriver && groupDriver.toLowerCase().includes(driverName.toLowerCase())) ||
                  (driverName && driverName.toLowerCase().includes(groupDriver.toLowerCase()))) {
                isDriverAssigned = true;
                break;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing stage3_summary_data:', e);
        }
      }
      
      if (isDriverAssigned) {
        console.log(`Driver assigned to order ${order.oid}, date: ${normalizedOrderDate}, type: ${order.order_type}`);
        if (!ordersByDate[normalizedOrderDate]) {
          ordersByDate[normalizedOrderDate] = {
            boxOrders: 0,
            localOrders: 0
          };
        }
        
        // Check order type: 'flight' = BOX ORDER, 'local' = LOCAL GRADE ORDER
        const orderType = (order.order_type || '').toLowerCase();
        if (orderType === 'flight' || orderType === 'box order') {
          ordersByDate[normalizedOrderDate].boxOrders += 1;
          console.log(`Added BOX ORDER count for date ${normalizedOrderDate}`);
        } else if (orderType === 'local' || orderType === 'local grade order') {
          ordersByDate[normalizedOrderDate].localOrders += 1;
          console.log(`Added LOCAL GRADE ORDER count for date ${normalizedOrderDate}`);
        } else {
          console.log(`Unknown order type: ${order.order_type}`);
        }
      }
    });
    
    // Group by date
    const recordsByDate = {};
    allRecords.forEach(record => {
      if (!recordsByDate[record.date]) {
        recordsByDate[record.date] = {
          kmRecords: [],
          fuelRecords: [],
          boxOrders: 0,
          localOrders: 0
        };
      }
      if (record.type === 'km') {
        recordsByDate[record.date].kmRecords.push(record.data);
      } else {
        recordsByDate[record.date].fuelRecords.push(record.data);
      }
    });
    
    // Merge order counts into recordsByDate
    console.log('Orders by date:', ordersByDate);
    Object.keys(ordersByDate).forEach(date => {
      if (!recordsByDate[date]) {
        recordsByDate[date] = {
          kmRecords: [],
          fuelRecords: [],
          boxOrders: 0,
          localOrders: 0
        };
      }
      recordsByDate[date].boxOrders = (recordsByDate[date].boxOrders || 0) + (ordersByDate[date].boxOrders || 0);
      recordsByDate[date].localOrders = (recordsByDate[date].localOrders || 0) + (ordersByDate[date].localOrders || 0);
      console.log(`Merged orders for date ${date}:`, { boxOrders: recordsByDate[date].boxOrders, localOrders: recordsByDate[date].localOrders });
    });
    
    // Also add dates that only have orders (no KM or fuel records)
    Object.keys(ordersByDate).forEach(date => {
      if (!recordsByDate[date]) {
        recordsByDate[date] = {
          kmRecords: [],
          fuelRecords: [],
          boxOrders: ordersByDate[date].boxOrders || 0,
          localOrders: ordersByDate[date].localOrders || 0
        };
      }
    });
    
    // Sort dates and create table rows
    const sortedDates = Object.keys(recordsByDate).sort();
    
    return sortedDates.map(date => {
      const dayRecords = recordsByDate[date];
      const kmRecord = dayRecords.kmRecords[0] || {};
      
      // AIRP = count of BOX ORDER, LOCAL = count of LOCAL GRADE ORDER
      const airpCount = dayRecords.boxOrders || 0;
      const localCount = dayRecords.localOrders || 0;
      
      const inKM = parseFloat(kmRecord.start_km || 0);
      const outKM = parseFloat(kmRecord.end_km || 0);
      const locKM = outKM > inKM ? (outKM - inKM) : 0;
      
      // Calculate total diesel and fuel expenses for all fuel records on this date
      let diesel = 0;
      let fuelExpense = 0;
      
      dayRecords.fuelRecords.forEach(fuelRecord => {
        const litre = parseFloat(fuelRecord.litre || fuelRecord.liter || 0);
        diesel += litre;
        
        const total = parseFloat(fuelRecord.total_amount || fuelRecord.total || fuelRecord.amount || 0);
        if (total > 0) {
          fuelExpense += total;
        } else {
          const unitPrice = parseFloat(fuelRecord.unit_price || fuelRecord.unitPrice || 0);
          if (unitPrice > 0 && litre > 0) {
            fuelExpense += (unitPrice * litre);
          }
        }
      });
      
      const driverName = driverReportData.driverName;
      
      // Format date as M/D/YYYY
      const dateObj = new Date(date);
      const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
      
      return {
        date: formattedDate,
        isLocal: localCount,
        isAirport: airpCount,
        inKM,
        outKM,
        locKM,
        diesel,
        fuelExpense,
        driverName
      };
    });
  }, [driverReportData, orders, orderAssignments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-[#6B8782]">Loading driver details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!driverReportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-[#6B8782]">Driver not found</p>
            <button
              onClick={() => navigate('/reports/driver')}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Back to Driver Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/reports/driver')}
            className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Driver Report</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              disabled={!driverReportData || dailyLogData.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!driverReportData || dailyLogData.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Driver Info Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-[#0D8568] text-white px-6 py-4">
            <h2 className="text-2xl font-bold">{driverReportData.driverName}</h2>
            <p className="text-sm text-white/80 mt-1">Driver ID: {driverReportData.driverCode}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Vehicle Info */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Vehicle Number</div>
                  <div className="text-lg font-bold text-[#0D5C4D]">{driverReportData.vehicleNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Kilometers</div>
                  <div className="text-lg font-bold text-[#0D5C4D]">{formatNumber(driverReportData.totalKilometers)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Fuel Litres</div>
                  <div className="text-lg font-bold text-[#0D5C4D]">{formatNumber(driverReportData.fuelLitres)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Fuel Expenses</div>
                  <div className="text-lg font-bold text-[#0D5C4D]">{formatCurrency(driverReportData.fuelExpenses)}</div>
                </div>
              </div>
            </div>

            {/* Daily Log Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-[#0D8568] text-white">
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">DATE</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold">LOCAL</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold">AIRP</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold">IN KM</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold">OUT</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold">LOC</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold">DIESEL</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold">FUEL EXPENSES</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold">DRIVER</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLogData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    dailyLogData.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-3 py-2 font-medium">{row.date}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{row.isLocal}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{row.isAirport}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{row.inKM > 0 ? row.inKM.toFixed(0) : ''}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{row.outKM > 0 ? row.outKM.toFixed(0) : ''}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{row.locKM > 0 ? row.locKM.toFixed(0) : '0'}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{row.diesel > 0 ? row.diesel.toFixed(2) : '0'}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {row.fuelExpense > 0 ? formatNumber(row.fuelExpense) : '0.00'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{row.driverName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDriverView;
