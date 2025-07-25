import type { Lead } from "@shared/schema";

// SMS message templates - Pure Urgency System
export function generateOwnerAlert(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  const price = getPrice(lead.mattressType, lead.mattressSize);
  
  // High priority leads get immediate attention
  if (lead.priority === "high") {
    return `🚨 HIGH VALUE LEAD 🚨
${lead.name} - ${lead.phone}
Budget: $800+ | Need: ${lead.mattressSize} ${mattressOption.name}
Location: ${lead.zipCode} | Urgency: ${lead.urgency}
Price Point: ${price}

⚡ CALL WITHIN 15 MINUTES ⚡

NEAREST STORE:
📞 ${store?.name || 'Mattress Firm Tampa'} - ${store?.distance || '2.1'} mi
📍 ${store?.address || '5678 Oak Ave, Tampa FL 33612'}

Lead ID: ${lead.leadId}`;
  }
  
  // Standard/Basic leads
  return `💰 ${lead.priority === 'standard' ? 'QUALIFIED' : 'BASIC'} LEAD
${lead.name} - ${lead.phone}
Need: ${lead.mattressSize} ${mattressOption.name} (${price})
Budget: ${getBudgetLabel(lead.budgetRange)} | ZIP: ${lead.zipCode}
Urgency: ${lead.urgency}

ACTION: ${lead.priority === 'standard' ? 'Follow up if needed' : 'Self-service route'}

Lead ID: ${lead.leadId}`;
}

export function generateCustomerConfirmation(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  const price = getPrice(lead.mattressType, lead.mattressSize);
  
  return `You're all set, ${lead.name}!

Your ${lead.mattressSize} ${mattressOption.name} is ready for pickup:

📍 ${store?.name || 'Mattress Firm Tampa'}
${store?.address || '5678 Oak Ave, Tampa FL 33612'}
📞 ${store?.phone || '(813) 555-0124'}
⏰ Open until ${store?.hours || '9 PM'}

🚗 Just ${store?.distance || '2.1'} miles away - fits in your back seat!

💰 Your price: ${price}
✅ Try it first, then decide

Need directions? Reply DIRECTIONS
Questions? Reply HELP

Click, click, click, set. Sleep on it tonight.`;
}

export function generateFollowUp30Min(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  const price = getPrice(lead.mattressType, lead.mattressSize);
  
  return `Hi ${lead.name}!

Just checking - are you on your way to pick up your ${lead.mattressSize} ${mattressOption.name}?

${store?.name || 'Mattress Firm Tampa'} has it ready for you to test first.

If you're running late or need to reschedule, just reply and let us know!

Your price is still locked: ${price}

Reply DIRECTIONS for GPS link
Reply POSTPONE to reschedule`;
}

export function generateFollowUp2Hour(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  const price = getPrice(lead.mattressType, lead.mattressSize);
  
  return `Hey ${lead.name},

We want to make sure you get your mattress deal! Your ${lead.mattressSize} ${mattressOption.name} is still reserved.

Common questions:
❓ "Does it really fit in my car?" - YES! Comes in a box
❓ "Can I test it first?" - YES! Try before you buy  
❓ "Is the price still good?" - YES! ${price} locked in

Need help? Call/text: (813) 555-9999
Store direct: ${store?.phone || '(813) 555-0124'}

Ready when you are!`;
}

export function generateFollowUp24Hour(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  const price = getPrice(lead.mattressType, lead.mattressSize);
  
  return `${lead.name}, your mattress deal expires soon!

We held your ${lead.mattressSize} ${mattressOption.name} for 24 hours at ${price}.

✅ Still available at ${store?.name || 'Mattress Firm Tampa'}
✅ Still fits in your car  
✅ Still try before you buy

Want to keep your reservation? Reply YES
Need different timing? Reply RESCHEDULE
Have questions? Reply HELP

Click, click, click, set. Don't wait another night.`;
}

// Response templates for manual replies - Pure Urgency System
export function generateCarFitResponse(lead: Lead): string {
  return `Great question! Your ${lead.mattressSize} mattress comes compressed in a box that fits on the back seat of any car - even a Prius!

Once you get it home, cut the plastic and it expands to full size. Simple!

Ready to pick up today?`;
}

export function generateRescheduleResponse(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  const price = getPrice(lead.mattressType, lead.mattressSize);
  
  return `No problem, ${lead.name}! We can hold your ${lead.mattressSize} ${mattressOption.name} and your ${price} price for up to 48 more hours.

When works better for you?
• Today after 5pm?
• Tomorrow morning?  
• This weekend?

Just let me know and I'll update ${store?.name || 'Mattress Firm Tampa'}`;
}

// Helper functions for Pure Urgency System
function getMattressDetails(mattressType: string) {
  const mattressOptions = {
    "F": {
      name: "Firm",
      comfort: "8 inches - Back & stomach sleepers",
      description: "Firm support"
    },
    "M": {
      name: "Medium", 
      comfort: "10 inches - Most popular",
      description: "Balanced comfort"
    },
    "S": {
      name: "Soft",
      comfort: "12 inches - Side sleepers", 
      description: "Pressure relief"
    },
    "H": {
      name: "Hybrid",
      comfort: "10 inches - Coil + foam",
      description: "Best of both worlds"
    }
  };
  
  return mattressOptions[mattressType as keyof typeof mattressOptions] || mattressOptions["M"];
}

function getPrice(mattressType: string, mattressSize: string) {
  const pricing = {
    "F": { "Twin": "$199.99", "Full": "$249.99", "Queen": "$299.99", "King": "$399.99" },
    "M": { "Twin": "$299.99", "Full": "$349.99", "Queen": "$399.99", "King": "$499.99" },
    "S": { "Twin": "$549.99", "Full": "$599.99", "Queen": "$699.99", "King": "$799.99" },
    "H": { "Twin": "$399.99", "Full": "$449.99", "Queen": "$499.99", "King": "$599.99" }
  };
  
  const typeMap = pricing[mattressType as keyof typeof pricing];
  return typeMap?.[mattressSize as keyof typeof typeMap] || "$399";
}

function getBudgetLabel(budgetRange: string) {
  const labels = {
    "under_400": "Under $400",
    "400_799": "$400-$799", 
    "800_plus": "$800+"
  };
  return labels[budgetRange as keyof typeof labels] || "Standard";
}

// Remove unused function - Pure Urgency focuses on speed, not complex savings calculations

// SMS automation logic
export async function triggerSMSAutomation(lead: Lead, store: any) {
  try {
    // 1. Send immediate owner alert
    const ownerAlert = generateOwnerAlert(lead, store);
    await sendSMS(process.env.OWNER_PHONE || "8135559999", ownerAlert, "owner_alert", lead.leadId);
    
    // 2. Send customer confirmation
    const customerConfirmation = generateCustomerConfirmation(lead, store);
    await sendSMS(lead.phone, customerConfirmation, "customer_confirmation", lead.leadId);
    
    // 3. Schedule follow-up sequence
    scheduleFollowUp(lead.leadId, 30 * 60 * 1000); // 30 minutes
    
    console.log(`SMS automation triggered for lead ${lead.leadId}`);
    
  } catch (error) {
    console.error("SMS automation error:", error);
  }
}

async function sendSMS(phone: string, message: string, messageType: string, leadId: string) {
  // In production, this would use Twilio
  // For now, we'll just log the messages
  console.log(`\n📱 SMS [${messageType}] to ${phone}:`);
  console.log("─".repeat(50));
  console.log(message);
  console.log("─".repeat(50));
  
  // Here you would implement actual Twilio integration:
  /*
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    
    console.log(`SMS sent successfully: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('Twilio error:', error);
    throw error;
  }
  */
}

function scheduleFollowUp(leadId: string, delay: number) {
  setTimeout(async () => {
    // In production, this would be handled by a job queue
    console.log(`⏰ Follow-up triggered for lead ${leadId} after ${delay/1000/60} minutes`);
    // Here you would check if the lead still needs follow-up and send the next message
  }, delay);
}

// Lead status management
export function updateLeadStatus(leadId: string, status: "hot" | "warm" | "contacted" | "converted" | "expired") {
  // This would update the lead status in the database
  console.log(`Lead ${leadId} status updated to: ${status}`);
}

export function markLeadAsPickedUp(leadId: string) {
  // This would mark the lead as picked up to stop the automation sequence
  console.log(`Lead ${leadId} marked as picked up - automation stopped`);
}