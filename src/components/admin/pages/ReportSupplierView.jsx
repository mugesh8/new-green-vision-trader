import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, FileSpreadsheet, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllOrders, updateOrder } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getAllSuppliers } from '../../../api/supplierApi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';

const ReportSupplierView = () => {
    const { supplierId } = useParams();
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState(null);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // 'all', 'paid', 'unpaid'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    useEffect(() => {
        fetchSupplierDetails();
    }, [supplierId]);

    const fetchSupplierDetails = async () => {
        try {
            setLoading(true);

            // Fetch all suppliers
            const suppliersResponse = await getAllSuppliers();
            if (suppliersResponse?.data) {
                const foundSupplier = suppliersResponse.data.find(s => s.sid == supplierId);
                if (foundSupplier) {
                    setSupplier(foundSupplier);
                } else {
                    console.error('Supplier not found with ID:', supplierId);
                }
            }

            // Fetch all orders
            const ordersResponse = await getAllOrders();
            if (ordersResponse?.data) {
                const orders = ordersResponse.data;
                const processedOrders = [];

                // Process each order to find assignments for this supplier
                for (const order of orders) {
                    try {
                        const assignmentRes = await getOrderAssignment(order.oid).catch(() => null);

                        if (assignmentRes?.data?.product_assignments) {
                            let assignments = [];
                            try {
                                assignments = typeof assignmentRes.data.product_assignments === 'string'
                                    ? JSON.parse(assignmentRes.data.product_assignments)
                                    : assignmentRes.data.product_assignments;
                            } catch (e) {
                                assignments = [];
                            }

                            // Filter assignments for this supplier
                            const supplierAssignments = assignments.filter(
                                assignment => assignment.entityType === 'supplier' && assignment.entityId == supplierId
                            );

                            if (supplierAssignments.length > 0) {
                                // Helper function to clean product name for matching
                                const cleanForMatching = (name) => {
                                    if (!name) return '';
                                    return name.replace(/^\d+\s*-\s*/, '').trim();
                                };

                                // Get Stage 4 price data
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
                                } catch (e) {
                                    console.error('Error parsing stage4_data:', e);
                                }

                                // Enrich assignments with correct quantity and price
                                const enrichedAssignments = supplierAssignments.map(assignment => {
                                    const cleanAssignmentProduct = cleanForMatching(assignment.product);

                                    // Get quantity from order items
                                    let qty = assignment.assignedQty || 0;
                                    if (!qty || qty === 0) {
                                        const matchingItem = order.items?.find(item => {
                                            const itemProduct = item.product_name || item.product || '';
                                            const cleanItemProduct = cleanForMatching(itemProduct);
                                            return cleanItemProduct === cleanAssignmentProduct;
                                        });

                                        if (matchingItem) {
                                            qty = parseFloat(matchingItem.net_weight) || parseFloat(matchingItem.quantity) || 0;
                                        }
                                    }

                                    // Get price from stage4 product rows
                                    let price = assignment.price || 0;
                                    if (!price || price === 0) {
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

                                // Calculate total amount with enriched data
                                const totalAmount = enrichedAssignments.reduce((sum, assignment) => {
                                    const qty = parseFloat(assignment.assignedQty) || 0;
                                    const price = parseFloat(assignment.price) || 0;
                                    return sum + (qty * price);
                                }, 0);

                                processedOrders.push({
                                    order,
                                    assignments: enrichedAssignments,
                                    totalAmount
                                });
                            }
                        }
                    } catch (error) {
                        console.error(`Error processing order ${order.oid}:`, error);
                    }
                }

                // Sort by newest first
                processedOrders.sort((a, b) => {
                    const dateA = new Date(a.order.createdAt || 0);
                    const dateB = new Date(b.order.createdAt || 0);
                    return dateB - dateA;
                });

                setSupplierOrders(processedOrders);
            }
        } catch (error) {
            console.error('Error fetching supplier details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentStatusToggle = async (order) => {
        const currentStatus = order.payment_status;
        const newStatus = (currentStatus === 'paid' || currentStatus === 'completed') ? 'unpaid' : 'paid';

        const confirmMessage = newStatus === 'paid'
            ? `Mark order ${order.oid} as PAID?`
            : `Mark order ${order.oid} as UNPAID?`;

        if (window.confirm(confirmMessage)) {
            try {
                await updateOrder(order.oid, { payment_status: newStatus });
                // Refresh the data
                fetchSupplierDetails();
                alert(`Payment status updated to ${newStatus.toUpperCase()}`);
            } catch (error) {
                console.error('Error updating payment status:', error);
                alert('Failed to update payment status');
            }
        }
    };

    const handleExportOrderPDF = (order, assignments, totalAmount) => {
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

        const productsBody = assignments.map(assignment => [
            cleanText(cleanProductName(assignment.product || assignment.productName)),
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

    const handleExportOrderExcel = (order, assignments, totalAmount) => {
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

        assignments.forEach(assignment => {
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

    // Filter orders by date range and payment status
    const getFilteredOrders = () => {
        let filtered = supplierOrders;

        // Filter by date range
        if (fromDate || toDate) {
            filtered = filtered.filter(({ order }) => {
                const orderDate = new Date(order.order_received_date || order.createdAt);
                const from = fromDate ? new Date(fromDate) : null;
                const to = toDate ? new Date(toDate) : null;

                // Set time to start/end of day for accurate comparison
                if (from) from.setHours(0, 0, 0, 0);
                if (to) to.setHours(23, 59, 59, 999);

                if (from && to) {
                    return orderDate >= from && orderDate <= to;
                } else if (from) {
                    return orderDate >= from;
                } else if (to) {
                    return orderDate <= to;
                }
                return true;
            });
        }

        // Filter by payment status
        if (paymentStatusFilter !== 'all') {
            filtered = filtered.filter(({ order }) => {
                const isPaid = order.payment_status === 'paid' || order.payment_status === 'completed';
                if (paymentStatusFilter === 'paid') {
                    return isPaid;
                } else if (paymentStatusFilter === 'unpaid') {
                    return !isPaid;
                }
                return true;
            });
        }

        return filtered;
    };

    const filteredOrders = getFilteredOrders();

    // Pagination calculations
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [fromDate, toDate, paymentStatusFilter]);

    const calculateTotals = () => {
        let totalAmount = 0;
        let paidAmount = 0;
        let pendingAmount = 0;

        filteredOrders.forEach(({ order, totalAmount: orderAmount }) => {
            totalAmount += orderAmount;
            if (order.payment_status === 'paid' || order.payment_status === 'completed') {
                paidAmount += orderAmount;
            } else {
                pendingAmount += orderAmount;
            }
        });

        return { totalAmount, paidAmount, pendingAmount };
    };

    const totals = calculateTotals();

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

    const handleExportPDF = () => {
        if (!supplier || filteredOrders.length === 0) return;

        const doc = new jsPDF();

        const cleanText = (str) => {
            if (str === null || str === undefined) return '';
            let s = String(str);
            s = s.replace(/₹/g, 'Rs. ');
            return s.replace(/[^\x00-\x7F]/g, '').trim();
        };

        // Attractive Header
        doc.setFillColor(13, 92, 77);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('SUPPLIER REPORT', 105, 12, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(cleanText(supplier.supplier_name), 105, 22, { align: 'center' });

        // Supplier Info Card
        doc.setTextColor(0, 0, 0);
        doc.autoTable({
            startY: 35,
            head: [['Supplier ID', 'Phone', 'Total Orders', 'Total Amount']],
            body: [[
                cleanText(supplier.sid),
                cleanText(supplier.phone || 'N/A'),
                filteredOrders.length,
                cleanText(`Rs. ${totals.totalAmount.toFixed(2)}`)
            ]],
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 10 },
            bodyStyles: { halign: 'center', fontSize: 10, cellPadding: 3 },
        });

        let finalY = doc.lastAutoTable.finalY + 12;

        // Orders Table
        doc.setFillColor(236, 253, 245);
        doc.rect(14, finalY - 2, 182, 8, 'F');
        doc.setTextColor(5, 150, 105);
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text("Order History", 16, finalY + 4);
        doc.setFont(undefined, 'normal');

        const orderTableBody = [];
        filteredOrders.forEach(({ order, assignments, totalAmount }) => {
            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A';
            const productList = assignments.map(a => cleanProductName(a.product || a.productName)).join(', ');
            const paymentStatus = order.payment_status === 'paid' || order.payment_status === 'completed' ? 'Paid' : 'Unpaid';

            orderTableBody.push([
                cleanText(order.oid),
                orderDate,
                productList,
                cleanText(`Rs. ${totalAmount.toFixed(2)}`),
                paymentStatus
            ]);
        });

        doc.autoTable({
            startY: finalY + 7,
            head: [['Order ID', 'Date', 'Products', 'Amount', 'Status']],
            body: orderTableBody,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: [240, 253, 244] }
        });

        finalY = doc.lastAutoTable.finalY + 12;

        // Summary
        if (finalY > 250) { doc.addPage(); finalY = 20; }
        doc.setFillColor(236, 253, 245);
        doc.rect(14, finalY - 2, 182, 8, 'F');
        doc.setTextColor(5, 150, 105);
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text("Payment Summary", 16, finalY + 4);
        doc.setFont(undefined, 'normal');

        const summaryBody = [
            ['Total Amount:', `Rs. ${totals.totalAmount.toFixed(2)}`],
            ['Paid Amount:', `Rs. ${totals.paidAmount.toFixed(2)}`],
            ['Pending Amount:', `Rs. ${totals.pendingAmount.toFixed(2)}`]
        ];

        doc.autoTable({
            startY: finalY + 7,
            body: summaryBody,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold', halign: 'right' }, 1: { halign: 'left' } }
        });

        doc.save(`Supplier_Report_${supplier.supplier_name}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleExportExcel = () => {
        if (!supplier || filteredOrders.length === 0) return;

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

        // Title
        allRows.push([cell('SUPPLIER REPORT', 'title'), '', '', '', '']);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 4 } });
        currentRow++;
        allRows.push([cell(supplier.supplier_name, 'title'), '', '', '', '']);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 4 } });
        currentRow++;
        allRows.push([]);
        currentRow++;

        // Supplier Info
        allRows.push([
            cell('Supplier ID:', 'bold'),
            cell(supplier.sid),
            cell('Phone:', 'bold'),
            cell(supplier.phone || 'N/A'),
            ''
        ]);
        currentRow++;
        allRows.push([]);
        currentRow++;

        // Orders Table
        allRows.push([cell('ORDER HISTORY', 'sectionGreen'), '', '', '', '']);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 4 } });
        currentRow++;
        allRows.push([
            cell('Order ID', 'header'),
            cell('Date', 'header'),
            cell('Products', 'header'),
            cell('Amount', 'header'),
            cell('Status', 'header')
        ]);
        currentRow++;

        filteredOrders.forEach(({ order, assignments, totalAmount }) => {
            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A';
            const productList = assignments.map(a => cleanProductName(a.product || a.productName)).join(', ');
            const paymentStatus = order.payment_status === 'paid' || order.payment_status === 'completed' ? 'Paid' : 'Unpaid';

            allRows.push([
                cell(order.oid),
                cell(orderDate),
                cell(productList),
                cell(totalAmount.toFixed(2)),
                cell(paymentStatus)
            ]);
            currentRow++;
        });

        allRows.push([]);
        currentRow++;

        // Summary
        allRows.push([cell('PAYMENT SUMMARY', 'sectionGreen'), '', '', '', '']);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 4 } });
        currentRow++;
        allRows.push([cell('Total Amount:', 'bold'), '', '', cell(totals.totalAmount.toFixed(2), 'highlight'), '']);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 2 } });
        currentRow++;
        allRows.push([cell('Paid Amount:', 'bold'), '', '', cell(totals.paidAmount.toFixed(2), 'highlight'), '']);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 2 } });
        currentRow++;
        allRows.push([cell('Pending Amount:', 'bold'), '', '', cell(totals.pendingAmount.toFixed(2), 'highlight'), '']);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 2 } });
        currentRow++;

        const ws = XLSX.utils.aoa_to_sheet(allRows);
        ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 }];
        ws['!merges'] = merges;
        ws['!rows'] = [{ hpt: 25 }, { hpt: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, "Supplier Report");
        XLSX.writeFile(wb, `Supplier_Report_${supplier.supplier_name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-[#0D8568] text-xl">Loading supplier details...</div>
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-600 text-xl">Supplier not found</div>
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
                            onClick={() => navigate('/reports/supplier')}
                            className="p-2 bg-white rounded-lg hover:bg-[#F0F4F3] transition-colors shadow-md"
                        >
                            <ArrowLeft className="text-[#0D8568]" size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[#0D5C4D]">Supplier Details</h1>
                            <p className="text-[#6B8782]">View detailed information about this supplier</p>
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

                {/* Supplier Information Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-[#0D5C4D] mb-4">Supplier Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-[#6B8782] mb-1">Supplier ID</p>
                            <p className="text-lg font-semibold text-[#0D5C4D]">{supplier.sid || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[#6B8782] mb-1">Supplier Name</p>
                            <p className="text-lg font-semibold text-[#0D5C4D]">{supplier.supplier_name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[#6B8782] mb-1">Phone Number</p>
                            <p className="text-lg font-semibold text-[#0D5C4D]">{supplier.phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[#6B8782] mb-1">Total Orders</p>
                            <p className="text-lg font-semibold text-[#0D8568]">{filteredOrders.length}</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-r from-[#10B981] to-[#059669] rounded-2xl p-6 text-white">
                        <p className="text-sm font-medium mb-2 opacity-90">Total Amount</p>
                        <p className="text-4xl font-bold mb-2">₹{(totals.totalAmount / 1000).toFixed(1)}K</p>
                        <p className="text-xs opacity-75">Total value of all orders</p>
                    </div>
                    <div className="bg-gradient-to-r from-[#4ED39A] to-[#34D399] rounded-2xl p-6 text-white">
                        <p className="text-sm font-medium mb-2 opacity-90">Paid Amount</p>
                        <p className="text-4xl font-bold mb-2">₹{(totals.paidAmount / 1000).toFixed(1)}K</p>
                        <p className="text-xs opacity-75">Successfully settled</p>
                    </div>
                    <div className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-2xl p-6 text-white">
                        <p className="text-sm font-medium mb-2 opacity-90">Pending Amount</p>
                        <p className="text-4xl font-bold mb-2">₹{(totals.pendingAmount / 1000).toFixed(1)}K</p>
                        <p className="text-xs opacity-75">To be settled</p>
                    </div>
                </div>

                {/* Date Filter Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-[#0D5C4D] mb-4">Filter Orders</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#6B8782] mb-2">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D0E0DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#6B8782] mb-2">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D0E0DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#6B8782] mb-2">Payment Status</label>
                            <select
                                value={paymentStatusFilter}
                                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-[#D0E0DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
                            >
                                <option value="all">All</option>
                                <option value="paid">Paid Only</option>
                                <option value="unpaid">Unpaid Only</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFromDate('');
                                    setToDate('');
                                    setPaymentStatusFilter('all');
                                }}
                                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                    {(fromDate || toDate || paymentStatusFilter !== 'all') && (
                        <div className="mt-4 text-sm text-[#0D8568]">
                            Showing {filteredOrders.length} of {supplierOrders.length} orders
                        </div>
                    )}
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-[#0D8568] text-white px-6 py-4">
                        <h2 className="text-xl font-bold">Order History</h2>
                    </div>
                    <div className="p-6">
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-12 text-[#6B8782]">
                                No orders found {(fromDate || toDate) ? 'for selected date range' : 'for this supplier'}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#0D8568] text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Order ID</th>
                                                <th className="px-4 py-3 text-left">Date</th>
                                                <th className="px-4 py-3 text-left">Products</th>
                                                <th className="px-4 py-3 text-left">Amount</th>
                                                <th className="px-4 py-3 text-left">Payment Status</th>
                                                <th className="px-4 py-3 text-left">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedOrders.map(({ order, assignments, totalAmount }, index) => {
                                                const orderDate = order.createdAt
                                                    ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
                                                    : 'N/A';
                                                const productNames = assignments.map(a => cleanProductName(a.product || a.productName));
                                                const displayProducts = productNames.slice(0, 3);
                                                const remainingCount = productNames.length - displayProducts.length;

                                                return (
                                                    <tr
                                                        key={order.oid}
                                                        className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'
                                                            }`}
                                                    >
                                                        <td className="px-4 py-4">
                                                            <span className="text-sm font-semibold text-[#0D5C4D]">{order.oid}</span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="text-sm text-[#0D5C4D]">{orderDate}</span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {displayProducts.map((product, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#D4F4E8] text-[#047857]"
                                                                    >
                                                                        {product}
                                                                    </span>
                                                                ))}
                                                                {remainingCount > 0 && (
                                                                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#D4E8FF] text-[#0066CC]">
                                                                        +{remainingCount} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="text-sm font-semibold text-[#0D5C4D]">
                                                                ₹{totalAmount.toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <button
                                                                onClick={() => handlePaymentStatusToggle(order)}
                                                                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit cursor-pointer hover:opacity-80 transition-opacity ${order.payment_status === 'paid' || order.payment_status === 'completed'
                                                                    ? 'bg-[#4ED39A] text-white'
                                                                    : 'bg-[#FFE0E0] text-[#CC0000]'
                                                                    }`}
                                                                title={`Click to mark as ${order.payment_status === 'paid' || order.payment_status === 'completed' ? 'UNPAID' : 'PAID'}`}
                                                            >
                                                                <div
                                                                    className={`w-2 h-2 rounded-full ${order.payment_status === 'paid' || order.payment_status === 'completed'
                                                                        ? 'bg-white'
                                                                        : 'bg-[#CC0000]'
                                                                        }`}
                                                                ></div>
                                                                {order.payment_status === 'paid' || order.payment_status === 'completed' ? 'Paid' : 'Unpaid'}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => navigate(`/admin/report-supplier/${supplierId}/order/${order.oid}`)}
                                                                    className="p-2 bg-[#0D8568] hover:bg-[#0a6354] text-white rounded-lg transition-colors"
                                                                    title="View Supplier's Order Details"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleExportOrderExcel(order, assignments, totalAmount)}
                                                                    className="p-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg transition-colors"
                                                                    title="Export Excel"
                                                                >
                                                                    <FileSpreadsheet size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleExportOrderPDF(order, assignments, totalAmount)}
                                                                    className="p-2 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg transition-colors"
                                                                    title="Export PDF"
                                                                >
                                                                    <FileText size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col md:flex-row items-center justify-between mt-6 pt-6 border-t border-[#D0E0DB] gap-4">
                                        <p className="text-sm text-[#6B8782]">
                                            Showing <span className="font-semibold text-[#0D5C4D]">{startIndex + 1}</span> to{' '}
                                            <span className="font-semibold text-[#0D5C4D]">
                                                {Math.min(endIndex, filteredOrders.length)}
                                            </span>{' '}
                                            of <span className="font-semibold text-[#0D5C4D]">{filteredOrders.length}</span> orders
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
                                                <ChevronLeft size={20} />
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {[...Array(totalPages)].map((_, i) => (
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
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className={`p-2 rounded-lg border border-[#D0E0DB] transition-all ${currentPage === totalPages
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-[#0D5C4D] hover:bg-[#D4F4E8] hover:border-[#0D8568]'
                                                    }`}
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportSupplierView;
