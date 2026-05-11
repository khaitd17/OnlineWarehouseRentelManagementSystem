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
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-slate-200 text-[14px]">★</span>
          ))}
        </div>
        <span className="text-[11px]">Chưa có đánh giá</span>
      </div>
    );
  }
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600">
      <div className="flex items-center gap-0.5 text-[14px]">
        {Array.from({ length: full }).map((_, i) => (
          <span key={`f${i}`} className="text-amber-400">★</span>
        ))}
        {half && <span className="text-amber-400">½</span>}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e${i}`} className="text-slate-200">★</span>
        ))}
      </div>
      <span className="font-medium">
        {rating.toFixed(1)} <span className="text-slate-400 font-normal">({count})</span>
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

  const rawPrice = w.pricePerM2;
  const pricePerM2 = rawPrice === null || rawPrice === undefined ? null : Number(rawPrice);
  const priceLabel = pricePerM2 != null && !Number.isNaN(pricePerM2)
    ? `${pricePerM2.toLocaleString("vi-VN")} đ/m²`
    : "Liên hệ / m²";

  const hasArea = w.totalArea != null;

  return (
    <Link to={`/warehouse/${w.warehouseId}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={resolveImage(w.imageUrl)}
          alt={w.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800";
          }}
        />
        <button
          onClick={handleToggleFav}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 ${favAnim ? "scale-125" : ""}`}
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
          <span className="absolute left-3 top-3 rounded-md bg-slate-900/80 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
            24/7
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2">
          <h3 className="text-[15px] font-semibold leading-snug text-slate-900 line-clamp-2 transition-colors group-hover:text-cyan-700">{w.name}</h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-1">{w.address}</p>
        </div>

        <StarDisplay rating={w.averageRating} count={w.ratingCount} />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {w.warehouseType && (
            <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
              {w.warehouseType}
            </span>
          )}
          <span className={`rounded px-2 py-1 text-[11px] font-medium ${w.availableArea > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {w.availableArea > 0 ? "Còn trống" : "Đã kín"}
          </span>
          {!w.is24HoursAccess && w.operatingHours && (
            <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 line-clamp-1 max-w-[120px]">
              {w.operatingHours}
            </span>
          )}
        </div>

        {hasArea && (
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tổng diện tích</span>
              <span className="mt-0.5 font-semibold text-slate-700">{w.totalArea?.toLocaleString("vi-VN")} m²</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Còn trống</span>
              <span className={`mt-0.5 font-semibold ${w.availableArea > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {w.availableArea?.toLocaleString("vi-VN")} m²
              </span>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between border-t border-slate-100 pt-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Giá thuê</div>
              <div className={`mt-0.5 ${pricePerM2 != null ? "text-[15px] font-bold text-cyan-700" : "text-sm font-semibold text-slate-700"}`}>
                {priceLabel}
              </div>
            </div>
            <span className="inline-flex h-8 items-center justify-center rounded-lg bg-cyan-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-cyan-700">
              Xem chi tiết
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
