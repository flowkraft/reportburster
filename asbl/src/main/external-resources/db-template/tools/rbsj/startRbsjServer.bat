@echo off
setlocal enabledelayedexpansion

REM ============================================================================ 
REM 1) Compute where this .BAT lives 
REM ============================================================================ 
set "SCRIPT_DIR=%~dp0"

cd /d "%SCRIPT_DIR%\..\.." || exit /b 1
set "PORTABLE_EXECUTABLE_DIR_PATH=%cd%"

set "SETTINGS_FILE=%PORTABLE_EXECUTABLE_DIR_PATH%\config\_internal\settings.xml"
set "JAR_FILE=%PORTABLE_EXECUTABLE_DIR_PATH%\lib\server\rb-server.jar"

if exist "%PORTABLE_EXECUTABLE_DIR_PATH%\temp\*.*" (
  for %%F in ("%PORTABLE_EXECUTABLE_DIR_PATH%\temp\*.*") do (
    echo %%F | findstr /I /V "progress" >nul && del /q "%%F"
  )
)

if exist "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\electron.log" del /F /Q "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\electron.log"
if exist "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-exe.log"  del /F /Q "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-exe.log"

choco --version > "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\electron.log" 2>&1 || echo.
docker --version >> "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\electron.log" 2>&1 || echo.

set "RB_SERVER_MODE=false"
if exist "%FRONTEND_PATH%" set "RB_SERVER_MODE=true"
if exist "%POLLING_PATH%"  set "RB_SERVER_MODE=true"

echo ELECTRON_PID (startRbsjServer.bat): %ELECTRON_PID%
echo FRONTEND PATH        : %FRONTEND_PATH%
echo POLLING PATH         : %POLLING_PATH%
echo RB_SERVER_MODE       : %RB_SERVER_MODE%

set /a PORT=9090
:findPort
  powershell -Command "exit (Test-NetConnection -ComputerName localhost -Port %PORT%).TcpTestSucceeded"
  if errorlevel 1 (
    echo WARNING: Port %PORT% is in use.
    set /a PORT+=1
    goto findPort
  ) else (
    echo INFO: Port %PORT% is available.
  )

set "JAVA_CMD=-Dorg.springframework.boot.logging.LoggingSystem=org.springframework.boot.logging.log4j2.Log4J2LoggingSystem -Dlog4j.configurationFile=%PORTABLE_EXECUTABLE_DIR_PATH%\log4j2-rbsj.xml -Dserver.port=%PORT% -DPORTABLE_EXECUTABLE_DIR=%PORTABLE_EXECUTABLE_DIR_PATH% -DUID=%PORT%"

if not "%FRONTEND_PATH%"=="" (
  set "JAVA_CMD=!JAVA_CMD! -Dspring.resources.add-mappings=true"
  set "JAVA_CMD=!JAVA_CMD! -Dspring.web.resources.static-locations=file:///%FRONTEND_PATH:/=\%"
  set "JAVA_CMD=!JAVA_CMD! -Dspring.mvc.static-path-pattern=/**"
)

if not "%POLLING_PATH%"==""  set "JAVA_CMD=!JAVA_CMD! -DPOLLING_PATH=%POLLING_PATH%"
if not "%ELECTRON_PID%"==""  set "JAVA_CMD=!JAVA_CMD! -DELECTRON_PID=%ELECTRON_PID%"

set "JAVA_CMD=!JAVA_CMD! -Djava.io.tmpdir=%PORTABLE_EXECUTABLE_DIR_PATH%\temp"
set "JAVA_CMD=!JAVA_CMD! -jar %JAR_FILE% -serve"

echo [DEBUG] Final JAVA command: %JAVA_CMD%
echo.

REM ============================================================================
REM Create PowerShell script for Tee functionality with proper encoding
REM ============================================================================

set "TEE_PS1=%SCRIPT_DIR%\Tee.ps1"

echo param([string]$LogFile) > "%TEE_PS1%"
echo # Set console output encoding to match Windows console code page >> "%TEE_PS1%"
echo $OutputEncoding = [System.Text.Encoding]::GetEncoding([System.Globalization.CultureInfo]::CurrentCulture.TextInfo.OEMCodePage) >> "%TEE_PS1%"
echo # Process input line by line to maintain encoding >> "%TEE_PS1%"
echo $input ^| ForEach-Object { >> "%TEE_PS1%"
echo   # Output to console >> "%TEE_PS1%"
echo   $_ >> "%TEE_PS1%"
echo   # Append to log file with OEM encoding >> "%TEE_PS1%"
echo   $_ ^| Out-File -FilePath $LogFile -Append -Encoding OEM >> "%TEE_PS1%"
echo } >> "%TEE_PS1%"

if "%RB_SERVER_MODE%"=="true" (
  echo Starting Java in server mode...
  
  REM Run Java with our PowerShell tee script
  java %JAVA_CMD% 2>&1 | powershell -NoProfile -ExecutionPolicy Bypass -File "%TEE_PS1%" "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-server.log"
  
) else (
  echo Starting Java in exe mode...
  
  REM Update settings.xml with the current port
  powershell -Command "(Get-Content '%SETTINGS_FILE%') -replace 'http://localhost:\d+/api', 'http://localhost:%PORT%/api' | Out-File -Encoding ASCII '%SETTINGS_FILE%'"
  
  REM Write java version to log file
  java -version > "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-exe.log" 2>&1
  
  REM Check if Java exists before trying the pipe
  where java >nul 2>&1
  if errorlevel 1 (
    echo 'java' is not recognized as an internal or external command, operable program or batch file.
    exit /b 1
  ) else (
    REM Run Java with our PowerShell tee script
    java %JAVA_CMD% 2>&1 | powershell -NoProfile -ExecutionPolicy Bypass -File "%TEE_PS1%" "%PORTABLE_EXECUTABLE_DIR_PATH%\logs\rbsj-exe.log"
  )
)

endlocal