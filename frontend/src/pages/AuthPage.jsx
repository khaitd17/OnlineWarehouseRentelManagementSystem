import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import authService from '../services/authService';

const AuthPage = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.mode !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    roleName: 'RENTER'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google Login handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        // Lấy thông tin user từ Google
        const googleRes = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        const googleUser = await googleRes.json();

        // Gửi lên backend endpoint đặc biệt cho Google Login
        const result = await authService.googleLogin({
          email: googleUser.email,
          fullName: googleUser.name,
          googleId: googleUser.sub,
          avatarUrl: googleUser.picture,
        });

        window.dispatchEvent(new Event('authChange'));
        const user = authService.getCurrentUser();
        const role = (user?.role || user?.roleName || '').toUpperCase();
        if (role === 'STAFF' || role === 'MANAGER') navigate('/staff-dashboard');
        else navigate('/');
      } catch (err) {
        setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError('Đăng nhập Google bị hủy hoặc thất bại.'),
  });

  useEffect(() => {
    if (location.state?.mode === 'login') setIsLogin(true);
    else if (location.state?.mode === 'register') setIsLogin(false);
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await authService.login(formData.email, formData.password);
        alert('Đăng nhập thành công!');
        window.dispatchEvent(new Event('authChange'));
        
        const user = authService.getCurrentUser();
        const role = (user?.role || user?.roleName || '').toUpperCase();
        if (role === 'STAFF' || role === 'MANAGER') navigate('/staff-dashboard');
        else navigate('/');
      } else {
        await authService.register({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          roleName: formData.roleName
        });
        
        // Auto login after registration
        await authService.login(formData.email, formData.password);
        alert('Đăng ký và Đăng nhập thành công!');
        window.dispatchEvent(new Event('authChange'));
        
        const user = authService.getCurrentUser();
        const role = (user?.role || user?.roleName || '').toUpperCase();
        if (role === 'STAFF' || role === 'MANAGER') navigate('/staff-dashboard');
        else navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'flex-start',
      justifyContent: 'center', 
      backgroundColor: '#f3f4f6',
      padding: '40px 20px 60px',
    }}>
      <div style={{
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: '450px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        position: 'relative',
        padding: '32px 24px',
        boxSizing: 'border-box'
      }}>
        {/* Close Button */}
        <button 
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#9ca3af'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header Texts */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '1rem', fontWeight: 500, marginBottom: '8px' }}>
            Xin chào bạn
          </p>
          <h2 style={{ margin: 0, color: '#111827', fontSize: '1.5rem', fontWeight: 700 }}>
            {isLogin ? 'Đăng nhập để tiếp tục' : 'Đăng ký tài khoản mới'}
          </h2>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLogin && (
            <>
              {/* Role Selection */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '4px' }}>
                <label style={{ flex: '1 1 80px', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', backgroundColor: formData.roleName === 'RENTER' ? '#e0f2fe' : '#fff', borderColor: formData.roleName === 'RENTER' ? '#0095c7' : '#d1d5db' }}>
                  <input type="radio" name="roleName" value="RENTER" checked={formData.roleName === 'RENTER'} onChange={handleInputChange} style={{ display: 'none' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: formData.roleName === 'RENTER' ? '#0095c7' : '#4b5563', textAlign: 'center' }}>Khách thuê</span>
                </label>
                <label style={{ flex: '1 1 80px', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', backgroundColor: formData.roleName === 'OWNER' ? '#e0f2fe' : '#fff', borderColor: formData.roleName === 'OWNER' ? '#0095c7' : '#d1d5db' }}>
                  <input type="radio" name="roleName" value="OWNER" checked={formData.roleName === 'OWNER'} onChange={handleInputChange} style={{ display: 'none' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: formData.roleName === 'OWNER' ? '#0095c7' : '#4b5563', textAlign: 'center' }}>Chủ kho</span>
                </label>

              </div>

              <InputWrapper icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}>
                <input name="fullName" type="text" placeholder="Họ và tên" required value={formData.fullName} onChange={handleInputChange} style={{ border: 'none', outline: 'none', width: '100%', padding: '0 12px', fontSize: '1rem', color: '#111827' }} />
              </InputWrapper>
              <InputWrapper icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>}>
                <input name="phone" type="text" placeholder="Số điện thoại" required value={formData.phone} onChange={handleInputChange} style={{ border: 'none', outline: 'none', width: '100%', padding: '0 12px', fontSize: '1rem', color: '#111827' }} />
              </InputWrapper>
            </>
          )}

          <InputWrapper icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}>
            <input name="email" type="text" placeholder="Số điện thoại hoặc email" required value={formData.email} onChange={handleInputChange} style={{ border: 'none', outline: 'none', width: '100%', padding: '0 12px', fontSize: '1rem', color: '#111827' }} />
          </InputWrapper>

          <InputWrapper icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>}>
            <input name="password" type={showPassword ? "text" : "password"} placeholder="Mật khẩu" required value={formData.password} onChange={handleInputChange} style={{ border: 'none', outline: 'none', width: '100%', padding: '0 12px', fontSize: '1rem', color: '#111827' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              )}
            </button>
          </InputWrapper>

          <button type="submit" disabled={loading} style={{
            backgroundColor: loading ? '#9ca3af' : '#0095c7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            marginTop: '8px'
          }}>
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>

        {isLogin && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#4b5563' }}>
              <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0095c7' }} />
              Nhớ tài khoản
            </label>
            <Link to="/forgot-password" style={{ color: '#0095c7', textDecoration: 'none', fontSize: '0.875rem' }}>Quên mật khẩu?</Link>
          </div>
        )}

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
          <span style={{ padding: '0 12px', color: '#6b7280', fontSize: '0.875rem' }}>Hoặc</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: googleLoading ? '#f9fafb' : '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#374151',
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={e => { if (!googleLoading) e.currentTarget.style.backgroundColor = '#fff'; }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="20" height="20" alt="Google" />
            {googleLoading ? 'Đang xử lý...' : 'Đăng nhập với Google'}
          </button>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280', lineHeight: '1.5' }}>
          Bằng việc tiếp tục, bạn đồng ý với <a href="#" style={{ color: '#0095c7', textDecoration: 'none' }}>Điều khoản sử dụng</a>, <a href="#" style={{ color: '#0095c7', textDecoration: 'none' }}>Chính sách bảo mật</a>, <a href="#" style={{ color: '#0095c7', textDecoration: 'none' }}>Quy chế</a>, <a href="#" style={{ color: '#0095c7', textDecoration: 'none' }}>Chính sách</a> của chúng tôi.
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.9rem', color: '#4b5563' }}>
          {isLogin ? (
            <>
              Chưa là thành viên? <button onClick={() => { setIsLogin(false); setError(''); }} style={{ background: 'none', border: 'none', color: '#0095c7', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>Đăng ký</button> tại đây
            </>
          ) : (
            <>
              Đã là thành viên? <button onClick={() => { setIsLogin(true); setError(''); }} style={{ background: 'none', border: 'none', color: '#0095c7', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>Đăng nhập</button> tại đây
            </>
          )}
        </div>

      </div>
    </div>
  );
};

const InputWrapper = ({ icon, children }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '0 12px',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s',
    height: '48px'
  }}>
    <div style={{ color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
      {children}
    </div>
  </div>
);

export default AuthPage;
