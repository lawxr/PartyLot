import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PARTYLOT — The Night Belongs to the Group",
  description: "Private group social party app. RSVP, party pot, minigames, split damage, and recap memories.",
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
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#050505] text-white">
      <body className="min-h-screen bg-[#050505] text-[#F5F5F7] font-ui antialiased selection:bg-[#E9FF32] selection:text-black">
        {children}
      </body>
    </html>
  );
}
