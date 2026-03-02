import React from 'react';

const AboutUsPage = () => {
  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      {/* Hero Section */}
      <section style={{ backgroundColor: '#0f172a', padding: '6rem 2rem', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Về OWRMS</h1>
        <p style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.2rem', color: '#94a3b8', lineHeight: 1.6 }}>
          Kiến tạo hệ sinh thái lưu kho thông minh, giúp doanh nghiệp tối ưu hóa chi phí và quy trình vận hành chuỗi cung ứng.
        </p>
      </section>

      {/* Mission & Vision */}
      <section style={{ maxWidth: '1200px', margin: '6rem auto', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>Sứ mệnh của chúng tôi</h2>
            <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              OWRMS ra đời với mục tiêu giải quyết bài toán lãng phí không gian lưu trữ và khó khăn trong việc tìm kiếm kho bãi tại Việt Nam. Chúng tôi tin rằng công nghệ có thể làm cho thị trường cho thuê kho trở nên minh bạch và hiệu quả hơn.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '3rem' }}>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0095c7' }}>5000+</div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Kho bãi</div>
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0095c7' }}>12k+</div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Thành viên</div>
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0095c7' }}>63</div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Tỉnh thành</div>
              </div>
            </div>
          </div>
          <div style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '24px', 
            padding: '3rem', 
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <li>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>Tận tâm</h4>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Luôn đặt lợi ích của khách hàng làm trọng tâm trong mọi hoạt động.</p>
              </li>
              <li>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>Đổi mới</h4>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Không ngừng cải tiến công nghệ để mang lại trải nghiệm tốt nhất.</p>
              </li>
              <li>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>Tin cậy</h4>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Đảm bảo tính bảo mật và minh bạch trong mọi giao dịch và hợp đồng.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ backgroundColor: '#f1f5f9', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Bảng giá dịch vụ</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Lựa chọn gói dịch vụ phù hợp để tối ưu hóa việc quản lý kho của bạn</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { 
                plan: "Người tìm kho", 
                price: "Miễn phí", 
                features: ["Tìm kiếm không giới hạn", "Liên hệ chủ kho trực tiếp", "Hỗ trợ tư vấn pháp lý"],
                btn: "Bắt đầu ngay"
              },
              { 
                plan: "Chủ kho cơ bản", 
                price: "499.000", 
                unit: "/tháng",
                featured: true,
                features: ["Đăng 5 tin cho thuê", "Báo cáo lượt xem hàng tuần", "Hỗ trợ soạn thảo hợp đồng"],
                btn: "Dùng thử 7 ngày"
              },
              { 
                plan: "Chủ kho chuyên nghiệp", 
                price: "Liên hệ", 
                features: ["Không giới hạn tin đăng", "Quản lý nhiều chi nhánh", "Ưu tiên hiển thị tìm kiếm"],
                btn: "Liên hệ tư vấn"
              }
            ].map((p, idx) => (
              <div key={idx} style={{ 
                backgroundColor: '#fff', 
                padding: '3rem 2rem', 
                borderRadius: '24px', 
                textAlign: 'center',
                boxShadow: p.featured ? '0 20px 50px rgba(0,149,199,0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
                border: p.featured ? '2px solid #0095c7' : '1px solid #f1f5f9',
                transform: p.featured ? 'scale(1.05)' : 'scale(1)',
                zIndex: p.featured ? 2 : 1
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{p.plan}</h4>
                <div style={{ marginBottom: '2.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>{p.price}</span>
                  {p.unit && <span style={{ color: '#64748b' }}>{p.unit}</span>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', textAlign: 'left' }}>
                  {p.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0', fontSize: '0.95rem', color: '#475569' }}>
                       <span style={{ color: '#0095c7' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  border: p.featured ? 'none' : '1px solid #e2e8f0', 
                  backgroundColor: p.featured ? '#0095c7' : '#fff',
                  color: p.featured ? '#fff' : '#0f172a',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}>
                  {p.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
