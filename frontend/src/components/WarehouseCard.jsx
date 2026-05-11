import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import favoritesService from "../services/favoritesService";

export const resolveImage = (url) => {
  if (!url) return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800";
  if (url.startsWith("http")) return url;
  return `http://localhost:5276${url}`;
};

export const StarDisplay = ({ rating, count }) => {
  if (!rating || rating === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-slate-300">★</span>
          ))}
        </div>
        <span>Chưa có đánh giá</span>
      </div>
    );
  }
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <span key={`f${i}`} className="text-amber-400">★</span>
        ))}
        {half && <span className="text-amber-400">½</span>}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e${i}`} className="text-slate-300">★</span>
        ))}
      </div>
      <span>
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
};

export default function WarehouseCard({ w }) {
  const [isFav, setIsFav] = useState(() => favoritesService.isFavorite(w.warehouseId));
  const [favAnim, setFavAnim] = useState(false);

  useEffect(() => {
    const handler = () => setIsFav(favoritesService.isFavorite(w.warehouseId));
    window.addEventListener("favoritesChanged", handler);
    return () => window.removeEventListener("favoritesChanged", handler);
  }, [w.warehouseId]);

  const handleToggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = favoritesService.toggleFavorite(w);
    setIsFav(added);
    setFavAnim(true);
    setTimeout(() => setFavAnim(false), 350);
  };

  const availability = w.availableArea > 0
    ? { label: "Còn trống", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : { label: "Đã kín", className: "bg-rose-50 text-rose-600 border-rose-200" };

  const operatingLabel = w.is24HoursAccess ? "24/7" : (w.operatingHours || "Linh hoạt");
  const rawPrice = w.pricePerM2;
  const pricePerM2 = rawPrice === null || rawPrice === undefined ? null : Number(rawPrice);
  const priceLabel = pricePerM2 != null && !Number.isNaN(pricePerM2)
    ? `${pricePerM2.toLocaleString("vi-VN")} đ/m²`
    : "Liên hệ / m²";

  return (
    <Link to={`/warehouse/${w.warehouseId}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card">
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={resolveImage(w.imageUrl)}
          alt={w.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800";
          }}
        />
        <button
          onClick={handleToggleFav}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/90 shadow-soft transition ${favAnim ? "scale-110" : ""}`}
          title={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        >
          <span
            className={`material-symbols-outlined text-[18px] ${isFav ? "text-rose-500" : "text-slate-400"}`}
            style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>
        {w.is24HoursAccess && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white">
            24/7
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 line-clamp-2">{w.name}</h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-1">{w.address}</p>
          <div className="mt-2 text-xs font-semibold text-cyan-700">
            {priceLabel}
          </div>
        </div>

        <StarDisplay rating={w.averageRating} count={w.ratingCount} />

        <div className="flex flex-wrap gap-2">
          {w.warehouseType && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {w.warehouseType}
            </span>
          )}
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${availability.className}`}>
            {availability.label}
          </span>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            {operatingLabel}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span>Diện tích tổng</span>
            <span className="font-semibold text-slate-800">
              {w.totalArea?.toLocaleString("vi-VN")} m²
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span>Còn trống</span>
            <span className="font-semibold text-cyan-700">
              {w.availableArea?.toLocaleString("vi-VN")} m²
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Giá thuê</div>
            <div className="text-sm font-semibold text-slate-900">
              {priceLabel}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition group-hover:bg-cyan-700">
            Xem chi tiết
          </span>
        </div>
      </div>
    </Link>
  );
}
