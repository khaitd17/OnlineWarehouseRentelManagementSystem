import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchWarehouses } from '../services/warehouseService';

/* ── 63 tỉnh thành Việt Nam ─────────────────────────────── */
const PROVINCES = [
  'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu',
  'Bắc Ninh','Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận',
  'Cà Mau','Cần Thơ','Cao Bằng','Đà Nẵng','Đắk Lắk','Đắk Nông',
  'Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam',
  'Hà Nội','Hà Tĩnh','Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình',
  'Hưng Yên','Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng',
  'Lạng Sơn','Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình',
  'Ninh Thuận','Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi',
  'Quảng Ninh','Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình',
  'Thái Nguyên','Thanh Hóa','Thừa Thiên Huế','Tiền Giang','TP. Hồ Chí Minh',
  'Trà Vinh','Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái',
];

const WAREHOUSE_TYPES = [
  { value: '',         label: 'Tất cả loại kho' },
  { value: 'lạnh',    label: 'Kho lạnh / mát' },
  { value: 'chung',   label: 'Kho chung' },
  { value: 'tự quản', label: 'Kho tự quản' },
  { value: 'xưởng',   label: 'Kho xưởng' },
  { value: 'ngoại quan', label: 'Kho ngoại quan' },
];

const AREA_OPTIONS = [
  { label: '< 50 m²',      min: 0,  max: 50   },
  { label: '< 100 m²',     min: 0,  max: 100  },
  { label: '< 500 m²',     min: 0,  max: 500  },
  { label: '< 1,000 m²',   min: 0,  max: 1000 },
];

const resolveImage = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800';
  if (url.startsWith('http')) return url;
  return `http://localhost:5276${url}`;
};

/* ── Main Component ─────────────────────────────────────── */
export default function SearchResultsPage() {
  const navigate = useNavigate();

  /* Filter state */
  const [province,      setProvince]      = useState('');
  const [warehouseType, setWarehouseType] = useState('');
  const [areaIdx,       setAreaIdx]       = useState(null);    // index into AREA_OPTIONS
  const [sortBy,        setSortBy]        = useState('newest');
  const [page,          setPage]          = useState(1);

  /* Data state */
  const [results,  setResults]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const PAGE_SIZE = 12;

  /* ── Fetch ──────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const areaFilter = areaIdx != null ? AREA_OPTIONS[areaIdx] : {};
      const data = await searchWarehouses({
        province,
        warehouseType,
        minArea: areaFilter.min ?? undefined,
        maxArea: areaFilter.max ?? undefined,
        sortBy,
        page,
        pageSize: PAGE_SIZE,
      });
      setResults(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [province, warehouseType, areaIdx, sortBy, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Handlers ───────────────────────────────────────────── */
  const handleApply = () => { setPage(1); fetchData(); };
  const handleReset = () => {
    setProvince('');
    setWarehouseType('');
    setAreaIdx(null);
    setSortBy('newest');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /* ── Styles ─────────────────────────────────────────────── */
  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', background: '#fff',
  };
  const labelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: 700,
    color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  return (
    <div style={{
      maxWidth: 1260, margin: '0 auto',
      padding: '2rem 1.5rem',
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* ══ FILTER SIDEBAR ══════════════════════════════════ */}
        <aside style={{ width: 280, flexShrink: 0 }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '24px 20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid #f1f5f9',
            position: 'sticky', top: 108,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                🔍 Bộ lọc
              </h3>
              <button onClick={handleReset} style={{
                background: 'none', border: 'none', color: '#0095c7',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0,
              }}>Xóa tất cả</button>
            </div>

            {/* Province dropdown */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>📍 Địa điểm (Tỉnh/Thành phố)</label>
              <select
                value={province}
                onChange={e => { setProvince(e.target.value); setPage(1); }}
                style={inputStyle}
              >
                <option value=''>-- Tất cả tỉnh thành --</option>
                {PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Warehouse type */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>🏭 Loại kho</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {WAREHOUSE_TYPES.map(t => (
                  <label key={t.value} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: '0.9rem', cursor: 'pointer',
                    color: warehouseType === t.value ? '#0095c7' : '#334155',
                    fontWeight: warehouseType === t.value ? 700 : 400,
                  }}>
                    <input
                      type='radio'
                      name='warehouseType'
                      checked={warehouseType === t.value}
                      onChange={() => { setWarehouseType(t.value); setPage(1); }}
                      style={{ accentColor: '#0095c7', width: 16, height: 16 }}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Area */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>📐 Diện tích (m²)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {AREA_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { setAreaIdx(areaIdx === i ? null : i); setPage(1); }}
                    style={{
                      padding: '8px 6px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                      border: areaIdx === i ? '2px solid #0095c7' : '1px solid #e2e8f0',
                      background: areaIdx === i ? '#e0f2fe' : '#fff',
                      color: areaIdx === i ? '#0369a1' : '#334155',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleApply}
              style={{
                width: '100%', padding: '12px', borderRadius: 10,
                background: 'linear-gradient(135deg,#0095c7,#0077a3)',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,149,199,0.3)',
              }}
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </aside>

        {/* ══ RESULTS AREA ════════════════════════════════════ */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                {loading ? 'Đang tìm...' : `${total.toLocaleString()} kết quả tìm kiếm`}
              </h2>
              {(province || warehouseType) && (
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  {[province, warehouseType ? WAREHOUSE_TYPES.find(t=>t.value===warehouseType)?.label : ''].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1); }}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', background: '#fff' }}
              >
                <option value='newest'>Mới nhất</option>
                <option value='area_asc'>Diện tích: Nhỏ → Lớn</option>
                <option value='area_desc'>Diện tích: Lớn → Nhỏ</option>
              </select>
            </div>
          </div>

          {/* Cards */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  background: '#f1f5f9', borderRadius: 16, height: 340,
                  animation: 'pulse 1.5s infinite',
                }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#ef4444' }}>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>{error}</p>
              <button onClick={fetchData} style={{ marginTop: 12, padding: '10px 24px', borderRadius: 8, background: '#0095c7', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Thử lại
              </button>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏗️</div>
              <h3 style={{ color: '#334155', fontWeight: 700, marginBottom: 8 }}>Không tìm thấy kho phù hợp</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Thử điều chỉnh bộ lọc để xem thêm kết quả.</p>
              <button onClick={handleReset} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, background: '#0095c7', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 20 }}>
              {results.map(w => (
                <Link
                  to={`/warehouse/${w.warehouseId}`}
                  key={w.warehouseId}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{
                      background: '#fff', borderRadius: 16, overflow: 'hidden',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                      border: '1px solid #f1f5f9',
                      display: 'flex', flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,149,199,0.12)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
                    }}
                  >
                    {/* Image */}
                    <div style={{ position: 'relative', height: 180, flexShrink: 0 }}>
                      <img
                        src={resolveImage(w.imageUrl)}
                        alt={w.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'; }}
                      />
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'rgba(0,149,199,0.9)', backdropFilter: 'blur(4px)',
                        color: '#fff', padding: '3px 10px', borderRadius: 20,
                        fontSize: '0.72rem', fontWeight: 700,
                      }}>
                        APPROVED
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{
                        margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700,
                        color: '#0f172a', lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>{w.name}</h3>

                      <p style={{
                        margin: '0 0 12px', fontSize: '0.8rem', color: '#64748b',
                        display: 'flex', alignItems: 'flex-start', gap: 4,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        <span style={{ flexShrink: 0 }}>📍</span>
                        {w.address}
                      </p>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 'auto',
                      }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Tổng DT</div>
                          <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>
                            {w.totalArea?.toLocaleString()} m²
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Còn trống</div>
                          <div style={{ fontWeight: 800, color: '#0095c7', fontSize: '1rem' }}>
                            {w.availableArea?.toLocaleString()} m²
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid #e2e8f0', background: '#fff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600,
                  color: page === 1 ? '#cbd5e1' : '#334155',
                }}
              >← Trước</button>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      border: page === p ? 'none' : '1px solid #e2e8f0',
                      background: page === p ? '#0095c7' : '#fff',
                      color: page === p ? '#fff' : '#334155',
                      fontWeight: 700, cursor: 'pointer',
                    }}
                  >{p}</button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid #e2e8f0', background: '#fff',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600,
                  color: page === totalPages ? '#cbd5e1' : '#334155',
                }}
              >Sau →</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
