call .venv\Scripts\activate
:: pip install -r requirements.txt
rd /s /q results
mkdir results
robot --pythonpath . -d results tests
deactivate
