import React, { useState, useEffect } from 'react';
import ratingService from '../services/ratingService';
import rentalService from '../services/rentalService';

const MyRatingsPage = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ star: 5, comment: '' });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [msg, setMsg] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // State cho tạo đánh giá mới
  const [unratedContracts, setUnratedContracts] = useState([]);
  const [createForm, setCreateForm] = useState({ star: 5, comment: '', contractId: null, warehouseId: null });
  const [createHoveredStar, setCreateHoveredStar] = useState(0);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [activeCreateContractId, setActiveCreateContractId] = useState(null);
  const [showThankPopup, setShowThankPopup] = useState(false);

  const fetchRatings = async () => {
    try {
      const data = await ratingService.getMyRatings();
      setRatings(data);
      return data;
    } catch (err) { console.error(err); return []; }
    finally { setLoading(false); }
  };

  const fetchUnratedContracts = async (existingRatings) => {
    try {
      const contracts = await rentalService.getMyContracts();
      const activeContracts = contracts.filter(
        c => c.status === 'ACTIVE' || c.status === 'EXPIRED'
      );
      // Lọc ra những hợp đồng chưa được đánh giá
      const rated = new Set((existingRatings || []).map(r => r.contractId));
      const unrated = activeContracts.filter(c => !rated.has(c.contractId));
      setUnratedContracts(unrated);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const init = async () => {
      const existing = await fetchRatings();
      await fetchUnratedContracts(existing);
    };
    init();
  }, []);

  const handleEdit = (r) => {
    setEditingId(r.ratingId);
    setEditForm({ star: r.star, comment: r.comment || '' });
    setHoveredStar(0);
  };

  const handleUpdate = async () => {
    // Validate comment bắt buộc
    if (!editForm.comment || !editForm.comment.trim()) {
      setMsg({ type: 'error', text: 'Vui lòng nhập nhận xét trước khi lưu.' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    // Validate max 500 ký tự
    if (editForm.comment.trim().length > 500) {
      setMsg({ type: 'error', text: 'Nhận xét không được vượt quá 500 ký tự.' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    try {
      await ratingService.updateRating(editingId, editForm);
      setMsg({ type: 'success', text: 'Cập nhật thành công!' });
      setEditingId(null);
      fetchRatings();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Lỗi khi cập nhật' });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await ratingService.deleteRating(deleteConfirmId);
      setDeleteConfirmId(null);
      setMsg({ type: 'success', text: 'Đã xóa đánh giá thành công!' });
      // Thông báo sidebar tăng badge lại (kho trở thành chưa đánh giá)
      window.dispatchEvent(new Event('ratingSubmitted'));
      const existing = await fetchRatings();
      await fetchUnratedContracts(existing);
    } catch (err) {
      setDeleteConfirmId(null);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Lỗi khi xóa đánh giá' });
    } finally {
      setDeleting(false);
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleOpenCreate = (contract) => {
    setActiveCreateContractId(contract.contractId);
    setCreateForm({ star: 5, comment: '', contractId: contract.contractId, warehouseId: contract.warehouseId });
    setCreateHoveredStar(0);
  };

  const handleCreateRating = async () => {
    // Validate comment bắt buộc
    if (!createForm.comment || !createForm.comment.trim()) {
      setMsg({ type: 'error', text: 'Vui lòng nhập nhận xét trước khi gửi đánh giá.' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    // Validate max 500 ký tự
    if (createForm.comment.trim().length > 500) {
      setMsg({ type: 'error', text: 'Nhận xét không được vượt quá 500 ký tự.' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    setCreateSubmitting(true);
    try {
      await ratingService.createRating({
        warehouseId: createForm.warehouseId,
        contractId: createForm.contractId,
        star: createForm.star,
        comment: createForm.comment,
      });
      setActiveCreateContractId(null);
      setShowThankPopup(true);
      // Thông báo sidebar cập nhật badge
      window.dispatchEvent(new Event('ratingSubmitted'));
      // Reload
      const existing = await fetchRatings();
      await fetchUnratedContracts(existing);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.response?.data || 'Lỗi khi gửi đánh giá' });
      setTimeout(() => setMsg(null), 4000);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // SVG star icon
  const StarIcon = ({ filled, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? '#f59e0b' : 'none'}
      stroke={filled ? '#f59e0b' : '#cbd5e1'}
      strokeWidth="1.5"
      style={{ filter: filled ? 'drop-shadow(0 2px 6px rgba(245,158,11,0.45))' : 'none', transition: 'all 0.14s' }}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmId(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}
        >
          <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem 2rem 1.8rem', maxWidth: '380px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 6px 20px rgba(220,38,38,0.1)', border: '1px solid #fee2e2', animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)', position: 'relative' }}>
            <button onClick={() => setDeleteConfirmId(null)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#94a3b8', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}>✕</button>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Xóa đánh giá?</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.6rem' }}>Hành động này không thể hoàn tác. Đánh giá của bạn sẽ bị xóa vĩnh viễn.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ flex: 1, padding: '10px 0', backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}>Hủy</button>
              <button onClick={handleDeleteConfirmed} disabled={deleting} style={{ flex: 1, padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: deleting ? '#fca5a5' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: deleting ? 'wait' : 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(220,38,38,0.3)', transition: 'all 0.2s' }}>
                {deleting ? 'Đang xóa...' : 'Xóa đánh giá'}
              </button>
            </div>
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideUp { from { opacity: 0; transform: scale(0.88) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Thank You Popup ── */}
      {showThankPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)', borderRadius: '24px', padding: '3rem 2.5rem', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', border: '1px solid rgba(253,230,138,0.6)', position: 'relative' }}>
            <button onClick={() => setShowThankPopup(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#64748b' }}>✕</button>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⭐⭐⭐⭐⭐</div>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto', boxShadow: '0 8px 24px rgba(34,197,94,0.4)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>Cảm ơn bạn đã đánh giá!</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.8rem' }}>Đánh giá của bạn giúp chúng tôi cải thiện chất lượng dịch vụ. Rất trân trọng! 🙏</p>
            <button onClick={() => setShowThankPopup(false)} style={{ padding: '12px 40px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }}>Đóng</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#f59e0b">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Đánh giá của tôi
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>Quản lý tất cả đánh giá bạn đã viết cho các kho bãi</p>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{ padding: '12px 20px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, backgroundColor: msg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: msg.type === 'success' ? '#16a34a' : '#dc2626', border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
          {msg.text}
        </div>
      )}

      {/* ── Kho chưa đánh giá ── */}
      {unratedContracts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Kho chưa được đánh giá ({unratedContracts.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {unratedContracts.map(contract => (
              <div key={contract.contractId} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #fde68a', boxShadow: '0 2px 12px rgba(245,158,11,0.08)', overflow: 'hidden' }}>
                {/* Header của kho */}
                <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: '2px' }}>
                      {contract.warehouseName || `Kho #${contract.warehouseId}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Hợp đồng: {contract.contractNumber} &nbsp;·&nbsp;
                      <span style={{ color: contract.status === 'ACTIVE' ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                        {contract.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã hết hạn'}
                      </span>
                    </div>
                  </div>
                  {activeCreateContractId !== contract.contractId ? (
                    <button
                      onClick={() => handleOpenCreate(contract)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 3px 10px rgba(245,158,11,0.3)', transition: 'all 0.2s', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 16px rgba(245,158,11,0.45)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(245,158,11,0.3)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Đánh giá ngay
                    </button>
                  ) : (
                    <button onClick={() => setActiveCreateContractId(null)} style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Thu gọn</button>
                  )}
                </div>

                {/* Form đánh giá (inline) */}
                {activeCreateContractId === contract.contractId && (
                  <div style={{ padding: '1.2rem 1.5rem 1.5rem', borderTop: '1px solid #fef3c7', backgroundColor: '#fffbeb' }}>
                    {/* Star selector */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chọn số sao</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {[1,2,3,4,5].map(s => (
                          <button
                            key={s}
                            onClick={() => setCreateForm(f => ({ ...f, star: s }))}
                            onMouseEnter={() => setCreateHoveredStar(s)}
                            onMouseLeave={() => setCreateHoveredStar(0)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', transform: (createHoveredStar >= s || createForm.star >= s) ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.14s ease', lineHeight: 1 }}
                          >
                            <svg width="32" height="32" viewBox="0 0 24 24"
                              fill={s <= (createHoveredStar || createForm.star) ? '#f59e0b' : 'none'}
                              stroke={s <= (createHoveredStar || createForm.star) ? '#f59e0b' : '#cbd5e1'}
                              strokeWidth="1.5"
                              style={{ filter: s <= (createHoveredStar || createForm.star) ? 'drop-shadow(0 2px 6px rgba(245,158,11,0.45))' : 'none', transition: 'all 0.14s' }}
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </button>
                        ))}
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginLeft: '4px' }}>
                          {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][createHoveredStar || createForm.star]}
                        </span>
                      </div>
                    </div>

                    {/* Comment */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Nhận xét <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        value={createForm.comment}
                        onChange={e => setCreateForm(f => ({ ...f, comment: e.target.value }))}
                        rows={3}
                        maxLength={500}
                        placeholder="Chia sẻ trải nghiệm thuê kho của bạn... (bắt buộc)"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', resize: 'vertical', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', color: '#0f172a', lineHeight: 1.6, fontFamily: 'inherit', backgroundColor: '#fff' }}
                        onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = (!createForm.comment || !createForm.comment.trim()) ? '#ef4444' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      />
                      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: (createForm.comment?.length || 0) > 480 ? '#ef4444' : '#94a3b8', fontWeight: 500, marginTop: '3px' }}>
                        {createForm.comment?.length || 0}/500
                      </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleCreateRating}
                        disabled={createSubmitting}
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 24px', background: createSubmitting ? '#e2e8f0' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: createSubmitting ? '#94a3b8' : '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: createSubmitting ? 'wait' : 'pointer', fontSize: '0.88rem', boxShadow: createSubmitting ? 'none' : '0 4px 14px rgba(245,158,11,0.35)', transition: 'all 0.2s' }}
                      >
                        {createSubmitting ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            Gửi đánh giá
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveCreateContractId(null)}
                        style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s' }}
                      >
                        Hủy
                      </button>
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Danh sách đánh giá đã tạo ── */}
      {ratings.length === 0 && unratedContracts.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '12px', display: 'block' }}>rate_review</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Chưa có đánh giá nào</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>Bạn có thể đánh giá kho khi xem chi tiết kho mà bạn đang hoặc đã thuê</p>
        </div>
      ) : ratings.length === 0 ? null : (
        <>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Đánh giá đã gửi ({ratings.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {ratings.map(r => (
              <div key={r.ratingId} style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {r.warehouseName || `Kho #${r.warehouseId}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      {r.updatedAt && r.updatedAt !== r.createdAt && ' (đã sửa)'}
                    </div>
                  </div>
                  {editingId !== r.ratingId && (
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[1,2,3,4,5].map(s => <StarIcon key={s} filled={s <= r.star} size={18} />)}
                    </div>
                  )}
                </div>

                {editingId === r.ratingId ? (
                  /* ── Edit Mode ── */
                  <div style={{ backgroundColor: '#fffbeb', padding: '1.4rem', borderRadius: '14px', border: '1px solid #fde68a' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chọn số sao</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setEditForm(f => ({ ...f, star: s }))} onMouseEnter={() => setHoveredStar(s)} onMouseLeave={() => setHoveredStar(0)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transform: (hoveredStar >= s || editForm.star >= s) ? 'scale(1.18)' : 'scale(1)', transition: 'transform 0.14s ease', lineHeight: 1 }}>
                            <svg width="34" height="34" viewBox="0 0 24 24" fill={s <= (hoveredStar || editForm.star) ? '#f59e0b' : 'none'} stroke={s <= (hoveredStar || editForm.star) ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.5" style={{ filter: s <= (hoveredStar || editForm.star) ? 'drop-shadow(0 2px 6px rgba(245,158,11,0.45))' : 'none', transition: 'all 0.14s' }}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </button>
                        ))}
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginLeft: '4px' }}>
                          {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][hoveredStar || editForm.star]}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Nhận xét <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea value={editForm.comment} onChange={e => setEditForm(f => ({ ...f, comment: e.target.value }))} rows={4} maxLength={500} placeholder="Chia sẻ trải nghiệm thuê kho của bạn... (bắt buộc)" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', resize: 'vertical', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: '#0f172a', lineHeight: 1.6, fontFamily: 'inherit', backgroundColor: '#fff' }} onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }} onBlur={e => { e.target.style.borderColor = (!editForm.comment || !editForm.comment.trim()) ? '#ef4444' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: (editForm.comment?.length || 0) > 480 ? '#ef4444' : '#94a3b8', fontWeight: 500, marginTop: '3px' }}>
                        {editForm.comment?.length || 0}/500
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={handleUpdate} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 28px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(245,158,11,0.35)', transition: 'all 0.2s' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Lưu
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '10px 24px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}>Hủy</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {r.comment && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '3px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>
                      </div>
                    )}
                    {r.ownerReply && (
                      <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '10px', borderLeft: '3px solid #22c55e', marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          Phản hồi từ chủ kho
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0, lineHeight: 1.5 }}>{r.ownerReply}</p>
                      </div>
                    )}
                    {r.isHidden && (
                      <div style={{ padding: '6px 12px', backgroundColor: '#fef2f2', borderRadius: '6px', display: 'inline-block', fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
                        Đánh giá này đã bị ẩn
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button onClick={() => handleEdit(r)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 16px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#dbeafe'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Sửa
                      </button>
                      <button onClick={() => setDeleteConfirmId(r.ratingId)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        Xóa
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyRatingsPage;
