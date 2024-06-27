*** Settings ***
Resource    resources/utilities.robot

Test Setup       Clean Output Folders and Log Files

*** Test Cases ***
ReportBurster.exe Latest Java
    [Documentation]  Quickstart Payslips.pdf Should Work Fine (Latest Java)
  
    Ensure Chocolatey Is Installed
    Sleep  1s
    Refresh Env Variables

    Sleep  1s
    Ensure Java Is Not Installed
    Sleep  1s
    Refresh Env Variables
    
    Sleep  1s
    Ensure Java Is Installed   latest
    Sleep  1s
    Refresh Env Variables

    Sleep  1s
    Quickstart Payslips.pdf Should Work Fine

    Sleep  1s
    Ensure Java Is Not Installed
    Sleep  1s
    Refresh Env Variables

startServer.bat and shutServer.bat Should Work Fine Latest Java
    [Documentation]  startServer.bat and shutServer.bat Should Work Fine (Latest Java)
  
    Ensure Chocolatey Is Installed
    Sleep  1s
    Refresh Env Variables

    Sleep  1s
    Ensure Java Is Not Installed
    Sleep  1s
    Refresh Env Variables
    
    Sleep  1s
    Ensure Java Is Installed   latest
    Sleep  1s
    Refresh Env Variables
            
    Sleep  1s
    startServer.bat and shutServer.bat Should Work Fine

    Sleep  1s
    Ensure Java Is Not Installed
    Sleep  1s
    Refresh Env Variables