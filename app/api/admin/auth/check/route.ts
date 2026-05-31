import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkLoginRateLimit } from "@/lib/ratelimit";

/**
 * Pre-login check: validates email + password without creating a session.
 * Returns whether MFA is required so the login UI can show the TOTP field.
 * Rate-limited by the same limiter as the NextAuth credentials flow.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email: string = body?.email ?? "";
  const password: string = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { success } = await checkLoginRateLimit(email);
  if (!success) {
    return NextResponse.json({ ok: false, error: "Too many attempts" }, { status: 429 });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });

  const dummyHash = "$2a$12$invalidhashfortimingnormalisation000000000000000000000";
  const valid = admin
    ? await bcrypt.compare(password, admin.passwordHash)
    : await bcrypt.compare(password, dummyHash).then(() => false);

  if (!valid) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true, requiresMfa: admin!.mfaEnabled });
}
