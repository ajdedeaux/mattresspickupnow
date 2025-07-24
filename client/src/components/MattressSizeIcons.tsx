import React from 'react';
import { Bed } from 'lucide-react';

// Simple, clean bed icons that your girl prefers
export const TwinMattressIcon = ({ className }: { className?: string }) => (
  <Bed className={`w-12 h-12 text-blue-600 ${className}`} />
);

export const FullMattressIcon = ({ className }: { className?: string }) => (
  <Bed className={`w-12 h-12 text-blue-600 ${className}`} />
);

export const QueenMattressIcon = ({ className }: { className?: string }) => (
  <Bed className={`w-12 h-12 text-blue-600 ${className}`} />
);

export const KingMattressIcon = ({ className }: { className?: string }) => (
  <Bed className={`w-12 h-12 text-blue-600 ${className}`} />
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