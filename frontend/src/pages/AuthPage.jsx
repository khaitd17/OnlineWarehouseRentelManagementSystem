import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
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
        // dispatch custom event to update MainLayout
        window.dispatchEvent(new Event('authChange'));
        navigate('/dashboard');
      } else {
        await authService.register({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          roleName: formData.roleName
        });
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '1000px', 
        backgroundColor: '#fff', 
        borderRadius: '24px', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        overflow: 'hidden'
      }}>
        {/* Left Side: Branding/Image */}
        <div style={{ 
          backgroundColor: '#0095c7', 
          padding: '4rem 3rem', 
          color: '#fff', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.2 }}>
              Chào mừng bạn đến với OWRMS
            </h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '2rem' }}>
              {isLogin 
                ? 'Đăng nhập để quản lý các kho bãi của bạn hoặc tiếp tục tìm kiếm kho bãi lý tưởng.' 
                : 'Tham gia mạng lưới kho bãi hàng đầu Việt Nam. Đăng ký tài khoản ngay hôm nay.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', flex: 1 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏢</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Chủ kho</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Cho thuê dễ dàng</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', flex: 1 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚚</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Khách thuê</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Tìm kho nhanh chóng</div>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
          <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
        </div>

        {/* Right Side: Form */}
        <div style={{ padding: '4rem 3.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem' }}>
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              style={{ 
                fontSize: '1.2rem', 
                fontWeight: 700, 
                color: isLogin ? '#0095c7' : '#94a3b8', 
                border: 'none', 
                background: 'none', 
                padding: '0 0 0.5rem', 
                cursor: 'pointer',
                borderBottom: isLogin ? '3px solid #0095c7' : '3px solid transparent'
              }}
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }}
              style={{ 
                fontSize: '1.2rem', 
                fontWeight: 700, 
                color: !isLogin ? '#0095c7' : '#94a3b8', 
                border: 'none', 
                background: 'none', 
                padding: '0 0 0.5rem', 
                cursor: 'pointer',
                borderBottom: !isLogin ? '3px solid #0095c7' : '3px solid transparent'
              }}
            >
              Đăng ký
            </button>
          </div>

          {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500, border: '1px solid #fee2e2' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {!isLogin && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Họ và tên</label>
                  <input name="fullName" type="text" placeholder="Nhập họ và tên" required value={formData.fullName} onChange={handleInputChange} style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Số điện thoại</label>
                  <input name="phone" type="text" placeholder="Nhập số điện thoại" required value={formData.phone} onChange={handleInputChange} style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Vai trò</label>
                  <select name="roleName" value={formData.roleName} onChange={handleInputChange} style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                    <option value="RENTER">Khách thuê</option>
                    <option value="OWNER">Chủ kho</option>
                  </select>
                </div>
              </>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Email</label>
              <input name="email" type="email" placeholder="example@email.com" required value={formData.email} onChange={handleInputChange} style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Mật khẩu</label>
              <input name="password" type="password" placeholder="••••••••" required value={formData.password} onChange={handleInputChange} style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input type="checkbox" /> Ghi nhớ đăng nhập
              </label>
              {isLogin && <a href="#" style={{ fontSize: '0.85rem', color: '#0095c7', textDecoration: 'none', fontWeight: 600 }}>Quên mật khẩu?</a>}
            </div>

            <button type="submit" disabled={loading} style={{ 
              backgroundColor: loading ? '#94a3b8' : '#0095c7', 
              color: '#fff', 
              padding: '1.2rem', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              border: 'none', 
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1.5rem',
              boxShadow: '0 10px 20px rgba(0,149,199,0.2)'
            }}>
              {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập ngay' : 'Tạo tài khoản')}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Hoặc đăng nhập bằng</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                <img src="https://www.svgrepo.com/show/475656/google_color.svg" width="20" alt="Google" /> Google
              </button>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                <img src="https://www.svgrepo.com/show/475647/facebook_color.svg" width="20" alt="Facebook" /> Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
