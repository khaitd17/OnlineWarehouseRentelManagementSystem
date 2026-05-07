import React from 'react';

const DISPLAY = 460;
const CELL_SIZE = 0.5;

/**
 * WarehouseFloorPlanView — Hiển thị sơ đồ kho dạng read-only.
 *
 * Hỗ trợ 2 format BoundaryPoints:
 *   - Mới/Chuẩn: [{gx, gy}] — tọa độ lưới 0.5m
 *   - Cũ: [{px, py}] — tọa độ phần trăm 0-1
 *
 * @param {string|null} boundaryPoints — JSON string từ warehouse.boundaryPoints
 * @param {number}      totalArea      — warehouse.totalArea (m²)
 */
export default function WarehouseFloorPlanView({ boundaryPoints, totalArea }) {
  const poly = parsePoly(boundaryPoints);

  if (!poly || poly.length < 3) {
    return (
      <div style={{
        background: '#f8fafc', borderRadius: '16px', padding: '32px',
        textAlign: 'center', border: '2px dashed #e2e8f0',
      }}>
        <div style={{ fontSize: '2rem', color: '#cbd5e1' }}>[ ]</div>
        <p style={{ margin: '12px 0 0', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
          Chua co so do kho
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
          Chu kho chua ve so do mat bang
        </p>
      </div>
    );
  }

  const isGrid = poly[0].gx !== undefined;

  let physicalWidth = 0;
  let physicalLength = 0;
  let spanX = 1, spanY = 1, minX = 0, minY = 0;

  if (isGrid) {
    const xs = poly.map(p => p.gx);
    const ys = poly.map(p => p.gy);
    minX = Math.min(...xs);
    minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    spanX = maxX - minX || 1;
    spanY = maxY - minY || 1;
    physicalWidth = spanX * CELL_SIZE;
    physicalLength = spanY * CELL_SIZE;
  } else {
    const xs = poly.map(p => p.px);
    const ys = poly.map(p => p.py);
    minX = Math.min(...xs);
    minY = Math.min(...ys);
    spanX = Math.max(...xs) - minX || 1;
    spanY = Math.max(...ys) - minY || 1;
  }

  // Giữ tỷ lệ, fit vào DISPLAY x DISPLAY
  const pad = 20;
  const scaleX = (DISPLAY - pad * 2) / spanX;
  const scaleY = (DISPLAY - pad * 2) / spanY;
  const scale = Math.min(scaleX, scaleY);
  const cw = Math.round(spanX * scale + pad * 2);
  const ch = Math.round(spanY * scale + pad * 2);

  const toSVG = (p) => {
    const x = isGrid ? p.gx : p.px;
    const y = isGrid ? p.gy : p.py;
    return {
      x: (x - minX) * scale + pad,
      y: (y - minY) * scale + pad,
    };
  };

  const svgPoints = poly.map(p => { const s = toSVG(p); return `${s.x},${s.y}`; }).join(' ');
  const maskOuter = `M 0,0 L ${cw},0 L ${cw},${ch} L 0,${ch} Z`;
  const maskInner = poly.map((p, i) => {
    const s = toSVG(p);
    return `${i === 0 ? 'M' : 'L'} ${s.x},${s.y}`;
  }).join(' ') + ' Z';

  return (
    <div>
      {/* Thống kê */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          ['Dien tich san', `${totalArea ? Number(totalArea).toLocaleString('vi-VN') : '—'} m²`],
          isGrid ? ['Chieu dai', `${physicalLength.toFixed(1)} m`] : null,
          isGrid ? ['Chieu rong', `${physicalWidth.toFixed(1)} m`] : null,
          ['So diem bien', `${poly.length} diem`],
        ].filter(Boolean).map(([label, val]) => (
          <div key={label} style={{
            flex: '1 1 120px', background: '#f0f9ff', borderRadius: '10px',
            padding: '10px 14px', border: '1px solid #e0f2fe',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* SVG sơ đồ */}
      <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width={cw} height={ch} style={{ display: 'block', border: '2px solid #e2e8f0', borderRadius: '12px', background: '#fff' }}>
          {isGrid && (
            <defs>
              <pattern id="floorGridWFPV" x={pad} y={pad} width={scale} height={scale} patternUnits="userSpaceOnUse">
                <rect width={scale} height={scale} fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
            </defs>
          )}
          <rect width={cw} height={ch} fill="#f8fafc" />
          {isGrid && <rect width={cw} height={ch} fill="url(#floorGridWFPV)" />}

          {/* Vùng sàn */}
          <polygon points={svgPoints} fill="rgba(14,165,233,0.10)" stroke="none" />

          {/* Mặt nạ ngoài */}
          <path fillRule="evenodd" fill="rgba(100,116,139,0.25)" d={`${maskOuter} ${maskInner}`} />

          {/* Viền polygon */}
          <polygon points={svgPoints} fill="none" stroke="#0095c7" strokeWidth={2} strokeDasharray="5 3" />

          {/* Điểm đỉnh */}
          {poly.map((p, i) => {
            const s = toSVG(p);
            return (
              <circle key={i} cx={s.x} cy={s.y} r={4}
                fill={i === 0 ? '#16a34a' : '#0095c7'}
                stroke="#fff" strokeWidth={1.5} />
            );
          })}
        </svg>
      </div>

      {/* Chú thích */}
      <div style={{ display: 'flex', gap: 16, marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          ['rgba(14,165,233,0.2)', '1px solid #0095c7', 'Vung su dung'],
          ['rgba(100,116,139,0.25)', 'none', 'Ngoai bien kho'],
          ['#16a34a', 'none', 'Diem goc'],
        ].map(([bg, border, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, background: bg, border, borderRadius: 2 }} />
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Parse BoundaryPoints JSON */
function parsePoly(json) {
  if (!json) return null;
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || arr.length < 3) return null;
    return arr; // Không ép kiểu sang px, py nữa để giữ nguyên hệ tọa độ lưới thực tế
  } catch {
    return null;
  }
}
