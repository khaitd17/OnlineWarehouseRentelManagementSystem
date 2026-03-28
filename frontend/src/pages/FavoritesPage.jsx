import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import favoritesService from '../services/favoritesService';

const resolveImage = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800';
  if (url.startsWith('http')) return url;
  return `http://localhost:5276${url}`;
};

const StarRow = ({ rating, count }) => {
  if (!rating) return (
    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chưa có đánh giá</span>
  );
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: full }).map((_, i) => <span key={`f${i}`} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>)}
      {half && <span style={{ color: '#f59e0b', fontSize: 14 }}>½</span>}
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} style={{ color: '#d1d5db', fontSize: 14 }}>★</span>)}
      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 3 }}>{rating.toFixed(1)} ({count} đánh giá)</span>
    </div>
  );
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [confirmRemove, setConfirmRemove] = useState(null); // warehouseId đang confirm

  const load = () => setFavorites(favoritesService.getFavorites());

  useEffect(() => {
    load();
    window.addEventListener('favoritesChanged', load);
    return () => window.removeEventListener('favoritesChanged', load);
  }, []);

  const handleRemove = (id) => {
    favoritesService.removeFavorite(id);
    setConfirmRemove(null);
  };

  const handleClearAll = () => {
    favorites.forEach(w => favoritesService.removeFavorite(w.warehouseId));
  };

  return (
    <div style={{
      padding: '32px 36px', fontFamily: "'Inter','Segoe UI',sans-serif",
      background: '#f8fafc', minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg,#fda4af,#fb7185)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem',
            }}>❤️</span>
            Kho yêu thích
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            {favorites.length > 0
              ? `Bạn đang lưu ${favorites.length} kho trong danh sách yêu thích`
              : 'Chưa có kho nào được lưu'}
          </p>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1.5px solid #fca5a5',
              background: '#fff', color: '#ef4444', fontWeight: 600,
              fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            🗑️ Xóa tất cả
          </button>
        )}
      </div>

      {/* Empty state */}
      {favorites.length === 0 && (
        <div style={{
          background: '#fff', borderRadius: 20, padding: '64px 24px',
          textAlign: 'center', border: '2px dashed #e2e8f0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏗️</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
            Danh sách yêu thích trống
          </h3>
          <p style={{ color: '#94a3b8', maxWidth: 340, margin: '0 auto 24px', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Hãy nhấn vào biểu tượng ❤️ trên các card kho để lưu vào đây và so sánh sau.
          </p>
          <Link
            to="/search"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg,#0095c7,#0077a3)',
              color: '#fff', padding: '12px 28px', borderRadius: 10,
              textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(0,149,199,0.3)',
            }}
          >
            🔍 Tìm kiếm kho
          </Link>
        </div>
      )}

      {/* Grid */}
      {favorites.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {favorites.map(w => (
            <FavoriteCard
              key={w.warehouseId}
              w={w}
              onRemove={() => setConfirmRemove(w.warehouseId)}
            />
          ))}
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setConfirmRemove(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, padding: '28px 32px',
              maxWidth: 380, width: '90%', textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💔</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Bỏ khỏi yêu thích?
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 24 }}>
              Kho này sẽ bị xóa khỏi danh sách yêu thích của bạn.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmRemove(null)}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontWeight: 600,
                  fontSize: '0.88rem', cursor: 'pointer',
                }}
              >Hủy</button>
              <button
                onClick={() => handleRemove(confirmRemove)}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                  color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                }}
              >Xóa khỏi yêu thích</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FavoriteCard({ w, onRemove }) {
  const [hovered, setHovered] = useState(false);
  const savedDate = w.savedAt ? new Date(w.savedAt).toLocaleDateString('vi-VN') : '';

  return (
    <div
      style={{
        background: '#fff', borderRadius: 16,
        boxShadow: hovered ? '0 12px 32px rgba(0,149,199,0.12)' : '0 2px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9', overflow: 'hidden',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 190, flexShrink: 0 }}>
        <img
          src={resolveImage(w.imageUrl)}
          alt={w.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'; }}
        />
        {/* Remove button */}
        <button
          onClick={onRemove}
          title="Bỏ yêu thích"
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', transition: 'transform 0.15s, background 0.15s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          ❤️
        </button>
        {/* 24/7 badge */}
        {w.is24HoursAccess && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(4px)',
            color: '#fff', padding: '3px 8px', borderRadius: 20,
            fontSize: '0.68rem', fontWeight: 700,
          }}>⏰ 24/7</div>
        )}
        {/* Saved date */}
        <div style={{
          position: 'absolute', bottom: 8, left: 10,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          color: '#fff', padding: '2px 8px', borderRadius: 20,
          fontSize: '0.68rem',
        }}>📅 Lưu {savedDate}</div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a',
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          lineHeight: 1.4,
        }}>{w.name}</h3>

        <p style={{
          margin: '0 0 8px', color: '#64748b', fontSize: '0.78rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>📍 {w.address}</p>

        <div style={{ marginBottom: 8 }}>
          <StarRow rating={w.averageRating} count={w.ratingCount} />
        </div>

        {w.pricePerM2 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
            border: '1px solid #6ee7b7', color: '#047857',
            fontSize: '0.8rem', fontWeight: 700,
            padding: '4px 10px', borderRadius: 20, marginBottom: 10,
          }}>
            💰 <strong style={{ color: '#065f46', fontSize: '0.9rem' }}>
              {Number(w.pricePerM2).toLocaleString('vi-VN')} đ
            </strong>/m²/tháng
          </div>
        )}

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 'auto',
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Tổng DT</div>
            <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>{w.totalArea?.toLocaleString()} m²</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Còn trống</div>
            <div style={{ fontWeight: 800, color: '#0095c7', fontSize: '0.95rem' }}>{w.availableArea?.toLocaleString()} m²</div>
          </div>
        </div>

        <Link
          to={`/warehouse/${w.warehouseId}`}
          style={{
            marginTop: 12, display: 'block', textAlign: 'center',
            background: 'linear-gradient(135deg,#0095c7,#0077a3)',
            color: '#fff', padding: '9px 0', borderRadius: 8,
            textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem',
            boxShadow: '0 3px 10px rgba(0,149,199,0.25)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Xem chi tiết →
        </Link>
      </div>
    </div>
  );
}
