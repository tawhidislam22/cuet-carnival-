import { prisma } from "../../config/prisma.js";
import type { z } from "zod";
import type { createEventSchema, updateEventSchema, registerForEventSchema } from "./events.schema.js";

type CreateEventInput = z.infer<typeof createEventSchema>;
type UpdateEventInput = z.infer<typeof updateEventSchema>;
type RegisterForEventInput = z.infer<typeof registerForEventSchema>;

function isTransientPrismaConnectionError(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = (error as { code?: string }).code;
  return code === "P1001" || code === "P1002";
}

async function withReadRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientPrismaConnectionError(error) || attempt >= retries) {
        throw error;
      }

      attempt += 1;
      const waitMs = attempt * 800;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

export async function listEvents() {
  const events = await withReadRetry(() =>
    prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { startsAt: "asc" },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
    })
  );

  return events.map((event) => ({
    ...event,
    attendees: event._count.registrations,
  }));
}

export async function listOrganizerEvents(organizerId: string) {
  const events = await withReadRetry(() =>
    prisma.event.findMany({
      where: { organizerId },
      orderBy: { startsAt: "asc" },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    })
  );

  return events.map((event) => ({
    ...event,
    attendees: event._count.registrations,
  }));
}

export async function getEventById(id: string) {
  const event = await withReadRetry(() =>
    prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
    })
  );

  if (!event) {
    return null;
  }

  return {
    ...event,
    attendees: event._count.registrations,
  };
}

export async function createEvent(input: CreateEventInput, organizerId: string) {
  return prisma.event.create({
    data: {
      ...input,
      category: input.category,
      organizerId,
    },
  });
}

export async function updateEvent(id: string, input: UpdateEventInput, userId: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return null;
  }
  if (event.organizerId !== userId) {
    throw new Error("FORBIDDEN");
  }

  return prisma.event.update({
    where: { id },
    data: input,
  });
}

export async function deleteEvent(id: string, userId: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return null;
  }
  if (event.organizerId !== userId) {
    throw new Error("FORBIDDEN");
  }

  return prisma.event.delete({ where: { id } });
}

export async function registerForEvent(eventId: string, userId: string, input: RegisterForEventInput = {}) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!event || !event.isPublished) {
    throw new Error("NOT_FOUND");
  }

  if (event._count.registrations >= event.capacity) {
    throw new Error("FULL");
  }

  try {
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        status: "Confirmed",
        studentId: input.studentId ?? null,
        department: input.department ?? null,
        hall: input.hall ?? null,
      },
    });

    return registration;
  } catch {
    throw new Error("ALREADY_REGISTERED");
  }
}
