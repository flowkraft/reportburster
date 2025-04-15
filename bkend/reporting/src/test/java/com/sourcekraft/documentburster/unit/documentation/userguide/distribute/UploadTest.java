package com.sourcekraft.documentburster.unit.documentation.userguide.distribute;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.sender.model.UploadMessage;

public class UploadTest {

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

    private static final List<String> tokens = Arrays.asList("alfreda.waldback@northridgehealth.org",
            "clyde.grew@northridgehealth.org", "kyle.butford@northridgehealth.org");

    @Test
    public final void burstFtp() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadTest-burstFtp") {
            protected void executeController() throws Exception {

                super.executeController();

                super.setUpMockUpload();

                ctx.scripts.upload = "assert_upload_ftp_executed.groovy";
                ctx.settings
                        .setFtpCommand("-T $extracted_file_path$ --ftp-create-dirs -u user:password ftp://ftp.example.com/reports/");

            };
        };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

        // quality-assurance folder should not be created;
        assertFalse(new File(burster.getCtx().outputFolder + "/quality-assurance").exists());

    };

    public static void assertUploadFtpMessage(UploadMessage message) throws Exception {

        assertTrue(tokens.contains(message.token));
        assertTrue(message.uploadCommand.endsWith(message.token
                + ".pdf --ftp-create-dirs -u user:password ftp://ftp.example.com/reports/"));

    }

    @Test
    public final void burstFileShare() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadTest-burstFileShare") {
            protected void executeController() throws Exception {

                super.executeController();

                super.setUpMockUpload();

                ctx.scripts.upload = "assert_upload_fileshare_executed.groovy";
                ctx.settings.setFileShareCommand("-T $extracted_file_path$ file://hostname/path/to/the%20folder");

            };
        };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

    };

    public static void assertUploadFileShareMessage(UploadMessage message) throws Exception {

        assertTrue(tokens.contains(message.token));
        assertTrue(message.uploadCommand.endsWith(message.token + ".pdf file://hostname/path/to/the%20folder"));

    }

    @Test
    public final void burstFtps() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadTest-burstFtps") {
            protected void executeController() throws Exception {

                super.executeController();

                super.setUpMockUpload();

                ctx.scripts.upload = "assert_upload_ftps_executed.groovy";
                ctx.settings
                        .setFtpsCommand("-T $extracted_file_path$ --ssl -u user:password ftp://ftp.example.com/reports/");

            };
        };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

    };

    public static void assertUploadFtpsMessage(UploadMessage message) throws Exception {

        assertTrue(tokens.contains(message.token));
        assertTrue(message.uploadCommand.endsWith(message.token + ".pdf --ssl -u user:password ftp://ftp.example.com/reports/"));

    }

    @Test
    public final void burstSftp() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadTest-burstSftp") {
            protected void executeController() throws Exception {

                super.executeController();

                super.setUpMockUpload();

                ctx.scripts.upload = "assert_upload_sftp_executed.groovy";
                ctx.settings
                        .setSftpCommand("-T $extracted_file_path$ -u user:password sftp://ftp.example.com/reports/");

            };
        };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

    };

    public static void assertUploadSftpMessage(UploadMessage message) throws Exception {

        assertTrue(tokens.contains(message.token));
        assertTrue(message.uploadCommand.endsWith(message.token + ".pdf -u user:password sftp://ftp.example.com/reports/"));

    }

    @Test
    public final void burstHttp() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadTest-burstHttp") {
            protected void executeController() throws Exception {

                super.executeController();

                super.setUpMockUpload();

                ctx.scripts.upload = "assert_upload_http_executed.groovy";
                ctx.settings
                        .setHttpCommand("-T $extracted_file_path$ --ntlm -u user:password https://sharepointserver.com/reports/");

            };
        };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

    };

    public static void assertUploadHttpMessage(UploadMessage message) throws Exception {

        assertTrue(tokens.contains(message.token));
        assertTrue(message.uploadCommand.endsWith(message.token
                + ".pdf --ntlm -u user:password https://sharepointserver.com/reports/"));

    }

    @Test
    public final void burstCloud() throws Exception {

        AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY, "UploadTest-burstCloud") {
            protected void executeController() throws Exception {

                super.executeController();

                super.setUpMockUpload();

                ctx.scripts.upload = "assert_upload_cloud_executed.groovy";
                ctx.settings
                        .setCloudCommand("-T $extracted_file_path$ --ntlm -u user:password https://s3.amazonaws.com/documentburster/");

            };
        };

        burster.burst(PAYSLIPS_REPORT_PATH, false, StringUtils.EMPTY, -1);

    };

    public static void assertUploadCloudMessage(UploadMessage message) throws Exception {

        assertTrue(tokens.contains(message.token));
        assertTrue(message.uploadCommand.endsWith(message.token
                + ".pdf --ntlm -u user:password https://s3.amazonaws.com/documentburster/"));

    }

};