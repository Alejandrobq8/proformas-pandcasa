import type { Metadata } from "next";
import { Work_Sans, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pan d' Casa",
  description: "Gestor de proformas y clientes",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${workSans.variable} ${cormorant.variable} antialiased`}
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(() => { try { const stored = localStorage.getItem('theme'); if (stored === 'dark') { document.documentElement.classList.add('theme-dark'); } else if (stored === 'light') { document.documentElement.classList.remove('theme-dark'); } } catch (e) {} })();",
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
