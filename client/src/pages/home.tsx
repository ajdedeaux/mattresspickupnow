import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  MapPin, 
  Navigation, 
  User, 
  Baby, 
  Home as HomeIcon, 
  GraduationCap, 
  Building, 
  MoreHorizontal, 
  Bed, 
  Phone, 
  MessageSquare, 
  MessageCircle,
  Mail,
  Check,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Clock,
  Shield,
  DollarSign
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Types
interface Store {
  name: string;
  phone: string;
  address: string;
  distance: number;
}

interface UserData {
  useCase: string;
  size: string;
  comfort: string;
  coordinates: { lat: number; lng: number };
  nearestStores: Store[];
  contactInfo?: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
  };
}

// Form schemas
const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional()
});

// Step components
const LocationStep = ({ onLocationFound, isLoading }: { 
  onLocationFound: (stores: Store[], coordinates: { lat: number; lng: number }) => void;
  isLoading: boolean;
}) => {
  const [zipCode, setZipCode] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const { toast } = useToast();

  const handleZipSubmit = async () => {
    if (zipCode.length !== 5) {
      toast({ title: 'Please enter a valid 5-digit ZIP code', variant: 'destructive' });
      return;
    }

    setAutoSubmitting(true);

    try {
      // Add intentional delay for better UX - makes it feel like we're working hard
      await new Promise(resolve => setTimeout(resolve, 1500));

      // First resolve ZIP to coordinates
      const locationResponse = await fetch('/api/resolve-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip: zipCode })
      });
      
      const locationData = await locationResponse.json();
      
      if (!locationData.success) {
        toast({ title: 'Could not find that ZIP code', variant: 'destructive' });
        return;
      }

      // Add another small delay before finding stores
      await new Promise(resolve => setTimeout(resolve, 800));

      // Then find nearby stores
      const storesResponse = await fetch('/api/nearby-stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData.coordinates)
      });
      
      const storesData = await storesResponse.json();
      
      if (storesData.success && storesData.stores.length > 0) {
        onLocationFound(storesData.stores, locationData.coordinates);
        // Green celebration banner will show success - no popup needed
      } else {
        toast({ title: 'No stores found', description: 'No pickup locations found in that area' });
      }
    } catch (error) {
      toast({ title: 'Error finding stores', variant: 'destructive' });
    } finally {
      setAutoSubmitting(false);
    }
  };

  // Just handle ZIP input changes - no auto-submit
  const handleZipChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 5);
    setZipCode(cleanValue);
  };

  const handleGPSLocation = async () => {
    setGpsLoading(true);
    
    if (!navigator.geolocation) {
      toast({ title: 'Location not supported', description: 'Please enter your ZIP code instead' });
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Add intentional delay for better UX - makes it feel like we're working hard
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          const response = await fetch('/api/nearby-stores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude })
          });
          
          const data = await response.json();
          
          // Add another small delay before showing results
          await new Promise(resolve => setTimeout(resolve, 600));
          
          if (data.success && data.stores.length > 0) {
            onLocationFound(data.stores, { lat: latitude, lng: longitude });
            // Green celebration banner will show success - no popup needed
          } else {
            toast({ title: 'No stores found', description: 'No pickup locations found in your area' });
          }
        } catch (error) {
          toast({ title: 'Error finding stores', variant: 'destructive' });
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        toast({ title: 'Location access denied', description: 'Please enter your ZIP code instead' });
        setGpsLoading(false);
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Let's find your pickup location</h2>
        {!inputFocused && (
          <p className="text-gray-600 transition-opacity duration-300">More precise location = closer pickup options</p>
        )}
      </div>

      <div className="space-y-4">
        <Button 
          onClick={handleGPSLocation}
          disabled={gpsLoading || isLoading}
          className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              {gpsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
            </div>
            <div className="text-left">
              <div className="font-semibold">
                {gpsLoading ? (
                  <span className="animate-pulse">Scanning your area...</span>
                ) : (
                  'Use current location'
                )}
              </div>
              <div className="text-sm text-blue-100">Find nearest options right now</div>
            </div>
          </div>
        </Button>

        {!inputFocused && (
          <div className="relative transition-opacity duration-300">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              value={zipCode}
              onChange={(e) => handleZipChange(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Enter ZIP code"
              className="h-12 text-center text-lg border-2 border-blue-300 rounded-xl focus:border-blue-500"
              disabled={gpsLoading || isLoading}
              maxLength={5}
            />
            {zipCode.length > 0 && zipCode.length < 5 && !autoSubmitting && (
              <div className="absolute -bottom-8 left-0 right-0 text-center text-sm text-gray-500">
                {5 - zipCode.length} more digit{5 - zipCode.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {/* Show progress indicator when typing */}
          {zipCode.length > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 transition-all duration-300">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(zipCode.length / 5) * 100}%` }}
              />
            </div>
          )}

          {/* ZIP complete feedback and search button */}
          {zipCode.length === 5 && (
            <>
              <div className="text-center">
                <div className="text-sm text-green-600 flex items-center justify-center mb-3">
                  <Check className="w-4 h-4 mr-1" />
                  <span>ZIP code complete</span>
                </div>
              </div>
              
              <Button 
                onClick={handleZipSubmit}
                disabled={gpsLoading || autoSubmitting}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                {autoSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="animate-pulse">Finding options near {zipCode}...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Find pickup locations
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bottom spacing to keep content visible above keyboard */}
      <div className="h-20"></div>
    </div>
  );
};

const UseCaseStep = ({ onSelect, storeCount }: { onSelect: (useCase: string) => void; storeCount?: number }) => {
  const useCases = [
    { id: 'me', label: 'Me', icon: User, description: 'Personal mattress' },
    { id: 'child', label: 'My Child', icon: Baby, description: 'Kids bedroom' },
    { id: 'guest', label: 'Guest Room', icon: HomeIcon, description: 'Visitors' },
    { id: 'dorm', label: 'Dorm Room', icon: GraduationCap, description: 'College' },
    { id: 'airbnb', label: 'Airbnb', icon: Building, description: 'Rental property' },
    { id: 'other', label: 'Other', icon: MoreHorizontal, description: 'Something else' }
  ];

  return (
    <div className="space-y-6">
      {/* Exciting Success Header */}
      {storeCount && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <CheckCircle className="w-8 h-8" />
            <span className="text-2xl font-bold">Perfect!</span>
          </div>
          <div className="text-lg font-semibold">Found {storeCount} pickup locations nearby</div>
          <div className="text-green-100 text-sm mt-1">Let's understand your preferences to help narrow things down</div>
        </div>
      )}
      
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Who is this mattress for?</h2>
        <p className="text-gray-600">This helps us recommend the perfect fit</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {useCases.map((useCase) => (
          <Card 
            key={useCase.id} 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300 hover:scale-105"
            onClick={() => onSelect(useCase.id)}
          >
            <CardContent className="p-6 text-center">
              <useCase.icon className="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div className="font-semibold text-gray-900">{useCase.label}</div>
              <div className="text-sm text-gray-500 mt-1">{useCase.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SizeStep = ({ onSelect }: { onSelect: (size: string) => void }) => {
  const sizes = [
    { id: 'twin', label: 'Twin', dimensions: '39" × 75"', description: 'Kids or small spaces' },
    { id: 'full', label: 'Full', dimensions: '54" × 75"', description: 'Single adult' },
    { id: 'queen', label: 'Queen', dimensions: '60" × 80"', description: 'Most popular size' },
    { id: 'king', label: 'King', dimensions: '76" × 80"', description: 'Luxury/master bedroom' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What size mattress do you need?</h2>
        <p className="text-gray-600">All sizes available for same-day pickup</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sizes.map((size) => (
          <Card 
            key={size.id}
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
            onClick={() => onSelect(size.label)}
          >
            <CardContent className="p-6 text-center">
              <Bed className="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <div className="font-bold text-lg text-gray-900">{size.label}</div>
              <div className="text-sm text-gray-600 mt-1">{size.dimensions}</div>
              <div className="text-xs text-gray-500 mt-2">{size.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ComfortStep = ({ onSelect, selectedSize }: { onSelect: (comfort: string) => void; selectedSize?: string }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Pricing structure based on size and comfort type
  const getPricing = (comfort: string, size: string = 'Queen') => {
    const pricingMatrix: Record<string, Record<string, string>> = {
      'Firm': { Twin: '$199.99', Full: '$269.99', Queen: '$299.99', King: '$369.99' },
      'Medium': { Twin: '$249.99', Full: '$359.99', Queen: '$399.99', King: '$469.99' },
      'Hybrid': { Twin: '$399.99', Full: '$449.99', Queen: '$499.99', King: '$599.99' },
      'Soft': { Twin: '$549.99', Full: '$649.99', Queen: '$699.99', King: '$799.99' }
    };
    return pricingMatrix[comfort]?.[size] || pricingMatrix[comfort]?.['Queen'] || '$399.99';
  };

  // Mattress height data
  const getHeight = (comfort: string) => {
    const heights: Record<string, string> = {
      'Firm': '8"',
      'Medium': '10"', 
      'Hybrid': '10"',
      'Soft': '12"'
    };
    return heights[comfort] || '10"';
  };

  const comforts = [
    { 
      id: 'firm', 
      label: 'Firm', 
      description: 'Perfect for back & stomach sleepers',
      rating: '4.7/5',
      reviews: '1,834',
      brand: 'Sealy Memory Foam Firm',
      specs: {
        benefits: ['Premium spinal alignment and support', 'Brand new with full warranty', 'Try in store before you buy'],
        availability: 'Ready for pickup now'
      }
    },
    { 
      id: 'medium', 
      label: 'Medium', 
      description: 'Our most popular choice - works for everyone',
      popular: true,
      rating: '4.8/5',
      reviews: '2,847',
      brand: 'Sealy Memory Foam Medium',
      specs: {
        benefits: ['Perfect balance of comfort and support', 'Best seller nationwide', 'Same mattress others wait weeks for'],
        availability: 'Ready for pickup now'
      }
    },
    { 
      id: 'hybrid', 
      label: 'Hybrid', 
      description: 'Best of both worlds - coil support + foam comfort',
      rating: '4.5/5',
      reviews: '978',
      brand: 'Basic Hybrid',
      specs: {
        benefits: ['Traditional coil support with memory foam', 'Maximum breathability for hot sleepers', 'Responsive bounce with contouring'],
        availability: 'Ready for pickup now'
      }
    },
    { 
      id: 'soft', 
      label: 'Soft', 
      description: 'Ideal for side sleepers',
      rating: '4.6/5',
      reviews: '1,592',
      brand: 'Sealy Memory Foam Soft',
      specs: {
        benefits: ['Superior pressure point relief', 'Gel-infused cooling technology', 'Perfect for hip and shoulder comfort'],
        availability: 'Ready for pickup now'
      }
    }
  ];

  const handleCardClick = (comfortId: string) => {
    // Only expand/collapse cards, don't select
    setExpandedCard(expandedCard === comfortId ? null : comfortId);
  };

  const handleSelectClick = (comfortId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card expansion
    const comfort = comforts.find(c => c.id === comfortId);
    if (comfort) onSelect(comfort.label);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">How do you like your mattress to feel?</h2>
        <p className="text-gray-500">Tap to see details</p>
      </div>

      <div className="space-y-3">
        {comforts.map((comfort) => (
          <Card 
            key={comfort.id}
            className={`cursor-pointer transition-all duration-200 relative ${
              expandedCard === comfort.id 
                ? 'border-2 border-blue-500 shadow-lg' 
                : comfort.popular 
                  ? 'border-2 border-blue-400 shadow-md' 
                  : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => handleCardClick(comfort.id)}
          >
            {/* Most Popular Flag */}
            {comfort.popular && (
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
                Most Popular
              </div>
            )}
            
            <CardContent className={`transition-all duration-200 ${expandedCard === comfort.id ? 'p-6' : 'p-4'}`}>
              {/* Clean compact view */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{comfort.label}</h3>
                  <p className="text-gray-600 text-sm">{comfort.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xl font-semibold text-gray-900">{getPricing(comfort.label, selectedSize)}</div>
                  <div className="text-xs text-gray-500">{selectedSize || 'Queen'} size</div>
                </div>
              </div>

              {/* Premium expanded view */}
              {expandedCard === comfort.id && (
                <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                  {/* Brand and ratings with premium styling */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-blue-900">{comfort.brand}</h4>
                    <div className="flex items-center">
                      <span className="text-yellow-500 text-sm">⭐⭐⭐⭐⭐</span>
                      <span className="text-sm text-blue-700 ml-2">{comfort.rating} ({comfort.reviews} reviews)</span>
                    </div>
                  </div>

                  {/* Premium specs grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <div className="font-medium text-blue-800">Height</div>
                      <div className="text-blue-900 font-semibold">{getHeight(comfort.label)} thick</div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <div className="font-medium text-blue-800">Car Fit</div>
                      <div className="text-blue-900 font-semibold">✓ Back seat</div>
                    </div>
                  </div>

                  {/* Premium benefits list */}
                  <div>
                    <div className="font-medium text-blue-800 mb-2">Key Benefits:</div>
                    <div className="space-y-1">
                      {comfort.specs.benefits.slice(0, 3).map((benefit, idx) => (
                        <div key={idx} className="flex items-start text-sm">
                          <span className="text-green-600 mr-2 mt-0.5">✓</span>
                          <span className="text-blue-800">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Premium call to action button */}
                  <button 
                    onClick={(e) => handleSelectClick(comfort.id, e)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-lg text-center transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="font-semibold">Tap to select this mattress</div>
                    <div className="text-xs text-blue-100">Available for pickup today</div>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ConfirmationStep = ({ userData, onSMSOption, onFormOption }: {
  userData: UserData;
  onSMSOption: () => void;
  onFormOption: () => void;
}) => {
  const nearestStore = userData.nearestStores[0];
  const [isFlipped, setIsFlipped] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Urgency Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Available today
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's get you loaded up</h2>
        <p className="text-blue-600 font-semibold text-lg">Try it. Like it. Buy it.</p>
        <p className="text-gray-600 text-sm">Fits in a Prius — Problem Solved</p>
      </div>

      {/* Interactive Flip Card */}
      <div className="rounded-xl overflow-hidden mb-6">
        <div className="w-full aspect-video relative perspective-1000">
          <div 
            className={`w-full h-full relative transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            onClick={() => {
              if (!isFlipped) {
                setIsFlipped(true);
                setTimeout(() => setIsVideoPlaying(true), 350);
              }
            }}
          >
            {/* Front Side - Custom Design */}
            <div className="absolute inset-0 w-full h-full backface-hidden rounded-lg overflow-hidden group hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
              <div className="w-full h-full bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 text-white flex flex-col items-center justify-center text-center p-6 relative">
                <div className="text-2xl font-bold mb-2 tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  A MATTRESS in a PRIUS?
                </div>
                <div className="text-4xl mb-4">
                  🤔🤔🤔
                </div>
                <div className="text-base font-semibold opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                  Tap to see the proof
                </div>
                <div className="absolute inset-0 ring-2 ring-transparent group-hover:ring-blue-400/50 rounded-lg transition-all duration-300"></div>
              </div>
            </div>
            
            {/* Back Side - Video */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gray-900 rounded-lg overflow-hidden">
              {isVideoPlaying ? (
                <video 
                  ref={(video) => {
                    if (video && isVideoPlaying) {
                      video.play().catch(() => {});
                      video.onended = () => {
                        setTimeout(() => {
                          setIsFlipped(false);
                          setIsVideoPlaying(false);
                        }, 500);
                      };
                    }
                  }}
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/fits-in-prius-video.mp4" type="video/mp4" />
                </video>
              ) : (
                <div className="absolute inset-0 bg-blue-600 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Bed className="w-12 h-12 mx-auto mb-2" />
                    <p className="font-semibold">Queen mattress pickup</p>
                    <p className="text-sm opacity-90">It really does fit</p>
                  </div>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  setIsVideoPlaying(false);
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all duration-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Trust Signals */}
      <div className="flex justify-center space-x-4 mb-6">
        {/* Same Day Pickup - Immediate Fulfillment */}
        <div className="flex flex-col items-center">
          <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg transform hover:scale-105 transition-transform duration-200">
            {/* Simple Clock Icon */}
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-900">Same day pickup</p>
        </div>
        
        {/* 120-Night Trial - Peace of Mind */}
        <div className="flex flex-col items-center">
          <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg transform hover:scale-105 transition-transform duration-200">
            {/* Simple Calendar with 120 */}
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <text x="12" y="17" fontSize="6" textAnchor="middle" fill="currentColor" fontWeight="bold">120</text>
            </svg>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-gray-900 text-xs font-bold">✓</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-900">120-night trial</p>
        </div>
        
        {/* Price Match - Low Price Guarantee */}
        <div className="flex flex-col items-center">
          <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg transform hover:scale-105 transition-transform duration-200">
            {/* Simple Receipt/Price Tag Icon */}
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2V4a2 2 0 0 0-2-2z"/>
              <line x1="9" y1="9" x2="9" y2="13"/>
              <line x1="7" y1="11" x2="11" y2="11"/>
            </svg>
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">$</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-900">Price match guarantee</p>
        </div>
      </div>

      {/* Contact Options - Clean Premium Design */}
      <div className="space-y-4">
        {/* Primary - Call (Green) */}
        <button 
          onClick={() => window.open(`tel:${nearestStore?.phone || '+18135550100'}`, '_self')}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-5 px-6 font-medium transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-0.5"
          style={{ 
            boxShadow: '0 6px 20px rgba(34, 197, 94, 0.25), 0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div className="text-center">
            <div className="text-base font-semibold">Give us a call</div>
            <div className="text-sm opacity-90 mt-1">Get all your questions answered in one quick call</div>
          </div>
        </button>

        {/* Secondary - Text (Blue) */}
        <button 
          onClick={onSMSOption}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 px-6 font-medium transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-0.5"
          style={{ 
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.25), 0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div className="text-center">
            <div className="text-base font-semibold">Shoot us a text</div>
            <div className="text-sm opacity-90 mt-1">Quick & easy - we'll respond in under 1 minute</div>
          </div>
        </button>

        {/* Tertiary - Email (Gray) */}
        <button 
          onClick={onFormOption}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 rounded-xl py-5 px-6 font-medium transition-all duration-200 transform hover:scale-[1.01] hover:-translate-y-0.5 border border-gray-200 hover:border-gray-300"
          style={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div className="text-center">
            <div className="text-base font-semibold">Request more information</div>
            <div className="text-sm opacity-70 mt-1">Get details sent to your email right away</div>
          </div>
        </button>
      </div>
    </div>
  );
};

const SMSStep = ({ userData, onBack }: { userData: UserData; onBack: () => void }) => {
  const nearestStore = userData.nearestStores[0];
  const smsMessage = `Hey – here's what I'm looking for: ${userData.size}, ${userData.comfort}, for ${userData.useCase}. Can you help me find the best pickup nearby under $800?`;
  
  const handleCopyAndText = () => {
    navigator.clipboard.writeText(smsMessage);
    const phoneNumber = nearestStore?.phone?.replace(/\D/g, '') || '';
    window.open(`sms:${phoneNumber}?body=${encodeURIComponent(smsMessage)}`);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to text!</h2>
        <p className="text-gray-600">Here's your pre-filled message</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="font-semibold text-gray-900 mb-3">Message Preview:</div>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-700 italic">
            "{smsMessage}"
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="font-semibold text-gray-900">Text this to:</div>
            <div className="text-lg font-bold text-blue-600 mt-1">{nearestStore?.phone}</div>
            <div className="text-sm text-gray-500 mt-1">{nearestStore?.name}</div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button 
          onClick={handleCopyAndText}
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Copy & Text Now
        </Button>

        <Button 
          onClick={onBack}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to options
        </Button>
      </div>
    </div>
  );
};

const FormStep = ({ userData, onSubmit, isLoading }: { 
  userData: UserData; 
  onSubmit: (contactInfo: any) => void;
  isLoading: boolean;
}) => {
  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      notes: ''
    }
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfect! We'll email you.</h2>
        <p className="text-gray-600">Get your mattress match details via email within 15 minutes</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Email includes:</span> Store locations, pricing, pickup instructions, and direct contact info
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 font-medium">Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your name" disabled={isLoading} className="h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 font-medium">Email Address</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="your@email.com" type="email" disabled={isLoading} className="h-12" />
                </FormControl>
                <FormDescription>
                  We'll send your mattress details here within 15 minutes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 font-medium">Phone Number <span className="text-gray-500 font-normal">(Optional)</span></FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(555) 123-4567" disabled={isLoading} className="h-12" />
                </FormControl>
                <FormDescription>
                  For urgent questions or delivery coordination
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 font-medium">Special requests? <span className="text-gray-500 font-normal">(Optional)</span></FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Preferred pickup time, delivery needs, etc." disabled={isLoading} className="min-h-[80px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending your match...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Send My Mattress Match
              </>
            )}
          </Button>
          
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              You'll receive an email within 15 minutes with complete store details and pickup instructions
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
};

// Main component
export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userSelections, setUserSelections] = useState<UserData>({
    useCase: '',
    size: '',
    comfort: '',
    coordinates: { lat: 0, lng: 0 },
    nearestStores: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const submitLead = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/leads', 'POST', data);
    },
    onSuccess: () => {
      toast({ title: 'Success!', description: 'We\'ll text you within 15 minutes with your perfect match.' });
      setCurrentStep(7); // Success step
    },
    onError: () => {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    }
  });

  const handleLocationFound = (stores: Store[], coordinates: { lat: number; lng: number }) => {
    setUserSelections(prev => ({ ...prev, nearestStores: stores, coordinates }));
    setCurrentStep(2);
  };

  const handleUseCaseSelect = (useCase: string) => {
    setUserSelections(prev => ({ ...prev, useCase }));
    setCurrentStep(3);
  };

  const handleSizeSelect = (size: string) => {
    setUserSelections(prev => ({ ...prev, size }));
    setCurrentStep(4);
  };

  const handleComfortSelect = (comfort: string) => {
    setUserSelections(prev => ({ ...prev, comfort }));
    setCurrentStep(5);
  };

  const handleFormSubmit = (contactInfo: any) => {
    const finalData = {
      ...userSelections,
      contactInfo,
      leadSource: 'web'
    };
    
    submitLead.mutate(finalData);
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setUserSelections({
      useCase: '',
      size: '',
      comfort: '',
      coordinates: { lat: 0, lng: 0 },
      nearestStores: []
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">MattressPickupNow</h1>
            <p className="text-sm text-gray-600">Sleep on it tonight</p>
          </div>
          {currentStep > 1 && (
            <Button onClick={goBack} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>
      </header>

      {/* Progress indicator */}
      {currentStep <= 5 && (
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="max-w-md mx-auto px-6">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Step {currentStep} of 5</span>
              <button onClick={resetFlow} className="text-blue-600 hover:text-blue-700">
                Start over
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-md mx-auto px-6 py-8">
        {currentStep === 1 && (
          <LocationStep onLocationFound={handleLocationFound} isLoading={isLoading} />
        )}
        
        {currentStep === 2 && (
          <UseCaseStep onSelect={handleUseCaseSelect} storeCount={userSelections.nearestStores?.length} />
        )}
        
        {currentStep === 3 && (
          <SizeStep onSelect={handleSizeSelect} />
        )}
        
        {currentStep === 4 && (
          <ComfortStep onSelect={handleComfortSelect} selectedSize={userSelections.size} />
        )}
        
        {currentStep === 5 && (
          <ConfirmationStep 
            userData={userSelections}
            onSMSOption={() => setCurrentStep(6)}
            onFormOption={() => setCurrentStep(8)}
          />
        )}
        
        {currentStep === 6 && (
          <SMSStep userData={userSelections} onBack={() => setCurrentStep(5)} />
        )}
        
        {currentStep === 7 && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfect! We've got you covered.</h2>
              <p className="text-gray-600">
                Expect a text within 15 minutes with your exact mattress match and pickup details.
              </p>
            </div>
            <Button onClick={resetFlow} variant="outline" className="w-full">
              Help someone else find a mattress
            </Button>
          </div>
        )}
        
        {currentStep === 8 && (
          <FormStep 
            userData={userSelections} 
            onSubmit={handleFormSubmit}
            isLoading={submitLead.isPending}
          />
        )}
      </main>
    </div>
  );
}