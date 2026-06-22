import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";

export const metadata: Metadata = {
  title: "DISTRIBUIDORA HORUS — Inventarios",
  description: "Gestión de inventario, ventas y clientes con trazabilidad GS1",
  icons: {
    icon: "/brand/distribuidora-horus-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="h-full">
      <body className="min-h-full antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
