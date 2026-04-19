import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/config/prisma.js";

async function main() {
  const adminEmail = "admin@cuet.ac.bd";
  const adminPassword = "Admin@123456";

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "CUET Admin",
      role: "admin",
      emailVerified: true,
      onboardingCompleted: true,
    },
    create: {
      name: "CUET Admin",
      email: adminEmail,
      role: "admin",
      emailVerified: true,
      onboardingCompleted: true,
    },
  });

  const adminPasswordHash = await hashPassword(adminPassword);

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: adminUser.id,
      },
    },
    update: {
      password: adminPasswordHash,
      userId: adminUser.id,
    },
    create: {
      providerId: "credential",
      accountId: adminUser.id,
      userId: adminUser.id,
      password: adminPasswordHash,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "john.doe@cuet.ac.bd" },
    update: {
      name: "John Doe",
      studentId: "C190401",
      department: "Computer Science",
    },
    create: {
      name: "John Doe",
      email: "john.doe@cuet.ac.bd",
      studentId: "C190401",
      department: "Computer Science",
      role: "user",
      emailVerified: true,
    },
  });

  const eventInputs = [
    {
      title: "Spring Concert 2026",
      description: "Experience an evening of live music performances by talented student artists.",
      category: "Music",
      status: "Ongoing",
      imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
      location: "Main Auditorium",
      startsAt: new Date("2026-02-15T18:00:00.000Z"),
      endsAt: new Date("2026-02-15T21:00:00.000Z"),
      capacity: 300,
      isPublished: true,
    },
    {
      title: "Hackathon Week",
      description: "48-hour coding marathon to build innovative tech solutions.",
      category: "Technology",
      status: "Registration Open",
      imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
      location: "Computer Lab",
      startsAt: new Date("2026-02-10T09:00:00.000Z"),
      endsAt: new Date("2026-02-17T17:00:00.000Z"),
      capacity: 200,
      isPublished: true,
    },
    {
      title: "Art Exhibition",
      description: "Showcase of creative artwork by students from all departments.",
      category: "Arts",
      status: "Coming Soon",
      imageUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80",
      location: "Gallery Hall",
      startsAt: new Date("2026-02-20T10:00:00.000Z"),
      endsAt: new Date("2026-02-20T18:00:00.000Z"),
      capacity: 250,
      isPublished: true,
    },
    {
      title: "Football Championship",
      description: "Inter-department football tournament with exciting prizes.",
      category: "Sports",
      status: "Registration Open",
      imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
      location: "Sports Ground",
      startsAt: new Date("2026-02-25T15:00:00.000Z"),
      endsAt: new Date("2026-02-25T19:00:00.000Z"),
      capacity: 500,
      isPublished: true,
    },
    {
      title: "Science Fair 2026",
      description: "Students presenting innovative research projects and experiments.",
      category: "Academic",
      status: "Coming Soon",
      imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
      location: "Science Building",
      startsAt: new Date("2026-03-01T09:00:00.000Z"),
      endsAt: new Date("2026-03-01T17:00:00.000Z"),
      capacity: 300,
      isPublished: true,
    },
    {
      title: "Photography Workshop",
      description: "Learn professional photography techniques from experts.",
      category: "Workshop",
      status: "Almost Full",
      imageUrl: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80",
      location: "Media Lab",
      startsAt: new Date("2026-03-12T14:00:00.000Z"),
      endsAt: new Date("2026-03-12T18:00:00.000Z"),
      capacity: 50,
      isPublished: true,
    },
  ];

  const events = [];
  for (const eventInput of eventInputs) {
    const event = await prisma.event.upsert({
      where: {
        id: `${eventInput.title.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {
        ...eventInput,
        organizerId: demoUser.id,
      },
      create: {
        id: `${eventInput.title.toLowerCase().replace(/\s+/g, "-")}`,
        ...eventInput,
        organizerId: demoUser.id,
      },
    });
    events.push(event);
  }

  await prisma.eventRegistration.deleteMany({ where: { userId: demoUser.id } });

  for (const event of events.slice(0, 4)) {
    await prisma.eventRegistration.create({
      data: {
        userId: demoUser.id,
        eventId: event.id,
        status: event.status === "Coming Soon" ? "Waitlist" : "Confirmed",
      },
    });
  }

  console.log("Seed complete: admin user, demo user, events, registrations");
  console.log(`Admin credentials => email: ${adminEmail} | password: ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
