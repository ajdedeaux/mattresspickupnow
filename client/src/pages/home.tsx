import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLeadSchema, findStoresSchema, type Store } from "@shared/schema";
import { formatPhoneNumber, generateLeadMessage, openSMSApp, copyToClipboard } from "@/lib/utils";
import { MapPin, Check, Car, Shield, Clock, Copy, MessageCircle, CheckCircle, Star, Phone, Navigation } from "lucide-react";

type Step = "zip" | "revelation" | "mattress" | "contact" | "instructions";

const zipSchema = findStoresSchema;

const mattressOptions = [
  {
    id: "sealy-firm",
    name: "Sealy Memory Foam Firm",
    comfort: "Perfect for back & stomach sleepers",
    price: "$299",
    originalPrice: "$699",
    rating: 4.7,
    reviews: 1834,
    description: "Premium spinal alignment and support",
    popular: false,
    benefits: ["Brand new with full warranty", "Try in store before you buy", "Fits in any car"],
  },
  {
    id: "sealy-medium", 
    name: "Sealy Memory Foam Medium",
    comfort: "Our most popular choice - works for everyone",
    price: "$349",
    originalPrice: "$749",
    rating: 4.8,
    reviews: 2847,
    description: "Perfect balance of comfort and support",
    popular: true,
    benefits: ["Best seller - most popular choice", "Same mattress others wait weeks for", "Guaranteed to fit in your car"],
  },
  {
    id: "sealy-soft",
    name: "Sealy Memory Foam Soft", 
    comfort: "Ideal for side sleepers",
    price: "$349",
    originalPrice: "$749",
    rating: 4.6,
    reviews: 1592,
    description: "Superior pressure point relief and comfort",
    popular: false,
    benefits: ["Perfect for side sleepers", "Pressure point relief", "Try it first, then decide"],
  },
  {
    id: "basic-hybrid",
    name: "Basic Hybrid",
    comfort: "Best of both worlds - coil support + foam comfort", 
    price: "$399",
    originalPrice: "$899",
    rating: 4.5,
    reviews: 978,
    description: "Traditional coil support with memory foam comfort",
    popular: false,
    benefits: ["Coil support + memory foam", "Great for hot sleepers", "Full manufacturer warranty"],
  },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>("zip");
  const [userZip, setUserZip] = useState("");
  const [autoSelectedStore, setAutoSelectedStore] = useState<Store | null>(null);
  const [selectedMattress, setSelectedMattress] = useState("");
  const [leadData, setLeadData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();

  const zipForm = useForm<z.infer<typeof zipSchema>>({
    resolver: zodResolver(zipSchema),
    defaultValues: { zipCode: "" },
  });

  const contactForm = useForm<z.infer<typeof insertLeadSchema>>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      zipCode: userZip,
      mattressType: selectedMattress as any,
    },
  });

  const findStoresMutation = useMutation({
    mutationFn: async (data: z.infer<typeof zipSchema>) => {
      const response = await apiRequest("POST", "/api/find-stores", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.storesFound > 0) {
        // Auto-select the closest store
        setAutoSelectedStore(data.stores[0]);
        setCurrentStep("revelation");
        toast({
          title: "Found Nearby Locations!",
          description: `Found ${data.storesFound} stores near you with available mattresses`,
        });
      } else {
        toast({
          title: "No Stores Found",
          description: "No locations found in your area. Please try a different ZIP code.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Search Error",
        description: error.message || "Unable to search for stores. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertLeadSchema>) => {
      const response = await apiRequest("POST", "/api/leads", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setLeadData(data);
      setCurrentStep("instructions");
      toast({
        title: "Instructions Ready",
        description: "Your pickup instructions are ready below.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleZipSubmit = (data: z.infer<typeof zipSchema>) => {
    setUserZip(data.zipCode);
    findStoresMutation.mutate(data);
  };



  const handleMattressSelect = (mattressId: string) => {
    setSelectedMattress(mattressId);
    setCurrentStep("contact");
  };

  const handleContactSubmit = (data: z.infer<typeof insertLeadSchema>) => {
    const formattedData = {
      ...data,
      zipCode: userZip,
      mattressType: selectedMattress as any,
    };
    createLeadMutation.mutate(formattedData);
  };

  const handleCopyMessage = async () => {
    if (!leadData) return;
    
    const selectedMattressData = mattressOptions.find(m => m.id === selectedMattress);
    const message = generateLeadMessage({
      mattressType: selectedMattress,
      name: contactForm.getValues("name"),
      phone: contactForm.getValues("phone"),
      zipCode: userZip,
      leadId: leadData.leadId,
    });

    const success = await copyToClipboard(message);
    if (success) {
      setCopySuccess(true);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleSendMessage = () => {
    if (!leadData) return;
    
    const message = generateLeadMessage({
      mattressType: selectedMattress,
      name: contactForm.getValues("name"),
      phone: contactForm.getValues("phone"),
      zipCode: userZip,
      leadId: leadData.leadId,
    });

    openSMSApp("8135559999", message);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MattressPickupNow</h1>
              <p className="text-xs text-gray-500">Premium Sleep Solutions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-primary text-white py-16 px-6 relative">
        <a 
          href="/dashboard" 
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-all"
        >
          Dashboard
        </a>
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 leading-tight">Need a Mattress Tonight?<br/>It Fits in Your Car.</h2>
          <p className="text-xl mb-8 text-slate-200">Premium mattresses in boxes that fit on your back seat - no truck needed</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <Car className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <span className="block">Back Seat Fits</span>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <Check className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <span className="block">Try First</span>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <span className="block">Same Day</span>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Indicator */}
      {currentStep !== "zip" && (
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {[
              { step: "zip", label: "Location", completed: currentStep !== "zip" },
              { step: "revelation", label: "Options", completed: ["mattress", "contact", "instructions"].includes(currentStep) },
              { step: "mattress", label: "Select", completed: ["contact", "instructions"].includes(currentStep) },
              { step: "contact", label: "Details", completed: currentStep === "instructions" }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  item.step === currentStep 
                    ? 'bg-blue-600 text-white shadow-lg scale-110' 
                    : item.completed 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {item.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-1 mx-1 transition-all duration-300 ${
                    item.completed ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>Location</span>
            <span>Options</span>
            <span>Select</span>
            <span>Details</span>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto px-6 py-8 space-y-8">
        
        {/* ZIP Code Entry */}
        {currentStep === "zip" && (
          <Card className="animate-fade-in premium-card">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="section-title font-semibold text-gray-900 mb-2">Enter your location to find mattresses ready for pickup:</h3>
                <p className="text-gray-600 text-sm">More precise location = closer pickup options</p>
              </div>
              
              {/* Location Options */}
              <div className="space-y-4 mb-6">
                <button 
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
                  onClick={() => {
                    // For demo, use a default ZIP code
                    zipForm.setValue("zipCode", "33612");
                    handleZipSubmit({ zipCode: "33612" });
                  }}
                >
                  <div className="flex items-center">
                    <Navigation className="w-6 h-6 text-blue-600 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Current location (GPS)</div>
                      <div className="text-sm text-gray-600">Find nearest options right now</div>
                    </div>
                  </div>
                  <div className="text-blue-600 group-hover:translate-x-1 transition-transform">→</div>
                </button>

                <button 
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
                  onClick={() => {
                    // For demo, use a default ZIP code
                    zipForm.setValue("zipCode", "33612");
                    handleZipSubmit({ zipCode: "33612" });
                  }}
                >
                  <div className="flex items-center">
                    <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Full address</div>
                      <div className="text-sm text-gray-600">Get precise pickup locations</div>
                    </div>
                  </div>
                  <div className="text-blue-600 group-hover:translate-x-1 transition-transform">→</div>
                </button>
              </div>
              
              <div className="relative mb-4">
                <div className="text-center text-sm text-gray-500 mb-4">Or enter ZIP code for quick search:</div>
              </div>

              <Form {...zipForm}>
                <form onSubmit={zipForm.handleSubmit(handleZipSubmit)} className="space-y-4">
                  <FormField
                    control={zipForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter ZIP code (e.g., 33612)"
                            maxLength={5}
                            className="form-input text-center text-lg"
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(value.slice(0, 5));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit"
                    className="w-full btn-primary-gradient py-4 text-lg font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                    disabled={zipForm.watch("zipCode")?.length !== 5 || findStoresMutation.isPending}
                  >
                    {findStoresMutation.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Finding mattresses that fit in your car...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5 mr-2" />
                        FIND MY OPTIONS
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* The Revelation */}
        {currentStep === "revelation" && autoSelectedStore && (
          <div className="animate-slide-up space-y-6">
            {/* Success Header */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Found 3 pickup locations near you!</h3>
              </CardContent>
            </Card>

            {/* The Car Revelation */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Here's what most people don't know:</h4>
                
                <div className="bg-white rounded-xl p-6 mb-6 border-2 border-dashed border-blue-300">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <Car className="w-12 h-12 text-blue-600" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">These premium mattresses come in boxes</p>
                      <p className="text-blue-600 font-medium">that fit on your back seat.</p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-gray-700 font-medium">No truck needed. No tying anything to your roof.</p>
                    <p className="text-gray-600">You can try them in the store first, then drive home with one TODAY.</p>
                  </div>
                </div>

                {/* Store Info Preview */}
                <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-gray-900">Closest pickup location</p>
                      <p className="text-sm text-gray-600">{autoSelectedStore.distance} miles away • Open until {autoSelectedStore.hours}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setCurrentStep("mattress")}
                  className="w-full btn-success-gradient py-4 text-lg font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <Car className="w-5 h-5 mr-2" />
                  Show Me the Mattresses That Fit
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mattress Options */}
        {currentStep === "mattress" && autoSelectedStore && (
          <div className="animate-slide-up space-y-6">
            {/* Header */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Perfect! These 4 premium mattresses are ready for pickup near {userZip}</h3>
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  Available for pickup • {autoSelectedStore.distance} miles away • Open until {autoSelectedStore.hours}
                </p>
              </div>
            </div>

            {/* Enhanced Mattress Cards */}
            <div className="space-y-4">
              {mattressOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-xl relative overflow-hidden ${
                    selectedMattress === option.id 
                      ? 'border-primary bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                      : 'border-gray-200 hover:border-primary'
                  }`}
                  onClick={() => handleMattressSelect(option.id)}
                >
                  {option.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      BEST SELLER
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-1">{option.name}</h4>
                        <p className="text-gray-700 font-medium text-sm">{option.comfort}</p>
                        
                        {/* Rating */}
                        <div className="flex items-center mt-2 space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < Math.floor(option.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{option.rating}/5</span>
                          <span className="text-sm text-gray-500">({option.reviews.toLocaleString()} reviews)</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl font-bold text-gray-900">{option.price}</span>
                          <span className="text-sm text-gray-500 line-through">{option.originalPrice}</span>
                        </div>
                        <p className="text-sm font-medium text-green-600 mt-1">Ready for pickup now</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4">{option.description}</p>

                    {/* Benefits */}
                    <div className="space-y-2 mb-4">
                      {/* Highlight Car Fit First */}
                      <div className="flex items-center text-sm bg-blue-50 rounded-lg p-2 border border-blue-200">
                        <Car className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                        <span className="font-medium text-blue-800">Fits on back seat of any car</span>
                      </div>
                      {option.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleMattressSelect(option.id)}
                      className={`w-full py-3 font-semibold rounded-lg transition-all duration-200 hover:scale-105 ${
                        selectedMattress === option.id
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                          : 'btn-primary-gradient text-white hover:shadow-lg'
                      }`}
                    >
                      {selectedMattress === option.id ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          SELECTED
                        </>
                      ) : (
                        <>
                          <Car className="w-5 h-5 mr-2" />
                          TRY THIS ONE
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Contact Form */}
        {currentStep === "contact" && (
          <Card className="animate-slide-up">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="section-title font-semibold text-gray-900 mb-2">Almost Done!</h3>
                <p className="text-gray-600">Just need your contact info to lock in your exclusive pricing</p>
              </div>

              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(handleContactSubmit)} className="space-y-4">
                  <FormField
                    control={contactForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Full Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your name" className="form-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contactForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Phone Number *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="(555) 123-4567"
                            className="form-input"
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
                    control={contactForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Email (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="your@email.com" className="form-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit"
                    className="w-full btn-success-gradient py-4 text-lg font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                    disabled={createLeadMutation.isPending}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {createLeadMutation.isPending ? "Locking in your pricing..." : "LOCK IN MY PRICING"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {currentStep === "instructions" && leadData && (
          <div className="animate-slide-up space-y-6">
            {/* Success Header */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You're all set! Here's your pickup plan:</h3>
                <p className="text-gray-700">We've locked in exclusive pricing and coordinated with your nearest location</p>
              </CardContent>
            </Card>

            {/* Message Card */}
            <Card className="border-2 border-slate-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Your Message</h4>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    Lead ID: {leadData.leadId}
                  </span>
                </div>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 mb-4 font-mono text-sm leading-relaxed select-all">
                  {generateLeadMessage({
                    mattressType: selectedMattress,
                    name: contactForm.getValues("name"),
                    phone: contactForm.getValues("phone"),
                    zipCode: userZip,
                    leadId: leadData.leadId,
                  })}
                </div>

                <Button 
                  onClick={handleCopyMessage}
                  className={`w-full py-4 text-lg font-semibold rounded-xl shadow-md transition-all duration-200 ${
                    copySuccess 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'btn-primary-gradient hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Message Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Store Details Card */}
            {autoSelectedStore && (
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Pickup Location</h4>
                  
                  {/* Exclusive Pricing Banner */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-green-800 font-semibold mb-2">
                        <strong>Good news:</strong> This is at Mattress Firm! We've negotiated exclusive pricing and they have your mattress ready for testing.
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-green-300">
                        <p className="text-lg font-bold text-green-800">YOUR EXCLUSIVE PRICE: ${mattressOptions.find(m => m.id === selectedMattress)?.price || "299"}</p>
                        <p className="text-sm text-green-600">(Locked in - no surprises at pickup)</p>
                      </div>
                    </div>
                  </div>

                  {/* Store Info */}
                  <div className="bg-white border-2 border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{autoSelectedStore.name}</p>
                          <p className="text-sm text-gray-600">{autoSelectedStore.address}</p>
                          <p className="text-sm text-gray-600">{autoSelectedStore.distance} miles away</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          autoSelectedStore.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {autoSelectedStore.hours}
                        </div>
                        {autoSelectedStore.rating && (
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">{autoSelectedStore.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-primary" />
                          <span className="text-lg font-bold text-gray-900">{autoSelectedStore.phone || "(813) 555-9999"}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-700">Available Now</p>
                          <p className="text-xs text-gray-500">Typical response: 2-5 min</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      onClick={handleSendMessage}
                      className="w-full btn-success-gradient py-4 text-lg font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      TEXT STORE NOW
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => window.open(`tel:${autoSelectedStore.phone || "8135559999"}`, "_self")}
                        className="bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        CALL
                      </Button>
                      <Button 
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(autoSelectedStore.address || "1234 Main St, Tampa FL")}`, "_blank")}
                        className="bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        DIRECTIONS
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Process Steps */}
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">What Happens Next</h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Get Instant Response</p>
                      <p className="text-sm text-gray-600">Store team responds within 2-5 minutes with quotes and directions</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Try Before You Buy</p>
                      <p className="text-sm text-gray-600">Visit the store to test comfort levels and make your selection</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Drive Home Tonight</p>
                      <p className="text-sm text-gray-600">Complete your purchase and take your new mattress home immediately</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
