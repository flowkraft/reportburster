import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "ReportBurster - Dashboards & Self Service Portals",
  description: "Bring your reports to the frontend: dashboards, portals, anywhere your users need them",
};

/**
 * Root Layout
 * 
 * This is the base layout for the entire app. It only provides:
 * - HTML/body structure
 * - ThemeProvider for dark/light mode
 * - Toaster for notifications
 * 
 * Navigation is handled by route group layouts:
 * - (main)/layout.tsx - Main app with Navbar/Footer
 * - (admin)/layout.tsx - Admin area with AdminSidebar/AdminHeader
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
