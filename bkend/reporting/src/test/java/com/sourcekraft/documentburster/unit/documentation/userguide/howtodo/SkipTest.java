package com.sourcekraft.documentburster.unit.documentation.userguide.howtodo;

import org.apache.commons.lang3.StringUtils;
import org.junit.Assert;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.engine.AbstractBurster;

public class SkipTest {

    private static final String SKIP_PATH = "src/test/resources/input/unit/pdf/skip.pdf";

    @Test
    public final void burst() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "SkipTest-burst") {
            protected void executeController() throws Exception {

                super.executeController();

                ctx.scripts.endExtractDocument = "endExtractDocument_skip.groovy";

            };
        };

        burster.burst(SKIP_PATH, false, StringUtils.EMPTY, -1);

    }

    public static void assertEndExtractDocument(BurstingContext ctx) throws Exception {

        // ctx.skipCurrentFileDistribution
        if (ctx.token.equals("77889900"))
            Assert.assertFalse(ctx.skipCurrentFileDistribution);
        else
            Assert.assertTrue(ctx.skipCurrentFileDistribution);

    }
};