/**
 * ProposedZonePreviewModal
 *
 * Cho phép chủ kho xem toàn bộ bản đồ kho và vị trí mà người thuê đề xuất (highlight màu vàng).
 *
 * Props:
 *  open          {bool}
 *  onClose       {fn}
 *  request       {object}  — RentalRequestDto (isCustomArea, proposedPositionX/Y, proposedWidth/Length, ...)
 *  warehouseData {object}  — { width, length, totalArea, ... }
 *  areas         {array}   — RentalArea list từ API
 */
import React, { useMemo } from 'react';

const SCALE = 22; // px per metre
const m2px  = (m) => m * SCALE;

const COLORS = {
  occupied   : { bg: 'rgba(254,202,202,0.85)', border: '#ef4444', text: '#b91c1c' },
  free       : { bg: 'rgba(191,219,254,0.85)', border: '#3b82f6', text: '#1d4ed8' },
  baseArea   : { bg: 'rgba(167,243,208,0.85)', border: '#10b981', text: '#065f46' },
  proposed   : { bg: 'rgba(253,230,138,0.92)', border: '#f59e0b', text: '#92400e' },
};

export default function ProposedZonePreviewModal({ open, onClose, request, warehouseData, areas }) {
  if (!open || !request) return null;

  const whW = parseFloat(warehouseData?.width  ?? warehouseData?.Width  ?? 0) || 20;
  const whL = parseFloat(warehouseData?.length ?? warehouseData?.Length ?? 0) || 30;
  const totalArea = parseFloat(warehouseData?.totalArea ?? warehouseData?.TotalArea ?? 0);
  const whHeight  = (whW > 0 && whL > 0 && totalArea > 0) ? totalArea / (whW * whL) : 4;

  const canvasW = m2px(whW);
  const canvasH = m2px(whL);

  const px  = parseFloat(request.proposedPositionX ?? 0);
  const py  = parseFloat(request.proposedPositionY ?? 0);
  const pw  = parseFloat(request.proposedWidth     ?? 0);
  const pl  = parseFloat(request.proposedLength    ?? 0);
  const proposedM3 = parseFloat((pw * pl * whHeight).toFixed(1));

  const baseAreaId = request.baseRentalAreaId;

  // Stat chips
  const stats = [
    { label: 'Tọa độ X', value: `${px} m` },
    { label: 'Tọa độ Y', value: `${py} m` },
    { label: 'Rộng', value: `${pw} m` },
    { label: 'Dài', value: `${pl} m` },
    { label: 'Chiều cao kho', value: `${whHeight.toFixed(1)} m` },
    { label: 'Thể tích đề xuất', value: `${proposedM3} m³`, highlight: true },
    { label: 'Thể tích yêu cầu', value: `${request.requestedArea} m³` },
  ];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 20000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 22,
        width: '100%', maxWidth: 900,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 28px 72px rgba(0,0,0,0.28)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: '1.4rem 1.8rem 1rem',
          background: 'linear-gradient(135deg,#0f172a,#1e3a5f)',
          borderRadius: '22px 22px 0 0',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 9h6M9 13h4"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                Vị trí người thuê đề xuất — YC-{request.requestId}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(148,163,184,0.9)' }}>
                {request.renterName} · {request.warehouseName}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 16,
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', color: '#94a3b8',
          }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'flex', gap: 0, padding: '1.4rem 1.8rem 1.8rem', flex: 1, flexWrap: 'wrap' }}>

          {/* Floor plan */}
          <div style={{ flex: 1, overflowX: 'auto', paddingRight: 16 }}>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0 0 8px', fontWeight: 600 }}>
              Kho: {whW}m × {whL}m &nbsp;|&nbsp; Tỉ lệ: 1m = {SCALE}px
            </p>

            {/* Canvas */}
            <div style={{
              position: 'relative',
              width: canvasW, height: canvasH,
              background: '#f0f7ff',
              border: '2.5px solid #3b82f6', borderRadius: 10,
              overflow: 'hidden',
              backgroundImage: `
                linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px),
                linear-gradient(90deg,rgba(59,130,246,0.07) 1px, transparent 1px)
              `,
              backgroundSize: `${m2px(1)}px ${m2px(1)}px`,
            }}>
              {/* Existing areas */}
              {(areas || []).map(a => {
                const isOcc  = a.isOccupied;
                const isBase = a.id === baseAreaId;
                const c = isBase ? COLORS.baseArea : (isOcc ? COLORS.occupied : COLORS.free);
                const aw = m2px(parseFloat(a.width  || 5));
                const ah = m2px(parseFloat(a.length || 5));
                const ax = m2px(parseFloat(a.positionX || 0));
                const ay = m2px(parseFloat(a.positionY || 0));
                return (
                  <div key={a.id} style={{
                    position: 'absolute', left: ax, top: ay, width: aw, height: ah,
                    background: c.bg, border: `2px dashed ${c.border}`,
                    borderRadius: 4, boxSizing: 'border-box',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {isBase && (
                      <span style={{ fontSize: '0.6rem', background: '#10b981', color: '#fff', fontWeight: 700, padding: '1px 5px', borderRadius: 4, marginBottom: 2, whiteSpace: 'nowrap' }}>
                        Cắt từ khu này
                      </span>
                    )}
                    <span style={{ fontWeight: 800, color: c.text, fontSize: '0.68rem', textAlign: 'center', lineHeight: 1.2 }}>
                      {a.name}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: c.text, opacity: 0.85 }}>
                      {a.width}m×{a.length}m
                    </span>
                  </div>
                );
              })}

              {/* Proposed zone — pulsing yellow overlay */}
              {pw > 0 && pl > 0 && (
                <>
                  <style>{`
                    @keyframes proposedPulse {
                      0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.6); }
                      50%     { box-shadow: 0 0 0 6px rgba(245,158,11,0); }
                    }
                  `}</style>
                  <div style={{
                    position: 'absolute',
                    left: m2px(px), top: m2px(py),
                    width: m2px(pw), height: m2px(pl),
                    background: COLORS.proposed.bg,
                    border: `2.5px solid ${COLORS.proposed.border}`,
                    borderRadius: 6,
                    boxSizing: 'border-box',
                    animation: 'proposedPulse 1.8s ease-in-out infinite',
                    zIndex: 10,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: COLORS.proposed.text, whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                      Vị trí đề xuất
                    </span>
                    <span style={{ fontSize: '0.62rem', color: COLORS.proposed.text, opacity: 0.9 }}>
                      {pw}m×{pl}m
                    </span>
                    <span style={{ fontSize: '0.6rem', color: COLORS.proposed.text, opacity: 0.8 }}>
                      {proposedM3} m³
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { color: '#bfdbfe', border: '#3b82f6', label: 'Khu trống' },
                { color: '#fecaca', border: '#ef4444', label: 'Đang thuê' },
                { color: '#a7f3d0', border: '#10b981', label: 'Khu gốc (cắt từ đây)' },
                { color: '#fde68a', border: '#f59e0b', label: 'Vị trí đề xuất' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, border: `1.5px solid ${item.border}` }} />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: stats */}
          <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Chi tiết vị trí
              </div>
              {stats.map(s => (
                <div key={s.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '5px 0', borderBottom: '1px solid #f1f5f9',
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    color: s.highlight ? '#d97706' : '#0f172a',
                    background: s.highlight ? '#fef3c7' : 'transparent',
                    padding: s.highlight ? '0 6px' : '0',
                    borderRadius: 4,
                  }}>
                    {s.value}
                  </span>
                </div>
              ))}

              {/* match indicator */}
              <div style={{
                marginTop: 12, padding: '8px 10px', borderRadius: 8,
                background: proposedM3 >= request.requestedArea ? '#dcfce7' : '#fef9c3',
                color: proposedM3 >= request.requestedArea ? '#166534' : '#854d0e',
                fontSize: '0.76rem', fontWeight: 700, textAlign: 'center',
              }}>
                {proposedM3 >= request.requestedArea
                  ? '✓ Đủ thể tích yêu cầu'
                  : `⚠ Còn thiếu ${(request.requestedArea - proposedM3).toFixed(1)} m³`}
              </div>
            </div>

            {baseAreaId && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #86efac', fontSize: '0.76rem', color: '#15803d', fontWeight: 600 }}>
                Người thuê muốn cắt từ khu hiện có (màu xanh lá trên bản đồ)
              </div>
            )}

            <button onClick={onClose} style={{
              padding: '11px 0', borderRadius: 12,
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#475569', fontWeight: 700, fontSize: '0.88rem',
              cursor: 'pointer', marginTop: 'auto',
            }}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
