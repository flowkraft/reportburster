package com.flowkraft.cubes;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.SQLDialect;
import org.jooq.SelectField;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.flowkraft.reporting.dsl.cube.CubeOptions;

/**
 * Generates vendor-specific SQL from a CubeOptions definition + user field selections.
 * Uses jOOQ 3.19 for dialect-aware SQL rendering (Java 17 compatible).
 *
 * Features:
 * - Auto-JOIN: detects cross-table dimension references and adds JOIN clauses
 * - Segments: selected segments become WHERE clauses
 * - Dialect-aware: PostgreSQL, MySQL, SQLite, DuckDB quoting/syntax
 */
public class CubeSqlGenerator {

	private static final Logger log = LoggerFactory.getLogger(CubeSqlGenerator.class);

	/**
	 * Generate SQL from cube metadata + user selections.
	 */
	public static String generateSql(
			CubeOptions cube,
			List<String> selectedDimensions,
			List<String> selectedMeasures,
			String dbVendor) {
		return generateSql(cube, selectedDimensions, selectedMeasures, List.of(), dbVendor);
	}

	/**
	 * Generate SQL from cube metadata + user selections + active segments.
	 */
	public static String generateSql(
			CubeOptions cube,
			List<String> selectedDimensions,
			List<String> selectedMeasures,
			List<String> selectedSegments,
			String dbVendor) {

		SQLDialect dialect = resolveDialect(dbVendor);
		DSLContext ctx = DSL.using(dialect);

		// Resolve the source table
		String tableName = cube.getSqlTable();
		if (tableName == null && cube.getSql() != null) {
			tableName = "(" + cube.getSql() + ")";
		}
		if (tableName == null) {
			return "-- No sql_table or sql defined in cube";
		}

		// Compute the rendered (dialect-quoted) base table name early so it can be
		// substituted into ${CUBE} placeholders consistently across SELECT, FROM, JOIN, WHERE.
		String renderedBaseTable;
		if (cube.getSqlTable() != null) {
			renderedBaseTable = renderTableName(ctx, cube.getSqlTable());
		} else {
			renderedBaseTable = tableName; // already wrapped in (...)
		}

		// Collect all SQL expressions to detect which joined tables are referenced
		Set<String> referencedTables = new HashSet<>();
		List<SelectField<?>> selectFields = new ArrayList<>();
		List<Field<?>> groupByFields = new ArrayList<>();

		// Dimensions → SELECT + GROUP BY
		for (String dimName : selectedDimensions) {
			Map<String, Object> dim = findMember(cube.getDimensions(), dimName);
			if (dim == null) continue;

			String sqlExpr = resolveSql(dim, renderedBaseTable);
			detectReferencedTables(sqlExpr, cube, referencedTables);

			Field<Object> field = DSL.field(sqlExpr);
			selectFields.add(field.as(dimName));
			groupByFields.add(field);
		}

		// Measures → SELECT with aggregation
		for (String measName : selectedMeasures) {
			Map<String, Object> meas = findMember(cube.getMeasures(), measName);
			if (meas == null) continue;

			String type = Objects.toString(meas.get("type"), "count").toLowerCase();
			String explicitSql = Objects.toString(meas.get("sql"), null);
			String sqlExpr = resolveSql(meas, renderedBaseTable);
			if (explicitSql != null) {
				detectReferencedTables(sqlExpr, cube, referencedTables);
			}

			SelectField<?> aggField;
			switch (type) {
				case "count":
					aggField = (explicitSql != null)
							? DSL.count(DSL.field(sqlExpr)).as(measName)
							: DSL.count().as(measName);
					break;
				case "sum":
					aggField = DSL.sum(DSL.field(sqlExpr, Double.class)).as(measName);
					break;
				case "avg":
					aggField = DSL.avg(DSL.field(sqlExpr, Double.class)).as(measName);
					break;
				case "min":
					aggField = DSL.min(DSL.field(sqlExpr)).as(measName);
					break;
				case "max":
					aggField = DSL.max(DSL.field(sqlExpr)).as(measName);
					break;
				case "count_distinct":
					aggField = DSL.countDistinct(DSL.field(sqlExpr)).as(measName);
					break;
				default:
					aggField = DSL.count().as(measName);
					break;
			}
			selectFields.add(aggField);
		}

		if (selectFields.isEmpty()) {
			return "-- No fields selected";
		}

		// Build a join lookup map for parent-chain walking
		Map<String, Map<String, Object>> joinByName = new LinkedHashMap<>();
		if (cube.getJoins() != null) {
			for (Map<String, Object> join : cube.getJoins()) {
				String n = Objects.toString(join.get("name"), "");
				if (!n.isEmpty()) joinByName.put(n, join);
			}
		}

		// Walk transitive parents for every directly-referenced join.
		// Example: if user picked Categories.CategoryName (Categories has parent=Products,
		// Products has parent="Order Details", "Order Details" has parent=CUBE), then
		// requiredJoins = ["Order Details", "Products", "Categories"] in dependency order.
		Set<String> requiredJoins = new LinkedHashSet<>();
		for (String directlyReferenced : referencedTables) {
			addJoinAndAncestors(directlyReferenced, joinByName, requiredJoins);
		}

		// Re-iterate the cube's join declaration order so JOIN clauses are emitted
		// in the order the cube author declared them (which respects dependencies).
		List<String> joinOrder = new ArrayList<>();
		if (cube.getJoins() != null) {
			for (Map<String, Object> join : cube.getJoins()) {
				String n = Objects.toString(join.get("name"), "");
				if (requiredJoins.contains(n)) joinOrder.add(n);
			}
		}

		// Build FROM clause. renderedBaseTable was computed earlier (top of method) for
		// consistency with dimension/measure ${CUBE} substitution.
		StringBuilder fromClause = new StringBuilder(renderedBaseTable);
		for (String joinName : joinOrder) {
			Map<String, Object> join = joinByName.get(joinName);
			String joinSql = Objects.toString(join.get("sql"), "");
			joinSql = joinSql.replace("${CUBE}", renderedBaseTable);
			String renderedJoinTable = renderTableName(ctx, joinName);
			fromClause.append("\nJOIN ").append(renderedJoinTable)
					.append(" ON ").append(joinSql);
		}

		// Build WHERE clause from selected segments. ${CUBE} expands to the rendered
		// (dialect-quoted) base table name for consistency with the FROM clause.
		List<String> whereClauses = new ArrayList<>();
		if (selectedSegments != null && !selectedSegments.isEmpty() && cube.getSegments() != null) {
			for (String segName : selectedSegments) {
				Map<String, Object> seg = findMember(cube.getSegments(), segName);
				if (seg != null) {
					String segSql = Objects.toString(seg.get("sql"), null);
					if (segSql != null) {
						segSql = segSql.replace("${CUBE}", renderedBaseTable);
						whereClauses.add(segSql);
					}
				}
			}
		}

		// Assemble the query manually (jOOQ doesn't support raw JOIN ON strings easily)
		StringBuilder sql = new StringBuilder();
		sql.append("SELECT\n  ");

		// Render SELECT fields using jOOQ for dialect-aware column aliases
		List<String> selectParts = new ArrayList<>();
		for (int i = 0; i < selectFields.size(); i++) {
			selectParts.add(ctx.select(selectFields.get(i)).getSQL()
					.replace("select ", "").trim());
		}
		sql.append(String.join(",\n  ", selectParts));

		sql.append("\nFROM ").append(fromClause);

		if (!whereClauses.isEmpty()) {
			sql.append("\nWHERE ").append(String.join("\n  AND ", whereClauses));
		}

		// Only GROUP BY when there are aggregations (measures)
		if (!groupByFields.isEmpty() && !selectedMeasures.isEmpty()) {
			List<String> groupParts = new ArrayList<>();
			for (Field<?> f : groupByFields) {
				groupParts.add(ctx.select(f).getSQL().replace("select ", "").trim());
			}
			sql.append("\nGROUP BY\n  ").append(String.join(",\n  ", groupParts));
			sql.append("\nORDER BY\n  ").append(groupParts.get(0));
		}

		return sql.toString();
	}

	/**
	 * Detect if an SQL expression references a joined table.
	 * Checks if the expression starts with a join name (e.g., "customers.company_name").
	 */
	private static void detectReferencedTables(String sqlExpr, CubeOptions cube, Set<String> referencedTables) {
		if (sqlExpr == null || cube.getJoins() == null) return;
		for (Map<String, Object> join : cube.getJoins()) {
			String joinName = Objects.toString(join.get("name"), "");
			if (!joinName.isEmpty() && sqlExpr.contains(joinName + ".")) {
				referencedTables.add(joinName);
			}
		}
	}

	/**
	 * Walks the parent chain for a join, adding all ancestors before the join itself.
	 * The cube source is the root, identified by parent value 'CUBE' (or missing parent,
	 * which defaults to 'CUBE' for backward compatibility with single-level cubes).
	 *
	 * Example: if Categories has parent=Products and Products has parent='Order Details',
	 * calling this with joinName='Categories' adds in order: 'Order Details', 'Products', 'Categories'.
	 */
	private static void addJoinAndAncestors(
			String joinName,
			Map<String, Map<String, Object>> joinByName,
			Set<String> requiredJoins) {
		if (joinName == null || joinName.isEmpty() || "CUBE".equals(joinName)) return;
		if (requiredJoins.contains(joinName)) return; // already added
		Map<String, Object> join = joinByName.get(joinName);
		if (join == null) return; // unknown join — silently skip
		// Recurse to parent FIRST so parent is added before child in iteration order.
		// Backward compatibility: missing parent defaults to 'CUBE' (L1 join).
		String parent = Objects.toString(join.get("parent"), "CUBE");
		addJoinAndAncestors(parent, joinByName, requiredJoins);
		requiredJoins.add(joinName);
	}

	/**
	 * Renders a table name for FROM/JOIN clauses with dialect-specific quoting.
	 *
	 * If the name already starts with a quote character ("`"), the cube author has
	 * pre-quoted it explicitly — pass it through verbatim to avoid double-quoting.
	 *
	 * Otherwise, run it through jOOQ's DSL.name() which produces dialect-correct
	 * identifier quoting (handles spaces, reserved words, case-sensitivity).
	 * For SQLite/PostgreSQL: "Order Details". For MySQL: `Order Details`.
	 */
	private static String renderTableName(DSLContext ctx, String tableName) {
		if (tableName == null || tableName.isEmpty()) return tableName;
		char first = tableName.charAt(0);
		if (first == '"' || first == '`' || first == '[' || first == '(') {
			// pre-quoted (or sub-query) — pass through verbatim
			return tableName;
		}
		return ctx.render(DSL.name(tableName));
	}

	private static Map<String, Object> findMember(List<Map<String, Object>> members, String name) {
		if (members == null) return null;
		return members.stream()
				.filter(m -> name.equals(m.get("name")))
				.findFirst()
				.orElse(null);
	}

	private static String resolveSql(Map<String, Object> member, String tableName) {
		String sql = Objects.toString(member.get("sql"), null);
		if (sql == null) {
			sql = Objects.toString(member.get("name"), null);
		}
		if (sql != null) {
			sql = sql.replace("${CUBE}", tableName);
		}
		return sql;
	}

	private static SQLDialect resolveDialect(String dbVendor) {
		if (dbVendor == null) return SQLDialect.DEFAULT;
		switch (dbVendor.toLowerCase()) {
			case "postgres":
			case "postgresql":
			case "supabase":
			case "timescaledb":
				return SQLDialect.POSTGRES;
			case "mysql":
			case "mariadb":
				return SQLDialect.MYSQL;
			case "sqlite":
				return SQLDialect.SQLITE;
			case "duckdb":
				return SQLDialect.DUCKDB;
			case "clickhouse":
				return SQLDialect.DEFAULT;
			case "sqlserver":
				return SQLDialect.DEFAULT;
			case "oracle":
				return SQLDialect.DEFAULT;
			case "ibmdb2":
			case "db2":
				return SQLDialect.DEFAULT;
			default:
				return SQLDialect.DEFAULT;
		}
	}
}
