export class Constants {
  static DELAY_ONE_SECOND = 1000;
  static DELAY_HALF_SECOND = Constants.DELAY_ONE_SECOND / 2;

  static DELAY_TEN_SECONDS = 10 * Constants.DELAY_ONE_SECOND;
  static DELAY_HUNDRED_SECONDS = 100 * Constants.DELAY_ONE_SECOND;

  static DELAY_FIVE_THOUSANDS_SECONDS = 5000000;

  static STATUS_GREAT_NO_ERRORS_NO_WARNINGS = 'great-no-errors-no-warning';
  static STATUS_WARNINGS = 'warnings';
  static STATUS_ERRORS = 'errors';

  static BTN_CONFIRM_SELECTOR = '.dburst-button-question-confirm';
  static BTN_DECLINE_SELECTOR = '.dburst-button-question-decline';

  static CHECK_PROCESSING_JAVA = 'check-java';
  static CHECK_PROCESSING_STATUS_BAR = 'check-status-bar';
  static CHECK_PROCESSING_LOGS = 'check-logs';

  static ATTACHMENTS_CLEAR = 'attachments-clear';
  static ATTACHMENTS_ADD_AND_ZIP = 'attachments-add-and-zip';
  static ATTACHMENTS_DEFAULT = 'attachments-default';
  static ATTACHMENTS_XLS_ONLY = 'attachments-xls-only';
  static ATTACHMENTS_PDF_AND_XLS = 'attachments-pdf-and-xls';

  static QA_TA = 'qa-ta';
  static QA_TL = 'qa-tl';
  static QA_TR = 'qa-tr';

  static SMS_DEFAULT = 'sms-default';
  static SMS_TWILIO = 'sms-twilio';

  static PAYSLIPS_PDF_BURST_TOKENS = [
    'alfreda.waldback@northridgehealth.org',
    'clyde.grew@northridgehealth.org',
    'kyle.butford@northridgehealth.org',
  ];

  static PAYSLIPS_XLS_BURST_TOKENS = [
    'awaldback@northridgehealth.org',
    'cgrew@northridgehealth.org',
    'kbutford@northridgehealth.org',
  ];

  static INPUT_FILE_PAYSLIPS_PDF: 'Payslips.pdf';
  static INPUT_FILE_CUSTOMERS_PAYSLIPS_DISTINCT_SHEETS_XLS =
    'Payslips-Distinct-Sheets.xls';
  static INPUT_FILE_CUSTOMERS_DISTINCT_COLUMN_VALUES_XLS =
    'Customers-Distinct-Column-Values.xls';

  static TEST_LICENSE_KEY =
    process.env.TEST_LICENSE_KEY || '12345678909876543210123456789';
}
