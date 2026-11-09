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

if (-not (Test-Path -LiteralPath 'node_modules\vite') -or -not (Test-Path -LiteralPath 'backend\node_modules\tsx')) {
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

Write-Host ''
Write-Host 'Abre http://127.0.0.1:5173 en tu navegador.'
Write-Host 'Mantén esta ventana abierta. Ctrl+C detiene la aplicación.'
& $nodeExe scripts/dev.mjs
exit $LASTEXITCODE
