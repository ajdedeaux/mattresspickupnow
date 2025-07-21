import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, findStoresSchema, type Store } from "@shared/schema";
import { triggerSMSAutomation, generateOwnerAlert } from "./sms-automation";
import { z } from "zod";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Serve attached assets (videos, images, etc.)
  app.use('/attached_assets', express.static('attached_assets'));
  
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
      
      // Get store information (using mock data for now)
      const mockStore = {
        name: "Mattress Firm Tampa",
        address: "5678 Oak Ave, Tampa FL 33612", 
        distance: "2.1",
        phone: "(813) 555-0124",
        hours: "9 PM"
      };
      
      // Trigger SMS automation sequence
      await triggerSMSAutomation(lead, mockStore);
      
      res.status(201).json({
        success: true,
        leadId: lead.leadId,
        message: "Lead created and SMS automation triggered"
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

  // SMS Automation Management Endpoints
  
  // Mark lead as picked up (stops automation)
  app.post("/api/leads/:leadId/pickup", async (req, res) => {
    try {
      const { leadId } = req.params;
      const lead = await storage.getLeadByLeadId(leadId);
      
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: "Lead not found"
        });
      }
      
      // Update lead status
      // In production, this would update the database
      console.log(`Lead ${leadId} marked as picked up - automation stopped`);
      
      res.json({
        success: true,
        message: "Lead marked as picked up"
      });
      
    } catch (error) {
      console.error("Error marking pickup:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Manual SMS sending endpoint
  app.post("/api/leads/:leadId/sms", async (req, res) => {
    try {
      const { leadId } = req.params;
      const { messageType, customMessage } = req.body;
      
      const lead = await storage.getLeadByLeadId(leadId);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: "Lead not found"
        });
      }
      
      // Send custom SMS (would use Twilio in production)
      console.log(`Manual SMS sent to lead ${leadId}: ${customMessage || messageType}`);
      
      res.json({
        success: true,
        message: "SMS sent successfully"
      });
      
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
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
