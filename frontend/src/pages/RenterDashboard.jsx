import React from 'react';
import { Link } from 'react-router-dom';

/* ─── Stat Card ─── */
const StatCard = ({ label, value, badge, icon, iconBg, iconColor, valueColor }) => (
  <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        backgroundColor: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: iconColor,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>{icon}</span>
      </div>
      {badge && (
        <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, backgroundColor: '#f0fdf4', padding: '3px 8px', borderRadius: '20px' }}>
          {badge}
        </span>
      )}
    </div>
    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{label}</p>
    <h3 style={{ margin: '8px 0 0', fontSize: '1.9rem', fontWeight: 700, color: valueColor || '#111827' }}>{value}</h3>
  </div>
);

/* ─── Table Section Wrapper ─── */
const Section = ({ icon, iconBg, iconColor, title, linkLabel, linkTo, children }) => (
  <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon && (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: iconBg, color: iconColor }}>
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>{icon}</span>
          </span>
        )}
        {title}
      </h3>
      {linkTo
        ? <Link to={linkTo} style={{ color: '#00b2d6', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>{linkLabel}</Link>
        : <button style={{ background: 'none', border: 'none', color: '#00b2d6', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>{linkLabel}</button>
      }
    </div>
    {children}
  </div>
);

/* ─── Status Badge ─── */
const Badge = ({ label, bg, color }) => (
  <span style={{ backgroundColor: bg, color, padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
);

/* ─── Main Component ─── */
const RenterDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const name = (user?.fullName || user?.FullName || 'bạn').split(' ').pop();

  const stats = [
    { label: 'Kho đang hoạt động', value: '12', badge: '+2 this month', icon: 'table_chart', iconBg: '#eff6ff', iconColor: '#3b82f6' },
    { label: 'Hàng hóa lưu kho', value: '4,250', icon: 'inventory_2', iconBg: '#fff7ed', iconColor: '#f59e0b' },
    { label: 'Yêu cầu nhập đang chờ', value: '8', icon: 'move_to_inbox', iconBg: '#f0fdf4', iconColor: '#22c55e', valueColor: '#16a34a' },
    { label: 'Yêu cầu xuất đang chờ', value: '5', icon: 'outbox', iconBg: '#fef2f2', iconColor: '#ef4444', valueColor: '#dc2626' },
  ];

  const inventoryRows = [
    { warehouse: 'Central HUB - A1', item: 'Ergonomic Chairs', qty: '450 đơn vị', updated: '2 giờ trước' },
    { warehouse: 'South Port Log.', item: 'MacBook Air M2', qty: '450 đơn vị', updated: '5 giờ trước' },
    { warehouse: 'North Ridge Depot', item: 'Curved Monitors', qty: '450 đơn vị', updated: 'Hôm qua' },
    { warehouse: 'East Gate Storage', item: 'Standing Desks', qty: '450 đơn vị', updated: '2 ngày trước' },
  ];

  const inboundRows = [
    { id: '#IN-9824', warehouse: 'Central HUB - A1', status: { label: 'Đang vận chuyển', bg: '#fef3c7', color: '#92400e' }, date: 'Oct 24, 2023' },
    { id: '#IN-9820', warehouse: 'North Ridge Depot', status: { label: 'Đang xử lý', bg: '#ede9fe', color: '#6d28d9' }, date: 'Oct 25, 2023' },
    { id: '#IN-9815', warehouse: 'South Port Log.', status: { label: 'Đã đến', bg: '#d1fae5', color: '#065f46' }, date: 'Oct 21, 2023' },
  ];

  const outboundRows = [
    { id: '#OUT-1102', warehouse: 'Central HUB - A1', item: '450 đơn vị', destination: 'Berlin Global Tech Center', status: { label: 'Đã gửi hàng', bg: '#d1fae5', color: '#065f46' } },
    { id: '#OUT-1105', warehouse: 'South Port Log.', item: '450 đơn vị', destination: 'London Creative Office', status: { label: 'Đang lấy hàng', bg: '#dbeafe', color: '#1d4ed8' } },
    { id: '#OUT-1099', warehouse: 'East Gate Storage', item: '450 đơn vị', destination: 'Paris Sales HQ', status: { label: 'Đang chờ', bg: '#f3f4f6', color: '#4b5563' } },
  ];

  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const tdStyle = { padding: '13px 16px', fontSize: '0.875rem', color: '#374151' };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Bảng điều khiển Người thuê</h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Chào mừng trở lại, <strong>{name}</strong>. Đây là những gì đang diễn ra hôm nay.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/create-inbound"
            style={{
              padding: '9px 16px', backgroundColor: '#00b2d6', color: '#fff',
              borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Tạo yêu cầu nhập kho
          </Link>
          <Link
            to="/outbound-requests"
            style={{
              padding: '9px 16px', backgroundColor: '#e0f7fa', color: '#00b2d6',
              borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
              border: '1px solid #b2ebf2',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span>
            Tạo yêu cầu xuất kho
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Two-column grid for top sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Inventory */}
        <Section icon="inventory_2" iconBg="#fff7ed" iconColor="#f59e0b" title="Tổng quan tồn kho" linkTo="/my-rental-requests" linkLabel="Xem tất cả">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={thStyle}>Nhà kho</th>
                <th style={thStyle}>Tên mặt hàng</th>
                <th style={thStyle}>Số lượng</th>
                <th style={thStyle}>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={tdStyle}>{r.warehouse}</td>
                  <td style={tdStyle}>{r.item}</td>
                  <td style={tdStyle}>{r.qty}</td>
                  <td style={{ ...tdStyle, color: '#94a3b8' }}>{r.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Inbound Requests */}
        <Section icon="move_to_inbox" iconBg="#f0fdf4" iconColor="#22c55e" title="Yêu cầu nhập gần đây" linkLabel="Theo dõi tất cả" linkTo="/create-inbound">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Nhà kho</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Ngày dự kiến đến</th>
              </tr>
            </thead>
            <tbody>
              {inboundRows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ ...tdStyle, color: '#00b2d6', fontWeight: 600 }}>{r.id}</td>
                  <td style={tdStyle}>{r.warehouse}</td>
                  <td style={tdStyle}><Badge {...r.status} /></td>
                  <td style={{ ...tdStyle, color: '#64748b' }}>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>

      {/* Outbound requests full width */}
      <Section icon="outbox" iconBg="#fef2f2" iconColor="#ef4444" title="Yêu cầu xuất gần đây" linkLabel="Tải báo cáo" linkTo={null}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={thStyle}>ID yêu cầu</th>
              <th style={thStyle}>Nhà kho</th>
              <th style={thStyle}>Chi tiết mặt hàng</th>
              <th style={thStyle}>Điểm đến</th>
              <th style={thStyle}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {outboundRows.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ ...tdStyle, color: '#00b2d6', fontWeight: 600 }}>{r.id}</td>
                <td style={tdStyle}>{r.warehouse}</td>
                <td style={tdStyle}>{r.item}</td>
                <td style={tdStyle}>{r.destination}</td>
                <td style={tdStyle}><Badge {...r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.78rem', color: '#94a3b8' }}>
        © 2023 Hệ thống quản lý cho thuê kho trực tuyến (OWRMS). Bảo lưu mọi quyền.
      </div>
    </div>
  );
};

export default RenterDashboard;
