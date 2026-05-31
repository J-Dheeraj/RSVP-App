"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin/dashboard", label: "Events",   match: ["/admin/dashboard", "/admin/events"] },
  { href: "/admin/venues",    label: "Venues",   match: ["/admin/venues"] },
  { href: "/admin/settings",  label: "Settings", match: ["/admin/settings"] },
];

export default function AdminNav() {
  const path = usePathname();

  return (
    <nav className="bg-white border-b border-stone-200 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" className="font-bold text-amber-700 text-lg tracking-tight">
            Royal Taj
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                l.match.some((m) => path.startsWith(m))
                  ? "text-amber-700"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
