import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
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
  const mattressNames = {
    'sealy-firm': 'Sealy Memory Foam Firm',
    'sealy-medium': 'Sealy Memory Foam Medium', 
    'sealy-soft': 'Sealy Memory Foam Soft',
    'basic-hybrid': 'Basic Hybrid'
  };

  return `🚨 NEW PICKUP LEAD 🚨

${lead.name} - ${lead.phone}
📍 ZIP: ${lead.zipCode}
🛏️ Mattress: ${mattressNames[lead.mattressType]}
📧 Email: ${lead.email || "Not provided"}

⏰ ${new Date().toLocaleString()}
🔢 Lead ID: ${lead.leadId}

Customer is texting Podium now!
Expected commission: $17-36`;
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
