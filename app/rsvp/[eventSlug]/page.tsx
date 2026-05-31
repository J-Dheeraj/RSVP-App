import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RSVPForm from "@/components/RSVPForm";

export async function generateMetadata({ params }: { params: { eventSlug: string } }) {
  const event = await prisma.event.findUnique({
    where: { slug: params.eventSlug, isActive: true },
    select: { name: true },
  });
  return { title: event ? `RSVP — ${event.name} | Royal Taj` : "RSVP | Royal Taj" };
}

export default async function RSVPPage({ params }: { params: { eventSlug: string } }) {
  const event = await prisma.event.findUnique({
    where: { slug: params.eventSlug, isActive: true },
    select: {
      name: true,
      slug: true,
      date: true,
      description: true,
      venue: { select: { name: true, address: true, city: true } },
    },
  });

  if (!event) notFound();

  return (
    <RSVPForm
      event={{
        ...event,
        date: event.date.toISOString(),
      }}
    />
  );
}
