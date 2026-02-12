import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getFlowerOrderAssignment } from '../../../api/flowerOrderAssignmentApi';
import * as XLSX from 'xlsx';

const DriverFlowerOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriverFlowerOrders = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const ordersResponse = await getAllOrders();

        if (!ordersResponse.success || !ordersResponse.data) {
          setOrders([]);
          return;
        }

        const transformedOrders = [];

        for (const order of ordersResponse.data) {
          if ((order.order_type || '').toLowerCase() !== 'flower order' && (order.order_type || '').toLowerCase() !== 'flower') continue;

          try {
            const assignmentResponse = await getFlowerOrderAssignment(order.oid);

            if (!assignmentResponse.success || !assignmentResponse.data) continue;

            const assignmentData = assignmentResponse.data;

            let stage3Data = null;
            if (assignmentData.stage3_summary_data) {
              try {
                stage3Data = typeof assignmentData.stage3_summary_data === 'string'
                  ? JSON.parse(assignmentData.stage3_summary_data)
                  : assignmentData.stage3_summary_data;
              } catch (e) {
                console.error('Error parsing stage3_summary_data:', e);
                continue;
              }
            }

            if (!stage3Data || !stage3Data.driverAssignments) continue;

            const driverAssignment = stage3Data.driverAssignments.find(
              da => {
                const driverStr = String(da.driver);
                const idStr = String(id);
                if (driverStr === idStr) return true;
                if (driverStr.includes(' - ')) {
                  const parts = driverStr.split(' - ');
                  const extractedId = parts[parts.length - 1];
                  if (extractedId === idStr) return true;
                }
                if (driverStr.includes(idStr)) return true;
                return false;
              }
            );

            if (!driverAssignment || !driverAssignment.assignments) continue;

            driverAssignment.assignments.forEach((assignment, index) => {
              if (assignment.airportName && assignment.airportLocation) {
                const orderItem = order.items?.find(item => item.oiid === assignment.oiid);
                const parseNumBoxes = (numBoxesStr) => {
                  if (!numBoxesStr) return 0;
                  const match = String(numBoxesStr).match(/^(\d+(?:\.\d+)?)/);
                  return match ? parseFloat(match[1]) : 0;
                };
                const totalBoxes = orderItem ? parseNumBoxes(orderItem.num_boxes) : 0;

                transformedOrders.push({
                  id: `${order.oid}-${index}`,
                  orderId: order.oid,
                  type: 'FLOWER ORDER',
                  product: assignment.product,
                  grossWeight: assignment.grossWeight,
                  labour: assignment.labour,
                  totalBoxes: totalBoxes,
                  ct: assignment.ct,
                  noOfPkgs: assignment.noOfPkgs,
                  airportName: assignment.airportName,
                  airportLocation: assignment.airportLocation,
                  vehicleNumber: driverAssignment.vehicleNumber || '',
                  phoneNumber: driverAssignment.phoneNumber || '',
                  status: assignment.status || 'Assigned',
                  assignmentData: assignment,
                  orderData: order,
                  driverData: driverAssignment
                });
              }
            });
          } catch (orderError) {
            console.error(`Error processing order ${order.oid}:`, orderError);
          }
        }

        setOrders(transformedOrders);
      } catch (error) {
        console.error('Error fetching driver flower orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverFlowerOrders();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'In Transit':
        return 'bg-blue-100 text-blue-700';
      case 'Collected':
        return 'bg-purple-100 text-purple-700';
      case 'Assigned':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleExportToExcel = () => {
    if (orders.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = orders.map((order, index) => ({
      'S.No': index + 1,
      'Order ID': order.orderId,
      'Product': order.product || 'N/A',
      'Gross Weight': order.grossWeight || 'N/A',
      'Assigned Labour': order.labour || 'N/A',
      'Total Boxes/Bags': order.totalBoxes || 0,
      'CT': order.ct || 'N/A',
      'No of Pkgs': order.noOfPkgs || 0,
      'Airport Name': order.airportName,
      'Airport Location': order.airportLocation,
      'Vehicle Number': order.vehicleNumber || 'N/A',
      'Status': order.status
    }));

    const totalPkgs = orders.reduce((sum, order) => sum + (order.noOfPkgs || 0), 0);
    const totalBoxes = orders.reduce((sum, order) => sum + (order.totalBoxes || 0), 0);

    exportData.push({
      'S.No': '',
      'Order ID': '',
      'Product': '',
      'Gross Weight': '',
      'Assigned Labour': 'TOTAL',
      'Total Boxes/Bags': totalBoxes,
      'CT': '',
      'No of Pkgs': totalPkgs,
      'Airport Name': '',
      'Airport Location': '',
      'Vehicle Number': '',
      'Status': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
      { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 25 },
      { wch: 18 }, { wch: 12 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Flower Orders');

    const fileName = `Driver_${id}_Flower_Orders_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const totalWeight = orders.reduce((sum, order) => sum + parseInt(order.grossWeight || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/drivers')}
            className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Driver Management</span>
          </button>

          <button
            onClick={handleExportToExcel}
            className="px-6 py-2.5 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors duration-200 font-medium flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export to Excel
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => navigate(`/drivers/${id}`)}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            Driver Details
          </button>
          <button
            onClick={() => navigate('/start-end-km-management', { state: { driverId: id } })}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            Start KM/End KM
          </button>
          <button
            onClick={() => navigate(`/drivers/${id}/local-pickups`)}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          >
            LOCAL GRADE ORDER
          </button>
          <button
            onClick={() => navigate(`/drivers/${id}/airport`)}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 whitespace-nowrap"
          >
            BOX ORDER
          </button>
          <button
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap bg-[#0D7C66] text-white shadow-md"
          >
            FLOWER ORDER
          </button>
          <button
            onClick={() => navigate('/fuel-expense-management', { state: { driverId: id } })}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 whitespace-nowrap"
          >
            Fuel Expenses
          </button>
          <button
            onClick={() => navigate('/advance-pay-management', { state: { driverId: id } })}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 whitespace-nowrap"
          >
            Advance Pay
          </button>
          <button
            onClick={() => navigate('/remarks-management')}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 whitespace-nowrap"
          >
            Remarks
          </button>
          <button
            onClick={() => navigate(`/drivers/${id}/daily-payout`)}
            className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 whitespace-nowrap"
          >
            Daily Payout
          </button>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#D4F4E8]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Gross Weight</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Assigned Labour</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Total Boxes/Bags</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">CT</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">No of Pkgs</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Airport Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Vehicle Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Loading flower orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-sm text-gray-600">
                      No flower order assignments found for this driver.
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr key={index} className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'}`}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0D5C4D] text-sm">{order.orderId}</div>
                        <div className="text-xs text-[#6B8782]">{order.type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0D5C4D] text-sm">{order.product || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0D5C4D] text-sm">{order.grossWeight || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0D5C4D] text-sm">{order.labour || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0D5C4D] text-sm">{order.totalBoxes || 0}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0D5C4D] text-sm">{order.ct || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0D5C4D] text-sm">{order.noOfPkgs || 0}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0D5C4D] text-sm">{order.airportName}</div>
                        <div className="text-xs text-[#6B8782]">{order.airportLocation}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0D5C4D] text-sm">{order.vehicleNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
            <div className="text-sm text-[#6B8782]">
              Showing {orders.length} flower orders for today
            </div>
            <div className="text-sm font-semibold text-[#0D5C4D]">
              Total Cargo: <span className="text-[#0D7C66]">{totalWeight.toLocaleString()} kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverFlowerOrder;