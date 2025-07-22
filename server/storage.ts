import { leads, type Lead, type InsertLead, users, type User, type InsertUser, locationSearches, type LocationSearch, type InsertLocationSearch } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLead(lead: InsertLead & { leadId: string; priority: string; price?: string; persona?: string; routingTier?: string; }): Promise<Lead>;
  getLeadByLeadId(leadId: string): Promise<Lead | undefined>;
  getAllLeads(): Promise<Lead[]>;
  createLocationSearch(search: InsertLocationSearch & { leadId: string }): Promise<LocationSearch>;
  getLocationSearchByLeadId(leadId: string): Promise<LocationSearch | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leads: Map<number, Lead>;
  private locationSearches: Map<number, LocationSearch>;
  private currentUserId: number;
  private currentLeadId: number;
  private currentLocationSearchId: number;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.locationSearches = new Map();
    this.currentUserId = 1;
    this.currentLeadId = 1;
    this.currentLocationSearchId = 1;
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
}

export const storage = new MemStorage();
