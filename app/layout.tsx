import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "口コミ要約カード | IndieJP",
  description: "Google マップの口コミを AI で要約して X にシェア。店名を入力するだけで瞬時に要約カードを生成。",
  openGraph: {
    title: "口コミ要約カード | IndieJP",
    description: "Google マップの口コミを AI で要約して X にシェア",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
