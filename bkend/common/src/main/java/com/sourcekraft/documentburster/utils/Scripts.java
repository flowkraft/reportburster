package com.sourcekraft.documentburster.utils;

public class Scripts extends DumpToString {

    private static final long serialVersionUID = -4487763056638168490L;

    public static final String CONTROLLER = "controller.groovy";

    public static final String START_BURSTING = "startBursting.groovy";
    public static final String END_BURSTING = "endBursting.groovy";

    public static final String START_PARSE_PAGE = "startParsePage.groovy";
    public static final String PARSE_PAGE_TOKENS = "parsePageTokens.groovy";
    public static final String END_PARSE_PAGE = "endParsePage.groovy";

    public static final String START_EXTRACT_DOCUMENT = "startExtractDocument.groovy";
    public static final String END_EXTRACT_DOCUMENT = "endExtractDocument.groovy";

    public static final String START_DISTRIBUTE_DOCUMENT = "startDistributeDocument.groovy";
    public static final String END_DISTRIBUTE_DOCUMENT = "endDistributeDocument.groovy";

    public static final String QUARANTINE_DOCUMENT = "quarantineDocument.groovy";

    public static final String DISTRIBUTED_BY = "distributed_by.groovy";
    public static final String STATS = "stats.groovy";

    public static final String ARCHIVE = "archive.groovy";

    public static final String EMAIL = "email.groovy";
    public static final String UPLOAD = "upload.groovy";
    public static final String WEB_UPLOAD = "web_upload.groovy";

    public static final String TWILIO = "twilio.groovy";

    private static final String DISTRIBUTE_REPORT_ERROR_HANDLING = "distributeReportErrorHandling.groovy";

    // New constants for report generation
    public static final String TRANSFORM_FETCHED_DATA = "transformFetchedData.groovy";
    public static final String BEFORE_TEMPLATE_PROCESSING = "beforeTemplateProcessing.groovy";

    public String startBursting = START_BURSTING;
    public String endBursting = END_BURSTING;

    public String startParsePage = START_PARSE_PAGE;
    public String parsePageTokens = PARSE_PAGE_TOKENS;
    public String endParsePage = END_PARSE_PAGE;

    public String startExtractDocument = START_EXTRACT_DOCUMENT;
    public String endExtractDocument = END_EXTRACT_DOCUMENT;

    public String startDistributeDocument = START_DISTRIBUTE_DOCUMENT;
    public String endDistributeDocument = END_DISTRIBUTE_DOCUMENT;

    public String quarantineDocument = QUARANTINE_DOCUMENT;

    public String archive = ARCHIVE;

    public String email = EMAIL;
    public String upload = UPLOAD;
    public String webUpload = WEB_UPLOAD;

    public String sms = TWILIO;

    public String distributedBy = DISTRIBUTED_BY;
    public String stats = STATS;

    public String distributeReportErrorHandling = DISTRIBUTE_REPORT_ERROR_HANDLING;

    // New fields for report generation
    public String transformFetchedData = TRANSFORM_FETCHED_DATA;
    public String beforeTemplateProcessing = BEFORE_TEMPLATE_PROCESSING;
}
