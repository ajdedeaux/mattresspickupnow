import React, { useState } from 'react';
import { LocationSearch } from '@/components/LocationSearch';
import { StoreResults } from '@/components/StoreResults';

interface Store {
  name: string;
  address: string;
  phone?: string;
  distance?: number;
  rating?: number;
  placeId: string;
}

export function StoreLocatorPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleStoresFound = (foundStores: Store[]) => {
    setStores(foundStores);
  };

  const handleLocationResolved = (coordinates: { lat: number; lng: number }) => {
    setUserLocation(coordinates);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Find Your Nearest Mattress Firm
            </h1>
            <p className="text-lg text-gray-600">
              Locate stores near you and get directions
            </p>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <LocationSearch
              onStoresFound={handleStoresFound}
              onLocationResolved={handleLocationResolved}
            />
          </div>

          {/* Results Section */}
          {stores.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <StoreResults 
                stores={stores} 
                userLocation={userLocation || undefined} 
              />
            </div>
          )}

          {/* Help Text */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>
              Can't find what you're looking for? Call us at{' '}
              <a href="tel:1-800-MATTRESS" className="text-blue-600 hover:underline">
                1-800-MATTRESS
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}