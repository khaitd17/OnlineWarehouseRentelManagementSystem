import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/axiosClient';
import rentalService from '../services/rentalService';
import ratingService from '../services/ratingService';
import authService from '../services/authService';

const WarehouseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    requestedArea: '',
    startDate: '',
    durationMonths: '',
    notes: ''
  });
  const [warehouseData, setWarehouseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replyLoading, setReplyLoading] = useState(false);
  // Rating by renter
  const [myContractForWarehouse, setMyContractForWarehouse] = useState(null);
  const [existingMyRating, setExistingMyRating] = useState(null);
  const [ratingForm, setRatingForm] = useState({ star: 5, comment: '' });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMsg, setRatingMsg] = useState(null);
  const [showThankPopup, setShowThankPopup] = useState(false);
  const isLoggedIn = !!localStorage.getItem('token');
  const currentUser = authService.getCurrentUser();
  // [PERMISSION FIX] Kiểm tra warehouseContext cho kho hiện tại thay vì JWT system role
  const warehouseCtx = authService.getWarehouseContext();
  const warehouseList = warehouseCtx?.warehouses || [];
  const isRenter = warehouseList.some(
    w => String(w.warehouseId) === String(id) && (w.role || '').toUpperCase() === 'RENTER'
  );
  // isOwner: so sánh userId với ownerId của kho (không quan tớm JWT role)
  const isOwner = currentUser && warehouseData && currentUser.userId === warehouseData.ownerId;

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
    const fetchRatings = async () => {
      try {
        const data = await ratingService.getWarehouseRatings(id);
        setRatingsData(data);
      } catch (err) { console.error('Failed to load ratings:', err); }
    };
    fetchRatings();

    // Fetch renter's contract for this warehouse
    if (isRenter) {
      rentalService.getMyContracts()
        .then(contracts => {
          const contract = contracts.find(
            c => String(c.warehouseId) === String(id) &&
              (c.status === 'ACTIVE' || c.status === 'EXPIRED')
          );
          setMyContractForWarehouse(contract || null);
          if (contract) {
            ratingService.getMyRatings().then(ratings => {
              const found = ratings.find(r => r.contractId === contract.contractId);
              setExistingMyRating(found || null);
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [id, isRenter]);

  const handleReplySubmit = async (ratingId) => {
    if (!replyText[ratingId]) return;
    setReplyLoading(true);
    try {
      await ratingService.replyToRating(ratingId, replyText[ratingId]);
      // Update local state
      setRatingsData(prev => ({
        ...prev,
        ratings: prev.ratings.map(r => 
          r.ratingId === ratingId ? { ...r, ownerReply: replyText[ratingId] } : r
        )
      }));
      setReplyText(prev => ({ ...prev, [ratingId]: '' }));
    } catch (err) {
      console.error('Failed to reply:', err);
      alert('Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!myContractForWarehouse) return;
    setRatingSubmitting(true);
    try {
      await ratingService.createRating({
        warehouseId: Number(id),
        contractId: myContractForWarehouse.contractId,
        star: ratingForm.star,
        comment: ratingForm.comment,
      });
      setShowThankPopup(true);
      // Thông báo sidebar cập nhật badge
      window.dispatchEvent(new Event('ratingSubmitted'));
      // Reload ratings
      const [ratings, warehouseRatings] = await Promise.all([
        ratingService.getMyRatings(),
        ratingService.getWarehouseRatings(id),
      ]);
      const found = ratings.find(r => r.contractId === myContractForWarehouse.contractId);
      setExistingMyRating(found || null);
      setRatingsData(warehouseRatings);
    } catch (err) {
      setRatingMsg({ type: 'error', text: err.response?.data?.message || err.response?.data || 'Lỗi khi gửi đánh giá' });
      setTimeout(() => setRatingMsg(null), 4000);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1565891741441-64926e441838?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1624927637280-f033784c1279?auto=format&fit=crop&q=80&w=600"
  ];

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5276${url.startsWith('/') ? url : '/' + url}`;
  };

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
    { id: 2, title: "Kho Sài Gòn Logistics - KCN Vĩnh Lộc", location: "Bình Chánh, TP. HCM", price: "38M", area: "850", type: "KHO KHÔ", image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&q=80&w=600" },
    { id: 3, title: "Kho Lạnh Công Nghệ Cao - Long An", location: "Cần Giuộc, Long An", price: "52M", area: "1000", type: "KHO LẠNH", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600" },
    { id: 4, title: "Hệ Thống Kho Phân Phối Gò Vấp", location: "Phường 14, Gò Vấp, TP. HCM", price: "25M", area: "500", type: "KHO KHÔ", image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=600" }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSubmitMsg(null);
  };

  const handleSubmitRequest = async () => {
    if (!isLoggedIn) {
      navigate('/auth');
      return;
    }

    const area = parseFloat(formData.requestedArea);
    const duration = parseInt(formData.durationMonths);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = formData.startDate ? new Date(formData.startDate) : null;

    if (!area || area <= 0) { setSubmitMsg({ type: 'error', text: 'Vui lòng nhập diện tích cần thuê.' }); return; }
    if (warehouse && area > warehouse.availableArea) { setSubmitMsg({ type: 'error', text: `Diện tích vượt quá diện tích còn trống (${warehouse.availableArea} m²).` }); return; }
    if (!formData.startDate) { setSubmitMsg({ type: 'error', text: 'Vui lòng chọn ngày bắt đầu.' }); return; }
    if (startDate < today) { setSubmitMsg({ type: 'error', text: 'Ngày bắt đầu phải từ hôm nay trở đi.' }); return; }
    if (!duration || duration < 1 || duration > 60) { setSubmitMsg({ type: 'error', text: 'Thời hạn thuê từ 1 đến 60 tháng.' }); return; }

    setSubmitting(true);
    try {
      await rentalService.createRentalRequest({
        warehouseId: warehouse.id,
        requestedArea: area,
        startDate: formData.startDate,
        durationMonths: duration,
        notes: formData.notes.trim() || null,
      });
      setSubmitMsg({ type: 'success', text: 'Yêu cầu thuê kho đã được gửi! Chủ kho sẽ xem xét và phản hồi sớm.' });
      setFormData({ requestedArea: '', startDate: '', durationMonths: '', notes: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      setSubmitMsg({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
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
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu kho...</div>;
  }

  if (!warehouse) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Không tìm thấy kho.</div>;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: warehouse.images.length > 1 ? '1.5fr 1fr' : '1fr', gap: '12px', marginBottom: '2rem' }}>
          <div style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'zoom-in', height: '450px' }} onClick={() => openLightbox(0)}>
            <img src={warehouse.images[0]} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {warehouse.images.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '12px', height: '450px' }}>
              {warehouse.images.slice(1, 4).map((img, idx) => (
                <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'zoom-in', minHeight: 0 }} onClick={() => openLightbox(idx + 1)}>
                  <img src={img} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              {warehouse.images.length > 4 ? (
                <div style={{ borderRadius: '12px', overflow: 'hidden', position: 'relative', cursor: 'pointer', minHeight: 0 }} onClick={() => openLightbox(4)}>
                  <img src={warehouse.images[4]} alt="More" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                    +{warehouse.images.length - 4} ảnh
                  </div>
                </div>
              ) : warehouse.images[4] ? (
                <div style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'zoom-in', minHeight: 0 }} onClick={() => openLightbox(4)}>
                  <img src={warehouse.images[4]} alt="Gallery 4" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {lightbox.open && (
          <div onClick={closeLightbox} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={closeLightbox} style={{ position: 'absolute', top: '20px', right: '24px', background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            {warehouse.images.length > 1 && (
              <button onClick={prevImage} style={{ position: 'absolute', left: '16px', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', borderRadius: '50%', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            )}
            <img src={warehouse.images[lightbox.index]} alt={`Ảnh ${lightbox.index + 1}`} onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: '8px' }} />
            {warehouse.images.length > 1 && (
              <button onClick={nextImage} style={{ position: 'absolute', right: '16px', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', borderRadius: '50%', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            )}
            <div style={{ position: 'absolute', bottom: '24px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              {lightbox.index + 1} / {warehouse.images.length}
            </div>
          </div>
        )}

        {/* Main Grid: Content + Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>

          {/* LEFT: Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {[
                { label: "TỔNG DIỆN TÍCH", value: `${warehouse.area} m²`, icon: "📐" },
                { label: "CÒN TRỐNG", value: `${warehouse.availableArea} m²`, icon: "📦" },
                { label: "GIỜ HOẠT ĐỘNG", value: warehouse.operatingHours || 'Không rõ', icon: "🕐" },
                { label: "TRẠNG THÁI", value: warehouse.status, icon: "✅" },
                {
                  label: "GIÁ THUÊ/M²/THÁNG",
                  value: warehouseData?.pricePerM2
                    ? `${Number(warehouseData.pricePerM2).toLocaleString('vi-VN')} ₫`
                    : 'Liên hệ',
                  icon: "💰"
                }
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: '#f8fafc', padding: '1.2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>Mô tả chi tiết</h2>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{warehouse.description}</p>
            </section>

            {warehouse.lat && warehouse.lng && (
              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.2rem' }}>Vị trí trên bản đồ</h2>
                <div style={{ width: '100%', height: '300px', borderRadius: '16px', overflow: 'hidden' }}>
                  <iframe title="map" width="100%" height="300" style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${warehouse.lat},${warehouse.lng}&z=15&output=embed`}></iframe>
                </div>
              </section>
            )}

            {/* ── Rating & Review Section ── */}
            <section style={{ marginTop: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>⭐ Đánh giá & Nhận xét</h2>
              {ratingsData && ratingsData.totalCount > 0 ? (
                <>
                  {/* Summary Row */}
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderRadius: '16px', border: '1px solid #fde68a' }}>
                    <div style={{ textAlign: 'center', minWidth: '100px' }}>
                      <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#d97706', lineHeight: 1 }}>{ratingsData.averageStar}</div>
                      <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', margin: '6px 0' }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '1.1rem' }}>{s <= Math.round(ratingsData.averageStar) ? '⭐' : '☆'}</span>)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600 }}>{ratingsData.totalCount} đánh giá</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[5,4,3,2,1].map(star => {
                        const count = ratingsData.starDistribution[star - 1] || 0;
                        const pct = ratingsData.totalCount > 0 ? (count / ratingsData.totalCount * 100) : 0;
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#78716c', width: '24px', textAlign: 'right' }}>{star}★</span>
                            <div style={{ flex: 1, height: '8px', backgroundColor: '#fef3c7', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600, width: '28px' }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {ratingsData.ratings.slice(0, 5).map(r => (
                      <div key={r.ratingId} style={{ padding: '1.2rem 1.5rem', backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'box-shadow 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>
                              {(r.renterName || 'U')[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{r.renterName || 'Người thuê'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : ''}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '1px' }}>
                            {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '0.9rem' }}>{s <= r.star ? '⭐' : '☆'}</span>)}
                          </div>
                        </div>
                        {r.comment && <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 8px 0' }}>{r.comment}</p>}
                        {r.ownerReply ? (
                          <div style={{ marginTop: '10px', padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '10px', borderLeft: '3px solid #22c55e' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', marginBottom: '4px' }}>💬 Phản hồi từ chủ kho</div>
                            <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0, lineHeight: 1.5 }}>{r.ownerReply}</p>
                          </div>
                        ) : (
                          isOwner && (
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                              <input 
                                type="text" 
                                placeholder="Viết phản hồi của bạn..." 
                                value={replyText[r.ratingId] || ''}
                                onChange={(e) => setReplyText({ ...replyText, [r.ratingId]: e.target.value })}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                                disabled={replyLoading}
                              />
                              <button 
                                onClick={() => handleReplySubmit(r.ratingId)}
                                disabled={!replyText[r.ratingId] || replyLoading}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: (!replyText[r.ratingId] || replyLoading) ? 'not-allowed' : 'pointer', opacity: (!replyText[r.ratingId] || replyLoading) ? 0.6 : 1 }}
                              >
                                Phản hồi
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                  {ratingsData.totalCount > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <span style={{ color: '#0095c7', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>Xem tất cả {ratingsData.totalCount} đánh giá ›</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📝</div>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Chưa có đánh giá nào cho kho này</p>
                </div>
              )}

              {/* ── Form đánh giá của Renter ── */}
              {isRenter && myContractForWarehouse && (
                <div style={{ marginTop: '1.5rem', backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #fde68a', boxShadow: '0 2px 12px rgba(245,158,11,0.08)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', marginBottom: '1rem', paddingBottom: '0.8rem', borderBottom: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Đánh giá của bạn
                  </h3>

                  {ratingMsg && (
                    <div style={{ padding: '10px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                      {ratingMsg.text}
                    </div>
                  )}

                  {existingMyRating ? (
                    <div style={{ padding: '1.2rem', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>Đánh giá của bạn</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '1rem' }}>{s <= existingMyRating.star ? '⭐' : '☆'}</span>)}
                        </div>
                      </div>
                      {existingMyRating.comment && <p style={{ color: '#78716c', fontSize: '0.9rem', margin: '0 0 8px 0', lineHeight: 1.5 }}>{existingMyRating.comment}</p>}
                      <div style={{ fontSize: '0.75rem', color: '#a8a29e' }}>
                        Đã đánh giá ngày {existingMyRating.createdAt ? new Date(existingMyRating.createdAt).toLocaleDateString('vi-VN') : ''}
                      </div>
                      {existingMyRating.ownerReply && (
                        <div style={{ marginTop: '10px', padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', marginBottom: '3px' }}>💬 Phản hồi từ chủ kho</div>
                          <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0 }}>{existingMyRating.ownerReply}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Star selector */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chọn số sao</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {[1,2,3,4,5].map(s => (
                            <button
                              key={s}
                              onClick={() => setRatingForm(f => ({ ...f, star: s }))}
                              onMouseEnter={() => setHoveredStar(s)}
                              onMouseLeave={() => setHoveredStar(0)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transform: (hoveredStar >= s || ratingForm.star >= s) ? 'scale(1.18)' : 'scale(1)', transition: 'transform 0.14s ease', lineHeight: 1 }}
                            >
                              <svg width="34" height="34" viewBox="0 0 24 24"
                                fill={s <= (hoveredStar || ratingForm.star) ? '#f59e0b' : 'none'}
                                stroke={s <= (hoveredStar || ratingForm.star) ? '#f59e0b' : '#cbd5e1'}
                                strokeWidth="1.5"
                                style={{ filter: s <= (hoveredStar || ratingForm.star) ? 'drop-shadow(0 2px 6px rgba(245,158,11,0.45))' : 'none', transition: 'all 0.14s' }}
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            </button>
                          ))}
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginLeft: '4px' }}>
                            {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][hoveredStar || ratingForm.star]}
                          </span>
                        </div>
                      </div>

                      {/* Comment */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nhận xét (tùy chọn)</label>
                        <textarea
                          value={ratingForm.comment}
                          onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))}
                          rows={3}
                          placeholder="Chia sẻ trải nghiệm thuê kho của bạn..."
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', resize: 'vertical', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: '#0f172a', lineHeight: 1.6, fontFamily: 'inherit' }}
                          onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }}
                          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>

                      {/* Submit button */}
                      <button
                        onClick={handleSubmitRating}
                        disabled={ratingSubmitting}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 28px', background: ratingSubmitting ? '#e2e8f0' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: ratingSubmitting ? '#94a3b8' : '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: ratingSubmitting ? 'wait' : 'pointer', fontSize: '0.9rem', boxShadow: ratingSubmitting ? 'none' : '0 4px 14px rgba(245,158,11,0.35)', transition: 'all 0.2s' }}
                        onMouseEnter={e => { if (!ratingSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.5)'; } }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ratingSubmitting ? 'none' : '0 4px 14px rgba(245,158,11,0.35)'; }}
                      >
                        {ratingSubmitting ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            Gửi đánh giá
                          </>
                        )}
                      </button>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                  )}
                </div>
              )}

              {/* ── Thank You Popup ── */}
              {showThankPopup && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.25s ease' }}>
                  <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)', borderRadius: '24px', padding: '3rem 2.5rem', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', border: '1px solid rgba(253,230,138,0.6)', position: 'relative' }}>
                    <button onClick={() => setShowThankPopup(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#64748b' }}>✕</button>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⭐⭐⭐⭐⭐</div>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto', boxShadow: '0 8px 24px rgba(34,197,94,0.4)' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>Cảm ơn bạn đã đánh giá!</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.8rem' }}>Đánh giá của bạn giúp cải thiện chất lượng dịch vụ. Rất trân trọng! 🙏</p>
                    <button onClick={() => setShowThankPopup(false)} style={{ padding: '12px 40px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }}>Đóng</button>
                  </div>
                  <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT: Sidebar — Rental Request Form */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '20px', alignSelf: 'start' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 30px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>

              <div style={{ marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Gửi yêu cầu thuê kho</h3>
                {warehouseData?.pricePerM2 ? (
                  <div style={{
                    background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
                    border: '1px solid #6ee7b7',
                    borderRadius: 12,
                    padding: '10px 14px',
                    marginTop: 8,
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 4,
                  }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#065f46' }}>
                      {Number(warehouseData.pricePerM2).toLocaleString('vi-VN')} đ
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>/m²/tháng</span>
                  </div>
                ) : null}
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Diện tích còn trống: <strong>{warehouse.availableArea} m²</strong></p>
              </div>

              {/* Feedback message */}
              {submitMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500,
                  marginBottom: '1rem',
                  backgroundColor: submitMsg.type === 'success' ? '#dcfce7' : '#fef2f2',
                  color: submitMsg.type === 'success' ? '#16a34a' : '#dc2626',
                  border: `1px solid ${submitMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  {submitMsg.text}
                </div>
              )}

              {/* Form fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.2rem' }}>
                <div style={fieldGroup}>
                  <label style={fieldLabel}>DIỆN TÍCH CẦN THUÊ (m²) *</label>
                  <input
                    type="number" name="requestedArea" min="1" step="0.1"
                    placeholder={`Tối đa ${warehouse.availableArea} m²`}
                    value={formData.requestedArea} onChange={handleInputChange}
                    style={fieldInput}
                  />
                </div>
                <div style={fieldGroup}>
                  <label style={fieldLabel}>NGÀY BẮT ĐẦU *</label>
                  <input
                    type="date" name="startDate" min={todayStr}
                    value={formData.startDate} onChange={handleInputChange}
                    style={fieldInput}
                  />
                </div>
                <div style={fieldGroup}>
                  <label style={fieldLabel}>THỜI HẠN THUÊ (tháng) *</label>
                  <input
                    type="number" name="durationMonths" min="1" max="60"
                    placeholder="VD: 6"
                    value={formData.durationMonths} onChange={handleInputChange}
                    style={fieldInput}
                  />
                </div>
                <div style={fieldGroup}>
                  <label style={fieldLabel}>GHI CHÚ</label>
                  <textarea
                    name="notes" rows="3"
                    placeholder="Yêu cầu đặc biệt (nếu có)"
                    value={formData.notes} onChange={handleInputChange}
                    style={{ ...fieldInput, resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Submit button */}
              {isLoggedIn ? (
                <button
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                  style={{
                    width: '100%', backgroundColor: submitting ? '#94a3b8' : '#0095c7',
                    color: '#fff', padding: '14px', borderRadius: '8px',
                    fontWeight: 700, fontSize: '1rem', border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    marginBottom: '12px', transition: 'background-color 0.2s'
                  }}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu thuê kho'}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
                  style={{
                    width: '100%', backgroundColor: '#0095c7', color: '#fff',
                    padding: '14px', borderRadius: '8px', fontWeight: 700,
                    fontSize: '1rem', border: 'none', cursor: 'pointer',
                    marginBottom: '12px',
                  }}
                >
                  Đăng nhập để gửi yêu cầu
                </button>
              )}

              {/* Owner info */}
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
            <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #dbeafe', display: 'flex', gap: '12px' }}>
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

      <footer style={{ backgroundColor: '#0f172a', padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#fff', marginBottom: '1rem', fontWeight: 800, fontSize: '1.2rem' }}>
          🏢 OWRMS
        </div>
        <p style={{ fontSize: '0.8rem' }}>© 2026 Online Warehouse Rental Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

const fieldGroup = { display: 'flex', flexDirection: 'column', gap: '6px' };
const fieldLabel = { fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' };
const fieldInput = { padding: '11px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', color: '#000' };

export default WarehouseDetailsPage;
