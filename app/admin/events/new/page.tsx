"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Venue = { id: string; name: string; address: string | null; city: string };

const EVENT_TYPES = [
  { value: "wedding",       label: "Wedding",           icon: "💍", allocation: "zone" },
  { value: "gala-dinner",   label: "Gala Dinner",       icon: "🍽️", allocation: "auto" },
  { value: "private-party", label: "Private Party",     icon: "🥂", allocation: "auto" },
  { value: "birthday",      label: "Birthday",          icon: "🎂", allocation: "auto" },
  { value: "corporate",     label: "Corporate Dinner",  icon: "🏢", allocation: "auto" },
  { value: "cocktail",      label: "Cocktail Reception",icon: "🍸", allocation: "manual" },
  { value: "other",         label: "Other",             icon: "📋", allocation: "auto" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    date: "",
    venueId: "",
    description: "",
    type: "gala-dinner",
    allocation: "auto",
    maxPerTable: 10,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/venues")
      .then((r) => r.json())
      .then((data) => {
        setVenues(data);
        if (data.length === 1) setForm((f) => ({ ...f, venueId: data[0].id }));
      });
  }, []);

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: [] }));
  }

  function selectType(value: string) {
    const def = EVENT_TYPES.find((t) => t.value === value);
    setForm((f) => ({ ...f, type: value, allocation: def?.allocation ?? "auto" }));
    setErrors((e) => ({ ...e, type: [] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: new Date(form.date).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(typeof data.error === "object" ? data.error : { _root: [data.error] });
        return;
      }
      router.push(`/admin/events/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  function err(k: string) {
    return errors[k]?.[0];
  }

  const allocOptions =
    form.type === "wedding"
      ? [
          { value: "zone",   label: "Zone-based — guests auto-assigned by side (Bride / Groom)" },
          { value: "manual", label: "Manual — admin assigns every guest" },
        ]
      : [
          { value: "auto",   label: "Auto — fill tables in order" },
          { value: "manual", label: "Manual — admin assigns every guest" },
        ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/dashboard" className="text-stone-400 hover:text-stone-600 transition-colors">
          ← Events
        </Link>
        <span className="text-stone-300">/</span>
        <h1 className="text-xl font-bold text-stone-800">New Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
        {errors._root && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {errors._root[0]}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Event Name *</label>
          <input
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!form.slug || form.slug === autoSlug(form.name)) {
                set("slug", autoSlug(e.target.value));
              }
            }}
            placeholder="e.g. Priya & Arjun Wedding"
            className={`w-full px-4 py-2.5 rounded-xl border ${err("name") ? "border-red-400" : "border-stone-200"} focus:outline-none focus:ring-2 focus:ring-amber-300`}
          />
          {err("name") && <p className="text-red-500 text-xs mt-1">{err("name")}</p>}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            URL Slug *{" "}
            <span className="text-stone-400 font-normal">
              (/rsvp/<strong>{form.slug || "your-slug"}</strong>)
            </span>
          </label>
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="priya-arjun-wedding-2026"
            className={`w-full px-4 py-2.5 rounded-xl border ${err("slug") ? "border-red-400" : "border-stone-200"} focus:outline-none focus:ring-2 focus:ring-amber-300`}
          />
          {err("slug") && <p className="text-red-500 text-xs mt-1">{err("slug")}</p>}
        </div>

        {/* Date + Max */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${err("date") ? "border-red-400" : "border-stone-200"} focus:outline-none focus:ring-2 focus:ring-amber-300`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Max per Table</label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.maxPerTable}
              onChange={(e) => set("maxPerTable", parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        {/* Venue */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Venue *</label>
          {venues.length === 0 ? (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              No venues found.{" "}
              <Link href="/admin/venues" className="underline font-medium">Add a venue first</Link>.
            </div>
          ) : (
            <select
              value={form.venueId}
              onChange={(e) => set("venueId", e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${err("venueId") ? "border-red-400" : "border-stone-200"} focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white`}
            >
              <option value="">Select a venue…</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}{v.address ? ` — ${v.address}` : ""}
                </option>
              ))}
            </select>
          )}
          {err("venueId") && <p className="text-red-500 text-xs mt-1">{err("venueId")}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            placeholder="Optional message shown on the RSVP page"
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </div>

        {/* Event type */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Event Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => selectType(t.value)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  form.type === t.value
                    ? "bg-amber-700 border-amber-700 text-white"
                    : "border-stone-200 text-stone-600 hover:border-amber-300"
                }`}
              >
                <span className="mr-1.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          {form.type === "wedding" && (
            <p className="text-xs text-amber-700 mt-2">
              Wedding uses zone-based seating — guests are assigned to Bride&apos;s Side or Groom&apos;s Side tables.
            </p>
          )}
        </div>

        {/* Allocation */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Table Allocation</label>
          <div className="space-y-2">
            {allocOptions.map((o) => (
              <label
                key={o.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  form.allocation === o.value
                    ? "border-amber-400 bg-amber-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="allocation"
                  value={o.value}
                  checked={form.allocation === o.value}
                  onChange={() => set("allocation", o.value)}
                  className="accent-amber-600"
                />
                <span className="text-sm text-stone-700">{o.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/admin/dashboard"
            className="flex-1 py-3 text-center border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? "Creating…" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
