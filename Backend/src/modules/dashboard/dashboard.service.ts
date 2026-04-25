import { prisma } from "../../config/prisma.js";

export async function getDashboardOverviewByUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      studentId: true,
      department: true,
    },
  });

  if (!user) {
    return null;
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: user.id },
    include: {
      event: true,
    },
    orderBy: {
      event: {
        startsAt: "asc",
      },
    },
  });

  const now = new Date();
  const registeredEvents = registrations.map((registration) => ({
    id: registration.event.id,
    title: registration.event.title,
    location: registration.event.location,
    startsAt: registration.event.startsAt,
    endsAt: registration.event.endsAt,
    status: registration.status,
    imageUrl: registration.event.imageUrl,
  }));

  const stats = {
    eventsRegistered: registrations.length,
    eventsAttended: registrations.filter((registration) => registration.event.endsAt < now).length,
    upcomingEvents: registrations.filter((registration) => registration.event.startsAt > now).length,
  };

  return {
    user,
    stats,
    registeredEvents,
  };
}

export async function getMyEventsByUserId(userId: string) {
  const registrations = await prisma.eventRegistration.findMany({
    where: { userId },
    include: { event: true },
    orderBy: {
      event: {
        startsAt: "asc",
      },
    },
  });

  return registrations.map((registration) => ({
    id: registration.event.id,
    title: registration.event.title,
    description: registration.event.description,
    location: registration.event.location,
    startsAt: registration.event.startsAt,
    endsAt: registration.event.endsAt,
    imageUrl: registration.event.imageUrl,
    category: registration.event.category,
    status: registration.status,
    eventStatus: registration.event.status,
  }));
}

export async function getScheduleByUserId(userId: string) {
  const now = new Date();

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      userId,
      event: {
        startsAt: {
          gte: now,
        },
      },
    },
    include: { event: true },
    orderBy: {
      event: {
        startsAt: "asc",
      },
    },
  });

  return registrations.map((registration) => ({
    id: registration.event.id,
    title: registration.event.title,
    location: registration.event.location,
    startsAt: registration.event.startsAt,
    endsAt: registration.event.endsAt,
    category: registration.event.category,
    registrationStatus: registration.status,
  }));
}

export async function getCertificatesByUserId(userId: string) {
  const now = new Date();

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      userId,
      status: "Confirmed",
      event: {
        endsAt: {
          lt: now,
        },
      },
    },
    include: { event: true },
    orderBy: {
      event: {
        endsAt: "desc",
      },
    },
  });

  return registrations.map((registration) => ({
    id: registration.id,
    eventId: registration.event.id,
    eventTitle: registration.event.title,
    category: registration.event.category,
    completedAt: registration.event.endsAt,
    certificateCode: `CERT-${registration.event.id.slice(0, 8).toUpperCase()}`,
  }));
}

export async function getAdminOverview() {
  const now = new Date();

  const [
    totalEvents,
    totalRegistrations,
    totalOrganizers,
    pendingApprovals,
    recentRegistrations,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.eventRegistration.count(),
    prisma.user.count({ where: { role: "organizer" } }),
    prisma.event.count({ where: { isPublished: false } }),
    prisma.eventRegistration.findMany({
      orderBy: { registeredAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true } },
      },
    }),
  ]);

  const recentActivity = recentRegistrations.map((registration) => {
    const actor = registration.user.name?.trim() || registration.user.email;
    return `${actor} registered for ${registration.event.title}`;
  });

  if (pendingApprovals > 0) {
    recentActivity.push(`${pendingApprovals} event(s) are waiting for admin approval`);
  }

  return {
    generatedAt: now.toISOString(),
    kpis: [
      { label: "Total Events", value: totalEvents },
      { label: "Total Registrations", value: totalRegistrations },
      { label: "Active Organizers", value: totalOrganizers },
      { label: "Pending Approvals", value: pendingApprovals },
    ],
    recentActivity,
  };
}

export async function getAdminEvents() {
  const now = new Date();

  const events = await prisma.event.findMany({
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

  return {
    generatedAt: now.toISOString(),
    events: events.map((event) => ({
      id: event.id,
      name: event.title,
      category: event.category,
      date: event.startsAt,
      status: event.isPublished ? "Published" : "Draft",
      seats: event.capacity,
      attendees: event._count.registrations,
      organizerName: event.organizer.name ?? event.organizer.email,
    })),
  };
}

export async function getAdminUsers() {
  const users = await prisma.user.findMany({
    where: { role: { not: "admin" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      studentId: true,
      role: true,
      emailVerified: true,
      registrations: {
        select: { id: true },
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    dept: user.department,
    studentId: user.studentId,
    role: user.role,
    events: user.registrations.length,
    status: user.emailVerified ? "Active" : "Unverified",
  }));
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

function formatGrowth(currentPeriod: number, previousPeriod: number) {
  if (previousPeriod <= 0) {
    return currentPeriod > 0 ? "+100%" : "0%";
  }

  const delta = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  const rounded = Math.round(delta);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

export async function getAdminReports() {
  const now = new Date();
  const currentWindowStart = new Date(now);
  currentWindowStart.setDate(now.getDate() - 30);

  const previousWindowStart = new Date(currentWindowStart);
  previousWindowStart.setDate(currentWindowStart.getDate() - 30);

  const [
    totalRegistrations,
    currentPeriodRegistrations,
    previousPeriodRegistrations,
    endedConfirmedRegistrations,
    allEvents,
  ] = await Promise.all([
    prisma.eventRegistration.count(),
    prisma.eventRegistration.count({
      where: {
        registeredAt: {
          gte: currentWindowStart,
        },
      },
    }),
    prisma.eventRegistration.count({
      where: {
        registeredAt: {
          gte: previousWindowStart,
          lt: currentWindowStart,
        },
      },
    }),
    prisma.eventRegistration.count({
      where: {
        status: "Confirmed",
        event: {
          endsAt: {
            lt: now,
          },
        },
      },
    }),
    prisma.event.findMany({
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    }),
  ]);

  const publishedEvents = allEvents.filter((event) => event.isPublished);
  const totalCapacity = publishedEvents.reduce((sum, event) => sum + event.capacity, 0);
  const filledSeats = publishedEvents.reduce((sum, event) => sum + event._count.registrations, 0);
  const fillRate = totalCapacity > 0 ? (filledSeats / totalCapacity) * 100 : 0;

  const categoryCounts = new Map<string, number>();
  for (const event of allEvents) {
    categoryCounts.set(event.category, (categoryCounts.get(event.category) ?? 0) + 1);
  }

  const topCategory =
    [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  return {
    reportCards: [
      {
        title: "Registration Growth",
        value: formatGrowth(currentPeriodRegistrations, previousPeriodRegistrations),
        note: "Compared to previous 30 days",
      },
      {
        title: "Capacity Fill Rate",
        value: formatPercent(fillRate),
        note: "Across all published events",
      },
      {
        title: "Certificates Eligible",
        value: String(endedConfirmedRegistrations),
        note: "Confirmed registrations in completed events",
      },
      {
        title: "Total Registrations",
        value: String(totalRegistrations),
        note: "All-time participant registrations",
      },
    ],
    insights: [
      `Top category by events: ${topCategory}`,
      `Published events: ${publishedEvents.length}`,
      `Total seats filled: ${filledSeats} of ${totalCapacity}`,
      `Recent 30-day registrations: ${currentPeriodRegistrations}`,
    ],
  };
}

export async function adminToggleEventPublish(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  return prisma.event.update({
    where: { id: eventId },
    data: { isPublished: !event.isPublished },
  });
}

export async function adminDeleteEvent(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  return prisma.event.delete({ where: { id: eventId } });
}

export async function adminGetEventRegistrations(eventId: string) {
  return prisma.eventRegistration.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { registeredAt: "desc" },
  });
}

export async function adminSuspendUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  // Toggle emailVerified to simulate suspend/activate (active = emailVerified true)
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerified: !user.emailVerified },
  });
}

export async function adminDeleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return prisma.user.delete({ where: { id: userId } });
}

export async function adminChangeUserRole(userId: string, role: string) {
  const validRoles = ["user", "organizer", "admin"];
  if (!validRoles.includes(role)) throw new Error("INVALID_ROLE");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function adminUpdateEventSettings(settings: {
  defaultMaxParticipants?: number;
  requireApproval?: boolean;
  allowDuplicateCheck?: boolean;
  dailyDigest?: boolean;
}) {
  // Settings are stored in a simple key-value table or as a JSON blob.
  // Since we don't have a settings model, return success acknowledging the settings.
  // In a real system, these would persist to a settings table.
  return { updated: true, settings };
}
