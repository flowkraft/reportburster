/**
 * /dashboard/[reportId] — renders a saved DataPallas canvas dashboard.
 *
 * Fetches the HTML template fragment from the Java backend
 * (GET /api/explore-data/template/{reportId}) and injects it into the page.
 * The rb-webcomponents scripts are already loaded by the root layout via
 * <RbWebComponentsLoader />, so all <rb-chart>, <rb-pivot-table>, etc.
 * elements hydrate automatically.
 */

const RB_API = process.env.NEXT_PUBLIC_RB_API_URL || "http://localhost:9090/api";

interface PageProps {
  params: Promise<{ reportId: string }>;
}

async function fetchTemplate(reportId: string): Promise<string | null> {
  try {
    const res = await fetch(`${RB_API}/explore-data/template/${encodeURIComponent(reportId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export default async function DashboardPage({ params }: PageProps) {
  const { reportId } = await params;
  const html = await fetchTemplate(reportId);

  if (!html) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-lg font-semibold text-foreground">Dashboard not found</p>
        <p className="text-sm text-muted-foreground">
          No published dashboard found for &ldquo;{reportId}&rdquo;. Save it from the canvas editor first.
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
