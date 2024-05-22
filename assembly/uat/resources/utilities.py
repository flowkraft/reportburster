import re, os, shutil, psutil
from vars import reportburster_exe_path, PORTABLE_EXECUTABLE_DIR

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

def clean_output_folders_and_log_files():
    # Define the paths
    backup_folder_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'backup')
    output_folder_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'output')
    info_log_file_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'logs', 'info.log')
    errors_log_file_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'logs', 'errors.log')
    warnings_log_file_path = os.path.join(PORTABLE_EXECUTABLE_DIR, 'logs', 'warnings.log')

    # Empty the folders
    for folder_path in [backup_folder_path, output_folder_path]:
        empty_folder(folder_path)

    # Create or overwrite the log files
    with open(info_log_file_path, 'w') as log_file:
        log_file.write('.')
    for log_file_path in [errors_log_file_path, warnings_log_file_path]:
        with open(log_file_path, 'w') as log_file:
            pass