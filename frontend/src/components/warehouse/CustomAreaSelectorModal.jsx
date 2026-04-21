/**
 * CustomAreaSelectorModal
 *
 * Hiển thị bản đồ khu vực kho và cho phép người thuê:
 *  - Chọn 1 khu có sẵn (còn trống) và kéo-resize để "cắt" ra phần mình cần
 *  - Tự vẽ 1 khu mới trên khoảng trống
 *
 * Props:
 *  open           {bool}
 *  onClose        {fn}
 *  warehouseData  {object}  — full WH object (width, length, ...)
 *  areas          {array}   — RentalArea list from API
 *  requestedM3    {number}  — thể tích người thuê cần
 *  onConfirm      {fn({ posX, posY, width, length, baseAreaId })}
 */
import React, { useState, useRef, useCallback } from 'react';

/* ─── constants ─────────────────────────────────────────────────────────── */
const SCALE_PX_PER_M = 24;   // 1 metre = 24 px trong canvas
const MIN_ZONE_M      = 1;    // kích thước tối thiểu 1m

/* ─── helpers ────────────────────────────────────────────────────────────── */
const m2px = (m) => m * SCALE_PX_PER_M;
const px2m = (px) => px / SCALE_PX_PER_M;

/** Clamp giá trị nằm trong [min, max] */
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** Làm tròn tới 0.5m */
const snap = (m) => Math.round(m * 2) / 2;

const COLORS = {
  occupied : { bg: 'rgba(254,202,202,0.85)', border: '#ef4444', text: '#b91c1c' },
  free     : { bg: 'rgba(191,219,254,0.85)', border: '#3b82f6', text: '#1d4ed8' },
  selected : { bg: 'rgba(167,243,208,0.9)',  border: '#10b981', text: '#065f46' },
  custom   : { bg: 'rgba(253,230,138,0.9)',  border: '#f59e0b', text: '#92400e' },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function CustomAreaSelectorModal({
  open,
  onClose,
  warehouseData,
  areas,
  requestedM3,
  onConfirm,
}) {
  /* warehouse dimensions */
  const whW = parseFloat(warehouseData?.width  ?? warehouseData?.Width  ?? 0) || 20;
  const whL = parseFloat(warehouseData?.length ?? warehouseData?.Length ?? 0) || 30;
  const totalArea = parseFloat(warehouseData?.totalArea ?? warehouseData?.TotalArea ?? 0);
  // chiều cao kho = TotalArea(m³) / (Width × Length(m²)); fallback 4m
  const whHeight = (whW > 0 && whL > 0 && totalArea > 0)
    ? totalArea / (whW * whL)
    : 4;

  /* helper: zone footprint m² → m³ */
  const toM3 = (w, l) => parseFloat((w * l * whHeight).toFixed(1));

  /* canvas pixel size */
  const canvasW = m2px(whW);
  const canvasH = m2px(whL);

  /* mode: 'choose' | 'draw' */
  const [mode, setMode] = useState('choose');

  /* selected existing zone (mode=choose) */
  const [selectedAreaId, setSelectedAreaId] = useState(null);

  /* custom zone (mode=draw) – in metres */
  const [customZone, setCustomZone] = useState(null); // { x, y, w, l }

  /* drag/resize state */
  const dragRef  = useRef(null); // { type: 'move'|'se', startX, startY, startZone }
  const canvasRef = useRef(null);

  const selectedExisting = areas.find(a => a.id === selectedAreaId);

  /* ── derived area for the "chosen existing" zone (editable) ─── */
  // When user selects an existing zone we clone its dims (in metres) into state
  // so they can resize it to match requestedM3.
  const [editZone, setEditZone] = useState(null); // { x, y, w, l }

  const selectArea = (a) => {
    if (a.isOccupied) return;
    setSelectedAreaId(a.id);
    setCustomZone(null);
    setEditZone({
      x: parseFloat(a.positionX || 0),
      y: parseFloat(a.positionY || 0),
      w: parseFloat(a.width  || 5),
      l: parseFloat(a.length || 5),
    });
    setMode('choose');
  };

  /* ── CANVAS MOUSE handlers for custom zone drawing ──────────────  */
  const [drawing, setDrawing]   = useState(false);
  const [drawStart, setDrawStart] = useState(null);

  const canvasMouseDown = (e) => {
    if (mode !== 'draw') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // If we have a zone already, check if clicking corner handle → resize
    if (customZone) {
      const zx = m2px(customZone.x);
      const zy = m2px(customZone.y);
      const zw = m2px(customZone.w);
      const zl = m2px(customZone.l);
      const handleSize = 14;
      // SE corner
      if (Math.abs(mx - (zx + zw)) < handleSize && Math.abs(my - (zy + zl)) < handleSize) {
        dragRef.current = { type: 'se', startX: mx, startY: my, startZone: { ...customZone } };
        return;
      }
      // Interior → move
      if (mx > zx && mx < zx + zw && my > zy && my < zy + zl) {
        dragRef.current = { type: 'move', startX: mx, startY: my, startZone: { ...customZone } };
        return;
      }
    }
    // Begin new draw
    setDrawStart({ x: mx, y: my });
    setDrawing(true);
    setCustomZone(null);
    setSelectedAreaId(null);
    setEditZone(null);
  };

  const canvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Drag existing custom zone
    if (dragRef.current) {
      const d = dragRef.current;
      const dx = mx - d.startX;
      const dy = my - d.startY;
      if (d.type === 'move') {
        setCustomZone({
          ...d.startZone,
          x: clamp(snap(d.startZone.x + px2m(dx)), 0, whW - d.startZone.w),
          y: clamp(snap(d.startZone.y + px2m(dy)), 0, whL - d.startZone.l),
        });
      } else if (d.type === 'se') {
        const newW = clamp(snap(d.startZone.w + px2m(dx)), MIN_ZONE_M, whW - d.startZone.x);
        const newL = clamp(snap(d.startZone.l + px2m(dy)), MIN_ZONE_M, whL - d.startZone.y);
        setCustomZone({ ...d.startZone, w: newW, l: newL });
      }
      return;
    }

    if (!drawing || !drawStart) return;
    const x0 = Math.min(drawStart.x, mx);
    const y0 = Math.min(drawStart.y, my);
    const x1 = Math.max(drawStart.x, mx);
    const y1 = Math.max(drawStart.y, my);
    setCustomZone({
      x: clamp(snap(px2m(x0)), 0, whW),
      y: clamp(snap(px2m(y0)), 0, whL),
      w: clamp(snap(px2m(x1 - x0)), MIN_ZONE_M, whW),
      l: clamp(snap(px2m(y1 - y0)), MIN_ZONE_M, whL),
    });
  };

  const canvasMouseUp = () => {
    if (dragRef.current) { dragRef.current = null; return; }
    setDrawing(false);
    setDrawStart(null);
  };

  /* ── editZone mouse handlers (resize chosen existing zone) ─ */
  const editDragRef = useRef(null);

  const editMouseDown = (e, type) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    editDragRef.current = {
      type,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startZone: { ...editZone },
    };
    window.addEventListener('mousemove', editMouseMove);
    window.addEventListener('mouseup', editMouseUp);
  };

  const editMouseMove = useCallback((e) => {
    if (!editDragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const d   = editDragRef.current;
    const dx  = mx - d.startX;
    const dy  = my - d.startY;

    if (d.type === 'move') {
      setEditZone(prev => ({
        ...prev,
        x: clamp(snap(d.startZone.x + px2m(dx)), 0, whW - d.startZone.w),
        y: clamp(snap(d.startZone.y + px2m(dy)), 0, whL - d.startZone.l),
      }));
    } else if (d.type === 'se') {
      setEditZone(prev => ({
        ...prev,
        w: clamp(snap(d.startZone.w + px2m(dx)), MIN_ZONE_M, whW - d.startZone.x),
        l: clamp(snap(d.startZone.l + px2m(dy)), MIN_ZONE_M, whL - d.startZone.y),
      }));
    }
  }, [whW, whL]);

  const editMouseUp = useCallback(() => {
    editDragRef.current = null;
    window.removeEventListener('mousemove', editMouseMove);
    window.removeEventListener('mouseup',  editMouseUp);
  }, [editMouseMove]);

  /* ── Confirm ────────────────────────────────────────────────── */
  const activeZone = mode === 'choose' ? editZone : customZone;
  const activeM3   = activeZone ? toM3(activeZone.w, activeZone.l) : 0;

  const handleConfirm = () => {
    if (!activeZone) return;
    onConfirm({
      posX       : activeZone.x,
      posY       : activeZone.y,
      width      : activeZone.w,
      length     : activeZone.l,
      baseAreaId : mode === 'choose' ? selectedAreaId : null,
    });
  };

  if (!open) return null;

  /* ── UI ─────────────────────────────────────────────────────── */
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 20,
        width: '100%', maxWidth: 860,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: '1.4rem 1.8rem 1rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Tự sắp xếp vị trí thuê
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
              Bạn cần thuê <strong style={{ color: '#0ea5e9' }}>{requestedM3} m³</strong>.
              {activeZone ? (
                <>
                  {' '}Vùng đang chọn:{' '}
                  <strong style={{ color: activeM3 >= requestedM3 * 0.9 ? '#10b981' : '#f59e0b' }}>
                    {activeZone.w}m × {activeZone.l}m = {activeM3} m³
                  </strong>
                </>
              ) : ' Chọn hoặc vẽ vùng trên bản đồ.'}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%',
            width: 34, height: 34, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#64748b',
          }}>✕</button>
        </div>

        {/* ── Mode toggle ── */}
        <div style={{ padding: '0.8rem 1.8rem 0', display: 'flex', gap: 10 }}>
          {[
            { key: 'choose', label: 'Chọn khu có sẵn' },
            { key: 'draw',   label: 'Vẽ khu tự do'    },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setMode(tab.key); setSelectedAreaId(null); setEditZone(null); setCustomZone(null); }}
              style={{
                padding: '7px 18px', borderRadius: 10, fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer', border: 'none',
                background: mode === tab.key ? '#0ea5e9' : '#f1f5f9',
                color: mode === tab.key ? '#fff' : '#475569',
                boxShadow: mode === tab.key ? '0 2px 8px rgba(14,165,233,0.3)' : 'none',
                transition: 'all 0.15s',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* ── Body: canvas + sidebar ── */}
        <div style={{ display: 'flex', gap: 0, padding: '1rem 1.8rem 1.4rem', flex: 1 }}>

          {/* ── Scrollable canvas wrapper ── */}
          <div style={{ flex: 1, overflowX: 'auto', paddingRight: 16 }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 8px', fontWeight: 600 }}>
              Kho: {whW}m × {whL}m &nbsp;|&nbsp; Tỉ lệ: 1m = {SCALE_PX_PER_M}px
              {mode === 'draw' && <span style={{ color: '#f59e0b' }}> &nbsp;— Kéo để vẽ, kéo góc ↘ để resize</span>}
            </p>

            {/* Canvas */}
            <div
              ref={canvasRef}
              onMouseDown={mode === 'draw' ? canvasMouseDown : undefined}
              onMouseMove={mode === 'draw' ? canvasMouseMove : undefined}
              onMouseUp={mode === 'draw' ? canvasMouseUp : undefined}
              style={{
                position: 'relative',
                width: canvasW, height: canvasH,
                background: '#f0f7ff',
                border: '2.5px solid #3b82f6', borderRadius: 10,
                overflow: 'hidden',
                cursor: mode === 'draw' ? 'crosshair' : 'default',
                backgroundImage: `
                  linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)
                `,
                backgroundSize: `${m2px(1)}px ${m2px(1)}px`,
                userSelect: 'none',
              }}
            >
              {/* existing areas */}
              {areas.map(a => {
                const isOcc = a.isOccupied;
                const isSel = a.id === selectedAreaId;
                const c = isSel ? COLORS.selected : (isOcc ? COLORS.occupied : COLORS.free);
                const pw = m2px(parseFloat(a.width  || 5));
                const ph = m2px(parseFloat(a.length || 5));
                const px = m2px(parseFloat(a.positionX || 0));
                const py = m2px(parseFloat(a.positionY || 0));
                return (
                  <div
                    key={a.id}
                    onClick={() => mode === 'choose' && selectArea(a)}
                    style={{
                      position: 'absolute', left: px, top: py, width: pw, height: ph,
                      background: c.bg, border: `2px dashed ${c.border}`,
                      borderRadius: 4, boxSizing: 'border-box',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: isOcc ? 'not-allowed' : (mode === 'choose' ? 'pointer' : 'default'),
                      transition: 'background 0.15s',
                      overflow: 'hidden',
                    }}
                  >
                    {isOcc && (
                      <span style={{ fontSize: '1rem', marginBottom: 2, opacity: 0.7 }}>🔒</span>
                    )}
                    <span style={{ fontWeight: 800, color: c.text, fontSize: '0.72rem', textAlign: 'center', lineHeight: 1.2 }}>
                      {a.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: c.text, opacity: 0.8 }}>
                      {a.width}m×{a.length}m
                    </span>
                  </div>
                );
              })}

              {/* editable overlay for chosen existing zone */}
              {mode === 'choose' && editZone && (
                <div
                  onMouseDown={(e) => editMouseDown(e, 'move')}
                  style={{
                    position: 'absolute',
                    left: m2px(editZone.x), top: m2px(editZone.y),
                    width: m2px(editZone.w), height: m2px(editZone.l),
                    border: '2.5px solid #10b981',
                    borderRadius: 6, boxSizing: 'border-box',
                    background: 'rgba(167,243,208,0.5)',
                    cursor: 'move',
                    zIndex: 10,
                  }}
                >
                  {/* SE resize handle */}
                  <div
                    onMouseDown={(e) => editMouseDown(e, 'se')}
                    style={{
                      position: 'absolute', right: -6, bottom: -6,
                      width: 14, height: 14, background: '#10b981',
                      borderRadius: 3, cursor: 'se-resize', zIndex: 11,
                    }}
                  />
                  <span style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    fontSize: '0.68rem', fontWeight: 800, color: '#065f46',
                    whiteSpace: 'nowrap', pointerEvents: 'none',
                  }}>
                    {editZone.w}m×{editZone.l}m<br />
                    {toM3(editZone.w, editZone.l)} m³
                  </span>
                </div>
              )}

              {/* custom drawn zone */}
              {mode === 'draw' && customZone && (
                <div
                  style={{
                    position: 'absolute',
                    left: m2px(customZone.x), top: m2px(customZone.y),
                    width: m2px(customZone.w), height: m2px(customZone.l),
                    border: '2.5px solid #f59e0b', background: 'rgba(253,230,138,0.6)',
                    borderRadius: 6, boxSizing: 'border-box',
                    cursor: 'move', zIndex: 10,
                  }}
                >
                  {/* SE handle */}
                  <div style={{
                    position: 'absolute', right: -6, bottom: -6,
                    width: 14, height: 14, background: '#f59e0b',
                    borderRadius: 3, cursor: 'se-resize', zIndex: 11,
                  }} />
                  <span style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    fontSize: '0.68rem', fontWeight: 800, color: '#92400e',
                    whiteSpace: 'nowrap', pointerEvents: 'none',
                  }}>
                    {customZone.w}m×{customZone.l}m<br />
                    {toM3(customZone.w, customZone.l)} m³
                  </span>
                </div>
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { color: '#bfdbfe', border: '#3b82f6', label: 'Còn trống' },
                { color: '#fecaca', border: '#ef4444', label: 'Đang thuê' },
                { color: '#a7f3d0', border: '#10b981', label: 'Vùng bạn chọn' },
                { color: '#fde68a', border: '#f59e0b', label: 'Vùng tự vẽ' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 13, height: 13, borderRadius: 3, background: item.color, border: `1.5px solid ${item.border}` }} />
                  <span style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 600 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sidebar: info + confirm ── */}
          <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Thông tin vùng
              </div>
              {activeZone ? (
                <>
                  <Row label="Rộng"    value={`${activeZone.w} m`} />
                  <Row label="Dài"     value={`${activeZone.l} m`} />
                  <Row label="Chiều cao kho" value={`${whHeight.toFixed(1)} m`} />
                  <Row label="Thể tích" value={`${activeM3} m³`} />
                  <Row label="Vị trí X" value={`${activeZone.x} m`} />
                  <Row label="Vị trí Y" value={`${activeZone.y} m`} />
                  {mode === 'choose' && selectedExisting && (
                    <Row label="Dựa trên" value={selectedExisting.name} />
                  )}
                  <div style={{
                    marginTop: 10, padding: '8px 10px', borderRadius: 8,
                    background: activeM3 >= requestedM3 ? '#dcfce7' : '#fef9c3',
                    color: activeM3 >= requestedM3 ? '#166534' : '#854d0e',
                    fontSize: '0.78rem', fontWeight: 700,
                  }}>
                    {activeM3 >= requestedM3
                      ? '✓ Đủ thể tích yêu cầu'
                      : `⚠ Thể tích chọn: ${activeM3} m³ / cần ${requestedM3} m³`}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
                  {mode === 'draw' ? 'Kéo chuột trên bản đồ để vẽ.' : 'Bấm vào một khu còn trống.'}
                </p>
              )}
            </div>

            <button
              disabled={!activeZone}
              onClick={handleConfirm}
              style={{
                padding: '12px 0', borderRadius: 12, border: 'none',
                background: activeZone ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : '#e2e8f0',
                color: activeZone ? '#fff' : '#94a3b8',
                fontWeight: 700, fontSize: '0.92rem',
                cursor: activeZone ? 'pointer' : 'not-allowed',
                boxShadow: activeZone ? '0 4px 14px rgba(14,165,233,0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Xác nhận vị trí
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '10px 0', borderRadius: 12,
                border: '1.5px solid #e2e8f0', background: '#fff',
                color: '#64748b', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Huỷ bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* tiny helper row */
const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{label}</span>
    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{value}</span>
  </div>
);
