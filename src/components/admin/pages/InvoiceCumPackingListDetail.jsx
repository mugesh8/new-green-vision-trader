import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';
import { getAllOrders } from '../../../api/orderApi';
import { getOrderAssignment } from '../../../api/orderAssignmentApi';
import { getFlowerOrderAssignment } from '../../../api/flowerOrderAssignmentApi';

const InvoiceCumPackingListDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const invoiceSectionRefs = useRef([]);
  const [order, setOrder] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [groupCodesFromSummary, setGroupCodesFromSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const ordersResponse = await getAllOrders();
      
      if (ordersResponse?.data) {
        const foundOrder = ordersResponse.data.find(o => o.oid === orderId);
        
        if (foundOrder) {
          setOrder(foundOrder);
          
          // Fetch assignment data (flower orders use flower assignment API)
          try {
            const isFlowerOrder = foundOrder.order_type === 'flower' || foundOrder.order_type === 'FLOWER ORDER';
            const assignmentResponse = isFlowerOrder
              ? await getFlowerOrderAssignment(foundOrder.oid)
              : await getOrderAssignment(foundOrder.oid);

            // Build map of oiid -> airport/group code (CT001 / CT002 / CT003 ...) and list of all codes
            let groupCodeByOiid = {};
            let airportGroupCodes = [];
            try {
              const s3SummaryRaw = assignmentResponse.data?.stage3_summary_data;
              if (s3SummaryRaw) {
                const s3Summary = typeof s3SummaryRaw === 'string'
                  ? JSON.parse(s3SummaryRaw)
                  : s3SummaryRaw;

                const airportGroups = s3Summary?.airportGroups || {};
                airportGroupCodes = Object.keys(airportGroups);

                Object.entries(airportGroups).forEach(([code, group]) => {
                  (group.products || []).forEach(p => {
                    if (p.oiid) {
                      groupCodeByOiid[p.oiid] = code;
                    }
                  });
                });
              }
            } catch (e) {
              console.error('Error parsing stage3_summary_data for invoice grouping:', e);
            }

            // Remember all group codes from summary so the UI can show every CT00X even if
            // some items don't map cleanly.
            if (airportGroupCodes.length) {
              setGroupCodesFromSummary(airportGroupCodes);
            }
            
            // Parse stage4 data
            if (assignmentResponse.data?.stage4_data) {
              const s4 = typeof assignmentResponse.data.stage4_data === 'string'
                ? JSON.parse(assignmentResponse.data.stage4_data)
                : assignmentResponse.data.stage4_data;
              
              // Process invoice items from stage4, grouped by airport/mark code
              processInvoiceItems(foundOrder, s4, groupCodeByOiid, airportGroupCodes);
            }
          } catch (err) {
            console.error('Error fetching assignment:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const processInvoiceItems = (order, s4Data, groupCodeByOiid = {}, airportCodes = []) => {
    const cleanForMatching = (name) => {
      if (!name) return '';
      return name.replace(/^\d+\s*-\s*/, '').trim();
    };
    const cleanForDisplay = (str) => {
      if (str == null) return '';
      return String(str)
        .replace(/[\u0B80-\u0BFF]/g, '')
        .replace(/[\u0080-\uFFFF]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*\(\s*\/?\s*\)\s*/g, ' ')
        .replace(/\s*\(\s*\)\s*/g, ' ')
        .trim();
    };

    const stage4ProductRows = s4Data?.reviewData?.productRows || [];

    // Process each order item individually
    const processedItems = [];
    let markStart = 1;
    
    order.items?.forEach((item) => {
      const productName = item.product_name || item.product || '';
      const cleanProduct = cleanForMatching(productName);
      
      const parseNumBoxes = (numBoxesStr) => {
        if (!numBoxesStr) return 0;
        if (typeof numBoxesStr === 'number') return numBoxesStr;
        const match = String(numBoxesStr).match(/^(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
      };

      const numBoxes = parseNumBoxes(item.num_boxes);
      const netWeight = parseFloat(item.net_weight) || 0;
      const packingType = item.packing_type || 'CTN';
      
      // Get price from stage4
      const stage4Entry = stage4ProductRows.find(s4 => {
        const s4Product = cleanForMatching(s4.product || s4.product_name || '');
        return s4Product === cleanProduct;
      });

      const price = stage4Entry ? parseFloat(stage4Entry.price) || 0 : 0;
      const totalAmount = netWeight * price;
      const markEnd = markStart + Math.round(numBoxes) - 1;

      // Determine group/mark code (e.g. GVT001 / airportCode) from stage3 summary via oiid
      const oiid = item.oiid || stage4Entry?.oiid;
      const defaultCode = airportCodes[0] || 'GVT';
      const groupCode = (oiid && groupCodeByOiid[oiid]) ? groupCodeByOiid[oiid] : defaultCode;

      if (numBoxes > 0 && netWeight > 0) {
        processedItems.push({
          groupCode,
          markNos: markStart === markEnd ? `${markStart}` : `${markStart}-${markEnd}`,
          kindOfPkgs: packingType === 'BAG' ? 'BAG' : 'CTN',
          noOfPkgs: Math.round(numBoxes),
          description: cleanForDisplay(productName) || '-',
          quantityWeight: netWeight.toFixed(0),
          ratePerKg: price > 0 ? price.toFixed(2) : '1.30',
          totalAmount: totalAmount > 0 ? totalAmount.toFixed(2) : (netWeight * 1.3).toFixed(2)
        });

        markStart = markEnd + 1;
      }
    });

    setInvoiceItems(processedItems);
  };

  const numberToWords = (num) => {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
      'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

    if (num === 0) return 'ZERO';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 !== 0 ? ' AND ' + numberToWords(num % 100) : '');
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
    return 'LARGE NUMBER';
  };

  const formatAmountInWords = (amount) => {
    const parts = amount.toString().split('.');
    const wholePart = parseInt(parts[0]);
    const decimalPart = parts[1] ? parseInt(parts[1]) : 0;
    
    let words = numberToWords(wholePart);
    if (decimalPart > 0) {
      // Handle decimal part - convert to cents
      const cents = decimalPart < 10 ? decimalPart * 10 : decimalPart;
      if (cents < 100) {
        words += ' AND ' + numberToWords(cents) + ' CENT';
      } else {
        words += ' AND ' + numberToWords(Math.floor(cents / 10)) + ' CENT';
      }
    }
    return words + ' ONLY';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-xl">Loading invoice details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-xl text-gray-500">Order not found</div>
      </div>
    );
  }

  // Determine available group codes (e.g. CT001, CT002) – prefer summary data, fall back to items
  const derivedCodesFromItems = Array.from(new Set(invoiceItems.map(item => item.groupCode || 'GVT')));
  const groupCodes = (groupCodesFromSummary.length ? groupCodesFromSummary : derivedCodesFromItems);

  // Build per‑group summaries so we can render one full invoice section per CT code
  const groupedInvoices = groupCodes.map(code => {
    const items = invoiceItems.filter(item => (item.groupCode || 'GVT') === code);
    const totalNetWeight = items.reduce((sum, item) => sum + parseFloat(item.quantityWeight), 0);
    const totalBoxes = items.reduce((sum, item) => sum + parseInt(item.noOfPkgs), 0);
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.totalAmount), 0);
    // If you want group‑specific gross weight later you can adjust here;
    // for now we approximate using net weight for the group.
    const groupGrossWeight = totalNetWeight;
    return { code, items, totalNetWeight, totalBoxes, totalAmount, groupGrossWeight };
  });

  const cleanTextForPdf = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/[\u0B80-\u0BFF]/g, '')
      .replace(/[\u0080-\uFFFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\s*\(\s*\/?\s*\)\s*/g, ' ')
      .replace(/\s*\(\s*\)\s*/g, ' ')
      .trim();
  };

  const buildPdfProgrammatic = (doc, grouped) => {
    grouped.forEach((group, groupIndex) => {
      if (groupIndex > 0) doc.addPage();
      let y = 14;
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('INVOICE CUM PACKING LIST', 105, y, { align: 'center' });
      y += 12;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const invDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.') : new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
      doc.text('Exporter: GREEN VISION TRADERS', 14, y);
      doc.text(`Invoice Date: ${invDate}`, 110, y);
      y += 6;
      doc.text(`Invoice No.: ${cleanTextForPdf(`MAA/CHO/${order.oid}`)}`, 110, y);
      y += 6;
      doc.text(`Buyer's Order No.: ${cleanTextForPdf(order.oid)}`, 110, y);
      y += 6;
      doc.text('Country of Origin: INDIA', 14, y);
      doc.text('Country of Destination: SINGAPORE', 110, y);
      y += 8;
      doc.text(`Consignee: ${cleanTextForPdf(order.client_name || order.customer_name || '')}`, 14, y);
      y += 6;
      doc.text('BANK: IDFC FIRST BANK LTD', 14, y);
      doc.text('Terms: C&F and CREDIT BY TT', 110, y);
      y += 10;
      const tableHead = [['Mark & Nos', 'Kind of Pkgs', 'No of Pkgs', 'Description of Goods', 'Qty Weight', 'Rate/Kgs SGD', 'Total SGD']];
      const tableBody = group.items.map(item => [
        cleanTextForPdf(item.markNos),
        cleanTextForPdf(item.kindOfPkgs),
        String(item.noOfPkgs),
        cleanTextForPdf(item.description),
        String(item.quantityWeight),
        String(item.ratePerKg),
        String(item.totalAmount)
      ]);
      doc.autoTable({
        startY: y,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [13, 92, 77], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 22 }, 2: { cellWidth: 18 }, 3: { cellWidth: 60 }, 4: { cellWidth: 22 }, 5: { cellWidth: 24 }, 6: { cellWidth: 24 } }
      });
      y = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(9);
      doc.text(`NET WT: ${group.totalNetWeight.toFixed(2)}`, 14, y);
      doc.text(`GRS WT: ${group.groupGrossWeight.toFixed(2)}`, 55, y);
      doc.text(`TOTAL PKGS: ${group.totalBoxes}`, 95, y);
      doc.text(`TOTAL SGD: ${group.totalAmount.toFixed(2)}`, 140, y);
      y += 8;
      doc.setFont(undefined, 'bold');
      doc.text('SGD Amount in words:', 14, y);
      doc.setFont(undefined, 'normal');
      doc.text(cleanTextForPdf(formatAmountInWords(group.totalAmount).toUpperCase()), 14, y + 5);
    });
  };

  const handleExportPDF = async () => {
    if (!order || !groupedInvoices.length) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const filename = `Invoice_Packing_${order.oid || orderId}.pdf`;

    try {
      let hasPages = false;
      for (let i = 0; i < groupedInvoices.length; i++) {
        const el = invoiceSectionRefs.current[i];
        if (!el) continue;

        const canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        if (i > 0) doc.addPage();
        hasPages = true;
        if (imgHeight > pageHeight) {
          const scale = pageHeight / imgHeight;
          doc.addImage(imgData, 'PNG', 0, 0, imgWidth * scale, pageHeight);
        } else {
          doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        }
      }
      if (!hasPages) throw new Error('No sections captured');
      doc.save(filename);
    } catch {
      const fallbackDoc = new jsPDF('p', 'mm', 'a4');
      buildPdfProgrammatic(fallbackDoc, groupedInvoices);
      fallbackDoc.save(filename);
    }
  };

  const handleExportExcel = () => {
    if (!order || groupedInvoices.length === 0) return;

    const wb = XLSX.utils.book_new();

    groupedInvoices.forEach(group => {
      const rows = [];

      rows.push(['INVOICE CUM PACKING LIST']);
      rows.push([]);
      rows.push(['Order ID', order.oid || orderId]);
      rows.push(['Mark / Group', group.code]);
      rows.push([]);

      rows.push(['Mark & Nos', 'Kind of Pkgs & Nos', 'No of Pkgs', 'Description of Goods', 'Quantity Weight', 'Rate Per/Kgs SGD', 'Total Amount in SGD']);

      group.items.forEach(item => {
        rows.push([
          item.markNos,
          item.kindOfPkgs,
          item.noOfPkgs,
          item.description,
          item.quantityWeight,
          item.ratePerKg,
          item.totalAmount
        ]);
      });

      rows.push([]);
      rows.push(['NET WT', group.totalNetWeight.toFixed(2)]);
      rows.push(['TOTAL PKGS', group.totalBoxes]);
      rows.push(['TOTAL SGD', group.totalAmount.toFixed(2)]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 12 },
        { wch: 18 },
        { wch: 12 },
        { wch: 40 },
        { wch: 16 },
        { wch: 18 },
        { wch: 20 }
      ];

      const sheetName = (group.code || 'INV').toString().substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `Invoice_Packing_${order.oid || orderId}.xlsx`);
  };

  const invoiceDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.')
    : new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
  const invoiceNo = `MAA/CHO/${order.oid || 'N/A'}`;

  return (
    <div ref={pageRef} className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      {/* Header with Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/reports/invoice-cum-packing-list')} 
          className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354]"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Report</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-[#0D8568] text-white rounded-lg hover:bg-[#0a6354] flex items-center gap-2"
          >
            <Download size={18} />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-[#0D8568] text-white rounded-lg hover:bg-[#0a6354] flex items-center gap-2"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Invoice Documents – one full invoice per CT code (CT001, CT002, ...) */}
      {groupedInvoices.map((group, index) => (
        <div
          key={group.code}
          ref={(el) => { invoiceSectionRefs.current[index] = el; }}
          className="bg-white border-2 border-gray-300 p-8 max-w-7xl mx-auto mb-8"
          style={index < groupedInvoices.length - 1 ? { pageBreakAfter: 'always' } : {}}
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE CUM PACKING LIST</h1>
          </div>

          {/* Invoice Header Section */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            {/* Exporter Section */}
            <div className="col-span-5 border border-gray-400 p-3">
              <div className="font-semibold text-sm mb-2">Expoter</div>
              <div className="text-sm min-h-[100px]">
                <div className="font-semibold">GREEN VISION TRADERS</div>
                <div className="mt-2">[Address will be filled]</div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="col-span-7 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold mb-1">Invoice Date</div>
                <div className="border-b border-gray-400 pb-1 text-sm">{invoiceDate}</div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1">Invoice No.</div>
                <div className="border-b border-gray-400 pb-1 text-sm">{invoiceNo}</div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1">Buyer's Order No.</div>
                <div className="border-b border-gray-400 pb-1 text-sm">{order.oid || '-'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1">Country of Origin</div>
                <div className="border-b border-gray-400 pb-1 text-sm">INDIA</div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1">Country of Destination</div>
                <div className="border-b border-gray-400 pb-1 text-sm">SINGAPORE</div>
              </div>
            </div>
          </div>

          {/* Consignee and Bank Section */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            {/* Consignee Section */}
            <div className="col-span-5 border border-gray-400 p-3">
              <div className="font-semibold text-sm mb-2">Consignee</div>
              <div className="text-sm min-h-[100px]">
                <div>{order.client_name || order.customer_name || '[Client Name]'}</div>
                <div className="mt-2">[Address will be filled]</div>
              </div>
            </div>

            {/* Bank and Terms */}
            <div className="col-span-7 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold mb-1">BANK</div>
                <div className="border-b border-gray-400 pb-1 text-sm">IDFC FIRST BANK LTD</div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1">Terms of Delivery & Payments</div>
                <div className="border-b border-gray-400 pb-1 text-sm">C&F and CREDIT BY TT</div>
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-3">
              <div className="text-xs font-semibold mb-1">Pre-Carriage by</div>
              <div className="border-b border-gray-400 pb-1 text-sm">ON ROAD</div>
            </div>
            <div className="col-span-3">
              <div className="text-xs font-semibold mb-1">Port of Loading</div>
              <div className="border-b border-gray-400 pb-1 text-sm">CHENNAI /INDIA.</div>
            </div>
            <div className="col-span-3">
              <div className="text-xs font-semibold mb-1">Port fo Discharge</div>
              <div className="border-b border-gray-400 pb-1 text-sm">SINGAPORE</div>
            </div>
            <div className="col-span-3">
              <div className="text-xs font-semibold mb-1">Final Destination</div>
              <div className="border-b border-gray-400 pb-1 text-sm">SINGAPORE</div>
            </div>
            <div className="col-span-3">
              <div className="text-xs font-semibold mb-1">AWB NO</div>
              <div className="border-b border-gray-400 pb-1 text-sm">-</div>
            </div>
          </div>

          {/* Items & summaries for this CT code */}
          <div className="mb-8">
            {/* Items Table */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr>
                    <th className="border border-gray-400 p-2 text-xs font-semibold text-center" rowSpan="3">Mark & Nos</th>
                    <th className="border border-gray-400 p-2 text-xs font-semibold text-center" rowSpan="3">Kind of Pkgs & Nos</th>
                    <th className="border border-gray-400 p-2 text-xs font-semibold text-center" rowSpan="3">No of Pkgs</th>
                    <th className="border border-gray-400 p-2 text-xs font-semibold text-center" rowSpan="3">Description of Goods</th>
                    <th className="border border-gray-400 p-2 text-xs font-semibold text-center" rowSpan="3">Quantity Weight</th>
                    <th className="border border-gray-400 p-2 text-xs font-semibold text-center" rowSpan="3">Rate Per/Kgs SGD</th>
                    <th className="border border-gray-400 p-2 text-xs font-semibold text-center" rowSpan="3">Total Amount in SGD</th>
                  </tr>
                </thead>
                <tbody>
                  {/* General Description Row for this group */}
                  <tr>
                    <td className="border border-gray-400 p-2 text-sm" colSpan="1">{group.code}</td>
                    <td className="border border-gray-400 p-2 text-sm" colSpan="2"></td>
                    <td className="border border-gray-400 p-2 text-sm" colSpan="4">
                      Perishable Cargo Assorted Fresh Vegetables & Fruits
                    </td>
                  </tr>

                  {/* Item Rows for this group */}
                  {group.items.map((item, index) => (
                    <tr key={`${group.code}-${index}`}>
                      <td className="border border-gray-400 p-2 text-sm text-center">{item.markNos}</td>
                      <td className="border border-gray-400 p-2 text-sm text-center">{item.kindOfPkgs}</td>
                      <td className="border border-gray-400 p-2 text-sm text-center">{item.noOfPkgs}</td>
                      <td className="border border-gray-400 p-2 text-sm">{item.description}</td>
                      <td className="border border-gray-400 p-2 text-sm text-right">{item.quantityWeight}</td>
                      <td className="border border-gray-400 p-2 text-sm text-right">{item.ratePerKg}</td>
                      <td className="border border-gray-400 p-2 text-sm text-right">{item.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Section for this group */}
            <div className="grid grid-cols-12 gap-4 mb-4">
              <div className="col-span-3">
                <div className="text-xs font-semibold mb-1">NET WT</div>
                <div className="border-b border-gray-400 pb-1 text-sm">{group.totalNetWeight.toFixed(2)}</div>
              </div>
              <div className="col-span-3">
                <div className="text-xs font-semibold mb-1">GRS WT</div>
                <div className="border-b border-gray-400 pb-1 text-sm">{group.groupGrossWeight.toFixed(2)}</div>
              </div>
              <div className="col-span-3">
                <div className="text-xs font-semibold mb-1">TOTAL PKGS</div>
                <div className="border-b border-gray-400 pb-1 text-sm">{group.totalBoxes}</div>
              </div>
              <div className="col-span-3">
                <div className="text-xs font-semibold mb-1">TOTAL SGD</div>
                <div className="border-b border-gray-400 pb-1 text-sm font-semibold">{group.totalAmount.toFixed(2)}</div>
              </div>
            </div>

            {/* Amount in Words for this group */}
            <div className="mb-4">
              <div className="text-sm font-semibold mb-2">SGD Amount in words:</div>
              <div className="text-sm border-b border-gray-400 pb-2 min-h-[30px]">
                {formatAmountInWords(group.totalAmount).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="mt-4">
            <div className="text-sm italic">
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvoiceCumPackingListDetail;
