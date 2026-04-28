@echo off
cd /d "%~dp0"
setlocal EnableDelayedExpansion

:: Count and save arguments using shift (preserves quoted values with spaces)
set argCount=0
set argIndex=0

:countArgs
if "%~1"=="" goto doneCount
set /A argIndex+=1
set "ARG!argIndex!=%~1"
shift
goto countArgs
:doneCount
set argCount=%argIndex%

:: Build logging string dynamically
set "logLine=Arguments: "
for /L %%i in (1,1,!argCount!) do (
    set "logLine=!logLine!!ARG%%i! "
)
echo !logLine! >> logs/args_debug.log

:: Build Java arguments dynamically
set "javaArgs="
for /L %%i in (1,1,!argCount!) do (
    set "javaArgs=!javaArgs! -Darg%%i="!ARG%%i!""
)

:: Launch with dynamically built arguments
java -DDOCUMENTBURSTER_HOME="%CD%" -cp lib/burst/ant-launcher.jar org.apache.tools.ant.launch.Launcher -buildfile config/_internal/documentburster.xml !javaArgs! -emacs > logs/datapallas.bat.log
