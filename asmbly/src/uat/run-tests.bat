@echo off
setlocal

:: Initialize default values
set TEST_NAME=
set SCREENSHOTS_FOLDER=

:: Parse arguments
if "%~1"=="" goto args_parsed

:: Handle --test=value format
echo %~1 | findstr /b /c:"--test=" >nul && (
    for /f "tokens=1,* delims==" %%a in ("%~1") do set TEST_NAME=%%b
    shift
    goto args_parsed
)

:: Handle --screenshotsFolderPath=value format
echo %~1 | findstr /b /c:"--screenshotsFolderPath=" >nul && (
    for /f "tokens=1,* delims==" %%a in ("%~1") do set SCREENSHOTS_FOLDER=%%b
    shift
    goto args_parsed
)

:: Unknown argument
echo Unknown argument: %~1
exit /b 1

:args_parsed

cd /d "%~dp0"
call .venv\Scripts\activate

:: Clean results directory
rd /s /q results
mkdir results

:: Extract required files
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources/utilities.py'))); from resources.utilities import extract_zip_files; extract_zip_files()"

:: Ensure prerequisites
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources/utilities.py'))); from resources.utilities import ensure_chocolatey_is_installed; ensure_chocolatey_is_installed()"
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources/utilities.py'))); from resources.utilities import ensure_java_prerequisite; ensure_java_prerequisite()"

:: Prepare screenshot parameters
if "%SCREENSHOTS_FOLDER%"=="" (
    set SCREENSHOT_PARAMS=
) else (
    echo Creating screenshots folder: %SCREENSHOTS_FOLDER%
    mkdir "%SCREENSHOTS_FOLDER%" 2>nul
    set SCREENSHOT_PARAMS=-v SCREENSHOTS_FOLDER:"%SCREENSHOTS_FOLDER%"
)

:: Run tests with appropriate parameters
if "%TEST_NAME%"=="" (
    echo Running all tests...
    robot --listener RetryFailed:3 --pythonpath . -d results -L TRACE %SCREENSHOT_PARAMS% tests
) else (
    echo Running specific test: %TEST_NAME%
    robot --listener RetryFailed:3 --pythonpath . -d results -L TRACE %SCREENSHOT_PARAMS% -t "%TEST_NAME%" tests
)

:: Ensure prerequisites remain after tests
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources/utilities.py'))); from resources.utilities import ensure_chocolatey_is_installed; ensure_chocolatey_is_installed()"
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources/utilities.py'))); from resources.utilities import ensure_java_prerequisite; ensure_java_prerequisite()"

deactivate

:: Refresh environment variables
call refreshenv

endlocal
