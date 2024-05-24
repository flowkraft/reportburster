cd /d "%~dp0"
call .venv\Scripts\activate
:: pip install -r requirements.txt
rd /s /q results
mkdir results

:: extract reportburster.zip and reportburster-server.zip
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources/utilities.py'))); from resources.utilities import extract_zip_files; extract_zip_files()"

robot --pythonpath . -d results tests

:: ensure java11 remains installed after the tests are performed
python -c "import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath('resources/utilities.py'))); from resources.utilities import ensure_java_prerequisite; ensure_java_prerequisite()"

deactivate
