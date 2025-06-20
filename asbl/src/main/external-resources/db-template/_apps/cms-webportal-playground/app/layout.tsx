import { Inter as FontSans } from "next/font/google"
import localFont from "next/font/local"

import "@/styles/globals.css"

import type { Viewport } from "next"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import Analytics from "@/components/analytics"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"
import LiveChat from "@/components/widgets/live-chat"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

// Font files can be colocated inside of `pages`
const fontHeading = localFont({
  src: "../assets/fonts/CalSans-SemiBold.woff2",
  variable: "--font-heading",
})

interface RootLayoutProps {
  children: React.ReactNode
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Report Distribution",
    "Automated Reporting",
    "Document Delivery",
    "PDF Processing",
    "Email Automation",
    "File Splitting",
    "Data Extraction",
    "Customizable Reports",
    "Batch Processing",
    "Secure Distribution",
    "Enterprise Reporting",
    "Workflow Automation",
    "Scheduled Delivery",
    "Multi-format Support",
    "Data Security",
    "Report Bursting",
    "Invoice Distribution",
    "Payroll Distribution",
    "Statement Delivery",
    "Automated Document Splitting",
    "Personalized Report Delivery",
    "Secure File Transfer",
    "Email Report Distribution",
    "FTP Document Delivery",
    "Web-based Report Sharing",
    "File Share Automation",
    "Crystal Reports",
    "JasperReports",
    "Microsoft Access",
    "Microsoft SQL Server Reporting Services",
    "IBM Cognos",
    "Oracle Hyperion",
    "QlikView",
    "SAP",
    "Oracle",
    "Sage",
    "Microsoft Dynamics",
    "PeopleSoft",
    "JD Edwards",
    "MYOB",
    "QuickBooks",
  ],
  authors: [
    {
      name: "SourceKraft Systems & Consulting Ltd",
      url: "https://www.reportburster.com",
    },
  ],
  creator: "SourceKraft",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/reportburster.png?v=${Date.now()}`, // Add your image here
        alt: "ReportBurster - Report Distribution Made Simple",
      },
    ],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
  referrer: "origin",
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontHeading.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <TailwindIndicator />
        </ThemeProvider>
        <Analytics />
        <LiveChat />
      </body>
    </html>
  )
}
