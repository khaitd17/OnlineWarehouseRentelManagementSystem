import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchWarehouses } from '../services/warehouseService';
import favoritesService from '../services/favoritesService';

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
  { value: '',           label: 'Tất cả loại kho' },
  { value: 'lạnh',       label: '❄️ Kho lạnh / mát' },
  { value: 'chung',      label: '📦 Kho chung' },
  { value: 'tự quản',    label: '🔑 Kho tự quản' },
  { value: 'xưởng',      label: '🏗️ Kho xưởng' },
  { value: 'ngoại quan', label: '🚢 Kho ngoại quan' },
];

const AREA_OPTIONS = [
  { label: '< 50 m²',    min: 0,   max: 50   },
  { label: '< 100 m²',   min: 0,   max: 100  },
  { label: '< 500 m²',   min: 0,   max: 500  },
  { label: '< 1,000 m²', min: 0,   max: 1000 },
];

const PRICE_OPTIONS = [
  { label: '< 50k',        max: 50000   },
  { label: '50 – 100k',    min: 50000,  max: 100000 },
  { label: '100 – 200k',   min: 100000, max: 200000 },
  { label: '200 – 500k',   min: 200000, max: 500000 },
  { label: '> 500k',       min: 500000  },
];

const RATING_OPTIONS = [
  { label: '⭐ ≥ 3 sao', value: 3 },
  { label: '⭐ ≥ 4 sao', value: 4 },
  { label: '⭐ ≥ 4.5 sao', value: 4.5 },
];

const resolveImage = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800';
  if (url.startsWith('http')) return url;
  return `http://localhost:5276${url}`;
};

/* ── Stars display helper ───────────────────────────────── */
const StarDisplay = ({ rating, count, size = 14 }) => {
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


/* ── Section header helper ───────────────────────────────── */
const FilterSection = ({ icon, title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: '0.75rem', fontWeight: 800, color: '#475569',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginBottom: 10,
    }}>
      <span>{icon}</span>{title}
    </div>
    {children}
  </div>
);

/* ── Main Component ─────────────────────────────────────── */
export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  /* ── Filter states ───────────────────────── */
  const [provinceInput, setProvinceInput] = useState('');
  const [showProvDrop,  setShowProvDrop]  = useState(false);
  const [districtInput, setDistrictInput] = useState('');
  const provRef = useRef(null);

  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filteredProvinces = provinceInput.trim()
    ? PROVINCES.filter(p => norm(p).includes(norm(provinceInput)))
    : PROVINCES;

  const [warehouseType, setWarehouseType] = useState('');
  const [areaIdx,       setAreaIdx]       = useState(null);
  const [priceIdx,      setPriceIdx]      = useState(null);   // giá
  const [is24Hours,     setIs24Hours]     = useState(false);  // 24/7
  const [minRating,     setMinRating]     = useState(null);   // rating
  const [sortBy,        setSortBy]        = useState('newest');
  const [page,          setPage]          = useState(1);

  // Derived price range from preset
  const priceFilter = priceIdx != null ? PRICE_OPTIONS[priceIdx] : {};

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (provRef.current && !provRef.current.contains(e.target)) setShowProvDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Data states ─────────────────────────── */
  const [results, setResults]  = useState([]);
  const [total,   setTotal]    = useState(0);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState(null);

  const PAGE_SIZE = 12;

  /* ── Fetch ───────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const areaFilter = areaIdx != null ? AREA_OPTIONS[areaIdx] : {};
      const data = await searchWarehouses({
        province:      provinceInput,
        district:      districtInput,
        warehouseType,
        minArea:       areaFilter.min ?? undefined,
        maxArea:       areaFilter.max ?? undefined,
        minPrice:      priceFilter.min ?? undefined,
        maxPrice:      priceFilter.max ?? undefined,
        is24Hours:     is24Hours || undefined,
        minRating:     minRating ?? undefined,
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
  }, [provinceInput, districtInput, warehouseType, areaIdx, priceIdx, is24Hours, minRating, sortBy, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Handlers ────────────────────────────── */
  const handleApply = () => { setPage(1); fetchData(); };
  const handleReset = () => {
    setProvinceInput('');
    setDistrictInput('');
    setWarehouseType('');
    setAreaIdx(null);
    setPriceIdx(null);
    setIs24Hours(false);
    setMinRating(null);
    setSortBy('newest');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Count active filters for badge
  const activeFilterCount =
    (provinceInput ? 1 : 0) +
    (districtInput ? 1 : 0) +
    (warehouseType ? 1 : 0) +
    (areaIdx != null ? 1 : 0) +
    (priceIdx != null ? 1 : 0) +
    (is24Hours ? 1 : 0) +
    (minRating != null ? 1 : 0);

  /* ── Styles ──────────────────────────────── */
  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: '0.88rem',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', background: '#fff',
    color: '#1e293b', transition: 'border-color 0.15s',
  };
  const chipBase = {
    padding: '7px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
    border: '1px solid #e2e8f0', background: '#fff',
    color: '#334155', cursor: 'pointer', transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  };
  const chipActive = {
    ...chipBase,
    border: '2px solid #0095c7', background: '#e0f2fe', color: '#0369a1',
  };

  const sidebarStyle = {
    background: '#fff', borderRadius: 16, padding: '22px 18px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
    position: 'sticky', top: 108,
  };

  const divider = <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />;

  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto',
      padding: '1.5rem 1rem',
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      {/* Mobile Filter Toggle Button */}
      <div style={{ display: 'none' }} className="mobile-filter-btn-wrap">
        <button
          onClick={() => setShowMobileFilter(!showMobileFilter)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 10, marginBottom: 16,
            background: showMobileFilter ? '#0095c7' : '#fff',
            color: showMobileFilter ? '#fff' : '#334155',
            border: '1.5px solid ' + (showMobileFilter ? '#0095c7' : '#e2e8f0'),
            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <span>🔍 Bộ lọc</span>
          {activeFilterCount > 0 && (
            <span style={{
              background: showMobileFilter ? '#fff' : '#0095c7', color: showMobileFilter ? '#0095c7' : '#fff',
              borderRadius: '50%', width: 20, height: 20, fontSize: '0.7rem',
              fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{activeFilterCount}</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>{showMobileFilter ? '▲' : '▼'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }} className="search-layout">

        {/* ══ FILTER SIDEBAR ══════════════════════════════════ */}
        <aside style={{ width: 292, flexShrink: 0 }} className={`search-sidebar${showMobileFilter ? ' mobile-open' : ''}`}>
          <div style={sidebarStyle}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  🔍 Bộ lọc
                </h3>
                {activeFilterCount > 0 && (
                  <span style={{
                    background: '#0095c7', color: '#fff', borderRadius: '50%',
                    width: 20, height: 20, fontSize: '0.7rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{activeFilterCount}</span>
                )}
              </div>
              <button onClick={handleReset} style={{
                background: 'none', border: 'none', color: '#0095c7',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0,
              }}>Xóa tất cả</button>
            </div>

            {/* 1. Địa điểm - Tỉnh/TP */}
            <FilterSection icon="📍" title="Tỉnh / Thành phố">
              <div ref={provRef} style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Nhập tỉnh, thành phố..."
                  value={provinceInput}
                  onChange={e => { setProvinceInput(e.target.value); setShowProvDrop(true); setPage(1); }}
                  onFocus={() => setShowProvDrop(true)}
                  autoComplete="off"
                  style={{ ...inputStyle, cursor: 'text' }}
                />
                {showProvDrop && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: '#fff', border: '1.5px solid #bae6fd',
                    borderRadius: 10, boxShadow: '0 10px 28px rgba(14,165,233,0.14)',
                    maxHeight: 200, overflowY: 'auto', zIndex: 999, scrollbarWidth: 'thin',
                  }}>
                    {filteredProvinces.length > 0 ? filteredProvinces.map(p => (
                      <div
                        key={p}
                        onMouseDown={e => { e.preventDefault(); setProvinceInput(p); setShowProvDrop(false); setPage(1); }}
                        style={{
                          padding: '8px 12px', fontSize: '0.86rem',
                          color: provinceInput === p ? '#0369a1' : '#1e293b',
                          fontWeight: provinceInput === p ? 700 : 400,
                          background: provinceInput === p ? '#f0f9ff' : 'transparent',
                          cursor: 'pointer', borderBottom: '1px solid #f0f9ff',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                        onMouseLeave={e => e.currentTarget.style.background = provinceInput === p ? '#f0f9ff' : 'transparent'}
                      >
                        {p}
                      </div>
                    )) : (
                      <div style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                        Không tìm thấy
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FilterSection>

            {/* 2. Quận/Huyện */}
            <FilterSection icon="🗺️" title="Quận / Huyện">
              <input
                type="text"
                placeholder="VD: Quận 7, Hoàng Mai..."
                value={districtInput}
                onChange={e => { setDistrictInput(e.target.value); setPage(1); }}
                style={inputStyle}
              />
            </FilterSection>

            {divider}

            {/* 3. Loại kho */}
            <FilterSection icon="🏭" title="Loại kho">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {WAREHOUSE_TYPES.map(t => (
                  <label key={t.value} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: '0.875rem', cursor: 'pointer',
                    color: warehouseType === t.value ? '#0095c7' : '#334155',
                    fontWeight: warehouseType === t.value ? 700 : 400,
                  }}>
                    <input
                      type='radio'
                      name='warehouseType'
                      checked={warehouseType === t.value}
                      onChange={() => { setWarehouseType(t.value); setPage(1); }}
                      style={{ accentColor: '#0095c7', width: 15, height: 15 }}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </FilterSection>

            {divider}

            {/* 4. Diện tích trống cần thuê */}
            <FilterSection icon="📐" title="Diện tích cần thuê (còn trống)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {AREA_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { setAreaIdx(areaIdx === i ? null : i); setPage(1); }}
                    style={areaIdx === i ? chipActive : chipBase}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FilterSection>

            {divider}

            {/* 5. Khoảng giá thuê */}
            <FilterSection icon="💰" title="Giá thuê / m² / tháng">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PRICE_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { setPriceIdx(priceIdx === i ? null : i); setPage(1); }}
                    style={{
                      ...(priceIdx === i ? chipActive : chipBase),
                      textAlign: 'left',
                      padding: '8px 12px',
                    }}
                  >
                    {opt.label} <span style={{ opacity: 0.6 }}>đ/m²</span>
                  </button>
                ))}
              </div>
            </FilterSection>

            {divider}

            {/* 6. Kho 24/7 */}
            <FilterSection icon="🕐" title="Giờ hoạt động">
              <div
                onClick={() => { setIs24Hours(!is24Hours); setPage(1); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  border: is24Hours ? '2px solid #0095c7' : '1.5px solid #e2e8f0',
                  background: is24Hours ? '#e0f2fe' : '#f8fafc',
                  transition: 'all 0.15s',
                }}
              >
                {/* Toggle pill */}
                <div style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: is24Hours ? '#0095c7' : '#cbd5e1',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: 3,
                    left: is24Hours ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: is24Hours ? '#0369a1' : '#334155' }}>
                    Chỉ kho 24/7
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Truy cập không giới hạn giờ</div>
                </div>
              </div>
            </FilterSection>

            {divider}

            {/* 7. Đánh giá tối thiểu */}
            <FilterSection icon="⭐" title="Đánh giá tối thiểu">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {RATING_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setMinRating(minRating === opt.value ? null : opt.value); setPage(1); }}
                    style={{
                      ...(minRating === opt.value ? chipActive : chipBase),
                      textAlign: 'left', padding: '8px 12px',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Apply button */}
            <button
              onClick={handleApply}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, marginTop: 4,
                background: 'linear-gradient(135deg,#0095c7,#0077a3)',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,149,199,0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,149,199,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,149,199,0.3)'; }}
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
              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {provinceInput && <ActiveChip label={`📍 ${provinceInput}`} onRemove={() => { setProvinceInput(''); setPage(1); }} />}
                  {districtInput && <ActiveChip label={`🗺️ ${districtInput}`} onRemove={() => { setDistrictInput(''); setPage(1); }} />}
                  {warehouseType && <ActiveChip label={`🏭 ${WAREHOUSE_TYPES.find(t => t.value === warehouseType)?.label}`} onRemove={() => { setWarehouseType(''); setPage(1); }} />}
                  {areaIdx != null && <ActiveChip label={`📐 ${AREA_OPTIONS[areaIdx].label}`} onRemove={() => { setAreaIdx(null); setPage(1); }} />}
                  {priceIdx != null && <ActiveChip label={`💰 ${PRICE_OPTIONS[priceIdx].label} đ/m²`} onRemove={() => { setPriceIdx(null); setPage(1); }} />}
                  {is24Hours && <ActiveChip label="🕐 24/7" onRemove={() => { setIs24Hours(false); setPage(1); }} />}
                  {minRating != null && <ActiveChip label={`⭐ ≥ ${minRating} sao`} onRemove={() => { setMinRating(null); setPage(1); }} />}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1); }}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', background: '#fff', color: '#1e293b' }}
              >
                <option value='newest'>Mới nhất</option>
                <option value='price_asc'>Giá: Thấp → Cao</option>
                <option value='price_desc'>Giá: Cao → Thấp</option>
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
                  background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                  backgroundSize: '200% 100%',
                  borderRadius: 16, height: 340,
                  animation: 'shimmer 1.5s infinite',
                }} />
              ))}
              <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
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
                <WarehouseCard key={w.warehouseId} w={w} />
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

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-filter-btn-wrap {
            display: block !important;
          }
          .search-layout {
            flex-direction: column !important;
            gap: 0 !important;
          }
          .search-sidebar {
            width: 100% !important;
            display: none;
          }
          .search-sidebar.mobile-open {
            display: block !important;
          }
          .search-sidebar aside > div {
            position: static !important;
            top: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Active filter chip ─────────────────────────────────── */
function ActiveChip({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: '#e0f2fe', color: '#0369a1',
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.78rem', fontWeight: 600,
    }}>
      {label}
      <button onClick={onRemove} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#0369a1', fontSize: '0.85rem', lineHeight: 1,
        padding: '0 0 0 2px', fontWeight: 700,
      }}>✕</button>
    </span>
  );
}

/* ── Warehouse Card ─────────────────────────────────────── */
function WarehouseCard({ w }) {
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
          border: '1px solid #f1f5f9',
          display: 'flex', flexDirection: 'column',
          transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: 180, flexShrink: 0 }}>
          <img
            src={resolveImage(w.imageUrl)}
            alt={w.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'; }}
          />
          {/* Heart / Favorite button */}
          <button
            onClick={handleToggleFav}
            title={isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 34, height: 34, borderRadius: '50%',
              background: isFav ? 'rgba(251,113,133,0.95)' : 'rgba(255,255,255,0.90)',
              border: isFav ? '2px solid #fb7185' : '1.5px solid rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
              boxShadow: isFav ? '0 3px 10px rgba(251,113,133,0.5)' : '0 2px 8px rgba(0,0,0,0.18)',
              transform: favAnim ? 'scale(1.4)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s',
              zIndex: 5,
            }}
          >
            {isFav ? '❤️' : '🤍'}
          </button>
          {/* 24/7 badge */}
          {w.is24HoursAccess && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(4px)',
              color: '#fff', padding: '3px 8px', borderRadius: 20,
              fontSize: '0.68rem', fontWeight: 700,
            }}>
              ⏰ 24/7
            </div>
          )}
        </div>

        {/* Info */}
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
            <span style={{ flexShrink: 0 }}>📍</span> {w.address}
          </p>

          {/* Star rating — luôn hiện */}
          <div style={{ marginBottom: 8 }}>
            <StarDisplay rating={w.averageRating} count={w.ratingCount} />
          </div>

          {/* Price tag */}
          {w.pricePerM2 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
              border: '1px solid #6ee7b7',
              color: '#047857', fontSize: '0.8rem', fontWeight: 700,
              padding: '4px 10px', borderRadius: 20, marginBottom: 10,
            }}>
              💰 <strong style={{ color: '#065f46', fontSize: '0.9rem' }}>
                {Number(w.pricePerM2).toLocaleString('vi-VN')} đ
              </strong>/m²/tháng
            </div>
          )}

          {/* Area stats */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 'auto',
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Tổng DT</div>
              <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.92rem' }}>
                {w.totalArea?.toLocaleString()} m²
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Còn trống</div>
              <div style={{ fontWeight: 800, color: '#0095c7', fontSize: '0.98rem' }}>
                {w.availableArea?.toLocaleString()} m²
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}


