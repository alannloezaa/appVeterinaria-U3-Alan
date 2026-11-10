$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$runtimeDir = $null
if ($nodeCommand) {
    $nodeExe = $nodeCommand.Source
} else {
    # Aprovecha el runtime ya instalado de Codex si Node no está en PATH.
    $packages = Get-AppxPackage -Name 'OpenAI.CodexPrimaryRuntime*' -ErrorAction SilentlyContinue
    $locations = @($packages | Sort-Object Version -Descending | ForEach-Object { $_.InstallLocation })
    $locations += @(Get-ChildItem -LiteralPath "$env:ProgramFiles\WindowsApps" -Directory -Filter 'OpenAI.CodexPrimaryRuntime*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | ForEach-Object { $_.FullName })
    # Windows puede impedir enumerar WindowsApps aunque permita abrir el runtime.
    $locations += 'C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1105-1297-0_26.1105.1297.0_x64__3k8sg7r9htsxt'
    foreach ($location in $locations) {
        $candidate = Join-Path $location 'dependencies\node\bin\node.exe'
        if (Test-Path -LiteralPath $candidate) {
            $nodeExe = $candidate
            $runtimeDir = $location
            break
        }
    }
}
if (-not $nodeExe) {
    throw 'Instala Node.js 24 LTS desde https://nodejs.org y vuelve a abrir este archivo.'
}
$nodeVersion = & $nodeExe --version
if ([version]$nodeVersion.TrimStart('v') -lt [version]'22.13.0') {
    throw 'Se necesita Node.js 22.13 o posterior. Usa Node.js 24 LTS.'
}
$env:PATH = (Split-Path -Parent $nodeExe) + ';' + $env:PATH

if (-not (Test-Path -LiteralPath 'node_modules\vite') -or -not (Test-Path -LiteralPath 'backend\node_modules\tsx') -or -not (Test-Path -LiteralPath 'backend\node_modules\mysql2')) {
    Write-Host 'Instalando dependencias. La primera vez se necesita internet.'
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($npmCommand) {
        & $npmCommand.Source ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación del frontend.' }
        & $npmCommand.Source --prefix backend ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación del backend.' }
    } elseif ($runtimeDir) {
        $pnpm = Join-Path $runtimeDir 'dependencies\bin\fallback\pnpm.cmd'
        & $pnpm install --frozen-lockfile --ignore-scripts
        if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación del frontend.' }
        Push-Location -LiteralPath 'backend'
        try {
            & $pnpm install --frozen-lockfile --ignore-scripts
            if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación del backend.' }
        } finally { Pop-Location }
    } else {
        throw 'No se encontró npm. Reinstala Node.js con npm incluido.'
    }
}

# En este equipo se puede usar una instancia portable, sin servicio de Windows.
# El descriptor contiene rutas locales y está excluido de Git y del ZIP.
if (Test-Path -LiteralPath '.mysql-local.json') {
    $taskMysql = Get-Content -LiteralPath '.mysql-local.json' -Raw | ConvertFrom-Json
    function Test-LocalMysql {
        $taskSocket = [System.Net.Sockets.TcpClient]::new()
        try { return $taskSocket.ConnectAsync('127.0.0.1', [int]$taskMysql.port).Wait(400) -and $taskSocket.Connected }
        catch { return $false }
        finally { $taskSocket.Dispose() }
    }
    if (-not (Test-LocalMysql)) {
        if (-not (Test-Path -LiteralPath $taskMysql.executable) -or -not (Test-Path -LiteralPath $taskMysql.defaultsFile)) {
            throw 'No se encontró el MySQL portable de este equipo. Inicia tu servidor MySQL y revisa backend/.env.'
        }
        Write-Host 'Iniciando MySQL local...'
        Start-Process -FilePath $taskMysql.executable -ArgumentList @('"--defaults-file=' + $taskMysql.defaultsFile + '"') -WindowStyle Hidden
        $taskDeadline = (Get-Date).AddSeconds(20)
        while (-not (Test-LocalMysql) -and (Get-Date) -lt $taskDeadline) { Start-Sleep -Milliseconds 250 }
        if (-not (Test-LocalMysql)) { throw 'MySQL no inició. Revisa work/mysql-local/mysql-error.log.' }
    }
}

Write-Host ''
Write-Host 'Abre http://127.0.0.1:5173 en tu navegador.'
Write-Host 'Mantén esta ventana abierta. Ctrl+C detiene la aplicación.'
& $nodeExe scripts/dev.mjs
exit $LASTEXITCODE
