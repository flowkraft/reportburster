import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { FluentTester } from '../../helpers/fluent-tester';
import { ConfigurationTestHelper } from '../../helpers/areas/configuration-test-helper';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import * as PATHS from '../../utils/paths';
import { Constants } from '../../utils/constants';

//DONE2
test.describe('', async () => {
  electronBeforeAfterAllTest(
    `(WITHOUT Report Generation) - should work changing/saving configuration values and should work rolling back to default configuration values 
    ("My Reports")`,
    async function ({ beforeAfterEach: firstPage }) {
      //long running test
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfigurationTestHelper.changeSaveLoadAssertSavedConfiguration(ft);

      ft =
        ConfigurationTestHelper.rollbackChangesToDefaultDocumentBursterConfiguration(
          ft,
          'burst',
        );

      return ConfigurationTestHelper.assertDefaultDocumentBursterConfiguration(
        ft,
        'burst',
      );
    },
  );

});
