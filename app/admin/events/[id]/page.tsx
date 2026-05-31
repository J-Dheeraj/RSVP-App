import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EventDetailClient from "@/components/EventDetailClient";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      venue: true,
      zones: { orderBy: { label: "asc" } },
      tables: {
        include: {
          zone: true,
          rsvps: true,
        },
        orderBy: { number: "asc" },
      },
      rsvps: {
        include: { table: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) notFound();
  return <EventDetailClient event={event} />;
}
