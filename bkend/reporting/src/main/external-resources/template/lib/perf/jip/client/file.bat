@ECHO OFF
rem example: file.bat localhost 15599 c:\tmp\foo.txt
java -jar client.jar file %1 %2 %3
