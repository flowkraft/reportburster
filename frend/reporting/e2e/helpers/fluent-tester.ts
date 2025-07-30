import { Locator, Page } from 'playwright';
import { takeScreenshotIfRequested } from '../utils/helpers';
import { expect } from '@playwright/test';

const slash = require('slash');
import * as path from 'path';

import * as jetpack from 'fs-jetpack';

import { Constants } from '../utils/constants';
import { Helpers } from '../utils/helpers';
import * as PATHS from '../utils/paths';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiFiles from 'chai-files';
//import chaiWaitFor from 'chai-wait-for';

import chaiAsPromised from 'chai-as-promised';

chai.use(chaiHttp);
//chai.use(chaiWaitFor);
chai.use(chaiFiles);
chai.use(chaiAsPromised);

const should = chai.should();

export class FluentTester implements PromiseLike<void> {
  private focusedElement: Locator;
  actions: (() => Promise<void>)[] = [];
  //waitOnElementToExists: any;

  public async then<TResult1 = void, TResult2 = never>(
    onfulfilled?:
      | ((value: void) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined,
  ): Promise<TResult1 | TResult2> {
    // prettier-ignore
    return await this.executeActions()
      .then(onfulfilled)
      .catch(onrejected);
  }

  private _lastError?: Error;
  public lastError(): Error | undefined {
    return this._lastError;
  }

  private async executeActions(): Promise<void> {
    try {
      this._lastError = undefined;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (this.actions.length === 0) {
          break;
        }
        const action = this.actions.shift();
        action && (await action());
      }
    } catch (error) {
      this._lastError = error as Error;
      this.actions = [];
      throw error;
    } finally {
      this.actions = [];
    }
  }

  constructor(protected window: Page) { }

  public scrollIntoViewIfNeeded(selector: string): FluentTester {
    const action = (): Promise<void> => this.doScrollIntoViewIfNeeded(selector);

    this.actions.push(action);
    return this;
  }

  public click(selector: string): FluentTester {
    const action = (): Promise<void> => this.doClick(selector);

    this.actions.push(action);
    return this;
  }

  public clickElementContainingText(text: string): FluentTester {
    const action = (): Promise<void> => this.doClickElementContainingText(text);

    this.actions.push(action);
    return this;
  }

  public hover(selector: string): FluentTester {
    const action = (): Promise<void> => this.doHover(selector);

    this.actions.push(action);
    return this;
  }

  public renameFile(path: string, newName: string): FluentTester {
    const action = (): Promise<void> => this.doRenameFile(path, newName);

    this.actions.push(action);
    return this;
  }

  public moveFile(srcPath: string, destPath: string): FluentTester {
    const action = (): Promise<void> => this.doMoveFile(srcPath, destPath);

    this.actions.push(action);
    return this;
  }

  public createFolder(path: string): FluentTester {
    const action = (): Promise<void> => this.doCreateFolder(path);
    this.actions.push(action);
    return this;
  }

  public copyFile(srcPath: string, destPath: string): FluentTester {
    const action = (): Promise<void> => this.doCopyFile(srcPath, destPath);
    this.actions.push(action);
    return this;
  }

  public deleteFolder(path: string): FluentTester {
    const action = (): Promise<void> => this.doDeleteFolder(path);
    this.actions.push(action);
    return this;
  }

  public dblClick(selector: string): FluentTester {
    const action = (): Promise<void> => this.doDblClick(selector);

    this.actions.push(action);
    return this;
  }

  public clickAndSelectTableRow(selector: string): FluentTester {
    const action = (): Promise<void> => this.doClickAndSelectTableRow(selector);

    this.actions.push(action);
    return this;
  }

  public clickYesDoThis(): FluentTester {
    const action = (): Promise<void> =>
      this.doClick(Constants.BTN_CONFIRM_SELECTOR);

    this.actions.push(action);
    return this;
  }

  public sleep(ms: number = 0): FluentTester {
    let delay = Constants.DELAY_ONE_SECOND;
    if (ms > 0) delay = ms;

    const action = (): Promise<void> => Helpers.delay(delay);

    this.actions.push(action);
    return this;
  }

  public async getElementTextContent(selector: string): Promise<string> {
    const content = await this.window.locator(selector).textContent();
    return content ? content.trim() : '';
  }

  public clipboardShouldContainText(text: string): FluentTester {
    const action = (): Promise<void> => this.doClipboardShouldContainText(text);
    this.actions.push(action);
    return this;
  }

  private async doClipboardShouldContainText(text: string): Promise<void> {
    try {
      const clipboardText = await this.window.evaluate(() =>
        navigator.clipboard.readText(),
      );
      // Using Playwright's expect for assertion within the async action
      expect(clipboardText).toContain(text);
    } catch (error) {
      console.error(
        'Failed to read clipboard text or assertion failed:',
        error,
      );
      throw new Error(
        `Failed to read clipboard or assert text: ${error.message}`,
      );
    }
  }

  public consoleLog(message: string): FluentTester {
    const action = (): Promise<void> =>
      new Promise((resolve) => {
        console.log(message);
        resolve();
      });

    this.actions.push(action);
    return this;
  }

  public clickNoDontDoThis(): FluentTester {
    const action = (): Promise<void> =>
      this.doClick(Constants.BTN_DECLINE_SELECTOR);

    this.actions.push(action);
    return this;
  }

  public typeText(text: string): FluentTester {
    const action = (): Promise<void> => this.doTypeText(text);

    this.actions.push(action);
    return this;
  }

  public pressKey(key: string): FluentTester {
    const action = (): Promise<void> => this.doPressKey(key);

    this.actions.push(action);
    return this;
  }

  //public reload(): FluentTester {
  //  const action = (): Promise<void> => this.doPageReload();

  //this.actions.push(action);
  //return this;
  //}

  public waitOnElementWithTextToBecomeVisible(
    text: string,
    waitTime?: number,
  ): FluentTester {
    let delay = Constants.DELAY_FIVE_THOUSANDS_SECONDS;
    if (waitTime) delay = waitTime;
    const action = (): Promise<void> =>
      this.doWaitOnElementWithTextToBecome(text, true, delay);

    this.actions.push(action);
    return this;
  }

  public waitOnElementWithTextToBecomeInvisible(
    text: string,
    waitTime?: number,
  ): FluentTester {
    let delay = Constants.DELAY_FIVE_THOUSANDS_SECONDS;
    if (waitTime) delay = waitTime;
    const action = (): Promise<void> =>
      this.doWaitOnElementWithTextToBecome(text, false, delay);

    this.actions.push(action);
    return this;
  }

  public pageShouldContainText(text: string): FluentTester {
    const action = (): Promise<void> => this.doCheckPageToContainText(text);

    this.actions.push(action);
    return this;
  }

  public pageShouldNotContainText(text: string): FluentTester {
    const action = (): Promise<void> => this.doCheckPageNotToContainText(text);

    this.actions.push(action);
    return this;
  }

  /**
   * Wait for the Tabulator table to become visible (at least one row).
   */
  public waitOnTabulatorToBecomeVisible(waitTime?: number): FluentTester {
    let delay = Constants.DELAY_HUNDRED_SECONDS;
    if (waitTime) delay = waitTime;
    const action = (): Promise<void> =>
      this.doWaitOnElementToHaveCount('div.tabulator-row', 1, delay);

    this.actions.push(action);
    return this;
  }

  /**
   * Wait for the Tabulator table to have exactly expectedCount rows.
   */
  public waitOnTabulatorToHaveRowCount(expectedCount: number, waitTime?: number): FluentTester {
    let delay = Constants.DELAY_HUNDRED_SECONDS;
    if (waitTime) delay = waitTime;
    const action = (): Promise<void> =>
      this.doWaitOnElementToHaveCount('div.tabulator-row', expectedCount, delay);

    this.actions.push(action);
    return this;
  }

  /**
   * Assert the Tabulator cell at (rowIndex, columnField) has the expected text.
   */
  public tabulatorCellShouldHaveText(rowIndex: number, columnField: string, expectedText: string): FluentTester {
    const action = async (): Promise<void> => {
      const cell = this.window
        .locator('div.tabulator-row')
        .nth(rowIndex)
        .locator(`div[tabulator-field="${columnField}"]`);
      await expect(cell).toHaveText(expectedText);
    };
    this.actions.push(action);
    return this;
  }

  /**
   * Assert at least one Tabulator row has a cell in the given column with the expected text.
   */
  public tabulatorShouldContainCellText(columnField: string, expectedText: string): FluentTester {
    const action = async (): Promise<void> => {
      const cells = this.window.locator(`div[tabulator-field="${columnField}"]`);
      const count = await cells.count();
      let found = false;
      for (let i = 0; i < count; i++) {
        const text = await cells.nth(i).textContent();
        if (text && text.trim() === expectedText) {
          found = true;
          break;
        }
      }
      expect(found).toBeTruthy();
    };
    this.actions.push(action);
    return this;
  }

  public waitOnElementToBecomeVisible(
    selector: string,
    waitTime?: number,
  ): FluentTester {
    let delay = Constants.DELAY_HUNDRED_SECONDS;
    if (waitTime) delay = waitTime;
    const action = (): Promise<void> =>
      this.doWaitOnElementToHaveCount(selector, 1, delay);

    this.actions.push(action);
    return this;
  }

  public waitOnElementToBecomeInvisible(
    selector: string,
    waitTime?: number,
  ): FluentTester {
    //console.log(selector);

    let delay = Constants.DELAY_HUNDRED_SECONDS;
    if (waitTime) delay = waitTime;

    const action = (): Promise<void> =>
      this.doWaitOnElementToHaveCount(selector, 0, delay);

    this.actions.push(action);
    return this;
  }

  public waitOnElementToBecomeEnabled(
    selector: string,
    waitTime?: number,
  ): FluentTester {
    let delay = Constants.DELAY_HUNDRED_SECONDS;
    if (waitTime) delay = waitTime;
    const action = (): Promise<void> =>
      this.doWaitOnElementToBecomeEnabledDisabled(selector, true, delay);

    this.actions.push(action);
    return this;
  }

  public waitOnElementToBecomeDisabled(
    selector: string,
    waitTime?: number,
  ): FluentTester {
    let delay = Constants.DELAY_HUNDRED_SECONDS;
    if (waitTime) delay = waitTime;
    const action = (): Promise<void> =>
      this.doWaitOnElementToBecomeEnabledDisabled(selector, false, delay);

    this.actions.push(action);
    return this;
  }

  public waitOnProcessingToStart(howToCheck: string): FluentTester {
    const action = (): Promise<void> =>
      this.doWaitOnProcessingToStart(howToCheck);

    this.actions.push(action);
    return this;
  }

  public waitOnProcessingToFinish(howToCheck: string): FluentTester {
    const action = (): Promise<void> =>
      this.doWaitOnProcessingToFinish(howToCheck);

    this.actions.push(action);
    return this;
  }

  public killHangingJavaProcesses(): FluentTester {
    const action = (): Promise<void> => Helpers.killHangingJavaProcesses();

    this.actions.push(action);
    return this;
  }

  public appStatusShouldBeGreatNoErrorsNoWarnings(): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckAppStatus(Constants.STATUS_GREAT_NO_ERRORS_NO_WARNINGS);

    this.actions.push(action);
    return this;
  }

  public appStatusShouldShowErrorsOrWarnings(): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckElementExists('#btnGreatNoErrorsNoWarnings', false);

    this.actions.push(action);
    return this;
  }

  public appStatusShouldShowErrors(): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckAppStatus(Constants.STATUS_ERRORS);

    this.actions.push(action);
    return this;
  }

  public appStatusShouldShowWarnings(): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckAppStatus(Constants.STATUS_WARNINGS);

    this.actions.push(action);
    return this;
  }

  public elementCheckBoxShouldBeSelected(selector: string): FluentTester {
    const isChecked = true;
    const action = (): Promise<void> =>
      this.doCheckCheckBoxValue(selector, isChecked);

    this.actions.push(action);
    return this;
  }

  public elementCheckBoxShouldNotBeSelected(selector: string): FluentTester {
    const isChecked = false;
    const action = (): Promise<void> =>
      this.doCheckCheckBoxValue(selector, isChecked);

    this.actions.push(action);
    return this;
  }

  public elementAttributeShouldHaveValue(
    selector: string,
    attribute: string,
    value: string,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckElementAttributeHasValue(selector, attribute, value);

    this.actions.push(action);
    return this;
  }

  public elementShouldHaveAttribute(
    selector: string,
    attribute: string,
  ): FluentTester {
    const isPresent = true;

    const action = (): Promise<void> =>
      this.doCheckElementAttributeExistence(selector, attribute, isPresent);

    this.actions.push(action);
    return this;
  }

  public elementShouldNotHaveAttribute(
    selector: string,
    attribute: string,
  ): FluentTester {
    const isPresent = false;

    const action = (): Promise<void> =>
      this.doCheckElementAttributeExistence(selector, attribute, isPresent);

    this.actions.push(action);
    return this;
  }

  public setValue(selector: string, value: string): FluentTester {
    const action = (): Promise<void> => this.doSetValue(selector, value);

    this.actions.push(action);
    return this;
  }

  public setInputFiles(
    selector: string,
    files: string | readonly string[],
  ): FluentTester {
    const action = (): Promise<void> => this.doSetInputFiles(selector, files);

    this.actions.push(action);
    return this;
  }

  public selectedOptionShouldContainText(
    selector: string,
    value: string,
  ): FluentTester {
    let action = (): Promise<void> =>
      this.doCheckSelectedOptionShouldContainText(selector, value);

    this.actions.push(action);
    return this;
  }

  public dropDownSelectOptionHavingLabel(
    selector: string,
    label: string,
  ): FluentTester {
    let action = (): Promise<void> =>
      this.doDropDownSelectOptionHavingLabel(selector, label);

    this.actions.push(action);
    return this;
  }

  // Add this public method
  public dropDownSelectOptionHavingValue(
    selector: string,
    value: string,
  ): FluentTester {
    let action = (): Promise<void> =>
      this.doDropDownSelectOptionHavingValue(selector, value);

    this.actions.push(action);
    return this;
  }

  public selectNgOption(
    dropdownSelector: string,
    optionText: string,
    waitForValueSelection: boolean = true,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doSelectNgOption(
        dropdownSelector,
        optionText,
        waitForValueSelection,
      );
    this.actions.push(action);
    return this;
  }

  public waitOnToastToBecomeVisible(
    type: 'success' | 'warning' | 'error' | 'info',
    messageText?: string,
    waitTime?: number,
  ): FluentTester {
    let delay = Constants.DELAY_TEN_SECONDS; // Use a shorter default timeout
    if (waitTime) delay = waitTime;

    const action = (): Promise<void> =>
      this.doWaitOnToastToBecomeVisible(type, messageText, delay);

    this.actions.push(action);
    return this;
  }

  private async doWaitOnToastToBecomeVisible(
    type: 'success' | 'warning' | 'error' | 'info',
    messageText?: string,
    waitTime?: number,
  ): Promise<void> {
    // Map type to the appropriate toast class
    const typeClass = `toast-${type}`;

    // First wait for any toast of the specified type
    await this.window.waitForSelector(`.${typeClass}`, {
      state: 'visible',
      timeout: waitTime,
    });

    // If no specific message checking is needed, return immediately
    if (!messageText) return;

    // For specific message text, find all toast messages of this type
    const toastElements = await this.window.$$(`.${typeClass} .toast-message`);

    // Check each toast message's text content
    for (const toast of toastElements) {
      const text = await toast.textContent();
      if (text && text.toLowerCase().includes(messageText.toLowerCase())) {
        return; // Found the message, exit immediately
      }
    }

    // If we get here, the specific message wasn't found
    throw new Error(
      `Toast of type ${type} with message "${messageText}" not found`,
    );
  }

  private async doSelectNgOption(
    dropdownSelector: string,
    optionText: string,
    waitForValueSelection: boolean = true,
  ): Promise<void> {
    // Click the dropdown to open it
    await this.doClick(dropdownSelector);

    // Find and click the specific option
    const optionSelector = `span.ng-option-label:has-text("${optionText}")`;
    await this.window.waitForSelector(optionSelector, {
      state: 'visible',
      timeout: Constants.DELAY_HUNDRED_SECONDS,
    });
    await this.window.click(optionSelector);

    // If requested, wait for selection to be visible
    if (waitForValueSelection) {
      await this.window
        .waitForSelector('.ng-value', {
          state: 'visible',
          timeout: Constants.DELAY_HUNDRED_SECONDS,
        })
        .catch(() => {
          // Some dropdowns may have different selection indicators
          console.log('Warning: .ng-value not found after option selection');
        });
    }
  }

  public dropDownShouldHaveSelectedOption(
    selector: string,
    expectedValue: string,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doDropDownShouldHaveSelectedOption(selector, expectedValue);

    this.actions.push(action);
    return this;
  }

  public elementShouldContainText(
    selector: string,
    value: string,
  ): FluentTester {
    let action = (): Promise<void> =>
      this.doCheckElementToContainText(selector, value);

    this.actions.push(action);
    return this;
  }

  public elementShouldNotContainText(
    selector: string,
    value: string,
  ): FluentTester {
    let action = (): Promise<void> =>
      this.doCheckElementToNotContainText(selector, value);

    this.actions.push(action);
    return this;
  }

  private async doCheckElementToNotContainText(
    selector: string,
    text: string,
  ): Promise<void> {
    return expect(this.window.locator(selector)).not.toContainText(text);
  }

  public waitOnElementToContainText(
    selector: string,
    value: string,
    waitTime?: number,
  ): FluentTester {
    /*
    if (selector == '#divMONTHLY-PAYSLIPS-SPLIT') {
      const content = this.window.locator(selector);
      console.log(`#divMONTHLY-PAYSLIPS-SPLIT content = ${content}`);
    }
    */

    let action = (): Promise<void> =>
      this.doWaitOnElementToContainText(selector, value, waitTime);

    this.actions.push(action);
    return this;
  }

  public elementShouldHaveText(selector: string, value: string): FluentTester {
    let action = (): Promise<void> =>
      this.doCheckElementToHaveText(selector, value);

    this.actions.push(action);
    return this;
  }

  public waitOnElementToHaveText(
    selector: string,
    text: string,
    waitTime?: number,
  ): FluentTester {
    let wTime = Constants.DELAY_FIVE_THOUSANDS_SECONDS;
    if (waitTime) wTime = waitTime;
    let action = (): Promise<void> =>
      this.doWaitOnElementToHaveText(selector, text, wTime);

    this.actions.push(action);
    return this;
  }

  public waitOnInputToHaveValue(
    selector: string,
    text: string,
    waitTime?: number,
  ): FluentTester {
    let wTime = Constants.DELAY_FIVE_THOUSANDS_SECONDS;
    if (waitTime) wTime = waitTime;
    let action = (): Promise<void> =>
      this.doWaitOnInputToHaveValue(selector, text, wTime);

    this.actions.push(action);
    return this;
  }

  public waitOnInputValueToContainText(
    selector: string,
    text: string,
    waitTime?: number,
  ): FluentTester {
    let action = (): Promise<void> =>
      this.doWaitOnInputValueToContainText(selector, text, waitTime);

    this.actions.push(action);
    return this;
  }

  public inputValueShouldContainText(
    selector: string,
    text: string,
  ): FluentTester {
    let action = (): Promise<void> =>
      this.doWaitOnInputValueToContainText(selector, text);

    this.actions.push(action);
    return this;
  }

  public inputShouldHaveValue(selector: string, value: string): FluentTester {
    let action = (): Promise<void> =>
      this.doWaitOnInputToHaveValue(selector, value);

    this.actions.push(action);
    return this;
  }

  public elementShouldNotBeVisible(selector: string): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckElementExists(selector, false);

    this.actions.push(action);
    return this;
  }

  public elementShouldBeVisible(selector: string): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckElementExists(selector, true);

    this.actions.push(action);
    return this;
  }

  public elementShouldHaveClass(
    selector: string,
    className: string,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckElementClass(selector, className, true);

    this.actions.push(action);
    return this;
  }

  public elementShouldNotHaveClass(
    selector: string,
    className: string,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckElementClass(selector, className, false);

    this.actions.push(action);
    return this;
  }

  public waitOnElementToHaveClass(
    selector: string,
    className: string,
    waitTime?: number,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doWaitOnElementClass(selector, className, true, waitTime);

    this.actions.push(action);
    return this;
  }

  public waitOnElementNotToHaveClass(
    selector: string,
    className: string,
    waitTime?: number,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doWaitOnElementClass(selector, className, false, waitTime);

    this.actions.push(action);
    return this;
  }

  public elementShouldBeEnabled(selector: string): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckElementEnabledStatus(selector, true);

    this.actions.push(action);
    return this;
  }

  public elementShouldBeDisabled(selector: string): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckElementEnabledStatus(selector, false);

    this.actions.push(action);
    return this;
  }

  public infoDialogShouldBeVisible(): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckElementExists('dburst-info-dialog', true);

    this.actions.push(action);
    return this;
  }

  public confirmDialogShouldBeVisible(): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckElementExists('.dburst-button-question-confirm', true);

    this.actions.push(action);
    return this;
  }

  public appShouldBeReadyToRunNewJobs(): FluentTester {
    const action = (): Promise<void> => this.doAppShouldBeReadyToRunNewJobs();

    this.actions.push(action);
    return this;
  }

  public waitOnAppSkinToBeCorrectlySaved(skin: string): FluentTester {
    const action = (): Promise<void> =>
      this.doWaitOnSkinToBeCorrectlySaved(skin);

    this.actions.push(action);
    return this;
  }

  public processingShouldHaveGeneratedOutputFiles(
    listOfFiles: string[],
    fileSuffix: string = 'pdf',
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doVerifyOutputFiles(listOfFiles, fileSuffix);

    this.actions.push(action);
    return this;
  }

  public processingShouldHaveGeneratedQuarantineFiles(
    listOfFiles: string[],
    fileSuffix: string = 'pdf',
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doVerifyQuarantineFiles(listOfFiles, fileSuffix);

    this.actions.push(action);
    return this;
  }

  public processingShouldHaveGeneratedNFilesHavingSuffix(
    n: number,
    suffix: string,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doVerifyNumberOfOutputFilesHavingSuffix(n, suffix);

    this.actions.push(action);
    return this;
  }

  public processingShouldHaveGeneratedFewFilesHavingSuffix(
    suffix: string,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doVerifyFewOutputFilesHavingSuffix(suffix);

    this.actions.push(action);
    return this;
  }

  public appShouldHaveNoActiveJob(): FluentTester {
    const action = (): Promise<void> => this.doVerifyTempFolderIsClean();

    this.actions.push(action);
    return this;
  }

  public appShouldHaveNActiveJobs(n: number): FluentTester {
    const action = (): Promise<void> => this.doVerifyNActiveJobs(n);

    this.actions.push(action);
    return this;
  }

  public takeNamedScreenshotIfRequested(screenshotName: string): FluentTester {
    const action = (): Promise<void> =>
      takeScreenshotIfRequested(this.window, screenshotName);

    this.actions.push(action);
    return this;
  }

  public shouldHaveSentNCorrectEmails(
    qaMode: string,
    n: number,
    attachmentsCommand: string,
    attachmentType: string = 'pdf',
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doVerifyEmails(qaMode, n, attachmentsCommand, attachmentType);

    this.actions.push(action);
    return this;
  }

  public gotoBurstScreen(): FluentTester {
    const action = (): Promise<void> => this.doGoToBurstScreen();

    this.actions.push(action);
    return this;
  }

  public gotoReportGenerationScreen(): FluentTester {
    const action = (): Promise<void> => this.doGotoProcessingReportGeneration();

    this.actions.push(action);
    return this;
  }

  public gotoStartScreen(): FluentTester {
    const action = (): Promise<void> => this.doGotoStart();

    this.actions.push(action);
    return this;
  }

  public gotoProcessingMergeBurstScreen(): FluentTester {
    const action = (): Promise<void> => this.doGotoProcessingMergeBurstScreen();

    this.actions.push(action);
    return this;
  }

  public gotoProcessingQualityAssuranceScreen(): FluentTester {
    const action = (): Promise<void> =>
      this.doGotoProcessingQualityAssuranceScreen();

    this.actions.push(action);
    return this;
  }

  gotoConfigurationTemplates = (): FluentTester => {
    const action = (): Promise<void> => this.doGotoConfigurationTemplates();

    this.actions.push(action);
    return this;
  };

  private async doGotoConfigurationTemplates(): Promise<void> {
    //await this.doHover('#supportEmail');
    //await this.doClick('#supportEmail');

    await this.doHover('#topMenuBurst');
    await Helpers.delay(Constants.DELAY_HUNDRED_MILISECONDS);
    await this.doClick('#topMenuBurst');
    await Helpers.delay(Constants.DELAY_HUNDRED_MILISECONDS);

    //await this.doHover('#supportEmail');
    //await this.doClick('#supportEmail');

    //await this.doClick('#topMenuBurst');

    await this.doHover('#topMenuConfiguration');
    await Helpers.delay(Constants.DELAY_HUNDRED_MILISECONDS);
    //await this.doFocus('#topMenuConfiguration');

    await this.doClick('#topMenuConfiguration');
    await Helpers.delay(Constants.DELAY_HUNDRED_MILISECONDS);

    /*
    await this.doWaitOnElementToBecomeVisible(
      '#topMenuConfigurationManage',
      Constants.DELAY_HUNDRED_SECONDS
    );
      */

    //await this.doFocus('#topMenuConfigurationManage');
    //await this.doHover('#topMenuConfigurationManage');

    //await this.doFocus('#topMenuConfigurationManage');
    //await this.doClick('#topMenuConfigurationManage');

    /*
   
    await this.doWaitOnElementToBecomeVisible(
      '#topMenuConfigurationTemplates',
      Constants.DELAY_HUNDRED_SECONDS
    );
      */
    //await this.doWaitOnElementToBecomeVisible('#topMenuConfigurationTemplates');
    await this.doHover('#topMenuConfigurationTemplates');
    await this.doClick('#topMenuConfigurationTemplates');
    /*
   
    await this.doWaitOnElementToBecomeVisible(
      `#burst_${PATHS.SETTINGS_CONFIG_FILE}`,
      Constants.DELAY_HUNDRED_SECONDS
    );
  */
    await this.doClickAndSelectTableRow(
      `#confTemplatesTable tbody tr:first-child`,
    );

    await this.doWaitOnElementToBecomeEnabledDisabled(
      '#btnEdit',
      true,
      Constants.DELAY_TEN_SECONDS,
    );
    await this.doWaitOnElementToBecomeEnabledDisabled(
      '#btnDuplicate',
      true,
      Constants.DELAY_TEN_SECONDS,
    );
    await this.doWaitOnElementToBecomeEnabledDisabled(
      '#btnDelete',
      true,
      Constants.DELAY_TEN_SECONDS,
    );
  }

  public gotoConfigurationGeneralSettings(): FluentTester {
    const action = (): Promise<void> =>
      this.doGotoConfigurationGeneralSettings();

    this.actions.push(action);
    return this;
  }

  public gotoConnections(): FluentTester {
    const action = (): Promise<void> => this.doGotoConnections();

    this.actions.push(action);
    return this;
  }

  public gotoConfiguration(): FluentTester {
    const action = (): Promise<void> => this.doGotoConfiguration();

    this.actions.push(action);
    return this;
  }

  public gotoConfigurationEmailSettings(): FluentTester {
    const action = (): Promise<void> => this.doGotoConfigurationEmailSettings();

    this.actions.push(action);
    return this;
  }

  public gotoConfigurationSMSSettings(): FluentTester {
    const action = (): Promise<void> => this.doGotoConfigurationSMSSettings();

    this.actions.push(action);
    return this;
  }

  public setCodeJarContentFromFile(
    selector: string,
    filePath: string,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doSetCodeJarContentFromFile(selector, filePath);

    this.actions.push(action);
    return this;
  }

  //PRIVATE STUFF

  private async doVerifyEmails(
    qaMode: string,
    howManyEmails: number,
    attachmentsCommand: string,
    attachmentType: string = 'pdf',
  ): Promise<void> {
    let emailMessages: any;

    if (qaMode != Constants.QA_TA) {
      const emailMessagesResponse = await (<any>chai)
        .request('http://localhost:8025')
        .get('/api/v2/messages');

      should.exist(emailMessagesResponse);

      emailMessagesResponse.should.have.status(200);
      emailMessagesResponse.should.be.a('object');
      emailMessages = JSON.parse(emailMessagesResponse.text);

      // assert 2 email messages were sent / received
      emailMessages.total.should.equal(howManyEmails);
      emailMessages.count.should.equal(howManyEmails);
    }
    let recipientEmailAddresses = [];

    for (let i = 0; i < howManyEmails; i++) {
      let recipientEmailAddress = Constants.PAYSLIPS_PDF_BURST_TOKENS[i];

      if (qaMode != Constants.QA_TA) {
        emailMessages.items[i].To[0].Domain.should.equal(
          'northridgehealth.org',
        );

        // assert the email subject is correct
        recipientEmailAddress =
          emailMessages.items[i].To[0].Mailbox +
          '@' +
          emailMessages.items[i].To[0].Domain;

        // assert the email message is correct
        const emailSubject = emailMessages.items[i].Content.Headers.Subject[0];
        emailSubject.startsWith('Subject ').should.be.true;

        const identifiedToken = emailSubject.replace('Subject ', '');

        const emailBody = emailMessages.items[i].Content.Body;

        // body0.should.have.string('Message ' + recipientEmailAddress);
        emailBody.should.have.string(`Message ${identifiedToken}`);

        //assert branding
        emailBody.should.have.string('Sent by');

        // assert there are no attachments
        if (attachmentsCommand === Constants.ATTACHMENTS_CLEAR)
          emailBody.should.not.have.string('Content-Disposition: attachment;');
        else if (attachmentsCommand === Constants.ATTACHMENTS_ADD_AND_ZIP) {
          // assert there is a correct zip file attached
          emailBody.should.have.string('Content-Disposition: attachment;');
          emailBody.should.have.string(`reports-${identifiedToken}.zip`);
        } else if (attachmentsCommand === Constants.ATTACHMENTS_DEFAULT) {
          // assert there is a correct zip file attached
          emailBody.should.have.string('Content-Disposition: attachment;');

          if (attachmentType == 'pdf')
            emailBody.should.have.string(
              `${identifiedToken}.${attachmentType}`,
            );

          // Log the entire email body for debugging
          // console.log('Email Body:', emailBody);

          if (attachmentType == 'docx')
            emailBody.should.have.string(
              `${Constants.PAYSLIPS_PDF_BURST_TOKENS.indexOf(recipientEmailAddress)}.${attachmentType}`,
            );
        } else if (attachmentsCommand === Constants.ATTACHMENTS_XLS_ONLY) {
          // assert there is a correct zip file attached
          emailBody.should.have.string('Content-Disposition: attachment;');
          emailBody.should.have.string('Customers-Distinct-Column-Values.xls');
        } else if (attachmentsCommand === Constants.ATTACHMENTS_PDF_AND_XLS) {
          // assert there is a correct zip file attached
          emailBody.should.have.string('Content-Disposition: attachment;');
          emailBody.should.have.string(recipientEmailAddress + '.pdf');
          emailBody.should.have.string('Customers-Distinct-Column-Values.xls');
        }
        // assert ${recipientEmailAddress}_email.txt was generated
        let emailFilePath = await jetpack.findAsync(
          process.env.PORTABLE_EXECUTABLE_DIR,
          {
            matching: `output/**/${identifiedToken}_email.txt`,
          },
        );
        if (attachmentType == 'docx')
          emailFilePath = await jetpack.findAsync(
            process.env.PORTABLE_EXECUTABLE_DIR,
            {
              matching: `output/**/${Constants.PAYSLIPS_PDF_BURST_TOKENS.indexOf(recipientEmailAddress)}_email.txt`,
            },
          );

        should.exist(emailFilePath);
        emailFilePath.length.should.equal(1);
      }

      recipientEmailAddresses.push(recipientEmailAddress);
    }

    /*
    await jetpack.writeAsync(
      `${process.env.PORTABLE_EXECUTABLE_DIR}/e2e-${qaMode}.log`,
      `${qaMode} - ${recipientEmailAddresses}`
    );
    */

    Constants.PAYSLIPS_PDF_BURST_TOKENS.should.include.members(
      recipientEmailAddresses,
    );
  }

  private async doVerifyTempFolderIsClean(): Promise<void> {
    const jobFiles = await jetpack.findAsync(
      path.join(process.env.PORTABLE_EXECUTABLE_DIR, '/temp'),
      {
        matching: ['**/*.*', '!**/*.pdf'],
      },
    );

    expect(jobFiles.length).toEqual(0);
  }

  private async doVerifyNActiveJobs(n: number): Promise<void> {
    const jobFiles = await jetpack.findAsync(
      path.join(process.env.PORTABLE_EXECUTABLE_DIR, '/temp'),
      {
        matching: ['**/*.*', '!**/*.pdf'],
      },
    );

    expect(jobFiles.length).toEqual(n);
  }

  private async doVerifyNumberOfOutputFilesHavingSuffix(
    n: number,
    suffix: string,
  ): Promise<void> {
    const outputFilePaths = await jetpack.findAsync(
      process.env.PORTABLE_EXECUTABLE_DIR,
      {
        matching: `output/**/*${suffix}`,
      },
    );
    should.exist(outputFilePaths);

    expect(outputFilePaths.length).toEqual(n);
  }

  private async doVerifyFewOutputFilesHavingSuffix(
    suffix: string,
  ): Promise<void> {
    const outputFilePaths = await jetpack.findAsync(
      process.env.PORTABLE_EXECUTABLE_DIR,
      {
        matching: `output/**/*${suffix}`,
      },
    );
    should.exist(outputFilePaths);

    expect(outputFilePaths.length).toBeGreaterThan(0);
  }

  private async doVerifyOutputFiles(
    listOfFiles: string[],
    fileSuffix: string = 'pdf',
  ): Promise<void> {
    const outputFilePaths = await jetpack.findAsync(
      process.env.PORTABLE_EXECUTABLE_DIR,
      {
        matching: `output/**/*${fileSuffix}`,
      },
    );
    const outputFileNames = outputFilePaths.map(function (filePath) {
      return path.basename(filePath);
    });

    should.exist(outputFileNames);

    try {
      expect(
        Helpers.arrayEquals(outputFileNames.sort(), listOfFiles.sort()),
      ).toBeTruthy();
    } catch (e) {
      throw new Error(
        `Expected ${listOfFiles.sort()} but generated ${outputFileNames.sort()}`,
      );
    }
  }

  private async doDropDownShouldHaveSelectedOption(
    selector: string,
    expectedValue: string,
  ): Promise<void> {
    const selectElement = this.window.locator(selector);

    // Get the currently selected option's value
    const actualValue = await selectElement.evaluate((select) => {
      const selectElem = select as HTMLSelectElement;
      return selectElem.value;
    });

    // Assert that the actual value matches the expected value
    return expect(actualValue).toEqual(expectedValue);
  }

  private async doVerifyQuarantineFiles(
    listOfFiles: string[],
    fileSuffix: string = 'pdf',
  ): Promise<void> {
    const quarantineFilePaths = await jetpack.findAsync(
      process.env.PORTABLE_EXECUTABLE_DIR,
      {
        matching: `quarantine/**/*${fileSuffix}`,
      },
    );
    const quarantineFileNames = quarantineFilePaths.map(function (filePath) {
      return path.basename(filePath);
    });

    should.exist(quarantineFileNames);

    try {
      expect(
        Helpers.arrayEquals(quarantineFileNames.sort(), listOfFiles.sort()),
      ).toBeTruthy();
    } catch (e) {
      throw new Error(
        `Expected ${listOfFiles.sort()} but generated ${quarantineFileNames.sort()}`,
      );
    }
  }

  private async doRenameFile(path: string, newName: string): Promise<void> {
    return jetpack.renameAsync(path, newName);
  }

  private async doMoveFile(srcPath: string, destPath: string): Promise<void> {
    return jetpack.moveAsync(srcPath, destPath, { overwrite: true });
  }

  private async doCreateFolder(path: string): Promise<void> {
    await jetpack.dirAsync(path);
  }

  private async doCopyFile(srcPath: string, destPath: string): Promise<void> {
    await jetpack.copyAsync(srcPath, destPath, { overwrite: true });
  }

  private async doDeleteFolder(path: string): Promise<void> {
    await jetpack.removeAsync(path);
  }

  protected async doHover(selector: string): Promise<void> {
    this.focusedElement = this.window.locator(selector);
    return this.focusedElement.hover();
  }

  private async doFocus(selector: string): Promise<void> {
    this.focusedElement = this.window.locator(selector);

    return this.focusedElement.focus();
  }

  protected async doScrollIntoViewIfNeeded(selector: string): Promise<void> {
    this.focusedElement = this.window.locator(selector);

    return this.focusedElement.scrollIntoViewIfNeeded();
  }

  protected async doClick(selector: string): Promise<void> {
    this.focusedElement = this.window.locator(selector);

    return this.focusedElement.click();
  }

  protected async doClickElementContainingText(text: string): Promise<void> {
    this.focusedElement = this.window.locator(`:has-text('${text}')`);

    return this.focusedElement.click();
  }

  private async doDblClick(selector: string): Promise<void> {
    this.focusedElement = this.window.locator(selector);
    return this.focusedElement.dblclick();
  }

  protected async doClickAndSelectTableRow(selector: string): Promise<void> {
    //await this.doFocus(selector);

    try {
      await this.doHover(selector);
      await this.doClick(selector);
    } catch {
      await this.doHover(selector);
      await this.doDblClick(selector);
    }
  }

  private async doTypeText(text: string): Promise<void> {
    return this.focusedElement.fill(text);
  }

  private async doPressKey(key: string): Promise<void> {
    return this.window.keyboard.press(key);
  }

  private async doSetCodeJarContentFromFile(
    selector: string,
    filePath: string,
  ): Promise<void> {
    const content = await jetpack.readAsync(filePath);

    if (!content) {
      throw new Error(`Failed to read file content from ${filePath}`);
    }

    return this.doSetCodeJarContentSingleShot(selector, content);
  }

  //private async doPageReload(): Promise<void> {
  //this.window.reload();
  //this.window.goto(this.window.url());
  //}

  private async doWaitOnElementToBecomeVisible(
    selector: string,
    waitTime?: number,
  ): Promise<void> {
    return expect(this.window.locator(selector)).toBeVisible({
      timeout: waitTime,
    });
  }

  private async doCheckPageToContainText(text: string): Promise<void> {
    return expect(this.window.getByText(text) !== undefined).toBeTruthy();
  }

  private async doCheckPageNotToContainText(text: string): Promise<void> {
    return expect(this.window.getByText(text) !== undefined).toBeFalsy();
  }

  private async doWaitOnElementToHaveCount(
    selector: string,
    count: number,
    waitTime: number,
  ): Promise<void> {
    return expect(this.window.locator(selector)).toHaveCount(count, {
      timeout: waitTime,
    });
  }

  private async doWaitOnInputValueToContainText(
    selector: string,
    text: string,
    waitTime?: number,
  ): Promise<void> {
    let wTime = Constants.DELAY_FIVE_THOUSANDS_SECONDS;
    if (waitTime) wTime = waitTime;

    return expect(this.window.locator(selector)).toHaveValue(
      new RegExp(text, 'i'),
      {
        timeout: wTime,
      },
    );
  }

  private async doWaitOnInputToHaveValue(
    selector: string,
    value: string,
    waitTime?: number,
  ): Promise<void> {
    let wTime = Constants.DELAY_TEN_SECONDS;
    if (waitTime) wTime = waitTime;

    return expect(this.window.locator(selector)).toHaveValue(value, {
      timeout: wTime,
    });
  }

  private async doWaitOnElementToHaveText(
    selector: string,
    text: string,
    waitTime: number,
  ): Promise<void> {
    return expect(this.window.locator(selector)).toHaveText(text, {
      timeout: waitTime,
    });
  }

  public waitOnElementToBecomeReadonly(
    selector: string,
    waitTime?: number,
  ): FluentTester {
    let delay = Constants.DELAY_HUNDRED_SECONDS;
    if (waitTime) delay = waitTime;
    const action = (): Promise<void> =>
      this.doWaitOnElementToBecomeReadonlyEditable(selector, true, delay);

    this.actions.push(action);
    return this;
  }

  public waitOnElementToBecomeEditable(
    selector: string,
    waitTime?: number,
  ): FluentTester {
    let delay = Constants.DELAY_HUNDRED_SECONDS;
    if (waitTime) delay = waitTime;
    const action = (): Promise<void> =>
      this.doWaitOnElementToBecomeReadonlyEditable(selector, false, delay);

    this.actions.push(action);
    return this;
  }

  public setQuillContent(selector: string, content: string): FluentTester {
    const action = (): Promise<void> => this.doSetQuillContent(selector, content);
    this.actions.push(action);
    return this;
  }

  private async doSetQuillContent(selector: string, content: string): Promise<void> {
    const editorSelector = `${selector} .ql-editor`;
    await this.window.locator(editorSelector).click();
    await this.window.locator(editorSelector).fill(''); // Clear existing content
    await this.window.locator(editorSelector).press('Control+A');
    await this.window.locator(editorSelector).press('Delete');
    await this.window.locator(editorSelector).fill(content);
  }

  public quillShouldContainText(selector: string, text: string): FluentTester {
    const action = (): Promise<void> => this.doQuillShouldContainText(selector, text);
    this.actions.push(action);
    return this;
  }

  private async doQuillShouldContainText(selector: string, text: string): Promise<void> {
    const editorSelector = `${selector} .ql-editor`;
    await expect(this.window.locator(editorSelector)).toContainText(text);
  }

  // Add this to your FluentTester class
  public codeJarShouldContainText(
    selector: string,
    text: string,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckCodeJarContainsText(selector, text);
    this.actions.push(action);
    return this;
  }

  public codeJarShouldNotContainText(
    selector: string,
    text: string,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doCheckCodeJarDoesNotContainText(selector, text);
    this.actions.push(action);
    return this;
  }

  private async doCheckCodeJarContainsText(
    selector: string, // This is the main CodeJar container, e.g., '#sqlQueryEditor'
    expectedText: string,
  ): Promise<void> {
    //const codeJarContainer = this.window.locator(selector);
    //await expect(codeJarContainer).toBeVisible({
    //  timeout: Constants.DELAY_FIVE_THOUSANDS_SECONDS,
    //});

    // Selector for the actual editable <pre> element within the CodeJar component
    const editablePreSelector = `${selector} pre[contenteditable]`;

    const actualContent = await this.window.evaluate((sel) => {
      const preElement = document.querySelector(sel) as HTMLPreElement | null;
      if (!preElement) {
        return null;
      }
      // For an empty editor, textContent should be "" or perhaps "\n" if it contains a single <br>
      // Using innerText might be slightly more robust for how browsers interpret visible text
      // but textContent is generally faster. Let's stick with textContent and normalize.
      //return preElement.textContent || '';
      return preElement.innerText || '';
    }, editablePreSelector);

    if (actualContent === null) {
      throw new Error(
        `CodeJar editor's editable <pre> element with selector "${editablePreSelector}" was not found.`,
      );
    }

    // Normalize newline characters and trim whitespace.
    // Trimming is important because an "empty" editor might have a newline character.
    const normalizeAndTrim = (str: string) =>
      str.replace(/\r\n|\r/g, '\n').trim();

    const normalizedActualContent = normalizeAndTrim(actualContent);
    const normalizedExpectedText = normalizeAndTrim(expectedText);

    if (normalizedExpectedText === '') {
      // If expecting an empty string, the normalized content must be exactly empty.
      expect(normalizedActualContent).toEqual('');
    } else {
      // If expecting non-empty text, check if the normalized content includes it.
      // Using toEqual for non-empty might be too strict if formatting/whitespace within the expected text matters.
      // Using toContain is generally safer for "contains" checks.
      // If an exact match is needed for non-empty strings, change toEqual here too.
      expect(normalizedActualContent).toContain(normalizedExpectedText);
    }
  }

  private async doCheckCodeJarDoesNotContainText(
    selector: string,
    expectedText: string,
  ): Promise<void> {
    const editablePreSelector = `${selector} pre[contenteditable]`;

    const actualContent = await this.window.evaluate((sel) => {
      const preElement = document.querySelector(sel) as HTMLPreElement | null;
      if (!preElement) {
        return null;
      }
      return preElement.innerText || '';
    }, editablePreSelector);

    if (actualContent === null) {
      // If the element doesn't exist, it doesn't contain the text, so this passes.
      return;
    }

    const normalizeAndTrim = (str: string) =>
      str.replace(/\r\n|\r/g, '\n').trim();

    const normalizedActualContent = normalizeAndTrim(actualContent);
    const normalizedExpectedText = normalizeAndTrim(expectedText);

    expect(normalizedActualContent).not.toContain(normalizedExpectedText);
  }

  public setCodeJarContent(selector: string, content: string): FluentTester {
    const action = (): Promise<void> =>
      this.doSetCodeJarContent(selector, content);
    this.actions.push(action);
    return this;
  }

  public setCodeJarContentSingleShot(
    selector: string,
    content: string,
  ): FluentTester {
    const action = (): Promise<void> =>
      this.doSetCodeJarContentSingleShot(selector, content);
    this.actions.push(action);
    return this;
  }

  private async doSetCodeJarContent(
    selector: string,
    content: string,
  ): Promise<void> {
    // First find and focus the editor
    await this.window.locator(`${selector} [contenteditable]`).click();

    // Clear existing content using keyboard shortcuts
    await this.window.keyboard.press('Control+a');
    await this.window.keyboard.press('Delete');

    // Wait briefly for the editor to update
    await this.window.waitForTimeout(100);

    // Type the content using the keyboard API
    await this.window.keyboard.type(content, { delay: 0 });

    // Wait for CodeJar to process events and trigger change detection
    await this.window.waitForTimeout(500);

    // Force save by pressing Ctrl+S (optional - only if your app supports this)
    await this.window.keyboard.press('Control+s');

    // Wait for potential toast notifications
    try {
      await this.window.waitForSelector('.toast-success', {
        state: 'visible',
        timeout: 5000,
      });
      //console.log('Toast success notification appeared');
    } catch (err) {
      console.warn('No success toast appeared after setting content');
    }
  }

  private async doSetCodeJarContentSingleShot(
    selector: string,
    content: string,
  ): Promise<void> {
    // First directly set the content using JavaScript
    await this.window.evaluate(
      ({ selector, content }) => {
        const editor = document.querySelector(
          `${selector} [contenteditable]`,
        );
        if (!editor) {
          throw new Error('CodeJar editor element not found');
        }

        // Use textContent first to avoid HTML interpretation, then convert to innerHTML
        editor.textContent = content;
        const rawContent = editor.innerHTML;
        editor.innerHTML = rawContent;

        // Dispatch events to ensure Angular detects the changes
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));

        return true;
      },
      { selector, content },
    );

    // Continue with the rest of your method...
    await this.window.locator(`${selector} [contenteditable]`).focus();
    await this.window.keyboard.press('End');
    await this.sleep(Constants.DELAY_HALF_SECOND);
    await this.window.keyboard.press('Control+s');
    await this.sleep(Constants.DELAY_HALF_SECOND);
  }

  /*
  private async doSetCodeJarContent(
    selector: string,
    content: string,
  ): Promise<void> {
    // Set content in the code jar component
    await this.window.evaluate(
      ({ selector, content }) => {
        // Find the ngx-codejar component
        const codeJarComponent = document.querySelector(selector);
        if (!codeJarComponent) {
          throw new Error(`CodeJar component not found: ${selector}`);
        }

        // Find the actual editor div (contenteditable element)
        const editor = codeJarComponent.querySelector('[contenteditable]');
        if (!editor) {
          throw new Error('CodeJar editor element not found');
        }

        // Set the content
        editor.innerHTML = content;

        // Trigger input event to notify Angular
        const inputEvent = new Event('input', { bubbles: true });
        editor.dispatchEvent(inputEvent);

        // Also dispatch change event for good measure
        const changeEvent = new Event('change', { bubbles: true });
        editor.dispatchEvent(changeEvent);

        // Get the CodeJar component instance
        const ngCodeJarInstance = Array.from(
          Object.entries(codeJarComponent),
        ).find(
          ([key, value]) =>
            key.startsWith('__ngContext') && value && typeof value === 'object',
        )?.[1];

        // Update the model if possible
        if (ngCodeJarInstance) {
          // Try different property names that could represent the model
          const possibleModelProps = ['code', '_code', 'value'];
          for (const prop of possibleModelProps) {
            if (prop in ngCodeJarInstance) {
              ngCodeJarInstance[prop] = content;
              break;
            }
          }

          // Try to emit the change event
          if (
            'codeChange' in ngCodeJarInstance &&
            typeof ngCodeJarInstance.codeChange?.emit === 'function'
          ) {
            ngCodeJarInstance.codeChange.emit(content);
          }
        }

        return true;
      },
      { selector, content },
    );

    // Small delay to allow Angular to process the change
    await this.window.waitForTimeout(500);

    // Explicitly call the component's onTemplateContentChanged handler
    await this.window.evaluate((selector) => {
      // Find the configuration component
      const configComponent = document.querySelector('dburst-configuration');
      if (!configComponent) return false;

      // Find the Angular component instance with the handler method
      let componentInstance = null;

      // Try different ways to access the component instance
      // Method 1: Look through __ngContext__
      for (const key in configComponent) {
        if (key.startsWith('__ngContext')) {
          const context = configComponent[key];
          // Look for the component instance
          for (
            let i = 0;
            context && Array.isArray(context) && i < context.length;
            i++
          ) {
            if (
              context[i] &&
              typeof context[i].onTemplateContentChanged === 'function'
            ) {
              componentInstance = context[i];
              break;
            }
          }
        }
      }

      // Method 2: Try accessing instance directly
      if (
        !componentInstance &&
        typeof configComponent['onTemplateContentChanged'] === 'function'
      ) {
        componentInstance = configComponent;
      }

      // Call the handler if we found it
      if (componentInstance) {
        const editorContent = document.querySelector(
          `${selector} [contenteditable]`,
        )?.innerHTML;
        if (editorContent) {
          componentInstance.onTemplateContentChanged(editorContent);
          console.log(
            'Successfully called onTemplateContentChanged with content',
          );
          return true;
        }
      }

      console.warn(
        'Could not find component instance with onTemplateContentChanged method',
      );
      return false;
    }, selector);

    // Wait for toast notification indicating save success
    try {
      await this.window.waitForSelector('.toast-success', {
        state: 'visible',
        timeout: 5000,
      });
      console.log('Toast success notification appeared');
    } catch (err) {
      console.warn('No success toast appeared after setting content');
    }
  }
*/

  protected async doWaitOnElementToBecomeReadonlyEditable(
    selector: string,
    isReadonly: boolean,
    waitTime: number,
  ): Promise<void> {
    const locator = this.window.locator(selector);

    if (isReadonly) {
      // Wait for readonly attribute to exist with any value
      return expect(locator).toHaveAttribute('readonly', '', {
        timeout: waitTime,
      });
    } else {
      // Wait for readonly attribute to not exist
      return expect(locator).not.toHaveAttribute('readonly', {
        timeout: waitTime,
      });
    }
  }

  private async doWaitOnElementWithTextToBecome(
    text: string,
    visible: boolean,
    waitTime: number,
  ): Promise<void> {
    //console.log(`waitTime: ${waitTime}`);
    if (visible)
      return expect(this.window.locator(`text=${text}`)).toHaveCount(1, {
        timeout: waitTime,
      });
    else
      return expect(this.window.locator(`text=${text}`)).toHaveCount(0, {
        timeout: waitTime,
      });
  }

  protected async doWaitOnElementToBecomeEnabledDisabled(
    selector: string,
    isEnabled: boolean,
    waitTime: number,
  ): Promise<void> {
    //console.log(`waitTime: ${waitTime}`);
    if (isEnabled)
      return expect(this.window.locator(selector)).toBeEnabled({
        timeout: waitTime,
      });
    else
      return expect(this.window.locator(selector)).toBeDisabled({
        timeout: waitTime,
      });
  }

  private async doCheckElementToContainText(
    selector: string,
    text: string,
  ): Promise<void> {
    return expect(this.window.locator(selector)).toContainText(text);
  }

  private async doCheckSelectedOptionShouldContainText(
    selector: string,
    text: string,
  ): Promise<void> {
    const selectElement = this.window.locator(selector);

    const selectedOption = await selectElement.evaluate((select) => {
      const selectElem = select as HTMLSelectElement;
      return selectElem.options[selectElem.selectedIndex].text;
    });

    expect(selectedOption).toContain(text);
  }

  private async doDropDownSelectOptionHavingLabel(
    selector: string,
    label: string,
  ): Promise<void> {
    const selectElement = this.window.locator(selector);

    selectElement.selectOption({ label: label });
  }

  // Add this private implementation method
  private async doDropDownSelectOptionHavingValue(
    selector: string,
    value: string,
  ): Promise<void> {
    const selectElement = this.window.locator(selector);

    selectElement.selectOption({ value: value });
  }

  // Add this public method
  public setCheckboxState(selector: string, checked: boolean): FluentTester {
    const action = (): Promise<void> =>
      this.doSetCheckboxState(selector, checked);
    this.actions.push(action);
    return this;
  }

  // Add this private implementation method
  private async doSetCheckboxState(
    selector: string,
    checked: boolean,
  ): Promise<void> {
    const isCurrentlyChecked = await this.window.locator(selector).isChecked();

    // Toggle the checkbox only if its current state doesn't match the desired state
    if (isCurrentlyChecked !== checked) {
      await this.window.locator(selector).click();
    }
  }

  private async doSetValue(selector: string, value: string): Promise<void> {
    await this.doClick(selector);
    await this.doTypeText(value);
  }

  private async doSetInputFiles(
    selector: string,
    files: string | readonly string[],
  ): Promise<void> {
    this.focusedElement = this.window.locator(selector);
    await this.focusedElement.setInputFiles(files);
  }

  private async doCheckElementToHaveText(
    selector: string,
    text: string,
  ): Promise<void> {
    return expect(this.window.locator(selector)).toHaveText(text);
  }

  private async doWaitOnFileToContainText(filePath: string, text: string) {
    //console.log(text);

    const startTime = new Date().getTime();

    let content = '';
    let found = false;

    do {
      content = await jetpack.readAsync(filePath);
      //console.log(`filePath = ${filePath}, content = ${content}`);
      const endTime = new Date().getTime();
      if ((endTime - startTime) / 1000 > Constants.DELAY_FIVE_THOUSANDS_SECONDS)
        throw new Error(
          `File ${filePath} still not containing ${text} after waiting ${Constants.DELAY_FIVE_THOUSANDS_SECONDS} seconds`,
        );

      if (content) found = content.includes(text);
      if (!found) await Helpers.delay(Constants.DELAY_ONE_SECOND);
    } while (!found);
  }

  private async doWaitOnElementToContainText(
    selector: string,
    text: string,
    waitTime?: number,
  ): Promise<void> {
    let wTime = Constants.DELAY_HUNDRED_SECONDS;
    if (waitTime) wTime = waitTime;

    return expect(this.window.locator(selector)).toContainText(text, {
      timeout: wTime,
    });
  }

  private async doCheckElementExists(
    selector: string,
    exists: boolean,
  ): Promise<void> {
    if (exists) {
      //console.log(selector);
      return expect(
        await this.window.locator(selector).count(),
      ).toBeGreaterThan(0);
    } else
      return expect(await this.window.locator(selector).count()).toEqual(0);
  }

  private async doCheckElementEnabledStatus(
    selector: string,
    isEnabled: boolean,
  ): Promise<void> {
    if (isEnabled) return expect(this.window.locator(selector)).toBeEnabled();
    else return expect(this.window.locator(selector)).toBeDisabled();
  }

  private async doCheckElementClass(
    selector: string,
    className: string,
    isPresent: boolean,
  ): Promise<void> {
    const expression: RegExp = new RegExp(className);

    if (isPresent)
      return expect(this.window.locator(selector)).toHaveClass(expression);
    else
      return expect(this.window.locator(selector)).not.toHaveClass(expression);
  }

  private async doWaitOnElementClass(
    selector: string,
    className: string,
    isPresent: boolean,
    waitTime?: number,
  ): Promise<void> {
    let wTime = Constants.DELAY_HUNDRED_SECONDS;
    if (waitTime) wTime = waitTime;

    const expression: RegExp = new RegExp(className);

    if (isPresent)
      return expect(this.window.locator(selector)).toHaveClass(expression, {
        timeout: wTime,
      });
    else
      return expect(this.window.locator(selector)).not.toHaveClass(expression, {
        timeout: wTime,
      });
  }

  private async doCheckInputHasValue(
    selector: string,
    value: string,
  ): Promise<void> {
    return expect(await this.window.locator(selector).inputValue()).toEqual(
      value,
    );
  }

  private async doCheckElementAttributeHasValue(
    selector: string,
    attribute: string,
    value: string,
  ): Promise<void> {
    return expect(
      await this.window.locator(selector).getAttribute(attribute),
    ).toEqual(value);
  }

  private async doCheckElementAttributeExistence(
    selector: string,
    attribute: string,
    isPresent: boolean,
  ): Promise<void> {
    if (isPresent)
      return expect(
        await this.window.locator(selector).getAttribute(attribute),
      ).not.toBeNull();
    else
      return expect(
        await this.window.locator(selector).getAttribute(attribute),
      ).toBeNull();
  }

  private async doCheckCheckBoxValue(
    selector: string,
    value: boolean,
  ): Promise<void> {
    return expect(await this.window.locator(selector).isChecked()).toEqual(
      value,
    );
  }

  private async doAppShouldBeReadyToRunNewJobs(): Promise<void> {
    await this.doCheckElementExists('#noJobsRunning', true);
  }

  private async doWaitOnSkinToBeCorrectlySaved(skin: string): Promise<void> {
    const configFilePath = path.resolve(
      slash(
        path.join(
          process.env.PORTABLE_EXECUTABLE_DIR,
          PATHS.CONFIG_PATH,
          '/settings.xml',
        ),
      ),
    );

    //console.log(configFilePath);

    return this.doWaitOnFileToContainText(
      configFilePath,
      `<skin>${skin}</skin>`,
    );
  }

  private async doCheckAppStatus(status: string): Promise<void> {
    if (status === Constants.STATUS_GREAT_NO_ERRORS_NO_WARNINGS)
      return this.doCheckElementExists('#btnGreatNoErrorsNoWarnings', true);
    else if (status === Constants.STATUS_WARNINGS)
      return this.doCheckElementExists('#btnWarnings', true);
    else return this.doCheckElementExists('#btnErrors', true);
  }

  private async doWaitOnProcessingToStart(howToCheck: string): Promise<void> {
    if (howToCheck === Constants.CHECK_PROCESSING_JAVA) {
      await this.doWaitOnElementToBecomeVisible(
        '.java-started',
        Constants.DELAY_FIVE_THOUSANDS_SECONDS,
      );
    } else if (howToCheck === Constants.CHECK_PROCESSING_STATUS_BAR) {
      await this.doWaitOnElementToContainText(
        '#workingOn',
        'Working on',
        Constants.DELAY_FIVE_THOUSANDS_SECONDS,
      );
    } else {
      //await this.doWaitOnElementToContainText(
      //  '#infoLogViewer',
      //  'Program Started',
      //  Constants.DELAY_FIVE_THOUSANDS_SECONDS
      //);

      await this.doWaitOnFileToContainText(
        path.resolve(
          slash(
            `${process.env.PORTABLE_EXECUTABLE_DIR}/${PATHS.LOGS_PATH}/info.log`,
          ),
        ),
        'Program Started',
      );
    }
  }

  private async doWaitOnProcessingToFinish(howToCheck: string): Promise<void> {
    if (howToCheck === Constants.CHECK_PROCESSING_JAVA) {
      await this.doWaitOnElementToBecomeVisible(
        '.java-exited',
        Constants.DELAY_FIVE_THOUSANDS_SECONDS,
      );
    } else if (howToCheck === Constants.CHECK_PROCESSING_STATUS_BAR) {
      /*
     
      await this.doWaitOnElementToBecomeVisible(
        '#noJobsRunning',
        Constants.DELAY_FIVE_THOUSANDS_SECONDS
      );
      */

      await this.doWaitOnElementToContainText(
        '#noJobsRunning',
        'No jobs are currently',
        Constants.DELAY_FIVE_THOUSANDS_SECONDS,
      );
    } else {
      /*
      await this.doWaitOnElementToContainText(
        '#infoLogViewer',
        'Execution Ended',
        Constants.DELAY_FIVE_THOUSANDS_SECONDS
      );
      */

      await this.doWaitOnFileToContainText(
        path.resolve(
          slash(
            `${process.env.PORTABLE_EXECUTABLE_DIR}/${PATHS.LOGS_PATH}/info.log`,
          ),
        ),
        'Execution Ended',
      );
    }
    /*
   
    await this.doWaitOnElementToContainText(
      '#infoLogViewer',
      'Execution Ended',
      //Configuration.DELAY_FIVE_THOUSANDS_SECONDS
      25000
    );

    await this.waitOnElementToBeVisible(
      '.java-exited',
      Configuration.DELAY_FIVE_THOUSANDS_SECONDS
    );
    */
  }

  private async doGotoProcessingMergeBurstScreen(): Promise<void> {
    await this.doHover('#topMenuBurst');
    await this.doClick('#topMenuBurst');

    await this.doClick('#leftMenuMergeBurst');
  }

  private async doGotoProcessingReportGeneration(): Promise<void> {
    await this.doHover('#topMenuBurst');
    await this.doClick('#topMenuBurst');
    await this.doClick('#reportGenerationMailMergeTab-link');
  }

  private async doGotoStart(): Promise<void> {
    //await this.doClick('#supportEmail');

    await this.doGoToBurstScreen();

    //await this.doClick('#burstFile');
    //.sleep(Constants.DELAY_HUNDRED_SECONDS)
    await this.doWaitOnProcessingToFinish(
      Constants.CHECK_PROCESSING_STATUS_BAR,
    );

    await this.doAppShouldBeReadyToRunNewJobs();

    await this.doWaitOnElementToBecomeVisible(
      '#btnGreatNoErrorsNoWarnings',
      Constants.DELAY_FIVE_THOUSANDS_SECONDS,
    );

    await this.doCheckAppStatus(Constants.STATUS_GREAT_NO_ERRORS_NO_WARNINGS);
  }

  private async doGoToBurstScreen(): Promise<void> {
    //await this.doClick('#supportEmail');
    await this.doHover('#topMenuBurst');
    await this.doClick('#topMenuBurst');

    //await this.doClick('#burstTab-link');
  }

  private async doGotoProcessingQualityAssuranceScreen(): Promise<void> {
    await this.doHover('#topMenuBurst');
    await this.doClick('#topMenuBurst');

    await this.doClick('#leftMenuQualityAssurance');
  }

  private async doGotoConnections(): Promise<void> {
    //await this.doHover('#supportEmail');
    //await this.doClick('#supportEmail');

    await this.doHover('#topMenuBurst');
    await this.doClick('#topMenuBurst');

    //await this.doHover('#supportEmail');
    //await this.doClick('#supportEmail');

    //await this.doClick('#topMenuBurst');

    await this.doHover('#topMenuConfiguration');
    //await this.doFocus('#topMenuConfiguration');

    await this.doClick('#topMenuConfiguration');

    /*
    await this.doWaitOnElementToBecomeVisible(
      '#topMenuConfigurationManage',
      Constants.DELAY_HUNDRED_SECONDS
    );
      */

    //await this.doFocus('#topMenuConfigurationManage');
    //await this.doHover('#topMenuConfigurationManage');

    //await this.doFocus('#topMenuConfigurationManage');
    //await this.doClick('#topMenuConfigurationManage');

    /*
   
    await this.doWaitOnElementToBecomeVisible(
      '#topMenuConfigurationTemplates',
      Constants.DELAY_HUNDRED_SECONDS
    );
      */
    await this.doHover('#topMenuConfigurationExternalConnections');
    //await this.doFocus('#topMenuConfigurationTemplates');
    await this.doClick('#topMenuConfigurationExternalConnections');
    /*
   
    await this.doWaitOnElementToBecomeVisible(
      `#burst_${PATHS.SETTINGS_CONFIG_FILE}`,
      Constants.DELAY_HUNDRED_SECONDS
    );
*/

    await this.doWaitOnElementToBecomeVisible(`#${PATHS.EML_CONTACT_FILE}`);

    await this.doClickAndSelectTableRow(
      `#extConnectionsTable tbody tr:first-child`,
    );

    await this.doWaitOnElementToBecomeEnabledDisabled(
      '#btnEdit',
      true,
      Constants.DELAY_TEN_SECONDS,
    );

    await this.doWaitOnElementToBecomeEnabledDisabled(
      '#btnDuplicate',
      true,
      Constants.DELAY_TEN_SECONDS,
    );
  }

  private async doGotoConfiguration(): Promise<void> {
    //await this.doHover('#supportEmail');
    //await this.doClick('#supportEmail');
    await this.doHover('#topMenuBurst');
    await this.doClick('#topMenuBurst');

    await this.doHover('#topMenuConfiguration');
    //await this.doFocus('#topMenuConfiguration');
    await this.doClick('#topMenuConfiguration');
  }

  private async doGotoConfigurationGeneralSettings(): Promise<void> {
    await this.doHover('#topMenuBurst');
    await this.doClick('#topMenuBurst');

    await this.doClick('#topMenuConfiguration');
    await this.doClick(
      '#topMenuConfigurationLoad_burst_' + PATHS.SETTINGS_CONFIG_FILE,
    );
    await this.doClick('#leftMenuGeneralSettings');
  }

  private async doGotoConfigurationEmailSettings(): Promise<void> {
    await this.doHover('#topMenuBurst');
    await this.doClick('#topMenuBurst');

    await this.doClick('#topMenuConfiguration');
    await this.doClick(
      '#topMenuConfigurationLoad_burst_' + PATHS.SETTINGS_CONFIG_FILE,
    );
    await this.doClick('#leftMenuEmailSettings');
    await this.doWaitOnElementToBecomeVisible('#btnSendTestEmail');
  }

  private async doGotoConfigurationSMSSettings(): Promise<void> {
    await this.doHover('#topMenuBurst');
    await this.doClick('#topMenuBurst');

    await this.doClick('#topMenuConfiguration');
    await this.doClick(
      '#topMenuConfigurationLoad_burst_' + PATHS.SETTINGS_CONFIG_FILE,
    );
    await this.doClick('#leftMenuSMSSettings');
  }
}
