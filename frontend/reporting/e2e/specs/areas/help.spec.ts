import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { FluentTester } from '../../helpers/fluent-tester';

//DONE2
electronBeforeAfterAllTest(
  'should correctly display all the screens from the Help area',
  async function ({ beforeAfterEach: firstPage }) {
    let ft = new FluentTester(firstPage);

    ft = ft
      .gotoBurstScreen()
      .click('#supportEmail')
      .elementShouldHaveText(
        '#checkPointHelpSupport',
        'ParkTrent Properties Group, Australia',
      )
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .click('#logsTab-link')
      .elementShouldBeVisible('#warningsLog')
      .click('#leftMenuHelpServices')
      .elementShouldHaveText(
        '#checkPointHelpServices',
        'sales@reportburster.com',
      )
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .click('#leftMenuHelpSupport')
      .elementShouldHaveText(
        '#checkPointHelpSupport',
        'ParkTrent Properties Group, Australia',
      )
      .click('#leftMenuHelpDocumentation')
      .elementShouldContainText(
        '#checkPointHelpDocumentation',
        'Advanced Report Delivery Scenarios',
      )
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .click('#leftMenuHelpExamples')
      .elementShouldHaveText(
        '#checkPointHelpExamples',
        'ReportBurster Examples',
      )
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .click('#leftMenuHelpFreeForSchools')
      .elementShouldHaveText(
        '#checkPointHelpFreeForSchools',
        'How Schools Use ReportBurster Software',
      )
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .click('#leftMenuHelpCustomerReviews')
      .elementShouldHaveText(
        '#checkPointHelpCustomerReviews',
        'Michael B., Finance Systems Team',
      )
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .click('#leftMenuHelpBlog')
      //this depends on a specific website to be up and the specific website stopped working
      /*
        .waitOnElementToBecomeVisible(
          '#blogRss .feed-container',
          Constants.DELAY_FIVE_THOUSANDS_SECONDS
        )
        */
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      );
    const isElectron = process.env.TEST_ENV === 'electron';

    if (isElectron) {
      ft = ft
        .click('#leftMenuHelpInstallSetup')
        .elementShouldContainText(
          '#checkPointJavaPreRequisite',
          'as a prerequisite',
        )
        .click('#systemDiagnosticsTab-link')
        .elementShouldHaveText('#checkPointHelpJavaPreRequisite', 'Status')
        .click('#terminalTab-link')
        .elementShouldBeVisible('#p-terminal')
        .click('#updateTab-link')
        .elementShouldBeVisible('#btnLetMeUpdateManually')
        .click('#extraPackagesTab-link')
        .elementShouldBeVisible('#package-notepadplusplus');
    }

    ft = ft
      .click('#leftMenuHelpLicense')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .click('#logsTab-link')
      .elementShouldBeVisible('#warningsLog')
      .click('#leftMenuHelpAbout')
      .elementShouldHaveText('#checkPointHelpAbout', 'Copyright')
      .click('#comparisonTab-link')
      .elementShouldHaveText(
        '#checkPointHelpComparison',
        'DocumentBurster Server Features',
      )
      .gotoBurstScreen()
      .click('#topMenuHelp')
      .click('#topMenuHelpSupport')
      .elementShouldHaveText(
        '#checkPointHelpSupport',
        'ParkTrent Properties Group, Australia',
      )
      .gotoBurstScreen()
      .click('#topMenuHelp')
      .click('#topMenuHelpServices')
      .elementShouldHaveText(
        '#checkPointHelpServices',
        'sales@reportburster.com',
      )
      .gotoBurstScreen()
      .click('#topMenuHelp')
      .click('#topMenuHelpDocumentation')
      .elementShouldContainText(
        '#checkPointHelpDocumentation',
        'Advanced Report Delivery Scenarios',
      )
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .gotoBurstScreen()
      .click('#topMenuHelp')
      .click('#topMenuHelpExamples')
      .elementShouldHaveText(
        '#checkPointHelpExamples',
        'ReportBurster Examples',
      )
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .gotoBurstScreen()
      .click('#topMenuHelp')
      .click('#topMenuHelpFreeForSchools')
      .elementShouldHaveText(
        '#checkPointHelpFreeForSchools',
        'How Schools Use ReportBurster Software',
      )
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .gotoBurstScreen()
      .click('#topMenuHelp')
      .click('#topMenuHelpCustomerReviews')
      .elementShouldHaveText(
        '#checkPointHelpCustomerReviews',
        'Michael B., Finance Systems Team',
      )
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .gotoBurstScreen()
      .click('#topMenuHelp')
      .click('#topMenuHelpBlog')
      .elementShouldBeVisible('#blogRss')
      .click('#licenseTab-link')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .gotoBurstScreen()
      .click('#topMenuHelp')
      .click('#topMenuHelpLicense')
      .elementShouldHaveText(
        '#statusDemoLicense',
        'Open Source (Community Support)',
      )
      .click('#logsTab-link')
      .elementShouldBeVisible('#warningsLog')
      .gotoBurstScreen()
      .click('#topMenuHelp')
      .click('#topMenuHelpAbout')
      .elementShouldHaveText('#checkPointHelpAbout', 'Copyright');

    return ft;
  },
);
