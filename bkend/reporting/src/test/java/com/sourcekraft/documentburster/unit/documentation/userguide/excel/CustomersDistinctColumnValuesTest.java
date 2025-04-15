package com.sourcekraft.documentburster.unit.documentation.userguide.excel;

import java.util.Arrays;
import java.util.List;

import org.junit.Test;

import com.sourcekraft.documentburster._helpers.ExcelTestUtils;

public class CustomersDistinctColumnValuesTest {

    private static final String CUSTOMERS_REPORT_PATH2003 =
            "src/main/external-resources/template/samples/burst/Customers-Distinct-Column-Values.xls";

    private static final String CUSTOMERS_REPORT_PATH2007 =
            "src/test/resources/input/unit/excel/Customers-Distinct-Column-Values-2007.xlsx";
    private static final String CUSTOMERS_REPORT_PATH2010 =
            "src/test/resources/input/unit/excel/Customers-Distinct-Column-Values-2010.xlsx";

    private static final List<String> tokens = Arrays.asList("Germany", "USA", "UK", "Sweden", "France", "Spain",
            "Canada", "Argentina", "Switzerland", "Brazil", "Austria", "Italy", "Portugal", "Mexico", "Venezuela",
            "Ireland", "Belgium", "Norway", "Denmark", "Finland", "Poland");

    @Test
    public final void burst2003() throws Exception {
        ExcelTestUtils.doBurstAndAssertDefaultDistincValuesResults(CUSTOMERS_REPORT_PATH2003, tokens,
                "CustomersDistinctColumnValuesTest-burst2003");
    }

    @Test
    public final void burst2007() throws Exception {
        ExcelTestUtils.doBurstAndAssertDefaultDistincValuesResults(CUSTOMERS_REPORT_PATH2007, tokens,
                "CustomersDistinctColumnValuesTest-burst2007");
    }

    @Test
    public final void burst2010() throws Exception {
        ExcelTestUtils.doBurstAndAssertDefaultDistincValuesResults(CUSTOMERS_REPORT_PATH2010, tokens,
                "CustomersDistinctColumnValuesTest-burst2010");
    }

}