import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/providers/query-provider";
import { CORES_TEMA, SCRIPT_TEMA_INICIAL } from "@/lib/tema";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Clínica — Gestão",
    template: "%s · Clínica",
  },
  description: "Agenda, clientes e financeiro da clínica",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Clínica",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Cor inicial pro SO (claro); o script abaixo ajusta antes do primeiro
            paint se houver preferência salva ou o sistema estiver no escuro —
            ver lib/tema.ts. */}
        <meta name="theme-color" content={CORES_TEMA.claro} />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-text">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
