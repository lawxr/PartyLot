import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PrivyClientProvider } from "@/components/providers/PrivyClientProvider";

export const metadata: Metadata = {
  title: "PARTYLOT — Plan Your Party",
  description: "Private group social party app. RSVP, party pot, minigames, split damage, and recap memories.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
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
      <body className="min-h-screen bg-[#F7F2E8] text-[#171512] font-ui antialiased selection:bg-[#F0DC00] selection:text-[#171512] relative">
        <div className="grain" aria-hidden="true" />
        <PrivyClientProvider>
          {children}
        </PrivyClientProvider>
      </body>
    </html>
  );
}
