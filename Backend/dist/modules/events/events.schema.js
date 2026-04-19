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
});
export const updateEventSchema = createEventSchema.partial();
