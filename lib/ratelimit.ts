import { Redis } from "@upstash/redis";

const url =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

const redis = url && token ? new Redis({ url, token }) : null;

export const DAILY_FREE_LIMIT = 5;

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

function jstDayKey(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  configured: boolean;
}

export async function checkRateLimit(ip: string): Promise<RateResult> {
  const limit = DAILY_FREE_LIMIT;
  if (!redis) {
    return { allowed: true, remaining: limit, limit, configured: false };
  }
  try {
    const key = `rc:rl:${ip}:${jstDayKey()}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60 * 60 * 48);
    }
    const remaining = Math.max(0, limit - count);
    return { allowed: count <= limit, remaining, limit, configured: true };
  } catch (e) {
    console.error(
      "ratelimit: redis error, failing open:",
      e instanceof Error ? e.message : e
    );
    return { allowed: true, remaining: limit, limit, configured: false };
  }
}
