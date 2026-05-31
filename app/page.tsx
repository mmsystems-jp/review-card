"use client";

import { useState } from "react";

const C = {
  paper: "#f7f0e0",
  paperBright: "#fffaef",
  ink: "#2a2118",
  inkSoft: "#4a3f30",
  inkFaint: "#8a7c66",
  vermilion: "#d4502a",
  rule: "#cdbb95",
  green: "#3a6b3a",
  navy: "#2a3a5c",
  cream: "#efe4cc",
};

type Tab = "shop" | "text";

interface ReviewResult {
  name: string;
  rating: number | null;
  totalReviews: number | null;
  googleMapsUri: string;
  headline: string;
  goodPoints: string[];
  badPoints: string[];
  overall: string;
  sentiment: "positive" | "mixed" | "negative";
  cardId: string;
  remaining: number;
}

function errorMessage(code: string, status: number): string {
  if (status === 429) return "本日の利用回数（5回）に達しました。明日また試してください。";
  if (code === "place_not_found") return "店舗が見つかりませんでした。店名を確認して再試行してください。";
  if (code === "no_reviews") return "口コミが見つかりませんでした。";
  if (code === "query_too_short" || code === "text_too_short") return "もう少し長く入力してください。";
  return "エラーが発生しました。再度お試しください。";
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("shop");
  const [shopQuery, setShopQuery] = useState("");
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function callApi(endpoint: string, body: Record<string, string>) {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(errorMessage(data.error ?? "", res.status));
        if (typeof data.remaining === "number") setRemaining(data.remaining);
      } else {
        setResult(data as ReviewResult);
        setRemaining(data.remaining);
      }
    } catch {
      setError("通信エラーが発生しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  function handleShopSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopQuery.trim()) return;
    callApi("/api/review", { query: shopQuery.trim() });
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!freeText.trim()) return;
    callApi("/api/summarize-text", { text: freeText.trim() });
  }

  function switchTab(t: Tab) {
    setTab(t);
    setResult(null);
    setError(null);
  }

  function buildOgUrl(r: ReviewResult): string {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      n: r.name,
      h: r.headline,
      r: String(r.rating ?? ""),
      g1: r.goodPoints[0] ?? "",
      g2: r.goodPoints[1] ?? "",
      g3: r.goodPoints[2] ?? "",
      s: r.sentiment,
    });
    return `${base}/api/og?${params.toString()}`;
  }

  function buildShareUrl(r: ReviewResult): string {
    const ogUrl = buildOgUrl(r);
    const tweet =
      `「${r.name}」${r.headline ? `\n${r.headline}` : ""}\n\n口コミ要約カード by @IndieJptools`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(ogUrl)}`;
  }

  const accent = result
    ? result.sentiment === "positive" ? C.green
      : result.sentiment === "negative" ? C.vermilion
      : C.navy
    : C.vermilion;

  return (
    <main style={{ background: C.paper, minHeight: "100vh", padding: "32px 16px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: C.ink, letterSpacing: "0.06em", margin: 0 }}>
            口コミ要約カード
          </h1>
          <p style={{ marginTop: "8px", fontSize: "14px", color: C.inkFaint, lineHeight: 1.6 }}>
            Google マップの口コミを AI で要約して X にシェア
          </p>
          <p style={{ marginTop: "4px", fontSize: "12px", color: C.inkFaint }}>
            by <span style={{ color: C.vermilion, fontWeight: 700 }}>IndieJP</span>
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `2px solid ${C.rule}`, marginBottom: "24px" }}>
          {(["shop", "text"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? C.ink : C.inkFaint,
                background: "none",
                border: "none",
                borderBottom: tab === t ? `3px solid ${C.vermilion}` : "3px solid transparent",
                marginBottom: "-2px",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
            >
              {t === "shop" ? "🏪 お店を要約" : "📄 文章を要約"}
            </button>
          ))}
        </div>

        {/* Shop search form */}
        {tab === "shop" && (
          <form onSubmit={handleShopSubmit} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              type="text"
              value={shopQuery}
              onChange={(e) => setShopQuery(e.target.value)}
              placeholder="例: 渋谷 ラーメン二郎"
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 14px",
                fontSize: "16px",
                border: `2px solid ${C.rule}`,
                borderRadius: "8px",
                background: C.paperBright,
                color: C.ink,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 18px",
                fontSize: "15px",
                fontWeight: 700,
                color: "#fff",
                background: loading ? C.inkFaint : C.vermilion,
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "default" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "解析中…" : "要約する"}
            </button>
          </form>
        )}

        {/* Free text form */}
        {tab === "text" && (
          <form onSubmit={handleTextSubmit} style={{ marginBottom: "8px" }}>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="口コミや記事の文章を貼り付けてください（20〜2000字）"
              rows={8}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                border: `2px solid ${C.rule}`,
                borderRadius: "8px",
                background: C.paperBright,
                color: C.ink,
                outline: "none",
                resize: "vertical",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "8px",
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: 700,
                color: "#fff",
                background: loading ? C.inkFaint : C.vermilion,
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "default" : "pointer",
              }}
            >
              {loading ? "解析中…" : "要約する"}
            </button>
          </form>
        )}

        {/* Remaining count */}
        {remaining !== null && (
          <div style={{ fontSize: "12px", color: C.inkFaint, marginBottom: "20px" }}>
            本日の残り回数:{" "}
            <span style={{ fontWeight: 700, color: remaining > 0 ? C.inkSoft : C.vermilion }}>
              {remaining}
            </span>{" "}
            / 5
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.inkFaint, fontSize: "14px" }}>
            口コミを取得して要約しています…
          </div>
        )}

        {/* Error message */}
        {error && !loading && (
          <div style={{
            padding: "14px 16px",
            background: "#fff0ed",
            border: `1px solid ${C.vermilion}`,
            borderRadius: "8px",
            color: C.vermilion,
            fontSize: "14px",
            marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        {/* Result card */}
        {result && !loading && (
          <div style={{
            background: C.paperBright,
            border: `3px solid ${C.ink}`,
            borderRadius: "16px",
            boxShadow: `8px 8px 0 ${accent}`,
            padding: "28px 24px",
            marginBottom: "24px",
          }}>
            {/* Name + rating */}
            <div style={{ borderBottom: `2px dashed ${C.rule}`, paddingBottom: "14px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.ink, margin: 0 }}>
                  {result.name}
                </h2>
                {result.rating != null && (
                  <span style={{ fontSize: "17px", color: C.vermilion, fontWeight: 700 }}>
                    ★{result.rating.toFixed(1)}
                  </span>
                )}
                {result.totalReviews != null && (
                  <span style={{ fontSize: "12px", color: C.inkFaint }}>
                    （{result.totalReviews}件）
                  </span>
                )}
              </div>
            </div>

            {/* Headline */}
            {result.headline && (
              <div style={{ fontSize: "17px", fontWeight: 700, color: accent, marginBottom: "18px", lineHeight: 1.5 }}>
                「{result.headline}」
              </div>
            )}

            {/* Good points */}
            {result.goodPoints.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", color: C.inkFaint, letterSpacing: "0.12em", marginBottom: "8px" }}>
                  良い点
                </div>
                {result.goodPoints.map((pt, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px" }}>
                    <span style={{ color: C.green, fontWeight: 700, flexShrink: 0, lineHeight: 1.5 }}>✓</span>
                    <span style={{ fontSize: "14px", color: C.inkSoft, lineHeight: 1.5 }}>{pt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bad points */}
            {result.badPoints.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", color: C.inkFaint, letterSpacing: "0.12em", marginBottom: "8px" }}>
                  気になる点
                </div>
                {result.badPoints.map((pt, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px" }}>
                    <span style={{ color: C.vermilion, fontWeight: 700, flexShrink: 0, lineHeight: 1.5 }}>△</span>
                    <span style={{ fontSize: "14px", color: C.inkSoft, lineHeight: 1.5 }}>{pt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Overall */}
            {result.overall && (
              <div style={{
                borderTop: `2px dashed ${C.rule}`,
                paddingTop: "14px",
                fontSize: "14px",
                color: C.inkSoft,
                lineHeight: 1.7,
                marginBottom: "20px",
              }}>
                {result.overall}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <a
                href={buildShareUrl(result)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  background: "#000",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                𝕏 でシェア
              </a>
              {result.googleMapsUri && (
                <a
                  href={result.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "10px 18px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: C.ink,
                    background: C.cream,
                    border: `2px solid ${C.rule}`,
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  Google マップで見る
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: "12px", color: C.inkFaint, paddingTop: "16px", borderTop: `1px solid ${C.rule}` }}>
          口コミ要約カード — powered by Claude & Google Maps
        </div>
      </div>
    </main>
  );
}
