*** Settings ***
Library     SeleniumLibrary
Library     OperatingSystem
Library     Process
Library     resources/utilities.py
Variables   resources/vars.py

*** Keywords ***
Take Screenshot If Requested
    [Arguments]    ${screenshot_name}=${EMPTY}
    [Documentation]    Takes a screenshot if SCREENSHOTS_FOLDER is provided.
    ...                If screenshot_name is provided, the screenshot will be saved with that exact name.
    ...                If screenshot_name is not provided, the default behavior of Capture Page Screenshot will be used.
    Run Keyword If    '${SCREENSHOTS_FOLDER}' != '${EMPTY}'
    ...    Run Keyword If    '${screenshot_name}' != '${EMPTY}'
    ...    Take Screenshot With Exact Name    ${screenshot_name}
    ...    ELSE
    ...    Capture Page Screenshot

Take Screenshot With Exact Name
    [Arguments]    ${screenshot_name}
    [Documentation]    Takes a screenshot with the exact provided name, ensuring it is the latest one.
    ${screenshot_path}=    Set Variable    ${SCREENSHOTS_FOLDER}${/}${screenshot_name}.png
    # Remove existing file if it exists
    Run Keyword And Ignore Error    Remove File    ${screenshot_path}
    # Capture the screenshot with the exact name
    Capture Page Screenshot    ${screenshot_path}

Quickstart Payslips.pdf Should Work Fine
    
    Sleep  1s
    Open Electron Application
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
    Close Electron Application

Open Electron Application
  [Documentation]  Open's your electron application by providing browser binary via
  ...  ${signal_electron.binary_location} and chromedriver binary via ${chromedriver_path}
  ...  see vars.py for more details.
  ${electron_command}=    Set Variable    cmd /c "call refreshenv && start ${signal_electron.binary_location} --remote-debugging-port=9222"
  ${working_dir}=    Get Parent Directory    ${signal_electron.binary_location}
  Start Process    ${electron_command}    cwd=${working_dir}  shell=True
  Sleep    1s
  ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
  Call Method    ${options}    add_experimental_option    debuggerAddress    localhost:9222
  Create WebDriver    Chrome    service=${signal_service}    options=${options}  

Close Electron Application
  [Documentation]  Kills the Electron application process
  Kill Reportburster Exe Process


startServer.bat and shutServer.bat Should Work Fine
    
    Sleep  1s
    Start Server
    Wait Until Keyword Succeeds    10x    3s    Check Server Is Running
    
    Sleep  1s
    Copy File    ${PORTABLE_EXECUTABLE_DIR_SERVER}/samples/burst/Payslips.pdf    ${PORTABLE_EXECUTABLE_DIR_SERVER}/poll
    Wait Until Keyword Succeeds    10x    3s    Check PDF Files Generated    3
    
    Sleep  1s
    Shut Server
    Wait Until Keyword Succeeds    10x    3s    Check Server Is Not Running
    

Capture Failed Test Screenshot
  [Documentation]  Captures a screenshot with a name based on the test case name
  Capture Page Screenshot    EMBED
