*** Settings ***
Library           OperatingSystem
Library           Process
Library           AutoItLibrary
Library           resources/utilities.py
Suite Setup       Unzip ReportBurster
Suite Teardown    Remove Directory
Test Setup        Run Tests
Test Teardown     Do Something After Test

*** Variables ***
${ZIP_FILE}       ../dist/reportburster.zip
${UNZIP_DIR}      ../target/uat

*** Test Cases ***
Test Case 1
    Log    Test Case 1
    Start Process    ${UNZIP_DIR}/ReportBurster/ReportBurster.exe
    WinWaitActive    ReportBurster    timeout=120
    
Test Case 2
    Log    Test Case 2

*** Keywords ***
Unzip ReportBurster
    Log    Unzipping file ${ZIP_FILE} to ${UNZIP_DIR}
    Create Directory    ${UNZIP_DIR}
    unzip_file    ${ZIP_FILE}    ${UNZIP_DIR}
    
Remove Directory
    Log    Checking if directory ${UNZIP_DIR} exists
    
Run Tests
    Log    Running tests

Do Something After Test
    Log    Doing something after test