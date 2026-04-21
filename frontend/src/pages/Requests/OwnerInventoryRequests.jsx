import React, { useState, useEffect, useCallback } from 'react';
import inventoryService from '../../services/inventoryService';
import { getMyWarehouses } from '../../services/warehouseService';
import { ReceiptPreviewModal } from '../../components/InventoryReceiptPDF';

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
   Tracking Timeline Component
────────────────────────────────────────────────────────────── */
const formatDateTime = (dt) => {
  if (!dt) return null;
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
};

const TimelineStep = ({ title, subtitle, meta, note, isLast, isActive, isDone, isFailed, stepNumber }) => {
  const lineColor   = isDone   ? '#10b981' : '#e5e7eb';
  const dotBg       = isFailed ? '#ef4444' : isDone ? '#10b981' : isActive ? '#3b82f6' : '#f1f5f9';
  const dotColor    = isDone || isActive || isFailed ? '#fff' : '#94a3b8';

  return (
    <div style={{ display: 'flex', gap: 18, position: 'relative' }}>
      {!isLast && (
        <div style={{ position: 'absolute', left: 15, top: 32, bottom: -8, width: 2, background: lineColor, zIndex: 0 }} />
      )}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0, zIndex: 1,
        background: dotBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '0.85rem', color: dotColor,
        boxShadow: isActive ? `0 0 0 4px ${dotBg}33` : 'none',
        marginTop: 2
      }}>
        {stepNumber}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 24, flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: isDone || isActive ? '#0f172a' : '#64748b' }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{subtitle}</p>
        )}
        {meta && (
          <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: '0.75rem', color: '#475569', background: '#f8fafc',
              padding: '4px 10px', borderRadius: 6, fontWeight: 600, border: '1px solid #e2e8f0'
            }}>
              Ngày: {meta.date}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: '0.75rem', color: '#475569', background: '#f8fafc',
              padding: '4px 10px', borderRadius: 6, fontWeight: 600, border: '1px solid #e2e8f0'
            }}>
              Giờ: {meta.time}
            </span>
          </div>
        )}
        {note && (
          <div style={{
            marginTop: 10, padding: '10px 14px', borderRadius: 8,
            background: '#fffbeb', border: '1px solid #fde68a',
            fontSize: '0.8rem', color: '#92400e', lineHeight: 1.4
          }}>
            <strong style={{ fontWeight: 800 }}>Ghi chú: </strong>{note}
          </div>
        )}
      </div>
    </div>
  );
};

const TrackingTimeline = ({ req }) => {
  const status = req.status;

  // Xác định trạng thái từng bước
  const isCompleted = status === 'COMPLETED';
  const isRejected  = status === 'REJECTED';
  const isAssigned  = ['ASSIGNED', 'COMPLETED', 'REJECTED'].includes(status);
  const isConfirmed = ['CONFIRMED', 'ASSIGNED', 'COMPLETED', 'REJECTED'].includes(status);

  const steps = [
    {
      title: `Yêu cầu được tạo bởi ${req.renterName}`,
      subtitle: req.renterEmail,
      meta: formatDateTime(req.createdAt),
      isDone: true,
      isActive: false,
    },
    {
      title: isConfirmed
        ? `Đã duyệt bởi ${req.confirmedByName || 'Quản lý'}`
        : (isRejected ? 'Đã từ chối' : 'Chờ Quản lý xét duyệt'),
      subtitle: isConfirmed ? `Quản lý phụ trách` : undefined,
      meta: isConfirmed ? formatDateTime(req.confirmedAt) : null,
      isDone: isConfirmed,
      isActive: !isConfirmed && status === 'PENDING',
    },
    {
      title: isAssigned
        ? `Giao cho ${req.assignedStaffName || 'Nhân viên kho'}`
        : 'Chờ phân quyền nhân viên xử lý',
      subtitle: isAssigned && req.assignedStaffEmail ? req.assignedStaffEmail : undefined,
      meta: isAssigned ? formatDateTime(req.assignedAt) : null,
      note: isAssigned && req.assignedNote ? req.assignedNote : null,
      isDone: isAssigned,
      isActive: isConfirmed && !isAssigned,
    },
    {
      title: isCompleted ? 'Hoàn thành xuất/nhập kho'
           : isRejected  ? 'Yêu cầu bị hủy/từ chối'
           : 'Chờ hoàn tất',
      meta: (isCompleted || isRejected) ? formatDateTime(req.updatedAt) : null,
      isDone: isCompleted || isRejected,
      isFailed: isRejected,
      isActive: isAssigned && !isCompleted && !isRejected,
      isLast: true,
    },
  ];

  return (
    <div>
      <p style={{ margin: '0 0 20px', fontSize: '0.85rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Tiến trình xử lý
      </p>
      <div style={{ paddingLeft: 8 }}>
        {steps.map((step, i) => (
          <TimelineStep key={i} {...step} isLast={i === steps.length - 1} stepNumber={i + 1} />
        ))}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Detail Modal
────────────────────────────────────────────────────────────── */
const DetailModal = ({ req, onClose }) => {
  const [pdfOpen, setPdfOpen] = React.useState(false);
  if (!req) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 0,
        width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>

        {/* ── Modal Header ──────────────────────────── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
          borderRadius: '16px 16px 0 0',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '4px 10px', borderRadius: 6,
                fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                background: req.type === 'INBOUND' ? '#dcfce7' : '#fef3c7',
                color:      req.type === 'INBOUND' ? '#16a34a' : '#d97706',
                border:     `1px solid ${req.type === 'INBOUND' ? '#bbf7d0' : '#fde68a'}`,
              }}>
                {req.type === 'INBOUND' ? 'NHẬP KHO' : 'XUẤT KHO'}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>#{req.invReqId}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {req.warehouseName}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {req.type === 'INBOUND' && (
              <button
                onClick={() => setPdfOpen(true)}
                style={{
                  background: '#1e293b', border: 'none', cursor: 'pointer',
                  padding: '6px 14px', borderRadius: 8,
                  fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                  fontFamily: 'Inter, sans-serif', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#0f172a'}
                onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
              >
                Xem Phiếu Nhập Kho
              </button>
            )}
            <button onClick={onClose} style={{
              background: '#f1f5f9', border: 'none', cursor: 'pointer',
              padding: '6px 12px', borderRadius: 8,
              fontSize: '0.8rem', fontWeight: 700, color: '#475569',
              fontFamily: 'Inter, sans-serif', transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              DONG
            </button>
          </div>
        </div>

        {pdfOpen && (
          <ReceiptPreviewModal
            data={req}
            onClose={() => setPdfOpen(false)}
          />
        )}

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Thông tin chung ───────────────────────── */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Thông tin chung
            </p>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                {[
                  ['Người thuê', req.renterName],
                  ['Email',      req.renterEmail],
                  ['Trạng thái', <StatusBadge status={req.status} />],
                  ['Ngày tạo',   req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '—'],
                  ...(req.scheduledDate ? [['Ngày dự kiến', new Date(req.scheduledDate).toLocaleDateString('vi-VN')]] : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>{v}</p>
                  </div>
                ))}
              </div>
              {req.notes && (
                <div style={{ marginTop: 12, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ghi chú từ Người thuê</p>
                  <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#374151' }}>{req.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Tracking Timeline ─────────────────────── */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 18px' }}>
            <TrackingTimeline req={req} />
          </div>

          {/* ── Danh sách Hàng hóa ───────────────────── */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Danh sách hàng hóa
                <span style={{
                  marginLeft: 8, padding: '1px 8px', borderRadius: 999,
                  background: '#e0f2fe', color: '#0284c7', fontSize: '0.72rem', fontWeight: 700,
                }}>{req.items?.length || 0} mặt hàng</span>
              </p>
              {/* Volume summary banner */}
              {req.type === 'INBOUND' && req.totalEstimatedVolume > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:'0.75rem', color:'#4f46e5', fontWeight:700, background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:6, padding:'3px 10px' }}>
                    Ước tính: {req.totalEstimatedVolume?.toFixed(2)} m³
                  </span>
                  {req.totalVerifiedVolume > 0 && (
                    <span style={{ fontSize:'0.75rem', color:'#059669', fontWeight:700, background:'#d1fae5', border:'1px solid #a7f3d0', borderRadius:6, padding:'3px 10px' }}>
                      Thực tế: {req.totalVerifiedVolume?.toFixed(2)} m³
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(req.items || []).map((item) => (
                <div key={item.itemId} style={{
                  border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  background: '#fff',
                }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{item.itemName}</p>
                    {item.description && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>{item.description}</p>}
                    {/* Verified info from Staff */}
                    {(item.verifiedVolume || item.verifiedWeight) && (
                      <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap' }}>
                        {item.verifiedVolume && (
                          <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#059669', background:'#d1fae5', border:'1px solid #a7f3d0', borderRadius:5, padding:'1px 7px' }}>
                            Thực tế: {item.verifiedVolume} m³
                          </span>
                        )}
                        {item.verifiedWeight && (
                          <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#d97706', background:'#fef3c7', border:'1px solid #fde68a', borderRadius:5, padding:'1px 7px' }}>
                            Cân nặng: {item.verifiedWeight} kg
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#00b2d6' }}>
                      {item.quantity.toLocaleString()} {item.unit}
                    </p>
                    {item.estimatedVolume && (
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#6366f1', fontWeight:600 }}>
                        ~{item.estimatedVolume} m³
                      </p>
                    )}
                    {item.weight && <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{item.weight} kg</p>}
                    {item.verifiedQuantity !== null && item.verifiedQuantity !== undefined && item.verifiedQuantity !== item.quantity && (
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#dc2626', fontWeight:700 }}>
                        Thực nhận: {item.verifiedQuantity}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!req.items || req.items.length === 0) && (
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
                  Không có mặt hàng nào.
                </p>
              )}
            </div>

            {req.documentUrls && req.documentUrls.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{ margin:'0 0 10px', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Chứng từ đính kèm
                </p>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {req.documentUrls.map((rawUrl, i) => {
                    const ext = rawUrl.split('.').pop().toLowerCase();
                    const isImage = ['jpg','jpeg','png','webp'].includes(ext);
                    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:5276${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`;
                    return (
                      <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer" style={{
                        display:'inline-flex', alignItems:'center',
                        padding:'6px 14px', background:'#f8fafc', border:'1px solid #e2e8f0',
                        borderRadius:6, textDecoration:'none', color:'#3b82f6',
                        fontSize:'0.8rem', fontWeight:700, transition: 'all 0.2s'
                      }}
                         onMouseEnter={(e)=>{e.currentTarget.style.borderColor='#93c5fd'; e.currentTarget.style.background='#eff6ff';}}
                         onMouseLeave={(e)=>{e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#f8fafc';}}>
                        {isImage ? '[HÌNH ẢNH] ' : '[TÀI LIỆU] '}
                        Tệp {i + 1}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setMyWarehouses(list.filter(w => w.status === 'APPROVED' || !w.status));
      })
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
      <style>{`
        @keyframes floatIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .owner-header-grad { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 28px 32px; border-radius: 16px; margin-bottom: 24px; position: relative; overflow: hidden; }
        .owner-header-grad::after { content: ''; position: absolute; right: 0; top: 0; width: 400px; height: 100%; background: radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%); }
        .stat-card-hover { transition: transform 0.2s, box-shadow 0.2s; cursor: default; }
        .stat-card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .tab-btn { position: relative; overflow: hidden; }
        .tab-btn::after { content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 2px; align-self: center; background: currentColor; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateX(-50%); }
        .tab-btn.active::after { width: 100%; }
        .custom-glass { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); }
      `}</style>
      {/* Page Header */}
      <div className="owner-header-grad" style={{ animation: 'floatIn 0.4s ease-out' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Yêu cầu Nhập / Xuất kho</h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Quản lý và theo dõi toàn bộ yêu cầu hàng hóa tại chuỗi kho của bạn.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', animation: 'floatIn 0.5s ease-out backwards' }}>
        <div className="stat-card-hover" style={{ flex: 1, minWidth: 240, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', borderTop: '4px solid #0284c7', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng yêu cầu</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{data.totalCount}</p>
          </div>
        </div>
        <div className="stat-card-hover" style={{ flex: 1, minWidth: 240, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', borderTop: '4px solid #d97706', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Đang chờ duyệt</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{pending}</p>
          </div>
        </div>
        <div className="stat-card-hover" style={{ flex: 1, minWidth: 240, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', borderTop: '4px solid #059669', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Đã xác nhận</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{confirmed}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'INBOUND',  label: 'NHẬP KHO', color: '#10b981' },
          { key: 'OUTBOUND', label: 'XUẤT KHO', color: '#f59e0b' },
        ].map(tab => (
          <button key={tab.key} onClick={() => handleTabChange(tab.key)} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 10, border: `1.5px solid ${activeTab === tab.key ? tab.color : '#e2e8f0'}`, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700,
            background: activeTab === tab.key ? `${tab.color}0c` : '#fff',
            color: activeTab === tab.key ? tab.color : '#64748b',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === tab.key ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '16px 24px', marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Tìm kiếm</label>
            <div style={{ position: 'relative' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm mã số yêu cầu, tên khách, kho bãi..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', fontSize: '0.9rem',
                  outline: 'none', fontFamily: 'Inter, sans-serif',
                  background: '#f8fafc', transition: 'all 0.2s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)' }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Trạng thái</label>
            <div style={{ position: 'relative' }}>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, appearance: 'auto',
                  border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600, color: '#334155',
                  outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ duyệt (PENDING)</option>
                <option value="CONFIRMED">Đã duyệt (CONFIRMED)</option>
                <option value="REJECTED">Bị từ chối (REJECTED)</option>
              </select>
            </div>
          </div>

          {/* Warehouse Filter */}
          {myWarehouses.length > 0 && (
            <div style={{ minWidth: 220 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Kho bãi</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={warehouseFilter}
                  onChange={e => { setWarehouseFilter(e.target.value); setPage(1); }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, appearance: 'auto',
                    border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600, color: '#334155',
                    outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
                >
                  <option value="">Tất cả kho</option>
                  {myWarehouses.map(w => (
                    <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Mã YC', 'Kho bãi', 'Người thuê', 'Số mặt hàng', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                  <th key={h} style={{
                    padding: '14px 20px', textAlign: 'left',
                    fontSize: '0.75rem', fontWeight: 700, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af', fontWeight: 600 }}>
                  Đang tải dữ liệu ...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '60px 0', textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>Không tìm thấy yêu cầu nào phù hợp.</p>
                </td></tr>
              ) : filtered.map(req => (
                <tr key={req.invReqId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    #{req.invReqId}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
                    <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                      {req.warehouseName}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{req.renterName}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{req.renterEmail}</p>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8,
                      padding: '4px 12px'
                    }}>
                      {req.totalItems}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <StatusBadge status={req.status} />
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button
                      onClick={() => setSelectedReq(req)}
                      title="Xem chi tiết"
                      style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                        padding: '6px 12px', borderRadius: 6,
                        color: '#0ea5e9', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'underline',
                        transition: 'all 0.2s', outline: 'none'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#0284c7'; e.currentTarget.style.background = '#f0f9ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#0ea5e9'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      Xem chi tiết
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
          padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc',
        }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            Tổng số <strong style={{ color: '#0f172a' }}>{data.totalCount}</strong> yêu cầu tìm thấy
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: page <= 1 ? '#f8fafc' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                color: page <= 1 ? '#cbd5e1' : '#475569', fontSize: '0.85rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if(page > 1) { e.currentTarget.style.background = '#f1f5f9'; } }}
              onMouseLeave={e => { if(page > 1) { e.currentTarget.style.background = '#fff'; } }}
            >
              Trước
            </button>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, background: '#fff', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              {page} / {data.totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: page >= data.totalPages ? '#f8fafc' : '#fff', cursor: page >= data.totalPages ? 'not-allowed' : 'pointer',
                color: page >= data.totalPages ? '#cbd5e1' : '#475569', fontSize: '0.85rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if(page < data.totalPages) { e.currentTarget.style.background = '#f1f5f9'; } }}
              onMouseLeave={e => { if(page < data.totalPages) { e.currentTarget.style.background = '#fff'; } }}
            >
              Sau
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
