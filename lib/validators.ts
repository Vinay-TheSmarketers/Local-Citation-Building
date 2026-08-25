import { z } from "zod"

export const businessSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(120),
  address1: z.string().trim().min(3).max(160),
  address2: z.string().trim().max(100).nullable().optional(),
  city: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  phone: z.string().trim().min(7).max(30),
  website: z.string().url().max(240),
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(700),
})

export const directorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  homeUrl: z.string().url(),
  submissionUrl: z.string().url(),
  industry: z.string().trim().min(2).max(80),
})
