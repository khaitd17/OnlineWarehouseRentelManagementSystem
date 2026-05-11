import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const resolveImage = (url) => {
  if (!url) return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400";
  return url.startsWith("http") ? url : `http://localhost:5276${url}`;
};

export default function SearchMapPanel({ warehouses }) {
  const mapped = useMemo(
    () => warehouses.filter((w) => w.lat != null && w.lng != null),
    [warehouses]
  );
  const [selectedId, setSelectedId] = useState(mapped[0]?.warehouseId ?? null);

  useEffect(() => {
    if (!mapped.find((w) => w.warehouseId === selectedId)) {
      setSelectedId(mapped[0]?.warehouseId ?? null);
    }
  }, [mapped, selectedId]);

  const selected = mapped.find((w) => w.warehouseId === selectedId) || mapped[0] || null;
  const iframeSrc = selected
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${selected.lat},${selected.lng}`)}&z=14&output=embed`
    : null;

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Bản đồ kho bãi</div>
          <div className="text-xs text-slate-500">Sync theo danh sách kho đang hiển thị</div>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {mapped.length}/{warehouses.length} kho có tọa độ
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full relative">
        {iframeSrc ? (
          <iframe
            title="Warehouse Map"
            src={iframeSrc}
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-50 text-slate-500">
            <div className="text-3xl">🗺️</div>
            <div className="text-sm font-semibold">Chưa có tọa độ bản đồ</div>
          </div>
        )}
      </div>

      {selected && (
        <div className="shrink-0 flex flex-col border-t border-slate-200 bg-white">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <img
                src={resolveImage(selected.imageUrl)}
                alt={selected.name}
                className="h-14 w-16 rounded-xl object-cover"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900 line-clamp-1">{selected.name}</div>
                <div className="text-xs text-slate-500 line-clamp-1">{selected.address}</div>
                <div className="mt-1 text-xs font-semibold text-cyan-600">
                  {(selected.availableArea || 0).toLocaleString("vi-VN")} m² trống
                </div>
              </div>
              <Link
                to={`/warehouse/${selected.warehouseId}`}
                className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-cyan-700"
              >
                Xem chi tiết
              </Link>
            </div>
          </div>

          {mapped.length > 1 && (
            <div className="max-h-[220px] overflow-y-auto border-t border-slate-100 p-4 space-y-2">
              {mapped.slice(0, 10).map((w) => (
                <button
                  key={w.warehouseId}
                  onClick={() => setSelectedId(w.warehouseId)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                    selectedId === w.warehouseId
                      ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <img
                    src={resolveImage(w.imageUrl)}
                    alt={w.name}
                    className="h-10 w-12 shrink-0 rounded-lg object-cover"
                  />
                  <span className="line-clamp-2">{w.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
