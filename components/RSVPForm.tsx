"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EventInfo = {
  name: string;
  slug: string;
  date: string;
  description: string | null;
  type: string;
  venue: { name: string; address: string | null; city: string };
};

const WEDDING_RELATIONSHIPS = [
  { value: "bride",  label: "Bride's Side" },
  { value: "groom",  label: "Groom's Side" },
  { value: "vip",    label: "VIP" },
  { value: "other",  label: "Other" },
];

const DEFAULT_RELATIONSHIPS = [
  { value: "family",     label: "Family" },
  { value: "friends",    label: "Friends" },
  { value: "colleagues", label: "Colleagues" },
  { value: "other",      label: "Other" },
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function RSVPForm({ event }: { event: EventInfo }) {
  const router = useRouter();
  const isWedding = event.type === "wedding";
  const relationships = isWedding ? WEDDING_RELATIONSHIPS : DEFAULT_RELATIONSHIPS;

  const [form, setForm] = useState<Field>({
    guestName: "",
    email: "",
    phone: "",
    guestCount: 1,
    relationship: isWedding ? "bride" : "friends",
    needsTransport: false,
    pickupLocation: "",
    dietaryNeeds: "",
    message: "",
  });
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
        body: JSON.stringify({ ...form, eventSlug: event.slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (typeof data.error === "object") setErrors(data.error);
        else setErrors({ _root: [data.error ?? "Something went wrong"] });
        return;
      }
      router.push(
        `/rsvp/${event.slug}/success?table=${encodeURIComponent(data.tableName ?? "")}&name=${encodeURIComponent(form.guestName)}&event=${encodeURIComponent(event.name)}&venue=${encodeURIComponent(event.venue.name)}&date=${encodeURIComponent(event.date)}`
      );
    } finally {
      setLoading(false);
    }
  }

  function err(field: string) {
    return errors[field]?.[0];
  }

  return (
    <main className="min-h-screen bg-amber-50">
      {/* Event banner */}
      <div className="bg-stone-900 text-white px-6 py-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold leading-snug">
          {event.name}
        </h1>
        <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-stone-300 text-sm">
          <span>{formatDate(event.date)}</span>
          <span className="hidden sm:inline text-stone-600">·</span>
          <span>{formatTime(event.date)}</span>
          <span className="hidden sm:inline text-stone-600">·</span>
          <span>
            {event.venue.name}
            {event.venue.address ? `, ${event.venue.address}` : ""}
          </span>
        </div>
        {event.description && (
          <p className="mt-4 text-stone-400 text-sm max-w-md mx-auto">{event.description}</p>
        )}
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 py-10">
        <p className="text-center text-stone-500 text-sm mb-6">
          Please confirm your attendance by filling in the details below.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-amber-100 p-7 space-y-5"
        >
          {errors._root && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {errors._root[0]}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Full Name <span className="text-amber-600">*</span>
            </label>
            <input
              type="text"
              value={form.guestName}
              onChange={(e) => set("guestName", e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              className={`w-full px-4 py-2.5 rounded-xl border text-stone-900 placeholder:text-stone-400 ${
                err("guestName") ? "border-red-400" : "border-stone-200"
              } focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400`}
            />
            {err("guestName") && <p className="text-red-500 text-xs mt-1">{err("guestName")}</p>}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                className={`w-full px-4 py-2.5 rounded-xl border text-stone-900 placeholder:text-stone-400 ${
                  err("email") ? "border-red-400" : "border-stone-200"
                } focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400`}
              />
              {err("email") && <p className="text-red-500 text-xs mt-1">{err("email")}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+65 9123 4567"
                autoComplete="tel"
                className={`w-full px-4 py-2.5 rounded-xl border text-stone-900 placeholder:text-stone-400 ${
                  err("phone") ? "border-red-400" : "border-stone-200"
                } focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400`}
              />
              {err("phone") && <p className="text-red-500 text-xs mt-1">{err("phone")}</p>}
            </div>
          </div>

          {/* Guest count */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Number of Guests <span className="text-amber-600">*</span>
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => set("guestCount", Math.max(1, form.guestCount - 1))}
                className="w-10 h-10 rounded-full border border-stone-200 text-stone-600 text-xl font-light hover:border-amber-400 hover:text-amber-700 transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-semibold text-amber-700 w-6 text-center tabular-nums">
                {form.guestCount}
              </span>
              <button
                type="button"
                onClick={() => set("guestCount", Math.min(20, form.guestCount + 1))}
                className="w-10 h-10 rounded-full border border-stone-200 text-stone-600 text-xl font-light hover:border-amber-400 hover:text-amber-700 transition-colors"
              >
                +
              </button>
              <span className="text-stone-400 text-sm">including yourself</span>
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              {isWedding ? "Attending as" : "Your relationship to the host"}{" "}
              <span className="text-amber-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {relationships.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set("relationship", r.value)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                    form.relationship === r.value
                      ? "bg-amber-700 border-amber-700 text-white"
                      : "border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transport */}
          <div className="bg-stone-50 rounded-xl p-4 space-y-3 border border-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-700">Transportation</p>
                <p className="text-xs text-stone-400 mt-0.5">Do you need a ride to the venue?</p>
              </div>
              <button
                type="button"
                onClick={() => set("needsTransport", !form.needsTransport)}
                aria-pressed={form.needsTransport}
                className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                  form.needsTransport ? "bg-amber-600" : "bg-stone-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    form.needsTransport ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {form.needsTransport && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={form.pickupLocation}
                  onChange={(e) => set("pickupLocation", e.target.value)}
                  placeholder="e.g. Tampines MRT, Jurong East Bus Interchange"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Dietary */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Dietary Requirements
            </label>
            <input
              type="text"
              value={form.dietaryNeeds}
              onChange={(e) => set("dietaryNeeds", e.target.value)}
              placeholder="e.g. Vegetarian, Halal, Nut allergy"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Message or special requests
            </label>
            <textarea
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              rows={3}
              placeholder="Anything you'd like the organiser to know…"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-base tracking-wide"
          >
            {loading ? "Confirming…" : "Confirm Attendance"}
          </button>

          <p className="text-center text-stone-400 text-xs pt-1">
            Your details are only used to manage seating for this event.
            <br />
            <span className="text-stone-300">Catered by Royal Taj</span>
          </p>
        </form>
      </div>
    </main>
  );
}
