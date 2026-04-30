import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";

import { SettingsProvider } from "@/components/SettingsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hugo CMS",
  description: "A rich text CMS for Hugo static websites.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <div className="app-container">
              <Navbar />
              <main className="main-content">{children}</main>
            </div>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
