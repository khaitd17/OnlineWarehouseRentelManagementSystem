import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const featuredWarehouses = [
    {
      id: 1,
      title: "Kho lạnh hiện đại - KCN Tân Bình",
      price: "250.000",
      area: "200",
      location: "Quận Tân Bình, TP. HCM",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 2,
      title: "Kho bãi trung tâm - Quận 7",
      price: "180.000",
      area: "500",
      location: "Quận 7, TP. HCM",
      rating: 4.5,
      image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 3,
      title: "Nhà xưởng tiêu chuẩn - Bình Dương",
      price: "120.000",
      area: "1000",
      location: "Thuận An, Bình Dương",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1565891741441-64926e441838?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      {/* Hero Section */}
      <section style={{ 
        backgroundColor: '#0095c7', 
        padding: '6rem 2rem 10rem', 
        color: '#fff', 
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.2 }}>
            Thuê Kho Nhanh Chóng – Minh Bạch – Linh Hoạt
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem', opacity: 0.9 }}>
            Hệ thống kết nối chủ kho và khách thuê hàng đầu Việt Nam. Tìm kiếm hàng nghìn kho bãi phù hợp chỉ trong vài phút.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <Link to="/search" style={{ 
              backgroundColor: '#fff', 
              color: '#0095c7', 
              padding: '1rem 2rem', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              Tìm kho ngay
            </Link>
            <Link to="/post-warehouse" style={{ 
              backgroundColor: 'transparent', 
              color: '#fff', 
              padding: '1rem 2rem', 
              borderRadius: '12px', 
              border: '2px solid #fff',
              fontWeight: 700, 
              fontSize: '1.1rem', 
              textDecoration: 'none'
            }}>
              Đăng kho miễn phí
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Search Bar */}
      <section style={{ maxWidth: '1100px', margin: '-4rem auto 4rem', padding: '0 1rem', position: 'relative', zIndex: 10 }}>
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '20px', 
          padding: '2rem', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 80px',
          gap: '1.5rem',
          alignItems: 'end'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Địa điểm</label>
            <input type="text" placeholder="Bạn cần thuê kho ở đâu?" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Loại kho</label>
            <select style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }}>
              <option>Kho chung</option>
              <option>Kho tự quản</option>
              <option>Kho lạnh</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Diện tích</label>
            <input type="text" placeholder="Ví dụ: 100m2" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Giá thuê</label>
            <input type="text" placeholder="Ngân sách của bạn" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }} />
          </div>
          <button style={{ 
            backgroundColor: '#0095c7', 
            border: 'none', 
            borderRadius: '12px', 
            height: '48px', 
            width: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
      </section>

      {/* Featured Listings */}
      <section style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Kho bãi nổi bật</h2>
            <p style={{ color: '#64748b' }}>Khám phá các kho bãi chất lượng nhất được đề xuất cho bạn</p>
          </div>
          <Link to="/search" style={{ color: '#0095c7', fontWeight: 600, textDecoration: 'none' }}>Xem tất cả &rarr;</Link>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          {featuredWarehouses.map(w => (
            <div key={w.id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              transition: 'transform 0.3s ease'
            }}>
              <img src={w.image} alt={w.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ backgroundColor: '#e2f5ff', color: '#0095c7', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>ƯU ĐÃI</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    <span style={{ color: '#f59e0b' }}>★</span> {w.rating}
                  </div>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.8rem' }}>{w.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.2rem' }}>📍 {w.location}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.2rem' }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0095c7' }}>{w.price}</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}> VNĐ/tháng</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                    {w.area} m²
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Value Prop */}
      <section style={{ backgroundColor: '#fff', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '4rem' }}>Tại sao chọn OWRMS?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
            {[
              { title: "Giá cả minh bạch", desc: "Mọi chi phí đều được liệt kê rõ ràng, không phí ẩn.", icon: "💰" },
              { title: "Hợp đồng trực tuyến", desc: "Ký kết hợp đồng thuê kho nhanh chóng ngay trên ứng dụng.", icon: "📄" },
              { title: "Thanh toán linh hoạt", desc: "Hỗ trợ nhiều hình thức thanh toán, an toàn tuyệt đối.", icon: "💳" },
              { title: "Quản lý dễ dàng", desc: "Giao diện quản lý thông minh dành cho cả chủ kho và người thuê.", icon: "📊" }
            ].map((item, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>{item.icon}</div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>{item.title}</h4>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ backgroundColor: '#f1f5f9', padding: '5rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Bắt đầu ngay hôm nay</h2>
        <p style={{ color: '#64748b', marginBottom: '2.5rem' }}>Gia nhập cộng đồng OWRMS để tối ưu hóa việc quản lý kho bãi của bạn.</p>
        <Link to="/auth" style={{ 
          backgroundColor: '#0095c7', 
          color: '#fff', 
          padding: '1rem 3rem', 
          borderRadius: '12px', 
          fontWeight: 700, 
          textDecoration: 'none',
          boxShadow: '0 10px 20px rgba(0,149,199,0.2)'
        }}>
          Đăng ký tài khoản
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
