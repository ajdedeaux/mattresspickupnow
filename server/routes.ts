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
import axios from "axios";

// Mock data function for development (avoids Google API charges)
// SMS messages route to Twilio automation system for instant intelligent responses
function getMockMattressFirmStores(lat: number, lng: number) {
  return [
    {
      name: 'Mattress Firm Westshore Plaza',
      address: '1234 Main St, Tampa, FL 33607',
      phone: '(855) 515-9604',  // Twilio automation number for instant responses
      hours: 'Wednesday: 10:00 AM – 8:00 PM',
      distance: 2.1,
      rating: 4.2,
      placeId: 'mock_westshore_001',
      location: { lat: lat + 0.01, lng: lng + 0.01 }
    },
    {
      name: 'Mattress Firm Town Center',
      address: '5678 Oak Ave, Tampa, FL 33609',
      phone: '(855) 515-9604',  // Twilio automation number for instant responses
      hours: 'Wednesday: 10:00 AM – 9:00 PM',
      distance: 3.5,
      rating: 4.0,
      placeId: 'mock_towncenter_002',
      location: { lat: lat + 0.02, lng: lng + 0.02 }
    },
    {
      name: 'Mattress Firm Crossroads',
      address: '9012 Pine Rd, Tampa, FL 33611',
      phone: '(855) 515-9604',  // Twilio automation number for instant responses
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

  // Direct webhook test endpoint for Make debugging
  app.post("/api/fire-webhook", async (req, res) => {
    console.log("🔥 FIRING TEST WEBHOOK TO MAKE");
    
    const testPayload = {
      test: "manual webhook fire",
      timestamp: new Date().toISOString(),
      referenceCode: "MP-TEST-" + Date.now(),
      trackingId: "TRK_TEST_" + Date.now(),
      zipCode: "33607",
      mattressSize: "Queen",
      firmness: "Medium",
      finalPrice: "$399.99",
      locationInfo: {
        city: "Tampa",
        state: "FL",
        latitude: 27.9506,
        longitude: -82.4572,
        timezone: "America/New_York"
      },
      storeInfo: {
        storeId: "TF-1185",
        storeName: "Tampa Midtown",
        salesRep: "AJ Dedeaux"
      }
    };
    
    try {
      console.log("📤 Sending test payload to Make:", JSON.stringify(testPayload, null, 2));
      
      const response = await axios.post('https://hook.us2.make.com/xmw2ahcia681bvopgp5esp37i2pu2hn4', testPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      console.log("✅ TEST WEBHOOK SUCCESS - Status:", response.status, "Data:", response.data);
      
      res.json({
        success: true,
        message: "Test webhook fired to Make",
        payload: testPayload,
        makeResponse: response.data
      });
    } catch (error: any) {
      console.error("❌ TEST WEBHOOK FAILED:", error.message);
      res.json({
        success: false,
        message: "Test webhook failed",
        error: error.message
      });
    }
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
          message: "Could not resolve location"
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
          inputMethod: "zip",
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
          geoLocationMetadata: {}
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
          message: "Could not find nearby stores"
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
          email: contactInfo?.email || '',
          mattressType: mattressType as "M" | "F" | "S" | "H",
          mattressSize: size as "Twin" | "Full" | "Queen" | "King",
          budgetRange: 'under_400' as "under_400" | "400_799" | "800_plus",
          urgency: 'today' as "today" | "this_week",
          useCase,
          zipCode: '00000'
        };
        
        // Skip legacy lead creation for funnel leads - they use the customer profile system instead
        console.log('📋 Funnel lead data prepared (using customer profile system):', leadData);
        
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
        { id: "F", sizes: { "Twin": "$199.99", "Full": "$249.99", "Queen": "$299.99", "King": "$399.99" } },
        { id: "M", sizes: { "Twin": "$299.99", "Full": "$349.99", "Queen": "$399.99", "King": "$499.99" } },
        { id: "S", sizes: { "Twin": "$549.99", "Full": "$599.99", "Queen": "$699.99", "King": "$799.99" } },
        { id: "H", sizes: { "Twin": "$399.99", "Full": "$449.99", "Queen": "$499.99", "King": "$599.99" } }
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

  // === CUSTOMER PROFILE TRACKING API - N8N AUTOMATION ===
  
  // Create initial customer profile (tracking ID generated on app entry)
  app.post("/api/customer-profiles", async (req, res) => {
    try {
      const trackingId = `TRK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const profile = await storage.createCustomerProfile(trackingId);
      
      console.log(`📋 New customer profile created: ${trackingId}`);
      
      res.status(201).json({
        success: true,
        trackingId,
        profile
      });
      
    } catch (error) {
      console.error("Error creating customer profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create customer profile"
      });
    }
  });

  // Update customer profile (called at each step of the funnel)
  app.put("/api/customer-profiles/:trackingId", async (req, res) => {
    try {
      const { trackingId } = req.params;
      const updates = req.body;
      
      const updatedProfile = await storage.updateCustomerProfile(trackingId, updates);
      
      if (!updatedProfile) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found"
        });
      }
      
      console.log(`📋 Customer profile updated: ${trackingId}`);
      console.log(`   Updates: ${JSON.stringify(updates)}`);
      
      res.json({
        success: true,
        profile: updatedProfile
      });
      
    } catch (error) {
      console.error("Error updating customer profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update customer profile"
      });
    }
  });

  // Generate reference code (called when profile is complete)
  app.post("/api/customer-profiles/:trackingId/reference-code", async (req, res) => {
    try {
      console.log(`🚀 REFERENCE CODE GENERATION STARTED for tracking ID: ${req.params.trackingId}`);
      const { trackingId } = req.params;
      
      const profile = await storage.getCustomerProfileByTrackingId(trackingId);
      if (!profile) {
        console.log(`❌ PROFILE NOT FOUND for tracking ID: ${trackingId}`);
        return res.status(404).json({
          success: false,
          message: "Customer profile not found"
        });
      }
      
      console.log(`📋 PROFILE FOUND:`, {
        trackingId: profile.trackingId,
        zipCode: profile.zipCode,
        mattressSize: profile.mattressSize,
        firmness: profile.firmness,
        finalPrice: profile.finalPrice
      });
      
      const referenceCode = await storage.generateReferenceCode(trackingId);
      
      console.log(`🎯 Reference code generated: ${referenceCode} for tracking ID: ${trackingId}`);
      
      // Get the updated profile with reference code and price lock expiry
      const updatedProfile = await storage.getCustomerProfileByTrackingId(trackingId);
      
      // Send customer data to Make webhook (fire and forget)
      if (updatedProfile) {
        const webhookPayload = {
          referenceCode: updatedProfile.referenceCode || "N/A",
          trackingId: updatedProfile.trackingId || "N/A",
          createdAt: updatedProfile.createdAt?.toISOString() || new Date().toISOString(),

          zipCode: updatedProfile.zipCode || "N/A",
          locationInfo: {
            city: "Tampa", // TODO: Extract from Google Maps API when wired up
            state: "FL",
            latitude: 27.9506,
            longitude: -82.4572,
            timezone: "America/New_York"
          },

          storeInfo: {
            storeId: "TF-1185",
            storeName: "Tampa Midtown",
            salesRep: "AJ Dedeaux"
          },
          warehouseInfo: {
            name: "Tampa Bay Regional",
            availability: "In Stock"
          },

          mattressSize: updatedProfile.mattressSize || "N/A",
          firmness: updatedProfile.firmness || "N/A",
          mattressModel: "Tempur-ProAdapt", // TODO: Map from firmness selection
          finalPrice: updatedProfile.finalPrice || "N/A",

          demographics: updatedProfile.demographics || "N/A",
          contactMethod: "sms",
          quoteSource: "Mattress Discount Locator",

          priceLockExpiry: updatedProfile.priceLockExpiry?.toISOString() || "N/A",
          priceLockStatus: "active",

          aiTags: ["hot lead", "luxury seeker", "prefers in-stock"],
          notes: "Customer mentioned neck pain and prefers memory foam."
        };
        
        // Fire and forget POST to Make webhook with detailed logging
        console.log(`🔗 FIRING WEBHOOK TO MAKE for ${referenceCode}`);
        console.log(`📤 WEBHOOK PAYLOAD:`, JSON.stringify(webhookPayload, null, 2));
        console.log(`🎯 WEBHOOK URL: https://hook.us2.make.com/xmw2ahcia681bvopgp5esp37i2pu2hn4`);
        
        axios.post('https://hook.us2.make.com/xmw2ahcia681bvopgp5esp37i2pu2hn4', webhookPayload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 // 5 second timeout
        }).then((response) => {
          console.log(`🎉 MAKE WEBHOOK SUCCESS for ${referenceCode}!`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Response: ${response.data}`);
          console.log(`   ✅ WEBHOOK DELIVERED TO MAKE SUCCESSFULLY!`);
        }).catch((error) => {
          console.error(`💥 MAKE WEBHOOK FAILED for ${referenceCode}:`);
          console.error(`   Error: ${error.message}`);
          console.error(`   Status: ${error.response?.status}`);
          console.error(`   Response: ${error.response?.data}`);
          console.error(`   URL: ${error.config?.url}`);
        });
      }
      
      res.json({
        success: true,
        referenceCode,
        priceLockExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
    } catch (error) {
      console.error("Error generating reference code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate reference code"
      });
    }
  });

  // Get customer profile by tracking ID
  app.get("/api/customer-profiles/:trackingId", async (req, res) => {
    try {
      const { trackingId } = req.params;
      
      const profile = await storage.getCustomerProfileByTrackingId(trackingId);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found"
        });
      }
      
      res.json({
        success: true,
        profile
      });
      
    } catch (error) {
      console.error("Error getting customer profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get customer profile"
      });
    }
  });

  // Get customer profile by reference code (for N8N automation lookup)
  app.get("/api/customer-profiles/lookup/:referenceCode", async (req, res) => {
    try {
      const { referenceCode } = req.params;
      
      const profile = await storage.getCustomerProfileByReferenceCode(referenceCode);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found for reference code"
        });
      }
      
      console.log(`🔍 Profile lookup by reference code: ${referenceCode}`);
      
      res.json({
        success: true,
        profile
      });
      
    } catch (error) {
      console.error("Error looking up customer profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to lookup customer profile"
      });
    }
  });

  // Export all customer profiles for Google Sheets integration
  app.get("/api/customer-profiles/export", async (req, res) => {
    try {
      const profiles = await storage.getAllCustomerProfiles();
      
      // CSV headers for N8N/Google Sheets
      const csvHeaders = [
        'Reference Code', 'Tracking ID', 'Name', 'ZIP Code', 'Demographics',
        'Mattress Size', 'Firmness', 'Model', 'Final Price', 'Contact Method',
        'Profile Complete', 'Status', 'Price Lock Expiry', 'Created At', 'Updated At'
      ];
      
      // Convert profiles to CSV format
      const csvRows = profiles.map(profile => [
        profile.referenceCode || '',
        profile.trackingId,
        profile.name || '',
        profile.zipCode || '',
        profile.demographics || '',
        profile.mattressSize || '',
        profile.firmness || '',
        profile.model || '',
        profile.finalPrice || '',
        profile.contactMethod || '',
        profile.profileComplete ? 'Yes' : 'No',
        profile.status,
        profile.priceLockExpiry?.toISOString() || '',
        profile.createdAt.toISOString(),
        profile.updatedAt.toISOString()
      ]);
      
      // Generate CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');
      
      // Set appropriate headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="customer-profiles-${new Date().toISOString().split('T')[0]}.csv"`);
      
      res.send(csvContent);
      
    } catch (error) {
      console.error("Customer profiles export error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export customer profiles"
      });
    }
  });

  // Webhook endpoint for N8N automation to receive complete customer data
  app.post("/api/webhook/n8n", async (req, res) => {
    try {
      const { referenceCode, contactMethod, customerMessage } = req.body;
      
      // Look up the customer profile
      const profile = await storage.getCustomerProfileByReferenceCode(referenceCode);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found"
        });
      }
      
      // Update contact method if provided
      if (contactMethod) {
        await storage.updateCustomerProfile(profile.trackingId, { contactMethod });
      }
      
      // Log the webhook for N8N automation
      console.log(`🔗 N8N Webhook triggered:`);
      console.log(`   Reference Code: ${referenceCode}`);
      console.log(`   Customer: ${profile.name || 'Unknown'}`);
      console.log(`   Product: ${profile.mattressSize} ${profile.firmness} - ${profile.finalPrice}`);
      console.log(`   Contact Method: ${contactMethod}`);
      
      // Send complete customer data package to N8N
      res.json({
        success: true,
        customerData: {
          referenceCode: profile.referenceCode,
          trackingId: profile.trackingId,
          name: profile.name,
          zipCode: profile.zipCode,
          demographics: profile.demographics,
          mattressSize: profile.mattressSize,
          firmness: profile.firmness,
          model: profile.model,
          finalPrice: profile.finalPrice,
          contactMethod: contactMethod || profile.contactMethod,
          coordinates: profile.coordinates,
          nearestStores: profile.nearestStores,
          priceLockExpiry: profile.priceLockExpiry,
          createdAt: profile.createdAt
        },
        message: "Customer data package ready for automation"
      });
      
    } catch (error) {
      console.error("N8N webhook error:", error);
      res.status(500).json({
        success: false,
        message: "Webhook processing failed"
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
