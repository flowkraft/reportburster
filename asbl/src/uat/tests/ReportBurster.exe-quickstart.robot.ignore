*** Settings ***
Resource    resources/utilities.robot

Test Setup       Clean Output Folders and Log Files
Test Teardown    Kill Reportburster Exe Process

*** Test Cases ***
Quickstart Payslips.pdf Should Work Fine
    [Documentation]  Payslips.pdf Should Work Fine
    
    Ensure Chocolatey Is Installed
    Sleep  1s
    Refresh Env Variables
    
    Sleep  1s
    Ensure Java Is Installed
    Sleep  1s
    Refresh Env Variables

    Sleep  1s
    Quickstart Payslips.pdf Should Work Fine

    Sleep  1s
    Ensure Java Is Not Installed