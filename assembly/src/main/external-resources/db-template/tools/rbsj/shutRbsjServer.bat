@echo off
REM Stop/kill any running java server
powershell -Command "Get-WmiObject Win32_Process -Filter \"name = 'java.exe'\" | Where-Object { $_.CommandLine -like '*rb-server.jar*' } | ForEach-Object { Stop-Process -Id $_.ProcessId }"

REM Empty the ../logs/electron.log file
powershell -Command "Set-Content -Path '../logs/electron.log' -Value ''"

REM Empty the ../temp directory
powershell -Command "Get-ChildItem -Path '../temp/*' | Remove-Item -Recurse -Force"
:: pause