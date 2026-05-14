import React, { useState, useRef, useCallback, useEffect } from 'react';
import { normalizeToGrid, shoelaceArea } from '../../utils/polygonUtils';

const CANVAS_SIZE = 540;
const HANDLE_R = 7;

const btn = (primary) => ({
  padding: '10px 22px', borderRadius: '10px', fontWeight: 700,
  fontSize: '0.92rem', cursor: 'pointer', border: 'none',
  background: primary ? 'linear-gradient(135deg,#0095c7,#0284c7)' : '#f1f5f9',
  color: primary ? '#fff' : '#334155',
  boxShadow: primary ? '0 4px 12px rgba(0,149,199,0.3)' : 'none',
  transition: 'all 0.2s',
});

/**
 * PolygonBoundaryEditor
 *
 * Lưu tọa độ dạng phần trăm [{px, py}] trong khoảng 0-1.
 * Không phụ thuộc normalizeToGrid — đơn giản và đáng tin cậy.
 *
 * @param {number}      totalArea   diện tích kho (m²) — chỉ dùng để hiển thị
 * @param {string|null} initialJson BoundaryPoints JSON hiện có
 * @param {Function}    onSave      (jsonString) => void
 * @param {Function}    [onCancel]  () => void
 * @param {boolean}     inline      render không dùng fixed overlay
 */
export default function PolygonBoundaryEditor({ hasInventory, totalArea, initialJson, initialGateJson, onSave, onCancel, inline = false }) {
  const [points, setPoints]           = useState([]);
  const [editorMode, setEditorMode]   = useState('draw'); // 'draw' or 'gate'
  const [gatePos, setGatePos]         = useState(null);
  const [pan, setPan]                 = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning]     = useState(false);
  const [panStart, setPanStart]       = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [hoverIdx, setHoverIdx]       = useState(null);
  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);
  const svgRef = useRef(null);
  const wasDraggingRef = useRef(false);

  // ── Khôi phục từ JSON ──────────────────────────────────────────────────
  useEffect(() => {
    if (!initialJson) return;
    try {
      const parsed = JSON.parse(initialJson);
      if (!Array.isArray(parsed) || parsed.length < 3) return;
      // Hỗ trợ cả format cũ {gx,gy} và mới {px,py}
      if (parsed[0].px !== undefined) {
        setPoints(parsed.map(p => ({ x: p.px * CANVAS_SIZE, y: p.py * CANVAS_SIZE })));
      } else if (parsed[0].gx !== undefined) {
        // format cũ: chuyển về tương đối
        const maxGx = Math.max(...parsed.map(p => p.gx)) || 1;
        const maxGy = Math.max(...parsed.map(p => p.gy)) || 1;
        const scale = Math.min(CANVAS_SIZE / (maxGx + 2), CANVAS_SIZE / (maxGy + 2), 20);
        setPoints(parsed.map(p => ({ x: (p.gx + 1) * scale, y: (p.gy + 1) * scale })));
      }
    } catch { /* ignore */ }
  }, [initialJson]);

  // ── Khôi phục Gate từ JSON ──────────────────────────────────────────────
  useEffect(() => {
    if (!initialGateJson) return;
    try {
      const parsed = JSON.parse(initialGateJson);
      if (parsed && parsed.gx !== undefined && initialJson) {
        const parsedPoints = JSON.parse(initialJson);
        if (parsedPoints && parsedPoints[0] && parsedPoints[0].gx !== undefined) {
          const maxGx = Math.max(...parsedPoints.map(p => p.gx)) || 1;
          const maxGy = Math.max(...parsedPoints.map(p => p.gy)) || 1;
          const scale = Math.min(CANVAS_SIZE / (maxGx + 2), CANVAS_SIZE / (maxGy + 2), 20);
          setGatePos({ x: (parsed.gx + 1) * scale, y: (parsed.gy + 1) * scale, angle: parsed.angle || 0 });
        }
      } else if (parsed && parsed.px !== undefined) {
        setGatePos({ x: parsed.px * CANVAS_SIZE, y: parsed.py * CANVAS_SIZE, angle: parsed.angle || 0 });
      }
    } catch { /* ignore */ }
  }, [initialGateJson]);

  // ── Tọa độ SVG chính xác ───────────────────────────────────────────────
  const getSVGCoords = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    pt.y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const s = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: s.x - pan.x, y: s.y - pan.y };
  }, [pan]);

  // ── Click thêm điểm / chọn cổng ────────────────────────────────────────
  const getClosestPointOnSegment = (p, a, b) => {
    const dx = b.x - a.x; const dy = b.y - a.y;
    if (dx === 0 && dy === 0) return a;
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    if (t < 0) return a; if (t > 1) return b;
    return { x: a.x + t * dx, y: a.y + t * dy };
  };

  const getClosestPointOnPolygon = (p, pts) => {
    if (pts.length < 3) return null;
    let minDist = Infinity; let closest = null; let bestAngle = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]; const b = pts[(i + 1) % pts.length];
      const cp = getClosestPointOnSegment(p, a, b);
      const dist = Math.hypot(p.x - cp.x, p.y - cp.y);
      if (dist < minDist) {
        minDist = dist; closest = cp;
        bestAngle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      }
    }
    return { point: closest, angle: bestAngle };
  };

  const handleCanvasClick = useCallback((e) => {
    if (draggingIdx !== null || wasDraggingRef.current) return;
    const { x, y } = getSVGCoords(e);
    
    if (editorMode === 'gate') {
      if (points.length < 3) {
        setError('Cần vẽ sơ đồ (ít nhất 3 điểm) trước khi đặt cổng.');
        return;
      }
      const snap = getClosestPointOnPolygon({ x, y }, points);
      if (snap) {
        setGatePos({ x: snap.point.x, y: snap.point.y, angle: snap.angle });
        setError('');
      }
      return;
    }

    setPoints(prev => [...prev, { x, y }]);
    setError('');
  }, [draggingIdx, getSVGCoords, editorMode, points]);

  // ── Kéo thả điểm và lưới ────────────────────────────────────────────────
  const handleVertexMouseDown = useCallback((e, idx) => {
    e.stopPropagation();
    setDraggingIdx(idx);
  }, []);

  const handleSvgMouseDown = useCallback((e) => {
    if (draggingIdx !== null) return;
    setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
    setIsPanning(true);
  }, [draggingIdx, pan]);

  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e) => {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        wasDraggingRef.current = true;
      }
      setPan({ x: panStart.panX + dx, y: panStart.panY + dy });
    };
    const onUp = () => {
      setIsPanning(false);
      setTimeout(() => { wasDraggingRef.current = false; }, 50);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isPanning, panStart]);

  useEffect(() => {
    if (draggingIdx === null) return;
    const onMove = (e) => {
      wasDraggingRef.current = true;
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.touches ? e.touches[0].clientX : e.clientX;
      pt.y = e.touches ? e.touches[0].clientY : e.clientY;
      const s = pt.matrixTransform(svg.getScreenCTM().inverse());
      setPoints(prev => prev.map((p, i) => i === draggingIdx
        ? { x: s.x - pan.x, y: s.y - pan.y }
        : p));
    };
    const onUp = () => {
      setDraggingIdx(null);
      setTimeout(() => { wasDraggingRef.current = false; }, 50);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [draggingIdx, pan]);

  // ── Lưu — chuyển sang phần trăm rồi gọi onSave ────────────────────────
  const handleSave = async () => {
    setError('');
    if (points.length < 3) {
      setError('Cần ít nhất 3 điểm để tạo hình khép kín.');
      return;
    }
    if (!totalArea || parseFloat(totalArea) <= 0) {
      setError('Vui lòng cập nhật Tổng diện tích (m²) của kho trước khi vẽ sơ đồ để chuẩn hóa lưới.');
      return;
    }

    const gridPoints = normalizeToGrid(points, parseFloat(totalArea));
    if (!gridPoints) {
      setError('Diện tích hình vẽ không hợp lệ (quá nhỏ hoặc tự cắt). Hãy kiểm tra lại.');
      return;
    }

    const jsonString = JSON.stringify(gridPoints);
    let gateString = null;
    if (gatePos) {
      try {
        const pixelArea = shoelaceArea(points);
        if (pixelArea > 0) {
          const metersPerPixel = Math.sqrt(parseFloat(totalArea) / pixelArea);
          const minX = Math.min(...points.map(p => p.x));
          const minY = Math.min(...points.map(p => p.y));
          const gx = (gatePos.x - minX) * metersPerPixel / 0.5;
          const gy = (gatePos.y - minY) * metersPerPixel / 0.5;
          gateString = JSON.stringify({ gx, gy, angle: gatePos.angle });
        }
      } catch (e) { console.error(e); }
    }
    setSaving(true);
    try {
      await onSave(jsonString, gateString);
    } catch (err) {
      setError('Lỗi khi lưu: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const pixelPolyPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const containerStyle = inline
    ? { background: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }
    : {
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      };

  const modalStyle = inline
    ? {}
    : {
        background: '#fff', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        padding: '1.5rem', maxWidth: 620, width: '100%', maxHeight: '95vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      };

  const inner = (
    <div style={modalStyle}>
      {/* Tiêu đề */}
      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          Vẽ sơ đồ kho
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
          Click vào canvas để đặt điểm. Kéo điểm để di chuyển. Hình tự động khép kín.
        </p>
      </div>

      {/* Thanh công cụ */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px', gap: '4px', marginRight: '8px' }}>
          <button style={{ ...btn(editorMode === 'draw'), padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => setEditorMode('draw')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: 4 }}>draw</span> Vẽ hình
          </button>
          <button style={{ ...btn(editorMode === 'gate'), padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => setEditorMode('gate')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: 4 }}>door_open</span> Đặt cổng
          </button>
        </div>
        <button style={btn(false)} onClick={() => setPoints(p => p.slice(0, -1))} disabled={points.length === 0}>
          Quay lại
        </button>
        <button style={btn(false)} onClick={() => { setPoints([]); setGatePos(null); setError(''); setPan({x:0, y:0}); }} disabled={points.length === 0 && (pan.x === 0 && pan.y === 0)}>
          Đặt lại
        </button>
        <button style={btn(false)} onClick={() => setPan({x:0, y:0})}>
          Căn giữa
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
          {points.length} điểm{totalArea ? ` | Diện tích: ${totalArea} m²` : ''}
        </span>
      </div>

      {/* Canvas vẽ */}
      <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', cursor: isPanning ? 'grabbing' : 'crosshair', lineHeight: 0 }}>
        <svg
          ref={svgRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ display: 'block', width: '100%', aspectRatio: '1' }}
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          onMouseDown={handleSvgMouseDown}
          onClick={handleCanvasClick}
        >
          <defs>
            <pattern id="dotGridPBE" x={pan.x} y={pan.y} width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#dotGridPBE)" />
          <g transform={`translate(${pan.x}, ${pan.y})`}>
            {/* Vùng tô */}
            {points.length >= 3 && (
              <polygon points={pixelPolyPoints} fill="rgba(0,149,199,0.10)" stroke="none" />
            )}

            {/* Cạnh */}
            {points.length >= 2 && points.map((p, i) => {
              const next = points[(i + 1) % points.length];
              const isClosing = i === points.length - 1;
              return (
                <line key={i} x1={p.x} y1={p.y} x2={next.x} y2={next.y}
                  stroke={isClosing && points.length < 3 ? '#94a3b8' : '#0095c7'}
                  strokeWidth={2}
                  strokeDasharray={isClosing && points.length < 3 ? '6 4' : 'none'}
                />
              );
            })}

            {/* Cổng */}
            {gatePos && (
              <g transform={`translate(${gatePos.x}, ${gatePos.y}) rotate(${gatePos.angle})`} style={{ pointerEvents: 'none' }}>
                <rect x="-15" y="-6" width="30" height="12" fill="#f59e0b" stroke="#fff" strokeWidth="2" rx="4" />
                <text x="0" y="3" fontSize="9" fill="#fff" fontWeight="800" textAnchor="middle">CỔNG</text>
              </g>
            )}

            {/* Điểm đỉnh */}
            {points.map((p, i) => (
              <g key={i}
                onMouseDown={(e) => handleVertexMouseDown(e, i)}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: 'grab' }}>
                <circle cx={p.x} cy={p.y} r={HANDLE_R + 5} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={HANDLE_R}
                  fill={i === 0 ? '#16a34a' : (hoverIdx === i ? '#f59e0b' : '#0095c7')}
                  stroke="#fff" strokeWidth={2} />
                <text x={p.x + 10} y={p.y - 7} fontSize="11" fill="#475569" fontWeight="700">
                  {i === 0 ? 'Bắt đầu' : i + 1}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
        Chế độ Vẽ: Click để thêm điểm, kéo để chỉnh vị trí. | Chế độ Cổng: Click gần cạnh để đặt cổng.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {hasInventory && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', color: '#dc2626', fontSize: '0.88rem', fontWeight: 600, marginTop: 8 }}>
          <strong>Cảnh báo:</strong> Kho đã có hàng. Nếu lưu lại sơ đồ, bạn cần sắp xếp lại hàng hóa, và toàn bộ hàng hóa hiện tại sẽ được đẩy ra danh sách chờ xếp hàng.
        </div>
      )}

      {/* Nút hành động */}
      <div style={{ display: 'flex', justifyContent: onCancel ? 'space-between' : 'flex-end', gap: 8, paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
        {onCancel && (
          <button style={btn(false)} onClick={onCancel} disabled={saving}>Hủy</button>
        )}
        <button
          style={{ ...btn(true), opacity: (points.length < 3 || saving) ? 0.55 : 1 }}
          onClick={handleSave}
          disabled={points.length < 3 || saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu sơ đồ kho'}
        </button>
      </div>
    </div>
  );

  return inline ? <div style={containerStyle}>{inner}</div> : <div style={containerStyle}>{inner}</div>;
}
