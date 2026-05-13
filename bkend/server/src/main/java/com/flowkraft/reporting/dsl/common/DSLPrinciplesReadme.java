package com.flowkraft.reporting.dsl.common;

/**
 * <h1>DataPallas DSL — architecture principles (read before changing any DSL code)</h1>
 *
 * <p><b>Single source of truth for the DSL principles.</b> All other DSL-related
 * files (parsers, emitter, controller, publisher, frontend mappers) reference
 * this class via Javadoc {@code @see} so the principles live in exactly one
 * place. Updating them updates everywhere.
 *
 * <p>This is a {@code final} no-instance class — it carries no runtime code.
 * Its only purpose is to host this Javadoc as the canonical reference.
 *
 * <h2>The three principles</h2>
 *
 * <ol>
 *   <li><b>Single canonical syntax: Groovy-idiomatic block form.</b>
 *       Command-chain scalars ({@code key 'value'}, no parens), single-quoted
 *       strings, builder blocks for list-of-maps ({@code datasets { dataset { ... } }}),
 *       nested map blocks ({@code data { ... }}, {@code options { ... }}),
 *       command-chain varargs for list-of-strings ({@code rows 'a', 'b'}).
 *       No parallel/drifted alternative form is allowed.</li>
 *
 *   <li><b>DRY.</b> {@link BlockFormEmitter} is THE emitter for every DSL
 *       surface (chart, tabulator, pivot, filterpane, cube, reportparameters).
 *       Per-widget rules live in {@link BlockFormRules}. Bidirectional
 *       UI↔DSL flows through ONE controller endpoint, {@link DslController}.
 *       Do not create parallel emitter classes; do not hand-roll
 *       {@code sb.append} DSL generation. Extend the rule taxonomy here when a
 *       genuinely new pattern is needed.</li>
 *
 *   <li><b>UI ↔ DSL round-trip is contractual.</b> The bidirectional sync
 *       (TypeScript mappers in {@code lib/explore-data/dsl-sync/*-mapping.ts}
 *       + {@link DslController}) MUST stay round-trip-clean for all five UI
 *       widget types: Chart, Tabulator, Pivot, FilterPane, Parameters. A
 *       breakage anywhere in this loop must fail loud (test) — never be
 *       papered over with a "backward-compat fallback".
 * <pre>
 *   displayConfig
 *     ─uiToXxxDsl────►  Map (canonical shape — see GOOD examples below)
 *     ─BlockFormEmitter.emit─►  Groovy DSL text (block form)
 *     ─XxxOptionsScript / Helper─►  Map (same canonical shape)
 *     ─xxxDslToUi──►  displayConfig
 * </pre>
 *   </li>
 *
 *   <li><b>The DSL Map IS the canvas's render input — for all five DSL widgets.</b>
 *       The canvas widget for Chart / Tabulator / Pivot / FilterPane / Parameters
 *       MUST render from the Map produced by {@code uiToXxxDsl(displayConfig)}.
 *       The same Map that the publisher consumes (after DSL → parse round-trip)
 *       is the same Map that drives {@code <rb-XXX>} on the canvas. Concretely:
 *       each widget has a single {@code mapToXxxRenderConfig(map, data)} function;
 *       the canvas calls it directly on the {@code uiToXxxDsl} output, the
 *       publisher calls it on the parsed-DSL Map. Both arrows of {@code <rb-XXX>}
 *       consume the same Map.
 *       <p>Consequence: a bug in {@code uiToXxxDsl} is visible in the canvas at
 *       the moment of the UI gesture that triggered it — never deferred to
 *       publish-time. Drift between canvas and published is structurally
 *       impossible.
 * <pre>
 *   displayConfig
 *     ─ uiToXxxDsl ───────►  Map  ───────►  &lt;rb-XXX&gt;        (canvas live render)
 *                              │
 *                              └─► BlockFormEmitter ─► DSL text
 *                                                       │
 *                                                       └─► storage / publish
 *                                                            │
 *                                                            └─► XxxOptionsScript ─► Map ─► &lt;rb-XXX&gt;
 * </pre>
 *   </li>
 * </ol>
 *
 * <h2>Concrete GOOD vs BAD per widget type</h2>
 *
 * <h3>Chart</h3>
 * <pre>
 * ✅ GOOD — canonical nested data block, builder-block datasets:
 *     chart {
 *       type 'line'
 *       data {
 *         labelField 'ts'
 *         seriesField 'strategy_run_id'
 *         datasets {
 *           dataset { field 'equity_avg'; label 'Equity' }
 *         }
 *       }
 *       options { plugins { title { display true; text 'Equity Curve' } } }
 *     }
 *
 * ❌ BAD — flat top-level + parens-wrapped + list-of-maps literal:
 *     chart {
 *       type('line')
 *       labelField('ts')               // ← top-level setter REMOVED
 *       seriesField('strategy_run_id') // ← same — only inside data { }
 *       datasets([[field: 'equity_avg', label: 'Equity']])  // ← list-of-maps literal
 *     }
 *     // Map shape mismatch:
 *     ❌  { type, labelField, seriesField, datasets, options }   // flat
 *     ✅  { type, data: { labelField, seriesField, datasets }, options }
 * </pre>
 *
 * <h3>Tabulator</h3>
 * <pre>
 * ✅ GOOD — builder-block columns, command-chain scalars:
 *     tabulator {
 *       layout 'fitColumns'
 *       height '400px'
 *       pagination true
 *       columns {
 *         column { title 'Name';  field 'name';  width 200 }
 *         column { title 'Score'; field 'score'; sorter 'number' }
 *       }
 *     }
 *
 * ❌ BAD — list-of-maps literal for columns (what the legacy emitter produced):
 *     tabulator {
 *       layout 'fitColumns'
 *       columns([[title: 'Name', field: 'name'], [title: 'Score', field: 'score']])
 *     }
 *
 * Note: {@code methodMissing} on {@code ColumnDelegate} is intentional openness
 * (tabulator.info has ~80 column properties) — NOT drift.
 * </pre>
 *
 * <h3>Pivot</h3>
 * <pre>
 * ✅ GOOD — command-chain varargs for string lists:
 *     pivotTable {
 *       rows 'region', 'country'
 *       cols 'productLine'
 *       vals 'revenue'
 *       aggregatorName 'Sum'
 *       rendererName 'Table'
 *     }
 *
 * ❌ BAD — list-literal forms:
 *     pivotTable {
 *       rows(['region', 'country'])  // ← parens-wrapped list literal
 *       cols(['productLine'])
 *     }
 * </pre>
 *
 * <h3>FilterPane</h3>
 * <pre>
 * ✅ GOOD — flat block, single-quoted scalars (8-property fixed surface):
 *     filterPane('countryFilter') {
 *       field 'ShipCountry'
 *       label 'Country'
 *       sort 'asc'
 *       maxValues 500
 *       showSearch true
 *       multiSelect true
 *       defaultSelected 'Germany', 'France'
 *     }
 *
 * ❌ BAD — parens form:
 *     filterPane('countryFilter') {
 *       field('ShipCountry')
 *       label('Country')
 *     }
 *
 * Note: this parser is strict (no methodMissing) — typos throw, by design.
 * </pre>
 *
 * <h3>Parameters (reportParameters)</h3>
 * <pre>
 * ✅ GOOD — named-args + nested closure (block form, just structurally distinct):
 *     reportParameters {
 *       parameter(id: 'startDate', type: 'LocalDate', label: 'Start Date',
 *                 defaultValue: LocalDate.now().minusDays(30)) {
 *         constraints(required: true, min: LocalDate.now().minusDays(365))
 *         ui(widget: 'date', format: 'yyyy-MM-dd')
 *       }
 *       parameter(id: 'region', type: 'String', label: 'Region') {
 *         ui(widget: 'select', options: ['EU', 'NA', 'APAC'])
 *       }
 *     }
 *
 * ❌ BAD — list-of-maps literal (legacy emitter form, would conflict with parser):
 *     reportParameters {
 *       parameters([[id: 'startDate', type: 'LocalDate', constraints: [required: true]],
 *                   [id: 'region', type: 'String', uiHints: [widget: 'select']]])
 *     }
 *     // The DSL keyword for {@code uiHints} (the JSON key) is {@code ui}.
 *     // {@code BlockFormRules.REPORTPARAMETERS} handles the {@code uiHints → ui}
 *     // alias automatically.
 * </pre>
 *
 * <h2>Anti-patterns to refuse in code review</h2>
 *
 * <ul>
 *   <li><b>Parallel emitter</b> — a new class duplicating {@link BlockFormEmitter}
 *       logic for one widget type. Extend the rule taxonomy on
 *       {@link BlockFormEmitter} instead.</li>
 *   <li><b>Parallel parser surfaces</b> — a single {@code *OptionsScript} that
 *       supports both unnamed ({@code widget { … }}) and named
 *       ({@code widget('id') { … }}) forms MUST dispatch both closures to the
 *       SAME delegate class. Do not duplicate the field set + setters +
 *       {@code methodMissing} on the script body to mirror the named delegate's
 *       state — there must be exactly one parse-state owner per widget DSL.
 *       (Chart precedent: {@code ChartOptionsScript.chart(Closure)} routes the
 *       unnamed form through {@code NamedChartDelegate}, identical to the
 *       named form.)</li>
 *   <li><b>Hand-rolled {@code sb.append}</b> generating DSL strings in the
 *       publisher or controller. Build a Map → call {@link BlockFormEmitter}.</li>
 *   <li><b>"Backward-compat fallback"</b> in the round-trip mappers (e.g.
 *       {@code opts.data ?? opts}). If the canonical shape isn't there, fail
 *       loud — don't paper over drift.</li>
 *   <li><b>Adding top-level setters</b> in a parser to receive flat keys that
 *       belong inside a nested block (e.g. chart's {@code labelField} at top
 *       level — REMOVED, do not bring back).</li>
 *   <li><b>Different indentation / quoting between code paths.</b> All emitted
 *       DSL uses 2-space indent and single-quoted strings, period.</li>
 *   <li><b>Canvas widget reads {@code displayConfig} directly to compute its
 *       {@code <rb-XXX>} config.</b> Every canvas widget for the five DSL widget
 *       types must route through {@code uiToXxxDsl → Map → mapToXxxRenderConfig}.
 *       No parallel column / options / data-builder logic in the React widget.
 *       Per-widget {@code mapToXxxRenderConfig} is the SAME function the
 *       publisher's parser feeds into. (See Principle 4.)</li>
 * </ul>
 *
 * @see BlockFormEmitter
 * @see BlockFormRules
 * @see DslController
 */
public final class DSLPrinciplesReadme {
    private DSLPrinciplesReadme() {}

    /**
     * No-op "compile-pin" function. Important DSL files call this from a
     * {@code static {}} initializer block, creating a compile-time dependency
     * on this readme. Two effects:
     * <ol>
     *   <li>This file cannot be silently deleted — removing it breaks every
     *       caller's compile, forcing the deletion to be intentional.</li>
     *   <li>"Find usages" on this method shows every file that has agreed to
     *       follow the principles — and lands the reader on this Javadoc and
     *       the inline-comment principles inside the body.</li>
     * </ol>
     *
     * <p>The principles are repeated as comments INSIDE this function body
     * (below) so a developer who navigates to the function — by Ctrl-click /
     * Go-to-definition / Find Usages — sees them immediately in source view
     * without having to switch back to a Javadoc tooltip.
     */
    public static void iAmImportantReadme() {
        // ─────────────────────────────────────────────────────────────────────
        // DATAPALLAS DSL — ARCHITECTURE PRINCIPLES (read before changing DSL code)
        // ─────────────────────────────────────────────────────────────────────
        //
        // 1. SINGLE CANONICAL SYNTAX: Groovy-idiomatic block form.
        //    Command-chain scalars (key 'value'), single-quoted strings,
        //    builder blocks for list-of-maps (datasets { dataset { ... } }),
        //    nested map blocks (data { ... }, options { ... }),
        //    command-chain varargs for list-of-strings (rows 'a', 'b').
        //    NO parallel/drifted alternative form is allowed.
        //
        // 2. DRY. BlockFormEmitter is THE emitter for every DSL surface
        //    (chart, tabulator, pivot, filterpane, cube, reportparameters).
        //    Per-widget rules live in BlockFormRules. Bidirectional UI↔DSL
        //    flows through ONE controller, DslController. Do not create
        //    parallel emitter classes; do not hand-roll sb.append DSL.
        //    Extend the rule taxonomy on BlockFormEmitter when a genuinely
        //    new pattern is needed.
        //
        // 3. UI ↔ DSL ROUND-TRIP IS CONTRACTUAL. The bidirectional sync (TS
        //    mappers in lib/explore-data/dsl-sync/*-mapping.ts + DslController)
        //    MUST stay round-trip-clean for all five UI widget types:
        //    Chart, Tabulator, Pivot, FilterPane, Parameters.
        //
        //        displayConfig
        //          ─ uiToXxxDsl ──────►  Map (canonical shape)
        //          ─ BlockFormEmitter ►  Groovy DSL text (block form)
        //          ─ XxxOptionsScript ►  Map (same canonical shape)
        //          ─ xxxDslToUi ──────►  displayConfig
        //
        //    A breakage anywhere in this loop must fail loud (test) — never
        //    be papered over with a "backward-compat fallback".
        //
        // 4. THE DSL MAP IS THE CANVAS'S RENDER INPUT — for all five DSL widgets.
        //    The canvas widget for Chart / Tabulator / Pivot / FilterPane /
        //    Parameters MUST render from the Map produced by uiToXxxDsl(displayConfig).
        //    The same Map that the publisher consumes (after DSL→parse round-trip)
        //    is the same Map that drives <rb-XXX> on the canvas. Concretely: each
        //    widget has a single mapToXxxRenderConfig(map, data) function; the
        //    canvas calls it directly on the uiToXxxDsl output; the publisher
        //    calls it on the parsed-DSL Map. Both arrows of <rb-XXX> consume
        //    the same Map.
        //
        //    Consequence: a bug in uiToXxxDsl is visible in the canvas at the
        //    moment of the UI gesture that triggered it — never deferred to
        //    publish-time. Drift between canvas and published is structurally
        //    impossible.
        //
        //        displayConfig
        //          ─ uiToXxxDsl ───────►  Map  ───────►  <rb-XXX>      (canvas live render)
        //                                  │
        //                                  └─► BlockFormEmitter ─► DSL text
        //                                                           │
        //                                                           └─► storage / publish
        //                                                                │
        //                                                                └─► XxxOptionsScript ─► Map ─► <rb-XXX>
        //
        //    Both <rb-XXX> arrows consume the same Map. Canvas takes the short
        //    path; published takes the long path. They cannot diverge.
        //
        // ─────────────────────────────────────────────────────────────────────
        // CONCRETE GOOD vs BAD per widget type
        // ─────────────────────────────────────────────────────────────────────
        //
        // CHART
        //   ✅ GOOD — canonical nested data block, builder-block datasets:
        //       chart {
        //         type 'line'
        //         data {
        //           labelField 'ts'
        //           seriesField 'strategy_run_id'
        //           datasets {
        //             dataset { field 'equity_avg'; label 'Equity' }
        //           }
        //         }
        //         options { plugins { title { display true; text 'Equity' } } }
        //       }
        //
        //   ❌ BAD — flat top-level + parens-wrapped + list-of-maps literal:
        //       chart {
        //         type('line')
        //         labelField('ts')                // ← top-level setter REMOVED
        //         seriesField('strategy_run_id')  // ← same — only inside data {}
        //         datasets([[field: 'equity_avg', label: 'Equity']])
        //       }
        //
        //   Map shape:
        //       ✅ { type, data: { labelField, seriesField, datasets }, options }
        //       ❌ { type, labelField, seriesField, datasets, options }
        //
        // TABULATOR
        //   ✅ GOOD — builder-block columns, command-chain scalars:
        //       tabulator {
        //         layout 'fitColumns'
        //         pagination true
        //         columns {
        //           column { title 'Name';  field 'name';  width 200 }
        //           column { title 'Score'; field 'score'; sorter 'number' }
        //         }
        //       }
        //
        //   ❌ BAD — list-of-maps literal for columns (legacy emitter form):
        //       tabulator {
        //         columns([[title: 'Name', field: 'name'], ...])
        //       }
        //
        //   Note: methodMissing on ColumnDelegate is INTENTIONAL openness
        //   (tabulator.info has ~80 column properties) — NOT drift.
        //
        // PIVOT
        //   ✅ GOOD — command-chain varargs for string lists:
        //       pivotTable {
        //         rows 'region', 'country'
        //         cols 'productLine'
        //         vals 'revenue'
        //         aggregatorName 'Sum'
        //         rendererName 'Table'
        //       }
        //
        //   ❌ BAD — parens-wrapped list literals:
        //       pivotTable {
        //         rows(['region', 'country'])
        //         cols(['productLine'])
        //       }
        //
        // FILTER PANE
        //   ✅ GOOD — flat block, single-quoted scalars (8-property surface):
        //       filterPane('countryFilter') {
        //         field 'ShipCountry'
        //         label 'Country'
        //         sort 'asc'
        //         maxValues 500
        //         showSearch true
        //         multiSelect true
        //         defaultSelected 'Germany', 'France'
        //       }
        //
        //   ❌ BAD — parens form:
        //       filterPane('countryFilter') {
        //         field('ShipCountry')
        //         label('Country')
        //       }
        //
        //   This parser is STRICT (no methodMissing) — typos throw, by design.
        //
        // PARAMETERS (reportParameters)
        //   ✅ GOOD — named-args + nested closure (block form, distinct shape):
        //       reportParameters {
        //         parameter(id: 'startDate', type: 'LocalDate',
        //                   label: 'Start Date',
        //                   defaultValue: LocalDate.now().minusDays(30)) {
        //           constraints(required: true)
        //           ui(widget: 'date', format: 'yyyy-MM-dd')
        //         }
        //       }
        //
        //   ❌ BAD — list-of-maps literal (parallel emitter form):
        //       reportParameters {
        //         parameters([[id: 'startDate', type: 'LocalDate', ...]])
        //       }
        //
        //   Note: BlockFormRules.REPORTPARAMETERS handles the JSON-key
        //   alias `uiHints` → DSL keyword `ui` automatically.
        //
        // ─────────────────────────────────────────────────────────────────────
        // ANTI-PATTERNS TO REFUSE IN CODE REVIEW
        // ─────────────────────────────────────────────────────────────────────
        //
        //   • Parallel emitter — a new class duplicating BlockFormEmitter
        //     logic for one widget type. Extend the rule taxonomy instead.
        //
        //   • Parallel parser surfaces — a single *OptionsScript that supports
        //     both unnamed (widget { ... }) and named (widget('id') { ... })
        //     forms MUST dispatch BOTH closures to the same delegate class.
        //     Do not duplicate the field set + setters + methodMissing on the
        //     script body to mirror the named delegate's state — there must be
        //     exactly one parse-state owner per widget DSL. Chart precedent:
        //     ChartOptionsScript.chart(Closure) routes the unnamed form
        //     through NamedChartDelegate, identical to the named form.
        //
        //   • Hand-rolled sb.append generating DSL strings in publisher or
        //     controller. Build a Map → call BlockFormEmitter.
        //
        //   • "Backward-compat fallback" in round-trip mappers (e.g.
        //     opts.data ?? opts). If the canonical shape isn't there, fail
        //     loud — don't paper over drift.
        //
        //   • Adding top-level setters in a parser to receive flat keys that
        //     belong inside a nested block (e.g. chart's labelField at top
        //     level — REMOVED, do not bring back).
        //
        //   • Different indentation / quoting between code paths. All emitted
        //     DSL: 2-space indent, single-quoted strings. Period.
        //
        //   • Canvas widget reads displayConfig directly to compute its
        //     <rb-XXX> config. Every canvas widget for the five DSL widget
        //     types must route through uiToXxxDsl → Map → mapToXxxRenderConfig.
        //     No parallel column / options / data-builder logic in the React
        //     widget. Per-widget mapToXxxRenderConfig is the SAME function the
        //     publisher's parser feeds into. (See Principle 4.)
        //
        // ─────────────────────────────────────────────────────────────────────
        // intentionally no executable code below — this method is a compile pin
    }
}
