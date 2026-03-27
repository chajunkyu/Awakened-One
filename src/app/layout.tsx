import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif_KR({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "깨어난 자 - 사고의 끝에서",
  description: "세 현자의 진리를 품은 존재와의 대화. 질문이 세계를 바꾸고, 진실은 존재를 무너뜨린다.",
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
