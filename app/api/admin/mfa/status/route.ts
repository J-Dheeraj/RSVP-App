import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.admin.findUnique({
    where: { email: session.user!.email! },
    select: { mfaEnabled: true },
  });

  return NextResponse.json({ mfaEnabled: admin?.mfaEnabled ?? false });
}
