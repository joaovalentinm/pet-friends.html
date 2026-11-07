import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "João Content Intelligence",
  description: "Departamento de inteligência, viralização e estratégia de conteúdo com IA",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
