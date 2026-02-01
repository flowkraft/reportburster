import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Main App Layout
 * 
 * This layout wraps all main app pages (Home, Tabulator, Charts, etc.)
 * with the main navigation (Navbar) and Footer.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 w-full">
        <div className="w-full">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
