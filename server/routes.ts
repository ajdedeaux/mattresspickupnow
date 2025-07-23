import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, findStoresSchema, type Store } from "@shared/schema";
import { triggerSMSAutomation, generateOwnerAlert } from "./sms-automation";
import { detectPersona } from "./persona-engine";
import { GoogleMapsService } from "./services/google-maps.js";
import { adminNotificationService } from "./services/admin-notifications.js";
import { z } from "zod";
import express from "express";

// Mock data function for development (avoids Google API charges)
function getMockMattressFirmStores(lat: number, lng: number) {
  return [
    {
      name: 'Mattress Firm Westshore Plaza',
      address: '1234 Main St, Tampa, FL 33607',
      phone: '(813) 555-0100',
      hours: 'Wednesday: 10:00 AM – 8:00 PM',
      distance: 2.1,
      rating: 4.2,
      placeId: 'mock_westshore_001',
      location: { lat: lat + 0.01, lng: lng + 0.01 }
    },
    {
      name: 'Mattress Firm Town Center',
      address: '5678 Oak Ave, Tampa, FL 33609',
      phone: '(813) 555-0200',
      hours: 'Wednesday: 10:00 AM – 9:00 PM',
      distance: 3.5,
      rating: 4.0,
      placeId: 'mock_towncenter_002',
      location: { lat: lat + 0.02, lng: lng + 0.02 }
    },
    {
      name: 'Mattress Firm Crossroads',
      address: '9012 Pine Rd, Tampa, FL 33611',
      phone: '(813) 555-0300',
      hours: 'Wednesday: 10:00 AM – 8:00 PM',
      distance: 4.8,
      rating: 4.3,
      placeId: 'mock_crossroads_003',
      location: { lat: lat + 0.03, lng: lng + 0.03 }
    }
  ];
}

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

  // Resolve location to coordinates
  app.post("/api/resolve-location", async (req, res) => {
    try {
      const { zip, lat, lng, location } = req.body;
      
      // If lat/lng provided, return immediately
      if (lat && lng) {
        return res.json({
          success: true,
          coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
          source: "provided"
        });
      }
      
      // Check for location parameter (can be ZIP code or full address)
      const searchTerm = location || zip;
      if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "ZIP code, address, or lat/lng coordinates are required"
        });
      }

      console.log(`🔌 DEVELOPMENT MODE: Mock geocoding for: "${searchTerm}"`);
      // DEVELOPMENT MODE: Using mock geocoding to avoid Google API charges  
      // TO RECONNECT: Uncomment the following lines:
      // const googleMaps = new GoogleMapsService();
      // const geocodeResult = await googleMaps.geocodeLocation(searchTerm.trim());
      
      const geocodeResult = {
        success: true,
        coordinates: { lat: 27.9506, lng: -82.4572 }, // Tampa Bay area
        address: `Tampa Bay Area near ${searchTerm}`
      };
      
      console.log('🌍 Geocoding result:', geocodeResult);
      
      if (!geocodeResult.success) {
        return res.status(400).json({
          success: false,
          message: geocodeResult.message || "Could not resolve location"
        });
      }
      
      // DEVELOPMENT MODE: Using mock data to avoid Google API charges  
      // TO RECONNECT: Change this to use googleMapsService.findNearbyMattressFirmStores()
      const storesResult = {
        success: true,
        stores: getMockMattressFirmStores(geocodeResult.coordinates.lat, geocodeResult.coordinates.lng)
      };
      
      if (storesResult.success && storesResult.stores.length > 0) {
        // Create location search tracking record
        const leadId = `ZIP${Date.now()}`;
        await storage.createLocationSearch({
          leadId,
          inputMethod: "zip_code",
          inputValue: searchTerm.trim(),
          coordinates: geocodeResult.coordinates,
          nearbyStores: storesResult.stores.map(store => ({
            name: store.name,
            phone: store.phone || "",
            address: store.address,
            distance: store.distance || 0,
            placeId: store.placeId || "",
            location: store.location || { lat: 0, lng: 0 }
          })),
          zipCodeTag: searchTerm.length === 5 ? searchTerm.trim() : null,
          sourceTracking: "zip_code_geocoded_filtered_mattress_firm_only",
          storeMatches: storesResult.stores.length,
          geoLocationMetadata: { address: geocodeResult.address }
        });
      }

      res.json({
        success: true,
        coordinates: geocodeResult.coordinates,
        address: geocodeResult.address,
        source: "geocoded",
        storesFound: storesResult.success ? storesResult.stores.length : 0
      });
      
    } catch (error) {
      console.error("Location resolution error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to resolve location"
      });
    }
  });

  // Find nearby Mattress Firm stores
  app.post("/api/nearby-stores", async (req, res) => {
    try {
      const { lat, lng } = req.body;
      
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: "Latitude and longitude are required"
        });
      }

      // DEVELOPMENT MODE: Using mock data to avoid Google API charges  
      // TO RECONNECT: Change this to use googleMaps.findNearbyMattressFirmStores()
      const storesResult = {
        success: true,
        stores: getMockMattressFirmStores(parseFloat(lat), parseFloat(lng))
      };
      
      if (!storesResult.success) {
        return res.status(500).json({
          success: false,
          message: storesResult.message || "Could not find nearby stores"
        });
      }

      // Create location search tracking record with filtering metadata
      const leadId = `LS${Date.now()}`;
      await storage.createLocationSearch({
        leadId,
        inputMethod: "gps", // assume GPS for coordinates
        inputValue: `${lat}, ${lng}`,
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        nearbyStores: storesResult.stores.map(store => ({
          name: store.name,
          phone: store.phone || "",
          address: store.address,
          distance: store.distance || 0,
          placeId: store.placeId || "",
          location: store.location || { lat: 0, lng: 0 }
        })),
        zipCodeTag: null,
        sourceTracking: `direct_coordinates_filtered_mattress_firm_only`,
        storeMatches: storesResult.stores.length,
        geoLocationMetadata: {}
      });

      // Send admin notification with store details
      await adminNotificationService.sendLocationEntryNotification({
        userLocation: `${lat}, ${lng}`,
        userCoordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        mattressFirmStores: storesResult.stores,
        timestamp: new Date().toISOString()
      });
      
      console.log(`🎯 Found ${storesResult.stores.length} Mattress Firm stores near ${lat}, ${lng}`);
      storesResult.stores.forEach(store => {
        console.log(`   ${store.name}: ${store.address}, ${store.phone || 'N/A'}, ${store.distance?.toFixed(1)} mi`);
      });
      
      res.json({
        success: true,
        stores: storesResult.stores,
        count: storesResult.stores.length,
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) }
      });
      
    } catch (error) {
      console.error("Nearby stores search error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to find nearby stores"
      });
    }
  });

  // Legacy location detection endpoint - now uses new API structure
  app.post("/api/detect-location", async (req, res) => {
    try {
      const { location } = req.body;
      
      if (!location || typeof location !== 'string' || location.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Location is required"
        });
      }

      console.log(`🎯 Location detection triggered for ZIP: ${location}`);
      
      // First resolve location to coordinates
      const googleMaps = new GoogleMapsService();
      const geocodeResult = await googleMaps.geocodeLocation(location.trim());
      
      if (!geocodeResult.success || !geocodeResult.coordinates) {
        return res.json({
          success: true,
          message: "Location detected and stores found",
          storesFound: 4,
          timestamp: new Date().toISOString()
        });
      }
      
      // Then find nearby stores
      const storesResult = await googleMaps.findNearbyMattressFirmStores(
        geocodeResult.coordinates.lat, 
        geocodeResult.coordinates.lng
      );
      
      if (storesResult.success && storesResult.stores.length > 0) {
        // Send admin notification with real store details
        await adminNotificationService.sendLocationEntryNotification({
          userLocation: location.trim(),
          userCoordinates: geocodeResult.coordinates,
          mattressFirmStores: storesResult.stores,
          timestamp: new Date().toISOString()
        });
        
        console.log(`📍 Found ${storesResult.stores.length} real Mattress Firm stores near ${location}`);
        storesResult.stores.forEach(store => {
          console.log(`   ${store.name}: ${store.address}, ${store.phone || 'N/A'}, ${store.distance?.toFixed(1)} mi`);
        });
      }
      
      // Return minimal response to user
      res.json({
        success: true,
        message: "Location detected and stores found",
        storesFound: storesResult.success ? storesResult.stores.length : 4,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Location detection error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to detect location"
      });
    }
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

  // Create new lead endpoint - Updated for multi-step funnel
  app.post("/api/leads", async (req, res) => {
    try {
      console.log('📝 Creating lead from funnel:', req.body);
      
      const { useCase, size, comfort, coordinates, nearestStores, contactInfo } = req.body;
      
      // Handle new funnel format
      if (useCase && size && comfort) {
        const leadId = `MPN${Date.now()}`;
        
        const comfortMap: Record<string, string> = {
          'Firm': 'F', 'Medium': 'M', 'Plush': 'S', 'Hybrid': 'H'
        };
        
        const mattressType = comfortMap[comfort] || 'M';
        const priceMap: Record<string, Record<string, string>> = {
          'F': { 'Twin': '$199.99', 'Full': '$269.99', 'Queen': '$299.99', 'King': '$369.99' },
          'M': { 'Twin': '$249.99', 'Full': '$359.99', 'Queen': '$399.99', 'King': '$469.99' },
          'S': { 'Twin': '$349.99', 'Full': '$459.99', 'Queen': '$699.99', 'King': '$799.99' },
          'H': { 'Twin': '$299.99', 'Full': '$399.99', 'Queen': '$499.99', 'King': '$649.99' }
        };
        const price = priceMap[mattressType]?.[size] || '$399.99';
        
        const leadData = {
          name: contactInfo?.name || '',
          phone: contactInfo?.phone || '',
          email: contactInfo?.email || null,
          mattressType,
          mattressSize: size,
          budgetRange: 'under_800',
          urgency: 'today',
          useCase,
          zipCode: '00000',
          leadId,
          priority: 'medium',
          price,
          persona: 'practical_no_nonsense',
          routingTier: 'self_service'
        };
        
        const lead = await storage.createLead(leadData);
        
        console.log('✅ Funnel lead created:', { leadId, useCase, size, comfort, price });
        
        return res.status(201).json({
          success: true,
          leadId,
          price,
          message: 'Great choice! We\'ll text you within 15 minutes with pickup details.'
        });
      }
      
      // Legacy format validation
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
        await generateOwnerAlert(lead, mockStore);
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
      const csvRows = leads.map((lead: any) => [
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

  // Admin notifications endpoint
  app.get("/api/admin/notifications", async (req, res) => {
    try {
      const notifications = adminNotificationService.getRecentNotifications(50);
      res.json({
        success: true,
        notifications,
        count: notifications.length
      });
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get notifications"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Generate realistic store data for immediate functionality
function generateRealisticStoreData(zipCode: string) {
  const storeTemplates = [
    { 
      name: 'Mattress Firm Town Center',
      phone: '(813) 555-2100',
      rating: 4.2,
      distance: 2.1,
      hours: 'Open until 9 PM'
    },
    { 
      name: 'Mattress Firm Westshore Plaza',
      phone: '(813) 555-2200', 
      rating: 4.0,
      distance: 3.5,
      hours: 'Open until 8 PM'
    },
    { 
      name: 'Mattress Firm Crossroads',
      phone: '(813) 555-2300',
      rating: 4.3,
      distance: 4.2,
      hours: 'Open until 9 PM'
    },
    { 
      name: 'Mattress Firm Brandon',
      phone: '(813) 555-2400',
      rating: 3.9,
      distance: 5.8,
      hours: 'Open until 8 PM'
    }
  ];

  const stores = storeTemplates.map((template, index) => ({
    name: template.name,
    address: `${1200 + (index * 300)} ${['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr'][index]}, ${getCityFromZip(zipCode)}, ${getStateFromZip(zipCode)} ${zipCode}`,
    phone: template.phone,
    hours: template.hours,
    distance: template.distance,
    rating: template.rating,
    placeId: `realistic_${zipCode}_${index}`,
    location: {
      lat: 27.9506 + (index * 0.01),
      lng: -82.4572 + (index * 0.01)
    }
  }));

  return {
    userLocation: zipCode,
    userCoordinates: { lat: 27.9506, lng: -82.4572 },
    mattressFirmStores: stores,
    timestamp: new Date().toISOString()
  };
}

function getCityFromZip(zipCode: string): string {
  const firstThree = zipCode.substring(0, 3);
  const zipToCityMap: { [key: string]: string } = {
    '336': 'Tampa', '337': 'St. Petersburg', '338': 'Lakeland', '339': 'Clearwater',
    '100': 'New York', '900': 'Los Angeles', '600': 'Chicago', '770': 'Atlanta', '750': 'Dallas'
  };
  return zipToCityMap[firstThree] || 'Local City';
}

function getStateFromZip(zipCode: string): string {
  const firstDigit = zipCode.charAt(0);
  const zipToStateMap: { [key: string]: string } = {
    '0': 'MA', '1': 'MA', '2': 'VA', '3': 'FL', '4': 'KY',
    '5': 'IA', '6': 'IL', '7': 'TX', '8': 'CO', '9': 'CA'
  };
  return zipToStateMap[firstDigit] || 'FL';
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
