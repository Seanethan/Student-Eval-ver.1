# build_exe.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Student Evaluation System EXE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Install required packages
Write-Host "Installing required packages..." -ForegroundColor Yellow
pip install oracledb cryptography pyinstaller

# Clean old builds
Write-Host "Cleaning old builds..." -ForegroundColor Yellow
Remove-Item -Path build -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue

# Build the EXE with all dependencies
Write-Host "Building EXE (this may take 2-5 minutes)..." -ForegroundColor Yellow

python -m PyInstaller --onefile --console --name "StudentEval" `
    --add-data "sql_queries.ini;." `
    --add-data "pages;pages" `
    --add-data "cli_modules;cli_modules" `
    --add-data "images;images" `
    --add-data "styles;styles" `
    --add-data "scripts;scripts" `
    --hidden-import=oracledb `
    --hidden-import=cryptography `
    --hidden-import=cryptography.hazmat `
    --hidden-import=cryptography.hazmat.backends `
    --hidden-import=cryptography.hazmat.primitives `
    --hidden-import=cryptography.x509 `
    --collect-all=oracledb `
    --collect-all=cryptography `
    Main.py

Write-Host ""
if (Test-Path "dist\StudentEval.exe") {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "  EXE located at: dist\StudentEval.exe" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    # Copy necessary files to dist
    Write-Host ""
    Write-Host "Copying additional files to dist folder..." -ForegroundColor Yellow
    Copy-Item "sql_queries.ini" -Destination "dist\" -Force
    Copy-Item -Path "pages" -Destination "dist\" -Recurse -Force
    Copy-Item -Path "cli_modules" -Destination "dist\" -Recurse -Force
    Copy-Item -Path "images" -Destination "dist\" -Recurse -Force
    Copy-Item -Path "styles" -Destination "dist\" -Recurse -Force
    Copy-Item -Path "scripts" -Destination "dist\" -Recurse -Force
    
    Write-Host ""
    Write-Host "All files are ready in the 'dist' folder!" -ForegroundColor Green
    Write-Host "The user needs the ENTIRE 'dist' folder, then double-click StudentEval.exe" -ForegroundColor Yellow
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  BUILD FAILED!" -ForegroundColor Red
    Write-Host "  Check errors above" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}

Read-Host "`nPress Enter to exit"