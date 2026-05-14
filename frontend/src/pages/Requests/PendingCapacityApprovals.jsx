import React, { useState, useEffect, useCallback } from 'react';
import receiptNoteService from '../../services/receiptNoteService';
import axiosClient from '../../services/axiosClient';

const ACCENT = '#6366f1';

const PendingCapacityApprovals = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWh, setSelectedWh] = useState(null);
  const [pendingNotes, setPendingNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Load warehouses
  useEffect(() => {
    axiosClient.get('/warehouses/my-warehouses')
      .then(res => {
        const whs = res.data || [];
        setWarehouses(whs);
        if (whs.length > 0) setSelectedWh(whs[0].warehouseId);
      })
      .catch(() => setWarehouses([]));
  }, []);

  const fetchPending = useCallback(async () => {
    if (!selectedWh) return;
    setLoading(true);
    try {
      const res = await receiptNoteService.getPendingCapacity(selectedWh);
      setPendingNotes(res.data || []);
    } catch {
      setPendingNotes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWh]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (noteId) => {
    if (!window.confirm('Xác nhận duyệt phiếu này? Tồn kho sẽ được cập nhật ngay.')) return;
    setActionLoading(noteId);
    try {
      await receiptNoteService.approveCapacity(noteId);
      setMsg({ text: `Phiếu #${noteId} đã được duyệt thành công.`, type: 'success' });
      fetchPending();
    } catch (err) {
      setMsg({ text: err?.response?.data?.message || 'Lỗi khi duyệt phiếu.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (noteId) => {
    const reason = window.prompt('Lý do từ chối:');
    if (reason === null) return;
    setActionLoading(noteId);
    try {
      await receiptNoteService.rejectCapacity(noteId, reason);
      setMsg({ text: `Phiếu #${noteId} đã bị từ chối.`, type: 'info' });
      fetchPending();
    } catch (err) {
      setMsg({ text: err?.response?.data?.message || 'Lỗi khi từ chối phiếu.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 20px', fontFamily:'Inter,system-ui,sans-serif' }}>
      <h1 style={{ fontSize:'1.4rem', fontWeight:800, color:'#1e293b', margin:'0 0 6px' }}>
        Duyệt phiếu vượt sức chứa
      </h1>
      <p style={{ margin:'0 0 24px', fontSize:'0.85rem', color:'#64748b' }}>
        Các phiếu nhập kho vượt ngưỡng 2 m² cần sự phê duyệt của bạn trước khi tồn kho được cập nhật.
      </p>

      {/* Warehouse selector */}
      {warehouses.length > 1 && (
        <div style={{ marginBottom:20 }}>
          <select value={selectedWh || ''} onChange={e => setSelectedWh(Number(e.target.value))}
            style={{ padding:'9px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:'0.87rem', fontWeight:600, outline:'none', fontFamily:'Inter,sans-serif', cursor:'pointer', background:'#fff' }}>
            {warehouses.map(wh => (
              <option key={wh.warehouseId} value={wh.warehouseId}>{wh.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Messages */}
      {msg.text && (
        <div style={{
          padding:'10px 16px', borderRadius:10, marginBottom:16, fontSize:'0.85rem', fontWeight:600,
          background: msg.type === 'error' ? '#fef2f2' : msg.type === 'success' ? '#f0fdf4' : '#eff6ff',
          border: `1px solid ${msg.type === 'error' ? '#fecaca' : msg.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`,
          color: msg.type === 'error' ? '#dc2626' : msg.type === 'success' ? '#16a34a' : '#2563eb'
        }}>
          {msg.text}
          <button onClick={() => setMsg({ text: '', type: '' })} style={{ float:'right', background:'none', border:'none', cursor:'pointer', fontWeight:700, color:'inherit', fontSize:'1rem' }}>x</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'#94a3b8', fontSize:'0.9rem' }}>Đang tải...</div>
      ) : pendingNotes.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 20px', background:'#f8fafc', borderRadius:16, border:'1.5px solid #e2e8f0' }}>
          <div style={{ fontSize:'2rem', marginBottom:8 }}>--</div>
          <p style={{ margin:0, fontWeight:700, fontSize:'0.95rem', color:'#475569' }}>Không có phiếu nào chờ duyệt</p>
          <p style={{ margin:'4px 0 0', fontSize:'0.82rem', color:'#94a3b8' }}>Tất cả các phiếu nhập kho đều trong giới hạn sức chứa.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {pendingNotes.map(note => (
            <div key={note.receiptNoteId} style={{ background:'#fff', borderRadius:16, border:'1.5px solid #fecaca', padding:'20px 24px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <span style={{ fontWeight:800, fontSize:'0.95rem', color:'#1e293b' }}>{note.receiptCode}</span>
                  <span style={{ margin:'0 8px', color:'#cbd5e1' }}>|</span>
                  <span style={{ fontSize:'0.82rem', color:'#64748b' }}>YC #{note.invReqId} - {note.requestCode}</span>
                </div>
                <span style={{ padding:'3px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', whiteSpace:'nowrap' }}>
                  CHỜ DUYỆT
                </span>
              </div>

              {/* Info grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:'0.68rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.04em' }}>Người thuê</div>
                  <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#1e293b' }}>{note.renterName}</div>
                  <div style={{ fontSize:'0.72rem', color:'#64748b' }}>{note.renterEmail}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.68rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.04em' }}>Thủ kho</div>
                  <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#1e293b' }}>{note.staffName}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.68rem', fontWeight:600, color:'#dc2626', textTransform:'uppercase', letterSpacing:'0.04em' }}>Vượt sức chứa</div>
                  <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#dc2626' }}>+{Number(note.capacityOverflow).toFixed(2)} m²</div>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' }}>Hàng hóa</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {(note.items || []).map((item, idx) => (
                    <span key={idx} style={{ padding:'3px 10px', borderRadius:8, fontSize:'0.75rem', fontWeight:600, background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#475569' }}>
                      {item.itemName} x{item.receivedQuantity} {item.unit}
                      {item.verifiedVolume != null && <span style={{ color:'#6366f1', marginLeft:4 }}>({Number(item.verifiedVolume).toFixed(1)} m2)</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {note.notes && (
                <div style={{ padding:'8px 12px', borderRadius:8, background:'#fef2f2', fontSize:'0.78rem', color:'#991b1b', marginBottom:14, lineHeight:1.4 }}>
                  {note.notes}
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={() => handleReject(note.receiptNoteId)} disabled={actionLoading === note.receiptNoteId}
                  style={{ padding:'8px 20px', borderRadius:10, border:'1.5px solid #fecaca', background:'#fff', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', color:'#dc2626', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                  Từ chối
                </button>
                <button onClick={() => handleApprove(note.receiptNoteId)} disabled={actionLoading === note.receiptNoteId}
                  style={{ padding:'8px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', boxShadow:'0 4px 14px rgba(22,163,74,0.3)', transition:'all 0.15s' }}>
                  {actionLoading === note.receiptNoteId ? 'Đang xử lý...' : 'Duyệt & Cập nhật tồn kho'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingCapacityApprovals;
