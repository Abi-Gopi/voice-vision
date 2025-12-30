# Run in PowerShell from this folder:
# powershell -ExecutionPolicy Bypass -File .\setup.ps1

Write-Host "Creating venv..." -ForegroundColor Cyan
python -m venv .venv

Write-Host "Activating venv..." -ForegroundColor Cyan
. .\.venv\Scripts\Activate.ps1

Write-Host "Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip

Write-Host "Installing requirements..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host "`n✅ Setup complete. Now run: python app.py" -ForegroundColor Green
