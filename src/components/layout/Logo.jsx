import React from 'react';

export default function Logo({ className = "w-8 h-8", size = 32 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Comet blue gradient */}
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        {/* Shadow filter for high premium look */}
        <filter id="logo-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.2" />
        </filter>
      </defs>
      
      {/* Outer Comet Ring / Circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="44" 
        fill="url(#logo-grad)" 
        filter="url(#logo-shadow)"
      />
      
      {/* Comet Tail swoosh overlay (subtle transparent glow) */}
      <path 
        d="M 50 6 A 44 44 0 0 1 94 50 A 44 44 0 0 1 50 94 A 44 44 0 0 1 50 6 Z" 
        fill="white" 
        fillOpacity="0.05"
      />

      {/* White "C" cut-out */}
      <path 
        d="M 68 35 
           C 62 25, 48 24, 38 32 
           C 28 40, 26 56, 36 66 
           C 44 74, 58 74, 66 65 
           L 76 72 
           C 64 85, 43 86, 28 73 
           C 13 60, 15 36, 30 22 
           C 45 8, 69 9, 80 23 
           Z" 
        fill="white" 
      />

      {/* Comet core white dot */}
      <circle 
        cx="68" 
        cy="50" 
        r="6" 
        fill="white" 
      />
    </svg>
  );
}
