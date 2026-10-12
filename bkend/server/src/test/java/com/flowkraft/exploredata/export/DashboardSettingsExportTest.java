package com.flowkraft.exploredata.export;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

/**
 * What the canvas's dashboard settings put into the published template (#22): a dashboard set to
 * refresh says how often on its root, where rb-dashboard reads it, and every other dashboard is
 * written exactly as before.
 */
class DashboardSettingsExportTest {

	private static String templateWith(Map<String, Object> settings) throws Exception {
		return DashboardFileGenerator.generate(List.of(), List.of(), "e2e-settings", "http://localhost:9090/api",
				"conn", settings).templateHtml();
	}

	@Test
	void a_dashboard_set_to_refresh_says_how_often_on_its_root() throws Exception {
		assertTrue(templateWith(Map.of("autoRefreshMinutes", 5))
				.contains("<div class=\"rb-dashboard-root\" data-auto-refresh=\"5\">"));
	}

	@Test
	void a_dashboard_with_no_setting_is_written_as_before() throws Exception {
		String before = DashboardFileGenerator.generate(List.of(), List.of(), "e2e-settings", "http://localhost:9090/api",
				"conn").templateHtml();
		assertTrue(before.contains("<div class=\"rb-dashboard-root\">"));
		assertTrue(before.equals(templateWith(Map.of())), "no settings: the same bytes");
	}

	@Test
	void anything_but_a_whole_number_from_one_up_is_never() throws Exception {
		Map<String, Object> withNull = new HashMap<>();
		withNull.put("autoRefreshMinutes", null);
		for (Map<String, Object> settings : List.of(Map.<String, Object>of("autoRefreshMinutes", 0),
				Map.<String, Object>of("autoRefreshMinutes", 1.5), Map.<String, Object>of("autoRefreshMinutes", "5"),
				Map.<String, Object>of("autoRefreshMinutes", -3), withNull)) {
			assertFalse(templateWith(settings).contains("data-auto-refresh"), String.valueOf(settings));
		}
	}

	@Test
	void on_paper_the_page_is_white_and_no_tile_is_cut_in_two() throws Exception {
		String template = templateWith(Map.of());
		assertTrue(template.contains("@media print {"));
		assertTrue(template.contains(".rb-dashboard-root .grid-item { break-inside: avoid; box-shadow: none; }"));
	}
}
