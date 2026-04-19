import React, { useState, useEffect, useCallback, useRef } from 'react';
import WarehouseMap from '../components/WarehouseMap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { searchWarehouses } from '../services/warehouseService';
import favoritesService from '../services/favoritesService';
import WarehouseCard, { resolveImage, StarDisplay } from '../components/WarehouseCard';

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
  { value: 'lạnh',       label: 'Kho lạnh / mát' },
  { value: 'chung',      label: 'Kho chung' },
  { value: 'tự quản',    label: 'Kho tự quản' },
  { value: 'xưởng',      label: 'Kho xưởng' },
  { value: 'ngoại quan', label: 'Kho ngoại quan' },
];

const AREA_MIN = 0;
const AREA_MAX = 5000;
const PRICE_MIN = 0;
const PRICE_MAX = 500000;

const RATING_OPTIONS = [
  { label: '≥ 3 sao', stars: 3, value: 3 },
  { label: '≥ 4 sao', stars: 4, value: 4 },
  { label: '≥ 4.5 sao', stars: 4.5, value: 4.5 },
];


/* ── Section header helper ───────────────────────────────── */
const FilterSection = ({ icon, title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: '0.75rem', fontWeight: 800, color: '#475569',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginBottom: 10,
    }}>
      {title}
    </div>
    {children}
  </div>
);


/* ── Main Component ─────────────────────────────────────── */
export default function SearchResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  /* ── Filter states ───────────────────────── */
  const [provinceInput, setProvinceInput] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get('province') || '';
  });
  const [showProvDrop,  setShowProvDrop]  = useState(false);
  const [districtInput, setDistrictInput] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get('district') || '';
  });
  const provRef = useRef(null);

  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filteredProvinces = provinceInput.trim()
    ? PROVINCES.filter(p => norm(p).includes(norm(provinceInput)))
    : PROVINCES;

  const [warehouseType, setWarehouseType] = useState(() => {
    const p = new URLSearchParams(location.search);
    const cat = p.get('warehouseType');
    if (!cat) return '';
    const normText = cat.toLowerCase();
    if (normText.includes('mát') || normText.includes('lạnh')) return 'lạnh';
    if (normText.includes('chung')) return 'chung';
    if (normText.includes('tự quản')) return 'tự quản';
    if (normText.includes('xưởng')) return 'xưởng';
    if (normText.includes('ngoại quan')) return 'ngoại quan';
    return '';
  });
  const [areaRange,     setAreaRange]     = useState(() => {
    const p = new URLSearchParams(location.search);
    const maxA = p.get('maxArea');
    if (maxA && !isNaN(maxA)) return [AREA_MIN, parseInt(maxA, 10)];
    return [AREA_MIN, AREA_MAX];
  });   // [min, max]
  const [priceRange,    setPriceRange]    = useState([PRICE_MIN, PRICE_MAX]); // [min, max]
  const [is24Hours,     setIs24Hours]     = useState(false);  // 24/7
  const [minRating,     setMinRating]     = useState(null);   // rating
  const [sortBy,        setSortBy]        = useState('newest');
  const [page,          setPage]          = useState(1);
  const [viewMode,      setViewMode]      = useState('list'); // 'list' or 'map'

  const areaActive  = areaRange[0]  !== AREA_MIN  || areaRange[1]  !== AREA_MAX;
  const priceActive = priceRange[0] !== PRICE_MIN || priceRange[1] !== PRICE_MAX;

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
      const data = await searchWarehouses({
        province:      provinceInput,
        district:      districtInput,
        warehouseType,
        minArea:       areaRange[0]  > AREA_MIN  ? areaRange[0]  : undefined,
        maxArea:       areaRange[1]  < AREA_MAX  ? areaRange[1]  : undefined,
        minPrice:      priceRange[0] > PRICE_MIN ? priceRange[0] : undefined,
        maxPrice:      priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
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
  }, [provinceInput, districtInput, warehouseType, areaRange, priceRange, is24Hours, minRating, sortBy, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Handlers ────────────────────────────── */
  const handleApply = () => { setPage(1); fetchData(); };
  const handleReset = () => {
    setProvinceInput('');
    setDistrictInput('');
    setWarehouseType('');
    setAreaRange([AREA_MIN, AREA_MAX]);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
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
    (areaActive  ? 1 : 0) +
    (priceActive ? 1 : 0) +
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
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh', width: '100%' }}>
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
          <span>Bộ lọc</span>
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
                  Bộ lọc
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
            <FilterSection icon="" title="Tỉnh / Thành phố">
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
            <FilterSection icon="" title="Quận / Huyện">
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
            <FilterSection icon="" title="Loại kho">
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

            {/* 4. Diện tích trống cần thuê — Range Slider */}
            <FilterSection icon="" title="Thể tích cần thuê (còn trống)">
              <RangeSlider
                min={AREA_MIN}
                max={AREA_MAX}
                step={10}
                value={areaRange}
                onChange={v => { setAreaRange(v); setPage(1); }}
                formatValue={v => v >= AREA_MAX ? `${AREA_MAX.toLocaleString()}+ m³` : `${v.toLocaleString()} m³`}
                color="#0095c7"
              />
            </FilterSection>

            {divider}

            {/* 5. Khoảng giá thuê — Range Slider */}
            <FilterSection icon="" title="Giá thuê / m³ / tháng">
              <RangeSlider
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={10000}
                value={priceRange}
                onChange={v => { setPriceRange(v); setPage(1); }}
                formatValue={v => {
                  if (v >= PRICE_MAX) return '500k+ đ';
                  if (v >= 1000) return `${(v/1000).toFixed(0)}k đ`;
                  return `${v} đ`;
                }}
                color="#0095c7"
              />
            </FilterSection>

            {divider}

            {/* 6. Kho 24/7 */}
            <FilterSection icon="" title="Giờ hoạt động">
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
            <FilterSection icon="" title="Đánh giá tối thiểu">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {RATING_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setMinRating(minRating === opt.value ? null : opt.value); setPage(1); }}
                    style={{
                      ...(minRating === opt.value ? chipActive : chipBase),
                      textAlign: 'left', padding: '8px 12px',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ display: 'inline-flex', gap: 1 }}>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const filled = i < Math.floor(opt.stars);
                        const half = !filled && i < opt.stars;
                        return (
                          <span key={i} style={{
                            fontSize: '0.85rem',
                            color: filled || half ? '#f59e0b' : '#d1d5db',
                          }}>
                            {half ? '½' : '★'}
                          </span>
                        );
                      })}
                    </span>
                    <span>{opt.label}</span>
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
                  {provinceInput && <ActiveChip label={provinceInput} onRemove={() => { setProvinceInput(''); setPage(1); }} />}
                  {districtInput && <ActiveChip label={districtInput} onRemove={() => { setDistrictInput(''); setPage(1); }} />}
                  {warehouseType && <ActiveChip label={WAREHOUSE_TYPES.find(t => t.value === warehouseType)?.label} onRemove={() => { setWarehouseType(''); setPage(1); }} />}
                  {areaActive  && <ActiveChip label={`${areaRange[0].toLocaleString()}–${areaRange[1] >= AREA_MAX ? AREA_MAX.toLocaleString()+'+' : areaRange[1].toLocaleString()} m³`} onRemove={() => { setAreaRange([AREA_MIN, AREA_MAX]); setPage(1); }} />}
                  {priceActive && <ActiveChip label={`${(priceRange[0]/1000).toFixed(0)}k–${priceRange[1] >= PRICE_MAX ? '500k+' : (priceRange[1]/1000).toFixed(0)+'k'} đ/m³`} onRemove={() => { setPriceRange([PRICE_MIN, PRICE_MAX]); setPage(1); }} />}
                  {is24Hours && <ActiveChip label="24/7" onRemove={() => { setIs24Hours(false); setPage(1); }} />}
                  {minRating != null && <ActiveChip label={`≥ ${minRating} sao`} onRemove={() => { setMinRating(null); setPage(1); }} />}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Sắp xếp */}
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
                  <option value='area_asc'>Thể tích: Nhỏ → Lớn</option>
                  <option value='area_desc'>Thể tích: Lớn → Nhỏ</option>
                </select>
              </div>

              {/* View Toggle */}
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
                <button
                  onClick={() => setViewMode('list')}
                  onMouseEnter={e => { if (viewMode !== 'list') e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseLeave={e => { if (viewMode !== 'list') e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 32,
                    borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: viewMode === 'list' ? '#fff' : 'transparent',
                    boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    color: viewMode === 'list' ? '#0095c7' : '#64748b',
                  }}
                  title="Danh sách"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>format_list_bulleted</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  onMouseEnter={e => { if (viewMode !== 'map') e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseLeave={e => { if (viewMode !== 'map') e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 32,
                    borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: viewMode === 'map' ? '#fff' : 'transparent',
                    boxShadow: viewMode === 'map' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    color: viewMode === 'map' ? '#0095c7' : '#64748b',
                  }}
                  title="Bản đồ"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards / Map */}
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
              <div style={{ fontSize: '3rem', marginBottom: 16 }}></div>
              <h3 style={{ color: '#334155', fontWeight: 700, marginBottom: 8 }}>Không tìm thấy kho phù hợp</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Thử điều chỉnh bộ lọc để xem thêm kết quả.</p>
              <button onClick={handleReset} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, background: '#0095c7', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Xóa bộ lọc
              </button>
            </div>
          ) : viewMode === 'map' ? (
            <WarehouseMap warehouses={results} />
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

/* ── Dual-handle Range Slider ────────────────────────────── */
function RangeSlider({ min, max, step, value, onChange, formatValue, color = '#0095c7' }) {
  const [dragging, setDragging] = useState(null); // 'min' | 'max' | null
  const trackRef = useRef(null);

  const pct = (v) => ((v - min) / (max - min)) * 100;

  const clamp = (v) => Math.round(Math.max(min, Math.min(max, v)) / step) * step;

  const getValueFromEvent = useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return clamp(min + ratio * (max - min));
  }, [min, max, step]); // eslint-disable-line

  const handleTrackClick = (e) => {
    if (!trackRef.current) return;
    const v = getValueFromEvent(e);
    const distMin = Math.abs(v - value[0]);
    const distMax = Math.abs(v - value[1]);
    if (distMin <= distMax) {
      onChange([Math.min(v, value[1]), value[1]]);
    } else {
      onChange([value[0], Math.max(v, value[0])]);
    }
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      if (!trackRef.current) return;
      const v = getValueFromEvent(e);
      if (dragging === 'min') onChange([Math.min(v, value[1]), value[1]]);
      else onChange([value[0], Math.max(v, value[0])]);
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, value, onChange, getValueFromEvent]);

  const thumbStyle = (active) => ({
    width: 18, height: 18, borderRadius: '50%',
    background: active ? color : '#fff',
    border: `2.5px solid ${color}`,
    boxShadow: active
      ? `0 0 0 4px ${color}25, 0 2px 8px rgba(0,0,0,0.18)`
      : '0 2px 8px rgba(0,0,0,0.18)',
    cursor: 'grab',
    position: 'absolute',
    top: '50%', transform: 'translate(-50%, -50%)',
    zIndex: active ? 4 : 3,
    transition: 'box-shadow 0.15s, background 0.15s',
    userSelect: 'none', touchAction: 'none',
  });

  const lo = pct(value[0]);
  const hi = pct(value[1]);

  return (
    <div style={{ padding: '4px 2px 8px' }}>
      {/* Value labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: '0.78rem', fontWeight: 700,
          color: value[0] > min ? color : '#94a3b8',
          background: value[0] > min ? `${color}15` : '#f1f5f9',
          border: `1px solid ${value[0] > min ? color+'40' : '#e2e8f0'}`,
          borderRadius: 6, padding: '3px 8px',
          transition: 'all 0.15s',
        }}>
          {formatValue(value[0])}
        </span>
        <span style={{
          fontSize: '0.78rem', fontWeight: 700,
          color: value[1] < max ? color : '#94a3b8',
          background: value[1] < max ? `${color}15` : '#f1f5f9',
          border: `1px solid ${value[1] < max ? color+'40' : '#e2e8f0'}`,
          borderRadius: 6, padding: '3px 8px',
          transition: 'all 0.15s',
        }}>
          {formatValue(value[1])}
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        style={{
          position: 'relative', height: 6, borderRadius: 3,
          background: '#e2e8f0', cursor: 'pointer', margin: '10px 9px',
        }}
      >
        {/* Filled range */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${lo}%`, width: `${hi - lo}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          borderRadius: 3, transition: dragging ? 'none' : 'all 0.05s',
        }} />

        {/* Min thumb */}
        <div
          style={{ ...thumbStyle(dragging === 'min'), left: `${lo}%` }}
          onMouseDown={(e) => { e.preventDefault(); setDragging('min'); }}
          onTouchStart={(e) => { e.preventDefault(); setDragging('min'); }}
        />

        {/* Max thumb */}
        <div
          style={{ ...thumbStyle(dragging === 'max'), left: `${hi}%` }}
          onMouseDown={(e) => { e.preventDefault(); setDragging('max'); }}
          onTouchStart={(e) => { e.preventDefault(); setDragging('max'); }}
        />
      </div>

      {/* Min/Max labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 2px' }}>
        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{formatValue(min)}</span>
        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{formatValue(max)}</span>
      </div>
    </div>
  );
}
