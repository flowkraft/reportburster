package com.sourcekraft.documentburster.unit.documentation.userguide.distribute.external;

import static org.junit.Assert.*;

import java.io.File;
import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.EmailMessage;
import com.sourcekraft.documentburster.common.settings.model.Attachment;
import com.sourcekraft.documentburster.unit.documentation.userguide.distribute.EmailTest;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

public class DistributeExternalTest {

    private static final String PDF_DISTRIBUTE_EXTERNAL_PATH =
            "src/main/external-resources/template/samples/burst/Distribute-External-Files.pdf";
    private static final String EXCEL_DISTRIBUTE_EXTERNAL_PATH =
            "src/main/external-resources/template/samples/burst/Distribute-External-Files.xls";

    @Test
    public final void burstPdf() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "DistributeExternalTest-burstPdf") {
                    protected void executeController() throws Exception {

                        super.executeController();

                        super.setUpMockEmail();

                        ctx.scripts.email = "distribute_external_email_test.groovy";

                        ctx.settings.getAttachments().clear();

                        Attachment item = new Attachment();

                        item.order = 0;
                        item.path = "${var0}";

                        ctx.settings.addAttachment(item);

                    };
                };

        burster.burst(PDF_DISTRIBUTE_EXTERNAL_PATH, false, StringUtils.EMPTY, 2);

        String outputFolder = burster.getCtx().outputFolder + "/";

        assertEquals(2, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

    };

    @Test
    public final void burstExcel() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PoiExcelBurster(StringUtils.EMPTY, "DistributeExternalTest-burstExcel") {
                    protected void executeController() throws Exception {

                        super.executeController();

                        super.setUpMockEmail();

                        ctx.scripts.email = "distribute_external_email_test.groovy";

                        ctx.settings.getAttachments().clear();

                        Attachment item = new Attachment();

                        item.order = 0;
                        item.path = "${var0}";

                        ctx.settings.addAttachment(item);

                    };
                };

        burster.burst(EXCEL_DISTRIBUTE_EXTERNAL_PATH, false, StringUtils.EMPTY, 2);

        String outputFolder = burster.getCtx().outputFolder + "/";

        assertEquals(2, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

    };

    public static void assertEmailMessage(EmailMessage message) throws Exception {

        EmailTest.assertCommonEmailStuff(message);

        assertTrue(1 == message.tos.size());

        assertEquals(message.token, message.tos.get(0));

        assertEquals("Subject " + message.token, message.subject);
        assertEquals("Message " + message.token, message.textMessage);

        // assert document path
        assertTrue(1 == message.attachments.size());

        String path = message.attachments.get(0);

        if (message.token.equals("clyde.grew@northridgehealth.org"))
            assertEquals("samples/Invoices-Oct.pdf", path);
        else if (message.token.equals("kyle.butford@northridgehealth.org"))
            assertEquals("samples/Invoices-Nov.pdf", path);
        else
            assertEquals("samples/Invoices-Dec.pdf", path);

    }

};