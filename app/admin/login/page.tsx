"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Step = "credentials" | "mfa";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setError("Too many attempts. Please wait before trying again.");
        return;
      }
      if (!data.ok) {
        setError("Invalid email or password.");
        return;
      }

      if (data.requiresMfa) {
        setStep("mfa");
      } else {
        await finishSignIn("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await finishSignIn(totp);
    } finally {
      setLoading(false);
    }
  }

  async function finishSignIn(totpCode: string) {
    const result = await signIn("credentials", {
      email,
      password,
      totp: totpCode,
      redirect: false,
    });
    if (result?.error) {
      setError(totpCode ? "Invalid authenticator code." : "Invalid email or password.");
    } else {
      router.push("/admin/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-amber-700">Royal Taj</h1>
          <p className="text-stone-500 text-sm mt-1">Sign in to manage events</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-stone-200">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {step === "credentials" && (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="admin@royaltaj.sg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? "Checking…" : "Continue"}
              </button>
            </form>
          )}

          {step === "mfa" && (
            <form onSubmit={handleMfa} className="space-y-4">
              <div className="text-center pb-2">
                <p className="text-stone-600 text-sm">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading || totp.length < 6}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? "Verifying…" : "Sign In"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("credentials"); setError(""); setTotp(""); }}
                className="w-full text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                ← Back
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
