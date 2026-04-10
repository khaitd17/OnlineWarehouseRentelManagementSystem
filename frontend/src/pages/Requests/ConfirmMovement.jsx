import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../services/axiosClient';

const INBOUND_COLOR  = '#0ea5e9';
const OUTBOUND_COLOR = '#f59e0b';
const fmtDate  = d => d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';
const fmtDT    = d => d ? new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—';

/* ── Confirm Modal ──────────────────────────────────────────── */
const ConfirmModal = ({ req, onClose, onConfirm, loading }) => {
  const [note, setNote] = useState('');
  if (!req) return null;
  const accent = req.type === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  const isIn   = req.type === 'INBOUND';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:0, width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.18)', fontFamily:'Inter,sans-serif' }} onClick={e=>e.stopPropagation()}>

        {/* Modal header */}
        <div style={{ padding:'24px 28px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:46, height:46, borderRadius:14, background:`${accent}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>
              {isIn ? '📥' : '📤'}
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontWeight:800, fontSize:'1.05rem', color:'#0f172a' }}>{isIn ? 'Xác nhận nhập kho' : 'Xác nhận xuất kho'}</span>
                <span style={{ padding:'2px 10px', borderRadius:999, fontSize:'0.72rem', fontWeight:700, background:`${accent}15`, color:accent }}>#{req.invReqId}</span>
              </div>
              <p style={{ margin:'2px 0 0', fontSize:'0.82rem', color:'#64748b' }}>{req.warehouseName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', cursor:'pointer', padding:8, borderRadius:8 }}>✕</button>
        </div>

        <div style={{ padding:'20px 28px' }}>
          {/* Manager note */}
          {req.notes && (
            <div style={{ display:'flex', gap:10, background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:'12px 16px', marginBottom:18 }}>
              <span style={{ fontSize:'1rem', flexShrink:0 }}>📋</span>
              <div>
                <p style={{ margin:'0 0 3px', fontSize:'0.7rem', fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:'0.05em' }}>Ghi chú yêu cầu</p>
                <p style={{ margin:0, fontSize:'0.87rem', color:'#78350f' }}>{req.notes}</p>
              </div>
            </div>
          )}

          {/* Info grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
            {[
              ['👤 Người thuê', req.renterName||'—'],
              ['📅 Ngày tạo',   fmtDate(req.createdAt)],
              ['📧 Email',      req.renterEmail||'—'],
              ['📦 Số mặt hàng', `${req.items?.length||0} loại`],
            ].map(([k,v])=>(
              <div key={k} style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px' }}>
                <p style={{ margin:'0 0 2px', fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{k}</p>
                <p style={{ margin:0, fontSize:'0.85rem', color:'#1e293b', fontWeight:600, wordBreak:'break-word' }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Items */}
          <p style={{ margin:'0 0 10px', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Danh sách hàng hóa ({req.items?.length||0} mặt hàng)
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
            {(req.items||[]).map((item,i)=>(
              <div key={i} style={{ border:`1px solid ${accent}25`, borderRadius:10, padding:'11px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', background:`${accent}05` }}>
                <div>
                  <p style={{ margin:0, fontSize:'0.875rem', fontWeight:600, color:'#1e293b' }}>{item.itemName}</p>
                  {item.description && <p style={{ margin:'3px 0 0', fontSize:'0.75rem', color:'#94a3b8' }}>💬 {item.description}</p>}
                </div>
                <span style={{ fontWeight:800, color:accent, fontSize:'0.95rem', flexShrink:0, marginLeft:12 }}>
                  {isIn ? '+' : '−'}{item.quantity?.toLocaleString()}
                  <span style={{ fontWeight:400, color:'#94a3b8', fontSize:'0.78rem' }}> {item.unit}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Confirm note */}
          <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:18 }}>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
              Ghi chú xác nhận (tùy chọn)
            </label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3}
              placeholder={isIn ? 'VD: Đã kiểm đếm đủ, xếp vào khu A–B...' : 'VD: Đã xuất hàng cho xe biển số 51A-12345...'}
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' }}
              onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:14 }}>
              <button onClick={onClose} disabled={loading}
                style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', color:'#64748b' }}>
                Hủy
              </button>
              <button onClick={()=>onConfirm(req.invReqId, note)} disabled={loading}
                style={{ padding:'10px 28px', borderRadius:10, border:'none', background:loading?'#e2e8f0':`linear-gradient(135deg,${accent},${accent}cc)`, color:loading?'#94a3b8':'#fff', cursor:loading?'wait':'pointer', fontWeight:700, fontSize:'0.9rem', display:'flex', alignItems:'center', gap:8, boxShadow:loading?'none':`0 4px 16px ${accent}40`, transition:'all 0.2s' }}>
                {loading && <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>}
                {loading ? 'Đang xác nhận...' : (isIn ? '✓ Xác nhận nhập kho' : '✓ Xác nhận xuất kho')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main ───────────────────────────────────────────────────── */
const ConfirmMovement = () => {
  const [typeTab, setTypeTab]       = useState('');   // '' = tất cả
  const [search, setSearch]         = useState('');
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast]           = useState(null);

  // Lấy warehouseId từ user info đã lưu (membership hiện tại)
  const warehouseId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.currentWarehouseId || u.warehouseId || null;
    } catch { return null; }
  })();

  const showToast = (msg, isError=false) => {
    setToast({ msg, isError });
    setTimeout(()=>setToast(null), 4000);
  };

  const fetchAssigned = useCallback(async () => {
    if (!warehouseId) { setRequests([]); return; }
    setLoading(true);
    try {
      const params = { warehouseId };
      if (typeTab) params.type = typeTab;
      const res = await axiosClient.get('/InventoryRequests/assigned-to-me', { params });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch { setRequests([]); }
    finally  { setLoading(false); }
  }, [typeTab, warehouseId]);

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
      showToast(`Xác nhận hoàn thành yêu cầu #${id} thành công! Tồn kho đã được cập nhật.`);
      setSelectedReq(null);
      fetchAssigned();
      window.dispatchEvent(new Event('inventoryRequestUpdated'));
    } catch (err) {
      showToast(err?.response?.data?.message || 'Xác nhận thất bại.', true);
    } finally {
      setConfirming(false);
    }
  };

  const inCount  = requests.filter(r=>r.type==='INBOUND').length;
  const outCount = requests.filter(r=>r.type==='OUTBOUND').length;
  const accent   = typeTab === 'OUTBOUND' ? OUTBOUND_COLOR : INBOUND_COLOR;

  const card = { background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' };

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily:'Inter, sans-serif', maxWidth:1060, margin:'0 auto', paddingBottom:48 }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes card-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .task-card { transition: transform 0.18s, box-shadow 0.18s; }
        .task-card:hover { transform:translateY(-3px) !important; box-shadow: 0 10px 28px rgba(0,0,0,0.10) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.7rem', fontWeight:900, color:'#0f172a', margin:'0 0 4px' }}>Yêu cầu nhập / xuất kho</h1>
        <p style={{ color:'#64748b', fontSize:'0.88rem', margin:0 }}>Danh sách đơn đã được Manager duyệt — bất kỳ nhân viên nào trong kho đều có thể xử lý và xác nhận hoàn thành.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ marginBottom:16, padding:'12px 18px', borderRadius:12, background:toast.isError?'#fee2e2':'#dcfce7', border:`1px solid ${toast.isError?'#fecaca':'#bbf7d0'}`, display:'flex', alignItems:'center', gap:10, animation:'slide-in 0.25s ease' }}>
          <span>{toast.isError?'❌':'✅'}</span>
          <span style={{ fontSize:'0.87rem', fontWeight:600, color:toast.isError?'#991b1b':'#166534' }}>{toast.msg}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { emoji:'📋', label:'Nhiệm vụ của tôi', val: requests.length, color:'#0ea5e9' },
          { emoji:'📥', label:'Nhập kho',          val: inCount,         color:INBOUND_COLOR },
          { emoji:'📤', label:'Xuất kho',          val: outCount,        color:OUTBOUND_COLOR },
        ].map(({emoji,label,val,color})=>(
          <div key={label} style={{ ...card, padding:'18px 22px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>{emoji}</div>
            <div>
              <p style={{ margin:0, fontSize:'0.75rem', color:'#64748b', fontWeight:500 }}>{label}</p>
              <p style={{ margin:0, fontSize:'1.75rem', fontWeight:900, color:'#0f172a', lineHeight:1.1 }}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Type tab + search */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        {/* Pill tab */}
        <div style={{ display:'flex', gap:8, padding:'10px 14px', borderRadius:12, background: typeTab==='OUTBOUND'?'#fff8e1':typeTab==='INBOUND'?'#e0f7fa':'#f1f5f9', border:`1.5px solid ${accent}30`, alignItems:'center' }}>
          <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#64748b' }}>Hiển thị:</span>
          {[{v:'',icon:'📋',label:'Tất cả'},{v:'INBOUND',icon:'📥',label:'Nhập kho'},{v:'OUTBOUND',icon:'📤',label:'Xuất kho'}].map(({v,icon,label})=>{
            const a = v===''?(typeTab===''?INBOUND_COLOR:'#94a3b8'):v==='INBOUND'?INBOUND_COLOR:OUTBOUND_COLOR;
            return (
              <button key={v} onClick={()=>{ setTypeTab(v); setSearch(''); }}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:`1.5px solid ${typeTab===v?a:'#e2e8f0'}`, background:typeTab===v?a:'#fff', color:typeTab===v?'#fff':'#64748b', fontWeight:700, fontSize:'0.83rem', cursor:'pointer', transition:'all 0.18s' }}>
                {icon} {label}
              </button>
            );
          })}
        </div>

        {/* Search + Refresh */}
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'1rem' }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Mã YC, tên hàng, kho..."
              style={{ padding:'9px 12px 9px 34px', borderRadius:10, border:'1.5px solid #e2e8f0', outline:'none', fontSize:'0.875rem', fontFamily:'Inter,sans-serif', width:220, transition:'border-color 0.2s' }}
              onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
          <button onClick={fetchAssigned}
            style={{ padding:'9px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#64748b', fontSize:'0.85rem', fontWeight:600, display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.borderColor='#cbd5e1';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';}}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ ...card, padding:60, textAlign:'center', color:'#94a3b8' }}>
          <div style={{ fontSize:'2.2rem', marginBottom:10, animation:'spin 1.2s linear infinite', display:'inline-block' }}>⏳</div>
          <div style={{ fontWeight:600 }}>Đang tải nhiệm vụ...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, padding:72, textAlign:'center' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>✅</div>
          <p style={{ fontWeight:700, color:'#0f172a', margin:'0 0 6px', fontSize:'1.05rem' }}>Không có đơn nào cần xử lý</p>
          <p style={{ color:'#94a3b8', fontSize:'0.87rem', margin:0 }}>Hiện chưa có đơn nào được duyệt. Manager cần duyệt trước rồi bạn mới xử lý được.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:18 }}>
          {filtered.map((req, idx) => {
            const isIn = req.type === 'INBOUND';
            const ac   = isIn ? INBOUND_COLOR : OUTBOUND_COLOR;
            return (
              <div key={req.invReqId} className="task-card"
                style={{ background:'#fff', borderRadius:16, border:`2px solid ${ac}30`, boxShadow:'0 2px 12px rgba(0,0,0,0.05)', overflow:'hidden', animation:`card-in 0.3s ease both`, animationDelay:`${idx*0.06}s` }}>

                {/* Card top stripe */}
                <div style={{ height:4, background:`linear-gradient(90deg,${ac},${ac}80)` }}/>

                <div style={{ padding:'18px 20px' }}>
                  {/* Header row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div>
                      <p style={{ margin:0, fontSize:'0.7rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Yêu cầu #{req.invReqId}</p>
                      <h3 style={{ margin:'4px 0 0', fontSize:'0.97rem', fontWeight:800, color:'#0f172a' }}>{req.warehouseName}</h3>
                    </div>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:999, fontSize:'0.73rem', fontWeight:700, background:`${ac}15`, color:ac, border:`1px solid ${ac}30`, flexShrink:0 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:ac }}/>
                      {isIn ? 'Nhập kho' : 'Xuất kho'}
                    </span>
                  </div>

                  {/* Meta */}
                  <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.83rem', color:'#475569' }}>
                      <span>👤</span><span style={{ fontWeight:500 }}>{req.renterName}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.83rem', color:'#64748b' }}>
                      <span>📦</span><span>{req.totalItems} mặt hàng</span>
                      <span style={{ marginLeft:6, color:'#94a3b8' }}>· Ngày tạo: {fmtDate(req.createdAt)}</span>
                    </div>
                  </div>

                  {/* Manager note */}
                  {req.assignedNote && (
                    <div style={{ background:'#eff6ff', borderRadius:10, padding:'9px 12px', marginBottom:14, borderLeft:`3px solid ${INBOUND_COLOR}` }}>
                      <p style={{ margin:0, fontSize:'0.72rem', fontWeight:700, color:'#1d4ed8', marginBottom:2 }}>📋 Ghi chú Manager</p>
                      <p style={{ margin:0, fontSize:'0.8rem', color:'#334155', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{req.assignedNote}</p>
                    </div>
                  )}

                  {/* Items preview */}
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
                    {(req.items||[]).slice(0,3).map((item,i)=>(
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:i<Math.min((req.items?.length||0),3)-1?'1px solid #e2e8f0':'none', fontSize:'0.83rem' }}>
                        <span style={{ color:'#334155', fontWeight:500 }}>{item.itemName}</span>
                        <span style={{ fontWeight:700, color:ac }}>{isIn?'+':'−'}{item.quantity} <span style={{ color:'#94a3b8', fontWeight:400 }}>{item.unit}</span></span>
                      </div>
                    ))}
                    {(req.items?.length||0) > 3 && (
                      <p style={{ margin:'6px 0 0', fontSize:'0.75rem', color:'#94a3b8', textAlign:'center' }}>+{req.items.length-3} mặt hàng khác</p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button onClick={()=>setSelectedReq(req)}
                    style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.9rem', fontFamily:'Inter,sans-serif', background:`linear-gradient(135deg,${ac},${ac}cc)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:`0 4px 14px ${ac}35`, transition:'all 0.2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.02)';}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';}}>
                    ✓ {isIn ? 'Xác nhận nhập kho' : 'Xác nhận xuất kho'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal req={selectedReq} onClose={()=>setSelectedReq(null)} onConfirm={handleConfirm} loading={confirming}/>
    </div>
  );
};

export default ConfirmMovement;
