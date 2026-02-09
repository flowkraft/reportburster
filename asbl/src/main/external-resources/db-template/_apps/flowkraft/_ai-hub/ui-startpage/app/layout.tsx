import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AINavbar } from "@/components/layout/AINavbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FlowKraft's AI Crew",
  description: "FlowKraft's AI Crew Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
        <ThemeProvider>
          <AINavbar />
          <main className="flex-1 pt-16 w-full">
            <div className="w-full">
              {children}
            </div>
          </main>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
