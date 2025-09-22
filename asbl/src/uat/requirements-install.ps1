# Stop on first error
$ErrorActionPreference = "Stop"

Write-Host "Starting clean installation..." -ForegroundColor Green

try {
    # Clean start
    if (Test-Path ".\.venv") {
        Remove-Item -Recurse -Force .\.venv
    }
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    python -m pip install --upgrade pip

    # Install all tools from requirements-tools.txt
    Write-Host "Installing tools requirements..." -ForegroundColor Yellow
    pip install --no-cache-dir -r requirements-uat-robot-framework.txt

    Write-Host "Installation completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "An error occurred: $_" -ForegroundColor Red
    exit 1
}