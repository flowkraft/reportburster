import { Injectable } from '@angular/core';

import { ChildProcess } from 'child_process';

import * as util from 'util';

import * as semver from 'semver';
import * as dayjs from 'dayjs';

import { TerminalService } from 'primeng/terminal';
import { Subscription, interval } from 'rxjs';
import Utilities from '../../helpers/utilities';
import { SemVer } from 'semver';
import { ElectronService } from '../../core/services';

@Injectable()
export class BashService {
  JAVA_HOME: string;
  JRE_HOME: string;

  PATH: string;

  JAVA_HOME_REGISTRY: string;
  PATH_REGISTRY: string;

  isJavaOk = false;
  javaVersion: string;
  checkJavaSubscription: Subscription;

  isRestartRequired = false;

  diagnostics = {
    javaHomeFolderExists: false,
    pathIncludesJavaHomeBin: false,
    javaExeExists: false,
    jreHomeFolderExists: false,
  };

  isChocoOk = false;
  chocoVersion: string;
  checkChocoSubscription: Subscription;

  extraPackages = [
    {
      id: 'notepadplusplus',
      name: 'Notepad++',
      icon: 'notepad++.svg',
      website: 'https://notepad-plus-plus.org/',
      description: ` is a free (as in “free speech” and also as in “free beer”) source code editor and Notepad replacement that supports several languages.`,
      status: 'not-installed',
      packageManager: 'choco',
    },
    {
      id: 'winmerge',
      name: 'WinMerge',
      icon: 'winmerge.png',
      website: 'https://winmerge.org/',
      description: ` is an Open Source differencing and merging tool for Windows. WinMerge can compare both folders and files, presenting differences in a visual text format that is easy to understand and handle.`,
      status: 'not-installed',
      packageManager: 'choco',
    },
  ];

  logFilePath = Utilities.slash(
    this.electronService.PORTABLE_EXECUTABLE_DIR + '/logs/bash.service.log'
  );

  pTerminalResponses = '';

  pTerminalInput: HTMLInputElement;

  constructor(
    protected electronService: ElectronService,
    public terminalService: TerminalService
  ) {
    //FIXME define a constant CHECK_INTERVAL = 333 to be reused across all ).subscribe

    this.checkJavaSubscription = interval(100).subscribe(async (x) => {
      await this.systemDiagnostics();
    });

    //FIXME define a constant CHECK_INTERVAL = 333 to be reused across all ).subscribe

    this.checkChocoSubscription = interval(1000).subscribe(async (x) => {
      await this.checkJavaVersion();
      await this.checkChocoVersion();
    });
  }

  restartElectronApp() {
    this.electronService.app.relaunch();
    this.electronService.app.exit(0);
  }

  async checkChocoVersion(throwError = false) {
    try {
      const { stdout, stderr } = await this.execCommand('choco --version');

      //console.log(`choco --version = ${chocoV}`);

      if (!this.isChocoOk) this.isChocoOk = true;
      this.chocoVersion = stdout;

      return stdout;
    } catch (error) {
      if (this.isChocoOk) this.isChocoOk = false;
      this.chocoVersion = undefined;

      if (throwError) throw error;
    }
  }

  async _getEnvironmentVariableValue(envKey: string, throwError = false) {
    // https://stackoverflow.com/questions/445167/how-can-i-get-the-value-of-a-registry-key-from-within-a-batch-script
    // How can I get the value of a registry key from within a batch script?
    let value = '';
    const queryCommand = `for /F "tokens=3*" %A in ('reg query "HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Control\\Session Manager\\Environment" /v "${envKey}"') DO @Echo %A %B`;

    try {
      const { stdout, stderr } = await this.execCommand(queryCommand);
      if (stdout) value = stdout;
    } catch (error) {
      //console.log(`error = ${error}, throwError = ${throwError}`);

      if (throwError) throw error;
    } finally {
      return value;
    }
  }

  async systemDiagnostics() {
    if (this.JAVA_HOME) {
      const javaHomeFolderPathExists =
        await this.electronService.jetpack.existsAsync(this.JAVA_HOME);

      if (javaHomeFolderPathExists === 'dir')
        this.diagnostics.javaHomeFolderExists = true;
      else this.diagnostics.javaHomeFolderExists = false;

      const javaHomeBin = this.JAVA_HOME + '/bin';

      if (
        this.PATH.includes(javaHomeBin) ||
        this.PATH.includes(this.JAVA_HOME + '\\bin')
      )
        this.diagnostics.pathIncludesJavaHomeBin = true;
      else this.diagnostics.pathIncludesJavaHomeBin = false;

      const javaExeFilePathExists =
        await this.electronService.jetpack.existsAsync(
          javaHomeBin + '/java.exe'
        );

      if (javaExeFilePathExists === 'file')
        this.diagnostics.javaExeExists = true;
      else this.diagnostics.javaExeExists = false;
    } else {
      this.diagnostics.javaHomeFolderExists = false;
      this.diagnostics.pathIncludesJavaHomeBin = false;
      this.diagnostics.javaExeExists = false;
    }

    if (this.JRE_HOME) {
      const jreHomeFolderPathExists =
        await this.electronService.jetpack.existsAsync(this.JRE_HOME);

      if (jreHomeFolderPathExists === 'dir')
        this.diagnostics.jreHomeFolderExists = true;
      else this.diagnostics.jreHomeFolderExists = false;
    }
  }

  async checkJavaVersion(throwError = false) {
    if (process.env.JAVA_HOME)
      this.JAVA_HOME = Utilities.slash(process.env.JAVA_HOME);

    if (process.env.JRE_HOME)
      this.JRE_HOME = Utilities.slash(process.env.JRE_HOME);

    this.PATH = process.env.PATH;

    try {
      //on Windows 7 java 8 java --version is not working, the command is simply java -version
      //console.log(`java -version`);

      //console.log(
      //  `await this.execCommand('java -version') = ${await this.execCommand(
      //    'java -version'
      //  )}`
      //);

      const { stdout, stderr } = await this.execCommand('java -version');

      //console.log(stdout, stderr);

      let javaV = stdout;

      if (!javaV) javaV = stderr;

      //No errors => we have Java installed
      //https://stackoverflow.com/questions/19734477/verify-if-java-is-installed-from-node-js/19734810

      //console.log(`java javaV: ${javaV}`);

      let firstLine: string = javaV;

      // if (javaV) firstLine = javaV.split('\n')[0];
      //else firstLine = stderr.toString().split('\n')[0];

      // console.log(`firstLine: ${firstLine}`);

      //sometimes it is coming as 'openjdk version "14.0.2" 2020-07-14'

      let javaVersion = new RegExp('(java|openjdk) version').test(firstLine)
        ? firstLine.split(' ')[2].replace(/"/g, '')
        : '';

      //and sometimes it is coming as 'openjdk 14.0.2 2020-07-14'
      if (!javaVersion)
        javaVersion = new RegExp('(java|openjdk)').test(firstLine)
          ? firstLine.split(' ')[1].replace(/"/g, '')
          : '';

      //console.log(`java javaVersion: ${javaVersion}`);

      //console.log(`javaVersion = ${javaV}`);
      let semVersion = new SemVer(javaVersion);
      const semVersion1_8 = semver.coerce('1.8');

      if (!semver.valid(javaVersion)) semVersion = semver.coerce(javaVersion);

      if (semver.gte(semVersion, semVersion1_8)) {
        this.isJavaOk = true;
        this.javaVersion = javaVersion.toString();
      }

      this.isRestartRequired = false;

      return javaV;
    } catch (error) {
      //console.log(`error java -version: ${error}`);
      this.isJavaOk = false;
      this.javaVersion = undefined;

      if (!this.JAVA_HOME_REGISTRY) {
        try {
          const jev = await this._getEnvironmentVariableValue(
            'JAVA_HOME_REGISTRY',
            throwError
          );
          const javaHomeEnvVariable = Utilities.slash(jev);
          let pathEnvVariable: string;
          {
            pathEnvVariable = await this._getEnvironmentVariableValue(
              'PATH',
              throwError
            );
          }

          this.JAVA_HOME_REGISTRY = javaHomeEnvVariable;
          this.PATH_REGISTRY = pathEnvVariable;

          if (pathEnvVariable.includes(javaHomeEnvVariable)) {
            this.isRestartRequired = true;

            //User should be allowed to restart the app in this situation

            //https://stackoverflow.com/questions/55982480/what-is-the-proper-way-to-restart-an-electron-app

            //https://www.electronjs.org/docs/api/app#apprelaunchoptions

            //https://stackoverflow.com/questions/41819632/how-to-call-a-function-module-in-electron-from-my-webpage
          }
        } catch (err) {}

        if (throwError) throw error;
      }
    }
  }

  async execCommand(
    command: string
  ): Promise<{ stdout: string; stderr: string }> {
    return this.electronService.util.promisify(this.electronService.exec)(
      command
    );
  }

  async installChocolatey(): Promise<ChildProcess> {
    //https://chocolatey.org/docs/installation#install-using-powershell-from-cmdexe

    //Step 1 generate /temp/installChocolatey.cmd
    const scriptContent = `@echo off

SET DIR=%~dp0%
    
::download install.ps1
%systemroot%/System32/WindowsPowerShell/v1.0/powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "((new-object net.webclient).DownloadFile('https://chocolatey.org/install.ps1','%DIR%install.ps1'))"
::run installer
%systemroot%/System32/WindowsPowerShell/v1.0/powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%DIR%install.ps1' %*"
del /f /s install.ps1
`;

    const scriptFilePath = Utilities.slash(
      this.electronService.PORTABLE_EXECUTABLE_DIR +
        '/temp/installChocolatey.cmd'
    );

    await this.electronService.jetpack.writeAsync(
      scriptFilePath,
      scriptContent
    );

    //Step 2 Run installChocolatey.cmd

    // Run installChocolatey.cmd from an elevated cmd.exe command prompt and it will install the latest version of Chocolatey.
    return Promise.resolve(
      this.getCommandReadyToBeRunAsAdministratorUsingBatchCmd(
        'CALL installChocolatey.cmd'
      )
    );
  }

  async getCommandReadyToBeRunAsAdministratorUsingBatchCmd(
    command: string
  ): Promise<ChildProcess> {
    const elevatedScriptFilePath =
      await this.generateScriptForRunningCommandAsAdministratorUsingBatchCmd(
        command
      );

    return Promise.resolve(
      this.electronService.spawn('cmd.exe', ['/c', elevatedScriptFilePath], {
        cwd: Utilities.slash(
          this.electronService.PORTABLE_EXECUTABLE_DIR + '/temp/'
        ),
      })
    );
  }

  async getCommandReadyToBeRunAsAdministratorUsingPowerShell(
    command: string,
    testCommand = ''
  ): Promise<ChildProcess> {
    const elevatedScriptFilePath =
      await this.generateScriptForRunningCommandAsAdministratorUsingPowerShell(
        command,
        testCommand
      );

    return Promise.resolve(
      this.electronService.spawn('powershell.exe', [elevatedScriptFilePath], {
        cwd: Utilities.slash(
          this.electronService.PORTABLE_EXECUTABLE_DIR + '/temp/'
        ),
      })
    );
  }

  typeCommandOnTerminalAndThenPressEnter(command: string) {
    this.pTerminalInput.value = command;
    this.pTerminalInput.dispatchEvent(new Event('input'));
    this.pTerminalInput.dispatchEvent(
      new KeyboardEvent('keydown', {
        keyCode: 13,
      } as KeyboardEventInit)
    );
    this.pTerminalInput.focus();
  }

  async generateScriptForRunningCommandAsAdministratorUsingPowerShell(
    commandToElevate: string,
    testCommand = ''
  ) {
    //https://stackoverflow.com/questions/7690994/running-a-command-as-administrator-using-powershell
    //Here's a self-elevating snippet for Powershell scripts which preserves the working directory:

    const elevatedScriptFilePath =
      this.electronService.uniqueFilename(
        Utilities.slash(
          this.electronService.PORTABLE_EXECUTABLE_DIR + '/temp/'
        ),
        'elevated-powershell-script'
      ) + '.ps1';
    const now = dayjs().format('DD/MM/YYYY HH:mm:ss');

    const scriptContent = `if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
      
      # If not already admin
      
      Write-Host "${now} - Executing '${commandToElevate}' as Administrator";
      Start-Process PowerShell -Verb RunAs "-NoProfile -ExecutionPolicy Bypass -Command \`"cd '$pwd'; & '$PSCommandPath';\`"";
      
      # Exit the non-elevated script
      exit 0;
    
    }
  
    # Your script here
    # Below code is executed RunAs admin

    function timestamp {
      
      # append timestamp to each line of the input (output of the previous command in the pipeline)
      foreach ($i in $input){
          "${now} - $i"
      }
    }  

    ${testCommand}
    
    # if ${testCommand} was succesfull
    if($?)
    {
      Write-Host "Please wait while executing '${commandToElevate}' as Administrator...";
      ${commandToElevate} 2>&1 | timestamp | Out-File -Append -Encoding ascii ${this.logFilePath};
    }
    else {
      Add-Content ${this.logFilePath} "${now} ERRROR - Could not execute '${commandToElevate}' because '${testCommand}' failed!"
    }
    
    Remove-Item $PSCommandPath;
    `;

    await this.electronService.jetpack.writeAsync(
      elevatedScriptFilePath,
      scriptContent
    );

    return Promise.resolve(elevatedScriptFilePath);
  }

  async generateScriptForRunningCommandAsAdministratorUsingBatchCmd(
    commandToElevate: string
  ) {
    //https://stackoverflow.com/questions/7044985/how-can-i-auto-elevate-my-batch-file-so-that-it-requests-from-uac-administrator
    //There is an easy way without the need to use an external tool - it runs fine with Windows 7, 8, 8.1 and 10

    const elevatedScriptFilePath =
      this.electronService.uniqueFilename(
        Utilities.slash(
          this.electronService.PORTABLE_EXECUTABLE_DIR + '/temp/'
        ),
        'elevated-batch-cmd-script'
      ) + '.cmd';

    const now = dayjs().format('DD/MM/YYYY HH:mm:ss');

    const scriptContent = `::::::::::::::::::::::::::::::::::::::::::::
    :: Elevate.cmd - Version 4
    :: Automatically check & get admin rights
    :: see "https://stackoverflow.com/a/12264592/1016343" for description
    ::::::::::::::::::::::::::::::::::::::::::::
     @echo off
     CLS
     ECHO.
     ECHO =============================
     ECHO Please wait... Running '${commandToElevate}' as Admin...
     ECHO =============================
    
    :init
     setlocal DisableDelayedExpansion
     set cmdInvoke=0
     set winSysFolder=System32
     set "batchPath=%~0"
     for %%k in (%0) do set batchName=%%~nk
     set "vbsGetPrivileges=%temp%/OEgetPriv_%batchName%.vbs"
     setlocal EnableDelayedExpansion
    
    :checkPrivileges
      NET FILE 1>NUL 2>NUL
      if '%errorlevel%' == '0' ( goto gotPrivileges ) else ( goto getPrivileges )
    
    :getPrivileges
      if '%1'=='ELEV' (echo ELEV & shift /1 & goto gotPrivileges)
      ECHO.
      ECHO **************************************
      ECHO Invoking UAC for Privilege Escalation
      ECHO **************************************
    
      ECHO Set UAC = CreateObject^("Shell.Application"^) > "%vbsGetPrivileges%"
      ECHO args = "ELEV " >> "%vbsGetPrivileges%"
      ECHO For Each strArg in WScript.Arguments >> "%vbsGetPrivileges%"
      ECHO args = args ^& strArg ^& " "  >> "%vbsGetPrivileges%"
      ECHO Next >> "%vbsGetPrivileges%"
    
      if '%cmdInvoke%'=='1' goto InvokeCmd 
    
      ECHO UAC.ShellExecute "!batchPath!", args, "", "runas", 1 >> "%vbsGetPrivileges%"
      goto ExecElevation
    
    :InvokeCmd
      ECHO args = "/c """ + "!batchPath!" + """ " + args >> "%vbsGetPrivileges%"
      ECHO UAC.ShellExecute "%SystemRoot%/%winSysFolder%/cmd.exe", args, "", "runas", 1 >> "%vbsGetPrivileges%"
    
    :ExecElevation
     "%SystemRoot%/%winSysFolder%/WScript.exe" "%vbsGetPrivileges%" %*
     exit /B
    
    :gotPrivileges
     setlocal & cd /d %~dp0
     if '%1'=='ELEV' (del "%vbsGetPrivileges%" 1>nul 2>nul  &  shift /1)
    
     ::::::::::::::::::::::::::::
     ::START
     ::::::::::::::::::::::::::::
     REM Run shell as admin (example) - put here code as you like
     ${commandToElevate} 2>&1 >> ${this.logFilePath}
     del /f /s *.cmd 2>&1 >> ${this.logFilePath}
     cmd /k
     `;

    await this.electronService.jetpack.writeAsync(
      elevatedScriptFilePath,
      scriptContent
    );

    return Promise.resolve(elevatedScriptFilePath);
  }

  async emptyLogFile() {
    return this.electronService.jetpack.writeAsync(this.logFilePath, '');
  }

  async log(message: string) {
    if (message) {
      return this.electronService.jetpack.appendAsync(
        this.logFilePath,
        '\n' + dayjs().format('DD/MM/YYYY HH:mm:ss') + ' - ' + message
      );
    }
  }

  async deleteJobFile(jobFilePath: string) {
    return this.electronService.jetpack.removeAsync(jobFilePath);
  }

  async createJobFile(jobType: string): Promise<string> {
    let filePath = '';
    if (jobType === 'update')
      filePath = `${this.electronService.PORTABLE_EXECUTABLE_DIR}/updating DocumentBurster, please wait`;

    const jobFileName = Utilities.getRandomJobFileName();

    const jobFilePath = `${this.electronService.PORTABLE_EXECUTABLE_DIR}/temp/${jobFileName}`;
    const jobFileContent = Utilities.getJobFileContent(
      filePath,
      jobType,
      '14234234324324'
    );

    await this.electronService.jetpack.writeAsync(jobFilePath, jobFileContent);

    return Promise.resolve(Utilities.slash(jobFilePath));
  }
}
