"""
Shell command execution tool for running arbitrary system commands.

Allows you to execute shell commands on the host system and receive the output.
Use with caution - only execute trusted commands as this has full system access.

*** IMPORTANT GUIDANCE ***

ENVIRONMENT VARIABLE: AUTO_APPROVE_SHELL_COMMANDS
  - Default: False (not set or explicitly set to "false")
  - When set to "true": All commands execute automatically without asking for permission
  - When False (default): Destructive commands require explicit user approval

If AUTO_APPROVE_SHELL_COMMANDS is False (default behavior):

  READ-ONLY COMMANDS (Execute without asking permission):
    - File inspection: ls, cat, head, tail, file, stat, find
    - Search/grep: grep, ripgrep (rg), awk, sed (reading only)
    - Git inspection: git status, git log, git diff, git branch (no modifications)
    - System info: pwd, whoami, date, env, which
    - Package info: npm list, pip list, cargo --version
    - Process inspection: ps, top (read-only)

  DESTRUCTIVE COMMANDS (MUST ask for explicit user approval first):
    - File modifications: rm, mv, cp, sed -i, write operations, chmod, chown
    - Git modifications: git commit, git push, git reset, git rebase
    - Package operations: npm install, pip install, apt install, cargo build
    - System changes: systemctl, service, reboot, shutdown
    - Process control: kill, killall

  When you need to run a DESTRUCTIVE command (and AUTO_APPROVE_SHELL_COMMANDS is False):
    1. Provide to the user a clear explanation, in 100 words or less, describing what the command does and why it is required
    2. Ask: 'May I execute this command? Please respond Yes or No.'
    3. Wait for explicit 'Yes' response from the user
    4. After receiving 'Yes', execute the command

If AUTO_APPROVE_SHELL_COMMANDS is True:
  - All commands (both read-only and destructive) execute automatically without asking
  - Use this mode only in trusted, controlled environments or during automated workflows
  - The LLM will not ask for permission for any command

CRITICAL: The AUTO_APPROVE_SHELL_COMMANDS environment variable is controlled by the user/system 
configuration, NOT by the LLM. The LLM cannot and should not attempt to change this setting.
"""

import subprocess
import os

# Read environment variable (defaults to False for safety)
AUTO_APPROVE_SHELL_COMMANDS = os.getenv('AUTO_APPROVE_SHELL_COMMANDS', 'false').lower() in ('true', '1', 'yes')

def execute_shell_command(command: str, timeout: int = 60) -> str:
    """
    Executes an arbitrary shell command and returns its output.
    
    This tool runs the command in the system's default shell and captures both
    stdout and stderr, returning the combined output exactly as the shell would display it.
    
    Behavior is controlled by the AUTO_APPROVE_SHELL_COMMANDS environment variable:
      - If False (default): Read-only commands execute immediately, destructive commands require user approval
      - If True: All commands execute automatically without asking
    
    Args:
        command (str): The shell command to execute (e.g., "ls -la", "git status", "python --version")
        timeout (int): Maximum seconds to wait for command completion (default: 60)
        
    Returns:
        str: The complete output from the command including stdout and stderr.
             Also includes the exit code at the end.
        
    Examples:
        >>> execute_shell_command("pwd")
        >>> execute_shell_command("git log --oneline -5")
        >>> execute_shell_command("npm list --depth=0")
        >>> execute_shell_command("python -c 'print(2+2)'")
    """
    print(f"execute_shell_command called with command: {command}")
    print(f"AUTO_APPROVE_SHELL_COMMANDS is set to: {AUTO_APPROVE_SHELL_COMMANDS}")
    
    try:
        # Execute command in shell, capture both stdout and stderr
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        # Combine stdout and stderr for complete output
        output = []
        
        if result.stdout:
            output.append(result.stdout)
        
        if result.stderr:
            output.append(result.stderr)
        
        # Add exit code information
        output.append(f"\n[Exit Code: {result.returncode}]")
        
        combined_output = "".join(output)
        
        print(f"execute_shell_command completed with exit code: {result.returncode}")
        
        return combined_output
        
    except subprocess.TimeoutExpired:
        error_msg = f"Command timed out after {timeout} seconds: {command}"
        print(f"execute_shell_command TIMEOUT: {error_msg}")
        raise Exception(error_msg)
    
    except Exception as e:
        error_msg = f"Failed to execute command '{command}': {type(e).__name__}: {str(e)}"
        print(f"execute_shell_command ERROR: {error_msg}")
        raise Exception(error_msg)
