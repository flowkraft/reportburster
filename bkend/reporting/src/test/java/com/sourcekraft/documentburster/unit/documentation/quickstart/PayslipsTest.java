package com.sourcekraft.documentburster.unit.documentation.quickstart;

import java.util.Arrays;
import java.util.List;

import org.junit.Test;

import com.sourcekraft.documentburster._helpers.PdfTestUtils;

public class PayslipsTest {

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

    private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
            "clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

    @Test
    public final void burst() throws Exception {

        PdfTestUtils.doBurstAndAssertDefaultResults(PAYSLIPS_REPORT_PATH, tokens, "PayslipsTest-burst");

    };
};