import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { TRACKING } from "@/lib/tracking";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#050708",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://whapi.pages.dev"),
  title: "¿Te escriben por WhatsApp y no vendes? Convierte chats en ventas",
  description:
    "No te faltan mensajes: te falta un sistema. Una IA sobre la API oficial de WhatsApp que atiende, califica y cierra ventas 24/7. Haz el diagnóstico gratis.",
  keywords: [
    "WhatsApp API",
    "automatización de ventas",
    "inteligencia artificial",
    "chatbot WhatsApp",
    "Meta Ads",
    "seguimiento de leads",
    "Colombia",
  ],
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "¿Te escriben por WhatsApp, pero no vendes?",
    description:
      "No te faltan mensajes. Te falta un sistema. Diagnóstico de tu negocio en 60 segundos.",
    url: "https://whapi.pages.dev",
    siteName: "WHAPI",
    images: [
      {
        url: "/img/og.jpg",
        width: 1200,
        height: 630,
        alt: "WHAPI — Convierte tus chats de WhatsApp en ventas automáticas",
      },
    ],
    type: "website",
    locale: "es_CO",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased bg-background text-foreground`}
      >
        {children}
        {/* Meta Pixel — fallback <noscript> oficial (visitantes sin JavaScript) */}
        {TRACKING.pixelId ? (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${TRACKING.pixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        ) : null}
      </body>
    </html>
  );
}
