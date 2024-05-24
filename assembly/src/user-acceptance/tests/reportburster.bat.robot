*** Settings ***
Library     OperatingSystem
Library     resources/utilities.py
Variables   resources/vars.py
Suite Setup      Ensure Java Prerequisite
Test Setup       Clean State

*** Keywords ***
Clean State
  [Documentation]  Clean Output Folders and Log Files
  Clean Output Folders and Log Files

*** Test Cases ***
Command Line Payslips.pdf Should Work Fine
  [Documentation]  Command Line Payslips.pdf Should Work Fine
  Run    ${PORTABLE_EXECUTABLE_DIR}/reportburster.bat -f ${PORTABLE_EXECUTABLE_DIR}/samples/burst/Payslips.pdf
  ${count_output_pdf_files}=    Count Files    ${PORTABLE_EXECUTABLE_DIR}/output    pattern=*.pdf    recursive=True
  Should Be Equal As Integers    ${count_output_pdf_files}    3