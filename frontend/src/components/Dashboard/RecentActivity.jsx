import React from 'react';

const RecentActivity = () => {
  const activities = [
    { title: 'Nhân viên mới đăng ký', desc: 'Marcus Wright đã gia nhập "Kho Phía Đông"', time: '2 GIỜ TRƯỚC', icon: '👤', color: '#eff6ff' },
    { title: 'Kiểm toán hàng tháng hoàn tất', desc: 'Trung tâm Lưu trữ Phía Nam đã vượt qua vòng kiểm tra', time: '5 GIỜ TRƯỚC', icon: '✅', color: '#f0fdf4' },
    { title: 'Cảnh báo lấp đầy', desc: 'Kho Phía Đông đã đạt 95% công suất', time: 'HÔM QUA', icon: '⚠️', color: '#fff7ed' },
    { title: 'Cập nhật hồ sơ kho', desc: 'Chính sách bảo hiểm đã được gia hạn cho tất cả các địa điểm', time: '2 NGÀY TRƯỚC', icon: '📄', color: '#f5f3ff' },
  ];

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0',
      width: '320px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Hoạt động gần đây</h3>
        <button style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {activities.map((activity, index) => (
          <div key={index} style={{ display: 'flex', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: activity.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0
            }}>
              {activity.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{activity.title}</p>
              <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>{activity.desc}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600 }}>{activity.time}</p>
            </div>
          </div>
        ))}
      </div>

      <button style={{
        width: '100%',
        marginTop: '32px',
        padding: '12px',
        backgroundColor: 'transparent',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        color: '#4b5563',
        fontWeight: 600,
        fontSize: '0.875rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}>
        Xem tất cả hoạt động
      </button>
    </div>
  );
};

export default RecentActivity;
