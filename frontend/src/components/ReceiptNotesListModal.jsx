import React, { useState, useEffect, useRef } from 'react';
import receiptNoteService from '../services/receiptNoteService';
import SignatureCanvas from './SignatureCanvas';
import RequestQRCode from './RequestQRCode';
import { ReceiptPreviewModal } from './InventoryReceiptPDF';

const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

const STATUS_STYLE = {
  DRAFT:    { label:'Nháp',        bg:'#f1f5f9', color:'#64748b', dot:'#94a3b8' },
  VERIFIED: { label:'Chờ xác nhận', bg:'#fef3c7', color:'#d97706', dot:'#f59e0b' },
  COMPLETED:{ label:'Hoàn thành',  bg:'#dcfce7', color:'#166534', dot:'#22c55e' },
};

const ReceiptNotesListModal = ({ request, userRole, onClose, onUpdated }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [sigError, setSigError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const sigRef = useRef(null);
  const isOutbound = request?.type === 'OUTBOUND';
  const receiptTypeLabel = isOutbound ? 'xuất kho' : 'nhập kho';
  const actualQtyLabel = isOutbound ? 'Thực xuất' : 'Thực nhận';

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await receiptNoteService.getByRequest(request.invReqId);
      setNotes(Array.isArray(res.data) ? res.data : []);
    } catch { setNotes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (request) fetchNotes(); }, [request?.invReqId]);

  if (!request) return null;

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const handleConfirm = async (noteId) => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setSigError('Vui lòng ký xác nhận.');
      return;
    }
    setActionLoading(true);
    try {
      await receiptNoteService.confirm(noteId, { renterSignatureBase64: sigRef.current.toBase64() });
      showToast(`Đã xác nhận phiếu ${receiptTypeLabel} thành công!`);
      setConfirmingId(null);
      fetchNotes();
      onUpdated?.();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Xác nhận thất bại.', true);
    } finally { setActionLoading(false); }
  };

  const totalReceived = notes.filter(n => n.status === 'COMPLETED' || n.status === 'VERIFIED')
    .reduce((s, n) => s + (n.items || []).reduce((ss, i) => ss + i.receivedQuantity, 0), 0);
  const totalExpected = (request.items || []).reduce((s, i) => s + i.quantity, 0);

  const handleViewPdf = (note) => {
    setPdfData({
      ...request,
      invReqId: request.invReqId,
      type: request.type || 'INBOUND',
      createdAt: note.receivedAt,
      staffName: note.staffName,
      notes: note.notes || request.notes,
      renterSignatureBase64: note.renterSignatureBase64,
      staffSignatureBase64: note.staffSignatureBase64,
      items: note.items.map(i => ({
        itemName: i.itemName,
        quantity: i.receivedQuantity,
        unit: i.unit || 'cái',
        estimatedVolume: i.verifiedVolume,
        note: i.note
      })),
    });
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:780, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${isOutbound ? '#f59e0b' : '#6366f1'},${isOutbound ? '#d97706' : '#4f46e5'})`, padding:'20px 28px', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#fff' }}>Phiếu {receiptTypeLabel}</p>
              <p style={{ margin:'3px 0 0', fontSize:'0.78rem', color:'rgba(255,255,255,0.85)' }}>
                Yêu cầu #{request.invReqId} · {request.requestCode || ''} · {request.warehouseName}
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ margin:0, fontSize:'0.72rem', color:'rgba(255,255,255,0.7)' }}>Tiến độ {isOutbound ? 'xuất hàng' : 'nhận hàng'}</p>
              <p style={{ margin:'2px 0 0', fontSize:'1.1rem', fontWeight:900, color:'#fff' }}>
                {totalReceived}/{totalExpected}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop:12, height:6, background:'rgba(255,255,255,0.2)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ width:`${totalExpected > 0 ? Math.min(100, (totalReceived / totalExpected) * 100) : 0}%`, height:'100%', background:'#fff', borderRadius:3, transition:'width 0.3s ease' }} />
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ margin:'12px 28px 0', padding:'10px 14px', borderRadius:10, background: toast.isError ? '#fee2e2' : '#dcfce7', border:`1px solid ${toast.isError ? '#fecaca' : '#bbf7d0'}`, fontSize:'0.83rem', fontWeight:600, color: toast.isError ? '#991b1b' : '#166534' }}>
            {toast.msg}
          </div>
        )}

        <div style={{ overflowY:'auto', flex:1, padding:'22px 28px' }}>
          {/* QR Code section */}
          {request.requestCode && (
            <div style={{ textAlign:'center', marginBottom:20, padding:'16px', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
              <RequestQRCode code={request.requestCode} label={`Mã yêu cầu ${receiptTypeLabel}`} size={140} requestData={request} showActions={false} />
            </div>
          )}

          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Đang tải phiếu...</div>
          ) : notes.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
              <p style={{ fontWeight:600, color:'#64748b', marginBottom:4 }}>Chưa có phiếu {receiptTypeLabel} nào</p>
              <p style={{ fontSize:'0.83rem' }}>Nhân viên kho sẽ tạo phiếu khi {isOutbound ? 'bàn giao hàng xuất' : 'hàng đến'}.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {notes.map(note => {
                const s = STATUS_STYLE[note.status] || STATUS_STYLE.DRAFT;
                const isConfirming = confirmingId === note.receiptNoteId;
                return (
                  <div key={note.receiptNoteId} style={{ border:'1.5px solid #e2e8f0', borderRadius:14, overflow:'hidden' }}>
                    {/* Note header */}
                    <div style={{ padding:'14px 18px', background:'#f8fafc', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center' }}>
                        <span style={{ fontWeight:800, color:'#4f46e5', fontSize:'0.9rem', fontFamily:'monospace' }}>{note.receiptCode}</span>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:999, fontSize:'0.7rem', fontWeight:700, background:s.bg, color:s.color, marginLeft:10 }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:s.dot }} />
                          {s.label}
                        </span>
                        {note.hasDiscrepancy && (
                          <span style={{ padding:'2px 8px', borderRadius:999, fontSize:'0.7rem', fontWeight:700, background:'#fff7ed', color:'#c2410c', marginLeft:6, border:'1px solid #fed7aa' }}>Chênh lệch</span>
                        )}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{fmtDate(note.receivedAt)}</span>
                        <button onClick={() => handleViewPdf(note)} style={{ padding:'5px 12px', background:'#1e293b', color:'#fff', border:'none', borderRadius:6, fontSize:'0.75rem', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'background 0.2s' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#334155'} onMouseLeave={e=>e.currentTarget.style.background='#1e293b'}>
                          Xem Phiếu
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ padding:'12px 18px' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 2fr', gap:4, marginBottom:6, fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                        <span>Hàng hóa</span><span style={{textAlign:'center'}}>Dự kiến</span><span style={{textAlign:'center'}}>{actualQtyLabel}</span><span style={{textAlign:'center'}}>Chênh lệch</span><span>Ghi chú</span>
                      </div>
                      {(note.items || []).map((item, i) => {
                        const d = item.discrepancy || (item.receivedQuantity - item.expectedQuantity);
                        return (
                          <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 2fr', gap:4, padding:'6px 0', borderTop:'1px solid #f8fafc', fontSize:'0.83rem', alignItems:'center' }}>
                            <span style={{ fontWeight:600, color:'#1e293b' }}>{item.itemName}</span>
                            <span style={{ textAlign:'center', color:'#64748b' }}>{item.expectedQuantity}</span>
                            <span style={{ textAlign:'center', fontWeight:700, color: d === 0 ? '#16a34a' : d < 0 ? '#dc2626' : '#d97706' }}>{item.receivedQuantity}</span>
                            <span style={{ textAlign:'center', fontWeight:700, color: d === 0 ? '#16a34a' : d < 0 ? '#dc2626' : '#d97706' }}>
                              {d === 0 ? '✓' : d > 0 ? `+${d}` : d}
                            </span>
                            <span style={{ fontSize:'0.78rem', color:'#94a3b8', fontStyle:'italic' }}>{item.note || '—'}</span>
                          </div>
                        );
                      })}
                      {note.staffName && <p style={{ margin:'8px 0 0', fontSize:'0.75rem', color:'#94a3b8' }}>Kiểm đếm bởi: <strong>{note.staffName}</strong></p>}
                    </div>

                    {/* Renter confirm section */}
                    {userRole === 'RENTER' && note.status === 'VERIFIED' && (
                      <div style={{ padding:'14px 18px', borderTop:'1px solid #f1f5f9', background:'#fffbeb' }}>
                        {!isConfirming ? (
                          <button onClick={() => { setConfirmingId(note.receiptNoteId); setSigError(''); }}
                            style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', boxShadow:'0 4px 14px rgba(245,158,11,0.3)' }}>
                            Ký xác nhận phiếu này
                          </button>
                        ) : (
                          <div>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                              <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#475569', textTransform:'uppercase' }}>
                                Chữ ký người thuê <span style={{ color:'#dc2626' }}>*</span>
                              </label>
                              <button onClick={() => { sigRef.current?.clear(); setSigError(''); }}
                                style={{ padding:'3px 10px', background:'transparent', border:'1px solid #e2e8f0', borderRadius:6, fontSize:'0.73rem', fontWeight:600, color:'#64748b', cursor:'pointer' }}>
                                Xóa ký lại
                              </button>
                            </div>
                            <div style={{ border:'1.5px solid #e2e8f0', borderRadius:8, overflow:'hidden', background:'#fff', marginBottom:8 }}>
                              <SignatureCanvas ref={sigRef} canvasProps={{ width: 700, height: 100 }} />
                            </div>
                            {sigError && <p style={{ margin:'4px 0 8px', fontSize:'0.75rem', color:'#dc2626', fontWeight:600 }}>{sigError}</p>}
                            <div style={{ display:'flex', gap:8 }}>
                              <button onClick={() => setConfirmingId(null)} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.82rem', color:'#64748b' }}>Hủy</button>
                              <button onClick={() => handleConfirm(note.receiptNoteId)} disabled={actionLoading}
                                style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background: actionLoading ? '#e2e8f0' : 'linear-gradient(135deg,#22c55e,#16a34a)', color: actionLoading ? '#94a3b8' : '#fff', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:'0.85rem' }}>
                                {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {note.status === 'COMPLETED' && note.renterSignatureBase64 && (
                      <div style={{ padding:'10px 18px', borderTop:'1px solid #f1f5f9', background:'#f0fdf4', display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontSize:'0.75rem', color:'#15803d', fontWeight:600 }}>Đã xác nhận bởi người thuê</span>
                        <img src={note.renterSignatureBase64.startsWith('data:') ? note.renterSignatureBase64 : `data:image/png;base64,${note.renterSignatureBase64}`} alt="Chữ ký" style={{ height:32, opacity:0.7, mixBlendMode:'multiply' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 28px', borderTop:'1px solid #f1f5f9', textAlign:'right', flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'10px 28px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', color:'#64748b' }}>Đóng</button>
        </div>
      </div>

      {pdfData && (
        <ReceiptPreviewModal
          data={pdfData}
          onClose={() => setPdfData(null)}
        />
      )}
    </div>
  );
};

export default ReceiptNotesListModal;
