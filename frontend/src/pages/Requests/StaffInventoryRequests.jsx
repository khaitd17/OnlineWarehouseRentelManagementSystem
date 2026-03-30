import React, { useState, useEffect, useCallback } from 'react';
import inventoryService from '../../services/inventoryService';
import axiosClient from '../../services/axiosClient';

const INBOUND_COLOR  = '#0ea5e9';
const OUTBOUND_COLOR = '#f59e0b';
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';

/* ── Status config ──────────────────────────────────────────── */
const STATUS_MAP = {
  PENDING:   { label: 'Chờ duyệt',   bg:'#fef3c7', color:'#d97706', border:'#fde68a', dot:'#f59e0b' },
  CONFIRMED: { label: 'Đã duyệt',    bg:'#dcfce7', color:'#166534', border:'#bbf7d0', dot:'#22c55e' },
  ASSIGNED:  { label: 'Đã giao',     bg:'#dbeafe', color:'#1d4ed8', border:'#bfdbfe', dot:'#3b82f6' },
  COMPLETED: { label: 'Hoàn thành',  bg:'#f0fdf4', color:'#15803d', border:'#86efac', dot:'#16a34a' },
  REJECTED:  { label: 'Từ chối',     bg:'#fee2e2', color:'#dc2626', border:'#fecaca', dot:'#ef4444' },
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

/* ── Approve Modal ──────────────────────────────────────────── */
const ApproveModal = ({ req, onClose, onApprove, loading }) => {
  const [note, setNote] = useState('');
  if (!req) return null;
  const accent = req.type === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:32, width:'100%', maxWidth:460, boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.1rem', color:'#166534' }}>OK</div>
          <div>
            <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#0f172a' }}>Duyệt yêu cầu</h2>
            <p style={{ margin:'2px 0 0', fontSize:'0.82rem', color:'#64748b' }}>
              #{req.invReqId} · {req.type==='INBOUND'?'Nhập kho':'Xuất kho'} · {req.warehouseName}
            </p>
          </div>
        </div>

        {/* Item summary */}
        <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', marginBottom:18 }}>
          <p style={{ margin:'0 0 8px', fontSize:'0.7rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Hàng hóa</p>
          {(req.items||[]).slice(0,3).map((it,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom:4 }}>
              <span style={{ fontWeight:600, color:'#1e293b' }}>{it.itemName}</span>
              <span style={{ color:'#64748b' }}>{it.quantity} {it.unit}</span>
            </div>
          ))}
          {(req.items||[]).length > 3 && <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'#94a3b8' }}>+{req.items.length-3} mặt hàng khác</p>}
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Ghi chú phê duyệt (tùy chọn)</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3}
            placeholder="Ghi chú hướng dẫn thêm trước khi giao việc..."
            style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' }}
            onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} disabled={loading} style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', color:'#64748b' }}>Hủy</button>
          <button onClick={()=>onApprove(req.invReqId, note)} disabled={loading}
            style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', cursor:loading?'wait':'pointer', fontWeight:700, fontSize:'0.875rem', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(34,197,94,0.35)' }}>
            {loading && <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>}
            {loading ? 'Đang duyệt...' : 'Xác nhận duyệt'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Assign Modal ───────────────────────────────────────────── */
const AssignModal = ({ req, staffList, staffLoading, onClose, onAssign, loading }) => {
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [note, setNote] = useState('');
  if (!req) return null;
  const accent = req.type === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:32, width:'100%', maxWidth:480, boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.1rem', color:'#1d4ed8' }}>NV</div>
          <div>
            <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#0f172a' }}>Giao nhiệm vụ cho Staff</h2>
            <p style={{ margin:'2px 0 0', fontSize:'0.82rem', color:'#64748b' }}>#{req.invReqId} · {req.warehouseName}</p>
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Chọn nhân viên *</label>
          <select value={selectedStaffId} onChange={e=>setSelectedStaffId(e.target.value)}
            style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:'0.9rem', outline:'none', background:'#f8fafc', cursor:'pointer', fontFamily:'Inter,sans-serif' }}
            disabled={staffLoading}>
            <option value="">{staffLoading ? 'Đang tải...' : '-- Chọn nhân viên --'}</option>
            {!staffLoading && staffList.map(s=>(
              <option key={s.userId} value={s.userId}>{s.fullName} — {s.email}</option>
            ))}
          </select>
          {!staffLoading && staffList.length===0 && <p style={{ margin:'6px 0 0', fontSize:'0.78rem', color:'#f59e0b' }}>Không tìm thấy nhân viên thuộc kho này.</p>}
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Ghi chú cho nhân viên</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3}
            placeholder="Ví dụ: Thực hiện vào sáng thứ 2, xếp vào khu A..."
            style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' }}
            onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} disabled={loading} style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', color:'#64748b' }}>Hủy</button>
          <button onClick={()=>{ if(!selectedStaffId){alert('Vui lòng chọn nhân viên.');return;} onAssign(req.invReqId,parseInt(selectedStaffId),note); }}
            disabled={loading||!selectedStaffId}
            style={{ padding:'10px 24px', borderRadius:10, border:'none', background:loading||!selectedStaffId?'#e2e8f0':`linear-gradient(135deg,${accent},${accent}cc)`, color:loading||!selectedStaffId?'#94a3b8':'#fff', cursor:loading||!selectedStaffId?'not-allowed':'pointer', fontWeight:700, fontSize:'0.875rem', display:'flex', alignItems:'center', gap:8, boxShadow:selectedStaffId?`0 4px 14px ${accent}35`:'none', transition:'all 0.2s' }}>
            {loading && <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>}
            {loading ? 'Đang giao...' : 'Xác nhận giao việc'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Reject Modal ───────────────────────────────────────────── */
const RejectModal = ({ req, onClose, onReject, loading }) => {
  const [reason, setReason] = useState('');
  if (!req) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:32, width:'100%', maxWidth:440, boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.1rem', color:'#dc2626' }}>X</div>
          <div>
            <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#dc2626' }}>Từ chối yêu cầu</h2>
            <p style={{ margin:'2px 0 0', fontSize:'0.82rem', color:'#64748b' }}>Yêu cầu #{req.invReqId} từ {req.renterName}</p>
          </div>
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Lý do từ chối</label>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3}
            placeholder="Nhập lý do từ chối..."
            style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #fecaca', fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'Inter,sans-serif', background:'#fff5f5' }}/>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', color:'#64748b' }}>Hủy</button>
          <button onClick={()=>onReject(req.invReqId, reason)} disabled={loading}
            style={{ padding:'10px 22px', borderRadius:10, border:'none', background:loading?'#9ca3af':'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', cursor:loading?'not-allowed':'pointer', fontWeight:700, fontSize:'0.875rem', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(239,68,68,0.35)' }}>
            {loading && <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>}
            {loading ? 'Đang xử lý...' : 'Từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Detail Modal ───────────────────────────────────────────── */
const DetailModal = ({ req, onClose }) => {
  if (!req) return null;
  const accent = req.type==='INBOUND'?INBOUND_COLOR:OUTBOUND_COLOR;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:0, width:'100%', maxWidth:600, maxHeight:'88vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>
        {/* Modal header */}
        <div style={{ padding:'24px 28px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:'1rem', fontWeight:800, color:accent }}>
                {req.type==='INBOUND'?'Nhập kho':'Xuất kho'} · #{req.invReqId}
              </span>
              <StatusBadge status={req.status}/>
            </div>
            <p style={{ margin:0, fontSize:'0.83rem', color:'#64748b' }}>{req.warehouseName}</p>
          </div>
          <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', cursor:'pointer', padding:6, borderRadius:8, display:'flex' }}>×</button>
        </div>

        <div style={{ padding:'20px 28px' }}>
          {/* Info grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
            {[['Người thuê', req.renterName||'—'], ['Email', req.renterEmail||'—'],
              ['Ngày tạo', fmtDate(req.createdAt)], ['Ngày dự kiến', req.scheduledDate ? fmtDate(req.scheduledDate) : 'Chưa xác định']
            ].map(([k,v])=>(
              <div key={k} style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px' }}>
                <p style={{ margin:'0 0 2px', fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{k}</p>
                <p style={{ margin:0, fontSize:'0.88rem', color:'#1e293b', fontWeight:600 }}>{v}</p>
              </div>
            ))}
          </div>

          {req.notes && (
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
              <p style={{ margin:'0 0 4px', fontSize:'0.68rem', color:'#92400e', fontWeight:700, textTransform:'uppercase' }}>Ghi chú yêu cầu</p>
              <p style={{ margin:0, fontSize:'0.87rem', color:'#78350f' }}>{req.notes}</p>
            </div>
          )}

          {req.assignedStaffName && (
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
              <p style={{ margin:'0 0 4px', fontSize:'0.68rem', color:'#1d4ed8', fontWeight:700, textTransform:'uppercase' }}>Đã giao cho</p>
              <p style={{ margin:'0 0 2px', fontSize:'0.9rem', color:'#1e40af', fontWeight:700 }}>{req.assignedStaffName}</p>
              {req.assignedNote && <p style={{ margin:'2px 0 0', fontSize:'0.82rem', color:'#4b5563' }}>{req.assignedNote}</p>}
              <p style={{ margin:'4px 0 0', fontSize:'0.72rem', color:'#6b7280' }}>{req.assignedAt ? new Date(req.assignedAt).toLocaleString('vi-VN') : ''}</p>
            </div>
          )}

          {/* Items */}
          <p style={{ margin:'0 0 10px', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Danh sách hàng hóa ({req.items?.length||0} mặt hàng)
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(req.items||[]).map((item,i)=>(
              <div key={i} style={{ border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ margin:0, fontSize:'0.875rem', fontWeight:600, color:'#1e293b' }}>{item.itemName}</p>
                  {item.description && <p style={{ margin:'3px 0 0', fontSize:'0.75rem', color:'#94a3b8' }}>{item.description}</p>}
                </div>
                <span style={{ fontWeight:700, color:accent, fontSize:'0.9rem', flexShrink:0, marginLeft:12 }}>{item.quantity?.toLocaleString()} <span style={{ color:'#94a3b8', fontWeight:400, fontSize:'0.78rem' }}>{item.unit}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────── */
const ManagerInventoryRequests = () => {
  const [activeTab, setActiveTab]       = useState('INBOUND');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [data, setData]                 = useState({ items:[], totalCount:0, totalPages:0 });
  const [loading, setLoading]           = useState(false);
  const [detailReq, setDetailReq]       = useState(null);
  const [approveReq, setApproveReq]     = useState(null);
  const [assignReq, setAssignReq]       = useState(null);
  const [rejectReq, setRejectReq]       = useState(null);
  const [staffList, setStaffList]       = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]               = useState(null);

  const accent = activeTab==='INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  const PAGE_SIZE = 10;

  const showToast = (msg, isError=false) => {
    setToast({ msg, isError });
    setTimeout(()=>setToast(null), 4000);
  };

  // Load staff theo đúng warehouseId của request được chọn
  const loadStaffForWarehouse = async (warehouseId) => {
    setStaffList([]);
    setStaffLoading(true);
    try {
      const r = await axiosClient.get(`/staff/scoped-list?warehouseId=${warehouseId}`);
      const items = r.data?.items || (Array.isArray(r.data) ? r.data : []);
      setStaffList(Array.isArray(items) ? items : []);
    } catch {
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  };

  const openAssignModal = (req) => {
    setAssignReq(req);
    if (req?.warehouseId) loadStaffForWarehouse(req.warehouseId);
  };

  const fetchData = useCallback(async()=>{
    setLoading(true);
    try {
      const res = await inventoryService.getInventoryRequests({ type:activeTab, status:statusFilter||undefined, page, pageSize:PAGE_SIZE });
      setData(res.data||{ items:[], totalCount:0, totalPages:0 });
    } catch { setData({ items:[], totalCount:0, totalPages:0 }); }
    finally { setLoading(false); }
  },[activeTab, statusFilter, page]);

  useEffect(()=>{ fetchData(); },[fetchData]);

  const filtered = search
    ? data.items.filter(r => r.renterName?.toLowerCase().includes(search.toLowerCase()) || r.warehouseName?.toLowerCase().includes(search.toLowerCase()) || String(r.invReqId).includes(search))
    : data.items;

  const counts = {
    total:     data.totalCount,
    pending:   data.items.filter(r=>r.status==='PENDING').length,
    confirmed: data.items.filter(r=>r.status==='CONFIRMED').length,
    assigned:  data.items.filter(r=>r.status==='ASSIGNED').length,
    completed: data.items.filter(r=>r.status==='COMPLETED').length,
  };

  const handleApprove = async(id, note)=>{
    setActionLoading(true);
    try {
      await axiosClient.post(`/InventoryRequests/${id}/approve`, { note });
      showToast(`Đã duyệt yêu cầu #${id}!`);
      setApproveReq(null); fetchData();
      window.dispatchEvent(new Event('inventoryRequestUpdated'));
    } catch(err){ showToast(err?.response?.data?.message||'Duyệt thất bại.', true); }
    finally{ setActionLoading(false); }
  };

  const handleAssign = async(id, staffId, note)=>{
    setActionLoading(true);
    try {
      await axiosClient.post(`/InventoryRequests/${id}/assign`, { staffId, note });
      showToast(`Đã giao yêu cầu #${id} cho nhân viên!`);
      setAssignReq(null); fetchData();
      window.dispatchEvent(new Event('inventoryRequestUpdated'));
    } catch(err){ showToast(err?.response?.data?.message||'Giao việc thất bại.', true); }
    finally{ setActionLoading(false); }
  };

  const handleReject = async(id, reason)=>{
    setActionLoading(true);
    try {
      await axiosClient.post(`/InventoryRequests/${id}/reject`, { reason });
      showToast(`Đã từ chối yêu cầu #${id}.`);
      setRejectReq(null); fetchData();
      window.dispatchEvent(new Event('inventoryRequestUpdated'));
    } catch(err){ showToast(err?.response?.data?.message||'Từ chối thất bại.', true); }
    finally{ setActionLoading(false); }
  };

  const card = { background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' };

  const STATUS_FILTERS = [
    { key:'', label:'Tất cả', count: counts.total },
    { key:'PENDING',   ...STATUS_MAP.PENDING,   count: counts.pending },
    { key:'CONFIRMED', ...STATUS_MAP.CONFIRMED,  count: counts.confirmed },
    { key:'ASSIGNED',  ...STATUS_MAP.ASSIGNED,   count: counts.assigned },
    { key:'COMPLETED', ...STATUS_MAP.COMPLETED,  count: counts.completed },
  ];

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily:'Inter, sans-serif', maxWidth:1060, margin:'0 auto', paddingBottom:48 }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .mgr-row:hover { background:#fafbff !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.7rem', fontWeight:900, color:'#0f172a', margin:'0 0 4px' }}>Yêu cầu nhập / xuất kho</h1>
        <p style={{ color:'#64748b', fontSize:'0.88rem', margin:0 }}>Duyệt và giao nhiệm vụ cho nhân viên thực hiện các yêu cầu từ người thuê.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ marginBottom:16, padding:'12px 18px', borderRadius:12, background:toast.isError?'#fee2e2':'#dcfce7', border:`1px solid ${toast.isError?'#fecaca':'#bbf7d0'}`, display:'flex', alignItems:'center', gap:10, animation:'slide-in 0.25s ease' }}>
          <span style={{ fontSize:'1rem', fontWeight:700, color:toast.isError?'#991b1b':'#166534' }}>{toast.isError?'X':'+'}  </span>
          <span style={{ fontSize:'0.87rem', fontWeight:600, color:toast.isError?'#991b1b':'#166534' }}>{toast.msg}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Tổng yêu cầu',   val:counts.total,     color:'#0ea5e9' },
          { label:'Chờ duyệt',       val:counts.pending,   color:'#f59e0b' },
          { label:'Đã giao Staff',   val:counts.assigned,  color:'#3b82f6' },
          { label:'Hoàn thành',      val:counts.completed, color:'#22c55e' },
        ].map(({label,val,color})=>(
          <div key={label} style={{ ...card, padding:'18px 22px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:color }} />
            </div>
            <div>
              <p style={{ margin:0, fontSize:'0.75rem', color:'#64748b', fontWeight:500 }}>{label}</p>
              <p style={{ margin:0, fontSize:'1.75rem', fontWeight:900, color:'#0f172a', lineHeight:1.1 }}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Switcher — pill style đồng bộ */}
      <div style={{ display:'flex', gap:8, padding:'11px 16px', borderRadius:12, background:activeTab==='INBOUND'?'#e0f7fa':'#fff8e1', border:`1.5px solid ${accent}30`, marginBottom:20, alignItems:'center' }}>
        <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#64748b' }}>Loại yêu cầu:</span>
        {[{v:'INBOUND',label:'Nhập kho'},{v:'OUTBOUND',label:'Xuất kho'}].map(({v,label})=>(
          <button key={v} onClick={()=>{ setActiveTab(v); setPage(1); setSearch(''); setStatusFilter(''); }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 16px', borderRadius:8, border:`1.5px solid ${activeTab===v?accent:'#e2e8f0'}`, background:activeTab===v?accent:'#fff', color:activeTab===v?'#fff':'#64748b', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', transition:'all 0.18s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Status chips + Search */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:16 }}>
        {/* Status filters */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {STATUS_FILTERS.map(({key,label,bg,color,dot,count})=>(
            <button key={key} onClick={()=>{ setStatusFilter(key); setPage(1); }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:`1.5px solid ${statusFilter===key?(dot||accent):'#e2e8f0'}`, background:statusFilter===key?(bg||`${accent}12`):('#fff'), color:statusFilter===key?(color||accent):'#64748b', fontWeight:600, fontSize:'0.78rem', cursor:'pointer', transition:'all 0.15s' }}>
              {dot && <span style={{ width:6, height:6, borderRadius:'50%', background:dot, flexShrink:0 }}/>}
              {label||'Tất cả'} <strong>{count}</strong>
            </button>
          ))}
        </div>
        {/* Search */}
        <div style={{ position:'relative', minWidth:240 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'0.8rem' }}>T</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Mã YC, tên khách, kho..."
            style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px 9px 34px', borderRadius:10, border:'1.5px solid #e2e8f0', outline:'none', fontSize:'0.875rem', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' }}
            onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        </div>
      </div>

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#94a3b8' }}>
            <div style={{ fontSize:'0.88rem' }}>Đang tải dữ liệu...</div>
          </div>
        ) : filtered.length===0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#94a3b8' }}>
            <div style={{ fontWeight:600, color:'#64748b', marginBottom:4 }}>Không có yêu cầu nào</div>
            <div style={{ fontSize:'0.83rem' }}>Thử thay đổi bộ lọc hoặc từ khóa</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {[['#ID','60px'],['Kho bãi','140px'],['Người thuê','160px'],['Hàng hóa','auto'],['SL','70px','center'],['Trạng thái','120px'],['Nhân viên','130px'],['Ngày tạo','110px'],['Thao tác','180px','center']].map(([h,w,align])=>(
                  <th key={h} style={{ padding:'11px 14px', textAlign:align||'left', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', whiteSpace:'nowrap', width:w }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(req=>{
                const firstItem = req.items?.[0];
                const totalQty  = req.items?.reduce((s,i)=>s+i.quantity,0)||0;
                const typeAccent = req.type==='INBOUND'?INBOUND_COLOR:OUTBOUND_COLOR;
                return (
                  <tr key={req.invReqId} className="mgr-row" style={{ borderBottom:'1px solid #f1f5f9', transition:'background 0.15s' }}>
                    {/* ID */}
                    <td style={{ padding:'13px 14px' }}>
                      <span style={{ fontWeight:800, color:typeAccent, fontSize:'0.87rem' }}>#{req.invReqId}</span>
                    </td>
                    {/* Kho */}
                    <td style={{ padding:'13px 14px', maxWidth:140 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.85rem', fontWeight:500, color:'#374151' }}>{req.warehouseName||'—'}</div>
                    </td>
                    {/* Renter */}
                    <td style={{ padding:'13px 14px' }}>
                      <p style={{ margin:0, fontSize:'0.85rem', fontWeight:600, color:'#1e293b' }}>{req.renterName||'—'}</p>
                      <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8' }}>{req.renterEmail||''}</p>
                    </td>
                    {/* Hàng hóa */}
                    <td style={{ padding:'13px 14px' }}>
                      <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.85rem' }}>{firstItem?.itemName||'—'}</div>
                      {req.items?.length>1 && <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:2 }}>+{req.items.length-1} mặt hàng</div>}
                    </td>
                    {/* SL */}
                    <td style={{ padding:'13px 14px', textAlign:'center' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:26, height:26, borderRadius:'50%', background:`${typeAccent}18`, color:typeAccent, fontWeight:700, fontSize:'0.78rem', padding:'0 6px' }}>{totalQty}</span>
                    </td>
                    {/* Status */}
                    <td style={{ padding:'13px 14px' }}><StatusBadge status={req.status}/></td>
                    {/* Staff */}
                    <td style={{ padding:'13px 14px', fontSize:'0.82rem', color:req.assignedStaffName?'#1d4ed8':'#94a3b8', fontWeight:req.assignedStaffName?600:400 }}>
                      {req.assignedStaffName||'—'}
                    </td>
                    {/* Date */}
                    <td style={{ padding:'13px 14px', fontSize:'0.78rem', color:'#64748b' }}>{fmtDate(req.createdAt)}</td>
                    {/* Actions */}
                    <td style={{ padding:'13px 14px' }}>
                      <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'center' }}>
                        {/* Xem chi tiết */}
                        <button onClick={()=>setDetailReq(req)} title="Xem chi tiết"
                          style={{ width:30, height:30, border:'1.5px solid #e2e8f0', background:'#f8fafc', borderRadius:8, cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', transition:'all 0.15s' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#e0f7fa';e.currentTarget.style.borderColor=INBOUND_COLOR;}}
                          onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';}}>
                          👁
                        </button>
                        {/* Duyệt (PENDING) */}
                        {req.status==='PENDING' && (
                          <button onClick={()=>setApproveReq(req)} title="Duyệt yêu cầu"
                            style={{ padding:'5px 10px', border:'1.5px solid #bbf7d0', background:'#dcfce7', borderRadius:8, cursor:'pointer', color:'#166534', fontSize:'0.78rem', fontWeight:700, display:'flex', alignItems:'center', gap:4, transition:'all 0.15s' }}
                            onMouseEnter={e=>{e.currentTarget.style.background='#bbf7d0';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='#dcfce7';}}>
                            Duyệt
                          </button>
                        )}
                        {/* Giao Staff (CONFIRMED) */}
                        {req.status==='CONFIRMED' && (
                          <button onClick={()=>openAssignModal(req)} title="Giao cho Staff"
                            style={{ padding:'5px 10px', border:'1.5px solid #bfdbfe', background:'#dbeafe', borderRadius:8, cursor:'pointer', color:'#1d4ed8', fontSize:'0.78rem', fontWeight:700, display:'flex', alignItems:'center', gap:4, transition:'all 0.15s' }}
                            onMouseEnter={e=>{e.currentTarget.style.background='#bfdbfe';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='#dbeafe';}}>
                            Giao
                          </button>
                        )}
                        {/* Từ chối (PENDING or CONFIRMED) */}
                        {(req.status==='PENDING'||req.status==='CONFIRMED') && (
                          <button onClick={()=>setRejectReq(req)} title="Từ chối"
                            style={{ width:30, height:30, border:'1.5px solid #fecaca', background:'#fef2f2', borderRadius:8, cursor:'pointer', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', transition:'all 0.15s' }}
                            onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='#fef2f2';}}>
                            ×
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
            <span style={{ fontSize:'0.78rem', color:'#94a3b8' }}>Tổng <strong style={{ color:'#64748b' }}>{data.totalCount}</strong> yêu cầu</span>
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
      <DetailModal  req={detailReq}  onClose={()=>setDetailReq(null)}/>
      <ApproveModal req={approveReq} onClose={()=>setApproveReq(null)} onApprove={handleApprove} loading={actionLoading}/>
      <AssignModal  req={assignReq}  staffList={staffList} staffLoading={staffLoading} onClose={()=>setAssignReq(null)} onAssign={handleAssign} loading={actionLoading}/>
      <RejectModal  req={rejectReq}  onClose={()=>setRejectReq(null)} onReject={handleReject} loading={actionLoading}/>
    </div>
  );
};

export default ManagerInventoryRequests;
