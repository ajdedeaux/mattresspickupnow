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

// The 4 Proven Options - Per Master Spec Pricing (Queen base prices)
const mattressOptions = [
  {
    id: "F",
    name: "Firm",
    description: "8 inches",
    sizes: {
      "Twin": "$199",
      "Full": "$249", 
      "Queen": "$299",
      "King": "$349"
    },
    comfort: "Back & stomach sleepers",
    available: true
  },
  {
    id: "M",
    name: "Medium",
    description: "10 inches",
    sizes: {
      "Twin": "$299",
      "Full": "$349",
      "Queen": "$399", 
      "King": "$449"
    },
    comfort: "Most popular - works for everyone",
    available: true,
    popular: true
  },
  {
    id: "S", 
    name: "Soft/Plush",
    description: "12 inches",
    sizes: {
      "Twin": "$497",
      "Full": "$597",
      "Queen": "$697",
      "King": "$797"
    },
    comfort: "Side sleepers & pressure relief",
    available: true
  },
  {
    id: "H",
    name: "Hybrid",
    description: "10 inches",
    sizes: {
      "Twin": "$399",
      "Full": "$449",
      "Queen": "$499",
      "King": "$549"
    },
    comfort: "Coil support + memory foam",
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
  const [showForm, setShowForm] = useState(false);
  const [leadCreated, setLeadCreated] = useState(false);
  const [leadResponse, setLeadResponse] = useState<any>(null);
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
      const messaging = getPersonaMessaging(response.persona);
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
    setShowForm(false);
    setLeadCreated(false);
    setLeadResponse(null);
    form.reset();
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
      <section className="bg-gradient-to-br from-blue-900 to-purple-900 text-white py-16 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need a mattress TODAY?</h2>
          <p className="text-xl mb-6">Pick one, pick it up, sleep on it tonight.</p>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-8">
            <div className="text-sm font-semibold mb-2">Don't believe it fits in your car? WATCH THIS</div>
            <video 
              className="w-full rounded-lg border-2 border-white/30"
              controls
              preload="metadata"
              style={{ maxHeight: '180px' }}
              onError={(e) => console.error('Video error:', e)}
            >
              <source src="/attached_assets/v15044gf0000cr14gknog65kacvj5b6g_1753135800098.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="text-xs text-white/90 mt-2 text-center font-medium">
              PROOF: Queen mattress fits in Prius back seat
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-white/10 rounded-lg p-3">
              <Car className="w-5 h-5 mx-auto mb-2 text-blue-400" />
              <span>Any Car</span>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <Check className="w-5 h-5 mx-auto mb-2 text-green-400" />
              <span>Try First</span>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <Clock className="w-5 h-5 mx-auto mb-2 text-purple-400" />
              <span>Tonight</span>
            </div>
          </div>
        </div>
      </section>

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
          
          <div className="text-sm text-gray-500 mb-2">Question {currentQuestion} of 5</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(currentQuestion / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Question 1: Size */}
        {currentQuestion === 1 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-center mb-6">What size do you need?</h3>
              <div className="grid grid-cols-2 gap-4">
                {["Twin", "Full", "Queen", "King"].map((size) => (
                  <button
                    key={size}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    onClick={() => handleQuestionAnswer(size, 2)}
                  >
                    <div className="text-lg font-semibold">{size}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question 2: Comfort */}
        {currentQuestion === 2 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-center mb-6">What comfort level?</h3>
              <div className="space-y-4">
                {mattressOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left ${
                      option.popular ? 'border-green-500 bg-green-50' : ''
                    }`}
                    onClick={() => handleQuestionAnswer(option.id, 3)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-lg">{option.name}</div>
                        <div className="text-sm text-gray-600 mb-1">{option.description}</div>
                        <div className="text-sm text-gray-800">{option.comfort}</div>
                        <div className="text-lg font-bold text-green-600 mt-1">
                          {selectedSize ? option.sizes[selectedSize as keyof typeof option.sizes] : "from $199"}
                        </div>
                      </div>
                      {option.popular && (
                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Most Popular
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question 3: ZIP Code */}
        {currentQuestion === 3 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-center mb-6">What's your ZIP code?</h3>
              <p className="text-center text-gray-600 mb-6 text-sm">
                We'll find the closest location with your {selectedSize} {mattressOptions.find(opt => opt.id === selectedComfort)?.name} in stock.
              </p>
              <div className="space-y-4">
                <Input 
                  placeholder="Enter ZIP code (e.g. 33612)"
                  maxLength={5}
                  className="text-center text-lg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.length === 5) {
                      handleQuestionAnswer(e.currentTarget.value, 4);
                    }
                  }}
                />
                <Button 
                  className="w-full"
                  onClick={(e) => {
                    const input = e.currentTarget.parentNode?.querySelector('input') as HTMLInputElement;
                    if (input?.value.length === 5) {
                      handleQuestionAnswer(input.value, 4);
                    }
                  }}
                >
                  Find Stores Near Me
                </Button>
              </div>
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