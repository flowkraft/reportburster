:: install on the local maven repository either

:: 1. jars which are not available on public maven repositories or
:: 2. jars which are old on the public maven repositories

:: Step 1 - install jpoller1.5.2 - Directory Poller

call mvn install:install-file -Dfile=./common/org.sadun.util.jar -DgroupId=org.sadun -DartifactId=org.sadun.util -Dversion=1.5.2 -Dpackaging=jar
call mvn install:install-file -Dfile=./common/pollmgt.jar -DgroupId=org.sadun -DartifactId=pollmgt -Dversion=1.5.2 -Dpackaging=jar

:: Step 2 - install Pherialize

call mvn install:install-file -Dfile=./burst/pherialize-1.2.1.jar -DgroupId=de.ailis.pherialize -DartifactId=pherialize -Dversion=1.2.1 -Dpackaging=jar