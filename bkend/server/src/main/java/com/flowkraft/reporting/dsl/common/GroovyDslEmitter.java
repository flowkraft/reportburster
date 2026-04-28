package com.flowkraft.reporting.dsl.common;

import java.util.List;
import java.util.Map;

/**
 * Emits an options map back into Groovy DSL text.
 *
 * Handles the value shapes the DSL parsers actually produce:
 *   - Primitives: String, Number, Boolean, null
 *   - Lists of primitives → list literal [1, 2, 3]
 *   - Lists of maps     → list-of-maps literal [[...], [...]]
 *   - Nested maps       → nested block: key { ... }
 *
 * Re-parsing the emitted text is the round-trip contract. Comments and
 * original formatting are NOT preserved (the parsers don't expose them),
 * but every semantically relevant key/value survives.
 */
public final class GroovyDslEmitter {

    private GroovyDslEmitter() {}

    /** Emit a top-level DSL block: `rootKeyword { ... }`. */
    public static String emit(String rootKeyword, Map<String, Object> options) {
        StringBuilder sb = new StringBuilder();
        sb.append(rootKeyword).append(" {\n");
        emitBlock(sb, options, 1);
        sb.append("}\n");
        return sb.toString();
    }

    /** Emit a top-level DSL block with an id: `rootKeyword('id') { ... }`. */
    public static String emitNamed(String rootKeyword, String id, Map<String, Object> options) {
        StringBuilder sb = new StringBuilder();
        sb.append(rootKeyword).append("('").append(escapeSingle(id)).append("') {\n");
        emitBlock(sb, options, 1);
        sb.append("}\n");
        return sb.toString();
    }

    private static void emitBlock(StringBuilder sb, Map<String, Object> block, int indent) {
        for (Map.Entry<String, Object> e : block.entrySet()) {
            emitEntry(sb, e.getKey(), e.getValue(), indent);
        }
    }

    @SuppressWarnings("unchecked")
    private static void emitEntry(StringBuilder sb, String key, Object value, int indent) {
        if (value == null) return;
        String pad = pad(indent);

        if (value instanceof Map<?, ?> map) {
            sb.append(pad).append(key).append(" {\n");
            emitBlock(sb, (Map<String, Object>) map, indent + 1);
            sb.append(pad).append("}\n");
            return;
        }

        // Always use explicit parens for arguments — command-chain syntax
        // (`key value`) is ambiguous for Lists (parsed as indexing) and
        // Maps (parsed as access). Parens keep emission unambiguous for
        // every value shape.
        if (value instanceof List<?> list) {
            sb.append(pad).append(key).append("(").append(emitList(list, indent)).append(")\n");
            return;
        }

        sb.append(pad).append(key).append("(").append(emitScalar(value)).append(")\n");
    }

    @SuppressWarnings("unchecked")
    private static String emitList(List<?> list, int indent) {
        if (list.isEmpty()) return "[]";
        boolean allPrimitive = list.stream().allMatch(GroovyDslEmitter::isPrimitive);
        if (allPrimitive) {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(emitScalar(list.get(i)));
            }
            sb.append("]");
            return sb.toString();
        }
        // List of maps or mixed — multi-line list literal
        String pad = pad(indent);
        String innerPad = pad(indent + 1);
        StringBuilder sb = new StringBuilder("[\n");
        for (int i = 0; i < list.size(); i++) {
            Object item = list.get(i);
            sb.append(innerPad);
            if (item instanceof Map<?, ?> map) {
                sb.append(emitMapLiteral((Map<String, Object>) map, indent + 1));
            } else if (item instanceof List<?> inner) {
                sb.append(emitList(inner, indent + 1));
            } else {
                sb.append(emitScalar(item));
            }
            if (i < list.size() - 1) sb.append(",");
            sb.append("\n");
        }
        sb.append(pad).append("]");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static String emitMapLiteral(Map<String, Object> map, int indent) {
        if (map.isEmpty()) return "[:]";
        String pad = pad(indent);
        String innerPad = pad(indent + 1);
        StringBuilder sb = new StringBuilder("[\n");
        int i = 0;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            sb.append(innerPad).append(quoteKey(e.getKey())).append(": ");
            Object v = e.getValue();
            if (v instanceof Map<?, ?> nested) {
                sb.append(emitMapLiteral((Map<String, Object>) nested, indent + 1));
            } else if (v instanceof List<?> l) {
                sb.append(emitList(l, indent + 1));
            } else {
                sb.append(emitScalar(v));
            }
            if (++i < map.size()) sb.append(",");
            sb.append("\n");
        }
        sb.append(pad).append("]");
        return sb.toString();
    }

    private static String emitScalar(Object v) {
        if (v == null) return "null";
        if (v instanceof String s) return "'" + escapeSingle(s) + "'";
        if (v instanceof Boolean) return v.toString();
        if (v instanceof Number) return v.toString();
        // Fallback: stringify
        return "'" + escapeSingle(String.valueOf(v)) + "'";
    }

    private static boolean isPrimitive(Object v) {
        return v == null || v instanceof String || v instanceof Number || v instanceof Boolean;
    }

    private static String escapeSingle(String s) {
        return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
    }

    private static String quoteKey(String k) {
        // Groovy map literal keys must be quoted if they aren't valid identifiers.
        if (k.matches("[a-zA-Z_][a-zA-Z0-9_]*")) return k;
        return "'" + escapeSingle(k) + "'";
    }

    private static String pad(int indent) {
        return "    ".repeat(indent);
    }
}
