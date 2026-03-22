import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import authService from '../services/authService';

/* ─── Keyframe injection ─────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  @keyframes float1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(40px,-60px) scale(1.08); }
    66%      { transform: translate(-30px,40px) scale(0.95); }
  }
  @keyframes float2 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(-50px,30px) scale(1.05); }
    66%      { transform: translate(40px,-50px) scale(0.97); }
  }
  @keyframes float3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(30px,50px) scale(1.1); }
  }
  @keyframes slideUp {
    from { opacity:0; transform:translateY(32px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.6); }
    70%  { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
    100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .auth-card { animation: slideUp 0.55s cubic-bezier(.22,.68,0,1.2) both; }

  .auth-input-field {
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    padding: 0 12px;
    font-size: 0.95rem;
    font-family: 'Inter', sans-serif;
    color: #e2e8f0;
    caret-color: #818cf8;
  }
  .auth-input-field::placeholder { color: rgba(148,163,184,0.55); }

  /* Override browser autofill white background */
  .auth-input-field:-webkit-autofill,
  .auth-input-field:-webkit-autofill:hover,
  .auth-input-field:-webkit-autofill:focus,
  .auth-input-field:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 100px rgba(30,27,75,0.95) inset !important;
    -webkit-text-fill-color: #e2e8f0 !important;
    caret-color: #818cf8;
    border-radius: 8px;
  }

  .auth-input-wrap {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 0 14px;
    height: 52px;
    transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
  }
  .auth-input-wrap:focus-within {
    border-color: rgba(99,102,241,0.8);
    background: rgba(99,102,241,0.08);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }

  .auth-submit-btn {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%);
    background-size: 200% auto;
    color: #fff;
    letter-spacing: 0.02em;
    transition: transform 0.18s, box-shadow 0.18s, background-position 0.4s;
    box-shadow: 0 4px 20px rgba(99,102,241,0.45);
    margin-top: 6px;
    position: relative;
    overflow: hidden;
  }
  .auth-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(99,102,241,0.55);
    background-position: right center;
  }
  .auth-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .auth-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .auth-google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 13px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    font-size: 0.92rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    color: #e2e8f0;
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    transition: all 0.22s;
  }
  .auth-google-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.28);
    transform: translateY(-1px);
  }
  .auth-google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .auth-toggle-btn {
    background: none; border: none;
    color: #818cf8; font-weight: 700; cursor: pointer;
    padding: 0; font-size: inherit;
    font-family: 'Inter', sans-serif;
    transition: color 0.2s;
  }
  .auth-toggle-btn:hover { color: #a5b4fc; }

  .auth-divider-line {
    flex: 1; height: 1px;
    background: rgba(255,255,255,0.1);
  }

  .auth-tab {
    flex: 1; padding: 10px;
    border: none; border-radius: 8px;
    font-size: 0.9rem; font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.22s;
  }
  .auth-tab.active {
    background: rgba(99,102,241,0.25);
    color: #a5b4fc;
    box-shadow: 0 2px 8px rgba(99,102,241,0.2);
  }
  .auth-tab.inactive {
    background: transparent;
    color: rgba(148,163,184,0.7);
  }
  .auth-tab.inactive:hover { color: #94a3b8; }

  .logo-badge {
    width: 80px; height: 80px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(99,102,241,0.4), 0 0 0 3px rgba(255,255,255,0.08);
    animation: pulse-ring 2.5s infinite;
    margin: 0 auto 16px;
    background: #fff;
  }

  .forgot-link {
    color: #818cf8;
    text-decoration: none;
    font-size: 0.82rem;
    transition: color 0.2s;
  }
  .forgot-link:hover { color: #a5b4fc; }
`;

/* ─── InputWrapper ─────────────────────────────────────── */
const InputWrapper = ({ icon, children }) => (
  <div className="auth-input-wrap">
    <div style={{ color: 'rgba(148,163,184,0.8)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
      {children}
    </div>
  </div>
);

/* ─── SVG icons ─────────────────────────────────────────── */
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── Main Component ─────────────────────────────────────── */
const AuthPage = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.mode !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '', roleName: 'USER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true); setError('');
      try {
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } });
        const googleUser = await googleRes.json();
        await authService.googleLogin({ email: googleUser.email, fullName: googleUser.name, googleId: googleUser.sub, avatarUrl: googleUser.picture });
        window.dispatchEvent(new Event('authChange'));
        const ctx = authService.getWarehouseContext();
        const warehouseRoles = (ctx?.warehouses || []).map(w => (w.role || '').toUpperCase());
        if (warehouseRoles.some(r => r === 'STAFF' || r === 'MANAGER')) navigate('/staff-dashboard');
        else if (warehouseRoles.some(r => r === 'RENTER')) navigate('/renter-dashboard');
        else if (warehouseRoles.some(r => r === 'OWNER' || r === 'OPERATOR')) navigate('/dashboard');
        else { const user = authService.getCurrentUser(); if ((user?.role || user?.roleName || '').toUpperCase() === 'ADMIN') navigate('/admin'); else navigate('/'); }
      } catch { setError('Đăng nhập Google thất bại. Vui lòng thử lại.'); }
      finally { setGoogleLoading(false); }
    },
    onError: () => setError('Đăng nhập Google bị hủy hoặc thất bại.'),
  });

  useEffect(() => {
    if (location.state?.mode === 'login') setIsLogin(true);
    else if (location.state?.mode === 'register') setIsLogin(false);
  }, [location.state]);

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const redirectAfterAuth = () => {
        const ctx = authService.getWarehouseContext();
        const warehouseRoles = (ctx?.warehouses || []).map(w => (w.role || '').toUpperCase());
        if (warehouseRoles.some(r => r === 'STAFF' || r === 'MANAGER')) navigate('/staff-dashboard');
        else if (warehouseRoles.some(r => r === 'RENTER')) navigate('/renter-dashboard');
        else if (warehouseRoles.some(r => r === 'OWNER' || r === 'OPERATOR')) navigate('/dashboard');
        else { const user = authService.getCurrentUser(); if ((user?.role || user?.roleName || '').toUpperCase() === 'ADMIN') navigate('/admin'); else navigate('/'); }
      };
      if (isLogin) {
        await authService.login(formData.email, formData.password);
        window.dispatchEvent(new Event('authChange')); redirectAfterAuth();
      } else {
        await authService.register({ fullName: formData.fullName, email: formData.email, password: formData.password, phone: formData.phone, roleName: formData.roleName });
        await authService.login(formData.email, formData.password);
        window.dispatchEvent(new Event('authChange')); redirectAfterAuth();
      }
    } catch (err) { setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{STYLES}</style>

      {/* ── Full-page dark background ── */}
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 20% 50%, #1e1b4b 0%, #0f172a 45%, #020617 100%)',
        fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden', padding: '20px',
      }}>

        {/* ── Animated background orbs ── */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
          <div style={{
            position:'absolute', width:'500px', height:'500px',
            borderRadius:'50%', top:'-120px', left:'-100px',
            background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            animation:'float1 12s ease-in-out infinite',
          }}/>
          <div style={{
            position:'absolute', width:'400px', height:'400px',
            borderRadius:'50%', bottom:'-80px', right:'-60px',
            background:'radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%)',
            animation:'float2 15s ease-in-out infinite',
          }}/>
          <div style={{
            position:'absolute', width:'300px', height:'300px',
            borderRadius:'50%', top:'50%', left:'60%',
            background:'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            animation:'float3 10s ease-in-out infinite',
          }}/>
          {/* Grid pattern overlay */}
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize:'48px 48px',
          }}/>
        </div>

        {/* ── Glass Card ── */}
        <div className="auth-card" style={{
          position:'relative', zIndex:10,
          width:'100%', maxWidth:'440px',
          background:'rgba(15,23,42,0.75)',
          backdropFilter:'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
          borderRadius:'24px',
          border:'1px solid rgba(255,255,255,0.1)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          padding:'40px 36px 36px',
          boxSizing:'border-box',
        }}>

          {/* Close / Back to home */}
          <button onClick={() => navigate('/')} style={{
            position:'absolute', top:'16px', right:'16px',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'8px', width:'32px', height:'32px',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'rgba(148,163,184,0.8)', transition:'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* ── Logo + Brand ── */}
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <div className="logo-badge">
              <img src="/owrms-logo.png" alt="OWRMS Logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
            <h1 style={{ margin:'0 0 4px', fontSize:'1.5rem', fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.02em' }}>
              OWRMS
            </h1>
            <p style={{ margin:0, fontSize:'0.82rem', color:'rgba(148,163,184,0.75)', letterSpacing:'0.03em' }}>
              Hệ thống quản lí dịch vụ kho
            </p>
          </div>

          {/* ── Tab switcher ── */}
          <div style={{
            display:'flex', gap:'6px', marginBottom:'24px',
            background:'rgba(255,255,255,0.04)', borderRadius:'12px', padding:'4px',
          }}>
            <button className={`auth-tab ${isLogin ? 'active' : 'inactive'}`} onClick={() => { setIsLogin(true); setError(''); }}>
              Đăng nhập
            </button>
            <button className={`auth-tab ${!isLogin ? 'active' : 'inactive'}`} onClick={() => { setIsLogin(false); setError(''); }}>
              Đăng ký
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              padding:'12px 14px', marginBottom:'16px', borderRadius:'10px',
              background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)',
              color:'#fca5a5', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'8px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {!isLogin && (
              <>
                <div>
                  <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'rgba(148,163,184,0.9)', marginBottom:'6px', letterSpacing:'0.04em', textTransform:'uppercase' }}>Họ và tên</label>
                  <InputWrapper icon={<IconUser />}>
                    <input className="auth-input-field" name="fullName" type="text" placeholder="Nguyễn Văn A" required value={formData.fullName} onChange={handleInputChange} />
                  </InputWrapper>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'rgba(148,163,184,0.9)', marginBottom:'6px', letterSpacing:'0.04em', textTransform:'uppercase' }}>Số điện thoại</label>
                  <InputWrapper icon={<IconPhone />}>
                    <input className="auth-input-field" name="phone" type="text" placeholder="0901 234 567" required value={formData.phone} onChange={handleInputChange} />
                  </InputWrapper>
                </div>
              </>
            )}

            <div>
              <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'rgba(148,163,184,0.9)', marginBottom:'6px', letterSpacing:'0.04em', textTransform:'uppercase' }}>Email</label>
              <InputWrapper icon={<IconMail />}>
                <input className="auth-input-field" name="email" type="text" placeholder="example@email.com" required value={formData.email} onChange={handleInputChange} />
              </InputWrapper>
            </div>

            <div>
              <div style={{ marginBottom:'6px' }}>
                <label style={{ fontSize:'0.78rem', fontWeight:600, color:'rgba(148,163,184,0.9)', letterSpacing:'0.04em', textTransform:'uppercase' }}>Mật khẩu</label>
              </div>
              <InputWrapper icon={<IconLock />}>
                <input className="auth-input-field" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required value={formData.password} onChange={handleInputChange} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  background:'none', border:'none', cursor:'pointer',
                  color:'rgba(148,163,184,0.7)', display:'flex', alignItems:'center',
                  padding:'0 2px', transition:'color 0.2s', flexShrink:0,
                }}
                  onMouseEnter={e => e.currentTarget.style.color='#94a3b8'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(148,163,184,0.7)'}
                >
                  {showPassword ? <IconEye /> : <IconEyeOff />}
                </button>
              </InputWrapper>
            </div>

            {isLogin && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'0.82rem', color:'rgba(148,163,184,0.8)' }}>
                  <input type="checkbox" style={{ width:'15px', height:'15px', accentColor:'#6366f1', cursor:'pointer' }} />
                  Nhớ tài khoản
                </label>
                <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
            </button>
          </form>

          {/* ── Divider ── */}
          <div style={{ display:'flex', alignItems:'center', margin:'20px 0', gap:'12px' }}>
            <div className="auth-divider-line"/>
            <span style={{ fontSize:'0.78rem', color:'rgba(148,163,184,0.55)', whiteSpace:'nowrap', letterSpacing:'0.04em' }}>HOẶC</span>
            <div className="auth-divider-line"/>
          </div>

          {/* ── Google ── */}
          <button className="auth-google-btn" onClick={() => handleGoogleLogin()} disabled={googleLoading}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="18" height="18" alt="Google" />
            {googleLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
          </button>

          {/* ── Footer note ── */}
          <p style={{ marginTop:'24px', textAlign:'center', fontSize:'0.78rem', color:'rgba(100,116,139,0.8)', lineHeight:'1.6' }}>
            Bằng việc tiếp tục, bạn đồng ý với{' '}
            <a href="#" style={{ color:'#818cf8', textDecoration:'none' }}>Điều khoản sử dụng</a>
            {' & '}
            <a href="#" style={{ color:'#818cf8', textDecoration:'none' }}>Chính sách bảo mật</a>
            {' '}của chúng tôi.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default AuthPage;
