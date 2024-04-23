@echo off
:: Find the file that contains the server port number
for /R %%G in (server-*.port) do (
    set "FILE=%%~nG"
    goto :foundServer
)
:: If no server port file found, check for exe port file
for /R %%G in (exe-*.port) do (
    set "FILE=%%~nG"
    goto :foundExe
)

:: If no server or exe port file found, stop the Java process without checking for the UID
powershell -Command "Get-WmiObject Win32_Process -Filter \"name = 'java.exe'\" | Where-Object { $_.CommandLine -like '*rb-server.jar*' } | ForEach-Object { Stop-Process -Id $_.ProcessId }"
goto :eof

:foundServer
:: Extract the server port number from the file name
set "PORT=%FILE:~7,-5%"
goto :continue

:foundExe
:: Extract the exe port number from the file name
set "PORT=%FILE:~4,-5%"

:continue
:: Check if the port file exists
if exist "%FILE%.port" (
    :: Use the port number as the unique identifier
    set "UID=%PORT%"

    :: Stop the Java process
    powershell -Command "Get-WmiObject Win32_Process -Filter \"name = 'java.exe'\" | Where-Object { $_.CommandLine -like '*rb-server.jar*' -and $_.CommandLine -like '*%UID%*' } | ForEach-Object { Stop-Process -Id $_.ProcessId }"

    :: Delete the port file
    del "%FILE%.port"
)