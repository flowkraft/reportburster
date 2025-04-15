@echo off
cd /d %~dp0
setlocal EnableDelayedExpansion

:: Count arguments
set argCount=0
for %%x in (%*) do set /A argCount+=1

:: Save all arguments to variables
set argIndex=0
for %%x in (%*) do (
    set /A argIndex+=1
    set "ARG!argIndex!=%%~x"
)

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
"C:/Program Files/Java/jre7/bin/java.exe" -DDOCUMENTBURSTER_HOME="%CD%" -cp lib/burst/ant-launcher.jar org.apache.tools.ant.launch.Launcher -buildfile config/_internal/documentburster.xml !javaArgs! -emacs > logs/reportburster.bat.log
