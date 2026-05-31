"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

const RELATIONSHIPS = [
  { value: "family", label: "Family" },
  { value: "friends", label: "Friends" },
  { value: "colleagues", label: "Colleagues" },
  { value: "other", label: "Other" },
];

type Field = {
  guestName: string;
  email: string;
  phone: string;
  guestCount: number;
  relationship: string;
  needsTransport: boolean;
  pickupLocation: string;
  dietaryNeeds: string;
  message: string;
};

const defaults: Field = {
  guestName: "",
  email: "",
  phone: "",
  guestCount: 1,
  relationship: "friends",
  needsTransport: false,
  pickupLocation: "",
  dietaryNeeds: "",
  message: "",
};

export default function RSVPPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Field>(defaults);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  function set<K extends keyof Field>(key: K, value: Field[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: [] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, eventSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (typeof data.error === "object") setErrors(data.error);
        else setErrors({ _root: [data.error ?? "Something went wrong"] });
        return;
      }
      router.push(
        `/rsvp/${eventSlug}/success?table=${encodeURIComponent(data.tableName ?? "")}&name=${encodeURIComponent(form.guestName)}&event=${encodeURIComponent(data.eventName ?? "")}`
      );
    } finally {
      setLoading(false);
    }
  }

  function err(field: string) {
    return errors[field]?.[0];
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-amber-700 font-bold text-lg tracking-tight">Royal Taj</p>
          <h1 className="text-3xl font-serif font-bold text-stone-800 mt-1">RSVP</h1>
          <p className="text-stone-500 mt-1">We look forward to welcoming you.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl p-8 space-y-5 border border-rose-100"
        >
          {errors._root && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {errors._root[0]}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.guestName}
              onChange={(e) => set("guestName", e.target.value)}
              placeholder="Your full name"
              className={`w-full px-4 py-2.5 rounded-xl border ${err("guestName") ? "border-red-400" : "border-stone-200"} focus:outline-none focus:ring-2 focus:ring-rose-300`}
            />
            {err("guestName") && <p className="text-red-500 text-xs mt-1">{err("guestName")}</p>}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@email.com"
                className={`w-full px-4 py-2.5 rounded-xl border ${err("email") ? "border-red-400" : "border-stone-200"} focus:outline-none focus:ring-2 focus:ring-rose-300`}
              />
              {err("email") && <p className="text-red-500 text-xs mt-1">{err("email")}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+65 9123 4567"
                className={`w-full px-4 py-2.5 rounded-xl border ${err("phone") ? "border-red-400" : "border-stone-200"} focus:outline-none focus:ring-2 focus:ring-rose-300`}
              />
              {err("phone") && <p className="text-red-500 text-xs mt-1">{err("phone")}</p>}
            </div>
          </div>

          {/* Guest count */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Number of Guests <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set("guestCount", Math.max(1, form.guestCount - 1))}
                className="w-10 h-10 rounded-full border border-stone-200 text-lg font-bold text-stone-600 hover:bg-rose-50 transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-bold text-rose-700 w-8 text-center">
                {form.guestCount}
              </span>
              <button
                type="button"
                onClick={() => set("guestCount", Math.min(20, form.guestCount + 1))}
                className="w-10 h-10 rounded-full border border-stone-200 text-lg font-bold text-stone-600 hover:bg-rose-50 transition-colors"
              >
                +
              </button>
              <span className="text-stone-500 text-sm">(including yourself)</span>
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Your relationship to the host <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set("relationship", r.value)}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                    form.relationship === r.value
                      ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                      : "border-stone-200 text-stone-600 hover:border-rose-300"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transport */}
          <div className="bg-stone-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-700">Transportation</p>
                <p className="text-stone-500 text-sm">Do you need transport to the venue?</p>
              </div>
              <button
                type="button"
                onClick={() => set("needsTransport", !form.needsTransport)}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.needsTransport ? "bg-rose-500" : "bg-stone-300"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.needsTransport ? "translate-x-7" : "translate-x-1"}`}
                />
              </button>
            </div>
            {form.needsTransport && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={form.pickupLocation}
                  onChange={(e) => set("pickupLocation", e.target.value)}
                  placeholder="e.g. Tampines MRT, Block 123 Jurong"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
                />
              </div>
            )}
          </div>

          {/* Dietary needs */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Dietary Requirements
            </label>
            <input
              type="text"
              value={form.dietaryNeeds}
              onChange={(e) => set("dietaryNeeds", e.target.value)}
              placeholder="e.g. Vegetarian, Halal, Nut allergy…"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Message or special requests
            </label>
            <textarea
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              rows={3}
              placeholder="Any special requests or notes for the organiser…"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold rounded-2xl transition-colors shadow-sm text-lg"
          >
            {loading ? "Submitting…" : "Confirm RSVP 🎉"}
          </button>
        </form>
      </div>
    </main>
  );
}
