import React, { useState, useEffect, useCallback } from 'react';
import inventoryService from '../../services/inventoryService';
import axiosClient from '../../services/axiosClient';

/* ──────────────────────────────────────────────────────────────
   Status Map
────────────────────────────────────────────────────────────── */
const STATUS_MAP = {
  PENDING:   { label: 'Chờ duyệt',  bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  ASSIGNED:  { label: 'Đã giao',    bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  COMPLETED: { label: 'Hoàn thành', bg: '#d1fae5', color: '#059669', border: '#a7f3d0' },
  REJECTED:  { label: 'Từ chối',    bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999,
      fontSize: '0.75rem', fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
    padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flex: 1,
  }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 24, color }}>{icon}</span>
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{value}</p>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Assign Modal
────────────────────────────────────────────────────────────── */
const AssignModal = ({ req, staffList, onClose, onAssign, loading }) => {
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [note, setNote] = useState('');

  if (!req) return null;

  const handleSubmit = () => {
    if (!selectedStaffId) { alert('Vui lòng chọn nhân viên.'); return; }
    onAssign(req.invReqId, parseInt(selectedStaffId), note);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
          🎯 Giao nhiệm vụ cho Staff
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: '#6b7280' }}>
          Yêu cầu #{req.invReqId} — {req.type === 'INBOUND' ? '📦 Nhập kho' : '📤 Xuất kho'} — {req.warehouseName}
        </p>

        {/* Chọn Staff */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
            Chọn nhân viên *
          </label>
          <select
            value={selectedStaffId}
            onChange={e => setSelectedStaffId(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', background: '#f8fafc', cursor: 'pointer' }}
          >
            <option value="">-- Chọn nhân viên --</option>
            {staffList.map(s => (
              <option key={s.userId} value={s.userId}>{s.fullName} — {s.email}</option>
            ))}
          </select>
          {staffList.length === 0 && (
            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#f59e0b' }}>⚠ Không tìm thấy nhân viên thuộc kho này.</p>
          )}
        </div>

        {/* Ghi chú nội bộ */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
            Ghi chú cho nhân viên
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ví dụ: Thực hiện vào sáng thứ 2, sắp xếp vào khu A..."
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} disabled={loading} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: '#6b7280' }}>
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedStaffId}
            style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: loading || !selectedStaffId ? '#9ca3af' : '#00b2d6', color: '#fff', cursor: loading || !selectedStaffId ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {loading && <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span>}
            {loading ? 'Đang giao...' : '✓ Xác nhận giao việc'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Reject Modal
────────────────────────────────────────────────────────────── */
const RejectModal = ({ req, onClose, onReject, loading }) => {
  const [reason, setReason] = useState('');
  if (!req) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>❌ Từ chối yêu cầu</h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: '#6b7280' }}>
          Yêu cầu #{req.invReqId} từ {req.renterName}
        </p>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
            Lý do từ chối
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #fecaca', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', background: '#fff5f5' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: '#6b7280' }}>Hủy</button>
          <button
            onClick={() => onReject(req.invReqId, reason)}
            disabled={loading}
            style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: loading ? '#9ca3af' : '#dc2626', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {loading && <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span>}
            {loading ? 'Đang xử lý...' : 'Từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Detail Modal
────────────────────────────────────────────────────────────── */
const DetailModal = ({ req, onClose }) => {
  if (!req) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 580, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {req.type === 'INBOUND' ? '📦 Nhập kho' : '📤 Xuất kho'} • #{req.invReqId}
            </p>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>{req.warehouseName}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#9ca3af' }}>close</span>
          </button>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {[
              ['Người thuê', req.renterName],
              ['Email', req.renterEmail],
              ['Trạng thái', <StatusBadge status={req.status} />],
              ['Ngày tạo', req.createdAt ? new Date(req.createdAt).toLocaleString('vi-VN') : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{k}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
          {req.notes && (
            <div style={{ marginTop: 10, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Ghi chú</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#374151' }}>{req.notes}</p>
            </div>
          )}
          {req.assignedStaffName && (
            <div style={{ marginTop: 10, borderTop: '1px solid #dbeafe', paddingTop: 10, background: '#eff6ff', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase' }}>👷 Đã giao cho</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.9rem', color: '#1e40af', fontWeight: 700 }}>{req.assignedStaffName}</p>
              {req.assignedNote && <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#4b5563' }}>{req.assignedNote}</p>}
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6b7280' }}>
                {req.assignedAt ? new Date(req.assignedAt).toLocaleString('vi-VN') : ''}
              </p>
            </div>
          )}
        </div>

        <p style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Danh sách hàng hóa ({req.items?.length || 0} mặt hàng)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(req.items || []).map((item) => (
            <div key={item.itemId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{item.itemName}</p>
                {item.description && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>{item.description}</p>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#00b2d6' }}>{item.quantity.toLocaleString()} {item.unit}</p>
                {item.weight && <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{item.weight} kg</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Main Component — Manager Inventory Requests
────────────────────────────────────────────────────────────── */
const ManagerInventoryRequests = () => {
  const [activeTab, setActiveTab] = useState('INBOUND');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], totalCount: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);

  const [detailReq, setDetailReq] = useState(null);
  const [assignReq, setAssignReq] = useState(null);
  const [rejectReq, setRejectReq] = useState(null);

  const [staffList, setStaffList] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const PAGE_SIZE = 10;

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  // Load staff list of warehouses managed
  useEffect(() => {
    axiosClient.get('/staff/my-warehouses')
      .then(res => {
        const whs = Array.isArray(res.data) ? res.data : [];
        if (whs.length > 0) {
          const warehouseId = whs[0].warehouseId;
          axiosClient.get(`/staff/scoped-list?warehouseId=${warehouseId}`)
            .then(r => {
              const items = r.data?.items || (Array.isArray(r.data) ? r.data : []);
              setStaffList(items);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getInventoryRequests({
        type: activeTab,
        status: statusFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(res.data || { items: [], totalCount: 0, totalPages: 0 });
    } catch {
      setData({ items: [], totalCount: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = search
    ? data.items.filter(r =>
        r.renterName?.toLowerCase().includes(search.toLowerCase()) ||
        r.warehouseName?.toLowerCase().includes(search.toLowerCase()) ||
        String(r.invReqId).includes(search)
      )
    : data.items;

  const counts = {
    pending:   data.items.filter(r => r.status === 'PENDING').length,
    assigned:  data.items.filter(r => r.status === 'ASSIGNED').length,
    completed: data.items.filter(r => r.status === 'COMPLETED').length,
  };

  // Assign handler
  const handleAssign = async (id, staffId, note) => {
    setActionLoading(true);
    try {
      await axiosClient.post(`/InventoryRequests/${id}/assign`, { staffId, note });
      showToast(`✅ Đã giao yêu cầu #${id} cho nhân viên thành công!`);
      setAssignReq(null);
      fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Giao việc thất bại.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject handler
  const handleReject = async (id, reason) => {
    setActionLoading(true);
    try {
      await axiosClient.post(`/InventoryRequests/${id}/reject`, { reason });
      showToast(`Đã từ chối yêu cầu #${id}.`);
      setRejectReq(null);
      fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Từ chối thất bại.', true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Yêu cầu nhập / xuất kho</h1>
        <p className="text-slate-500 text-sm mt-1">Duyệt và giao nhiệm vụ cho nhân viên thực hiện các yêu cầu từ người thuê.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: toast.isError ? '#fee2e2' : '#d1fae5', border: `1px solid ${toast.isError ? '#fecaca' : '#a7f3d0'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ color: toast.isError ? '#dc2626' : '#059669', fontSize: 20 }}>{toast.isError ? 'error' : 'check_circle'}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: toast.isError ? '#991b1b' : '#065f46' }}>{toast.msg}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon="inventory_2"   label="Tổng yêu cầu"    value={data.totalCount} color="#00b2d6" />
        <StatCard icon="schedule"      label="Chờ duyệt"        value={counts.pending}   color="#f59e0b" />
        <StatCard icon="assignment_ind" label="Đã giao Staff"   value={counts.assigned}  color="#1d4ed8" />
        <StatCard icon="check_circle"  label="Hoàn thành"       value={counts.completed} color="#10b981" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[{ key: 'INBOUND', icon: 'move_to_inbox', label: 'Nhập kho' }, { key: 'OUTBOUND', icon: 'outbox', label: 'Xuất kho' }].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); setSearch(''); }} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600,
            background: activeTab === tab.key ? '#fff' : 'transparent',
            color: activeTab === tab.key ? '#00b2d6' : '#6b7280',
            boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Tìm kiếm</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9ca3af' }}>search</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mã yêu cầu, renter, kho..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }} />
            </div>
          </div>
          <div style={{ minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Trạng thái</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f8fafc', cursor: 'pointer' }}>
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="ASSIGNED">Đã giao</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Mã YC', 'Loại', 'Kho bãi', 'Người thuê', 'SL', 'Trạng thái', 'Nhân viên', 'Ngày tạo', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#00b2d6', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }}>sync</span>
                  Đang tải...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '48px 0', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#d1d5db', display: 'block', marginBottom: 8 }}>inbox</span>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>Không có yêu cầu nào.</p>
                </td></tr>
              ) : filtered.map(req => (
                <tr key={req.invReqId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>#{req.invReqId}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                      background: req.type === 'INBOUND' ? '#e0f2fe' : '#fef3c7', color: req.type === 'INBOUND' ? '#0369a1' : '#b45309' }}>
                      {req.type === 'INBOUND' ? 'Nhập' : 'Xuất'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.warehouseName}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{req.renterName}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{req.renterEmail}</p>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', fontWeight: 700, fontSize: '0.78rem' }}>{req.totalItems}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={req.status} /></td>
                  <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: req.assignedStaffName ? '#1d4ed8' : '#9ca3af', fontWeight: req.assignedStaffName ? 600 : 400 }}>
                    {req.assignedStaffName || '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {/* Chi tiết */}
                      <button onClick={() => setDetailReq(req)} title="Xem chi tiết" style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '5px 8px', borderRadius: 6, color: '#6b7280', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.color = '#00b2d6'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#6b7280'; }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                      </button>
                      {/* Giao Staff (chỉ PENDING) */}
                      {req.status === 'PENDING' && (
                        <button onClick={() => setAssignReq(req)} title="Giao cho Staff" style={{ background: '#dbeafe', border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: 6, color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#bfdbfe'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#dbeafe'; }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>assignment_ind</span>
                          Giao
                        </button>
                      )}
                      {/* Từ chối (chỉ PENDING) */}
                      {req.status === 'PENDING' && (
                        <button onClick={() => setRejectReq(req)} title="Từ chối" style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: 6, color: '#dc2626', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fecaca'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fee2e2'; }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>cancel</span>
                          Từ chối
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Tổng <strong style={{ color: '#111827' }}>{data.totalCount}</strong> yêu cầu</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#d1d5db' : '#374151', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>Trước
            </button>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{page} / {data.totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: page >= data.totalPages ? 'not-allowed' : 'pointer', color: page >= data.totalPages ? '#d1d5db' : '#374151', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Sau<span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DetailModal req={detailReq} onClose={() => setDetailReq(null)} />
      <AssignModal req={assignReq} staffList={staffList} onClose={() => setAssignReq(null)} onAssign={handleAssign} loading={actionLoading} />
      <RejectModal req={rejectReq} onClose={() => setRejectReq(null)} onReject={handleReject} loading={actionLoading} />
    </div>
  );
};

export default ManagerInventoryRequests;
