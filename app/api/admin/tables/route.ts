import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTableSchema } from "@/lib/validations";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = createTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  // Verify the event exists before creating a table for it
  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
    select: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const table = await prisma.table.create({
    data: {
      eventId: parsed.data.eventId,
      number: parsed.data.number,
      label: parsed.data.label || null,
      capacity: parsed.data.capacity,
      zoneId: parsed.data.zoneId || null,
    },
  });
  return NextResponse.json(table, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Verify the table exists before attempting deletion
  const table = await prisma.table.findUnique({ where: { id }, select: { id: true } });
  if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

  await prisma.table.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
