import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, FileDown, FileText } from 'lucide-react';
import { getOrderById, getDraftById } from '../../../api/orderApi';
import * as XLSX from 'xlsx';

const OrderView = () => {
    const navigate = useNavigate();
    const { id, orderId } = useParams(); // Get both id and orderId from params
    const orderIdToUse = orderId || id; // Use orderId if available (from farmer route), otherwise use id
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDraft, setIsDraft] = useState(false);

    // Group packing types and calculate totals
    const getPackingSummary = (data) => {
        if (!data.items) return { groups: [], totalPcs: 0, totalGrossWeight: 0 };

        const groupsMap = {};

        let totalGross = 0;
        let totalPcs = 0;

        data.items.forEach((item) => {
            let type = item.packing_type || "Unknown";
            let count = parseInt(item.num_boxes) || 0;

            // Add to gross weight
            totalGross += parseFloat(item.gross_weight) || 0;

            // Count packing pcs
            totalPcs += count;

            // Grouping
            if (!groupsMap[type]) {
                groupsMap[type] = 0;
            }
            groupsMap[type] += count;
        });

        const groups = Object.keys(groupsMap).map((key) => ({
            type: key,
            count: groupsMap[key],
        }));

        return {
            groups,
            totalPcs,
            totalGrossWeight: totalGross,
        };
    };


    useEffect(() => {
        // Check if we're viewing a draft based on the URL
        const isDraftView = location.pathname.includes('/drafts/');
        setIsDraft(isDraftView);

        const fetchOrderOrDraft = async () => {
            try {
                setLoading(true);
                let response;

                if (isDraftView) {
                    response = await getDraftById(orderIdToUse);
                } else {
                    response = await getOrderById(orderIdToUse);
                }

                if (response.success) {
                    setOrder(response.data);
                } else {
                    setError('Failed to fetch order details');
                }
            } catch (err) {
                setError('Error fetching order: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        if (orderIdToUse) {
            fetchOrderOrDraft();
        }
    }, [orderIdToUse, location.pathname]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
                <div className="text-xl">Loading {isDraft ? 'draft' : 'order'} details...</div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
                <div className="text-xl text-red-500">Error: {error}</div>
            </div>
        );
    }

    // Show if no order found
    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
                <div className="text-xl text-gray-500">{isDraft ? 'Draft' : 'Order'} not found</div>
            </div>
        );
    }

    // Format order/draft data for display (draft: only fields from API response)
    const formatData = () => {
        if (isDraft) {
            // draft_data may be JSON string or object
            let draftDataParsed = order.draft_data;
            if (typeof draftDataParsed === 'string') {
                try {
                    draftDataParsed = JSON.parse(draftDataParsed);
                } catch {
                    draftDataParsed = {};
                }
            }
            const products = draftDataParsed?.products || [];
            const items = products.map((p) => ({
                product: p.productName || p.product_name || '-',
                num_boxes: p.numBoxes ?? '-',
                packing_type: p.packingType ?? '-',
                net_weight: p.netWeight ?? '-',
                gross_weight: p.grossWeight ?? '-',
                box_weight: p.boxWeight ?? '-',
                market_price: p.marketPrice || '0.00',
                total_price: p.totalAmount || '0.00'
            }));

            return {
                id: order.did,
                customer_name: order.customer_name ?? null,
                customer_id: order.customer_id ?? null,
                order_status: 'Draft',
                order_received_date: order.order_received_date ?? null,
                packing_date: order.packing_date ?? null,
                packing_day: order.packing_day ?? null,
                order_type: order.order_type ?? null,
                details_comment: order.details_comment ?? null,
                total_amount: order.total_amount ?? null,
                createdAt: order.createdAt ?? null,
                updatedAt: order.updatedAt ?? null,
                items
            };
        } else {
            return order;
        }
    };

    const formattedData = formatData();
    const packingSummary = getPackingSummary(formattedData);

    // Calculate totals
    const calculateTotals = () => {
        if (!formattedData.items || formattedData.items.length === 0) return { totalNetWeight: 0, totalGrossWeight: 0, totalAmount: 0 };

        const totals = formattedData.items.reduce(
            (acc, item) => {
                acc.totalNetWeight += parseFloat(item.net_weight) || 0;
                acc.totalGrossWeight += parseFloat(item.gross_weight) || 0;
                acc.totalAmount += parseFloat(item.total_price) || 0;
                return acc;
            },
            { totalNetWeight: 0, totalGrossWeight: 0, totalAmount: 0 }
        );

        return totals;
    };

    const totals = calculateTotals();

    // Export to Excel function
    const handleExportToExcel = () => {
        if (!formattedData || !formattedData.items || formattedData.items.length === 0) {
            alert('No data to export');
            return;
        }

        // Prepare order summary data (draft: only fields from API response)
        const orderSummary = [
            { Field: isDraft ? 'Draft ID' : 'Order ID', Value: isDraft ? formattedData.id : formattedData.oid },
            { Field: 'Customer Name', Value: formattedData.customer_name ?? '—' },
            { Field: 'Customer ID', Value: formattedData.customer_id ?? '—' },
            { Field: 'Order Status', Value: formattedData.order_status },
            ...(isDraft && formattedData.order_type != null ? [{ Field: 'Order type', Value: formattedData.order_type }] : []),
            ...(isDraft && formattedData.order_received_date != null ? [{ Field: 'Order received date', Value: formattedData.order_received_date }] : []),
            ...(isDraft && formattedData.packing_date != null ? [{ Field: 'Packing date', Value: formattedData.packing_date }] : []),
            ...(isDraft && formattedData.packing_day != null ? [{ Field: 'Packing day', Value: formattedData.packing_day }] : []),
            ...(isDraft && formattedData.details_comment != null && formattedData.details_comment !== '' ? [{ Field: 'Details comment', Value: formattedData.details_comment }] : []),
            {
                Field: 'Created Date',
                Value: formattedData.createdAt
                    ? new Date(formattedData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                    })
                    : '—'
            },
            ...(isDraft && formattedData.updatedAt != null
                ? [{ Field: 'Updated Date', Value: new Date(formattedData.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) }]
                : []),
            { Field: '', Value: '' }, // Empty row for spacing
        ];

        // Prepare products data
        const productsData = formattedData.items.map((item, index) => {
            // Get product name - handle both 'product' and 'product_name' fields
            const productName = item.product_name || item.product || '-';

            return {
                'PRODUCT': productName,
                'TYPE OF PACKING': item.packing_type || '-',
                'NO OF BOXES/BAGS': item.num_boxes || 0,
                'BOX WEIGHT (KG)': parseFloat(item.box_weight || 0).toFixed(2),
                'NET WEIGHT (KG)': parseFloat(item.net_weight || 0).toFixed(2),
                'GROSS WEIGHT (KG)': parseFloat(item.gross_weight || 0).toFixed(2)
            };
        });

        // Add totals row
        productsData.push({
            'PRODUCT': 'Total',
            'TYPE OF PACKING': '',
            'NO OF BOXES/BAGS': '',
            'BOX WEIGHT (KG)': '',
            'NET WEIGHT (KG)': `${totals.totalNetWeight.toFixed(2)} kg`,
            'GROSS WEIGHT (KG)': `${totals.totalGrossWeight.toFixed(2)} kg`
        });

        // Prepare packing summary data
        const packingSummaryData = [];

        // Add header row for Brown Tape Gross Weight
        packingSummaryData.push({
            'Description': 'Brown Tape Gross Weight',
            'Value': `${packingSummary.totalGrossWeight} Kg`
        });

        // Add empty row for spacing
        packingSummaryData.push({
            'Description': '',
            'Value': ''
        });

        // Add packing types
        packingSummary.groups.forEach(g => {
            packingSummaryData.push({
                'Description': g.type,
                'Value': g.count
            });
        });

        // Add empty row for spacing
        packingSummaryData.push({
            'Description': '',
            'Value': ''
        });

        // Add total
        packingSummaryData.push({
            'Description': 'Total No. of Pcs',
            'Value': packingSummary.totalPcs
        });

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Add Order Summary sheet
        const summarySheet = XLSX.utils.json_to_sheet(orderSummary);
        summarySheet['!cols'] = [{ wch: 20 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Order Summary');

        // Add Products sheet
        const productsSheet = XLSX.utils.json_to_sheet(productsData);
        productsSheet['!cols'] = [
            { wch: 25 }, // Product
            { wch: 20 }, // Type of Packing
            { wch: 20 }, // No of Boxes/Bags
            { wch: 18 }, // Box Weight
            { wch: 18 }, // Net Weight
            { wch: 20 }  // Gross Weight
        ];
        XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

        // Add Packing Summary sheet
        const packingSheet = XLSX.utils.json_to_sheet(packingSummaryData);
        packingSheet['!cols'] = [{ wch: 35 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, packingSheet, 'Packing Summary');

        // Generate filename
        const orderId = isDraft ? formattedData.id : formattedData.oid;
        const fileName = `Order_${orderId}_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Download file
        XLSX.writeFile(workbook, fileName);
    };

    // Export to PDF function
    const handleExportToPDF = () => {
        const orderId = isDraft ? formattedData.id : formattedData.oid;
        const customerName = formattedData.customer_name ?? '—';
        const createdDate = formattedData.createdAt
            ? new Date(formattedData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
            : '—';

        const itemsRows = (formattedData.items || []).map((item, i) => `
            <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827">${item.product_name || item.product || '-'}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151">${item.packing_type || '-'}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:center">${item.num_boxes || 0}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:right">${parseFloat(item.box_weight || 0).toFixed(2)}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:right">${parseFloat(item.net_weight || 0).toFixed(2)}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:right">${parseFloat(item.gross_weight || 0).toFixed(2)}</td>
            </tr>
        `).join('');

        const packingRows = packingSummary.groups.map((g, i) => `
            <tr style="background:${i % 2 === 0 ? '#e8f5f1' : '#f0f4f3'}">
                <td style="padding:8px 12px;border-bottom:1px solid #d0e0db;font-size:13px;color:#0d5c4d">${g.type}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #d0e0db;font-size:13px;color:#0d5c4d;text-align:right">${g.count}</td>
            </tr>
        `).join('');

        const statusColor = formattedData.order_status?.toLowerCase() === 'pending' ? '#92400e' : '#065f46';
        const statusBg = formattedData.order_status?.toLowerCase() === 'pending' ? '#fef3c7' : '#d1fae5';

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Order Details - ${orderId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #fff; color: #111827; padding: 32px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 3px solid #10B981; padding-bottom: 16px; }
        .company-name { font-size: 22px; font-weight: 800; color: #065f46; }
        .company-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .doc-info { text-align: right; }
        .doc-title { font-size: 18px; font-weight: 700; color: #111827; }
        .doc-id { font-size: 13px; color: #6b7280; margin-top: 4px; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .summary-item label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
        .summary-item span { font-size: 14px; font-weight: 600; color: #111827; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: ${statusBg}; color: ${statusColor}; }
        .section-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #d1fae5; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead tr { background: #065f46; }
        thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; }
        thead th.num { text-align: center; }
        thead th.right { text-align: right; }
        tfoot tr { background: #d1fae5; }
        tfoot td { padding: 10px 12px; font-size: 13px; font-weight: 700; color: #065f46; }
        tfoot td.right { text-align: right; }
        .packing-header { background: #d4f4e8; padding: 10px 12px; display: flex; justify-content: space-between; border-bottom: 1px solid #d0e0db; font-size: 13px; font-weight: 600; color: #0d5c4d; }
        .packing-total { background: #d4f4e8; padding: 10px 12px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #0d5c4d; border-top: 2px solid #10B981; }
        .packing-table { border: 1px solid #d0e0db; border-radius: 8px; overflow: hidden; width: 50%; margin-bottom: 24px; }
        .packing-headers { border-bottom: 1px solid #d0e0db; }
        .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; text-align: center; font-size: 11px; color: #9ca3af; }
        @media print { body { padding: 16px; } }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-name">Green Vision Traders</div>
            <div class="company-sub">Order Management System</div>
        </div>
        <div class="doc-info">
            <div class="doc-title">${isDraft ? 'Draft' : 'Order'} Details</div>
            <div class="doc-id">${isDraft ? 'Draft ID' : 'Order ID'}: ${orderId}</div>
            <div class="doc-id">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</div>
        </div>
    </div>

    <div class="summary-grid">
        <div class="summary-item"><label>${isDraft ? 'Draft ID' : 'Order ID'}</label><span>${orderId}</span></div>
        <div class="summary-item"><label>Customer Name</label><span>${customerName}</span></div>
        <div class="summary-item"><label>Customer ID</label><span>${formattedData.customer_id ?? '—'}</span></div>
        <div class="summary-item"><label>${isDraft ? 'Status' : 'Order Status'}</label><span class="status-badge">${formattedData.order_status}</span></div>
        <div class="summary-item"><label>Created Date</label><span>${createdDate}</span></div>
    </div>

    <div class="section-title">Products</div>
    <table>
        <thead>
            <tr>
                <th>Product</th>
                <th>Type of Packing</th>
                <th class="num">No. of Boxes/Bags</th>
                <th class="right">Box Weight (kg)</th>
                <th class="right">Net Weight (kg)</th>
                <th class="right">Gross Weight (kg)</th>
            </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
        <tfoot>
            <tr>
                <td colspan="4"><b>Total</b></td>
                <td class="right">${totals.totalNetWeight.toFixed(2)} kg</td>
                <td class="right">${totals.totalGrossWeight.toFixed(2)} kg</td>
            </tr>
        </tfoot>
    </table>

    <div class="section-title">Packing Summary</div>
    <div class="packing-table">
        <div class="packing-headers">
            <div class="packing-header"><span>Customer Name</span><span>${customerName}</span></div>
            <div class="packing-header"><span>Total Net Weight</span><span>${totals.totalNetWeight.toFixed(2)} Kg</span></div>
            <div class="packing-header"><span>Total Gross Weight</span><span>${totals.totalGrossWeight.toFixed(2)} Kg</span></div>
        </div>
        <table>
            <tbody>${packingRows}</tbody>
        </table>
        <div class="packing-total"><span>Total No. of Pcs</span><span>${packingSummary.totalPcs}</span></div>
    </div>

    <div class="footer">Green Vision Traders &mdash; Confidential &mdash; ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

    <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                // Check if we're coming from a farmer route
                                if (location.pathname.includes('/farmers/')) {
                                    const farmerId = location.pathname.split('/')[2];
                                    navigate(`/farmers/${farmerId}/orders`);
                                } else if (isDraft) {
                                    navigate('/orders?tab=drafts');
                                } else {
                                    navigate('/orders?tab=orders');
                                }
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </button>

                        <h1 className="text-2xl font-bold text-gray-900">{isDraft ? 'Draft' : 'Order'} Details</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportToPDF}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            Export to PDF
                        </button>
                        <button
                            onClick={handleExportToExcel}
                            className="px-6 py-2.5 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors duration-200 font-medium flex items-center gap-2"
                        >
                            <FileDown className="w-4 h-4" />
                            Export to Excel
                        </button>
                        {isDraft ? (
                            <button
                                onClick={() => navigate(`/orders/create?draftId=${order.did}`)}
                                className="px-6 py-2.5 border border-[#0D7C66] text-[#0D7C66] rounded-lg hover:bg-[#0D7C66] hover:text-white transition-colors duration-200 font-medium"
                            >
                                Edit Draft
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate(`/orders/create?orderId=${order.oid}`)}
                                className="px-6 py-2.5 border border-[#0D7C66] text-[#0D7C66] rounded-lg hover:bg-[#0D7C66] hover:text-white transition-colors duration-200 font-medium"
                            >
                                Edit Order
                            </button>
                        )}
                    </div>
                </div>

                {/* Order Summary Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">
                                {isDraft ? 'Draft ID' : 'Order ID'}
                            </p>
                            <p className="font-semibold text-gray-900">
                                {isDraft ? formattedData.id : formattedData.oid}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Customer Name</p>
                            <p className="font-semibold text-gray-900">{formattedData.customer_name ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Customer ID</p>
                            <p className="font-semibold text-gray-900">{formattedData.customer_id ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">{isDraft ? 'Status' : 'Order Status'}</p>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                {formattedData.order_status}
                            </span>
                        </div>
                        {isDraft && formattedData.order_type != null && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Order type</p>
                                <p className="font-semibold text-gray-900">{formattedData.order_type}</p>
                            </div>
                        )}
                        {isDraft && formattedData.order_received_date != null && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Order received date</p>
                                <p className="font-semibold text-gray-900">{formattedData.order_received_date}</p>
                            </div>
                        )}
                        {isDraft && formattedData.packing_date != null && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Packing date</p>
                                <p className="font-semibold text-gray-900">{formattedData.packing_date}</p>
                            </div>
                        )}
                        {isDraft && formattedData.packing_day != null && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Packing day</p>
                                <p className="font-semibold text-gray-900">{formattedData.packing_day}</p>
                            </div>
                        )}
                        {isDraft && formattedData.details_comment != null && formattedData.details_comment !== '' && (
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500 mb-1">Details comment</p>
                                <p className="font-semibold text-gray-900">{formattedData.details_comment}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Created Date</p>
                            <p className="font-semibold text-gray-900">
                                {formattedData.createdAt
                                    ? new Date(formattedData.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: '2-digit'
                                    })
                                    : '—'}
                            </p>
                        </div>
                        {isDraft && formattedData.updatedAt != null && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Updated Date</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(formattedData.updatedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: '2-digit'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>



                {/* Products Table */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Products</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray uppercase tracking-wider">
                                        Type of Packing
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray uppercase tracking-wider">
                                        No of Boxes/Bags
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray uppercase tracking-wider">
                                        Box Weight (kg)
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray uppercase tracking-wider">
                                        Net Weight (kg)
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray uppercase tracking-wider">
                                        Gross Weight (kg)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {formattedData.items && formattedData.items.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-100">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{item.product}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{item.packing_type}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.num_boxes}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.box_weight}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.net_weight}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.gross_weight}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-gray-300 bg-gray-50 font-semibold">
                                    <td className="px-4 py-3 text-gray-900">Total</td>
                                    <td className="px-4 py-3 text-gray-900"></td>
                                    <td className="px-4 py-3 text-gray-900"></td>
                                    <td className="px-4 py-3 text-gray-900"></td>
                                    <td className="px-4 py-3 text-gray-900">{totals.totalNetWeight.toFixed(2)} kg</td>
                                    <td className="px-4 py-3 text-gray-900">{totals.totalGrossWeight.toFixed(2)} kg</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Packing Summary
                </h2>

                <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB] w-1/2">
                    {/* Header Row - Customer Name */}
                    <div className="bg-[#D4F4E8] px-6 py-4 flex justify-between items-center border-b-2 border-[#D0E0DB]">
                        <span className="text-sm font-semibold text-[#0D5C4D]">Customer Name</span>
                        <span className="text-sm font-semibold text-[#0D5C4D]">{formattedData.customer_name}</span>
                    </div>
                    {/* Header Row - Total Net Weight */}
                    <div className="bg-[#D4F4E8] px-6 py-4 flex justify-between items-center border-b-2 border-[#D0E0DB]">
                        <span className="text-sm font-semibold text-[#0D5C4D]">Total Net Weight</span>
                        <span className="text-sm font-semibold text-[#0D5C4D]">{totals.totalNetWeight.toFixed(2)} Kg</span>
                    </div>
                    {/* Header Row - Total Gross Weight */}
                    <div className="bg-[#D4F4E8] px-6 py-4 flex justify-between items-center border-b-2 border-[#D0E0DB]">
                        <span className="text-sm font-semibold text-[#0D5C4D]">Total Gross Weight</span>
                        <span className="text-sm font-semibold text-[#0D5C4D]">{totals.totalGrossWeight.toFixed(2)} Kg</span>
                    </div>

                    {/* Data Rows */}
                    <table className="w-full">
                        <tbody>
                            {packingSummary.groups.map((g, idx) => (
                                <tr key={idx} className={`border-b border-[#D0E0DB] ${idx % 2 === 0 ? 'bg-[#E8F5F1]' : 'bg-[#F0F4F3]/30'}`}>
                                    <td className="px-6 py-4 text-sm text-[#0D5C4D]">
                                        {g.type}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#0D5C4D] text-right">
                                        {g.count}
                                    </td>
                                </tr>
                            ))}

                            {/* TOTAL */}
                            <tr className="bg-[#D4F4E8]">
                                <td className="px-6 py-4 text-sm font-semibold text-[#0D5C4D]">Total No. of Pcs</td>
                                <td className="px-6 py-4 text-sm font-semibold text-[#0D5C4D] text-right">{packingSummary.totalPcs}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderView;