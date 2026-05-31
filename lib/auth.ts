import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { prisma } from "@/lib/prisma";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/ratelimit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",              type: "email" },
        password: { label: "Password",           type: "password" },
        totp:     { label: "Authenticator Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { success } = await checkLoginRateLimit(credentials.email);
        if (!success) return null;

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        });

        // Always run bcrypt to prevent timing-based email enumeration
        const dummyHash = "$2a$12$invalidhashfortimingnormalisation000000000000000000000";
        const passwordValid = admin
          ? await bcrypt.compare(credentials.password, admin.passwordHash)
          : await bcrypt.compare(credentials.password, dummyHash).then(() => false);

        if (!passwordValid) return null;

        // MFA check — only if the admin has it enabled
        if (admin!.mfaEnabled) {
          const code = (credentials.totp ?? "").trim();
          if (!code || !admin!.totpSecret) return null;
          const totpValid = authenticator.check(code, admin!.totpSecret);
          if (!totpValid) return null;
        }

        await resetLoginRateLimit(credentials.email);
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
