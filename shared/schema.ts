import { pgTable, text, serial, timestamp, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  leadId: text("lead_id").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  zipCode: text("zip_code").notNull(),
  mattressSize: text("mattress_size").notNull(), // Twin, Full, Queen, King
  mattressType: text("mattress_type").notNull(), // F, M, S, H (Firm, Medium, Soft, Hybrid)
  budgetRange: text("budget_range").notNull(), // under_400, 400_799, 800_plus
  urgency: text("urgency").notNull(), // today, this_week
  persona: text("persona"), // emergency_replacement, immediate_move_in, coming_of_age, guest_accommodations, child_milestone, student_transition, property_manager, delivery_mismatch, practical_no_nonsense
  routingTier: text("routing_tier").notNull().default("self_service"), // direct_to_aj, self_service
  status: text("status").notNull().default("hot"), // hot, warm, contacted, converted, expired
  priority: text("priority").notNull().default("standard"), // high, standard, basic
  pickedUp: boolean("picked_up").default(false),
  storeId: text("store_id"),
  storeName: text("store_name"),
  storePhone: text("store_phone"),
  storeAddress: text("store_address"),
  price: text("price"),
  followUpStage: integer("follow_up_stage").default(0), // 0=initial, 1=30min, 2=2hr, 3=24hr
  lastContactAt: timestamp("last_contact_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  leadId: true,
  createdAt: true,
  priority: true,
  status: true,
  pickedUp: true,
  storeId: true,
  storeName: true,
  storePhone: true,
  storeAddress: true,
  price: true,
  followUpStage: true,
  lastContactAt: true,
  persona: true,
  routingTier: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Invalid phone format"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  zipCode: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  mattressSize: z.enum(["Twin", "Full", "Queen", "King"], {
    required_error: "Please select a mattress size"
  }),
  mattressType: z.enum(["F", "M", "S", "H"], {
    required_error: "Please select a mattress type"
  }),
  budgetRange: z.enum(["under_400", "400_799", "800_plus"], {
    required_error: "Please select a budget range"
  }),
  urgency: z.enum(["today", "this_week"], {
    required_error: "Please select urgency"
  }),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Location Search Tracking Table
export const locationSearches = pgTable("location_searches", {
  id: serial("id").primaryKey(),
  leadId: text("lead_id").notNull().unique(),
  searchTime: timestamp("search_time").defaultNow().notNull(),
  inputMethod: text("input_method").notNull(), // "gps", "zip", "address"
  inputValue: text("input_value").notNull(), // raw user input
  coordinates: json("coordinates").$type<{ lat: number; lng: number }>(),
  nearbyStores: json("nearby_stores").$type<Array<{
    name: string;
    phone: string;
    address: string;
    distance: number;
    placeId: string;
    location: { lat: number; lng: number };
  }>>(),
  zipCodeTag: text("zip_code_tag"), // extracted/derived ZIP code
  sourceTracking: text("source_tracking"), // tracking metadata
  storeMatches: integer("store_matches").notNull().default(0),
  geoLocationMetadata: json("geo_location_metadata").$type<{
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
  }>(),
  status: text("status").notNull().default("active"), // active, converted, expired
});

export const insertLocationSearchSchema = createInsertSchema(locationSearches).omit({
  id: true,
  leadId: true,
  searchTime: true,
  status: true,
}).extend({
  inputMethod: z.enum(["gps", "zip", "address"], {
    required_error: "Input method is required"
  }),
  inputValue: z.string().min(1, "Input value is required"),
  storeMatches: z.number().min(0).default(0),
});

export type InsertLocationSearch = z.infer<typeof insertLocationSearchSchema>;
export type LocationSearch = typeof locationSearches.$inferSelect;

// SMS Automation tables
export const smsMessages = pgTable("sms_messages", {
  id: serial("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  messageType: text("message_type").notNull(), // owner_alert, customer_confirmation, follow_up_30min, follow_up_2hr, follow_up_24hr
  toPhone: text("to_phone").notNull(),
  messageBody: text("message_body").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SMSMessage = typeof smsMessages.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Store types for Google Maps integration
export const storeSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  distance: z.number(),
  rating: z.number().optional(),
  isOpen: z.boolean(),
  hours: z.string(),
  phone: z.string().optional(),
});

export const findStoresSchema = z.object({
  zipCode: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
});

export type Store = z.infer<typeof storeSchema>;
export type FindStoresRequest = z.infer<typeof findStoresSchema>;
