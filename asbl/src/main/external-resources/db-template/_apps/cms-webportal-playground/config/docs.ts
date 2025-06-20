import { DocsConfig } from "types"

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Documentation",
      href: "/docs",
    },
  ],
  sidebarNav: [
    {
      title: "Docs",
      items: [
        {
          title: "QuickStart in 5 Minutes",
          href: "/docs/quickstart",
        },
        {
          title: "AI-Native Reporting",
          href: "/docs/artificial-intelligence",
        },
        {
          title: "Generate Reports",
          href: "/docs/report-generation",
        },
        {
          title: "Burst Reports (PDF & Excel)",
          href: "/docs/report-bursting",
        },
        {
          title: "Email Report Distribution",
          href: "/docs/email-report-distribution",
        },
        {
          title: "Archive and Upload Reports (FTP, Web, SSH, S3, etc.)",
          href: "/docs/archive-upload-reports",
        },
        {
          title: "Configuration",
          href: "/docs/configuration",
        },
        {
          title: "Variables",
          href: "/docs/variables-interpolation-templating",
        },
        {
          title: "Quality Assurance",
          href: "/docs/quality-assurance",
        },
        {
          title: "ReportBurster Server",
          href: "/docs/reportburster-server",
        },
        {
          title: "Command Line Interface (CLI)",
          href: "/docs/cli",
        },
      ],
    },
    {
      title: "Advanced Scenarios", // Create a new top-level section
      items: [
        {
          title: "Overview",
          href: "/docs/advanced",
        },
        {
          title: "Scripting",
          href: "/docs/advanced/scripting",
        },
        {
          title: "cURL Integration",
          href: "/docs/advanced/curl",
        },
      ],
    },
    {
      title: "Use Cases", // Create a new top-level section
      items: [
        {
          title: "Report Distribution Software",
          href: "/testimonials/report-distribution-software",
          external: true,
        },
        {
          title: "Crystal Reports Distribution",
          href: "/testimonials/crystal-reports-distribution",
          external: true,
        },
        {
          title: "Email Payslips",
          href: "/testimonials/email-payslips",
          external: true,
        },
      ],
    },
  ],
}
