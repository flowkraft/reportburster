package com.flowkraft.exploredata.export;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.InputStream;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.flowkraft.exploredata.export.DashboardDemos.Demo;

/**
 * No tile of the 25 demos comes near the row cap a widget's answer is held to.
 *
 * <p>The cap ({@code DataPallas.widgets.max-rows}) is a safety net under every SQL and script
 * widget. A net the shipped demos touch is no net: it would change what they show. So every tile is
 * asked as the published dashboard asks it, at the defaults and under every interaction its
 * {@code checks.json} lists, and the largest answer must stay a long way under the cap.
 */
class DashboardDemosRowCountsTest {

	/** How many times the largest shipped answer the cap must hold. */
	private static final int HEADROOM = 4;

	@Test
	@DisplayName("No tile of the 25 demos is handed anywhere near the widget row cap")
	void noTileComesNearTheCap() throws Exception {

		Connection connection = DashboardDemos.dashDemo();
		int largest = 0;
		String where = "";
		int answers = 0;

		for (Demo demo : DashboardDemos.all()) {
			List<String> runs = new ArrayList<>();
			runs.add("defaults");
			for (Map<String, Object> interaction : demo.interactions())
				runs.add(Objects.toString(interaction.get("id"), ""));
			for (String run : runs)
				for (Map.Entry<String, List<Map<String, Object>>> tile : DashboardDemos
						.answers(demo, demo.paramsOf(run), connection).entrySet()) {
					answers++;
					if (tile.getValue().size() > largest) {
						largest = tile.getValue().size();
						where = demo.reportId() + " / " + run + " / " + tile.getKey();
					}
				}
		}

		int cap = cap();
		System.out.println("The largest answer of " + answers + " is " + largest + " rows (" + where
				+ "); the cap is " + cap);
		assertTrue(answers > 0, "no tile was asked at all, which is not a pass");
		assertTrue((long) largest * HEADROOM <= cap, "the largest answer a demo gives, " + largest
				+ " rows at " + where + ", is within " + HEADROOM + " times of the cap of " + cap);
	}

	/** The cap as the server reads it, from the one place it is set. */
	private static int cap() throws Exception {
		Properties properties = new Properties();
		try (InputStream in = DashboardDemosRowCountsTest.class.getResourceAsStream("/application.properties")) {
			properties.load(in);
		}
		return Integer.parseInt(properties.getProperty("DataPallas.widgets.max-rows").trim());
	}
}
