package com.sourcekraft.documentburster.unit.further.variables;

import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.PdfTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;

public class ConfigurableBurstTokenDelimitersTest {

    private static final String CONFIGURABLE_BURST_TOKEN_DELIMITERS_PATH =
            "src/test/resources/input/unit/pdf/configurable-burst-token-delimiters.pdf";

    private static final List<String> defaultTokens = Arrays.asList("page77", "page88", "page99", "!page1!", "!page2!",
            "!page3!");
    private static final List<String> configurableTokens = Arrays.asList("page1", "page2", "page3");

    @Test
    public final void burstDefaultDelimiters() throws Exception {

        PdfTestUtils.doBurstAndAssertDefaultResults(CONFIGURABLE_BURST_TOKEN_DELIMITERS_PATH, defaultTokens,
                "ConfigurableBurstTokenDelimitersTest-burstDefaultDelimiters");

    };

    @Test
    public final void burstConfigurableDelimiters() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
                        "ConfigurableBurstTokenDelimitersTest-burstConfigurableDelimiters") {
                    protected void executeController() throws Exception {

                        super.executeController();

                        ctx.settings.setStartBurstTokenDelimiter("{!");
                        ctx.settings.setEndBurstTokenDelimiter("!}");

                    };
                };

        burster.burst(CONFIGURABLE_BURST_TOKEN_DELIMITERS_PATH, false, StringUtils.EMPTY, -1);

        PdfTestUtils.assertDefaultResults(burster, configurableTokens);

    };
}
