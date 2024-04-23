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

:: Update settings.xml with the correct port
powershell -Command "(gc '%SETTINGS_FILE%') -replace 'http://localhost:\d+/api', 'http://localhost:%PORT%/api' | Out-File -encoding ASCII '%SETTINGS_FILE%'"

:: Check if FRONTEND_PATH is set and points to a valid directory
if exist "%FRONTEND_PATH%" (
    :: Write the port number to a different file
    echo %PORT% > "server-%PORT%.port"
    :: Start the Java process with the port number as the unique identifier and serve static content
    java -Dserver.port=%PORT% -DPORTABLE_EXECUTABLE_DIR=%PORTABLE_EXECUTABLE_DIR_PATH% -DUID=%PORT% -Dspring.resources.static-locations=file:%FRONTEND_PATH% -jar %JAR_FILE% -serve
) else (
    :: Write the port number to a file
    echo %PORT% > "exe-%PORT%.port"
    :: Start the Java process with the port number as the unique identifier
    java -Dserver.port=%PORT% -DPORTABLE_EXECUTABLE_DIR=%PORTABLE_EXECUTABLE_DIR_PATH% -DUID=%PORT% -jar %JAR_FILE% -serve
)