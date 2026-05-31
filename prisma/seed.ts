import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 12);
  await prisma.admin.upsert({
    where: { email: "admin@royaltaj.sg" },
    update: {},
    create: { email: "admin@royaltaj.sg", passwordHash: hash, name: "Royal Taj Admin" },
  });

  // Venues
  const sentosa = await prisma.venue.upsert({
    where: { id: "venue-sentosa" },
    update: {},
    create: {
      id: "venue-sentosa",
      name: "Royal Taj Sentosa",
      address: "Sentosa Island",
      city: "Singapore",
      description: "Fine dining at Sentosa Island",
    },
  });

  await prisma.venue.upsert({
    where: { id: "venue-orchard" },
    update: {},
    create: {
      id: "venue-orchard",
      name: "Royal Taj Orchard",
      address: "Orchard Road",
      city: "Singapore",
    },
  });

  // Sample event
  const event = await prisma.event.upsert({
    where: { slug: "royal-taj-gala-2026" },
    update: {},
    create: {
      name: "Royal Taj Gala Dinner 2026",
      slug: "royal-taj-gala-2026",
      date: new Date("2026-09-20T19:00:00+08:00"),
      venueId: sentosa.id,
      description: "An evening of fine dining and celebration.",
      type: "other",
      allocation: "auto",
      maxPerTable: 10,
    },
  });

  // Sample tables
  for (let i = 1; i <= 6; i++) {
    await prisma.table.upsert({
      where: { id: `table-gala-${i}` },
      update: {},
      create: {
        id: `table-gala-${i}`,
        eventId: event.id,
        number: i,
        label: `Table ${i}`,
        capacity: 10,
      },
    });
  }

  console.log("✅ Seed complete");
  console.log("   Admin: admin@royaltaj.sg / admin123");
  console.log("   RSVP:  http://localhost:3000/rsvp/royal-taj-gala-2026");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
