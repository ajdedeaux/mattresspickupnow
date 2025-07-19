import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
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
