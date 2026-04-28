import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/bytes/ThemeProvider";
import { AgentationDev } from "@/components/custom/agentation-dev";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const commitMono = localFont({
  src: "../fonts/commit-mono-variable-font.woff2",
  variable: "--font-commit-mono",
});

export const metadata: Metadata = {
  title: "Card sort · Sessions UI",
  description: "Help us figure out the information architecture for the LiveKit sessions UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${publicSans.variable} ${commitMono.variable} antialiased`}
      >
        <ThemeProvider
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="prototyping-theme"
        >
          {children}
          {process.env.NODE_ENV === "development" && <AgentationDev />}
        </ThemeProvider>
      </body>
    </html>
  );
}
