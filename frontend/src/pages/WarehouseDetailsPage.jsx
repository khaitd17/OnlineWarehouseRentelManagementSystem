import React from 'react';

const WarehouseDetailsPage = () => {
  const warehouse = {
    id: 1,
    title: "Kho lạnh hiện đại - Khu Công Nghiệp Tân Bình",
    price: "250.000",
    unit: "VNĐ/m²/tháng",
    area: "200",
    location: "Lô II-10, Cụm 2, Đường số 10, KCN Tân Bình, P. Tây Thạnh, Q. Tân Phú, TP. HCM",
    rating: 4.8,
    reviews: 24,
    description: "Kho lạnh tiêu chuẩn quốc tế, được thiết kế chuyên biệt cho việc lưu trữ thực phẩm và dược phẩm. Hệ thống làm lạnh hiện đại, kiểm soát nhiệt độ từ -20°C đến +10°C. Vị trí đắc địa tại KCN Tân Bình, thuận tiện cho việc phân phối hàng hóa vào trung tâm thành phố và các tỉnh lân cận.",
    features: [
      "Kiểm soát nhiệt độ 24/7",
      "Hệ thống PCCC tự động",
      "Bảo vệ & Camera giám sát 24/7",
      "Hỗ trợ bốc xếp hàng hóa",
      "Quản lý bằng phần mềm chuyên dụng",
      "Máy phát điện dự phòng 100% công suất"
    ],
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&q=80&w=800"
    ],
    occupancyRate: 75
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
        Trang chủ / Tìm kiếm / {warehouse.title}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
        {/* Main Content */}
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>{warehouse.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', color: '#64748b', fontSize: '0.95rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ color: '#f59e0b' }}>★</span> {warehouse.rating} ({warehouse.reviews} đánh giá)
            </span>
            <span>📍 {warehouse.location}</span>
          </div>

          {/* Image Gallery */}
          <div style={{ marginBottom: '3rem' }}>
            <img src={warehouse.images[0]} alt={warehouse.title} style={{ width: '100%', height: '450px', objectFit: 'cover', borderRadius: '16px', marginBottom: '1rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {warehouse.images.map((img, idx) => (
                <img key={idx} src={img} alt={`${warehouse.title} ${idx + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px', cursor: 'pointer' }} />
              ))}
            </div>
          </div>

          {/* Details */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.8rem' }}>Mô tả chi tiết</h2>
            <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{warehouse.description}</p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.8rem' }}>Tiện ích & Đặc điểm</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {warehouse.features.map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', backgroundColor: '#f8fafc', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 500 }}>
                  <span style={{ color: '#0095c7' }}>✓</span> {feature}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Booking Card */}
        <aside>
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '2rem', 
            borderRadius: '20px', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)', 
            border: '1px solid #f1f5f9',
            position: 'sticky',
            top: '100px'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0095c7' }}>{warehouse.price}</span>
              <span style={{ fontSize: '0.95rem', color: '#64748b' }}> {warehouse.unit}</span>
            </div>
            
            <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem' }}>Diện tích khả dụng</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{warehouse.area} m²</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem' }}>Tỷ lệ lấp đầy</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: warehouse.occupancyRate > 80 ? '#ef4444' : '#10b981' }}>{warehouse.occupancyRate}%</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Ngày bắt đầu</label>
                <input type="date" style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Thời gian thuê (Tháng)</label>
                <input type="number" min="1" placeholder="Số tháng thuê" style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
              </div>
            </div>

            <button style={{ 
              width: '100%', 
              backgroundColor: '#0095c7', 
              color: '#fff', 
              padding: '1.2rem', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              border: 'none', 
              cursor: 'pointer',
              marginBottom: '1rem'
            }}>
              Đặt lịch tham quan
            </button>
            <button style={{ 
              width: '100%', 
              backgroundColor: '#fff', 
              color: '#0095c7', 
              padding: '1.2rem', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              border: '2px solid #0095c7', 
              cursor: 'pointer'
            }}>
              Nhận báo giá ngay
            </button>
            
            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              ⚡ Phản hồi trong vòng 2 giờ
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default WarehouseDetailsPage;
