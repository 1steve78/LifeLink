import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

type RateLimitOptions = { limit: number; windowSeconds: number };

/** Persistent per-user and per-IP rate limit; only SHA-256 keys are stored. */
export async function consumeRateLimit(
  request: Request,
  userId: string,
  action: string,
  options: RateLimitOptions,
) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || `user-${userId}`;
  const hashes = [
    createHash("sha256").update(`${action}:user:${userId}`).digest("hex"),
    createHash("sha256").update(`${action}:ip:${ip}`).digest("hex"),
  ];

  const results = await Promise.all(hashes.map(async (keyHash) => {
    const result = await db.execute(sql`
      insert into public.rate_limit_buckets (key_hash, window_started_at, request_count, expires_at)
      values (${keyHash}, now(), 1, now() + make_interval(secs => ${options.windowSeconds}))
      on conflict (key_hash) do update set
        request_count = case when rate_limit_buckets.expires_at <= now() then 1 else rate_limit_buckets.request_count + 1 end,
        window_started_at = case when rate_limit_buckets.expires_at <= now() then now() else rate_limit_buckets.window_started_at end,
        expires_at = case when rate_limit_buckets.expires_at <= now() then now() + make_interval(secs => ${options.windowSeconds}) else rate_limit_buckets.expires_at end
      returning request_count
    `);
    const [row] = Array.from(result as unknown as { request_count: number }[]);
    return Number(row?.request_count ?? options.limit + 1) <= options.limit;
  }));

  return {
    allowed: results.every(Boolean),
    retryAfter: options.windowSeconds,
  };
}
