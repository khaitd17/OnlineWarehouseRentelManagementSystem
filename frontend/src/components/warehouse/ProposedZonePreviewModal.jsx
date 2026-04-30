/**
 * ProposedZonePreviewModal
 *
 * Hiển thị bản đồ kho + vùng đã được chỉ định.
 * - Nếu chủ kho đã sắp xếp (isOwnerAssigned=true) → hiển thị vùng chủ kho (+ extension nếu có)
 * - Nếu chưa có → hiển thị vùng người thuê đề xuất
 */
import React from 'react';

const SCALE = 22; // px per metre
const m2px  = (m) => m * SCALE;

const COLORS = {
  occupied : { bg: 'rgba(254,202,202,0.85)', border: '#ef4444', text: '#b91c1c' },
  free     : { bg: 'rgba(191,219,254,0.85)', border: '#3b82f6', text: '#1d4ed8' },
  baseArea : { bg: 'rgba(167,243,208,0.85)', border: '#10b981', text: '#065f46' },
  proposed : { bg: 'rgba(253,230,138,0.92)', border: '#f59e0b', text: '#92400e' },
  assigned : { bg: 'rgba(167,243,208,0.85)', border: '#10b981', text: '#065f46' },
};

export default function ProposedZonePreviewModal({ open, onClose, request, warehouseData, areas }) {
  if (!open || !request) return null;

  const whW = parseFloat(warehouseData?.width  ?? warehouseData?.Width  ?? 0) || 20;
  const whL = parseFloat(warehouseData?.length ?? warehouseData?.Length ?? 0) || 30;
  const totalArea = parseFloat(warehouseData?.totalArea ?? warehouseData?.TotalArea ?? 0);
  const whHeight  = (whW > 0 && whL > 0 && totalArea > 0) ? totalArea / (whW * whL) : 4;

  const canvasW = m2px(whW);
  const canvasH = m2px(whL);

  // After owner assigns a zone, it is stored in ProposedPosition*/ProposedWidth/Length.
  // HasExtensionZone=true means the owner added an L-shape extension.
  // We always show whatever is in the proposed fields (owner-overwritten or renter-original).
  const ownerAssigned = !!request.isOwnerAssigned;

  // Primary zone coords (always from proposedPosition* — owner overwrites these on assignment)
  const px = parseFloat(request.proposedPositionX) || 0;
  const py = parseFloat(request.proposedPositionY) || 0;
  const pw = parseFloat(request.proposedWidth)     || 0;
  const pl = parseFloat(request.proposedLength)    || 0;

  // Extension zone (L-shape)
  const hasExt = !!(request.hasExtensionZone && request.extensionWidth && request.extensionLength);
  const ex = parseFloat(request.extensionPositionX) || 0;
  const ey = parseFloat(request.extensionPositionY) || 0;
  const ew = parseFloat(request.extensionWidth)     || 0;
  const el = parseFloat(request.extensionLength)    || 0;

  // Parse additional zones (multi-zone auto-placement)
  let additionalZones = [];
  try {
    if (request.additionalZonesJson) {
      additionalZones = JSON.parse(request.additionalZonesJson);
    }
  } catch (e) { /* ignore parse error */ }

  const primaryM3   = parseFloat((pw * pl * whHeight).toFixed(1));
  const extensionM3 = hasExt ? parseFloat((ew * el * whHeight).toFixed(1)) : 0;
  const additionalM3 = additionalZones.reduce((sum, z) => sum + (z.w || 0) * (z.l || 0) * whHeight, 0);
  const totalM3     = parseFloat((primaryM3 + extensionM3 + additionalM3).toFixed(1));
  const isMultiZone = additionalZones.length > 0;
  const zoneCount   = 1 + (hasExt ? 1 : 0) + additionalZones.length;

  const baseAreaId = request.baseRentalAreaId;

  // Compute SVG L-shape polygon points if both zones are present and adjacent
  const computeLPoints = () => {
    if (!hasExt || ew <= 0 || el <= 0) return null;
    const p = { x: m2px(px), y: m2px(py), w: m2px(pw), l: m2px(pl) };
    const e = { x: m2px(ex), y: m2px(ey), w: m2px(ew), l: m2px(el) };
    const EPS = 3;
    // right
    if (Math.abs(e.x - (p.x + p.w)) < EPS && e.y >= p.y - EPS && e.y + e.l <= p.y + p.l + EPS)
      return `${p.x},${p.y} ${p.x+p.w},${p.y} ${p.x+p.w},${e.y} ${e.x+e.w},${e.y} ${e.x+e.w},${e.y+e.l} ${p.x+p.w},${e.y+e.l} ${p.x+p.w},${p.y+p.l} ${p.x},${p.y+p.l}`;
    // left
    if (Math.abs(e.x + e.w - p.x) < EPS && e.y >= p.y - EPS && e.y + e.l <= p.y + p.l + EPS)
      return `${e.x},${e.y} ${p.x},${e.y} ${p.x},${p.y} ${p.x+p.w},${p.y} ${p.x+p.w},${p.y+p.l} ${p.x},${p.y+p.l} ${p.x},${e.y+e.l} ${e.x},${e.y+e.l}`;
    // below
    if (Math.abs(e.y - (p.y + p.l)) < EPS && e.x >= p.x - EPS && e.x + e.w <= p.x + p.w + EPS)
      return `${p.x},${p.y} ${p.x+p.w},${p.y} ${p.x+p.w},${p.y+p.l} ${e.x+e.w},${p.y+p.l} ${e.x+e.w},${e.y+e.l} ${e.x},${e.y+e.l} ${e.x},${p.y+p.l} ${p.x},${p.y+p.l}`;
    // above
    if (Math.abs(e.y + e.l - p.y) < EPS && e.x >= p.x - EPS && e.x + e.w <= p.x + p.w + EPS)
      return `${e.x},${e.y} ${e.x+e.w},${e.y} ${e.x+e.w},${p.y} ${p.x+p.w},${p.y} ${p.x+p.w},${p.y+p.l} ${p.x},${p.y+p.l} ${p.x},${p.y} ${e.x},${e.y}`;
    return null;
  };
  const lPoints = computeLPoints();

  const stats = [
    ...(!isMultiZone ? [
      { label: 'Rộng',         value: `${pw} m` },
      { label: 'Dài',          value: `${pl} m` },
    ] : []),
    { label: 'Chiều cao kho',value: `${whHeight.toFixed(1)} m` },
    (hasExt || isMultiZone)
      ? { label: 'Thể tích tổng', value: `${totalM3} m³`, highlight: true }
      : { label: ownerAssigned ? 'Thể tích sắp xếp' : 'Thể tích đề xuất', value: `${primaryM3} m³`, highlight: true },
    { label: 'Thể tích yêu cầu', value: `${request.requestedArea} m³` },
    isMultiZone ? { label: 'Số vùng', value: `${zoneCount} vùng` } : null,
  ].filter(Boolean);

  if (hasExt) {
    stats.splice(2, 0,
      { label: 'Mở rộng', value: `+${ew}m × ${el}m (+${extensionM3} m³)`, sub: true }
    );
  }

  const titleLabel = ownerAssigned ? 'Khu vực chủ kho đã sắp xếp' : 'Khu vực người thuê tự vẽ';
  const zoneColor  = ownerAssigned ? COLORS.assigned : COLORS.proposed;
  const zoneLabel  = ownerAssigned ? 'Đã sắp xếp' : isMultiZone ? 'Đã chọn' : (request.isCustomArea ? 'Người thuê tự vẽ' : 'Vị trí đề xuất');

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
        {/* Header */}
        <div style={{
          padding: '1.4rem 1.8rem 1rem',
          background: ownerAssigned
            ? 'linear-gradient(135deg,#064e3b,#065f46)'
            : 'linear-gradient(135deg,#0f172a,#1e3a5f)',
          borderRadius: '22px 22px 0 0',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ownerAssigned ? '#6ee7b7' : '#f59e0b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 9h6M9 13h4"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                {titleLabel} — YC-{request.requestId}
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

        {/* Body */}
        <div style={{ display: 'flex', gap: 0, padding: '1.4rem 1.8rem 1.8rem', flex: 1, flexWrap: 'wrap' }}>

          {/* Floor plan */}
          <div style={{ flex: 1, overflowX: 'auto', paddingRight: 16 }}>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0 0 8px', fontWeight: 600 }}>
              Kho: {whW}m × {whL}m &nbsp;|&nbsp; Tỉ lệ: 1m = {SCALE}px
            </p>

            <div style={{
              position: 'relative',
              width: canvasW, height: canvasH,
              background: '#f0f7ff',
              border: '2.5px solid #3b82f6', borderRadius: 10,
              overflow: 'visible',
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
                // Check if this area is part of additionalZones (auto-selected)
                const isAutoSelected = additionalZones.some(z => z.areaId && z.areaId === a.id);
                const c = isAutoSelected ? COLORS.proposed : isBase ? COLORS.baseArea : (isOcc ? COLORS.occupied : COLORS.free);
                return (
                  <div key={a.id} style={{
                    position: 'absolute',
                    left: m2px(parseFloat(a.positionX || 0)),
                    top:  m2px(parseFloat(a.positionY || 0)),
                    width:  m2px(parseFloat(a.width  || 5)),
                    height: m2px(parseFloat(a.length || 5)),
                    background: c.bg, border: `2px ${isAutoSelected ? 'solid' : 'dashed'} ${c.border}`,
                    borderRadius: 4, boxSizing: 'border-box',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    zIndex: isAutoSelected ? 5 : 1,
                  }}>
                    {isAutoSelected && (
                      <span style={{ fontSize: '0.58rem', background: '#f59e0b', color: '#fff', fontWeight: 700, padding: '1px 5px', borderRadius: 4, marginBottom: 2, whiteSpace: 'nowrap' }}>
                        Đã chọn
                      </span>
                    )}
                    {isBase && !isAutoSelected && (
                      <span style={{ fontSize: '0.6rem', background: '#10b981', color: '#fff', fontWeight: 700, padding: '1px 5px', borderRadius: 4, marginBottom: 2, whiteSpace: 'nowrap' }}>
                        Cắt từ khu này
                      </span>
                    )}
                    <span style={{ fontWeight: 800, color: c.text, fontSize: '0.68rem', textAlign: 'center', lineHeight: 1.2 }}>{a.name}</span>
                    <span style={{ fontSize: '0.6rem', color: c.text, opacity: 0.85 }}>{a.width}m×{a.length}m</span>
                  </div>
                );
              })}

              {/* Zone rendering */}
              {pw > 0 && pl > 0 && (
                <>
                  <style>{`
                    @keyframes zonePulse {
                      0%,100% { opacity: 1; }
                      50%     { opacity: 0.82; }
                    }
                  `}</style>

                  {lPoints ? (
                    /* SVG L-shape */
                    <>
                      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
                        <polygon
                          points={lPoints}
                          fill={zoneColor.bg}
                          stroke={zoneColor.border}
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                          style={{ animation: 'zonePulse 2s ease-in-out infinite' }}
                        />
                      </svg>
                      {/* Primary label */}
                      <div style={{ position: 'absolute', left: m2px(px), top: m2px(py), width: m2px(pw), height: m2px(pl), zIndex: 11, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.95)', padding: '6px 12px', borderRadius: 8, backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'max-content', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: zoneColor.text, whiteSpace: 'nowrap', lineHeight: 1.3 }}>{zoneLabel}</span>
                          <span style={{ fontSize: '0.62rem', color: zoneColor.text, opacity: 0.9 }}>{pw}m×{pl}m</span>
                          <span style={{ fontSize: '0.6rem', color: zoneColor.text, opacity: 0.8 }}>{primaryM3} m³</span>
                        </div>
                      </div>
                      {/* Extension label */}
                      <div style={{ position: 'absolute', left: m2px(ex), top: m2px(ey), width: m2px(ew), height: m2px(el), zIndex: 11, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: zoneColor.text, whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.95)', padding: '2px 6px', borderRadius: 4, width: 'max-content', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>+{ew}m×{el}m</span>
                      </div>
                    </>
                  ) : (
                    /* Single rectangle */
                    <div style={{
                      position: 'absolute',
                      left: m2px(px), top: m2px(py),
                      width: m2px(pw), height: m2px(pl),
                      background: zoneColor.bg,
                      border: `2.5px solid ${zoneColor.border}`,
                      borderRadius: 6, boxSizing: 'border-box',
                      animation: 'zonePulse 2s ease-in-out infinite',
                      zIndex: 10,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ background: 'rgba(255,255,255,0.95)', padding: '6px 12px', borderRadius: 8, backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'max-content', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: zoneColor.text, whiteSpace: 'nowrap', lineHeight: 1.3 }}>{zoneLabel}</span>
                        <span style={{ fontSize: '0.62rem', color: zoneColor.text, opacity: 0.9 }}>{pw}m×{pl}m</span>
                        <span style={{ fontSize: '0.6rem', color: zoneColor.text, opacity: 0.8 }}>{primaryM3} m³</span>
                      </div>
                    </div>
                  )}

                  {/* Extension as separate box if not adjacent */}
                  {hasExt && !lPoints && ew > 0 && el > 0 && (
                    <div style={{
                      position: 'absolute',
                      left: m2px(ex), top: m2px(ey),
                      width: m2px(ew), height: m2px(el),
                      background: zoneColor.bg,
                      border: `2.5px solid ${zoneColor.border}`,
                      borderRadius: 6, boxSizing: 'border-box',
                      zIndex: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: zoneColor.text, background: 'rgba(255,255,255,0.95)', padding: '2px 6px', borderRadius: 4, width: 'max-content', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>+{ew}m×{el}m</span>
                    </div>
                  )}
                </>
              )}

              {/* Additional carved zones (non-area rectangles) */}
              {additionalZones.filter(z => !z.areaId).map((z, i) => (
                <div key={`addzone-${i}`} style={{
                  position: 'absolute',
                  left: m2px(z.x || 0), top: m2px(z.y || 0),
                  width: m2px(z.w || 0), height: m2px(z.l || 0),
                  background: COLORS.proposed.bg,
                  border: `2.5px solid ${COLORS.proposed.border}`,
                  borderRadius: 6, boxSizing: 'border-box',
                  animation: 'zonePulse 2s ease-in-out infinite',
                  zIndex: 10,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ background: 'rgba(255,255,255,0.95)', padding: '4px 8px', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'max-content', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: COLORS.proposed.text, whiteSpace: 'nowrap' }}>{z.w}m×{z.l}m</span>
                    <span style={{ fontSize: '0.58rem', color: COLORS.proposed.text, opacity: 0.8 }}>{(z.w * z.l * whHeight).toFixed(0)} m³</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { color: '#bfdbfe', border: '#3b82f6', label: 'Khu trống' },
                { color: '#fecaca', border: '#ef4444', label: 'Đang thuê' },
                { color: '#a7f3d0', border: '#10b981', label: ownerAssigned ? 'Khu chủ kho sắp xếp' : 'Khu gốc (cắt từ đây)' },
                !ownerAssigned && { color: '#fde68a', border: '#f59e0b', label: 'Vị trí đề xuất' },
              ].filter(Boolean).map(item => (
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
                  <span style={{ fontSize: '0.75rem', color: s.sub ? '#94a3b8' : '#64748b', fontStyle: s.sub ? 'italic' : 'normal' }}>{s.label}</span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    color: s.highlight ? (ownerAssigned ? '#059669' : '#d97706') : '#0f172a',
                    background: s.highlight ? (ownerAssigned ? '#d1fae5' : '#fef3c7') : 'transparent',
                    padding: s.highlight ? '0 6px' : '0',
                    borderRadius: 4,
                  }}>
                    {s.value}
                  </span>
                </div>
              ))}

              {/* Status indicator */}
              <div style={{
                marginTop: 12, padding: '8px 10px', borderRadius: 8,
                background: totalM3 >= request.requestedArea ? '#dcfce7' : '#fef9c3',
                color: totalM3 >= request.requestedArea ? '#166534' : '#854d0e',
                fontSize: '0.76rem', fontWeight: 700, textAlign: 'center',
              }}>
                {totalM3 >= request.requestedArea
                  ? `✓ Đủ thể tích: ${totalM3} m³ / ${request.requestedArea} m³`
                  : `⚠ Còn thiếu ${(request.requestedArea - totalM3).toFixed(1)} m³`}
              </div>
            </div>

            {baseAreaId && !ownerAssigned && (
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
