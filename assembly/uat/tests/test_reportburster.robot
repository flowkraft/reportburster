*** Settings ***
Library     SeleniumLibrary
Library     resources/utilities.py
Variables   resources/vars.py
Suite Teardown   Close Electron Application
Suite Setup      Open Electron Application
Test Teardown    Run Keyword If Test Failed    Capture Failed Test Screenshot

*** Keywords ***
Open Electron Application
  [Documentation]  Open's your electron application by providing browser binary via
  ...  ${signal_electron} and chromedriver binary via ${signal_service}
  ...  see vars.py for more details.
  Create Webdriver    Chrome    options=${signal_electron}    service=${signal_service}

Close Electron Application
  [Documentation]  Kills the Electron application process
  Kill Reportburster Exe Process

Capture Failed Test Screenshot
  [Documentation]  Captures a screenshot with a name based on the test case name
  Capture Page Screenshot    EMBED

*** Test Cases ***
Initial Setup
  [Documentation]  Does nothing except checks if an element with a specific ID exists in the DOM
  Wait Until Page Contains Element    id=burstFile    timeout=30
  Page Should Contain Element    id=noJobsRunning1