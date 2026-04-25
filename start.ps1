Write-Host "Starting ApnaStay backend + frontend..."

if (!(Test-Path "backend/.env")) {
  Copy-Item "backend/.env.example" "backend/.env"
  Write-Host "Created backend/.env from example"
}

if (!(Test-Path "frontend/.env")) {
  Copy-Item "frontend/.env.example" "frontend/.env"
  Write-Host "Created frontend/.env from example"
}

docker compose up --build
