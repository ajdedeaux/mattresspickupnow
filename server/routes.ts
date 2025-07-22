import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, findStoresSchema, type Store } from "@shared/schema";
import { triggerSMSAutomation, generateOwnerAlert } from "./sms-automation";
import { detectPersona } from "./persona-engine";
import { z } from "zod";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Serve attached assets (videos, images, etc.) with proper MIME types
  app.use('/attached_assets', express.static('attached_assets', {
    setHeaders: (res, path) => {
      if (path.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (path.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      } else if (path.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/quicktime');
      }
    }
  }));
  
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

  // Create new lead endpoint with persona detection
  app.post("/api/leads", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertLeadSchema.parse(req.body);
      
      // Generate unique lead ID
      const leadId = `MPN${Date.now()}`;
      
      // Run persona detection engine
      const personaAnalysis = detectPersona(validatedData);
      
      // Determine priority based on persona and routing tier
      let priority = "standard";
      if (personaAnalysis.routingTier === "direct_to_aj") {
        priority = "high";
      } else if (validatedData.budgetRange === "under_400") {
        priority = "basic";
      }
      
      // Calculate price based on size and type per master spec
      const mattressOptions = [
        { id: "F", sizes: { "Twin": "$199", "Full": "$249", "Queen": "$299", "King": "$349" } },
        { id: "M", sizes: { "Twin": "$299", "Full": "$349", "Queen": "$399", "King": "$449" } },
        { id: "S", sizes: { "Twin": "$497", "Full": "$597", "Queen": "$697", "King": "$797" } },
        { id: "H", sizes: { "Twin": "$399", "Full": "$449", "Queen": "$499", "King": "$549" } }
      ];
      const selectedOption = mattressOptions.find(opt => opt.id === validatedData.mattressType);
      const price = selectedOption?.sizes[validatedData.mattressSize] || "Contact for pricing";
      
      // Create lead with persona data
      const lead = await storage.createLead({
        ...validatedData,
        leadId,
        priority,
        price,
        persona: personaAnalysis.persona,
        routingTier: personaAnalysis.routingTier,
      });
      
      // Get store information (using mock data for now)
      const mockStore = {
        name: "Mattress Firm Tampa",
        address: "5678 Oak Ave, Tampa FL 33612", 
        distance: "2.1",
        phone: "(813) 555-0124",
        hours: "9 PM"
      };
      
      // Trigger SMS automation based on routing tier
      if (personaAnalysis.routingTier === "direct_to_aj") {
        await triggerSMSAutomation(lead, mockStore);
        await generateOwnerAlert(lead);
      } else {
        await triggerSMSAutomation(lead, mockStore);
      }
      
      res.status(201).json({
        success: true,
        leadId,
        priority,
        persona: personaAnalysis.persona,
        routingTier: personaAnalysis.routingTier,
        confidence: personaAnalysis.confidence,
        reasoning: personaAnalysis.reasoning,
        message: personaAnalysis.routingTier === "direct_to_aj"
          ? "High priority lead - AJ will contact you within 15 minutes!" 
          : "Lead captured successfully!"
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

  // CSV Export for Data Ownership (AJ must own all leads)
  app.get("/api/leads/export", async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      
      // CSV headers
      const csvHeaders = [
        'Lead ID', 'Created At', 'Name', 'Phone', 'Email', 'ZIP Code',
        'Mattress Size', 'Mattress Type', 'Budget Range', 'Urgency',
        'Persona', 'Routing Tier', 'Priority', 'Status', 'Price', 'Store Name',
        'Store Phone', 'Store Address', 'Picked Up', 'Follow Up Stage'
      ];
      
      // Convert leads to CSV format
      const csvRows = leads.map((lead: Lead) => [
        lead.leadId,
        lead.createdAt?.toISOString() || '',
        lead.name,
        lead.phone,
        lead.email || '',
        lead.zipCode,
        lead.mattressSize,
        lead.mattressType,
        lead.budgetRange,
        lead.urgency,
        lead.persona || '',
        lead.routingTier || '',
        lead.priority,
        lead.status,
        lead.price || '',
        lead.storeName || '',
        lead.storePhone || '',
        lead.storeAddress || '',
        lead.pickedUp ? 'Yes' : 'No',
        lead.followUpStage || 0
      ]);
      
      // Generate CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row: (string | number | boolean)[]) => row.map((field: string | number | boolean) => `"${field}"`).join(','))
      ].join('\n');
      
      // Set appropriate headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="mattresspickupnow-leads-${new Date().toISOString().split('T')[0]}.csv"`);
      
      res.send(csvContent);
      
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export leads"
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
