import React from "react";

export default function SelectedFilters({ filters = [] }) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
      {filters.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="text-cyan-700 transition hover:text-cyan-900"
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}
