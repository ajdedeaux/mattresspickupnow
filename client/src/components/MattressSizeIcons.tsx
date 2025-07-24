import React from 'react';

// Proportionally accurate mattress size visualization matching your brand
export const TwinMattressIcon = ({ className }: { className?: string }) => (
  <svg width="70" height="90" viewBox="0 0 70 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Twin - 39"×75" proportions (narrow and tall) */}
    <rect 
      x="10" y="5" width="50" height="80" rx="8" 
      fill="url(#twinGradient)" 
      stroke="#3b82f6" 
      strokeWidth="2"
    />
    <defs>
      <linearGradient id="twinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
    </defs>
  </svg>
);

export const FullMattressIcon = ({ className }: { className?: string }) => (
  <svg width="95" height="90" viewBox="0 0 95 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Full - 54"×75" proportions (wider than twin) */}
    <rect 
      x="5" y="5" width="85" height="80" rx="8" 
      fill="url(#fullGradient)" 
      stroke="#3b82f6" 
      strokeWidth="2"
    />
    <defs>
      <linearGradient id="fullGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
    </defs>
  </svg>
);

export const QueenMattressIcon = ({ className }: { className?: string }) => (
  <svg width="110" height="95" viewBox="0 0 110 95" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Queen - 60"×80" proportions (standard rectangle) */}
    <rect 
      x="5" y="5" width="100" height="85" rx="8" 
      fill="url(#queenGradient)" 
      stroke="#3b82f6" 
      strokeWidth="2"
    />
    <defs>
      <linearGradient id="queenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
    </defs>
  </svg>
);

export const KingMattressIcon = ({ className }: { className?: string }) => (
  <svg width="130" height="95" viewBox="0 0 130 95" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* King - 76"×80" proportions (widest) */}
    <rect 
      x="5" y="5" width="120" height="85" rx="8" 
      fill="url(#kingGradient)" 
      stroke="#3b82f6" 
      strokeWidth="2"
    />
    <defs>
      <linearGradient id="kingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
    </defs>
  </svg>
);

// Size data with clean, minimal descriptions
export const mattressSizes = [
  {
    id: 'Twin',
    name: 'Twin',
    dimensions: '38" × 75"',
    description: 'Kids or small spaces',
    icon: TwinMattressIcon
  },
  {
    id: 'Full',
    name: 'Full',
    dimensions: '53" × 75"',
    description: 'Single adult',
    icon: FullMattressIcon
  },
  {
    id: 'Queen',
    name: 'Queen',
    dimensions: '60" × 80"',
    description: 'Most popular size',
    icon: QueenMattressIcon
  },
  {
    id: 'King',  
    name: 'King',
    dimensions: '76" × 80"',
    description: 'Luxury/master bedroom',
    icon: KingMattressIcon
  }
];