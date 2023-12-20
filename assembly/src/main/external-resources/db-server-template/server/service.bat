@echo off
REM DocumentBurster Server
REM
REM -------------------------------------------------------------------------
REM DocumentBurster Server Service Script for Windows
REM -------------------------------------------------------------------------


@if not "%ECHO%" == "" echo %ECHO%
@if "%OS%" == "Windows_NT" setlocal
set DIRNAME=%CD%

if "x%SVCNAME%" == "x" (
    set SVCNAME="DocBurstSrv"
)

set SVCDISP=DocumentBurster Server
set SVCDESC=DocumentBurster Server/Platform: Windows %PROCESSOR_ARCHITECTURE%
set NOPAUSE=Y

REM Figure out the running mode

if /I "%1" == "install"   goto cmdInstall
if /I "%1" == "remove" goto cmdRemove
if /I "%1" == "start"     goto cmdStart
if /I "%1" == "stop"      goto cmdStop
if /I "%1" == "restart"   goto cmdRestart
echo Usage: service install^|remove^|start^|stop^|restart^
goto cmdEnd

REM jbosssvc retun values
REM ERR_RET_USAGE           1
REM ERR_RET_VERSION         2
REM ERR_RET_INSTALL         3
REM ERR_RET_REMOVE          4
REM ERR_RET_PARAMS          5
REM ERR_RET_MODE            6

:errExplain
if errorlevel 1 echo Invalid command line parameters
if errorlevel 2 echo Failed installing %SVCDISP%
if errorlevel 4 echo Failed removing %SVCDISP%
if errorlevel 6 echo Unknown service mode for %SVCDISP%
goto cmdEnd

:cmdInstall
bin\jbosssvc.exe -imwdc %SVCNAME% "%DIRNAME%" "%SVCDISP%" "%SVCDESC%" service.bat
if not errorlevel 0 goto errExplain
echo Service %SVCDISP% installed
goto cmdEnd

:cmdRemove
bin\jbosssvc.exe -u %SVCNAME%
if not errorlevel 0 goto errExplain
echo Service %SVCDISP% removed
goto cmdEnd

:cmdStart
REM Executed on service start
del .r.lock 2>&1 | findstr /C:"being used" > nul
if not errorlevel 1 (
  echo Could not continue. Locking file already in use.
  goto cmdEnd
)
echo Y > .r.lock
bin\jbosssvc.exe -p 1 "Starting %SVCDISP% service" >> logs\service.log
call startServer.bat < .r.lock >> logs\service.log 2>&1
bin\jbosssvc.exe -p 1 "Shutdown %SVCDISP% service" >> logs\service.log
del .r.lock
goto cmdEnd

:cmdStop
REM Executed on service stop
echo Y > .s.lock
bin\jbosssvc.exe -p 1
call shutServer.bat
bin\jbosssvc.exe -p 1
del .s.lock
goto cmdEnd

:cmdRestart
REM Executed manually from command line
REM Note: We can only stop and start
echo Y > .s.lock
bin\jbosssvc.exe -p 1
call shutServer.bat
del .s.lock
:waitRun
REM Delete lock file
del .r.lock > nul 2>&1
REM Wait one second if lock file exist
bin\jbosssvc.exe -s 1
if exist ".r.lock" goto waitRun
echo Y > .r.lock
bin\jbosssvc.exe -p 1 "Restarting %SVCDISP% service" >> logs\service.log
call startServer.bat < .r.lock >> logs\startServer.log 2>&1
bin\jbosssvc.exe -p 1 "Shutdown %SVCDISP% service" >> logs\service.log
del .r.lock
goto cmdEnd

:cmdEnd