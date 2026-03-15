import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/api';

const WarehouseDetailsPage = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    startDate: '',
    fullName: '',
    phone: ''
  });
  const [warehouseData, setWarehouseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        const res = await api.get(`/Warehouse/${id}`);
        setWarehouseData(res.data);
      } catch (err) {
        console.error('Failed to load warehouse:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouse();
  }, [id]);

  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1565891741441-64926e441838?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1624927637280-f033784c1279?auto=format&fit=crop&q=80&w=600"
  ];

  const getImageUrl = (url) =>
    url ? `http://localhost:5276${url.startsWith('/') ? url : '/' + url}` : null;

  // Robustly extract images from any possible property name variant
  const rawImages = warehouseData?.images || warehouseData?.Images || warehouseData?.warehouseMedia || warehouseData?.WarehouseMedia || [];

  const warehouse = warehouseData ? {
    id: warehouseData.warehouseId,
    title: warehouseData.name,
    area: warehouseData.totalArea,
    availableArea: warehouseData.availableArea,
    location: warehouseData.address,
    status: warehouseData.status === 'APPROVED' ? 'Còn trống' : warehouseData.status,
    description: warehouseData.description || '',
    operatingHours: warehouseData.operatingHours,
    lat: warehouseData.lat,
    lng: warehouseData.lng,
    images: rawImages.length > 0
      ? rawImages.map(img => {
          const u = img.url || img.Url || img.mediaUrl || img.MediaUrl || (typeof img === 'string' ? img : null);
          return getImageUrl(u);
        }).filter(Boolean)
      : FALLBACK_IMAGES,
    ownerName: warehouseData.ownerName || 'Chủ kho',
    ownerPhone: warehouseData.ownerPhone || null,
    ownerAvatarUrl: warehouseData.ownerAvatarUrl ? `http://localhost:5276${warehouseData.ownerAvatarUrl}` : `https://i.pravatar.cc/150?u=${warehouseData.ownerId}`,
  } : null;

  const similarWarehouses = [
    {
      id: 2,
      title: "Kho Sài Gòn Logistics - KCN Vĩnh Lộc",
      location: "Bình Chánh, TP. HCM",
      price: "38M",
      area: "850",
      type: "KHO KHÔ",
      image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 3,
      title: "Kho Lạnh Công Nghệ Cao - Long An",
      location: "Cần Giuộc, Long An",
      price: "52M",
      area: "1000",
      type: "KHO LẠNH",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 4,
      title: "Hệ Thống Kho Phân Phối Gò Vấp",
      location: "Phường 14, Gò Vấp, TP. HCM",
      price: "25M",
      area: "500",
      type: "KHO KHÔ",
      image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=600"
    }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const Badge = ({ children, color = "#0095c7" }) => (
    <div style={{ backgroundColor: `${color}15`, color: color, padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
      {children}
    </div>
  );

  const openLightbox = (index) => setLightbox({ open: true, index });
  const closeLightbox = () => setLightbox({ open: false, index: 0 });
  const prevImage = (e) => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: (lb.index - 1 + (warehouse?.images.length || 1)) % (warehouse?.images.length || 1) })); };
  const nextImage = (e) => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: (lb.index + 1) % (warehouse?.images.length || 1) })); };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu kho...</div>
    );
  }

  if (!warehouse) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Không tìm thấy kho.</div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      {/* Container wraps the entire page content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        
        {/* Breadcrumbs */}
        <nav style={{ marginBottom: '1.2rem', display: 'flex', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
          <span>›</span>
          <Link to="/search" style={{ color: 'inherit', textDecoration: 'none' }}>Tìm kho</Link>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: 500 }}>{warehouse.title}</span>
        </nav>
      

        {/* Title Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>{warehouse.title}</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0095c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {warehouse.location}
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: warehouse.images.length > 1 ? '1.5fr 1fr' : '1fr',
          gap: '12px',
          marginBottom: '2rem'
        }}>
          {/* Main image */}
          <div
            style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'zoom-in', height: '450px' }}
            onClick={() => openLightbox(0)}
          >
            <img src={warehouse.images[0]} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Side thumbnails — only render when there are extra images */}
          {warehouse.images.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '12px', height: '450px' }}>
              {warehouse.images.slice(1, 4).map((img, idx) => (
                <div
                  key={idx}
                  style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'zoom-in', minHeight: 0 }}
                  onClick={() => openLightbox(idx + 1)}
                >
                  <img src={img} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              {/* 4th cell: "see all" overlay if more than 4 images, else the 4th image itself */}
              {warehouse.images.length > 4 ? (
                <div
                  style={{ borderRadius: '12px', overflow: 'hidden', position: 'relative', cursor: 'pointer', minHeight: 0 }}
                  onClick={() => openLightbox(4)}
                >
                  <img src={warehouse.images[4]} alt="More" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '1.1rem', fontWeight: 700
                  }}>
                    +{warehouse.images.length - 4} ảnh
                  </div>
                </div>
              ) : warehouse.images[4] ? (
                <div
                  style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'zoom-in', minHeight: 0 }}
                  onClick={() => openLightbox(4)}
                >
                  <img src={warehouse.images[4]} alt="Gallery 4" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {lightbox.open && (
          <div
            onClick={closeLightbox}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)',
              zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              style={{
                position: 'absolute', top: '20px', right: '24px',
                background: 'none', border: 'none', color: '#fff',
                fontSize: '2rem', cursor: 'pointer', lineHeight: 1
              }}
            >✕</button>

            {/* Prev */}
            {warehouse.images.length > 1 && (
              <button
                onClick={prevImage}
                style={{
                  position: 'absolute', left: '16px',
                  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                  fontSize: '2rem', cursor: 'pointer', borderRadius: '50%',
                  width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >‹</button>
            )}

            {/* Image */}
            <img
              src={warehouse.images[lightbox.index]}
              alt={`Ảnh ${lightbox.index + 1}`}
              onClick={e => e.stopPropagation()}
              style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: '8px' }}
            />

            {/* Next */}
            {warehouse.images.length > 1 && (
              <button
                onClick={nextImage}
                style={{
                  position: 'absolute', right: '16px',
                  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                  fontSize: '2rem', cursor: 'pointer', borderRadius: '50%',
                  width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >›</button>
            )}

            {/* Counter */}
            <div style={{
              position: 'absolute', bottom: '24px',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem'
            }}>
              {lightbox.index + 1} / {warehouse.images.length}
            </div>
          </div>
        )}

        {/* Main Grid: Content + Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>
          
          {/* LEFT: Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {[
                { label: "TỔNG DIỆN TÍCH", value: `${warehouse.area} m²`, icon: "📐" },
                { label: "CÒN TRỐNG", value: `${warehouse.availableArea} m²`, icon: "📦" },
                { label: "GIỜ HOẠT ĐỘNG", value: warehouse.operatingHours || 'Không rõ', icon: "🕐" },
                { label: "TRẠNG THÁI", value: warehouse.status, icon: "✅" }
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: '#f8fafc', padding: '1.2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>Mô tả chi tiết</h2>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {warehouse.description}
              </p>
            </section>



            {/* Map */}
            {warehouse.lat && warehouse.lng && (
              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.2rem' }}>Vị trí trên bản đồ</h2>
                <div style={{ width: '100%', height: '300px', borderRadius: '16px', overflow: 'hidden' }}>
                  <iframe
                    title="map"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${warehouse.lat},${warehouse.lng}&z=15&output=embed`}
                  ></iframe>
                </div>
              </section>
            )}

          </div>

          {/* RIGHT: Sidebar sticky card */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '20px', alignSelf: 'start' }}>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '20px', 
              padding: '24px', 
              boxShadow: '0 4px 30px rgba(0,0,0,0.06)', 
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Diện tích còn trống: {warehouse.availableArea} m²</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>NGÀY BẮT ĐẦU THUÊ</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>HỌ VÀ TÊN</label>
                  <input type="text" name="fullName" placeholder="Nhập họ và tên" value={formData.fullName} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>SỐ ĐIỆN THOẠI</label>
                  <input type="text" name="phone" placeholder="Nhập số điện thoại" value={formData.phone} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <button style={{ 
                width: '100%', 
                backgroundColor: '#0095c7', 
                color: '#fff', 
                padding: '14px', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '1rem', 
                border: 'none', 
                cursor: 'pointer',
                marginBottom: '12px',
                transition: 'background-color 0.2s'
              }}>
                Đặt lịch xem kho
              </button>
              <button style={{ 
                width: '100%', 
                backgroundColor: '#fff', 
                color: '#0095c7', 
                padding: '14px', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '1rem', 
                border: '1px solid #0095c7', 
                cursor: 'pointer',
                marginBottom: '20px'
              }}>
                Liên hệ chủ kho
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <img src={warehouse.ownerAvatarUrl} alt="Owner" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Chủ kho</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{warehouse.ownerName}</div>
                  {warehouse.ownerPhone && (
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{warehouse.ownerPhone}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Badge */}
            <div style={{ 
              backgroundColor: '#eff6ff', 
              padding: '16px', 
              borderRadius: '12px', 
              border: '1px solid #dbeafe',
              display: 'flex',
              gap: '12px'
            }}>
              <div style={{ backgroundColor: '#0095c7', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '4px' }}>OWRMS Đảm bảo</div>
                <p style={{ fontSize: '0.75rem', color: '#1e3a8a', margin: 0, opacity: 0.8, lineHeight: 1.4 }}>
                  Thông tin kho đã được đội ngũ OWRMS xác thực thực tế. Hợp đồng pháp lý minh bạch và hỗ trợ 24/7.
                </p>
              </div>
            </div>
          </aside>

        </div>

        {/* Similar Warehouses */}
        <section style={{ marginTop: '4rem', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1e293b' }}>Kho tương tự</h2>
            <Link to="/search" style={{ color: '#0095c7', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Xem tất cả ›</Link>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {similarWarehouses.map((w) => (
              <div key={w.id} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ position: 'relative', height: '200px' }}>
                  <img src={w.image} alt={w.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    <Badge color="#475569">{w.type}</Badge>
                  </div>
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', lineHeight: 1.4 }}>{w.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>📍 {w.location}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0095c7' }}>{w.price} VND</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/tháng</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{w.area} m²</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
      
      {/* Footer minimal */}
      <footer style={{ backgroundColor: '#0f172a', padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#fff', marginBottom: '1rem', fontWeight: 800, fontSize: '1.2rem' }}>
          🏢 OWRMS
        </div>
        <p style={{ fontSize: '0.8rem' }}>© 2026 Online Warehouse Rental Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default WarehouseDetailsPage;

