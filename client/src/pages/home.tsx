import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLeadSchema } from "@shared/schema";
import { formatPhoneNumber, generateLeadMessage, openSMSApp, copyToClipboard } from "@/lib/utils";
import { MapPin, Check, Car, Shield, Clock, Copy, MessageCircle, CheckCircle } from "lucide-react";

type Step = "zip" | "mattress" | "contact" | "instructions";

const zipSchema = z.object({
  zipCode: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
});

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

  const createLeadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertLeadSchema>) => {
      const response = await apiRequest("POST", "/api/leads", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setLeadData(data);
      setCurrentStep("instructions");
      toast({
        title: "Success!",
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
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">MattressPickupNow</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-blue-700 text-white py-12 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="hero-title font-bold mb-4">Need a Mattress Tonight?</h2>
          <p className="text-xl mb-6 text-blue-100">Pickup in 30 minutes from stores near you</p>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Try First</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>No Delivery Fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Fits Any Car</span>
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
                    disabled={zipForm.watch("zipCode")?.length !== 5}
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Find Stores Near Me
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
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
          <Card className="animate-slide-up">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="section-title font-semibold text-gray-900 mb-2">Perfect! Your pickup instructions are ready</h3>
              </div>

              {/* Message Display */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Copy this message to send:</h4>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-sm leading-relaxed select-all">
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
                  className={`w-full py-3 mt-3 font-medium rounded-lg transition-colors ${
                    copySuccess 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-primary hover:bg-blue-700'
                  }`}
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy Message
                    </>
                  )}
                </Button>
              </div>

              {/* Send Instructions */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Send to this store number:</h4>
                <div className="flex items-center justify-between bg-white rounded-lg p-4 border-2 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">(813) 555-9999</p>
                      <p className="text-sm text-gray-600">Mattress Firm Store</p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  className="w-full btn-success-gradient py-3 mt-3 font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Send Message Now
                </Button>
              </div>

              {/* What Happens Next */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900">What happens next:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <p className="text-gray-700">You'll get quotes and directions within 5 minutes</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <p className="text-gray-700">Visit the store to try mattresses</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <p className="text-gray-700">Pick your favorite and drive home tonight!</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
