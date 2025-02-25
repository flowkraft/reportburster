:: install on the local maven repository either

:: 1. jars which are not available on public maven repositories or
:: 2. jars which are old on the public maven repositories

:: Step 1 - install jpoller1.5.2 - Directory Poller

:: Step 2 - install Pherialize

call mvn install:install-file -Dfile=./burst/pherialize-1.2.1.jar -DgroupId=de.ailis.pherialize -DartifactId=pherialize -Dversion=1.2.1 -Dpackaging=jar