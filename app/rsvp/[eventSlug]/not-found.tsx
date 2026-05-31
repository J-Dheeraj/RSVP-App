export default function RSVPNotFound() {
  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-amber-600 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
          Royal Taj
        </p>
        <h1 className="text-2xl font-serif font-bold text-stone-800 mb-2">Event Not Found</h1>
        <p className="text-stone-500 text-sm max-w-xs">
          This invitation link may be expired or incorrect. Please check your invitation and try
          again, or contact the event organiser.
        </p>
      </div>
    </main>
  );
}
