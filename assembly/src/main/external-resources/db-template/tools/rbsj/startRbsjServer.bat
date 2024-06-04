@echo off

:: Get the directory of the script
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: Navigate to the ReportBurster directory
cd "%SCRIPT_DIR%\..\.."
set "PORTABLE_EXECUTABLE_DIR_PATH=%cd%"

:: Now you can use PORTABLE_EXECUTABLE_DIR_PATH to set the paths for SETTINGS_FILE and JAR_FILE
set "SETTINGS_FILE=%PORTABLE_EXECUTABLE_DIR_PATH%\config\_internal\settings.xml"
set "JAR_FILE=%PORTABLE_EXECUTABLE_DIR_PATH%\lib\server\rb-server.jar"

:: Check if the electron.log file exists and delete it
if exist "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\electron.log" (
    del /F /Q "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\electron.log"
)

:: Check if the rbsj-server.log file exists and delete it
if exist "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-server.log" (
    del /F /Q "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-server.log"
)

:: Check if the rbsj-exe.log file exists and delete it
if exist "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-exe.log" (
    del /F /Q "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-exe.log"
)

:: Execute choco -version and redirect the output to a file
choco --version > "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\electron.log" || echo.

set "RB_SERVER_MODE=false"

:: Check if FRONTEND_PATH is set and points to a valid directory
if exist "%FRONTEND_PATH%" (
    set "RB_SERVER_MODE=true"
)

:: Check if POLLING_PATH is set and points to a valid directory
if exist "%POLLING_PATH%" (
    set "RB_SERVER_MODE=true"
)

echo ELECTRON_PID (startRbsjServer.bat): %ELECTRON_PID%
echo FRONTEND PATH (startRbsjServer.bat): %FRONTEND_PATH%
echo POLLING PATH (startRbsjServer.bat): %POLLING_PATH%
echo RB_SERVER_MODE (startRbsjServer.bat): %RB_SERVER_MODE%

:: Call shutRbsjServer to kill older SpringBoot instances and/or older ReportBurster.exe
:: call "%~dp0shutRbsjServer.bat"

:: Find an available port
set /a "PORT=9090"
:loop
powershell -Command "$connection = Test-NetConnection -ComputerName localhost -Port %PORT% 2>$null; if ($connection.TcpTestSucceeded) { exit 1 } else { exit 0 }"
if errorlevel 1 (
    echo WARNING: Port %PORT% is in use.
    set /a "PORT+=1"
    goto :loop
) else (
    echo INFO: Port %PORT% is available.
)

:: Build the JAVA_CMD with all options placed correctly before the -jar
set "JAVA_CMD=-Dserver.port=%PORT% -DPORTABLE_EXECUTABLE_DIR=%PORTABLE_EXECUTABLE_DIR_PATH% -DUID=%PORT%"

if not "%FRONTEND_PATH%"=="" (
    set "JAVA_CMD=%JAVA_CMD% -Dspring.resources.static-locations=file:///%FRONTEND_PATH%"
)
if not "%POLLING_PATH%"=="" (
    set "JAVA_CMD=%JAVA_CMD% -DPOLLING_PATH=%POLLING_PATH%"
)
if not "%ELECTRON_PID%"=="" (
    set "JAVA_CMD=%JAVA_CMD% -DELECTRON_PID=%ELECTRON_PID%"
)

set "JAVA_CMD=%JAVA_CMD% -jar %JAR_FILE% -serve"

echo [DEBUG] Final JAVA command: %JAVA_CMD%

:: Conditional logic based on RB_SERVER_MODE
if "%RB_SERVER_MODE%"=="true" (
    
    powershell -Command "& { & 'java' '%JAVA_CMD%'.Split(' ') | Tee-Object -FilePath '%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-server.log' }"

) else (
    :: Update settings.xml with the port
    powershell -Command "(gc '%SETTINGS_FILE%') -replace 'http://localhost:\d+/api', 'http://localhost:%PORT%/api' | Out-File -encoding ASCII '%SETTINGS_FILE%'"
    
    java -version > "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-exe.log" 2>&1

    powershell -Command "& { & 'java' '%JAVA_CMD%'.Split(' ') | Tee-Object -FilePath '%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-exe.log' }"
)