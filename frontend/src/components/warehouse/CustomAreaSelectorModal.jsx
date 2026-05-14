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
 *  requestedM3    {number}  — diện tích người thuê cần
 *  onConfirm      {fn({ posX, posY, width, length, baseAreaId })}
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';

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
  isOwnerMode = false,
  initialZone = null,
}) {
  /* warehouse dimensions */
  const whW = parseFloat(warehouseData?.width  ?? warehouseData?.Width  ?? 0) || 20;
  const whL = parseFloat(warehouseData?.length ?? warehouseData?.Length ?? 0) || 30;
  const totalArea = parseFloat(warehouseData?.totalArea ?? warehouseData?.TotalArea ?? 0);
  // chiều cao kho = TotalArea(m²) / (Width × Length(m²)); fallback 4m
  const whHeight = (whW > 0 && whL > 0 && totalArea > 0)
    ? totalArea / (whW * whL)
    : 4;

  /* helper: zone footprint m² → m² */
  const toM3 = (w, l) => parseFloat((w * l * whHeight).toFixed(1));

  /* floor area (m²) needed to match requestedM3 exactly — works in both owner & renter mode */
  const neededM2 = (requestedM3 > 0 && whHeight > 0)
    ? requestedM3 / whHeight
    : null;

  /* auto-compute length so that w × l == neededM2 */
  const autoLength = (w) => neededM2 ? clamp(snap(neededM2 / w), MIN_ZONE_M, whL) : null;

  /* ── Unzoned area stats ─────────────────────────────────────── */
  const totalRentalM2 = areas.reduce((s, a) =>
    s + parseFloat(a.width || 0) * parseFloat(a.length || 0), 0);
  const unzonedM2 = Math.max(0, parseFloat((whW * whL - totalRentalM2).toFixed(1)));
  const freeRentalCount = areas.filter(a => !a.isOccupied).length;
  const unzonedM3 = parseFloat((unzonedM2 * whHeight).toFixed(1));

  /* canvas pixel size */
  const canvasW = m2px(whW);
  const canvasH = m2px(whL);

  /* mode: 'choose' | 'draw' */
  const [mode, setMode] = useState(() => {
    if (initialZone && !initialZone.baseAreaId) return 'draw';
    return 'choose';
  });

  /* selected existing zone (mode=choose) */
  const [selectedAreaId, setSelectedAreaId] = useState(initialZone?.baseAreaId || null);

  /* custom zone (mode=draw) – in metres */
  const [customZone, setCustomZone] = useState(() => {
    if (initialZone && !initialZone.baseAreaId) {
      return { x: initialZone.posX, y: initialZone.posY, w: initialZone.width, l: initialZone.length };
    }
    return null;
  });

  /* extension zone – the extra piece that makes up an L-shape (mode=draw only) */
  const [zoneExtension, setZoneExtension] = useState(() => {
    // Restore extension zone when modal is reopened (e.g. "Xem lại")
    const ez = initialZone?.extensionZone;
    if (ez) return { x: ez.posX, y: ez.posY, w: ez.width, l: ez.length };
    return null;
  });

  /* whenever the primary zone changes, clear any extension (user must re-run auto-adjust) */
  const clearExtension = () => setZoneExtension(null);

  /* ── Multi-zone: additional selected zones (Greedy Fill) ──── */
  const [selectedZones, setSelectedZones] = useState([]);
  const [autoSelectedAreaIds, setAutoSelectedAreaIds] = useState([]);


  /* Auto-switch to draw mode if no free rental areas */
  useEffect(() => {
    if (freeRentalCount === 0 && mode === 'choose') {
      setMode('draw');
    }
  }, [freeRentalCount]);


  /* drag/resize state */
  const dragRef  = useRef(null); // { type: 'move'|'se', startX, startY, startZone }
  const canvasRef = useRef(null);

  const selectedExisting = areas.find(a => a.id === selectedAreaId);

  /* ── derived area for the "chosen existing" zone (editable) ─── */
  // When user selects an existing zone we clone its dims (in metres) into state
  // so they can resize it to match requestedM3.
  const [editZone, setEditZone] = useState(() => {
    if (initialZone && initialZone.baseAreaId) {
      return { x: initialZone.posX, y: initialZone.posY, w: initialZone.width, l: initialZone.length };
    }
    return null;
  });

  const selectArea = (a) => {
    if (a.isOccupied) return;
    setSelectedAreaId(a.id);
    setCustomZone(null);
    setAutoSelectedAreaIds([]);
    setSelectedZones([]);
    const aW = parseFloat(a.width  || 5);
    const aL = parseFloat(a.length || 5);
    if (neededM2) {
      // Auto-size: keep area width, compute length to hit exactly requestedM3
      const targetL = clamp(snap(neededM2 / aW), MIN_ZONE_M, aL);
      setEditZone({
        x: parseFloat(a.positionX || 0),
        y: parseFloat(a.positionY || 0),
        w: aW,
        l: targetL,
      });
    } else {
      setEditZone({
        x: parseFloat(a.positionX || 0),
        y: parseFloat(a.positionY || 0),
        w: aW,
        l: aL,
      });
    }
    setMode('choose');
  };

  /* ── Cross-area overlap detection ─────────────────────────────── */
  // EPS: tolerance in metres — zones merely touching (sharing an edge) are NOT considered overlapping.
  // This prevents float/snap precision from falsely blocking a zone that sits flush against an occupied area.
  const OVERLAP_EPS = 0.05;

  const rectsOverlap = (ax, ay, aw, al, bx, by, bw, bl, eps = 0) =>
    ax + eps < bx + bw && ax + aw - eps > bx && ay + eps < by + bl && ay + al - eps > by;

  const getOverlappingFreeAreas = (zone, excludeId = null) => {
    if (!zone) return [];
    return areas.filter(a => {
      if (a.isOccupied) return false;
      if (a.id === excludeId) return false;
      return rectsOverlap(
        zone.x, zone.y, zone.w, zone.l,
        parseFloat(a.positionX || 0), parseFloat(a.positionY || 0),
        parseFloat(a.width || 0), parseFloat(a.length || 0)
      );
    });
  };

  /* Occupied areas that the custom drawn zone overlaps (must block).
   * In owner mode we use a tighter epsilon so that a zone flush against
   * an occupied boundary is NOT treated as a conflict. */
  const getOverlappingOccupiedAreas = (zone, eps = 0) => {
    if (!zone) return [];
    return areas.filter(a => {
      if (!a.isOccupied) return false;
      return rectsOverlap(
        zone.x, zone.y, zone.w, zone.l,
        parseFloat(a.positionX || 0), parseFloat(a.positionY || 0),
        parseFloat(a.width || 0), parseFloat(a.length || 0),
        eps
      );
    });
  };

  /* Quick helper: does zone overlap ANY occupied area? Strict (eps=0) — no tolerance. */
  const overlapsOccupied = (zone) => getOverlappingOccupiedAreas(zone, 0).length > 0;

  /* ── CANVAS CLICK handler for choose mode (click empty space) ── */
  const handleCanvasClick = (e) => {
    if (mode !== 'choose') return;
    // Only trigger if clicking directly on canvas background, not on a child area
    if (e.target !== canvasRef.current) return;
    if (!neededM2) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = px2m(e.clientX - rect.left);
    const clickY = px2m(e.clientY - rect.top);
    // Compute squarish zone: round W UP to next 0.5m so W×L >= neededM2 exactly
    const rawSide = Math.sqrt(neededM2);
    const snapUp = (m) => Math.ceil(m * 2) / 2;
    const zW = clamp(snapUp(rawSide), MIN_ZONE_M, whW);
    // Exact L so that zW × zL = neededM2 (no snap, 2-decimal precision)
    const zL = clamp(parseFloat((neededM2 / zW).toFixed(2)), MIN_ZONE_M, whL);
    const zx = clamp(snap(clickX - zW / 2), 0, whW - zW);
    const zy = clamp(snap(clickY - zL / 2), 0, whL - zL);
    setSelectedAreaId(null);
    setEditZone({ x: zx, y: zy, w: zW, l: zL });
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
    // Begin new draw — clear extension
    clearExtension();
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
        const candidate = {
          ...d.startZone,
          x: clamp(snap(d.startZone.x + px2m(dx)), 0, whW - d.startZone.w),
          y: clamp(snap(d.startZone.y + px2m(dy)), 0, whL - d.startZone.l),
        };
        // Block move if it would overlap an occupied area
        if (!overlapsOccupied(candidate)) { setCustomZone(candidate); clearExtension(); }
      } else if (d.type === 'se') {
        let newW = clamp(snap(d.startZone.w + px2m(dx)), MIN_ZONE_M, whW - d.startZone.x);
        let newL = clamp(snap(d.startZone.l + px2m(dy)), MIN_ZONE_M, whL - d.startZone.y);
        
        if (neededM2 && newW * newL > neededM2) {
          newL = clamp(snap(neededM2 / newW), MIN_ZONE_M, whL - d.startZone.y);
          if (newW * newL > neededM2) {
            newW = clamp(snap(neededM2 / newL), MIN_ZONE_M, whW - d.startZone.x);
          }
        }
        
        const candidate = { ...d.startZone, w: newW, l: newL };
        // Block resize if it would overlap an occupied area
        if (!overlapsOccupied(candidate)) { setCustomZone(candidate); clearExtension(); }
      }
      return;
    }

    if (!drawing || !drawStart) return;
    // Free draw: both width and height controlled by mouse drag
    const x0 = Math.min(drawStart.x, mx);
    const x1 = Math.max(drawStart.x, mx);
    const y0 = Math.min(drawStart.y, my);
    const y1 = Math.max(drawStart.y, my);

    let w = clamp(snap(px2m(x1 - x0)), MIN_ZONE_M, whW);
    let l = clamp(snap(px2m(y1 - y0)), MIN_ZONE_M, whL);

    if (neededM2 && w * l > neededM2) {
      l = clamp(snap(neededM2 / w), MIN_ZONE_M, whL);
      if (w * l > neededM2) {
        w = clamp(snap(neededM2 / l), MIN_ZONE_M, whW);
      }
    }

    const candidate = {
      x: clamp(snap(px2m(x0)), 0, whW),
      y: clamp(snap(px2m(y0)), 0, whL),
      w,
      l,
    };
    // Block free draw if it would overlap an occupied area
    if (!overlapsOccupied(candidate)) {
      setCustomZone(candidate);
    }
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
      const newW = clamp(snap(d.startZone.w + px2m(dx)), MIN_ZONE_M, whW - d.startZone.x);
      if (neededM2) {
        // Volume-locked: SE handle adjusts width, length auto-computes
        const newL = clamp(snap(neededM2 / newW), MIN_ZONE_M, whL - d.startZone.y);
        setEditZone(prev => ({ ...prev, w: newW, l: newL }));
      } else {
        const newL = clamp(snap(d.startZone.l + px2m(dy)), MIN_ZONE_M, whL - d.startZone.y);
        setEditZone(prev => ({ ...prev, w: newW, l: newL }));
      }
    }
  }, [whW, whL, isOwnerMode, neededM2]);

  const editMouseUp = useCallback(() => {
    editDragRef.current = null;
    window.removeEventListener('mousemove', editMouseMove);
    window.removeEventListener('mouseup',  editMouseUp);
  }, [editMouseMove]);

  /* ── Confirm ────────────────────────────────────────────────── */
  const activeZone = mode === 'choose' ? editZone : (mode === 'multi' ? null : customZone);
  const activeM3   = activeZone ? toM3(activeZone.w, activeZone.l) : 0;

  // Total multi-zone volume (carved zones + auto-selected existing areas)
  const multiZoneM3 = selectedZones.reduce((sum, z) => sum + toM3(z.w, z.l), 0);
  const autoSelectedM3 = areas
    .filter(a => autoSelectedAreaIds.includes(a.id))
    .reduce((sum, a) => sum + toM3(parseFloat(a.width || 0), parseFloat(a.length || 0)), 0);
  const totalSelectedM3 = activeM3 + multiZoneM3 + autoSelectedM3;

  // Free areas the zone overlaps (excluding the selected base area)
  const overlappingAreas = getOverlappingFreeAreas(
    activeZone,
    mode === 'choose' ? selectedAreaId : null
  );

  // Occupied areas the active zone overlaps — strict check (eps=0): any real penetration blocks confirm.
  // Check BOTH modes: 'draw' uses customZone, 'choose' uses editZone.
  const occupiedOverlaps = mode === 'draw'
    ? getOverlappingOccupiedAreas(customZone, 0)
    : getOverlappingOccupiedAreas(editZone, 0);
  const hasOccupiedConflict = occupiedOverlaps.length > 0;

  /* ── Auto-place: greedy fill multiple free areas ─────────── */
  const handleAutoPlaceMulti = () => {
    if (!requestedM3 || requestedM3 <= 0) return;
    let remaining = requestedM3;
    const pickedAreaIds = [];
    const carvedZones = [];

    // Step 1: Grab free predefined RentalAreas (sorted largest first)
    const freeAreas = areas
      .filter(a => !a.isOccupied)
      .map(a => ({
        id: a.id,
        x: parseFloat(a.positionX ?? a.PositionX ?? 0),
        y: parseFloat(a.positionY ?? a.PositionY ?? 0),
        w: parseFloat(a.width ?? a.Width ?? 0),
        l: parseFloat(a.length ?? a.Length ?? 0),
      }))
      .filter(a => a.w > 0 && a.l > 0)
      .sort((a, b) => (b.w * b.l) - (a.w * a.l));

    for (const fa of freeAreas) {
      if (remaining <= 0) break;
      const vol = toM3(fa.w, fa.l);
      pickedAreaIds.push(fa.id);
      remaining -= vol;
    }

    // Step 2: If still not enough, carve from unzoned space
    if (remaining > 0 && unzonedM2 > 0) {
      const neededFloorM2 = remaining / whHeight;
      const STEP = 0.5;
      const snapUp = (m) => Math.ceil(m * 2) / 2;
      const rawSide = Math.sqrt(neededFloorM2);

      const allOccupied = areas.map(a => ({
        x: parseFloat(a.positionX ?? a.PositionX ?? 0),
        y: parseFloat(a.positionY ?? a.PositionY ?? 0),
        w: parseFloat(a.width ?? a.Width ?? 0),
        l: parseFloat(a.length ?? a.Length ?? 0),
      }));
      const overlapsAny = (cand) => {
        for (const occ of allOccupied) {
          if (cand.x < occ.x + occ.w && cand.x + cand.w > occ.x &&
              cand.y < occ.y + occ.l && cand.y + cand.l > occ.y) return true;
        }
        for (const z of carvedZones) {
          if (cand.x < z.x + z.w && cand.x + cand.w > z.x &&
              cand.y < z.y + z.l && cand.y + cand.l > z.y) return true;
        }
        return false;
      };

      const wMin = clamp(snapUp(rawSide * 0.5), MIN_ZONE_M, whW);
      let found = null;
      for (let w = wMin; w <= whW + 0.01 && !found; w = parseFloat((w + STEP).toFixed(2))) {
        const lRaw = neededFloorM2 / w;
        const l = clamp(snapUp(lRaw), MIN_ZONE_M, whL);
        if (l > whL || w > whW) continue;
        if (w * l * whHeight < remaining * 0.99) continue;
        for (let y = 0; y <= whL - l + 0.01 && !found; y = parseFloat((y + STEP).toFixed(1))) {
          for (let x = 0; x <= whW - w + 0.01 && !found; x = parseFloat((x + STEP).toFixed(1))) {
            const cand = { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)), w, l };
            if (!overlapsAny(cand)) found = cand;
          }
        }
      }

      if (found) {
        carvedZones.push(found);
        remaining -= toM3(found.w, found.l);
      }
    }

    if (pickedAreaIds.length === 0 && carvedZones.length === 0) {
      alert('Không tìm thấy không gian trống phù hợp trong kho.');
      return;
    }

    // Set state
    setAutoSelectedAreaIds(pickedAreaIds);
    setMode('draw');
    setSelectedAreaId(null);
    setEditZone(null);
    clearExtension();

    if (carvedZones.length > 0) {
      setCustomZone(carvedZones[0]);
      setSelectedZones(carvedZones.slice(1));
    } else {
      setCustomZone(null);
      setSelectedZones([]);
    }
  };

  /* ── Single-zone auto-place (fallback) ──────────────────── */
  const handleAutoPlace = () => {
    if (!neededM2 || neededM2 <= 0) return;
    const STEP = 0.5;
    const snapUp = (m) => Math.ceil(m * 2) / 2;
    const rawSide = Math.sqrt(neededM2);
    const tryCandidates = (wStart, wEnd, wStep) => {
      for (let w = wStart; w <= wEnd + 0.01; w = parseFloat((w + wStep).toFixed(2))) {
        const lRaw = neededM2 / w;
        const l = clamp(snapUp(lRaw), MIN_ZONE_M, whL);
        if (l > whL || w > whW) continue;
        if (w * l * whHeight < requestedM3 * 0.99) continue;
        for (let y = 0; y <= whL - l + 0.01; y = parseFloat((y + STEP).toFixed(1))) {
          for (let x = 0; x <= whW - w + 0.01; x = parseFloat((x + STEP).toFixed(1))) {
            const cand = { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)), w, l };
            if (!overlapsOccupied(cand)) return cand;
          }
        }
      }
      return null;
    };
    const wMin = clamp(snapUp(rawSide * 0.5), MIN_ZONE_M, whW);
    const found = tryCandidates(wMin, whW, STEP);
    if (found) {
      setMode('draw');
      setCustomZone(found);
      setSelectedAreaId(null);
      setEditZone(null);
      clearExtension();
      setSelectedZones([]);
      setAutoSelectedAreaIds([]);
    } else {
      // Single block failed → try multi-zone
      handleAutoPlaceMulti();
    }
  };

  const handleConfirm = () => {
    const isMulti = selectedZones.length > 0 || autoSelectedAreaIds.length > 0;
    if (!activeZone && !isMulti) return;
    if (hasOccupiedConflict) return;

    // Build additionalZones: auto-selected areas + carved zones
    const allAdditionalZones = [];
    // Add auto-selected existing areas
    for (const aId of autoSelectedAreaIds) {
      const area = areas.find(a => a.id === aId);
      if (area) {
        allAdditionalZones.push({
          x: parseFloat(area.positionX || 0), y: parseFloat(area.positionY || 0),
          w: parseFloat(area.width || 0), l: parseFloat(area.length || 0),
          areaId: aId,
        });
      }
    }
    // Add carved zones
    for (const z of selectedZones) {
      allAdditionalZones.push({ x: z.x, y: z.y, w: z.w, l: z.l, areaId: null });
    }

    // If no activeZone but auto-selected areas exist, use first auto-selected as primary
    let primary = activeZone;
    let additionals = allAdditionalZones;
    if (!primary && allAdditionalZones.length > 0) {
      primary = allAdditionalZones[0];
      additionals = allAdditionalZones.slice(1);
    }

    onConfirm({
      posX              : primary?.x ?? 0,
      posY              : primary?.y ?? 0,
      width             : primary?.w ?? 0,
      length            : primary?.l ?? 0,
      baseAreaId        : mode === 'choose' ? selectedAreaId : (primary?.areaId ?? null),
      overlappingAreaIds: overlappingAreas.map(a => a.id),
      extensionZone: (mode === 'draw' && zoneExtension)
        ? { posX: zoneExtension.x, posY: zoneExtension.y, width: zoneExtension.w, length: zoneExtension.l }
        : null,
      additionalZones: additionals.length > 0 ? additionals : null,
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
              {isOwnerMode ? 'Chỉ định vị trí cho khách thuê' : 'Tự sắp xếp vị trí thuê'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
              {isOwnerMode ? 'Khách yêu cầu' : 'Bạn cần thuê'} <strong style={{ color: '#0ea5e9' }}>{requestedM3} m²</strong>.
              {totalSelectedM3 > 0 ? (
                <>
                  {' '}Vùng đang chọn:{' '}
                  <strong style={{ color: totalSelectedM3 >= requestedM3 * 0.9 ? '#10b981' : '#f59e0b' }}>
                    {(selectedZones.length > 0 || autoSelectedAreaIds.length > 0)
                      ? `Tổng ${totalSelectedM3.toFixed(1)} m²`
                      : `${activeZone.w}m × ${activeZone.l}m = ${activeM3} m²`}
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
        <div style={{ padding: '0.8rem 1.8rem 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { key: 'choose', label: 'Chọn khu có sẵn', disabled: freeRentalCount === 0 },
            { key: 'draw',   label: 'Vẽ khu tự do', badge: freeRentalCount === 0 ? 'Khuyến nghị' : null },
          ].map(tab => (
            <button
              key={tab.key}
              disabled={tab.disabled}
              onClick={() => { if (!tab.disabled) { setMode(tab.key); setSelectedAreaId(null); setEditZone(null); setCustomZone(null); setSelectedZones([]); }}}
              style={{
                padding: '7px 18px', borderRadius: 10, fontWeight: 700,
                fontSize: '0.85rem', cursor: tab.disabled ? 'not-allowed' : 'pointer', border: 'none',
                background: tab.disabled ? '#f1f5f9' : (mode === tab.key ? '#0ea5e9' : '#f1f5f9'),
                color: tab.disabled ? '#cbd5e1' : (mode === tab.key ? '#fff' : '#475569'),
                boxShadow: mode === tab.key && !tab.disabled ? '0 2px 8px rgba(14,165,233,0.3)' : 'none',
                transition: 'all 0.15s', position: 'relative',
                opacity: tab.disabled ? 0.6 : 1,
              }}
            >
              {tab.label}
              {tab.badge && <span style={{ marginLeft: 6, fontSize: '0.65rem', background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: 6, fontWeight: 800 }}>{tab.badge}</span>}
            </button>
          ))}
          {/* Auto-place button */}
          <button
            onClick={handleAutoPlace}
            style={{
              marginLeft: 'auto', padding: '7px 16px', borderRadius: 10, fontWeight: 700,
              fontSize: '0.82rem', cursor: 'pointer', border: 'none',
              background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff',
              boxShadow: '0 2px 10px rgba(139,92,246,0.35)', transition: 'all 0.15s',
            }}
          >
            Tự động đặt {requestedM3}m²
          </button>
        </div>
        {/* Unzoned area info bar */}
        {unzonedM2 > 0 && (
          <div style={{ padding: '0 1.8rem', marginTop: 6 }}>
            <div style={{ fontSize: '0.75rem', color: '#8b5cf6', background: '#f5f3ff', padding: '5px 12px', borderRadius: 8, fontWeight: 600, border: '1px solid #e9d5ff' }}>
              Diện tích chưa chia ô: {unzonedM2} m² ({unzonedM3} m²)
              {(selectedZones.length > 0 || autoSelectedAreaIds.length > 0) && <span style={{ marginLeft: 8, color: '#059669', fontWeight: 700 }}>| Tổng: {totalSelectedM3.toFixed(1)} m² ({autoSelectedAreaIds.length + (customZone ? 1 : 0) + selectedZones.length} vùng)</span>}
            </div>
          </div>
        )}

        {/* ── Body: canvas + sidebar ── */}
        <div style={{ display: 'flex', gap: 0, padding: '1rem 1.8rem 1.4rem', flex: 1 }}>

          {/* ── Scrollable canvas wrapper ── */}
          <div style={{ flex: 1, overflowX: 'auto', paddingRight: 16 }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 8px', fontWeight: 600 }}>
              Kho: {whW}m × {whL}m
            </p>

            {/* Canvas */}
            <div
              ref={canvasRef}
              onMouseDown={mode === 'draw' ? canvasMouseDown : undefined}
              onMouseMove={mode === 'draw' ? canvasMouseMove : undefined}
              onMouseUp={mode === 'draw' ? canvasMouseUp : undefined}
              onClick={mode === 'choose' ? handleCanvasClick : undefined}
              style={{
                position: 'relative',
                width: canvasW, height: canvasH,
                background: '#f0f7ff',
                border: '2.5px solid #3b82f6', borderRadius: 10,
                overflow: 'visible',
                cursor: mode === 'choose' ? 'crosshair' : (mode === 'draw' ? 'crosshair' : 'default'),
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
                const isOcc  = a.isOccupied;
                const isSel  = a.id === selectedAreaId;
                const isOver = !isSel && overlappingAreas.some(o => o.id === a.id);
                const isAutoSelected = autoSelectedAreaIds.includes(a.id);
                const c = isAutoSelected ? { bg: 'rgba(253,230,138,0.85)', border: '#f59e0b', text: '#92400e' }
                        : isSel  ? COLORS.selected
                        : isOver ? { bg: 'rgba(253,186,116,0.85)', border: '#f97316', text: '#9a3412' }
                        : isOcc  ? COLORS.occupied
                        :          COLORS.free;
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
                      background: (mode === 'draw' && isOcc) ? 'repeating-linear-gradient(45deg,rgba(254,202,202,0.9),rgba(254,202,202,0.9) 6px,rgba(254,226,226,0.6) 6px,rgba(254,226,226,0.6) 12px)' : c.bg,
                      border: `2px ${(mode === 'draw' && isOcc) ? 'solid' : 'dashed'} ${c.border}`,
                      borderRadius: 8, boxSizing: 'border-box',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: isOcc ? 'not-allowed' : (mode === 'choose' ? 'pointer' : 'default'),
                      transition: 'background 0.15s',
                      overflow: 'hidden',
                      zIndex: (mode === 'draw' && isOcc) ? 15 : undefined,
                    }}
                  >
                    {isOver && (
                      <span style={{ fontSize: '0.6rem', marginBottom: 2, opacity: 0.85, fontWeight: 700, color: c.text }}>SẼ BỊ CẮT</span>
                    )}
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
                    borderRadius: 8, boxSizing: 'border-box',
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
                      borderRadius: '50%', border: '2px solid #fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      cursor: 'se-resize', zIndex: 11,
                    }}
                  />
                  <span style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    fontSize: '0.68rem', fontWeight: 800, color: '#065f46',
                    whiteSpace: 'nowrap', pointerEvents: 'none',
                  }}>
                    {editZone.w}m×{editZone.l}m<br />
                    {toM3(editZone.w, editZone.l)} m²
                  </span>
                </div>
              )}

              {/* custom drawn zone — render as SVG L-shape if extension present & adjacent */}
              {mode === 'draw' && customZone && (() => {
                const p = {
                  x: m2px(customZone.x), y: m2px(customZone.y),
                  w: m2px(customZone.w), l: m2px(customZone.l),
                };
                const e = zoneExtension ? {
                  x: m2px(zoneExtension.x), y: m2px(zoneExtension.y),
                  w: m2px(zoneExtension.w), l: m2px(zoneExtension.l),
                } : null;

                // Detect adjacency direction (3px tolerance for rounding)
                const EPS = 3;
                let lPoints = null;
                if (e) {
                  // extension to the RIGHT of primary, within primary's height
                  if (Math.abs(e.x - (p.x + p.w)) < EPS && e.y >= p.y - EPS && e.y + e.l <= p.y + p.l + EPS)
                    lPoints = `${p.x},${p.y} ${p.x+p.w},${p.y} ${p.x+p.w},${e.y} ${e.x+e.w},${e.y} ${e.x+e.w},${e.y+e.l} ${p.x+p.w},${e.y+e.l} ${p.x+p.w},${p.y+p.l} ${p.x},${p.y+p.l}`;
                  // extension to the LEFT of primary
                  else if (Math.abs(e.x + e.w - p.x) < EPS && e.y >= p.y - EPS && e.y + e.l <= p.y + p.l + EPS)
                    lPoints = `${e.x},${e.y} ${p.x},${e.y} ${p.x},${p.y} ${p.x+p.w},${p.y} ${p.x+p.w},${p.y+p.l} ${p.x},${p.y+p.l} ${p.x},${e.y+e.l} ${e.x},${e.y+e.l}`;
                  // extension BELOW primary, within primary's width
                  else if (Math.abs(e.y - (p.y + p.l)) < EPS && e.x >= p.x - EPS && e.x + e.w <= p.x + p.w + EPS)
                    lPoints = `${p.x},${p.y} ${p.x+p.w},${p.y} ${p.x+p.w},${p.y+p.l} ${e.x+e.w},${p.y+p.l} ${e.x+e.w},${e.y+e.l} ${e.x},${e.y+e.l} ${e.x},${p.y+p.l} ${p.x},${p.y+p.l}`;
                  // extension ABOVE primary
                  else if (Math.abs(e.y + e.l - p.y) < EPS && e.x >= p.x - EPS && e.x + e.w <= p.x + p.w + EPS)
                    lPoints = `${e.x},${e.y} ${e.x+e.w},${e.y} ${e.x+e.w},${p.y} ${p.x+p.w},${p.y} ${p.x+p.w},${p.y+p.l} ${p.x},${p.y+p.l} ${p.x},${p.y} ${e.x},${e.y}`;
                }

                if (lPoints) {
                  // Draw as single SVG L-shape polygon
                  const totalM3 = parseFloat(((customZone.w * customZone.l + zoneExtension.w * zoneExtension.l) * whHeight).toFixed(1));
                  return (
                    <>
                      {/* Single seamless L-shape */}
                      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
                        <polygon points={lPoints} fill="rgba(253,230,138,0.75)" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
                      </svg>
                      {/* Invisible drag/resize div over primary zone */}
                      <div style={{ position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.l, background: 'transparent', cursor: 'move', zIndex: 11 }}>
                        <div style={{ 
                          position: 'absolute', right: -6, bottom: -6, 
                          width: 14, height: 14, background: '#f59e0b', 
                          borderRadius: '50%', border: '2px solid #fff', 
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)', 
                          cursor: 'se-resize', zIndex: 12 
                        }} />
                        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 'max-content', fontSize: '0.65rem', fontWeight: 800, color: '#92400e', whiteSpace: 'nowrap', pointerEvents: 'none', textAlign: 'center', lineHeight: 1.4, background: 'rgba(255,255,255,0.95)', padding: '4px 8px', borderRadius: 6, backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                          {customZone.w}m×{customZone.l}m<br />
                          <span style={{ color: '#166534' }}>Tổng: {totalM3} m²</span>
                        </div>
                      </div>
                      {/* Extension label */}
                      <div style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.l, zIndex: 11, pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'max-content', fontSize: '0.62rem', fontWeight: 800, color: '#92400e', whiteSpace: 'nowrap', pointerEvents: 'none', background: 'rgba(255,255,255,0.95)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                          +{zoneExtension.w}m×{zoneExtension.l}m
                        </div>
                      </div>
                    </>
                  );
                }

                // Not adjacent or no extension — render separate boxes
                return (
                  <>
                    <div style={{ position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.l, border: '2.5px solid #f59e0b', background: 'rgba(253,230,138,0.6)', borderRadius: 8, boxSizing: 'border-box', cursor: 'move', zIndex: 10 }}>
                      <div style={{ 
                        position: 'absolute', right: -6, bottom: -6, 
                        width: 14, height: 14, background: '#f59e0b', 
                        borderRadius: '50%', border: '2px solid #fff', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)', 
                        cursor: 'se-resize', zIndex: 11 
                      }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'max-content', fontSize: '0.68rem', fontWeight: 800, color: '#92400e', whiteSpace: 'nowrap', pointerEvents: 'none', textAlign: 'center', background: 'rgba(255,255,255,0.95)', padding: '4px 8px', borderRadius: 6, backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                        {customZone.w}m×{customZone.l}m<br />{toM3(customZone.w, customZone.l)} m²
                      </div>
                    </div>
                    {e && (
                      <div style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.l, border: '2.5px solid #f59e0b', background: 'rgba(253,230,138,0.6)', borderRadius: 6, boxSizing: 'border-box', zIndex: 10, pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'max-content', fontSize: '0.63rem', fontWeight: 800, color: '#92400e', whiteSpace: 'nowrap', pointerEvents: 'none', textAlign: 'center', background: 'rgba(255,255,255,0.95)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                          +{zoneExtension.w}m×{zoneExtension.l}m<br />+{toM3(zoneExtension.w, zoneExtension.l)} m²
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* ── Multi-zone: additional zones (same yellow style) ── */}
              {selectedZones.map((z, i) => (
                <div key={`mz-${i}`} style={{
                  position: 'absolute',
                  left: m2px(z.x), top: m2px(z.y),
                  width: m2px(z.w), height: m2px(z.l),
                  border: '2.5px solid #f59e0b',
                  background: 'rgba(253,230,138,0.6)',
                  borderRadius: 8, boxSizing: 'border-box',
                  zIndex: 10, pointerEvents: 'none',
                }}>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)', width: 'max-content',
                    fontSize: '0.65rem', fontWeight: 800, color: '#92400e',
                    whiteSpace: 'nowrap', textAlign: 'center',
                    background: 'rgba(255,255,255,0.95)', padding: '3px 7px',
                    borderRadius: 5, border: '1px solid rgba(245,158,11,0.3)',
                  }}>
                    {z.w}m×{z.l}m<br />{toM3(z.w, z.l)} m²
                  </div>
                </div>
              ))}

            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { color: '#bfdbfe', border: '#3b82f6', label: 'Còn trống' },
                { color: '#fecaca', border: '#ef4444', label: 'Đang thuê' },
                { color: '#a7f3d0', border: '#10b981', label: isOwnerMode ? 'Vùng chỉ định' : 'Vùng bạn chọn' },
                { color: '#fde68a', border: '#f59e0b', label: isOwnerMode ? 'Vùng vẽ mới' : 'Vùng tự vẽ' },
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
              {activeZone || selectedZones.length > 0 || autoSelectedAreaIds.length > 0 ? (
                <>
                  {(activeZone && selectedZones.length === 0 && autoSelectedAreaIds.length === 0) && (
                    <>
                      <Row label="Rộng"    value={`${activeZone.w} m`} />
                      <Row label="Dài"     value={`${activeZone.l} m`} />
                    </>
                  )}
                  <Row label="Chiều cao kho" value={`${whHeight.toFixed(1)} m`} />
                  {(() => {
                    // Total = primary + extension + carved zones + auto-selected areas
                    let totalM3 = activeM3;
                    if (mode === 'draw' && zoneExtension && customZone)
                      totalM3 = parseFloat(((customZone.w * customZone.l + zoneExtension.w * zoneExtension.l) * whHeight).toFixed(1));
                    totalM3 += multiZoneM3 + autoSelectedM3;
                    const isMet = totalM3 >= requestedM3;
                    const zoneCount = autoSelectedAreaIds.length + (activeZone ? 1 : 0) + selectedZones.length;
                    return (
                      <>
                        <Row label="diện tích" value={<span style={{ color: isMet ? '#16a34a' : '#d97706', fontWeight: 700 }}>{totalM3.toFixed(1)} m²</span>} />
                        {zoneCount > 1 && (
                          <Row label="Số vùng" value={`${zoneCount} vùng`} />
                        )}
                        {mode === 'choose' && selectedExisting && (
                          <Row label="Dựa trên" value={selectedExisting.name} />
                        )}
                        <div style={{
                          marginTop: 10, padding: '8px 10px', borderRadius: 8,
                          background: isMet ? '#dcfce7' : '#fef9c3',
                          color: isMet ? '#166534' : '#854d0e',
                          fontSize: '0.78rem', fontWeight: 700,
                        }}>
                          {isMet
                            ? `Đủ diện tích: ${totalM3.toFixed(1)} m² / ${requestedM3} m²`
                            : `diện tích chọn: ${totalM3.toFixed(1)} m² / yêu cầu ${requestedM3} m²`}
                        </div>
                      </>
                    );
                  })()}
                  {mode === 'draw' && !hasOccupiedConflict && activeM3 < requestedM3 && !zoneExtension && neededM2 && customZone && (
                    <button
                      onClick={() => {
                        const ceilM2 = (v) => Math.ceil(v * 100) / 100;
                        const primaryM2 = customZone.w * customZone.l;

                        // Strategy 1: extend L (keep W, same position)
                        const exactL = ceilM2(neededM2 / customZone.w);
                        const clampedL = clamp(exactL, MIN_ZONE_M, whL - customZone.y);
                        const candidateL = { ...customZone, l: clampedL };
                        const volL = parseFloat((candidateL.w * candidateL.l * whHeight).toFixed(1));
                        if (volL >= requestedM3 && !overlapsOccupied(candidateL)) {
                          setCustomZone(candidateL); clearExtension(); return;
                        }

                        // Strategy 2: extend W (keep L, same position)
                        const exactW = ceilM2(neededM2 / customZone.l);
                        const clampedW = clamp(exactW, MIN_ZONE_M, whW - customZone.x);
                        const candidateW = { ...customZone, w: clampedW };
                        const volW = parseFloat((candidateW.w * candidateW.l * whHeight).toFixed(1));
                        if (volW >= requestedM3 && !overlapsOccupied(candidateW)) {
                          setCustomZone(candidateW); clearExtension(); return;
                        }

                        // Strategy 3: keep primary zone as-is, find extension piece for remaining m²
                        const remainingM2 = ceilM2(neededM2 - primaryM2);
                        if (remainingM2 <= 0) return;
                        const STEP = 0.5;
                        // "isPrimaryOrOccupied" — candidate must not overlap primary zone OR occupied areas
                        const overlapsEither = (cand) => {
                          if (overlapsOccupied(cand)) return true;
                          // overlap with primary zone?
                          const ax = cand.x, ay = cand.y, aw = cand.w, al = cand.l;
                          const bx = customZone.x, by = customZone.y, bw = customZone.w, bl = customZone.l;
                          return ax < bx + bw && ax + aw > bx && ay < by + bl && ay + al > by;
                        };
                        for (let w = whW; w >= MIN_ZONE_M; w = parseFloat((w - STEP).toFixed(1))) {
                          const l = ceilM2(remainingM2 / w);
                          if (l > whL) continue;
                          for (let y = 0; y <= whL - l + 0.01; y = parseFloat((y + STEP).toFixed(1))) {
                            for (let x = 0; x <= whW - w + 0.01; x = parseFloat((x + STEP).toFixed(1))) {
                              const cand = { x, y, w, l };
                              if (!overlapsEither(cand)) {
                                setZoneExtension(cand); return;
                              }
                            }
                          }
                        }
                      }}
                      style={{
                        marginTop: 6, width: '100%',
                        padding: '7px 10px', borderRadius: 8, border: 'none',
                        background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                        color: '#fff', fontWeight: 700, fontSize: '0.78rem',
                        cursor: 'pointer', transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity='1'}
                    >
                      Tự động căn chỉnh đạt {requestedM3} m²
                    </button>
                  )}
                  {/* Show combined volume when extension is active */}
                  {mode === 'draw' && zoneExtension && customZone && (
                    <div style={{
                      marginTop: 6, padding: '6px 10px', borderRadius: 8,
                      background: '#ecfdf5', border: '1.5px solid #86efac',
                      fontSize: '0.75rem', color: '#166534', fontWeight: 700,
                    }}>
                      ✓ Tổng diện tích (L-shape): {parseFloat(((customZone.w * customZone.l + zoneExtension.w * zoneExtension.l) * whHeight).toFixed(1))} m²
                    </div>
                  )}

                  {/* Occupied area conflict — hard block */}
                  {hasOccupiedConflict && (
                    <div style={{
                      marginTop: 8, padding: '8px 10px', borderRadius: 8,
                      background: '#fef2f2', border: '1.5px solid #fca5a5',
                      fontSize: '0.75rem', color: '#b91c1c',
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>🚫 Đang chồng khu đã thuê:</div>
                      {occupiedOverlaps.map(a => (
                        <div key={a.id} style={{ fontWeight: 600 }}>• {a.name}</div>
                      ))}
                      <div style={{ marginTop: 4, fontStyle: 'italic' }}>
                        Vui lòng vẽ lại trong vùng chưa có ai thuê.
                      </div>
                    </div>
                  )}
                  {/* Cross free-area overlap warning */}
                  {!hasOccupiedConflict && overlappingAreas.length > 0 && (
                    <div style={{
                      marginTop: 8, padding: '8px 10px', borderRadius: 8,
                      background: '#fff7ed', border: '1px solid #fed7aa',
                      fontSize: '0.75rem', color: '#9a3412',
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>✂ Lấn sang khu khác:</div>
                      {overlappingAreas.map(a => (
                        <div key={a.id} style={{ fontWeight: 600 }}>• {a.name} ({a.size ?? (a.width * a.length)} m²)</div>
                      ))}
                      <div style={{ marginTop: 4, color: '#c2410c', fontStyle: 'italic' }}>
                        Khu bị lấn sẽ được cắt nhỏ khi xác nhận.
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
                  {mode === 'draw'
                    ? (isOwnerMode ? 'Kéo ngang để định chiều rộng — chiều dài tự tính.' : 'Kéo chuột trên bản đồ để vẽ.')
                    : 'Bấm vào một khu còn trống.'}
                </p>
              )}
            </div>

            <button
              disabled={(!activeZone && selectedZones.length === 0) || hasOccupiedConflict}
              onClick={handleConfirm}
              style={{
                padding: '12px 0', borderRadius: 12, border: 'none',
                background: ((!activeZone && selectedZones.length === 0) || hasOccupiedConflict) ? '#e2e8f0' : 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                color: ((!activeZone && selectedZones.length === 0) || hasOccupiedConflict) ? '#94a3b8' : '#fff',
                fontWeight: 700, fontSize: '0.92rem',
                cursor: ((!activeZone && selectedZones.length === 0) || hasOccupiedConflict) ? 'not-allowed' : 'pointer',
                boxShadow: ((!activeZone && selectedZones.length === 0) || hasOccupiedConflict) ? 'none' : '0 4px 14px rgba(14,165,233,0.4)',
                transition: 'all 0.2s',
              }}
            >
              {(selectedZones.length > 0 || autoSelectedAreaIds.length > 0) ? `Xác nhận vị trí (${totalSelectedM3.toFixed(1)} m²)` : 'Xác nhận vị trí'}
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

