@echo off
set PORT=9090

set SETTINGS_FILE=../../config/_internal/settings.xml

:: Update settings.xml with the correct port
powershell -Command "(gc '%SETTINGS_FILE%') -replace 'http://localhost:\d+', 'http://localhost:%PORT%' | Out-File -encoding ASCII '%SETTINGS_FILE%'"

set JAR_FILE=../../lib/server/rbsj-server.jar

IF NOT DEFINED PORTABLE_EXECUTABLE_DIR_PATH set PORTABLE_EXECUTABLE_DIR_PATH=../..

:: Start the Java process
java -Dserver.port=%PORT% -DPORTABLE_EXECUTABLE_DIR=%PORTABLE_EXECUTABLE_DIR_PATH% -jar %JAR_FILE% -serve

:: pause