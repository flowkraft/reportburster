package com.flowkraft.samples;

import com.flowkraft.common.AppPaths;
import com.flowkraft.system.services.FileSystemService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Paths;
import java.util.*;

/**
 * Manages the gallery template catalog — maps template IDs to file paths.
 * The frontend never sees filesystem paths; it uses template IDs + variant indices.
 */
@Service
public class GalleryService {

    @Autowired
    private FileSystemService fileSystemService;

    /**
     * Template catalog entry: ID → list of file paths (variants).
     */
    private static final Map<String, List<String>> TEMPLATE_CATALOG = new LinkedHashMap<>();

    static {
        TEMPLATE_CATALOG.put("HTML-INVOICE-TEMPLATES-BASIC-PDF",
                List.of("templates/gallery/_basic/payslips-template.html"));

        TEMPLATE_CATALOG.put("HTML-INVOICE-TEMPLATES-BASIC-EXCEL",
                List.of("templates/gallery/_basic/payslips-template-excel.html"));

        TEMPLATE_CATALOG.put("HTML-INVOICE-TEMPLATES-BS3GRID-GOOGLE-FONTS",
                List.of("templates/gallery/nirajrajgor-html-invoice-templates/invoice1.html",
                        "templates/gallery/nirajrajgor-html-invoice-templates/invoice2.html",
                        "templates/gallery/nirajrajgor-html-invoice-templates/invoice3.html"));

        TEMPLATE_CATALOG.put("SPARKSUITE-HTML-INVOICE-TEMPLATE",
                List.of("templates/gallery/sparksuite-simple-html-invoice-template/invoice.html"));

        TEMPLATE_CATALOG.put("ANVIL-HTML-INVOICE-TEMPLATE",
                List.of("templates/gallery/anvilco-html-pdf-invoice-template/invoice.html"));

        TEMPLATE_CATALOG.put("COMPLEX-HTML-INVOICE-TEMPLATE",
                List.of("templates/gallery/barbosa89-invoice-template/invoice.html"));

        TEMPLATE_CATALOG.put("HTML-MAILCHIMP-EMAIL-2COLUMN-QUERY-RESPONSIVE",
                List.of("templates/mailchimp-email-blueprints/responsive-templates/base_boxed_2column_query.html"));

        TEMPLATE_CATALOG.put("HTML-MAILCHIMP-EMAIL-2COLUMN-LEFTSIDEBAR",
                List.of("templates/mailchimp-email-blueprints/templates/2col-1-2-leftsidebar.html"));
    }

    /**
     * Resolve the filesystem path for a template variant.
     * Returns null if templateId or variant is invalid.
     */
    public String resolveTemplatePath(String templateId, int variant) {
        List<String> paths = TEMPLATE_CATALOG.get(templateId);
        if (paths == null || variant < 0 || variant >= paths.size()) {
            return null;
        }
        return paths.get(variant);
    }

    /**
     * Read template HTML content by ID + variant.
     */
    public String loadContent(String templateId, int variant) throws Exception {
        String relativePath = resolveTemplatePath(templateId, variant);
        if (relativePath == null) return null;
        String fullPath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, relativePath).toString();
        return fileSystemService.unixCliCat(fullPath);
    }

    /**
     * Read an associated file (readme, ai_prompt_modify, ai_prompt_scratch) for a template variant.
     * The associated file is derived from the template filename:
     *   template: invoice.html → readme: invoice-readme.md
     */
    public String loadAssociatedFile(String templateId, int variant, String suffix) throws Exception {
        String relativePath = resolveTemplatePath(templateId, variant);
        if (relativePath == null) return null;

        // Derive associated file path: replace .html extension with -{suffix}.md
        int dotIndex = relativePath.lastIndexOf('.');
        if (dotIndex == -1) return null;
        String associatedPath = relativePath.substring(0, dotIndex) + "-" + suffix + ".md";

        String fullPath = Paths.get(AppPaths.PORTABLE_EXECUTABLE_DIR_PATH, associatedPath).toString();
        File file = new File(fullPath);
        if (!file.exists()) return "";
        return fileSystemService.unixCliCat(fullPath);
    }

    /**
     * Resolve the directory path for a template (for asset serving).
     */
    public String resolveTemplateDir(String templateId, int variant) {
        String relativePath = resolveTemplatePath(templateId, variant);
        if (relativePath == null) return null;
        int lastSlash = relativePath.lastIndexOf('/');
        return lastSlash >= 0 ? relativePath.substring(0, lastSlash + 1) : "";
    }
}
