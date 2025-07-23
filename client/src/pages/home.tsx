import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
  Check,
  CheckCircle,
  ArrowLeft,
  Loader2
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
  const { toast } = useToast();

  const handleZipSubmit = async () => {
    if (zipCode.length !== 5) {
      toast({ title: 'Please enter a valid 5-digit ZIP code', variant: 'destructive' });
      return;
    }

    try {
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
          
          const response = await fetch('/api/nearby-stores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude })
          });
          
          const data = await response.json();
          
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's find your pickup location</h2>
        <p className="text-gray-600">More precise location = closer pickup options</p>
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
                {gpsLoading ? 'Getting your location...' : 'Use current location'}
              </div>
              <div className="text-sm text-blue-100">Find nearest options right now</div>
            </div>
          </div>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Enter ZIP code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="h-12 text-center text-lg"
            disabled={isLoading}
          />
          <Button 
            onClick={handleZipSubmit}
            disabled={zipCode.length !== 5 || isLoading}
            variant="outline"
            className="w-full h-12"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Find pickup locations
          </Button>
        </div>
      </div>
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
          <div className="text-green-100 text-sm mt-1">You're in the right place - let's get you sleeping better tonight!</div>
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

const ComfortStep = ({ onSelect }: { onSelect: (comfort: string) => void }) => {
  const comforts = [
    { 
      id: 'firm', 
      label: 'Firm', 
      description: 'Dense, supportive feel with minimal sink',
      bestFor: 'Back & stomach sleepers'
    },
    { 
      id: 'medium', 
      label: 'Medium', 
      description: 'Balanced support and comfort – best seller',
      bestFor: 'Most popular choice',
      popular: true
    },
    { 
      id: 'plush', 
      label: 'Plush', 
      description: 'Soft, fluffy feel for pressure relief',
      bestFor: 'Side sleepers'
    },
    { 
      id: 'hybrid', 
      label: 'Hybrid', 
      description: 'Coil + foam combo for bounce and support',
      bestFor: 'Best of both worlds'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">How do you like your mattress to feel?</h2>
        <p className="text-gray-600">All comfort levels under $800 with pickup tonight</p>
      </div>

      <div className="space-y-3">
        {comforts.map((comfort) => (
          <Card 
            key={comfort.id}
            className={`cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300 ${comfort.popular ? 'ring-2 ring-blue-200' : ''}`}
            onClick={() => onSelect(comfort.label)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="font-bold text-lg text-gray-900">{comfort.label}</div>
                    {comfort.popular && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Most Popular</span>
                    )}
                  </div>
                  <div className="text-gray-600 mt-1">{comfort.description}</div>
                  <div className="text-sm text-blue-600 mt-2">{comfort.bestFor}</div>
                </div>
              </div>
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
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">You're in the right place</h2>
      </div>

      {/* Video - Clean Conversion Element */}
      <div className="rounded-xl overflow-hidden mb-8">
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover"
            poster="/video-thumbnail.jpg"
          >
            <source src="/fits-in-prius-video.mp4" type="video/mp4" />
            <div className="absolute inset-0 bg-blue-600 flex items-center justify-center">
              <div className="text-white text-center">
                <Bed className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Queen mattress pickup</p>
                <p className="text-sm opacity-90">It really does fit</p>
              </div>
            </div>
          </video>
        </div>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={() => window.open('tel:+18135550100', '_self')}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
        >
          Call for immediate help
        </Button>

        <Button 
          onClick={onSMSOption}
          variant="outline"
          className="w-full h-14 border-2 border-gray-300 hover:border-gray-400 rounded-lg font-semibold"
        >
          Text me the best match now
        </Button>

        <Button 
          onClick={onFormOption}
          variant="outline"
          className="w-full h-14 border-2 border-gray-300 hover:border-gray-400 rounded-lg font-semibold"
        >
          I need this faster
        </Button>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost done!</h2>
        <p className="text-gray-600">We'll text you the perfect match within 15 minutes</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your name" disabled={isLoading} />
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
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(555) 123-4567" disabled={isLoading} />
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
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="your@email.com" type="email" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Any specific needs? (Optional)</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Delivery timeframe, special requests, etc." disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Submit & Get My Match
              </>
            )}
          </Button>
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
            <h1 className="text-lg font-bold text-gray-900">MattressPickupNow</h1>
            <p className="text-xs text-gray-500">Sleep on it tonight</p>
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
          <ComfortStep onSelect={handleComfortSelect} />
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