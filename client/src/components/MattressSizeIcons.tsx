import React from 'react';

// Compact, proportionally accurate mattress size visualization
export const TwinMattressIcon = ({ className }: { className?: string }) => (
  <svg width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Twin - 39"×75" proportions (narrow and tall) */}
    <rect 
      x="8" y="4" width="24" height="44" rx="4" 
      fill="url(#twinGradient)" 
      stroke="#3b82f6" 
      strokeWidth="1.5"
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
  <svg width="54" height="50" viewBox="0 0 54 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Full - 54"×75" proportions (wider than twin) */}
    <rect 
      x="4" y="4" width="46" height="42" rx="4" 
      fill="url(#fullGradient)" 
      stroke="#3b82f6" 
      strokeWidth="1.5"
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
  <svg width="60" height="52" viewBox="0 0 60 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Queen - 60"×80" proportions (standard rectangle) */}
    <rect 
      x="4" y="4" width="52" height="44" rx="4" 
      fill="url(#queenGradient)" 
      stroke="#3b82f6" 
      strokeWidth="1.5"
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
  <svg width="72" height="52" viewBox="0 0 72 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* King - 76"×80" proportions (widest) */}
    <rect 
      x="4" y="4" width="64" height="44" rx="4" 
      fill="url(#kingGradient)" 
      stroke="#3b82f6" 
      strokeWidth="1.5"
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