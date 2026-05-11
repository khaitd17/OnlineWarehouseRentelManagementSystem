import React, { useState, useRef, useEffect } from "react";
import { MapPin, Maximize2, Banknote, Warehouse, CircleDot, SlidersHorizontal, RotateCcw, ChevronDown, X, Search } from "lucide-react";

/* ─── Dropdown wrapper: click-to-open popover ─── */
const FilterDropdown = ({ icon: Icon, iconColor, label, value, active, children, width = 320 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          group flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium
          transition-all duration-200 whitespace-nowrap
          ${active
            ? "border-cyan-400/60 bg-cyan-50 text-cyan-800 shadow-sm shadow-cyan-100"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm"
          }
        `}
      >
        {Icon && <Icon className={`h-4 w-4 flex-shrink-0 ${active ? iconColor : "text-slate-400 group-hover:text-slate-500"}`} />}
        <span className="max-w-[140px] truncate">{value || label}</span>
        <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${active ? "text-cyan-500" : "text-slate-400"}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-2"
          style={{ width, minWidth: 240 }}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
};

/* ─── Range input pair ─── */
const RangeInputPair = ({ min, max, step, value, onChange, fromLabel = "Từ", toLabel = "Đến", suffix = "" }) => {
  const updateRange = (index, raw) => {
    const parsed = raw === "" ? "" : Number(raw);
    const next = [...value];
    next[index] = parsed === "" || Number.isNaN(parsed) ? "" : parsed;
    const safeMin = next[0] === "" ? min : Math.max(min, Math.min(max, next[0]));
    const safeMax = next[1] === "" ? max : Math.max(min, Math.min(max, next[1]));
    const normalized = [safeMin, safeMax];
    if (normalized[0] > normalized[1]) normalized[1] = normalized[0];
    onChange(normalized);
  };
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value[0] === min ? "" : value[0]}
          onChange={(e) => updateRange(0, e.target.value)}
          placeholder={fromLabel}
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-8 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100 placeholder:text-slate-400"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] text-slate-400 pointer-events-none">{suffix}</span>}
      </div>
      <span className="text-slate-300 text-xs font-medium">—</span>
      <div className="relative flex-1">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value[1] === max ? "" : value[1]}
          onChange={(e) => updateRange(1, e.target.value)}
          placeholder={toLabel}
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-8 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100 placeholder:text-slate-400"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] text-slate-400 pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
};

/* ─── Quick preset chips ─── */
const PresetChip = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150
      ${active
        ? "border-cyan-500 bg-cyan-50 text-cyan-700"
        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }
    `}
  >
    {label}
  </button>
);

/* ─── Main Component ─── */
export default function PrimaryFilterBar({
  provinces = [],
  province,
  district,
  onProvinceChange,
  onDistrictChange,
  areaRange,
  onAreaRangeChange,
  areaMax = 100000,
  priceRange,
  onPriceRangeChange,
  priceMax = 50000000,
  warehouseType,
  warehouseTypes = [],
  onWarehouseTypeChange,
  status,
  statusOptions = [],
  onStatusChange,
  onOpenAdvanced,
  onReset,
  activeCount = 0,
}) {
  const locationActive = !!(province || district);
  const locationDisplay = [province, district].filter(Boolean).join(", ");
  const areaActive = areaRange[0] !== 0 || areaRange[1] !== areaMax;
  const priceActive = priceRange[0] !== 0 || priceRange[1] !== priceMax;
  const typeActive = !!warehouseType;
  const statusActive = status !== "all";

  const typeLabel = warehouseTypes.find((t) => t.value === warehouseType)?.label || "Loại kho";
  const statusLabel = statusOptions.find((s) => s.value === status)?.label || "Trạng thái";

  const formatArea = () => {
    if (!areaActive) return null;
    const from = areaRange[0] > 0 ? `${areaRange[0].toLocaleString("vi-VN")}` : "";
    const to = areaRange[1] < areaMax ? `${areaRange[1].toLocaleString("vi-VN")}` : "";
    if (from && to) return `${from} – ${to} m²`;
    if (from) return `≥ ${from} m²`;
    if (to) return `≤ ${to} m²`;
    return null;
  };

  const formatPrice = () => {
    if (!priceActive) return null;
    const fmt = (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}tr` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`;
    const from = priceRange[0] > 0 ? fmt(priceRange[0]) : "";
    const to = priceRange[1] < priceMax ? fmt(priceRange[1]) : "";
    if (from && to) return `${from} – ${to} đ`;
    if (from) return `≥ ${from} đ`;
    if (to) return `≤ ${to} đ`;
    return null;
  };

  // Area presets
  const AREA_PRESETS = [
    { label: "< 100 m²", range: [0, 100] },
    { label: "100 – 500 m²", range: [100, 500] },
    { label: "500 – 1.000 m²", range: [500, 1000] },
    { label: "1.000 – 5.000 m²", range: [1000, 5000] },
    { label: "> 5.000 m²", range: [5000, areaMax] },
  ];

  const PRICE_PRESETS = [
    { label: "< 50k", range: [0, 50000] },
    { label: "50k – 100k", range: [50000, 100000] },
    { label: "100k – 200k", range: [100000, 200000] },
    { label: "> 200k", range: [200000, priceMax] },
  ];

  return (
    <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 py-3">

        {/* Filter pill row */}
        <div className="flex flex-wrap items-center gap-2">

          {/* ── Location ── */}
          <FilterDropdown
            icon={MapPin}
            iconColor="text-cyan-600"
            label="Khu vực"
            value={locationDisplay}
            active={locationActive}
            width={360}
          >
            {(close) => (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Chọn khu vực</div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    list="province-list-filter"
                    value={province}
                    onChange={(e) => onProvinceChange?.(e.target.value)}
                    placeholder="Tìm tỉnh / thành phố..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100 placeholder:text-slate-400"
                  />
                  <datalist id="province-list-filter">
                    {provinces.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                <input
                  value={district}
                  onChange={(e) => onDistrictChange?.(e.target.value)}
                  placeholder="Quận / Huyện (tùy chọn)"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100 placeholder:text-slate-400"
                />
                {locationActive && (
                  <button
                    type="button"
                    onClick={() => { onProvinceChange(""); onDistrictChange(""); close(); }}
                    className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600"
                  >
                    <X className="h-3 w-3" /> Xóa khu vực
                  </button>
                )}
              </div>
            )}
          </FilterDropdown>

          {/* ── Area ── */}
          <FilterDropdown
            icon={Maximize2}
            iconColor="text-indigo-500"
            label="Diện tích"
            value={formatArea()}
            active={areaActive}
            width={340}
          >
            {(close) => (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Diện tích (m²)</div>
                <RangeInputPair min={0} max={areaMax} step={1} value={areaRange} onChange={onAreaRangeChange} suffix="m²" />
                <div className="flex flex-wrap gap-1.5">
                  {AREA_PRESETS.map((p) => (
                    <PresetChip
                      key={p.label}
                      label={p.label}
                      active={areaRange[0] === p.range[0] && areaRange[1] === p.range[1]}
                      onClick={() => { onAreaRangeChange(p.range); }}
                    />
                  ))}
                </div>
                {areaActive && (
                  <button
                    type="button"
                    onClick={() => { onAreaRangeChange([0, areaMax]); close(); }}
                    className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600"
                  >
                    <X className="h-3 w-3" /> Xóa bộ lọc diện tích
                  </button>
                )}
              </div>
            )}
          </FilterDropdown>

          {/* ── Price ── */}
          <FilterDropdown
            icon={Banknote}
            iconColor="text-emerald-500"
            label="Giá thuê"
            value={formatPrice()}
            active={priceActive}
            width={340}
          >
            {(close) => (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Giá thuê (đ/m²/tháng)</div>
                <RangeInputPair min={0} max={priceMax} step={1000} value={priceRange} onChange={onPriceRangeChange} suffix="đ" />
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_PRESETS.map((p) => (
                    <PresetChip
                      key={p.label}
                      label={p.label}
                      active={priceRange[0] === p.range[0] && priceRange[1] === p.range[1]}
                      onClick={() => { onPriceRangeChange(p.range); }}
                    />
                  ))}
                </div>
                {priceActive && (
                  <button
                    type="button"
                    onClick={() => { onPriceRangeChange([0, priceMax]); close(); }}
                    className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600"
                  >
                    <X className="h-3 w-3" /> Xóa bộ lọc giá
                  </button>
                )}
              </div>
            )}
          </FilterDropdown>

          {/* ── Warehouse type ── */}
          <FilterDropdown
            icon={Warehouse}
            iconColor="text-amber-500"
            label="Loại kho"
            value={typeActive ? typeLabel : null}
            active={typeActive}
            width={260}
          >
            {(close) => (
              <div className="space-y-1">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Loại kho</div>
                {warehouseTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { onWarehouseTypeChange(t.value); close(); }}
                    className={`
                      flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-all
                      ${warehouseType === t.value
                        ? "bg-cyan-50 text-cyan-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    {warehouseType === t.value && <CircleDot className="h-4 w-4 text-cyan-500 flex-shrink-0" />}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </FilterDropdown>

          {/* ── Status ── */}
          <FilterDropdown
            icon={CircleDot}
            iconColor="text-blue-500"
            label="Trạng thái"
            value={statusActive ? statusLabel : null}
            active={statusActive}
            width={220}
          >
            {(close) => (
              <div className="space-y-1">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</div>
                {statusOptions.map((opt) => {
                  const dotColor = opt.value === "available" ? "bg-emerald-400" : opt.value === "full" ? "bg-rose-400" : "bg-slate-300";
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onStatusChange(opt.value); close(); }}
                      className={`
                        flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-all
                        ${status === opt.value
                          ? "bg-cyan-50 text-cyan-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                        }
                      `}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </FilterDropdown>

          {/* ── Divider ── */}
          <div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />

          {/* ── Advanced filters ── */}
          <button
            type="button"
            onClick={onOpenAdvanced}
            className="group flex h-10 items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.97]"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-600" />
            Nâng cao
          </button>

          {/* ── Reset ── */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="group flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.97]"
            >
              <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:-rotate-180 duration-300" />
              Xóa lọc
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5 text-[0.65rem]">
                {activeCount}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
