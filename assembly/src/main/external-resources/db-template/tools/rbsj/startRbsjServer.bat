@echo off
powershell -Command "Get-WmiObject Win32_Process -Filter \"name = 'java.exe'\" | Where-Object { $_.CommandLine -like '*rb-server.jar*' } | ForEach-Object { Stop-Process -Id $_.ProcessId }"

FOR /F "tokens=* USEBACKQ" %%F IN (`choco -v 2^>^&1`) DO (
    SET choco_command_output=%%F
)
echo choco version: %choco_command_output%
java -version

set PORT=9090

set SETTINGS_FILE=../../config/_internal/settings.xml

:: Update settings.xml with the correct port
powershell -Command "(gc '%SETTINGS_FILE%') -replace 'http://localhost:\d+', 'http://localhost:%PORT%' | Out-File -encoding ASCII '%SETTINGS_FILE%'"

set JAR_FILE=../../lib/server/rb-server.jar

IF NOT DEFINED PORTABLE_EXECUTABLE_DIR_PATH set PORTABLE_EXECUTABLE_DIR_PATH=../..

:: Start the Java process
java -Dserver.port=%PORT% -DPORTABLE_EXECUTABLE_DIR=%PORTABLE_EXECUTABLE_DIR_PATH% -jar %JAR_FILE% -serve

:: pause