import { z } from "zod";

export const rsvpSchema = z.object({
  eventSlug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Invalid event slug"),
  guestName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[+\d\s\-()]{7,20}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  guestCount: z.coerce.number().int().min(1).max(20),
  relationship: z.enum(["family", "friends", "colleagues", "other"]),
  needsTransport: z.boolean(),
  pickupLocation: z.string().max(200).optional().or(z.literal("")),
  dietaryNeeds: z.string().max(300).optional().or(z.literal("")),
  message: z.string().max(500).optional().or(z.literal("")),
});

export const createEventSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  date: z.string().datetime(),
  venueId: z.string().min(1, "Please select a venue"),
  description: z.string().max(1000).optional().or(z.literal("")),
  type: z.enum(["wedding", "other"]),
  allocation: z.enum(["zone", "auto", "manual"]),
  maxPerTable: z.coerce.number().int().min(1).max(50),
});

export const createTableSchema = z.object({
  eventId: z.string(),
  number: z.coerce.number().int().min(1),
  label: z.string().max(100).optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(1).max(50),
  zoneId: z.string().optional().or(z.literal("")),
});

export const venueSchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().max(300).optional().or(z.literal("")),
  city: z.string().max(100).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
});
