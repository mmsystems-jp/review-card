import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getClientIp, checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited", remaining: 0 }, { status: 429 });
  }

  let body: { text?: string } = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length < 20) {
    return NextResponse.json({ error: "text_too_short" }, { status: 400 });
  }

  const truncated = text.slice(0, 2000);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: `あなたは文章を分析して要約するアシスタントです。
与えられたテキストをもとに、以下の JSON 形式のみで出力してください。
前後に文字を加えないこと。コードブロック不要。

{
  "name": "タイトルまたは主題（20字以内）",
  "headline": "20字以内のキャッチコピー",
  "goodPoints": ["ポイント1（30字以内）", "ポイント2（30字以内）", "ポイント3（30字以内）"],
  "badPoints": ["課題点1（30字以内）", "課題点2（30字以内）"],
  "overall": "総評（100字以内）",
  "sentiment": "positive または mixed または negative"
}`,
    messages: [{ role: "user", content: truncated }],
  });

  const responseText = message.content.find((b) => b.type === "text")?.text ?? "{}";
  let parsed: {
    name?: string;
    headline?: string;
    goodPoints?: string[];
    badPoints?: string[];
    overall?: string;
    sentiment?: string;
  } = {};

  try {
    const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // fallback to empty
  }

  const cardId = crypto.randomUUID().slice(0, 8);

  return NextResponse.json({
    name: parsed.name ?? "テキスト要約",
    headline: parsed.headline ?? "",
    goodPoints: Array.isArray(parsed.goodPoints) ? parsed.goodPoints : [],
    badPoints: Array.isArray(parsed.badPoints) ? parsed.badPoints : [],
    overall: parsed.overall ?? "",
    sentiment: parsed.sentiment ?? "mixed",
    rating: null,
    totalReviews: null,
    googleMapsUri: "",
    cardId,
    remaining: rl.remaining,
  });
}
