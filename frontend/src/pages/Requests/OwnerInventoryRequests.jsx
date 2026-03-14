import React, { useState, useEffect, useCallback } from 'react';
import inventoryService from '../../services/inventoryService';
import { getMyWarehouses } from '../../services/warehouseService';

/* ──────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────── */
const STATUS_MAP = {
  PENDING:   { label: 'Đang chờ',  bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  CONFIRMED: { label: 'Đã duyệt',  bg: '#d1fae5', color: '#059669', border: '#a7f3d0' },
  REJECTED:  { label: 'Từ chối',   bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 999,
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
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 24, color }}>{icon}</span>
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{value}</p>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Detail Modal
────────────────────────────────────────────────────────────── */
const DetailModal = ({ req, onClose }) => {
  if (!req) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              #{req.type === 'INBOUND' ? 'Nhập kho' : 'Xuất kho'} • #{req.invReqId}
            </p>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
              {req.warehouseName}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#9ca3af' }}>close</span>
          </button>
        </div>

        {/* Info */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {[
              ['Người thuê', req.renterName],
              ['Email', req.renterEmail],
              ['Trạng thái', <StatusBadge status={req.status} />],
              ['Ngày tạo', req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '—'],
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
        </div>

        {/* Items */}
        <p style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Danh sách hàng hóa ({req.items?.length || 0} mặt hàng)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(req.items || []).map((item, i) => (
            <div key={item.itemId} style={{
              border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{item.itemName}</p>
                {item.description && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>{item.description}</p>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#00b2d6' }}>
                  {item.quantity.toLocaleString()} {item.unit}
                </p>
                {item.weight && <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{item.weight} kg</p>}
              </div>
            </div>
          ))}
          {(!req.items || req.items.length === 0) && (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>Không có mặt hàng nào.</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Main Page
────────────────────────────────────────────────────────────── */
const OwnerInventoryRequests = () => {
  const [activeTab, setActiveTab] = useState('INBOUND');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], totalCount: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [myWarehouses, setMyWarehouses] = useState([]);

  const PAGE_SIZE = 10;

  // Load danh sách kho của owner
  useEffect(() => {
    getMyWarehouses()
      .then(data => setMyWarehouses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getOwnerInventoryRequests({
        type: activeTab,
        status: statusFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(res.data || { items: [], totalCount: 0, totalPages: 0 });
    } catch {
      setData({ items: [], totalCount: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, warehouseFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Apply search filter locally (simple client-side)
  const filtered = search
    ? data.items.filter(r =>
        r.renterName?.toLowerCase().includes(search.toLowerCase()) ||
        r.warehouseName?.toLowerCase().includes(search.toLowerCase()) ||
        String(r.invReqId).includes(search)
      )
    : data.items;

  // Stats: tính từ data hiện tại
  const pending   = data.items.filter(r => r.status === 'PENDING').length;
  const confirmed = data.items.filter(r => r.status === 'CONFIRMED').length;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setStatusFilter('');
    setSearch('');
  };

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Yêu cầu nhập / xuất kho</h1>
        <p className="text-slate-500 text-sm mt-1">Xem và quản lý tất cả yêu cầu từ người thuê trong các kho của bạn.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon="inventory_2"   label="Tổng yêu cầu"    value={data.totalCount} color="#00b2d6" />
        <StatCard icon="schedule"      label="Đang chờ duyệt"  value={pending}          color="#f59e0b" />
        <StatCard icon="check_circle"  label="Đã xác nhận"     value={confirmed}        color="#10b981" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[
          { key: 'INBOUND',  icon: 'move_to_inbox', label: 'Nhập kho' },
          { key: 'OUTBOUND', icon: 'outbox',        label: 'Xuất kho' },
        ].map(tab => (
          <button key={tab.key} onClick={() => handleTabChange(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600,
            background: activeTab === tab.key ? '#fff'         : 'transparent',
            color:      activeTab === tab.key ? '#00b2d6'      : '#6b7280',
            boxShadow:  activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
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
          {/* Search */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Tìm kiếm</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9ca3af' }}>search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Mã yêu cầu, renter, kho..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '9px 12px 9px 36px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: '0.875rem',
                  outline: 'none', fontFamily: 'Inter, sans-serif',
                  background: '#f8fafc',
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', fontSize: '0.875rem',
                outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f8fafc', cursor: 'pointer',
              }}
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Đang chờ</option>
              <option value="CONFIRMED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>

          {/* Warehouse Filter */}
          {myWarehouses.length > 0 && (
            <div style={{ minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Kho bãi</label>
              <select
                value={warehouseFilter}
                onChange={e => { setWarehouseFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: '0.875rem',
                  outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f8fafc', cursor: 'pointer',
                }}
              >
                <option value="">Tất cả kho</option>
                {myWarehouses.map(w => (
                  <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Mã YC', 'Kho bãi', 'Người thuê', 'Số mặt hàng', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: '0.7rem', fontWeight: 700, color: '#00b2d6',
                    textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }}>sync</span>
                  Đang tải...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '48px 0', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#d1d5db', display: 'block', marginBottom: 8 }}>inbox</span>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>Không có yêu cầu nào.</p>
                </td></tr>
              ) : filtered.map(req => (
                <tr key={req.invReqId} style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px', fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                    #{req.invReqId}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#374151' }}>
                    {req.warehouseName}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{req.renterName}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{req.renterEmail}</p>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#374151', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: '50%', background: '#e0f2fe',
                      color: '#0284c7', fontWeight: 700, fontSize: '0.8rem',
                    }}>{req.totalItems}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={req.status} />
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => setSelectedReq(req)}
                      title="Xem chi tiết"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '6px 10px', borderRadius: 6,
                        color: '#6b7280', fontSize: '0.8rem', fontWeight: 500,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.color = '#00b2d6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderTop: '1px solid #f1f5f9', background: '#f8fafc',
        }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Tổng <strong style={{ color: '#111827' }}>{data.totalCount}</strong> yêu cầu
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0',
                background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                color: page <= 1 ? '#d1d5db' : '#374151', fontSize: '0.8rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
              Trước
            </button>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{page} / {data.totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              style={{
                padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0',
                background: '#fff', cursor: page >= data.totalPages ? 'not-allowed' : 'pointer',
                color: page >= data.totalPages ? '#d1d5db' : '#374151', fontSize: '0.8rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              Sau
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal req={selectedReq} onClose={() => setSelectedReq(null)} />
    </div>
  );
};

export default OwnerInventoryRequests;
