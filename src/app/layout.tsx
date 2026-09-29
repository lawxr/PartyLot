import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PrivyClientProvider } from "@/components/providers/PrivyClientProvider";
import { CookieConsentBanner } from "@/components/ui/CookieConsentBanner";

export const metadata: Metadata = {
  title: "PARTYLOT — Plan Your Party",
  description: "Private group social party app. RSVP, party pot, minigames, split damage, and recap memories.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    // iOS ignores SVG touch icons; serve a PNG.
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PARTYLOT",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F7F2E8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-[#F7F2E8] text-[#171512]">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-screen bg-[#F7F2E8] text-[#171512] font-ui antialiased selection:bg-[#F0DC00] selection:text-[#171512] relative">
        <div className="grain" aria-hidden="true" />
        <PrivyClientProvider>
          {children}
          <CookieConsentBanner />
        </PrivyClientProvider>
      </body>
    </html>
  );
}
