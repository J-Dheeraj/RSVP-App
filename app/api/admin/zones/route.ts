import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const schema = z.object({
  eventId: z.string(),
  name: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  // Verify the event exists before creating a zone for it
  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
    select: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const zone = await prisma.zone.create({ data: parsed.data });
  return NextResponse.json(zone, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Verify the zone exists before attempting deletion
  const zone = await prisma.zone.findUnique({ where: { id }, select: { id: true } });
  if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

  await prisma.zone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
