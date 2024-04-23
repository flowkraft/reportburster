param (
    [Parameter(Mandatory=$true)]
    [string]$scriptDir
)

# Check if the script is running with administrative privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    # Re-launch the script with a request for administrative privileges
    Start-Process powershell.exe -Verb RunAs -WindowStyle Hidden -ArgumentList "-File `"$PSCommandPath`" -scriptDir `"$scriptDir`""
    exit
}

# Get all instances of ReportBurster.exe
$processes = Get-Process -Name ReportBurster -ErrorAction SilentlyContinue

# Add the start time and executable path to each process
$processes = $processes | ForEach-Object {
    $query = "SELECT CreationDate, ExecutablePath FROM Win32_Process WHERE ProcessId = $($_.Id)"
    $searcher = New-Object System.Management.ManagementObjectSearcher($query)
    $result = $searcher.Get() | Where-Object { $_.ProcessId -eq $_.Id }
    $_ | Add-Member -MemberType NoteProperty -Name StartTime -Value $result.CreationDate -Force -ErrorAction SilentlyContinue
    $_ | Add-Member -MemberType NoteProperty -Name Path -Value $result.ExecutablePath -Force -ErrorAction SilentlyContinue
    $_
}

# Filter the processes to only include those started from the script directory
$processes = $processes | Where-Object { $_.Path -like "$scriptDir\*" }

# Sort the processes by start time in descending order
$processes = $processes | Sort-Object StartTime -Descending

# If there are more than one process, kill all but the newest one
if ($processes.Count -gt 1) {
    $processes | Select-Object -Skip 1 | ForEach-Object { Stop-Process -Id $_.Id -Force }
}