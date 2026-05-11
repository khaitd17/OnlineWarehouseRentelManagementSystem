import React, { useState, useEffect, useRef } from 'react';
import receiptNoteService from '../services/receiptNoteService';
import SignatureCanvas from './SignatureCanvas';

const ACCENT = '#10b981';

const CreateReceiptNoteModal = ({ request, onClose, onCreated }) => {
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sigRef = useRef(null);

  useEffect(() => {
    if (!request) return;

    const fetchExistingData = async () => {
      try {
        let receivedTotals = {};
        if (request.receiptNoteCount > 0) {
          const res = await receiptNoteService.getByRequest(request.invReqId);
          const existingNotes = res.data || [];
          existingNotes.forEach(note => {
            (note.items || []).forEach(i => {
              if (i.inventoryItemId) {
                receivedTotals[i.inventoryItemId] = (receivedTotals[i.inventoryItemId] || 0) + i.receivedQuantity;
              }
            });
          });
        }

        setItems((request.items || []).map(i => {
          const alreadyReceived = receivedTotals[i.itemId] || 0;
          const remaining = Math.max(0, i.quantity - alreadyReceived);
          return {
            inventoryItemId: i.itemId,
            assetId: i.assetId || null,
            itemName: i.itemName,
            expectedQuantity: remaining,
            receivedQuantity: remaining,
            unit: i.unit || 'cái',
            verifiedVolume: '',
            verifiedWeight: '',
            note: '',
          };
        }));
      } catch (err) {
        console.error("Error fetching existing receipt notes:", err);
      }
    };

    fetchExistingData();
  }, [request]);

  if (!request) return null;

  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const addExtraItem = () => {
    setItems(prev => [...prev, {
      inventoryItemId: null, assetId: null, itemName: '', expectedQuantity: 0,
      receivedQuantity: 0, unit: 'cái', verifiedVolume: '', verifiedWeight: '', note: 'Hàng phát sinh',
    }]);
  };

  const handleSubmit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('Vui lòng ký xác nhận.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        invReqId: request.invReqId,
        notes: notes || null,
        staffSignatureBase64: sigRef.current.toBase64(),
        items: items.map(it => ({
          ...it,
          receivedQuantity: Number(it.receivedQuantity) || 0,
          expectedQuantity: Number(it.expectedQuantity) || 0,
          verifiedVolume: it.verifiedVolume ? Number(it.verifiedVolume) : null,
          verifiedWeight: it.verifiedWeight ? Number(it.verifiedWeight) : null,
          note: it.note || null,
        })),
      };
      const res = await receiptNoteService.create(payload);
      onCreated?.(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Tạo phiếu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const hasDisc = items.some(it => Number(it.receivedQuantity) !== Number(it.expectedQuantity));

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:720, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${ACCENT},#059669)`, padding:'20px 28px', flexShrink:0 }}>
          <p style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#fff' }}>Tạo phiếu nhập kho</p>
          <p style={{ margin:'3px 0 0', fontSize:'0.78rem', color:'rgba(255,255,255,0.85)' }}>
            Yêu cầu #{request.invReqId} · {request.requestCode || ''} · {request.warehouseName}
          </p>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'22px 28px' }}>
          {error && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'#fee2e2', border:'1px solid #fecaca', marginBottom:14, fontSize:'0.83rem', color:'#991b1b', fontWeight:600 }}>{error}</div>
          )}

          <p style={{ margin:'0 0 12px', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Kiểm đếm hàng hóa ({items.length} mặt hàng)
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
            {items.map((it, idx) => {
              const disc = Number(it.receivedQuantity) - Number(it.expectedQuantity);
              const discColor = disc < 0 ? '#dc2626' : disc > 0 ? '#d97706' : '#16a34a';
              const isExtra = !it.inventoryItemId;
              return (
                <div key={idx} style={{ border:`1.5px solid ${isExtra ? '#fcd34d' : disc !== 0 ? (disc < 0 ? '#fecaca' : '#fcd34d') : '#e2e8f0'}`, borderRadius:12, padding:'14px 16px', background: isExtra ? '#fffbeb' : disc !== 0 ? (disc < 0 ? '#fee2e220' : '#fef3c720') : '#f8fafc' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    {isExtra ? (
                      <input value={it.itemName} onChange={e => updateItem(idx, 'itemName', e.target.value)}
                        placeholder="Tên hàng phát sinh" style={{ flex:1, padding:'7px 12px', borderRadius:8, border:'1.5px solid #fcd34d', fontSize:'0.88rem', fontWeight:700, outline:'none', fontFamily:'Inter,sans-serif', background:'#fff', marginRight:10 }}
                        onFocus={e=>e.target.style.borderColor='#f59e0b'}
                        onBlur={e=>e.target.style.borderColor='#fcd34d'} />
                    ) : (
                      <p style={{ margin:0, fontWeight:700, fontSize:'0.9rem', color:'#1e293b' }}>{it.itemName}</p>
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color:discColor, background: disc === 0 ? '#dcfce7' : disc < 0 ? '#fee2e2' : '#fef3c7', padding:'3px 10px', borderRadius:6, whiteSpace:'nowrap' }}>
                        {disc === 0 ? 'Đúng số' : disc > 0 ? `+${disc} thừa` : `${disc} thiếu`}
                      </span>
                      {isExtra && (
                        <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                          title="Xóa hàng phát sinh"
                          style={{ width:28, height:28, borderRadius:8, border:'1.5px solid #fecaca', background:'#fff', cursor:'pointer', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:900, transition:'all 0.15s', flexShrink:0 }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='#fff';}}>
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'80px 100px 1fr 2fr', gap:10, alignItems:'end' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:'#94a3b8', marginBottom:4 }}>Dự kiến</label>
                      <input type="number" value={it.expectedQuantity} readOnly
                        style={{ width:'100%', boxSizing:'border-box', padding:'7px 10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:'0.85rem', background:'#f1f5f9', color:'#64748b', fontFamily:'Inter,sans-serif' }} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:ACCENT, marginBottom:4 }}>Thực nhận *</label>
                      <input type="number" min="0" value={it.receivedQuantity}
                        onChange={e => updateItem(idx, 'receivedQuantity', e.target.value)}
                        style={{ width:'100%', boxSizing:'border-box', padding:'7px 10px', borderRadius:8, border:`1.5px solid ${disc !== 0 ? discColor : '#e2e8f0'}`, fontSize:'0.9rem', fontWeight:700, outline:'none', fontFamily:'Inter,sans-serif' }} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:'#4f46e5', marginBottom:4 }}>Thể tích (m³)</label>
                      <input type="number" min="0" step="0.001" value={it.verifiedVolume}
                        onChange={e => updateItem(idx, 'verifiedVolume', e.target.value)}
                        style={{ width:'100%', boxSizing:'border-box', padding:'7px 10px', borderRadius:8, border:'1px solid #c7d2fe', fontSize:'0.85rem', outline:'none', fontFamily:'Inter,sans-serif', color:'#4f46e5', fontWeight:600 }}
                        onFocus={e=>e.target.style.borderColor='#6366f1'}
                        onBlur={e=>e.target.style.borderColor='#c7d2fe'}
                      />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:'#94a3b8', marginBottom:4 }}>Ghi chú</label>
                      <input value={it.note} onChange={e => updateItem(idx, 'note', e.target.value)}
                        placeholder={isExtra ? 'Hàng phát sinh' : disc < 0 ? 'VD: Thiếu, hàng vỡ...' : ''}
                        style={{ width:'100%', boxSizing:'border-box', padding:'7px 10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:'0.83rem', outline:'none', fontFamily:'Inter,sans-serif' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={addExtraItem} style={{ width:'100%', padding:'10px', borderRadius:10, border:'1.5px dashed #cbd5e1', background:'#f8fafc', cursor:'pointer', fontSize:'0.83rem', fontWeight:600, color:'#64748b', marginBottom:16 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}>
            + Thêm hàng phát sinh (ngoài danh sách)
          </button>

          {hasDisc && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'#fff7ed', border:'1px solid #fed7aa', marginBottom:16, fontSize:'0.82rem', color:'#c2410c', fontWeight:600 }}>
              Có chênh lệch giữa số dự kiến và thực nhận. Phiếu sẽ ghi nhận số thực nhận.
            </div>
          )}

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Ghi chú phiếu (tùy chọn)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="VD: Lô hàng giao đợt 1, xe 51A-12345..."
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:'0.85rem', outline:'none', resize:'vertical', fontFamily:'Inter,sans-serif' }} />
          </div>

          {/* Signature */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Chữ ký thủ kho <span style={{ color:'#dc2626' }}>*</span>
              </label>
              <button onClick={() => { sigRef.current?.clear(); setError(''); }}
                style={{ padding:'3px 10px', background:'transparent', border:'1px solid #e2e8f0', borderRadius:6, fontSize:'0.73rem', fontWeight:600, color:'#64748b', cursor:'pointer' }}>
                Xóa ký lại
              </button>
            </div>
            <div style={{ border:'1.5px solid #e2e8f0', borderRadius:8, overflow:'hidden', background:'#fdfdfd' }}>
              <SignatureCanvas ref={sigRef} canvasProps={{ width: 660, height: 120 }} />
            </div>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={onClose} disabled={loading}
              style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', color:'#64748b' }}>
              Hủy
            </button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ padding:'10px 24px', borderRadius:10, border:'none',
                background: loading ? '#e2e8f0' : `linear-gradient(135deg,${ACCENT},#059669)`,
                color: loading ? '#94a3b8' : '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight:700, fontSize:'0.875rem', boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.4)' }}>
              {loading ? 'Đang tạo phiếu...' : 'Tạo phiếu nhập kho'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReceiptNoteModal;
