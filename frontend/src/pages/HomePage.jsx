import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFeaturedWarehouses } from '../services/warehouseService';

const HOME_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .home-root {
    width: 100%;
    overflow-x: hidden;
    background: #f0f4f8;
    font-family: 'Inter', sans-serif;
  }

  /* ── HERO ─────────────────────────────────── */
  .hero-section {
    overflow: visible;
    position: relative;
    min-height: 84vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(140deg, #060d1a 0%, #0a1e3c 40%, #0d2654 70%, #071525 100%);
    padding: 6rem 2rem 6rem;
  }

  /* Animated mesh background */
  .hero-bg-mesh {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 20% 30%, rgba(14,165,233,0.13) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 80% 70%, rgba(99,102,241,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 50% 0%, rgba(56,189,248,0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  /* Floating orbs */
  .hero-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
    animation: floatOrb 8s ease-in-out infinite;
  }
  .hero-orb-1 {
    width: 400px; height: 400px;
    background: rgba(14,165,233,0.12);
    top: -100px; left: -100px;
    animation-delay: 0s;
  }
  .hero-orb-2 {
    width: 500px; height: 500px;
    background: rgba(99,102,241,0.1);
    bottom: -150px; right: -100px;
    animation-delay: -4s;
  }
  .hero-orb-3 {
    width: 250px; height: 250px;
    background: rgba(56,189,248,0.1);
    top: 40%; left: 60%;
    animation-delay: -2s;
  }
  @keyframes floatOrb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(20px, -30px) scale(1.05); }
    66% { transform: translate(-15px, 20px) scale(0.95); }
  }

  /* Grid lines overlay */
  .hero-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
  }

  .hero-content {
    position: relative;
    z-index: 10;
    max-width: 900px;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(56,189,248,0.1);
    border: 1px solid rgba(56,189,248,0.3);
    color: #38bdf8;
    padding: 0.4rem 1.1rem;
    border-radius: 100px;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin-bottom: 2rem;
    animation: pulseBadge 3s ease-in-out infinite;
  }
  @keyframes pulseBadge {
    0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.25); }
    50% { box-shadow: 0 0 0 8px rgba(56,189,248,0); }
  }
  .badge-dot {
    width: 7px; height: 7px;
    background: #38bdf8;
    border-radius: 50%;
    animation: blink 1.5s ease-in-out infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .hero-title {
    font-size: clamp(2.4rem, 5vw, 4rem);
    font-weight: 900;
    line-height: 1.15;
    margin-bottom: 1.5rem;
    color: #fff;
    letter-spacing: -0.02em;
  }
  .hero-title-accent {
    background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: 1.1rem;
    color: rgba(255,255,255,0.6);
    max-width: 600px;
    margin: 0 auto 3rem;
    line-height: 1.75;
    font-weight: 400;
  }

  /* Stats row */
  .hero-stats {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-bottom: 3.5rem;
    flex-wrap: wrap;
  }
  .hero-stat {
    text-align: center;
  }
  .hero-stat-number {
    font-size: 1.8rem;
    font-weight: 800;
    color: #fff;
    line-height: 1;
    margin-bottom: 0.25rem;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-stat-label {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.45);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .hero-stat-divider {
    width: 1px;
    background: rgba(255,255,255,0.12);
    align-self: stretch;
  }

  /* ── SEARCH (floating below hero) ─────────── */
  .search-outer {
    position: relative;
    z-index: 20;
    margin-top: -72px;
    padding: 0 2rem;
  }
  .search-card {
    max-width: 960px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 20px;
    padding: 28px 32px;
    box-shadow: 0 24px 60px rgba(6,13,28,0.22), 0 0 0 1px rgba(255,255,255,0.9);
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 18px;
    align-items: end;
  }
  @media (max-width: 768px) {
    .search-card {
      grid-template-columns: 1fr;
    }
  }

  /* Province autocomplete */
  .province-autocomplete {
    position: relative;
  }
  .province-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0; right: 0;
    background: #fff;
    border: 1.5px solid #bae6fd;
    border-radius: 12px;
    box-shadow: 0 12px 32px rgba(14,165,233,0.15);
    max-height: 240px;
    overflow-y: auto;
    z-index: 999;
    scrollbar-width: thin;
    scrollbar-color: #bae6fd transparent;
  }
  .province-dropdown::-webkit-scrollbar { width: 5px; }
  .province-dropdown::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 99px; }
  .province-option {
    padding: 9px 14px;
    font-size: 0.9rem;
    color: #1e293b;
    cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid #f0f9ff;
  }
  .province-option:last-child { border-bottom: none; }
  .province-option:hover, .province-option.highlighted {
    background: #f0f9ff;
    color: #0ea5e9;
    font-weight: 600;
  }
  .province-empty {
    padding: 12px 14px;
    font-size: 0.88rem;
    color: #94a3b8;
    text-align: center;
  }
  .search-field label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 700;
    color: #1e3a5c;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 8px;
  }
  .search-field input, .search-field select {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1.5px solid #e2e8f0;
    outline: none;
    font-size: 0.95rem;
    font-family: 'Inter', sans-serif;
    color: #1e293b;
    background: #fff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;
  }
  .search-field input:focus, .search-field select:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(56,189,248,0.15);
  }
  .search-btn {
    background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
    border: none;
    border-radius: 12px;
    height: 48px;
    padding: 0 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #fff;
    font-weight: 700;
    font-size: 0.95rem;
    font-family: 'Inter', sans-serif;
    transition: all 0.25s ease;
    box-shadow: 0 6px 20px rgba(14,165,233,0.4);
    white-space: nowrap;
  }
  .search-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(14,165,233,0.5);
  }

  /* ── CATEGORIES ─────────────────── */
  .section-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }
  .section-label {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    color: #0ea5e9;
    margin-bottom: 0.6rem;
  }
  .section-title {
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.5rem;
    line-height: 1.25;
    letter-spacing: -0.02em;
  }
  .section-desc {
    color: #64748b;
    font-size: 1rem;
    line-height: 1.65;
  }

  .cat-card {
    background: #fff;
    padding: 24px;
    border-radius: 18px;
    border: 1.5px solid #e8edf5;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 18px;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }
  .cat-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 0;
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    border-radius: 3px;
    transition: width 0.25s ease;
  }
  .cat-card:hover {
    border-color: #bae6fd;
    box-shadow: 0 12px 30px rgba(14,165,233,0.12);
    transform: translateY(-4px);
  }
  .cat-card:hover::before {
    width: 4px;
  }
  .cat-icon {
    font-size: 2rem;
    width: 58px; height: 58px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 14px;
    flex-shrink: 0;
    transition: transform 0.25s ease;
  }
  .cat-card:hover .cat-icon {
    transform: scale(1.08) rotate(-3deg);
  }

  /* ── WAREHOUSE CARDS ─────────── */
  .wh-card {
    background: #fff;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid #f0f4f8;
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
    display: block;
  }
  .wh-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 25px 50px rgba(0,0,0,0.1);
    border-color: #bae6fd;
  }
  .wh-img-wrap {
    position: relative;
    overflow: hidden;
    height: 230px;
  }
  .wh-img-wrap img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
  .wh-card:hover .wh-img-wrap img {
    transform: scale(1.06);
  }
  .wh-img-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(10,22,40,0.7) 0%, transparent 50%);
    pointer-events: none;
  }
  .wh-badge {
    position: absolute;
    top: 14px;
    left: 14px;
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .wh-body {
    padding: 22px 24px;
  }
  .wh-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8px;
    line-height: 1.4;
    transition: color 0.2s;
  }
  .wh-card:hover .wh-title {
    color: #0ea5e9;
  }
  .wh-addr {
    color: #64748b;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 14px;
  }
  .wh-desc {
    color: #475569;
    font-size: 0.83rem;
    line-height: 1.55;
    margin-bottom: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .wh-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f1f5f9;
    padding-top: 16px;
  }
  .wh-area-label {
    font-size: 0.72rem;
    color: #94a3b8;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 3px;
  }
  .wh-area-value {
    font-size: 1.05rem;
    font-weight: 700;
    color: #334155;
  }
  .wh-avail-value {
    font-size: 1.35rem;
    font-weight: 800;
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .wh-price-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    border: 1px solid #6ee7b7;
    color: #047857;
    font-size: 0.88rem;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 20px;
    margin-bottom: 14px;
    letter-spacing: -0.01em;
  }
  .wh-price-tag strong {
    font-size: 1rem;
    color: #065f46;
  }

  /* ── BENEFITS (dark) ─────────── */
  .benefits-section {
    background: linear-gradient(140deg, #060f1e 0%, #0a1e3c 50%, #081530 100%);
    padding: 7rem 2rem;
    position: relative;
    overflow: hidden;
  }
  .benefits-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 50% 60% at 10% 50%, rgba(14,165,233,0.08) 0, transparent 60%),
      radial-gradient(ellipse 40% 50% at 90% 50%, rgba(99,102,241,0.08) 0, transparent 60%);
    pointer-events: none;
  }
  .benefit-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 36px 28px;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }
  .benefit-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(14,165,233,0.07), rgba(99,102,241,0.07));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 20px;
  }
  .benefit-card:hover {
    border-color: rgba(56,189,248,0.25);
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  }
  .benefit-card:hover::before {
    opacity: 1;
  }
  .benefit-num {
    font-size: 3.5rem;
    font-weight: 900;
    line-height: 1;
    background: linear-gradient(135deg, rgba(56,189,248,0.15), rgba(99,102,241,0.15));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: absolute;
    top: 14px;
    right: 18px;
    letter-spacing: -0.04em;
  }
  .benefit-icon {
    font-size: 2.2rem;
    width: 70px; height: 70px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 18px;
    margin: 0 auto 1.5rem;
    position: relative;
    z-index: 1;
  }
  .benefit-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.85rem;
    line-height: 1.4;
    position: relative;
    z-index: 1;
  }
  .benefit-desc {
    color: rgba(255,255,255,0.5);
    font-size: 0.88rem;
    line-height: 1.7;
    position: relative;
    z-index: 1;
  }

  /* ── CTA ─────────────────────── */
  .cta-section {
    padding: 6rem 2rem;
    background: #f0f4f8;
  }
  .cta-card {
    max-width: 960px;
    margin: 0 auto;
    background: linear-gradient(135deg, #0a1e3c 0%, #0f2d5a 50%, #0a1e3c 100%);
    border-radius: 28px;
    padding: 5rem 3rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(56,189,248,0.15);
    box-shadow: 0 30px 80px rgba(4,13,28,0.4);
  }
  .cta-card::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, rgba(14,165,233,0.5), rgba(99,102,241,0.5), rgba(14,165,233,0.5));
    border-radius: 30px;
    z-index: -1;
    background-size: 300% 300%;
    animation: gradientBorder 5s linear infinite;
  }
  @keyframes gradientBorder {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .cta-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 60% at 50% 0%, rgba(14,165,233,0.12), transparent 70%);
    pointer-events: none;
  }
  .cta-title {
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    font-weight: 900;
    color: #fff;
    margin-bottom: 1rem;
    line-height: 1.2;
    letter-spacing: -0.02em;
    position: relative;
    z-index: 1;
  }
  .cta-desc {
    font-size: 1.05rem;
    color: rgba(255,255,255,0.6);
    max-width: 560px;
    margin: 0 auto 2.5rem;
    line-height: 1.75;
    position: relative;
    z-index: 1;
  }
  .cta-btns {
    display: flex;
    gap: 14px;
    justify-content: center;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }
  .btn-cta-primary {
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    color: #fff;
    padding: 15px 34px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
    transition: all 0.25s ease;
    box-shadow: 0 8px 25px rgba(14,165,233,0.4);
  }
  .btn-cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 35px rgba(14,165,233,0.55);
  }
  .btn-cta-secondary {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.85);
    border: 1.5px solid rgba(255,255,255,0.2);
    padding: 15px 34px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
    transition: all 0.25s ease;
  }
  .btn-cta-secondary:hover {
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.4);
    color: #fff;
    transform: translateY(-2px);
  }

  /* ── FADE IN ANIMATION ─────── */
  .fade-in-up {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .fade-in-up.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Simple intersection observer hook for scroll reveal
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const FadeSection = ({ children, style, className = '' }) => {
  const ref = useScrollReveal();
  return <div ref={ref} className={`fade-in-up ${className}`} style={style}>{children}</div>;
};

const PROVINCES = [
  'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu',
  'Bắc Ninh','Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận',
  'Cà Mau','Cần Thơ','Cao Bằng','Đà Nẵng','ĐẮk LẮk','ĐẮk Nông',
  'Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam',
  'Hà Nội','Hà Tĩnh','Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình',
  'Hưng Yên','Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng',
  'Lạng Sơn','Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình',
  'Ninh Thuận','Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi',
  'Quảng Ninh','Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình',
  'Thái Nguyên','Thanh Hóa','Thừa Thiên Huế','Tiền Giang','TP. Hồ Chí Minh',
  'Trà Vinh','Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái',
];

const AREA_RANGES = [
  { label: 'Tất cả diện tích', value: '' },
  { label: '< 50 m²',      value: '50'   },
  { label: '< 100 m²',     value: '100'  },
  { label: '< 500 m²',     value: '500'  },
  { label: '< 1,000 m²',   value: '1000' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Province autocomplete
  const [provinceInput, setProvinceInput] = useState('');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const provinceRef = React.useRef(null);
  const normHP = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filteredProvinces = provinceInput.trim()
    ? PROVINCES.filter(p => normHP(p).includes(normHP(provinceInput)))
    : PROVINCES;

  // Area dropdown
  const [selectedArea, setSelectedArea] = useState('');

  // Warehouse type
  const [warehouseType, setWarehouseType] = useState('');

  // Close province dropdown on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (provinceRef.current && !provinceRef.current.contains(e.target)) {
        setShowProvinceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getFeaturedWarehouses(6);
        setWarehouses(data);
      } catch (err) {
        console.error('Failed to fetch warehouses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  const categories = [
    { name: 'Kho mát / lạnh', icon: '❄️', desc: 'Lưu trữ thực phẩm, dược phẩm', bg: 'linear-gradient(135deg,#e0f2fe,#bae6fd)', shadow: 'rgba(14,165,233,0.2)' },
    { name: 'Kho chung', icon: '📦', desc: 'Chia sẻ không gian, tiết kiệm chi phí', bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', shadow: 'rgba(217,119,6,0.2)' },
    { name: 'Kho tự quản', icon: '🔐', desc: 'Có chìa khóa riêng, linh hoạt 24/7', bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', shadow: 'rgba(21,128,61,0.2)' },
    { name: 'Kho xưởng', icon: '🏭', desc: 'Kết hợp sản xuất và lưu trữ', bg: 'linear-gradient(135deg,#f3e8ff,#e9d5ff)', shadow: 'rgba(126,34,206,0.2)' },
  ];

  const benefits = [
    { title: 'Thông tin minh bạch, chính xác', desc: 'Mọi kho bãi đều được xác thực hình ảnh, giấy tờ, đảm bảo không có tin giả hoặc giá ảo.', icon: '🔍', bg: 'linear-gradient(135deg,rgba(14,165,233,0.15),rgba(56,189,248,0.08))', border: 'rgba(14,165,233,0.3)' },
    { title: 'Đa dạng lựa chọn', desc: 'Từ kho mát, kho thường, tới xưởng sản xuất, tất cả đều có sẵn với nhiều quy mô khác nhau.', icon: '🏢', bg: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(253,186,116,0.08))', border: 'rgba(245,158,11,0.3)' },
    { title: 'Ký hợp đồng & thanh toán an toàn', desc: 'Hỗ trợ pháp lý và cổng thanh toán an toàn, bảo vệ toàn diện quyền lợi người thuê kho.', icon: '🛡️', bg: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(52,211,153,0.08))', border: 'rgba(16,185,129,0.3)' },
    { title: 'Tiết kiệm thời gian & chi phí', desc: 'Không qua trung gian, tìm kiếm và liên hệ trực tiếp với chủ kho siêu nhanh chóng.', icon: '⚡', bg: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(167,139,250,0.08))', border: 'rgba(139,92,246,0.3)' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (provinceInput) params.set('province', provinceInput);
    if (selectedArea)  params.set('maxArea', selectedArea);
    if (warehouseType) params.set('warehouseType', warehouseType);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="home-root">
      <style>{HOME_STYLES}</style>

      {/* ── HERO ─────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-mesh" />
        <div className="hero-grid" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Nền tảng kho bãi #1 Việt Nam
          </div>

          <h1 className="hero-title">
            Tìm không gian lưu trữ<br />
            <span className="hero-title-accent">hoàn hảo cho doanh nghiệp</span>
          </h1>

          <p className="hero-subtitle">
            Truy cập hàng ngàn kho bãi đạt chuẩn trên toàn quốc. Thông tin minh bạch,
            không phí trung gian, ký hợp đồng điện tử tiện lợi.
          </p>

          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-number">5,000+</div>
              <div className="hero-stat-label">Kho bãi</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-number">63</div>
              <div className="hero-stat-label">Tỉnh thành</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-number">10K+</div>
              <div className="hero-stat-label">Doanh nghiệp</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-number">98%</div>
              <div className="hero-stat-label">Hài lòng</div>
            </div>
          </div>
        </div>

      </section>

      {/* ── SEARCH (outside hero, floating overlap) ── */}
      <div className="search-outer">
        <form className="search-card" onSubmit={handleSearch}>
          {/* KHU VỰC — Province autocomplete */}
          <div className="search-field">
            <label>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Khu vực
            </label>
            <div className="province-autocomplete" ref={provinceRef}>
              <input
                type="text"
                placeholder="Thành phố, Tỉnh..."
                value={provinceInput}
                onChange={e => { setProvinceInput(e.target.value); setShowProvinceDropdown(true); }}
                onFocus={() => setShowProvinceDropdown(true)}
                autoComplete="off"
              />
              {showProvinceDropdown && (
                <div className="province-dropdown">
                  {filteredProvinces.length > 0 ? (
                    filteredProvinces.map(p => (
                      <div
                        key={p}
                        className={`province-option${provinceInput === p ? ' highlighted' : ''}`}
                        onMouseDown={e => { e.preventDefault(); setProvinceInput(p); setShowProvinceDropdown(false); }}
                      >
                        {p}
                      </div>
                    ))
                  ) : (
                    <div className="province-empty">Không tìm thấy tỉnh thành</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LOẠI KHO */}
          <div className="search-field">
            <label>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Loại kho
            </label>
            <select value={warehouseType} onChange={e => setWarehouseType(e.target.value)}>
              <option value="">Tất cả loại kho</option>
              {categories.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* DIỆN TÍCH — dropdown 4 lựa chọn */}
          <div className="search-field">
            <label>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
              Diện tích cần thiết
            </label>
            <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)}>
              {AREA_RANGES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="search-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* ── CATEGORIES ────────────────────────── */}
      <section style={{ padding: '5rem 0 4rem' }}>
        <div className="section-wrap">
          <FadeSection>
            <div style={{ marginBottom: '2.5rem' }}>
              <p className="section-label">Danh mục</p>
              <h2 className="section-title">Loại hình kho bãi phổ biến</h2>
              <p className="section-desc">Chọn loại kho phù hợp với nhu cầu kinh doanh của bạn</p>
            </div>
          </FadeSection>
          <FadeSection>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px' }}>
              {categories.map((cat, idx) => (
                <div key={idx} className="cat-card" onClick={() => navigate(`/search?warehouseType=${encodeURIComponent(cat.name)}`)}>
                  <div className="cat-icon" style={{ background: cat.bg, boxShadow: `0 8px 20px ${cat.shadow}` }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{cat.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748b' }}>{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── FEATURED WAREHOUSES ────────────────── */}
      <section style={{ padding: '2rem 0 6rem' }}>
        <div className="section-wrap">
          <FadeSection>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p className="section-label">Nổi bật</p>
                <h2 className="section-title">Kho bãi được đề xuất</h2>
                <p className="section-desc">Được đánh giá cao bởi các doanh nghiệp và đối tác</p>
              </div>
              <Link to="/search" style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                Xem tất cả
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
          </FadeSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
            {loading ? (
              <p style={{ color: '#64748b', gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0', fontSize: '1rem' }}>Đang tải dữ liệu...</p>
            ) : warehouses.length === 0 ? (
              <p style={{ color: '#64748b', gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0', fontSize: '1rem' }}>Chưa có kho bãi nào được duyệt.</p>
            ) : (
              warehouses.map((w, i) => (
                <FadeSection key={w.warehouseId} style={{ transitionDelay: `${i * 0.08}s` }}>
                  <Link to={`/warehouse/${w.warehouseId}`} className="wh-card">
                    <div className="wh-img-wrap">
                      <img
                        src={!w.imageUrl ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'
                          : w.imageUrl.startsWith('http') ? w.imageUrl
                          : `http://localhost:5276${w.imageUrl}`}
                        alt={w.name}
                      />
                      <div className="wh-img-overlay" />
                      <div className="wh-badge">⭐ Nổi bật</div>
                    </div>
                    <div className="wh-body">
                      <h3 className="wh-title">{w.name}</h3>
                      <p className="wh-addr">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {w.address}
                      </p>
                      {w.description && <p className="wh-desc">{w.description}</p>}
                      {w.pricePerM2 && (
                        <div className="wh-price-tag">
                          💰 <strong>{Number(w.pricePerM2).toLocaleString('vi-VN')} đ</strong>/m²/tháng
                        </div>
                      )}
                      <div className="wh-footer">
                        <div>
                          <div className="wh-area-label">Tổng diện tích</div>
                          <div className="wh-area-value">{w.totalArea} m²</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="wh-area-label">Còn trống</div>
                          <div>
                            <span className="wh-avail-value">{w.availableArea}</span>
                            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}> m²</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </FadeSection>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── BENEFITS (dark) ─────────────────── */}
      <section className="benefits-section">
        <div className="section-wrap" style={{ position: 'relative', zIndex: 1 }}>
          <FadeSection>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p className="section-label" style={{ color: '#38bdf8' }}>Tại sao chọn chúng tôi</p>
              <h2 className="section-title" style={{ color: '#fff' }}>Lợi ích khi tìm kho tại OWRMS</h2>
              <p className="section-desc" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '560px', margin: '0 auto' }}>
                Chúng tôi cung cấp giải pháp tìm kiếm và thuê kho hiệu quả, an toàn, minh bạch dành riêng cho người đi thuê.
              </p>
            </div>
          </FadeSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {benefits.map((item, idx) => (
              <FadeSection key={idx} style={{ transitionDelay: `${idx * 0.1}s` }}>
                <div className="benefit-card">
                  <div className="benefit-num">0{idx + 1}</div>
                  <div className="benefit-icon" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                    {item.icon}
                  </div>
                  <h4 className="benefit-title">{item.title}</h4>
                  <p className="benefit-desc">{item.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="cta-section">
        <FadeSection>
          <div className="cta-card">
            <h2 className="cta-title">Bạn đã sẵn sàng<br />thuê kho ngay hôm nay?</h2>
            <p className="cta-desc">
              Tạo tài khoản miễn phí để lưu danh sách yêu thích, nhận báo giá chi tiết và lên lịch xem kho thực tế.
            </p>
            <div className="cta-btns">
              <Link to="/auth" className="btn-cta-primary">Đăng ký miễn phí</Link>
              <Link to="/search" className="btn-cta-secondary">Khám phá kho bãi</Link>
            </div>
          </div>
        </FadeSection>
      </section>
    </div>
  );
};

export default HomePage;
