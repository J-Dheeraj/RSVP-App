export default function SuccessPage({
  searchParams,
}: {
  searchParams: { table?: string; name?: string; event?: string; venue?: string; date?: string };
}) {
  const { table, name, event, venue, date } = searchParams;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-SG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const formattedTime = date
    ? new Date(date).toLocaleTimeString("en-SG", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  return (
    <main className="min-h-screen bg-amber-50 flex flex-col">
      {/* Top banner */}
      <div className="bg-stone-900 text-white px-6 py-8 text-center">
        <p className="text-amber-400 text-xs font-semibold tracking-[0.2em] uppercase mb-2">
          Royal Taj
        </p>
        {event && (
          <h1 className="text-xl font-serif font-bold">{event}</h1>
        )}
        {formattedDate && (
          <p className="text-stone-400 text-sm mt-1">
            {formattedDate}
            {formattedTime ? ` · ${formattedTime}` : ""}
            {venue ? ` · ${venue}` : ""}
          </p>
        )}
      </div>

      {/* Confirmation card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 text-center">
            {/* Checkmark */}
            <div className="w-14 h-14 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-xl font-serif font-bold text-stone-800 mb-1">
              Attendance Confirmed
            </h2>

            {name && (
              <p className="text-stone-500 text-sm mb-6">
                Thank you, <span className="font-medium text-stone-700">{name}</span>. We look
                forward to welcoming you.
              </p>
            )}

            {/* Table assignment */}
            {table ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                  Your Table
                </p>
                <p className="text-2xl font-bold text-stone-800">{table}</p>
                <p className="text-stone-500 text-xs mt-1">
                  Please mention this at the welcome desk on arrival.
                </p>
              </div>
            ) : (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-5 text-left">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  Table
                </p>
                <p className="text-stone-600 text-sm">
                  Your seat will be confirmed closer to the event. The organiser will be in touch.
                </p>
              </div>
            )}

            <p className="text-stone-400 text-xs">
              For any changes, please contact the event organiser directly.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
