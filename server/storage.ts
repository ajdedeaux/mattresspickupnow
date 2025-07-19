import { leads, type Lead, type InsertLead, users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLead(lead: InsertLead): Promise<Lead>;
  getLeadByLeadId(leadId: string): Promise<Lead | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leads: Map<number, Lead>;
  private currentUserId: number;
  private currentLeadId: number;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.currentUserId = 1;
    this.currentLeadId = 1;
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

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const leadId = `MPN${Date.now().toString().slice(-5)}`;
    const lead: Lead = {
      ...insertLead,
      id,
      leadId,
      createdAt: new Date(),
    };
    this.leads.set(id, lead);
    return lead;
  }

  async getLeadByLeadId(leadId: string): Promise<Lead | undefined> {
    return Array.from(this.leads.values()).find(
      (lead) => lead.leadId === leadId,
    );
  }
}

export const storage = new MemStorage();
