@echo OFF
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

IF EXIST pack-prepare-for-e2e.log (
    echo Removing old log file...
    del /f /q pack-prepare-for-e2e.log
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

echo.
echo Building from parent directory to maintain proper dependency resolution...
REM Go to parent directory
pushd ..\
echo Current directory: %CD%

REM Build both modules in a single Maven invocation
REM The -am flag ensures it builds all required modules for the target
call mvn clean install -pl bkend/common,asbl -am -DskipTests -Djavac.compiler.path="%JAVA_HOME%/bin/javac.exe" > asbl\pack-prepare-for-e2e.log 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed. Check asbl\pack-prepare-for-e2e.log for details.
    popd
    exit /b %ERRORLEVEL%
)

echo.
echo Running AssemblerTest#prepareForE2E...
REM Now run just the specific test
call mvn test -pl asbl -Dtest=AssemblerTest#prepareForE2E -Djavac.compiler.path="%JAVA_HOME%/bin/javac.exe" >> asbl\pack-prepare-for-e2e.log 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: AssemblerTest#prepareForE2E failed. Check asbl\pack-prepare-for-e2e.log for details.
    popd
    exit /b %ERRORLEVEL%
)

REM Return to original directory
popd

echo.
echo Script finished successfully. Log: pack-prepare-for-e2e.log