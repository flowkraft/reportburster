@echo off

set "RB_SERVER_MODE=true"

echo RB_SERVER_MODE  (shutServer.bat) is set to %RB_SERVER_MODE%

call "%~dp0tools/rbsj/shutRbsjServer.bat"