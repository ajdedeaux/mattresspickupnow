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

type Step = "zip" | "stores" | "mattress" | "contact" | "instructions";

const zipSchema = findStoresSchema;

const mattressOptions = [
  {
    id: "sealy-firm",
    name: "Sealy Memory Foam",
    comfort: "Firm Support",
    price: "$400-500",
    description: "Great for back support and spinal alignment",
    popular: false,
  },
  {
    id: "sealy-medium", 
    name: "Sealy Memory Foam",
    comfort: "Medium Comfort",
    price: "$450-550",
    description: "Perfect balance of comfort and support",
    popular: true,
  },
  {
    id: "sealy-soft",
    name: "Sealy Memory Foam", 
    comfort: "Soft Comfort",
    price: "$450-550",
    description: "Superior pressure point relief and comfort",
    popular: false,
  },
  {
    id: "basic-hybrid",
    name: "Basic Hybrid",
    comfort: "Balanced Support", 
    price: "$500-600",
    description: "Best of both worlds - coils and memory foam",
    popular: false,
  },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>("zip");
  const [userZip, setUserZip] = useState("");
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
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
        setNearbyStores(data.stores);
        setCurrentStep("stores");
        toast({
          title: "Locations Found",
          description: `Found ${data.storesFound} stores near you with mattresses ready for pickup.`,
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

  const handleStoresConfirm = () => {
    setCurrentStep("mattress");
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
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-primary text-white py-16 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 leading-tight">Need a Mattress Tonight?</h2>
          <p className="text-xl mb-8 text-slate-200">Premium mattresses available for pickup in 30 minutes</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <Check className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <span className="block">Try First</span>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <Car className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <span className="block">Fits Any Car</span>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <span className="block">No Delivery Fees</span>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-md mx-auto px-6 py-8 space-y-8">
        
        {/* ZIP Code Entry */}
        {currentStep === "zip" && (
          <Card className="animate-fade-in premium-card">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="section-title font-semibold text-gray-900 mb-2">Find Stores Near You</h3>
                <p className="text-gray-600">Enter your ZIP code to see available mattresses</p>
              </div>
              
              <Form {...zipForm}>
                <form onSubmit={zipForm.handleSubmit(handleZipSubmit)} className="space-y-4">
                  <FormField
                    control={zipForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">ZIP Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="33612"
                            maxLength={5}
                            className="form-input"
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
                        Searching for stores...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5 mr-2" />
                        Find Stores Near Me
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Store Locations */}
        {currentStep === "stores" && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="section-title font-semibold text-gray-900 mb-2">Locations Found</h3>
              <p className="text-gray-600">
                Great! We found {nearbyStores.length} stores near <span className="font-medium text-primary">{userZip}</span> with mattresses ready for pickup.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {nearbyStores.map((store) => (
                <Card key={store.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{store.name}</h4>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <Navigation className="w-4 h-4 mr-1" />
                          {store.distance} miles away
                        </p>
                        <p className="text-sm text-gray-600">{store.address}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          store.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {store.hours}
                        </div>
                        {store.rating && (
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">{store.rating}</span>
                          </div>
                        )}
                        {store.phone && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {store.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-800 font-medium">
                        All 4 mattress options available for immediate pickup
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleStoresConfirm}
              className="w-full btn-success-gradient py-4 text-lg font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Continue with These Locations
            </Button>
          </div>
        )}

        {/* Mattress Options */}
        {currentStep === "mattress" && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <h3 className="section-title font-semibold text-gray-900 mb-2">Ready for Pickup Today</h3>
              <p className="text-gray-600">These mattresses are available at stores near <span className="font-medium text-primary">{userZip}</span></p>
            </div>

            <div className="space-y-4">
              {mattressOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`premium-card cursor-pointer border-2 transition-all duration-200 ${
                    selectedMattress === option.id 
                      ? 'border-primary bg-blue-50' 
                      : 'border-gray-100 hover:border-primary hover:shadow-lg'
                  }`}
                  onClick={() => handleMattressSelect(option.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{option.name}</h4>
                        <p className="text-primary font-medium">{option.comfort}</p>
                        {option.popular && (
                          <span className="inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded-full mt-1">
                            Most Popular
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{option.price}</p>
                        <p className="text-sm text-green-600">Ready Now</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Check className="w-4 h-4 mr-1" />
                          Try in store
                        </span>
                        <span className="flex items-center">
                          <Car className="w-4 h-4 mr-1" />
                          Fits any car
                        </span>
                      </div>
                      <div className={`selection-indicator ${selectedMattress === option.id ? 'selected' : ''}`}>
                        {selectedMattress === option.id && (
                          <Check className="w-3 h-3 text-white m-auto" />
                        )}
                      </div>
                    </div>
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
                <p className="text-gray-600">Just need your contact info to get store directions</p>
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
                    <MapPin className="w-5 h-5 mr-2" />
                    {createLeadMutation.isPending ? "Getting Directions..." : "Get Store Directions Now"}
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Instructions Ready</h3>
                <p className="text-gray-700">Your personalized pickup message is ready to send</p>
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

            {/* Store Contact Card */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Send Your Message To</h4>
                
                <div className="bg-white border-2 border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900">(813) 555-9999</p>
                        <p className="text-sm text-gray-600">Store Representative</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-700">Available Now</p>
                      <p className="text-xs text-gray-500">Typical response: 2-5 min</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSendMessage}
                  className="w-full btn-success-gradient py-4 text-lg font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Open Messaging App
                </Button>
              </CardContent>
            </Card>

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
