# Start Playground API Server
# This script starts the FastAPI server for the LCA Playground

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Aluminum LCA Playground API Startup" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if conda is available and 'play' environment exists
Write-Host "[1/4] Checking environment..." -ForegroundColor Yellow
$condaAvailable = $false
$playEnvExists = $false

try {
    $condaVersion = conda --version 2>&1
    $condaAvailable = $true
    $envList = conda env list 2>&1
    if ($envList -match "play\s") {
        $playEnvExists = $true
    }
} catch {
    # Conda not available, will check for venv
}

if ($condaAvailable -and $playEnvExists) {
    Write-Host "✓ Conda environment 'play' found" -ForegroundColor Green
    Write-Host "  Activating conda environment..." -ForegroundColor Gray
    conda activate play
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Conda environment activated" -ForegroundColor Green
    } else {
        Write-Host "⚠ Failed to activate conda environment" -ForegroundColor Yellow
        Write-Host "  Continuing with current environment..." -ForegroundColor Gray
    }
} elseif ($condaAvailable -and -not $playEnvExists) {
    Write-Host "⚠ Conda is installed but 'play' environment not found" -ForegroundColor Yellow
    Write-Host "  Run: .\setup_conda_env.ps1 to create it" -ForegroundColor Gray
    Write-Host "  Checking for venv..." -ForegroundColor Gray
    
    if (Test-Path "venv\Scripts\Activate.ps1") {
        Write-Host "✓ Virtual environment found" -ForegroundColor Green
        & "venv\Scripts\Activate.ps1"
    } elseif (Test-Path ".venv\Scripts\Activate.ps1") {
        Write-Host "✓ Virtual environment found (.venv)" -ForegroundColor Green
        & ".venv\Scripts\Activate.ps1"
    } else {
        Write-Host "⚠ No virtual environment found" -ForegroundColor Yellow
        Write-Host "  Using global Python environment" -ForegroundColor Gray
    }
} else {
    # Conda not available, check for venv
    Write-Host "ℹ Conda not found, checking for virtual environment..." -ForegroundColor Gray
    if (Test-Path "venv\Scripts\Activate.ps1") {
        Write-Host "✓ Virtual environment found" -ForegroundColor Green
        & "venv\Scripts\Activate.ps1"
    } elseif (Test-Path ".venv\Scripts\Activate.ps1") {
        Write-Host "✓ Virtual environment found (.venv)" -ForegroundColor Green
        & ".venv\Scripts\Activate.ps1"
    } else {
        Write-Host "⚠ No virtual environment found" -ForegroundColor Yellow
        Write-Host "  Using global Python environment" -ForegroundColor Gray
    }
}

# Verify Python is available
Write-Host ""
Write-Host "[2/4] Verifying Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found!" -ForegroundColor Red
    Write-Host "  Please install Python 3.8+ or create conda environment" -ForegroundColor Yellow
    Write-Host "  Run: .\setup_conda_env.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if required packages are installed
Write-Host ""
Write-Host "[3/4] Checking dependencies..." -ForegroundColor Yellow
$packages = @("fastapi", "uvicorn", "brightway2")
$missing = @()

foreach ($package in $packages) {
    $result = pip show $package 2>&1
    if ($LASTEXITCODE -ne 0) {
        $missing += $package
    }
}

if ($missing.Count -gt 0) {
    Write-Host "✗ Missing packages: $($missing -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ All dependencies installed" -ForegroundColor Green
}

# Check if Brightway2 is initialized
Write-Host ""
Write-Host "[4/4] Checking LCA database..." -ForegroundColor Yellow
$bwCheck = python -c "import brightway2 as bw; print('aluminum_lca' in bw.projects)" 2>&1
if ($bwCheck -match "True") {
    Write-Host "✓ LCA database initialized" -ForegroundColor Green
} else {
    Write-Host "⚠ LCA database not initialized" -ForegroundColor Yellow
    Write-Host "  Run: python scripts/initialize_bw.py" -ForegroundColor Gray
}

# Start the server
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Starting FastAPI Server" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API Endpoint:    http://localhost:8100" -ForegroundColor Green
Write-Host "Interactive Docs: http://localhost:8100/docs" -ForegroundColor Green
Write-Host "Health Check:    http://localhost:8100/health" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start uvicorn
python -m uvicorn playground_api:app --host 0.0.0.0 --port 8100 --reload
