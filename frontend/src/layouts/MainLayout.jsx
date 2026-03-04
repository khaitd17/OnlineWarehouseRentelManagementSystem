import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#333', backgroundColor: '#f9fbfd', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ 
        backgroundColor: '#fff', 
        padding: '1rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0095c7', textDecoration: 'none', letterSpacing: '-0.5px' }}>
            OWRMS
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#555', fontWeight: 500, fontSize: '0.95rem' }}>Trang chủ</Link>
            <Link to="/search" style={{ textDecoration: 'none', color: '#555', fontWeight: 500, fontSize: '0.95rem' }}>Tìm kiếm kho</Link>
            <Link to="/about" style={{ textDecoration: 'none', color: '#555', fontWeight: 500, fontSize: '0.95rem' }}>Về chúng tôi</Link>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {localStorage.getItem('token') ? (
            <>
              <Link to="/dashboard" style={{ textDecoration: 'none', color: '#555', fontWeight: 600, fontSize: '0.9rem' }}>Dashboard</Link>
              <Link to="/profile" style={{ textDecoration: 'none', color: '#555', fontWeight: 600, fontSize: '0.9rem' }}>Profile</Link>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#ef4444', 
                  fontWeight: 600, 
                  fontSize: '0.9rem', 
                  cursor: 'pointer' 
                }}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/post-warehouse" style={{ 
                backgroundColor: '#0095c7', 
                color: '#fff', 
                padding: '0.6rem 1.2rem', 
                borderRadius: '8px', 
                textDecoration: 'none', 
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}>
                Đăng tin cho thuê
              </Link>
              <Link to="/auth" style={{ textDecoration: 'none', color: '#0095c7', fontWeight: 600, fontSize: '0.9rem' }}>Đăng nhập</Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#2d3748', color: '#fff', padding: '4rem 2rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>OWRMS</h3>
            <p style={{ color: '#a0aec0', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Hệ thống quản lý và tìm kiếm kho bãi trực tuyến hàng đầu Việt Nam. Giải pháp tối ưu cho doanh nghiệp.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.2rem' }}>Liên kết</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li><Link to="/" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Trang chủ</Link></li>
              <li><Link to="/search" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Tìm kiếm</Link></li>
              <li><Link to="/about" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Về chúng tôi</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.2rem' }}>Hỗ trợ</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Trung tâm hỗ trợ</a></li>
              <li><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Điều khoản dịch vụ</a></li>
              <li><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '0.9rem' }}>Chính sách bảo mật</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.2rem' }}>Liên hệ</h4>
            <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Email: support@owrms.vn</p>
            <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Hotline: 1900 xxxx</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #4a5568', marginTop: '3rem', paddingTop: '2rem', textAlign: 'center', color: '#718096', fontSize: '0.85rem' }}>
          © 2026 OWRMS - Online Warehouse Rental Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;