import subprocess, glob, re, os, shutil, zipfile, time, pyautogui, psutil
from vars import reportburster_exe_path, PORTABLE_EXECUTABLE_DIR, PORTABLE_EXECUTABLE_DIR_SERVER

def kill_reportburster_exe_process():
    
    log_file_path = os.path.join(os.path.dirname(reportburster_exe_path), 'logs', 'electron.log')
    print(f'Log file path: {log_file_path}')
    
    with open(log_file_path, 'r') as log_file:
        log_content = log_file.read()
        match = re.search(r'-DELECTRON_PID=(\d+)', log_content)
        if match:
            pid = match.group(1)
            try:
                process = psutil.Process(int(pid))
                process.kill()
            except psutil.NoSuchProcess:
                print(f"No process found with PID: {pid}")

def empty_folder(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print('Failed to delete %s. Reason: %s' % (file_path, e))

def count_files(directory, pattern='*.pdf', recursive=False):
    if recursive:
        pattern = '**/' + pattern
    files = glob.glob(os.path.join(directory, pattern), recursive=recursive)
    files = [f for f in files if os.path.isfile(f)]
    return len(files)

def clean_output_folders_and_log_files(product="exe"):
    # Define the paths
    backup_folder_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'backup')
    output_folder_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'output')
    info_log_file_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'logs', 'info.log')
    errors_log_file_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'logs', 'errors.log')
    warnings_log_file_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'logs', 'warnings.log')

    if product == 'server':
        backup_folder_path = os.path.join(PORTABLE_EXECUTABLE_DIR_SERVER, 'backup')
        output_folder_path = os.path.join(PORTABLE_EXECUTABLE_DIR_SERVER, 'output')
        info_log_file_path = os.path.join(PORTABLE_EXECUTABLE_DIR_SERVER, 'logs', 'info.log')
        errors_log_file_path = os.path.join(PORTABLE_EXECUTABLE_DIR_SERVER, 'logs', 'errors.log')
        warnings_log_file_path = os.path.join(PORTABLE_EXECUTABLE_DIR_SERVER, 'logs', 'warnings.log')

    # Empty the folders
    for folder_path in [backup_folder_path, output_folder_path]:
        empty_folder(folder_path)

    # Create or overwrite the log files
    with open(info_log_file_path, 'w') as log_file:
        log_file.write('.')
    for log_file_path in [errors_log_file_path, warnings_log_file_path]:
        with open(log_file_path, 'w') as log_file:
            pass

def ensure_java_prerequisite():
    ensure_java_is_installed("11")

def ensure_java_is_not_installed():
    try:
        # Check if Chocolatey is installed
        try:
            subprocess.check_output('choco -v', shell=True)
            choco_installed = True
        except subprocess.CalledProcessError:
            choco_installed = False

        # Use Chocolatey to uninstall Java, if it's installed
        if choco_installed:
            output = subprocess.check_output('choco list', shell=True).decode('utf-8')
            java_or_jdk_products = [line.strip() for line in output.split('\n') if 'java' in line.lower() or 'jdk' in line.lower() or 'temurin' in line.lower()]

            for product in java_or_jdk_products:
                product_name = product.split(' ')[0]  # get the product name from the line
                print(f"Uninstalling {product_name} with Chocolatey...")
                subprocess.check_call(f'choco uninstall {product_name} -y', shell=True)
        
        # Use WMIC to uninstall any remaining Java installations
        output = subprocess.check_output('wmic product where "name like \'%%java%%\' or name like \'%%jdk%%\'" get name', shell=True).decode('utf-8')
        java_or_jdk_products = [line.strip() for line in output.split('\n') if line.strip() != '' and line.strip() != 'Name']

        for product in java_or_jdk_products:
            print(f"Uninstalling {product} with WMIC...")
            subprocess.check_call(f'wmic product where "name=\'{product}\'" call uninstall', shell=True)

        print("Java is not installed on this computer.")
    except subprocess.CalledProcessError:
        print("An error occurred while uninstalling Java.")

def ensure_java_is_installed(version="11"):
    output = ""
    try:
        output = subprocess.check_output('java -version', shell=True, stderr=subprocess.STDOUT)
        if version in output.decode('utf-8'):
            print(f"Java {version} is already installed.")
        else:
            print(f"Java is installed but not version {version}. Installing now...")
            ensure_chocolatey_is_installed()
            ensure_java_is_not_installed()
            if version == '11':
                subprocess.check_call(f'choco install temurin11 -y', shell=True)
            elif version == '8':
                subprocess.check_call(f'choco install temurin8 -y', shell=True)
            else:
                subprocess.check_call(f'choco install temurin -y', shell=True)
            print(f"Java {version} has been installed.")
    except subprocess.CalledProcessError:
        print("Java is not installed. Installing now...")
        ensure_chocolatey_is_installed()
        if version == '11':
            subprocess.check_call(f'choco install temurin11 -y', shell=True)
        elif version == '8':
                subprocess.check_call(f'choco install temurin8 -y', shell=True)
        else:
            subprocess.check_call(f'choco install temurin -y', shell=True)
                
    print(f"Java {version} is installed.")
    
def ensure_chocolatey_is_installed():
    try:
        output = subprocess.check_output('choco -v', shell=True, stderr=subprocess.STDOUT)
        print(f"Output of 'choco -v': {output.decode('utf-8')}")
        if 'not recognized' in output.decode('utf-8'):
            raise Exception("'choco' command not recognized")
        print("Chocolatey is already installed.")
    except Exception:
        print("Chocolatey is not installed or there was an error checking. Installing now...")
        install_command = """
        @"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "
        Set-ExecutionPolicy Bypass -Scope Process -Force; 
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; 
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        "
        """
        subprocess.check_call(install_command, shell=True)
        print("Chocolatey has been installed.")

def ensure_chocolatey_is_not_installed():
    try:
        subprocess.check_output('choco -v', shell=True)
        print("Chocolatey is installed. Uninstalling now...")
        choco_uninstall_script_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'tools', 'chocolatey', 'uninstall.ps1')
        subprocess.check_call(['powershell', '-ExecutionPolicy', 'Bypass', choco_uninstall_script_path], shell=True)
        print("Chocolatey has been uninstalled.")
    except subprocess.CalledProcessError:
        print("Chocolatey is not installed.")

def extract_zip_files():
    paths = [
        "../../target/user-acceptance/rb",
        "../../target/user-acceptance/rb-server"
    ]
    zips = [
        "../../dist/reportburster.zip",
        "../../dist/reportburster-server.zip"
    ]

    for path, zip_file in zip(paths, zips):
        if not os.path.exists(path):
            os.makedirs(path)
            with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                zip_ref.extractall(path)

def wait_for_powershell_and_accept_completion():

    # Get the directory that this script is in
    script_dir = os.path.dirname(os.path.realpath(__file__))

    # Construct the path to the image file
    image_path = os.path.join(script_dir, 'images', 'ok_button_powershell.png')

    button_location = None

    # Wait for up to 100 seconds for the OK button to appear
    for _ in range(100):
        try:
            button_location = pyautogui.locateOnScreen(image_path, grayscale=True, confidence=.8)
            if button_location is not None:
                break
        except pyautogui.ImageNotFoundException:
            pass  # Image not found, continue the loop
        time.sleep(1)  # Wait for 1 second

    # If the button is found, click it
    if button_location is not None:
        pyautogui.click(button_location)
    else:
        print("OK button not found")

def start_server():
    process = subprocess.Popen(['cmd.exe', '/c', f'{PORTABLE_EXECUTABLE_DIR_SERVER}/startServer.bat'], cwd=PORTABLE_EXECUTABLE_DIR_SERVER)
    return process

def shut_server():
    process = subprocess.Popen(['cmd.exe', '/c', f'{PORTABLE_EXECUTABLE_DIR_SERVER}/shutServer.bat'], cwd=PORTABLE_EXECUTABLE_DIR_SERVER)
    return process

def service_install():
    process = subprocess.Popen(['cmd.exe', '/c', f'{PORTABLE_EXECUTABLE_DIR_SERVER}/service.bat', 'install'], cwd=PORTABLE_EXECUTABLE_DIR_SERVER, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    return stdout.decode()

def service_uninstall():
    process = subprocess.Popen(['cmd.exe', '/c', f'{PORTABLE_EXECUTABLE_DIR_SERVER}/service.bat', 'uninstall'], cwd=PORTABLE_EXECUTABLE_DIR_SERVER, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    return stdout.decode()

def text_contains_either(text, str1, str2):
    return str1 in text or str2 in text