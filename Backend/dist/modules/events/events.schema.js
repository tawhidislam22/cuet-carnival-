import { z } from "zod";
export const createEventSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    location: z.string().min(2),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    capacity: z.coerce.number().int().positive(),
    isPublished: z.boolean().optional().default(false),
});
export const updateEventSchema = createEventSchema.partial();
