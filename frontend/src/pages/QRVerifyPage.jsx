import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// Lấy hostname hiện tại (ví dụ: localhost hoặc 192.168.x.x) để API chạy được trên điện thoại nội bộ
const API_BASE = `http://${window.location.hostname}:5276/api`;

const STATUS_MAP = {
  PENDING:   { label: 'Đang chờ duyệt', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  CONFIRMED: { label: 'Đã duyệt',       bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  APPROVED:  { label: 'Đã duyệt',       bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  ASSIGNED:  { label: 'Đã giao việc',   bg: '#e0f2fe', color: '#075985', dot: '#0284c7' },
  RECEIVING: { label: 'Đang nhận hàng', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  COMPLETED: { label: 'Hoàn thành',     bg: '#f0fdf4', color: '#15803d', dot: '#16a34a' },
  REJECTED:  { label: 'Từ chối',        bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
};

const Badge = ({ status }) => {
  const c = STATUS_MAP[status] || { label: status, bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' };
  return (
    <span style={{ backgroundColor: c.bg, color: c.color, padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
};

const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const InfoRow = ({ icon, label, value, mono }) => (
  <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0284c7' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', fontFamily: mono ? '"Courier New", monospace' : 'inherit', wordBreak: 'break-word' }}>{value || '—'}</div>
    </div>
  </div>
);

export default function QRVerifyPage() {
  const { requestCode } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!requestCode) { setError('Mã yêu cầu không hợp lệ.'); setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/InventoryRequests/verify/${encodeURIComponent(requestCode)}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.message || 'Không tìm thấy yêu cầu.');
        } else {
          setData(await res.json());
        }
      } catch (err) {
        setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    })();
  }, [requestCode]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, border: '4px solid #e0f2fe', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Đang xác thực mã QR...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', fontFamily: "'Inter','Segoe UI',sans-serif", padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '48px 32px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#ef4444' }}>error</span>
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Xác thực thất bại</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', padding: '12px 28px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(14,165,233,0.3)' }}>
          Về trang chủ
        </Link>
      </div>
    </div>
  );

  const d = data;
  const isInbound = d.type === 'INBOUND';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)', fontFamily: "'Inter','Segoe UI',sans-serif", padding: '24px 16px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Back button */}
        <button onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.8)', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#475569', fontSize: '0.82rem', fontWeight: 600, marginBottom: 12, backdropFilter: 'blur(4px)', transition: 'all 0.2s' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          Quay lại
        </button>

        {/* Header Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', marginBottom: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #e0f2fe', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: isInbound ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: isInbound ? '0 8px 20px rgba(16,185,129,0.3)' : '0 8px 20px rgba(245,158,11,0.3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#fff' }}>{isInbound ? 'inventory' : 'local_shipping'}</span>
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
            Xác thực yêu cầu {isInbound ? 'nhập' : 'xuất'} kho
          </h1>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#64748b' }}>Thông tin được truy xuất trực tiếp từ hệ thống</p>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 12, padding: '10px 20px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mã yêu cầu</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', fontFamily: '"Courier New", monospace', letterSpacing: 1 }}>{d.requestCode}</span>
          </div>

          <div style={{ marginTop: 16 }}>
            <Badge status={d.status} />
          </div>
        </div>

        {/* Warning if not yet approved */}
        {d.status === 'PENDING' && (
          <div style={{ background: '#fef3c7', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #fcd34d' }}>
            <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 22 }}>warning</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e', lineHeight: 1.5 }}>Yêu cầu này chưa được quản lý phê duyệt. Vui lòng chờ duyệt trước khi tiếp nhận hàng.</span>
          </div>
        )}

        {/* Requester Info */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px 20px 8px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#0284c7' }}>person</span>
            Thông tin người yêu cầu
          </h3>
          <InfoRow icon="badge" label="Họ và tên" value={d.renterName} />
          <InfoRow icon="mail" label="Email" value={d.renterEmail} />
          <InfoRow icon="call" label="Số điện thoại" value={d.renterPhone} />
        </div>

        {/* Request Details */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px 20px 8px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#0284c7' }}>description</span>
            Chi tiết yêu cầu
          </h3>
          <InfoRow icon="tag" label="Mã yêu cầu" value={d.requestCode} mono />
          <InfoRow icon="swap_vert" label="Loại" value={isInbound ? 'NHẬP KHO (INBOUND)' : 'XUẤT KHO (OUTBOUND)'} />
          <InfoRow icon="warehouse" label="Kho hàng" value={d.warehouseName} />
          <InfoRow icon="calendar_today" label="Ngày tạo yêu cầu" value={fmtDate(d.createdAt)} />
          {d.scheduledDate && <InfoRow icon="event" label="Ngày dự kiến" value={fmtDate(d.scheduledDate)} />}
          {d.confirmedAt && <InfoRow icon="verified" label="Ngày duyệt" value={fmtDate(d.confirmedAt)} />}
          {d.confirmedByName && <InfoRow icon="admin_panel_settings" label="Người duyệt" value={d.confirmedByName} />}
          {d.assignedStaffName && <InfoRow icon="engineering" label="Nhân viên xử lý" value={d.assignedStaffName} />}
          {d.notes && <InfoRow icon="sticky_note_2" label="Ghi chú" value={d.notes} />}
        </div>

        {/* Items List */}
        {d.items && d.items.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#0284c7' }}>inventory_2</span>
              Danh sách hàng hóa ({d.items.length} mặt hàng)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {d.items.map((item, i) => (
                <div key={item.itemId || i} style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', flex: 1 }}>{item.itemName || 'Không tên'}</div>
                    <div style={{ background: isInbound ? '#d1fae5' : '#fef3c7', color: isInbound ? '#065f46' : '#92400e', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {item.quantity} {item.unit}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.78rem', color: '#64748b' }}>
                    {item.estimatedVolume != null && <span>Thể tích ước tính: <strong>{item.estimatedVolume} m³</strong></span>}
                    {item.verifiedQuantity != null && <span>SL thực tế: <strong style={{ color: item.verifiedQuantity !== item.quantity ? '#ef4444' : '#16a34a' }}>{item.verifiedQuantity}</strong></span>}
                    {item.verifiedVolume != null && <span>Thể tích thực tế: <strong>{item.verifiedVolume} m³</strong></span>}
                    {item.weight != null && <span>Khối lượng: <strong>{item.weight} kg</strong></span>}
                  </div>
                  {item.description && <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>{item.description}</div>}
                  {item.verifyNote && <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#0284c7', background: '#f0f9ff', padding: '6px 10px', borderRadius: 8, borderLeft: '3px solid #0284c7' }}>Ghi chú xác minh: {item.verifyNote}</div>}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ marginTop: 14, padding: '12px 16px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Tổng mặt hàng</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{d.totalItems}</div>
              </div>
              {d.totalEstimatedVolume != null && (
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Thể tích ước tính</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{d.totalEstimatedVolume} m³</div>
                </div>
              )}
              {d.totalVerifiedVolume != null && (
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Thể tích thực tế</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{d.totalVerifiedVolume} m³</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Volume Warning */}
        {d.volumeWarning && (
          <div style={{ background: '#fef3c7', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #fcd34d' }}>
            <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 22 }}>warning</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>Cảnh báo: Thể tích hàng hóa có thể vượt ngưỡng kho</span>
          </div>
        )}


        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0 40px', color: '#94a3b8', fontSize: '0.78rem' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Hệ thống quản lý kho bãi trực tuyến — OWRMS</p>
          <p style={{ margin: 0 }}>Xác thực lúc {new Date().toLocaleString('vi-VN')}</p>
        </div>
      </div>
    </div>
  );
}
