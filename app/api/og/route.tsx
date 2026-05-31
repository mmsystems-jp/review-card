import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const C = {
  ink: "#2a2118",
  inkSoft: "#4a3f30",
  inkFaint: "#8a7c66",
  paper: "#f7f0e0",
  paperBright: "#fffaef",
  creamDeep: "#efe4cc",
  vermilion: "#d4502a",
  rule: "#cdbb95",
  green: "#3a6b3a",
  navy: "#2a3a5c",
};

async function loadGoogleFont(
  family: string,
  weight: number,
  text: string
): Promise<ArrayBuffer | null> {
  try {
    const url =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}` +
      `&text=${encodeURIComponent(text)}`;
    const cssRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40 Safari/537.36",
      },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const m = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/);
    if (!m) return null;
    const fontRes = await fetch(m[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const name = sp.get("n") ?? "店舗名";
  const headline = sp.get("h") ?? "";
  const rating = sp.get("r") ?? "";
  const g1 = sp.get("g1") ?? "";
  const g2 = sp.get("g2") ?? "";
  const g3 = sp.get("g3") ?? "";
  const sentiment = sp.get("s") ?? "mixed";

  const accent =
    sentiment === "positive" ? C.green :
    sentiment === "negative" ? C.vermilion :
    C.navy;

  const allText =
    name + headline + g1 + g2 + g3 +
    "口コミ要約カード良い点review-card.vercel.app★" + rating +
    "IndieJP012345689.";

  const fonts: { name: string; data: ArrayBuffer; weight: 700; style: "normal" }[] = [];
  const zen = await loadGoogleFont("Zen Maru Gothic", 700, allText);
  if (zen) fonts.push({ name: "Zen Maru Gothic", data: zen, weight: 700, style: "normal" });

  const goodPoints = [g1, g2, g3].filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          background: C.paper,
          padding: "40px",
          fontFamily: "Zen Maru Gothic",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "40px",
            right: "40px",
            bottom: "40px",
            display: "flex",
            flexDirection: "column",
            background: C.paperBright,
            border: `4px solid ${C.ink}`,
            borderRadius: "24px",
            boxShadow: `14px 14px 0 ${accent}`,
            padding: "44px 56px",
          }}
        >
          {/* header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: "16px",
              color: C.inkFaint,
              letterSpacing: "0.12em",
            }}
          >
            <span>口コミ要約カード</span>
            <span style={{ color: C.vermilion }}>IndieJP</span>
          </div>

          <div
            style={{
              marginTop: "6px",
              paddingBottom: "14px",
              borderBottom: `2px dashed ${C.rule}`,
              display: "flex",
              alignItems: "baseline",
              gap: "16px",
            }}
          >
            <span style={{ fontSize: "36px", fontWeight: 700, color: C.ink }}>
              {name}
            </span>
            {rating && (
              <span style={{ fontSize: "24px", color: C.vermilion, fontWeight: 700 }}>
                ★{rating}
              </span>
            )}
          </div>

          {/* headline */}
          {headline && (
            <div
              style={{
                display: "flex",
                marginTop: "20px",
                fontSize: "32px",
                fontWeight: 700,
                color: accent,
                lineHeight: 1.4,
              }}
            >
              「{headline}」
            </div>
          )}

          {/* good points */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "20px",
              flex: 1,
            }}
          >
            {goodPoints.map((pt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "22px",
                  color: C.inkSoft,
                }}
              >
                <span style={{ color: C.green, fontWeight: 700, fontSize: "24px" }}>✓</span>
                <span>{pt}</span>
              </div>
            ))}
          </div>

          {/* footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              borderTop: `2px dashed ${C.rule}`,
              paddingTop: "16px",
              fontSize: "18px",
              color: C.inkFaint,
            }}
          >
            口コミ要約カード | review-card.vercel.app
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: fonts.length ? fonts : undefined }
  );
}
