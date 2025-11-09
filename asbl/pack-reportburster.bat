@echo off
echo ========================================
echo Cleaning build artifacts and Maven cache
echo ========================================

REM Clean dist and target directories  
IF EXIST dist (
    echo Removing dist directory...
    del /S /Q dist\*
    RMDIR /S /Q dist
)

IF EXIST target (
    echo Removing target directory...
    del /S /Q target\*
    RMDIR /S /Q target
)

IF EXIST pack-reportburster.log (
    echo Removing old log file...
    del /f /q pack-reportburster.log
)

REM Clean Maven cache for project artifacts (prevents cached failures)
echo Clearing Maven cache for project artifacts...

IF EXIST %USERPROFILE%\.m2\repository\com\sourcekraft (
    echo   - Clearing com.sourcekraft artifacts
    rmdir /S /Q %USERPROFILE%\.m2\repository\com\sourcekraft
)

IF EXIST %USERPROFILE%\.m2\repository\com\flowkraft (
    echo   - Clearing com.flowkraft artifacts
    rmdir /S /Q %USERPROFILE%\.m2\repository\com\flowkraft
)

echo ========================================
echo Building from parent directory (reactor-aware)
echo ========================================

REM Go to parent directory so Maven sees the reactor
pushd ..\

REM STEP 1: Install parent POM first (critical!)
echo Installing parent POM...
call mvn install -U -f xtra-tools\bild\common-scripts\maven\pom.xml > asbl\pack-reportburster.log 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Parent POM install failed. Check asbl\pack-reportburster.log for details.
    popd
    exit /b %ERRORLEVEL%
)

REM STEP 2: Build asbl and all its dependencies using Maven reactor
echo Building asbl and dependencies...
call mvn clean install -pl asbl -am -DskipTests -U >> asbl\pack-reportburster.log 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed. Check asbl\pack-reportburster.log for details.
    popd
    exit /b %ERRORLEVEL%
)

REM STEP 3: Now run the test
echo Running AssemblerTest#assembleReportBursterAndReportBursterServer...
call mvn test -pl asbl -Dtest=AssemblerTest#assembleReportBursterAndReportBursterServer -X >> asbl\pack-reportburster.log 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Test failed. Check asbl\pack-reportburster.log for details.
    popd
    exit /b %ERRORLEVEL%
)

popd

echo ========================================
echo Build complete. Check pack-reportburster.log for details
echo ========================================