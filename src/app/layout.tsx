import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bingo Aventuras Numéricas",
  description: "Juego educativo de bingo para niños de 6 a 8 años. ¡Aprendé números jugando con Pipo el Panda!",
  keywords: ["bingo", "educativo", "niños", "números", "juego", "aula"],
  authors: [{ name: "Bingo Aventuras" }],
  icons: {
    // Relative URLs keep the GitHub Pages basePath in the resolved browser URL.
    icon: "logo.svg",
    apple: "logo.svg",
  },
  openGraph: {
    title: "Bingo Aventuras Numéricas",
    description: "Juego educativo de bingo para niños",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
