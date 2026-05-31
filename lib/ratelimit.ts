/**
 * Unified rate limiter.
 *
 * Production: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in your
 * environment. Rate limit state is stored in Redis and survives serverless
 * cold starts and multiple instances.
 *
 * Development / no Redis: falls back to an in-memory Map. Limits reset on
 * process restart and are not shared across instances.
 *
 * Get free Redis at: https://upstash.com
 */

type RateLimitResult = {
  success: boolean;
  retryAfterSeconds?: number;
};

// ── Upstash path ─────────────────────────────────────────────────────────────

function makeUpstashLimiters() {
  // Dynamic imports so the module doesn't error when the packages are missing
  // and Upstash env vars are not set (local dev without Redis).
  const { Ratelimit } = require("@upstash/ratelimit");
  const { Redis } = require("@upstash/redis");
  const redis = Redis.fromEnv();

  const rsvp = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "rl:rsvp",
  });

  const login = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    prefix: "rl:login",
  });

  return { rsvp, login };
}

// ── In-memory fallback ────────────────────────────────────────────────────────

type MemEntry = { count: number; resetAt: number };
const memStore = new Map<string, MemEntry>();

function memCheck(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memStore.get(key);

  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }
  if (entry.count >= max) {
    return {
      success: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  entry.count++;
  return { success: true };
}

// ── Public API ────────────────────────────────────────────────────────────────

const useUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let upstash: ReturnType<typeof makeUpstashLimiters> | null = null;
if (useUpstash) {
  try {
    upstash = makeUpstashLimiters();
  } catch {
    console.warn("[ratelimit] Failed to initialise Upstash — falling back to in-memory.");
  }
}

export async function checkRsvpRateLimit(ip: string): Promise<RateLimitResult> {
  if (upstash) {
    const { success, reset } = await upstash.rsvp.limit(ip);
    return { success, retryAfterSeconds: success ? undefined : Math.ceil((reset - Date.now()) / 1000) };
  }
  return memCheck(`rsvp:${ip}`, 5, 10 * 60 * 1000);
}

export async function checkLoginRateLimit(email: string): Promise<RateLimitResult> {
  if (upstash) {
    const { success, reset } = await upstash.login.limit(email.toLowerCase());
    return { success, retryAfterSeconds: success ? undefined : Math.ceil((reset - Date.now()) / 1000) };
  }
  return memCheck(`login:${email.toLowerCase()}`, 10, 15 * 60 * 1000);
}

export async function resetLoginRateLimit(email: string): Promise<void> {
  if (upstash) {
    // Upstash sliding window doesn't support explicit reset; it expires naturally.
    // For immediate unlock, delete the key via the Redis client if needed.
    return;
  }
  memStore.delete(`login:${email.toLowerCase()}`);
}
