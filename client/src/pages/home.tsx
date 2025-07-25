import { useState, useEffect } from 'react';
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
  Calendar,
  CalendarDays,
  Shield,
  DollarSign,
  Car
} from 'lucide-react';
import { mattressSizes } from '@/components/MattressSizeIcons';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useCustomerProfile } from '@/contexts/CustomerProfileContext';

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
const CustomerQuoteRotator = () => {
  return (
    <div className="text-center mt-8 pt-6 border-t border-gray-100 space-y-4">
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-3">
        <span>⭐⭐⭐⭐⭐</span>
        <span>4.9/5</span>
        <span>•</span>
        <span>2,000+ customers</span>
      </div>
      
      {/* Static premium quote */}
      <div className="px-6 py-4">
        <p className="text-gray-700 italic text-base leading-relaxed mb-2 max-w-sm mx-auto">
          "We didn't have to shop around—we found exactly what we needed on the first visit!"
        </p>
        <p className="text-gray-500 text-sm font-medium">
          — Verified Customer
        </p>
      </div>
    </div>
  );
};

const LocationStep = ({ onLocationFound, isLoading }: { 
  onLocationFound: (stores: Store[], coordinates: { lat: number; lng: number }, zipCode?: string) => void;
  isLoading: boolean;
}) => {
  const [zipCode, setZipCode] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const { toast } = useToast();

  const handleZipSubmit = async (zipToSubmit = zipCode) => {
    if (zipToSubmit.length !== 5) return;

    setAutoSubmitting(true);

    try {
      // Add realistic search delay to show system is working
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // First resolve ZIP to coordinates
      const locationResponse = await fetch('/api/resolve-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip: zipToSubmit })
      });
      
      const locationData = await locationResponse.json();
      
      if (!locationData.success) {
        toast({ title: 'Could not find that ZIP code', variant: 'destructive' });
        return;
      }

      // Then find nearby stores
      const storesResponse = await fetch('/api/nearby-stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData.coordinates)
      });
      
      const storesData = await storesResponse.json();
      
      if (storesData.success && storesData.stores.length > 0) {
        onLocationFound(storesData.stores, locationData.coordinates, zipToSubmit);
      } else {
        toast({ title: 'No stores found', description: 'No pickup locations found in that area' });
      }
    } catch (error) {
      toast({ title: 'Error finding stores', variant: 'destructive' });
    } finally {
      setAutoSubmitting(false);
    }
  };

  // Auto-submit when ZIP code is complete
  const handleZipChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 5);
    setZipCode(cleanValue);
    
    // Auto-submit when ZIP is complete
    if (cleanValue.length === 5) {
      handleZipSubmit(cleanValue);
    }
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
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Try it. Like it. Buy it.
        </h2>
        
        {/* Simplified trust badges with generous spacing */}
        {!inputFocused && (
          <div className="mb-8 transition-opacity duration-300">
            <div className="flex justify-center items-center space-x-6 mb-6">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                <span>Same-day</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Car className="w-3 h-3" />
                <span>Fits in your car</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Shield className="w-3 h-3" />
                <span>120-night trial</span>
              </div>
            </div>
            <p className="text-gray-700 font-medium">Find a location nearby</p>
          </div>
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
          <Input
            type="text"
            inputMode="numeric"
            value={zipCode}
            onChange={(e) => handleZipChange(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Enter ZIP code"
            className="h-12 text-center text-lg border-2 border-blue-300 rounded-xl focus:border-blue-500"
            disabled={gpsLoading || autoSubmitting}
            maxLength={5}
          />
          
          {/* Only show loading state when actually submitting */}
          {autoSubmitting && (
            <div className="text-center">
              <div className="flex items-center justify-center text-blue-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-sm">Finding options near {zipCode}...</span>
              </div>
            </div>
          )}
          

        </div>
      </div>

      {/* Clean rotating customer quote */}
      {!inputFocused && !autoSubmitting && (
        <CustomerQuoteRotator />
      )}

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
    <div className="space-y-4">
      {/* Compact Success Header */}
      {storeCount && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-3 shadow-lg mb-3">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <CheckCircle className="w-5 h-5" />
            <span className="text-lg font-bold">Perfect!</span>
          </div>
          <div className="text-sm font-semibold">Found {storeCount} pickup locations nearby</div>
          <div className="text-green-100 text-xs">Let's understand your preferences to help narrow things down</div>
        </div>
      )}
      
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Who is this mattress for?</h2>
        <p className="text-gray-600 text-sm">This helps us recommend the perfect fit</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {useCases.map((useCase) => (
          <Card 
            key={useCase.id} 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300 hover:scale-105"
            onClick={() => onSelect(useCase.id)}
          >
            <CardContent className="p-4 text-center">
              <useCase.icon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="font-semibold text-gray-900 text-sm">{useCase.label}</div>
              <div className="text-xs text-gray-500 mt-1">{useCase.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SizeStep = ({ onSelect }: { onSelect: (size: string) => void }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What size mattress do you need?</h2>
        <p className="text-gray-600">All sizes available for same-day pickup</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {mattressSizes.map((size) => {
          const IconComponent = size.icon;
          return (
            <Card 
              key={size.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
              onClick={() => onSelect(size.name)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <IconComponent />
                </div>
                <div className="font-bold text-lg text-gray-900">{size.name}</div>
                <div className="text-sm text-gray-600 mt-1">{size.dimensions}</div>
                <div className="text-xs text-gray-500 mt-2">{size.description}</div>
              </CardContent>
            </Card>
          );
        })}
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
    const newExpandedCard = expandedCard === comfortId ? null : comfortId;
    setExpandedCard(newExpandedCard);
    
    // If expanding a card, smoothly position it for optimal viewing
    if (newExpandedCard) {
      setTimeout(() => {
        const cardElement = document.getElementById(`comfort-card-${comfortId}`);
        if (cardElement) {
          cardElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 150); // Brief delay to allow card expansion animation
    }
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
            id={`comfort-card-${comfort.id}`}
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

const ConfirmationStep = ({ userData, onSMSOption, onEmailOption, onFormOption }: {
  userData: UserData;
  onSMSOption: () => void;
  onEmailOption: () => void;
  onFormOption: () => void;
}) => {
  const nearestStore = userData.nearestStores[0];
  const [isFlipped, setIsFlipped] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  
  // Auto-play video once on component mount
  useEffect(() => {
    if (!hasPlayedOnce) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
        setIsVideoPlaying(true);
        setHasPlayedOnce(true);
      }, 500); // Small delay for smooth entry
      
      return () => clearTimeout(timer);
    }
  }, [hasPlayedOnce]);
  
  return (
    <div className="space-y-4">
      {/* Simplified Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ready to get your mattress?</h2>
      </div>

      {/* Compact Video Section */}
      <div className="rounded-xl overflow-hidden mb-4 w-72 mx-auto">
        <div className="w-full h-80 relative perspective-1000">
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
            {/* Front Side - Premium Design */}
            <div className="absolute inset-0 w-full h-full backface-hidden rounded-lg overflow-hidden group hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
              <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white flex flex-col items-center justify-center text-center p-6 relative" style={{ boxShadow: '0 12px 40px rgba(66, 133, 244, 0.3)' }}>
                <div className="text-lg font-semibold mb-2 opacity-95" style={{ letterSpacing: '-0.3px' }}>
                  No truck? No problem.
                </div>
                <div className="text-2xl font-bold mb-4" style={{ letterSpacing: '-0.5px' }}>
                  Fits in a Prius.
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-2 border-white border-opacity-30" style={{ backdropFilter: 'blur(10px)' }}>
                  <div className="text-white text-xl ml-1">▶</div>
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
                        // Auto-flip back after video ends to save bandwidth
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
                  <source src="/attached_assets/Fits_in_a_prius_1753467502826.mp4" type="video/mp4" />
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



      {/* Contact Options - Ultra-Clean Layout with Breathing Room */}
      <div className="flex justify-center space-x-12 pt-8">
        {/* Call */}
        <button 
          onClick={() => window.open(`tel:${nearestStore?.phone || '+18135550100'}`, '_self')}
          className="flex flex-col items-center group transition-all duration-200 transform hover:scale-110 active:scale-95"
        >
          <div className="w-20 h-20 bg-green-600 hover:bg-green-700 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-all duration-200"
               style={{ boxShadow: '0 8px 25px rgba(34, 197, 94, 0.25)' }}>
            <Phone className="w-8 h-8 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900 mb-1">Call</span>
          <span className="text-xs text-green-600 font-medium">Now</span>
        </button>

        {/* Text */}
        <button 
          onClick={onSMSOption}
          className="flex flex-col items-center group transition-all duration-200 transform hover:scale-110 active:scale-95"
        >
          <div className="w-20 h-20 bg-blue-600 hover:bg-blue-700 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-all duration-200"
               style={{ boxShadow: '0 8px 25px rgba(37, 99, 235, 0.25)' }}>
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900 mb-1">Text</span>
          <span className="text-xs text-blue-600 font-medium">1 min</span>
        </button>

        {/* Email */}
        <button 
          onClick={onEmailOption}
          className="flex flex-col items-center group transition-all duration-200 transform hover:scale-110 active:scale-95"
        >
          <div className="w-20 h-20 bg-gray-600 hover:bg-gray-700 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-all duration-200"
               style={{ boxShadow: '0 8px 25px rgba(75, 85, 99, 0.25)' }}>
            <Mail className="w-8 h-8 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900 mb-1">Email</span>
          <span className="text-xs text-gray-600 font-medium">5 min</span>
        </button>
      </div>
    </div>
  );
};

const SMSStep = ({ userData, onBack }: { userData: UserData; onBack: () => void }) => {
  const [userName, setUserName] = useState('');
  const [urgency, setUrgency] = useState('');
  const [currentStep, setCurrentStep] = useState<'name' | 'urgency' | 'send'>('name');
  const [hasStartedInput, setHasStartedInput] = useState(false);
  const nearestStore = userData.nearestStores[0];
  
  // Auto-advance to next step when name is entered (with longer delay)
  useEffect(() => {
    if (userName && userName.length >= 2 && currentStep === 'name') {
      const timer = setTimeout(() => setCurrentStep('urgency'), 1500);
      return () => clearTimeout(timer);
    }
  }, [userName, currentStep]);
  
  // Auto-advance to send when urgency is selected
  useEffect(() => {
    if (urgency && currentStep === 'urgency') {
      const timer = setTimeout(() => setCurrentStep('send'), 1000);
      return () => clearTimeout(timer);
    }
  }, [urgency, currentStep]);
  
  // Generate final message for sending with SMART DATA
  const generateFinalMessage = () => {
    const comfortType = userData.comfort || 'Medium';
    const mattressSize = userData.size || 'Queen';
    
    // Smart location logic - using nearest store for location context
    const getLocationText = () => {
      if (nearestStore?.address) {
        // Extract city from store address (assumes format: "123 Main St, Tampa, FL 33607")
        const addressParts = nearestStore.address.split(', ');
        if (addressParts.length >= 2) {
          return `in the ${addressParts[1]} area`;
        }
      }
      return 'in your area';
    };
    
    // Smart product description with CORRECT pricing matrix
    const getProductDescription = () => {
      const getPriceBySize = (comfortType: string, size: string) => {
        const priceMatrix = {
          'Twin': { 'Firm': '$199', 'Medium': '$249', 'Soft': '$449', 'Hybrid': '$349' },
          'Full': { 'Firm': '$249', 'Medium': '$299', 'Soft': '$549', 'Hybrid': '$399' },
          'Queen': { 'Firm': '$299', 'Medium': '$399', 'Soft': '$699', 'Hybrid': '$499' },
          'King': { 'Firm': '$449', 'Medium': '$549', 'Soft': '$899', 'Hybrid': '$699' }
        };
        
        return priceMatrix[size as keyof typeof priceMatrix]?.[comfortType as keyof typeof priceMatrix['Twin']] || '$399';
      };
      
      const price = getPriceBySize(comfortType, mattressSize);
      return `${mattressSize} ${comfortType} for ${price}`;
    };
    
    const urgencyMap = {
      'today': 'today',
      'tomorrow': 'tomorrow', 
      'week': 'this week'
    };
    
    const timingText = urgency ? urgencyMap[urgency as keyof typeof urgencyMap] : 'soon';
    
    return `Hi! My name is ${userName} and I'm ${getLocationText()}. I just used your mattress finder and I'm interested in the ${getProductDescription()}. I'd like to come try it ${timingText} and buy it if it's right for me. Can you help me find the best pickup location? Please get back to me right away, I'm ready to move forward!`;
  };
  
  const handleSendMessage = () => {
    if (!userName || !urgency) {
      return;
    }
    
    const finalMessage = generateFinalMessage();
    navigator.clipboard.writeText(finalMessage);
    const phoneNumber = nearestStore?.phone?.replace(/\D/g, '') || '';
    window.open(`sms:${phoneNumber}?body=${encodeURIComponent(finalMessage)}`);
  };

  // SMART DYNAMIC message builder with PRE-POPULATED data highlighting
  const renderLiveMessage = () => {
    const comfortType = userData.comfort || 'Medium';
    const mattressSize = userData.size || 'Queen';
    
    // Smart location logic - using nearest store for location context
    const getLocationText = () => {
      if (nearestStore?.address) {
        // Extract city from store address (assumes format: "123 Main St, Tampa, FL 33607")
        const addressParts = nearestStore.address.split(', ');
        if (addressParts.length >= 2) {
          return `in the ${addressParts[1]} area`;
        }
      }
      return 'in your area';
    };
    
    // Smart product description with CORRECT pricing matrix
    const getProductDescription = () => {
      const getPriceBySize = (comfortType: string, size: string) => {
        const priceMatrix = {
          'Twin': { 'Firm': '$199', 'Medium': '$249', 'Soft': '$449', 'Hybrid': '$349' },
          'Full': { 'Firm': '$249', 'Medium': '$299', 'Soft': '$549', 'Hybrid': '$399' },
          'Queen': { 'Firm': '$299', 'Medium': '$399', 'Soft': '$699', 'Hybrid': '$499' },
          'King': { 'Firm': '$449', 'Medium': '$549', 'Soft': '$899', 'Hybrid': '$699' }
        };
        
        return priceMatrix[size as keyof typeof priceMatrix]?.[comfortType as keyof typeof priceMatrix['Twin']] || '$399';
      };
      
      const price = getPriceBySize(comfortType, mattressSize);
      return `${mattressSize} ${comfortType} for ${price}`;
    };
    
    const urgencyMap = {
      'today': 'today',
      'tomorrow': 'tomorrow', 
      'week': 'this week'
    };
    
    const timingText = urgency ? urgencyMap[urgency as keyof typeof urgencyMap] : '[WHEN]';
    
    return (
      <span className="text-gray-700 leading-relaxed">
        Hi! My name is{' '}
        <span 
          className={`transition-all duration-500 font-medium ${
            userName 
              ? 'bg-blue-100 text-blue-900 px-2 py-1 rounded-md shadow-sm' 
              : 'text-gray-400 italic bg-gray-100 px-2 py-1 rounded-md'
          }`}
        >
          {userName || '[YOUR NAME]'}
        </span>
        {' '}and I'm{' '}
        <span className="font-semibold text-gray-900 bg-yellow-100 px-2 py-1 rounded-md">
          {getLocationText()}
        </span>
        . I just used your mattress finder and I'm interested in{' '}
        <span className="font-semibold text-gray-900 bg-yellow-100 px-2 py-1 rounded-md">
          the {getProductDescription()}
        </span>
        . I'd like to come try it{' '}
        <span 
          className={`transition-all duration-500 font-medium ${
            urgency 
              ? 'bg-green-100 text-green-900 px-2 py-1 rounded-md shadow-sm' 
              : 'text-gray-400 italic bg-gray-100 px-2 py-1 rounded-md'
          }`}
        >
          {timingText}
        </span>
        {' '}and buy it if it's right for me. Can you help me find the best pickup location? Please get back to me right away, I'm ready to move forward!
      </span>
    );
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Message Builder - Premium Design */}
      <div className="px-4 pt-6 pb-4 bg-gray-50">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="font-semibold text-gray-800 text-sm tracking-wide">Building Your Message</div>
                <div className="flex-1"></div>
                {(userName || urgency) && (
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-700 font-semibold animate-pulse">Live</span>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-md">
                <div className="text-sm leading-relaxed text-gray-800 font-medium">
                  "{renderLiveMessage()}"
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Content Area */}
      <div className="px-4 pb-20">
          {currentStep === 'name' && !hasStartedInput && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  What's your name?
                </h2>
                <p className="text-gray-600 text-base">Let's personalize your message</p>
              </div>
              
              <div className="max-w-sm mx-auto space-y-4">
                <Button
                  onClick={() => setHasStartedInput(true)}
                  className="w-full h-14 rounded-xl text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                >
                  Enter your name
                </Button>
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Watch it build above</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'name' && hasStartedInput && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  What's your name?
                </h2>
                <p className="text-gray-600 text-base">Let's personalize your message</p>
              </div>
              
              <div className="max-w-sm mx-auto space-y-3">
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your first name"
                  className="text-center text-lg h-14 rounded-xl border-2 border-blue-200 focus:border-blue-500 bg-white transition-all duration-200"
                  autoFocus
                />
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Watch it build above</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'urgency' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  When do you need this?
                </h2>
                <p className="text-gray-600 text-base">Help us prioritize your request</p>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'today', label: 'Today', desc: 'ASAP - highest priority', icon: Clock },
                  { id: 'tomorrow', label: 'Tomorrow', desc: 'Next day pickup', icon: Calendar },
                  { id: 'week', label: 'This week', desc: 'Within a few days', icon: CalendarDays }
                ].map((option) => (
                  <button
                  key={option.id}
                  type="button"
                  onClick={() => setUrgency(option.id)}
                  className={`w-full p-3 rounded-xl border transition-all duration-200 transform hover:scale-[1.01] ${
                    urgency === option.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md' 
                      : 'border-gray-200 hover:border-blue-200 hover:shadow-sm bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      urgency === option.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <option.icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'send' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">Perfect! Your message is ready</h3>
              <p className="text-gray-600 text-base max-w-sm mx-auto">
                Your personalized message has been crafted and is ready to send
              </p>
            </div>
            
            <div className="space-y-4 max-w-sm mx-auto">
              <Button 
                onClick={handleSendMessage}
                className="w-full h-16 rounded-xl text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transform hover:scale-[1.02] transition-all duration-200 shadow-xl"
                style={{ 
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)'
                }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Send Message Now
              </Button>
              
              <Button 
                onClick={() => {
                  setCurrentStep('name');
                  setUserName('');
                  setUrgency('');
                  setHasStartedInput(false);
                }}
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700 text-base py-3 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                ← Edit message
              </Button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

const FormStep = ({ userData, onSubmit, isLoading, onBack }: { 
  userData: UserData; 
  onSubmit: (contactInfo: any) => void;
  isLoading: boolean;
  onBack: () => void;
}) => {
  const [urgencyLevel, setUrgencyLevel] = useState('');
  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      urgency: '',
      notes: ''
    }
  });

  const handleUrgencyChange = (value: string) => {
    setUrgencyLevel(value);
    form.setValue('urgency', value);
  };

  const handleSubmit = (data: any) => {
    onSubmit({ ...data, urgency: urgencyLevel });
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Get your mattress details</h2>
        <p className="text-gray-600 text-sm">We'll email you within 15 minutes</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 font-medium">Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your name" disabled={isLoading} className="h-10" />
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
                  <Input {...field} placeholder="your@email.com" type="email" disabled={isLoading} className="h-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 font-medium">Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(555) 123-4567" disabled={isLoading} className="h-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Urgency Level - Key Addition */}
          <div className="space-y-2">
            <label className="text-gray-900 font-medium text-sm">How soon do you need this?</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleUrgencyChange('today')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  urgencyLevel === 'today' 
                    ? 'border-red-500 bg-red-50 text-red-900' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Today/Tomorrow</div>
                <div className="text-xs text-gray-600">I need this ASAP</div>
              </button>
              <button
                type="button"
                onClick={() => handleUrgencyChange('week')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  urgencyLevel === 'week' 
                    ? 'border-blue-500 bg-blue-50 text-blue-900' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">This week</div>
                <div className="text-xs text-gray-600">Within the next few days</div>
              </button>
              <button
                type="button"
                onClick={() => handleUrgencyChange('flexible')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  urgencyLevel === 'flexible' 
                    ? 'border-green-500 bg-green-50 text-green-900' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">I'm flexible</div>
                <div className="text-xs text-gray-600">Just browsing options</div>
              </button>
            </div>
            
            {/* Urgent Customer Redirect */}
            {urgencyLevel === 'today' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-orange-800">
                  <span className="font-medium">Need it today?</span> For faster service, call or text us instead - we'll respond immediately!
                </p>
                <button
                  type="button"
                  onClick={onBack}
                  className="text-orange-700 underline text-sm mt-1 hover:text-orange-800"
                >
                  Go back to call/text options
                </button>
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 font-medium">Special requests? <span className="text-gray-500 font-normal">(Optional)</span></FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Preferred pickup time, delivery needs, etc." disabled={isLoading} className="min-h-[60px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isLoading || !urgencyLevel}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send My Mattress Match
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

const EmailStep = ({ userData, onBack }: { userData: UserData; onBack: () => void }) => {
  const [userName, setUserName] = useState('');
  const [urgency, setUrgency] = useState('');
  const [currentStep, setCurrentStep] = useState<'name' | 'urgency' | 'send'>('name');
  const [hasStartedInput, setHasStartedInput] = useState(false);
  const nearestStore = userData.nearestStores[0];
  
  // Auto-advance to next step when name is entered
  useEffect(() => {
    if (userName && userName.length >= 2 && currentStep === 'name' && hasStartedInput) {
      const timer = setTimeout(() => setCurrentStep('urgency'), 1500);
      return () => clearTimeout(timer);
    }
  }, [userName, currentStep, hasStartedInput]);
  
  // Auto-advance to send when urgency is selected
  useEffect(() => {
    if (urgency && currentStep === 'urgency') {
      const timer = setTimeout(() => setCurrentStep('send'), 1000);
      return () => clearTimeout(timer);
    }
  }, [urgency, currentStep]);
  
  // Generate email content with dynamic data from funnel
  const generateEmailContent = () => {
    const comfortType = userData.comfort || 'Medium';
    const mattressSize = userData.size || 'Queen';
    
    // Smart location logic - using nearest store for location context
    const getLocationText = () => {
      if (nearestStore?.address) {
        // Extract city from store address (assumes format: "123 Main St, Tampa, FL 33607")
        const addressParts = nearestStore.address.split(', ');
        if (addressParts.length >= 2) {
          return `in the ${addressParts[1]} area`;
        }
      }
      return 'in your area';
    };
    
    const getProductDescription = () => {
      const getPriceBySize = (comfortType: string, size: string) => {
        const priceMatrix = {
          'Twin': { 'Firm': '$199', 'Medium': '$249', 'Soft': '$449', 'Hybrid': '$349' },
          'Full': { 'Firm': '$249', 'Medium': '$299', 'Soft': '$549', 'Hybrid': '$399' },
          'Queen': { 'Firm': '$299', 'Medium': '$399', 'Soft': '$699', 'Hybrid': '$499' },
          'King': { 'Firm': '$449', 'Medium': '$549', 'Soft': '$899', 'Hybrid': '$699' }
        };
        
        return priceMatrix[size as keyof typeof priceMatrix]?.[comfortType as keyof typeof priceMatrix['Twin']] || '$399';
      };
      
      const price = getPriceBySize(comfortType, mattressSize);
      return `${mattressSize} ${comfortType} mattress for ${price}`;
    };
    
    const urgencyMap = {
      'today': 'today',
      'tomorrow': 'tomorrow', 
      'week': 'this week'
    };
    
    const timingText = urgency ? urgencyMap[urgency as keyof typeof urgencyMap] : 'soon';
    
    const subject = `Mattress Inquiry - ${getProductDescription()}`;
    const body = `Hi there!

My name is ${userName} and I'm ${getLocationText()}. I just used your mattress finder and I'm interested in the ${getProductDescription()} that's available for same-day pickup.

I'd like to come try it ${timingText} and buy it if it's right for me. Could you please send me:
- Store location and hours
- Availability confirmation  
- Any current promotions
- Best time to visit and try it out

I'm ready to make a decision quickly if it's the right fit!

Thank you,
${userName}`;

    return { subject, body };
  };
  
  const handleSendEmail = () => {
    if (!userName || !urgency) return;
    
    const { subject, body } = generateEmailContent();
    const storeEmail = 'info@mattresspickupnow.com';
    
    const mailtoLink = `mailto:${storeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  // Live email preview with DYNAMIC DATA from funnel
  const renderLiveEmail = () => {
    const comfortType = userData.comfort || 'Medium';
    const mattressSize = userData.size || 'Queen';
    
    // Smart location logic - using nearest store for location context
    const getLocationText = () => {
      if (nearestStore?.address) {
        // Extract city from store address (assumes format: "123 Main St, Tampa, FL 33607")
        const addressParts = nearestStore.address.split(', ');
        if (addressParts.length >= 2) {
          return `in the ${addressParts[1]} area`;
        }
      }
      return 'in your area';
    };
    
    const getProductDescription = () => {
      const getPriceBySize = (comfortType: string, size: string) => {
        const priceMatrix = {
          'Twin': { 'Firm': '$199', 'Medium': '$249', 'Soft': '$449', 'Hybrid': '$349' },
          'Full': { 'Firm': '$249', 'Medium': '$299', 'Soft': '$549', 'Hybrid': '$399' },
          'Queen': { 'Firm': '$299', 'Medium': '$399', 'Soft': '$699', 'Hybrid': '$499' },
          'King': { 'Firm': '$449', 'Medium': '$549', 'Soft': '$899', 'Hybrid': '$699' }
        };
        
        return priceMatrix[size as keyof typeof priceMatrix]?.[comfortType as keyof typeof priceMatrix['Twin']] || '$399';
      };
      
      const price = getPriceBySize(comfortType, mattressSize);
      return `${mattressSize} ${comfortType} mattress for ${price}`;
    };

    const urgencyMap = {
      'today': 'today',
      'tomorrow': 'tomorrow', 
      'week': 'this week'
    };
    
    const timingText = urgency ? urgencyMap[urgency as keyof typeof urgencyMap] : '[WHEN]';

    return (
      <div className="text-sm text-gray-700 leading-snug">
        {/* Super Compact Header - Single Line */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-gray-600">
          <div className="flex gap-1">
            <span className="font-semibold">To:</span>
            <span className="text-blue-600">info@mattresspickupnow.com</span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold">Subject:</span>
            <span className="text-gray-800">Mattress Inquiry - {getProductDescription()}</span>
          </div>
        </div>
        
        {/* Ultra-Compact Email Body */}
        <div className="border-t pt-2 space-y-2">
          <div>Hi there! My name is{' '}
            <span 
              className={`transition-all duration-500 font-medium ${
                userName 
                  ? 'bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded shadow-sm' 
                  : 'text-gray-400 italic bg-gray-100 px-1.5 py-0.5 rounded cursor-pointer hover:bg-gray-200 hover:scale-105'
              }`}
              onClick={() => {
                if (!userName) {
                  setCurrentStep('name');
                  setHasStartedInput(true);
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 100);
                }
              }}
            >
              {userName || '[YOUR NAME]'}
            </span>
            {' '}and I'm{' '}
            <span className="font-semibold text-gray-900 bg-yellow-100 px-1.5 py-0.5 rounded">
              {getLocationText()}
            </span>
            . I just used your mattress finder and I'm interested in{' '}
            <span className="font-semibold text-gray-900 bg-yellow-100 px-1.5 py-0.5 rounded">
              the {getProductDescription()}
            </span>
            {' '}that's available for same-day pickup.
          </div>
          
          <div>I'd like to come try it{' '}
            <span 
              className={`transition-all duration-500 font-medium ${
                urgency 
                  ? 'bg-green-100 text-green-900 px-1.5 py-0.5 rounded shadow-sm' 
                  : 'text-gray-400 italic bg-gray-100 px-1.5 py-0.5 rounded cursor-pointer hover:bg-gray-200 hover:scale-105'
              }`}
              onClick={() => {
                if (!urgency) {
                  setCurrentStep('urgency');
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 100);
                }
              }}
            >
              {timingText}
            </span>
            {' '}and buy it if it's right for me. Could you please send me: store location/hours, availability confirmation, current promotions, and best time to visit?
          </div>
          
          <div>I'm ready to make a decision quickly if it's the right fit! Thank you,{' '}
            <span 
              className={`transition-all duration-500 font-medium ${
                userName 
                  ? 'bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded shadow-sm' 
                  : 'text-gray-400 italic bg-gray-100 px-1.5 py-0.5 rounded cursor-pointer hover:bg-gray-200 hover:scale-105'
              }`}
              onClick={() => {
                if (!userName) {
                  setCurrentStep('name');
                  setHasStartedInput(true);
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 100);
                }
              }}
            >
              {userName || '[YOUR NAME]'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Email Builder Preview */}
      <div className="px-4 pt-6 pb-4 bg-gray-50">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="font-semibold text-gray-800 text-sm tracking-wide">Building Your Email</div>
              <div className="flex-1"></div>
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-semibold animate-pulse">Live</span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-md">
              {renderLiveEmail()}
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Content Area */}
      <div className="px-4 pb-20">
        {currentStep === 'name' && !hasStartedInput && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                What's your name?
              </h2>
              <p className="text-gray-600 text-base">Let's personalize your email</p>
            </div>
            
            <div className="max-w-sm mx-auto space-y-4">
              <Button
                onClick={() => setHasStartedInput(true)}
                className="w-full h-14 rounded-xl text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
              >
                Enter your name
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Watch it build above</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'name' && hasStartedInput && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                What's your name?
              </h2>
              <p className="text-gray-600 text-base">Let's personalize your email</p>
            </div>
            
            <div className="max-w-sm mx-auto space-y-3">
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your first name"
                className="text-center text-lg h-14 rounded-xl border-2 border-blue-200 focus:border-blue-500 bg-white transition-all duration-200"
                autoFocus
              />
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Watch it build above</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'urgency' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                When do you need this?
              </h2>
              <p className="text-gray-600 text-base">Help us prioritize your request</p>
            </div>
            <div className="space-y-3">
              {[
                { id: 'today', label: 'Today', desc: 'ASAP - highest priority', icon: Clock },
                { id: 'tomorrow', label: 'Tomorrow', desc: 'Next day pickup', icon: Calendar },
                { id: 'week', label: 'This week', desc: 'Within a few days', icon: CalendarDays }
              ].map((option) => (
                <button
                key={option.id}
                type="button"
                onClick={() => setUrgency(option.id)}
                className={`w-full p-3 rounded-xl border transition-all duration-200 transform hover:scale-[1.01] ${
                  urgency === option.id 
                    ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md' 
                    : 'border-gray-200 hover:border-blue-200 hover:shadow-sm bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    urgency === option.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <option.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-base">{option.label}</div>
                    <div className="text-sm opacity-70">{option.desc}</div>
                  </div>
                </div>
              </button>
            ))}
            </div>
          </div>
        )}

        {currentStep === 'send' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Perfect! Your email is ready
              </h2>
              <p className="text-gray-600 text-base">Your personalized message has been crafted and is ready to send</p>
            </div>
            
            <div className="max-w-sm mx-auto space-y-4">
              <Button
                onClick={handleSendEmail}
                className="w-full h-14 rounded-xl text-lg font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35), 0 3px 10px rgba(0,0,0,0.1)'
                }}
              >
                <Mail className="w-5 h-5 mr-2" />
                Send Email
              </Button>
              
              <Button
                onClick={() => {
                  setCurrentStep('name');
                  setUserName('');
                  setUrgency('');
                  setHasStartedInput(false);
                }}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Edit message
              </Button>
            </div>
          </div>
        )}
      </div>
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
  
  // Customer profile tracking for N8N automation
  const { profile, updateProfile, generateReferenceCode } = useCustomerProfile();

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

  const handleLocationFound = async (stores: Store[], coordinates: { lat: number; lng: number }, zipCode?: string) => {
    setUserSelections(prev => ({ ...prev, nearestStores: stores, coordinates }));
    
    // Track ZIP code and location in customer profile
    try {
      await updateProfile({
        zipCode: zipCode || null,
        coordinates,
        nearestStores: stores
      });
    } catch (error) {
      console.warn('Failed to update profile with location data:', error);
    }
    
    setCurrentStep(2);
  };

  const handleUseCaseSelect = async (useCase: string) => {
    setUserSelections(prev => ({ ...prev, useCase }));
    
    // Track demographics/use case in customer profile
    try {
      await updateProfile({
        demographics: useCase
      });
    } catch (error) {
      console.warn('Failed to update profile with use case:', error);
    }
    
    setCurrentStep(3);
  };

  const handleSizeSelect = async (size: string) => {
    setUserSelections(prev => ({ ...prev, size }));
    
    // Track mattress size in customer profile
    try {
      await updateProfile({
        mattressSize: size
      });
    } catch (error) {
      console.warn('Failed to update profile with size:', error);
    }
    
    setCurrentStep(4);
  };

  const handleComfortSelect = async (comfort: string) => {
    setUserSelections(prev => ({ ...prev, comfort }));
    
    // Track firmness preference and calculate pricing
    const mattressOptions = [
      { id: "F", name: "Firm", sizes: { "Twin": "$199", "Full": "$249", "Queen": "$299", "King": "$349" } },
      { id: "M", name: "Medium", sizes: { "Twin": "$299", "Full": "$349", "Queen": "$399", "King": "$449" } },
      { id: "S", name: "Soft", sizes: { "Twin": "$497", "Full": "$597", "Queen": "$697", "King": "$797" } },
      { id: "H", name: "Hybrid", sizes: { "Twin": "$399", "Full": "$449", "Queen": "$499", "King": "$549" } }
    ];
    
    const selectedOption = mattressOptions.find(opt => opt.id === comfort);
    const price = selectedOption?.sizes[userSelections.size as keyof typeof selectedOption.sizes] || "Contact for pricing";
    const model = `${userSelections.size} ${selectedOption?.name || comfort}`;
    
    try {
      await updateProfile({
        firmness: comfort,
        model,
        finalPrice: price
      });
    } catch (error) {
      console.warn('Failed to update profile with comfort selection:', error);
    }
    
    setCurrentStep(5);
  };

  const handleFormSubmit = async (contactInfo: any) => {
    try {
      // Update customer profile with contact information and method
      await updateProfile({
        name: contactInfo.name,
        contactMethod: 'form'
      });
      
      // Generate reference code for N8N automation
      const referenceCode = await generateReferenceCode();
      
      const finalData = {
        ...userSelections,
        contactInfo,
        leadSource: 'web',
        referenceCode, // Include reference code for tracking
        trackingId: profile?.trackingId // Include tracking ID
      };
      
      submitLead.mutate(finalData);
    } catch (error) {
      console.error('Failed to process form submission:', error);
      toast({ 
        title: 'Error', 
        description: 'Something went wrong processing your request. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const goBack = () => {
    // Handle proper back navigation logic
    if (currentStep === 8) {
      // From email form, go back to confirmation/contact options
      setCurrentStep(5);
    } else if (currentStep === 6) {
      // From SMS step, go back to confirmation/contact options  
      setCurrentStep(5);
    } else if (currentStep === 7) {
      // From success screen, shouldn't have back button but if clicked, restart
      setCurrentStep(1);
    } else if (currentStep > 1) {
      // Normal sequential back navigation for main flow (steps 1-5)
      setCurrentStep(currentStep - 1);
    }
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

  // Wrapper functions to track contact method selection
  const handleSMSOption = async () => {
    try {
      await updateProfile({ contactMethod: 'text' });
    } catch (error) {
      console.warn('Failed to update profile with SMS contact method:', error);
    }
    setCurrentStep(6);
  };

  const handleEmailOption = async () => {
    try {
      await updateProfile({ contactMethod: 'email' });
    } catch (error) {
      console.warn('Failed to update profile with email contact method:', error);
    }
    setCurrentStep(8);
  };

  const handleFormOption = async () => {
    try {
      await updateProfile({ contactMethod: 'form' });
    } catch (error) {
      console.warn('Failed to update profile with form contact method:', error);
    }
    setCurrentStep(9);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">MattressPickupNow</h1>
            <p className="text-base text-gray-600">Why wait? Get it today.</p>
          </div>
          {currentStep > 1 && currentStep !== 7 && (
            <Button onClick={goBack} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>
      </header>

      {/* Progress indicator - Only show for steps 1-4 */}
      {currentStep <= 4 && (
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="max-w-md mx-auto px-6">
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
            onSMSOption={handleSMSOption}
            onEmailOption={handleEmailOption}
            onFormOption={handleFormOption}
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
          <EmailStep userData={userSelections} onBack={() => setCurrentStep(5)} />
        )}
        
        {currentStep === 9 && (
          <FormStep 
            userData={userSelections} 
            onSubmit={handleFormSubmit}
            isLoading={submitLead.isPending}
            onBack={() => setCurrentStep(5)}
          />
        )}
      </main>
    </div>
  );
}