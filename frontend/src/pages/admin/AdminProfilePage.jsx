import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || user.phoneNumber || '',
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  const avatarUrl = user.avatarUrl ? `http://localhost:5276${user.avatarUrl}` : null;
  const initials = (user.fullName || 'A').charAt(0).toUpperCase();

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSaveInfo = (e) => {
    e.preventDefault();
    // Cập nhật localStorage với thông tin mới
    const updated = { ...user, ...form };
    localStorage.setItem('user', JSON.stringify(updated));
    showMsg('success', 'Đã lưu thông tin thành công!');
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      return showMsg('error', 'Vui lòng điền đầy đủ thông tin');
    }
    if (pwForm.newPw !== pwForm.confirm) {
      return showMsg('error', 'Mật khẩu xác nhận không khớp!');
    }
    if (pwForm.newPw.length < 6) {
      return showMsg('error', 'Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    showMsg('success', 'Đổi mật khẩu thành công!');
    setPwForm({ current: '', newPw: '', confirm: '' });
  };

  const tabs = [
    { id: 'info', label: 'Thông tin cá nhân', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    )},
    { id: 'security', label: 'Bảo mật', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    )},
  ];

  return (
    <div style={{ padding: '2rem', fontFamily: "'Inter', sans-serif", maxWidth: 820, margin: '0 auto' }}>

      {/* Header back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.8rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 9, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#475569', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Quay lại
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Hồ sơ cá nhân</h1>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{
          padding: '11px 18px', borderRadius: 10, marginBottom: 20, fontSize: '0.87rem', fontWeight: 600,
          backgroundColor: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: msg.type === 'success' ? '#16a34a' : '#dc2626',
          border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn 0.2s ease',
        }}>
          {msg.type === 'success'
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          {msg.text}
        </div>
      )}

      {/* Profile Card Header */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 20, overflow: 'hidden' }}>

        {/* Banner với avatar position absolute chồng lên */}
        <div style={{ position: 'relative', height: 110, background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #0ea5e9 100%)' }}>
          {/* Avatar đặt ở góc dưới-trái banner, nhô ra ngoài */}
          <div style={{ position: 'absolute', bottom: -40, left: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', overflow: 'hidden', fontSize: '1.9rem', fontWeight: 900, color: '#fff' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials
                }
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                title="Đổi ảnh đại diện"
                style={{ position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: '50%', background: '#2563eb', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} />
            </div>
          </div>
        </div>

        {/* Thông tin bên dưới banner — padding-top đủ để avatar không bị che */}
        <div style={{ paddingTop: 52, paddingBottom: 20, paddingLeft: '2rem', paddingRight: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              {user.fullName || 'Admin User'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ padding: '3px 11px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, border: '1px solid #bfdbfe' }}>
                Quản trị viên
              </span>
              {user.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#64748b' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

        {/* Tab nav */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 1.5rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '14px 18px',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#2563eb' : 'transparent'}`,
                color: activeTab === tab.id ? '#2563eb' : '#64748b',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.87rem', cursor: 'pointer',
                marginBottom: -1, transition: 'all 0.15s',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Thông tin */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveInfo} style={{ padding: '1.8rem 2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Họ và tên', key: 'fullName', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { label: 'Email', key: 'email', type: 'email', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                { label: 'Số điện thoại', key: 'phone', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{field.label}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>{field.icon}</span>
                    <input
                      type={field.type || 'text'}
                      value={form[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: 'inherit', color: '#1e293b' }}
                      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
              ))}

              {/* Role - readonly */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vai trò</label>
                <div style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.88rem', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Quản trị viên
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.3)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}

        {/* Tab: Bảo mật */}
        {activeTab === 'security' && (
          <form onSubmit={handleSavePassword} style={{ padding: '1.8rem 2rem', maxWidth: 480 }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 0, marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Để bảo mật tài khoản, bạn nên sử dụng mật khẩu mạnh và không chia sẻ với người khác.
            </p>
            {[
              { label: 'Mật khẩu hiện tại', key: 'current', icon: 'lock' },
              { label: 'Mật khẩu mới', key: 'newPw', icon: 'key' },
              { label: 'Xác nhận mật khẩu mới', key: 'confirm', icon: 'key' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{field.label}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {field.icon === 'lock'
                        ? <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
                        : <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>
                      }
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={pwForm[field.key]}
                    onChange={e => setPwForm({ ...pwForm, [field.key]: e.target.value })}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Đổi mật khẩu
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default AdminProfilePage;
