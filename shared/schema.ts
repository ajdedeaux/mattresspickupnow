import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  leadId: text("lead_id").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  zipCode: text("zip_code").notNull(),
  mattressType: text("mattress_type").notNull(),
  status: text("status").notNull().default("hot"), // hot, warm, contacted, converted, expired
  pickedUp: boolean("picked_up").default(false),
  storeId: text("store_id"),
  storeName: text("store_name"),
  storePhone: text("store_phone"),
  storeAddress: text("store_address"),
  price: text("price"),
  mattressSize: text("mattress_size").default("Queen"),
  comfortLevel: text("comfort_level"),
  pickupTime: text("pickup_time"),
  followUpStage: integer("follow_up_stage").default(0), // 0=initial, 1=30min, 2=2hr, 3=24hr
  lastContactAt: timestamp("last_contact_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  leadId: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Invalid phone format"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  zipCode: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  mattressType: z.enum(["sealy-firm", "sealy-medium", "sealy-soft", "basic-hybrid"], {
    required_error: "Please select a mattress type"
  }),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

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
