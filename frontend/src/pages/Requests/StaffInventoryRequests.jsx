import React, { useState, useEffect, useCallback } from 'react';
import inventoryService from '../../services/inventoryService';
import axiosClient from '../../services/axiosClient';

const INBOUND_COLOR  = '#0ea5e9';
const OUTBOUND_COLOR = '#f59e0b';
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';

/* ── Status config ──────────────────────────────────────────── */
const STATUS_MAP = {
  PENDING:   { label: 'Chờ tiếp nhận',   bg:'#fef3c7', color:'#d97706', border:'#fde68a', dot:'#f59e0b' },
  CONFIRMED: { label: 'Chờ xử lý tại kho',    bg:'#dcfce7', color:'#166534', border:'#bbf7d0', dot:'#22c55e' },
  ASSIGNED:  { label: 'Đã giao',     bg:'#ede9fe', color:'#6d28d9', border:'#c4b5fd', dot:'#8b5cf6' },
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

/* ── Assign Modal ───────────────────────────────────────────── */
const AssignModal = ({ req, staffList, onClose, onAssign, loading }) => {
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [note, setNote]                       = useState('');
  if (!req) return null;
  const accent = req.type === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  const availableStaff = staffList.filter(s => s.isActive !== false);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:32, width:'100%', maxWidth:480, boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>👤</div>
          <div>
            <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#0f172a' }}>Giao việc cho nhân viên</h2>
            <p style={{ margin:'2px 0 0', fontSize:'0.82rem', color:'#64748b' }}>#{req.invReqId} · {req.type==='INBOUND'?'Nhập kho':'Xuất kho'} · {req.warehouseName}</p>
          </div>
        </div>

        {/* Hàng hóa tóm tắt */}
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

        {/* Chọn nhân viên */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Chọn nhân viên</label>
          {availableStaff.length === 0 ? (
            <p style={{ color:'#dc2626', fontSize:'0.85rem', margin:0 }}>Không có nhân viên nào trong kho này.</p>
          ) : (
            <select value={selectedStaffId} onChange={e=>setSelectedStaffId(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:'0.875rem', outline:'none', fontFamily:'Inter,sans-serif', background:'#f8fafc', cursor:'pointer' }}
              onFocus={e=>e.target.style.borderColor='#8b5cf6'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}>
              <option value=''>-- Chọn nhân viên --</option>
              {availableStaff.map(s => (
                <option key={s.userId} value={s.userId}>{s.fullName} ({s.email})</option>
              ))}
            </select>
          )}
        </div>

        {/* Ghi chú */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Ghi chú hướng dẫn (tùy chọn)</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3}
            placeholder='VD: Ưu tiên xử lý ngay hôm nay, khu A cột 3...'
            style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:'0.875rem', outline:'none', resize:'vertical', fontFamily:'Inter,sans-serif' }}
            onFocus={e=>e.target.style.borderColor='#8b5cf6'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} disabled={loading} style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', color:'#64748b' }}>Hủy</button>
          <button
            onClick={() => { if(!selectedStaffId){ alert('Vui lòng chọn nhân viên!'); return; } onAssign(req.invReqId, Number(selectedStaffId), note); }}
            disabled={loading || !selectedStaffId}
            style={{ padding:'10px 24px', borderRadius:10, border:'none', background: loading || !selectedStaffId ? '#e2e8f0' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: loading || !selectedStaffId ? '#94a3b8' : '#fff', cursor: loading || !selectedStaffId ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:'0.875rem', display:'flex', alignItems:'center', gap:8, boxShadow: loading || !selectedStaffId ? 'none' : '0 4px 14px rgba(139,92,246,0.4)' }}>
            {loading && <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>}
            {loading ? 'Đang giao...' : '👤 Giao việc'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Approve Modal ───────────────────────────────────────────── */
const ApproveModal = ({ req, onClose, onApprove, loading }) => {
  const [note, setNote] = useState('');
  if (!req) return null;
  const accent = req.type === 'INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:32, width:'100%', maxWidth:460, boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.4rem' }}>✓</div>
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
            placeholder="Ghi chú hướng dẫn thêm trước khi giao kho..."
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

/* ── Reject Modal ───────────────────────────────────────────── */
const RejectModal = ({ req, onClose, onReject, loading }) => {
  const [reason, setReason] = useState('');
  if (!req) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:32, width:'100%', maxWidth:440, boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.4rem', color:'#dc2626' }}>✕</div>
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
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
            {[['Người thuê', req.renterName||'—'], ['Email', req.renterEmail||'—'],
              ['Ngày tạo', fmtDate(req.createdAt)], ['Trạng thái', req.status||'—']
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

          {req.confirmedByName && (
            <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
              <p style={{ margin:'0 0 4px', fontSize:'0.68rem', color:'#15803d', fontWeight:700, textTransform:'uppercase' }}>Đã hoàn thành bởi</p>
              <p style={{ margin:'0 0 2px', fontSize:'0.9rem', color:'#14532d', fontWeight:700 }}>{req.confirmedByName}</p>
              <p style={{ margin:'4px 0 0', fontSize:'0.72rem', color:'#6b7280' }}>{req.confirmedAt ? new Date(req.confirmedAt).toLocaleString('vi-VN') : ''}</p>
            </div>
          )}

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

/* ── Main Component (Manager view) ──────────────────────────── */
const ManagerInventoryRequests = ({ defaultTab = 'INBOUND' }) => {
  const [activeTab, setActiveTab]       = useState(defaultTab);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [data, setData]                 = useState({ items:[], totalCount:0, totalPages:0 });
  const [loading, setLoading]           = useState(false);
  const [tabCounts, setTabCounts]       = useState({ INBOUND:0, OUTBOUND:0 });
  const [pendingCounts, setPendingCounts] = useState({ INBOUND:0, OUTBOUND:0 });
  const [detailReq, setDetailReq]       = useState(null);
  const [approveReq, setApproveReq]     = useState(null);
  const [rejectReq, setRejectReq]       = useState(null);
  const [assignReq, setAssignReq]       = useState(null);
  const [staffList, setStaffList]       = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]               = useState(null);

  const accent = activeTab==='INBOUND' ? INBOUND_COLOR : OUTBOUND_COLOR;
  const PAGE_SIZE = 10;

  const showToast = (msg, isError=false) => {
    setToast({ msg, isError });
    setTimeout(()=>setToast(null), 4000);
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

  useEffect(()=>{
    const fetchTabCounts = async () => {
      try {
        const [inRes, outRes] = await Promise.all([
          inventoryService.getInventoryRequests({ type:'INBOUND',  page:1, pageSize:1 }),
          inventoryService.getInventoryRequests({ type:'OUTBOUND', page:1, pageSize:1 }),
        ]);
        setTabCounts({
          INBOUND:  inRes.data?.totalCount  ?? 0,
          OUTBOUND: outRes.data?.totalCount ?? 0,
        });
      } catch {}
    };
    fetchTabCounts();
  },[]);

  // Fetch pending-only counts (for red badge on tabs & sidebar sync)
  const fetchPendingCounts = useCallback(async()=>{
    try {
      const [inRes, outRes] = await Promise.all([
        inventoryService.getInventoryRequests({ type:'INBOUND',  status:'CONFIRMED', page:1, pageSize:1 }),
        inventoryService.getInventoryRequests({ type:'OUTBOUND', status:'CONFIRMED', page:1, pageSize:1 }),
      ]);
      setPendingCounts({
        INBOUND:  inRes.data?.totalCount  ?? 0,
        OUTBOUND: outRes.data?.totalCount ?? 0,
      });
    } catch {}
  },[]);

  useEffect(()=>{ fetchPendingCounts(); },[fetchPendingCounts]);

  // Re-fetch badge counts when an action completes (approve/reject/assign)
  useEffect(()=>{
    const handler = () => { fetchPendingCounts(); fetchData(); };
    window.addEventListener('inventoryRequestUpdated', handler);
    return () => window.removeEventListener('inventoryRequestUpdated', handler);
  },[fetchPendingCounts, fetchData]);

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
      showToast(`Đã tiếp nhận yêu cầu #${id} — nhân viên kho có thể xử lý ngay!`);
      setApproveReq(null); fetchData(); fetchPendingCounts();
      window.dispatchEvent(new Event('inventoryRequestUpdated'));
    } catch(err){ showToast(err?.response?.data?.message||'Tiếp nhận thất bại.', true); }
    finally{ setActionLoading(false); }
  };

  const handleReject = async(id, reason)=>{
    setActionLoading(true);
    try {
      await axiosClient.post(`/InventoryRequests/${id}/reject`, { reason });
      showToast(`Đã từ chối yêu cầu #${id}.`);
      setRejectReq(null); fetchData(); fetchPendingCounts();
      window.dispatchEvent(new Event('inventoryRequestUpdated'));
    } catch(err){ showToast(err?.response?.data?.message||'Từ chối thất bại.', true); }
    finally{ setActionLoading(false); }
  };

  // Mở modal Assign — load staff list của kho tương ứng
  const openAssignModal = async (req) => {
    setAssignReq(req);
    try {
      const res = await axiosClient.get(`/staff/list`, { params: { warehouseId: req.warehouseId, pageSize: 200 } });
      const list = Array.isArray(res.data?.items) ? res.data.items
                 : Array.isArray(res.data)         ? res.data
                 : [];
      // Chỉ lấy STAFF active
      setStaffList(list.filter(s => (s.roleCode === 'STAFF' || s.roleName === 'STAFF') && s.membershipIsActive !== false));
    } catch { setStaffList([]); }
  };

  const handleAssign = async(id, staffId, note)=>{
    setActionLoading(true);
    try {
      await axiosClient.post(`/InventoryRequests/${id}/assign`, { staffId, note });
      showToast(`Đã giao yêu cầu #${id} cho nhân viên thành công!`);
      setAssignReq(null); fetchData(); fetchPendingCounts();
      window.dispatchEvent(new Event('inventoryRequestUpdated'));
    } catch(err){ showToast(err?.response?.data?.message||'Giao việc thất bại.', true); }
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
        @keyframes badgePop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.25)} 100%{transform:scale(1);opacity:1} }
        .mgr-row:hover { background:#fafbff !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.7rem', fontWeight:900, color:'#0f172a', margin:'0 0 4px' }}>Quản lý yêu cầu nhập / xuất kho</h1>
        <p style={{ color:'#64748b', fontSize:'0.88rem', margin:0 }}>
          Giám sát và phân công nhân viên xử lý các yêu cầu nhập/xuất kho. Yêu cầu hợp lệ được hệ thống tự động tiếp nhận.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ marginBottom:16, padding:'12px 18px', borderRadius:12, background:toast.isError?'#fee2e2':'#dcfce7', border:`1px solid ${toast.isError?'#fecaca':'#bbf7d0'}`, display:'flex', alignItems:'center', gap:10, animation:'slide-in 0.25s ease' }}>
          <span style={{ fontSize:'1rem' }}>{toast.isError?'❌':'✅'}</span>
          <span style={{ fontSize:'0.87rem', fontWeight:600, color:toast.isError?'#991b1b':'#166534' }}>{toast.msg}</span>
        </div>
      )}

      {/* Stat Cards — bỏ "Đã giao Staff", thêm "Đã duyệt" */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Tổng yêu cầu',   val:counts.total,     color:'#0ea5e9', emoji:'📋' },
          { label:'Chờ tiếp nhận',       val:counts.pending,   color:'#f59e0b', emoji:'⏳' },
          { label:'Chờ xử lý tại kho',        val:counts.confirmed, color:'#22c55e', emoji:'✅' },
          { label:'Hoàn thành',      val:counts.completed, color:'#16a34a', emoji:'🏁' },
        ].map(({label,val,color,emoji})=>(
          <div key={label} style={{ ...card, padding:'18px 22px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', flexShrink:0 }}>
              {emoji}
            </div>
            <div>
              <p style={{ margin:0, fontSize:'0.75rem', color:'#64748b', fontWeight:500 }}>{label}</p>
              <p style={{ margin:0, fontSize:'1.75rem', fontWeight:900, color:'#0f172a', lineHeight:1.1 }}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div style={{ display:'flex', gap:8, padding:'11px 16px', borderRadius:12, background:activeTab==='INBOUND'?'#e0f7fa':'#fff8e1', border:`1.5px solid ${accent}30`, marginBottom:20, alignItems:'center' }}>
        <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#64748b' }}>Loại yêu cầu:</span>
        {[
          {v:'INBOUND',  label:'Nhập kho', icon:'📥', color:INBOUND_COLOR},
          {v:'OUTBOUND', label:'Xuất kho', icon:'📤', color:OUTBOUND_COLOR},
        ].map(({v,label,icon,color})=>(
          <button key={v} onClick={()=>{ setActiveTab(v); setPage(1); setSearch(''); setStatusFilter(''); }}
            style={{ position:'relative', display:'flex', alignItems:'center', gap:6, padding:'6px 18px', borderRadius:8, border:`1.5px solid ${activeTab===v?color:'#e2e8f0'}`, background:activeTab===v?color:'#fff', color:activeTab===v?'#fff':'#64748b', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', transition:'all 0.18s' }}>
            <span>{icon}</span>
            {label}
            {tabCounts[v] > 0 && (
              <span style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                minWidth:20, height:20, borderRadius:999, fontSize:'0.7rem', fontWeight:800,
                background: activeTab===v ? 'rgba(255,255,255,0.25)' : `${color}18`,
                color: activeTab===v ? '#fff' : color,
                padding:'0 5px', lineHeight:1,
              }}>{tabCounts[v]}</span>
            )}
            {/* Red pending badge — only shows when there are PENDING requests for this type */}
            {pendingCounts[v] > 0 && (
              <span style={{
                position:'absolute', top:'-7px', right:'-7px',
                minWidth:'18px', height:'18px', borderRadius:'999px',
                background:'#ef4444', color:'#fff',
                fontSize:'0.62rem', fontWeight:800,
                display:'flex', alignItems:'center', justifyContent:'center',
                padding:'0 4px', lineHeight:1,
                boxShadow:'0 0 8px rgba(239,68,68,.7)',
                border:'2px solid #fff',
                animation:'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                {pendingCounts[v] > 99 ? '99+' : pendingCounts[v]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Status chips + Search */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {STATUS_FILTERS.map(({key,label,bg,color,dot,count})=>(
            <button key={key} onClick={()=>{ setStatusFilter(key); setPage(1); }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:`1.5px solid ${statusFilter===key?(dot||accent):'#e2e8f0'}`, background:statusFilter===key?(bg||`${accent}12`):('#fff'), color:statusFilter===key?(color||accent):'#64748b', fontWeight:600, fontSize:'0.78rem', cursor:'pointer', transition:'all 0.15s' }}>
              {dot && <span style={{ width:6, height:6, borderRadius:'50%', background:dot, flexShrink:0 }}/>}
              {label||'Tất cả'} <strong>{count}</strong>
            </button>
          ))}
        </div>
        <div style={{ position:'relative', minWidth:240 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}>🔍</span>
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
                {[['#ID','60px'],['Kho bãi','140px'],['Người thuê','160px'],['Hàng hóa','auto'],['SL','70px','center'],['Trạng thái','120px'],['Ngày tạo','110px'],['Thao tác','150px','center']].map(([h,w,align])=>(
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
                    <td style={{ padding:'13px 14px' }}>
                      <span style={{ fontWeight:800, color:typeAccent, fontSize:'0.87rem' }}>#{req.invReqId}</span>
                    </td>
                    <td style={{ padding:'13px 14px', maxWidth:140 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.85rem', fontWeight:500, color:'#374151' }}>{req.warehouseName||'—'}</div>
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <p style={{ margin:0, fontSize:'0.85rem', fontWeight:600, color:'#1e293b' }}>{req.renterName||'—'}</p>
                      <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8' }}>{req.renterEmail||''}</p>
                    </td>
                    <td style={{ padding:'13px 14px' }}>
                      <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.85rem' }}>{firstItem?.itemName||'—'}</div>
                      {req.items?.length>1 && <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:2 }}>+{req.items.length-1} mặt hàng</div>}
                    </td>
                    <td style={{ padding:'13px 14px', textAlign:'center' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:26, height:26, borderRadius:'50%', background:`${typeAccent}18`, color:typeAccent, fontWeight:700, fontSize:'0.78rem', padding:'0 6px' }}>{totalQty}</span>
                    </td>
                    <td style={{ padding:'13px 14px' }}><StatusBadge status={req.status}/></td>
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
                        {/* Duyệt thủ công — chỉ hiện khi PENDING (fallback hiếm khi xảy ra) */}
                        {req.status==='PENDING' && (
                          <button onClick={()=>handleApprove(req.invReqId, '')} title="Tiếp nhận yêu cầu"
                            style={{ padding:'5px 12px', border:'1.5px solid #bbf7d0', background:'#dcfce7', borderRadius:8, cursor:'pointer', color:'#166534', fontSize:'0.78rem', fontWeight:700, display:'flex', alignItems:'center', gap:4, transition:'all 0.15s' }}
                            onMouseEnter={e=>{e.currentTarget.style.background='#bbf7d0';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='#dcfce7';}}>
                            ✓ Tiếp nhận
                          </button>
                        )}
                        {/* Giao việc — chỉ CONFIRMED */}
                        {req.status==='CONFIRMED' && (
                          <button onClick={()=>openAssignModal(req)} title="Giao cho nhân viên"
                            style={{ padding:'5px 12px', border:'1.5px solid #c4b5fd', background:'#ede9fe', borderRadius:8, cursor:'pointer', color:'#6d28d9', fontSize:'0.78rem', fontWeight:700, display:'flex', alignItems:'center', gap:4, transition:'all 0.15s' }}
                            onMouseEnter={e=>{e.currentTarget.style.background='#c4b5fd';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='#ede9fe';}}>
                            👤 Giao
                          </button>
                        )}
                        {/* Badge đã giao khi ASSIGNED */}
                        {req.status==='ASSIGNED' && (
                          <span style={{ padding:'4px 10px', borderRadius:8, background:'#ede9fe', border:'1.5px solid #c4b5fd', color:'#6d28d9', fontSize:'0.72rem', fontWeight:700, whiteSpace:'nowrap' }}>
                            👤 {req.assignedStaffName || 'Đã giao'}
                          </span>
                        )}
                        {/* Từ chối — PENDING hoặc CONFIRMED */}
                        {(req.status==='PENDING'||req.status==='CONFIRMED') && (
                          <button onClick={()=>setRejectReq(req)} title="Từ chối"
                            style={{ width:30, height:30, border:'1.5px solid #fecaca', background:'#fef2f2', borderRadius:8, cursor:'pointer', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', transition:'all 0.15s' }}
                            onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='#fef2f2';}}>
                            ✕
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
      <RejectModal  req={rejectReq}  onClose={()=>setRejectReq(null)} onReject={handleReject} loading={actionLoading}/>
      <AssignModal  req={assignReq}  staffList={staffList} onClose={()=>setAssignReq(null)} onAssign={handleAssign} loading={actionLoading}/>
    </div>
  );
};

export default ManagerInventoryRequests;

