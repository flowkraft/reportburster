import os
from selenium.webdriver.chrome.options import Options
from selenium.webdriver import ChromeService

cwd = os.getcwd()

# create signal_service and point it to correct version of preinstalled chromedriver
# version should match your electron framework and those can be downloaded from:
# https://github.com/electron/electron/releases under the version, from assets.
chromedriver_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(cwd))), "frontend/reporting/node_modules/electron-chromedriver/bin/chromedriver.exe")
signal_service = ChromeService(executable_path=chromedriver_path)

# And here we construct options that point to use your actual electron app.
PORTABLE_EXECUTABLE_DIR = os.path.join(os.path.dirname(os.path.dirname(cwd)), "target/user-acceptance/rb/ReportBurster")
PORTABLE_EXECUTABLE_DIR_SERVER = os.path.join(os.path.dirname(os.path.dirname(cwd)), "target/user-acceptance/rb-server/ReportBurster")
reportburster_exe_path = os.path.join(PORTABLE_EXECUTABLE_DIR, "ReportBurster.exe")
signal_electron = Options()
signal_electron.binary_location = reportburster_exe_path