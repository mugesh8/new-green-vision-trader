import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ReportInvoice = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total Invoices', value: '142', change: '+18%', color: 'bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0]' },
    { label: 'Paid Invoices', value: '128', change: '90%', color: 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]' },
    { label: 'Total Amount', value: '₹8.5 L', change: 'This Month', color: 'bg-gradient-to-r from-[#10B981] to-[#059669]' },
    { label: 'Pending Amount', value: '₹85 K', change: '14 Invoices', color: 'bg-gradient-to-r from-[#047857] to-[#065F46]' }
  ];

  const invoices = [
    { id: 'INV-001', client: 'ABC Exports', date: '2024-01-15', amount: '₹45,000', paid: '₹45,000', status: 'Paid' },
    { id: 'INV-002', client: 'XYZ Trading', date: '2024-01-16', amount: '₹32,000', paid: '₹20,000', status: 'Pending' },
    { id: 'INV-003', client: 'Global Foods', date: '2024-01-17', amount: '₹58,300', paid: '₹58,300', status: 'Paid' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-[#0D5C4D] hover:text-[#0a6354] mb-6">
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Reports</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.color} rounded-2xl p-6 ${index === 2 || index === 3 ? 'text-white' : 'text-[#0D5C4D]'}`}>
            <div className="text-sm font-medium mb-2 opacity-90">{stat.label}</div>
            <div className="text-4xl font-bold mb-2">{stat.value}</div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${index === 2 || index === 3 ? 'bg-white/20 text-white' : 'bg-white/60 text-[#0D5C4D]'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#D4F4E8]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Invoice ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Paid</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, index) => (
                <tr key={index} className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'}`}>
                  <td className="px-6 py-4 text-sm text-[#0D5C4D]">{invoice.id}</td>
                  <td className="px-6 py-4 font-semibold text-[#0D5C4D]">{invoice.client}</td>
                  <td className="px-6 py-4 text-sm text-[#0D5C4D]">{invoice.date}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#0D5C4D]">{invoice.amount}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#047857]">{invoice.paid}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${invoice.status === 'Paid' ? 'bg-[#4ED39A] text-white' : 'bg-red-500 text-white'}`}>
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
          <div className="text-sm text-[#6B8782]">Showing 3 of 142 invoices</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors">&lt;</button>
            <button className="px-4 py-2 rounded-lg font-medium bg-[#0D8568] text-white">1</button>
            <button className="px-4 py-2 rounded-lg font-medium text-[#6B8782] hover:bg-[#D0E0DB]">2</button>
            <button className="px-4 py-2 rounded-lg font-medium text-[#6B8782] hover:bg-[#D0E0DB]">3</button>
            <button className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors">...</button>
            <button className="px-4 py-2 rounded-lg font-medium text-[#6B8782] hover:bg-[#D0E0DB]">10</button>
            <button className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportInvoice;
