# Create and Setup Conda Environment for Playground API
# Run this script to set up the 'play' conda environment

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Creating Conda Environment: play" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if conda is available
Write-Host "[1/4] Checking Conda installation..." -ForegroundColor Yellow
try {
    $condaVersion = conda --version 2>&1
    Write-Host "✓ $condaVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Conda not found! Please install Anaconda or Miniconda" -ForegroundColor Red
    Write-Host "  Download from: https://docs.conda.io/en/latest/miniconda.html" -ForegroundColor Yellow
    exit 1
}

# Create conda environment from environment.yml
Write-Host ""
Write-Host "[2/4] Creating conda environment from environment.yml..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Gray

$envExists = conda env list | Select-String -Pattern "^play\s"
if ($envExists) {
    Write-Host "⚠ Environment 'play' already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to remove and recreate it? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "  Removing existing environment..." -ForegroundColor Gray
        conda env remove -n play -y
        Write-Host "✓ Old environment removed" -ForegroundColor Green
    } else {
        Write-Host "  Skipping environment creation" -ForegroundColor Gray
        conda activate play
        Write-Host "✓ Environment activated" -ForegroundColor Green
        exit 0
    }
}

conda env create -f environment.yml
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to create conda environment" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Conda environment 'play' created successfully" -ForegroundColor Green

# Activate the environment
Write-Host ""
Write-Host "[3/4] Activating environment..." -ForegroundColor Yellow
conda activate play
Write-Host "✓ Environment activated" -ForegroundColor Green

# Initialize Brightway2 (if needed)
Write-Host ""
Write-Host "[4/4] Checking Brightway2 initialization..." -ForegroundColor Yellow
$bwCheck = python -c "import brightway2 as bw; bw.projects.set_current('aluminum_lca'); print('aluminum_lca' in bw.projects)" 2>&1
if ($bwCheck -match "True") {
    Write-Host "✓ Brightway2 already initialized" -ForegroundColor Green
} else {
    Write-Host "⚠ Brightway2 not initialized" -ForegroundColor Yellow
    $initResponse = Read-Host "Do you want to initialize it now? (Y/n)"
    if ($initResponse -ne "n" -and $initResponse -ne "N") {
        Write-Host "  Initializing Brightway2 database..." -ForegroundColor Gray
        python scripts/initialize_bw.py
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Brightway2 initialized successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠ Brightway2 initialization failed (you can run it manually later)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To activate the environment in the future, run:" -ForegroundColor Green
Write-Host "  conda activate play" -ForegroundColor White
Write-Host ""
Write-Host "To start the Playground API server:" -ForegroundColor Green
Write-Host "  conda activate play" -ForegroundColor White
Write-Host "  python -m uvicorn playground_api:app --host 0.0.0.0 --port 8100 --reload" -ForegroundColor White
Write-Host ""
Write-Host "Or use the startup script:" -ForegroundColor Green
Write-Host "  .\start_playground_api.ps1" -ForegroundColor White
Write-Host ""
