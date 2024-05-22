import re, os, psutil
from vars import reportburster_exe_path

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