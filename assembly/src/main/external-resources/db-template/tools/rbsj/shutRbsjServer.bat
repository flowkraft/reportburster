@echo off
:: Check if SERVE_STATIC_FRONTEND is set to TRUE
if "%SERVE_STATIC_FRONTEND%"=="TRUE" (
    :: Find the file that contains the server port number
    for /R %%G in (server-*.port) do (
        set "FILE=%%~nG"
        goto :foundServer
    )
    echo No server port file found
    exit /b 1
    :foundServer

    :: Extract the server port number from the file name
    set "PORT=%FILE:~7,-5%"
) else (
    :: Find the file that contains the exe port number
    for /R %%G in (exe-*.port) do (
        set "FILE=%%~nG"
        goto :foundExe
    )
    echo No exe port file found
    exit /b 1
    :foundExe

    :: Extract the exe port number from the file name
    set "PORT=%FILE:~4,-5%"
)

:: Use the port number as the unique identifier
set "UID=%PORT%"

:: Stop the Java process
powershell -Command "Get-WmiObject Win32_Process -Filter \"name = 'java.exe'\" | Where-Object { $_.CommandLine -like '*rb-server.jar*' -and $_.CommandLine -like '*%UID%*' } | ForEach-Object { Stop-Process -Id $_.ProcessId }"

:: Delete the port file
del "%FILE%.port"