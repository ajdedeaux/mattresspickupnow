import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Star, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Store {
  name: string;
  address: string;
  phone?: string;
  distance?: number;
  rating?: number;
  placeId: string;
}

interface StoreResultsProps {
  stores: Store[];
  userLocation?: { lat: number; lng: number };
}

export function StoreResults({ stores, userLocation }: StoreResultsProps) {
  if (!stores || stores.length === 0) {
    return null;
  }

  const formatPhone = (phone?: string) => {
    if (!phone) return null;
    // Clean and format phone number
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const openDirections = (store: Store) => {
    const query = encodeURIComponent(store.address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    window.open(url, '_blank');
  };

  const callStore = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Found {stores.length} Mattress Firm Store{stores.length !== 1 ? 's' : ''} Near You
        </h3>
        <p className="text-sm text-gray-600">
          Click to call or get directions
        </p>
      </div>

      <div className="space-y-3">
        {stores.map((store, index) => (
          <Card key={store.placeId || index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {store.name}
                    </h4>
                    {store.rating && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                        <span>{store.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-1 mb-2">
                    <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 leading-tight">
                      {store.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {store.distance && (
                      <span className="font-medium text-green-600">
                        {store.distance.toFixed(1)} mi away
                      </span>
                    )}
                    {store.phone && (
                      <span>{formatPhone(store.phone)}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {store.phone && (
                    <Button
                      size="sm"
                      onClick={() => callStore(store.phone!)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDirections(store)}
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Directions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}