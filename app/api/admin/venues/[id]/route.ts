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

  const venue = await prisma.venue.update({
    where: { id: params.id },
    data: {
      name: body.name || undefined,
      address: body.address ?? undefined,
      city: body.city || undefined,
      description: body.description ?? undefined,
      isActive: body.isActive !== undefined ? body.isActive : undefined,
    },
  });
  return NextResponse.json(venue);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const count = await prisma.event.count({ where: { venueId: params.id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${count} event(s) still use this venue.` },
      { status: 409 }
    );
  }

  await prisma.venue.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
