import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
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
  title: "¿Te escriben por WhatsApp, pero no vendes? | Convierte tus chats en ventas",
  description:
    "No te faltan mensajes. Te falta un sistema. Descubre cómo una IA sobre la API oficial de WhatsApp atiende, califica y cierra ventas por ti, 24/7. Diagnóstico de tu negocio en menos de 60 segundos.",
  keywords: [
    "WhatsApp API",
    "automatización de ventas",
    "inteligencia artificial",
    "chatbot WhatsApp",
    "Meta Ads",
    "seguimiento de leads",
    "Colombia",
  ],
  openGraph: {
    title: "¿Te escriben por WhatsApp, pero no vendes?",
    description:
      "No te faltan mensajes. Te falta un sistema. Diagnóstico de tu negocio en 60 segundos.",
    images: ["/img/og.jpg"],
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
      </body>
    </html>
  );
}
