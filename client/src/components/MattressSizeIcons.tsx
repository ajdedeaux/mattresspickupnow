import React from 'react';

// Mattress size visualization components matching your brand aesthetic
export const TwinMattressIcon = ({ className = "w-20 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Mattress outline */}
    <rect x="10" y="8" width="60" height="48" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
    
    {/* Child figure */}
    <g transform="translate(40, 20)">
      {/* Head */}
      <circle cx="0" cy="0" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
      {/* Body */}
      <rect x="-8" y="4" width="16" height="20" rx="8" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
      {/* Arms */}
      <circle cx="-12" cy="10" r="3" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
      <circle cx="12" cy="10" r="3" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
      {/* Legs */}
      <circle cx="-6" cy="28" r="3" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
      <circle cx="6" cy="28" r="3" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
    </g>
    
    {/* Dimension labels */}
    <text x="40" y="4" textAnchor="middle" className="text-xs fill-gray-500" fontSize="8">38" × 75"</text>
  </svg>
);

export const FullMattressIcon = ({ className = "w-20 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Mattress outline - slightly wider */}
    <rect x="6" y="8" width="68" height="48" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
    
    {/* Teenager figure */}
    <g transform="translate(40, 20)">
      {/* Head */}
      <circle cx="0" cy="0" r="7" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
      {/* Body */}
      <rect x="-10" y="6" width="20" height="24" rx="10" fill="#34d399" stroke="#10b981" strokeWidth="1"/>
      {/* Arms */}
      <circle cx="-15" cy="14" r="4" fill="#34d399" stroke="#10b981" strokeWidth="1"/>
      <circle cx="15" cy="14" r="4" fill="#34d399" stroke="#10b981" strokeWidth="1"/>
      {/* Legs */}
      <circle cx="-7" cy="34" r="4" fill="#34d399" stroke="#10b981" strokeWidth="1"/>
      <circle cx="7" cy="34" r="4" fill="#34d399" stroke="#10b981" strokeWidth="1"/>
    </g>
    
    {/* Small room indicator */}
    <text x="40" y="4" textAnchor="middle" className="text-xs fill-gray-500" fontSize="8">53" × 75"</text>
    <text x="40" y="62" textAnchor="middle" className="text-xs fill-gray-400" fontSize="6">Small Room</text>
  </svg>
);

export const QueenMattressIcon = ({ className = "w-20 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Mattress outline - standard width */}
    <rect x="4" y="8" width="72" height="48" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
    
    {/* Two adults */}
    <g transform="translate(26, 20)">
      {/* Adult 1 - Head */}
      <circle cx="0" cy="0" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
      {/* Body */}
      <rect x="-8" y="5" width="16" height="22" rx="8" fill="#f87171" stroke="#ef4444" strokeWidth="1"/>
      {/* Arms */}
      <circle cx="-12" cy="12" r="3" fill="#f87171" stroke="#ef4444" strokeWidth="1"/>
      <circle cx="12" cy="12" r="3" fill="#f87171" stroke="#ef4444" strokeWidth="1"/>
      {/* Legs */}
      <circle cx="-6" cy="30" r="3" fill="#f87171" stroke="#ef4444" strokeWidth="1"/>
      <circle cx="6" cy="30" r="3" fill="#f87171" stroke="#ef4444" strokeWidth="1"/>
    </g>
    
    <g transform="translate(54, 20)">
      {/* Adult 2 - Head */}
      <circle cx="0" cy="0" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
      {/* Body */}
      <rect x="-8" y="5" width="16" height="22" rx="8" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="1"/>
      {/* Arms */}
      <circle cx="-12" cy="12" r="3" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="1"/>
      <circle cx="12" cy="12" r="3" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="1"/>
      {/* Legs */}
      <circle cx="-6" cy="30" r="3" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="1"/>
      <circle cx="6" cy="30" r="3" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="1"/>
    </g>
    
    {/* Small cat */}
    <g transform="translate(40, 45)">
      <ellipse cx="0" cy="0" rx="4" ry="2" fill="#64748b" stroke="#475569" strokeWidth="0.5"/>
      <circle cx="-2" cy="-1" r="1" fill="#64748b"/>
      <circle cx="2" cy="-1" r="1" fill="#64748b"/>
    </g>
    
    <text x="40" y="4" textAnchor="middle" className="text-xs fill-gray-500" fontSize="8">60" × 80"</text>
    <text x="40" y="62" textAnchor="middle" className="text-xs fill-gray-400" fontSize="6">Standard</text>
  </svg>
);

export const KingMattressIcon = ({ className = "w-20 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Mattress outline - widest */}
    <rect x="2" y="8" width="76" height="48" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
    
    {/* Two adults with more space */}
    <g transform="translate(20, 18)">
      {/* Adult 1 - Head */}
      <circle cx="0" cy="0" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
      {/* Body */}
      <rect x="-8" y="5" width="16" height="22" rx="8" fill="#f87171" stroke="#ef4444" strokeWidth="1"/>
      {/* Arms */}
      <circle cx="-12" cy="12" r="3" fill="#f87171" stroke="#ef4444" strokeWidth="1"/>
      <circle cx="12" cy="12" r="3" fill="#f87171" stroke="#ef4444" strokeWidth="1"/>
      {/* Legs */}
      <circle cx="-6" cy="30" r="3" fill="#f87171" stroke="#ef4444" strokeWidth="1"/>
      <circle cx="6" cy="30" r="3" fill="#f87171" stroke="#ef4444" strokeWidth="1"/>
    </g>
    
    <g transform="translate(60, 18)">
      {/* Adult 2 - Head */}
      <circle cx="0" cy="0" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
      {/* Body */}
      <rect x="-8" y="5" width="16" height="22" rx="8" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="1"/>
      {/* Arms */}
      <circle cx="-12" cy="12" r="3" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="1"/>
      <circle cx="12" cy="12" r="3" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="1"/>
      {/* Legs */}
      <circle cx="-6" cy="30" r="3" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="1"/>
      <circle cx="6" cy="30" r="3" fill="#a78bfa" stroke="#8b5cf6" strokeWidth="1"/>
    </g>
    
    {/* Child in middle */}
    <g transform="translate(40, 25)">
      {/* Head */}
      <circle cx="0" cy="0" r="4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
      {/* Body */}
      <rect x="-5" y="3" width="10" height="14" rx="5" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
      {/* Arms */}
      <circle cx="-8" cy="8" r="2" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
      <circle cx="8" cy="8" r="2" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
      {/* Legs */}
      <circle cx="-4" cy="20" r="2" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
      <circle cx="4" cy="20" r="2" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1"/>
    </g>
    
    {/* Small dog at foot */}
    <g transform="translate(40, 50)">
      <ellipse cx="0" cy="0" rx="5" ry="3" fill="#d97706" stroke="#b45309" strokeWidth="0.5"/>
      <circle cx="-3" cy="-2" r="1.5" fill="#d97706"/>
      <circle cx="3" cy="-2" r="1.5" fill="#d97706"/>
      <path d="M-6,-1 L-8,-3 M6,-1 L8,-3" stroke="#b45309" strokeWidth="0.5"/>
    </g>
    
    <text x="40" y="4" textAnchor="middle" className="text-xs fill-gray-500" fontSize="8">76" × 80"</text>
    <text x="40" y="62" textAnchor="middle" className="text-xs fill-gray-400" fontSize="6">Master Bedroom</text>
  </svg>
);

// Size data with your specifications
export const mattressSizes = [
  {
    id: 'Twin',
    name: 'Twin',
    dimensions: '38" × 75"',
    description: 'Child/Toddler',
    icon: TwinMattressIcon,
    details: 'Perfect for children and small bedrooms'
  },
  {
    id: 'Full',
    name: 'Full',
    dimensions: '53" × 75"',
    description: 'Teen/Small Room',
    icon: FullMattressIcon,
    details: 'Ideal for teenagers or compact spaces'
  },
  {
    id: 'Queen',
    name: 'Queen',
    dimensions: '60" × 80"',
    description: '2 Adults (Cozy)',
    icon: QueenMattressIcon,
    details: 'Standard size for couples'
  },
  {
    id: 'King',
    name: 'King',
    dimensions: '76" × 80"',
    description: 'Family Size',
    icon: KingMattressIcon,
    details: 'Maximum comfort for couples with room for family'
  }
];