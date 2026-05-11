import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../../services/axiosClient';
import authService from '../../services/authService';
import { ReceiptPreviewModal } from '../../components/InventoryReceiptPDF';
import SignatureCanvas from '../../components/SignatureCanvas';
import CreateReceiptNoteModal from '../../components/CreateReceiptNoteModal';
import ReceiptNotesListModal from '../../components/ReceiptNotesListModal';
import RequestQRCode from '../../components/RequestQRCode';

const INBOUND_COLOR  = '#10b981';
const OUTBOUND_COLOR = '#f59e0b';
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';

/* ── Status config ──────────────────────────────────────────── */
const STATUS_MAP = {
  PENDING:   { label: 'Chờ duyệt',  bg:'#fef3c7', color:'#d97706', border:'#fde68a', dot:'#f59e0b' },
  CONFIRMED: { label: 'Đã duyệt',   bg:'#dcfce7', color:'#166534', border:'#bbf7d0', dot:'#22c55e' },
  ASSIGNED:  { label: 'Đã giao',    bg:'#ede9fe', color:'#6d28d9', border:'#c4b5fd', dot:'#8b5cf6' },
  RECEIVING: { label: 'Đang tiếp nhận', bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff', dot: '#a855f7' },
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
                    {item.estimatedVolume > 0 && <p style={{ margin:'3px 0 0', fontSize:'0.75rem', color:'#64748b' }}>Tổng thể tích: <span style={{fontWeight:600, color:'#4f46e5'}}>{item.estimatedVolume} m³</span></p>}
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
  const [createNoteReq, setCreateNoteReq] = useState(null);
  const [viewNotesReq, setViewNotesReq]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]             = useState(null);
  const [qrReq, setQrReq]             = useState(null);
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



  const STATUS_FILTERS = [
    { key:'',          label:'Tất cả (đã duyệt)' },
    { key:'CONFIRMED', label:'Đã duyệt',    ...STATUS_MAP.CONFIRMED },
    { key:'ASSIGNED',  label:'Đã giao tôi', ...STATUS_MAP.ASSIGNED  },
    { key:'RECEIVING', label:'Đang tiếp nhận', ...STATUS_MAP.RECEIVING },
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
                {[['Mã yêu cầu','90px'],['Người thuê','150px'],['Mặt hàng','auto'],['Trạng thái','120px'],['Phiếu','80px','center'],['Ngày tạo','100px'],['Thao tác','220px','center']].map(([h,w,align])=>(
                  <th key={h} style={{ padding:'11px 14px', textAlign:align||'left', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', whiteSpace:'nowrap', width:w }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map(req => {
                const typeAccent = req.type==='INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
                const firstItem = req.items?.[0];

                return (
                  <tr key={req.invReqId} className="staff-row" style={{ borderBottom:'1px solid #f1f5f9', transition:'background 0.15s' }}>
                    <td style={{ padding:'13px 14px' }}>
                      <span style={{ fontWeight:800, color:typeAccent, fontSize:'0.87rem' }}>#{req.invReqId}</span>
                      {req.requestCode && <p style={{ margin:'2px 0 0', fontSize:'0.68rem', color:'#94a3b8', fontFamily:'monospace' }}>{req.requestCode}</p>}
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
                    {/* Receipt note count column */}
                    <td style={{ padding:'13px 14px', textAlign:'center' }}>
                      {(req.receiptNoteCount > 0) ? (
                        <button onClick={()=>setViewNotesReq(req)}
                          style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:6, fontSize:'0.72rem', fontWeight:700, background:'#eef2ff', color:'#4f46e5', border:'1px solid #c7d2fe', cursor:'pointer' }}>
                          {req.receiptNoteCount} phiếu
                        </button>
                      ) : (
                        <span style={{ fontSize:'0.72rem', color:'#cbd5e1', fontStyle:'italic' }}>0 phiếu</span>
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
                          {/* Nút QR */}
                          {req.requestCode && (
                            <button onClick={()=>setQrReq(req)}
                              style={{ padding:'5px 10px', border:'1.5px solid #c7d2fe', background:'#eef2ff', borderRadius:8, cursor:'pointer', color:'#4338ca', fontSize:'0.75rem', fontWeight:700 }}
                              onMouseEnter={e=>{e.currentTarget.style.background='#e0e7ff';}}
                              onMouseLeave={e=>{e.currentTarget.style.background='#eef2ff';}}>
                              QR
                            </button>
                          )}
                          {/* Tạo phiếu nhập */}
                          {(req.status === 'ASSIGNED' || req.status === 'CONFIRMED' || req.status === 'RECEIVING' || req.status === 'COMPLETED') && (
                            <button onClick={req.status !== 'COMPLETED' ? ()=>setCreateNoteReq(req) : undefined}
                              disabled={req.status === 'COMPLETED'}
                              style={{ flex:1, padding:'5px 0', border:`1.5px solid ${req.status === 'COMPLETED' ? '#e2e8f0' : '#c7d2fe'}`, background: req.status === 'COMPLETED' ? '#f1f5f9' : '#eef2ff', borderRadius:8, cursor: req.status === 'COMPLETED' ? 'not-allowed' : 'pointer', color: req.status === 'COMPLETED' ? '#94a3b8' : '#4338ca', fontSize:'0.75rem', fontWeight:700, textAlign:'center', opacity: req.status === 'COMPLETED' ? 0.6 : 1 }}
                              onMouseEnter={e=>{ if(req.status !== 'COMPLETED') e.currentTarget.style.background='#e0e7ff'; }}
                              onMouseLeave={e=>{ if(req.status !== 'COMPLETED') e.currentTarget.style.background='#eef2ff'; }}>
                              Tạo phiếu
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
      {createNoteReq && <CreateReceiptNoteModal request={createNoteReq} onClose={()=>setCreateNoteReq(null)} onCreated={()=>{ fetchData(); fetchBadgeCounts(); showToast('Đã tạo phiếu nhập kho thành công!'); }} />}
      {viewNotesReq && <ReceiptNotesListModal request={viewNotesReq} userRole="STAFF" onClose={()=>setViewNotesReq(null)} onUpdated={fetchData} />}

      {/* QR Modal */}
      {qrReq && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={()=>setQrReq(null)}>
          <div style={{ background:'#fff', borderRadius:28, padding:'32px 32px 40px', width:'100%', maxWidth:380, textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,0.3)', position:'relative' }} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setQrReq(null)} style={{ position:'absolute', top:20, right:20, background:'#f1f5f9', border:'none', width:36, height:36, borderRadius:'50%', cursor:'pointer', color:'#64748b', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}
              onMouseEnter={e=>{e.currentTarget.style.background='#e2e8f0';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#f1f5f9';}}>✕</button>
            <div style={{ width:56, height:56, background:'linear-gradient(135deg, #e0f2fe, #bae6fd)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'#0284c7' }}>
              <span style={{ fontSize:'24px' }}>📦</span>
            </div>
            <h3 style={{ margin:'0 0 6px', fontSize:'1.2rem', fontWeight:900, color:'#0f172a' }}>Mã QR yêu cầu {qrReq.type === 'INBOUND' ? 'nhập' : 'xuất'} kho</h3>
            <p style={{ margin:'0 0 8px', fontSize:'0.85rem', color:'#64748b', lineHeight:1.5 }}>Người thuê: <strong>{qrReq.renterName}</strong></p>
            <p style={{ margin:'0 0 28px', fontSize:'0.82rem', color:'#94a3b8' }}>Quét mã QR này để xem đầy đủ thông tin yêu cầu</p>
            <RequestQRCode code={qrReq.requestCode} label="Mã yêu cầu" size={200} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffInventoryRequestsNew;
