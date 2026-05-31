import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      venue: true,
      zones: true,
      tables: {
        include: {
          zone: true,
          rsvps: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { number: "asc" },
      },
      rsvps: {
        include: { table: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      isActive: body.isActive !== undefined ? body.isActive : undefined,
      name: body.name || undefined,
      description: body.description ?? undefined,
    },
  });
  return NextResponse.json(event);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
