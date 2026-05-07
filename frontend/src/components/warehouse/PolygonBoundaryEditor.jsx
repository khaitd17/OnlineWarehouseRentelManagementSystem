import React, { useState, useRef, useCallback, useEffect } from 'react';
import { normalizeToGrid } from '../../utils/polygonUtils';

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
export default function PolygonBoundaryEditor({ totalArea, initialJson, onSave, onCancel, inline = false }) {
  const [points, setPoints]           = useState([]);
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

  // ── Tọa độ SVG chính xác ───────────────────────────────────────────────
  const getSVGCoords = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.touches ? e.touches[0].clientX : e.clientX;
    pt.y = e.touches ? e.touches[0].clientY : e.clientY;
    const s = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {
      x: Math.max(0, Math.min(CANVAS_SIZE, s.x)),
      y: Math.max(0, Math.min(CANVAS_SIZE, s.y)),
    };
  }, []);

  // ── Click thêm điểm ────────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    if (draggingIdx !== null || wasDraggingRef.current) return;
    const { x, y } = getSVGCoords(e);
    setPoints(prev => [...prev, { x, y }]);
    setError('');
  }, [draggingIdx, getSVGCoords]);

  // ── Kéo thả điểm ──────────────────────────────────────────────────────
  const handleVertexMouseDown = useCallback((e, idx) => {
    e.stopPropagation();
    setDraggingIdx(idx);
  }, []);

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
        ? { x: Math.max(0, Math.min(CANVAS_SIZE, s.x)), y: Math.max(0, Math.min(CANVAS_SIZE, s.y)) }
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
  }, [draggingIdx]);

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

    // Chuẩn hóa tọa độ vẽ tay thành tọa độ lưới (0.5m/ô)
    const gridPoints = normalizeToGrid(points, parseFloat(totalArea));
    if (!gridPoints) {
      setError('Diện tích hình vẽ không hợp lệ (quá nhỏ hoặc tự cắt). Hãy kiểm tra lại.');
      return;
    }

    const jsonString = JSON.stringify(gridPoints);
    setSaving(true);
    try {
      await onSave(jsonString);
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
        <button style={btn(false)} onClick={() => setPoints(p => p.slice(0, -1))} disabled={points.length === 0}>
          Quay lại
        </button>
        <button style={btn(false)} onClick={() => { setPoints([]); setError(''); }} disabled={points.length === 0}>
          Đặt lại
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
          {points.length} điểm{totalArea ? ` | Diện tích: ${totalArea} m²` : ''}
        </span>
      </div>

      {/* Canvas vẽ */}
      <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', cursor: 'crosshair', lineHeight: 0 }}>
        <svg
          ref={svgRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ display: 'block', width: '100%', aspectRatio: '1' }}
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          onClick={handleCanvasClick}
        >
          <defs>
            <pattern id="dotGridPBE" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#dotGridPBE)" />

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
                {i === 0 ? 'Bat dau' : i + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
        Diem xanh la = diem bat dau. Keo diem de dieu chinh vi tri.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Nút hành động */}
      <div style={{ display: 'flex', justifyContent: onCancel ? 'space-between' : 'flex-end', gap: 8, paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
        {onCancel && (
          <button style={btn(false)} onClick={onCancel} disabled={saving}>Huy</button>
        )}
        <button
          style={{ ...btn(true), opacity: (points.length < 3 || saving) ? 0.55 : 1 }}
          onClick={handleSave}
          disabled={points.length < 3 || saving}
        >
          {saving ? 'Dang luu...' : 'Luu so do kho'}
        </button>
      </div>
    </div>
  );

  return inline ? <div style={containerStyle}>{inner}</div> : <div style={containerStyle}>{inner}</div>;
}
