import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PrivyClientProvider } from "@/components/providers/PrivyClientProvider";

export const metadata: Metadata = {
  title: "PARTYLOT — Plan Your Party",
  description: "Private group social party app. RSVP, party pot, minigames, split damage, and recap memories.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
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
  themeColor: "#15140f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark bg-[#15140f] text-[#FCFAF7]">
      <body className="min-h-screen bg-[#15140f] text-[#FCFAF7] font-ui antialiased selection:bg-[#F0DC00] selection:text-[#0C0B0A] relative">
        <div className="grain" aria-hidden="true" />
        <PrivyClientProvider>
          {children}
        </PrivyClientProvider>
      </body>
    </html>
  );
}
