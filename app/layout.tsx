import React from "react"
import type { Metadata, Viewport } from "next";
import { Prompt, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Comic Storage API - แผงควบคุม",
  description:
    "ระบบจัดเก็บและจัดการคอมมิค/มังงะ พร้อม API สำหรับเชื่อมต่อ",
};

export const viewport: Viewport = {
  themeColor: "#0f0f11",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${prompt.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Toaster theme="dark" richColors />
      </body>
    </html>
  );
}
