package com.flowkraft.queries;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * What one SQL or script widget's answer is held to, on the Canvas and on a published dashboard:
 * at most {@code maxRows} rows, and no statement running longer than {@code timeoutSeconds}.
 *
 * <p>A safety net under a runaway query, not a page size. The largest answer the 25 shipped demos
 * give a widget is 23,355 rows (the fulfillment box plot over a year), so the net sits well above
 * it. Both values are set in one place, {@code DataPallas.widgets.*} in application.properties; 0
 * switches either off.
 */
@Component
public class WidgetLimits {

	/** No cap and no timeout: what a service built outside Spring, in a test, runs with. */
	public static final WidgetLimits NONE = new WidgetLimits(0, 0);

	private final int maxRows;

	private final int timeoutSeconds;

	@Autowired
	public WidgetLimits(@Value("${DataPallas.widgets.max-rows}") int maxRows,
			@Value("${DataPallas.widgets.timeout-seconds}") int timeoutSeconds) {
		this.maxRows = maxRows;
		this.timeoutSeconds = timeoutSeconds;
	}

	public int maxRows() {
		return maxRows;
	}

	public int timeoutSeconds() {
		return timeoutSeconds;
	}

	/** The rows a statement may read: one past the cap, so going over is seen, not cut off quietly. */
	public int statementMaxRows() {
		return maxRows > 0 ? maxRows + 1 : 0;
	}

	/** Whether this answer is more than a widget may show. */
	public boolean over(List<?> rows) {
		return maxRows > 0 && rows != null && rows.size() > maxRows;
	}

	/** What the widget says instead of drawing an answer that is too big. */
	public String overMessage() {
		return "This widget's answer is more than " + String.format(Locale.ROOT, "%,d", maxRows)
				+ " rows, the most a widget shows. Add a filter, a limit or a summary.";
	}

	/** The answer itself, or the refusal when it is too big. */
	public <T> List<T> held(List<T> rows) {
		if (over(rows))
			throw new IllegalStateException(overMessage());
		return rows;
	}

	/** The one row a published widget is handed instead, the way every other failure reaches it. */
	public List<LinkedHashMap<String, Object>> overRow() {
		LinkedHashMap<String, Object> row = new LinkedHashMap<>();
		row.put("ERROR_MESSAGE", overMessage());
		return new ArrayList<>(List.of(row));
	}
}
