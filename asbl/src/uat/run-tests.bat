@echo off
setlocal

:: Initialize default values
set TEST_NAME=

:parse_args
if "%~1"=="" goto args_parsed

:: Handle --test value format
if /i "%~1"=="--test" (
    if "%~2"=="" (
        echo Error: Missing value for --test
        exit /b 1
    )
    set TEST_NAME=%~2
    shift
    shift
    goto parse_args
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
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources.utilities.py'))); from resources.utilities import ensure_chocolatey_is_installed; ensure_chocolatey_is_installed()"
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources.utilities.py'))); from resources.utilities import ensure_java_prerequisite; ensure_java_prerequisite()"

:: Run tests with appropriate parameters
if "%TEST_NAME%"=="" (
    echo Running all tests...
    robot --listener RetryFailed:3 --pythonpath . -d results -L TRACE tests
) else (
    echo Running specific test: %TEST_NAME%
    robot --listener RetryFailed:3 --pythonpath . -d results -L TRACE -t "%TEST_NAME%" tests
)

:: Ensure prerequisites remain after tests
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources.utilities.py'))); from resources.utilities import ensure_chocolatey_is_installed; ensure_chocolatey_is_installed()"
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources.utilities.py'))); from resources.utilities import ensure_java_prerequisite; ensure_java_prerequisite()"

deactivate

:: Refresh environment variables
call refreshenv

endlocal
