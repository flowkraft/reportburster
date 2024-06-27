*** Settings ***
Library     RequestsLibrary
Library     OperatingSystem
Library     resources/utilities.py
Variables   resources/vars.py
Test Setup       Clean Output Folders and Log Files  product=server
Test Teardown    Shut Server

*** Variables ***
${SERVER_URL}    http://localhost:9090
${BROWSER}    chrome

*** Test Cases ***
startServer.bat and shutServer.bat Should Work Fine
    [Documentation]  startServer.bat and shutServer.bat Should Work Fine
  
    Ensure Chocolatey Is Installed
    Sleep  1s
    Refresh Env Variables
    
    Sleep  1s
    Ensure Java Is Installed
    Sleep  1s
    Refresh Env Variables
    
    Sleep  1s
    startServer.bat and shutServer.bat Should Work Fine

    Sleep 1s
    Ensure Java Is Not Installed
    Sleep 1s
    Refresh Env Variables
    

service.bat Should Work Fine
    [Documentation]  service.bat install should check that the ReportBurster Server Windows Service was installed and service.bat uninstall should check that the Windows Service was removed

    Ensure Chocolatey Is Installed
    Sleep  1s
    Refresh Env Variables
    Ensure Java Is Installed
    Sleep  1s
    Refresh Env Variables

    # Uninstall the service
    ${output}=    Service Uninstall
    Text Contains Either    ${output}    uninstalled successfully   does not exist
    
    # Install the service
    ${output}=    Service Install
    Should Contain    ${output}    installed successfully   

    # Check that the service is installed
    ${service_status}=    Run    sc query rbsj   
    # Log To Console    ${service_status}
    Should Contain    ${service_status}    STOPPED    

    # Start the service
    Run    sc start rbsj

    Wait Until Keyword Succeeds    10x    3s    Check Server Is Running
 
    Copy File    ${PORTABLE_EXECUTABLE_DIR_SERVER}/samples/burst/Payslips.pdf    ${PORTABLE_EXECUTABLE_DIR_SERVER}/poll
    Wait Until Keyword Succeeds    10x    3s    Check PDF Files Generated    3

    # Stop the service
    Run    sc stop rbsj

    Wait Until Keyword Succeeds    10x    3s    Check Server Is Not Running
    
    # Uninstall the service
    ${output}=    Service Uninstall
    Should Contain    ${output}    uninstalled successfully

    Sleep 1s
    Refresh Env Variables

*** Keywords ***
Check Server Is Running
    Create Session    server    ${SERVER_URL}
    ${response}=    GET On Session    server    /
    Should Be Equal As Integers    ${response.status_code}    200
    
Check Server Is Not Running
    Create Session    server    ${SERVER_URL}
    ${result}=    Run Keyword And Ignore Error    GET On Session    server    /
    ${status_code}=    Set Variable If    '${result[0]}' == 'PASS'    ${result[1].status_code}    0
    Should Not Be Equal As Integers    ${status_code}    200

Check PDF Files Generated
    [Arguments]    ${expected_count}
    ${count}=    Count Files    ${PORTABLE_EXECUTABLE_DIR_SERVER}/output    pattern=*.pdf    recursive=True
    Should Be Equal As Integers    ${count}    ${expected_count}