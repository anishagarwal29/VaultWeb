import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { VaultProvider } from "@/context/VaultContext";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";

const inter = Inter({
  variable: "--font-inter", // specific name to avoid conflict
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vault | Financial Clarity",
  description: "The ultimate personal finance dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <VaultProvider>
          {children}
          <SyncStatusIndicator />
        </VaultProvider>
      </body>
    </html>
  );
}
