import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, FileSpreadsheet } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getAllSuppliers } from '../../../api/supplierApi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';

const ReportSupplierOrderView = () => {
    const { supplierId, orderId } = useParams();
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState(null);
    const [order, setOrder] = useState(null);
    const [supplierAssignments, setSupplierAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    useEffect(() => {
        fetchOrderDetails();
    }, [supplierId, orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);

            // Fetch supplier details
            const suppliersResponse = await getAllSuppliers();
            if (suppliersResponse?.data) {
                const foundSupplier = suppliersResponse.data.find(s => s.sid == supplierId);
                setSupplier(foundSupplier);
            }

            // Fetch order details
            const ordersResponse = await getAllOrders();
            if (ordersResponse?.data) {
                const foundOrder = ordersResponse.data.find(o => o.oid === orderId);
                setOrder(foundOrder);

                // Fetch order assignments
                if (foundOrder) {
                    const assignmentRes = await getOrderAssignment(foundOrder.oid);
                    if (assignmentRes?.data?.product_assignments) {
                        let assignments = [];
                        try {
                            assignments = typeof assignmentRes.data.product_assignments === 'string'
                                ? JSON.parse(assignmentRes.data.product_assignments)
                                : assignmentRes.data.product_assignments;
                        } catch (e) {
                            assignments = [];
                        }

                        // Filter assignments for this supplier only
                        const supplierOnly = assignments.filter(
                            assignment => assignment.entityType === 'supplier' && assignment.entityId == supplierId
                        );

                        // Helper function to clean product name for matching
                        const cleanForMatching = (name) => {
                            if (!name) return '';
                            // Remove leading numbers like "9 - "
                            return name.replace(/^\d+\s*-\s*/, '').trim();
                        };

                        // Get Stage 4 data for pricing
                        let stage4ProductRows = [];
                        try {
                            if (assignmentRes.data?.stage4_data) {
                                const stage4Data = typeof assignmentRes.data.stage4_data === 'string'
                                    ? JSON.parse(assignmentRes.data.stage4_data)
                                    : assignmentRes.data.stage4_data;

                                // Get productRows from reviewData
                                if (stage4Data?.reviewData?.productRows) {
                                    stage4ProductRows = stage4Data.reviewData.productRows;
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing stage4_data:', e);
                        }

                        // Enrich assignments with data from order items and stage4
                        const enrichedAssignments = supplierOnly.map(assignment => {
                            const cleanAssignmentProduct = cleanForMatching(assignment.product);

                            // Get quantity from order items (net_weight)
                            let qty = assignment.assignedQty || 0;
                            if (!qty || qty === 0) {
                                const matchingItem = foundOrder.items?.find(item => {
                                    const itemProduct = item.product_name || item.product || '';
                                    const cleanItemProduct = cleanForMatching(itemProduct);
                                    return cleanItemProduct === cleanAssignmentProduct;
                                });

                                if (matchingItem) {
                                    qty = parseFloat(matchingItem.net_weight) || parseFloat(matchingItem.quantity) || 0;
                                }
                            }

                            // Get price from stage4 product rows (supplier's actual price)
                            let price = assignment.price || 0;
                            if (!price || price === 0) {
                                // Find the matching stage4 entry for this supplier and product
                                const stage4Entry = stage4ProductRows.find(s4 => {
                                    const s4Product = cleanForMatching(s4.product || s4.product_name || '');
                                    const s4AssignedTo = s4.assignedTo || s4.assigned_to || '';
                                    const assignedTo = assignment.assignedTo || '';

                                    return s4Product === cleanAssignmentProduct &&
                                        s4AssignedTo === assignedTo;
                                });

                                if (stage4Entry) {
                                    price = parseFloat(stage4Entry.price) || 0;
                                }
                            }

                            return {
                                ...assignment,
                                assignedQty: qty,
                                price: price
                            };
                        });

                        setSupplierAssignments(enrichedAssignments);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Clean product name
    const cleanProductName = (name) => {
        if (!name) return '';
        return name
            .replace(/^\d+\s*-\s*/, '')
            .replace(/[\u0B80-\u0BFF]/g, '')
            .replace(/\(\s*\)/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Helper function to get value from multiple possible field names
    const getValue = (obj, possibleKeys) => {
        for (const key of possibleKeys) {
            if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
                return obj[key];
            }
        }
        return null;
    };

    // Calculate total amount for this supplier in this order
    const calculateTotalAmount = () => {
        return supplierAssignments.reduce((sum, assignment) => {
            // Try multiple possible field names for quantity
            const qty = parseFloat(getValue(assignment, ['assignedQty', 'quantity', 'qty', 'assigned_qty'])) || 0;
            // Try multiple possible field names for price
            const price = parseFloat(getValue(assignment, ['price', 'unit_price', 'unitPrice', 'rate'])) || 0;
            return sum + (qty * price);
        }, 0);
    };

    const totalAmount = calculateTotalAmount();

    const handleExportPDF = () => {
        if (!supplier || !order || supplierAssignments.length === 0) return;

        const doc = new jsPDF();

        const cleanText = (str) => {
            if (str === null || str === undefined) return '';
            let s = String(str);
            s = s.replace(/₹/g, 'Rs. ');
            return s.replace(/[^\x00-\x7F]/g, '').trim();
        };

        const orderDate = new Date(order.order_received_date || order.createdAt);
        const fullDate = orderDate.toLocaleDateString('en-GB');

        // Header
        doc.setFillColor(13, 92, 77);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('SUPPLIER ORDER DETAILS', 105, 12, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`${cleanText(order.oid)} - ${cleanText(supplier.supplier_name)}`, 105, 22, { align: 'center' });

        // Order Info
        doc.setTextColor(0, 0, 0);
        doc.autoTable({
            startY: 35,
            head: [['Order ID', 'Supplier Name', 'Order Date', 'Total Amount']],
            body: [[
                cleanText(order.oid),
                cleanText(supplier.supplier_name),
                fullDate,
                cleanText(`Rs. ${totalAmount.toFixed(2)}`)
            ]],
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 10 },
            bodyStyles: { halign: 'center', fontSize: 10, cellPadding: 3 },
        });

        let finalY = doc.lastAutoTable.finalY + 12;

        // Products Table
        doc.setFillColor(236, 253, 245);
        doc.rect(14, finalY - 2, 182, 8, 'F');
        doc.setTextColor(5, 150, 105);
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text("Products Assigned to Supplier", 16, finalY + 4);
        doc.setFont(undefined, 'normal');

        const productsBody = supplierAssignments.map(assignment => [
            cleanText(assignment.product || assignment.productName),
            `${assignment.assignedQty || 0} kg`,
            `${assignment.assignedBoxes || 0}`,
            cleanText(`Rs. ${assignment.price || 0}`),
            cleanText(`Rs. ${((parseFloat(assignment.assignedQty) || 0) * (parseFloat(assignment.price) || 0)).toFixed(2)}`)
        ]);

        doc.autoTable({
            startY: finalY + 7,
            head: [['Product', 'Quantity', 'Boxes', 'Price/kg', 'Total']],
            body: productsBody,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: [240, 253, 244] }
        });

        finalY = doc.lastAutoTable.finalY + 8;

        // Total
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Grand Total: Rs. ${totalAmount.toFixed(2)}`, 14, finalY);

        doc.save(`Supplier_Order_${supplier.supplier_name}_${order.oid}.pdf`);
    };

    const handleExportExcel = () => {
        if (!supplier || !order || supplierAssignments.length === 0) return;

        const wb = XLSX.utils.book_new();
        const allRows = [];
        const merges = [];
        let currentRow = 0;

        const cell = (v, style = 'normal') => {
            const styles = {
                title: { font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0D5C4D" } }, alignment: { horizontal: "center", vertical: "center" } },
                header: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "10B981" } }, alignment: { horizontal: "center", vertical: "center" } },
                sectionGreen: { font: { bold: true, sz: 12, color: { rgb: "059669" } }, fill: { fgColor: { rgb: "ECFDF5" } }, alignment: { vertical: "center" } },
                bold: { font: { bold: true } },
                highlight: { fill: { fgColor: { rgb: "FEF9C3" } }, font: { bold: true } },
                normal: { alignment: { wrapText: true } }
            };
            const cleanText = (str) => {
                if (str === null || str === undefined) return '';
                let s = String(str);
                s = s.replace(/₹/g, 'Rs. ');
                return s.replace(/[^\x00-\x7F]/g, '').trim();
            };
            return { v: cleanText(v), t: typeof v === 'number' ? 'n' : 's', s: styles[style] || styles.normal };
        };

        const orderDate = new Date(order.order_received_date || order.createdAt).toLocaleDateString('en-GB');

        // Title
        allRows.push([cell('SUPPLIER ORDER DETAILS', 'title'), '', '', '', '']);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 4 } });
        currentRow++;
        allRows.push([cell(`${order.oid} - ${supplier.supplier_name}`, 'title'), '', '', '', '']);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 4 } });
        currentRow++;
        allRows.push([]);
        currentRow++;

        // Order Info
        allRows.push([
            cell('Order ID:', 'bold'),
            cell(order.oid),
            cell('Date:', 'bold'),
            cell(orderDate),
            ''
        ]);
        currentRow++;
        allRows.push([
            cell('Supplier:', 'bold'),
            cell(supplier.supplier_name),
            cell('Total:', 'bold'),
            cell(totalAmount.toFixed(2), 'highlight'),
            ''
        ]);
        currentRow++;
        allRows.push([]);
        currentRow++;

        // Products
        allRows.push([cell('PRODUCTS ASSIGNED', 'sectionGreen'), '', '', '', '']);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 4 } });
        currentRow++;
        allRows.push([
            cell('Product', 'header'),
            cell('Quantity', 'header'),
            cell('Boxes', 'header'),
            cell('Price/kg', 'header'),
            cell('Total', 'header')
        ]);
        currentRow++;

        supplierAssignments.forEach(assignment => {
            const qty = parseFloat(assignment.assignedQty) || 0;
            const price = parseFloat(assignment.price) || 0;
            const total = qty * price;

            allRows.push([
                cell(cleanProductName(assignment.product || assignment.productName)),
                cell(`${assignment.assignedQty || 0} kg`),
                cell(assignment.assignedBoxes || 0),
                cell(price.toFixed(2)),
                cell(total.toFixed(2))
            ]);
            currentRow++;
        });

        allRows.push([]);
        currentRow++;
        allRows.push([cell('GRAND TOTAL:', 'bold'), '', '', '', cell(totalAmount.toFixed(2), 'highlight')]);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 3 } });

        const ws = XLSX.utils.aoa_to_sheet(allRows);
        ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
        ws['!merges'] = merges;
        ws['!rows'] = [{ hpt: 25 }, { hpt: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, "Supplier Order");
        XLSX.writeFile(wb, `Supplier_Order_${supplier.supplier_name}_${order.oid}.xlsx`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-[#0D8568] text-xl">Loading order details...</div>
            </div>
        );
    }

    if (!supplier || !order) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-600 text-xl">Order or supplier not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#E6F7F4] to-[#D0E9E4] p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/admin/report-supplier/${supplierId}`)}
                            className="p-2 bg-white rounded-lg hover:bg-[#F0F4F3] transition-colors shadow-md"
                        >
                            <ArrowLeft className="text-[#0D8568]" size={24} />
                        </button>
                        <div className="bg-[#E8F5F1] p-3 rounded-xl">
                            <span className="text-2xl">📦</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#0D5C4D]">Supplier Order Details</h1>
                            <p className="text-[#6B8782]">{order.oid} - {supplier.supplier_name}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            <FileText size={18} />
                            Export PDF
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <FileSpreadsheet size={18} />
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Order Info Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-[#0D5C4D] mb-4">Order Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-[#6B8782] mb-1">Order ID</p>
                            <p className="text-lg font-semibold text-[#0D5C4D]">{order.oid}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[#6B8782] mb-1">Supplier Name</p>
                            <p className="text-lg font-semibold text-[#0D5C4D]">{supplier.supplier_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[#6B8782] mb-1">Order Date</p>
                            <p className="text-lg font-semibold text-[#0D5C4D]">
                                {new Date(order.order_received_date || order.createdAt).toLocaleDateString('en-GB')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-[#6B8782] mb-1">Supplier's Total Amount</p>
                            <p className="text-lg font-semibold text-[#0D8568]">₹{totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-[#0D8568] text-white px-6 py-4">
                        <h2 className="text-xl font-bold">Products Assigned to {supplier.supplier_name}</h2>
                    </div>
                    <div className="p-6">
                        {supplierAssignments.length === 0 ? (
                            <div className="text-center py-12 text-[#6B8782]">
                                No products assigned to this supplier in this order
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#0D8568] text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Product</th>
                                                <th className="px-4 py-3 text-left">Quantity (kg)</th>
                                                <th className="px-4 py-3 text-left">Boxes/Bags</th>
                                                <th className="px-4 py-3 text-left">Price per kg</th>
                                                <th className="px-4 py-3 text-left">Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const totalPages = Math.ceil(supplierAssignments.length / itemsPerPage);
                                                const startIndex = (currentPage - 1) * itemsPerPage;
                                                const endIndex = startIndex + itemsPerPage;
                                                const paginatedAssignments = supplierAssignments.slice(startIndex, endIndex);

                                                return paginatedAssignments.map((assignment, index) => {
                                                    const qty = parseFloat(getValue(assignment, ['assignedQty', 'quantity', 'qty', 'assigned_qty'])) || 0;
                                                    const boxes = getValue(assignment, ['assignedBoxes', 'boxes', 'noOfBoxes', 'assigned_boxes']) || 0;
                                                    const price = parseFloat(getValue(assignment, ['price', 'unit_price', 'unitPrice', 'rate'])) || 0;
                                                    const total = qty * price;

                                                    return (
                                                        <tr
                                                            key={index}
                                                            className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'
                                                                }`}
                                                        >
                                                            <td className="px-4 py-4">
                                                                <span className="text-sm font-semibold text-[#0D5C4D]">
                                                                    {cleanProductName(getValue(assignment, ['product', 'productName', 'product_name']))}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-sm text-[#0D5C4D]">{qty} kg</span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-sm text-[#0D5C4D]">{boxes}</span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-sm text-[#0D5C4D]">₹{price.toFixed(2)}</span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-sm font-semibold text-[#0D8568]">
                                                                    ₹{total.toFixed(2)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                        <tfoot className="bg-[#E8F5F1]">
                                            <tr>
                                                <td colSpan="4" className="px-4 py-4 text-right">
                                                    <span className="text-lg font-bold text-[#0D5C4D]">Grand Total:</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-lg font-bold text-[#0D8568]">
                                                        ₹{totalAmount.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {Math.ceil(supplierAssignments.length / itemsPerPage) > 1 && (
                                    <div className="flex flex-col md:flex-row items-center justify-between mt-6 pt-6 border-t border-[#D0E0DB] gap-4">
                                        <p className="text-sm text-[#6B8782]">
                                            Showing <span className="font-semibold text-[#0D5C4D]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                            <span className="font-semibold text-[#0D5C4D]">
                                                {Math.min(currentPage * itemsPerPage, supplierAssignments.length)}
                                            </span>{' '}
                                            of <span className="font-semibold text-[#0D5C4D]">{supplierAssignments.length}</span> items
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className={`p-2 rounded-lg border border-[#D0E0DB] transition-all ${currentPage === 1
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-[#0D5C4D] hover:bg-[#D4F4E8] hover:border-[#0D8568]'
                                                    }`}
                                            >
                                                &lt;
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {[...Array(Math.ceil(supplierAssignments.length / itemsPerPage))].map((_, i) => (
                                                    <button
                                                        key={i + 1}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${currentPage === i + 1
                                                            ? 'bg-[#0D8568] text-white'
                                                            : 'text-[#0D5C4D] hover:bg-[#D4F4E8] border border-transparent hover:border-[#D0E0DB]'
                                                            }`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(supplierAssignments.length / itemsPerPage)))}
                                                disabled={currentPage === Math.ceil(supplierAssignments.length / itemsPerPage)}
                                                className={`p-2 rounded-lg border border-[#D0E0DB] transition-all ${currentPage === Math.ceil(supplierAssignments.length / itemsPerPage)
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-[#0D5C4D] hover:bg-[#D4F4E8] hover:border-[#0D8568]'
                                                    }`}
                                            >
                                                &gt;
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ReportSupplierOrderView;
