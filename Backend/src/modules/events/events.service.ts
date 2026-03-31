import { prisma } from "../../config/prisma.js";
import type { z } from "zod";
import type { createEventSchema, updateEventSchema } from "./events.schema.js";

type CreateEventInput = z.infer<typeof createEventSchema>;
type UpdateEventInput = z.infer<typeof updateEventSchema>;

export async function listEvents() {
  const events = await prisma.event.findMany({
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
  });

  return events.map((event) => ({
    ...event,
    attendees: event._count.registrations,
  }));
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });

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

export async function registerForEvent(eventId: string, userId: string) {
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
      },
    });

    return registration;
  } catch {
    throw new Error("ALREADY_REGISTERED");
  }
}
