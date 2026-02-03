import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getOrderById } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getAllFarmers } from '../../../api/farmerApi';
import { getAllSuppliers } from '../../../api/supplierApi';
import { getAllThirdParties } from '../../../api/thirdPartyApi';
import { getAllDrivers } from '../../../api/driverApi';

const FarmerOrderDetails = () => {
    const navigate = useNavigate();
    const { id: farmerId, orderId } = useParams(); // Get farmer ID and order ID from URL

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [assignmentData, setAssignmentData] = useState(null);
    const [farmers, setFarmers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [thirdParties, setThirdParties] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [currentFarmer, setCurrentFarmer] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [orderRes, assignmentRes, farmersRes, suppliersRes, thirdPartiesRes, driversRes] = await Promise.all([
                    getOrderById(orderId),
                    getOrderAssignment(orderId).catch(() => null),
                    getAllFarmers(),
                    getAllSuppliers(),
                    getAllThirdParties(),
                    getAllDrivers()
                ]);

                const fetchedFarmers = farmersRes?.data || [];
                setFarmers(fetchedFarmers);
                setSuppliers(suppliersRes?.data || []);
                setThirdParties(thirdPartiesRes?.data || []);
                setDrivers(driversRes?.data || []);

                // Find current farmer
                const farmer = fetchedFarmers.find(f => f.fid == farmerId);
                setCurrentFarmer(farmer);

                setOrder(orderRes?.data || null);
                setAssignmentData(assignmentRes?.data || null);
            } catch (error) {
                console.error('Error fetching order details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (farmerId && orderId) {
            fetchData();
        }
    }, [farmerId, orderId]);

    // Get entity name by type and ID
    const getEntityName = (entityType, entityId) => {
        if (entityType === 'farmer') {
            const farmer = farmers.find(f => f.fid == entityId);
            return farmer?.farmer_name || 'Unknown';
        } else if (entityType === 'supplier') {
            const supplier = suppliers.find(s => s.sid == entityId);
            return supplier?.supplier_name || 'Unknown';
        } else if (entityType === 'thirdParty') {
            const thirdParty = thirdParties.find(tp => tp.tpid == entityId);
            return thirdParty?.third_party_name || 'Unknown';
        }
        return 'Unknown';
    };

    // Get driver name by driver code
    const getDriverName = (driverCode) => {
        const driver = drivers.find(d => d.driver_code === driverCode);
        return driver ? `${driver.driver_name} - ${driver.driver_code}` : driverCode || 'Not Assigned';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5FBF9] flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading order details...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5FBF9] p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(`/farmers/${farmerId}/orders`)}
                    className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Orders</span>
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-[#0D7C66] to-[#10B981] rounded-xl p-6 mb-6 text-white">
                    <h1 className="text-2xl font-bold mb-2">Order Details - {order?.oid}</h1>
                    {currentFarmer && (
                        <p className="text-sm opacity-90">Farmer: {currentFarmer.farmer_name}</p>
                    )}
                </div>

                {/* Order Basic Info */}
                <div className="bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] rounded-xl p-6 border border-[#BBF7D0] mb-6">
                    <h3 className="text-lg font-semibold text-[#0D5C4D] mb-4">Order Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Customer Name</p>
                            <p className="text-base font-semibold text-gray-900">{order?.customer_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Phone Number</p>
                            <p className="text-base font-semibold text-gray-900">{order?.phone_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="text-base font-semibold text-gray-900">₹{parseFloat(order?.total_amount || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Stage 1 Assignment Details */}
                {assignmentData && assignmentData.product_assignments ? (
                    <div className="bg-white rounded-xl border border-[#D0E0DB] overflow-hidden">
                        <div className="bg-gradient-to-r from-[#0D7C66] to-[#10B981] px-6 py-4">
                            <h3 className="text-lg font-semibold text-white">Stage 1: Product Collection Details</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#D4F4E8]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0D5C4D] uppercase">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0D5C4D] uppercase">Entity Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0D5C4D] uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0D5C4D] uppercase">Address</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0D5C4D] uppercase">Picked Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0D5C4D] uppercase">Price (₹)</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0D5C4D] uppercase">Assigned Driver</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {(() => {
                                        let assignments = [];
                                        let routes = [];

                                        try {
                                            assignments = typeof assignmentData.product_assignments === 'string'
                                                ? JSON.parse(assignmentData.product_assignments)
                                                : assignmentData.product_assignments;
                                        } catch (e) {
                                            console.error('Error parsing product assignments:', e);
                                        }

                                        try {
                                            routes = typeof assignmentData.delivery_routes === 'string'
                                                ? JSON.parse(assignmentData.delivery_routes)
                                                : assignmentData.delivery_routes;
                                        } catch (e) {
                                            console.error('Error parsing delivery routes:', e);
                                        }

                                        // Filter to show only this farmer's assignments and routes
                                        const farmerAssignments = assignments.filter(
                                            assignment => assignment.entityType === 'farmer' && assignment.entityId == farmerId
                                        );

                                        const farmerRoutes = routes.filter(
                                            route => route.entityType === 'farmer' && route.entityId == farmerId
                                        );

                                        // Calculate total amount for this farmer's items (qty * price)
                                        const totalAmount = farmerAssignments.reduce((sum, assignment) => {
                                            const qty = parseFloat(assignment.assignedQty) || 0;
                                            const price = parseFloat(assignment.price) || 0;
                                            return sum + (qty * price);
                                        }, 0);

                                        return (
                                            <>
                                                {farmerAssignments.map((assignment, idx) => {
                                                    const entityName = getEntityName(assignment.entityType, assignment.entityId);

                                                    // Find matching route for this assignment
                                                    const matchingRoute = farmerRoutes.find(route =>
                                                        route.oiid == assignment.id &&
                                                        route.entityId == assignment.entityId
                                                    );

                                                    return (
                                                        <tr key={idx} className="hover:bg-[#F0FDF4] transition-colors">
                                                            <td className="px-4 py-3 text-sm text-gray-900">{assignment.product || assignment.product_name || 'N/A'}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#E0F2FE] text-[#0369A1]">
                                                                    Farmer
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{entityName}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{matchingRoute?.address || 'N/A'}</td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-emerald-700">{assignment.assignedQty || 0} kg</td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{assignment.price || 0}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#1E40AF]">
                                                                    {matchingRoute ? getDriverName(matchingRoute.driver) : 'Not Assigned'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {/* Total Row */}
                                                <tr className="bg-[#D4F4E8] font-bold border-t-2 border-[#0D7C66]">
                                                    <td colSpan="5" className="px-4 py-3 text-right text-sm text-[#0D5C4D]">Total Amount:</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-[#0D5C4D]">₹{totalAmount.toFixed(2)}</td>
                                                    <td className="px-4 py-3"></td>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                        <p className="text-yellow-800 font-medium">No Stage 1 assignment data found for this order.</p>
                        <p className="text-yellow-600 text-sm mt-2">The order may not have been assigned yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FarmerOrderDetails;
