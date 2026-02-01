import Link from "next/link";
import { Bot, MessageSquare, Code, Activity } from "lucide-react";

export default function Home() {
  const features = [
    {
      href: "/agents",
      icon: Bot,
      title: "Manage Agents",
      description: "Create and configure AI agents",
    },
    {
      href: "http://localhost:8090",
      icon: MessageSquare,
      title: "Chat (Element)",
      description: "Chat with your AI crew",
      external: true,
    },
    {
      href: "http://localhost:8443",
      icon: Code,
      title: "Code Server",
      description: "Edit code in the browser",
      external: true,
    },
    {
      href: "/monitoring",
      icon: Activity,
      title: "Monitor",
      description: "Track agent activity",
    },
  ];

  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-12 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          AI Crew Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
          Manage AI agents, chat with your crew, and monitor agent activities.
          Built on <strong className="text-foreground">Letta</strong>, integrated with <strong className="text-foreground">Matrix/Element</strong> chat and <strong className="text-foreground">VS Code</strong> in the browser.
        </p>
        <Link
          href="/agents"
          className="inline-flex items-center gap-2 px-6 py-3 bg-rb-cyan hover:bg-rb-cyan/90 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Bot className="w-5 h-5" />
          View AI Agents
        </Link>
      </div>

      {/* Features Grid */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const Component = feature.external ? "a" : Link;
            const props = feature.external
              ? { href: feature.href, target: "_blank", rel: "noopener noreferrer" }
              : { href: feature.href };

            return (
              <Component
                key={feature.href}
                {...props}
                className="group block p-6 bg-card border border-border rounded-lg hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <Icon className="w-8 h-8 text-rb-cyan mb-3" />
                  <h6 className="font-semibold text-card-foreground mb-1">
                    {feature.title}
                  </h6>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Component>
            );
          })}
        </div>
      </div>
    </div>
  );
}
