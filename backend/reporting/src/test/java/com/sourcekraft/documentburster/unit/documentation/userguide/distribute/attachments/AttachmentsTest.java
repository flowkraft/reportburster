package com.sourcekraft.documentburster.unit.documentation.userguide.distribute.attachments;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.PdfTestUtils;
import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.settings.model.Attachment;
import com.sourcekraft.documentburster.unit.further.other.UtilsTest;

public class AttachmentsTest {

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

    private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
            "clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

    @Test
    public final void burstAndArchive() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "AttachmentsTest-burstAndArchive") {
                    protected void executeController() throws Exception {

                        super.executeController();

                        ctx.settings.setArchiveAttachments(true);

                    };
                };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

        String outputFolder = burster.getCtx().outputFolder + "/";

        assertEquals(2 * tokens.size(), new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert output reports to be zipped
        for (String token : tokens) {

            String path = burster.getCtx().outputFolder + "/reports-" + token + ".zip";
            File outputReport = new File(path);
            assertTrue(outputReport.exists());

        }
        ;

        // assert the backup file
        File backupFile = new File(burster.getCtx().backupFolder + "/Payslips.pdf");
        assertTrue(backupFile.exists());
    };

    @Test
    public final void burstWithoutAttachments() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "AttachmentsTest-burstWithoutAttachments") {
                    protected void executeController() throws Exception {

                        super.executeController();

                        scripting.setRoots(new String[]{"src/test/groovy", "src/test/groovy/senders-messages",
                                "src/main/external-resources/template/scripts/burst/internal"});

                        ctx.settings.getAttachments().clear();

                    };
                };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
        PdfTestUtils.assertDefaultResults(burster, tokens);

    };

    @Test
    public final void burstAndArchiveEmptyArchiveName() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "AttachmentsTest-burstAndArchiveEmptyArchiveName") {
                    protected void executeController() throws Exception {

                        super.executeController();

                        scripting.setRoots(new String[]{"src/test/groovy", "src/test/groovy/senders-messages",
                                "src/main/external-resources/template/scripts/burst/internal"});

                        ctx.settings.setArchiveAttachments(true);

                    };
                };

        try {
            burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
        } catch (Exception e) {
            assertTrue(e.getMessage().equals("You need to provide a valid 'archiveFileName'"));
        }
    };

    public final void burstAndArchiveNoAttachments() throws Exception {

        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "AttachmentsTest-burstAndArchiveNoAttachments") {
                    protected void executeController() throws Exception {

                        super.executeController();

                        scripting.setRoots(new String[]{"src/test/groovy", "src/test/groovy/senders-messages",
                                "src/main/external-resources/template/scripts/burst/internal"});

                        ctx.settings.setArchiveAttachments(true);

                    };
                };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

        PdfTestUtils.doBurstAndAssertDefaultResults(PAYSLIPS_REPORT_PATH, tokens,
                "AttachmentsTest-burstAndArchiveNoAttachments");

    };

    @Test
    public final void burstAndArchiveMultipleAttachments() throws Exception {
        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
                        "AttachmentsTest-burstAndArchiveMultipleAttachments") {
                    protected void executeController() throws Exception {

                        super.executeController();

                        scripting.setRoots(new String[]{"src/test/groovy", "src/test/groovy/senders-messages",
                                "src/main/external-resources/template/scripts/burst/internal"});

                        ctx.settings.getAttachments().clear();

                        Attachment item0 = new Attachment();

                        item0.order = 0;
                        item0.path = "$extracted_file_path$";

                        ctx.settings.addAttachment(item0);

                        Attachment item1 = new Attachment();

                        item1.order = 1;
                        item1.path = "src/main/external-resources/template/samples/burst/Invoices-Oct.pdf";

                        ctx.settings.addAttachment(item1);

                        Attachment item2 = new Attachment();

                        item2.order = 2;
                        item2.path = "src/main/external-resources/template/samples/burst/Payslips-Distinct-Sheets.xls";

                        ctx.settings.addAttachment(item2);

                        ctx.settings.setArchiveAttachments(true);

                    };
                };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

        String outputFolder = burster.getCtx().outputFolder + "/";

        assertEquals(12, new File(outputFolder).listFiles(UtilsTest.outputFilesFilter).length);

        // assert output reports to be zipped
        for (String token : tokens) {

            String path = burster.getCtx().outputFolder + "/reports-" + token + ".zip";
            File outputReport = new File(path);
            assertTrue(outputReport.exists());

        }
        ;

    }

    @Test
    public final void burstAndArchiveInvalidAttachmentFile() throws Exception {
        AbstractBurster burster =
                new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
                        "AttachmentsTest-burstAndArchiveInvalidAttachmentFile") {
                    protected void executeController() throws Exception {

                        super.executeController();

                        scripting.setRoots(new String[]{"src/test/groovy", "src/test/groovy/senders-messages",
                                "src/main/external-resources/template/scripts/burst/internal"});

                        ctx.settings.getAttachments().clear();

                        Attachment item0 = new Attachment();

                        item0.order = 0;
                        item0.path = "src/main/external-resources/template/Invoices-Oct.pdf";

                        ctx.settings.addAttachment(item0);

                        ctx.settings.setArchiveAttachments(true);

                    };
                };

        try {
            burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);
        } catch (FileNotFoundException e) {
            assertTrue(e.getMessage().contains("Invoices-Oct.pdf"));
        }

    }

};