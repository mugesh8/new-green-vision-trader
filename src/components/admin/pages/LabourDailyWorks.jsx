import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, FileDown } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import * as XLSX from 'xlsx';

const LabourDailyWorks = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [labourName, setLabourName] = useState('');

    useEffect(() => {
        const fetchLabourAssignments = async () => {
            if (!id) return;

            try {
                setLoading(true);

                // First, get the labour details to get the labour name
                const { getLabourById } = await import('../../../api/labourApi');
                const labourResponse = await getLabourById(id);
                const labourFullName = labourResponse?.data?.full_name || '';

                // Fetch all orders
                const ordersResponse = await getAllOrders();

                if (!ordersResponse.success || !ordersResponse.data) {
                    setAssignments([]);
                    return;
                }

                const transformedAssignments = [];

                for (const order of ordersResponse.data) {
                    try {
                        const assignmentResponse = await getOrderAssignment(order.oid);

                        if (!assignmentResponse.success || !assignmentResponse.data) continue;

                        const assignmentData = assignmentResponse.data;

                        // Parse stage2_data (not stage2_summary_data)
                        let stage2Data = null;
                        if (assignmentData.stage2_data) {
                            try {
                                stage2Data = typeof assignmentData.stage2_data === 'string'
                                    ? JSON.parse(assignmentData.stage2_data)
                                    : assignmentData.stage2_data;

                            } catch (e) {
                                console.error('Error parsing stage2_data:', e);
                                continue;
                            }
                        } else {
                        }

                        if (!stage2Data || !stage2Data.stage2Assignments) {
                            continue;
                        }


                        // Find assignments for this specific labour
                        // Match by labourName since labourId is empty
                        stage2Data.stage2Assignments.forEach((assignment, index) => {

                            if (!assignment.labourName) return;

                            // Match by labour name
                            const isMatch = assignment.labourName.trim().toLowerCase() === labourFullName.trim().toLowerCase();


                            // Check if this assignment is for our labour
                            if (isMatch) {

                                // Set labour name from first match
                                if (!labourName) {
                                    setLabourName(assignment.labourName);
                                }

                                // Get product details from productAssignments using oiid
                                // const productDetail = stage2Data.productAssignments?.find(p => p.id === assignment.oiid); // No longer needed

                                transformedAssignments.push({
                                    id: `${order.oid}-${index}`,
                                    orderId: order.oid,
                                    orderDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: '2-digit'
                                    }) : 'N/A',
                                    product: assignment.product || 'N/A',
                                    entityType: assignment.entityType || 'N/A',
                                    entityName: assignment.entityName || 'N/A',
                                    pickedQuantity: assignment.pickedQuantity || 0,
                                    wastage: assignment.wastage || 0,
                                    reuse: assignment.reuseFromStock || 0,
                                    packedAmount: assignment.packedAmount || 0,
                                    tapeColor: assignment.tapeColor || 'N/A',
                                    status: assignment.status || 'pending',
                                    assignmentData: assignment,
                                    orderData: order
                                });
                            }
                        });
                    } catch (orderError) {
                        console.error(`Error processing order ${order.oid}:`, orderError);
                    }
                }

                setAssignments(transformedAssignments);
            } catch (error) {
                console.error('Error fetching labour assignments:', error);
                setAssignments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLabourAssignments();
    }, [id]);

    // Export to Excel function
    const handleExportToExcel = () => {
        if (assignments.length === 0) {
            alert('No data to export');
            return;
        }

        // Prepare data for export
        const exportData = assignments.map((assignment, index) => ({
            'S.No': index + 1,
            'Order ID': assignment.orderId,
            'Order Date': assignment.orderDate,
            'Product': assignment.product,
            'Entity Type': assignment.entityType,
            'Entity Name': assignment.entityName,
            'Picked Quantity (kg)': assignment.pickedQuantity,
            'Wastage (kg)': assignment.wastage,
            'Reuse (kg)': assignment.reuse,
            'Packed Amount (kg)': assignment.packedAmount,
            'Tape Color': assignment.tapeColor,
            'Status': assignment.status
        }));

        // Add summary row
        const totalPicked = assignments.reduce((sum, a) => sum + (a.pickedQuantity || 0), 0);
        const totalWastage = assignments.reduce((sum, a) => sum + (a.wastage || 0), 0);
        const totalReuse = assignments.reduce((sum, a) => sum + (a.reuse || 0), 0);
        const totalPacked = assignments.reduce((sum, a) => sum + (a.packedAmount || 0), 0);

        exportData.push({
            'S.No': '',
            'Order ID': '',
            'Order Date': '',
            'Product': '',
            'Entity Type': '',
            'Entity Name': 'TOTAL',
            'Picked Quantity (kg)': totalPicked.toFixed(2),
            'Wastage (kg)': totalWastage.toFixed(2),
            'Reuse (kg)': totalReuse.toFixed(2),
            'Packed Amount (kg)': totalPacked.toFixed(2),
            'Tape Color': '',
            'Status': ''
        });

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Auto-size columns
        worksheet['!cols'] = [
            { wch: 6 },  // S.No
            { wch: 12 }, // Order ID
            { wch: 15 }, // Order Date
            { wch: 20 }, // Product
            { wch: 15 }, // Entity Type
            { wch: 20 }, // Entity Name
            { wch: 20 }, // Picked Quantity
            { wch: 15 }, // Wastage
            { wch: 12 }, // Reuse
            { wch: 18 }, // Packed Amount
            { wch: 15 }, // Tape Color
            { wch: 12 }  // Status
        ];

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Works');

        // Generate filename
        const fileName = `Labour_${id}_Daily_Works_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Download file
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/labour')}
                        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Labour Management</span>
                    </button>

                    <button
                        onClick={handleExportToExcel}
                        className="px-6 py-2.5 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors duration-200 font-medium flex items-center gap-2"
                    >
                        <FileDown className="w-4 h-4" />
                        Export to Excel
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    <button
                        onClick={() => navigate(`/labour/${id}`)}
                        className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                    >
                        Labour Details
                    </button>
                    <button
                        className="px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap bg-teal-600 text-white shadow-md"
                    >
                        Daily Works
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Package className="w-6 h-6 text-teal-600" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Daily Work Assignments</h2>
                                <p className="text-sm text-gray-600">Packaging and quality check assignments from Stage 2</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-teal-50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Order ID</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Order Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Product</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Entity Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Entity Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Picked Qty (kg)</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Wastage (kg)</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Reuse (kg)</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Packed (kg)</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Tape Color</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-teal-900">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="11" className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm text-gray-600">Loading assignments...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : assignments.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="px-6 py-12 text-center text-sm text-gray-600">
                                            No work assignments found for this labour.
                                        </td>
                                    </tr>
                                ) : (
                                    assignments.map((assignment, index) => (
                                        <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-teal-700 text-sm">{assignment.orderId}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700">{assignment.orderDate}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 text-sm">{assignment.product}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                    {assignment.entityType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700">{assignment.entityName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 text-sm">{assignment.pickedQuantity}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-red-600 font-medium">{assignment.wastage}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-orange-600 font-medium">{assignment.reuse}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-green-600 text-sm">{assignment.packedAmount}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700">{assignment.tapeColor}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {assignment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    {assignments.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 bg-teal-50 border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                                Showing {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
                            </div>
                            <div className="flex gap-6 text-sm font-semibold text-gray-900">
                                <span>Total Picked: <span className="text-teal-600">{assignments.reduce((sum, a) => sum + (a.pickedQuantity || 0), 0).toFixed(2)} kg</span></span>
                                <span>Total Packed: <span className="text-green-600">{assignments.reduce((sum, a) => sum + (a.packedAmount || 0), 0).toFixed(2)} kg</span></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabourDailyWorks;
