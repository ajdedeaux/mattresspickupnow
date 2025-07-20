import type { Lead } from "@shared/schema";

// SMS message templates based on the provided specification
export function generateOwnerAlert(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  
  return `🚨 HOT LEAD - MATTRESS PICKUP 🚨

${lead.name} - ${lead.phone}
📍 ${lead.zipCode} | 🛏️ ${lead.mattressSize || 'Queen'} ${mattressOption.name} | 💰 ${mattressOption.price}
⏰ Pickup: ${lead.pickupTime || 'Today'} | Comfort: ${mattressOption.comfort}

NEAREST STORE:
📞 ${store?.name || 'Mattress Firm Tampa'} - ${store?.distance || '2.1'} mi - ${store?.phone || '(813) 555-0124'}
📍 ${store?.address || '5678 Oak Ave, Tampa FL 33612'}

ACTION NEEDED:
1. Check inventory at ${store?.name || 'Mattress Firm Tampa'}
2. Call store to prep ${lead.mattressSize || 'Queen'} ${mattressOption.name}
3. Follow up with customer if needed

Lead ID: ${lead.leadId}`;
}

export function generateCustomerConfirmation(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  
  return `🎉 You're all set, ${lead.name}!

Your ${lead.mattressSize || 'Queen'} ${mattressOption.name} is reserved at ${store?.name || 'Mattress Firm'}:

📍 ${store?.address || '5678 Oak Ave, Tampa FL 33612'}
📞 ${store?.phone || '(813) 555-0124'}
⏰ Open until ${store?.hours || '9 PM'}

🚗 Just ${store?.distance || '2.1'} miles away - it fits on your back seat!

💰 Your locked price: ${mattressOption.price}

Need directions? Reply DIRECTIONS
Questions? Reply HELP

Drive safe! 🛏️✨`;
}

export function generateFollowUp30Min(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  
  return `Hi ${lead.name}! 👋

Just checking - are you on your way to pick up your ${lead.mattressSize || 'Queen'} ${mattressOption.name}?

${store?.name || 'Mattress Firm'} has it ready for you to test first.

If you're running late or need to reschedule, just reply and let us know!

Your price is still locked: ${mattressOption.price} ✅

Reply DIRECTIONS for GPS link
Reply POSTPONE to reschedule`;
}

export function generateFollowUp2Hour(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  
  return `Hey ${lead.name},

We want to make sure you get your mattress deal! Your ${lead.mattressSize || 'Queen'} ${mattressOption.name} is still reserved.

Common questions:
❓ "Does it really fit in my car?" - YES! Comes in a box
❓ "Can I test it first?" - YES! Try before you buy
❓ "Is the price still good?" - YES! ${mattressOption.price} locked in

Need help? Call/text: (813) 555-9999
Store direct: ${store?.phone || '(813) 555-0124'}

Ready when you are! 🛏️`;
}

export function generateFollowUp24Hour(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  const savings = calculateSavings(mattressOption.price, mattressOption.originalPrice);
  
  return `${lead.name}, your mattress deal expires soon! ⏰

We held your ${lead.mattressSize || 'Queen'} ${mattressOption.name} for 24 hours at the exclusive price of ${mattressOption.price}.

✅ Still available at ${store?.name || 'Mattress Firm'}
✅ Still fits in your car
✅ Still try before you buy

Want to keep your reservation? Reply YES
Need different timing? Reply RESCHEDULE
Have questions? Reply HELP

Don't miss out on saving $${savings}! 💰`;
}

// Response templates for manual replies
export function generateCarFitResponse(lead: Lead): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  
  return `Great question! Your ${lead.mattressSize || 'Queen'} ${mattressOption.name} comes compressed in a box that's about the size of a large suitcase. It easily fits on the back seat of any car - even small cars like Honda Civics! 🚗

Once you get it home, cut the plastic and it expands to full size in a few hours. Magic! ✨`;
}

export function generateRescheduleResponse(lead: Lead, store: any): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  
  return `No problem, ${lead.name}! We can hold your ${lead.mattressSize || 'Queen'} ${mattressOption.name} and your ${mattressOption.price} price for up to 48 more hours.

When works better for you?
• Today after 5pm?
• Tomorrow morning?
• This weekend?

Just let me know and I'll update ${store?.name || 'Mattress Firm'} 👍`;
}

export function generateBudgetConcernResponse(lead: Lead): string {
  const mattressOption = getMattressDetails(lead.mattressType);
  const savings = calculateSavings(mattressOption.price, mattressOption.originalPrice);
  
  return `I totally understand, ${lead.name}! Here's the thing - this ${lead.mattressSize || 'Queen'} ${mattressOption.name} normally costs ${mattressOption.originalPrice}, but you're getting it for ${mattressOption.price}.

That's a savings of $${savings}! These prices are from our special pickup program and won't last.

Plus, you can test it in the store first - no risk! 🛏️`;
}

// Helper functions
function getMattressDetails(mattressType: string) {
  const mattressOptions = {
    "sealy-firm": {
      name: "Sealy Memory Foam Firm",
      comfort: "Firm",
      price: "$299",
      originalPrice: "$699"
    },
    "sealy-medium": {
      name: "Sealy Memory Foam Medium", 
      comfort: "Medium",
      price: "$349",
      originalPrice: "$749"
    },
    "sealy-soft": {
      name: "Sealy Memory Foam Soft",
      comfort: "Soft", 
      price: "$399",
      originalPrice: "$799"
    },
    "basic-hybrid": {
      name: "Basic Hybrid Mattress",
      comfort: "Medium",
      price: "$249",
      originalPrice: "$549"
    }
  };
  
  return mattressOptions[mattressType as keyof typeof mattressOptions] || mattressOptions["sealy-medium"];
}

function calculateSavings(currentPrice: string, originalPrice: string): string {
  const current = parseInt(currentPrice.replace('$', ''));
  const original = parseInt(originalPrice.replace('$', ''));
  return (original - current).toString();
}

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