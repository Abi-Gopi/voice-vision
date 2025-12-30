# Voice-Vision Assistant (Windows)

A real-time assistive web app (Flask + Camera + Speech + OCR) for visually impaired users.

## Prerequisites
- Python 3.9+ (check “Add Python to PATH” during install)
- Google Chrome (recommended for speech recognition)
- VS Code + Python extension
- Tesseract OCR engine (required for OCR)

## Install Tesseract (Windows)
1) Install Tesseract OCR
2) Verify in PowerShell:
```powershell
tesseract --version
```
If it is NOT found, open `app.py` and set:
```python
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
```

## Run (PowerShell in VS Code)
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Open:
- http://127.0.0.1:5000
