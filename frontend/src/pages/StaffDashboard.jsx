import React from 'react';
import { Link } from 'react-router-dom';

/* ─── Stat Card ─── */
const StatCard = ({ label, value, change, changeRed, sub, icon, iconBg, iconColor }) => (
  <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{label}</span>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        backgroundColor: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: iconColor,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{icon}</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
      <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>{value}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: changeRed ? '#dc2626' : '#16a34a' }}>{change}</span>
    </div>
    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>{sub}</p>
  </div>
);

/* ─── Section Header ─── */
const SectionHeader = ({ icon, iconColor, iconBg, title, linkTo, linkLabel }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '8px',
        backgroundColor: iconBg, color: iconColor,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
      </span>
      {title}
    </h3>
    <Link to={linkTo} style={{ color: '#00b2d6', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>{linkLabel}</Link>
  </div>
);

/* ─── Status Badge ─── */
const Badge = ({ label, bg, color }) => (
  <span style={{ backgroundColor: bg, color, padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500 }}>{label}</span>
);

/* ─── Main Component ─── */
const StaffDashboard = () => {
  const stats = [
    {
      label: 'Nhập kho Hôm nay', value: '24', change: '+5%', sub: 'Dự kiến đến hôm nay',
      icon: 'move_to_inbox', iconBg: '#eff6ff', iconColor: '#3b82f6',
    },
    {
      label: 'Xuất kho Hôm nay', value: '18', change: '-2%', changeRed: true, sub: 'Lịch giao hàng',
      icon: 'outbox', iconBg: '#fff7ed', iconColor: '#f59e0b',
    },
    {
      label: 'Tổng Yêu cầu Chờ', value: '42', change: '+12%', sub: 'Đang chờ xác nhận',
      icon: 'hourglass_empty', iconBg: '#f5f3ff', iconColor: '#8b5cf6',
    },
    {
      label: 'Đã Hoàn thành Hôm nay', value: '156', change: '+8%', sub: 'Lượt luân chuyển đã xử lý',
      icon: 'check_circle', iconBg: '#f0fdf4', iconColor: '#22c55e',
    },
  ];

  const inboundRows = [
    { id: '#IN-8842', warehouse: 'Global Central A1', item: 'Industrial Bearings (T2)', qty: '450 Units', date: 'Oct 24, 2023', status: { label: 'Đang vận chuyển', bg: '#fef9c3', color: '#a16207' } },
    { id: '#IN-8845', warehouse: 'West Bay Hub B4', item: 'LED Panels 4K', qty: '120 Units', date: 'Oct 25, 2023', status: { label: 'Đã lên lịch', bg: '#dbeafe', color: '#1d4ed8' } },
  ];

  const outboundRows = [
    { id: '#OUT-2104', warehouse: 'Global Central A1', item: 'Steel Coils (Grade A)', qty: '15 Rolls', destination: 'Chicago Factory 9', status: { label: 'Đang xử lý', bg: '#ede9fe', color: '#6d28d9' } },
    { id: '#OUT-2109', warehouse: 'North Port Section C', item: 'Solar Battery Pack', qty: '85 Units', destination: 'Green Energy Corp', status: { label: 'Sẵn sàng', bg: '#d1fae5', color: '#065f46' } },
  ];

  const transactions = [
    { id: '#TX-90223', type: 'NHẬP KHO', typeColor: '#3b82f6', item: 'Textile Rolls (Blue)', qty: 100, date: 'Today, 10:45 AM', user: 'AJ', userName: 'Alex J.' },
    { id: '#TX-90222', type: 'XUẤT KHO', typeColor: '#ef4444', item: 'Automotive Pistons', qty: 50, date: 'Today, 09:12 AM', user: 'SM', userName: 'Sarah M.' },
    { id: '#TX-90215', type: 'ĐIỀU CHỈNH', typeColor: '#6b7280', item: 'Packaging Material', qty: -12, date: 'Yesterday, 4:30 PM', user: 'AJ', userName: 'Alex J.' },
  ];

  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const tdStyle = { padding: '14px 16px', fontSize: '0.875rem', color: '#374151' };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827' }}>Tổng quan Kho hàng</h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
          Trạng thái thời gian thực của các hoạt động logistics.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Tables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Inbound */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <SectionHeader icon="move_to_inbox" iconColor="#3b82f6" iconBg="#eff6ff" title="Yêu cầu Nhập kho Đang chờ" linkTo="/inbound-requests" linkLabel="Xem tất cả" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={thStyle}>Mã yêu cầu</th>
                <th style={thStyle}>Nhà kho</th>
                <th style={thStyle}>Tên mặt hàng</th>
                <th style={thStyle}>Số lượng</th>
                <th style={thStyle}>Ngày đến</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {inboundRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbfc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ ...tdStyle, color: '#00b2d6', fontWeight: 600 }}>{row.id}</td>
                  <td style={tdStyle}>{row.warehouse}</td>
                  <td style={tdStyle}>{row.item}</td>
                  <td style={tdStyle}>{row.qty}</td>
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}><Badge {...row.status} /></td>
                  <td style={tdStyle}>
                    <button style={{ padding: '7px 14px', backgroundColor: '#00b2d6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                      Xác nhận Nhập
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Outbound */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <SectionHeader icon="outbox" iconColor="#f59e0b" iconBg="#fff7ed" title="Yêu cầu Xuất kho Đang chờ" linkTo="/outbound-requests" linkLabel="Xem tất cả" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={thStyle}>Mã yêu cầu</th>
                <th style={thStyle}>Nhà kho</th>
                <th style={thStyle}>Tên mặt hàng</th>
                <th style={thStyle}>Số lượng</th>
                <th style={thStyle}>Điểm đến</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {outboundRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbfc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ ...tdStyle, color: '#00b2d6', fontWeight: 600 }}>{row.id}</td>
                  <td style={tdStyle}>{row.warehouse}</td>
                  <td style={tdStyle}>{row.item}</td>
                  <td style={tdStyle}>{row.qty}</td>
                  <td style={tdStyle}>{row.destination}</td>
                  <td style={tdStyle}><Badge {...row.status} /></td>
                  <td style={tdStyle}>
                    <button style={{ padding: '7px 14px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                      Xác nhận Xuất
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Transactions */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#22c55e' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
              </span>
              Giao dịch Kho Gần đây
            </h3>
            <button style={{ background: 'none', border: 'none', color: '#00b2d6', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Tải báo cáo</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={thStyle}>Mã giao dịch</th>
                <th style={thStyle}>Loại</th>
                <th style={thStyle}>Mặt hàng</th>
                <th style={thStyle}>Số lượng</th>
                <th style={thStyle}>Ngày</th>
                <th style={thStyle}>Thực hiện bởi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbfc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ ...tdStyle, color: '#00b2d6', fontWeight: 600 }}>{tx.id}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: tx.typeColor }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tx.typeColor, display: 'inline-block' }} />
                      {tx.type}
                    </span>
                  </td>
                  <td style={tdStyle}>{tx.item}</td>
                  <td style={tdStyle}>{tx.qty}</td>
                  <td style={{ ...tdStyle, color: '#94a3b8' }}>{tx.date}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        backgroundColor: '#e0f2fe', color: '#0369a1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.68rem', fontWeight: 700,
                      }}>
                        {tx.user}
                      </div>
                      {tx.userName}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
