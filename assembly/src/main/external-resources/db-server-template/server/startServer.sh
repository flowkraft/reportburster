#!/bin/sh

java -DDOCUMENTBURSTER_HOME="$PWD" -cp "lib/batch/ant-launcher.jar" org.apache.tools.ant.launch.Launcher -buildfile config/_internal/startServer.xml -emacs