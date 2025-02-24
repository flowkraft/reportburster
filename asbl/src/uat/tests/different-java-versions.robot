*** Settings ***
Resource    resources/utilities.robot

Test Setup       Clean Output Folders and Log Files

# RECOMMENDED JAVA required is Java 11 (if realy needed, it might work on Java 1.8)
# FOR COMPLETENESS AND TO PROVE IT WORKS THERE ARE TESTS FOR
#      00. By default all *.robot tests (besides this one) are executed on RECOMMENDED JAVA - WORKS
#      01. Latest Java - (Java 21 on 27 Jun 2024 did not work with a Groovy error - most likely groovy 3 does not work on 
#      Java 21 which means Groovy should be updated)
#      02. Java6 - IT DOES NOT WORK (tested)
#      03. Java7 - IT DOES NOT WORK (tested)
#      04. Java8 - (manually tested at some point, it used to work)

# choco uninstall jre8 --yes
# choco uninstall AdoptOpenJDK16 --yes
# choco uninstall AdoptOpenJDK16jre --yes

# openjdk11
# openjdk14
# openjdk8

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
#    Java 21 on 27 Jun 2024 did not work with a Groovy error
#    Quickstart Payslips.pdf Should Work Fine

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
#    Java 21 on 27 Jun 2024 did not work with a Groovy error    
#    startServer.bat and shutServer.bat Should Work Fine

    Sleep  1s
    Ensure Java Is Not Installed
    Sleep  1s
    Refresh Env Variables