import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Royal Taj — RSVP",
  description: "RSVP for Royal Taj events",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
