import { leads, type Lead, type InsertLead, users, type User, type InsertUser, locationSearches, type LocationSearch, type InsertLocationSearch, customerProfiles, type CustomerProfile, type InsertCustomerProfile } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLead(lead: InsertLead & { leadId: string; priority: string; price?: string; persona?: string; routingTier?: string; }): Promise<Lead>;
  getLeadByLeadId(leadId: string): Promise<Lead | undefined>;
  getAllLeads(): Promise<Lead[]>;
  createLocationSearch(search: InsertLocationSearch & { leadId: string }): Promise<LocationSearch>;
  getLocationSearchByLeadId(leadId: string): Promise<LocationSearch | undefined>;
  // Customer Profile methods for N8N automation
  createCustomerProfile(trackingId: string): Promise<CustomerProfile>;
  updateCustomerProfile(trackingId: string, updates: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined>;
  getCustomerProfileByTrackingId(trackingId: string): Promise<CustomerProfile | undefined>;
  getCustomerProfileByReferenceCode(referenceCode: string): Promise<CustomerProfile | undefined>;
  generateReferenceCode(trackingId: string): Promise<string>;
  getAllCustomerProfiles(): Promise<CustomerProfile[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leads: Map<number, Lead>;
  private locationSearches: Map<number, LocationSearch>;
  private customerProfiles: Map<number, CustomerProfile>;
  private currentUserId: number;
  private currentLeadId: number;
  private currentLocationSearchId: number;
  private currentCustomerProfileId: number;
  private referenceCodeCounter: number;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.locationSearches = new Map();
    this.customerProfiles = new Map();
    this.currentUserId = 1;
    this.currentLeadId = 1;
    this.currentLocationSearchId = 1;
    this.currentCustomerProfileId = 1;
    this.referenceCodeCounter = 1000; // Start at MP-1000 for better appearance
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createLead(insertLead: InsertLead & { leadId: string; priority: string; price?: string; persona?: string; routingTier?: string; }): Promise<Lead> {
    const id = this.currentLeadId++;
    
    const lead: Lead = {
      ...insertLead,
      id,
      createdAt: new Date(),
      email: insertLead.email || null,
      status: "hot",
      pickedUp: false,
      storeId: null,
      storeName: null,
      storePhone: null,
      storeAddress: null,
      followUpStage: 0,
      lastContactAt: null,
      persona: insertLead.persona || null,
      routingTier: insertLead.routingTier || "self_service",
    };
    this.leads.set(id, lead);
    return lead;
  }

  async getAllLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLeadByLeadId(leadId: string): Promise<Lead | undefined> {
    return Array.from(this.leads.values()).find(
      (lead) => lead.leadId === leadId,
    );
  }

  async createLocationSearch(insertSearch: InsertLocationSearch & { leadId: string }): Promise<LocationSearch> {
    const id = this.currentLocationSearchId++;
    
    const locationSearch: LocationSearch = {
      ...insertSearch,
      id,
      searchTime: new Date(),
      status: "active",
    };
    this.locationSearches.set(id, locationSearch);
    return locationSearch;
  }

  async getLocationSearchByLeadId(leadId: string): Promise<LocationSearch | undefined> {
    return Array.from(this.locationSearches.values()).find(
      (search) => search.leadId === leadId,
    );
  }

  // Customer Profile methods for N8N automation
  async createCustomerProfile(trackingId: string): Promise<CustomerProfile> {
    const id = this.currentCustomerProfileId++;
    
    const profile: CustomerProfile = {
      id,
      trackingId,
      referenceCode: null,
      name: null,
      zipCode: null,
      demographics: null,
      mattressSize: null,
      firmness: null,
      model: null,
      finalPrice: null,
      coordinates: null,
      nearestStores: null,
      profileComplete: false,
      contactMethod: null,
      status: "active",
      priceLockExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.customerProfiles.set(id, profile);
    return profile;
  }

  async updateCustomerProfile(trackingId: string, updates: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined> {
    const profile = Array.from(this.customerProfiles.values()).find(
      (p) => p.trackingId === trackingId,
    );
    
    if (!profile) return undefined;
    
    const updatedProfile: CustomerProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.customerProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  async getCustomerProfileByTrackingId(trackingId: string): Promise<CustomerProfile | undefined> {
    return Array.from(this.customerProfiles.values()).find(
      (profile) => profile.trackingId === trackingId,
    );
  }

  async getCustomerProfileByReferenceCode(referenceCode: string): Promise<CustomerProfile | undefined> {
    return Array.from(this.customerProfiles.values()).find(
      (profile) => profile.referenceCode === referenceCode,
    );
  }

  async generateReferenceCode(trackingId: string): Promise<string> {
    // Check if profile already has a reference code
    const profile = await this.getCustomerProfileByTrackingId(trackingId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    // If reference code already exists, return it (prevents duplicates)
    if (profile.referenceCode) {
      console.log(`🔄 REFERENCE CODE EXISTS: ${profile.referenceCode} for tracking ${trackingId}`);
      return profile.referenceCode;
    }
    
    // Generate new reference code only if none exists
    const referenceCode = `MP-${this.referenceCodeCounter++}`;
    console.log(`🎯 GENERATING NEW REFERENCE CODE: ${referenceCode} for tracking ${trackingId}`);
    
    // Update the profile with the reference code and mark as complete
    const priceLockExpiry = new Date();
    priceLockExpiry.setHours(priceLockExpiry.getHours() + 24); // 24-hour price lock
    
    await this.updateCustomerProfile(trackingId, {
      referenceCode,
      profileComplete: true,
      priceLockExpiry,
    });
    
    return referenceCode;
  }

  async getAllCustomerProfiles(): Promise<CustomerProfile[]> {
    return Array.from(this.customerProfiles.values());
  }
}

export const storage = new MemStorage();
