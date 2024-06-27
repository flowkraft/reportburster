*** Settings ***
Library     SeleniumLibrary
Library     OperatingSystem
Library     Process
Library     resources/utilities.py
Variables   resources/vars.py
Test Setup    Clean State
Test Teardown    Kill Reportburster Exe Process

*** Test Cases ***
Prerequisites Java 8 Installed Should Let The User Know That At Least Java 11 Is Required
    [Documentation]  Prerequisites Java 8 Installed Should Let The User Know That At Least Java 11 Is Required
    Ensure Chocolatey Is Installed
    Ensure Java Is Installed   version=8
    Sleep  1s
    Refresh Env Variables
    Sleep  1s
    Open Electron Application
    Sleep  1s
    Wait Until Page Contains Element    id=burstFile    timeout=30
    Wait Until Page Contains Element    id=javaInstallationOld    timeout=30
    Sleep  1s
    Ensure Java Is Not Installed
    Close ReportBurster Application
    
Prerequisites Chocolatey Is Installed and Java Not Installed Should Allow User To Install Java
    [Documentation]  Prerequisites Chocolatey Is Installed and Java Not Installed Should Allow User To Install Java
    Ensure Chocolatey Is Installed
    Ensure Java Is Not Installed
    Sleep  1s
    Refresh Env Variables
    Sleep  1s
    Open Electron Application
    Sleep  1s
    Wait Until Page Contains Element    id=btnInstallJavaTabBurst    timeout=30
    Sleep  1s
    Click Button    id=btnInstallJavaTabBurst
    Wait Until Page Contains Element    id=btnInstallJava    timeout=30
    Page Should Not Contain Element    id=btnInstallChocolatey
    Sleep  1s
    Click Button    id=btnInstallJava
    Wait Until Page Contains Element    css=.dburst-button-question-decline    timeout=30
    Sleep  1s
    Click Element    css=.dburst-button-question-decline
    Wait Until Element Is Not Visible    css=.dburst-button-question-decline    timeout=30
    Sleep  1s
    Click Button    id=btnInstallJava
    Wait Until Page Contains Element    css=.dburst-button-question-confirm    timeout=30
    Sleep  1s
    Click Element    css=.dburst-button-question-confirm
    Wait Until Element Is Not Visible    css=.dburst-button-question-confirm    timeout=30
    Sleep  1s
    Wait For Powershell And Accept Completion
    Close ReportBurster Application
    Sleep  1s
    Refresh Env Variables
    Sleep  1s
    Open Electron Application
    Wait Until Page Contains Element    id=burstFile    timeout=30
    Sleep  1s
    Page Should Not Contain Element    id=btnInstallJavaTabBurst
    Sleep  1s
    Ensure Java Is Not Installed
    Close ReportBurster Application

Prerequisites Chocolatey Not Installed and Java Not Installed Should Allow User to Install Chocolatey and Then Java
   [Documentation]  Chocolatey Not Installed and Java Not Installed Should Allow User to Install Chocolatey and Then Java
   Ensure Java Is Not Installed
   Ensure Chocolatey Is Not Installed
   Open Electron Application
   Sleep  1s
   Wait Until Page Contains Element    id=btnInstallJavaTabBurst    timeout=30
   Sleep  1s
   Click Button    id=btnInstallJavaTabBurst
   Wait Until Page Contains Element    id=btnInstallChocolatey    timeout=30
   Element Should Be Enabled  id=btnInstallChocolatey
   Wait Until Page Contains Element    id=btnInstallJava    timeout=30
   Element Should Be Disabled   id=btnInstallJava
   Sleep  1s
   Click Button    id=btnInstallChocolatey
   Wait Until Page Contains Element    css=.dburst-button-question-decline    timeout=30
   Sleep  1s
   Click Element    css=.dburst-button-question-decline
   Wait Until Element Is Not Visible    css=.dburst-button-question-decline    timeout=30
   Sleep  1s
   Click Button    id=btnInstallChocolatey
   Wait Until Page Contains Element    css=.dburst-button-question-confirm    timeout=30
   Sleep  1s
   Click Element    css=.dburst-button-question-confirm
   Wait Until Element Is Not Visible    css=.dburst-button-question-confirm    timeout=30
   Wait For Powershell And Accept Completion
   Sleep  1s
   Close ReportBurster Application
   Sleep  1s
   Refresh Env Variables
   Sleep  1s
   Open Electron Application
   Sleep  1s
   Wait Until Page Contains Element    id=btnInstallJavaTabBurst    timeout=30
   Click Button    id=btnInstallJavaTabBurst
   Wait Until Page Contains Element    id=btnInstallJava    timeout=30
   Element Should Be Enabled   id=btnInstallJava
   Sleep  1s
	 Click Button    id=btnInstallJava
   Wait Until Page Contains Element    css=.dburst-button-question-decline    timeout=30
   Sleep  1s
   Click Element    css=.dburst-button-question-decline
   Wait Until Element Is Not Visible    css=.dburst-button-question-decline    timeout=30
   Sleep  1s
   Click Button    id=btnInstallJava
   Wait Until Page Contains Element    css=.dburst-button-question-confirm    timeout=30
   Sleep  1s
   Click Element    css=.dburst-button-question-confirm
   Wait Until Element Is Not Visible    css=.dburst-button-question-confirm    timeout=30
   Sleep  1s
   Wait For Powershell And Accept Completion
   Sleep  1s
   Close ReportBurster Application
   Sleep  1s
   Refresh Env Variables
   Sleep  1s
   Open Electron Application
   Wait Until Page Contains Element    id=burstFile    timeout=30
   Sleep  1s
   Page Should Not Contain Element    id=btnInstallJavaTabBurst
   Sleep  1s
   Ensure Java Is Not Installed
   Close ReportBurster Application

# Prerequisites Chocolatey Installed But Choco Minus Version Not Working Should Work Fine
#   [Documentation] Chocolatey Installed But Choco Minus Version Not Working Should Work Fine

*** Keywords ***
#Open Electron Application
#  [Documentation]  Open's your electron application by providing browser binary via
#  ...  ${signal_electron} and chromedriver binary via ${signal_service}
#  ...  see vars.py for more details.
#  Create Webdriver    Chrome    options=${signal_electron}    service=${signal_service}

Open Electron Application
  [Documentation]  Open's your electron application by providing browser binary via
  ...  ${signal_electron.binary_location} and chromedriver binary via ${chromedriver_path}
  ...  see vars.py for more details.
  ${electron_command}=    Set Variable    cmd /c "where /q refreshenv && (call refreshenv && start ${signal_electron.binary_location} --remote-debugging-port=9222) || start ${signal_electron.binary_location} --remote-debugging-port=9222"
  ${working_dir}=    Get Parent Directory    ${signal_electron.binary_location}
  Start Process    ${electron_command}    cwd=${working_dir}  shell=True
  Sleep    1s
  ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
  Call Method    ${options}    add_experimental_option    debuggerAddress    localhost:9222
  Create WebDriver    Chrome    service=${signal_service}    options=${options}

Close Electron Application
  [Documentation]  Kills the Electron application process
  Close All Browsers
  Terminate All Processes    kill=True
  Kill Reportburster Exe Process

Close ReportBurster Application
  [Documentation]  Close ReportBurster Application
#  Click X Close Reportburster
  Kill Reportburster Exe Process

Close And Open Electron Application
    [Arguments]    ${condition_keyword}    ${condition_arg}    ${timeout}
    Close ReportBurster Application
    Sleep  1s
    Refresh Env Variables
    Sleep  1s
    Open Electron Application
    Wait Until Page Contains Element    id=burstFile    timeout=30
    Sleep  1s
    Run Keyword    ${condition_keyword}    ${condition_arg}    ${timeout}

Clean State
  [Documentation]  Clean Output Folders and Log Files
  Clean Output Folders and Log Files
  Close ReportBurster Application

#Capture Failed Test Screenshot
#  [Documentation]  Captures a screenshot with a name based on the test case name
#  Capture Page Screenshot    EMBED

