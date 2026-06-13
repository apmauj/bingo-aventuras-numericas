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
    icon: [
      { url: "/bingo/assets/pipo-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/bingo/assets/pipo-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/bingo/assets/pipo-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/bingo/assets/pipo-180x180.png",
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
