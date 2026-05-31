import { Prisma } from "@prisma/client";

type EventWithTables = Prisma.EventGetPayload<{
  include: { tables: { include: { rsvps: true; zone: true } }; zones: true };
}>;

export function allocateTable(
  event: EventWithTables,
  relationship: string | null | undefined,
  guestCount: number
): string | null {
  const tables = event.tables;

  function seatsUsed(table: (typeof tables)[0]) {
    return table.rsvps.reduce((sum, r) => sum + r.guestCount, 0);
  }

  function hasSpace(table: (typeof tables)[0]) {
    return seatsUsed(table) + guestCount <= table.capacity;
  }

  if (event.allocation === "zone") {
    const zone = event.zones.find((z) => z.name === (relationship ?? "other"));
    const zoneId = zone?.id ?? event.zones.find((z) => z.name === "other")?.id;
    const candidates = tables
      .filter((t) => t.zoneId === zoneId && hasSpace(t))
      .sort((a, b) => seatsUsed(b) - seatsUsed(a));
    return candidates[0]?.id ?? null;
  }

  if (event.allocation === "auto") {
    const candidates = tables
      .filter(hasSpace)
      .sort((a, b) => seatsUsed(b) - seatsUsed(a));
    return candidates[0]?.id ?? null;
  }

  // "manual" — admin assigns later
  return null;
}
