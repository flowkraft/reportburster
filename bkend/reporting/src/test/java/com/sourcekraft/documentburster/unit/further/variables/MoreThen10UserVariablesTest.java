package com.sourcekraft.documentburster.unit.further.variables;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;

public class MoreThen10UserVariablesTest {

    private static final String MORE_THEN_TEN_USER_VARIABLES_PATH =
            "src/test/resources/input/unit/pdf/more-then-ten-user-variables.pdf";

    private static final List<String> tokens = Arrays.asList("059420");

    private final void burstAndCheckVariables() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "MoreThenTenUserVariablesTest");

        burster.burst(MORE_THEN_TEN_USER_VARIABLES_PATH, false, StringUtils.EMPTY, -1);

        // assert for the output files to have the correct name/path
        for (String token : tokens) {

            assertUserVariableValues(burster, token);

            String var10 = burster.getCtx().variables.getUserVariables(token).get("var10").toString();
            assertTrue(StringUtils.isEmpty(var10));

            String var11 = burster.getCtx().variables.getUserVariables(token).get("var11").toString();
            assertEquals("6466", var11);

        }

    }

    @Test
    public final void burstAndCheck15Variables() throws Exception {
        burstAndCheckVariables();
    };

    private void assertUserVariableValues(AbstractBurster burster, String token) {
        String var0 = burster.getCtx().variables.getUserVariables(token).get("var0").toString();
        assertEquals("ManGui", var0);

        String var1 = burster.getCtx().variables.getUserVariables(token).get("var1").toString();
        assertEquals("maria.j.pomp@some.com", var1);

        String var2 = burster.getCtx().variables.getUserVariables(token).get("var2").toString();
        assertEquals(" Completed 10/02/2012 <br>", var2);

        String var3 = burster.getCtx().variables.getUserVariables(token).get("var3").toString();
        assertEquals("407-243-3717", var3);

        String var4 = burster.getCtx().variables.getUserVariables(token).get("var4").toString();
        assertEquals("Wednesday 10/10/12", var4);

        String var5 = burster.getCtx().variables.getUserVariables(token).get("var5").toString();
        assertEquals("David.N.Elliot", var5);

        String var6 = burster.getCtx().variables.getUserVariables(token).get("var6").toString();
        assertEquals("david.n.elliot@some.com", var6);

        String var7 = burster.getCtx().variables.getUserVariables(token).get("var7").toString();
        assertEquals("Martin J. Mines", var7);

        String var8 = burster.getCtx().variables.getUserVariables(token).get("var8").toString();
        assertEquals("407 &#45 648 &#45 3573", var8);

        String var9 = burster.getCtx().variables.getUserVariables(token).get("var9").toString();
        assertEquals("millerd1@some.com", var9);


    }
}
