import { MarketingConfig } from "types"

export const marketingConfig: MarketingConfig = {
  mainNav: [
    {
      title: "Download",
      href: "/download",
    },
    {
      title: "Testimonials",
      href: "/testimonials",
      items: [
        // This is the array for sub-menu items
        {
          title: "Report Distribution Software",
          href: "/testimonials/report-distribution-software",
          // external: true, // if this specific link should open in a new tab and is external
          // target: "_blank", // if you want to control target independently
        },
        {
          title: "Crystal Reports Distribution",
          href: "/testimonials/crystal-reports-distribution",
        },
        {
          title: "Email Payslips",
          href: "/testimonials/email-payslips",
        },
        // Add more sub-menu items here if needed
      ],
    },
    {
      title: "Documentation",
      href: "/docs",
    },
    {
      title: "Purchase",
      href: "/purchase",
    },
    {
      title: "Contact",
      href: "/contact",
    },
  ],
}
