import { Client } from '@googlemaps/google-maps-services-js';

interface MattressFirmLocation {
  name: string;
  address: string;
  phone?: string;
  hours?: string;
  distance?: number;
  rating?: number;
  placeId: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface LocationSearchResult {
  userLocation: string;
  userCoordinates?: {
    lat: number;
    lng: number;
  };
  mattressFirmStores: MattressFirmLocation[];
  timestamp: string;
}

export class GoogleMapsService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is required');
    }
  }

  async searchMattressFirmStores(location: string): Promise<LocationSearchResult> {
    try {
      // Step 1: Geocode the user's location to get coordinates
      const geocodeResponse = await this.client.geocode({
        params: {
          address: location,
          key: this.apiKey,
        },
      });

      let userCoordinates;
      if (geocodeResponse.data.results.length > 0) {
        userCoordinates = geocodeResponse.data.results[0].geometry.location;
      }

      // Step 2: Search for Mattress Firm stores near the location
      const searchQuery = `Mattress Firm near ${location}`;
      
      const placesResponse = await this.client.textSearch({
        params: {
          query: searchQuery,
          key: this.apiKey,
          radius: 25000, // 25km radius
          ...(userCoordinates && { location: userCoordinates }),
        },
      });

      // Step 3: Filter results to only include actual Mattress Firm stores
      const mattressFirmStores: MattressFirmLocation[] = [];

      for (const place of placesResponse.data.results) {
        // Only keep results that start with "Mattress Firm"
        if (place.name?.startsWith('Mattress Firm')) {
          // Get additional details for each store
          const placeDetails = await this.getPlaceDetails(place.place_id!);
          
          mattressFirmStores.push({
            name: place.name,
            address: place.formatted_address || '',
            phone: placeDetails.phone,
            hours: placeDetails.hours,
            distance: userCoordinates ? this.calculateDistance(
              userCoordinates.lat,
              userCoordinates.lng,
              place.geometry?.location?.lat || 0,
              place.geometry?.location?.lng || 0
            ) : undefined,
            rating: place.rating,
            placeId: place.place_id!,
            location: {
              lat: place.geometry?.location?.lat || 0,
              lng: place.geometry?.location?.lng || 0,
            },
          });
        }
      }

      // Sort by distance if coordinates are available
      if (userCoordinates) {
        mattressFirmStores.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      return {
        userLocation: location,
        userCoordinates,
        mattressFirmStores,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Error searching Mattress Firm stores:', error);
      throw new Error('Failed to search for nearby stores');
    }
  }

  private async getPlaceDetails(placeId: string) {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: ['formatted_phone_number', 'opening_hours'],
        },
      });

      const place = response.data.result;
      return {
        phone: place.formatted_phone_number,
        hours: place.opening_hours?.weekday_text?.join(', '),
      };
    } catch (error) {
      console.error('Error getting place details:', error);
      return { phone: undefined, hours: undefined };
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export type { LocationSearchResult, MattressFirmLocation };