package com.flowkraft.reporting.dsl.reportparameters;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Serializes a list of parameter descriptors back into the reportParameters DSL.
 *
 * Input shape (matches {@code ReportParameter} / frontend {@code ParamMeta}):
 * <pre>
 *   [
 *     { id, type, label, description, defaultValue,
 *       constraints: { required, min, max, … },
 *       uiHints:     { widget, options, … } }
 *   ]
 * </pre>
 *
 * Output (round-trip safe with
 * {@code ReportParametersHelper.parseGroovyParametersDslCode}):
 * <pre>
 *   reportParameters {
 *       parameter(id: 'startDate', type: 'Date', label: 'Start Date') {
 *           constraints(required: true)
 *           ui(widget: 'datepicker')
 *       }
 *   }
 * </pre>
 *
 * Note on {@code type}: the DSL parser accepts both a bare class reference
 * ({@code type: Date}) and a quoted string ({@code type: 'Date'}) — the
 * {@code ReportParametersHelper} converts both to a simple {@code String}
 * via {@code getSimpleName()} or {@code String.valueOf()}. We always emit the
 * quoted form so the emitter stays type-safe and avoids GroovyShell class-
 * resolution differences across runtimes.
 */
public final class ReportParametersEmitter {

    private static final String I1 = "    ";   // 4 spaces – level 1
    private static final String I2 = "        "; // 8 spaces – level 2

    private ReportParametersEmitter() {}

    /** Entry point: convert a list of raw parameter maps → Groovy DSL text. */
    @SuppressWarnings("unchecked")
    public static String emit(List<?> rawParameters) {
        StringBuilder sb = new StringBuilder();
        sb.append("reportParameters {\n");
        for (Object rawParam : rawParameters) {
            if (!(rawParam instanceof Map<?, ?> m)) continue;
            emitParameter(sb, (Map<String, Object>) m);
        }
        sb.append("}\n");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static void emitParameter(StringBuilder sb, Map<String, Object> param) {
        Map<String, Object> constraints = asMap(param.get("constraints"));
        // JSON uses "uiHints" (ReportParameter field name); DSL keyword is "ui"
        Map<String, Object> ui = asMap(param.get("uiHints"));
        boolean hasBlock = !constraints.isEmpty() || !ui.isEmpty();

        sb.append(I1).append("parameter(");

        List<String> args = new ArrayList<>();
        appendNamedArg(args, "id",           param.get("id"));
        appendNamedArg(args, "type",         param.get("type"));
        appendNamedArg(args, "label",        param.get("label"));
        appendNamedArg(args, "description",  param.get("description"));
        appendNamedArg(args, "defaultValue", param.get("defaultValue"));
        sb.append(String.join(", ", args));
        sb.append(")");

        if (hasBlock) {
            sb.append(" {\n");
            if (!constraints.isEmpty()) {
                sb.append(I2).append("constraints(");
                sb.append(emitNamedArgs(constraints));
                sb.append(")\n");
            }
            if (!ui.isEmpty()) {
                sb.append(I2).append("ui(");
                sb.append(emitNamedArgs(ui));
                sb.append(")\n");
            }
            sb.append(I1).append("}\n");
        } else {
            sb.append("\n");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static void appendNamedArg(List<String> out, String key, Object value) {
        if (value == null) return;
        String s = String.valueOf(value);
        if (s.isBlank()) return;
        out.add(key + ": " + emitScalar(value));
    }

    @SuppressWarnings("unchecked")
    private static String emitNamedArgs(Map<String, Object> map) {
        List<String> parts = new ArrayList<>();
        for (Map.Entry<String, Object> e : map.entrySet()) {
            Object v = e.getValue();
            if (v == null) continue;
            String rendered;
            if (v instanceof List<?> list) {
                rendered = emitList(list);
            } else if (v instanceof Map<?, ?> nested) {
                rendered = emitMapLiteral((Map<String, Object>) nested);
            } else {
                rendered = emitScalar(v);
            }
            parts.add(e.getKey() + ": " + rendered);
        }
        return String.join(", ", parts);
    }

    private static String emitList(List<?> list) {
        if (list.isEmpty()) return "[]";
        List<String> items = new ArrayList<>();
        for (Object item : list) items.add(emitScalar(item));
        return "[" + String.join(", ", items) + "]";
    }

    private static String emitMapLiteral(Map<String, Object> map) {
        if (map.isEmpty()) return "[:]";
        List<String> parts = new ArrayList<>();
        for (Map.Entry<String, Object> e : map.entrySet())
            parts.add(e.getKey() + ": " + emitScalar(e.getValue()));
        return "[" + String.join(", ", parts) + "]";
    }

    /** Scalar emitter: booleans and numbers unquoted, everything else single-quoted. */
    private static String emitScalar(Object v) {
        if (v == null) return "null";
        if (v instanceof Boolean) return v.toString();
        if (v instanceof Number)  return v.toString();
        return "'" + String.valueOf(v)
                .replace("\\", "\\\\")
                .replace("'",  "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                + "'";
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object v) {
        return (v instanceof Map<?, ?> m) ? (Map<String, Object>) m : Collections.emptyMap();
    }
}
