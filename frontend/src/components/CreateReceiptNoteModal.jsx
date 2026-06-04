import React, { useState, useEffect, useRef, useMemo } from 'react';
import receiptNoteService from '../services/receiptNoteService';
import renterAssetService from '../services/renterAssetService';
import axiosClient from '../services/axiosClient';
import SignatureCanvas from './SignatureCanvas';

const INBOUND_ACCENT = '#10b981';
const OUTBOUND_ACCENT = '#f59e0b';
const OVERFLOW_TOLERANCE = 2.0; // m² — ngưỡng cố định (khớp backend)

const positiveNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const measurementValue = (value) => {
  const n = positiveNumber(value);
  return n == null ? '' : Number(n.toFixed(3)).toString();
};

const CreateReceiptNoteModal = ({ request, onClose, onCreated }) => {
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capacityInfo, setCapacityInfo] = useState(null);
  const [acceptOverCapacity, setAcceptOverCapacity] = useState(false);
  const sigRef = useRef(null);
  const isOutbound = request?.type === 'OUTBOUND';
  const accent = isOutbound ? OUTBOUND_ACCENT : INBOUND_ACCENT;
  const receiptTypeLabel = isOutbound ? 'xuất kho' : 'nhập kho';
  const actualQtyLabel = isOutbound ? 'Thực xuất *' : 'Thực nhận *';
  const itemCheckLabel = isOutbound ? 'Kiểm đếm hàng xuất' : 'Kiểm đếm hàng hóa';

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
          const lengthPerUnit = positiveNumber(i.measuredLength ?? i.lengthPerUnit);
          const widthPerUnit = positiveNumber(i.measuredWidth ?? i.widthPerUnit);
          const estimatedVolume = positiveNumber(i.estimatedVolume);
          const requestedQty = positiveNumber(i.quantity);
          const volumePerUnit = positiveNumber(i.volumePerUnit)
            || (estimatedVolume && requestedQty ? estimatedVolume / requestedQty : null);
          const squareSide = !lengthPerUnit && !widthPerUnit && volumePerUnit
            ? Math.sqrt(volumePerUnit)
            : null;
          const initialLength = lengthPerUnit || squareSide;
          const initialWidth = widthPerUnit || squareSide;
          const initialVerifiedVolume = initialLength && initialWidth && remaining > 0
            ? Number((initialLength * initialWidth * remaining).toFixed(3))
            : (volumePerUnit && remaining > 0 ? Number((volumePerUnit * remaining).toFixed(3)) : '');
          return {
            inventoryItemId: i.itemId,
            assetId: i.assetId || null,
            itemName: i.itemName,
            expectedQuantity: remaining,
            receivedQuantity: remaining,
            unit: i.unit || 'cái',
            verifiedVolume: initialVerifiedVolume,
            verifiedWeight: '',
            length: measurementValue(initialLength),
            width: measurementValue(initialWidth),
            note: '',
          };
        }));
      } catch (err) {
        console.error("Error fetching existing receipt notes:", err);
      }
    };

    fetchExistingData();

    // Fetch capacity info for INBOUND requests using the renter's specific ID
    if (request.type === 'INBOUND' && request.warehouseId && request.renterId) {
      axiosClient.get('/rental-contracts/renter-capacity', {
        params: { renterId: request.renterId, warehouseId: request.warehouseId }
      })
        .then(res => {
          if (res.data) {
            setCapacityInfo({
              contractedArea: res.data.contractedAreaM3,
              usedArea: res.data.currentVolumeM3,
              remainingArea: res.data.remainingM3,
              usagePercent: res.data.usagePercent
            });
          } else {
            setCapacityInfo(null);
          }
        })
        .catch(() => setCapacityInfo(null));
    }
  }, [request]);

  // Calculate total verified volume in real-time
  const totalVerifiedVolume = useMemo(() => {
    return items.reduce((sum, it) => {
      const v = Number(it.verifiedVolume) || 0;
      return sum + v;
    }, 0);
  }, [items]);

  // Determine capacity zone
  const capacityZone = useMemo(() => {
    if (!capacityInfo || request?.type !== 'INBOUND') return { zone: 'GREEN', overflow: 0 };
    const remaining = Number(capacityInfo.remainingArea) || 0;
    const overflow = totalVerifiedVolume - remaining;
    if (overflow <= 0) return { zone: 'GREEN', overflow: 0 };
    if (overflow <= OVERFLOW_TOLERANCE) return { zone: 'YELLOW', overflow };
    return { zone: 'RED', overflow };
  }, [capacityInfo, totalVerifiedVolume, request]);

  // Check if all requested items are already fully fulfilled
  const isFullyFulfilled = useMemo(() => {
    if (items.length === 0) return false;
    const originalItems = items.filter(it => it.inventoryItemId != null);
    if (originalItems.length === 0) return false;
    return originalItems.every(it => Number(it.expectedQuantity) <= 0);
  }, [items]);

  if (!request) return null;

  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const addExtraItem = () => {
    setItems(prev => [...prev, {
      inventoryItemId: null, assetId: null, itemName: '', expectedQuantity: 0,
      receivedQuantity: 0, unit: 'cái', verifiedVolume: '', verifiedWeight: '', length: '', width: '', note: 'Hàng phát sinh',
    }]);
  };

  const handleSubmit = async () => {
    if (isFullyFulfilled) {
      setError('Yêu cầu này đã được xử lý đầy đủ số lượng. Không thể tạo thêm phiếu mới.');
      return;
    }

    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('Vui lòng ký xác nhận.');
      return;
    }

    // Validate Area (verifiedVolume)
    const hasMissingVolume = items.some(it => Number(it.receivedQuantity) > 0 && (!it.verifiedVolume || Number(it.verifiedVolume) <= 0));
    if (hasMissingVolume) {
      setError(`Vui lòng nhập Diện tích (m²) > 0 cho tất cả mặt hàng ${isOutbound ? 'thực xuất' : 'thực nhận'}.`);
      return;
    }

    // Yellow zone: must check the checkbox
    if (capacityZone.zone === 'YELLOW' && !acceptOverCapacity) {
      setError(`Dien tich vuot ${capacityZone.overflow.toFixed(2)} m². Vui long tick xac nhan chap nhan vuot suc chua.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        invReqId: request.invReqId,
        notes: notes || null,
        staffSignatureBase64: sigRef.current.toBase64(),
        acceptOverCapacity: acceptOverCapacity,
        items: items.map(it => ({
          ...it,
          receivedQuantity: Number(it.receivedQuantity) || 0,
          expectedQuantity: Number(it.expectedQuantity) || 0,
          verifiedVolume: it.verifiedVolume ? Number(it.verifiedVolume) : null,
          measuredLength: null,
          measuredWidth: null,
          verifiedWeight: it.verifiedWeight ? Number(it.verifiedWeight) : null,
          note: it.note || null,
        })),
      };
      const res = await receiptNoteService.create(payload);
      onCreated?.(res.data);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Tạo phiếu thất bại.';
      // If backend returns red zone info, show a more descriptive error
      if (msg.includes('PENDING_CAPACITY_APPROVAL') || err?.response?.status === 201) {
        // Receipt was created but pending approval
        onCreated?.(err?.response?.data);
        onClose();
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasDisc = items.some(it => Number(it.receivedQuantity) !== Number(it.expectedQuantity));

  // Capacity zone colors & labels
  const zoneStyles = {
    GREEN: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', label: 'Đủ sức chứa' },
    YELLOW: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', label: 'Vượt nhẹ' },
    RED: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', label: 'Vượt nghiêm trọng' },
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:720, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${accent},${isOutbound ? '#d97706' : '#059669'})`, padding:'20px 28px', flexShrink:0 }}>
          <p style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#fff' }}>Tạo phiếu {receiptTypeLabel}</p>
          <p style={{ margin:'3px 0 0', fontSize:'0.78rem', color:'rgba(255,255,255,0.85)' }}>
            Yêu cầu #{request.invReqId} · {request.requestCode || ''} · {request.warehouseName}
          </p>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'22px 28px' }}>
           {error && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'#fee2e2', border:'1px solid #fecaca', marginBottom:14, fontSize:'0.83rem', color:'#991b1b', fontWeight:600 }}>{error}</div>
          )}

          {isFullyFulfilled && (
            <div style={{ padding:'12px 16px', borderRadius:12, background:'#fef3c7', border:'1.5px solid #fcd34d', marginBottom:16, fontSize:'0.85rem', color:'#92400e', fontWeight:700, display:'flex', flexDirection:'column', gap:4 }}>
              <span>⚠️ Yêu cầu đã được lập phiếu đầy đủ số lượng trong các phiếu trước đó.</span>
              <span style={{ fontSize:'0.78rem', fontWeight:500, color:'#b45309' }}>Tổng số lượng thực tế đã tạo phiếu bằng hoặc vượt quá số lượng yêu cầu. Vui lòng kiểm tra lại các phiếu hiện có hoặc đợi người thuê ký xác nhận để hoàn tất.</span>
            </div>
          )}

          {/* Capacity Guard Bar */}
          {capacityInfo && request.type === 'INBOUND' && (
            <div style={{ padding:'12px 16px', borderRadius:12, background:zoneStyles[capacityZone.zone].bg, border:`1.5px solid ${zoneStyles[capacityZone.zone].border}`, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#475569' }}>
                  Sức chứa hợp đồng
                </span>
                <span style={{ fontSize:'0.72rem', fontWeight:700, color: zoneStyles[capacityZone.zone].color, background:'#fff', padding:'2px 10px', borderRadius:10, border:`1px solid ${zoneStyles[capacityZone.zone].border}` }}>
                  {zoneStyles[capacityZone.zone].label}
                </span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:'0.67rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.04em' }}>Đã dùng</div>
                  <div style={{ fontSize:'0.95rem', fontWeight:800, color:'#475569' }}>{Number(capacityInfo.usedArea).toFixed(1)} m²</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.67rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.04em' }}>Phiếu này</div>
                  <div style={{ fontSize:'0.95rem', fontWeight:800, color: capacityZone.zone !== 'GREEN' ? zoneStyles[capacityZone.zone].color : '#475569' }}>{totalVerifiedVolume.toFixed(1)} m²</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.67rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.04em' }}>Còn trống</div>
                  <div style={{ fontSize:'0.95rem', fontWeight:800, color:'#16a34a' }}>{Number(capacityInfo.remainingArea).toFixed(1)} m²</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height:6, borderRadius:3, background:'#e2e8f0', overflow:'hidden' }}>
                {(() => {
                  const contracted = Number(capacityInfo.contractedArea) || 1;
                  const used = Number(capacityInfo.usedArea) || 0;
                  const newVol = totalVerifiedVolume;
                  const usedPct = Math.min((used / contracted) * 100, 100);
                  const newPct = Math.min((newVol / contracted) * 100, 100 - usedPct);
                  return (
                    <>
                      <div style={{ height:'100%', width:`${usedPct}%`, background:'#94a3b8', float:'left', borderRadius:'3px 0 0 3px' }} />
                      <div style={{ height:'100%', width:`${Math.max(0, newPct)}%`, background: capacityZone.zone === 'GREEN' ? '#16a34a' : zoneStyles[capacityZone.zone].color, float:'left', borderRadius: usedPct === 0 ? '3px 0 0 3px' : '0' }} />
                    </>
                  );
                })()}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                <span style={{ fontSize:'0.65rem', color:'#94a3b8' }}>0 m²</span>
                <span style={{ fontSize:'0.65rem', color:'#94a3b8' }}>{Number(capacityInfo.contractedArea).toFixed(0)} m²</span>
              </div>

              {/* Yellow zone: checkbox confirm */}
              {capacityZone.zone === 'YELLOW' && (
                <div style={{ marginTop:10, padding:'10px 14px', borderRadius:8, background:'#fff', border:'1px solid #fde68a' }}>
                  <p style={{ margin:'0 0 8px', fontSize:'0.82rem', fontWeight:600, color:'#d97706' }}>
                    Diện tích vượt {capacityZone.overflow.toFixed(2)} m² so với diện tích còn trống. Vượt trong phạm vi cho phép ({OVERFLOW_TOLERANCE} m²).
                  </p>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.82rem', fontWeight:700, color:'#92400e' }}>
                    <input type="checkbox" checked={acceptOverCapacity} onChange={e => setAcceptOverCapacity(e.target.checked)}
                      style={{ width:18, height:18, accentColor:'#d97706', cursor:'pointer' }} />
                    Tôi xác nhận chấp nhận vượt sức chứa
                  </label>
                </div>
              )}

              {/* Red zone: hard block warning */}
              {capacityZone.zone === 'RED' && (
                <div style={{ marginTop:10, padding:'10px 14px', borderRadius:8, background:'#fff', border:'1px solid #fecaca' }}>
                  <p style={{ margin:0, fontSize:'0.82rem', fontWeight:700, color:'#dc2626' }}>
                    Vượt {capacityZone.overflow.toFixed(2)} m² (vượt quá ngưỡng cho phép {OVERFLOW_TOLERANCE} m²). Phiếu sẽ được tạo với trạng thái CHỜ DUYỆT — cần Manager phê duyệt trước khi tồn kho được cập nhật.
                  </p>
                </div>
              )}
            </div>
          )}

          <p style={{ margin:'0 0 12px', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            {itemCheckLabel} ({items.length} mặt hàng)
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

                  <div style={{ display:'grid', gridTemplateColumns:'80px 90px 1fr 2fr', gap:10, alignItems:'end' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:'#94a3b8', marginBottom:4 }}>Dự kiến</label>
                      <input type="number" value={it.expectedQuantity} readOnly
                        style={{ width:'100%', boxSizing:'border-box', padding:'7px 10px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:'0.85rem', background:'#f1f5f9', color:'#64748b', fontFamily:'Inter,sans-serif' }} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:accent, marginBottom:4 }}>{actualQtyLabel}</label>
                      <input type="number" min="0" value={it.receivedQuantity}
                        onChange={e => {
                          const v = e.target.value; updateItem(idx, 'receivedQuantity', v);
                        }}
                        style={{ width:'100%', boxSizing:'border-box', padding:'7px 10px', borderRadius:8, border:`1.5px solid ${disc !== 0 ? discColor : '#e2e8f0'}`, fontSize:'0.9rem', fontWeight:700, outline:'none', fontFamily:'Inter,sans-serif' }} />
                    </div>

                    <div>
                      <label style={{ display:'block', fontSize:'0.69rem', fontWeight:700, color:'#4f46e5', marginBottom:4 }}>diện tích (m²) *</label>
                      <input type="number" min="0" step="0.001" value={it.verifiedVolume} required
                        onChange={e => updateItem(idx, 'verifiedVolume', e.target.value)}
                        style={{ width:'100%', boxSizing:'border-box', padding:'7px 10px', borderRadius:8, border:'1.5px solid #c7d2fe', fontSize:'0.85rem', outline:'none', fontFamily:'Inter,sans-serif', color:'#4f46e5', fontWeight:700, background:'#eef2ff' }}
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

          {!isFullyFulfilled && (
            <button onClick={addExtraItem} style={{ width:'100%', padding:'10px', borderRadius:10, border:'1.5px dashed #cbd5e1', background:'#f8fafc', cursor:'pointer', fontSize:'0.83rem', fontWeight:600, color:'#64748b', marginBottom:16 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}>
              + Thêm hàng phát sinh (ngoài danh sách)
            </button>
          )}

          {hasDisc && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'#fff7ed', border:'1px solid #fed7aa', marginBottom:16, fontSize:'0.82rem', color:'#c2410c', fontWeight:600 }}>
              Có chênh lệch giữa số dự kiến và {isOutbound ? 'thực xuất' : 'thực nhận'}. Phiếu sẽ ghi nhận số {isOutbound ? 'thực xuất' : 'thực nhận'}.
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
            <button onClick={handleSubmit} disabled={loading || isFullyFulfilled}
              style={{ padding:'10px 24px', borderRadius:10, border:'none',
                background: (loading || isFullyFulfilled) ? '#cbd5e1' : capacityZone.zone === 'RED' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : `linear-gradient(135deg,${accent},${isOutbound ? '#d97706' : '#059669'})`,
                color: (loading || isFullyFulfilled) ? '#94a3b8' : '#fff', cursor: (loading || isFullyFulfilled) ? 'not-allowed' : 'pointer',
                fontWeight:700, fontSize:'0.875rem', boxShadow: (loading || isFullyFulfilled) ? 'none' : capacityZone.zone === 'RED' ? '0 4px 14px rgba(245,158,11,0.4)' : isOutbound ? '0 4px 14px rgba(245,158,11,0.35)' : '0 4px 14px rgba(16,185,129,0.4)' }}>
              {loading ? 'Đang tạo phiếu...' : capacityZone.zone === 'RED' ? 'Tạo phiếu (chờ duyệt)' : `Tạo phiếu ${receiptTypeLabel}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReceiptNoteModal;
