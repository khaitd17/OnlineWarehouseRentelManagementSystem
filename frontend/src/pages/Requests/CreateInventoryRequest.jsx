import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import inventoryService from '../../services/inventoryService';
import renterAssetService from '../../services/renterAssetService';
import aiService from '../../services/aiService';
import authService from '../../services/authService';
import RenterSpaceUsageWarning from '../../components/warehouse/RenterSpaceUsageWarning';

const INBOUND_COLOR = '#0ea5e9';
const OUTBOUND_COLOR = '#f59e0b';
const ALLOWED_EXT = /\.(pdf|jpg|jpeg|png|xls|xlsx|doc|docx)$/i;
const ALLOWED_MIME = ['application/pdf','image/jpeg','image/png','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const fmtBytes = n => n < 1024 ? `${n}B` : n < 1048576 ? `${(n/1024).toFixed(1)}KB` : `${(n/1048576).toFixed(1)}MB`;
const fileIcon = name => { const e = name.split('.').pop().toLowerCase(); if(['jpg','jpeg','png'].includes(e)) return '🖼️'; if(e==='pdf') return '📄'; if(['xls','xlsx'].includes(e)) return '📊'; return '📎'; };
const newRow = () => ({ id: Date.now()+Math.random(), assetId: null, itemName: '', unit: 'cái', qty: 1, note: '', isNew: false, availableQty: null, search: '', showDrop: false, estimatedVolume: '', weightPerUnit: null });
const inp = (extra={}) => ({ padding:'9px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:'0.87rem', outline:'none', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s', boxSizing:'border-box', width:'100%', ...extra });
const UNITS = ['cái','chiếc','thùng','hộp','kg','tấn','lít','mét','m²','m²','cuộn','bao','pallet','chai','gói','bẹ'];
const KG_PER_M3_WARN = 300; // Ngưỡng cảnh báo tải trọng (kg/m²)

function UnitCombobox({ value, onChange, accent }) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState(value||'');
  const [isTyping, setIsTyping] = useState(false);
  const ref = useRef(null);
  // Hiện toàn bộ khi mở bằng click; chỉ lọc khi user đang gõ
  const opts = isTyping ? UNITS.filter(u=>u.toLowerCase().includes(draft.toLowerCase())) : UNITS;
  useEffect(()=>{ setDraft(value??''); },[value]);
  useEffect(()=>{
    const fn=e=>{ if(ref.current&&!ref.current.contains(e.target)){ setShow(false); setIsTyping(false); onChange(draft); } };
    document.addEventListener('mousedown',fn);
    return ()=>document.removeEventListener('mousedown',fn);
  },[draft]);
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <input value={draft}
        onChange={e=>{ setDraft(e.target.value); setIsTyping(true); setShow(true); }}
        onFocus={()=>{ setIsTyping(false); setShow(true); }}
        onBlur={()=>{ onChange(draft); }}
        onKeyDown={e=>{ if(e.key==='Escape'){ setShow(false); setIsTyping(false); } }}
        placeholder=""
        style={{ ...inp(), borderColor:show?accent:'#e2e8f0', paddingRight:28 }}/>
      <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'0.8rem', pointerEvents:'none' }}>&#9660;</span>
      {show && (
        <div className="unit-drop" style={{ position:'absolute', top:'calc(100% + 3px)', left:0, right:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, boxShadow:'0 8px 20px rgba(0,0,0,0.1)', zIndex:300, maxHeight:220, overflowY:'auto' }}>
          {opts.length===0
            ? <div style={{ padding:'8px 12px', fontSize:'0.82rem', color:'#94a3b8' }}>Nhập tùy chỉnh</div>
            : opts.map(u=>(
              <div key={u} onMouseDown={()=>{ onChange(u); setDraft(u); setIsTyping(false); setShow(false); }}
                style={{ padding:'8px 14px', cursor:'pointer', fontSize:'0.85rem', fontWeight:600, color:'#1e293b',
                  background: u===draft ? `${accent}15` : '#fff' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'}
                onMouseLeave={e=>e.currentTarget.style.background= u===draft ? `${accent}15` : '#fff'}>{u}</div>
            ))}
        </div>
      )}
    </div>
  );
}

/* ── AI Photo Analysis Modal ────────────────────────────────────────────── */
function AiPhotoModal({ onClose, onImport }) {
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    aiService.getQuota().then(r => setQuota(r.data)).catch(() => {});
    return () => previews.forEach(u => URL.revokeObjectURL(u));
  }, []);

  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = useCallback((newFiles) => {
    setError(null);
    const images = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    if (!images.length) { setError('Chỉ chấp nhận ảnh (JPG, PNG, WEBP).'); return; }
    setFiles(prev => [...prev, ...images].slice(0, 5));
  }, []);

  const handleAnalyze = async () => {
    if (!files.length) { setError('Vui lòng chọn ít nhất 1 ảnh.'); return; }
    if (quota?.remaining === 0) { setError(`Hết ${quota.dailyLimit} lượt AI hôm nay. Thử lại ngày mai.`); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await aiService.analyzeItems(files, null, null);
      setResult(res.data);
      setQuota(prev => prev ? { ...prev, remaining: prev.remaining - 1, usedToday: prev.usedToday + 1 } : null);
    } catch (err) {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      // Thông báo thân thiện cho lỗi rate limit / quota
      const friendlyMsg = rawMsg.includes('429') || rawMsg.includes('Resource exhausted') || rawMsg.includes('RESOURCE_EXHAUSTED')
        ? 'Gemini API đang bận (quá tải tạm thời). Hệ thống sẽ tự thử lại — nếu vẫn lỗi, vui lòng đợi 1-2 phút rồi thử lại.'
        : rawMsg.includes('503') || rawMsg.includes('unavailable')
        ? 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau ít phút.'
        : rawMsg || 'Phân tích thất bại, vui lòng thử lại.';
      setError(friendlyMsg);
    } finally { setLoading(false); }
  };

  const handleImport = () => {
    if (!result?.items?.length) return;
    const rows = result.items.map(ai => ({
      id: Date.now() + Math.random(),
      assetId: null,
      itemName: ai.name || '',
      search: ai.name || '',
      unit: 'cái',
      qty: ai.quantity || 1,
      estimatedVolume: ai.estimatedVolumeM3 || '',
      weightPerUnit: null,
      note: '',
      isNew: true,
      availableQty: null,
      showDrop: false,
    }));
    onImport(rows);
    onClose();
  };

  const accent = '#6366f1';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:20 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:700, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.22)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'22px 28px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', background:'linear-gradient(135deg,#eef2ff,#fff)', borderRadius:'20px 20px 0 0' }}>
          <div>
            <p style={{ margin:'0 0 2px', fontSize:'1.05rem', fontWeight:800, color:'#312e81' }}>Phân tích hàng hóa bằng AI</p>
            <p style={{ margin:0, fontSize:'0.8rem', color:'#64748b' }}>Chụp ảnh hàng → AI tự nhận dạng tên, số lượng và diện tích ước tính</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {quota && (
              <span style={{ fontSize:'0.75rem', fontWeight:700, color: quota.remaining===0?'#dc2626':'#4f46e5', background: quota.remaining===0?'#fef2f2':'#eef2ff', border:`1px solid ${quota.remaining===0?'#fecaca':'#c7d2fe'}`, borderRadius:8, padding:'3px 10px' }}>
                Còn {quota.remaining}/{quota.dailyLimit} lượt hôm nay
              </span>
            )}
            <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', color:'#64748b' }}>ĐÓNG</button>
          </div>
        </div>

        <div style={{ padding:'20px 28px' }}>
          {/* Upload zone */}
          {!result && (
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${files.length?accent:'#e2e8f0'}`, borderRadius:14, padding:'32px 20px', textAlign:'center', cursor:'pointer', background: files.length?'#eef2ff':'#f8fafc', transition:'all 0.2s', marginBottom:16 }}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              {files.length ? (
                <p style={{ margin:0, fontWeight:700, color:accent }}>Đã chọn {files.length} ảnh — nhấp để thêm (tối đa 5)</p>
              ) : (
                <>
                  <p style={{ margin:'0 0 6px', fontWeight:700, color:'#64748b' }}>Kéo thả ảnh vào đây hoặc nhấp để chọn file</p>
                  <p style={{ margin:0, fontSize:'0.78rem', color:'#94a3b8' }}>JPG, PNG, WEBP — tối đa 5 ảnh</p>
                </>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => addFiles(e.target.files)} />

          {/* Previews */}
          {previews.length > 0 && !result && (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position:'relative', width:80, height:80, borderRadius:10, overflow:'hidden', border:'2px solid #c7d2fe' }}>
                  <img src={src} alt={`p${i}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <button onClick={() => { setFiles(p => p.filter((_,j)=>j!==i)); }} style={{ position:'absolute', top:3, right:3, background:'rgba(239,68,68,0.9)', border:'none', borderRadius:'50%', width:20, height:20, cursor:'pointer', color:'#fff', fontSize:13, lineHeight:'20px', textAlign:'center' }}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'0.83rem', marginBottom:14 }}>
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ display:'inline-block', width:28, height:28, border:'3px solid #e2e8f0', borderTop:`3px solid ${accent}`, borderRadius:'50%', animation:'spin 0.8s linear infinite', marginBottom:12 }} />
              <p style={{ margin:0, color:accent, fontWeight:700, fontSize:'0.9rem' }}>AI đang phân tích ảnh... (10-30 giây)</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <p style={{ margin:0, fontWeight:800, fontSize:'0.9rem', color:'#0f172a' }}>Kết quả phân tích — {result.items?.length || 0} mặt hàng · Tổng ~{result.totalVolumeM3} m²</p>
                <button onClick={() => { setResult(null); setFiles([]); setError(null); }}
                  style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:'0.78rem', fontWeight:600, color:'#475569' }}>
                  Phân tích lại
                </button>
              </div>
              <div style={{ border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['Tên hàng hóa','Số lượng','diện tích/cái (m²)','Tổng diện tích (m²)'].map(h => (
                        <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontWeight:700, color:'#64748b', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #f1f5f9' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(result.items||[]).map((ai, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #f9fafb' }}>
                        <td style={{ padding:'10px 14px', fontWeight:600, color:'#1e293b' }}>{ai.name}</td>
                        <td style={{ padding:'10px 14px', color:'#374151' }}>{ai.quantity || 1}</td>
                        <td style={{ padding:'10px 14px', color:'#6366f1', fontWeight:600 }}>{(ai.estimatedVolumeM3||0).toFixed(4)}</td>
                        <td style={{ padding:'10px 14px', color:'#4f46e5', fontWeight:700 }}>
                          {((ai.estimatedVolumeM3||0)*(ai.quantity||1)).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.specialNotes && (
                <div style={{ padding:'10px 14px', borderRadius:10, background:'#fffbeb', border:'1px solid #fde68a', fontSize:'0.82rem', color:'#92400e', marginBottom:14 }}>
                  Lưu ý từ AI: {result.specialNotes}
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
            {!result ? (
              <button onClick={handleAnalyze} disabled={loading || !files.length}
                style={{ padding:'11px 26px', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.9rem', cursor: (!files.length||loading)?'not-allowed':'pointer', color:'#fff', background: (!files.length||loading)?'#e2e8f0':`linear-gradient(135deg,${accent},#8b5cf6)`, boxShadow: (!files.length||loading)?'none':'0 4px 16px rgba(99,102,241,0.4)', transition:'all 0.2s', display:'flex', alignItems:'center', gap:8 }}>
                {loading && <span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />}
                {loading ? 'Đang phân tích...' : 'Phân tích với AI'}
              </button>
            ) : (
              <button onClick={handleImport}
                style={{ padding:'11px 28px', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', color:'#fff', background:'linear-gradient(135deg,#10b981,#059669)', boxShadow:'0 4px 16px rgba(16,185,129,0.4)', transition:'all 0.2s' }}>
                Nhập {result.items?.length} mặt hàng vào yêu cầu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Searchable row (INBOUND only) ─────────────────────────────────────── */
function ItemRow({ item, idx, type, list, loading, accent, onUpdate, onRemove, onEnter, canRemove, contractedArea }) {
  const ref = useRef(null);
  const KG_PER_M3 = 500; // tải trọng sàn kho tiêu chuẩn kg/m²
  const filtered = (item.search ? list.filter(a=>(a.assetName||'').toLowerCase().includes(item.search.toLowerCase())) : list).slice(0,20);

  // OUTBOUND: vượt tồn kho (hard block)
  const isOver = type==='OUTBOUND' && item.availableQty!==null && Number(item.qty)>item.availableQty;

  // INBOUND tầng 1 — hard warning trọng lượng (đỏ, chặn ở backend)
  const itemWeight = item.weightPerUnit && Number(item.weightPerUnit) > 0
    ? Number(item.weightPerUnit) * Number(item.qty || 1)
    : null;
  const maxWeightKg = contractedArea > 0 ? contractedArea * KG_PER_M3 : null;
  const isOverWeight = itemWeight !== null && maxWeightKg !== null && itemWeight > maxWeightKg;

  useEffect(()=>{
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) onUpdate({ showDrop:false }); };
    document.addEventListener('mousedown',fn);
    return ()=>document.removeEventListener('mousedown',fn);
  },[]);

  return (
    <tr style={{ borderBottom:'1px solid #f1f5f9' }}>
      <td style={{ padding:'10px 14px', color:'#94a3b8', fontSize:'0.8rem', fontWeight:700, width:36 }}>{idx+1}</td>
      <td style={{ padding:'6px 8px', minWidth:220 }}>
        <div ref={ref} style={{ position:'relative' }}>
          <input value={item.search||item.itemName}
            onChange={e=>{ const v=e.target.value; onUpdate({ search:v, itemName:v, assetId:null, isNew:false, showDrop:true, weightPerUnit:null }); }}
            onFocus={()=>onUpdate({ showDrop:true })}
            onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); onEnter(); } }}
            placeholder="Tìm hoặc gõ tên hàng..."
            style={{ ...inp(), borderColor: item.showDrop ? accent : '#e2e8f0' }}
          />
          {item.isNew && <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:'0.7rem', color:accent, fontWeight:700, background:`${accent}15`, padding:'2px 6px', borderRadius:8 }}>MỚI</span>}
          {item.showDrop && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:200, maxHeight:200, overflowY:'auto' }}>
              {loading ? <div style={{ padding:12, color:'#94a3b8', fontSize:'0.83rem', textAlign:'center' }}>Đang tải...</div>
              : filtered.length===0 && !item.search ? <div style={{ padding:12, color:'#94a3b8', fontSize:'0.83rem', textAlign:'center' }}>Gõ để tìm kiếm</div>
              : <>
                {filtered.map(a=>(
                  <div key={a.assetId} onMouseDown={()=>onUpdate({
                      assetId: a.assetId, itemName: a.assetName,
                      unit: a.unit||'cái', search: a.assetName,
                      availableQty: a.quantity??null, isNew: false,
                      showDrop: false,
                      weightPerUnit: a.weightPerUnit || null
                    })}
                    style={{ padding:'9px 14px', cursor:'pointer', fontSize:'0.85rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <span style={{ fontWeight:600, color:'#1e293b' }}>{a.assetName}</span>
                    <span style={{ fontSize:'0.75rem', color:'#94a3b8', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:1 }}>
                      <span>{a.unit}</span>
                      {a.weightPerUnit && <span style={{ color:'#cbd5e1' }}>{a.weightPerUnit} kg/cái</span>}
                    </span>
                  </div>
                ))}
                {item.search && !filtered.find(a=>a.assetName.toLowerCase()===item.search.toLowerCase()) && (
                  <div onMouseDown={()=>onUpdate({ assetId:null, itemName:item.search, isNew:true, showDrop:false, unit:'cái', weightPerUnit:null })}
                    style={{ padding:'9px 14px', cursor:'pointer', fontSize:'0.85rem', color:accent, fontWeight:700, borderTop:'1px solid #f1f5f9' }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${accent}10`} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    + Tạo mới: "{item.search}"
                  </div>
                )}
              </>}
            </div>
          )}
        </div>
      </td>
      <td style={{ padding:'6px 8px', width:100 }}>
        <UnitCombobox value={item.unit} onChange={v=>onUpdate({ unit:v })} accent={accent}/>
      </td>
      <td style={{ padding:'6px 8px', width:110 }}>
        <input type="number" min={1}
          value={item.qty} onChange={e=>onUpdate({ qty:e.target.value })}
          onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); onEnter(); }}}
          style={{ ...inp(),
            borderColor: isOver ? '#fca5a5' : isOverWeight ? '#fca5a5' : '#e2e8f0',
            color: isOver ? '#dc2626' : isOverWeight ? '#dc2626' : '#1e293b',
            fontWeight:700 }} />
        {isOverWeight && (
          <div style={{ fontSize:'0.68rem', color:'#dc2626', marginTop:3, fontWeight:600, lineHeight:1.3 }}>
            Tải trọng vượt giới hạn sàn kho<br/>
            ({itemWeight?.toLocaleString('vi-VN')} kg / tối đa {maxWeightKg?.toLocaleString('vi-VN')} kg)
          </div>
        )}
        {!isOverWeight && itemWeight !== null && itemWeight > 0 && (
          <div style={{ fontSize:'0.67rem', color:'#94a3b8', marginTop:2 }}>
            ~{itemWeight >= 1000 ? `${(itemWeight/1000).toFixed(1)} tấn` : `${itemWeight.toLocaleString('vi-VN')} kg`}
          </div>
        )}
      </td>

      <td style={{ padding:'6px 8px', minWidth:160 }}>
        <input value={item.note||''} onChange={e=>onUpdate({ note:e.target.value })}
          placeholder="VD: Dễ vỡ, bảo quản lạnh..."
          style={{ ...inp(), fontSize:'0.82rem', color:'#475569' }}/>
      </td>
      <td style={{ padding:'6px 8px', width:44 }}>
        <button onClick={onRemove} disabled={!canRemove} title="Xóa dòng"
          style={{ width:32, height:32, borderRadius:8, border:`1px solid ${canRemove?'#fecaca':'#f1f5f9'}`, background:canRemove?'#fef2f2':'transparent', color:canRemove?'#dc2626':'#e2e8f0', cursor:canRemove?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, transition:'all 0.15s' }}>
          Xóa
        </button>
      </td>
    </tr>
  );
}

/* ── Outbound Checkbox Table ────────────────────────────────────────────── */
function OutboundInventoryTable({ inventory, loading, selectedItems, setSelectedItems, accent }) {
  const [search, setSearch] = useState('');

  const handleToggle = (asset) => {
    setSelectedItems(prev => {
      const cur = prev[asset.assetId] || { checked:false, qty:1, note:'' };
      return { ...prev, [asset.assetId]: { ...cur, checked:!cur.checked } };
    });
  };
  const handleQtyChange = (assetId, val) => {
    setSelectedItems(prev => ({ ...prev, [assetId]: { ...(prev[assetId]||{ checked:true, note:'' }), qty: val } }));
  };
  const handleNoteChange = (assetId, val) => {
    setSelectedItems(prev => ({ ...prev, [assetId]: { ...(prev[assetId]||{ checked:true, qty:1 }), note: val } }));
  };

  const filtered = inventory.filter(a =>
    (a.assetName||'').toLowerCase().includes(search.toLowerCase())
  );

  const checkedCount = Object.values(selectedItems).filter(v=>v.checked).length;

  if (loading) return (
    <div style={{ padding:'40px 24px', textAlign:'center', color:'#94a3b8' }}>
      <div style={{ fontWeight:600 }}>Đang tải tồn kho...</div>
    </div>
  );

  if (!loading && inventory.length === 0) return (
    <div style={{ padding:'48px 24px', textAlign:'center' }}>
      <div style={{ fontWeight:700, fontSize:'1rem', color:'#1e293b', marginBottom:6 }}>Kho hiện không có hàng hóa</div>
      <div style={{ fontSize:'0.83rem', color:'#94a3b8' }}>Chưa có mặt hàng nào được nhập vào kho này.</div>
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ position:'relative', flex:1, maxWidth:340 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Tìm kiếm mặt hàng..."
            style={{ ...inp(), borderRadius:10 }}
            onFocus={e=>e.target.style.borderColor=accent}
            onBlur={e=>e.target.style.borderColor='#e2e8f0'}
          />
        </div>
        <span style={{ fontSize:'0.82rem', fontWeight:600, color: checkedCount>0 ? accent : '#94a3b8',
          background: checkedCount>0 ? `${accent}15` : '#f8fafc',
          border:`1px solid ${checkedCount>0 ? `${accent}40` : '#e2e8f0'}`,
          padding:'5px 12px', borderRadius:20, whiteSpace:'nowrap', transition:'all 0.2s' }}>
          Đã chọn: {checkedCount} / {inventory.length}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f8fafc', position:'sticky', top:0, zIndex:2 }}>
              {['', 'Tên hàng hóa', 'Đơn vị', 'Tồn kho', 'Số lượng xuất', 'Ghi chú'].map((h,i)=>(
                <th key={i} style={{ padding:'10px 14px', fontSize:'0.7rem', fontWeight:700, color:'#94a3b8', textAlign:'left', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:'32px', textAlign:'center', color:'#94a3b8', fontSize:'0.87rem' }}>
                Không tìm thấy mặt hàng nào
              </td></tr>
            ) : filtered.map(asset => {
              const state = selectedItems[asset.assetId] || { checked:false, qty:1, note:'' };
              const isChecked = !!state.checked;
              const isOver = isChecked && Number(state.qty) > asset.quantity;
              return (
                <tr key={asset.assetId}
                  style={{ borderBottom:'1px solid #f1f5f9', background: isChecked ? '#fffbeb' : '#fff', transition:'background 0.15s', cursor:'pointer' }}
                  onClick={() => handleToggle(asset)}>
                  {/* Checkbox */}
                  <td style={{ padding:'12px 14px', width:44 }} onClick={e=>e.stopPropagation()}>
                    <input type="checkbox" checked={isChecked}
                      onChange={()=>handleToggle(asset)}
                      style={{ width:17, height:17, accentColor:accent, cursor:'pointer' }}/>
                  </td>
                  {/* Name */}
                  <td style={{ padding:'10px 14px', fontWeight:isChecked?700:500, color:'#1e293b', fontSize:'0.88rem' }}>
                    {asset.assetName}
                  </td>
                  {/* Unit */}
                  <td style={{ padding:'10px 14px', color:'#64748b', fontSize:'0.83rem' }}>{asset.unit||'—'}</td>
                  {/* Stock */}
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#16a34a', background:'#f0fdf4', border:'1px solid #bbf7d0', padding:'3px 10px', borderRadius:20 }}>
                      {asset.quantity}
                    </span>
                  </td>
                  {/* Qty input */}
                  <td style={{ padding:'8px 10px', width:120 }} onClick={e=>e.stopPropagation()}>
                    <input type="number" min={1} max={asset.quantity}
                      value={state.qty}
                      disabled={!isChecked}
                      onChange={e=>handleQtyChange(asset.assetId, e.target.value)}
                      style={{ ...inp(), width:90, fontWeight:700,
                        borderColor: !isChecked ? '#f1f5f9' : isOver ? '#fca5a5' : accent,
                        color: !isChecked ? '#cbd5e1' : isOver ? '#dc2626' : '#1e293b',
                        background: !isChecked ? '#f8fafc' : '#fff',
                        cursor: isChecked ? 'text' : 'not-allowed' }}/>
                    {isOver && <div style={{ fontSize:'0.7rem', color:'#dc2626', marginTop:3, fontWeight:600 }}>Vượt tồn kho</div>}
                  </td>
                  {/* Note */}
                  <td style={{ padding:'8px 10px', minWidth:180 }} onClick={e=>e.stopPropagation()}>
                    <input value={state.note||''}
                      disabled={!isChecked}
                      onChange={e=>handleNoteChange(asset.assetId, e.target.value)}
                      placeholder={isChecked ? 'Ghi chú...' : '—'}
                      style={{ ...inp(), fontSize:'0.81rem', color:'#475569',
                        borderColor: !isChecked ? '#f1f5f9' : '#e2e8f0',
                        background: !isChecked ? '#f8fafc' : '#fff',
                        cursor: isChecked ? 'text' : 'not-allowed' }}/>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Document upload ────────────────────────────────────── */
function DocUpload({ docFiles, setDocFiles, uploadedUrls, accent }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);

  const add = files => {
    const valid = Array.from(files).filter(f=>(ALLOWED_MIME.includes(f.type)||ALLOWED_EXT.test(f.name))&&f.size<=10*1024*1024);
    setDocFiles(prev=>[...prev,...valid.map(f=>({ file:f, name:f.name, size:f.size }))].slice(0,10));
  };

  return (
    <div>
      <p style={{ fontSize:'0.82rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
        Chứng từ đính kèm <span style={{ textTransform:'none', fontWeight:400, color:'#94a3b8' }}>(tuỳ chọn)</span>
      </p>
      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);add(e.dataTransfer.files);}}
        onClick={()=>ref.current?.click()}
        style={{ border:`2px dashed ${drag?accent:'#cbd5e1'}`, borderRadius:12, padding:'18px 14px', textAlign:'center', cursor:'pointer', background:drag?`${accent}10`:'#fafbff', transition:'all 0.2s' }}>
        <p style={{ fontSize:'0.83rem', fontWeight:600, color:'#475569', margin:0 }}>Kéo thả file vào đây</p>
        <p style={{ fontSize:'0.73rem', color:'#94a3b8', marginTop:4 }}>PDF, ảnh, Excel, Word · Tối đa 10 file, mỗi file ≤ 10MB</p>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx" style={{ display:'none' }} onChange={e=>add(e.target.files)} />
      </div>
      {docFiles.length>0 && (
        <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:5 }}>
          {docFiles.map((f,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:8, background:uploadedUrls.length?'#f0fdf4':'#f8fafc', border:`1px solid ${uploadedUrls.length?'#bbf7d0':'#e2e8f0'}` }}>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:'0.78rem', fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</p>
                <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8' }}>{fmtBytes(f.size)}</p>
              </div>
              {uploadedUrls.length ? <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#16a34a' }}>Đã tải</span>
                : <button onClick={e=>{e.stopPropagation();setDocFiles(p=>p.filter((_,j)=>j!==i));}} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'0.8rem', fontWeight:600, padding:0 }}>Xóa</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function CreateInventoryRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const initType = new URLSearchParams(location.search).get('tab')==='outbound' ? 'OUTBOUND' : 'INBOUND';

  const [step, setStep] = useState(1);
  const [type, setType] = useState(initType);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingWH, setLoadingWH] = useState(true);
  const [warehouseId, setWarehouseId] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [loadingInv, setLoadingInv] = useState(false);

  // INBOUND items (combobox rows)
  const [items, setItems] = useState([newRow()]);

  // OUTBOUND selected items: { [assetId]: { checked, qty, note } }
  const [selectedItems, setSelectedItems] = useState({});

  const [docFiles, setDocFiles] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [error, setError] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [capacityInfo, setCapacityInfo] = useState(null);
  const [loadingCapacity, setLoadingCapacity] = useState(false);
  const DRAFT_KEY = 'inv_req_draft';

  // Import AI-analyzed rows into the items table
  const handleAiImport = (rows) => {
    setItems(prev => {
      // Remove empty placeholder rows (first row if untouched)
      const cleaned = prev.filter(i => i.itemName || i.search);
      return cleaned.length ? [...cleaned, ...rows] : rows;
    });
  };

  useEffect(()=>{
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if(raw){ const d=JSON.parse(raw); if(d?.items?.length) setHasDraft(true); }
    } catch{}
  },[]);

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ type, warehouseId, step, items, notes, scheduledDate, savedAt: new Date().toISOString() }));
      setDraftSaved(true);
      setTimeout(()=>setDraftSaved(false), 2500);
    } catch{ alert('Không thể lưu nháp.'); }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if(!raw) return;
      const d = JSON.parse(raw);
      if(d.type)       setType(d.type);
      if(d.warehouseId) setWarehouseId(d.warehouseId);
      if(d.items?.length) setItems(d.items.map(i=>({...newRow(),...i,id:Date.now()+Math.random()})));
      if(d.notes)      setNotes(d.notes);
      if(d.scheduledDate) setScheduledDate(d.scheduledDate);
      if(d.step)       setStep(d.step);
      setHasDraft(false);
    } catch{ alert('Không thể phục hồi nháp.'); }
  };

  const clearDraft = () => { localStorage.removeItem(DRAFT_KEY); setHasDraft(false); };

  const accent = type==='INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  const selectedWH = warehouses.find(w=>w.warehouseId===warehouseId);

  // Load warehouses
  useEffect(()=>{
    axiosClient.get('/rental-contracts/my-contracts')
      .then(res=>{
        const contracts = Array.isArray(res.data)?res.data:[];
        const seen=new Set();
        const whs = contracts.filter(c=>c.status==='ACTIVE'||c.status==='EXPIRED').reduce((acc,c)=>{
          if(c.warehouseId&&!seen.has(c.warehouseId)){
            seen.add(c.warehouseId);
            acc.push({
              warehouseId: c.warehouseId,
              name: c.warehouseName||`Kho #${c.warehouseId}`,
              status: c.status,
              contractNumber: c.contractNumber,
              requestedArea: c.requestedArea || 0,
            });
          }
          return acc;
        },[]);
        setWarehouses(whs);
        if(whs.length===1){ setWarehouseId(whs[0].warehouseId); }
      })
      .catch(()=>setWarehouses([]))
      .finally(()=>setLoadingWH(false));
  },[]);

  // Load capacity info when warehouse and type change
  useEffect(()=>{
    if(type!=='INBOUND' || !warehouseId) { setCapacityInfo(null); return; }
    setLoadingCapacity(true);
    renterAssetService.getCapacity(warehouseId)
      .then(res=>setCapacityInfo(res.data))
      .catch(()=>setCapacityInfo(null))
      .finally(()=>setLoadingCapacity(false));
  },[type, warehouseId]);

  const selectedWHData = warehouses.find(w=>w.warehouseId===warehouseId);
  const contractedVolume = selectedWHData?.requestedArea ?? 0;
  const contractedArea   = contractedVolume; // alias for weight check in ItemRow

  // Tổng diện tích ước tính từ các items đang điền (mỗi dòng = perUnit * qty)
  const totalEstimatedVol = items.reduce((sum, i) => sum + ((Number(i.estimatedVolume)||0) * (Number(i.qty)||1)), 0);
  const volumeUsagePercent = contractedVolume > 0 ? (totalEstimatedVol / contractedVolume) * 100 : 0;
  const isVolumeOverContract = totalEstimatedVol > contractedVolume && contractedVolume > 0;

  // Load assets for INBOUND
  useEffect(()=>{
    if(type!=='INBOUND') return;
    setLoadingAssets(true);
    renterAssetService.getMyAssets()
      .then(res=>setAssets(Array.isArray(res.data)?res.data:[]))
      .catch(()=>setAssets([]))
      .finally(()=>setLoadingAssets(false));
  },[type]);

  // Load inventory for OUTBOUND
  useEffect(()=>{
    if(type!=='OUTBOUND'||!warehouseId) return;
    setLoadingInv(true);
    renterAssetService.getInventoryByWarehouse(Number(warehouseId))
      .then(res=>setInventory((Array.isArray(res.data)?res.data:[]).filter(i=>i.quantity>0)))
      .catch(()=>setInventory([]))
      .finally(()=>setLoadingInv(false));
  },[type,warehouseId]);

  // INBOUND helpers
  const updateItem = (id,patch) => setItems(prev=>prev.map(i=>i.id===id?{...i,...patch}:i));
  const addRow = () => setItems(prev=>[...prev,newRow()]);
  const removeRow = id => setItems(prev=>prev.length>1?prev.filter(i=>i.id!==id):prev);

  const handleProceed = () => {
    if(!warehouseId){ setError('Vui lòng chọn kho.'); return; }
    setError('');
    setItems([newRow()]);
    setSelectedItems({});
    setStep(2);
  };

  const uploadDocuments = async () => {
    if(!docFiles.length) return [];
    setUploadingDocs(true);
    try {
      const fd=new FormData(); docFiles.forEach(({file})=>fd.append('files',file));
      const res=await axiosClient.post('/upload/inventory-documents',fd,{headers:{'Content-Type':'multipart/form-data'}});
      const urls=res.data?.urls||[]; setUploadedUrls(urls); return urls;
    } catch(err){ throw new Error(err?.response?.data?.message||'Upload chứng từ thất bại.'); }
    finally{ setUploadingDocs(false); }
  };

  const handleSubmit = async () => {
    setError('');

    if(type === 'OUTBOUND') {
      const chosen = inventory.filter(a => selectedItems[a.assetId]?.checked);
      if(!chosen.length){ setError('Vui lòng chọn ít nhất 1 mặt hàng.'); return; }
      for(const asset of chosen){
        const s = selectedItems[asset.assetId];
        if(!s.qty || Number(s.qty) < 1){ setError(`"${asset.assetName}": Số lượng phải >= 1.`); return; }
        if(Number(s.qty) > asset.quantity){ setError(`"${asset.assetName}": Số lượng vượt tồn kho (${asset.quantity}).`); return; }
      }
      submitToServer();
      return;
    }

    const valid=items.filter(i=>i.itemName.trim()||i.assetId);
    if(!valid.length){setError('Vui lòng thêm ít nhất 1 mặt hàng.');return;}
    for(const it of valid){
      if(!it.itemName.trim()){setError('Vui lòng nhập tên hàng hóa.');return;}
      if(!it.qty||Number(it.qty)<1){setError('Số lượng phải >= 1.');return;}
    }
    submitToServer();
  };

  const submitToServer = async () => {

    if(type === 'OUTBOUND') {
      const chosen = inventory.filter(a => selectedItems[a.assetId]?.checked);
      setSubmitting(true);
      try {
        let docUrls=uploadedUrls;
        if(docFiles.length&&!uploadedUrls.length) docUrls=await uploadDocuments();
        const processedItems = chosen.map(asset => ({
          assetId: asset.assetId,
          itemName: asset.assetName,
          quantity: Number(selectedItems[asset.assetId].qty),
          unit: asset.unit||'cái',
          description: selectedItems[asset.assetId].note||null,
        }));
        await inventoryService.createInventoryRequest({ warehouseId:Number(warehouseId), type:'OUTBOUND', notes:notes||null, scheduledDate:scheduledDate||null, documentUrls:docUrls.length?docUrls:null, items:processedItems, renterSignatureBase64: null });
        clearDraft();
        navigate('/renter-inventory-history?tab=outbound',{state:{created:true,type:'OUTBOUND'}});
      } catch(err){ setError(err?.response?.data?.message || err?.message || 'Tạo yêu cầu thất bại.'); }
      finally{ setSubmitting(false); }
      return;
    }

    const valid=items.filter(i=>i.itemName.trim()||i.assetId);
    setSubmitting(true);
    try {
      let docUrls=uploadedUrls;
      if(docFiles.length&&!uploadedUrls.length) docUrls=await uploadDocuments();
      const processed=[];
      for(const it of valid){
        let assetId=it.assetId;
        if(it.isNew&&it.itemName.trim()){
          const r=await renterAssetService.createAsset({assetName:it.itemName.trim(),unit:it.unit,weightPerUnit:null});
          assetId=r.data.assetId;
        }
        processed.push({ assetId, itemName:it.itemName.trim(), quantity:Number(it.qty), unit:it.unit, description:it.note||null, estimatedVolume: it.estimatedVolume ? Number(it.estimatedVolume) * Number(it.qty) : null });
      }
      await inventoryService.createInventoryRequest({ warehouseId:Number(warehouseId), type:'INBOUND', notes:notes||null, scheduledDate:scheduledDate||null, documentUrls:docUrls.length?docUrls:null, items:processed, renterSignatureBase64: null });
      clearDraft();
      navigate('/renter-inventory-history?tab=inbound',{state:{created:true,type:'INBOUND'}});
    } catch(err){ setError(err?.response?.data?.message || err?.message || 'Tạo yêu cầu thất bại.'); }
    finally{ setSubmitting(false); }
  };

  const card = { background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' };
  const outboundCheckedCount = Object.values(selectedItems).filter(v=>v.checked).length;
  const inboundFilledCount = items.filter(i=>i.itemName.trim()).length;
  const itemCount = type==='OUTBOUND' ? outboundCheckedCount : inboundFilledCount;

  return (
    <div style={{ fontFamily:'Inter, sans-serif', maxWidth:920, margin:'0 auto', paddingBottom:60 }}>
      {hasDraft && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:12, background:'#fffbeb', border:'1.5px solid #fde68a', marginBottom:18 }}>
          <span style={{ flex:1, fontSize:'0.87rem', color:'#92400e', fontWeight:600 }}>Bạn có một bản nháp chưa hoàn thành. Muốn tiếp tục?</span>
          <button onClick={loadDraft} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#f59e0b', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer' }}>Phục hồi nháp</button>
          <button onClick={clearDraft} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #fde68a', background:'#fff', color:'#92400e', fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>Bỏ qua</button>
        </div>
      )}

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.7rem', fontWeight:900, color:'#0f172a', margin:'0 0 4px' }}>
          {step===1 ? 'Tạo yêu cầu nhập / xuất kho' : `${type==='INBOUND'?'Nhập kho':'Xuất kho'} — ${selectedWH?.name||''}`}
        </h1>
        <p style={{ color:'#64748b', fontSize:'0.88rem', margin:0 }}>
          {step===1 ? 'Chọn loại yêu cầu và kho hàng để tiếp tục.' : 'Thêm hàng hóa, chứng từ và ghi chú cho yêu cầu.'}
        </p>

        {step === 2 && warehouseId && type === 'INBOUND' && (
          <div style={{ marginTop: '16px', marginBottom: '-8px' }}>
            <RenterSpaceUsageWarning warehouseId={warehouseId} renterId={authService.getCurrentUser()?.userId} />
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:16 }}>
          {[1,2].map(s=>(
            <React.Fragment key={s}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:800, background:step>=s?accent:'#e2e8f0', color:step>=s?'#fff':'#94a3b8', transition:'all 0.3s', flexShrink:0 }}>
                {step>s?'✓':s}
              </div>
              <span style={{ fontSize:'0.82rem', color:step===s?'#0f172a':'#94a3b8', fontWeight:step===s?700:400 }}>
                {s===1?'Chọn kho & loại':'Thêm hàng hóa'}
              </span>
              {s<2&&<div style={{ flex:1, height:2, background:step>s?accent:'#e2e8f0', borderRadius:2, maxWidth:60, transition:'all 0.3s' }}/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error&&<div style={{ padding:'11px 16px', borderRadius:10, marginBottom:18, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'0.87rem', fontWeight:600 }}>{error}</div>}

      {step===1&&(
        <div style={{ ...card, padding:32 }}>
          <div style={{ marginBottom:28 }}>
            <p style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Loại yêu cầu</p>
            <div style={{ display:'flex', gap:12 }}>
              {[{v:'INBOUND',label:'NHẬP KHO',desc:'Nhập hàng hóa vào kho lưu trữ',color:INBOUND_COLOR,bg:'#e0f7fa'},
                {v:'OUTBOUND',label:'XUẤT KHO',desc:'Lấy hàng ra khỏi kho',color:OUTBOUND_COLOR,bg:'#fff8e1'}].map(({v,label,desc,color,bg})=>(
                <button key={v} onClick={()=>setType(v)} style={{ flex:1, padding:'24px 20px', borderRadius:14, cursor:'pointer', textAlign:'left', border:`2px solid ${type===v?color:'#e2e8f0'}`, background:type===v?bg:'#fafbff', transition:'all 0.2s', boxShadow:type===v?`0 4px 16px ${color}30`:'none' }}>
                  <div style={{ fontWeight:900, fontSize:'1.4rem', color:type===v?color:'#1e293b', letterSpacing:'0.02em', marginBottom:6 }}>{label}</div>
                  <div style={{ fontSize:'0.85rem', color:'#64748b', marginTop:3 }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Kho hàng</p>
            {loadingWH ? <div style={{ padding:20, textAlign:'center', color:'#94a3b8' }}>Đang tải...</div>
            : warehouses.length===0 ? <div style={{ padding:16, borderRadius:12, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'0.87rem' }}>Bạn chưa có hợp đồng thuê kho nào đang hoạt động.</div>
            : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {warehouses.map(wh=>{
                const isDisabled = type === 'INBOUND' && wh.status !== 'ACTIVE';
                return (
                <label key={wh.warehouseId} className="wh-card" style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderRadius:12, cursor: isDisabled ? 'not-allowed' : 'pointer', border:`2px solid ${warehouseId===wh.warehouseId?accent:'#e2e8f0'}`, background:warehouseId===wh.warehouseId?(type==='INBOUND'?'#e0f7fa':'#fff8e1'):(isDisabled ? '#f8fafc' : '#fafbff'), transition:'all 0.15s', opacity: isDisabled ? 0.6 : 1 }}>
                  <input type="radio" name="wh" value={wh.warehouseId} checked={warehouseId===wh.warehouseId} onChange={()=>{if(!isDisabled) setWarehouseId(wh.warehouseId);}} disabled={isDisabled} style={{ accentColor:accent, width:18, height:18, flexShrink:0, cursor:isDisabled ? 'not-allowed' : 'pointer' }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:'0.95rem', color:'#1e293b' }}>{wh.name} {isDisabled && <span style={{fontSize:'0.7rem', color:'#dc2626', fontWeight:600, marginLeft:6}}>(Chỉ được xuất kho)</span>}</div>
                    {wh.contractNumber&&<div style={{ fontSize:'0.77rem', color:'#64748b', marginTop:2 }}>HĐ: {wh.contractNumber}</div>}
                    {warehouseId===wh.warehouseId && type==='INBOUND' && (
                      <div style={{ marginTop:8 }}>
                        {loadingCapacity ? (
                          <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Đang tải sức chứa...</span>
                        ) : capacityInfo ? (
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                              <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#475569' }}>
                                Sức chứa: {Number(capacityInfo.usedArea).toFixed(1)}/{Number(capacityInfo.contractedArea).toFixed(1)} m²
                              </span>
                              <span style={{ fontSize:'0.7rem', fontWeight:700, color: capacityInfo.usagePercent >= 100 ? '#dc2626' : capacityInfo.usagePercent >= 80 ? '#d97706' : '#16a34a', background: capacityInfo.usagePercent >= 100 ? '#fef2f2' : capacityInfo.usagePercent >= 80 ? '#fffbeb' : '#f0fdf4', border: `1px solid ${capacityInfo.usagePercent >= 100 ? '#fecaca' : capacityInfo.usagePercent >= 80 ? '#fde68a' : '#bbf7d0'}`, padding:'1px 8px', borderRadius:12 }}>
                                {capacityInfo.usagePercent >= 100 ? 'ĐÃ ĐẦY' : `Còn trống: ${Number(capacityInfo.remainingArea).toFixed(1)} m²`}
                              </span>
                            </div>
                            <div style={{ height:6, borderRadius:3, background:'#f1f5f9', overflow:'hidden' }}>
                              <div style={{ height:'100%', borderRadius:3, width:`${Math.min(100, capacityInfo.usagePercent)}%`, background: capacityInfo.usagePercent >= 100 ? '#dc2626' : capacityInfo.usagePercent >= 80 ? '#d97706' : '#16a34a', transition:'width 0.3s' }} />
                            </div>
                            {capacityInfo.usagePercent >= 100 && (
                              <p style={{ margin:'6px 0 0', fontSize:'0.72rem', fontWeight:600, color:'#dc2626' }}>
                                Kho đã hết diện tích! Yêu cầu nhập kho có thể bị từ chối bởi thủ kho.
                              </p>
                            )}
                          </div>
                        ) : wh.requestedArea > 0 ? (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:20, fontSize:'0.7rem', fontWeight:700, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1d4ed8' }}>
                            Sức chứa: {wh.requestedArea.toLocaleString('vi-VN')} m²
                          </span>
                        ) : (
                          <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>Đang tải thông tin hợp đồng...</span>
                        )}
                      </div>
                    )}

                    {/* Preview tồn kho — chỉ OUTBOUND, kho đang chọn */}
                    {warehouseId===wh.warehouseId && type==='OUTBOUND' && (
                      <div style={{ marginTop:8 }}>
                        {loadingInv ? (
                          <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Đang tải tồn kho...</span>
                        ) : inventory.length === 0 ? (
                          <span style={{ fontSize:'0.72rem', color:'#dc2626', fontWeight:600 }}>Kho này hiện không có hàng hóa nào</span>
                        ) : (
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            {inventory.slice(0,5).map(item=>(
                              <span key={item.assetId} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:20, fontSize:'0.7rem', fontWeight:600, background:'#fafafa', border:'1px solid #e2e8f0', color:'#374151' }}>
                                {item.assetName||item.itemName}
                                <span style={{ color:accent, fontWeight:700 }}>×{(item.quantity||0).toLocaleString('vi-VN')}</span>
                              </span>
                            ))}
                            {inventory.length > 5 && (
                              <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 10px', borderRadius:20, fontSize:'0.7rem', fontWeight:700, background:`${accent}15`, border:`1px solid ${accent}40`, color:accent }}>
                                +{inventory.length-5} mặt hàng khác
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {wh.status==='ACTIVE' ? (
                    <span className="badge-active" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', flexShrink:0 }}>
                      <span className="pulse-dot" style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', flexShrink:0 }}/>
                      Đang hiệu lực
                    </span>
                  ) : (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:'#fef3c7', color:'#d97706', border:'1px solid #fde68a', flexShrink:0 }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:'#f59e0b', flexShrink:0 }}/>
                      Đã hết hạn
                    </span>
                  )}
                </label>
              );})}
            </div>}
          </div>

          {/* Space usage warning — show as soon as a warehouse is selected (including auto-select when renter has only 1 warehouse) */}
          {warehouseId && type === 'INBOUND' && (
            <div style={{ marginTop:20 }}>
              <RenterSpaceUsageWarning
                warehouseId={warehouseId}
                renterId={authService.getCurrentUser()?.userId}
              />
            </div>
          )}

          <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
            <button onClick={handleProceed} disabled={!warehouseId||loadingWH}
              style={{ padding:'12px 28px', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.95rem', cursor:warehouseId?'pointer':'not-allowed', color:'#fff', background:warehouseId?`linear-gradient(135deg,${accent},${accent}bb)`:'#e2e8f0', boxShadow:warehouseId?`0 4px 16px ${accent}40`:'none', transition:'all 0.2s' }}>
              Tiếp theo →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step===2&&(
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Type info bar */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 18px', borderRadius:12, background: type==='INBOUND'?'#e0f7fa':'#fff8e1', border:`1.5px solid ${accent}30` }}>
            <span style={{ fontWeight:900, fontSize:'0.9rem', color: accent }}>{type==='INBOUND'?'NHẬP KHO':'XUẤT KHO'}</span>
            <span style={{ fontSize:'0.82rem', color:'#94a3b8', marginLeft:4 }}>—</span>
            <span style={{ fontSize:'0.82rem', color:'#64748b' }}>Kho: <strong style={{color:'#1e293b'}}>{selectedWH?.name}</strong></span>
            <span style={{ marginLeft:'auto', fontSize:'0.78rem', color:'#accent', fontStyle:'italic', cursor:'pointer' }} onClick={()=>{ setStep(1); setError(''); }}>Làm lại (Quay về bước 1)</span>
          </div>

          {/* Items card */}
          <div style={card}>
            {type==='OUTBOUND'
              ? <OutboundInventoryTable
                  inventory={inventory}
                  loading={loadingInv}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                  accent={accent}
                />
              : <>
                  <div style={{ padding:'16px 22px', borderBottom:'1px solid #f1f5f9' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontWeight:800, fontSize:'0.97rem', color:'#0f172a' }}>Danh sách hàng hóa</span>
                        {/* AI analyze button */}
                        <button onClick={()=>setAiModalOpen(true)}
                          style={{ padding:'5px 14px', borderRadius:8, border:'1.5px solid #c7d2fe', background:'#eef2ff', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', color:'#4f46e5', transition:'all 0.15s' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#e0e7ff'; e.currentTarget.style.borderColor='#818cf8';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='#eef2ff'; e.currentTarget.style.borderColor='#c7d2fe';}}>
                          Phân tích AI
                        </button>
                      </div>
                      {/* Volume summary bar & Smart Routing Hint */}
                      {contractedVolume > 0 && (
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          {totalEstimatedVol > 0 ? (
                            <>
                              <div style={{ width:160, height:7, borderRadius:4, background:'#e2e8f0', overflow:'hidden' }}>
                                <div style={{ height:'100%', borderRadius:4, transition:'width 0.4s', width:`${Math.min(100,volumeUsagePercent)}%`, background: isVolumeOverContract ? '#ef4444' : volumeUsagePercent > 80 ? '#f59e0b' : '#22c55e' }} />
                              </div>
                              <span style={{ fontSize:'0.78rem', fontWeight:700, color: isVolumeOverContract ? '#dc2626' : volumeUsagePercent > 80 ? '#d97706' : '#15803d' }}>
                                AI ước tính: {totalEstimatedVol.toFixed(2)} / {contractedVolume} m²
                              </span>
                              {isVolumeOverContract && (
                                <span style={{ fontSize:'0.74rem', fontWeight:700, color:'#dc2626', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:'2px 8px' }}>
                                  Vượt sức chứa — Cần Quản lý duyệt
                                </span>
                              )}
                            </>
                          ) : (
                            <div style={{ fontSize:'0.75rem', color:'#64748b', background:'#f8fafc', padding:'5px 12px', borderRadius:8, border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontWeight:700, color:'#4f46e5' }}>💡 Mẹo:</span> 
                              Dùng AI phân tích để được <strong style={{ color:'#16a34a' }}>Hệ thống tự động duyệt ngay!</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr style={{ background:'#f8fafc' }}>
                          {['#', 'Hàng hóa / Tài sản', 'Đơn vị', 'Số lượng', 'Ghi chú', ''].map((h,i)=>(
                            <th key={i} style={{ padding:'10px 14px', fontSize:'0.7rem', fontWeight:700, color:'#94a3b8', textAlign:'left', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item,idx)=>(
                          <ItemRow key={item.id} item={item} idx={idx} type={type}
                            list={assets} loading={loadingAssets} accent={accent}
                            onUpdate={patch=>updateItem(item.id,patch)}
                            onRemove={()=>removeRow(item.id)}
                            onEnter={addRow}
                            canRemove={items.length>1}
                            contractedArea={contractedArea}
                            contractedVolume={contractedVolume}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding:'12px 22px', borderTop:'1px solid #f1f5f9' }}>
                    <button onClick={addRow}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:`1.5px dashed ${accent}`, background:'transparent', color:accent, fontWeight:600, fontSize:'0.83rem', cursor:'pointer', transition:'all 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background=`${accent}10`}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      + Thêm dòng hàng hóa
                    </button>
                  </div>
                </>
            }
          </div>

          {/* Docs + Notes card */}
          <div style={{ ...card, padding:32 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40 }}>
              
              {/* Left Column */}
              <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
                {/* Date Picker */}
                <div>
                  <p style={{ fontSize:'0.82rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 10px' }}>
                    {type==='INBOUND'?'Ngày dự kiến nhập kho':'Ngày dự kiến xuất kho'} <span style={{ textTransform:'none', fontWeight:400, color:'#94a3b8' }}>(tuỳ chọn)</span>
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <input type="date" value={scheduledDate} min={new Date().toISOString().split('T')[0]}
                      onChange={e=>setScheduledDate(e.target.value)}
                      style={{ ...inp(), width:180, cursor:'pointer', colorScheme:'light', borderColor: scheduledDate ? accent : '#e2e8f0', background: scheduledDate ? `${accent}08` : '#fff', fontWeight: scheduledDate ? 700 : 500 }}
                      onFocus={e=>e.target.style.borderColor=accent}
                      onBlur={e=>e.target.style.borderColor=scheduledDate?accent:'#e2e8f0'}/>
                    
                    {scheduledDate ? (
                      <span style={{ fontSize:'0.85rem', fontWeight:700, color:accent, background:`${accent}15`, padding:'6px 14px', borderRadius:8 }}>
                        {new Date(scheduledDate).toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' })}
                      </span>
                    ) : (
                      <span style={{ fontSize:'0.82rem', color:'#94a3b8', fontStyle:'italic' }}>Để trống nếu chưa xác định</span>
                    )}
                  </div>
                </div>

                {/* Document Upload */}
                <DocUpload docFiles={docFiles} setDocFiles={setDocFiles} uploadedUrls={uploadedUrls} accent={accent} />
              </div>

              {/* Right Column */}
              <div style={{ display:'flex', flexDirection:'column' }}>
                <p style={{ fontSize:'0.82rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 10px' }}>
                  Ghi chú yêu cầu <span style={{ textTransform:'none', fontWeight:400, color:'#94a3b8' }}>(tuỳ chọn)</span>
                </p>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)}
                  placeholder={type==='INBOUND'?'Ví dụ:\n- Số xe giao hàng: 29H-12345\n- Khung giờ giao: 14h - 16h\n- Lưu ý: Hàng dễ vỡ, xin nhẹ tay...':'Ví dụ:\n- Số xe nhận hàng: 30F-98765\n- Đơn vị nhận: Công ty ABC\n- Mức độ khẩn cấp: Cao...'}
                  style={{ ...inp(), flex:1, resize:'none', background:'#f8fafc', lineHeight: 1.6, minHeight: 220 }}
                  onFocus={e=>{e.target.style.borderColor=accent; e.target.style.background='#fff';}}
                  onBlur={e=>{e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc';}}/>
              </div>

            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0' }}>
            <button onClick={()=>{ setStep(1); setError(''); }} disabled={submitting}
              style={{ padding:'11px 20px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', fontWeight:600, fontSize:'0.88rem', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
              Quay lại
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {draftSaved && (
                <span style={{ fontSize:'0.8rem', color:'#16a34a', fontWeight:600, background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:8, padding:'5px 12px' }}>
                  Đã lưu nháp
                </span>
              )}
              <span style={{ fontSize:'0.82rem', color:'#94a3b8' }}>
                {itemCount} mặt hàng
              </span>
              <button onClick={saveDraft} disabled={submitting}
                style={{ padding:'11px 18px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontWeight:600, fontSize:'0.88rem', cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.borderColor='#cbd5e1'; }}
                onMouseLeave={e=>{ e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                Lưu nháp
              </button>
              <button onClick={handleSubmit} disabled={submitting||uploadingDocs}
                style={{ padding:'12px 28px', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.95rem', cursor: submitting?'wait':'pointer', color:'#fff', background:`linear-gradient(135deg,${accent},${accent}bb)`, boxShadow:`0 4px 16px ${accent}40`, opacity:submitting?0.75:1, transition:'all 0.2s', display:'flex', alignItems:'center', gap:8 }}>
                {(submitting||uploadingDocs)&&<span style={{ display:'inline-block', width:15, height:15, border:'2px solid rgba(255,255,255,0.35)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>}
                {uploadingDocs?'Đang upload...':submitting?'Đang gửi...':'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg);}}
        .unit-drop::-webkit-scrollbar{display:none;}
        .unit-drop{scrollbar-width:none;-ms-overflow-style:none;}
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70%  { box-shadow: 0 0 0 7px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        @keyframes dot-beat {
          0%,100% { transform: scale(1); opacity:1; }
          50%      { transform: scale(1.35); opacity:0.8; }
        }
        .pulse-dot { animation: dot-beat 1.6s ease-in-out infinite; }
        .badge-active { animation: pulse-ring 2.2s ease-in-out infinite; }
        @keyframes slide-in {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .wh-card { animation: slide-in 0.25s ease both; }
        .wh-card:nth-child(2) { animation-delay: 0.06s; }
        .wh-card:nth-child(3) { animation-delay: 0.12s; }
        .wh-card:nth-child(4) { animation-delay: 0.18s; }
      `}</style>

      {/* AI Photo Modal */}
      {aiModalOpen && type==='INBOUND' && (
        <AiPhotoModal
          onClose={() => setAiModalOpen(false)}
          onImport={handleAiImport}
        />
      )}
    </div>
  );
}

