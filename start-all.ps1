# Arranca todos los servicios del backend y el frontend.
# Ejecutar desde la raiz del proyecto: .\start-all.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$services = @("auth-service","catalog-service","cart-service","order-service")
foreach ($svc in $services) {
    Start-Process -FilePath ".\gradlew.bat" -ArgumentList ":services:$svc`:bootRun" `
        -RedirectStandardOutput "$root\$svc.log" -RedirectStandardError "$root\$svc.err" `
        -WorkingDirectory $root -WindowStyle Hidden
}

Start-Process -FilePath ".\gradlew.bat" -ArgumentList ":services:gateway:bootRun" `
    -RedirectStandardOutput "$root\gateway.log" -RedirectStandardError "$root\gateway.err" `
    -WorkingDirectory $root -WindowStyle Hidden

Write-Host "Servicios backend iniciados. Espera ~1 minuto y luego arranca el frontend:"
Write-Host "  cd web; npm run dev"