package com.flowkraft.ai.prompts;

import java.util.List;

public final class AiPromptRegistry {

    private AiPromptRegistry() {}

    public static List<PromptDefinition> all() {
        return List.of(
            SqlFromNaturalLanguage.create(),
            SqlFromCubeDsl.create(),
            SqlQueryOptimization.create(),
            DbSchemaDomainGrouped.create(),
            DbSchemaErDiagramPlantuml.create(),
            CustomDbSeedScript.create(),
            BuildTemplateFromScratch.create(),
            CreateSalesReportHtml.create(),
            ModifyExistingHtml.create(),
            ReplicateDesignFromScreenshot.create(),
            ReportParamsDslConfigure.create(),
            TabulatorDslConfigure.create(),
            ChartDslConfigure.create(),
            PivotTableDslConfigure.create(),
            CubeDslConfigure.create(),
            DashboardBuildLayout.create(),
            DashboardBuildStepByStep.create(),
            DashboardFromCubeDsl.create(),
            GroovyScriptInputSource.create(),
            GroovyScriptAdditionalTransformation.create(),
            GroovyScriptFromCubeDsl.create(),
            GroovyRestPublishToPortal.create(),
            SingleModelTemplateFromFields.create(),
            MyDocumentsListTemplateFromFields.create(),
            EmailPayslipNotification.create(),
            EmailInvoiceNotification.create(),
            EmailBoxed1columnResponsive.create(),
            EmailBoxed1columnImageResponsive.create(),
            EmailBoxed2columnResponsive.create(),
            EmailBoxed2columnImageResponsive.create(),
            EmailBoxed3columnResponsive.create(),
            ExcelTemplateGenerator.create(),
            JasperJrxmlTemplateGenerator.create(),
            PdfHtmlTemplateGenerator.create(),
            PdfSampleA4PayslipXslfo.create(),
            FilterPaneDslConfigure.create()
        );
    }
}
