import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, findStoresSchema, type Store } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Find stores near ZIP code endpoint
  app.post("/api/find-stores", async (req, res) => {
    try {
      const validatedData = findStoresSchema.parse(req.body);
      const stores = await findStoresNear(validatedData.zipCode);
      
      res.json({
        success: true,
        zipCode: validatedData.zipCode,
        storesFound: stores.length,
        stores: stores
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Invalid ZIP code format",
          errors: error.errors
        });
      } else {
        console.error("Store search error:", error);
        res.status(500).json({
          success: false,
          message: "Unable to search for stores"
        });
      }
    }
  });

  // Create new lead endpoint
  app.post("/api/leads", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertLeadSchema.parse(req.body);
      
      // Create lead in storage
      const lead = await storage.createLead(validatedData);
      
      // Send SMS notification to owner (mock for now - would use Twilio in production)
      const ownerNotification = formatOwnerNotification(lead);
      console.log("SMS Notification to Owner:", ownerNotification);
      
      // In production, would send actual SMS:
      // await sendTwilioSMS(process.env.OWNER_PHONE, ownerNotification);
      
      res.status(201).json({
        success: true,
        leadId: lead.leadId,
        message: "Lead created successfully"
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      } else {
        console.error("Error creating lead:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function formatOwnerNotification(lead: any): string {
  const mattressNames: Record<string, string> = {
    'sealy-firm': 'Sealy Memory Foam Firm',
    'sealy-medium': 'Sealy Memory Foam Medium', 
    'sealy-soft': 'Sealy Memory Foam Soft',
    'basic-hybrid': 'Basic Hybrid'
  };

  return `NEW PICKUP LEAD

${lead.name} - ${lead.phone}
ZIP: ${lead.zipCode}
Mattress: ${mattressNames[lead.mattressType] || lead.mattressType}
Email: ${lead.email || "Not provided"}

${new Date().toLocaleString()}
Lead ID: ${lead.leadId}

Customer is texting Podium now!
Expected commission: $17-36`;
}

// Store finder using Google Places API (or fallback mock data for development)
async function findStoresNear(zipCode: string): Promise<Store[]> {
  // In production, this would use Google Places API
  // For now, we'll simulate realistic store data
  
  const mockStores: Store[] = [
    {
      id: "store_1",
      name: "Mattress Store",
      address: `1234 Main St, ${zipCode}`,
      distance: 2.1,
      rating: 4.3,
      isOpen: true,
      hours: "Open until 9 PM",
      phone: "(813) 555-0123"
    },
    {
      id: "store_2", 
      name: "Mattress Store",
      address: `5678 Oak Ave, ${zipCode}`,
      distance: 3.5,
      rating: 4.1,
      isOpen: true,
      hours: "Open until 8 PM",
      phone: "(813) 555-0124"
    },
    {
      id: "store_3",
      name: "Mattress Store", 
      address: `9012 Pine Rd, ${zipCode}`,
      distance: 5.2,
      rating: 4.5,
      isOpen: false,
      hours: "Closed - Opens 9 AM tomorrow",
      phone: "(813) 555-0125"
    }
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return mockStores.slice(0, 3); // Return top 3 stores
}

// Mock Twilio function - replace with actual Twilio SDK in production
async function sendTwilioSMS(to: string, message: string) {
  // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // return await twilio.messages.create({
  //   body: message,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: to
  // });
  console.log(`Would send SMS to ${to}: ${message}`);
}
