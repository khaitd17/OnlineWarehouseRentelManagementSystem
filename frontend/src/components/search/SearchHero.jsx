import React from "react";

export default function SearchHero({ value, onChange, onSubmit, chips = [] }) {
  return (
    <section className="relative overflow-hidden bg-slate-900 text-white">
      <div className="absolute inset-0">
        <div className="absolute -top-32 left-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100">
            OWRMS Warehouse Search
          </div>
          <p className="mt-4 text-sm text-slate-200 sm:text-base">
            Lọc thông minh theo khu vực, diện tích, giá thuê và tiện ích. Xem danh sách
            & bản đồ song song để ra quyết định nhanh hơn.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
          className="mt-8 flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-card backdrop-blur sm:flex-row sm:items-center"
        >
          <div className="flex-1">
            <label className="sr-only">Tìm kho</label>
            <input
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="Tìm kho theo khu vực, quận, thành phố..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>
          <button
            type="submit"
            className="h-12 rounded-xl bg-cyan-600 px-6 text-sm font-semibold text-white shadow-soft transition hover:bg-cyan-700"
          >
            Tìm kiếm
          </button>
        </form>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onClick}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/20"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
