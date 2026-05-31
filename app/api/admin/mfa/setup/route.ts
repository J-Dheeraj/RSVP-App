import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";
import QRCode from "qrcode";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** GET — generate a new TOTP secret and return the QR code data URL. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(
    session.user?.email ?? "admin",
    "Royal Taj RSVP",
    secret
  );
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  // Persist the secret (mfaEnabled stays false until POST /verify confirms it)
  await prisma.admin.update({
    where: { email: session.user!.email! },
    data: { totpSecret: secret, mfaEnabled: false },
  });

  return NextResponse.json({ secret, qrDataUrl });
}

/** POST — verify the first TOTP code and enable MFA. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const { token } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = await prisma.admin.findUnique({
    where: { email: session.user!.email! },
    select: { totpSecret: true },
  });

  if (!admin?.totpSecret) {
    return NextResponse.json({ error: "MFA not initialized. Call GET first." }, { status: 400 });
  }

  const valid = authenticator.check(String(token).trim(), admin.totpSecret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid code. Try again." }, { status: 422 });
  }

  await prisma.admin.update({
    where: { email: session.user!.email! },
    data: { mfaEnabled: true },
  });

  return NextResponse.json({ ok: true });
}
