@echo off
REM ReportBurster Server
REM
REM -------------------------------------------------------------------------
REM ReportBurster Server 'Windows Service' Script
REM -------------------------------------------------------------------------

@if not "%ECHO%" == "" echo %ECHO%
@if "%OS%" == "Windows_NT" setlocal
set DIRNAME=%CD%

if "x%SVCNAME%" == "x" (
    set SVCNAME="ReportBursterSrv"
)

set SVCDISP=ReportBurster Server
set SVCDESC=ReportBurster Server/Platform: Windows %PROCESSOR_ARCHITECTURE%
set NOPAUSE=Y

REM Update the rbsj.xml file with the correct path to the startServer.bat file
set XMLFILE=tools\winsw\rbsj.xml
set STARTSCRIPT=%DIRNAME%\startServer.bat
powershell -Command "(gc '%XMLFILE%') -replace '../../startServer.bat', '%STARTSCRIPT%' | Out-File -encoding ASCII '%XMLFILE%'"
REM Figure out the running mode

if /I "%1" == "install"   goto cmdInstall
if /I "%1" == "uninstall" goto cmdUninstall
if /I "%1" == "start"     goto cmdStart
if /I "%1" == "stop"      goto cmdStop
if /I "%1" == "restart"   goto cmdRestart
echo Usage: service install^|uninstall^|start^|stop^|restart^
goto cmdEnd

:cmdInstall
tools\winsw\rbsj.exe install
if not errorlevel 0 echo Failed installing %SVCDISP%
echo Service %SVCDISP% installed
goto cmdEnd

:cmdUninstall
tools\winsw\rbsj.exe uninstall
if not errorlevel 0 echo Failed removing %SVCDISP%
echo Service %SVCDISP% removed
goto cmdEnd

:cmdStart
echo "Starting %SVCDISP% service" >> logs\service.log
call startServer.bat >> logs\service.log 2>&1
echo "Shutdown %SVCDISP% service" >> logs\service.log
goto cmdEnd

:cmdStop
tools\winsw\rbsj.exe stop
call shutServer.bat
goto cmdEnd

:cmdRestart
tools\winsw\rbsj.exe restart
goto cmdEnd

:cmdEnd