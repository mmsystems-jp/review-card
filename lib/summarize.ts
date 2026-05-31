import Anthropic from "@anthropic-ai/sdk";
import type { PlaceResult } from "./places";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

export interface SummaryResult {
  headline: string;
  goodPoints: string[];
  badPoints: string[];
  overall: string;
  sentiment: "positive" | "mixed" | "negative";
}

export async function summarizeReviews(place: PlaceResult): Promise<SummaryResult> {
  const reviewsText = place.reviews
    .map((r, i) => `[口コミ${i + 1}] ★${r.rating} ${r.relativeTime}\n${r.text}`)
    .join("\n\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: `あなたは口コミを分析して要約するアシスタントです。
与えられた口コミをもとに、以下の JSON 形式のみで出力してください。
前後に文字を加えないこと。コードブロック不要。

{
  "headline": "20字以内のキャッチコピー（店を一言で表す）",
  "goodPoints": ["良い点1（30字以内）", "良い点2（30字以内）", "良い点3（30字以内）"],
  "badPoints": ["気になる点1（30字以内）", "気になる点2（30字以内）"],
  "overall": "総評（100字以内）",
  "sentiment": "positive または mixed または negative"
}`,
    messages: [{
      role: "user",
      content: `店名: ${place.name}\n評価: ★${place.rating}（${place.totalReviews}件）\n\n${reviewsText}`,
    }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "{}";
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as SummaryResult;
  } catch {
    return {
      headline: place.name,
      goodPoints: ["口コミを確認しました", "詳細はGoogleマップで", "ご確認ください"],
      badPoints: ["要約に失敗しました", "再度お試しください"],
      overall: "口コミの要約に失敗しました。",
      sentiment: "mixed",
    };
  }
}
