import React, { useState } from 'react';

const SearchResultsPage = () => {
  const [activeFilters, setActiveFilters] = useState({
    location: '',
    type: 'All',
    priceRange: [0, 1000000],
    area: 'All'
  });

  const results = [
    { id: 1, title: "Kho lạnh hiện đại - KCN Tân Bình", price: "250.000", area: "200", location: "Quận Tân Bình, TP. HCM", rating: 4.8, image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800", type: "Kho lạnh" },
    { id: 2, title: "Kho bãi trung tâm - Quận 7", price: "180.000", area: "500", location: "Quận 7, TP. HCM", rating: 4.5, image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=800", type: "Kho chung" },
    { id: 3, title: "Nhà xưởng tiêu chuẩn - Bình Dương", price: "120.000", area: "1000", location: "Thuận An, Bình Dương", rating: 4.7, image: "https://images.unsplash.com/photo-1565891741441-64926e441838?auto=format&fit=crop&q=80&w=800", type: "Kho tự quản" },
    { id: 4, title: "Kho phân phối Logistics - Long An", price: "95.000", area: "2500", location: "Bến Lức, Long An", rating: 4.6, image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&q=80&w=800", type: "Kho chung" },
    { id: 5, title: "Kho mini trung tâm Quận 1", price: "500.000", area: "50", location: "Quận 1, TP. HCM", rating: 4.9, image: "https://images.unsplash.com/photo-1504384764586-bb4cdc17477b?auto=format&fit=crop&q=80&w=800", type: "Kho tự quản" },
    { id: 6, title: "Kho bãi container - Cát Lái", price: "150.000", area: "5000", location: "Quận 2, TP. HCM", rating: 4.4, image: "https://images.unsplash.com/photo-1493946747784-a5a52230da76?auto=format&fit=crop&q=80&w=800", type: "Bãi trống" },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Filters Sidebar */}
        <aside style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>Bộ lọc tìm kiếm</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Địa điểm</label>
              <input type="text" placeholder="TP. Hồ Chí Minh" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Loại kho</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['Tất cả', 'Kho lạnh', 'Kho chung', 'Kho tự quản', 'Bãi trống'].map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={t === 'Tất cả'} style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Giá thuê (VNĐ/m2)</label>
              <input type="range" min="0" max="1000000" style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                <span>0</span>
                <span>1.000.000</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Diện tích (m2)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '0.85rem' }}>&lt; 100m²</button>
                <button style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '0.85rem' }}>100-500m²</button>
                <button style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '0.85rem' }}>500-1000m²</button>
                <button style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '0.85rem' }}>&gt; 1000m²</button>
              </div>
            </div>

            <button style={{ 
              width: '100%', 
              backgroundColor: '#0095c7', 
              color: '#fff', 
              padding: '1rem', 
              borderRadius: '10px', 
              fontWeight: 700, 
              border: 'none', 
              cursor: 'pointer',
              marginTop: '1rem'
            }}>
              Áp dụng bộ lọc
            </button>
          </div>
        </aside>

        {/* Results Main Area */}
        <main style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>1,240 Kết quả tìm kiếm</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Sắp xếp:</span>
              <select style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '0.9rem' }}>
                <option>Mới nhất</option>
                <option>Giá thấp đến cao</option>
                <option>Giá cao đến thấp</option>
                <option>Diện tích lớn nhất</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {results.map(w => (
              <div key={w.id} style={{ 
                backgroundColor: '#fff', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                border: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ position: 'relative' }}>
                  <img src={w.image} alt={w.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  <span style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px', 
                    backgroundColor: 'rgba(255,255,255,0.9)', 
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '6px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700,
                    color: '#0095c7'
                  }}>
                    {w.type}
                  </span>
                </div>
                <div style={{ padding: '1.2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.4 }}>{w.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>📍 {w.location}</p>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>{w.area}</span> m²
                    </div>
                    <div style={{ backgroundColor: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      ⭐ <span style={{ fontWeight: 600 }}>{w.rating}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0095c7' }}>{w.price}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}> đ/tháng</span>
                    </div>
                    <button style={{ 
                      backgroundColor: '#f1f5f9', 
                      border: 'none', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '8px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      color: '#0f172a',
                      cursor: 'pointer'
                    }}>
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem' }}>
            <button style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer' }}>Trước</button>
            <button style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#0095c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>1</button>
            <button style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer' }}>2</button>
            <button style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer' }}>3</button>
            <button style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer' }}>Sau</button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SearchResultsPage;
