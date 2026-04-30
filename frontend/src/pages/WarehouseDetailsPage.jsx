import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/axiosClient';
import rentalService from '../services/rentalService';
import ratingService from '../services/ratingService';
import authService from '../services/authService';
import CustomAreaSelectorModal from '../components/warehouse/CustomAreaSelectorModal';

// ─── Floor Plan Blueprint ────────────────────────────────────────────────────
const FloorPlanView = ({ areas, warehouseData }) => {
  const [hovered, setHovered] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const whWidth  = parseFloat(warehouseData?.width  ?? warehouseData?.Width  ?? 0) || 0;
  const whLength = parseFloat(warehouseData?.length ?? warehouseData?.Length ?? 0) || 0;

  // Fit both dimensions into a max 500×380px box
  const MAX_W = 500;
  const MAX_H = 380;
  const baseScale = whWidth  > 0 ? Math.min(MAX_W / whWidth,  MAX_H / whLength) : 1;
  const scaleX = baseScale * zoomLevel;
  const scaleY = scaleX;
  const CANVAS_W = whWidth  > 0 ? Math.round(whWidth  * scaleX) : MAX_W;
  const CANVAS_H = whLength > 0 ? Math.round(whLength * scaleY) : MAX_H;

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0, marginBottom: '4px' }}>
            Sơ đồ mặt bằng ô khu
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
            Di chuột vào từng ô để xem chi tiết. Tỉ lệ dựa theo kích thước thực tế.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {whWidth > 0 && whLength > 0 && (
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
              {whWidth}m × {whLength}m
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: '6px 12px', border: '1px solid #e2e8f0', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Thu phóng:</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              style={{ cursor: 'pointer', width: 80, accentColor: '#0ea5e9' }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', minWidth: 38, textAlign: 'right' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: '#bfdbfe', border: '1.5px solid #3b82f6' }} />
          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Còn trống</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: '#fecaca', border: '1.5px solid #ef4444' }} />
          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Đang được thuê</span>
        </div>
      </div>

      <div style={{ maxWidth: '100%', overflowX: 'auto', paddingBottom: 8, display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', margin: '0 auto' }}>
          {/* Left axis (Length) */}
          <div style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginRight: 6, whiteSpace: 'nowrap' }}>
            ↕ Dài: {whLength} m
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Top axis (Width) */}
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginBottom: 4, letterSpacing: '0.03em' }}>
              ← Ngang: {whWidth} m →
            </div>

            {/* Blueprint canvas */}
            <div style={{
              position: 'relative',
              width: CANVAS_W,
              height: CANVAS_H,
              flexShrink: 0,
              background: '#f0f7ff',
              border: '2px solid #3b82f6',
              borderRadius: 10,
              overflow: 'visible',
            boxShadow: '0 4px 20px rgba(59,130,246,0.1)',
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)',
            backgroundSize: `${Math.max(scaleX * 5, 10)}px ${Math.max(scaleY * 5, 10)}px`,
          }}>
            {areas.map((a) => {
              const pw = Math.max((a.width  || 1) * scaleX, 4);
              const ph = Math.max((a.length || 1) * scaleY, 4);
              const px = (a.positionX || 0) * scaleX;
              const py = (a.positionY || 0) * scaleY;
              const occupied = a.isOccupied;
              const isHov = hovered === a.id;
              const isPortrait = pw < 50 && ph >= 60;
              return (
                <div
                  key={a.id}
                  onMouseEnter={() => setHovered(a.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position: 'absolute',
                    left: px, top: py, width: pw, height: ph,
                    background: occupied ? (isHov ? '#fca5a5' : '#fecaca') : (isHov ? '#93c5fd' : '#bfdbfe'),
                    border: occupied ? '2px dashed #ef4444' : '2px dashed #3b82f6',
                    boxSizing: 'border-box', borderRadius: 4,
                    cursor: occupied ? 'not-allowed' : 'pointer',
                    transition: 'background 0.18s',
                    overflow: isHov ? 'visible' : 'hidden', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', padding: '2px', textAlign: 'center',
                    zIndex: isHov ? 10 : 1,
                  }}
                >
                  <div style={{ fontWeight: 800, color: occupied ? '#991b1b' : '#1e3a8a', fontSize: '0.75rem', lineHeight: 1.2, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', writingMode: isPortrait ? 'vertical-rl' : 'horizontal-tb', transform: isPortrait ? 'rotate(180deg)' : 'none' }}>{a.name}</div>
                  <div style={{ fontSize: '0.65rem', color: occupied ? '#b91c1c' : '#1d4ed8', marginTop: 2, fontWeight: 700, display: pw < 50 || ph < 50 ? 'none' : 'block' }}>{a.size} m³</div>
                  <div style={{ fontSize: '0.6rem', color: occupied ? '#dc2626' : '#2563eb', marginTop: 2, display: pw < 50 || ph < 60 ? 'none' : 'block' }}>{a.width}m × {a.length}m</div>
                  {isHov && (
                    <div style={{
                      position: 'absolute',
                      top: (pw < 60 || ph < 50) ? '50%' : undefined,
                      bottom: (pw < 60 || ph < 50) ? undefined : 6,
                      left: '50%', transform: (pw < 60 || ph < 50) ? 'translate(-50%, -50%)' : 'translateX(-50%)',
                      fontSize: '0.65rem', fontWeight: 700,
                      color: occupied ? '#dc2626' : '#16a34a',
                      background: occupied ? '#fee2e2' : '#dcfce7',
                      border: `1px solid ${occupied ? '#fca5a5' : '#86efac'}`,
                      borderRadius: 4, padding: '4px 8px', whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', pointerEvents: 'none'
                    }}>
                      {occupied ? 'Đang thuê' : 'Còn trống'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Gate */}
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '10px solid #f59e0b' }} />
            <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 800, fontSize: CANVAS_W < 120 ? '0.62rem' : '0.72rem', letterSpacing: '0.04em', padding: CANVAS_W < 120 ? '5px 10px' : '6px 20px', borderRadius: 7, boxShadow: '0 3px 10px rgba(245,158,11,0.3)', maxWidth: Math.max(CANVAS_W, 60), textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.2 }}>
              {CANVAS_W < 90 ? 'CỔNG' : 'CỔNG CHÍNH VÀO KHO'}
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const WarehouseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    requestedArea: '',
    startDate: '',
    durationMonths: '',
    notes: ''
  });
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null); // chosen rental area
  const [showAreaModal, setShowAreaModal] = useState(false); // area selection modal
  const [warehouseData, setWarehouseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [showCustomAreaModal, setShowCustomAreaModal] = useState(false);
  const [customAreaData, setCustomAreaData] = useState(null); // { posX, posY, width, length, baseAreaId }
  const [showRentalSuccessPopup, setShowRentalSuccessPopup] = useState(false);
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
  const [currentRatingPage, setCurrentRatingPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const RATINGS_PER_PAGE = 5;
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

    // Fetch rental areas for this warehouse
    const fetchAreas = async () => {
      try {
        const res = await api.get(`/RentalAreas/warehouse/${id}`);
        setAreas(res.data || []);
      } catch (err) { console.error('Failed to load areas:', err); }
    };
    fetchAreas();

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
    // Frontend validation: comment bắt buộc
    if (!ratingForm.comment || !ratingForm.comment.trim()) {
      setRatingMsg({ type: 'error', text: 'Vui lòng nhập nhận xét trước khi gửi đánh giá.' });
      setTimeout(() => setRatingMsg(null), 4000);
      return;
    }
    // Validate max 500 ký tự
    if (ratingForm.comment.trim().length > 500) {
      setRatingMsg({ type: 'error', text: 'Nhận xét không được vượt quá 500 ký tự.' });
      setTimeout(() => setRatingMsg(null), 4000);
      return;
    }
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
    ownerAvatarUrl: warehouseData.ownerAvatarUrl ? `http://localhost:5276${warehouseData.ownerAvatarUrl}` : null,
  } : null;



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent entering more than available volume
    if (name === "requestedArea") {
      const numValue = parseFloat(value);
      if (numValue > warehouse?.availableArea) {
        setFormData({ ...formData, [name]: warehouse.availableArea.toString() });
        setSubmitMsg(null);
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
    setSubmitMsg(null);
  };

  // Called after user decides whether to pick an area or not
  // customArea: { posX, posY, width, length, baseAreaId } | null
  const doSubmitRequest = async (areaOverride, customArea) => {
    const chosenArea = areaOverride !== undefined ? areaOverride : selectedArea;
    const area = parseFloat(formData.requestedArea);   // Luôn dùng thể tích người thuê nhập
    const duration = parseInt(formData.durationMonths);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = formData.startDate ? new Date(formData.startDate) : null;

    if (!area || area <= 0) { setSubmitMsg({ type: 'error', text: 'Vui lòng nhập thể tích cần thuê.' }); return; }
    if (warehouse && area > warehouse.availableArea) { setSubmitMsg({ type: 'error', text: `Thể tích vượt quá thể tích còn trống (${warehouse.availableArea} m³).` }); return; }
    if (!formData.startDate) { setSubmitMsg({ type: 'error', text: 'Vui lòng chọn ngày bắt đầu.' }); return; }
    if (startDate < today) { setSubmitMsg({ type: 'error', text: 'Ngày bắt đầu phải từ hôm nay trở đi.' }); return; }
    if (!duration || duration < 1 || duration > 60) { setSubmitMsg({ type: 'error', text: 'Thời hạn thuê từ 1 đến 60 tháng.' }); return; }

    setShowAreaModal(false);
    setShowCustomAreaModal(false);
    setSubmitting(true);
    try {
      // Build the payload — include custom-area fields if renter self-arranged
      const payload = {
        warehouseId: warehouse.id,
        requestedArea: area,
        rentalAreaId: chosenArea?.id || null,
        startDate: formData.startDate,
        durationMonths: duration,
        notes: formData.notes.trim() || null,
      };

      const ca = customArea || customAreaData;
      if (ca) {
        payload.isCustomArea      = true;
        payload.proposedPositionX = ca.posX;
        payload.proposedPositionY = ca.posY;
        payload.proposedWidth     = ca.width;
        payload.proposedLength    = ca.length;
        payload.baseRentalAreaId  = ca.baseAreaId || null;

        // L-shaped extension zone
        if (ca.extensionZone) {
          payload.hasExtensionZone       = true;
          payload.extensionPositionX     = ca.extensionZone.posX;
          payload.extensionPositionY     = ca.extensionZone.posY;
          payload.extensionWidth         = ca.extensionZone.width;
          payload.extensionLength        = ca.extensionZone.length;
        }

        // Multi-zone: additional non-adjacent rectangles
        if (ca.additionalZones && ca.additionalZones.length > 0) {
          payload.additionalZonesJson = JSON.stringify(ca.additionalZones);
        }
      }

      await rentalService.createRentalRequest(payload);
      setFormData({ requestedArea: '', startDate: '', durationMonths: '', notes: '' });
      setSelectedArea(null);
      setCustomAreaData(null);
      setSubmitMsg(null);
      setShowRentalSuccessPopup(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      setSubmitMsg({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRequest = () => {
    if (!isLoggedIn) { navigate('/auth'); return; }
    // Basic validation before modal
    const duration = parseInt(formData.durationMonths);
    const today = new Date(); today.setHours(0,0,0,0);
    const startDate = formData.startDate ? new Date(formData.startDate) : null;
    if (!formData.startDate) { setSubmitMsg({ type: 'error', text: 'Vui lòng chọn ngày bắt đầu.' }); return; }
    if (startDate < today) { setSubmitMsg({ type: 'error', text: 'Ngày bắt đầu phải từ hôm nay trở đi.' }); return; }
    if (!duration || duration < 1 || duration > 60) { setSubmitMsg({ type: 'error', text: 'Thời hạn thuê từ 1 đến 60 tháng.' }); return; }

    // Always show area selection modal - renter can pick an area, draw custom, or let owner decide
    setShowAreaModal(true);
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


        {/* Image Gallery — Airbnb-style: 1 main + 2×2 grid */}
        {(() => {
          const imgs = warehouse.images;
          return (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: imgs.length > 1 ? '1.6fr 1fr' : '1fr',
                gap: '8px',
                borderRadius: '16px',
                overflow: 'hidden',
                maxHeight: '480px',
              }}>
                {/* Main image */}
                <div
                  style={{ cursor: 'zoom-in', overflow: 'hidden', minHeight: 0 }}
                  onClick={() => openLightbox(0)}
                >
                  <img src={imgs[0]} alt="Main"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>

                {/* Right 2×2 grid */}
                {imgs.length > 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '8px' }}>
                    {[1, 2, 3, 4].map((idx) => {
                      const img = imgs[idx];
                      const isLast = idx === 4;
                      const hasMore = imgs.length > 5;
                      if (!img) return null;
                      return (
                        <div
                          key={idx}
                          style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in', minHeight: 0 }}
                          onClick={() => openLightbox(idx)}
                        >
                          <img src={img} alt={`Gallery ${idx}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                          {isLast && hasMore && (
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'rgba(0,0,0,0.52)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: '1.3rem', fontWeight: 800,
                              letterSpacing: '0.02em',
                            }}>
                              +{imgs.length - 4} ảnh
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Lightbox Modal — with thumbnail strip */}
        {lightbox.open && (
          <div
            onClick={closeLightbox}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.93)',
              zIndex: 9999, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              style={{
                position: 'absolute', top: '18px', right: '22px',
                background: 'rgba(255,255,255,0.12)', border: 'none',
                color: '#fff', fontSize: '1.5rem', cursor: 'pointer',
                borderRadius: '50%', width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >✕</button>

            {/* Counter */}
            <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', fontWeight: 600 }}>
              {lightbox.index + 1} / {warehouse.images.length}
            </div>

            {/* Prev */}
            {warehouse.images.length > 1 && (
              <button
                onClick={prevImage}
                style={{
                  position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  color: '#fff', fontSize: '2rem', cursor: 'pointer',
                  borderRadius: '50%', width: 52, height: 52,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >‹</button>
            )}

            {/* Main lightbox image */}
            <img
              src={warehouse.images[lightbox.index]}
              alt={`Ảnh ${lightbox.index + 1}`}
              onClick={e => e.stopPropagation()}
              style={{ maxHeight: '72vh', maxWidth: '88vw', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
            />

            {/* Next */}
            {warehouse.images.length > 1 && (
              <button
                onClick={nextImage}
                style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  color: '#fff', fontSize: '2rem', cursor: 'pointer',
                  borderRadius: '50%', width: 52, height: 52,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >›</button>
            )}

            {/* Thumbnail strip */}
            {warehouse.images.length > 1 && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'flex', gap: '8px',
                  marginTop: '18px',
                  maxWidth: '88vw', overflowX: 'auto',
                  padding: '4px 2px',
                  scrollbarWidth: 'thin',
                }}
              >
                {warehouse.images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setLightbox(lb => ({ ...lb, index: i }))}
                    style={{
                      width: 72, height: 54, flexShrink: 0,
                      borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: lightbox.index === i ? '2.5px solid #fff' : '2.5px solid transparent',
                      opacity: lightbox.index === i ? 1 : 0.55,
                      transition: 'opacity 0.2s, border 0.2s',
                    }}
                  >
                    <img src={img} alt={`Thumb ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Main Grid: Content + Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>

          {/* LEFT: Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
              {[
                { label: "TỔNG THỂ TÍCH", value: `${warehouse.area} m³` },
                { label: "LOẠI KHO", value: warehouseData?.warehouseType || "Khác" },
                { label: "CÒN TRỐNG", value: `${warehouse.availableArea} m³` },
                { label: "GIỜ HOẠT ĐỘNG", value: warehouse.operatingHours || 'Không rõ' },
                { label: "TRẠNG THÁI", value: warehouse.status },
                {
                  label: "GIÁ THUÊ/M³/THÁNG",
                  value: warehouseData?.pricePerM2
                    ? `${Number(warehouseData.pricePerM2).toLocaleString('vi-VN')} ₫`
                    : 'Liên hệ'
                }
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: '#fff', padding: '1.5rem 0.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0095c7', marginBottom: '8px', letterSpacing: '0.04em', lineHeight: 1.4 }}>{stat.label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>Mô tả chi tiết</h2>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{warehouse.description}</p>
            </section>

            {/* ── Rental Areas Floor Plan ── */}
            {areas.length > 0 && (
              <FloorPlanView areas={areas} warehouseData={warehouseData} />
            )}
            {warehouse.lat && warehouse.lng && (
              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.2rem' }}>Xem trên bản đồ</h2>
                <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
                  {/* Open in Maps button */}
                  <a
                    href={`https://www.google.com/maps?q=${warehouse.lat},${warehouse.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: 'absolute', top: 12, left: 12, zIndex: 10,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#fff', color: '#1a73e8',
                      fontWeight: 700, fontSize: '0.88rem',
                      padding: '8px 14px', borderRadius: 10,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                      textDecoration: 'none',
                      border: '1px solid #e8eaed',
                      transition: 'box-shadow 0.2s, background 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f1f3f4'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.22)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.18)'; }}
                  >
                    Open in Maps
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                  <iframe
                    title="map"
                    width="100%" height="320"
                    style={{ border: 0, display: 'block' }}
                    src={`https://maps.google.com/maps?q=${warehouse.lat},${warehouse.lng}&z=15&output=embed`}
                  />
                </div>
              </section>
            )}

            {/* ── Rating & Review Section ── */}
            <section style={{ marginTop: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f59e0b', fontSize: '1.4rem' }}>★</span> Đánh giá & Nhận xét
              </h2>
              {ratingsData && ratingsData.totalCount > 0 ? (
                <>
                  {/* Summary Row */}
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderRadius: '16px', border: '1px solid #fde68a' }}>
                    <div style={{ textAlign: 'center', minWidth: '100px' }}>
                      <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#d97706', lineHeight: 1 }}>{ratingsData.averageStar}</div>
                      <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', margin: '6px 0' }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '1.5rem', color: s <= Math.round(ratingsData.averageStar) ? '#f59e0b' : '#e2e8f0' }}>★</span>)}
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

                  {/* Filter Controls */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                    {[
                      { val: 'ALL', label: 'Tất cả' },
                      { val: 5, label: '5 Sao' },
                      { val: 4, label: '4 Sao' },
                      { val: 3, label: '3 Sao' },
                      { val: 2, label: '2 Sao' },
                      { val: 1, label: '1 Sao' },
                      { val: 'HAS_COMMENT', label: 'Có bình luận' },
                      { val: 'HAS_REPLY', label: 'Đã phản hồi' }
                    ].map(f => (
                      <button
                        key={f.val}
                        onClick={() => { setRatingFilter(f.val); setCurrentRatingPage(1); }}
                        style={{
                          padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                          border: ratingFilter === f.val ? '1px solid #0ea5e9' : '1px solid #cbd5e1',
                          background: ratingFilter === f.val ? '#e0f2fe' : '#fff',
                          color: ratingFilter === f.val ? '#0369a1' : '#475569',
                          boxShadow: ratingFilter === f.val ? '0 2px 6px rgba(14,165,233,0.15)' : 'none'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Review Cards */}
                  {(() => {
                    const filteredRatings = ratingsData.ratings.filter(r => {
                      if (ratingFilter === 'ALL') return true;
                      if (ratingFilter === 'HAS_REPLY') return r.ownerReply && r.ownerReply.trim() !== '';
                      if (ratingFilter === 'HAS_COMMENT') return r.comment && r.comment.trim() !== '';
                      if (typeof ratingFilter === 'number') return r.star === ratingFilter;
                      return true;
                    });
                    const totalFilteredPages = Math.ceil(filteredRatings.length / RATINGS_PER_PAGE);

                    return (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {filteredRatings.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                              Không có đánh giá nào khớp với bộ lọc này.
                            </div>
                          ) : (
                            filteredRatings.slice((currentRatingPage - 1) * RATINGS_PER_PAGE, currentRatingPage * RATINGS_PER_PAGE).map(r => (
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
                                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '1.2rem', color: s <= r.star ? '#f59e0b' : '#e2e8f0' }}>★</span>)}
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
                            ))
                          )}
                        </div>
                        
                        {/* Styled Pagination Controls */}
                        {totalFilteredPages > 1 && (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '1.5rem' }}>
                            <button 
                              onClick={() => setCurrentRatingPage(p => Math.max(1, p - 1))}
                              disabled={currentRatingPage === 1}
                              style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: currentRatingPage === 1 ? '#f8fafc' : '#fff', color: currentRatingPage === 1 ? '#cbd5e1' : '#475569', cursor: currentRatingPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                            >
                              ‹ Lùi
                            </button>
                            
                            {Array.from({ length: totalFilteredPages }, (_, i) => i + 1).map(pageNum => (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentRatingPage(pageNum)}
                                style={{ 
                                  width: '32px', height: '32px', borderRadius: '8px', border: pageNum === currentRatingPage ? '1px solid #0095c7' : '1px solid #e2e8f0', 
                                  background: pageNum === currentRatingPage ? '#f0f9ff' : '#fff', 
                                  color: pageNum === currentRatingPage ? '#0369a1' : '#64748b', 
                                  cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                                  boxShadow: pageNum === currentRatingPage ? '0 0 0 1px #0095c7' : '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                              >
                                {pageNum}
                              </button>
                            ))}

                            <button 
                              onClick={() => setCurrentRatingPage(p => Math.min(totalFilteredPages, p + 1))}
                              disabled={currentRatingPage === totalFilteredPages}
                              style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: currentRatingPage === totalFilteredPages ? '#f8fafc' : '#fff', color: currentRatingPage === totalFilteredPages ? '#cbd5e1' : '#475569', cursor: currentRatingPage === totalFilteredPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                            >
                              Tiếp ›
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
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
                    <span style={{ color: '#f59e0b', fontSize: '1.2rem' }}>★</span>
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
                          {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '1.2rem', color: s <= existingMyRating.star ? '#f59e0b' : '#e2e8f0' }}>★</span>)}
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
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Nhận xét
                          <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>*</span>
                        </label>
                        <textarea
                          value={ratingForm.comment}
                          onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))}
                          rows={3}
                          maxLength={500}
                          placeholder="Chia sẻ trải nghiệm thuê kho của bạn... (bắt buộc)"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: `1.5px solid ${ratingMsg?.type === 'error' && (!ratingForm.comment || !ratingForm.comment.trim()) ? '#ef4444' : ratingForm.comment?.length > 480 ? '#f59e0b' : '#e2e8f0'}`, resize: 'vertical', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: '#0f172a', lineHeight: 1.6, fontFamily: 'inherit' }}
                          onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }}
                          onBlur={e => { e.target.style.borderColor = (!ratingForm.comment || !ratingForm.comment.trim()) ? '#ef4444' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          {ratingMsg?.type === 'error' && (!ratingForm.comment || !ratingForm.comment.trim()) && (
                            <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>⚠</span> Vui lòng nhập nhận xét trước khi gửi.
                            </div>
                          )}
                          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: (ratingForm.comment?.length || 0) > 480 ? '#ef4444' : '#94a3b8', fontWeight: 500 }}>
                            {ratingForm.comment?.length || 0}/500
                          </div>
                        </div>
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
                            <span style={{ color: '#fff', fontSize: '1.2rem' }}>★</span>
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
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f59e0b', letterSpacing: '4px' }}>★★★★★</div>
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

            {/* ── Area Selection Modal ── */}
            {showAreaModal && (() => {
              const enteredVol = parseFloat(formData.requestedArea) || 0;
              const availableAreas = areas.filter(a => !a.isOccupied);
              // Sort: available first (best-fit), then occupied at bottom
              const sortedAreas = [...areas].sort((a, b) => {
                if (a.isOccupied && !b.isOccupied) return 1;
                if (!a.isOccupied && b.isOccupied) return -1;
                const aFits = a.size >= enteredVol;
                const bFits = b.size >= enteredVol;
                if (aFits && !bFits) return -1;
                if (!aFits && bFits) return 1;
                return Math.abs(a.size - enteredVol) - Math.abs(b.size - enteredVol);
              });
              return (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 9999,
                  backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  <div style={{
                    background: '#fff', borderRadius: 20, padding: '2rem',
                    maxWidth: 520, width: '92%',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
                    maxHeight: '85vh', overflowY: 'auto',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Chọn vị trí thuê</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                          Bạn cần thuê <strong>{enteredVol} m³</strong>.
                        </p>
                      </div>
                      <button onClick={() => setShowAreaModal(false)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#64748b', flexShrink: 0 }}>✕</button>
                    </div>

                    {/* ═══ PRIMARY: Gửi nhanh — Chủ kho sắp xếp ═══ */}
                    <button
                      onClick={() => { setShowAreaModal(false); doSubmitRequest(null); }}
                      style={{
                        width: '100%', padding: '16px 20px', borderRadius: 14,
                        border: 'none',
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                        cursor: 'pointer', transition: 'all 0.18s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: '0 4px 18px rgba(14,165,233,0.35)',
                        marginBottom: '6px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(14,165,233,0.45)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(14,165,233,0.35)'; }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
                      Gửi yêu cầu nhanh — Chủ kho sẽ sắp xếp vị trí
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 1.2rem', fontStyle: 'italic' }}>
                      Cách nhanh nhất: Chủ kho sẽ chọn vị trí phù hợp cho bạn.
                    </p>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>hoặc tự chọn vị trí</span>
                      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                    </div>

                    {/* ═══ SECONDARY: Chọn ô khu có sẵn ═══ */}
                    {availableAreas.length > 0 && (
                      <>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chọn ô khu có sẵn</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
                          {sortedAreas.filter(a => !a.isOccupied).map(a => {
                            const estimatedPrice = warehouseData?.pricePerM2 ? (warehouseData.pricePerM2 * a.size) : null;
                            const fits = a.size >= enteredVol;
                            return (
                              <button
                                key={a.id}
                                onClick={() => { setSelectedArea(a); doSubmitRequest(a); }}
                                style={{
                                  padding: '12px 14px', borderRadius: 12,
                                  border: fits ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                                  background: fits ? '#f0fdf4' : '#f8fafc',
                                  cursor: 'pointer', textAlign: 'left',
                                  transition: 'all 0.15s', width: '100%',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = fits ? '#dcfce7' : '#f1f5f9'; e.currentTarget.style.borderColor = fits ? '#4ade80' : '#94a3b8'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = fits ? '#f0fdf4' : '#f8fafc'; e.currentTarget.style.borderColor = fits ? '#86efac' : '#e2e8f0'; }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{a.name}</span>
                                      {fits && <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '1px 7px', borderRadius: 6 }}>Phù hợp</span>}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>{a.size} m³ · {a.width}m × {a.length}m</div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    {estimatedPrice && (
                                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46' }}>
                                        {Number(estimatedPrice).toLocaleString('vi-VN')} ₫/th
                                      </div>
                                    )}
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 7px', borderRadius: 6 }}>Còn trống</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* ═══ TERTIARY: Tự vẽ khu (nâng cao) ═══ */}
                    <button
                      onClick={() => { setShowAreaModal(false); setShowCustomAreaModal(true); }}
                      style={{
                        width: '100%', padding: '11px 20px', borderRadius: 12,
                        border: '1.5px solid #e2e8f0', background: '#f8fafc',
                        color: '#64748b', fontWeight: 600, fontSize: '0.85rem',
                        cursor: 'pointer', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      Tự chọn vị trí trên bản đồ (nâng cao)
                    </button>
                  </div>
                </div>
              );
            })()}


            {/* ── Rental Request Success Popup ── */}
            {showRentalSuccessPopup && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.25s ease',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                  borderRadius: 24, padding: '2.5rem 2.5rem 2rem',
                  maxWidth: 440, width: '90%', textAlign: 'center',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(14,165,233,0.15)',
                  position: 'relative',
                }}>
                  <button
                    onClick={() => setShowRentalSuccessPopup(false)}
                    style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#64748b' }}
                  >
                    ✕
                  </button>

                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.2rem',
                    boxShadow: '0 8px 24px rgba(34,197,94,0.4)',
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Gửi yêu cầu thành công!
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.8rem' }}>
                    Yêu cầu thuê kho đã được gửi đến chủ kho. Chủ kho sẽ xem xét và phản hồi sớm nhất.
                  </p>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setShowRentalSuccessPopup(false)}
                      style={{
                        flex: 1, padding: '12px 20px',
                        borderRadius: 12,
                        border: '1.5px solid #e2e8f0',
                        background: '#fff', color: '#475569',
                        fontWeight: 700, fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
                    >
                      Quay lại trang kho
                    </button>
                    <button
                      onClick={() => navigate('/my-rental-requests')}
                      style={{
                        flex: 1, padding: '12px 20px',
                        borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                        transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(14,165,233,0.5)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,165,233,0.3)'; }}
                    >
                      Yêu cầu thuê kho
                    </button>
                  </div>
                </div>
                <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
              </div>
            )}

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
                    <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>/m³/tháng</span>
                  </div>
                ) : null}
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Thể tích còn trống: <strong>{warehouse.availableArea} m³</strong></p>
              </div>

              {isOwner ? (
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(to right, #f8fafc, #f1f5f9)',
                  borderRadius: '14px',
                  borderLeft: '4px solid #0ea5e9',
                  borderTop: '1px solid #e2e8f0',
                  borderRight: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '1.5rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '6px' }}>Kho thuộc sở hữu của bạn</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                    Bạn đang xem kho bãi này dưới tư cách là chủ sở hữu. Tính năng gửi yêu cầu thuê đã được ẩn đối với bạn.
                  </div>
                </div>
              ) : (
                <>
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
                    {/* Selected area badge */}
                    {selectedArea && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ô khu đã chọn</div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{selectedArea.name} — {selectedArea.size} m³</div>
                        </div>
                        <button onClick={() => setSelectedArea(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
                      </div>
                    )}
                    {!selectedArea && (
                      <div style={fieldGroup}>
                        <label style={fieldLabel}>THỂ TÍCH CẦN THUÊ (m³) *</label>
                        <input
                          type="number" name="requestedArea" min="1" step="0.1"
                          placeholder={`Tối đa ${warehouse.availableArea} m³`}
                          value={formData.requestedArea} onChange={handleInputChange}
                          style={fieldInput}
                        />
                      </div>
                    )}
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
                    <>
                      {!selectedArea && !formData.requestedArea && (
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', marginBottom: 8, fontStyle: 'italic' }}>
                          Nhập thể tích cần thuê để tiếp tục
                        </div>
                      )}
                      <button
                        onClick={handleSubmitRequest}
                        disabled={submitting || (!selectedArea && (!formData.requestedArea || parseFloat(formData.requestedArea) <= 0))}
                        style={{
                          width: '100%',
                          backgroundColor: submitting ? '#94a3b8'
                            : (!selectedArea && (!formData.requestedArea || parseFloat(formData.requestedArea) <= 0)) ? '#cbd5e1'
                            : '#0095c7',
                          color: '#fff', padding: '14px', borderRadius: '8px',
                          fontWeight: 700, fontSize: '1rem', border: 'none',
                          cursor: (submitting || (!selectedArea && (!formData.requestedArea || parseFloat(formData.requestedArea) <= 0))) ? 'not-allowed' : 'pointer',
                          marginBottom: '12px', transition: 'background-color 0.2s',
                        }}
                      >
                        {submitting ? 'Đang gửi...' : 'Gửi yêu cầu thuê kho'}
                      </button>
                    </>
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
                </>
              )}

              {/* Owner info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                {warehouse.ownerAvatarUrl ? (
                  <img src={warehouse.ownerAvatarUrl} alt="Owner" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700 }}>
                    {(warehouse.ownerName || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
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

      </div>

      <footer style={{ backgroundColor: '#0f172a', padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#fff', marginBottom: '1rem', fontWeight: 800, fontSize: '1.2rem' }}>
          OWRMS
        </div>
        <p style={{ fontSize: '0.8rem' }}>© 2026 Online Warehouse Rental Management System. All rights reserved.</p>
      </footer>

      {/* ── Custom Area Selector Modal ───────────────────────────────────── */}
      {showCustomAreaModal && (
        <CustomAreaSelectorModal
          open={showCustomAreaModal}
          onClose={() => setShowCustomAreaModal(false)}
          warehouseData={warehouseData}
          areas={areas}
          requestedM3={parseFloat(formData.requestedArea) || 0}
          onConfirm={(ca) => {
            setCustomAreaData(ca);
            setShowCustomAreaModal(false);
            // Immediately submit with the custom area data
            doSubmitRequest(null, ca);
          }}
        />
      )}
    </div>
  );
};

const fieldGroup = { display: 'flex', flexDirection: 'column', gap: '6px' };
const fieldLabel = { fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' };
const fieldInput = { padding: '11px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', color: '#000' };

export default WarehouseDetailsPage;
