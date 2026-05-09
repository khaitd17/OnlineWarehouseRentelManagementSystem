import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../services/axiosClient';
import authService from '../../services/authService';
import { ReceiptPreviewModal } from '../../components/InventoryReceiptPDF';
import SignatureCanvas from '../../components/SignatureCanvas';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const INBOUND_COLOR  = '#0ea5e9';
const OUTBOUND_COLOR = '#f59e0b';
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';

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
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999,
      fontSize:'0.73rem', fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>
      {s.label}
    </span>
  );
};

/* ── Approve Modal ────────────────────────────────────────────────── */
const ApproveModal = ({ req, onClose, onApprove, loading }) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const signatureCanvasRef = useRef(null);
  if (!req) return null;
  const accent    = req.type === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  const typeLabel = req.type === 'INBOUND' ? 'nhập kho' : 'xuất kho';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.22)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: req.type==='INBOUND' ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : 'linear-gradient(135deg,#f59e0b,#d97706)', padding:'20px 26px', flexShrink: 0 }}>
          <p style={{ margin:0, fontSize:'1.05rem', fontWeight:800, color:'#fff' }}>Duyệt yêu cầu {typeLabel}</p>
          <p style={{ margin:'3px 0 0', fontSize:'0.78rem', color:'rgba(255,255,255,0.8)' }}>#{req.invReqId} · {req.warehouseName}</p>
        </div>

        <div style={{ padding:'22px 26px', overflowY: 'auto', flex: 1 }}>
          {/* Confirmation note */}
          <div style={{ padding:'10px 14px', borderRadius:8, background:'#f0fdf4', border:'1px solid #bbf7d0', marginBottom:16, fontSize:'0.82rem', color:'#166534', fontWeight:600 }}>
            {req.type === 'INBOUND'
              ? 'Xác nhận duyệt yêu cầu. Để xem chi tiết sức chứa hợp đồng, hãy xem chi tiết phiếu trước.'
              : 'Xác nhận duyệt yêu cầu xuất kho. Hàng hóa sẽ được bàn giao cho nhân viên kho thực hiện kiểm đếm và xuất.'
            }
          </div>

          {/* Items summary */}
          <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', marginBottom:16, border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:'0.69rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Danh sách hàng hóa</span>
              {req.type === 'INBOUND' && req.totalEstimatedVolume > 0 && (
                <span style={{ fontSize:'0.73rem', fontWeight:700, color:'#4f46e5', background:'#eef2ff', padding:'2px 8px', borderRadius:6, border:'1px solid #c7d2fe' }}>
                  ~{req.totalEstimatedVolume.toFixed(2)} m³
                </span>
              )}
            </div>
            {(req.items || []).map((item, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.84rem', padding:'5px 0', borderBottom: i < req.items.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                <div>
                  <span style={{ fontWeight:600, color:'#1e293b' }}>{item.itemName}</span>
                  {item.estimatedVolume > 0 && (
                    <span style={{ fontSize:'0.72rem', color:'#64748b', marginLeft:6 }}>~{item.estimatedVolume} m³</span>
                  )}
                </div>
                <span style={{ color:accent, fontWeight:700 }}>{item.quantity?.toLocaleString()} {item.unit}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
              Ghi chú (tùy chọn)
            </label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
              placeholder="VD: Ưu tiên xử lý trước 16h..."
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'Inter,sans-serif' }}
              onFocus={e=>e.target.style.borderColor=accent}
              onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>

          {/* Signature */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Chữ ký xác nhận <span style={{ color:'#dc2626' }}>*</span>
              </label>
              <button onClick={() => { signatureCanvasRef.current?.clear(); setError(''); }}
                style={{ padding:'3px 10px', background:'transparent', border:'1px solid #e2e8f0', borderRadius:6, fontSize:'0.73rem', fontWeight:600, color:'#64748b', cursor:'pointer' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#f8fafc';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                Xóa làm lại
              </button>
            </div>
            <div style={{ border:'1.5px solid #e2e8f0', borderRadius:8, overflow:'hidden', background:'#fdfdfd' }}>
              <SignatureCanvas ref={signatureCanvasRef} canvasProps={{width: 468, height: 140}} />
            </div>
            {error && <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'#dc2626', fontWeight:600 }}>{error}</p>}
          </div>

          {/* Actions */}
          <button onClick={() => {
              if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
                setError('Vui lòng ký xác nhận trước khi duyệt.');
                return;
              }
              const signatureBase64 = signatureCanvasRef.current.toBase64();
              onApprove(req.invReqId, 'approve', notes, signatureBase64);
            }} disabled={loading}
            style={{ width:'100%', padding:'12px', borderRadius:10, border:'none',
              background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#22c55e,#16a34a)',
              color: loading ? '#94a3b8' : '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight:700, fontSize:'0.9rem', marginBottom:8,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(34,197,94,0.35)' }}>
            {loading ? 'Đang xử lý...' : 'Duyệt yêu cầu'}
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

/* ── Reject Modal ──────────────────────────────────────────────────── */
const RejectModal = ({ req, onClose, onReject, loading }) => {
  const [reason, setReason] = useState('');
  if (!req) return null;
  const typeLabel = req.type === 'INBOUND' ? 'nhập kho' : 'xuất kho';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:480, boxShadow:'0 32px 80px rgba(0,0,0,0.22)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)', padding:'20px 26px' }}>
          <p style={{ margin:0, fontSize:'1.05rem', fontWeight:800, color:'#fff' }}>Từ chối yêu cầu {typeLabel}</p>
          <p style={{ margin:'3px 0 0', fontSize:'0.78rem', color:'rgba(255,255,255,0.8)' }}>#{req.invReqId} · {req.warehouseName}</p>
        </div>

        <div style={{ padding:'22px 26px' }}>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
              Lý do từ chối <span style={{ color:'#dc2626' }}>*</span>
            </label>
            <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={4}
              placeholder="VD: Kho đang đầy, chưa có ô trống phù hợp..."
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:8, border:`1.5px solid ${!reason ? '#fca5a5' : '#e2e8f0'}`, fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'Inter,sans-serif' }}
              onFocus={e=>e.target.style.borderColor='#ef4444'}
              onBlur={e=>e.target.style.borderColor=!reason?'#fca5a5':'#e2e8f0'}/>
            {!reason && <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'#dc2626' }}>Vui lòng nhập lý do từ chối</p>}
          </div>

          <button onClick={() => reason && onReject(req.invReqId, 'reject', reason)} disabled={loading || !reason}
            style={{ width:'100%', padding:'12px', borderRadius:10, border:'none',
              background: loading || !reason ? '#e2e8f0' : 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: loading || !reason ? '#94a3b8' : '#fff', cursor: loading || !reason ? 'not-allowed' : 'pointer',
              fontWeight:700, fontSize:'0.9rem', marginBottom:8,
              boxShadow: loading || !reason ? 'none' : '0 4px 14px rgba(239,68,68,0.35)' }}>
            {loading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
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

/* ── Detail Modal ───────────────────────────────────────────────────── */
const DetailModal = ({ req, onClose }) => {
  const [capacity, setCapacity]     = useState(null);
  const [loadingCap, setLoadingCap] = useState(false);
  const [pdfOpen, setPdfOpen]       = useState(false);

  useEffect(() => {
    if (!req || req.type !== 'INBOUND') { setCapacity(null); return; }
    setLoadingCap(true);
    axiosClient.get('/rental-contracts/renter-capacity', {
      params: { renterId: req.renterId, warehouseId: req.warehouseId }
    })
      .then(r => setCapacity(r.data))
      .catch(() => setCapacity(null))
      .finally(() => setLoadingCap(false));
  }, [req?.invReqId]);

  if (!req) return null;
  const accent = req.type === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;

  const reqVolumeM3   = req.totalEstimatedVolume || 0;
  const currentM3     = capacity?.currentVolumeM3 ?? 0;
  const remainingM3   = capacity?.remainingM3 ?? Math.max(0, (capacity?.contractedAreaM3 ?? 0) - currentM3);
  const afterVolumeM3 = capacity ? currentM3 + reqVolumeM3 : null;
  const afterPct      = capacity?.contractedAreaM3 > 0 ? Math.round(afterVolumeM3 / capacity.contractedAreaM3 * 100) : null;
  const capColor      = afterPct >= 100 ? '#dc2626' : afterPct >= 80 ? '#d97706' : '#16a34a';

  return (
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
          {/* Basic info grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px', marginBottom:16, fontSize:'0.83rem' }}>
            <div><span style={{ color:'#94a3b8', fontWeight:600 }}>Người thuê: </span><span style={{ color:'#1e293b', fontWeight:600 }}>{req.renterName || '—'}</span></div>
            <div><span style={{ color:'#94a3b8', fontWeight:600 }}>Kho: </span><span style={{ color:'#1e293b' }}>{req.warehouseName || '—'}</span></div>
            <div><span style={{ color:'#94a3b8', fontWeight:600 }}>Ngày tạo: </span><span style={{ color:'#1e293b' }}>{fmtDate(req.createdAt)}</span></div>
            {req.scheduledDate && <div><span style={{ color:'#94a3b8', fontWeight:600 }}>Ngày dự kiến: </span><span style={{ color:'#1e293b' }}>{fmtDate(req.scheduledDate)}</span></div>}
          </div>

          {req.notes && (
            <div style={{ background:'#f8fafc', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.83rem', color:'#475569', border:'1px solid #f1f5f9' }}>
              {req.notes}
            </div>
          )}

          {/* Capacity (INBOUND only) */}
          {req.type === 'INBOUND' && (
            <div style={{ background:'#f8fafc', borderRadius:10, padding:'14px 16px', marginBottom:16, border:'1px solid #e2e8f0' }}>
              <p style={{ margin:'0 0 10px', fontSize:'0.69rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Sức chứa hợp đồng của người thuê
              </p>
              {loadingCap ? (
                <p style={{ margin:0, fontSize:'0.82rem', color:'#94a3b8' }}>Đang tải thông tin hợp đồng...</p>
              ) : capacity && capacity.hasContract ? (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px', fontSize:'0.82rem', marginBottom:12 }}>
                    <div><span style={{ color:'#94a3b8' }}>Thể tích HĐ: </span><span style={{ fontWeight:700, color:'#1e293b' }}>{capacity.contractedAreaM3?.toLocaleString('vi-VN')} m³</span></div>
                    <div><span style={{ color:'#94a3b8' }}>Đang lưu kho: </span><span style={{ fontWeight:700, color:'#c2410c' }}>{currentM3.toFixed(2)} m³</span></div>
                    <div>
                      <span style={{ color:'#94a3b8' }}>Còn có thể nhập: </span>
                      <span style={{ fontWeight:700, color: remainingM3 <= 0 ? '#dc2626' : '#15803d' }}>
                        {remainingM3.toFixed(2)} m³
                      </span>
                    </div>
                    <div><span style={{ color:'#94a3b8' }}>Yêu cầu này: </span><span style={{ fontWeight:700, color:accent }}>+{reqVolumeM3.toFixed(2)} m³</span></div>
                  </div>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'#94a3b8', marginBottom:4 }}>
                      <span>Hiện tại: {capacity.usagePercent}%</span>
                      <span style={{ color: capColor, fontWeight:700 }}>Nếu duyệt: {afterPct !== null ? afterPct + '%' : '—'}</span>
                    </div>
                    <div style={{ background:'#e2e8f0', borderRadius:999, height:8, overflow:'hidden', position:'relative' }}>
                      <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${Math.min(capacity.usagePercent, 100)}%`, background:'#93c5fd', borderRadius:999 }}/>
                      {afterPct !== null && <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${Math.min(afterPct, 100)}%`, background: capColor, borderRadius:999, opacity:0.7 }}/>}
                    </div>
                  </div>
                  {afterPct > 100 && (
                    <div style={{ marginTop:8, padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:'0.78rem', color:'#dc2626', fontWeight:600 }}>
                      Nếu duyệt, người thuê sẽ vượt giới hạn thể tích ({afterPct}%). Cân nhắc kỹ trước khi duyệt.
                    </div>
                  )}
                  {afterPct > 80 && afterPct <= 100 && (
                    <div style={{ marginTop:8, padding:'8px 12px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, fontSize:'0.78rem', color:'#b45309', fontWeight:600 }}>
                      Gần đầy sức chứa ({afterPct}%). Xem xét kỹ trước khi duyệt.
                    </div>
                  )}
                </>
              ) : (
                <p style={{ margin:0, fontSize:'0.82rem', color:'#ef4444', fontWeight:600 }}>Không tìm thấy hợp đồng hiệu lực của người thuê này trong kho này.</p>
              )}
            </div>
          )}

          {/* Items list */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <p style={{ margin:0, fontSize:'0.69rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Danh sách hàng hóa ({(req.items||[]).length} mặt hàng)
            </p>
            {req.type === 'INBOUND' && req.totalEstimatedVolume > 0 && (
              <span style={{ fontSize:'0.73rem', fontWeight:700, color:'#4f46e5', background:'#eef2ff', padding:'3px 10px', borderRadius:8, border:'1px solid #c7d2fe' }}>
                Tổng thể tích: ~{req.totalEstimatedVolume.toFixed(2)} m³
              </span>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(req.items||[]).map((item,i)=>(
              <div key={i} style={{ border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ margin:0, fontWeight:700, fontSize:'0.88rem', color:'#1e293b' }}>{item.itemName}</p>
                  <div style={{ display:'flex', gap:10, marginTop:3 }}>
                    {item.estimatedVolume > 0 && <p style={{ margin:0, fontSize:'0.75rem', color:'#6366f1', fontWeight:600 }}>Thể tích: ~{item.estimatedVolume} m³</p>}
                    {item.weight != null && <p style={{ margin:0, fontSize:'0.75rem', color:'#64748b' }}>Trọng lượng: <span style={{fontWeight:600}}>{item.weight} kg</span></p>}
                  </div>
                  {item.description && <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'#94a3b8' }}>{item.description}</p>}
                </div>
                <span style={{ fontWeight:700, color:accent, fontSize:'0.9rem' }}>{item.quantity?.toLocaleString()} <span style={{ color:'#94a3b8', fontWeight:400, fontSize:'0.78rem' }}>{item.unit}</span></span>
              </div>
            ))}
          </div>

          {/* Documents */}
          {req.documentUrls && req.documentUrls.length > 0 && (
            <div style={{ marginTop:20 }}>
              <p style={{ margin:'0 0 10px', fontSize:'0.69rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Chứng từ đính kèm
              </p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {req.documentUrls.map((rawUrl, i) => {
                  const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:5276${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`;
                  return (
                    <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer"
                       style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, textDecoration:'none', color:'#3b82f6', fontSize:'0.8rem', fontWeight:600 }}
                       onMouseEnter={e=>{e.currentTarget.style.borderColor='#93c5fd'; e.currentTarget.style.background='#eff6ff';}}
                       onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#f8fafc';}}>
                      Tài liệu {i + 1}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {pdfOpen && <ReceiptPreviewModal data={req} onClose={() => setPdfOpen(false)} />}
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────────────── */
const ManagerInventoryRequests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]   = useState('INBOUND');
  const [data, setData]             = useState({ items:[], totalCount:0, totalPages:0 });
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [warehouseId, setWarehouseId] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [detailReq, setDetailReq]   = useState(null);
  const [approveReq, setApproveReq] = useState(null);
  const [rejectReq, setRejectReq]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]           = useState(null);
  const [pendingCounts, setPendingCounts] = useState({ INBOUND: 0, OUTBOUND: 0 });

  const PAGE_SIZE = 10;

  const showToast = (msg, isError=false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

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
      const res = await axiosClient.get('/InventoryRequests', {
        params: { type: activeTab, warehouseId, status: statusFilter || undefined, page, pageSize: PAGE_SIZE },
      });
      setData(res.data || { items:[], totalCount:0, totalPages:0 });
    } catch { setData({ items:[], totalCount:0, totalPages:0 }); }
    finally { setLoading(false); }
  }, [warehouseId, activeTab, statusFilter, page]);

  const fetchBadgeCounts = useCallback(async () => {
    if (!warehouseId) return;
    try {
      const [inbound, outbound] = await Promise.all([
        axiosClient.get("/InventoryRequests", { params: { type: 'INBOUND', status: 'PENDING', warehouseId, pageSize: 1 } }),
        axiosClient.get("/InventoryRequests", { params: { type: 'OUTBOUND', status: 'PENDING', warehouseId, pageSize: 1 } }),
      ]);
      setPendingCounts({ INBOUND: inbound.data?.totalCount ?? 0, OUTBOUND: outbound.data?.totalCount ?? 0 });
      window.dispatchEvent(new Event('inventoryRequestUpdated'));
    } catch (e) { console.error(e); }
  }, [warehouseId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchBadgeCounts(); }, [fetchBadgeCounts]);

  const handleAction = async (id, action, noteOrReason, signatureBase64) => {
    setActionLoading(true);
    try {
      if (action === 'approve') {
        const payload = { note: noteOrReason };
        if (signatureBase64) payload.managerSignatureBase64 = signatureBase64;
        await axiosClient.post(`/InventoryRequests/${id}/approve`, payload);
        showToast(`Đã duyệt yêu cầu #${id}. Nhân viên sẽ tự động nhận nhiệm vụ.`);
        setApproveReq(null);
      } else {
        await axiosClient.post(`/InventoryRequests/${id}/reject`, { reason: noteOrReason });
        showToast(`Đã từ chối yêu cầu #${id}.`);
        setRejectReq(null);
      }
      fetchData();
      fetchBadgeCounts();
    } catch (err) {
      showToast(err?.response?.data?.message || `${action === 'approve' ? 'Duyệt' : 'Từ chối'} thất bại.`, true);
    } finally { setActionLoading(false); }
  };

  const STATUS_FILTERS = [
    { key:'',          label:'Tất cả' },
    { key:'PENDING',   label:'Chờ duyệt',  ...STATUS_MAP.PENDING   },
    { key:'CONFIRMED', label:'Đã duyệt',   ...STATUS_MAP.CONFIRMED },
    { key:'REJECTED',  label:'Từ chối',    ...STATUS_MAP.REJECTED  },
    { key:'ASSIGNED',  label:'Đã giao',    ...STATUS_MAP.ASSIGNED  },
    { key:'COMPLETED', label:'Hoàn thành', ...STATUS_MAP.COMPLETED },
  ];

  const accent = activeTab === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  const card   = { background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' };

  return (
    <div style={{ fontFamily:'Inter,sans-serif', maxWidth:1060, margin:'0 auto', paddingBottom:48 }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .mgr-row:hover { background:#fafbff !important; }
      `}</style>

      {/* Page Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:900, color:'#0f172a', margin:'0 0 4px' }}>Duyệt yêu cầu nhập / xuất kho</h1>
        <p style={{ color:'#64748b', fontSize:'0.87rem', margin:0 }}>
          Xem xét và phê duyệt các phiếu yêu cầu từ người thuê. Sau khi duyệt, nhân viên kho sẽ tự động nhận nhiệm vụ.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ marginBottom:16, padding:'12px 18px', borderRadius:10, background: toast.isError?'#fee2e2':'#dcfce7', border:`1px solid ${toast.isError?'#fecaca':'#bbf7d0'}`, animation:'slide-in 0.25s ease' }}>
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

      {/* Tab INBOUND / OUTBOUND */}
      <div style={{ display:'flex', gap:8, padding:'10px 14px', borderRadius:12, background: activeTab==='INBOUND'?'#e0f2fe':'#fffbeb', border:`1.5px solid ${accent}30`, marginBottom:16, alignItems:'center' }}>
        <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#64748b', marginRight:4 }}>Loại yêu cầu:</span>
        {['INBOUND','OUTBOUND'].map(t => {
          const count = pendingCounts[t] || 0;
          return (
            <button key={t} onClick={()=>{ setActiveTab(t); setPage(1); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 18px', borderRadius:8,
                border:`1.5px solid ${activeTab===t ? accent : '#e2e8f0'}`,
                background: activeTab===t ? accent : '#fff',
                color: activeTab===t ? '#fff' : '#64748b', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', transition:'all 0.18s' }}>
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
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 13px', borderRadius:20,
              border:`1.5px solid ${statusFilter===key?(dot||accent):'#e2e8f0'}`,
              background: statusFilter===key ? (bg||`${accent}18`) : '#fff',
              color: statusFilter===key ? (color||accent) : '#64748b',
              fontWeight:600, fontSize:'0.78rem', cursor:'pointer', transition:'all 0.15s' }}>
            {dot && <span style={{ width:6, height:6, borderRadius:'50%', background:dot, flexShrink:0 }}/>}
            {label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div style={card}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#94a3b8', fontSize:'0.87rem' }}>Đang tải dữ liệu...</div>
        ) : data.items.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <div style={{ fontWeight:700, color:'#64748b', marginBottom:4 }}>Không có phiếu nào</div>
            <div style={{ fontSize:'0.83rem', color:'#94a3b8' }}>Thử thay đổi bộ lọc hoặc chờ người thuê tạo yêu cầu mới</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {[['#ID','60px'],['Người thuê','165px'],['Hàng hóa','auto'],['Kho','130px'],['Ngày dự kiến','115px'],['Trạng thái','120px'],['Thao tác','170px','center']].map(([h,w,align])=>(
                  <th key={h} style={{ padding:'11px 14px', textAlign:align||'left', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.07em', whiteSpace:'nowrap', width:w }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map(req => {
                const typeAccent = req.type==='INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
                const firstItem  = req.items?.[0];
                const canApprove = req.status === 'PENDING';

                return (
                  <tr key={req.invReqId} className="mgr-row" style={{ borderBottom:'1px solid #f1f5f9', transition:'background 0.15s' }}>
                    <td style={{ padding:'13px 14px' }}>
                      <span style={{ fontWeight:800, color:typeAccent, fontSize:'0.87rem' }}>#{req.invReqId}</span>
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <p style={{ margin:0, fontSize:'0.85rem', fontWeight:600, color:'#1e293b' }}>{req.renterName||'—'}</p>
                      <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8' }}>{req.renterEmail||''}</p>
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.85rem' }}>{firstItem?.itemName||'—'}</div>
                      {(req.items||[]).length > 1 && <div style={{ fontSize:'0.72rem', color:typeAccent, fontWeight:600, marginTop:2 }}>+{req.items.length-1} mặt hàng khác</div>}
                    </td>
                    <td style={{ padding:'13px 14px', fontSize:'0.82rem', color:'#475569' }}>{req.warehouseName||'—'}</td>
                    <td style={{ padding:'13px 14px', fontSize:'0.78rem', color:'#64748b' }}>{fmtDate(req.scheduledDate)}</td>
                    <td style={{ padding:'13px 14px' }}><StatusBadge status={req.status}/></td>

                    <td style={{ padding:'13px 14px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center', justifyContent:'center', minWidth: 120 }}>
                        {/* View detail - hàng trên */}
                        <button onClick={()=>setDetailReq(req)}
                          style={{ width:'100%', padding:'5px 11px', border:'1.5px solid #e2e8f0', background:'#f8fafc', borderRadius:8, cursor:'pointer', color:'#475569', fontSize:'0.75rem', fontWeight:600 }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#e0f2fe';e.currentTarget.style.borderColor=INBOUND_COLOR;e.currentTarget.style.color=INBOUND_COLOR;}}
                          onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#475569';}}>
                          Chi tiết
                        </button>

                        {/* Duyệt & Từ chối - hàng dưới */}
                        {canApprove && (
                          <div style={{ display:'flex', gap:6, width:'100%' }}>
                            <button onClick={()=>setApproveReq(req)}
                              style={{ flex:1, padding:'5px 0', border:'1.5px solid #bbf7d0', background:'#dcfce7', borderRadius:8, cursor:'pointer', color:'#166534', fontSize:'0.75rem', fontWeight:700, textAlign:'center' }}
                              onMouseEnter={e=>e.currentTarget.style.background='#bbf7d0'}
                              onMouseLeave={e=>e.currentTarget.style.background='#dcfce7'}>
                              Duyệt
                            </button>
                            <button onClick={()=>setRejectReq(req)}
                              style={{ flex:1, padding:'5px 0', border:'1.5px solid #fecaca', background:'#fee2e2', borderRadius:8, cursor:'pointer', color:'#dc2626', fontSize:'0.75rem', fontWeight:700, textAlign:'center' }}
                              onMouseEnter={e=>e.currentTarget.style.background='#fecaca'}
                              onMouseLeave={e=>e.currentTarget.style.background='#fee2e2'}>
                              Từ chối
                            </button>
                          </div>
                        )}

                        {!canApprove && (
                          <span style={{ fontSize:'0.73rem', color:'#94a3b8', fontStyle:'italic', padding:'2px 0' }}>
                            {req.status === 'CONFIRMED' ? 'Đã duyệt' :
                             req.status === 'REJECTED'  ? 'Đã từ chối' :
                             req.status === 'ASSIGNED'  ? 'Đang xử lý' :
                             req.status === 'COMPLETED' ? 'Hoàn thành' : req.status}
                          </span>
                        )}

                        {req.status === 'COMPLETED' && (
                          <button onClick={()=>navigate(`/warehouse-grid-map`, { state: { autoEditMode: true } })}
                            style={{ width:'100%', padding:'5px 11px', border:'1.5px solid #3b82f6', background:'#eff6ff', borderRadius:8, cursor:'pointer', color:'#2563eb', fontSize:'0.75rem', fontWeight:700, marginTop:4 }}
                            onMouseEnter={e=>{e.currentTarget.style.background='#dbeafe';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='#eff6ff';}}>
                            {req.type === 'INBOUND' ? 'Phân bổ vị trí kho' : 'Xử lý gỡ hàng'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderTop:'1px solid #f1f5f9' }}>
            <span style={{ fontSize:'0.78rem', color:'#94a3b8' }}>Tổng <strong style={{ color:'#64748b' }}>{data.totalCount}</strong> phiếu</span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}
                style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:page<=1?'not-allowed':'pointer', color:page<=1?'#d1d5db':'#374151', fontSize:'0.8rem', fontWeight:600 }}>
                Trước
              </button>
              <span style={{ fontSize:'0.8rem', color:'#64748b', fontWeight:600 }}>{page} / {data.totalPages||1}</span>
              <button onClick={()=>setPage(p=>Math.min(data.totalPages,p+1))} disabled={page>=data.totalPages}
                style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:page>=data.totalPages?'not-allowed':'pointer', color:page>=data.totalPages?'#d1d5db':'#374151', fontSize:'0.8rem', fontWeight:600 }}>
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DetailModal  req={detailReq}  onClose={()=>setDetailReq(null)}/>
      <ApproveModal req={approveReq} onClose={()=>setApproveReq(null)} onApprove={handleAction} loading={actionLoading}/>
      <RejectModal  req={rejectReq}  onClose={()=>setRejectReq(null)}  onReject={handleAction}  loading={actionLoading}/>
    </div>
  );
};

export default ManagerInventoryRequests;
