import { FluentTester } from './fluent-tester';
import { Constants } from '../utils/constants';

// List of visible apps (from apps-manager.service.ts where visible: true)
// Apps with launch: false have no Launch button (headless/API-only apps)
// 'name' is a minimal unique substring for resilience to minor UI text changes
export const VISIBLE_APPS = [
  { id: 'cms-webportal', name: 'WebPortal' },
  { id: 'flowkraft-frend-next', name: 'Frontend App (Next.js)' },
  { id: 'flowkraft-admin-grails', name: 'Admin Panel' },
  { id: 'flowkraft-bkend-boot-groovy', name: 'Backend App', launch: false },
  { id: 'rundeck', name: 'Rundeck' },
  { id: 'cloudbeaver', name: 'CloudBeaver' },
  { id: 'matomo', name: 'Matomo' },
  { id: 'docuseal', name: 'Docuseal' },
  { id: 'metabase', name: 'Metabase' },
  { id: 'clickhouse', name: 'ClickHouse', launch: false },
];

// Sanitizes app id the same way as the component does (removes spaces only)
function sanitizeAppId(id: string): string {
  return (id || '').replace(/\s/g, '');
}

export class AppsTestHelper {

  /**
   * Start an app, wait for it to be running, then stop it and wait for it to be stopped.
   * Works with the expandedList mode of apps-manager component.
   * 
   * @param ft FluentTester instance
   * @param appId The app id (e.g., 'cms-webportal', 'cloudbeaver')
   * @param appName The display name of the app (for confirm dialog text matching)
   * @param timeout Timeout for waiting on state changes
   * @param hasLaunchButton Whether the app has a Launch button (default: true). Set to false for headless/API-only apps.
   */
  static startWaitStopWaitApp(
    ft: FluentTester,
    appId: string,
    appName: string,
    timeout: number = Constants.DELAY_FIVE_THOUSANDS_SECONDS,
    hasLaunchButton: boolean = true,
  ): FluentTester {
    const sanitizedId = sanitizeAppId(appId);
    const btnSel = `#btnStartStop_${sanitizedId}`;
    const stateSel = `#appState_${sanitizedId}`;
    const launchSel = `#btnLaunch_${sanitizedId}`;
    const spinnerSel = `#appSpinner_${sanitizedId}`;
    const iconSel = `#appIcon_${sanitizedId}`;

    // Start the app
    ft = ft
      .consoleLog(`Starting app '${appName}' (${appId})...`)
      .waitOnElementToBecomeVisible(btnSel, timeout)
      .elementShouldContainText(stateSel, 'stopped')
      .elementShouldContainText(btnSel, 'Start')
      .waitOnElementToBecomeEnabled(btnSel, timeout)
      .click(btnSel)
      .confirmDialogShouldBeVisible()
      .waitOnElementToContainText('#confirmDialog .modal-body', appName)
      .clickYesDoThis();

    // Wait for starting state
    ft = ft
      .waitOnElementToBecomeDisabled(btnSel, timeout)
      .waitOnElementToBecomeVisible(spinnerSel, timeout)
      .waitOnElementToContainText(stateSel, 'starting', timeout)
      .consoleLog(`App '${appName}' is starting...`);

    // Wait for running state
    ft = ft
      .waitOnElementToBecomeEnabled(btnSel, timeout)
      .waitOnElementToContainText(stateSel, 'running', timeout)
      .waitOnElementToContainText(btnSel, 'Stop', timeout)
      .waitOnElementToBecomeVisible(iconSel, timeout)
      .waitOnElementToHaveClass(iconSel, 'fa-stop', timeout);

    // Only check Launch button if the app has one
    if (hasLaunchButton) {
      ft = ft.waitOnElementNotToHaveClass(launchSel, 'disabled', timeout);
    }

    ft = ft.consoleLog(`App '${appName}' is running.`);

    // Stop the app
    ft = ft
      .consoleLog(`Stopping app '${appName}' (${appId})...`)
      .waitOnElementToBecomeEnabled(btnSel, timeout)
      .click(btnSel)
      .confirmDialogShouldBeVisible()
      .waitOnElementToContainText('#confirmDialog .modal-body', appName)
      .clickYesDoThis();

    // Wait for stopping state
    ft = ft
      .waitOnElementToBecomeDisabled(btnSel, timeout)
      .waitOnElementToBecomeVisible(spinnerSel, timeout)
      .waitOnElementToContainText(stateSel, 'stopping', timeout)
      .consoleLog(`App '${appName}' is stopping...`);

    // Wait for stopped state
    ft = ft
      .waitOnElementToBecomeEnabled(btnSel, timeout)
      .waitOnElementToContainText(stateSel, 'stopped', timeout)
      .waitOnElementToContainText(btnSel, 'Start', timeout)
      .waitOnElementToBecomeVisible(iconSel, timeout)
      .waitOnElementToHaveClass(iconSel, 'fa-play', timeout);

    // Only check Launch button if the app has one
    if (hasLaunchButton) {
      ft = ft.waitOnElementToHaveClass(launchSel, 'disabled', timeout);
    }

    ft = ft.consoleLog(`App '${appName}' is stopped.`);

    return ft;
  }

}
