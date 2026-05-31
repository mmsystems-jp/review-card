import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "レビューホンネ | IndieJP",
  description: "お店の口コミをAIが読んで本音を1枚のカードにまとめます。Google マップの URL か店名を入力するだけ。",
  openGraph: {
    title: "レビューホンネ | IndieJP",
    description: "お店の口コミをAIが読んで本音を1枚のカードにまとめます。",
    type: "website",
    images: ["https://reviewhonne.vercel.app/api/og?hero=1"],
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
