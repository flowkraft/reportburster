cd /d %~dp0
java -DDOCUMENTBURSTER_HOME="%CD%" -cp lib/burst/ant-launcher.jar org.apache.tools.ant.launch.Launcher -buildfile config/_internal/documentburster.xml -Darg1=%1 -Darg2=%2 -Darg3=%3 -Darg4=%4 -Darg5=%5 -Darg6=%6 -Darg7=%7 -emacs > logs/documentburster.bat.log
