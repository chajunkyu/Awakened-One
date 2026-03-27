import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif_KR({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "자정의 도서관 - 인터랙티브 웹소설",
  description: "당신의 선택이 이야기를 만듭니다. 자정의 도서관에서 펼쳐지는 미스터리한 이야기.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSerif.variable} h-full`}>
      <body className="min-h-full flex flex-col font-[var(--font-noto-serif)]">
        {children}
      </body>
    </html>
  );
}
