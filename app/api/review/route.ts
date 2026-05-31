import { NextRequest, NextResponse } from "next/server";
import { searchPlace } from "@/lib/places";
import { summarizeReviews } from "@/lib/summarize";
import { getClientIp, checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited", remaining: 0 }, { status: 429 });
  }

  let body: { query?: string } = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query || query.length < 2) {
    return NextResponse.json({ error: "query_too_short" }, { status: 400 });
  }

  const place = await searchPlace(query);
  if (!place) {
    return NextResponse.json({ error: "place_not_found" }, { status: 404 });
  }
  if (place.reviews.length === 0) {
    return NextResponse.json({ error: "no_reviews" }, { status: 404 });
  }

  const summary = await summarizeReviews(place);
  const cardId = crypto.randomUUID().slice(0, 8);

  return NextResponse.json({
    ...place,
    ...summary,
    cardId,
    remaining: rl.remaining,
  });
}
