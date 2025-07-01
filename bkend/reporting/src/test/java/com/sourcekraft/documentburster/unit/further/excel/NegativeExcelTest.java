package com.sourcekraft.documentburster.unit.further.excel;

import static org.junit.Assert.*;

import java.util.Arrays;
import java.util.List;

import org.junit.Test;

import com.sourcekraft.documentburster._helpers.ExcelTestUtils;

public class NegativeExcelTest {

    private static final String BURST_BY_DISTINCT_COLUMN_VALUES_MISSING_BURST_METHOD =
            "src/test/resources/input/unit/excel/extra/burst-by-distinct-column-values-missing-burst-method.xls";
    private static final String BURST_BY_DISTINCT_COLUMN_VALUES_MISSING_BURST_TOKENS =
            "src/test/resources/input/unit/excel/extra/burst-by-distinct-column-values-missing-burst-tokens.xls";
    private static final String BURST_BY_DISTINCT_COLUMN_VALUES_MISSPELLED_BURST_METHOD =
            "src/test/resources/input/unit/excel/extra/burst-by-distinct-column-values-misspelled-burst-method.xls";

    private static final List<String> tokens = Arrays.asList("Germany", "USA", "UK", "Sweden", "France", "Spain",
            "Canada", "Argentina", "Switzerland", "Brazil", "Austria", "Italy", "Portugal", "Mexico", "Venezuela",
            "Ireland", "Belgium", "Norway", "Denmark", "Finland", "Poland");

    @Test
    public void burstByDistinctColumnValuesMissingBurstMethod() throws Exception {

        try {
            ExcelTestUtils.doBurstAndAssertDefaultDistincValuesResults(
                    BURST_BY_DISTINCT_COLUMN_VALUES_MISSING_BURST_METHOD, tokens,
                    "NegativeExcelTest-burstByDistinctColumnValuesMissingBurstMethod");
        } catch (Exception e) {
            assertTrue(e.getMessage().contains("The mandatory 'burstMethod' is missing"));
        }

    }

    @Test
    public void burstByDistinctColumnValuesMissingBurstTokens() throws Exception {

        try {
            ExcelTestUtils.doBurstAndAssertDefaultDistincValuesResults(
                    BURST_BY_DISTINCT_COLUMN_VALUES_MISSING_BURST_TOKENS, tokens,
                    "NegativeExcelTest-burstByDistinctColumnValuesMissingBurstTokens");
        } catch (Exception e) {
            assertTrue(e.getMessage().contains("No burst tokens were provided or fetched for the document"));
        }

    }

    @Test
    public void burstByDistinctColumnValuessMisspelledBurstMethod() throws Exception {

        try {
            ExcelTestUtils.doBurstAndAssertDefaultDistincValuesResults(
                    BURST_BY_DISTINCT_COLUMN_VALUES_MISSPELLED_BURST_METHOD, tokens,
                    "NegativeExcelTest-burstByDistinctColumnValuessMisspelledBurstMethod");
        } catch (Exception e) {
            assertTrue(e.getMessage().contains("'burstMethod' is misspelled in the 'burst' sheet"));
        }
    }

}