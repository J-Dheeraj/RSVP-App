"use client";

import { useState } from "react";
import Link from "next/link";
import QRCode from "./QRCode";

type Zone = { id: string; name: string; label: string; color: string };
type RSVP = {
  id: string;
  guestName: string;
  email: string | null;
  phone: string | null;
  guestCount: number;
  relationship: string | null;
  needsTransport: boolean;
  pickupLocation: string | null;
  dietaryNeeds: string | null;
  message: string | null;
  adminNotes: string | null;
  tableId: string | null;
  table: { id: string; label: string | null; number: number } | null;
  createdAt: string;
};
type Table = {
  id: string;
  number: number;
  label: string | null;
  capacity: number;
  zoneId: string | null;
  zone: Zone | null;
  rsvps: RSVP[];
};
type Venue = { id: string; name: string; address: string | null; city: string };
type Event = {
  id: string;
  name: string;
  slug: string;
  date: string;
  venue: Venue;
  description: string | null;
  type: string;
  allocation: string;
  maxPerTable: number;
  isActive: boolean;
  zones: Zone[];
  tables: Table[];
  rsvps: RSVP[];
};

const ZONE_DEFAULTS = [
  { name: "bride",  label: "Bride's Side",  color: "#ec4899" },
  { name: "groom",  label: "Groom's Side",  color: "#6366f1" },
  { name: "vip",    label: "VIP",           color: "#f59e0b" },
  { name: "other",  label: "Other Guests",  color: "#10b981" },
];

async function apiFetch(url: string, opts?: RequestInit): Promise<unknown> {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data;
}

export default function EventDetailClient({ event: initialEvent }: { event: Event }) {
  const [event, setEvent] = useState(initialEvent);
  const [tab, setTab] = useState<"rsvps" | "tables" | "qr">("rsvps");
  const [newTable, setNewTable] = useState({ number: "", label: "", capacity: "", zoneId: "" });
  const [addingTable, setAddingTable] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", label: "", color: "#6366f1" });
  const [mutError, setMutError] = useState<string | null>(null);

  const rsvpUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/rsvp/${event.slug}`
      : `/rsvp/${event.slug}`;

  const totalGuests = event.rsvps.reduce((s, r) => s + r.guestCount, 0);
  const needsTransport = event.rsvps.filter((r) => r.needsTransport).length;
  const unassigned = event.rsvps.filter((r) => !r.tableId).length;

  function seatsUsed(table: Table) {
    return table.rsvps.reduce((s, r) => s + r.guestCount, 0);
  }

  async function reload() {
    const data = await apiFetch(`/api/admin/events/${event.id}`);
    setEvent(data as Event);
  }

  async function run(action: () => Promise<void>) {
    setMutError(null);
    try {
      await action();
    } catch (e: unknown) {
      setMutError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function assignTable(rsvpId: string, tableId: string | null) {
    run(async () => {
      await apiFetch(`/api/admin/rsvps/${rsvpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId }),
      });
      await reload();
    });
  }

  async function deleteRsvp(rsvpId: string) {
    if (!confirm("Delete this RSVP?")) return;
    run(async () => {
      await apiFetch(`/api/admin/rsvps/${rsvpId}`, { method: "DELETE" });
      await reload();
    });
  }

  async function addTable() {
    if (!newTable.number || !newTable.capacity) return;
    setAddingTable(true);
    await run(async () => {
      await apiFetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          number: parseInt(newTable.number),
          label: newTable.label || undefined,
          capacity: parseInt(newTable.capacity),
          zoneId: newTable.zoneId || undefined,
        }),
      });
      setNewTable({ number: "", label: "", capacity: "", zoneId: "" });
      await reload();
    });
    setAddingTable(false);
  }

  async function deleteTable(tableId: string) {
    if (!confirm("Delete this table? RSVPs assigned to it will be unassigned.")) return;
    run(async () => {
      await apiFetch(`/api/admin/tables?id=${tableId}`, { method: "DELETE" });
      await reload();
    });
  }

  async function addZone() {
    if (!newZone.name || !newZone.label) return;
    run(async () => {
      await apiFetch("/api/admin/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, ...newZone }),
      });
      setNewZone({ name: "", label: "", color: "#6366f1" });
      await reload();
    });
  }

  async function addDefaultZones() {
    run(async () => {
      await Promise.all(
        ZONE_DEFAULTS.map((z) =>
          apiFetch("/api/admin/zones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId: event.id, ...z }),
          })
        )
      );
      await reload();
    });
  }

  async function toggleActive() {
    run(async () => {
      await apiFetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !event.isActive }),
      });
      await reload();
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-stone-400 hover:text-stone-600 text-sm">
              ← Events
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-stone-800">{event.name}</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {new Date(event.date).toLocaleDateString("en-SG", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {event.venue.name}{event.venue.address ? `, ${event.venue.address}` : ""}
          </p>
        </div>
        <button
          onClick={toggleActive}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
            event.isActive
              ? "bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700"
          }`}
        >
          {event.isActive ? "Active" : "Inactive"}
        </button>
      </div>

      {/* Error banner */}
      {mutError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          <span>{mutError}</span>
          <button onClick={() => setMutError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total RSVPs",    value: event.rsvps.length, color: "text-rose-700" },
          { label: "Total Guests",   value: totalGuests,        color: "text-stone-800" },
          { label: "Need Transport", value: needsTransport,     color: "text-amber-700" },
          {
            label: "Unassigned",
            value: unassigned,
            color: unassigned > 0 ? "text-red-600" : "text-green-600",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-stone-500 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit mb-6">
        {(["rsvps", "tables", "qr"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t ? "bg-white shadow-sm text-stone-800" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {t === "qr"
              ? "QR Code"
              : t === "rsvps"
              ? `RSVPs (${event.rsvps.length})`
              : `Tables (${event.tables.length})`}
          </button>
        ))}
      </div>

      {/* RSVPs Tab */}
      {tab === "rsvps" && (
        <div className="space-y-3">
          {event.rsvps.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <p className="text-4xl mb-3">📋</p>
              <p>No RSVPs yet. Share the QR code to get started!</p>
            </div>
          ) : (
            event.rsvps.map((rsvp) => (
              <div
                key={rsvp.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-stone-800">{rsvp.guestName}</p>
                    <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                      {rsvp.guestCount} {rsvp.guestCount === 1 ? "guest" : "guests"}
                    </span>
                    {rsvp.relationship && (
                      <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full capitalize">
                        {rsvp.relationship}
                      </span>
                    )}
                    {rsvp.needsTransport && (
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        🚌 Transport needed
                        {rsvp.pickupLocation ? ` · ${rsvp.pickupLocation}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="text-stone-500 text-sm mt-1 flex flex-wrap gap-3">
                    {rsvp.email && <span>{rsvp.email}</span>}
                    {rsvp.phone && <span>{rsvp.phone}</span>}
                    {rsvp.dietaryNeeds && <span>🍽 {rsvp.dietaryNeeds}</span>}
                  </div>
                  {rsvp.message && (
                    <p className="text-stone-400 text-sm italic mt-1">"{rsvp.message}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={rsvp.tableId ?? ""}
                    onChange={(e) => assignTable(rsvp.id, e.target.value || null)}
                    className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    <option value="">Unassigned</option>
                    {event.tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label ?? `Table ${t.number}`} ({seatsUsed(t)}/{t.capacity})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteRsvp(rsvp.id)}
                    className="text-stone-300 hover:text-red-500 transition-colors px-1"
                    title="Delete RSVP"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tables Tab */}
      {tab === "tables" && (
        <div className="space-y-6">
          {/* Zones (for wedding events) */}
          {event.type === "wedding" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-stone-700">Zones</h2>
                {event.zones.length === 0 && (
                  <button
                    onClick={addDefaultZones}
                    className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                  >
                    + Add default zones
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {event.zones.map((z) => (
                  <span
                    key={z.id}
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: z.color }}
                  >
                    {z.label}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="name (e.g. vip)"
                  value={newZone.name}
                  onChange={(e) =>
                    setNewZone((z) => ({
                      ...z,
                      name: e.target.value.toLowerCase().replace(/\s/g, "_"),
                    }))
                  }
                  className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
                <input
                  placeholder="label (e.g. VIP)"
                  value={newZone.label}
                  onChange={(e) => setNewZone((z) => ({ ...z, label: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
                <input
                  type="color"
                  value={newZone.color}
                  onChange={(e) => setNewZone((z) => ({ ...z, color: e.target.value }))}
                  className="w-10 h-9 rounded border border-stone-200 cursor-pointer"
                />
                <button
                  onClick={addZone}
                  className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
                >
                  Add Zone
                </button>
              </div>
            </div>
          )}

          {/* Tables list */}
          <div>
            <h2 className="font-semibold text-stone-700 mb-3">Tables</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
              {event.tables.map((table) => {
                const used = seatsUsed(table);
                const pct = Math.min(100, (used / table.capacity) * 100);
                return (
                  <div key={table.id} className="bg-white rounded-xl border border-stone-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-stone-800">
                          {table.label ?? `Table ${table.number}`}
                        </p>
                        {table.zone && (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full text-white mt-0.5 inline-block"
                            style={{ backgroundColor: table.zone.color }}
                          >
                            {table.zone.label}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTable(table.id)}
                        className="text-stone-300 hover:text-red-500 transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-stone-500 mb-1">
                        <span>{used} seated</span>
                        <span>{table.capacity - used} free</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-green-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {table.rsvps.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {table.rsvps.map((r) => (
                          <p key={r.id} className="text-xs text-stone-500 truncate">
                            · {r.guestName} ({r.guestCount})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add table */}
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-4">
              <p className="text-sm font-medium text-stone-700 mb-3">Add Table</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="number"
                  placeholder="Number"
                  value={newTable.number}
                  onChange={(e) => setNewTable((t) => ({ ...t, number: e.target.value }))}
                  className="w-24 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
                <input
                  placeholder="Label (optional)"
                  value={newTable.label}
                  onChange={(e) => setNewTable((t) => ({ ...t, label: e.target.value }))}
                  className="flex-1 min-w-32 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
                <input
                  type="number"
                  placeholder="Capacity"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable((t) => ({ ...t, capacity: e.target.value }))}
                  className="w-24 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
                {event.zones.length > 0 && (
                  <select
                    value={newTable.zoneId}
                    onChange={(e) => setNewTable((t) => ({ ...t, zoneId: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                  >
                    <option value="">No zone</option>
                    {event.zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.label}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={addTable}
                  disabled={addingTable}
                  className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 disabled:opacity-60 transition-colors"
                >
                  {addingTable ? "Adding…" : "Add Table"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Tab */}
      {tab === "qr" && (
        <div className="max-w-sm mx-auto">
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <p className="text-stone-500 text-sm mb-4">Scan to RSVP</p>
            <QRCode url={rsvpUrl} />
            <p className="text-stone-400 text-xs mt-4 break-all">{rsvpUrl}</p>
            <a
              href={rsvpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-rose-600 hover:underline"
            >
              Open RSVP page ↗
            </a>
            <p className="text-stone-400 text-xs mt-6">
              Right-click the QR code to save as image, then print on your invitation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
