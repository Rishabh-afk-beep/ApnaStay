Write-Host "Starting ApnaStay locally (without Docker)..."

if (!(Test-Path "backend/.env")) { Copy-Item "backend/.env.example" "backend/.env" }
if (!(Test-Path "frontend/.env")) { Copy-Item "frontend/.env.example" "frontend/.env" }

Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "backend"; if (Test-Path "../.venv/Scripts/python.exe") { ../.venv/Scripts/python.exe -m pip install -r requirements.txt; ../.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 } else { python -m pip install -r requirements.txt; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 }'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "frontend"; npm install; npm run dev'

Write-Host "Started backend and frontend in separate terminals."
