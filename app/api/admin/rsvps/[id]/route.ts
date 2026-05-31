import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Verify the target table belongs to the same event as the RSVP
  if (body.tableId) {
    const [rsvp, table] = await Promise.all([
      prisma.rSVP.findUnique({ where: { id: params.id }, select: { eventId: true } }),
      prisma.table.findUnique({ where: { id: body.tableId }, select: { eventId: true } }),
    ]);
    if (!rsvp) return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    if (!table || table.eventId !== rsvp.eventId) {
      return NextResponse.json({ error: "Table does not belong to this event" }, { status: 400 });
    }
  }

  const rsvp = await prisma.rSVP.update({
    where: { id: params.id },
    data: {
      tableId: body.tableId !== undefined ? body.tableId : undefined,
      adminNotes: body.adminNotes !== undefined ? body.adminNotes : undefined,
    },
    include: { table: true },
  });
  return NextResponse.json(rsvp);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  await prisma.rSVP.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
