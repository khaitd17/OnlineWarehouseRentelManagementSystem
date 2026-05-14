import React from "react";

const FACILITY_OPTIONS = [
  { value: "container", label: "Xe container vào được" },
  { value: "camera", label: "Camera giám sát" },
  { value: "fire", label: "PCCC đạt chuẩn" },
  { value: "dock", label: "Loading dock" },
  { value: "forklift", label: "Xe nâng" },
  { value: "power", label: "Điện 3 pha" },
  { value: "security", label: "Bảo vệ 24/7" },
  { value: "office", label: "Văn phòng đi kèm" },
];

const LOCATION_OPTIONS = [
  { value: "port", label: "Gần cảng" },
  { value: "airport", label: "Gần sân bay" },
  { value: "highway", label: "Gần cao tốc" },
  { value: "industrial", label: "Gần KCN" },
];

const RENTAL_OPTIONS = [
  { value: "short", label: "Ngắn hạn" },
  { value: "long", label: "Dài hạn" },
  { value: "monthly", label: "Theo tháng" },
  { value: "yearly", label: "Theo năm" },
];

const RATING_OPTIONS = [
  { value: 3, label: "Từ 3 sao" },
  { value: 4, label: "Từ 4 sao" },
  { value: 4.5, label: "Từ 4.5 sao" },
];

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {title}
    </div>
    {children}
  </div>
);

export default function AdvancedFilterDrawer({
  open,
  onClose,
  filters,
  areaRange,
  onAreaRangeChange,
  areaMax = 100000,
  priceRange,
  onPriceRangeChange,
  priceMax = 50000000,
  onFiltersChange,
  onReset,
  onApply,
}) {
  if (!open) return null;

  const toggleList = (list, value) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

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
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 sm:items-start sm:p-8">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-6 shadow-card sm:mt-8 sm:rounded-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Đóng
        </button>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Bộ lọc nâng cao</h3>
            <p className="text-sm text-slate-500">
              Tối ưu kết quả bằng các tiêu chí chi tiết hơn.
            </p>
          </div>

          <Section title="Hạ tầng hỗ trợ">
            <div className="grid gap-2 sm:grid-cols-2">
              {FACILITY_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.facilities.includes(opt.value)}
                    onChange={() =>
                      onFiltersChange({
                        facilities: toggleList(filters.facilities, opt.value),
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Vị trí giao thông">
            <div className="grid gap-2 sm:grid-cols-2">
              {LOCATION_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.locationTags.includes(opt.value)}
                    onChange={() =>
                      onFiltersChange({
                        locationTags: toggleList(filters.locationTags, opt.value),
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Section>
          
          <Section title="Đánh giá tối thiểu">
            <div className="grid gap-3 sm:grid-cols-3">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      minRating: filters.minRating === opt.value ? null : opt.value,
                    })
                  }
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    filters.minRating === opt.value
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onReset}
            className="h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Đặt lại
          </button>
          <button
            type="button"
            onClick={onApply}
            className="h-11 rounded-lg bg-cyan-600 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-cyan-700"
          >
            Áp dụng bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
}
