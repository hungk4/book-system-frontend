import React from 'react';
import { Users, BookOpen, Download, Star } from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    { label: 'Tổng người dùng', value: '1,250', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Số lượng sách', value: '458', icon: BookOpen, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Lượt đọc', value: '12,400', icon: Download, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Premium', value: '85', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan hệ thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                <h3 className="text-2xl font-bold text-gray-800">{item.value}</h3>
              </div>
              <div className={`${item.bg} p-3 rounded-lg`}>
                <item.icon className={item.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Hoạt động gần đây</h2>
        <div className="text-gray-400 text-center py-10 italic">Đang cập nhật dữ liệu...</div>
      </div>
    </div>
  );
};

export default AdminDashboard;