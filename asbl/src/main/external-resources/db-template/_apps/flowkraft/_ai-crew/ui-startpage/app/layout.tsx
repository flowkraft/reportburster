import type { Metadata } from "next";
import "./globals.css";
import { AINavbar } from "@/components/layout/AINavbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AI Crew Dashboard",
  description: "AI Agent Management and Monitoring Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
        <ThemeProvider>
          <AINavbar />
          <main className="flex-1 pt-16 w-full">
            <div className="w-full">
              {children}
            </div>
          </main>
          <Footer />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
