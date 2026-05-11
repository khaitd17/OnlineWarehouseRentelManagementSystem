import React from "react";
import { X } from "lucide-react";

export default function SelectedFilters({ filters = [] }) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
      <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate-400 mr-1">
        Đang lọc:
      </span>
      {filters.map((chip) => (
        <span
          key={chip.id}
          className="group inline-flex items-center gap-1.5 rounded-full border border-cyan-200/60 bg-gradient-to-r from-cyan-50 to-sky-50 px-3 py-1 text-xs font-semibold text-cyan-700 transition-all hover:border-cyan-300 hover:shadow-sm"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="flex h-4 w-4 items-center justify-center rounded-full text-cyan-500 transition-all hover:bg-cyan-200/50 hover:text-cyan-800"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
