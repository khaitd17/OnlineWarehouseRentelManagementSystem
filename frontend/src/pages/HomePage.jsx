import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFeaturedWarehouses } from '../services/warehouseService';

const HomePage = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getFeaturedWarehouses(6);
        setWarehouses(data);
      } catch (err) {
        console.error('Failed to fetch warehouses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  const categories = [
    { name: 'Kho mát / lạnh', icon: '❄️', desc: 'Lưu trữ thực phẩm, dược phẩm' },
    { name: 'Kho chung', icon: '📦', desc: 'Chia sẻ không gian, tiết kiệm chi phí' },
    { name: 'Kho tự quản', icon: '🔐', desc: 'Có chìa khóa riêng, linh hoạt 24/7' },
    { name: 'Kho xưởng', icon: '🏭', desc: 'Kết hợp sản xuất và lưu trữ' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/search');
  };

  return (
    <div style={{ width: '100%', overflowX: 'hidden', backgroundColor: '#f8fafc' }}>
      
      {/* Hero Section */}
      <section style={{ 
        backgroundColor: '#0095c7', 
        padding: '5rem 2rem 8rem', 
        color: '#fff', 
        textAlign: 'center',
        position: 'relative',
        backgroundImage: 'linear-gradient(to right, #0095c7, #0077a3)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}>

          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.2 }}>
            Tìm không gian lưu trữ hoàn hảo cho doanh nghiệp
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '3rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto 3rem' }}>
            Truy cập hàng ngàn kho bãi đạt chuẩn trên toàn quốc. Thông tin minh bạch, không phí trung gian, ký hợp đồng điện tử tiện lợi.
          </p>
        </div>
        
        {/* Background elements */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '5%', width: '400px', height: '400px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
      </section>

      {/* Main Search Bar (Elevated) */}
      <section style={{ maxWidth: '1100px', margin: '-5rem auto 4rem', padding: '0 1rem', position: 'relative', zIndex: 10 }}>
        <form onSubmit={handleSearch} style={{ 
          backgroundColor: '#fff', 
          borderRadius: '16px', 
          padding: '24px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 120px',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0095c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Khu vực
            </label>
            <input type="text" placeholder="Thành phố, Quận/Huyện..." style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0095c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              Nhu cầu thuê
            </label>
            <select style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', backgroundColor: '#fff', cursor: 'pointer' }}>
              <option value="">Tất cả loại kho</option>
              {categories.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0095c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
              Diện tích cần thiết
            </label>
            <input type="text" placeholder="Ví dụ: &gt; 200m2" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem' }} />
          </div>
          <button type="submit" style={{ 
            backgroundColor: '#0095c7', 
            border: 'none', 
            borderRadius: '8px', 
            height: '48px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
            transition: 'background-color 0.2s',
            boxShadow: '0 4px 10px rgba(0, 149, 199, 0.3)'
          }}>
            Khám phá
          </button>
        </form>
      </section>

      {/* Categories / Quick Filter */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 1.5rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Loại hình kho bãi phổ biến</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {categories.map((cat, idx) => (
            <div key={idx} style={{ 
              backgroundColor: '#fff', 
              padding: '20px', 
              borderRadius: '16px', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.05)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)'; }}>
              <div style={{ fontSize: '2.5rem', backgroundColor: '#f0f9ff', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                {cat.icon}
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{cat.name}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Warehouses */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 5rem', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Kho bãi nổi bật cho bạn</h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem' }}>Được đánh giá cao bởi các doanh nghiệp và đối tác</p>
          </div>
          <Link to="/search" style={{ color: '#0095c7', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Xem tất cả 
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
          {loading ? (
            <p style={{ color: '#64748b', fontSize: '1rem', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0' }}>Đang tải dữ liệu...</p>
          ) : warehouses.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '1rem', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0' }}>Chưa có kho bãi nào được duyệt.</p>
          ) : (
          warehouses.map(w => (
            <Link to={`/warehouse/${w.warehouseId}`} key={w.warehouseId} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '20px', 
              overflow: 'hidden', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid #f1f5f9',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)'; }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={w.imageUrl ? `http://localhost:5276${w.imageUrl}` : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'} 
                  alt={w.name} 
                  style={{ width: '100%', height: '240px', objectFit: 'cover' }} 
                />
              </div>
              
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', lineHeight: 1.4 }}>{w.name}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {w.address}
                </p>
                {w.description && (
                  <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {w.description}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>TỔNG DIỆN TÍCH</div>
                    <div style={{ color: '#334155', fontSize: '1rem', fontWeight: 700 }}>
                      {w.totalArea} m²
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>CÒN TRỐNG</div>
                    <div>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0095c7' }}>{w.availableArea}</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}> m²</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </Link>
          ))
          )}
        </div>
      </section>

      {/* Renter Benefits */}
      <section style={{ backgroundColor: '#fff', padding: '6rem 2rem', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Lợi ích khi tìm kho tại OWRMS</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Chúng tôi cung cấp giải pháp tìm kiếm và thuê kho hiệu quả, an toàn và minh bạch dành riêng cho người đi thuê.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
            {[
              { title: "Thông tin minh bạch, chính xác", desc: "Mọi kho bãi đều được xác thực hình ảnh, giấy tờ, đảm bảo không có tin giả hoặc giá ảo.", icon: "🔍", color: "#e0f2fe", tint: "#0095c7" },
              { title: "Đa dạng lựa chọn", desc: "Từ kho mát, kho thường, tới xưởng sản xuất, tất cả đều có sẵn với nhiều quy mô khác nhau.", icon: "🏢", color: "#fef3c7", tint: "#d97706" },
              { title: "Ký hợp đồng & thanh toán an toàn", desc: "Chúng tôi hỗ trợ pháp lý và cung cấp cổng thanh toán an toàn, bảo vệ quyền lợi người thuê.", icon: "🛡️", color: "#dcfce7", tint: "#15803d" },
              { title: "Tiết kiệm thời gian & chi phí", desc: "Không cần qua nhiều trung gian, tìm kiếm và liên hệ trực tiếp với chủ kho nhanh chóng.", icon: "⏱️", color: "#f3e8ff", tint: "#7e22ce" }
            ].map((item, idx) => (
              <div key={idx} style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '2.5rem', backgroundColor: item.color, width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', margin: '0 auto 1.5rem', boxShadow: `0 10px 15px -3px ${item.color}` }}>
                  {item.icon}
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>{item.title}</h4>
                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ backgroundColor: '#0095c7', maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem', borderRadius: '32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Bạn đã sẵn sàng thuê kho?</h2>
            <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
              Tạo tài khoản miễn phí để lưu lại danh sách yêu thích, nhận báo giá chi tiết và lên lịch hẹn xem kho thực tế.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link to="/auth" style={{ 
                backgroundColor: '#fff', 
                color: '#0095c7', 
                padding: '16px 32px', 
                borderRadius: '12px', 
                fontWeight: 700, 
                fontSize: '1.1rem',
                textDecoration: 'none',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                Đăng ký ngay
              </Link>
              <Link to="/search" style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                color: '#fff', 
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '16px 32px', 
                borderRadius: '12px', 
                fontWeight: 700, 
                fontSize: '1.1rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}>
                Khám phá kho bãi
              </Link>
            </div>
          </div>
          <svg style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1, transform: 'scale(1.5)', transformOrigin: 'top right' }} width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
