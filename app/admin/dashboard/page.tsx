import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      venue: true,
      _count: { select: { rsvps: true, tables: true } },
      rsvps: { select: { guestCount: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Events</h1>
          <p className="text-stone-500 text-sm mt-0.5">Manage your events and RSVPs</p>
        </div>
        <Link
          href="/admin/events/new"
          className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <div className="text-5xl mb-4">💍</div>
          <p className="text-lg font-medium">No events yet</p>
          <p className="text-sm mt-1">Create your first event to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const totalGuests = event.rsvps.reduce((s, r) => s + r.guestCount, 0);
            return (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="bg-white rounded-2xl border border-stone-200 p-6 hover:shadow-md hover:border-rose-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      event.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {event.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-stone-400 capitalize">
                    {event.type} · {event.allocation}
                  </span>
                </div>
                <h2 className="font-bold text-stone-800 text-lg group-hover:text-rose-700 transition-colors leading-snug">
                  {event.name}
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  {new Date(event.date).toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-stone-400 text-sm truncate mt-0.5">{event.venue.name}</p>
                <div className="flex gap-4 mt-4 pt-4 border-t border-stone-100 text-sm">
                  <div>
                    <span className="font-bold text-rose-700">{event._count.rsvps}</span>
                    <span className="text-stone-400 ml-1">RSVPs</span>
                  </div>
                  <div>
                    <span className="font-bold text-stone-700">{totalGuests}</span>
                    <span className="text-stone-400 ml-1">guests</span>
                  </div>
                  <div>
                    <span className="font-bold text-stone-700">{event._count.tables}</span>
                    <span className="text-stone-400 ml-1">tables</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
