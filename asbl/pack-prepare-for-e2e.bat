@echo OFF
echo Cleaning up previous artifacts...
IF EXIST dist (
    echo Deleting dist directory...
    del /S /Q dist\*
    RMDIR /S /Q dist
)

IF EXIST pack-prepare-for-e2e.log (
    echo Deleting previous log file...
    del /f /q pack-prepare-for-e2e.log
)

echo.
echo Building from parent directory to maintain proper dependency resolution...
REM Go to parent directory
pushd ..\
echo Current directory: %CD%

REM Build both modules in a single Maven invocation
REM The -am flag ensures it builds all required modules for the target
call mvn clean install -pl bkend/common,asbl -am -DskipTests > asbl\pack-prepare-for-e2e.log 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed. Check asbl\pack-prepare-for-e2e.log for details.
    popd
    exit /b %ERRORLEVEL%
)

echo.
echo Running AssemblerTest#prepareForE2E...
REM Now run just the specific test
call mvn test -pl asbl -Dtest=AssemblerTest#prepareForE2E >> asbl\pack-prepare-for-e2e.log 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: AssemblerTest#prepareForE2E failed. Check asbl\pack-prepare-for-e2e.log for details.
    popd
    exit /b %ERRORLEVEL%
)

REM Return to original directory
popd

echo.
echo Script finished successfully. Log: pack-prepare-for-e2e.log