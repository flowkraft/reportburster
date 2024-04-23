@echo off

:: Get the absolute path of the current script
set "SCRIPT_PATH=%~dp0"

:: Remove trailing backslash
set "SCRIPT_PATH=%SCRIPT_PATH:~0,-1%"

set PORTABLE_EXECUTABLE_DIR_PATH=%SCRIPT_PATH%
set POLLING_PATH=%PORTABLE_EXECUTABLE_DIR_PATH%/poll

set FRONTEND_PATH=lib/frontend

call tools/rbsj/startRbsjServer.bat