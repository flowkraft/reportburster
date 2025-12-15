package com.sourcekraft.documentburster.utils;

import java.io.File;
import java.io.StringWriter;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import freemarker.template.Template;

/**
 * Utility class for rendering FreeMarker templates to strings.
 * Reuses the shared FreeMarker Configuration from DocumentBursterFreemarkerInitializer.
 */
public class FreemarkerRenderingUtils {

    private static final Logger log = LoggerFactory.getLogger(FreemarkerRenderingUtils.class);

    /**
     * Renders a FreeMarker template to a string using the provided user variables.
     * This method reuses the shared FREE_MARKER_CFG configuration.
     *
     * @param templatePath  The file path to the FreeMarker template (.ftl/.html)
     * @param userVariables Map of variables to be used in the template
     * @return The rendered HTML/content as a string
     * @throws Exception if template rendering fails
     */
    public static String renderTemplate(String templatePath, Map<String, Object> userVariables) throws Exception {

        log.debug("Rendering FreeMarker template: {}", templatePath);

        File templateFile = new File(templatePath);
        File parentDir = templateFile.getParentFile();

        // Set the template directory for this rendering
        DocumentBursterFreemarkerInitializer.FREE_MARKER_CFG.setDirectoryForTemplateLoading(parentDir);

        // Load and process the template
        Template template = DocumentBursterFreemarkerInitializer.FREE_MARKER_CFG.getTemplate(templateFile.getName());

        StringWriter writer = new StringWriter();
        template.process(userVariables, writer);

        String result = writer.toString();
        log.debug("FreeMarker template rendered successfully, output length: {} chars", result.length());

        return result;
    }

    /**
     * Checks if the given output type supports HTML-based FreeMarker rendering.
     * 
     * @param outputType The output type from settings (e.g., "output.html", "output.pdf")
     * @return true if the output type uses HTML/FreeMarker templates
     */
    public static boolean isHtmlBasedOutputType(String outputType) {
        return CsvUtils.OUTPUT_TYPE_HTML.equals(outputType)
                || CsvUtils.OUTPUT_TYPE_PDF.equals(outputType)
                || CsvUtils.OUTPUT_TYPE_EXCEL.equals(outputType)
                || CsvUtils.OUTPUT_TYPE_ANY.equals(outputType);
    }
}
