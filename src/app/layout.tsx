import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios internos — Librería Itinerante y Más",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-astryx-theme="itinerante" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
