@echo off
powershell -Command "Get-WmiObject Win32_Process -Filter \"name = 'java.exe'\" | Where-Object { $_.CommandLine -like '*rb-server.jar*' } | ForEach-Object { Stop-Process -Id $_.ProcessId }"
:: pause