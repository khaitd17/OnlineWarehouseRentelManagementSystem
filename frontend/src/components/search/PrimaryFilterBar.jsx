import React from "react";

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
  const updateRange = (current, index, value, min, max, onChange) => {
    const parsed = value === "" ? "" : Number(value);
    const next = [...current];
    next[index] = parsed === "" || Number.isNaN(parsed) ? "" : parsed;
    const safeMin = next[0] === "" ? min : Math.max(min, Math.min(max, next[0]));
    const safeMax = next[1] === "" ? max : Math.max(min, Math.min(max, next[1]));
    const normalized = [safeMin, safeMax];
    if (normalized[0] > normalized[1]) normalized[1] = normalized[0];
    onChange(normalized);
  };

  return (
    <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <div className="xl:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Khu vực
            </label>
            <div className="mt-2 flex gap-2">
              <input
                list="province-list"
                value={province}
                onChange={(e) => onProvinceChange?.(e.target.value)}
                placeholder="Tỉnh / TP"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              />
              <input
                value={district}
                onChange={(e) => onDistrictChange?.(e.target.value)}
                placeholder="Quận / Huyện"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              />
              <datalist id="province-list">
                {provinces.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Diện tích (m²)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                min={0}
                max={areaMax}
                step={1}
                value={areaRange[0] === 0 ? "" : areaRange[0]}
                onChange={(e) => updateRange(areaRange, 0, e.target.value, 0, areaMax, onAreaRangeChange)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Từ"
              />
              <input
                type="number"
                min={0}
                max={areaMax}
                step={1}
                value={areaRange[1] === areaMax ? "" : areaRange[1]}
                onChange={(e) => updateRange(areaRange, 1, e.target.value, areaRange[0], areaMax, onAreaRangeChange)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Đến"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Giá thuê (đ/m²)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                min={0}
                max={priceMax}
                step={1000}
                value={priceRange[0] === 0 ? "" : priceRange[0]}
                onChange={(e) => updateRange(priceRange, 0, e.target.value, 0, priceMax, onPriceRangeChange)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Từ"
              />
              <input
                type="number"
                min={0}
                max={priceMax}
                step={1000}
                value={priceRange[1] === priceMax ? "" : priceRange[1]}
                onChange={(e) => updateRange(priceRange, 1, e.target.value, priceRange[0], priceMax, onPriceRangeChange)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Đến"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Loại kho
            </label>
            <select
              value={warehouseType}
              onChange={(e) => onWarehouseTypeChange?.(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            >
              {warehouseTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trạng thái kho
            </label>
            <select
              value={status}
              onChange={(e) => onStatusChange?.(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 xl:col-span-1">
            <button
              type="button"
              onClick={onOpenAdvanced}
              className="mt-6 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Bộ lọc nâng cao
            </button>
            <button
              type="button"
              onClick={onReset}
              className="h-10 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800"
            >
              Reset ({activeCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
