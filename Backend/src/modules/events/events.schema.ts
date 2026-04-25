import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2).max(80).optional(),
  location: z.string().min(2),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  capacity: z.coerce.number().int().positive(),
  isPublished: z.coerce.boolean().optional().default(true),
  imageUrl: z.string().url().optional().nullable(),
});

export const updateEventSchema = createEventSchema.partial();

export const registerForEventSchema = z.object({
  studentId: z.string().min(1).max(20).optional(),
  department: z.string().min(1).max(100).optional(),
  hall: z.string().min(1).max(100).optional(),
});
