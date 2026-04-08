package com.flowkraft.reporting.dsl.cube;

import groovy.lang.Script;
import groovy.lang.Closure;

import java.util.*;

/**
 * Groovy DSL base for parsing Cube semantic model definitions.
 *
 * DESIGN PRINCIPLES:
 * 1. Uses standard OLAP/BI terminology (dimensions, measures, joins, segments,
 *    hierarchies) — the same vocabulary used by Cube.dev, Looker, Power BI,
 *    Tableau, and dbt since the 1990s. These are industry-standard concepts,
 *    not vendor-specific inventions.
 * 2. Each dimension/measure/join/segment uses a methodMissing catch-all so that
 *    ANY property works automatically without code changes here — same pattern
 *    as TabulatorOptionsScript.
 * 3. The cube defines WHAT data means (semantic model). Downstream DSLs (tabulator,
 *    chart, pivotTable) define HOW to display it.
 * 4. The output of getOptions() is a flat Map that can be serialized to JSON directly.
 *
 * Usage:
 *   cube {
 *     sql_table 'public.orders'
 *     title 'Orders'
 *     description 'All customer orders'
 *
 *     dimension { name 'order_id'; sql 'id'; type 'number'; primary_key true }
 *     dimension { name 'status'; sql 'status'; type 'string'; order 'asc' }
 *     dimension { name 'created_at'; sql 'created_at'; type 'time' }
 *     dimension {
 *       name 'location'; type 'geo'
 *       latitude { sql '${CUBE}.lat' }
 *       longitude { sql '${CUBE}.lng' }
 *     }
 *     dimension {
 *       name 'priority_label'; type 'string'
 *       case_ {
 *         when sql: '${CUBE}.priority = 1', label: 'High'
 *         when sql: '${CUBE}.priority = 2', label: 'Medium'
 *         else_ label: 'Low'
 *       }
 *     }
 *
 *     measure {
 *       name 'count'; type 'count'
 *       drill_members 'order_id', 'status', 'created_at'
 *     }
 *     measure {
 *       name 'completed_count'; type 'count'; sql 'id'
 *       filters { filter sql: "${CUBE}.status = 'completed'" }
 *     }
 *
 *     join { name 'customers'; sql '${CUBE}.customer_id = customers.id'; relationship 'many_to_one' }
 *     segment { name 'recent'; sql "${CUBE}.created_at >= CURRENT_DATE - INTERVAL '30 days'" }
 *     hierarchy { name 'geo'; title 'Geography'; levels 'country', 'region', 'city' }
 *   }
 */
public abstract class CubeOptionsScript extends Script {

    // Data source
    private String sqlTable;
    private String sql;
    private String sqlAlias;
    private String extends_;

    // Cube-level metadata
    private String title;
    private String description;
    private Boolean public_ = null;
    private Map<String, Object> meta = null;

    // Semantic members
    private final List<Map<String, Object>> dimensions = new ArrayList<>();
    private final List<Map<String, Object>> measures = new ArrayList<>();
    private final List<Map<String, Object>> joins = new ArrayList<>();
    private final List<Map<String, Object>> segments = new ArrayList<>();
    private final List<Map<String, Object>> hierarchies = new ArrayList<>();

    // Named blocks: id → options map
    private final Map<String, Map<String, Object>> namedOptions = new LinkedHashMap<>();

    // DSL root — unnamed (default)
    public void cube(Closure<?> body) {
        body.setDelegate(this);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
    }

    // DSL root — named block for multi-cube reports
    public void cube(String id, Closure<?> body) {
        NamedCubeDelegate delegate = new NamedCubeDelegate();
        body.setDelegate(delegate);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
        namedOptions.put(id, delegate.getOptions());
    }

    // Data source
    public void sql_table(String table) { this.sqlTable = table; }
    public void sql(String query) { this.sql = query; }
    public void sql_alias(String alias) { this.sqlAlias = alias; }
    // 'extends' is a Java reserved word
    public void extends_(String parent) { this.extends_ = parent; }

    // Cube-level metadata
    public void title(String t) { this.title = t; }
    public void description(String d) { this.description = d; }
    // 'public' is a Java reserved word
    public void public_(boolean b) { this.public_ = b; }
    public void meta(Map<String, Object> m) { this.meta = m != null ? new LinkedHashMap<>(m) : null; }

    // Dimension — closure form
    public void dimension(Closure<?> body) {
        Map<String, Object> dim = new LinkedHashMap<>();
        MemberDelegate d = new MemberDelegate(dim);
        body.setDelegate(d);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
        dimensions.add(dim);
    }

    // Dimension — map form
    public void dimension(Map<String, Object> args) {
        if (args != null) dimensions.add(new LinkedHashMap<>(args));
    }

    // Measure — closure form
    public void measure(Closure<?> body) {
        Map<String, Object> meas = new LinkedHashMap<>();
        MemberDelegate d = new MemberDelegate(meas);
        body.setDelegate(d);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
        measures.add(meas);
    }

    // Measure — map form
    public void measure(Map<String, Object> args) {
        if (args != null) measures.add(new LinkedHashMap<>(args));
    }

    // Join — closure form
    public void join(Closure<?> body) {
        Map<String, Object> j = new LinkedHashMap<>();
        MemberDelegate d = new MemberDelegate(j);
        body.setDelegate(d);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
        joins.add(j);
    }

    // Join — map form
    public void join(Map<String, Object> args) {
        if (args != null) joins.add(new LinkedHashMap<>(args));
    }

    // Segment — closure form (reusable named WHERE clause)
    public void segment(Closure<?> body) {
        Map<String, Object> seg = new LinkedHashMap<>();
        MemberDelegate d = new MemberDelegate(seg);
        body.setDelegate(d);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
        segments.add(seg);
    }

    // Segment — map form
    public void segment(Map<String, Object> args) {
        if (args != null) segments.add(new LinkedHashMap<>(args));
    }

    // Hierarchy — closure form (drill-down path through dimensions)
    public void hierarchy(Closure<?> body) {
        Map<String, Object> h = new LinkedHashMap<>();
        HierarchyDelegate d = new HierarchyDelegate(h);
        body.setDelegate(d);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
        hierarchies.add(h);
    }

    // Hierarchy — map form
    public void hierarchy(Map<String, Object> args) {
        if (args != null) hierarchies.add(new LinkedHashMap<>(args));
    }

    /** Return final options map */
    public Map<String, Object> getOptions() {
        Map<String, Object> out = new LinkedHashMap<>();
        if (sqlTable != null) out.put("sql_table", sqlTable);
        if (sql != null) out.put("sql", sql);
        if (sqlAlias != null) out.put("sql_alias", sqlAlias);
        if (extends_ != null) out.put("extends", extends_);
        if (title != null) out.put("title", title);
        if (description != null) out.put("description", description);
        if (public_ != null) out.put("public", public_);
        if (meta != null) out.put("meta", new LinkedHashMap<>(meta));
        if (!dimensions.isEmpty()) out.put("dimensions", new ArrayList<>(dimensions));
        if (!measures.isEmpty()) out.put("measures", new ArrayList<>(measures));
        if (!joins.isEmpty()) out.put("joins", new ArrayList<>(joins));
        if (!segments.isEmpty()) out.put("segments", new ArrayList<>(segments));
        if (!hierarchies.isEmpty()) out.put("hierarchies", new ArrayList<>(hierarchies));
        return out;
    }

    /** Return named options map (id → options) for multi-cube reports */
    public Map<String, Map<String, Object>> getNamedOptions() {
        return namedOptions;
    }

    @Override
    public Object run() { return null; }

    // ═══════════════════════════════════════════════════════════════════════════
    // Inner delegates
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Delegate for dimension/measure/join/segment blocks — captures any property
     * via methodMissing. Explicit methods handle structured properties:
     * - drill_members (varargs list)
     * - filters (list of filter objects)
     * - case_ (conditional when/else blocks)
     * - Closures are evaluated into nested maps (e.g. geo: latitude { sql '...' })
     */
    static class MemberDelegate {
        private final Map<String, Object> map;
        MemberDelegate(Map<String, Object> map) { this.map = map; }

        // drill_members 'order_id', 'status', 'created_at' → List<String>
        public void drill_members(String... members) {
            if (members != null) map.put("drill_members", new ArrayList<>(Arrays.asList(members)));
        }
        public void drill_members(List<String> members) {
            if (members != null) map.put("drill_members", new ArrayList<>(members));
        }

        // filters { filter sql: "..." } → List<Map>
        public void filters(Closure<?> body) {
            FiltersDelegate d = new FiltersDelegate();
            body.setDelegate(d);
            body.setResolveStrategy(Closure.DELEGATE_FIRST);
            body.call();
            map.put("filters", d.getFilters());
        }
        // filters [[sql: "..."]] → List<Map>
        @SuppressWarnings("unchecked")
        public void filters(List<Map<String, Object>> filterList) {
            if (filterList != null) map.put("filters", new ArrayList<>(filterList));
        }

        // case_ { when sql: '...', label: '...'; else_ label: '...' } → {when: [...], else: {...}}
        public void case_(Closure<?> body) {
            CaseDelegate d = new CaseDelegate();
            body.setDelegate(d);
            body.setResolveStrategy(Closure.DELEGATE_FIRST);
            body.call();
            map.put("case", d.toMap());
        }

        // Catch-all for any other property
        public Object methodMissing(String name, Object args) {
            if (args instanceof Object[]) {
                Object[] arr = (Object[]) args;
                if (arr.length == 1 && arr[0] instanceof Closure) {
                    // Closure → evaluate into nested map
                    // Enables: latitude { sql '${CUBE}.lat' }, longitude { sql '${CUBE}.lng' }
                    Map<String, Object> subMap = new LinkedHashMap<>();
                    MemberDelegate sub = new MemberDelegate(subMap);
                    Closure<?> c = (Closure<?>) arr[0];
                    c.setDelegate(sub);
                    c.setResolveStrategy(Closure.DELEGATE_FIRST);
                    c.call();
                    map.put(name, subMap);
                } else if (arr.length > 0) {
                    map.put(name, arr[0]);
                }
            } else {
                map.put(name, args);
            }
            return null;
        }
    }

    /**
     * Delegate for measure filters block:
     *   filters { filter sql: "${CUBE}.status = 'completed'" }
     */
    private static class FiltersDelegate {
        private final List<Map<String, Object>> filters = new ArrayList<>();

        public void filter(Map<String, Object> args) {
            if (args != null) filters.add(new LinkedHashMap<>(args));
        }

        public List<Map<String, Object>> getFilters() { return filters; }
    }

    /**
     * Delegate for dimension case_ blocks — conditional value mapping:
     *   case_ {
     *     when sql: '${CUBE}.priority = 1', label: 'High'
     *     when sql: '${CUBE}.priority = 2', label: 'Medium'
     *     else_ label: 'Low'
     *   }
     */
    private static class CaseDelegate {
        private final List<Map<String, Object>> whens = new ArrayList<>();
        private Map<String, Object> elseClause = null;

        public void when(Map<String, Object> args) {
            if (args != null) whens.add(new LinkedHashMap<>(args));
        }

        public void else_(Map<String, Object> args) {
            if (args != null) elseClause = new LinkedHashMap<>(args);
        }

        public Map<String, Object> toMap() {
            Map<String, Object> out = new LinkedHashMap<>();
            if (!whens.isEmpty()) out.put("when", new ArrayList<>(whens));
            if (elseClause != null) out.put("else", elseClause);
            return out;
        }
    }

    /**
     * Delegate for hierarchy blocks — handles 'levels' as a varargs list of dimension names.
     */
    private static class HierarchyDelegate {
        private final Map<String, Object> map;
        HierarchyDelegate(Map<String, Object> map) { this.map = map; }

        public void levels(String... dims) {
            if (dims != null) map.put("levels", new ArrayList<>(Arrays.asList(dims)));
        }
        public void levels(List<String> dims) {
            if (dims != null) map.put("levels", new ArrayList<>(dims));
        }

        public Object methodMissing(String name, Object args) {
            if (args instanceof Object[] && ((Object[]) args).length > 0) {
                map.put(name, ((Object[]) args)[0]);
            } else {
                map.put(name, args);
            }
            return null;
        }
    }

    /**
     * Delegate for named cube blocks — captures options independently
     * so multiple named blocks don't interfere with each other or the unnamed default.
     */
    private static class NamedCubeDelegate {
        private String sqlTable;
        private String sql;
        private String sqlAlias;
        private String extends_;
        private String title;
        private String description;
        private Boolean public_ = null;
        private Map<String, Object> meta = null;
        private final List<Map<String, Object>> dimensions = new ArrayList<>();
        private final List<Map<String, Object>> measures = new ArrayList<>();
        private final List<Map<String, Object>> joins = new ArrayList<>();
        private final List<Map<String, Object>> segments = new ArrayList<>();
        private final List<Map<String, Object>> hierarchies = new ArrayList<>();

        public void sql_table(String table) { this.sqlTable = table; }
        public void sql(String query) { this.sql = query; }
        public void sql_alias(String alias) { this.sqlAlias = alias; }
        public void extends_(String parent) { this.extends_ = parent; }
        public void title(String t) { this.title = t; }
        public void description(String d) { this.description = d; }
        public void public_(boolean b) { this.public_ = b; }
        public void meta(Map<String, Object> m) { this.meta = m != null ? new LinkedHashMap<>(m) : null; }

        public void dimension(Closure<?> body) {
            Map<String, Object> dim = new LinkedHashMap<>();
            MemberDelegate d = new MemberDelegate(dim);
            body.setDelegate(d);
            body.setResolveStrategy(Closure.DELEGATE_FIRST);
            body.call();
            dimensions.add(dim);
        }
        public void dimension(Map<String, Object> args) {
            if (args != null) dimensions.add(new LinkedHashMap<>(args));
        }

        public void measure(Closure<?> body) {
            Map<String, Object> meas = new LinkedHashMap<>();
            MemberDelegate d = new MemberDelegate(meas);
            body.setDelegate(d);
            body.setResolveStrategy(Closure.DELEGATE_FIRST);
            body.call();
            measures.add(meas);
        }
        public void measure(Map<String, Object> args) {
            if (args != null) measures.add(new LinkedHashMap<>(args));
        }

        public void join(Closure<?> body) {
            Map<String, Object> j = new LinkedHashMap<>();
            MemberDelegate d = new MemberDelegate(j);
            body.setDelegate(d);
            body.setResolveStrategy(Closure.DELEGATE_FIRST);
            body.call();
            joins.add(j);
        }
        public void join(Map<String, Object> args) {
            if (args != null) joins.add(new LinkedHashMap<>(args));
        }

        public void segment(Closure<?> body) {
            Map<String, Object> seg = new LinkedHashMap<>();
            MemberDelegate d = new MemberDelegate(seg);
            body.setDelegate(d);
            body.setResolveStrategy(Closure.DELEGATE_FIRST);
            body.call();
            segments.add(seg);
        }
        public void segment(Map<String, Object> args) {
            if (args != null) segments.add(new LinkedHashMap<>(args));
        }

        public void hierarchy(Closure<?> body) {
            Map<String, Object> h = new LinkedHashMap<>();
            HierarchyDelegate d = new HierarchyDelegate(h);
            body.setDelegate(d);
            body.setResolveStrategy(Closure.DELEGATE_FIRST);
            body.call();
            hierarchies.add(h);
        }
        public void hierarchy(Map<String, Object> args) {
            if (args != null) hierarchies.add(new LinkedHashMap<>(args));
        }

        public Map<String, Object> getOptions() {
            Map<String, Object> out = new LinkedHashMap<>();
            if (sqlTable != null) out.put("sql_table", sqlTable);
            if (sql != null) out.put("sql", sql);
            if (sqlAlias != null) out.put("sql_alias", sqlAlias);
            if (extends_ != null) out.put("extends", extends_);
            if (title != null) out.put("title", title);
            if (description != null) out.put("description", description);
            if (public_ != null) out.put("public", public_);
            if (meta != null) out.put("meta", new LinkedHashMap<>(meta));
            if (!dimensions.isEmpty()) out.put("dimensions", new ArrayList<>(dimensions));
            if (!measures.isEmpty()) out.put("measures", new ArrayList<>(measures));
            if (!joins.isEmpty()) out.put("joins", new ArrayList<>(joins));
            if (!segments.isEmpty()) out.put("segments", new ArrayList<>(segments));
            if (!hierarchies.isEmpty()) out.put("hierarchies", new ArrayList<>(hierarchies));
            return out;
        }
    }
}
