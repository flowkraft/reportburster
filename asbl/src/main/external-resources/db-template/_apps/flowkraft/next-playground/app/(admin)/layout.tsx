import type { Metadata } from "next";
import { AdminSidebar, AdminHeader } from "@/components/admin";

export const metadata: Metadata = {
  title: "Admin Panel - FlowKraft",
  description: "FlowKraft Admin Dashboard",
};

/**
 * Admin Layout
 * 
 * This layout wraps all admin pages with AdminSidebar and AdminHeader.
 * Completely separate from the main app layout (no Navbar/Footer).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main content area */}
      <div className="flex-1 pl-64 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
