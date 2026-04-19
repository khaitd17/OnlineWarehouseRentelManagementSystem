import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

/* ── Format giá ────────────────────────────────────────── */
const fmtPrice = (p) => {
  if (!p) return 'Liên hệ';
  if (p >= 1000) return `${(p / 1000).toFixed(0)}k đ/m³`;
  return `${Number(p).toLocaleString('vi-VN')} đ/m³`;
};

/* ── Resolve ảnh ───────────────────────────────────────── */
const resolveImage = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400';
  return url.startsWith('http') ? url : `http://localhost:5276${url}`;
};

/* ══════════════════════════════════════════════════════════
   WarehouseMap – Google Maps Embed + Sidebar danh sách kho
   ══════════════════════════════════════════════════════════ */
export default function WarehouseMap({ warehouses }) {
  const [selectedId, setSelectedId] = useState(null);

  /* Lọc kho có tọa độ */
  const mapped = useMemo(
    () => warehouses.filter(w => w.lat != null && w.lng != null),
    [warehouses]
  );

  /* Kho đang được chọn */
  const selected = mapped.find(w => w.warehouseId === selectedId) || mapped[0] || null;

  /* Build iframe src cho kho đang chọn */
  const iframeSrc = useMemo(() => {
    if (!selected) return null;
    const q = encodeURIComponent(`${selected.lat},${selected.lng}`);
    return `https://www.google.com/maps?q=${q}&z=15&output=embed`;
  }, [selected]);

  return (
    <div style={{
      display: 'flex', gap: 16, height: '76vh',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
      border: '1px solid #e2e8f0', background: '#fff',
    }}>
      {/* ── Sidebar danh sách kho ────────────────────── */}
      <div style={{
        width: 320, minWidth: 280, overflowY: 'auto',
        borderRight: '1px solid #e2e8f0', background: '#fafbfc',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 2,
          background: 'linear-gradient(135deg, #0095c7, #0077a3)',
          padding: '16px 18px', color: '#fff',
        }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em' }}>
            📍 Kho trên bản đồ
          </div>
          <div style={{ fontSize: '0.76rem', opacity: 0.85, marginTop: 4 }}>
            {mapped.length} / {warehouses.length} kho có tọa độ
          </div>
        </div>

        {/* Danh sách kho */}
        {mapped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🗺️</div>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              {warehouses.length === 0 ? 'Không tìm thấy kho nào' : 'Kho chưa có tọa độ'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              {warehouses.length === 0 ? 'Thử điều chỉnh bộ lọc.' : 'Chủ kho chưa cập nhật vị trí địa lý.'}
            </div>
          </div>
        ) : (
          mapped.map(w => {
            const isActive = selected?.warehouseId === w.warehouseId;
            return (
              <div
                key={w.warehouseId}
                onClick={() => setSelectedId(w.warehouseId)}
                style={{
                  display: 'flex', gap: 12, padding: '14px 16px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  borderBottom: '1px solid #f1f5f9',
                  background: isActive ? '#eef8fc' : 'transparent',
                  borderLeft: isActive ? '3px solid #0095c7' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Ảnh kho */}
                <img
                  src={resolveImage(w.imageUrl)}
                  alt={w.name}
                  style={{
                    width: 72, height: 56, borderRadius: 10,
                    objectFit: 'cover', flexShrink: 0,
                  }}
                />
                {/* Thông tin */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: '0.84rem', color: '#0f172a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {w.name}
                  </div>
                  <div style={{
                    fontSize: '0.72rem', color: '#64748b', marginTop: 3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    📍 {w.address}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <span style={{
                      fontSize: '0.74rem', fontWeight: 800, color: '#0095c7',
                      background: '#eef8fc', borderRadius: 6, padding: '2px 8px',
                    }}>
                      {fmtPrice(w.pricePerM2)}
                    </span>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 600, color: '#16a34a',
                    }}>
                      {(w.availableArea || 0).toLocaleString('vi-VN')} m³
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Cảnh báo kho thiếu tọa độ */}
        {warehouses.length > 0 && mapped.length < warehouses.length && (
          <div style={{
            padding: '12px 16px', fontSize: '0.72rem', color: '#94a3b8',
            textAlign: 'center', borderTop: '1px solid #f1f5f9',
          }}>
            ⚠️ {warehouses.length - mapped.length} kho chưa có tọa độ
          </div>
        )}
      </div>

      {/* ── Bản đồ Google Maps Embed ─────────────────── */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        {iframeSrc ? (
          <>
            <iframe
              title="Google Maps"
              src={iframeSrc}
              style={{
                width: '100%', height: '100%', border: 0,
              }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Thẻ thông tin kho đang xem */}
            {selected && (
              <div style={{
                position: 'absolute', bottom: 20, left: 20, right: 20,
                background: 'rgba(255,255,255,0.97)', borderRadius: 14,
                padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', gap: 16,
                backdropFilter: 'blur(10px)',
                maxWidth: 560,
              }}>
                <img
                  src={resolveImage(selected.imageUrl)}
                  alt={selected.name}
                  style={{
                    width: 80, height: 64, borderRadius: 10,
                    objectFit: 'cover', flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800, fontSize: '0.95rem', color: '#0f172a',
                    marginBottom: 4,
                  }}>
                    {selected.name}
                  </div>
                  <div style={{
                    fontSize: '0.76rem', color: '#64748b', marginBottom: 8,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    📍 {selected.address}
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{
                      background: '#eef8fc', borderRadius: 8, padding: '4px 12px',
                      fontWeight: 800, fontSize: '0.84rem', color: '#0095c7',
                    }}>
                      {fmtPrice(selected.pricePerM2)}
                    </span>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 600, color: '#16a34a',
                    }}>
                      {(selected.availableArea || 0).toLocaleString('vi-VN')} m³ trống
                    </span>
                  </div>
                </div>
                <Link
                  to={`/warehouse/${selected.warehouseId}`}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #0095c7, #0077a3)',
                    color: '#fff', textDecoration: 'none',
                    fontWeight: 700, fontSize: '0.82rem',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,149,199,0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Xem chi tiết →
                </Link>
              </div>
            )}
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#f8fafc',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🗺️</div>
            <div style={{ fontWeight: 700, color: '#334155' }}>Chọn một kho để xem vị trí</div>
          </div>
        )}
      </div>
    </div>
  );
}
