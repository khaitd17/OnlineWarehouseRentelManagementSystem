import React, { useState, useEffect } from 'react';
import ratingService from '../../services/ratingService';

const PAGE_SIZE = 10;

const RatingsPage = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ star: 'all', hidden: 'all', search: '', warehouse: 'all' });
  const [msg, setMsg] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [page, setPage] = useState(1);

  const fetchRatings = async () => {
    try {
      const data = await ratingService.getAllRatings();
      setRatings(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRatings(); }, []);

  const handleToggleHide = async (id) => {
    setTogglingId(id);
    try {
      await ratingService.toggleHideRating(id);
      setRatings(prev => prev.map(r => r.ratingId === id ? { ...r, isHidden: !r.isHidden } : r));
      setMsg({ type: 'success', text: 'Cập nhật trạng thái thành công!' });
    } catch {
      setMsg({ type: 'error', text: 'Lỗi khi thay đổi trạng thái' });
    } finally {
      setTogglingId(null);
    }
    setTimeout(() => setMsg(null), 2500);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await ratingService.deleteRating(id);
      setRatings(prev => prev.filter(r => r.ratingId !== id));
      setMsg({ type: 'success', text: 'Đã xóa đánh giá!' });
      setDeleteConfirmId(null);
    } catch {
      setMsg({ type: 'error', text: 'Lỗi khi xóa' });
    } finally {
      setDeletingId(null);
    }
    setTimeout(() => setMsg(null), 2500);
  };

  // Filter
  const warehouses = [...new Set(ratings.map(r => r.warehouseName).filter(Boolean))];
  const filtered = ratings.filter(r => {
    if (filter.star !== 'all' && r.star !== parseInt(filter.star)) return false;
    if (filter.hidden === 'visible' && r.isHidden) return false;
    if (filter.hidden === 'hidden' && !r.isHidden) return false;
    if (filter.warehouse !== 'all' && r.warehouseName !== filter.warehouse) return false;
    if (filter.search) {
      const s = filter.search.toLowerCase();
      return (r.renterName || '').toLowerCase().includes(s)
        || (r.warehouseName || '').toLowerCase().includes(s)
        || (r.comment || '').toLowerCase().includes(s)
        || String(r.ratingId).includes(s);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: ratings.length,
    visible: ratings.filter(r => !r.isHidden).length,
    hidden: ratings.filter(r => r.isHidden).length,
    avg: ratings.length > 0 ? (ratings.reduce((s, r) => s + r.star, 0) / ratings.length).toFixed(1) : '0',
    visiblePct: ratings.length > 0 ? Math.round(ratings.filter(r => !r.isHidden).length / ratings.length * 100) : 0,
    hiddenPct: ratings.length > 0 ? Math.round(ratings.filter(r => r.isHidden).length / ratings.length * 100) : 0,
  };

  const avgLabel = parseFloat(stats.avg) >= 4.5 ? 'Tuyệt vời'
    : parseFloat(stats.avg) >= 4 ? 'Tốt'
    : parseFloat(stats.avg) >= 3 ? 'Khá'
    : 'Cần cải thiện';

  // Pagination range
  const getPaginationRange = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '2rem', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.8rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Quản Lý Đánh Giá</h1>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{
          padding: '12px 20px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: 600,
          backgroundColor: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: msg.type === 'success' ? '#16a34a' : '#dc2626',
          border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          animation: 'fadeIn 0.2s ease',
        }}>
          {msg.type === 'success' ? '✅ ' : '❌ '}{msg.text}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.8rem' }}>
        {/* Tổng đánh giá */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '1rem 1.1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', borderLeft: '3px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 7px', borderRadius: 20 }}>+12%</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 3 }}>Tổng đánh giá</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{stats.total.toLocaleString()}</div>
        </div>

        {/* Đang hiện */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '1rem 1.1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 7px', borderRadius: 20 }}>{stats.visiblePct}%</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 3 }}>Đang hiện</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{stats.visible.toLocaleString()}</div>
        </div>

        {/* Đã ẩn */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '1rem 1.1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', borderLeft: '3px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '2px 7px', borderRadius: 20 }}>{stats.hiddenPct}%</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 3 }}>Đã ẩn</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{stats.hidden.toLocaleString()}</div>
        </div>

        {/* Trung bình */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '1rem 1.1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '2px 7px', borderRadius: 20 }}>{avgLabel}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 3 }}>Trung bình</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{stats.avg} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>/ 5</span></div>
        </div>
      </div>

      {/* Filter + Table Card */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

        {/* Filter Bar */}
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo ID, tên người..."
              value={filter.search}
              onChange={e => { setFilter({ ...filter, search: e.target.value }); setPage(1); }}
              style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Star filter */}
          <select value={filter.star} onChange={e => { setFilter({ ...filter, star: e.target.value }); setPage(1); }}
            style={{ padding: '9px 32px 9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.85rem', cursor: 'pointer', background: '#fff', color: '#475569', fontWeight: 500 }}>
            <option value="all">Tất cả sao</option>
            {[5,4,3,2,1].map(s => <option key={s} value={s}>{s} sao</option>)}
          </select>

          {/* Status filter */}
          <select value={filter.hidden} onChange={e => { setFilter({ ...filter, hidden: e.target.value }); setPage(1); }}
            style={{ padding: '9px 32px 9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.85rem', cursor: 'pointer', background: '#fff', color: '#475569', fontWeight: 500 }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="visible">Đang hiện</option>
            <option value="hidden">Đã ẩn</option>
          </select>

          {/* Warehouse filter */}
          <select value={filter.warehouse} onChange={e => { setFilter({ ...filter, warehouse: e.target.value }); setPage(1); }}
            style={{ padding: '9px 32px 9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.85rem', cursor: 'pointer', background: '#fff', color: '#475569', fontWeight: 500, maxWidth: 200 }}>
            <option value="all">Tất cả kho</option>
            {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
          </select>

          {/* Filter button */}
          <button
            onClick={() => { setFilter({ star: 'all', hidden: 'all', search: '', warehouse: 'all' }); setPage(1); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.3)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Lọc dữ liệu
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                {['ID', 'KHO', 'NGƯỜI ĐÁNH GIÁ', 'SAO', 'NHẬN XÉT', 'TRẠNG THÁI', 'N'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textAlign: 'left', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>Không có đánh giá nào phù hợp</td></tr>
              ) : paginated.map((r, idx) => (
                <tr key={r.ratingId}
                  style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.1s', backgroundColor: deleteConfirmId === r.ratingId ? '#fef2f2' : 'transparent' }}
                  onMouseEnter={e => { if (deleteConfirmId !== r.ratingId) e.currentTarget.style.backgroundColor = '#fafbff'; }}
                  onMouseLeave={e => { if (deleteConfirmId !== r.ratingId) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* ID */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      #RV-<br/>{String(r.ratingId).padStart(4, '0')}
                    </span>
                  </td>

                  {/* Kho */}
                  <td style={{ padding: '14px 16px', minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>{r.warehouseName || `#${r.warehouseId}`}</span>
                    </div>
                  </td>

                  {/* Người đánh giá */}
                  <td style={{ padding: '14px 16px', minWidth: 130 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${(r.renterId || idx) * 47 % 360}, 65%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                        {(r.renterName || 'U')[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                        {(r.renterName || `User #${r.renterId}`)
                          .split(' ')
                          .reduce((acc, w, i, arr) => i === arr.length - 2 || i === arr.length - 1 ? [...acc, w] : acc, [])
                          .join('\n')}
                      </span>
                    </div>
                  </td>

                  {/* Sao */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="14" height="14" viewBox="0 0 24 24"
                          fill={s <= r.star ? '#f59e0b' : 'none'}
                          stroke={s <= r.star ? '#f59e0b' : '#cbd5e1'}
                          strokeWidth="1.5"
                          style={{ filter: s <= r.star ? 'drop-shadow(0 1px 3px rgba(245,158,11,0.4))' : 'none' }}
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                  </td>

                  {/* Nhận xét */}
                  <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                    {r.comment ? (
                      <span style={{ fontSize: '0.82rem', color: '#475569', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 210 }}
                        title={r.comment}>
                        "{r.comment}"
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontStyle: 'italic' }}>—</span>
                    )}
                  </td>

                  {/* Trạng thái */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                      backgroundColor: r.isHidden ? '#fef2f2' : '#f0fdf4',
                      color: r.isHidden ? '#dc2626' : '#16a34a',
                      border: `1px solid ${r.isHidden ? '#fecaca' : '#bbf7d0'}`,
                    }}>
                      {r.isHidden ? 'ẨN' : 'HIỆN'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 12px' }}>
                    {deleteConfirmId === r.ratingId ? (
                      <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                        <button
                          onClick={() => handleDelete(r.ratingId)}
                          disabled={deletingId === r.ratingId}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                        >
                          {deletingId === r.ratingId ? '...' : '✓ Xóa'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          style={{ padding: '5px 10px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontSize: '0.72rem' }}
                        >Hủy</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {/* Toggle hide */}
                        <button
                          onClick={() => handleToggleHide(r.ratingId)}
                          disabled={togglingId === r.ratingId}
                          title={r.isHidden ? 'Hiện lại' : 'Ẩn đánh giá'}
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: r.isHidden ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${r.isHidden ? '#bbf7d0' : '#fecaca'}`,
                            color: r.isHidden ? '#16a34a' : '#dc2626',
                            cursor: togglingId === r.ratingId ? 'wait' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          {togglingId === r.ratingId ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                          ) : r.isHidden ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          )}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteConfirmId(r.ratingId)}
                          title="Xóa đánh giá"
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: '#fef2f2', border: '1px solid #fecaca',
                            color: '#dc2626', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer: count + pagination */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} trong <strong>{filtered.length.toLocaleString()}</strong> đánh giá
          </span>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {getPaginationRange().map((p, i) => (
              p === '...' ? (
                <span key={`dot-${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '0.85rem' }}>...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 34, height: 34, borderRadius: 8, border: 'none',
                    background: page === p ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#f1f5f9',
                    color: page === p ? '#fff' : '#475569',
                    fontWeight: page === p ? 700 : 500,
                    cursor: 'pointer', fontSize: '0.85rem',
                    boxShadow: page === p ? '0 4px 10px rgba(37,99,235,0.3)' : 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (page !== p) e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseLeave={e => { if (page !== p) e.currentTarget.style.background = '#f1f5f9'; }}
                >
                  {p}
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default RatingsPage;
