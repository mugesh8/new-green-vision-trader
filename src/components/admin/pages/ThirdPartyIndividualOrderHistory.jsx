import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ArrowLeft, FileText } from 'lucide-react';

const ThirdPartyIndividualOrderHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);

  const orders = [
    {
      id: 'ORD-2024-1294',
      thirdPartyId: 'GF',
      thirdPartyName: 'Green Fields Farm',
      vendorId: 'VEN-001',
      products: [
        { name: 'Carrot', color: 'bg-[#FFE8D1] text-[#FF8800]' },
        { name: '+3 more', color: 'bg-[#D4E8FF] text-[#0066CC]' }
      ],
      orderDate: 'Nov 02, 2025',
      amount: '₹18,500',
      status: 'Delivered',
      statusColor: 'bg-[#C8F4E8] text-[#0D7C66]',
      statusDot: 'bg-[#0D7C66]'
    },
    {
      id: 'ORD-2024-1293',
      thirdPartyId: 'FV',
      thirdPartyName: 'Fresh Vegetable Supply Co.',
      vendorId: 'VEN-002',
      products: [
        { name: 'Tomato', color: 'bg-[#FFE0E0] text-[#CC0000]' },
        { name: 'Cucumber', color: 'bg-[#FFE8D1] text-[#FF8800]' }
      ],
      orderDate: 'Nov 01, 2025',
      amount: '₹12,300',
      status: 'In Transit',
      statusColor: 'bg-[#FFF4CC] text-[#CC9900]',
      statusDot: 'bg-[#CC9900]'
    },
    {
      id: 'ORD-2024-1292',
      thirdPartyId: 'OV',
      thirdPartyName: 'Organic Valley Farmers',
      vendorId: 'VEN-003',
      products: [
        { name: 'Okra', color: 'bg-[#FFE0E0] text-[#CC0000]' },
        { name: 'Broccoli', color: 'bg-[#D4F4E7] text-[#00AA66]' }
      ],
      orderDate: 'Oct 31, 2025',
      amount: '₹25,600',
      status: 'Delivered',
      statusColor: 'bg-[#C8F4E8] text-[#0D7C66]',
      statusDot: 'bg-[#0D7C66]'
    },
    {
      id: 'ORD-2024-1291',
      thirdPartyId: 'AL',
      thirdPartyName: 'Agriland thirdPartys',
      vendorId: 'VEN-004',
      products: [
        { name: 'Potato', color: 'bg-[#E8E0FF] text-[#6600CC]' },
        { name: 'Onion', color: 'bg-[#FFE8D1] text-[#FF8800]' }
      ],
      orderDate: 'Oct 30, 2025',
      amount: '₹17,200',
      status: 'Cancelled',
      statusColor: 'bg-[#FFE0E0] text-[#CC0000]',
      statusDot: 'bg-[#CC0000]'
    },
    {
      id: 'ORD-2024-1290',
      thirdPartyId: 'SF',
      thirdPartyName: 'Sunrise Farms',
      vendorId: 'VEN-005',
      products: [
        { name: 'Capsicum', color: 'bg-[#FFE0E0] text-[#CC0000]' }
      ],
      orderDate: 'Oct 29, 2025',
      amount: '₹8,900',
      status: 'Processing',
      statusColor: 'bg-[#E0E8FF] text-[#0066CC]',
      statusDot: 'bg-[#0066CC]'
    },
    {
      id: 'ORD-2024-1289',
      thirdPartyId: 'HS',
      thirdPartyName: 'Harvest Supply Chain',
      vendorId: 'VEN-006',
      products: [
        { name: 'Corn', color: 'bg-[#FFF4CC] text-[#CC9900]' },
        { name: 'Carrot', color: 'bg-[#FFE8D1] text-[#FF8800]' }
      ],
      orderDate: 'Oct 28, 2025',
      amount: '₹19,400',
      status: 'Delivered',
      statusColor: 'bg-[#C8F4E8] text-[#0D7C66]',
      statusDot: 'bg-[#0D7C66]'
    },
    {
      id: 'ORD-2024-1288',
      thirdPartyId: 'GF',
      thirdPartyName: 'Green Fields Farm',
      vendorId: 'VEN-001',
      products: [
        { name: 'Lettuce', color: 'bg-[#D4F4E7] text-[#00AA66]' },
        { name: '+3 more', color: 'bg-[#D4E8FF] text-[#0066CC]' }
      ],
      orderDate: 'Oct 27, 2025',
      amount: '₹22,700',
      status: 'In Transit',
      statusColor: 'bg-[#FFF4CC] text-[#CC9900]',
      statusDot: 'bg-[#CC9900]'
    }
  ];

  const statsCards = [
    { label: 'Total Orders', value: '86', color: 'bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0]', textColor: 'text-[#0D5C4D]' },
    { label: 'Pending Orders', value: '72', color: 'bg-gradient-to-r from-[#6EE7B7] to-[#34D399]', textColor: 'text-[#0D5C4D]' },
    { label: 'Completed Orders', value: '8', color: 'bg-gradient-to-r from-[#10B981] to-[#059669]', textColor: 'text-white' },
    { label: 'Total Order Value', value: '₹2.8 L', color: 'bg-gradient-to-r from-[#047857] to-[#065F46]', textColor: 'text-white' }
  ];

  return (
    <div className="min-h-screen bg-[#F5FBF9] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order ID, thirdParty name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66] focus:border-transparent"
            />
          </div>

          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D7C66] focus:border-transparent cursor-pointer min-w-[140px]"
            >
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Month</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D7C66] focus:border-transparent cursor-pointer min-w-[140px]"
            >
              <option>All Status</option>
              <option>Delivered</option>
              <option>In Transit</option>
              <option>Processing</option>
              <option>Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          <button className="px-6 py-2.5 bg-[#1DB890] hover:bg-[#19a57e] text-white font-semibold rounded-lg text-sm transition-colors whitespace-nowrap">
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className={`${stat.color} rounded-2xl p-6`}>
              <div className={`text-sm font-medium mb-2 opacity-90 ${stat.textColor}`}>{stat.label}</div>
              <div className={`text-4xl font-bold mb-2 ${stat.textColor}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-[#D0E0DB]">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#D4F4E8]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">thirdParty Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Products</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Order Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0D5C4D]">Action</th>
              </tr>
            </thead>
            <tbody>

              {orders.map((order, index) => (
                <tr 
                  key={index} 
                  className={`border-b border-[#D0E0DB] hover:bg-[#F0F4F3] transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#F0F4F3]/30'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#B8F4D8] flex items-center justify-center text-[#0D5C4D] font-semibold text-sm">
                        {order.thirdPartyId}
                      </div>
                      <span className="text-sm font-semibold text-[#0D5C4D]">{order.id}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-[#0D5C4D]">{order.thirdPartyName}</div>
                    <div className="text-xs text-[#6B8782]">{order.vendorId}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {order.products.map((product, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#D4F4E8] text-[#047857]"
                        >
                          {product.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-[#0D5C4D]">{order.orderDate}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-[#0D5C4D]">{order.amount}</div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-[#4ED39A] text-white">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      {order.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-[#0D8568] hover:bg-[#0a6354] text-white font-semibold rounded-lg text-xs transition-colors">
                        View
                      </button>
                      <button className="px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white font-semibold rounded-lg text-xs transition-colors">
                        Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-[#F0F4F3] border-t border-[#D0E0DB]">
            <div className="text-sm text-[#6B8782]">
              Showing 1-7 of 247 orders
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors">
                &lt;
              </button>
              <button className="px-4 py-2 rounded-lg font-medium transition-colors bg-[#0D8568] text-white">
                1
              </button>
              <button className="px-4 py-2 rounded-lg font-medium transition-colors text-[#6B8782] hover:bg-[#D0E0DB]">
                2
              </button>
              <button className="px-4 py-2 rounded-lg font-medium transition-colors text-[#6B8782] hover:bg-[#D0E0DB]">
                3
              </button>
              <button className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors">
                ...
              </button>
              <button className="px-4 py-2 rounded-lg font-medium transition-colors text-[#6B8782] hover:bg-[#D0E0DB]">
                10
              </button>
              <button className="px-3 py-2 text-[#6B8782] hover:bg-[#D0E0DB] rounded-lg transition-colors">
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThirdPartyIndividualOrderHistory;
