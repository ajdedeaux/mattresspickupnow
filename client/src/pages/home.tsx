import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLeadSchema } from "@shared/schema";
import { formatPhoneNumber } from "@/lib/utils";
import { Car, Clock, Check, Star, Phone, AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

// Persona-specific messaging per master spec
const getPersonaMessaging = (persona?: string) => {
  switch (persona) {
    case "emergency_replacement":
      return {
        heading: "We've Got You Covered - Fast",
        description: "That makes total sense, let's fix it fast. You'll hear from us within 15 minutes.",
        validationScript: "Emergency situations happen - you're not the only one dealing with this."
      };
    case "immediate_move_in":
      return {
        heading: "Move-In Made Simple", 
        description: "Moving is stressful enough. We'll handle the mattress so you can focus on everything else.",
        validationScript: "Move-in chaos is real - let us take this off your plate."
      };
    case "property_manager":
      return {
        heading: "Professional Property Solutions",
        description: "We understand the business need for quick, reliable mattress solutions.",
        validationScript: "Property management timing is critical - we get it."
      };
    default:
      return {
        heading: "Lead Captured Successfully!",
        description: "We'll get you sleeping comfortably fast.",
        validationScript: "Sometimes you just need a good mattress without the hassle."
      };
  }
};

// The 4 Proven Options - Correct Pricing Matrix
const mattressOptions = [
  {
    id: "F",
    name: "Firm",
    description: "8 inches",
    sizes: {
      "Twin": "$199.99",
      "Full": "$269.99", 
      "Queen": "$299.99",
      "King": "$369.99"
    },
    comfort: "Back & stomach sleepers",
    available: true
  },
  {
    id: "M",
    name: "Medium",
    description: "10 inches",
    sizes: {
      "Twin": "$249.99",
      "Full": "$359.99",
      "Queen": "$399.99", 
      "King": "$469.99"
    },
    comfort: "Most popular - works for everyone",
    available: true,
    popular: true
  },
  {
    id: "H",
    name: "Hybrid",
    description: "10 inches",
    sizes: {
      "Twin": "$399.99",
      "Full": "$449.99",
      "Queen": "$499.99",
      "King": "$599.99"
    },
    comfort: "Coil support + memory foam",
    available: true
  },
  {
    id: "S", 
    name: "Soft/Plush",
    description: "12 inches",
    sizes: {
      "Twin": "$549.99",
      "Full": "$649.99",
      "Queen": "$699.99",
      "King": "$799.99"
    },
    comfort: "Side sleepers & pressure relief",
    available: true
  }
];

const budgetRanges = [
  { id: "under_400", label: "Under $400", color: "bg-green-100 text-green-800" },
  { id: "400_799", label: "$400 - $799", color: "bg-yellow-100 text-yellow-800" },
  { id: "800_plus", label: "$800+", color: "bg-red-100 text-red-800" }
];

export default function Home() {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedComfort, setSelectedComfort] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState("");
  const [selectedZip, setSelectedZip] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [leadCreated, setLeadCreated] = useState(false);
  const [leadResponse, setLeadResponse] = useState<any>(null);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationsFound, setLocationsFound] = useState<number | null>(null);
  const [storeData, setStoreData] = useState<any>(null);
  const [zipInput, setZipInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [showAddressInput, setShowAddressInput] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertLeadSchema>>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      zipCode: "",
      mattressSize: selectedSize as any,
      mattressType: selectedComfort as any,
      budgetRange: selectedBudget as any,
      urgency: selectedUrgency as any,
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertLeadSchema>) => {
      return apiRequest("/api/leads", "POST", data);
    },
    onSuccess: (response) => {
      setLeadCreated(true);
      setLeadResponse(response);
      const messaging = getPersonaMessaging((response as any).persona || 'default');
      toast({
        title: messaging.heading,
        description: messaging.description,
      });
    },
    onError: (error) => {
      toast({
        title: "Something went wrong",
        description: "Please try again or call us directly.",
        variant: "destructive",
      });
    },
  });

  const handleQuestionAnswer = (answer: string, nextQuestion: number) => {
    if (currentQuestion === 1) setSelectedSize(answer);
    if (currentQuestion === 2) setSelectedComfort(answer);
    if (currentQuestion === 4) setSelectedBudget(answer);
    if (currentQuestion === 5) setSelectedUrgency(answer);
    
    if (nextQuestion <= 5) {
      setCurrentQuestion(nextQuestion);
    } else {
      // Update form with selections
      form.setValue("mattressSize", selectedSize as any);
      form.setValue("mattressType", selectedComfort as any);
      form.setValue("budgetRange", selectedBudget as any);
      form.setValue("urgency", selectedUrgency as any);
      setShowForm(true);
    }
  };

  const goBack = () => {
    if (showForm) {
      setShowForm(false);
      return;
    }
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const restartFlow = () => {
    setCurrentQuestion(1);
    setSelectedSize("");
    setSelectedComfort("");
    setSelectedBudget("");
    setSelectedUrgency("");
    setSelectedZip("");
    setShowForm(false);
    setLeadCreated(false);
    setLeadResponse(null);
    setLocationDetecting(false);
    setLocationsFound(null);
    setStoreData(null);
    setZipInput("");
    setAddressInput("");
    setShowAddressInput(false);
    form.reset();
  };

  const detectLocation = async (location: string) => {
    if (!location || location.length < 3) return;
    
    setLocationDetecting(true);
    try {
      const response = await fetch('/api/detect-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      const result = await response.json();
      
      if (result.success) {
        setLocationsFound(result.storesFound);
        
        // Get the actual store details that were found
        const storeResponse = await fetch('/api/admin/notifications');
        const storeResult = await storeResponse.json();
        if (storeResult.success && storeResult.notifications.length > 0) {
          const latestNotification = storeResult.notifications[0];
          setStoreData(latestNotification.data);
        }
        
        toast({
          title: "Great news!",
          description: `We've got pickup options nearby - let's find your perfect mattress!`,
        });
      }
    } catch (error) {
      console.error('Location detection failed:', error);
    } finally {
      setLocationDetecting(false);
    }
  };

  const handleGPSLocation = async () => {
    console.log('🎯 GPS button clicked - checking geolocation support');
    
    if (!navigator?.geolocation) {
      console.error('❌ Geolocation not supported by browser');
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Geolocation supported - requesting permission');
    setLocationDetecting(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 60000
    };

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

      const { latitude, longitude } = position.coords;
      console.log(`📍 Got GPS coordinates: ${latitude}, ${longitude}`);
      
      try {
        console.log('🔄 Calling /api/nearby-stores with GPS coordinates');
        const storesResponse = await fetch('/api/nearby-stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: latitude, lng: longitude }),
        });

        if (!storesResponse.ok) {
          throw new Error(`HTTP ${storesResponse.status}: ${storesResponse.statusText}`);
        }

        const result = await storesResponse.json();
        console.log('📊 Store search result:', result);
        
        if (result.success && result.stores && result.stores.length > 0) {
          setLocationsFound(result.stores.length);
          setSelectedZip(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setStoreData(result);
          
          toast({
            title: "Perfect!",
            description: `We've got several pickup locations near you - let's continue!`
          });
          
          console.log('🎉 GPS location successful - proceeding to next question');
          setCurrentQuestion(2);
        } else {
          throw new Error(`No stores found: ${JSON.stringify(result)}`);
        }
      } catch (apiError) {
        console.error('❌ GPS location API error:', apiError);
        toast({
          title: "Location search failed", 
          description: "Please try entering your ZIP code instead",
          variant: "destructive"
        });
      }
    } catch (geoError: any) {
      console.error('❌ Geolocation error:', geoError);
      
      let message = "Unable to get your location";
      let title = "Location Error";
      
      if (geoError.code) {
        switch (geoError.code) {
          case 1: // PERMISSION_DENIED
            message = "Location access denied. Please enable location services and try again.";
            title = "Permission Denied";
            console.log('🚫 User denied location permission');
            break;
          case 2: // POSITION_UNAVAILABLE
            message = "Location information unavailable. Please try entering your ZIP code.";
            console.log('📍 Position unavailable');
            break;
          case 3: // TIMEOUT
            message = "Location request timed out. Please try again or use ZIP code.";
            console.log('⏱️ Location request timeout');
            break;
        }
      }

      toast({
        title: title,
        description: message,
        variant: "destructive"
      });
    } finally {
      setLocationDetecting(false);
    }
  };

  const handleAddressInput = () => {
    console.log('🏠 Address button clicked - showing address input');
    setShowAddressInput(true);
    setZipInput("");
    
    // Focus on address input after state update
    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="address"]') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const handleAddressSubmit = async () => {
    if (!addressInput.trim()) {
      toast({
        title: "Address required",
        description: "Please enter a valid address",
        variant: "destructive"
      });
      return;
    }

    console.log('🏠 Submitting address:', addressInput);
    setLocationDetecting(true);

    try {
      // Use Google Geocoding API to convert address to coordinates
      console.log('🔄 Calling /api/resolve-location with address');
      const geocodeResponse = await fetch('/api/resolve-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: addressInput.trim() }),
      });

      const geocodeResult = await geocodeResponse.json();
      console.log('📍 Geocoding result:', geocodeResult);

      if (geocodeResult.success && geocodeResult.coordinates) {
        const { lat, lng } = geocodeResult.coordinates;
        
        // Now find nearby stores
        console.log('🔄 Finding nearby stores for address coordinates');
        const storesResponse = await fetch('/api/nearby-stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
        });

        const storesResult = await storesResponse.json();
        console.log('🏪 Store search result:', storesResult);

        if (storesResult.success && storesResult.stores) {
          setLocationsFound(storesResult.stores.length);
          setSelectedZip(addressInput);
          setStoreData(storesResult);
          
          toast({
            title: "Address located",
            description: `Found ${storesResult.stores.length} Mattress Firm stores near ${addressInput}`
          });
          
          console.log('🎉 Address location successful - proceeding to next question');
          setCurrentQuestion(2);
        } else {
          throw new Error('No stores found near this address');
        }
      } else {
        throw new Error('Could not find coordinates for this address');
      }
    } catch (error) {
      console.error('❌ Address location error:', error);
      toast({
        title: "Address not found",
        description: "Please check the address and try again, or use ZIP code",
        variant: "destructive"
      });
    } finally {
      setLocationDetecting(false);
    }
  };

  const handleZipSubmit = async () => {
    if (!zipInput || zipInput.length !== 5) {
      toast({
        title: "Invalid ZIP code",
        description: "Please enter a valid 5-digit ZIP code",
        variant: "destructive"
      });
      return;
    }

    console.log('📫 Submitting ZIP code:', zipInput);
    setSelectedZip(zipInput);
    await detectLocation(zipInput);
    setCurrentQuestion(2);
  };

  const onSubmit = (data: z.infer<typeof insertLeadSchema>) => {
    // Format phone number
    const formattedData = {
      ...data,
      phone: formatPhoneNumber(data.phone),
      mattressSize: selectedSize as any,
      mattressType: selectedComfort as any,
      budgetRange: selectedBudget as any,
      urgency: selectedUrgency as any,
    };
    createLeadMutation.mutate(formattedData);
  };

  const getPriceForSelection = () => {
    if (!selectedSize || !selectedComfort) return "";
    const option = mattressOptions.find(opt => opt.id === selectedComfort);
    return option?.sizes[selectedSize as keyof typeof option.sizes] || "";
  };

  const getBudgetPriority = (budget: string) => {
    if (budget === "800_plus") return "high";
    if (budget === "400_799") return "standard";
    return "basic";
  };

  if (leadCreated) {
    const priority = getBudgetPriority(selectedBudget);
    const price = getPriceForSelection();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-lg mx-auto px-6 py-12">
          <Card className="border-green-200 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              
              {leadResponse ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{getPersonaMessaging(leadResponse.persona).heading}</h2>
                  <p className="text-gray-600 mb-4">{getPersonaMessaging(leadResponse.persona).description}</p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800 italic">
                      "{getPersonaMessaging(leadResponse.persona).validationScript}"
                    </p>
                  </div>
                  
                  {leadResponse.routingTier === "direct_to_aj" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center text-red-700 font-semibold">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        HIGH PRIORITY - DIRECT TO AJ
                      </div>
                      <p className="text-sm text-red-600 mt-2">
                        AJ will personally call you within 15 minutes with your options and store location.
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        Persona: {leadResponse.persona?.replace(/_/g, ' ')} • Confidence: {Math.round(leadResponse.confidence * 100)}%
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">You're All Set!</h2>
                  {priority === "high" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center text-red-700 font-semibold">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        HIGH PRIORITY LEAD
                      </div>
                      <p className="text-sm text-red-600 mt-2">
                        We'll call you within 15 minutes with your options and nearest store location.
                      </p>
                    </div>
                  )}
                </>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Your Selection:</h3>
                <p className="text-lg">{selectedSize} {mattressOptions.find(opt => opt.id === selectedComfort)?.name}</p>
                <p className="text-2xl font-bold text-green-600">{price}</p>
                <p className="text-sm text-gray-600">Available for pickup today</p>
              </div>

              {(!leadResponse || leadResponse.routingTier !== "direct_to_aj") && (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    We're finding the closest location with your mattress in stock.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Car className="w-4 h-4 mr-2" />
                        Fits in any car
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Try it first
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Need proof it fits? <a href="#" className="text-blue-600 hover:underline">Watch the Prius video</a>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                <Button 
                  onClick={restartFlow} 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over with Different Options
                </Button>
                <p className="text-sm text-gray-500 text-center">
                  Questions? Call us: <span className="font-semibold">(813) 555-9999</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-6 py-12">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Almost Done!</h2>
                <p className="text-gray-600 text-sm">
                  Just need your contact info to find the closest store with your {selectedSize} {mattressOptions.find(opt => opt.id === selectedComfort)?.name} in stock.
                </p>
                <div className="text-lg font-semibold text-green-600 mt-2">
                  {getPriceForSelection()}
                </div>
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
                          <Input placeholder="Your name" {...field} />
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
                          <Input 
                            placeholder="(813) 555-0123" 
                            {...field}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="33612" maxLength={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      disabled={createLeadMutation.isPending}
                    >
                      {createLeadMutation.isPending ? "Finding Your Store..." : "Find My Store & Pickup Time"}
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button" 
                        onClick={goBack}
                        variant="outline" 
                        className="flex-1 flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={restartFlow}
                        variant="outline" 
                        className="flex-1 flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Start Over
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">MattressPickupNow</h1>
            <p className="text-xs text-gray-500">Sleep on it tonight</p>
          </div>
          <a 
            href="/dashboard" 
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Dashboard
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 text-white py-12 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Need a Mattress Tonight?</h2>
          <h3 className="text-2xl font-light mb-6">It Fits in Your Car.</h3>
          <p className="text-lg mb-8 text-blue-100">Premium mattresses in boxes that fit on your back seat - no truck needed</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <Car className="w-6 h-6 mx-auto mb-2 text-blue-300" />
              <div className="text-sm font-medium">Back Seat Fits</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <Check className="w-6 h-6 mx-auto mb-2 text-green-300" />
              <div className="text-sm font-medium">Try First</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <Clock className="w-6 h-6 mx-auto mb-2 text-amber-300" />
              <div className="text-sm font-medium">Same Day</div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Entry Section */}
      {currentQuestion === 1 && (
        <section className="py-8 px-6 bg-gray-50">
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Enter your location to find mattresses ready for pickup:
                </h3>
                <p className="text-center text-gray-600 mb-6 text-sm">
                  More precise location = closer pickup options
                </p>
                
                <div className="space-y-4">
                  <button 
                    className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 text-left hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleGPSLocation}
                    disabled={locationDetecting}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        {locationDetecting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {locationDetecting ? "Getting your location..." : "Current location (GPS)"}
                        </div>
                        <div className="text-sm text-gray-600">Find nearest options right now</div>
                      </div>
                      <svg className="w-5 h-5 text-blue-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  
                  <button 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-100 transition-all"
                    onClick={handleAddressInput}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Full address</div>
                        <div className="text-sm text-gray-600">Most precise pickup locations</div>
                      </div>
                      <svg className="w-5 h-5 text-gray-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  
                  {showAddressInput && (
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="123 Main St, Tampa, FL"
                        className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddressSubmit();
                          }
                        }}
                        disabled={locationDetecting}
                      />
                      <div className="text-xs text-gray-500 text-center px-2">
                        Enter the address near where you'd like to pick up your mattress (e.g., your home or work).
                      </div>
                      <Button 
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3"
                        disabled={locationDetecting || !addressInput.trim()}
                        onClick={handleAddressSubmit}
                      >
                        {locationDetecting ? (
                          <>
                            <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Finding stores near address...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            FIND STORES NEAR ADDRESS
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-center text-gray-500 text-sm">Or enter ZIP code for quick search:</div>
                  <input 
                    type="text" 
                    placeholder="Enter ZIP code (e.g., 33612)"
                    className="w-full p-3 border border-gray-300 rounded-lg text-center text-lg focus:border-blue-500 focus:outline-none"
                    maxLength={5}
                    value={zipInput}
                    onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    onFocus={(e) => {
                      if (e.target.value === "") {
                        e.target.placeholder = "";
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        e.target.placeholder = "Enter ZIP code (e.g., 33612)";
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleZipSubmit();
                      }
                    }}
                    disabled={locationDetecting}
                  />
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={locationDetecting || zipInput.length !== 5}
                    onClick={handleZipSubmit}
                  >
                    {locationDetecting ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Looking for pickup locations...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        FIND MY OPTIONS
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Compact Info Bar */}
      {currentQuestion > 1 && (
        <div className="bg-green-50 border-b border-green-200 py-3 px-6">
          <div className="max-w-md mx-auto flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium text-sm">
              {storeData && storeData.stores
                ? `${locationsFound} pickup locations found • Pickup Location #1 (${storeData.stores[0]?.distance?.toFixed(1) || '2.1'} mi) • Available today`
                : locationsFound !== null 
                ? `${locationsFound} pickup locations found • ${storeData?.stores?.[0]?.distance?.toFixed(1) || '2.1'} miles away • Available today`
                : "Pickup locations found • 2.1 miles away • Available today"
              }
            </span>
            {storeData && storeData.stores && (
              <button 
                className="ml-2 text-green-600 hover:text-green-700"
                onClick={() => {
                  const locationList = storeData.stores.map((store: any, index: number) => 
                    `Pickup Location #${index + 1}: ${store.distance?.toFixed(1) || '0.0'} mi away`
                  ).join('\n');
                  alert(`Available Pickup Locations:\n\n${locationList}`);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6 Questions System */}
      <main className="max-w-md mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            {currentQuestion > 1 && (
              <Button
                onClick={goBack}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <div className="flex-1"></div>
            <Button
              onClick={restartFlow}
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </Button>
          </div>
          
          <div className="text-sm text-gray-500 mb-2">Question {Math.min(currentQuestion, 3)} of 3</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(Math.min(currentQuestion, 3) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Question 1: Size */}
        {currentQuestion === 2 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-center mb-6">What size do you need?</h3>
              <div className="grid grid-cols-2 gap-4">
                {["Twin", "Full", "Queen", "King"].map((size) => (
                  <button
                    key={size}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    onClick={() => handleQuestionAnswer(size, 3)}
                  >
                    <div className="text-lg font-semibold">{size}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question 3: Comfort */}
        {currentQuestion === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">4 premium mattresses ready for pickup nearby</h3>
            </div>
            
            {mattressOptions.map((option, index) => (
              <Card 
                key={option.id}
                className={`shadow-lg border-2 transition-all duration-200 hover:shadow-xl cursor-pointer relative ${
                  option.popular 
                    ? 'border-blue-400 bg-gradient-to-r from-blue-50 via-white to-white' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleQuestionAnswer(option.id, 4)}
              >
                {option.popular && (
                  <div className="absolute -top-2 right-4 z-10">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      BEST SELLER
                    </span>
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-1">
                        Sealy Memory Foam {option.name}
                      </h4>
                      <p className="text-gray-600 mb-2">
                        {option.id === 'M' ? 'Our most popular choice - works for everyone' : 
                         option.id === 'F' ? 'Perfect for back & stomach sleepers' :
                         option.id === 'H' ? 'Best of both worlds - coil support + foam comfort' :
                         'Ideal for side sleepers'}
                      </p>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedSize && option.sizes[selectedSize as keyof typeof option.sizes]}
                      </div>
                      <div className="text-sm line-through text-gray-400">
                        {selectedSize && `$${(parseInt(option.sizes[selectedSize as keyof typeof option.sizes].replace('$', '').replace('.99', '')) + 150).toString()}`}
                      </div>
                      <div className="text-sm text-green-600 font-semibold">Ready for pickup now</div>
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400 mr-2">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                      <Star className="w-4 h-4 fill-current opacity-30" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {option.id === 'F' ? '4.7/5' : option.id === 'M' ? '4.8/5' : option.id === 'H' ? '4.5/5' : '4.6/5'}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({option.id === 'F' ? '1,834' : option.id === 'M' ? '2,847' : option.id === 'H' ? '978' : '1,592'} reviews)
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    {option.id === 'F' ? 'Premium spinal alignment and support' : 
                     option.id === 'M' ? 'Perfect balance of comfort and support' : 
                     option.id === 'H' ? 'Traditional coil support with memory foam comfort' : 
                     'Superior pressure point relief and comfort'}
                  </p>

                  <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center">
                    <Car className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 font-medium text-sm">Fits on back seat of any car</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {option.id === 'M' ? 'Best seller - most popular choice' : 
                       option.id === 'F' ? 'Brand new with full warranty' :
                       option.id === 'H' ? 'Coil support + memory foam' :
                       'Perfect for side sleepers'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {option.id === 'M' ? 'Same mattress others wait weeks for' :
                       option.id === 'F' ? 'Try in store before you buy' :
                       option.id === 'H' ? 'Great for hot sleepers' :
                       'Pressure point relief'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {option.id === 'M' ? 'Guaranteed to fit in your car' :
                       option.id === 'F' ? 'Fits in any car' :
                       option.id === 'H' ? 'Full manufacturer warranty' :
                       'Try it first, then decide'}
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                    <Car className="w-5 h-5" />
                    TRY THIS ONE
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Final Lead Capture Form */}
        {currentQuestion === 4 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-center mb-2">Almost there! Let's get you set up for pickup.</h3>
              <p className="text-center text-gray-600 mb-6 text-sm">
                Your {selectedSize} {mattressOptions.find(opt => opt.id === selectedComfort)?.name} is waiting at our closest location
              </p>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-2">Your Selection:</h4>
                <div className="flex justify-between items-center mb-2">
                  <span>Sealy Memory Foam {mattressOptions.find(opt => opt.id === selectedComfort)?.name}</span>
                  <span className="font-semibold">{selectedSize}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Price (before tax):</span>
                  <span className="font-bold text-lg text-green-600">
                    {selectedSize && selectedComfort && mattressOptions.find(opt => opt.id === selectedComfort)?.sizes[selectedSize as keyof typeof mattressOptions[0]['sizes']]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pickup Location:</span>
                  <span className="text-sm">{selectedZip || '33612'} • 2.1 miles</span>
                </div>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First Name" required />
                  <Input placeholder="Last Name" required />
                </div>
                <Input placeholder="Phone Number" type="tel" required />
                <Input placeholder="Email Address" type="email" required />
                
                {/* Address Details Dropdown */}
                <details className="border border-gray-200 rounded-lg">
                  <summary className="p-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-50">
                    More precise pickup location (optional)
                  </summary>
                  <div className="p-4 border-t space-y-3">
                    <Input placeholder="Street Address" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="City" />
                      <Input placeholder="State" />
                    </div>
                  </div>
                </details>

                {/* Urgency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">When do you need this?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="p-3 border-2 border-orange-300 bg-orange-50 rounded-lg font-medium text-orange-800 hover:bg-orange-100">
                      TODAY
                    </button>
                    <button type="button" className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50">
                      This Week
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForm(true);
                  }}
                >
                  <Car className="w-5 h-5 mr-2" />
                  GET PICKUP DETAILS
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Question 4: Budget */}
        {currentQuestion === 4 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-center mb-6">What's your budget range?</h3>
              <div className="space-y-4">
                {budgetRanges.map((range) => (
                  <button
                    key={range.id}
                    className={`w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all ${
                      range.id === 'under_400' ? 'border-green-500 bg-green-50' : ''
                    }`}
                    onClick={() => handleQuestionAnswer(range.id, 5)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">{range.label}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${range.color}`}>
                        {range.id === '800_plus' ? 'Premium' : range.id === '400_799' ? 'Standard' : 'Value'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question 5: Urgency */}
        {currentQuestion === 5 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-center mb-6">How soon do you need this?</h3>
              <div className="space-y-4">
                <button
                  className="w-full p-4 border-2 border-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                  onClick={() => handleQuestionAnswer("today", 6)}
                >
                  <div className="flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-lg font-semibold text-red-800">TODAY (Same Day)</span>
                  </div>
                  <div className="text-sm text-red-600 mt-1">Need to sleep on it tonight</div>
                </button>
                
                <button
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  onClick={() => handleQuestionAnswer("this_week", 6)}
                >
                  <div className="text-lg font-semibold">This Week</div>
                  <div className="text-sm text-gray-600">Within the next few days</div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}