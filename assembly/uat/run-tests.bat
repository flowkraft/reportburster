call .venv\Scripts\activate
:: pip install -r requirements.txt
robot --pythonpath . -d results tests
deactivate