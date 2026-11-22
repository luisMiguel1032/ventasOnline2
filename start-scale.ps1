# Arranca los servicios con el perfil "scale" (Fase 1, sin Docker).
# Ejecutar desde la raiz: .\start-scale.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# Los procesos ya levantados ocupan estos puertos. Se detienen solo esos PID.
$ports = @(8080, 8101, 8103, 8105, 8106, 3001)
$owners = Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

foreach ($owner in $owners) {
    Write-Host "Deteniendo PID $owner (puerto en uso)"
    Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2

$env:SPRING_PROFILES_ACTIVE = 'scale'

$services = @("auth-service", "catalog-service", "cart-service", "order-service")
foreach ($svc in $services) {
    Start-Process -FilePath ".\gradlew.bat" `
        -ArgumentList ":services:$svc`:bootRun" `
        -RedirectStandardOutput "$root\$svc-scale.log" `
        -RedirectStandardError "$root\$svc-scale.err" `
        -WorkingDirectory $root -WindowStyle Hidden
}

Start-Process -FilePath ".\gradlew.bat" `
    -ArgumentList ":services:gateway:bootRun" `
    -RedirectStandardOutput "$root\gateway-scale.log" `
    -RedirectStandardError "$root\gateway-scale.err" `
    -WorkingDirectory $root -WindowStyle Hidden

Write-Host "Backends iniciados con SPRING_PROFILES_ACTIVE=scale."
Write-Host "Espera ~1 minuto y arranca el frontend con: cd web; npm run prod"
