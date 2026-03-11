import React from 'react';
import { Link } from 'react-router-dom';

const IconIn = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
    <rect x="2" y="4" width="16" height="16" rx="2" />
    <line x1="22" y1="12" x2="16" y2="12" />
    <polyline points="18 8 22 12 18 16" />
  </svg>
);
const IconOut = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
    <rect x="6" y="4" width="16" height="16" rx="2" />
    <line x1="2" y1="12" x2="8" y2="12" />
    <polyline points="6 8 2 12 6 16" />
  </svg>
);
const IconHourglass = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
    <polygon points="5 2 19 2 19 6 12 12 19 18 19 22 5 22 5 18 12 12 5 6 5 2" />
  </svg>
);
const IconCheck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const StaffDashboard = () => {
  const cards = [
    { label: 'Nhập kho Hôm nay', value: '24', change: '+5%', sub: 'Dự kiến đến hôm nay', Icon: IconIn, bg: '#eff6ff' },
    { label: 'Xuất kho Hôm nay', value: '18', change: '-2%', changeRed: true, sub: 'Lịch giao hàng', Icon: IconOut, bg: '#fff7ed' },
    { label: 'Tổng Yêu cầu Chờ', value: '42', change: '+12%', sub: 'Đang chờ xác nhận', Icon: IconHourglass, bg: '#f5f3ff' },
    { label: 'Đã Hoàn thành Hôm nay', value: '156', change: '+8%', sub: 'Lượt luân chuyển đã xử lý', Icon: IconCheck, bg: '#f0fdf4' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#111827' }}>Tổng quan Kho hàng</h1>
        <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#64748b' }}>
          Trạng thái thời gian thực của các hoạt động logistics.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {cards.map((c, i) => (
          <div key={i} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{c.label}</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <c.Icon />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>{c.value}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: c.changeRed ? '#dc2626' : '#16a34a' }}>{c.change}</span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconIn /> Yêu cầu Nhập kho Đang chờ
            </h3>
            <Link to="/inbound-requests" style={{ color: '#0d9488', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>Xem tất cả</Link>
          </div>
          <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>MÃ YÊU CẦU</th>
                <th>NHÀ KHO</th>
                <th>TÊN MẶT HÀNG</th>
                <th>SỐ LƯỢNG</th>
                <th>NGÀY ĐẾN</th>
                <th>TRẠNG THÁI</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', color: '#0d9488', fontWeight: 600 }}>#IN-8842</td>
                <td>Global Central A1</td>
                <td>Industrial Bearings (T2)</td>
                <td>450 Units</td>
                <td>Oct 24, 2023</td>
                <td><span style={{ backgroundColor: '#fef9c3', color: '#a16207', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500 }}>Đang vận chuyển</span></td>
                <td><button style={{ padding: '6px 12px', backgroundColor: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>Xác nhận Nhập</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconOut /> Yêu cầu Xuất kho Đang chờ
            </h3>
            <Link to="/outbound-requests" style={{ color: '#0d9488', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>Xem tất cả</Link>
          </div>
          <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>MÃ YÊU CẦU</th>
                <th>NHÀ KHO</th>
                <th>MẶT HÀNG</th>
                <th>ĐIỂM ĐẾN</th>
                <th>TRẠNG THÁI</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', color: '#0d9488', fontWeight: 600 }}>#OUT-2104</td>
                <td>Global Central A1</td>
                <td>Steel Coils (Grade A)</td>
                <td>Chicago Factory 9</td>
                <td><span style={{ backgroundColor: '#ede9fe', color: '#6d28d9', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500 }}>Đang xử lý</span></td>
                <td><button style={{ padding: '6px 12px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>Xác nhận Xuất</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
