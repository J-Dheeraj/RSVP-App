/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";

// Next.js App Router requires 'unsafe-inline' for style and 'unsafe-eval' for
// dev HMR. In production 'unsafe-eval' is removed. A nonce-based CSP would
// remove 'unsafe-inline' from script-src but requires middleware — implement
// before adding third-party scripts.
const cspDirectives = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Prevent browsers from inferring a different MIME type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block the page from being embedded in an iframe (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Force HTTPS for 2 years, include subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Don't send full URL as referrer to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by this app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Content Security Policy
  { key: "Content-Security-Policy", value: cspDirectives },
];

const nextConfig = {
  experimental: {
    // Add your production domain here before deploying, e.g.:
    // serverActions: { allowedOrigins: ["localhost:3000", "rsvp.royaltaj.sg"] },
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
