import React, { useMemo } from 'react';

const DISPLAY = 500;

function isPointInPolygon(point, vs) {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];
        let intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export default function InteractiveGridMap({ 
    boundaryPoints, 
    gatePosition,
    totalArea, 
    gridLocations = [], 
    onCellClick,
    outboundWarnings = [], // array of { assetId, itemName, quantityToRemove }
    selectedItem = null, // item being putaway
    editMode = false,
    isAssigning = false,
    selectedQuantity = 0,
    pendingAssignments = [], // array of {x, y, quantity}
    hideAxis = false
}) {
    const poly = useMemo(() => {
        if (!boundaryPoints) return null;
        try {
            const arr = typeof boundaryPoints === 'string' ? JSON.parse(boundaryPoints) : boundaryPoints;
            if (!Array.isArray(arr) || arr.length < 3) return null;
            return arr;
        } catch { return null; }
    }, [boundaryPoints]);

    const gatePos = useMemo(() => {
        if (!gatePosition) return null;
        try {
            return typeof gatePosition === 'string' ? JSON.parse(gatePosition) : gatePosition;
        } catch { return null; }
    }, [gatePosition]);

    const isGrid = poly && poly[0].gx !== undefined;

    const extents = useMemo(() => {
        if (!isGrid) return { minX: 0, minY: 0, maxX: 0, maxY: 0, spanX: 1, spanY: 1 };
        const xs = poly.map(p => p.gx);
        const ys = poly.map(p => p.gy);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        return { minX, minY, maxX, maxY, spanX: maxX - minX || 1, spanY: maxY - minY || 1 };
    }, [poly, isGrid]);

    // Tính toán các ô grid hợp lệ
    const validCells = useMemo(() => {
        if (!isGrid) return [];
        const cells = [];
        const vs = poly.map(p => [p.gx, p.gy]);
        const { minX, minY, maxX, maxY } = extents;
        for (let x = Math.floor(minX); x < Math.ceil(maxX); x++) {
            for (let y = Math.floor(minY); y < Math.ceil(maxY); y++) {
                // Check if center of cell is inside polygon
                if (isPointInPolygon([x + 0.5, y + 0.5], vs)) {
                    cells.push({ gx: x, gy: y });
                }
            }
        }
        return cells;
    }, [poly, isGrid, extents]);

    // Group items by cell
    const cellMap = useMemo(() => {
        if (!isGrid) return {};
        const map = {};
        gridLocations.forEach(loc => {
            if (!loc.coordinates || !Array.isArray(loc.coordinates)) return;
            loc.coordinates.forEach((coord, idx) => {
                const key = `${coord.x},${coord.y}`;
                if (!map[key]) map[key] = { items: [], totalQuantity: 0, hasWarning: false, isPrimary: false };
                map[key].items.push(loc);
                
                // Only sum the quantity on the first cell of the coordinates array
                if (idx === 0) {
                    map[key].totalQuantity += loc.quantity;
                    map[key].isPrimary = true;
                }
                
                // Check warning
                if (outboundWarnings.some(w => 
                    (w.assetId && w.assetId === loc.assetId) || 
                    (!w.assetId && w.itemName === loc.itemName)
                )) {
                    map[key].hasWarning = true;
                }
            });
        });
        return map;
    }, [gridLocations, outboundWarnings, isGrid]);

    if (!poly) {
        return (
            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
                <p style={{ color: '#94a3b8', fontWeight: 600 }}>Chưa có sơ đồ kho</p>
            </div>
        );
    }

    if (!isGrid) {
        return (
            <div style={{ background: '#fffbeb', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '2px dashed #fcd34d' }}>
                <p style={{ color: '#d97706', fontWeight: 600 }}>Bản đồ không hỗ trợ tính năng chia ô (không phải tọa độ chuẩn mới).</p>
            </div>
        );
    }

    const { minX, minY, spanX, spanY } = extents;

    const pad = 20;
    const scaleX = (DISPLAY - pad * 2) / spanX;
    const scaleY = (DISPLAY - pad * 2) / spanY;
    const scale = Math.min(scaleX, scaleY);
    const cw = Math.round(spanX * scale + pad * 2);
    const ch = Math.round(spanY * scale + pad * 2);

    const toSVG = (gx, gy) => ({
        x: (gx - minX) * scale + pad,
        y: (gy - minY) * scale + pad,
    });

    const svgPoints = poly.map(p => { const s = toSVG(p.gx, p.gy); return `${s.x},${s.y}`; }).join(' ');
    const maskOuter = `M 0,0 L ${cw},0 L ${cw},${ch} L 0,${ch} Z`;
    const maskInner = poly.map((p, i) => {
        const s = toSVG(p.gx, p.gy);
        return `${i === 0 ? 'M' : 'L'} ${s.x},${s.y}`;
    }).join(' ') + ' Z';

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                <svg width={cw} height={ch} style={{ display: 'block', border: '2px solid #e2e8f0', borderRadius: '12px', background: '#fff' }}>
                    <rect width={cw} height={ch} fill="#f8fafc" />
                    
                    {/* Vẽ lưới */}
                    <defs>
                        <pattern id="floorGridWFPV" x={pad} y={pad} width={scale} height={scale} patternUnits="userSpaceOnUse">
                            <rect width={scale} height={scale} fill="none" stroke="#f1f5f9" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width={cw} height={ch} fill="url(#floorGridWFPV)" />

                    {/* Vẽ trục tọa độ (Axes) */}
                    {/* Trục X ngang phía trên */}
                    {!hideAxis && Array.from({ length: spanX }).map((_, i) => {
                        const x = minX + i;
                        if (x % 5 !== 0 && i !== 0 && i !== spanX - 1) return null;
                        const s = toSVG(x, minY);
                        return (
                            <text key={`ax-${x}`} x={s.x + scale/2} y={pad - 6} fontSize={10} fill="#64748b" textAnchor="middle" fontWeight={600}>
                                {x}
                            </text>
                        );
                    })}
                    {/* Trục Y dọc bên trái */}
                    {!hideAxis && Array.from({ length: spanY }).map((_, i) => {
                        const y = minY + i;
                        if (y % 5 !== 0 && i !== 0 && i !== spanY - 1) return null;
                        const s = toSVG(minX, y);
                        return (
                            <text key={`ay-${y}`} x={pad - 6} y={s.y + scale/2} fontSize={10} fill="#64748b" textAnchor="end" alignmentBaseline="middle" fontWeight={600}>
                                {y}
                            </text>
                        );
                    })}

                    {/* Vùng sàn */}
                    <polygon points={svgPoints} fill="rgba(14,165,233,0.05)" stroke="none" />

                    {/* Mask */}
                    <path fillRule="evenodd" fill="rgba(100,116,139,0.25)" d={`${maskOuter} ${maskInner}`} />
                    <polygon points={svgPoints} fill="none" stroke="#0095c7" strokeWidth={2} strokeDasharray="5 3" />

                    {/* Render Grid Cells */}
                    {validCells.map(cell => {
                        const s = toSVG(cell.gx, cell.gy);
                        const key = `${cell.gx},${cell.gy}`;
                        const data = cellMap[key];
                        
                        const isPending = pendingAssignments && pendingAssignments.some(p => p.x === cell.gx && p.y === cell.gy);
                        const pendingData = pendingAssignments?.find(p => p.x === cell.gx && p.y === cell.gy);
                        
                        let fill = "transparent";
                        let stroke = "transparent";
                        
                        if (isPending) {
                            fill = "rgba(59,130,246,0.3)"; // Blue pending
                            stroke = "#3b82f6";
                        } else if (data) {
                            if (data.hasWarning) {
                                fill = "rgba(239,68,68,0.3)"; // Red warning
                                stroke = "#ef4444";
                            } else {
                                fill = "rgba(16,185,129,0.3)"; // Green occupied
                                stroke = "#10b981";
                            }
                        }

                        return (
                            <g key={key} 
                               onClick={() => onCellClick && onCellClick(cell.gx, cell.gy, data?.items || [])}
                               style={{ cursor: onCellClick ? 'pointer' : 'default' }}>
                                <rect 
                                    x={s.x} y={s.y} 
                                    width={scale} height={scale} 
                                    fill={fill} stroke={stroke} strokeWidth={isPending ? 2.5 : 1.5}
                                    style={{ transition: 'all 0.2s' }}
                                    onMouseEnter={e => {
                                        if (!data && !isPending) {
                                            e.target.style.fill = 'rgba(59,130,246,0.1)';
                                            e.target.style.stroke = '#3b82f6';
                                        } else {
                                            e.target.style.fillOpacity = 0.6;
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        e.target.style.fill = '';
                                        e.target.style.stroke = '';
                                        e.target.style.opacity = '1';
                                    }}
                                />
                                


                                {/* Số lượng (Hàng đã có hoặc Đang chờ phân bổ) */}
                                {((data && data.isPrimary && data.totalQuantity > 0) || (isPending && pendingData === pendingAssignments[0])) && (
                                    <text 
                                        x={s.x + scale/2} y={s.y + scale/2 + 4} 
                                        fontSize={Math.max(10, Math.min(16, scale * 0.4))} 
                                        fill={isPending ? "#1e3a8a" : "#fff"} 
                                        textAnchor="middle" fontWeight="bold" 
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {isPending ? `+${pendingData.quantity}` : data.totalQuantity}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                    
                    {/* Gate */}
                    {gatePos && (gatePos.gx !== undefined || gatePos.px !== undefined) && (
                        <foreignObject 
                            x={(gatePos.gx !== undefined ? toSVG(gatePos.gx, gatePos.gy).x : gatePos.px * cw) - 60} 
                            y={(gatePos.gy !== undefined ? toSVG(gatePos.gx, gatePos.gy).y : gatePos.py * ch) - 20} 
                            width={120} height={40}
                            style={{ overflow: 'visible', pointerEvents: 'none' }}
                        >
                            <div style={{
                                width: '100%', height: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transform: `rotate(${gatePos.angle || 0}deg)`,
                                transformOrigin: 'center center'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                                    color: '#fff',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 4px 10px rgba(245,158,11,0.4)',
                                    border: '1.5px solid #fff',
                                    whiteSpace: 'nowrap'
                                }}>
                                    CỔNG CHÍNH VÀO KHO
                                </div>
                            </div>
                        </foreignObject>
                    )}
                </svg>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginRight: 4 }}>
                    📐 Mỗi ô = 0.5m × 0.5m
                </span>
                {hideAxis ? (
                    // Legend for Renters (View-only)
                    [
                        ['transparent', '1px dashed #3b82f6', 'Ô trống (có thể thuê)'],
                        ['rgba(16,185,129,0.3)', '1px solid #10b981', 'Đã được thuê'],
                    ].map(([bg, border, label]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, background: bg, border, borderRadius: 3 }} />
                            <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{label}</span>
                        </div>
                    ))
                ) : (
                    // Legend for Owners/Staff
                    [
                        ['transparent', '1px dashed #3b82f6', 'Ô trống'],
                        ['rgba(59,130,246,0.3)', '1px solid #3b82f6', 'Đang chọn gán'],
                        ['rgba(16,185,129,0.3)', '1px solid #10b981', 'Có hàng hóa'],
                        ['rgba(239,68,68,0.3)', '1px solid #ef4444', 'Hàng cần xuất (Warning)'],
                    ].map(([bg, border, label]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, background: bg, border, borderRadius: 3 }} />
                            <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{label}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
