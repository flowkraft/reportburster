@echo off
set SETTINGS_FILE=../../config/_internal/settings.xml
set JAR_FILE=../../lib/server/rb-server.jar
set FRONTEND_GENERATED_BY_NG=../../lib/frontend

IF NOT DEFINED PORTABLE_EXECUTABLE_DIR_PATH set PORTABLE_EXECUTABLE_DIR_PATH=../..

:: Find an available port
for /L %%x in (9090, 1, 65535) do (
    >nul 2>nul netstat /a /n | find "%%x" || (
        set "PORT=%%x"
        goto :found
    )
)
echo No available port found
exit /b 1
:found

:: Update settings.xml with the correct port
powershell -Command "(gc '%SETTINGS_FILE%') -replace 'http://localhost:\d+', 'http://localhost:%PORT%' | Out-File -encoding ASCII '%SETTINGS_FILE%'"

:: Check if SERVE_STATIC_FRONTEND is set to TRUE
if "%SERVE_STATIC_FRONTEND%"=="TRUE" (
    :: Write the port number to a different file
    echo %PORT% > "server-%PORT%.port"
    :: Start the Java process with the port number as the unique identifier and serve static content
    java -Dserver.port=%PORT% -DPORTABLE_EXECUTABLE_DIR=%PORTABLE_EXECUTABLE_DIR_PATH% -DUID=%PORT% -Dspring.resources.static-locations=file:%FRONTEND_GENERATED_BY_NG% -jar %JAR_FILE% -serve
) else (
    :: Write the port number to a file
    echo %PORT% > "exe-%PORT%.port"
    :: Start the Java process with the port number as the unique identifier
    java -Dserver.port=%PORT% -DPORTABLE_EXECUTABLE_DIR=%PORTABLE_EXECUTABLE_DIR_PATH% -DUID=%PORT% -jar %JAR_FILE% -serve
)