*** Settings ***
Library     SeleniumLibrary
Library     OperatingSystem
Library     resources/utilities.py
Variables   resources/vars.py
Suite Teardown   Close Electron Application
Suite Setup      Open Electron Application
Test Teardown    Run Keyword If Test Failed    Capture Failed Test Screenshot
Test Setup    Clean State

*** Keywords ***
Open Electron Application
  [Documentation]  Open's your electron application by providing browser binary via
  ...  ${signal_electron} and chromedriver binary via ${signal_service}
  ...  see vars.py for more details.
  Create Webdriver    Chrome    options=${signal_electron}    service=${signal_service}

Close Electron Application
  [Documentation]  Kills the Electron application process
  Kill Reportburster Exe Process

Clean State
  [Documentation]  Clean Output Folders and Log Files
  Clean Output Folders and Log Files

Capture Failed Test Screenshot
  [Documentation]  Captures a screenshot with a name based on the test case name
  Capture Page Screenshot    EMBED

*** Test Cases ***
Quickstart Payslips.pdf Should Work Fine
    [Documentation]  Payslips.pdf Should Work Fine
    Wait Until Page Contains Element    id=burstFile    timeout=30
    Wait Until Page Contains Element    id=infoLog    timeout=30
    Page Should Contain Element    id=noJobsRunning
    Page Should Contain Element    id=btnGreatNoErrorsNoWarnings
    ${payslips_pdf_path}=  Join Path  ${PORTABLE_EXECUTABLE_DIR}  samples/burst/Payslips.pdf
    Choose File  id=burstFileUploadInput  ${payslips_pdf_path}
    Sleep  1s
    # Click Burst (cannot because of log files)
    Click Button    id=btnBurst
    Wait Until Page Contains Element    css=.dburst-button-question-confirm    timeout=30
    Sleep  1s
    Click Element    css=.dburst-button-question-confirm
    Wait Until Element Is Not Visible    css=.dburst-button-question-confirm    timeout=30
    Sleep  1s
    Click Button    id=btnClearLogs
    Wait Until Page Contains Element    css=.dburst-button-question-decline    timeout=30
    Sleep  1s
    Click Element    css=.dburst-button-question-decline
    Wait Until Element Is Not Visible    css=.dburst-button-question-decline    timeout=30
    Sleep  1s
    Click Button    id=btnClearLogs
    Wait Until Page Contains Element    css=.dburst-button-question-confirm    timeout=30
    Sleep  1s
    Click Element    css=.dburst-button-question-confirm
    Wait Until Element Is Not Visible    css=.dburst-button-question-confirm    timeout=30
    Wait Until Element Is Not Visible    id=infoLog    timeout=30
    Sleep  1s
    # Click Burst (this time works)
    Click Button    id=btnBurst
    Wait Until Page Contains Element    css=.dburst-button-question-confirm    timeout=30
    Sleep  1s
    Click Element    css=.dburst-button-question-confirm
    # Working on ...
    Wait Until Page Contains Element    id=infoLog    timeout=30
    Wait Until Element Is Not Visible    id=noJobsRunning    timeout=30
    Wait Until Page Contains Element    id=workingOn    timeout=30
    # Done
    Wait Until Element Is Not Visible    id=workingOn    timeout=300
    Wait Until Page Contains Element    id=noJobsRunning    timeout=300
    # Done without errors 
    Page Should Contain Element    id=btnGreatNoErrorsNoWarnings
    Sleep  5s

# Command Line Payslips.pdf Should Work Fine
#   [Documentation] Command Line Payslips.pdf Should Work Fine

# Prerequisites Java Not Installed Should Work Fine
#   [Documentation] Prerequisites Java Not Installed Should Work Fine

# Prerequisites Java 8 Found Should Work Fine
#   [Documentation] Prerequisites Java 8 Found Should Work Fine
  
# Prerequisites Chocolatey Not Installed Should Work Fine
#   [Documentation] Prerequisites Chocolatey Not Installed Should Work Fine

# Prerequisites Chocolatey Installed But Choco Minus Version Not Working Should Work Fine
#   [Documentation] Chocolatey Installed But Choco Minus Version Not Working Should Work Fine