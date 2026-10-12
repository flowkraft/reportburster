package com.flowkraft.reporting.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

import com.flowkraft.cubes.CubeDataToday;
import com.sourcekraft.documentburster.common.reportparameters.ReportParameter;

/**
 * A date range's presets count from the data's today (#16): the configuration hands that day to the
 * filter bar when, and only when, a parameter is drawn as a range.
 */
class ReportingServiceDateRangeTodayTest {

	private final AtomicInteger reads = new AtomicInteger();

	private ReportingService serviceWithToday(LocalDate day, boolean markerTable) {
		ReportingService service = new ReportingService();
		service.useDataToday(new CubeDataToday() {
			@Override
			public LocalDate ofDashboards(String connectionId) {
				reads.incrementAndGet();
				if (!markerTable)
					throw new IllegalArgumentException("no demo marker table on " + connectionId);
				return day;
			}
		});
		return service;
	}

	private static ReportParameter date(String id, String key, String control) {
		ReportParameter p = new ReportParameter();
		p.id = id;
		p.type = "Date";
		if (control != null)
			p.uiHints.put(key, control);
		return p;
	}

	@Test
	void aRangeIsHandedTheDataToday() {
		List<ReportParameter> params = List.of(date("dateFrom", "control", "date-range"), date("dateTo", "control", null));
		assertEquals("2026-09-30",
				serviceWithToday(LocalDate.of(2026, 9, 30), true).dataTodayForRanges(params, "any-connection"));
	}

	@Test
	void theDialogsWordIsTheSameRange() {
		List<ReportParameter> params = List.of(date("dateFrom", "widget", "daterange"));
		assertEquals("2026-09-30",
				serviceWithToday(LocalDate.of(2026, 9, 30), true).dataTodayForRanges(params, "any-connection"));
	}

	@Test
	void noRangeReadsNothing() {
		List<ReportParameter> params = List.of(date("dateFrom", "control", "date"), date("dateTo", "control", null));
		assertNull(serviceWithToday(LocalDate.of(2026, 9, 30), true).dataTodayForRanges(params, "any-connection"));
		assertEquals(0, reads.get(), "the data's today is read only when a range asks for it");
	}

	@Test
	void aConnectionWithoutADayLeavesTheBrowsersDate() {
		List<ReportParameter> params = List.of(date("dateFrom", "control", "date-range"));
		assertNull(serviceWithToday(null, false).dataTodayForRanges(params, "a-customer-connection"));
	}
}
