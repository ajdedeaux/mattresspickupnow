import React from 'react';

// Clean, minimal mattress size visualization showing dimensions only
export const TwinMattressIcon = ({ className = "w-16 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Twin - Small rectangle (narrow and tall) */}
    <rect x="20" y="8" width="24" height="32" rx="2" fill="#f8fafc" stroke="#3b82f6" strokeWidth="2"/>
  </svg>
);

export const FullMattressIcon = ({ className = "w-16 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Full - Smaller square-ish */}
    <rect x="16" y="10" width="32" height="28" rx="2" fill="#f8fafc" stroke="#3b82f6" strokeWidth="2"/>
  </svg>
);

export const QueenMattressIcon = ({ className = "w-16 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Queen - Larger rectangle */}
    <rect x="8" y="8" width="48" height="32" rx="2" fill="#f8fafc" stroke="#3b82f6" strokeWidth="2"/>
  </svg>
);

export const KingMattressIcon = ({ className = "w-16 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* King - Big square */}
    <rect x="4" y="6" width="56" height="36" rx="2" fill="#f8fafc" stroke="#3b82f6" strokeWidth="2"/>
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