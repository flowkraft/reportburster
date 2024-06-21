import { Locator, Page } from 'playwright';
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

  constructor(protected window: Page) {}

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

  public elementShouldContainText(
    selector: string,
    value: string,
  ): FluentTester {
    let action = (): Promise<void> =>
      this.doCheckElementToContainText(selector, value);

    this.actions.push(action);
    return this;
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
    await this.doClick('#topMenuConfigurationManage');

    /*
   
    await this.doWaitOnElementToBecomeVisible(
      '#topMenuConfigurationTemplates',
      Constants.DELAY_HUNDRED_SECONDS
    );
      */
    //await this.doHover('#topMenuConfigurationTemplates');
    //await this.doWaitOnElementToBecomeVisible('#topMenuConfigurationTemplates');
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
          emailBody.should.have.string(`${identifiedToken}.${attachmentType}`);
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
        const emailFilePath = await jetpack.findAsync(
          process.env.PORTABLE_EXECUTABLE_DIR,
          {
            matching: `output/**/${identifiedToken}_email.txt`,
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

  protected async doHover(selector: string): Promise<void> {
    this.focusedElement = this.window.locator(selector);
    return this.focusedElement.hover();
  }

  private async doFocus(selector: string): Promise<void> {
    this.focusedElement = this.window.locator(selector);

    return this.focusedElement.focus();
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
    let wTime = Constants.DELAY_FIVE_THOUSANDS_SECONDS;
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
      console.log(`filePath = ${filePath}, content = ${content}`);
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
    await this.doClick('#topMenuConfigurationManage');

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
