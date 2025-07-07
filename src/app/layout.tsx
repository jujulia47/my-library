import type { Metadata } from "next";
import "./globals.css";
import "./fantasy.css";

export const metadata: Metadata = {
  title: "Library",
  description: "Create by Júlia Borges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`fantasy-bg`}>
          {children}
      </body>
    </html>
  );
}
