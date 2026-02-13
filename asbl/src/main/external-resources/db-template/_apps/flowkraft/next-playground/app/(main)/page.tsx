import Link from "next/link";
import { Table, BarChart3, Grid3x3, Sliders, FileText, Database, Layout } from "lucide-react";

export default function Home() {
  const components = [
    {
      href: "/tabulator",
      icon: Table,
      title: "Tabulator",
      description: "Interactive data tables",
    },
    {
      href: "/charts",
      icon: BarChart3,
      title: "Charts",
      description: "Data visualization",
    },
    {
      href: "/pivot-tables",
      icon: Grid3x3,
      title: "Pivot Tables",
      description: "Data analysis",
    },
    {
      href: "/report-parameters",
      icon: Sliders,
      title: "Parameters",
      description: "Report configuration",
    },
    {
      href: "/reports",
      icon: FileText,
      title: "Reports",
      description: "Full report examples",
    },
    {
      href: "/data-warehouse",
      icon: Database,
      title: "Data Warehouse",
      description: "Explore & query data",
    },
    {
      href: "/your-canvas",
      icon: Layout,
      title: "Your Canvas",
      description: "Build your own",
    },
  ];

  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-12 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Dashboards. Self Service Portals.
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Bring your reports to the <strong className="text-foreground">frontend</strong>: dashboards, portals, anywhere your users need them.
          Use our 'quick to get things done' (highly capable and fully customizable) portal, or{" "}
          <strong className="text-foreground">embed ReportBurster reports</strong> directly into your existing web applications and portals —
          responsive, secure, and themeable to match your look and feel.
        </p>
      </div>

      {/* Component Grid */}
      <div className="max-w-6xl mx-auto">
        <h5 className="text-center text-muted-foreground mb-6 text-sm font-medium">
          Explore Components
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {components.map((component) => {
            const Icon = component.icon;
            return (
              <Link
                key={component.href}
                href={component.href}
                className="group block p-6 bg-card border border-border rounded-lg hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <Icon className="w-8 h-8 text-rb-cyan mb-3" />
                  <h6 className="font-semibold text-card-foreground mb-1">
                    {component.title}
                  </h6>
                  <p className="text-sm text-muted-foreground">
                    {component.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
