import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Login rate limit: max 10 attempts per email per 15 minutes.
// Same serverless caveat as the RSVP rate limiter — replace with
// Upstash Redis (@upstash/ratelimit) before deploying to production.
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkLoginRateLimit(email: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;

  const entry = loginAttempts.get(email);

  if (entry) {
    if (now < entry.lockedUntil) {
      return { allowed: false, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
    }
    if (entry.count >= maxAttempts) {
      // Lock for 15 minutes on reaching the limit
      entry.lockedUntil = now + window;
      entry.count = 0;
      return { allowed: false, retryAfterSeconds: Math.ceil(window / 1000) };
    }
    entry.count++;
  } else {
    loginAttempts.set(email, { count: 1, lockedUntil: 0 });
  }

  return { allowed: true };
}

function resetLoginAttempts(email: string) {
  loginAttempts.delete(email);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8-hour sessions
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { allowed } = checkLoginRateLimit(credentials.email);
        if (!allowed) {
          // Return null — NextAuth surfaces this as a generic auth error.
          // The rate limit state is checked; the client sees "Invalid email or password."
          return null;
        }

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        });

        // Always run bcrypt compare to prevent timing-based email enumeration
        const dummyHash = "$2a$12$invalidhashfortimingnormalisation000000000000000000000";
        const valid = admin
          ? await bcrypt.compare(credentials.password, admin.passwordHash)
          : await bcrypt.compare(credentials.password, dummyHash).then(() => false);

        if (!valid) return null;

        // Successful login — clear attempt counter
        resetLoginAttempts(credentials.email);
        return { id: admin!.id, email: admin!.email, name: admin!.name ?? "Admin" };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.id as string;
      return session;
    },
  },
};
