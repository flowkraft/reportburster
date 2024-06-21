*** Settings ***
Library     SeleniumLibrary
Library     OperatingSystem
Library     Process
Library     resources/utilities.py
Variables   resources/vars.py
Test Setup       Clean Output Folders and Log Files
Test Teardown    Kill Reportburster Exe Process

*** Test Cases ***
Let me manualy Update Should Work Fine
    [Documentation]  Let me manualy Update Should Work Fine
  
    Ensure Chocolatey Is Installed
    Sleep  1s
    Ensure Java Is Installed
    Sleep  1s
    
    Refresh Env Variables
    Sleep  1s

    Generate Let Me Update Baseline
    Sleep  1s

    Open Electron Application
    Wait Until Page Contains Element    id=burstFile    timeout=30
    Wait Until Page Contains Element    id=infoLog    timeout=30
    Page Should Contain Element    id=noJobsRunning
    Page Should Contain Element    id=btnGreatNoErrorsNoWarnings
    
    Sleep  1s
  
    Click Element    id=topMenuHelp
    Wait Until Page Contains Element    id=topMenuHelpJava    timeout=30
    Sleep  1s
    Click Element    id=topMenuHelpJava
    Sleep  1s
    Wait Until Page Contains Element    id=labelGreatJavaWasFound
    Sleep  1s
    Click Element    id=updateTab-link
    Sleep  1s
    
    
    Page Should Contain Element    id=btnLetMeUpdateManually
    Click Element    id=btnLetMeUpdateManually
    Wait Until Page Contains Element    id=btnSelectExistingInstallation
    Sleep  1s
    
    ${PROJECT_PATH} =    Get Project Path
    
    Click Button    id=btnSelectExistingInstallation
    Sleep  1s
    Open Folder   Select the installation/location path from where you want to migrate your existing configuration values and data. The selected folder should contain the DocumentBurster.exe/ReportBurster.exe file   ${PROJECT_PATH}/frontend/reporting/testground
    Sleep  1s
    Wait Until Page Contains Element    id=errorMsg
    Sleep  2s

    Click Button    id=btnSelectExistingInstallation
    Sleep  2s
    Open Folder   Select the installation/location path from where you want to migrate your existing configuration values and data. The selected folder should contain the DocumentBurster.exe/ReportBurster.exe file   ${PROJECT_PATH}/frontend/reporting/testground/upgrade/baseline/DocumentBurster
    Sleep  1s
    Wait Until Page Contains Element    id=btnMigrate
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'baseline')]
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'DocumentBurster/config/burst/settings.xml')]
    
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'connections/eml-contact.xml')]
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'reports/custom-10-2-0/reporting.xml')]
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'reports/custom-10-2-0/settings.xml')]
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'reports/custom-9-1-5/reporting.xml')]
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'reports/custom-9-1-5/settings.xml')]
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'reports/my-reports-1020/reporting.xml')]
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'reports/my-reports-1020/settings.xml')]
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'reports/my-reports-915/reporting.xml')]
    Wait Until Page Contains Element   xpath=//ol/li[contains(.//text(), 'reports/my-reports-915/settings.xml')]
    
    Sleep  1s

    Click Button    id=btnMigrate
    Wait Until Page Contains Element    css=.dburst-button-question-decline
    Sleep  1s
    Click Button    css=.dburst-button-question-decline
    
    Click Button    id=btnMigrate
    Wait Until Page Contains Element    css=.dburst-button-question-confirm
    Sleep  1s
    Click Button    css=.dburst-button-question-confirm
    
    # perform migrations
    Wait Until Page Does Not Contain Element    id=btnMigrate
    
    # license check
    Wait Until Page Contains Element            id=workingOn  50
    Wait Until Page Does Not Contain Element    id=workingOn
    Wait Until Page Contains Element            id=noJobsRunning
    
    Page Should Contain Element    id=btnGreatNoErrorsNoWarnings
 
    Sleep  1s
    
    Assert Configuration Files Were Migrated Correctly

    Sleep  1s
    
    Ensure Java Is Not Installed
    
    Sleep  1s
    
    Close Electron Application
   
*** Keywords ***
Open Electron Application
  [Documentation]  Open's your electron application by providing browser binary via
  ...  ${signal_electron_let_me_update.binary_location} and chromedriver binary via ${chromedriver_path}
  ...  see vars.py for more details.
  ${electron_command}=    Set Variable    cmd /c "call refreshenv && start ${signal_electron_let_me_update.binary_location} --remote-debugging-port=9222"
  ${working_dir}=    Get Parent Directory    ${signal_electron_let_me_update.binary_location}
  Start Process    ${electron_command}    cwd=${working_dir}  shell=True
  Sleep    1s
  ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
  Call Method    ${options}    add_experimental_option    debuggerAddress    localhost:9222
  Create WebDriver    Chrome    service=${signal_service}    options=${options}  

Close Electron Application
  [Documentation]  Kills the Electron application process
  Kill Reportburster Exe Process  ${True} 