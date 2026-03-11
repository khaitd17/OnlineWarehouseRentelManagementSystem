import React from 'react';
import { Link } from 'react-router-dom';

const IconWarehouse = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconBox = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);
const IconIn = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
    <rect x="2" y="4" width="16" height="16" rx="2" />
    <line x1="22" y1="12" x2="16" y2="12" />
    <polyline points="18 8 22 12 18 16" />
  </svg>
);
const IconOut = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
    <rect x="6" y="4" width="16" height="16" rx="2" />
    <line x1="2" y1="12" x2="8" y2="12" />
    <polyline points="6 8 2 12 6 16" />
  </svg>
);

const RenterDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const name = (user?.fullName || user?.FullName || 'Alex').split(' ')[0];

  const cards = [
    { label: 'Kho đang hoạt động', value: '12', badge: '+2 this month', Icon: IconWarehouse, bg: '#eff6ff' },
    { label: 'Hàng hóa lưu kho', value: '4,250', Icon: IconBox, bg: '#fff7ed' },
    { label: 'Yêu cầu nhập đang chờ', value: '8', Icon: IconIn, bg: '#f0fdf4', valueColor: '#16a34a' },
    { label: 'Yêu cầu xuất đang chờ', value: '5', Icon: IconOut, bg: '#fef2f2', valueColor: '#dc2626' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#111827' }}>Bảng điều khiển Người thuê</h1>
          <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#64748b' }}>
            Chào mừng trở lại, {name}. Đây là những gì đang diễn ra hôm nay.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/create-inbound"
            style={{
              padding: '10px 16px',
              backgroundColor: '#0d9488',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>+</span> Tạo yêu cầu nhập kho
          </Link>
          <Link
            to="/create-outbound"
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(13,148,136,0.2)',
              color: '#0d9488',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ↑ Tạo yêu cầu xuất kho
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {cards.map((c, i) => (
          <div key={i} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <c.Icon />
              </div>
              {c.badge && <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>{c.badge}</span>}
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{c.label}</p>
            <h3 style={{ margin: '8px 0 0', fontSize: '1.75rem', fontWeight: 700, color: c.valueColor || '#111827' }}>{c.value}</h3>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>Tổng quan tồn kho</h3>
            <Link to="/my-rental-requests" style={{ color: '#0d9488', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>Xem tất cả</Link>
          </div>
          <table style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontWeight: 600, textAlign: 'left' }}>
                <th style={{ padding: '10px 0' }}>Nhà kho</th>
                <th>Tên mặt hàng</th>
                <th>Số lượng</th>
                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: '12px 0' }}>Central HUB - A1</td><td>Ergonomic Chairs</td><td>450 đơn vị</td><td style={{ color: '#64748b' }}>2 giờ trước</td></tr>
              <tr><td style={{ padding: '12px 0' }}>South Port Log.</td><td>MacBook Air M2</td><td>450 đơn vị</td><td style={{ color: '#64748b' }}>5 giờ trước</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>Yêu cầu nhập gần đây</h3>
            <span style={{ color: '#0d9488', fontWeight: 600, fontSize: '0.875rem' }}>Theo dõi tất cả</span>
          </div>
          <table style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontWeight: 600, textAlign: 'left' }}>
                <th style={{ padding: '10px 0' }}>ID</th>
                <th>Nhà kho</th>
                <th>Trạng thái</th>
                <th>Ngày đến</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: '12px 0', color: '#0d9488', fontWeight: 600 }}>#IN-9824</td><td>Central HUB - A1</td><td><span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>Đang vận chuyển</span></td><td style={{ color: '#64748b' }}>Oct 24, 2023</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RenterDashboard;
