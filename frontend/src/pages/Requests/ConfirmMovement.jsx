import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../services/axiosClient';

/* ──────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────── */
const TypeBadge = ({ type }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: '0.85rem', color: type === 'INBOUND' ? '#059669' : '#d97706' }}>
    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
      {type === 'INBOUND' ? 'south_east' : 'north_east'}
    </span>
    {type === 'INBOUND' ? 'Nhập kho' : 'Xuất kho'}
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Detail + Confirm Modal
────────────────────────────────────────────────────────────── */
const ConfirmModal = ({ req, onClose, onConfirm, loading }) => {
  const [note, setNote] = useState('');
  if (!req) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {req.type === 'INBOUND' ? '📦 Nhập kho' : '📤 Xuất kho'} • #{req.invReqId}
            </p>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>{req.warehouseName}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#9ca3af' }}>close</span>
          </button>
        </div>

        {/* Manager's assignment note */}
        {req.assignedNote && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>📋 Ghi chú từ Manager</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>{req.assignedNote}</p>
          </div>
        )}

        {/* Info */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {[
              ['Người thuê', req.renterName],
              ['Ngày tạo', req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '—'],
              ['Email', req.renterEmail],
              ['Ngày nhận', req.assignedAt ? new Date(req.assignedAt).toLocaleDateString('vi-VN') : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{k}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
          {req.notes && !req.notes.startsWith('[TỪ CHỐI]') && (
            <div style={{ marginTop: 10, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Ghi chú yêu cầu</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#374151' }}>{req.notes}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <p style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Hàng hóa ({req.items?.length || 0} mặt hàng)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {(req.items || []).map((item) => (
            <div key={item.itemId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{item.itemName}</p>
                {item.description && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>{item.description}</p>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: req.type === 'INBOUND' ? '#059669' : '#d97706' }}>
                  {req.type === 'INBOUND' ? '+' : '-'}{item.quantity.toLocaleString()} {item.unit}
                </p>
                {item.weight && <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{item.weight} kg</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Confirm Note + Button */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>Ghi chú xác nhận (tùy chọn)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Nhập ghi chú khi thực hiện..."
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: '#6b7280' }}>
              Đóng
            </button>
            <button onClick={() => onConfirm(req.invReqId, note)} disabled={loading}
              style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: loading ? '#9ca3af' : (req.type === 'INBOUND' ? '#059669' : '#d97706'), color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading && <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span>}
              {loading ? 'Đang xác nhận...' : (req.type === 'INBOUND' ? '✓ Xác nhận nhập kho' : '✓ Xác nhận xuất kho')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Main — Staff Confirm Movement
────────────────────────────────────────────────────────────── */
const ConfirmMovement = () => {
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAssigned = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/InventoryRequests/assigned-to-me', {
        params: typeFilter ? { type: typeFilter } : {},
      });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchAssigned(); }, [fetchAssigned]);

  const filtered = search
    ? requests.filter(r =>
        String(r.invReqId).includes(search) ||
        r.renterName?.toLowerCase().includes(search.toLowerCase()) ||
        r.warehouseName?.toLowerCase().includes(search.toLowerCase()) ||
        r.items?.some(i => i.itemName?.toLowerCase().includes(search.toLowerCase()))
      )
    : requests;

  const handleConfirm = async (id, note) => {
    setConfirming(true);
    try {
      await axiosClient.post(`/InventoryRequests/${id}/confirm`, { notes: note });
      showToast(`✅ Xác nhận hoàn thành yêu cầu #${id} thành công! Tồn kho đã được cập nhật.`);
      setSelectedReq(null);
      fetchAssigned();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Xác nhận thất bại.', true);
    } finally {
      setConfirming(false);
    }
  };

  const inboundCount  = requests.filter(r => r.type === 'INBOUND').length;
  const outboundCount = requests.filter(r => r.type === 'OUTBOUND').length;

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Xác nhận di chuyển hàng</h1>
        <p className="text-slate-500 text-sm mt-1">Danh sách yêu cầu nhập/xuất được Manager giao cho bạn hôm nay.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: toast.isError ? '#fee2e2' : '#d1fae5', border: `1px solid ${toast.isError ? '#fecaca' : '#a7f3d0'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ color: toast.isError ? '#dc2626' : '#059669', fontSize: 20 }}>{toast.isError ? 'error' : 'check_circle'}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: toast.isError ? '#991b1b' : '#065f46' }}>{toast.msg}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { icon: 'assignment', label: 'Nhiệm vụ hôm nay', value: requests.length, color: '#00b2d6', bg: '#e0f2fe' },
          { icon: 'south_east', label: 'Nhập kho', value: inboundCount, color: '#059669', bg: '#d1fae5' },
          { icon: 'north_east', label: 'Xuất kho', value: outboundCount, color: '#d97706', bg: '#fef3c7' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: c.color }}>{c.icon}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>{c.label}</p>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9ca3af' }}>search</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã YC, tên hàng, kho..." type="text"
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }} />
            </div>
          </div>
          {/* Type Filter */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[['', 'Tất cả'], ['INBOUND', '📦 Nhập'], ['OUTBOUND', '📤 Xuất']].map(([val, label]) => (
              <button key={val} onClick={() => setTypeFilter(val)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                  background: typeFilter === val ? '#00b2d6' : '#f8fafc', color: typeFilter === val ? '#fff' : '#6b7280', borderColor: typeFilter === val ? '#00b2d6' : '#e2e8f0' }}>
                {label}
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button onClick={fetchAssigned} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
            Làm mới
          </button>
        </div>
      </div>

      {/* Task Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite', color: '#00b2d6' }}>sync</span>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Đang tải nhiệm vụ...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '60px 0', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#d1d5db', display: 'block', marginBottom: 12 }}>assignment_turned_in</span>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#374151' }}>Không có nhiệm vụ nào</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>Bạn chưa được giao yêu cầu nào. Vui lòng chờ Manager phân công.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(req => (
            <div key={req.invReqId} style={{ background: '#fff', borderRadius: 14, border: `2px solid ${req.type === 'INBOUND' ? '#a7f3d0' : '#fde68a'}`, padding: 20, transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}>

              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Yêu cầu #{req.invReqId}</p>
                  <h3 style={{ margin: '4px 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>{req.warehouseName}</h3>
                </div>
                <TypeBadge type={req.type} />
              </div>

              {/* Info */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6b7280' }}>person</span>
                  <span style={{ fontSize: '0.83rem', color: '#374151', fontWeight: 500 }}>{req.renterName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6b7280' }}>inventory_2</span>
                  <span style={{ fontSize: '0.83rem', color: '#374151' }}>{req.totalItems} mặt hàng</span>
                </div>
                {req.assignedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6b7280' }}>schedule</span>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Nhận lúc: {new Date(req.assignedAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>

              {/* Manager note preview */}
              {req.assignedNote && (
                <div style={{ background: '#eff6ff', borderRadius: 8, padding: '8px 12px', marginBottom: 14, borderLeft: '3px solid #3b82f6' }}>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 600 }}>📋 Ghi chú Manager:</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#4b5563', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{req.assignedNote}</p>
                </div>
              )}

              {/* Items preview */}
              <div style={{ marginBottom: 16 }}>
                {(req.items || []).slice(0, 3).map(item => (
                  <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                    <span style={{ color: '#374151', fontWeight: 500 }}>{item.itemName}</span>
                    <span style={{ color: req.type === 'INBOUND' ? '#059669' : '#d97706', fontWeight: 700 }}>
                      {req.type === 'INBOUND' ? '+' : '-'}{item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
                {(req.items?.length || 0) > 3 && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>+{req.items.length - 3} mặt hàng khác...</p>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedReq(req)}
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
                  background: req.type === 'INBOUND' ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #d97706, #f59e0b)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', boxShadow: `0 3px 10px ${req.type === 'INBOUND' ? 'rgba(5,150,105,0.3)' : 'rgba(217,119,6,0.3)'}` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                {req.type === 'INBOUND' ? 'Xác nhận nhập kho' : 'Xác nhận xuất kho'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal req={selectedReq} onClose={() => setSelectedReq(null)} onConfirm={handleConfirm} loading={confirming} />
    </div>
  );
};

export default ConfirmMovement;
