import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "BAI Health",
  description:
    "Body Awareness Index — a friendlier take on BMI and BRI, focused on your own journey rather than a clinical verdict.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              BAI Health
            </Link>
            <nav className="flex gap-5 text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                Dashboard
              </Link>
              <Link
                href="/measure"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Measure
              </Link>
              <Link
                href="/history"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                History
              </Link>
              <Link
                href="/settings"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Settings
              </Link>
              <Link
                href="/about"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                About
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Not medical advice. Measurements are stored locally on your device.
        </footer>
      </body>
    </html>
  );
}
