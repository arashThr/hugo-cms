import type { Metadata } from "next";
import { Inter, Manrope, Literata, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SettingsProvider } from "@/components/SettingsProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const literata = Literata({ subsets: ["latin"], variable: "--font-literata" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito-sans" });

export const metadata: Metadata = {
  title: "HugoFlow - The Modern Git-based Front-end interface for Hugo",
  description: "A clean, Git-based Front-end interface for Hugo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script defer src="https://cloud.umami.is/script.js" data-website-id="c3c191eb-fea1-4a59-88cc-2bdfb8f28131"></script>
      </head>
      <body className={`${inter.variable} ${manrope.variable} ${literata.variable} ${nunitoSans.variable} bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
