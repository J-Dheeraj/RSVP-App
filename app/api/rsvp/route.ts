import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rsvpSchema } from "@/lib/validations";
import { allocateTable } from "@/lib/allocation";
import { checkRsvpRateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { success, retryAfterSeconds } = await checkRsvpRateLimit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      {
        status: 429,
        headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {},
      }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { eventSlug, ...data } = parsed.data;

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug, isActive: true },
    include: { tables: { include: { rsvps: true, zone: true } }, zones: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const tableId = allocateTable(event, data.relationship, data.guestCount);

  try {
    const rsvp = await prisma.$transaction(async (tx) => {
      if (tableId) {
        const [agg, table] = await Promise.all([
          tx.rSVP.aggregate({ where: { tableId }, _sum: { guestCount: true } }),
          tx.table.findUnique({ where: { id: tableId }, select: { capacity: true } }),
        ]);
        const used = agg._sum.guestCount ?? 0;
        if (table && used + data.guestCount > table.capacity) {
          throw Object.assign(new Error("TABLE_FULL"), { code: "TABLE_FULL" });
        }
      }

      return tx.rSVP.create({
        data: {
          eventId: event.id,
          tableId,
          guestName: data.guestName,
          email: data.email || null,
          phone: data.phone || null,
          guestCount: data.guestCount,
          relationship: data.relationship,
          needsTransport: data.needsTransport,
          pickupLocation: data.needsTransport ? (data.pickupLocation || null) : null,
          dietaryNeeds: data.dietaryNeeds || null,
          message: data.message || null,
        },
        include: { table: { include: { zone: true } } },
      });
    });

    return NextResponse.json({
      id: rsvp.id,
      tableName: rsvp.table?.label ?? (rsvp.table ? `Table ${rsvp.table.number}` : null),
      tableAssigned: !!rsvp.tableId,
      eventName: event.name,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "TABLE_FULL") {
      return NextResponse.json(
        { error: "No seats available. Please try again or contact the organiser." },
        { status: 409 }
      );
    }
    throw e;
  }
}
