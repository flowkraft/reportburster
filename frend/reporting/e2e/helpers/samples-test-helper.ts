import { FluentTester } from './fluent-tester';

export class SamplesTestHelper {
  static verifyLearnMoreModal(
    ft: FluentTester,
    sampleId: string,
    //expectedPiecesOfText?: string[],
    expectedInputFile?: string,
    expectedOutputFile?: string,
    expectedTemplateFile?: string,
    expectedTemplateContent?: string,
  ): FluentTester {
    // 1. Open modal and verify basic content
    ft = ft
      .click(`#btnSamplesLearnMode${sampleId}`)
      .waitOnElementToBecomeVisible('p-dialog')
      .waitOnElementToBecomeVisible('#modalInputDetails')
      .waitOnElementToBecomeVisible('#modalOutputDetails');

    /* 2. Verify expected text pieces if provided
    if (expectedPiecesOfText?.length > 0) {
      expectedPiecesOfText.forEach((textToFind) => {
        ft = ft.elementShouldContainText('p-dialog *', textToFind);
      });
    }
    */

    // 3. Check input/output types if provided
    if (expectedInputFile) {
      ft = ft.elementShouldContainText(
        `#tdInputSample${sampleId}`,
        expectedInputFile,
      );
      ft = ft.elementShouldContainText(`#modalInputDetails`, expectedInputFile);
    }

    if (expectedOutputFile) {
      ft = ft.elementShouldContainText(
        `#tdOutputSample${sampleId}`,
        expectedOutputFile,
      );
      ft = ft.elementShouldContainText(
        `#modalOutputDetails`,
        expectedOutputFile,
      );
    }

    // 4. Verify file type icons based on input/output types
    if (
      expectedInputFile?.includes('.xlsx') ||
      expectedInputFile?.includes('.xls') ||
      expectedOutputFile?.includes('.xlsx') ||
      expectedOutputFile?.includes('.xls')
    ) {
      ft = ft.elementShouldBeVisible('p-dialog i.fa-file-excel-o');
    }

    if (
      expectedInputFile?.includes('.pdf') ||
      expectedOutputFile?.includes('.pdf')
    ) {
      ft = ft.elementShouldBeVisible('p-dialog i.fa-file-pdf-o');
    }

    if (
      expectedInputFile?.includes('.html') ||
      expectedOutputFile?.includes('.html')
    ) {
      ft = ft.elementShouldBeVisible('p-dialog i.fa-file-code-o');
    }

    if (
      expectedInputFile?.includes('.docx') ||
      expectedOutputFile?.includes('.docx')
    ) {
      ft = ft.elementShouldBeVisible('p-dialog i.fa-file-word-o');
    }

    // 5. Verify notes section
    ft = ft.elementShouldBeVisible(`#div${sampleId}`);

    // 6. Verify configuration
    ft = ft
      .click(`#btnViewConfigurationFile${sampleId}`)
      .waitOnElementToBecomeVisible('#burstFileName')
      .waitOnInputToHaveValue(
        '#burstFileName',
        '${burst_token}.${output_type_extension}',
      );

    // 7. Check Split2Times configuration if applicable
    if (expectedInputFile && expectedInputFile.includes('2Times.pdf')) {
      ft = ft
        .click('#leftMenuAdvancedSettings')
        .waitOnElementToBecomeVisible('#btnSplit2ndTime')
        .elementCheckBoxShouldBeSelected('#btnSplit2ndTime')
        .click('#leftMenuGeneralSettings');
    }

    const capReportGenerationMailMerge =
      expectedTemplateFile || expectedTemplateContent;

    // 8. Check output configuration if provided
    if (capReportGenerationMailMerge) {
      ft = ft
        .click('#leftMenuReportingSettings')
        .click('#reportingTemplateOutputTab-link')
        .waitOnElementToBecomeVisible('#reportOutputType');

      if (expectedOutputFile.endsWith('.docx') && expectedTemplateFile) {
        ft = ft
          .dropDownShouldHaveSelectedOption('#reportOutputType', 'output.docx')
          .elementShouldNotBeVisible('#codeJarHtmlTemplateEditor')
          .elementShouldContainText(
            '#selectTemplateFile',
            expectedTemplateFile,
          );
      }

      if (expectedOutputFile.endsWith('.html') && expectedTemplateContent) {
        ft = ft
          .dropDownShouldHaveSelectedOption('#reportOutputType', 'output.html')
          .elementShouldNotBeVisible('#selectTemplateFile')
          .elementShouldContainText(
            '#codeJarHtmlTemplateEditor',
            expectedTemplateContent,
          );
      }

      if (expectedOutputFile.endsWith('.pdf') && expectedTemplateContent) {
        ft = ft
          .dropDownShouldHaveSelectedOption('#reportOutputType', 'output.pdf')
          .elementShouldNotBeVisible('#selectTemplateFile')
          .elementShouldContainText(
            '#codeJarHtmlTemplateEditor',
            expectedTemplateContent,
          );
      }

      if (expectedOutputFile.endsWith('.xlsx') && expectedTemplateContent) {
        ft = ft
          .dropDownShouldHaveSelectedOption('#reportOutputType', 'output.xlsx')
          .elementShouldNotBeVisible('#selectTemplateFile')
          .elementShouldContainText(
            '#codeJarHtmlTemplateEditor',
            expectedTemplateContent,
          );
      }
    }

    ft = ft.gotoBurstScreen();

    // 9. Return to samples screen
    return ft.click('#leftMenuSamples');
  }
}
