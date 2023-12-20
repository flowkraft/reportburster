#!/bin/sh

export HOME=.
export CATALINA_HOME=$HOME/console
export CATALINA_OPTS="-Dconsole.config.folder=$HOME/config"

$HOME/console/bin/startup.sh