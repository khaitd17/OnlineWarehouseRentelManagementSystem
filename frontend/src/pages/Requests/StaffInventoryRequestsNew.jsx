import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../../services/axiosClient';
import authService from '../../services/authService';
import { ReceiptPreviewModal } from '../../components/InventoryReceiptPDF';
import SignatureCanvas from '../../components/SignatureCanvas';

const INBOUND_COLOR  = '#10b981';
const OUTBOUND_COLOR = '#f59e0b';
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';

/* ── Status config ──────────────────────────────────────────── */
const STATUS_MAP = {
  PENDING:   { label: 'Chờ duyệt',  bg:'#fef3c7', color:'#d97706', border:'#fde68a', dot:'#f59e0b' },
  CONFIRMED: { label: 'Đã duyệt',   bg:'#dcfce7', color:'#166534', border:'#bbf7d0', dot:'#22c55e' },
  ASSIGNED:  { label: 'Đã giao',    bg:'#ede9fe', color:'#6d28d9', border:'#c4b5fd', dot:'#8b5cf6' },
  COMPLETED: { label: 'Hoàn thành', bg:'#f0fdf4', color:'#15803d', border:'#86efac', dot:'#16a34a' },
  REJECTED:  { label: 'Từ chối',    bg:'#fee2e2', color:'#dc2626', border:'#fecaca', dot:'#ef4444' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, bg:'#f1f5f9', color:'#64748b', border:'#e2e8f0', dot:'#94a3b8' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, fontSize:'0.73rem', fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>
      {s.label}
    </span>
  );
};

/* ── Verify Modal ───────────────────────────────────────────── */
const VerifyModal = ({ req, onClose, onVerify, loading }) => {
  // verifiedItems: { [itemId]: { verifiedQuantity, verifyNote, verifiedVolume, verifiedWeight } }
  const [verifiedItems, setVerifiedItems] = useState({});
  const [pdfOpen, setPdfOpen] = useState(false);

  useEffect(() => {
    if (!req) return;
    const init = {};
    (req.items || []).forEach(item => {
      init[item.itemId] = {
        verifiedQuantity: item.verifiedQuantity ?? item.quantity,
        verifyNote:       item.verifyNote ?? '',
        verifiedVolume:   item.verifiedVolume ?? '',
        verifiedWeight:   item.verifiedWeight ?? '',
      };
    });
    setVerifiedItems(init);
  }, [req]);

  if (!req) return null;

  const accent = req.type === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;

  const updateItem = (itemId, field, value) => {
    setVerifiedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const getDiscrepancy = (item) => {
    const verified = Number(verifiedItems[item.itemId]?.verifiedQuantity ?? item.quantity);
    return verified - item.quantity;
  };

  const hasAnyDiscrepancy = (req.items || []).some(item => getDiscrepancy(item) !== 0);

  const handleSubmit = () => {
    const items = (req.items || []).map(item => ({
      itemId: item.itemId,
      verifiedQuantity: Number(verifiedItems[item.itemId]?.verifiedQuantity ?? item.quantity),
      verifyNote:    verifiedItems[item.itemId]?.verifyNote || null,
      verifiedVolume: verifiedItems[item.itemId]?.verifiedVolume ? Number(verifiedItems[item.itemId].verifiedVolume) : null,
      verifiedWeight: verifiedItems[item.itemId]?.verifiedWeight ? Number(verifiedItems[item.itemId].verifiedWeight) : null,
    }));
    onVerify(req.invReqId, items);
  };

  return (
    <>
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:0, width:'100%', maxWidth:680, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
            <div>
              <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:accent }}>Xác minh hàng hóa thực tế</h2>
              <p style={{ margin:'2px 0 0', fontSize:'0.81rem', color:'#64748b' }}>
                #{req.invReqId} · {req.type === 'INBOUND' ? 'Nhập kho' : 'Xuất kho'} · {req.warehouseName}
              </p>
            </div>
          </div>

          {hasAnyDiscrepancy && (
            <div style={{ marginTop:10, padding:'8px 12px', borderRadius:8, background:'#fff7ed', border:'1px solid #fed7aa', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:'0.81rem', color:'#c2410c', fontWeight:600 }}>Phát hiện chênh lệch số lượng giữa yêu cầu và thực tế!</span>
            </div>
          )}
          <button
            onClick={() => setPdfOpen(true)}
            style={{ marginTop:10, padding:'6px 14px', borderRadius:8, border:'none', background:'#1e293b', color:'#fff', fontWeight:700, fontSize:'0.78rem', cursor:'pointer', fontFamily:'Inter,sans-serif' }}
          >
            Xem Phiếu {req.type === 'OUTBOUND' ? 'Xuất' : 'Nhập'} Kho
          </button>
        </div>

        {/* Table */}
        <div style={{ padding:'16px 28px' }}>
          <p style={{ margin:'0 0 12px', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Chi tiết từng mặt hàng ({(req.items || []).length} mặt hàng)
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {(req.items || []).map(item => {
              const verifiedQty = Number(verifiedItems[item.itemId]?.verifiedQuantity ?? item.quantity);
              const disc = verifiedQty - item.quantity;
              const discColor = disc < 0 ? '#dc2626' : disc > 0 ? '#d97706' : '#16a34a';
              const discBg    = disc < 0 ? '#fee2e2'  : disc > 0 ? '#fef3c7'  : '#dcfce7';
              const discLabel = disc === 0 ? 'Đúng số' : disc > 0 ? `+${disc} (Thừa)` : `${disc} (Thiếu)`;

              return (
                <div key={item.itemId} style={{ border:`1.5px solid ${disc !== 0 ? (disc < 0 ? '#fecaca' : '#fcd34d') : '#e2e8f0'}`, borderRadius:12, padding:'14px 16px', background: disc !== 0 ? discBg + '60' : '#f8fafc' }}>
                  {/* Item info */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <p style={{ margin:0, fontSize:'0.9rem', fontWeight:700, color:'#1e293b' }}>{item.itemName}</p>
                      {item.description && <p style={{ margin:'2px 0 0', fontSize:'0.75rem', color:'#94a3b8' }}>{item.description}</p>}
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#64748b', background:'#f1f5f9', padding:'3px 10px', borderRadius:6 }}>
                        YC: {item.quantity} {item.unit}
                      </span>
                      <span style={{ fontSize:'0.7rem', fontWeight:800, color: discColor, background: discBg, padding:'3px 10px', borderRadius:6, border:`1px solid ${discColor}30` }}>
                        {discLabel}
                      </span>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10 }}>
                    <div>
                      <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>
                        Số lượng thực <span style={{ color:'#dc2626' }}>*</span>
                      </label>
                      <input
                        type="number" min="0"
                        value={verifiedItems[item.itemId]?.verifiedQuantity ?? item.quantity}
                        onChange={e => updateItem(item.itemId, 'verifiedQuantity', e.target.value)}
                        style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:8, border:`1.5px solid ${disc !== 0 ? discColor : '#e2e8f0'}`, fontSize:'0.9rem', fontWeight:700, color:'#0f172a', outline:'none', fontFamily:'Inter,sans-serif' }}
                        onFocus={e=>e.target.style.borderColor=accent}
                        onBlur={e=>e.target.style.borderColor= disc !== 0 ? discColor : '#e2e8f0'}
                      />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>
                        Ghi chú (tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={verifiedItems[item.itemId]?.verifyNote ?? ''}
                        onChange={e => updateItem(item.itemId, 'verifyNote', e.target.value)}
                        placeholder={disc < 0 ? 'VD: Thiếu do hàng bị vỡ...' : disc > 0 ? 'VD: Giao thừa lô...' : 'VD: Đúng số lượng, hàng nguyên vẹn'}
                        style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:'0.85rem', outline:'none', fontFamily:'Inter,sans-serif' }}
                        onFocus={e=>e.target.style.borderColor=accent}
                        onBlur={e=>e.target.style.borderColor='#e2e8f0'}
                      />
                    </div>
                  </div>
                  {req.type === 'INBOUND' && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                      <div>
                        <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:'#4f46e5', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>
                          Thể tích thực tế (m³)
                        </label>
                        <input type="number" min="0" step="0.001"
                          value={verifiedItems[item.itemId]?.verifiedVolume ?? ''}
                          onChange={e => updateItem(item.itemId, 'verifiedVolume', e.target.value)}
                          placeholder={item.estimatedVolume ? `Ước tính: ${item.estimatedVolume} m³` : 'm³'}
                          style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:8, border:'1.5px solid #c7d2fe', fontSize:'0.85rem', fontWeight:600, color:'#4f46e5', outline:'none', fontFamily:'Inter,sans-serif' }}
                          onFocus={e=>e.target.style.borderColor='#6366f1'}
                          onBlur={e=>e.target.style.borderColor='#c7d2fe'}
                        />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:'#d97706', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>
                          Cân nặng thực tế (kg)
                        </label>
                        <input type="number" min="0" step="0.1"
                          value={verifiedItems[item.itemId]?.verifiedWeight ?? ''}
                          onChange={e => updateItem(item.itemId, 'verifiedWeight', e.target.value)}
                          placeholder="kg"
                          style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:8, border:'1.5px solid #fde68a', fontSize:'0.85rem', fontWeight:600, color:'#d97706', outline:'none', fontFamily:'Inter,sans-serif' }}
                          onFocus={e=>e.target.style.borderColor='#f59e0b'}
                          onBlur={e=>e.target.style.borderColor='#fde68a'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {hasAnyDiscrepancy && (
            <div style={{ marginTop:14, padding:'12px 16px', borderRadius:10, background:'#fff7ed', border:'1px solid #fed7aa' }}>
              <p style={{ margin:0, fontSize:'0.8rem', fontWeight:700, color:'#c2410c', marginBottom:4 }}>Tóm tắt chênh lệch:</p>
              {(req.items || []).filter(item => {
                const d = Number(verifiedItems[item.itemId]?.verifiedQuantity ?? item.quantity) - item.quantity;
                return d !== 0;
              }).map(item => {
                const d = Number(verifiedItems[item.itemId]?.verifiedQuantity ?? item.quantity) - item.quantity;
                return (
                  <p key={item.itemId} style={{ margin:'3px 0', fontSize:'0.8rem', color:'#92400e' }}>
                    • <strong>{item.itemName}</strong>: {d > 0 ? `Thừa ${d}` : `Thiếu ${Math.abs(d)}`} {item.unit}
                  </p>
                );
              })}
            </div>
          )}

          {/* Footer Buttons */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
            <button onClick={onClose} disabled={loading}
              style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', color:'#64748b' }}>
              Hủy
            </button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ padding:'10px 24px', borderRadius:10, border:'none',
                background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#f59e0b,#d97706)',
                color: loading ? '#94a3b8' : '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight:700, fontSize:'0.875rem', display:'flex', alignItems:'center', gap:8,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(245,158,11,0.4)' }}>
              {loading && <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>}
              {loading ? 'Đang lưu...' : 'Lưu xác minh'}
            </button>
          </div>
        </div>
      </div>
    </div>
    {pdfOpen && (
      <ReceiptPreviewModal
        data={req}
        onClose={() => setPdfOpen(false)}
      />
    )}
  </>
  );
};

/* ── Confirm Modal ──────────────────────────────────────────── */
const ConfirmModal = ({ req, onClose, onConfirm, loading }) => {
  const [notes, setNotes] = useState('');
  const [sigError, setSigError] = useState('');
  const signatureCanvasRef = useRef(null);
  if (!req) return null;
  const accent = req.type === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  const isVerified = (req.items || []).every(i => i.verifiedQuantity != null);
  const hasDiscrepancy = (req.items || []).some(i => i.verifiedQuantity != null && i.verifiedQuantity !== i.quantity);

  const handleSubmit = () => {
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
      setSigError('Vui lòng ký xác nhận trước khi hoàn thành.');
      return;
    }
    const sig = signatureCanvasRef.current.toBase64();
    onConfirm(req.invReqId, notes, sig);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:0, width:'100%', maxWidth:520, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: req.type==='INBOUND' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#f59e0b,#d97706)', padding:'20px 26px', flexShrink:0 }}>
          <p style={{ margin:0, fontSize:'1.05rem', fontWeight:800, color:'#fff' }}>
            Xác nhận {req.type === 'INBOUND' ? 'nhập kho' : 'xuất kho'}
          </p>
          <p style={{ margin:'3px 0 0', fontSize:'0.78rem', color:'rgba(255,255,255,0.85)' }}>#{req.invReqId} · {req.warehouseName}</p>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'22px 26px' }}>
          {/* Verify summary */}
          {isVerified && (
            <div style={{ background: hasDiscrepancy ? '#fff7ed' : '#f0fdf4', border:`1px solid ${hasDiscrepancy ? '#fed7aa' : '#86efac'}`, borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
              <p style={{ margin:'0 0 6px', fontSize:'0.69rem', fontWeight:700, color: hasDiscrepancy ? '#c2410c' : '#15803d', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                {hasDiscrepancy ? 'Kết quả xác minh — Có chênh lệch' : 'Kết quả xác minh — Đúng số lượng'}
              </p>
              {(req.items || []).map(item => {
                const disc = (item.verifiedQuantity ?? item.quantity) - item.quantity;
                return (
                  <div key={item.itemId} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.83rem', marginBottom:3 }}>
                    <span style={{ fontWeight:600, color:'#1e293b' }}>{item.itemName}</span>
                    <span style={{ color: disc === 0 ? '#16a34a' : disc < 0 ? '#dc2626' : '#d97706', fontWeight:700 }}>
                      {item.verifiedQuantity ?? item.quantity}/{item.quantity} {item.unit}
                      {disc !== 0 && ` (${disc > 0 ? '+' : ''}${disc})`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!isVerified && (
            <div style={{ background:'#fefce8', border:'1px solid #fde68a', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
              <p style={{ margin:0, fontSize:'0.82rem', color:'#92400e' }}>
                Bạn chưa xác minh hàng hóa. Bạn vẫn có thể xác nhận ngay — hoặc quay lại để xác minh trước.
              </p>
            </div>
          )}

          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
              Ghi chú hoàn thành (tùy chọn)
            </label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
              placeholder="VD: Hàng nhập đầy đủ, đã sắp xếp vào khu A..."
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'Inter,sans-serif' }}
              onFocus={e=>e.target.style.borderColor=accent}
              onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>

          {/* Signature */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Chữ ký thủ kho <span style={{ color:'#dc2626' }}>*</span>
              </label>
              <button onClick={() => { signatureCanvasRef.current?.clear(); setSigError(''); }}
                style={{ padding:'3px 10px', background:'transparent', border:'1px solid #e2e8f0', borderRadius:6, fontSize:'0.73rem', fontWeight:600, color:'#64748b', cursor:'pointer' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#f8fafc';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                Xóa làm lại
              </button>
            </div>
            <div style={{ border:'1.5px solid #e2e8f0', borderRadius:8, overflow:'hidden', background:'#fdfdfd' }}>
              <SignatureCanvas ref={signatureCanvasRef} canvasProps={{width: 468, height: 140}} />
            </div>
            {sigError && <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'#dc2626', fontWeight:600 }}>{sigError}</p>}
          </div>

          <button onClick={handleSubmit} disabled={loading}
            style={{ width:'100%', padding:'12px', borderRadius:10, border:'none',
              background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#22c55e,#16a34a)',
              color: loading ? '#94a3b8' : '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight:700, fontSize:'0.9rem', marginBottom:8,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(34,197,94,0.4)' }}>
            {loading && <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block', marginRight:8 }}/>}
            {loading ? 'Đang xử lý...' : 'Xác nhận hoàn thành'}
          </button>
          <button onClick={onClose} disabled={loading}
            style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background:'transparent', cursor:'pointer', fontWeight:600, fontSize:'0.82rem', color:'#94a3b8' }}
            onMouseEnter={e=>e.currentTarget.style.color='#475569'}
            onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>
            Hủy và đóng
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Detail Modal ──────────────────────────────────────────── */
const DetailModal = ({ req, onClose }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const [fullReq, setFullReq] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);

  useEffect(() => {
    if (!req) return;
    setLoadingFull(true);
    axiosClient.get(`/InventoryRequests/${req.invReqId}`)
      .then(r => setFullReq(r.data || req))
      .catch(() => setFullReq(req))
      .finally(() => setLoadingFull(false));
  }, [req?.invReqId]);

  if (!req) return null;
  const displayReq = fullReq || req;
  const accent = req.type === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;

  const items = displayReq.items || [];
  const totalQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const totalVol = items.reduce((s, i) => s + (Number(i.estimatedVolume) || 0), 0);

  return (
    <>
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.22)' }} onClick={e=>e.stopPropagation()}>
        {/* Sticky header */}
        <div style={{ padding:'18px 24px 14px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontWeight:800, color:accent, fontSize:'1rem' }}>
              {req.type==='INBOUND'?'Nhập kho':'Xuất kho'} · #{req.invReqId}
            </span>
            <StatusBadge status={req.status}/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => setPdfOpen(true)} style={{
               background:'#1e293b', border:'none', cursor:'pointer',
               padding:'6px 14px', borderRadius:8, fontSize:'0.78rem', fontWeight:700, color:'#fff', fontFamily:'Inter,sans-serif'
             }}>Xem Phiếu {req.type === 'OUTBOUND' ? 'Xuất' : 'Nhập'} Kho</button>
            <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', cursor:'pointer', padding:'6px 12px', borderRadius:8, fontSize:'0.9rem', fontWeight:700, color:'#475569' }}>✕</button>
          </div>
        </div>

        <div style={{ padding:'18px 24px' }}>
          {loadingFull && <div style={{ textAlign:'center', color:'#94a3b8', padding:'12px 0', fontSize:'0.83rem' }}>Đang tải thêm thông tin...</div>}

          {/* Basic info grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px', marginBottom:16, fontSize:'0.83rem' }}>
            <div><span style={{ color:'#94a3b8', fontWeight:600 }}>Người thuê: </span><span style={{ color:'#1e293b', fontWeight:600 }}>{displayReq.renterName || '—'}</span></div>
            <div><span style={{ color:'#94a3b8', fontWeight:600 }}>Kho: </span><span style={{ color:'#1e293b' }}>{displayReq.warehouseName || '—'}</span></div>
            <div><span style={{ color:'#94a3b8', fontWeight:600 }}>Ngày tạo: </span><span style={{ color:'#1e293b' }}>{fmtDate(displayReq.createdAt)}</span></div>
            {displayReq.scheduledDate && <div><span style={{ color:'#94a3b8', fontWeight:600 }}>Ngày dự kiến: </span><span style={{ color:'#1e293b' }}>{fmtDate(displayReq.scheduledDate)}</span></div>}
          </div>

          {displayReq.notes && (
            <div style={{ background:'#f8fafc', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.83rem', color:'#475569', border:'1px solid #f1f5f9' }}>
              {displayReq.notes}
            </div>
          )}

          {/* Items header with count */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <p style={{ margin:0, fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Danh sách hàng hóa
            </p>
            <div style={{ display:'flex', gap:8 }}>
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#475569', background:'#f1f5f9', padding:'2px 10px', borderRadius:6 }}>
                {items.length} mặt hàng
              </span>
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#475569', background:'#f1f5f9', padding:'2px 10px', borderRadius:6 }}>
                {totalQty} cái
              </span>
              {totalVol > 0 && (
                <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#4f46e5', background:'#eef2ff', padding:'2px 10px', borderRadius:6, border:'1px solid #c7d2fe' }}>
                  ~{Number(totalVol.toFixed(2)).toLocaleString('vi-VN')} m³
                </span>
              )}
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {items.map((item,i)=>(
              <div key={i} style={{ border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <p style={{ margin:0, fontWeight:700, fontSize:'0.88rem', color:'#1e293b' }}>{item.itemName}</p>
                    {item.estimatedVolume > 0 && <p style={{ margin:'3px 0 0', fontSize:'0.75rem', color:'#64748b' }}>Thể tích: <span style={{fontWeight:600, color:'#4f46e5'}}>{item.estimatedVolume} m³</span></p>}
                    {item.description && <p style={{ margin:'3px 0 0', fontSize:'0.75rem', color:'#94a3b8' }}>{item.description}</p>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    <span style={{ fontWeight:700, color:accent, fontSize:'0.9rem' }}>{item.quantity?.toLocaleString()} <span style={{ color:'#94a3b8', fontWeight:400, fontSize:'0.78rem' }}>{item.unit}</span></span>
                    {item.verifiedQuantity != null && (
                      <span style={{ fontSize:'0.72rem', fontWeight:700,
                        color: item.verifiedQuantity === item.quantity ? '#16a34a' : item.verifiedQuantity < item.quantity ? '#dc2626' : '#d97706',
                        background: item.verifiedQuantity === item.quantity ? '#dcfce7' : item.verifiedQuantity < item.quantity ? '#fee2e2' : '#fef3c7',
                        padding:'2px 8px', borderRadius:5 }}>
                        Thực tế: {item.verifiedQuantity}
                      </span>
                    )}
                  </div>
                </div>
                {item.verifyNote && (
                  <p style={{ margin:'8px 0 0', fontSize:'0.78rem', color:'#64748b', fontStyle:'italic' }}>{item.verifyNote}</p>
                )}
              </div>
            ))}
          </div>

          {/* Summary bar */}
          {items.length > 0 && (
            <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', gap:20, flexWrap:'wrap' }}>
              <div style={{ fontSize:'0.78rem' }}><span style={{ color:'#94a3b8', fontWeight:600 }}>Tổng mặt hàng: </span><span style={{ color:'#1e293b', fontWeight:700 }}>{items.length}</span></div>
              <div style={{ fontSize:'0.78rem' }}><span style={{ color:'#94a3b8', fontWeight:600 }}>Tổng số lượng: </span><span style={{ color:'#1e293b', fontWeight:700 }}>{totalQty.toLocaleString()}</span></div>
              {totalVol > 0 && <div style={{ fontSize:'0.78rem' }}><span style={{ color:'#94a3b8', fontWeight:600 }}>Tổng thể tích: </span><span style={{ color:'#4f46e5', fontWeight:700 }}>{Number(totalVol.toFixed(2)).toLocaleString('vi-VN')} m³</span></div>}
            </div>
          )}

          {displayReq.documentUrls && displayReq.documentUrls.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ margin:'0 0 10px', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Chứng từ đính kèm
              </p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {displayReq.documentUrls.map((rawUrl, i) => {
                  const ext = rawUrl.split('.').pop().toLowerCase();
                  const isImage = ['jpg','jpeg','png','webp'].includes(ext);
                  const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:5276${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`;
                  return (
                    <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, textDecoration:'none', color:'#3b82f6', fontSize:'0.8rem', fontWeight:600, transition: 'all 0.2s' }}
                       onMouseEnter={(e)=>{e.currentTarget.style.borderColor='#93c5fd'; e.currentTarget.style.background='#eff6ff';}}
                       onMouseLeave={(e)=>{e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#f8fafc';}}>
                      Tài liệu {i + 1}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {pdfOpen && (
      <ReceiptPreviewModal data={displayReq} onClose={() => setPdfOpen(false)} />
    )}
    </>
  );
};

/* ── Main Component ─────────────────────────────────────────── */
const StaffInventoryRequestsNew = ({ defaultTab = 'INBOUND' }) => {
  const [activeTab, setActiveTab]     = useState(defaultTab);
  const [data, setData]               = useState({ items:[], totalCount:0, totalPages:0 });
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseId, setWarehouseId] = useState(null);
  const [warehouses, setWarehouses]   = useState([]);
  const [viewMode, setViewMode]       = useState('all');  // 'all' | 'assigned'
  const [detailReq, setDetailReq]     = useState(null);
  const [verifyReq, setVerifyReq]     = useState(null);
  const [confirmReq, setConfirmReq]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]             = useState(null);
  const [pendingCounts, setPendingCounts] = useState({ INBOUND: 0, OUTBOUND: 0 });

  const PAGE_SIZE = 10;

  const showToast = (msg, isError=false) => {
    setToast({ msg, isError });
    setTimeout(()=>setToast(null), 4000);
  };

  // Load warehouses
  useEffect(() => {
    const ctx = authService.getWarehouseContext();
    const whs = ctx?.warehouses || [];
    setWarehouses(whs);
    if (whs.length > 0) setWarehouseId(whs[0].warehouseId);
  }, []);

  const fetchData = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);
    try {
      let res;
      if (viewMode === 'assigned') {
        res = await axiosClient.get('/InventoryRequests/assigned-to-me', {
          params: { warehouseId, type: activeTab },
        });
        const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setData({ items, totalCount: items.length, totalPages: 1 });
      } else {
        res = await axiosClient.get('/InventoryRequests', {
          params: { type: activeTab, warehouseId, status: statusFilter || undefined, page, pageSize: PAGE_SIZE },
        });
        setData(res.data || { items:[], totalCount:0, totalPages:0 });
      }
    } catch { setData({ items:[], totalCount:0, totalPages:0 }); }
    finally { setLoading(false); }
  }, [warehouseId, activeTab, viewMode, statusFilter, page]);

  const fetchBadgeCounts = useCallback(async () => {
    if (!warehouseId) return;
    try {
      const [inbound, outbound] = await Promise.all([
        axiosClient.get("/InventoryRequests", { params: { warehouseId, type: 'INBOUND', status: 'CONFIRMED', pageSize: 1 } }),
        axiosClient.get("/InventoryRequests", { params: { warehouseId, type: 'OUTBOUND', status: 'CONFIRMED', pageSize: 1 } }),
      ]);
      const countIn  = inbound.data?.totalCount ?? 0;
      const countOut = outbound.data?.totalCount ?? 0;
      setPendingCounts({ INBOUND: countIn, OUTBOUND: countOut });
      window.dispatchEvent(new Event('inventoryRequestUpdated')); // Trigger sidebar sync
    } catch (e) { console.error(e); }
  }, [warehouseId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchBadgeCounts(); }, [fetchBadgeCounts]);

  const handleVerify = async (id, items) => {
    setActionLoading(true);
    try {
      await axiosClient.post(`/InventoryRequests/${id}/verify`, { items });
      showToast(`✅ Đã lưu xác minh cho yêu cầu #${id}!`);
      setVerifyReq(null);
      fetchData();
      fetchBadgeCounts();
    } catch (err) { showToast(err?.response?.data?.message || 'Xác minh thất bại.', true); }
    finally { setActionLoading(false); }
  };

  const handleConfirm = async (id, notes, staffSignatureBase64) => {
    setActionLoading(true);
    try {
      await axiosClient.post(`/InventoryRequests/${id}/confirm`, { notes, staffSignatureBase64 });
      showToast(`Đã xác nhận hoàn thành yêu cầu #${id}!`);
      setConfirmReq(null);
      fetchData();
      fetchBadgeCounts();
    } catch (err) { showToast(err?.response?.data?.message || 'Xác nhận thất bại.', true); }
    finally { setActionLoading(false); }
  };

  // Open verify — reload request fresh để có verifiedQuantity mới nhất
  const openVerify = async (req) => {
    try {
      const res = await axiosClient.get(`/InventoryRequests/${req.invReqId}`);
      setVerifyReq(res.data || req);
    } catch { setVerifyReq(req); }
  };

  // Open confirm — reload similarly
  const openConfirm = async (req) => {
    try {
      const res = await axiosClient.get(`/InventoryRequests/${req.invReqId}`);
      setConfirmReq(res.data || req);
    } catch { setConfirmReq(req); }
  };

  const isVerified = (req) => (req.items || []).every(i => i.verifiedQuantity != null);

  const STATUS_FILTERS = [
    { key:'',          label:'Tất cả (đã duyệt)' },
    { key:'CONFIRMED', label:'Đã duyệt',    ...STATUS_MAP.CONFIRMED },
    { key:'ASSIGNED',  label:'Đã giao tôi', ...STATUS_MAP.ASSIGNED  },
    { key:'COMPLETED', label:'Hoàn thành',  ...STATUS_MAP.COMPLETED },
  ];

  const card = { background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' };
  const accent = activeTab === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;

  return (
    <div style={{ fontFamily:'Inter,sans-serif', maxWidth:1060, margin:'0 auto', paddingBottom:48 }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .staff-row:hover { background:#fafbff !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:900, color:'#0f172a', margin:'0 0 4px' }}>Xác nhận nhập/xuất kho</h1>
        <p style={{ color:'#64748b', fontSize:'0.87rem', margin:0 }}>
          Xác nhận số lượng thực tế và xác nhận hoàn thành các phiếu được giao.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ marginBottom:16, padding:'12px 18px', borderRadius:12, background: toast.isError?'#fee2e2':'#dcfce7', border:`1px solid ${toast.isError?'#fecaca':'#bbf7d0'}`, display:'flex', alignItems:'center', gap:10, animation:'slide-in 0.25s ease' }}>
          <span style={{ fontSize:'0.87rem', fontWeight:600, color: toast.isError?'#991b1b':'#166534' }}>{toast.msg}</span>
        </div>
      )}

      {/* Warehouse selector */}
      {warehouses.length > 1 && (
        <div style={{ marginBottom:16 }}>
          <select value={warehouseId??''} onChange={e=>{ setWarehouseId(Number(e.target.value)); setPage(1); }}
            style={{ padding:'8px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:'0.87rem', fontFamily:'Inter,sans-serif', background:'#f8fafc', cursor:'pointer' }}>
            {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>)}
          </select>
        </div>
      )}

      {/* View mode + Tab */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {/* Tab INBOUND/OUTBOUND */}
        {['INBOUND','OUTBOUND'].map(t => {
          const count = pendingCounts[t] || 0;
          return (
            <button key={t} onClick={()=>{ setActiveTab(t); setPage(1); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 18px', borderRadius:8,
                border:`1.5px solid ${activeTab===t ? accent : '#e2e8f0'}`,
                background: activeTab===t ? accent : '#fff',
                color: activeTab===t ? '#fff' : '#64748b', fontWeight:700, fontSize:'0.85rem', cursor:'pointer' }}>
              {t==='INBOUND' ? 'Nhập kho' : 'Xuất kho'}
              {count > 0 && (
                <span style={{
                  background: activeTab===t ? '#fff' : '#ef4444',
                  color: activeTab===t ? accent : '#fff',
                  borderRadius:999,
                  width: count > 9 ? 'auto' : 18,
                  height: 18,
                  padding: count > 9 ? '0 5px' : 0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'0.65rem', fontWeight:800, lineHeight:1,
                  boxShadow: activeTab===t ? 'none' : '0 2px 4px rgba(239,68,68,0.25)'
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}

      </div>

      {/* Status filter chips */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {STATUS_FILTERS.map(({ key, label, bg, color, dot }) => (
          <button key={key} onClick={()=>{ setStatusFilter(key); setPage(1); }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
              border:`1.5px solid ${statusFilter===key?(dot||accent):'#e2e8f0'}`,
              background: statusFilter===key ? (bg||`${accent}12`) : '#fff',
              color: statusFilter===key ? (color||accent) : '#64748b',
              fontWeight:600, fontSize:'0.78rem', cursor:'pointer' }}>
            {dot && <span style={{ width:6, height:6, borderRadius:'50%', background:dot, flexShrink:0 }}/>}
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#94a3b8' }}>Đang tải dữ liệu...</div>
        ) : data.items.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#94a3b8' }}>
            <div style={{ fontWeight:600, color:'#64748b', marginBottom:4 }}>Không có phiếu nào</div>
            <div style={{ fontSize:'0.83rem' }}>Thử thay đổi bộ lọc hoặc chọn "Tất cả phiếu kho"</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {[['Mã yêu cầu','90px'],['Người thuê','150px'],['Mặt hàng','auto'],['Trạng thái','120px'],['Xác minh','110px','center'],['Ngày tạo','100px'],['Thao tác','180px','center']].map(([h,w,align])=>(
                  <th key={h} style={{ padding:'11px 14px', textAlign:align||'left', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', whiteSpace:'nowrap', width:w }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map(req => {
                const typeAccent = req.type==='INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
                const firstItem = req.items?.[0];
                const verified = isVerified(req);
                const hasDisc = verified && (req.items||[]).some(i => i.verifiedQuantity !== i.quantity);
                const canVerify = req.status === 'ASSIGNED' || req.status === 'CONFIRMED';
                const canConfirm = req.status === 'ASSIGNED' || req.status === 'CONFIRMED';

                return (
                  <tr key={req.invReqId} className="staff-row" style={{ borderBottom:'1px solid #f1f5f9', transition:'background 0.15s' }}>
                    <td style={{ padding:'13px 14px' }}>
                      <span style={{ fontWeight:800, color:typeAccent, fontSize:'0.87rem' }}>#{req.invReqId}</span>
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <p style={{ margin:0, fontSize:'0.85rem', fontWeight:600, color:'#1e293b' }}>{req.renterName||'—'}</p>
                      <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8' }}>{req.renterEmail||''}</p>
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.85rem' }}>{firstItem?.itemName||'—'}</div>
                      {(req.items||[]).length > 1 && <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>+{req.items.length-1} mặt hàng khác</div>}
                    </td>
                    <td style={{ padding:'13px 14px' }}><StatusBadge status={req.status}/></td>
                    {/* Verify status column */}
                    <td style={{ padding:'13px 14px', textAlign:'center' }}>
                      {verified ? (
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:5,
                          padding:'3px 10px', borderRadius:6, fontSize:'0.72rem', fontWeight:700,
                          background: hasDisc ? '#fff7ed' : '#f0fdf4',
                          color: hasDisc ? '#c2410c' : '#15803d',
                          border: `1px solid ${hasDisc ? '#fed7aa' : '#86efac'}`
                        }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background: hasDisc ? '#f97316' : '#22c55e', flexShrink:0 }}/>
                          {hasDisc ? 'Chênh lệch' : 'Đã xác minh'}
                        </span>
                      ) : (
                        <span style={{ fontSize:'0.72rem', color:'#cbd5e1', fontStyle:'italic' }}>Chưa xác minh</span>
                      )}
                    </td>
                    <td style={{ padding:'13px 14px', fontSize:'0.78rem', color:'#64748b' }}>{fmtDate(req.createdAt)}</td>
                    {/* Actions */}
                    <td style={{ padding:'13px 14px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center', justifyContent:'center', minWidth: 120 }}>
                        {/* Xem chi tiết */}
                        <button onClick={()=>setDetailReq(req)}
                          style={{ width:'100%', padding:'5px 11px', border:'1.5px solid #e2e8f0', background:'#f8fafc', borderRadius:8, cursor:'pointer', color:'#475569', fontSize:'0.75rem', fontWeight:600 }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#e0f2fe';e.currentTarget.style.borderColor=INBOUND_COLOR;}}
                          onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';}}>
                          Chi tiết
                        </button>

                        <div style={{ display:'flex', gap:6, width:'100%' }}>
                          {/* Xác minh */}
                          {canVerify && (
                            <button onClick={()=>openVerify(req)}
                              style={{ flex:1, padding:'5px 0', border:`1.5px solid #fcd34d`, background:'#fefce8', borderRadius:8, cursor:'pointer', color:'#92400e', fontSize:'0.75rem', fontWeight:700, textAlign:'center' }}
                              onMouseEnter={e=>{e.currentTarget.style.background='#fef9c3';}}
                              onMouseLeave={e=>{e.currentTarget.style.background='#fefce8';}}>
                              {verified ? 'Sửa' : 'Xác minh'}
                            </button>
                          )}

                          {/* Xác nhận hoàn thành */}
                          {canConfirm && (
                            <button onClick={()=>openConfirm(req)}
                              style={{ flex:1, padding:'5px 0', border:'1.5px solid #bbf7d0', background:'#dcfce7', borderRadius:8, cursor:'pointer', color:'#166534', fontSize:'0.75rem', fontWeight:700, textAlign:'center' }}
                              onMouseEnter={e=>{e.currentTarget.style.background='#bbf7d0';}}
                              onMouseLeave={e=>{e.currentTarget.style.background='#dcfce7';}}>
                              Xác nhận
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && viewMode !== 'assigned' && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderTop:'1px solid #f1f5f9' }}>
            <span style={{ fontSize:'0.78rem', color:'#94a3b8' }}>Tổng <strong style={{ color:'#64748b' }}>{data.totalCount}</strong> phiếu</span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}
                style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:page<=1?'not-allowed':'pointer', color:page<=1?'#d1d5db':'#374151', fontSize:'0.8rem', fontWeight:600 }}>
                ← Trước
              </button>
              <span style={{ fontSize:'0.8rem', color:'#64748b', fontWeight:600 }}>{page} / {data.totalPages||1}</span>
              <button onClick={()=>setPage(p=>Math.min(data.totalPages,p+1))} disabled={page>=data.totalPages}
                style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:page>=data.totalPages?'not-allowed':'pointer', color:page>=data.totalPages?'#d1d5db':'#374151', fontSize:'0.8rem', fontWeight:600 }}>
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DetailModal req={detailReq} onClose={()=>setDetailReq(null)}/>
      <VerifyModal  req={verifyReq}  onClose={()=>setVerifyReq(null)}  onVerify={handleVerify}   loading={actionLoading}/>
      <ConfirmModal req={confirmReq} onClose={()=>setConfirmReq(null)} onConfirm={handleConfirm} loading={actionLoading}/>
    </div>
  );
};

export default StaffInventoryRequestsNew;
