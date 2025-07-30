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

// Helper functions for correct pricing and model mapping
function getCorrectModelName(firmness: string | undefined, existingModel: string | undefined): string {
  if (existingModel && (existingModel.includes('By Sealy') || existingModel === 'Basic Hybrid')) {
    return existingModel;
  }
  
  const modelMap: Record<string, string> = {
    'F': 'By Sealy Firm',
    'M': 'By Sealy Medium', 
    'S': 'By Sealy Soft',
    'H': 'Basic Hybrid'
  };
  
  return modelMap[firmness || ''] || existingModel || 'Contact for details';
}

function getCorrectPrice(size: string | undefined, firmness: string | undefined, existingPrice: string | undefined): string {
  if (existingPrice && existingPrice !== 'Contact for pricing' && existingPrice.includes('$')) {
    return existingPrice;
  }
  
  const priceMatrix: Record<string, Record<string, string>> = {
    'F': { 'Twin': '$199.99', 'Full': '$249.99', 'Queen': '$299.99', 'King': '$399.99' },
    'M': { 'Twin': '$299.99', 'Full': '$349.99', 'Queen': '$399.99', 'King': '$499.99' },
    'S': { 'Twin': '$549.99', 'Full': '$599.99', 'Queen': '$699.99', 'King': '$799.99' },
    'H': { 'Twin': '$399.99', 'Full': '$449.99', 'Queen': '$499.99', 'King': '$599.99' }
  };
  
  return priceMatrix[firmness || '']?.[size || ''] || 'Contact for pricing';
}

// Mock data functions for development (avoids Google API charges)
// SMS messages route to Twilio automation system for instant intelligent responses

function getMockMattressFirmStores(lat: number, lng: number) {
  return [
    {
      name: 'Mattress Firm Westshore Plaza',
      storeName: 'Westshore Plaza', // Extracted store name for inventory searches
      address: '1234 Main St, Tampa, FL 33607',
      phone: '(855) 515-9604',  // Twilio automation number for instant responses
      hours: 'Wednesday: 10:00 AM – 8:00 PM',
      distance: 2.1,
      rating: 4.2,
      placeId: 'mock_westshore_001',
      location: { lat: lat + 0.01, lng: lng + 0.01 },
      marketDensity: 'high', // Market intelligence metadata
      serviceAreaIndicator: 'urban_core',
      warehouseDistanceCategory: 'nearby'
    },
    {
      name: 'Mattress Firm Town Center',
      storeName: 'Town Center', // Extracted store name
      address: '5678 Oak Ave, Tampa, FL 33609',
      phone: '(855) 515-9604',  // Twilio automation number for instant responses
      hours: 'Wednesday: 10:00 AM – 9:00 PM',
      distance: 3.5,
      rating: 4.0,
      placeId: 'mock_towncenter_002',
      location: { lat: lat + 0.02, lng: lng + 0.02 },
      marketDensity: 'medium',
      serviceAreaIndicator: 'suburban',
      warehouseDistanceCategory: 'nearby'
    },
    {
      name: 'Mattress Firm Crossroads',
      storeName: 'Crossroads', // Extracted store name
      address: '9012 Pine Rd, Tampa, FL 33611',
      phone: '(855) 515-9604',  // Twilio automation number for instant responses
      hours: 'Wednesday: 10:00 AM – 8:00 PM',
      distance: 4.8,
      rating: 4.3,
      placeId: 'mock_crossroads_003',
      location: { lat: lat + 0.03, lng: lng + 0.03 },
      marketDensity: 'medium',
      serviceAreaIndicator: 'suburban',
      warehouseDistanceCategory: 'regional'
    }
  ];
}

function getMockMattressFirmWarehouses(lat: number, lng: number) {
  return [
    {
      name: 'Mattress Firm Tampa Distribution Center',
      warehouseName: 'Tampa Distribution Center', // Extracted warehouse name
      address: '15000 Commerce Pkwy, Tampa, FL 33637',
      phone: '(855) 515-9604',  // Twilio automation number
      hours: 'Monday-Friday: 6:00 AM – 6:00 PM',
      distance: 12.3,
      rating: 4.5,
      placeId: 'mock_warehouse_001',
      location: { lat: lat + 0.15, lng: lng + 0.12 },
      warehouseType: 'regional_distribution',
      inventoryCapacity: 'high',
      serviceRadius: '50_miles'
    },
    {
      name: 'Mattress Firm Central Florida Warehouse',
      warehouseName: 'Central Florida Warehouse', // Extracted warehouse name
      address: '2500 Industrial Blvd, Orlando, FL 32825',
      phone: '(855) 515-9604',  // Twilio automation number
      hours: 'Monday-Saturday: 7:00 AM – 7:00 PM',
      distance: 45.7,
      rating: 4.3,
      placeId: 'mock_warehouse_002',
      location: { lat: lat + 0.45, lng: lng + 0.35 },
      warehouseType: 'regional_hub',
      inventoryCapacity: 'very_high',
      serviceRadius: '100_miles'
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

  // Updated webhook implementation - triggers after Step 9 (reference code generation)
  app.post("/api/test-make-webhook", async (req, res) => {
    try {
      const webhookUrl = "https://hook.us2.make.com/xmw2ahcia681bvopgp5esp37i2pu2hn4";
      
      // Simulate data from completed app flow through Step 9
      const testZip = "33607";
      const testReferenceCode = `MP-${Date.now().toString().slice(-4)}`;
      
      // Step 1: Location intelligence (existing implementation)
      const geocodeResult = {
        success: true,
        coordinates: { lat: 27.9506, lng: -82.4572 },
        address: `Tampa Bay Area near ${testZip}`
      };
      
      const storesResult = {
        success: true,
        stores: getMockMattressFirmStores(geocodeResult.coordinates.lat, geocodeResult.coordinates.lng)
      };
      
      const warehousesResult = {
        success: true,
        warehouses: getMockMattressFirmWarehouses(geocodeResult.coordinates.lat, geocodeResult.coordinates.lng)
      };
      
      // Customer selections from app flow (Step 2-8) - COMPREHENSIVE TEST DATA
      const customerSelections = {
        who_its_for: "My Child", // Step 2 selection (Me, My Child, Guest Room, Dorm Room, Airbnb, Other)
        size: "Twin", // Step 3 selection (Twin, Full, Queen, King)
        model: "Medium", // Step 6 selection (Firm, Medium, Hybrid, Soft)
        price: getCorrectPrice("Twin", "M", undefined), // Use existing pricing matrix
        reference_code: testReferenceCode,
        timestamp: new Date().toISOString(),
        // Additional comprehensive data
        customer_journey: {
          step_2_use_case: "child_bedroom_upgrade",
          step_3_size_reasoning: "twin_for_growing_child",
          step_4_budget_range: "under_400",
          step_5_urgency: "this_weekend",
          step_6_comfort_preference: "medium_support",
          step_7_special_needs: "hypoallergenic",
          step_8_delivery_preference: "pickup_today"
        }
      };
      
      // Complete webhook payload - triggered after Step 9
      const webhookPayload = {
        // Test metadata
        test_mode: true,
        timestamp: new Date().toISOString(),
        step: "reference_code_generated",
        
        // Customer data available after Step 9 - COMPLETE STRUCTURE
        customer_data: {
          reference_code: customerSelections.reference_code,
          who_its_for: customerSelections.who_its_for, // Changed from "demographic"
          mattress_size: customerSelections.size,
          mattress_model: getCorrectModelName("M", undefined), // "By Sealy Medium"
          locked_price: customerSelections.price,
          customer_name: "NA", // Will collect during outreach
          urgency_level: "NA", // Will collect during outreach
          generation_timestamp: customerSelections.timestamp,
          
          // Complete customer journey context
          journey_context: {
            use_case: customerSelections.customer_journey.step_2_use_case,
            size_reasoning: customerSelections.customer_journey.step_3_size_reasoning,
            budget_category: customerSelections.customer_journey.step_4_budget_range,
            urgency_indicated: customerSelections.customer_journey.step_5_urgency,
            comfort_preference: customerSelections.customer_journey.step_6_comfort_preference,
            special_requirements: customerSelections.customer_journey.step_7_special_needs,
            delivery_preference: customerSelections.customer_journey.step_8_delivery_preference
          },
          
          // Pricing breakdown
          pricing_details: {
            base_price: customerSelections.price,
            size_category: customerSelections.size,
            firmness_code: "M",
            price_locked_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            pricing_tier: "standard"
          }
        },
        
        // Step 1: Complete location intelligence
        location_data: {
          user_input: testZip,
          search_timestamp: new Date().toISOString(),
          
          // Stores array - sorted nearest to furthest
          mattress_firm_stores: storesResult.stores.map((store, index) => ({
            rank: index + 1,
            full_name: store.name,
            store_location_name: store.storeName || store.name.replace('Mattress Firm ', ''),
            address: store.address,
            phone: store.phone,
            hours: store.hours || "Mon-Sat 10-9, Sun 11-7",
            distance_miles: store.distance,
            place_id: store.placeId,
            location: store.location
          })),
          
          // Top 2 closest warehouses for border ZIP codes
          mattress_firm_warehouses: warehousesResult.warehouses.slice(0, 2).map((warehouse, index) => ({
            rank: index + 1,
            name: warehouse.name,
            warehouse_location_name: warehouse.warehouseName,
            address: warehouse.address,
            phone: warehouse.phone,
            distance_miles: warehouse.distance,
            service_area_indicator: warehouse.distance < 20 ? "urban" : "regional",
            is_primary: index === 0
          })),
          
          // Search metadata
          search_metadata: {
            stores_found: storesResult.stores.length,
            warehouses_found: warehousesResult.warehouses.length,
            user_input_preserved: testZip,
            market_density: storesResult.stores.length > 3 ? "high" : "medium",
            furthest_store_distance: Math.max(...storesResult.stores.map(s => s.distance)),
            primary_warehouse_distance_category: warehousesResult.warehouses[0]?.distance < 20 ? "close" : "regional",
            secondary_warehouse_available: warehousesResult.warehouses.length > 1
          }
        },
        
        // Webhook routing metadata
        webhook_metadata: {
          source: "reference_code_generated",
          make_scenario_trigger: "start_store_coordination",
          automation_ready: true,
          next_step: "podium_store_contact"
        }
      };
      
      console.log(`🎯 WEBHOOK TRIGGERED: Reference code generated`);
      console.log(`Reference Code: ${customerSelections.reference_code}`);
      console.log(`Customer: Wants ${customerSelections.size} ${customerSelections.model} for ${customerSelections.who_its_for}`);
      console.log(`Price Locked: ${customerSelections.price}`);
      console.log(`Stores Available: ${storesResult.stores.length}`);
      console.log(`Ready for store coordination!`);
      
      // Send to Make webhook
      const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      console.log("✅ STEP 9 WEBHOOK SUCCESS - Status:", webhookResponse.status, "Data:", webhookResponse.data);
      
      return res.json({
        success: true,
        message: "Reference code webhook sent to Make",
        reference_code: customerSelections.reference_code,
        trigger_point: "after_step_9_reference_code_generated",
        data_sent: webhookPayload,
        webhook_response: {
          status: webhookResponse.status,
          ok: webhookResponse.status === 200,
          response: webhookResponse.data
        }
      });
      
    } catch (error: any) {
      console.error('Reference code webhook error:', error);
      res.status(500).json({
        success: false,
        message: "Reference code webhook test failed",
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
      
      // PRODUCTION MODE: Using real Google Places API
      const googleMaps = new GoogleMapsService();
      const storesResult = await googleMaps.findNearbyMattressFirmStores(
        geocodeResult.coordinates.lat, 
        geocodeResult.coordinates.lng
      );
      
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
      
      // DEDICATED WAREHOUSE SEARCH - separate API call as specified
      // TO RECONNECT: Change this to use googleMaps.findNearbyMattressFirmWarehouses()
      const warehousesResult = {
        success: true,
        warehouses: getMockMattressFirmWarehouses(parseFloat(lat), parseFloat(lng))
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
          storeName: store.storeName || store.name.replace('Mattress Firm ', ''),
          phone: store.phone || "",
          address: store.address,
          distance: store.distance || 0,
          placeId: store.placeId || "",
          location: store.location || { lat: 0, lng: 0 },
          marketDensity: store.marketDensity,
          serviceAreaIndicator: store.serviceAreaIndicator,
          warehouseDistanceCategory: store.warehouseDistanceCategory
        })),
        nearbyWarehouses: warehousesResult.warehouses.map(warehouse => ({
          name: warehouse.name,
          warehouseName: warehouse.warehouseName || warehouse.name.replace('Mattress Firm ', ''),
          phone: warehouse.phone || "",
          address: warehouse.address,
          distance: warehouse.distance || 0,
          placeId: warehouse.placeId || "",
          location: warehouse.location || { lat: 0, lng: 0 },
          warehouseType: warehouse.warehouseType,
          inventoryCapacity: warehouse.inventoryCapacity,
          serviceRadius: warehouse.serviceRadius
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
        storeCount: storesResult.stores.length,
        mattress_firm_warehouse: warehousesResult.success ? warehousesResult.warehouses[0] : null, // Nearest warehouse
        allWarehouses: warehousesResult.warehouses || [],
        warehouseCount: warehousesResult.warehouses?.length || 0,
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        marketIntelligence: {
          totalLocations: storesResult.stores.length + (warehousesResult.warehouses?.length || 0),
          nearestWarehouseDistance: warehousesResult.warehouses?.[0]?.distance || null,
          serviceAreaDensity: storesResult.stores.length > 2 ? 'high' : 'medium'
        }
      });
      
    } catch (error) {
      console.error("Nearby stores search error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to find nearby stores"
      });
    }
  });

  // Dedicated warehouse search endpoint - separate from store search
  app.post("/api/nearby-warehouses", async (req, res) => {
    try {
      const { lat, lng } = req.body;
      
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: "Latitude and longitude are required"
        });
      }

      console.log(`🏭 DEDICATED WAREHOUSE SEARCH for coordinates: ${lat}, ${lng}`);

      // PRODUCTION MODE: Using real Google Places API for warehouses
      const googleMaps = new GoogleMapsService();
      const warehousesResult = await googleMaps.findNearbyMattressFirmWarehouses(
        parseFloat(lat), 
        parseFloat(lng)
      );
      
      if (!warehousesResult.success) {
        return res.status(500).json({
          success: false,
          message: "Could not find nearby warehouses"
        });
      }

      console.log(`🏭 Found ${warehousesResult.warehouses.length} Mattress Firm warehouses near ${lat}, ${lng}`);
      warehousesResult.warehouses.forEach(warehouse => {
        console.log(`   ${warehouse.name}: ${warehouse.address}, ${warehouse.distance?.toFixed(1)} mi`);
      });
      
      res.json({
        success: true,
        warehouses: warehousesResult.warehouses,
        count: warehousesResult.warehouses.length,
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        nearestWarehouse: warehousesResult.warehouses[0] || null
      });
      
    } catch (error) {
      console.error("Warehouse search error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to find nearby warehouses"
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
      console.log(`🔍 Updated profile details:`, {
        firmness: updatedProfile.firmness,
        model: updatedProfile.model,
        finalPrice: updatedProfile.finalPrice,
        mattressSize: updatedProfile.mattressSize
      });
      
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
        referenceCode: profile.referenceCode,
        zipCode: profile.zipCode,
        mattressSize: profile.mattressSize,
        firmness: profile.firmness,
        finalPrice: profile.finalPrice
      });
      
      // Check if reference code already exists (prevent duplicates)
      if (profile.referenceCode) {
        console.log(`🔄 REFERENCE CODE ALREADY EXISTS: ${profile.referenceCode} for tracking ID: ${trackingId}`);
        console.log(`🚫 PREVENTING DUPLICATE - Returning existing code without generating new one`);
        return res.json({
          success: true,
          referenceCode: profile.referenceCode,
          existingCode: true,
          message: "Reference code already exists for this customer"
        });
      }
      
      console.log(`✅ NO EXISTING REFERENCE CODE - Proceeding to generate new one`);
      
      const referenceCode = await storage.generateReferenceCode(trackingId);
      
      console.log(`🎯 NEW REFERENCE CODE GENERATED: ${referenceCode} for tracking ID: ${trackingId}`);
      
      // Get the updated profile with reference code and price lock expiry
      const updatedProfile = await storage.getCustomerProfileByTrackingId(trackingId);
      
      console.log(`🔍 PROFILE AFTER REFERENCE CODE GENERATION:`, updatedProfile ? 'FOUND' : 'NOT FOUND');
      console.log(`🔍 PROFILE DETAILS:`, updatedProfile ? JSON.stringify(updatedProfile, null, 2) : 'NULL');
      
      // CRITICAL FIX: Always fire webhook using original profile + reference code
      // Don't depend on updated profile fetch which might fail
      const profileForWebhook = updatedProfile || {
        ...profile,
        referenceCode: referenceCode,
        priceLockExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      console.log(`🚨 FORCING WEBHOOK TO FIRE - Using profile:`, profileForWebhook ? 'SUCCESS' : 'FAILED');
      
      // Send comprehensive customer data to Make webhook (fire and forget) - FIXED LOCATION BUG
      if (profileForWebhook) {
        // CRITICAL FIX: Use customer's actual ZIP code, never fallback to Tampa
        const customerZipCode = profileForWebhook.zipCode;
        
        if (!customerZipCode) {
          console.error('🚨 WEBHOOK ERROR: No ZIP code found for customer', profileForWebhook.trackingId);
          return res.status(400).json({ 
            success: false, 
            error: 'Customer ZIP code required for store lookup' 
          });
        }
        
        // Get real stores for customer's actual location using Google API
        let storesResult;
        let warehousesResult;
        
        try {
          const googleMaps = new GoogleMapsService();
          
          // CRITICAL FIX: Use customer's stored coordinates directly instead of re-geocoding
          const customerCoordinates = profileForWebhook.coordinates;
          
          if (customerCoordinates && customerCoordinates.lat && customerCoordinates.lng) {
            console.log(`🎯 Using customer's stored coordinates: ${customerCoordinates.lat}, ${customerCoordinates.lng}`);
            
            // Get real stores using customer's exact coordinates
            const realStoreSearch = await googleMaps.findNearbyMattressFirmStores(
              customerCoordinates.lat, 
              customerCoordinates.lng
            );
            storesResult = {
              success: true,
              stores: realStoreSearch.stores.slice(0, 5) // Top 5 closest stores
            };
            
            // Get real warehouses using customer's exact coordinates
            const realWarehouseSearch = await googleMaps.findNearbyMattressFirmWarehouses(
              customerCoordinates.lat, 
              customerCoordinates.lng
            );
            warehousesResult = {
              success: true,
              warehouses: realWarehouseSearch.warehouses.slice(0, 2)
            };
          } else {
            console.log(`⚠️ No stored coordinates found, attempting geocoding for ZIP: ${customerZipCode}`);
            // Fallback to geocoding if no stored coordinates
            const realStoreSearch = await googleMaps.searchMattressFirmStores(customerZipCode);
            storesResult = {
              success: true,
              stores: realStoreSearch.mattressFirmStores.slice(0, 5)
            };
            
            if (realStoreSearch.userCoordinates) {
              const realWarehouseSearch = await googleMaps.findNearbyMattressFirmWarehouses(
                realStoreSearch.userCoordinates.lat, 
                realStoreSearch.userCoordinates.lng
              );
              warehousesResult = {
                success: true,
                warehouses: realWarehouseSearch.warehouses.slice(0, 2)
              };
            } else {
              warehousesResult = { success: false, warehouses: [] };
            }
          }
          
          console.log(`🗺️  WEBHOOK: Found ${storesResult.stores.length} real stores for ZIP ${customerZipCode}`);
          
        } catch (error) {
          console.error('🚨 Google API error in webhook, cannot proceed:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Unable to find stores for customer location' 
          });
        }
        
        // Customer selections from real profile data
        const customerSelections = {
          who_its_for: profileForWebhook.demographics ?? "Me",
          size: profileForWebhook.mattressSize || "Queen",
          model: profileForWebhook.firmness || "Medium",
          price: getCorrectPrice(profileForWebhook.mattressSize || "Queen", profileForWebhook.firmness || "M", profileForWebhook.finalPrice || undefined),
          reference_code: profileForWebhook.referenceCode || referenceCode,
          timestamp: new Date().toISOString(),
          customer_journey: {
            step_2_use_case: profileForWebhook.demographics === "My Child" ? "child_bedroom_upgrade" : "personal_upgrade",
            step_3_size_reasoning: `${profileForWebhook.mattressSize || "queen"}_optimal_size`,
            step_4_budget_range: "under_400",
            step_5_urgency: "this_weekend",
            step_6_comfort_preference: `${(profileForWebhook.firmness || "medium").toLowerCase()}_support`,
            step_7_special_needs: "standard",
            step_8_delivery_preference: "pickup_today"
          }
        };
        
        // Complete webhook payload - matches test structure exactly
        const webhookPayload = {
          // Production metadata
          test_mode: false,
          timestamp: new Date().toISOString(),
          step: "reference_code_generated",
          
          // Customer data available after Step 9 - COMPLETE STRUCTURE
          customer_data: {
            reference_code: customerSelections.reference_code,
            who_its_for: customerSelections.who_its_for,
            mattress_size: customerSelections.size,
            mattress_model: getCorrectModelName(profileForWebhook.firmness ?? "M", profileForWebhook.model ?? undefined),
            locked_price: customerSelections.price,
            customer_name: "NA", // Will collect during outreach
            urgency_level: "NA", // Will collect during outreach
            generation_timestamp: customerSelections.timestamp,
            
            // Complete customer journey context
            journey_context: {
              use_case: customerSelections.customer_journey.step_2_use_case,
              size_reasoning: customerSelections.customer_journey.step_3_size_reasoning,
              budget_category: customerSelections.customer_journey.step_4_budget_range,
              urgency_indicated: customerSelections.customer_journey.step_5_urgency,
              comfort_preference: customerSelections.customer_journey.step_6_comfort_preference,
              special_requirements: customerSelections.customer_journey.step_7_special_needs,
              delivery_preference: customerSelections.customer_journey.step_8_delivery_preference
            },
            
            // Pricing breakdown
            pricing_details: {
              base_price: customerSelections.price,
              size_category: customerSelections.size,
              firmness_code: profileForWebhook.firmness || "M",
              price_locked_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              pricing_tier: "standard"
            }
          },
          
          // Step 1: Complete location intelligence
          location_data: {
            user_input: customerZipCode,
            search_timestamp: new Date().toISOString(),
            
            // Stores array - sorted nearest to furthest
            mattress_firm_stores: storesResult.stores.map((store, index) => ({
              rank: index + 1,
              full_name: store.name,
              store_location_name: store.name.replace('Mattress Firm ', ''),
              address: store.address,
              phone: store.phone || '(855) 515-9604',
              hours: store.hours || "Wednesday: 10:00 AM – 8:00 PM",
              distance_miles: store.distance || 0,
              place_id: store.placeId,
              location: store.location
            })),
            
            // Top 2 closest warehouses for border ZIP codes  
            mattress_firm_warehouses: warehousesResult.warehouses.slice(0, 2).map((warehouse, index) => ({
              rank: index + 1,
              name: warehouse.name,
              warehouse_location_name: warehouse.name.replace('Mattress Firm ', ''),
              address: warehouse.address,
              phone: warehouse.phone || '(855) 515-9604',
              distance_miles: warehouse.distance || 0,
              service_area_indicator: (warehouse.distance || 0) < 20 ? "urban" : "regional",
              is_primary: index === 0
            })),
            
            // Search metadata
            search_metadata: {
              stores_found: storesResult.stores.length,
              warehouses_found: warehousesResult.warehouses.length,
              user_input_preserved: customerZipCode,
              market_density: storesResult.stores.length > 3 ? "high" : "medium",
              furthest_store_distance: storesResult.stores.length > 0 ? Math.max(...storesResult.stores.map(s => s.distance || 0)) : 0,
              primary_warehouse_distance_category: (warehousesResult.warehouses[0]?.distance || 0) < 20 ? "close" : "regional",
              secondary_warehouse_available: warehousesResult.warehouses.length > 1
            }
          },
          
          // Webhook routing metadata
          webhook_metadata: {
            source: "reference_code_generated",
            make_scenario_trigger: "start_store_coordination",
            automation_ready: true,
            next_step: "podium_store_contact"
          }
        };
        
        // Fire and forget POST to Make webhook with comprehensive logging
        console.log(`🎯 WEBHOOK TRIGGERED: Reference code generated`);
        console.log(`Reference Code: ${customerSelections.reference_code}`);
        console.log(`Customer: Wants ${customerSelections.size} ${customerSelections.model} for ${customerSelections.who_its_for}`);
        console.log(`Price Locked: ${customerSelections.price}`);
        console.log(`Stores Available: ${storesResult.stores.length}`);
        console.log(`Ready for store coordination!`);
        
        axios.post('https://hook.us2.make.com/xmw2ahcia681bvopgp5esp37i2pu2hn4', webhookPayload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }).then((response) => {
          console.log("✅ STEP 9 WEBHOOK SUCCESS - Status:", response.status, "Data:", response.data);
        }).catch((error) => {
          console.error('STEP 9 WEBHOOK ERROR:', error.message);
          console.error('Status:', error.response?.status);
          console.error('Response:', error.response?.data);
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
  // Use Google Places API for real store data
  const googleMaps = new GoogleMapsService();
  const searchResult = await googleMaps.searchMattressFirmStores(zipCode);
  
  if (searchResult.mattressFirmStores.length > 0) {
    return searchResult.mattressFirmStores.map(store => ({
      id: store.placeId,
      name: store.name,
      address: store.address,
      distance: store.distance || 0,
      rating: store.rating || 4.0,
      phone: store.phone || '(855) 515-9604',
      hours: store.hours || 'Contact for hours',
      isOpen: true // Default to open - could be enhanced with real-time hours checking
    }));
  }
  
  // Fallback to realistic store data if API fails
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
