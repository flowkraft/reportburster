package com.flowkraft.exploredata.export;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.commonmark.Extension;
import org.commonmark.ext.gfm.tables.TablesExtension;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Generates all dashboard sidecar files (HTML template, Groovy DSL configs,
 * JSON sidecars) from canvas widget state.  Mirrors the TypeScript
 * {@code exportGenerator.ts} so that file generation moves fully server-side
 * and the client no longer needs to send generated content over the wire.
 */
@SuppressWarnings("unchecked")
public class DashboardFileGenerator {

    private static final ObjectMapper JSON = new ObjectMapper();

    // Markdown → HTML for text-block widgets. GFM tables extension mirrors the
    // `remark-gfm` plugin the editor uses (react-markdown side), so published
    // output matches the canvas preview. Parser/renderer are thread-safe per
    // commonmark-java docs, so one shared instance is enough.
    private static final List<Extension> MARKDOWN_EXTENSIONS = List.of(TablesExtension.create());
    private static final Parser MARKDOWN_PARSER = Parser.builder().extensions(MARKDOWN_EXTENSIONS).build();
    private static final HtmlRenderer MARKDOWN_RENDERER = HtmlRenderer.builder().extensions(MARKDOWN_EXTENSIONS).build();

    public record GeneratedFiles(
        String templateHtml,
        String chartConfigGroovy,
        String tabulatorConfigGroovy,
        String pivotConfigGroovy,
        String filterPaneConfigGroovy,
        String parametersSpecGroovy,
        String valueConfigJson,
        String mapConfigJson,
        String sankeyConfigJson,
        String gaugeConfigJson,
        String trendConfigJson,
        String progressConfigJson,
        String detailConfigJson
    ) {}

    public static GeneratedFiles generate(
            List<Map<String, Object>> widgets,
            String filterDsl,
            String reportId,
            String apiBaseUrl) throws Exception {

        String safeFilterDsl = filterDsl != null ? filterDsl : "";

        return new GeneratedFiles(
            generateTemplate(widgets, safeFilterDsl, reportId, apiBaseUrl),
            generateChartConfig(byType(widgets, "chart")),
            generateTabulatorConfig(byType(widgets, "tabulator")),
            generatePivotConfig(byType(widgets, "pivot")),
            generateFilterPaneConfig(byType(widgets, "filter-pane")),
            safeFilterDsl,
            generateValueConfig(byType(widgets, "number")),
            generateMapConfig(byType(widgets, "map")),
            generateJsonSidecar(byType(widgets, "sankey"),   "sourceField", "targetField", "valueField", "nodePadding", "nodeWidth", "palette"),
            generateJsonSidecar(byType(widgets, "gauge"),    "field", "min", "max", "bands", "label", "format"),
            generateJsonSidecar(byType(widgets, "trend"),    "dateField", "valueField", "format", "label"),
            generateJsonSidecar(byType(widgets, "progress"), "field", "goal", "label", "format", "color"),
            generateJsonSidecar(byType(widgets, "detail"),   "hiddenColumns", "rowIndex")
        );
    }

    // ── HTML Template ─────────────────────────────────────────────────────────

    private static String generateTemplate(List<Map<String, Object>> widgets,
                                           String filterDsl, String reportId, String apiBaseUrl) {
        List<Map<String, Object>> sorted = widgets.stream()
            .sorted(Comparator.comparingInt((Map<String, Object> w) -> gridInt(w, "y"))
                              .thenComparingInt(w -> gridInt(w, "x")))
            .collect(Collectors.toList());

        StringBuilder components = new StringBuilder();
        for (Map<String, Object> w : sorted) {
            String html = widgetHtml(w, reportId, apiBaseUrl);
            if (html != null && !html.isBlank()) {
                components.append(html).append("\n");
            }
        }

        String paramsHtml = filterDsl.trim().isEmpty() ? "" :
            String.format("    <div class=\"params-bar\">\n" +
                          "      <rb-parameters report-id=\"%s\" api-base-url=\"%s\" show-reload=\"true\"></rb-parameters>\n" +
                          "    </div>", reportId, apiBaseUrl);

        return "<meta charset=\"utf-8\">\n" +
               "<div class=\"rb-dashboard-root\">\n" +
               "  <style>\n" +
               "    .rb-dashboard-root {\n" +
               "      all: initial;\n" +
               "      display: block;\n" +
               "      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;\n" +
               "      box-sizing: border-box;\n" +
               "      color: #1e293b;\n" +
               "      background: #f8fafc;\n" +
               "      padding: 24px;\n" +
               "    }\n" +
               "    .rb-dashboard-root *, .rb-dashboard-root *::before, .rb-dashboard-root *::after {\n" +
               "      box-sizing: inherit;\n" +
               "    }\n" +
               "    .rb-dashboard-root .dashboard-grid {\n" +
               "      display: grid;\n" +
               "      grid-template-columns: repeat(12, 1fr);\n" +
               "      gap: 16px;\n" +
               "      auto-rows: minmax(80px, auto);\n" +
               "    }\n" +
               "    .rb-dashboard-root .grid-item {\n" +
               "      background: #ffffff;\n" +
               "      border: 1px solid #e2e8f0;\n" +
               "      border-radius: 8px;\n" +
               "      padding: 16px;\n" +
               "      overflow: hidden;\n" +
               "    }\n" +
               "    .rb-dashboard-root .number-card {\n" +
               "      display: flex;\n" +
               "      flex-direction: column;\n" +
               "      align-items: flex-start;\n" +
               "      justify-content: center;\n" +
               "      background: #ffffff;\n" +
               "      border: 1px solid #e2e8f0;\n" +
               "      border-radius: 10px;\n" +
               "      padding: 20px 22px;\n" +
               "      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);\n" +
               "      position: relative;\n" +
               "      overflow: hidden;\n" +
               "    }\n" +
               "    .rb-dashboard-root .number-card::before {\n" +
               "      content: '';\n" +
               "      position: absolute;\n" +
               "      top: 0; left: 0; right: 0;\n" +
               "      height: 3px;\n" +
               "      background: #0f766e;\n" +
               "    }\n" +
               "    .rb-dashboard-root .number-label {\n" +
               "      font-size: 11px;\n" +
               "      font-weight: 600;\n" +
               "      text-transform: uppercase;\n" +
               "      letter-spacing: 0.6px;\n" +
               "      color: #94a3b8;\n" +
               "      margin: 0 0 6px 0;\n" +
               "    }\n" +
               "    .rb-dashboard-root .number-value {\n" +
               "      font-size: 28px;\n" +
               "      font-weight: 800;\n" +
               "      color: #064e3b;\n" +
               "      margin: 0;\n" +
               "      line-height: 1.1;\n" +
               "    }\n" +
               "    .rb-dashboard-root .text-block {\n" +
               "      font-size: 14px;\n" +
               "      line-height: 1.6;\n" +
               "      color: #334155;\n" +
               "    }\n" +
               "    .rb-dashboard-root .text-block h1 { font-size: 1.75em; font-weight: 700; margin: 0 0 0.5em; color: #0f172a; }\n" +
               "    .rb-dashboard-root .text-block h2 { font-size: 1.4em; font-weight: 700; margin: 0 0 0.5em; color: #0f172a; }\n" +
               "    .rb-dashboard-root .text-block h3 { font-size: 1.15em; font-weight: 600; margin: 0 0 0.4em; color: #0f172a; }\n" +
               "    .rb-dashboard-root .text-block p { margin: 0 0 0.75em; }\n" +
               "    .rb-dashboard-root .text-block ul { list-style: disc; padding-left: 1.5em; margin: 0 0 0.75em; }\n" +
               "    .rb-dashboard-root .text-block ol { list-style: decimal; padding-left: 1.5em; margin: 0 0 0.75em; }\n" +
               "    .rb-dashboard-root .text-block li { margin-bottom: 0.25em; }\n" +
               "    .rb-dashboard-root .text-block a { color: #2563eb; text-decoration: underline; }\n" +
               "    .rb-dashboard-root .text-block strong { font-weight: 600; }\n" +
               "    .rb-dashboard-root .text-block em { font-style: italic; }\n" +
               "    .rb-dashboard-root .text-block code { background: #f1f5f9; padding: 0.1em 0.35em; border-radius: 3px; font-size: 0.9em; }\n" +
               "    .rb-dashboard-root .text-block pre { background: #f1f5f9; padding: 0.75em; border-radius: 4px; overflow: auto; margin: 0 0 0.75em; }\n" +
               "    .rb-dashboard-root .text-block pre code { background: transparent; padding: 0; }\n" +
               "    .rb-dashboard-root .text-block table { border-collapse: collapse; width: 100%; margin: 0 0 0.75em; }\n" +
               "    .rb-dashboard-root .text-block th { border: 1px solid #e2e8f0; padding: 0.4em 0.6em; background: #f8fafc; font-weight: 600; text-align: left; }\n" +
               "    .rb-dashboard-root .text-block td { border: 1px solid #e2e8f0; padding: 0.4em 0.6em; }\n" +
               "    .rb-dashboard-root .text-block blockquote { border-left: 3px solid #e2e8f0; padding-left: 0.75em; color: #64748b; margin: 0 0 0.75em; }\n" +
               "    .rb-dashboard-root .divider {\n" +
               "      border: none;\n" +
               "      border-top: 1px solid #e2e8f0;\n" +
               "      margin: 8px 0;\n" +
               "    }\n" +
               "    .rb-dashboard-root .params-bar {\n" +
               "      margin-bottom: 20px;\n" +
               "    }\n" +
               "  </style>\n\n" +
               (paramsHtml.isBlank() ? "" : paramsHtml + "\n") +
               "  <div class=\"dashboard-grid\">\n" +
               components +
               "  </div>\n" +
               "</div>\n";
    }

    private static String widgetHtml(Map<String, Object> w, String reportId, String apiBaseUrl) {
        String type  = str(w, "type");
        String id    = componentId(w);
        int    x     = gridInt(w, "x");
        int    y     = gridInt(w, "y");
        int    col   = gridInt(w, "w");
        int    row   = gridInt(w, "h");
        String attrs = String.format("report-id=\"%s\" api-base-url=\"%s\" component-id=\"%s\"", reportId, apiBaseUrl, id);
        // CSS Grid is 1-indexed, react-grid-layout x/y are 0-indexed → +1.
        // Explicit start positions (not just span) so the canvas layout is
        // preserved instead of the browser auto-flowing items left-to-right.
        String style = String.format(
            "grid-column: %d / span %d; grid-row: %d / span %d;",
            x + 1, col, y + 1, row);

        return switch (type) {
            case "chart" ->
                String.format("    <div class=\"grid-item\" style=\"%s\">\n      <rb-chart %s></rb-chart>\n    </div>", style, attrs);
            case "tabulator" ->
                String.format("    <div class=\"grid-item\" style=\"%s\">\n      <rb-tabulator %s></rb-tabulator>\n    </div>", style, attrs);
            case "pivot" ->
                String.format("    <div class=\"grid-item\" style=\"%s\">\n      <rb-pivot-table %s></rb-pivot-table>\n    </div>", style, attrs);
            case "number" -> {
                Map<String, Object> dc = displayConfig(w);
                String numberField  = strOr(dc, "numberField",  "");
                String numberFormat = strOr(dc, "numberFormat", "");
                if (numberFormat.isEmpty())
                    numberFormat = isCurrencyFieldName(numberField) ? "currency" : "number";
                String numberLabel  = strOr(dc, "numberLabel",  numberField);
                yield String.format(
                    "    <div class=\"grid-item number-card\" style=\"%s\">\n" +
                    "      <p class=\"number-label\">%s</p>\n" +
                    "      <p class=\"number-value\"><rb-value %s field=\"%s\" format=\"%s\"></rb-value></p>\n" +
                    "    </div>", style,
                    numberLabel, attrs, numberField, numberFormat);
            }
            case "map" ->
                String.format("    <div class=\"grid-item\" style=\"%s\">\n      <rb-map %s></rb-map>\n    </div>", style, attrs);
            case "sankey" ->
                String.format("    <div class=\"grid-item\" style=\"%s\">\n      <rb-sankey %s></rb-sankey>\n    </div>", style, attrs);
            case "gauge" ->
                String.format("    <div class=\"grid-item\" style=\"%s\">\n      <rb-gauge %s></rb-gauge>\n    </div>", style, attrs);
            case "trend" ->
                String.format("    <div class=\"grid-item\" style=\"%s\">\n      <rb-trend %s></rb-trend>\n    </div>", style, attrs);
            case "progress" ->
                String.format("    <div class=\"grid-item\" style=\"%s\">\n      <rb-progress %s></rb-progress>\n    </div>", style, attrs);
            case "detail" ->
                String.format("    <div class=\"grid-item\" style=\"%s\">\n      <rb-detail %s></rb-detail>\n    </div>", style, attrs);
            case "text" -> {
                Map<String, Object> dc = displayConfig(w);
                String markdown = strOr(dc, "textContent", "");
                String html = MARKDOWN_RENDERER.render(MARKDOWN_PARSER.parse(markdown));
                yield String.format(
                    "    <div class=\"grid-item\" style=\"%s\">\n      <div class=\"text-block\">%s</div>\n    </div>",
                    style, html);
            }
            case "filter-pane" -> {
                Map<String, Object> dc = displayConfig(w);
                yield String.format(
                    "    <div class=\"grid-item\" style=\"%s\">\n      <rb-filter-pane %s field=\"%s\" table-name=\"%s\" connection-code=\"\"></rb-filter-pane>\n    </div>",
                    style, attrs, strOr(dc, "filterField", ""), visualQueryTable(w));
            }
            case "divider" ->
                String.format(
                    "    <div class=\"grid-item\" style=\"%s\">\n      <hr class=\"divider\" />\n    </div>",
                    style);
            case "iframe" -> {
                Map<String, Object> dc = displayConfig(w);
                String url = escapeHtmlAttr(strOr(dc, "iframeUrl", ""));
                if (url.isBlank()) yield "";
                yield String.format(
                    "    <div class=\"grid-item\" style=\"%s; padding: 0;\">\n" +
                    "      <iframe src=\"%s\" title=\"%s\" sandbox=\"%s\" referrerpolicy=\"no-referrer\" loading=\"lazy\" style=\"width:100%%; height:100%%; border:0; display:block;\"></iframe>\n" +
                    "    </div>", style, url,
                    escapeHtmlAttr(strOr(dc, "iframeTitle", "Embedded content")),
                    escapeHtmlAttr(strOr(dc, "iframeSandbox", "allow-scripts allow-same-origin allow-popups allow-forms")));
            }
            default -> "";
        };
    }

    // ── Chart Config (Groovy DSL) ─────────────────────────────────────────────

    private static String generateChartConfig(List<Map<String, Object>> charts) {
        if (charts.isEmpty()) return "";
        return charts.stream().map(w -> {
            String id = componentId(w);
            Map<String, Object> cfg = displayConfig(w);
            Object customDsl = cfg.get("customDsl");
            if (customDsl instanceof String s && !s.isBlank()) {
                String dsl = s.trim();
                // Unnamed `chart { }` → wrap as named so each widget's config is
                // independently addressable and blocks don't merge/overwrite each other.
                if (!dsl.startsWith("chart(")) {
                    dsl = dsl.replaceFirst("^chart\\s*\\{", "chart('" + id + "') {");
                }
                return dsl;
            }

            String chartType   = strOr(cfg, "chartType", "bar");
            String chartTitle  = strOr(cfg, "chartTitle", "");
            List<String> xFields = listOfStr(cfg, "xFields");
            List<String> yFields = listOfStr(cfg, "yFields");
            String xField      = xFields.isEmpty() ? "" : xFields.get(0);
            String seriesField = xFields.size() > 1 ? xFields.get(1) : "";

            StringBuilder sb = new StringBuilder();
            sb.append("chart('").append(id).append("') {\n");
            sb.append("  type '").append(chartType).append("'\n");
            sb.append("  data {\n");
            if (!yFields.isEmpty()) {
                sb.append("    labelField '").append(xField).append("'\n");
                if (!seriesField.isBlank()) sb.append("    seriesField '").append(seriesField).append("'\n");
                sb.append("    datasets {\n");
                for (String yf : yFields) {
                    sb.append("      dataset {\n");
                    sb.append("        field '").append(yf).append("'\n");
                    sb.append("        label '").append(yf).append("'\n");
                    sb.append("      }\n");
                }
                sb.append("    }\n");
            } else {
                sb.append("    // Auto-detect fields from data\n");
            }
            sb.append("  }\n");
            if (!chartTitle.isEmpty()) {
                String escaped = chartTitle.replace("'", "\\'");
                sb.append("  options {\n")
                  .append("    plugins {\n")
                  .append("      title { display true; text '").append(escaped).append("' }\n")
                  .append("    }\n")
                  .append("  }\n");
            }
            sb.append("}");
            return sb.toString();
        }).collect(Collectors.joining("\n\n"));
    }

    // ── Tabulator Config (Groovy DSL) ─────────────────────────────────────────

    private static String generateTabulatorConfig(List<Map<String, Object>> tabulators) {
        if (tabulators.isEmpty()) return "";
        return tabulators.stream().map(w -> {
            String id = componentId(w);
            Map<String, Object> cfg = displayConfig(w);
            Object customDsl = cfg.get("customDsl");
            if (customDsl instanceof String s && !s.isBlank()) {
                String dsl = s.trim();
                if (!dsl.startsWith("tabulator("))
                    dsl = dsl.replaceFirst("^tabulator\\s*\\{", "tabulator('" + id + "') {");
                return dsl;
            }
            return "tabulator('" + id + "') {\n  layout \"fitColumns\"\n  autoColumns true\n}";
        }).collect(Collectors.joining("\n\n"));
    }

    // ── Pivot Config (Groovy DSL) ─────────────────────────────────────────────

    private static String generatePivotConfig(List<Map<String, Object>> pivots) {
        if (pivots.isEmpty()) return "";
        return pivots.stream().map(w -> {
            String id = componentId(w);
            Map<String, Object> cfg = displayConfig(w);
            Object customDsl = cfg.get("customDsl");
            if (customDsl instanceof String s && !s.isBlank()) {
                String dsl = s.trim();
                if (!dsl.startsWith("pivotTable("))
                    dsl = dsl.replaceFirst("^pivotTable\\s*\\{", "pivotTable('" + id + "') {");
                return dsl;
            }

            List<String> rows = listOfStr(cfg, "pivotRows");
            List<String> cols = listOfStr(cfg, "pivotCols");
            List<String> vals = listOfStr(cfg, "pivotVals");
            String aggregator = strOr(cfg, "pivotAggregator", "Sum");

            StringBuilder sb = new StringBuilder();
            sb.append("pivotTable('").append(id).append("') {\n");
            rows.forEach(r -> sb.append("  rows '").append(r).append("'\n"));
            cols.forEach(c -> sb.append("  cols '").append(c).append("'\n"));
            vals.forEach(v -> sb.append("  vals '").append(v).append("'\n"));
            sb.append("  aggregatorName '").append(aggregator).append("'\n");
            sb.append("  rendererName 'Table'\n}");
            return sb.toString();
        }).collect(Collectors.joining("\n\n"));
    }

    // ── Filter Pane Config (Groovy DSL) ───────────────────────────────────────

    private static String generateFilterPaneConfig(List<Map<String, Object>> filterPanes) {
        if (filterPanes.isEmpty()) return "";
        return filterPanes.stream().map(w -> {
            String id = componentId(w);
            Map<String, Object> cfg = displayConfig(w);
            Object customDsl = cfg.get("customDsl");
            if (customDsl instanceof String s && !s.isBlank()) {
                String dsl = s.trim();
                if (!dsl.startsWith("filterPane("))
                    dsl = dsl.replaceFirst("^filterPane\\s*\\{", "filterPane('" + id + "') {");
                return dsl;
            }

            String filterField = strOr(cfg, "filterField", "");
            if (filterField.isBlank()) return "// filterPane('" + id + "') — no field configured";

            List<String> lines = new ArrayList<>();
            lines.add("filterPane('" + id + "') {");
            lines.add("  field '" + filterField + "'");
            if (cfg.get("filterLabel") instanceof String sl && !sl.isBlank())  lines.add("  label '" + sl + "'");
            if (cfg.get("filterSort") instanceof String ss && !ss.equals("asc")) lines.add("  sort '" + ss + "'");
            if (cfg.get("filterMaxValues") instanceof Number n && n.intValue() != 500) lines.add("  maxValues " + n.intValue());
            if (Boolean.TRUE.equals(cfg.get("filterShowSearch")))  lines.add("  showSearch true");
            if (Boolean.FALSE.equals(cfg.get("filterShowSearch"))) lines.add("  showSearch false");
            if (Boolean.TRUE.equals(cfg.get("filterShowCount")))   lines.add("  showCount true");
            if (Boolean.FALSE.equals(cfg.get("filterMultiSelect"))) lines.add("  multiSelect false");
            if (cfg.get("filterHeight") instanceof String sh && !sh.equals("auto")) lines.add("  height '" + sh + "'");
            lines.add("}");
            return String.join("\n", lines);
        }).collect(Collectors.joining("\n\n"));
    }

    // ── Map Config (JSON) ─────────────────────────────────────────────────────

    private static String generateMapConfig(List<Map<String, Object>> maps) throws Exception {
        if (maps.isEmpty()) return "";
        Map<String, Object> out = new LinkedHashMap<>();
        List<String> keys = List.of("mapType", "region", "dimension", "metric",
            "latField", "lonField", "geoJsonUrl", "geoJsonKey",
            "tileUrl", "attribution", "colorScale", "zoom", "center", "fitBounds");
        for (Map<String, Object> w : maps) {
            Map<String, Object> cfg = displayConfig(w);
            Map<String, Object> entry = new LinkedHashMap<>();
            for (String k : keys) {
                Object v = cfg.get(k);
                if (v != null && !v.toString().isEmpty()) entry.put(k, v);
            }
            out.put(componentId(w), entry);
        }
        return JSON.writerWithDefaultPrettyPrinter().writeValueAsString(out) + "\n";
    }

    // ── Value / Number Config (JSON) ──────────────────────────────────────────

    private static String generateValueConfig(List<Map<String, Object>> numbers) throws Exception {
        if (numbers.isEmpty()) return "";
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, String> mapping = new LinkedHashMap<>();
        mapping.put("numberField",    "field");
        mapping.put("numberFormat",   "format");
        mapping.put("numberLabel",    "label");
        mapping.put("numberPrefix",   "prefix");
        mapping.put("numberSuffix",   "suffix");
        mapping.put("numberDecimals", "decimals");
        for (Map<String, Object> w : numbers) {
            Map<String, Object> cfg = displayConfig(w);
            Map<String, Object> entry = new LinkedHashMap<>();
            for (Map.Entry<String, String> e : mapping.entrySet()) {
                Object v = cfg.get(e.getKey());
                if (v != null && !v.toString().isEmpty()) entry.put(e.getValue(), v);
            }
            out.put(componentId(w), entry);
        }
        return JSON.writerWithDefaultPrettyPrinter().writeValueAsString(out) + "\n";
    }

    // ── Generic JSON Sidecar ──────────────────────────────────────────────────

    private static String generateJsonSidecar(List<Map<String, Object>> widgets, String... forwardKeys) throws Exception {
        if (widgets.isEmpty()) return "";
        Map<String, Object> out = new LinkedHashMap<>();
        for (Map<String, Object> w : widgets) {
            Map<String, Object> cfg = displayConfig(w);
            Map<String, Object> entry = new LinkedHashMap<>();
            for (String k : forwardKeys) {
                Object v = cfg.get(k);
                if (v != null && !v.toString().isEmpty()) entry.put(k, v);
            }
            out.put(componentId(w), entry);
        }
        return JSON.writerWithDefaultPrettyPrinter().writeValueAsString(out) + "\n";
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private static List<Map<String, Object>> byType(List<Map<String, Object>> widgets, String type) {
        return widgets.stream()
            .filter(w -> type.equals(w.get("type")))
            .collect(Collectors.toList());
    }

    /** Must match {@code ScriptAssembler.componentId()} — semantic slug + short suffix when inferrable. */
    private static String componentId(Map<String, Object> widget) {
        String type    = str(widget, "type");
        String id      = str(widget, "id");
        String stripped = id.replaceFirst("^w-", "");
        String slug    = inferSemanticSlug(type, widget);
        if (slug.isEmpty()) return type + "_" + stripped;
        int lastDash = stripped.lastIndexOf('-');
        String suffix = lastDash >= 0 ? stripped.substring(lastDash + 1) : stripped;
        return type + "_" + slug + "_" + suffix;
    }

    private static String inferSemanticSlug(String type, Map<String, Object> widget) {
        Map<String, Object> dc = displayConfig(widget);
        // Primary: field/table name derived from data binding — most precise
        String raw = switch (type) {
            case "number"      -> strOr(dc, "numberField",  "");
            case "chart"       -> { List<String> f = listOfStr(dc, "xFields");   yield f.isEmpty() ? "" : f.get(0); }
            case "tabulator"   -> visualQueryTable(widget);
            case "pivot"       -> { List<String> r = listOfStr(dc, "pivotRows"); yield r.isEmpty() ? "" : r.get(0); }
            case "filter-pane" -> strOr(dc, "filterField",  "");
            case "gauge"       -> strOr(dc, "field",        "");
            case "trend"       -> strOr(dc, "dateField",    "");
            case "sankey"      -> strOr(dc, "sourceField",  "");
            default            -> "";
        };
        if (!raw.isBlank()) return slugify(raw);
        // Fallback: user-provided title/label — semantic because the user chose it
        String label = switch (type) {
            case "number"      -> strOr(dc, "numberLabel",     "");
            case "chart"       -> strOr(dc, "chartTitle",      "");
            case "filter-pane" -> strOr(dc, "filterPaneLabel", "");
            case "gauge"       -> strOr(dc, "label",           "");
            case "trend"       -> strOr(dc, "label",           "");
            default            -> "";
        };
        return label.isBlank() ? "" : slugify(label);
    }

    private static String slugify(String s) {
        return s.toLowerCase().replaceAll("[^a-z0-9]+", "_").replaceAll("(^_+|_+$)", "");
    }

    private static String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? String.valueOf(v) : "";
    }

    private static String strOr(Map<String, Object> map, String key, String def) {
        Object v = map.get(key);
        if (v instanceof String s && !s.isBlank()) return s;
        return def;
    }

    private static boolean isCurrencyFieldName(String f) {
        String lower = f.toLowerCase();
        return lower.matches(".*(revenue|price|amount|freight|total|cost|salary|" +
                             "fee|balance|earnings|income|budget|expense|payment|value).*");
    }

    private static Map<String, Object> displayConfig(Map<String, Object> widget) {
        Object dc = widget.get("displayConfig");
        return dc instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
    }

    private static int gridInt(Map<String, Object> widget, String field) {
        Object gp = widget.get("gridPosition");
        if (gp instanceof Map<?, ?> m) {
            Object v = m.get(field);
            if (v instanceof Number n) return n.intValue();
        }
        return 0;
    }

    private static List<String> listOfStr(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v instanceof List<?> l) {
            return l.stream().filter(Objects::nonNull).map(Object::toString).collect(Collectors.toList());
        }
        return List.of();
    }

    private static String visualQueryTable(Map<String, Object> widget) {
        Object ds = widget.get("dataSource");
        if (ds instanceof Map<?, ?> dsMap) {
            Object vq = dsMap.get("visualQuery");
            if (vq instanceof Map<?, ?> vqMap) {
                Object t = vqMap.get("table");
                return t != null ? String.valueOf(t) : "";
            }
        }
        return "";
    }

    private static String escapeHtmlAttr(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
