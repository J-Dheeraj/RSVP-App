import Link from "next/link";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { table?: string; name?: string; event?: string };
}) {
  const { table, name, event } = searchParams;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-rose-100">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-serif font-bold text-rose-800 mb-2">
            You&apos;re on the list!
          </h1>
          {name && (
            <p className="text-stone-600 text-lg mb-6">
              Thank you, <strong>{name}</strong>. We can&apos;t wait to celebrate with you!
            </p>
          )}

          {event && (
            <div className="bg-rose-50 rounded-2xl p-4 mb-4 text-left space-y-1">
              <p className="text-sm text-stone-500 font-medium">Event</p>
              <p className="font-semibold text-rose-800">{event}</p>
            </div>
          )}

          {table ? (
            <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm text-stone-500 font-medium mb-1">Your Table</p>
              <p className="text-2xl font-bold text-gold-700">{table}</p>
              <p className="text-stone-500 text-sm mt-1">
                Please look for this table at the venue.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm text-amber-700 font-medium">Table assignment pending</p>
              <p className="text-stone-500 text-sm mt-1">
                The organisers will assign your table and let you know before the event.
              </p>
            </div>
          )}

          <p className="text-stone-400 text-sm">
            Questions? Contact the event organiser.
          </p>
        </div>
      </div>
    </main>
  );
}
