import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** POST — verify current TOTP and disable MFA. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { token } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = await prisma.admin.findUnique({
    where: { email: session.user!.email! },
    select: { totpSecret: true, mfaEnabled: true },
  });

  if (!admin?.mfaEnabled || !admin.totpSecret) {
    return NextResponse.json({ error: "MFA is not enabled" }, { status: 400 });
  }

  const valid = authenticator.check(String(token).trim(), admin.totpSecret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 422 });
  }

  await prisma.admin.update({
    where: { email: session.user!.email! },
    data: { mfaEnabled: false, totpSecret: null },
  });

  return NextResponse.json({ ok: true });
}
