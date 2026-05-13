package com.flowkraft.reporting.dsl.common;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * <h2>BlockFormEmitter — the single canonical DSL emitter.</h2>
 *
 * <p>See {@link DSLPrinciplesReadme#iAmImportantReadme()} for full DSL
 * architecture principles + concrete GOOD/BAD examples per widget type.
 * Static init below compile-pins this class to that readme.
 *
 * <p>Emits an options Map back into Groovy DSL text in <b>block form</b> style
 * — idiomatic Groovy / Gradle-flavoured output. Used by every DSL surface:
 * chart, tabulator, pivot, filter-pane, cube, reportparameters.
 *
 * <p>Output conventions (in priority order):
 * <ul>
 *   <li><b>Scalars</b>: {@code key 'value'} — command-chain syntax (no parens),
 *       matches Gradle / MarkupBuilder idiom. Groovy treats {@code key 'v'} and
 *       {@code key('v')} identically at parse time.</li>
 *   <li><b>List of primitives</b>: {@code key 'a', 'b', 'c'} — varargs form,
 *       command-chain. Empty lists are skipped.</li>
 *   <li><b>List of maps with a registered builder rule</b>:
 *       {@code key { item { k 'v' }; item { k 'v' } }} — nested builder block.
 *       The singular item name comes from the rule (e.g. {@code datasets → dataset}).</li>
 *   <li><b>List of maps WITHOUT a rule</b>: falls back to {@code key([[a:b], ...])}
 *       literal — preserves backward compat for ad-hoc list shapes.</li>
 *   <li><b>Nested map</b>: {@code key { ... }} block.</li>
 * </ul>
 *
 * <p>Round-trip contract: the emitted text re-parses to a Map equivalent to the
 * input (modulo comments and original formatting, which the parsers don't expose).
 *
 * <p>Builder rules are static per widget type (see {@link BlockFormRules}).
 * Adding a new widget type or a new builder-block field is a one-line declaration.
 */
public final class BlockFormEmitter {

    static { DSLPrinciplesReadme.iAmImportantReadme(); }

    private BlockFormEmitter() {}

    /** Sealed taxonomy of plural-key emission rules. Each variant tells the
     *  emitter how to render a list-of-maps under a given key. */
    public sealed interface PluralRule
        permits BuilderBlock, NamedArgsBlock {}

    /** List-of-maps → builder block. Emits as
     *  {@code key { item { k 'v' } item { k 'v' } }}. Use for chart's {@code datasets}
     *  and tabulator's {@code columns}.
     *
     *  <p>{@code inlineMaps}: when true, any Map-valued entry inside an item of this block
     *  is emitted as an inline literal {@code key([k: v])} rather than a closure block
     *  {@code key { k 'v' }}. Set this on builder blocks whose item parser uses only
     *  {@code methodMissing} (no explicit closure-accepting methods) — e.g. tabulator's
     *  {@code column} block, where every property including Map-valued ones like
     *  {@code formatterParams} goes through {@code ColumnDelegate.methodMissing}. */
    public record BuilderBlock(String singularName, boolean inlineMaps) implements PluralRule {
        public BuilderBlock(String singularName) { this(singularName, false); }
    }

    /** List-of-maps → named-args block. Emits each list entry as
     *  {@code item(headerK1: v1, headerK2: v2) { sub1(k: v); sub2(k: v) }}.
     *  Use for the report-parameters pattern: keys NOT in {@code subBlockKeys} go inline
     *  as named-arguments to the item method; keys in {@code subBlockKeys} produce
     *  method-call statements inside the item's closure.
     *  <p>{@code keyAliases}: optionally remaps a sub-block JSON key to a different DSL
     *  keyword (e.g. {@code uiHints → ui}).
     *  <p>{@code wrap}: when true, items are wrapped in {@code key { ... }};
     *  when false, items are emitted as direct children of the parent block
     *  (use for {@code reportParameters} where {@code parameter(...)} calls
     *  are direct children — there's no {@code parameters { }} sub-block). */
    public record NamedArgsBlock(
        String singularName,
        Set<String> subBlockKeys,
        Map<String, String> keyAliases,
        boolean wrap
    ) implements PluralRule {
        public NamedArgsBlock(String singularName, Set<String> subBlockKeys) {
            this(singularName, subBlockKeys, Collections.emptyMap(), true);
        }
        public NamedArgsBlock(String singularName, Set<String> subBlockKeys,
                              Map<String, String> keyAliases) {
            this(singularName, subBlockKeys, keyAliases, true);
        }
    }

    /** Emit a top-level DSL block: {@code rootKeyword { ... }}. */
    public static String emit(String rootKeyword, Map<String, Object> options,
                              Map<String, PluralRule> rules) {
        StringBuilder sb = new StringBuilder();
        sb.append(rootKeyword).append(" {\n");
        emitBlock(sb, options, 1, rules, false, false);
        sb.append("}\n");
        return sb.toString();
    }

    /** Emit a top-level DSL block with an id: {@code rootKeyword('id') { ... }}.
     *  Backward-compat overload — {@code rootInlineMaps=false}, same as previous behaviour. */
    public static String emitNamed(String rootKeyword, String id, Map<String, Object> options,
                                   Map<String, PluralRule> rules) {
        return emitNamed(rootKeyword, id, options, rules, false);
    }

    /** Emit a top-level DSL block with an id: {@code rootKeyword('id') { ... }}.
     *
     *  <p>{@code rootInlineMaps}: when true, both Map-valued and List-valued entries at
     *  the root level are emitted as inline literals rather than closure blocks or varargs.
     *  Set this for widgets whose root-level parser uses {@code methodMissing} for property
     *  storage (e.g. tabulator's {@code rowHeader}, {@code columnDefaults},
     *  {@code paginationSizeSelector}, pivot's {@code sorters}).
     *  Both flags are set from the same boolean because both stem from the same structural
     *  property: {@code methodMissing} stores only {@code args[0]}, so varargs lists
     *  ({@code key 'a', 'b'}) and closure blocks ({@code key { ... }}) both lose data.
     *  Plural-rule keys (e.g. {@code columns}) are unaffected — their rule check
     *  runs before the inline-literal branch. */
    public static String emitNamed(String rootKeyword, String id, Map<String, Object> options,
                                   Map<String, PluralRule> rules, boolean rootInlineMaps) {
        StringBuilder sb = new StringBuilder();
        sb.append(rootKeyword).append("('").append(escapeSingle(id)).append("') {\n");
        emitBlock(sb, options, 1, rules, rootInlineMaps, rootInlineMaps);
        sb.append("}\n");
        return sb.toString();
    }

    /**
     * @param inlineMaps  when true, Map-valued entries emit as inline literals (not closure blocks)
     * @param inlineLists when true, List-valued entries emit as inline literals — skips both
     *                    varargs (which loses elements past args[0]) and BuilderBlock rules
     *                    (which produce a Closure). Set both from {@link BuilderBlock#inlineMaps()}
     *                    so items inside a pure-methodMissing block always round-trip correctly.
     */
    private static void emitBlock(StringBuilder sb, Map<String, Object> block, int indent,
                                  Map<String, PluralRule> rules,
                                  boolean inlineMaps, boolean inlineLists) {
        for (Map.Entry<String, Object> e : block.entrySet()) {
            emitEntry(sb, e.getKey(), e.getValue(), indent, rules, inlineMaps, inlineLists);
        }
    }

    @SuppressWarnings("unchecked")
    private static void emitEntry(StringBuilder sb, String key, Object value, int indent,
                                  Map<String, PluralRule> rules,
                                  boolean inlineMaps, boolean inlineLists) {
        if (value == null) return;
        String pad = pad(indent);

        // Nested map: if we're inside a block whose parser uses only methodMissing
        // (inlineMaps=true), emit as inline literal so it re-parses as a Map, not a Closure.
        // Otherwise emit as a closure block for explicit DSL sub-scopes.
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> m = (Map<String, Object>) map;
            if (m.isEmpty()) return; // Skip empty blocks.
            if (inlineMaps) {
                sb.append(pad).append(key).append("(").append(emitMapInline(m)).append(")\n");
                return;
            }
            sb.append(pad).append(key).append(" {\n");
            emitBlock(sb, m, indent + 1, rules, false, false);
            sb.append(pad).append("}\n");
            return;
        }

        if (value instanceof List<?> list) {
            if (list.isEmpty()) return; // Skip empty lists.

            // Registered plural rules take priority over inlineLists — even inside pure-methodMissing
            // blocks, the BuilderBlock rule defines the exact DSL form for that key (e.g. columns →
            // column { ... }). Without this ordering, columns would be emitted as a literal list when
            // rootInlineMaps=true, breaking the tabulator DSL.
            PluralRule rule = rules == null ? null : rules.get(key);
            if (rule != null && list.stream().allMatch(it -> it instanceof Map<?, ?>)) {
                if (rule instanceof BuilderBlock bb) {
                    emitBuilderBlock(sb, key, list, indent, bb, rules);
                    return;
                }
                if (rule instanceof NamedArgsBlock nab) {
                    emitNamedArgsBlock(sb, key, list, indent, nab);
                    return;
                }
            }

            // When inlineLists=true: we're inside a pure-methodMissing block (e.g. column {})
            // or at the root of a methodMissing-based widget (tabulator, pivot).
            // ALL remaining list values must be inline literals because:
            //   varargs (key 'a', 'b') → methodMissing stores only args[0]='a' (loses the rest)
            //   builder-block (key { item { ... } }) → methodMissing stores a Closure, not a List
            // Only key([...]) stores the full List as args[0]. ✅
            // Real-world example: paginationSizeSelector=[3,6,8,10] at tabulator root — varargs
            // form loses all but the first element since TabulatorOptionsScript uses methodMissing.
            if (inlineLists) {
                sb.append(pad).append(key).append("(").append(emitListLiteral(list, indent)).append(")\n");
                return;
            }

            // List of primitives → command-chain varargs: key 'a', 'b', 'c'
            if (list.stream().allMatch(BlockFormEmitter::isPrimitive)) {
                StringBuilder args = new StringBuilder();
                for (int i = 0; i < list.size(); i++) {
                    if (i > 0) args.append(", ");
                    args.append(emitScalar(list.get(i)));
                }
                sb.append(pad).append(key).append(" ").append(args).append("\n");
                return;
            }

            // List of maps without a rule, or mixed list — fall back to literal.
            sb.append(pad).append(key).append("(").append(emitListLiteral(list, indent)).append(")\n");
            return;
        }

        // Scalar → command-chain (no parens) for Groovy-idiomatic flow.
        sb.append(pad).append(key).append(" ").append(emitScalar(value)).append("\n");
    }

    private static void emitBuilderBlock(StringBuilder sb, String key, List<?> list, int indent,
                                          BuilderBlock rule, Map<String, PluralRule> rules) {
        String pad = pad(indent);
        String innerPad = pad(indent + 1);
        sb.append(pad).append(key).append(" {\n");
        for (Object item : list) {
            Map<String, Object> entry = (Map<String, Object>) item;
            sb.append(innerPad).append(rule.singularName()).append(" {\n");
            // inlineMaps=true means item parser uses ONLY methodMissing — it has no explicit
            // closure-accepting methods. Therefore NO plural rule applies inside items (applying
            // a BuilderBlock rule inside would produce Closures that methodMissing stores as-is).
            // Pass null for rules so nested lists (e.g. column groups' inner columns=[...]) fall
            // through to the inlineLists=true literal branch, not the BuilderBlock branch.
            // Real-world: Tabulator column groups have nested columns=[{...},{...}] inside a
            // column { } — with rules != null, the "columns" BuilderBlock rule fires and
            // ColumnDelegate.methodMissing stores a Closure, breaking the round-trip.
            Map<String, PluralRule> innerRules = rule.inlineMaps() ? null : rules;
            emitBlock(sb, entry, indent + 2, innerRules, rule.inlineMaps(), rule.inlineMaps());
            sb.append(innerPad).append("}\n");
        }
        sb.append(pad).append("}\n");
    }

    /** Emit a list-of-maps as {@code key { item(headerArgs) { subBlockCalls } ... }}
     *  when {@code rule.wrap()} is true; or as items directly at the current indent
     *  (no wrapping {@code key { }}) when {@code rule.wrap()} is false. */
    @SuppressWarnings("unchecked")
    private static void emitNamedArgsBlock(StringBuilder sb, String key, List<?> list, int indent,
                                           NamedArgsBlock rule) {
        // When wrap=false, items become direct children of the parent block —
        // skip the wrapping `key {` and emit each item at the current indent.
        int itemIndent = rule.wrap() ? indent + 1 : indent;
        String itemPad = pad(itemIndent);
        String bodyPad = pad(itemIndent + 1);
        if (rule.wrap()) {
            sb.append(pad(indent)).append(key).append(" {\n");
        }
        for (Object item : list) {
            Map<String, Object> entry = (Map<String, Object>) item;
            // Split keys: header (inline named-args) vs sub-blocks (method calls in body).
            StringBuilder headerArgs = new StringBuilder();
            int headerCount = 0;
            for (Map.Entry<String, Object> e : entry.entrySet()) {
                if (rule.subBlockKeys().contains(e.getKey())) continue;
                Object v = e.getValue();
                if (v == null) continue;
                if (v instanceof String s && s.isBlank()) continue;
                if (headerCount++ > 0) headerArgs.append(", ");
                headerArgs.append(e.getKey()).append(": ").append(emitNamedArgValue(v));
            }
            sb.append(itemPad).append(rule.singularName()).append("(").append(headerArgs).append(")");

            // Sub-block body: emit each subBlockKey as a method call with named-args.
            boolean hasBody = false;
            StringBuilder body = new StringBuilder();
            for (String subKey : rule.subBlockKeys()) {
                Object subVal = entry.get(subKey);
                if (!(subVal instanceof Map<?, ?> subMap) || ((Map<?, ?>) subMap).isEmpty()) continue;
                String dslKeyword = rule.keyAliases().getOrDefault(subKey, subKey);
                body.append(bodyPad).append(dslKeyword).append("(")
                    .append(emitNamedArgsInline((Map<String, Object>) subMap))
                    .append(")\n");
                hasBody = true;
            }
            if (hasBody) {
                sb.append(" {\n").append(body).append(itemPad).append("}\n");
            } else {
                sb.append("\n");
            }
        }
        if (rule.wrap()) {
            sb.append(pad(indent)).append("}\n");
        }
    }

    /** Emit a Map as inline named-args: {@code k1: v1, k2: v2}. */
    private static String emitNamedArgsInline(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder();
        int i = 0;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            Object v = e.getValue();
            if (v == null) continue;
            if (i++ > 0) sb.append(", ");
            sb.append(e.getKey()).append(": ").append(emitNamedArgValue(v));
        }
        return sb.toString();
    }

    /** Emit a value in named-arg position: scalars quoted, lists as {@code [a, b]},
     *  maps as {@code [k: v]} literal. Different from block-position emission. */
    @SuppressWarnings("unchecked")
    private static String emitNamedArgValue(Object v) {
        if (v instanceof List<?> list) {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(", ");
                Object item = list.get(i);
                if (item instanceof Map<?, ?> nested) sb.append(emitMapInline((Map<String, Object>) nested));
                else if (item instanceof List<?> inner) sb.append(emitNamedArgValue(inner));
                else sb.append(emitScalar(item));
            }
            sb.append("]");
            return sb.toString();
        }
        if (v instanceof Map<?, ?> map) {
            return emitMapInline((Map<String, Object>) map);
        }
        return emitScalar(v);
    }

    private static String emitMapInline(Map<String, Object> map) {
        if (map.isEmpty()) return "[:]";
        StringBuilder sb = new StringBuilder("[");
        int i = 0;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (i++ > 0) sb.append(", ");
            sb.append(quoteKey(e.getKey())).append(": ").append(emitNamedArgValue(e.getValue()));
        }
        sb.append("]");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static String emitListLiteral(List<?> list, int indent) {
        if (list.isEmpty()) return "[]";
        String pad = pad(indent);
        String innerPad = pad(indent + 1);
        StringBuilder sb = new StringBuilder("[\n");
        for (int i = 0; i < list.size(); i++) {
            Object item = list.get(i);
            sb.append(innerPad);
            if (item instanceof Map<?, ?> map) {
                sb.append(emitMapLiteral((Map<String, Object>) map, indent + 1));
            } else if (item instanceof List<?> inner) {
                sb.append(emitListLiteral(inner, indent + 1));
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
                sb.append(emitListLiteral(l, indent + 1));
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
        return "'" + escapeSingle(String.valueOf(v)) + "'";
    }

    private static boolean isPrimitive(Object v) {
        return v == null || v instanceof String || v instanceof Number || v instanceof Boolean;
    }

    private static String escapeSingle(String s) {
        return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
    }

    private static String quoteKey(String k) {
        if (k.matches("[a-zA-Z_][a-zA-Z0-9_]*")) return k;
        return "'" + escapeSingle(k) + "'";
    }

    private static String pad(int indent) {
        return "  ".repeat(indent);
    }
}
