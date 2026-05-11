/**
 * polygonUtils.js
 * Utilities for warehouse polygon boundary
 */

export const CELL_SIZE = 0.5; // meters per grid cell for legacy compatibility

// ── Area & Normalization ──────────────────────────────────────────────────

/**
 * Shoelace formula: polygon area in pixel² (always positive)
 * @param {{x:number,y:number}[]} points
 */
export function shoelaceArea(points) {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += (points[j].x + points[i].x) * (points[j].y - points[i].y);
  }
  return Math.abs(area / 2);
}

/**
 * Convert freehand pixel polygon → snapped grid coordinates.
 *
 * Algorithm:
 *   1. Compute polygon area in pixels (shoelace)
 *   2. Derive scale: metersPerPixel = sqrt(totalAreaM2 / pixelArea)
 *   3. Translate so bounding-box top-left = (0,0)
 *   4. Snap each vertex to nearest 0.5m grid cell
 *
 * @param {{x:number,y:number}[]} pixelPoints — raw draw coords
 * @param {number} totalAreaM2 — warehouse TotalArea in m²
 * @returns {{gx:number,gy:number}[]|null}
 */
export function normalizeToGrid(pixelPoints, totalAreaM2) {
  if (!pixelPoints || pixelPoints.length < 3 || !totalAreaM2) return null;
  const pixelArea = shoelaceArea(pixelPoints);
  if (pixelArea <= 0) return null;

  const metersPerPixel = Math.sqrt(totalAreaM2 / pixelArea);
  const minX = Math.min(...pixelPoints.map(p => p.x));
  const minY = Math.min(...pixelPoints.map(p => p.y));

  return pixelPoints.map(p => ({
    gx: Math.round((p.x - minX) * metersPerPixel / CELL_SIZE),
    gy: Math.round((p.y - minY) * metersPerPixel / CELL_SIZE),
  }));
}

// ── Dimensions ─────────────────────────────────────────────────────────────

/**
 * Get grid bounding box dimensions from normalized polygon (legacy format).
 * Returns {0,0} for new percentage-based format.
 * @param {Array} gridPoints
 * @returns {{cols:number, rows:number}}
 */
export function getGridDimensions(gridPoints) {
  if (!gridPoints || gridPoints.length === 0) return { cols: 0, rows: 0 };
  const hasGx = gridPoints.some(p => p.gx !== undefined);
  if (!hasGx) return { cols: 0, rows: 0 }; // Cannot derive absolute size from percentages
  const maxGx = Math.max(...gridPoints.map(p => p.gx || 0));
  const maxGy = Math.max(...gridPoints.map(p => p.gy || 0));
  return { cols: maxGx + 1, rows: maxGy + 1 };
}

// ── SVG Rendering ─────────────────────────────────────────────────────────

/**
 * Build SVG path for evenodd mask: outer rect - polygon boundary.
 * Cells OUTSIDE polygon are filled; cells INSIDE are transparent.
 *
 * @param {Array} poly   — polygon points (can be {gx, gy} or {px, py})
 * @param {number} cw, ch   — canvas width/height in pixels
 * @param {number} cellPx   — pixels per grid cell (for legacy gx, gy)
 */
export function buildMaskPath(poly, cw, ch, cellPx) {
  if (!poly || poly.length < 3) return '';
  const outer = `M 0,0 L ${cw},0 L ${cw},${ch} L 0,${ch} Z`;
  const inner = poly
    .map((p, i) => {
      const x = p.px !== undefined ? p.px * cw : (p.gx || 0) * cellPx;
      const y = p.py !== undefined ? p.py * ch : (p.gy || 0) * cellPx;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    })
    .join(' ') + ' Z';
  return `${outer} ${inner}`;
}

/**
 * Build SVG polygon points string for outline rendering.
 * @param {Array} poly
 * @param {number} cw, ch   — canvas width/height in pixels
 * @param {number} cellPx — pixels per grid cell (for legacy gx, gy)
 */
export function buildPolygonPoints(poly, cw, ch, cellPx) {
  if (!poly) return '';
  return poly.map(p => {
    const x = p.px !== undefined ? p.px * cw : (p.gx || 0) * cellPx;
    const y = p.py !== undefined ? p.py * ch : (p.gy || 0) * cellPx;
    return `${x},${y}`;
  }).join(' ');
}

// ── Storage ───────────────────────────────────────────────────────────────

/** Parse BoundaryPoints JSON string → array of points | null */
export function parseBoundary(json) {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
    return null;
  } catch {
    return null;
  }
}

