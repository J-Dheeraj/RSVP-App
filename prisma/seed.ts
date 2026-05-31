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

  // Real venues Royal Taj caters at
  const amara = await prisma.venue.upsert({
    where: { id: "venue-amara" },
    update: {},
    create: {
      id: "venue-amara",
      name: "Amara Sanctuary Ballroom",
      address: "1 Larkhill Road, Sentosa Island",
      city: "Singapore",
      description: "Grand ballroom at Amara Sanctuary Resort Sentosa",
    },
  });

  await prisma.venue.upsert({
    where: { id: "venue-private" },
    update: {},
    create: {
      id: "venue-private",
      name: "Private Residence",
      address: "",
      city: "Singapore",
      description: "Client's home or private venue — update address when confirmed",
    },
  });

  // Sample wedding at Amara Sanctuary Ballroom
  const wedding = await prisma.event.upsert({
    where: { slug: "priya-arjun-wedding-2026" },
    update: {},
    create: {
      name: "Priya & Arjun Wedding",
      slug: "priya-arjun-wedding-2026",
      date: new Date("2026-10-11T18:30:00+08:00"),
      venueId: amara.id,
      description: "Join us as we celebrate the union of Priya and Arjun.",
      type: "wedding",
      allocation: "zone",
      maxPerTable: 10,
    },
  });

  // Zones for the wedding (bride/groom sides)
  const zones = [
    { id: "zone-bride",    name: "bride",     label: "Bride's Side",  color: "#ec4899" },
    { id: "zone-groom",    name: "groom",     label: "Groom's Side",  color: "#6366f1" },
    { id: "zone-vip",      name: "vip",       label: "VIP",           color: "#f59e0b" },
    { id: "zone-other",    name: "other",     label: "Other Guests",  color: "#10b981" },
  ];
  for (const z of zones) {
    await prisma.zone.upsert({
      where: { id: z.id },
      update: {},
      create: { ...z, eventId: wedding.id },
    });
  }

  // Tables per zone
  const tableData = [
    { number: 1, label: "Bride's Table 1",  zoneId: "zone-bride", capacity: 10 },
    { number: 2, label: "Bride's Table 2",  zoneId: "zone-bride", capacity: 10 },
    { number: 3, label: "Groom's Table 1",  zoneId: "zone-groom", capacity: 10 },
    { number: 4, label: "Groom's Table 2",  zoneId: "zone-groom", capacity: 10 },
    { number: 5, label: "VIP Table",        zoneId: "zone-vip",   capacity:  8 },
    { number: 6, label: "General Table 1",  zoneId: "zone-other", capacity: 10 },
  ];
  for (const t of tableData) {
    await prisma.table.upsert({
      where: { id: `table-w-${t.number}` },
      update: {},
      create: { id: `table-w-${t.number}`, eventId: wedding.id, ...t },
    });
  }

  console.log("✅ Seed complete");
  console.log("   Admin:   admin@royaltaj.sg / admin123");
  console.log("   Wedding: http://localhost:3000/rsvp/priya-arjun-wedding-2026");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
