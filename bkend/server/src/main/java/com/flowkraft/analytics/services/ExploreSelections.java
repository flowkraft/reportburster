package com.flowkraft.analytics.services;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.UnaryOperator;

import com.flowkraft.analytics.engine.dto.ExploreRequest;

/**
 * What a filter pane's selections mean, in one place.
 *
 * <p>A pane is a slicer and its values are a list: the values picked for ONE field are OR-ed
 * together - one {@code IN (…)} - and different fields are AND-ed, which is exactly the rule the
 * canvas writes into a widget's SQL and the published dashboard runs
 * ({@code pane-filters.ts}). Every value AND-ed to every other, as this was written first, made
 * two values of one pane answer no row at all.
 *
 * <p>For the STATE of one field - which of its values are still worth picking - that field's own
 * selections are left out: a pane shows which of its values the OTHER panes still allow, so the
 * values a multi-select pane has not picked yet stay live instead of being drawn as excluded by
 * the pick that sits beside them.
 *
 * <p>The vendors differ only in how an identifier is quoted, so the caller hands that in: DuckDB
 * and the rest quote with {@code "}, ClickHouse with a backtick.
 */
public final class ExploreSelections {

	private ExploreSelections() {}

	/**
	 * The condition the selections make, as SQL.
	 *
	 * @param selections  what the reader has picked, in any order
	 * @param exceptField the field whose own picks are left out (its state is being computed), or
	 *                    null to take every selection - the rows the widgets are filtered to
	 * @param quote       how this vendor quotes an identifier
	 * @return the condition, or "" when nothing is selected (and then there is nothing to filter)
	 */
	public static String where(List<ExploreRequest.Selection> selections, String exceptField,
			UnaryOperator<String> quote) {

		Map<String, Set<String>> byField = valuesByField(selections, exceptField);
		if (byField.isEmpty())
			return "";

		List<String> conditions = new ArrayList<>();
		for (Map.Entry<String, Set<String>> picked : byField.entrySet()) {
			List<String> literals = new ArrayList<>();
			for (String value : picked.getValue())
				literals.add("'" + value.replace("'", "''") + "'");
			conditions.add(quote.apply(picked.getKey()) + " IN (" + String.join(", ", literals) + ")");
		}
		return String.join(" AND ", conditions);
	}

	/** The values picked per field, in the order the fields were first picked in. */
	private static Map<String, Set<String>> valuesByField(List<ExploreRequest.Selection> selections,
			String exceptField) {

		Map<String, Set<String>> byField = new LinkedHashMap<>();
		if (selections == null)
			return byField;
		for (ExploreRequest.Selection selection : selections) {
			String field = selection.getField();
			if (field == null || field.isEmpty() || field.equals(exceptField))
				continue;
			if (selection.getValue() == null)
				continue;
			byField.computeIfAbsent(field, name -> new LinkedHashSet<>()).add(selection.getValue());
		}
		return byField;
	}
}
