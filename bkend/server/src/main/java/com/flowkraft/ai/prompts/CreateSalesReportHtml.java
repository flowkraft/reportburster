package com.flowkraft.ai.prompts;

import java.util.List;

public final class CreateSalesReportHtml {

    private CreateSalesReportHtml() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "CREATE_SALES_REPORT_HTML",
            "Create Sales Report HTML Template",
            "Generates a basic HTML template for a monthly sales report with standard sections.",
            List.of("sales", "report", "html"),
            "Template Creation/Modification",
            "Create a clean, professional HTML template for a monthly sales report with sections for summary metrics, regional performance, top products, and year-over-year comparisons. Return fully self-contained HTML code with inline CSS—no partial or snippet formats."
        );
    }
}
