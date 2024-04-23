@echo off

:: Get the directory of the script
set "SCRIPT_DIR=%~dp0"

:: Remove trailing backslash
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: Navigate to the ReportBurster directory
cd "%SCRIPT_DIR%\..\.."
set "PORTABLE_EXECUTABLE_DIR_PATH=%cd%"

:: Now you can use PORTABLE_EXECUTABLE_DIR_PATH to set the paths for SETTINGS_FILE and JAR_FILE
set "SETTINGS_FILE=%PORTABLE_EXECUTABLE_DIR_PATH%\config\_internal\settings.xml"
set "JAR_FILE=%PORTABLE_EXECUTABLE_DIR_PATH%\lib\server\rb-server.jar"

:: Empty the electron.log file
type nul > "%PORTABLE_EXECUTABLE_DIR_PATH%/logs/electron.log"

:: Call killOlderExes.ps1 to kill older instances of ReportBurster.exe
powershell -File "%~dp0killOlderExes.ps1" -scriptDir "%PORTABLE_EXECUTABLE_DIR_PATH%"

:: Call shutRbsjServer.bat to ensure the port is not blocked
call "%~dp0shutRbsjServer.bat"

:: Find an available port
for /L %%x in (9090, 1, 65535) do (
    powershell -Command "if (!(Test-NetConnection -ComputerName localhost -Port %%x)) { exit 0 } else { exit 1 }" >nul 2>nul
    if errorlevel 1 (
        set "PORT=%%x"
        goto :found
    )
)
echo No available port found
exit /b 1
:found

:: Check if both POLLING_PATH and FRONTEND_PATH are not defined (only when called from ReportBurster.exe)
IF NOT DEFINED POLLING_PATH IF NOT DEFINED FRONTEND_PATH (
    :: Update settings.xml with the correct port
    powershell -Command "(gc '%SETTINGS_FILE%') -replace 'http://localhost:\d+/api', 'http://localhost:%PORT%/api' | Out-File -encoding ASCII '%SETTINGS_FILE%'"
)

set "JAVA_CMD=java -Dserver.port=%PORT% -DPORTABLE_EXECUTABLE_DIR=%PORTABLE_EXECUTABLE_DIR_PATH% -DUID=%PORT% -jar %JAR_FILE% -serve"
set "RB_SERVER_MODE=false"

:: Check if FRONTEND_PATH is set and points to a valid directory
if exist "%FRONTEND_PATH%" (
    set "JAVA_CMD=%JAVA_CMD% -Dspring.resources.static-locations=file:%FRONTEND_PATH%"
    set "RB_SERVER_MODE=true"
)

:: Check if POLLING_PATH is set and points to a valid directory
if exist "%POLLING_PATH%" (
    set "JAVA_CMD=%JAVA_CMD% -DPOLLING_PATH=%POLLING_PATH%"
    set "RB_SERVER_MODE=true"
)

:: If either FRONTEND_PATH or POLLING_PATH exist, write the port number to a server file and start the Java process
if "%RB_SERVER_MODE%"=="true" (
    echo %PORT% > "%SCRIPT_DIR%\server-%PORT%.port"
    %JAVA_CMD%
) else (
    :: If neither FRONTEND_PATH nor POLLING_PATH exist, write the port number to an exe file and start the Java process
    echo %PORT% > "%SCRIPT_DIR%\exe-%PORT%.port"
    %JAVA_CMD%
)