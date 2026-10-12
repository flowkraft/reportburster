package com.flowkraft.reporting.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.sourcekraft.documentburster.common.reportparameters.ReportParameter;

/**
 * Cascading filters (#17): an options SELECT that names other filters is asked again when one of
 * them changes, and the filter bar learns which ones from here.
 */
class ReportingServiceOptionsUsesTest {

	private static ReportParameter param(String id, Object options) {
		ReportParameter p = new ReportParameter();
		p.id = id;
		p.type = "String";
		if (options != null)
			p.uiHints.put("options", options);
		return p;
	}

	@Test
	void theFiltersASelectNamesInTheDashboardsOrder() {
		String sql = "SELECT DISTINCT city FROM customers WHERE country = ${country} AND segment = ${segment}";
		List<ReportParameter> declared = List.of(param("segment", null), param("country", null), param("city", sql));
		assertEquals(List.of("segment", "country"), ReportingService.optionsUses(sql, declared, "city"));
	}

	@Test
	void notItselfNorANameTheDashboardDoesNotDeclare() {
		String sql = "SELECT name FROM t WHERE owner = ${dp_user_id} AND name <> ${city}";
		List<ReportParameter> declared = List.of(param("city", sql));
		assertEquals(List.of(), ReportingService.optionsUses(sql, declared, "city"));
	}

	@Test
	void aSelectIsOptionsSqlAListIsNot() {
		assertEquals("SELECT 1", ReportingService.optionsSqlOf(param("a", "  SELECT 1 ")));
		assertNull(ReportingService.optionsSqlOf(param("b", List.of("x", "y"))));
		assertNull(ReportingService.optionsSqlOf(param("c", "x, y")));
		assertNull(ReportingService.optionsSqlOf(param("d", null)));
	}
}
