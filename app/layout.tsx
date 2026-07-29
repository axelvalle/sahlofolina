import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sahlo Folina — Una historia de Trench",
  description:
    "Lectura novelada de la saga Trench. Una historia de Dema, Clancy, los Banditos y el Torchbearer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
