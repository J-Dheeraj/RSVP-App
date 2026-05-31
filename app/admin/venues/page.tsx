"use client";

import { useState, useEffect } from "react";

type Venue = {
  id: string;
  name: string;
  address: string | null;
  city: string;
  description: string | null;
  isActive: boolean;
  _count: { events: number };
};

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [form, setForm] = useState({ name: "", address: "", city: "Singapore", description: "" });
  const [adding, setAdding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function load() {
    const res = await fetch("/api/admin/venues");
    if (res.ok) setVenues(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setErrors({});
    const res = await fetch("/api/admin/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors(typeof data.error === "object" ? data.error : { _root: [data.error] });
    } else {
      setForm({ name: "", address: "", city: "Singapore", description: "" });
      await load();
    }
    setAdding(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/venues/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    else await load();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Venues</h1>
        <p className="text-stone-500 text-sm mt-0.5">Manage Royal Taj locations</p>
      </div>

      {/* Venue list */}
      <div className="space-y-3 mb-8">
        {venues.length === 0 && (
          <p className="text-stone-400 text-sm py-8 text-center">No venues yet — add one below.</p>
        )}
        {venues.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-stone-800">{v.name}</p>
              {v.address && (
                <p className="text-stone-500 text-sm">{v.address}, {v.city}</p>
              )}
              {v.description && (
                <p className="text-stone-400 text-sm mt-0.5">{v.description}</p>
              )}
              <p className="text-stone-400 text-xs mt-1">{v._count.events} event{v._count.events !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => handleDelete(v.id, v.name)}
              disabled={v._count.events > 0}
              title={v._count.events > 0 ? "Cannot delete: venue has events" : "Delete venue"}
              className="text-stone-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm shrink-0"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Add venue form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-4">Add Venue</h2>
        {errors._root && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {errors._root[0]}
          </div>
        )}
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Venue Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Royal Taj Sentosa"
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.name ? "border-red-400" : "border-stone-200"} focus:outline-none focus:ring-2 focus:ring-amber-300`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Sentosa Island"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">City</label>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional note about this venue"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
          >
            {adding ? "Adding…" : "Add Venue"}
          </button>
        </form>
      </div>
    </div>
  );
}
