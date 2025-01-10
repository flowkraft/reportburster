@echo off
setlocal

:: Initialize default values
set TEST_NAME=
set SCREENSHOTS_FOLDER=

:: Parse arguments
for %%a in (%*) do (
    if "%%a" starts with "--test=" set TEST_NAME=%%a
    if "%%a" starts with "--screenshotsFolderPath=" set SCREENSHOTS_FOLDER=%%a
)

:: Extract values from arguments
if defined TEST_NAME set TEST_NAME=%TEST_NAME:~7%
if defined SCREENSHOTS_FOLDER set SCREENSHOTS_FOLDER=%SCREENSHOTS_FOLDER:~22%

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
