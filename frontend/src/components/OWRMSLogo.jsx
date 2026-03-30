import React, { useRef } from 'react';

/**
 * OWRMSLogo – Exact premium logo từ logo-showcase.html
 *
 * Props:
 *   size    : number – diameter in px (default 120)
 *   variant : 'full' | 'mini'
 *             'full' = đầy đủ conic ring + glassmorphism + circular text + floating cube (sidebar / auth)
 *             'mini' = nhỏ gọn cho navbar / footer / admin sidebar
 */

let _uid = 0;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

  @keyframes owrms-spin       { to { transform: rotate(360deg); } }
  @keyframes owrms-spin-slow  { to { transform: rotate(360deg); } }
  @keyframes owrms-float {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-8px); }
  }
  @keyframes owrms-float-mini {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-3px); }
  }
  @keyframes owrms-pulse {
    0%, 100% { transform: scale(.9); opacity: .6; }
    50%      { transform: scale(1.15); opacity: 1; }
  }
  @keyframes owrms-shine {
    0%        { transform: translateX(-100%) translateY(-100%); }
    60%, 100% { transform: translateX(100%) translateY(100%); }
  }

  /* ── Full variant ── */
  .owrms-scene {
    position: relative;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .owrms-ring-outer {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, #00d2ff, #3a7bd5, #00d2ff, #0052d4, #00d2ff);
    animation: owrms-spin 6s linear infinite;
  }
  .owrms-ring-outer::after {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: #0a1628;
  }
  .owrms-glass-circle {
    position: absolute;
    inset: 9px;
    border-radius: 50%;
    background: radial-gradient(ellipse at 40% 35%, rgba(0,180,255,.18) 0%, rgba(10,22,40,.95) 65%);
    border: 1px solid rgba(0,210,255,.25);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow:
      0 0 60px rgba(0,180,255,.35),
      0 0 120px rgba(0,100,255,.18),
      inset 0 1px 0 rgba(255,255,255,.1),
      inset 0 0 40px rgba(0,180,255,.08);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .owrms-glass-circle::before {
    content: '';
    position: absolute;
    inset: -30%;
    background: radial-gradient(circle, rgba(0,210,255,.12) 0%, transparent 70%);
    animation: owrms-pulse 3.5s ease-in-out infinite;
  }
  .owrms-circular-text {
    position: absolute;
    inset: 0;
    z-index: 3;
    animation: owrms-spin-slow 18s linear infinite;
    pointer-events: none;
  }
  .owrms-icon-wrap {
    position: relative;
    z-index: 4;
    filter:
      drop-shadow(0 0 8px #00d2ff)
      drop-shadow(0 0 24px rgba(0,180,255,.6))
      drop-shadow(0 0 48px rgba(0,120,255,.35));
    animation: owrms-float 4s ease-in-out infinite;
  }
  .owrms-icon-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,.15) 50%, transparent 70%);
    animation: owrms-shine 4s ease-in-out infinite;
    border-radius: 8px;
    pointer-events: none;
  }

  /* ── Mini variant ── */
  .owrms-mini-scene {
    position: relative;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .owrms-mini-ring {
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, #00d2ff, #3a7bd5, #00d2ff, #0052d4, #00d2ff);
    animation: owrms-spin 6s linear infinite;
  }
  .owrms-mini-ring::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: #0a1628;
  }
  .owrms-mini-glass {
    position: absolute;
    inset: 5px;
    border-radius: 50%;
    background: radial-gradient(ellipse at 40% 35%, rgba(0,180,255,.2) 0%, rgba(10,22,40,.95) 65%);
    border: 1px solid rgba(0,210,255,.25);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow:
      0 0 18px rgba(0,180,255,.4),
      0 0 36px rgba(0,100,255,.15),
      inset 0 1px 0 rgba(255,255,255,.1);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .owrms-mini-glass::before {
    content: '';
    position: absolute;
    inset: -30%;
    background: radial-gradient(circle, rgba(0,210,255,.1) 0%, transparent 70%);
    animation: owrms-pulse 3.5s ease-in-out infinite;
  }
  .owrms-mini-icon {
    position: relative;
    z-index: 2;
    filter:
      drop-shadow(0 0 4px #00d2ff)
      drop-shadow(0 0 10px rgba(0,180,255,.5));
    animation: owrms-float-mini 4s ease-in-out infinite;
  }
`;

/* ── The cube SVG (coordinates from original showcase: viewBox 0 0 100 100) ── */
const CubeSVG = ({ cubeSize, uid }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={cubeSize} height={cubeSize}
    viewBox="0 0 100 100"
    fill="none"
  >
    <defs>
      <linearGradient id={`gTop-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#a8f0ff"/>
        <stop offset="100%" stopColor="#00c8f0"/>
      </linearGradient>
      <linearGradient id={`gLeft-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#0090d0"/>
        <stop offset="100%" stopColor="#005090"/>
      </linearGradient>
      <linearGradient id={`gRight-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#00b8e8"/>
        <stop offset="100%" stopColor="#0070b0"/>
      </linearGradient>
    </defs>

    {/* LEFT face */}
    <polygon points="18,50 50,67 50,90 18,73" fill={`url(#gLeft-${uid})`} opacity=".92"/>
    {/* RIGHT face */}
    <polygon points="50,67 82,50 82,73 50,90" fill={`url(#gRight-${uid})`} opacity=".96"/>
    {/* TOP face */}
    <polygon points="18,50 50,33 82,50 50,67" fill={`url(#gTop-${uid})`} opacity="1"/>

    {/* Top face grid */}
    <line x1="34" y1="41.5" x2="50" y2="50"   stroke="rgba(255,255,255,.55)" strokeWidth="1"/>
    <line x1="50" y1="50"   x2="66" y2="41.5" stroke="rgba(255,255,255,.55)" strokeWidth="1"/>
    <line x1="50" y1="33"   x2="50" y2="67"   stroke="rgba(255,255,255,.4)"  strokeWidth=".8"/>

    {/* Left face shelves */}
    <line x1="18" y1="58"   x2="50" y2="75"   stroke="rgba(255,255,255,.3)"  strokeWidth=".8"/>
    <line x1="18" y1="65.5" x2="50" y2="82.5" stroke="rgba(255,255,255,.2)"  strokeWidth=".8"/>
    <line x1="34" y1="58.5" x2="34" y2="81.5" stroke="rgba(255,255,255,.3)"  strokeWidth=".8"/>

    {/* Right face shelves */}
    <line x1="50" y1="75"   x2="82" y2="58"   stroke="rgba(255,255,255,.3)"  strokeWidth=".8"/>
    <line x1="50" y1="82.5" x2="82" y2="65.5" stroke="rgba(255,255,255,.2)"  strokeWidth=".8"/>
    <line x1="66" y1="58.5" x2="66" y2="81.5" stroke="rgba(255,255,255,.3)"  strokeWidth=".8"/>

    {/* Outer edges */}
    <polyline points="18,50 50,33 82,50"  stroke="rgba(200,245,255,.9)" strokeWidth="1.2" fill="none"/>
    <line x1="18" y1="50" x2="18" y2="73" stroke="rgba(200,245,255,.7)" strokeWidth="1.2"/>
    <line x1="82" y1="50" x2="82" y2="73" stroke="rgba(200,245,255,.7)" strokeWidth="1.2"/>
    <line x1="50" y1="67" x2="50" y2="90" stroke="rgba(200,245,255,.6)" strokeWidth="1.1"/>
    <polyline points="18,73 50,90 82,73"  stroke="rgba(200,245,255,.7)" strokeWidth="1.2" fill="none"/>
    <polyline points="18,50 50,67 82,50"  stroke="rgba(200,245,255,.5)" strokeWidth=".9"  fill="none"/>

    {/* Glint */}
    <line x1="34" y1="41.5" x2="18" y2="50" stroke="rgba(255,255,255,.95)" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

/* ════════════════════════════════════════════════════════════ */
const OWRMSLogo = ({ size = 120, variant = 'mini', style = {} }) => {
  const uid = useRef(`owrms${++_uid}`).current;

  /* ── MINI: compact for navbar, footer, admin sidebar ── */
  if (variant === 'mini') {
    const cubeSize = Math.round(size * 0.52);
    return (
      <>
        <style>{CSS}</style>
        <div
          className="owrms-mini-scene"
          style={{ width: size, height: size, ...style }}
          aria-label="OWRMS"
        >
          <div className="owrms-mini-ring" />
          <div className="owrms-mini-glass">
            <div className="owrms-mini-icon">
              <CubeSVG cubeSize={cubeSize} uid={uid} />
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── FULL: sidebar / auth — conic ring + glassmorphism + circular text ── */
  const cubeSize = Math.round(size * 0.42);
  const vb       = size; // viewBox = size × size for circular text SVG
  const textR    = size * 0.375; // radius for text path

  return (
    <>
      <style>{CSS}</style>
      <div
        className="owrms-scene"
        style={{ width: size, height: size, ...style }}
        aria-label="OWRMS"
      >
        {/* Conic rotating outer ring */}
        <div className="owrms-ring-outer" />

        {/* Glassmorphism main circle */}
        <div className="owrms-glass-circle">

          {/* Rotating circular text */}
          <svg
            className="owrms-circular-text"
            viewBox={`0 0 ${vb} ${vb}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <defs>
              <path
                id={`tc-${uid}`}
                d={`M ${vb/2},${vb/2} m -${textR},0 a ${textR},${textR} 0 1,1 ${textR*2},0 a ${textR},${textR} 0 1,1 -${textR*2},0`}
              />
            </defs>
            <text
              fontFamily="'Orbitron', sans-serif"
              fontSize={size * 0.042}
              fontWeight="700"
              fill="rgba(180,230,255,.78)"
              letterSpacing={size * 0.012}
            >
              <textPath href={`#tc-${uid}`} startOffset="0%">
                {'✦  ONLINE WAREHOUSE  ✦  MANAGEMENT SYSTEM  '}
              </textPath>
            </text>
          </svg>

          {/* Floating cube with neon glow + shine sweep */}
          <div className="owrms-icon-wrap">
            <CubeSVG cubeSize={cubeSize} uid={uid} />
          </div>
        </div>
      </div>
    </>
  );
};

export default OWRMSLogo;
