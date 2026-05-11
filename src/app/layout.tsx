import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/500.css";
import "@fontsource/eb-garamond/400-italic.css";
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/600.css";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Library",
  description: "Sua biblioteca pessoal",
  manifest: '/manifest.webmanifest',
  applicationName: "Minha Biblioteca",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Biblioteca",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#8B6F50",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-body bg-ivory text-ink-deep min-h-screen">
        {children}
      </body>
    </html>
  );
}
