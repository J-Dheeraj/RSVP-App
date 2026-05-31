"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type MfaStep = "idle" | "setup" | "verify" | "disable";

export default function SettingsPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [step, setStep] = useState<MfaStep>("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/mfa/status")
      .then((r) => r.json())
      .then((d) => setMfaEnabled(d.mfaEnabled));
  }, []);

  async function startSetup() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/mfa/setup");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setQrDataUrl(data.qrDataUrl);
    setSecret(data.secret);
    setStep("setup");
  }

  async function verifySetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/mfa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setMfaEnabled(true);
    setStep("idle");
    setToken("");
    setSuccess("MFA enabled. Your account is now protected.");
  }

  async function disableMfa(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/mfa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setMfaEnabled(false);
    setStep("idle");
    setToken("");
    setSuccess("MFA has been disabled.");
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Settings</h1>
        <p className="text-stone-500 text-sm mt-0.5">Account security</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-stone-800">Two-Factor Authentication</p>
            <p className="text-stone-500 text-sm mt-0.5">
              {mfaEnabled
                ? "MFA is enabled. Sign-in requires your authenticator app."
                : "Add a second layer of protection to your admin account."}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ml-4 ${
              mfaEnabled ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
            }`}
          >
            {mfaEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Idle state */}
        {step === "idle" && !mfaEnabled && (
          <button
            onClick={startSetup}
            disabled={loading}
            className="mt-5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? "Setting up…" : "Enable MFA"}
          </button>
        )}
        {step === "idle" && mfaEnabled && (
          <button
            onClick={() => { setStep("disable"); setError(""); setSuccess(""); }}
            className="mt-5 px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition-colors"
          >
            Disable MFA
          </button>
        )}

        {/* Setup step 1: show QR */}
        {step === "setup" && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-stone-600">
              Scan this QR code with <strong>Google Authenticator</strong>,{" "}
              <strong>Authy</strong>, or any TOTP app.
            </p>
            {qrDataUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="MFA QR Code" className="w-48 h-48 rounded-xl border border-stone-200" />
              </div>
            )}
            <p className="text-xs text-stone-400 text-center break-all">
              Manual entry key: <span className="font-mono">{secret}</span>
            </p>
            <form onSubmit={verifySetup} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Enter the 6-digit code to confirm
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep("idle"); setToken(""); setError(""); }}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || token.length < 6}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {loading ? "Verifying…" : "Activate MFA"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Disable step */}
        {step === "disable" && (
          <form onSubmit={disableMfa} className="mt-5 space-y-3">
            <p className="text-sm text-stone-600">
              Enter your current authenticator code to confirm disabling MFA.
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep("idle"); setToken(""); setError(""); }}
                className="flex-1 py-2.5 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || token.length < 6}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {loading ? "Disabling…" : "Disable MFA"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
