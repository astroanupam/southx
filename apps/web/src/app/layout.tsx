import type { Metadata, Viewport } from "next";
import { Providers } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstroSutras",
  description: "Professional Vedic astrology research platform",
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
