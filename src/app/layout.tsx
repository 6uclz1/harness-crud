import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harness CRUD",
  description: "ハーネスエンジニアリング検証用のタスク管理",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
