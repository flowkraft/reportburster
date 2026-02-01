import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "ReportBurster - Dashboards & Self Service Portals",
  description: "Bring your reports to the frontend: dashboards, portals, anywhere your users need them",
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
          <Navbar />
          <main className="flex-1 pt-16 w-full">
            <div className="w-full">
              {children}
            </div>
          </main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
