import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rsvpSchema } from "@/lib/validations";
import { allocateTable } from "@/lib/allocation";

// Simple in-memory rate limit: max 5 submissions per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 10 * 60 * 1000;
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { eventSlug, ...data } = body as { eventSlug: string } & typeof parsed.data;
  if (!eventSlug) return NextResponse.json({ error: "Missing eventSlug" }, { status: 400 });

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug, isActive: true },
    include: { tables: { include: { rsvps: true, zone: true } }, zones: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const tableId = allocateTable(event, data.relationship, data.guestCount);

  const rsvp = await prisma.rSVP.create({
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

  return NextResponse.json({
    id: rsvp.id,
    tableName: rsvp.table?.label ?? (rsvp.table ? `Table ${rsvp.table.number}` : null),
    tableAssigned: !!rsvp.tableId,
    eventName: event.name,
  });
}
