import type { InsertLead } from "@shared/schema";

// The 9 Customer Psychology Profiles from the master spec
export type PersonaType = 
  | "emergency_replacement"
  | "immediate_move_in" 
  | "coming_of_age"
  | "guest_accommodations"
  | "child_milestone"
  | "student_transition"
  | "property_manager"
  | "delivery_mismatch"
  | "practical_no_nonsense";

export type RoutingTier = "direct_to_aj" | "self_service";

export interface PersonaAnalysis {
  persona: PersonaType;
  routingTier: RoutingTier;
  confidence: number;
  reasoning: string;
}

/**
 * Persona Detection Engine - Rules-based matching from form data
 * Based on the master spec psychology profiles
 */
export function detectPersona(leadData: InsertLead): PersonaAnalysis {
  const { urgency, budgetRange, mattressSize, zipCode, name, phone } = leadData;
  
  // High-Priority Personas → Route directly to AJ
  
  // Emergency Replacement - Today urgency + any budget signals immediate need
  if (urgency === "today" && (budgetRange === "under_400" || budgetRange === "400_799")) {
    return {
      persona: "emergency_replacement",
      routingTier: "direct_to_aj",
      confidence: 0.9,
      reasoning: "Same-day urgency with budget constraints indicates emergency replacement situation"
    };
  }
  
  // Immediate Move-In - Today urgency + higher budget 
  if (urgency === "today" && budgetRange === "800_plus") {
    return {
      persona: "immediate_move_in",
      routingTier: "direct_to_aj", 
      confidence: 0.85,
      reasoning: "Same-day urgency with higher budget suggests move-in or relocation pressure"
    };
  }
  
  // Property Manager / Airbnb - King/Queen size + higher budget + this_week urgency
  if ((mattressSize === "King" || mattressSize === "Queen") && 
      budgetRange === "800_plus" && 
      urgency === "this_week") {
    return {
      persona: "property_manager",
      routingTier: "direct_to_aj",
      confidence: 0.8,
      reasoning: "Large size + premium budget + planned timing suggests property management needs"
    };
  }
  
  // Standard Personas → Self-service flow
  
  // Coming-of-Age Buyer - Twin/Full size + mid-budget
  if ((mattressSize === "Twin" || mattressSize === "Full") && budgetRange === "400_799") {
    return {
      persona: "coming_of_age",
      routingTier: "self_service",
      confidence: 0.75,
      reasoning: "Smaller size with mid-range budget indicates first major purchase scenario"
    };
  }
  
  // Student Transition - Twin size + lower budget
  if (mattressSize === "Twin" && budgetRange === "under_400") {
    return {
      persona: "student_transition", 
      routingTier: "self_service",
      confidence: 0.8,
      reasoning: "Twin size with budget constraint typical of student housing needs"
    };
  }
  
  // Guest Accommodations - Queen/King + mid-budget + this_week
  if ((mattressSize === "Queen" || mattressSize === "King") && 
      budgetRange === "400_799" && 
      urgency === "this_week") {
    return {
      persona: "guest_accommodations",
      routingTier: "self_service", 
      confidence: 0.7,
      reasoning: "Standard size with planned timing suggests guest room setup"
    };
  }
  
  // Child Milestone - Full/Queen + any budget + this_week
  if ((mattressSize === "Full" || mattressSize === "Queen") && urgency === "this_week") {
    return {
      persona: "child_milestone",
      routingTier: "self_service",
      confidence: 0.65,
      reasoning: "Size upgrade with planned timing indicates child transitioning to larger bed"
    };
  }
  
  // Delivery Mismatch - Today urgency + mid/high budget
  if (urgency === "today" && (budgetRange === "400_799" || budgetRange === "800_plus")) {
    return {
      persona: "delivery_mismatch",
      routingTier: "direct_to_aj", // High priority due to urgency
      confidence: 0.7,
      reasoning: "Same-day need with established budget suggests delivery/ordering problem"
    };
  }
  
  // Default: Practical No-Nonsense
  return {
    persona: "practical_no_nonsense",
    routingTier: "self_service",
    confidence: 0.6,
    reasoning: "Standard profile - straightforward mattress purchase without special circumstances"
  };
}

/**
 * Get persona-specific messaging for success confirmation
 */
export function getPersonaMessaging(persona: PersonaType): {
  heading: string;
  description: string;
  validationScript: string;
} {
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
      
    case "coming_of_age":
      return {
        heading: "Your First Real Mattress Decision",
        description: "This is an important purchase. We'll make sure you get exactly what you need.",
        validationScript: "Making your first big mattress purchase? You're in good hands."
      };
      
    case "student_transition":
      return {
        heading: "Student-Smart Solution",
        description: "Quality sleep for your studies, priced for your budget.",
        validationScript: "Student housing needs are unique - we've got budget-friendly options."
      };
      
    case "guest_accommodations":
      return {
        heading: "Perfect for Your Guests",
        description: "Make sure your visitors get great sleep. We'll help you choose the right comfort level.",
        validationScript: "Hosting guests means everything needs to be just right - we understand."
      };
      
    case "child_milestone":
      return {
        heading: "Growing Up, Sleeping Better",
        description: "Kids grow fast. Let's get them set up with the right size for comfortable sleep.",
        validationScript: "Kids outgrow beds quickly - this happens more than you'd think."
      };
      
    case "delivery_mismatch":
      return {
        heading: "Let's Fix This Today",
        description: "Delivery problems are frustrating. We'll get you sleeping comfortably tonight.",
        validationScript: "Delivery issues are more common than they should be - let's solve this."
      };
      
    case "practical_no_nonsense":
    default:
      return {
        heading: "Straightforward Mattress Solution",
        description: "No-nonsense approach. Quality mattress, fair price, same-day pickup.",
        validationScript: "Sometimes you just need a good mattress without the hassle."
      };
  }
}