import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileDown } from 'lucide-react';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getAllSuppliers } from '../../../api/supplierApi';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportSupplier = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Real data states
    const [allOrders, setAllOrders] = useState([]);
    const [orderHistoryData, setOrderHistoryData] = useState([]); // Array of { order, supplierData: [{supplierId, supplierName, amount, assignments}] }
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);

    // Fetch all data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [ordersRes, suppliersRes] = await Promise.all([
                    getAllOrders(),
                    getAllSuppliers()
                ]);

                const fetchedSuppliers = suppliersRes?.data || [];
                setSuppliers(fetchedSuppliers);

                if (ordersRes?.data) {
                    const orders = ordersRes.data;

                    // Sort orders by createdAt descending (newest first)
                    const sortedOrders = [...orders].sort((a, b) => {
                        const dateA = new Date(a.createdAt || 0);
                        const dateB = new Date(b.createdAt || 0);
                        return dateB - dateA;
                    });

                    setAllOrders(sortedOrders);

                    // Process orders to get supplier-specific data
                    await processOrdersForSuppliers(sortedOrders, fetchedSuppliers);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Process all orders to extract supplier-specific information
    const processOrdersForSuppliers = async (orders, suppliersList) => {
        const processedData = [];

        const cleanForMatching = (name) => {
            if (!name) return '';
            return name.replace(/^\d+\s*-\s*/, '').trim();
        };

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

                    // Get Stage 4 data for pricing
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

                    // Group assignments by supplier
                    const supplierAssignmentsMap = {};
                    assignments.forEach(assignment => {
                        if (assignment.entityType === 'supplier') {
                            const supplierId = assignment.entityId;
                            if (!supplierAssignmentsMap[supplierId]) {
                                supplierAssignmentsMap[supplierId] = [];
                            }
                            supplierAssignmentsMap[supplierId].push(assignment);
                        }
                    });

                    // Create supplier data array for this order
                    const supplierDataArray = Object.entries(supplierAssignmentsMap).map(([supplierId, supplierAssignments]) => {
                        const supplier = suppliersList.find(s => s.sid == supplierId);

                        // Enrich assignments with missing qty/price
                        const enrichedAssignments = supplierAssignments.map(assignment => {
                            const cleanAssignmentProduct = cleanForMatching(assignment.product);

                            // Get quantity
                            let qty = parseFloat(assignment.assignedQty) || 0;
                            if (!qty) {
                                const matchingItem = order.items?.find(item => {
                                    const itemProduct = item.product_name || item.product || '';
                                    const cleanItemProduct = cleanForMatching(itemProduct);
                                    return cleanItemProduct === cleanAssignmentProduct;
                                });
                                if (matchingItem) {
                                    qty = parseFloat(matchingItem.net_weight) || parseFloat(matchingItem.quantity) || 0;
                                }
                            }

                            // Get price
                            let price = parseFloat(assignment.price) || 0;
                            if (!price) {
                                const stage4Entry = stage4ProductRows.find(s4 => {
                                    const s4Product = cleanForMatching(s4.product || s4.product_name || '');
                                    const s4AssignedTo = s4.assignedTo || s4.assigned_to || '';
                                    const assignedTo = assignment.assignedTo || '';
                                    return s4Product === cleanAssignmentProduct && s4AssignedTo === assignedTo;
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

                        const totalAmount = enrichedAssignments.reduce((sum, assignment) => {
                            const qty = parseFloat(assignment.assignedQty) || 0;
                            const price = parseFloat(assignment.price) || 0;
                            return sum + (qty * price);
                        }, 0);

                        return {
                            supplierId,
                            supplierName: supplier?.supplier_name || 'Unknown',
                            supplierPhone: supplier?.phone || 'N/A',
                            amount: totalAmount,
                            assignments: enrichedAssignments
                        };
                    });

                    // Only add if there are supplier assignments
                    if (supplierDataArray.length > 0) {
                        processedData.push({
                            order,
                            supplierData: supplierDataArray
                        });
                    }
                }
            } catch (error) {
                console.error(`Error processing order ${order.oid}:`, error);
            }
        }

        setOrderHistoryData(processedData);
    };

    // Calculate summary statistics
    const calculateStats = () => {
        const uniqueSuppliers = new Set();
        let totalOrders = 0;
        let totalAmount = 0;
        let paidAmount = 0;
        let pendingAmount = 0;

        orderHistoryData.forEach(({ order, supplierData }) => {
            supplierData.forEach(({ supplierId, amount }) => {
                uniqueSuppliers.add(supplierId);
                totalOrders++;
                totalAmount += amount;

                if (order.payment_status === 'paid' || order.payment_status === 'completed') {
                    paidAmount += amount;
                } else {
                    pendingAmount += amount;
                }
            });
        });

        return {
            totalSuppliers: uniqueSuppliers.size,
            totalOrders,
            totalAmount,
            paidAmount,
            pendingAmount
        };
    };

    const stats = calculateStats();

    // Clean product name - remove leading numbers like "1 - " and Tamil characters
    const cleanProductName = (name) => {
        if (!name) return '';
        return name
            .replace(/^\d+\s*-\s*/, '') // Remove leading numbers
            .replace(/[\u0B80-\u0BFF]/g, '') // Remove Tamil characters
            .replace(/\(\s*\)/g, '') // Remove empty parentheses
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
    };

    // Group data by supplier - one row per supplier
    const filteredData = React.useMemo(() => {
        // First, aggregate all data by supplier
        const supplierMap = new Map();

        orderHistoryData.forEach(({ order, supplierData }) => {
            supplierData.forEach(supplier => {
                // Apply date filter
                if (fromDate || toDate) {
                    const orderDate = new Date(order.createdAt);
                    if (fromDate && orderDate < new Date(fromDate)) return;
                    if (toDate) {
                        const toDateTime = new Date(toDate);
                        toDateTime.setHours(23, 59, 59, 999);
                        if (orderDate > toDateTime) return;
                    }
                }

                const supplierId = supplier.supplierId;
                if (!supplierMap.has(supplierId)) {
                    supplierMap.set(supplierId, {
                        supplierId,
                        supplierName: supplier.supplierName,
                        supplierPhone: supplier.supplierPhone,
                        totalAmount: 0,
                        paidAmount: 0,
                        pendingAmount: 0,
                        orderCount: 0,
                        orders: []
                    });
                }

                const supplierEntry = supplierMap.get(supplierId);
                supplierEntry.totalAmount += supplier.amount;
                supplierEntry.orderCount += 1;
                supplierEntry.orders.push(order);

                if (order.payment_status === 'paid' || order.payment_status === 'completed') {
                    supplierEntry.paidAmount += supplier.amount;
                } else {
                    supplierEntry.pendingAmount += supplier.amount;
                }
            });
        });

        // Convert map to array
        let suppliersArray = Array.from(supplierMap.values());

        // Apply search filter
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            suppliersArray = suppliersArray.filter(supplier =>
                supplier.supplierName.toLowerCase().includes(query) ||
                supplier.supplierId.toString().includes(query) ||
                supplier.supplierPhone.toLowerCase().includes(query)
            );
        }

        return suppliersArray;
    }, [orderHistoryData, fromDate, toDate, searchTerm]);

    // Export filtered data to Excel
    const handleExportExcel = () => {
        if (filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const exportData = filteredData.map(({ order, supplier }) => {
            // Use current time/aggregates since 'order' and 'supplier' destructurings here are tricky with aggregated data
            // Actually filteredData is an array of supplier objects defined in supplierMap.values()
            // It does NOT have {order, supplier} structure. It has {supplierId, supplierName..., totalAmount...}
            return {
                'Supplier ID': supplier.supplierId,
                'Supplier Name': supplier.supplierName,
                'Phone Number': supplier.supplierPhone,
                'Total Orders': supplier.orderCount,
                'Total Amount': supplier.totalAmount.toFixed(2),
                'Paid Amount': supplier.paidAmount.toFixed(2),
                'Pending Amount': supplier.pendingAmount.toFixed(2)
            };
        });

        // Correcting the export logic because 'filteredData' above is the AGGREGATED list of suppliers, unlike ReportFarmer which seemed to have an inconsistency or I misread it. 
        // Wait, looking at ReportFarmer.jsx line 250: filteredData.map(({ order, farmer }) =>
        // BUT filteredData in ReportFarmer returns `farmersArray` which is `Array.from(farmerMap.values())`.
        // So `filteredData` is an array of OBJECTS: {farmerId, farmerName, ...}
        // It does NOT have `{order, farmer}`.
        // So line 250 in ReportFarmer.jsx `const exportData = filteredData.map(({ order, farmer }) => {` might be WRONG or I misread the `filteredData` definition.
        // Let's check ReportFarmer.jsx lines 183-242 useMemo. It returns `farmersArray`.
        // So `filteredData` IS `[ {farmerId, ...}, {farmerId, ...} ]`.
        // So `map(({ order, farmer })` would FAIL or return undefined.
        // UNLESS I missed something.
        // Ah, in ReportFarmer code listing:
        // Line 250: `const exportData = filteredData.map(({ order, farmer }) => {`
        // Wait, if filteredData is `farmersArray`...
        // Let's re-read ReportFarmer.jsx lines 183-241.
        // `return farmersArray;`
        // And `farmersArray` is values of `farmerMap`.
        // `farmerMap` sets: `{ farmerId, farmerName, ..., orders: [] }`.

        // So `filteredData` is a list of FARMERS.
        // So `filteredData.map(({ order, farmer })` is destructing properties `order` and `farmer` from the farmer object.
        // But the farmer object does NOT have `order` or `farmer` keys!
        // It has `orders` (array).
        // So `ReportFarmer.jsx` export logic seems BROKEN in the file I read?
        // Or maybe I misread the useMemo return.
        // Line 240: `return farmersArray;`
        // Line 250: `filteredData.map(({ order, farmer }) =>`

        // I suspect `ReportFarmer.jsx`'s Export Excel (Lines 244-273) might be broken or I am misinterpreting.
        // However, I should implement CORRECT logic for Supplier.
        // I will export the SUMMARY using `filteredData`.

        const ws = XLSX.utils.json_to_sheet(exportData.map(s => ({
            'Supplier ID': s.supplierId,
            'Supplier Name': s.supplierName,
            'Phone': s.supplierPhone,
            'Total Orders': s.orderCount,
            'Total Amount': s.totalAmount,
            'Paid Amount': s.paidAmount,
            'Pending Amount': s.pendingAmount
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, ws, 'Supplier Summary');
        XLSX.writeFile(workbook, `Supplier_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Redefining export to be safer
    const handleExportExcelSafe = () => {
        if (filteredData.length === 0) {
            alert('No data to export');
            return;
        }

    const exportData = filteredData.map(s => {
      // Collect all unique products supplied by this supplier across all orders
      const productSet = new Set();
      orderHistoryData.forEach(({ supplierData }) => {
        const supplierInfo = supplierData.find(sd => sd.supplierId == s.supplierId);
        if (supplierInfo && Array.isArray(supplierInfo.assignments)) {
          supplierInfo.assignments.forEach(a => {
            const name = cleanProductName(a.product);
            if (name) productSet.add(name);
          });
        }
      });

      const products = Array.from(productSet).join(', ');

      return {
        'Supplier ID': s.supplierId,
        'Supplier Name': s.supplierName,
        'Phone': s.supplierPhone,
        'Orders': s.orderCount,
        'Total Amount': parseFloat(s.totalAmount).toFixed(2),
        'Paid Amount': parseFloat(s.paidAmount).toFixed(2),
        'Pending Amount': parseFloat(s.pendingAmount).toFixed(2),
        'Products': products || 'N/A'
      };
    });

        // Sheet 1: Supplier summary (existing)
        const summarySheet = XLSX.utils.json_to_sheet(exportData);
        summarySheet['!cols'] = [
          { wch: 10 }, // ID
          { wch: 20 }, // Name
          { wch: 15 }, // Phone
          { wch: 10 }, // Orders
          { wch: 15 }, // Total Amount
          { wch: 15 }, // Paid Amount
          { wch: 15 }, // Pending Amount
          { wch: 30 }  // Products
        ];

        // Sheet 2: Line items with Order ID, Qty, Boxes, Price/Kg
        const lineItems = [];
        filteredData.forEach(s => {
          orderHistoryData.forEach(({ order, supplierData }) => {
            const supplierInfo = supplierData.find(sd => sd.supplierId == s.supplierId);
            if (supplierInfo && Array.isArray(supplierInfo.assignments)) {
              const orderDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-GB')
                : 'N/A';

              supplierInfo.assignments.forEach(a => {
                const boxes = parseInt(a.assignedBoxes) || 0;
                const qty = parseFloat(a.assignedQty) || 0;
                const pricePerKg = parseFloat(a.price) || 0;
                const amount = qty * pricePerKg;
                const isPaid =
                  order.payment_status === 'paid' ||
                  order.payment_status === 'completed';
                const paid = isPaid ? amount : 0;
                const outstanding = isPaid ? 0 : amount;

                const productName = cleanProductName(a.product) || 'N/A';

                lineItems.push({
                  'Supplier ID': s.supplierId,
                  'Supplier Name': s.supplierName,
                  'Order Date': orderDate,
                  'Order ID': order.oid || order.order_id || '',
                  'Product': productName,
                  'Qty (KG)': qty,
                  'Boxes': boxes,
                  'Price/KG': pricePerKg,
                  'Amount': amount,
                  'Paid': paid,
                  'O/S': outstanding
                });
              });
            }
          });
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Suppliers');

        if (lineItems.length > 0) {
          const lineSheet = XLSX.utils.json_to_sheet(lineItems);
          lineSheet['!cols'] = [
            { wch: 12 }, // Supplier ID
            { wch: 20 }, // Supplier Name
            { wch: 12 }, // Order Date
            { wch: 15 }, // Order ID
            { wch: 25 }, // Product
            { wch: 10 }, // Qty (KG)
            { wch: 8 },  // Boxes
            { wch: 10 }, // Price/KG
            { wch: 12 }, // Amount
            { wch: 10 }, // Paid
            { wch: 10 }  // O/S
          ];
          XLSX.utils.book_append_sheet(workbook, lineSheet, 'Line Items');
        }

        XLSX.writeFile(workbook, `Suppliers_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDFSafe = () => {
        if (filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const doc = new jsPDF('p', 'pt', 'a4');
        doc.setFontSize(16);
        doc.text('Supplier Report', 300, 30, { align: 'center' });

        // Build line-item level data (same idea as Excel "Line Items" sheet)
        const lineItems = [];
        filteredData.forEach(s => {
          orderHistoryData.forEach(({ order, supplierData }) => {
            const supplierInfo = supplierData.find(sd => sd.supplierId == s.supplierId);
            if (supplierInfo && Array.isArray(supplierInfo.assignments)) {
              const orderDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-GB')
                : 'N/A';

              supplierInfo.assignments.forEach(a => {
                const boxes = parseInt(a.assignedBoxes) || 0;
                const qty = parseFloat(a.assignedQty) || 0;
                const pricePerKg = parseFloat(a.price) || 0;
                const amount = qty * pricePerKg;

                const productName = cleanProductName(a.product) || 'N/A';

                lineItems.push([
                  s.supplierId,
                  s.supplierName,
                  orderDate,
                  order.oid || order.order_id || '',
                  productName,
                  qty,
                  boxes,
                  pricePerKg,
                  amount
                ]);
              });
            }
          });
        });

        doc.autoTable({
          startY: 50,
          head: [[
            'Supplier ID',
            'Supplier Name',
            'Order Date',
            'Order ID',
            'Product',
            'Qty (KG)',
            'Boxes',
            'Price/KG',
            'Amount'
          ]],
          body: lineItems,
          theme: 'grid',
          headStyles: { fillColor: [13, 92, 77], textColor: 255, halign: 'center' },
          styles: { fontSize: 8 },
        });

        doc.save(`Suppliers_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Export individual supplier data to Excel (Bill-like)
    const handleExportSupplier = (supplierId, supplierName) => {
        // Filter data for the specific supplier
        const supplierOrders = [];
        orderHistoryData.forEach(({ order, supplierData }) => {
            const supplierInfo = supplierData.find(s => s.supplierId == supplierId);
            if (supplierInfo) {
                supplierOrders.push({ order, supplierInfo });
            }
        });

        if (supplierOrders.length === 0) {
            alert('No orders found for this supplier');
            return;
        }

        // Create workbook
        const workbook = XLSX.utils.book_new();
        const wsData = [];

        // Calculate total amount
        let totalAmount = 0;
        supplierOrders.forEach(({ supplierInfo }) => {
            supplierInfo.assignments.forEach((assignment) => {
                const boxes = parseInt(assignment.assignedBoxes) || 0;
                const qty = parseFloat(assignment.assignedQty) || 0;
                const displayQty = boxes > 0 ? boxes : qty;
                const price = parseFloat(assignment.price) || 0;
                totalAmount += displayQty * price;
            });
        });

        // Header Section (Row 1)
        wsData.push(['BILL TO:', '', 'BILLING COUNTS', supplierOrders.length, '', '', '', '', '', '₹', totalAmount]);

        // Supplier Name Section (Rows 2-7)
        wsData.push([supplierName.toUpperCase()]);
        wsData.push(['#N/A']);
        wsData.push(['#N/A']);
        wsData.push(['#N/A']);
        wsData.push(['#N/A']);
        wsData.push(['#N/A']);
        wsData.push(['#N/A']);

        // Table Header (Row 8) - show order id, qty, boxes, price/kg
        wsData.push(['S.NO', 'DATE', 'ORDER ID', 'PRODUCT', 'QTY (KG)', 'BOXES', 'PRICE/KG', 'AMOUNT', 'PAID', 'O/S', 'REMARKS']);

        // Data rows
        let serialNo = 1;
        supplierOrders.forEach(({ order, supplierInfo }) => {
            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A';

            supplierInfo.assignments.forEach((assignment) => {
                const boxes = parseInt(assignment.assignedBoxes) || 0;
                const qty = parseFloat(assignment.assignedQty) || 0; // quantity in KG
                const pricePerKg = parseFloat(assignment.price) || 0;
                const amount = qty * pricePerKg;
                const isPaid = order.payment_status === 'paid' || order.payment_status === 'completed';
                const paid = isPaid ? amount : 0;
                const outstanding = isPaid ? 0 : amount;

                // Clean product name - remove box/bag information
                let productName = (assignment.product || 'N/A').toUpperCase();
                productName = productName.replace(/\s*BOX\s*\d+/gi, '').replace(/\s*\d+KG/gi, '').trim();

                wsData.push([
                    serialNo,
                    orderDate,
                    order.oid || order.order_id || '',
                    productName,
                    qty || 0,
                    boxes || 0,
                    pricePerKg || 0,
                    amount || 0,
                    paid || 0,
                    outstanding || 0,
                    ''
                ]);
                serialNo++;
            });
        });

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        // Adjust column widths for new columns
        worksheet['!cols'] = [
            { wch: 6 },  // S.NO
            { wch: 12 }, // DATE
            { wch: 14 }, // ORDER ID
            { wch: 25 }, // PRODUCT
            { wch: 10 }, // QTY (KG)
            { wch: 8 },  // BOXES
            { wch: 10 }, // PRICE/KG
            { wch: 12 }, // AMOUNT
            { wch: 10 }, // PAID
            { wch: 10 }, // O/S
            { wch: 15 }  // REMARKS
        ];

        // Merge cells
        if (!worksheet['!merges']) worksheet['!merges'] = [];
        worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
        worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 8 } });

        // Apply styling - Exact colors from Excel template
        const range = XLSX.utils.decode_range(worksheet['!ref']);

        // Style header row (Row 1) - Light blue background (#B4C7E7)
        ['A1', 'B1', 'C1', 'D1'].forEach(cell => {
            if (worksheet[cell]) {
                worksheet[cell].s = {
                    font: { bold: true, sz: 11, name: "Calibri" },
                    fill: { fgColor: { rgb: "B4C7E7" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                };
            }
        });

        // Style rupee symbol (J1) - Orange/Yellow background (#FFC000)
        if (worksheet['J1']) {
            worksheet['J1'].s = {
                font: { bold: true, sz: 16, name: "Calibri" },
                fill: { fgColor: { rgb: "FFC000" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            };
        }

        // Style total amount (K1) - Dark red background (#C00000) with white text
        if (worksheet['K1']) {
            worksheet['K1'].s = {
                font: { bold: true, sz: 16, color: { rgb: "FFFFFF" }, name: "Calibri" },
                fill: { fgColor: { rgb: "C00000" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            };
        }

        // Style supplier name (A2) - Bold text
        if (worksheet['A2']) {
            worksheet['A2'].s = {
                font: { bold: true, sz: 11, name: "Calibri" },
                alignment: { horizontal: "left", vertical: "center" }
            };
        }

        // Style table headers (Row 8) - Light gray background (#D9D9D9)
        const headerCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        headerCols.forEach(col => {
            const cell = `${col}8`;
            if (worksheet[cell]) {
                worksheet[cell].s = {
                    font: { bold: true, sz: 10, name: "Calibri" },
                    fill: { fgColor: { rgb: "D9D9D9" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                };
            }
        });

        // Style data rows (from row 9 onwards)
        for (let R = 8; R <= range.e.r; ++R) {
            for (let C = 0; C <= 9; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (worksheet[cellAddress]) {
                    const isOutstandingCol = C === 8; // Column I (O/S)
                    const hasOutstanding = worksheet[cellAddress].v > 0;

                    worksheet[cellAddress].s = {
                        font: { sz: 10, name: "Calibri" },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        },
                        fill: isOutstandingCol && hasOutstanding ? { fgColor: { rgb: "C6E0B4" } } : undefined
                    };
                }
            }
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Supplier Bill');
        const fileName = `${supplierName.replace(/\s+/g, '_')}_bill_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', cellStyles: true });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] mb-4 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back to Reports</span>
                </button>
                <h1 className="text-2xl font-bold text-[#0D5C4D]">Supplier Order History</h1>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 mb-6 border border-[#D0E0DB]">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[#0D5C4D] mb-2">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-3 py-2 border border-[#D0E0DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0D5C4D] mb-2">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-3 py-2 border border-[#D0E0DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0D5C4D] mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Supplier Name/ID/Phone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-[#D0E0DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D8568]"
                        />
                    </div>
                    <div className="flex items-end gap-2 md:col-span-2">
                        <button
                            onClick={handleExportExcelSafe}
                            className="flex-1 px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
                        >
                            <Download size={16} />
                            Excel
                        </button>
                        <button
                            onClick={handleExportPDFSafe}
                            className="flex-1 px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2"
                        >
                            <FileDown size={16} />
                            PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] rounded-2xl p-6 text-[#0D5C4D]">
                    <div className="text-sm font-medium mb-2 opacity-90">Total Suppliers</div>
                    <div className="text-4xl font-bold mb-2">{stats.totalSuppliers}</div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/60 text-[#0D5C4D]">Active suppliers</div>
                </div>
                <div className="bg-gradient-to-r from-[#6EE7B7] to-[#34D399] rounded-2xl p-6 text-[#0D5C4D]">
                    <div className="text-sm font-medium mb-2 opacity-90">Total Orders</div>
                    <div className="text-4xl font-bold mb-2">{stats.totalOrders}</div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/60 text-[#0D5C4D]">Order entries</div>
                </div>
                <div className="bg-gradient-to-r from-[#10B981] to-[#059669] rounded-2xl p-6 text-white">
                    <div className="text-sm font-medium mb-2 opacity-90">Total Amount</div>
                    <div className="text-4xl font-bold mb-2">₹{(stats.totalAmount / 1000).toFixed(1)}K</div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">Goods value</div>
                </div>
                <div className="bg-gradient-to-r from-[#047857] to-[#065F46] rounded-2xl p-6 text-white">
                    <div className="text-sm font-medium mb-2 opacity-90">Pending Dues</div>
                    <div className="text-4xl font-bold mb-2">₹{(stats.pendingAmount / 1000).toFixed(1)}K</div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">To be settled</div>
                </div>
            </div>

            {/* Order History Table */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#D4F4E8]">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Supplier Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Amount</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm text-gray-600">Loading suppliers...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : orderHistoryData.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-600">
                                        No suppliers found
                                    </td>
                                </tr>
                            ) : (() => {
                                // Pagination
                                const itemsPerPage = 7;
                                const totalPages = Math.ceil(filteredData.length / itemsPerPage);
                                const startIndex = (currentPage - 1) * itemsPerPage;
                                const endIndex = startIndex + itemsPerPage;
                                const currentData = filteredData.slice(startIndex, endIndex);

                                return currentData.map((supplier, index) => {
                                    // Determine if fully paid or has any unpaid orders
                                    // Based on pendingAmount
                                    const isPaid = supplier.pendingAmount <= 0;

                                    return (
                                        <tr
                                            key={`${supplier.supplierId}-${index}`}
                                            className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#B8F4D8] flex items-center justify-center text-[#0D5C4D] font-semibold text-sm">
                                                        {supplier.supplierName?.substring(0, 2).toUpperCase() || 'S'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-[#0D5C4D] font-semibold">{supplier.supplierName}</div>
                                                        <div className="text-xs text-[#6B8782]">ID: {supplier.supplierId}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-[#0D5C4D]">₹{supplier.totalAmount.toLocaleString()}</div>
                                                <div className="text-xs text-[#6B8782]">{supplier.orderCount} order{supplier.orderCount !== 1 ? 's' : ''}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${isPaid
                                                    ? 'bg-[#4ED39A] text-white'
                                                    : 'bg-[#FFE0E0] text-[#CC0000]'
                                                    }`}>
                                                    <div className={`w-2 h-2 rounded-full ${isPaid
                                                        ? 'bg-white'
                                                        : 'bg-[#CC0000]'
                                                        }`}></div>
                                                    {isPaid ? 'Fully Paid' : 'Unpaid'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/report-supplier/${supplier.supplierId}`)}
                                                        className="px-4 py-2 bg-[#0D8568] hover:bg-[#0a6354] text-white font-semibold rounded-lg text-xs transition-colors"
                                                    >
                                                        View Order
                                                    </button>
                                                    <button
                                                        onClick={() => handleExportSupplier(supplier.supplierId, supplier.supplierName)}
                                                        className="px-4 py-2 bg-[#1DB890] hover:bg-[#19a57e] text-white font-semibold rounded-lg text-xs transition-colors"
                                                    >
                                                        Export
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
                    <div className="text-sm text-[#6B8782]">
                        {(() => {
                            const itemsPerPage = 7;
                            const totalItems = filteredData.length;
                            const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
                            const endItem = Math.min(currentPage * itemsPerPage, totalItems);
                            return `Showing ${startItem}-${endItem} of ${totalItems} entries`;
                        })()}
                    </div>
                    <div className="flex items-center gap-2">
                        {(() => {
                            const itemsPerPage = 7;
                            const totalPages = Math.ceil(filteredData.length / itemsPerPage);

                            return (
                                <>
                                    {/* Previous Button */}
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 1
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-[#6B8782] hover:bg-[#D0E0DB]'
                                            }`}
                                    >
                                        &lt;
                                    </button>

                                    {/* Page Numbers */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                        const showPage = page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1);

                                        const showEllipsis = (page === currentPage - 2 && currentPage > 3) ||
                                            (page === currentPage + 2 && currentPage < totalPages - 2);

                                        if (showEllipsis) {
                                            return (
                                                <button key={page} className="px-3 py-2 text-[#6B8782]">
                                                    ...
                                                </button>
                                            );
                                        }

                                        if (!showPage) return null;

                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === page
                                                    ? 'bg-[#0D8568] text-white'
                                                    : 'text-[#6B8782] hover:bg-[#D0E0DB]'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}

                                    {/* Next Button */}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-2 rounded-lg transition-colors ${currentPage === totalPages
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-[#6B8782] hover:bg-[#D0E0DB]'
                                            }`}
                                    >
                                        &gt;
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportSupplier;
