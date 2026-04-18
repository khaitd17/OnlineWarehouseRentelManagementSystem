import React, { useRef } from 'react';

/**
 * OWRMSLogo – Professional Warehouse System Logo
 * Re-designed to be highly clean, minimal, and directly related to Warehousing.
 */

let _uid = 0;

const OWRMSLogo = ({ size = 120, variant = 'mini', style = {} }) => {
  const uid = useRef(`owrms-logo-${++_uid}`).current;

  // We use one highly aesthetic, fully scalable warehouse vector mark
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        ...style
      }}
      aria-label="OWRMS Logo"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%" height="100%"
        viewBox="0 0 100 100"
        fill="none"
      >
        <defs>
          <linearGradient id={`bgGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9"/>     {/* Skight blue */}
            <stop offset="100%" stopColor="#1e3a8a"/>   {/* Deep royal blue */}
          </linearGradient>
          <linearGradient id={`markGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#e0f2fe"/>
          </linearGradient>
          <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.2"/>
          </filter>
        </defs>

        {/* Premium App-Icon Base (Squircle) */}
        <rect 
          x="6" y="6" 
          width="88" height="88" 
          rx="24" 
          fill={`url(#bgGrad-${uid})`} 
          filter={`url(#shadow-${uid})`} 
        />
        
        {/*
          The Factory / Warehouse Silhouette
          - Features a classic sawtooth roof design representing logistics and industrial storage
          - Center rounded door
        */}
        <g filter={`url(#shadow-${uid})`}>
          {/* Main Warehouse Outline */}
          <path 
            d="M 20 68 V 48 L 40 33 V 48 L 60 33 V 48 L 80 33 V 68 Z" 
            stroke={`url(#markGrad-${uid})`} 
            strokeWidth="7" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.08)"
          />

          {/* Warehouse Door */}
          <path 
            d="M 42 68 V 56 a 2 2 0 0 1 2 -2 h 12 a 2 2 0 0 1 2 2 V 68" 
            stroke={`url(#markGrad-${uid})`} 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Decorative subtle lines (vents / panel alignments) */}
          <line x1="30" y1="58" x2="30" y2="62" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
          <line x1="70" y1="58" x2="70" y2="62" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

export default OWRMSLogo;

