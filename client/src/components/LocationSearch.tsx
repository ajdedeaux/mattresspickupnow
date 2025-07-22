import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Store {
  name: string;
  address: string;
  phone?: string;
  distance?: number;
  rating?: number;
  placeId: string;
}

interface LocationSearchProps {
  onStoresFound: (stores: Store[]) => void;
  onLocationResolved: (coordinates: { lat: number; lng: number }) => void;
}

export function LocationSearch({ onStoresFound, onLocationResolved }: LocationSearchProps) {
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingGeolocation, setIsUsingGeolocation] = useState(false);
  const { toast } = useToast();

  const resolveLocationAndFindStores = async (lat?: number, lng?: number, zip?: string) => {
    setIsLoading(true);
    
    try {
      // Step 1: Resolve location to coordinates
      const locationPayload = lat && lng 
        ? { lat, lng }
        : { zip };

      const locationResponse = await fetch('/api/resolve-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationPayload),
      });

      const locationResult = await locationResponse.json();
      
      if (!locationResult.success) {
        toast({
          title: "Location Error",
          description: locationResult.message || "Could not resolve location",
          variant: "destructive"
        });
        return;
      }

      onLocationResolved(locationResult.coordinates);

      // Step 2: Find nearby stores
      const storesResponse = await fetch('/api/nearby-stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationResult.coordinates),
      });

      const storesResult = await storesResponse.json();
      
      if (!storesResult.success) {
        toast({
          title: "Store Search Error", 
          description: storesResult.message || "Could not find nearby stores",
          variant: "destructive"
        });
        return;
      }

      onStoresFound(storesResult.stores);
      
      toast({
        title: "Stores Found",
        description: `Found ${storesResult.count} Mattress Firm stores near you`
      });

    } catch (error) {
      console.error('Location search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to search for stores. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsUsingGeolocation(false);
    }
  };

  const handleZipSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) {
      toast({
        title: "ZIP Code Required",
        description: "Please enter a ZIP code to search for stores",
        variant: "destructive"
      });
      return;
    }
    resolveLocationAndFindStores(undefined, undefined, zipCode.trim());
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services",
        variant: "destructive"
      });
      return;
    }

    setIsUsingGeolocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolveLocationAndFindStores(latitude, longitude);
      },
      (error) => {
        setIsUsingGeolocation(false);
        let message = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }

        toast({
          title: "Location Error",
          description: message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <form onSubmit={handleZipSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Enter ZIP code (e.g. 33607)"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !zipCode.trim()}>
          {isLoading && !isUsingGeolocation ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      <div className="text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleUseMyLocation}
        disabled={isLoading}
      >
        {isUsingGeolocation ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Getting your location...
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4 mr-2" />
            Use My Location
          </>
        )}
      </Button>
    </div>
  );
}