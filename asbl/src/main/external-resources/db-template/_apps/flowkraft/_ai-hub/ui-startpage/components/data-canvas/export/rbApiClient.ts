// Orchestrates Java backend calls to save a dashboard
// Idempotent: delete existing + recreate under same reportCode

import type { ExportedFiles } from "./exportGenerator";

const RB_BASE = process.env.NEXT_PUBLIC_RB_API_URL || "http://localhost:8123/api";

interface SaveResult {
  success: boolean;
  reportCode: string;
  dashboardUrl: string;
  error?: string;
}

export async function saveDashboardToReportBurster(
  files: ExportedFiles,
  connectionId: string
): Promise<SaveResult> {
  const { reportCode } = files;
  const dashboardUrl = `${RB_BASE.replace("/api", "")}/dashboard/${reportCode}`;

  try {
    // Step 1: Delete existing report (idempotent — ignore 404)
    await fetch(`${RB_BASE}/reports/configurations/${encodeURIComponent(reportCode)}`, {
      method: "DELETE",
    });

    // Step 2: Create report folder + settings.xml + reporting.xml
    const createRes = await fetch(`${RB_BASE}/reports/configurations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: reportCode,
        templateName: `${reportCode}-template`,
        capReportDistribution: false,
        capReportGenerationMailMerge: false,
      }),
    });
    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`Failed to create report: ${text}`);
    }

    // Step 3: Save reporting.xml with dashboard datasource type + connection
    const configBasePath = `config/reports/${reportCode}`;

    // Update reporting.xml to set datasource type and connection
    await writeFile(`${configBasePath}/reporting.xml`, generateReportingXml(reportCode, connectionId));

    // Step 4: Write all dashboard files
    await Promise.all([
      writeFile(`${configBasePath}/${reportCode}-template.html`, files.templateHtml),
      writeFile(`${configBasePath}/${reportCode}-script.groovy`, files.scriptGroovy),
      writeFile(`${configBasePath}/${reportCode}-chart-config.groovy`, files.chartConfigGroovy),
      writeFile(`${configBasePath}/${reportCode}-tabulator-config.groovy`, files.tabulatorConfigGroovy),
      writeFile(`${configBasePath}/${reportCode}-pivot-config.groovy`, files.pivotConfigGroovy),
      writeFile(`${configBasePath}/${reportCode}-filterpane-config.groovy`, files.filterPaneConfigGroovy),
      writeFile(`${configBasePath}/${reportCode}-report-parameters-spec.groovy`, files.parametersSpecGroovy),
    ]);

    return { success: true, reportCode, dashboardUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, reportCode, dashboardUrl, error: message };
  }
}

async function writeFile(path: string, content: string): Promise<void> {
  if (!content && content !== "") return; // Skip empty optional files

  const res = await fetch(`${RB_BASE}/system/fs/write-string-to-file?path=${encodeURIComponent(path)}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: content,
  });
  if (!res.ok) {
    throw new Error(`Failed to write ${path}: ${res.status}`);
  }
}

function generateReportingXml(reportCode: string, connectionId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<reportingSettings>
  <report>
    <datasource>
      <type>ds.dashboard</type>
      <scriptoptions>
        <conncode>${connectionId}</conncode>
        <scriptfilepath>${reportCode}-script.groovy</scriptfilepath>
      </scriptoptions>
    </datasource>
    <template>
      <type>template.html</type>
      <templatefilepath>${reportCode}-template.html</templatefilepath>
    </template>
  </report>
</reportingSettings>`;
}
