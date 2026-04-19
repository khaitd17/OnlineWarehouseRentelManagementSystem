import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import favoritesService from '../services/favoritesService';

export const resolveImage = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800';
  if (url.startsWith('http')) return url;
  return `http://localhost:5276${url}`;
};

export const StarDisplay = ({ rating, count, size = 14 }) => {
  if (!rating || rating === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ fontSize: size, color: '#d1d5db' }}>★</span>)}
      <span style={{ fontSize: size - 2, color: '#94a3b8', marginLeft: 2 }}>Chưa có đánh giá</span>
    </div>
  );
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: full  }).map((_, i) => <span key={`f${i}`} style={{ fontSize: size, color: '#f59e0b' }}>★</span>)}
      {half && <span style={{ fontSize: size, color: '#f59e0b' }}>½</span>}
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} style={{ fontSize: size, color: '#d1d5db' }}>★</span>)}
      <span style={{ fontSize: size - 2, color: '#64748b', marginLeft: 2 }}>
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
};

export default function WarehouseCard({ w }) {
  const [hovered, setHovered] = useState(false);
  const [isFav,   setIsFav]   = useState(() => favoritesService.isFavorite(w.warehouseId));
  const [favAnim, setFavAnim] = useState(false);

  useEffect(() => {
    const handler = () => setIsFav(favoritesService.isFavorite(w.warehouseId));
    window.addEventListener('favoritesChanged', handler);
    return () => window.removeEventListener('favoritesChanged', handler);
  }, [w.warehouseId]);

  const handleToggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = favoritesService.toggleFavorite(w);
    setIsFav(added);
    setFavAnim(true);
    setTimeout(() => setFavAnim(false), 400);
  };

  return (
    <Link
      to={`/warehouse/${w.warehouseId}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, overflow: 'hidden',
          boxShadow: hovered ? '0 16px 32px rgba(0,149,199,0.12)' : '0 2px 12px rgba(0,0,0,0.05)',
          border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column',
          transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
          transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', height: '100%'
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: 'relative', height: 180, flexShrink: 0 }}>
          <img
            src={resolveImage(w.imageUrl)}
            alt={w.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'; }}
          />
          <button
            onClick={handleToggleFav}
            title={isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            style={{
              position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: '50%',
              background: isFav ? '#fb7185' : 'rgba(255,255,255,0.95)',
              border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isFav ? '0 4px 12px rgba(251,113,133,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
              transform: favAnim ? 'scale(1.25)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s, box-shadow 0.2s',
              zIndex: 5,
            }}
          >
            <span 
              className="material-symbols-outlined" 
              style={{ 
                fontSize: 19, 
                color: isFav ? '#ffffff' : '#94a3b8', 
                fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0",
                transition: 'color 0.2s',
              }}
            >
              favorite
            </span>
          </button>
          {w.is24HoursAccess && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(4px)',
              color: '#fff', padding: '3px 8px', borderRadius: 20,
              fontSize: '0.68rem', fontWeight: 700,
            }}>
              24/7
            </div>
          )}
        </div>
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            margin: '0 0 5px', fontSize: '0.95rem', fontWeight: 700,
            color: '#0f172a', lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>{w.name}</h3>
          <p style={{
            margin: '0 0 6px', fontSize: '0.78rem', color: '#64748b',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          }}>
            {w.address}
          </p>
          <div style={{ marginBottom: 8 }}>
            <StarDisplay rating={w.averageRating} count={w.ratingCount} />
          </div>
          {w.pricePerM2 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
              border: '1px solid #6ee7b7',
              color: '#047857', fontSize: '0.8rem', fontWeight: 700,
              padding: '4px 10px', borderRadius: 20, marginBottom: 10,
            }}>
              <strong style={{ color: '#065f46', fontSize: '0.9rem' }}>
                {Number(w.pricePerM2).toLocaleString('vi-VN')} đ
              </strong>/m³/tháng
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 'auto',
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Tổng DT</div>
              <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.92rem' }}>
                {w.totalArea?.toLocaleString()} m³
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Còn trống</div>
              <div style={{ fontWeight: 800, color: '#0095c7', fontSize: '0.98rem' }}>
                {w.availableArea?.toLocaleString()} m³
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
